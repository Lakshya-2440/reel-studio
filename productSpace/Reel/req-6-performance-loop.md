---
tags:
  - "#req/6-performance-loop"
  - "#agent/performance-agent"
---

# Req 6: Performance Feedback Loop

## Status: ✅ Complete (Wave 2)
- **Codebase:** `/backend/app/performance` (`schemas.py`, `analyzer.py`, `csv_parser.py`, `router.py`)
- **API Endpoints:**
  - `POST /performance/log`: Ingests single post metric (manual or voice intent), calculates normalized engagement, computes statistical feature lifts, updates suggestion weights via EMA, generates "What changed and why" causal insight.
  - `POST /performance/csv`: Batch parses multipart CSV, auto-maps columns (impressions, reactions, completion %, bookmarks), enriches with feature tags, updates weights and insights.
  - `GET /performance/insights`: Causal explanation feed with explicit impact actions, metric lifts, and next experiment prompts. Supports both hierarchical feed and `?format=list`.
  - `GET /performance/weights`: Suggestion weights breakdown table (`hook_types`, `length_buckets`, `time_slots`, `best_times_ist`, `weights_table`).
- **Tests:** `backend/tests/test_performance.py` (19/19 passing).

---

## 1. Metrics Intake Modes

### 1.1 Manual Logging Form
Accepts single post metrics with optional content hook/text for automatic NLP feature tagging:
```json
{
  "project_id": "proj_founder_files_42",
  "post_id": "clip-pricing-01",
  "platform": "linkedin",
  "views": 18200,
  "likes": 460,
  "comments": 92,
  "shares": 115,
  "saves": 180,
  "retention_pct": 74.0,
  "followers_gained": 38,
  "content": "$14k ARR in 30 days: why seat-based SaaS pricing is dead."
}
```

### 1.2 CSV Batch Upload
Robust parser in `csv_parser.py` handles diverse creator exports (Buffer, Sprout, LinkedIn/Twitter Analytics):
- **Fuzzy Header Alias Resolution:**
  - Views: `views`, `impressions`, `reach`, `view_count`, `plays`
  - Likes: `likes`, `reactions`, `favorites`, `upvotes`
  - Comments: `comments`, `replies`, `discussion`
  - Shares: `shares`, `reposts`, `retweets`, `forwards`
  - Saves: `saves`, `bookmarks`, `saved`
  - Retention: `retention_pct`, `completion_rate`, `avg_watch_time`
  - Content: `content`, `text`, `caption`, `post_text`, `title`, `hook`
- **Flexible Numeric Coercion:** Handles unit abbreviations like `"14.5k"`, `"1.2M"`, `"68%"`, `"$50,000"`.

### 1.3 Natural Voice Logging
Intents originating from [[voice-intake-pipeline]] (`intent: "log_performance"`) map seamlessly to `PerformanceLogRequest`.

---

## 2. Statistical Analysis & Math Engine

### 2.1 Platform Normalized Engagement Score
Weighted interaction formula parameterized by platform dynamics:
$$\text{Actions} = (w_{\text{likes}} \cdot L) + (w_{\text{comments}} \cdot C) + (w_{\text{shares}} \cdot S) + (w_{\text{saves}} \cdot B) + (w_{\text{followers}} \cdot F)$$

$$\text{Rate}_{\text{raw}} = \frac{\text{Actions}}{\max(\text{Views}, 1)} \times 100$$

When video watch-time retention is present:
$$\text{Rate}_{\text{effective}} = \text{Rate}_{\text{raw}} \cdot (0.65 + 0.35 \cdot \text{clamp}(0.5, 1.5, 0.5 + \frac{\text{Retention}}{100}))$$

Normalized using a smooth sigmoid response curve centered at platform median to prevent saturation and preserve high dynamic range:
$$z = \frac{\text{Rate}_{\text{effective}} - \mu_{\text{platform}}}{\sigma_{\text{platform}}}$$
$$\text{Score} = 10.0 + \frac{88.0}{1.0 + e^{-0.55 \cdot z}} \in [5.0, 99.0]$$

### 2.2 Feature Extraction Rules
- **`hook_type`:**
  - `number`: Regex pattern on opening 150 characters matching currency, %, `$50k`, metric units.
  - `question`: Starting interrogatives (`Why`, `How`, `Are you`) or `?` in lead sentence.
  - `contrarian`: Counter-intuitive keywords (`myth`, `suicide`, `never`, `broke`, `stop`, `paradox`).
  - `story`: Narrative openings (`years ago`, `in 2021`, `three months later`).
- **`length_bucket`:** `short_<30s`, `medium_30-45s`, `long_>45s`.
- **`time_slot` & `day_of_week`:** Evaluated in Indian Standard Time (IST, UTC+5:30):
  - Morning IST: 06:00 – 11:59
  - Afternoon IST: 12:00 – 16:59
  - Evening IST: 17:00 – 22:59

### 2.3 Feature Lift & Guardrails
For each feature value $f$:
$$\text{Lift Ratio} = \frac{\bar{S}_f}{\bar{S}_{\text{baseline}}}, \quad \text{Lift \%} = \frac{\bar{S}_f - \bar{S}_{\text{baseline}}}{\bar{S}_{\text{baseline}}} \times 100$$
Confidence labels prevent false statistical certainty:
- $N \ge 10$: `high`
- $N \ge 5$: `moderate`
- $N \ge 2$: `low`
- $N < 2$: `prior`

### 2.4 Exponential Moving Average (EMA) Weight Updates
Suggestion weights $W_t \in [0.50, 2.50]$ update dynamically:
$$W_{t+1} = (1 - \alpha_{\text{eff}}) W_t + \alpha_{\text{eff}} \cdot \text{clamp}(0.50, 2.50, \text{Lift Ratio})$$
$$\alpha_{\text{eff}} = \alpha \cdot \text{SampleDampener}(N)$$

---

## 3. "What Changed and Why" Causal Feed
Every update creates plain-language causal entries explaining the link between empirical data and generator adjustments:
- *"Because number-led hooks outperformed questions by 2.4x on LinkedIn (94.0 vs 40.0 avg score across 14 posts), ranking weights increased from 1.10 to 1.45."*
- *Impact Action: "Copy generator now prioritizes numeric hooks and financial unit metrics for future drafts."*
- *Next Experiment: "Test a contrarian paradox hook on Friday afternoon to test debate density."*

---

## 4. Downstream Multi-Agent Impact

1. **[[req-2-clip-selection]]:** Feature weights dynamically scale the `performance_prior` scoring signal in Clip Finder.
2. **[[req-3-platform-copy]]:** High-performing hook types condition the system prompt and exemplar retrieval in Platform Copy Engine.
3. **[[req-5-content-calendar]]:** Optimal `time_slots` (`morning_ist`, `Tuesday 09:30 AM`) bias the `plan-week` calendar slot allocator.

---

## 5. Verification Matrix

| Test Case | Description | Result |
|---|---|---|
| `test_calculate_engagement_score_linkedin` | Weighted interaction formula and normalization | ✅ PASS |
| `test_calculate_engagement_score_with_retention` | Video retention scaling on Reels | ✅ PASS |
| `test_calculate_engagement_score_zero_views` | Graceful zero-views boundary handling | ✅ PASS |
| `test_extract_features_*` | Number, question, contrarian, story, duration, IST slots | ✅ PASS (6 tests) |
| `test_compute_feature_lifts` | Multi-slice feature lifts and sample confidence guardrails | ✅ PASS |
| `test_update_feature_weights_ema` | EMA update arithmetic and boundary clamping | ✅ PASS |
| `test_generate_causal_insights` | PRD 6.6 causal explanation verification | ✅ PASS |
| `test_parse_performance_csv` | Fuzzy alias mapping and numeric unit parsing | ✅ PASS (3 tests) |
| `test_api_endpoints` | End-to-end integration via FastAPI TestClient | ✅ PASS (4 tests) |
