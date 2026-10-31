---
tags:
  - "#req/3-platform-copy"
  - "#agent/copy-agent"
---

# Req 3: Platform-Tailored Captions & Copy (Platform Copy Engine)

## Status: COMPLETE ✅ (Wave 2)

## 1. Overview
The **Platform Copy Engine** (`/backend/app/copy`) generates platform-native copy variants from any video/audio clip for 5 distinct platforms according to constraints declared in `platforms.yaml`:
1. **LinkedIn:** insight-led, first 210 characters optimized before the "see more" click fold, short punchy paragraphs, 0-3 hashtags, conversational question CTA.
2. **Instagram Reels:** 1st line caption hook, generous line breaks, 3-8 hashtags, 9:16 vertical on-screen text suggestion, save/comment CTA.
3. **YouTube Shorts:** punchy title <= 100 characters (including `#Shorts`), SEO keyword-rich description, pinned comment proposal, on-screen title beat.
4. **X (Twitter):** high-conviction post strictly <= 280 characters, blank line between sentences, 0-2 hashtags, plus a 3-5 post thread expansion.
5. **TikTok:** ultra-short hook caption (< 150 chars before fold), trending generic hashtags (no fake trend claims), high-energy text beats.

Every generated variant includes:
- **A/B Hook Options** with comparative confidence scores
- **Platform-Appropriate Hashtags** obeying exact min/max bounds
- **Contextual Call-to-Action (CTA)**
- **On-Screen Text Beats** for vertical video
- **Character Counter & Preview Fold Marker**
- **Deterministic Voice Match Score (0-100%)** audited against active brand rules, tone sliders, and banned words

---

## 2. Platform Constraint Matrix (`platforms.yaml`)

| Platform | Max Chars | Cut-Off Fold | Hashtags | CTA Style | On-Screen Text | Thread / Title Rules |
|---|---|---|---|---|---|---|
| **LinkedIn** | 3,000 | 210 chars | 0–3 | Conversational question | No | Short paragraphs, zero opening emoji fluff |
| **Instagram Reels** | 2,200 | 125 chars | 3–8 | Save / Comment | Yes (9:16) | First line hook, generous line breaks |
| **YouTube Shorts** | 5,000 | 100 chars | 1–5 | Pinned comment | Yes | Title <= 100 chars with `#Shorts` |
| **X (Twitter)** | 280 | 280 chars | 0–2 | Repost / Debate | No | <= 280 chars single post + 3–5 post thread |
| **TikTok** | 2,200 | 150 chars | 3–6 | Follow / Comment | Yes | Ultra-short hook, fast visual cues |

---

## 3. Architecture & File Structure

```
backend/app/copy/
├── __init__.py           # Public exports (copy_engine, router, compute_voice_match_score)
├── platforms.yaml        # Single source of truth for platform rules & boundaries
├── config.py             # YAML loader with alias resolution (e.g. reels -> instagram_reels)
├── voice_scorer.py       # Deterministic Voice Match Scorer (0-100%) against brand rules
├── edit_analyst.py       # Difflib-powered diff analyzer and style rule extractor
├── generator.py          # PlatformCopyEngine integrating LLMRouter with clip & voice context
└── router.py             # FastAPI APIRouter mounted in app/api/router.py
```

`platforms.yaml` is also mirrored in workspace root for direct tool accessibility.

---

## 4. Voice Match Score Engine (`voice_scorer.py`)
Computes an objective, explainable score (0.0 to 100.0%) for any post:
- **Base Score:** 86.0
- **Quantitative / Metric Density:** +5.0 if hook leads with `$`, `%`, or digits; -2.0 if missing on LinkedIn/Twitter.
- **Banned Words Filter:** -12.0 per instance of banned words (`"synergy"`, `"game-changer"`, `"delighted to announce"`, `"leverage"`, `"supercharge"`).
- **Throat-Clearing Detection:** -12.0 if opening with `"In today's..."`, `"It's no secret that..."`, `"Have you ever..."`.
- **Emoji Discipline:** -8.0 for emojis in first 3 lines on LinkedIn; +4.0 for zero emojis on LinkedIn; -4.0 for > 2 emojis on X.
- **Sentence Punchiness:** +4.0 if average sentence length <= 16 words; -5.0 if run-on sentences > 25 words.
- **Platform Bounds:** +2.0 if character length and hashtags within platform bounds; -10.0 if character limit exceeded.
- **Active Memory Rule Bonus:** +2.0 * confidence for adhering to active extracted rules in `voice_rules`.

---

## 5. Creator Edit Learning Loop (`edit_analyst.py`)
When a creator edits a variant (`PATCH /variants/{id}`):
1. Computes token-level diff using `difflib.SequenceMatcher`: generates human-readable evidence strings (`[-] ... [+] ...`).
2. Classifies the edit pattern:
   - **Emoji removal:** Strips emojis from body paragraphs.
   - **Metric addition:** Replaces vague adjectives with concrete metrics ($42k, 70% margin).
   - **Throat-clearing removal:** Deletes opening pleasantries; leads directly with tension.
   - **Sentence shortening:** Enforces concise sentences under 15 words.
   - **Jargon replacement:** Swaps corporate buzzwords for operational mechanics.
   - **Question CTA:** Replaces passive engagement bait with open debate prompts.
3. Persists to `platform_variants` (`is_edited = 1`, `final_text = creator_final`).
4. Records exemplar in `voice_examples` with diff citation.
5. Updates/inserts style rule in `voice_rules` with incremented confidence.
6. Increments version in `voice_profiles` (e.g. `v2 -> v3`).

---

## 6. API Endpoints

### 6.1 `POST /clips/{clip_id}/copy`
Generates all 5 platform variants for the given clip conditioned on Voice Memory.
- **Request Body (optional):** `{ "instruction": "Make LinkedIn more aggressive", "force_regenerate": false }`
- **Response:**
  ```json
  {
    "clip_id": "clip_1",
    "variants": {
      "linkedin": {
        "id": "var_clip_1_linkedin",
        "platform": "linkedin",
        "hook": "At $50k MRR, our compute bill was $42,000. Here is the math:",
        "hook_options": [
          {"id": "A", "text": "...", "score": 100.3},
          {"id": "B", "text": "...", "score": 98.3}
        ],
        "hookA": "...",
        "hookB": "...",
        "caption": "...",
        "hashtags": ["#B2BMarketing", "#FounderLedGrowth", "#Startups"],
        "cta": "Are you still selling seats or selling results?",
        "voice_match_score": 99.5,
        "character_count": 539,
        "charLimit": 3000,
        "cut_off_at": 210,
        "notes": "First 210 chars optimized for LinkedIn layout fold."
      },
      "reels": { ... },
      "shorts": { "title": "... #Shorts", "pinned_comment": "...", ... },
      "x": { "caption": "... <=280 chars", "thread_posts": ["1/ ...", "2/ ...", "3/ ..."], ... },
      "tiktok": { ... }
    }
  }
  ```

### 6.2 `PATCH /variants/{variant_id}`
Handles creator edits and triggers the Voice Memory update pipeline.
- **Request Body:** `{ "final_text": "...", "ai_draft": "..." }`
- **Response:**
  ```json
  {
    "variant_id": "var_clip_1_linkedin",
    "creator_final": "...",
    "final_text": "...",
    "diff_analyzed": true,
    "rule_extracted": {
      "id": "vrule_a97525c6",
      "rule": "Strips conversational padding. Enforces concise, high-density sentences under 15 words.",
      "category": "length",
      "confidence": 0.91,
      "evidence_diff": "[-] In today's post... [+] At $50k MRR..."
    },
    "voice_profile_version": "v3",
    "message": "Voice Memory updated with fresh creator diff rule."
  }
  ```

---

## 7. Verification & Acceptance
- **Test Suite:** `backend/tests/test_copy.py` (12 tests)
  - `test_load_platform_configs`: PASS
  - `test_platform_aliases`: PASS
  - `test_voice_match_score_penalizes_banned_words`: PASS
  - `test_voice_match_score_penalizes_throat_clearing`: PASS
  - `test_voice_match_score_linkedin_emoji_discipline`: PASS
  - `test_generate_platform_variants_all_five`: PASS
  - `test_platform_constraints_enforced`: PASS
  - `test_edit_diff_and_classification`: PASS
  - `test_process_variant_edit_persists_and_updates_voice_memory`: PASS
  - `test_api_generate_copy_endpoint`: PASS
  - `test_api_patch_variant_edit_triggers_learning`: PASS
  - `test_api_patch_variant_missing_payload_error`: PASS
- **Overall Suite Status:** 75/75 tests passing across entire backend.
