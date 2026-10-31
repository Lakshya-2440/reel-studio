---
tags:
  - "#req/4-brand-voice-memory"
  - "#agent/voice-memory-agent"
---

# Req 4: Brand-Voice Memory from Creator Edits

## Status: COMPLETE (Backend & UI Showpiece)

Continuous learning engine that captures `(ai_draft, creator_final)` pairs and extracts actionable rules, confidence scores, and exemplars.

---

## 1. Architectural Components (`backend/app/memory`)

### 1.1 `diff_engine.py` (DiffEngine)
- **Token & Character Diffs:** Uses Python standard `difflib.SequenceMatcher` to produce structured change opcodes (`replace`, `delete`, `insert`, `equal`).
- **Diff Metadata Extraction:**
  - `added_words` & `removed_words` (order preserved)
  - `changed_spans`: token-level bounding boxes and text slices
  - `emoji_removed` & `emoji_added`: Unicode category `So`/`Sk` & astral plane regex detection
  - `numbers_added` & `numbers_removed`: currency (`$`), percentages (`%`), multiples (`3.4x`), and scale units (`$50k`, `$42,000`)
  - `number_in_hook`: detects whether numeric proofs were placed in the first sentence
  - `sentence_length_delta`: average words per sentence difference (`creator_avg - ai_avg`)
  - `evidence_citation`: human-readable inline diff citation (e.g. `[-] 🚀 Big news founders! 🔥 [+] At $50k MRR, our compute bill was $42,000.`)
  - `evidence_diff`: structured `{before, after}` snippet for UI diff meters
  - `diff_html`: `<del>` and `<ins>` tagged markup

### 1.2 `edit_analyst.py` (EditAnalyst)
- **Dual-Engine Learning:**
  - **LLM Engine:** Formulates structured prompt to `LLMRouter.chat` asking for an actionable style directive with strict category classification.
  - **Deterministic Fallback Engine:** If LLM is offline, triggers rule-based heuristic classifier:
    1. *Emoji Purge:* strips emojis -> formatting rule ("Never use emojis in LinkedIn post body; maintain crisp typography", conf=0.95).
    2. *Numeric Hook:* adds metric to opening -> structure rule ("Open hooks with concrete numbers, dollar metrics, or quantified unit economics", conf=0.94).
    3. *Buzzword Purge:* removes 'synergy', 'leverage', 'supercharge' -> banned phrases rule ("Ban corporate buzzwords like 'leverage' and 'synergy' in favor of concrete operational reality", conf=0.93).
    4. *Cadence Compression:* delta <= -3 words -> length rule ("Keep sentences short and punchy (target max 12 words per line)", conf=0.90).
    5. *Throat-Clearing Deletion:* removes rhetorical preambles -> tone rule ("Drop opening throat-clearing; lead directly with a contrarian observation", conf=0.92).
    6. *Debate CTA:* high-stakes question closing -> structure rule ("End posts with a high-stakes binary debate prompt instead of passive engagement bait", conf=0.88).
- **Confidence Dynamics:**
  - Repeated verification: `confidence = min(0.99, conf + 0.05)`
  - Reversal: `confidence = max(0.20, conf - 0.15)`

### 1.3 `profile_manager.py` (ProfileManager)
- **Profile Versioning:** Automatically tracks profile lifecycle from bootstrap (`v1`) through subsequent revisions (`v2 -> v3 -> vN`).
- **Database Engine & Offline Fallback:** Operates seamlessly across Neon Postgres (`pgvector`, `JSONB`) and local SQLite (`db/reel.db`), with an in-memory cache fallback.
- **Semantic Exemplar Retrieval:** Uses `LLMRouter.embed` to generate 384-dimensional vector embeddings of creator-final texts. Implements cosine similarity search to retrieve top-k closest exemplars for few-shot prompt injection.
- **Prompt Synthesis:** `build_voice_prompt_context(platform)` compiles active rules, banned buzzwords, tone sliders, and few-shot exemplars directly into platform generator prompts for `copy-agent`.

### 1.4 `router.py` (FastAPI Router)
- `GET /voice/profile`: Returns active version (`v2`, `v3`, `v4`), summary, tone sliders (both 0-1 and 0-100 scales), signature phrases, banned words, rules list, and exemplars.
- `GET /voice/rules`: Returns full list of style rules with confidence scores, edit counts, active statuses, and inline diff citations.
- `PATCH /voice/rules/{id}`: Toggle rule active state (`is_active: bool`), adjust confidence, or update pinned state.
- `DELETE /voice/rules/{id}`: Soft or hard delete rule.
- `POST /voice/compare`: Side-by-side comparison of generation with Memory OFF vs Memory ON:
  - **Memory OFF:** Generic AI draft filled with emojis, buzzwords, throat-clearing, and cheerleading CTAs (Voice match score ~54%).
  - **Memory ON:** Crisp, metric-first copy adhering strictly to active voice rules with zero emojis and punchy cadence (Voice match score ~97%).
- `POST /voice/learn`: Direct endpoint to ingest `(ai_draft, creator_final)` pairs and return diff summary, new rule, and bumped profile version.
- `PATCH /variants/{id}`: Integrates with post editor to capture creator edits on platform variants, update database records, and immediately trigger the learning loop.

---

## 2. API Contract Proofs

### `GET /voice/profile`
```json
{
  "id": "vp_founder_files",
  "project_id": "proj_founder_files",
  "version": 2,
  "version_label": "v2",
  "summary": "Sharp, metric-driven founder voice. Zero corporate throat-clearing, anti-buzzword, loss-framed unit economics.",
  "tone_sliders": {
    "formal_vs_casual": 0.25,
    "bold_vs_measured": 0.85,
    "short_vs_long": 0.25,
    "formal_casual": 25,
    "bold_measured": 85,
    "concise_detailed": 25
  },
  "signature_phrases": [
    "Here is the math:",
    "At $50k MRR, our compute bill was $42,000",
    "Stop measuring vanity DAU"
  ],
  "banned_words": ["synergy", "game-changer", "delve", "supercharge", "leverage"],
  "active_rules_count": 4,
  "rules": [],
  "exemplars": []
}
```

### `POST /voice/compare`
```json
{
  "clip_id": "clip_pricing_01",
  "platform": "linkedin",
  "profile_version": "v2",
  "memory_off": {
    "caption": "🚀 Exciting thoughts for B2B founders! In today's competitive fast-paced tech world... 💡",
    "voice_match_score": 54.3,
    "fluff_detected": [
      "4 emojis in body (🚀, 💡, 🔥, 👇)",
      "Buzzwords: 'delve', 'leverage', 'supercharge', 'synergy'",
      "Rhetorical throat-clearing intro",
      "Passive engagement bait CTA"
    ]
  },
  "memory_on": {
    "caption": "Per-seat SaaS pricing is dead. Here is the math:\n\nWhen AI cuts team hours by 60%, per-seat billing penalizes your own efficiency...\n\nAre you still selling hours, or selling outcomes?",
    "voice_match_score": 96.8,
    "rules_applied": [
      "Drop opening throat-clearing. Lead with exact metrics or dollar figures.",
      "Zero emojis in LinkedIn body paragraphs; enforce clean typography.",
      "Ban corporate buzzwords ('leverage', 'synergy', 'delve').",
      "End posts with a high-stakes debate prompt instead of passive engagement bait."
    ]
  }
}
```

---

## 3. Verification & Test Coverage
- Unit tests: `backend/tests/test_voice_memory.py`
- Test results: **12 / 12 passed** in 0.59s.
  - Diff token classification & emoji/number detection verified.
  - Heuristic & LLM rule extraction verified across emoji removal, numeric hooks, buzzwords, and sentence length.
  - Confidence adjustment (boost +0.05, decay -0.15) verified.
  - Vector cosine similarity verified.
  - `GET /voice/profile`, `GET /voice/rules`, `PATCH /voice/rules/{id}`, `POST /voice/compare`, and `POST /voice/learn` verified via FastAPI TestClient.
