---
tags:
  - "#req/2-clip-selection"
  - "#agent/clip-agent"
---

# Req 2: Clip Selection with Reasons

## Summary
Multi-signal candidate generation, scoring, and deduplication engine that explains *why* each clip was chosen.

## Scoring Signals (0-10 each)
1. Hook strength (first 3s punch)
2. Standalone clarity (comprehensible without surrounding context)
3. Emotional/energy peak
4. Novelty / contrarian insight
5. Actionability / quotability
6. Platform fit (LinkedIn vs Reels vs X vs Shorts)
7. Brand fit (conditioned on [[req-4-brand-voice-memory]])
8. Performance prior (conditioned on weights from [[req-6-performance-loop]])

## Deliverables
- Clip cards with 3-5 specific bullet reasons with quote evidence from transcript.
- Detailed score breakdown bars.
- Trim boundaries and context warnings.
- Accept / reject actions with optional voice feedback.
