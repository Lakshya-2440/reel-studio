---
tags:
  - "#req/4-brand-voice-memory"
  - "#agent/voice-memory-agent"
---

# Req 4: Brand-Voice Memory from Creator Edits

## Summary
Continuous learning engine that captures `(ai_draft, creator_final)` pairs and extracts actionable rules and exemplars.

## Pipeline
1. Compute word/token diffs (`diff-match-patch`).
2. LLM Edit Analyst classifies edit patterns (tone, emojis, hooks, jargon, forbidden phrases).
3. Produce and merge versioned style rules with confidence metrics and diff citations.
4. Store high-confidence exemplars with embeddings in `pgvector`.
5. Maintain `Voice Profile v{n}` applied to all future generations.

## UI Showpiece
- Voice Memory dashboard with rule cards, confidence meters, and red/green inline diff citations.
- "Before/After" side-by-side comparison toggle demonstrating memory ON vs OFF.
