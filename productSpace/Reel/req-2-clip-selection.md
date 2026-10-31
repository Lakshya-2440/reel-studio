---
tags:
  - "#req/2-clip-selection"
  - "#agent/clip-agent"
---

# Req 2: Clip Selection with Reasons

## Summary
Multi-signal candidate generation, scoring, and deduplication engine that explains *why* each clip was chosen.
Located in `backend/app/clips`.

## Architecture & Modules
- `candidate_generator.py`: Sliding window segmentation (20s - 90s) snapping to sentence boundaries from transcript segments with interpolated boundary timestamps and hook line extraction.
- `scorer.py`: 8-Signal scoring engine evaluating candidates across 8 distinct signals (0-10 each with 1-line rationale) conditioned on active Brand Voice Memory rules and Performance Loop feature weights. Evaluates via `LLMRouter` with deterministic rule-based fallback.
- `ranker.py`: Non-Maximum Suppression (NMS) deduplication over temporal windows (IoU threshold = 0.35, overlap ratio = 0.50) to preserve topical diversity, title synthesis, and rich per-clip deliverable formatting.
- `router.py`: FastAPI endpoints mounted at `/clips/find`, `/projects/{id}/clips`, `/clips/{id}`, and `/clips/{id}/feedback`.

## Scoring Signals (0-10 each with 1-line rationale)
1. **Hook strength** (weight: 0.18): First 3s attention grabber, financial/numeric anchors, provocative verbs, zero throat-clearing.
2. **Standalone clarity** (weight: 0.15): Comprehensible without prior context, independent thesis, context-debt detection.
3. **Emotional/energy peak** (weight: 0.12): High conviction, founder vulnerability, stakes.
4. **Novelty / contrarian insight** (weight: 0.15): Challenges prevailing dogma (e.g. cost-plus pricing, seat-based billing).
5. **Actionability / quotability** (weight: 0.12): Concrete formulas, heuristics, and directives.
6. **Platform fit** (weight: 0.08): 25-60s sweet spot across LinkedIn, Instagram Reels, YouTube Shorts, X, TikTok.
7. **Brand fit** (weight: 0.10): Conditioned on active Voice Memory rules (`voice_rules` table: lead with data, drop buzzwords, first-person founder war stories).
8. **Performance prior** (weight: 0.10): Conditioned on learned feature weights (`feature_weights` table: number-led hook +38.5% lift, contrarian +27.2% lift, 30-45s length +24% lift).

## Deliverables & API Surface
- `POST /clips/find`: Trigger candidate generation, 8-signal scoring, and deduplicated ranking with SSE job tracking.
- `GET /projects/{project_id}/clips`: Ranked clips with 3-5 bullet reasons, verbatim transcript evidence quote, score bars, and risks/trim suggestions.
- `PATCH /clips/{clip_id}`: Accept, reject, or adjust start/end boundaries.
- `POST /clips/{clip_id}/feedback`: Capture creator rejection rationale ("too salesy") to condition brand memory and performance priors.

## Verification
- Unit & integration tests in `backend/tests/test_clips.py` (9/9 passed):
  - 8-signal scoring breakdown.
  - "Why this clip" (3-5 reasons + verbatim transcript quote).
  - Performance prior weighting shifting rank order.
  - Sentence boundary sliding window (20s - 90s).
  - NMS overlap deduplication.
  - API endpoint integration.
