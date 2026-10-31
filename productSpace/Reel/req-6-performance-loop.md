---
tags:
  - "#req/6-performance-loop"
  - "#agent/performance-agent"
---

# Req 6: Performance Feedback Loop

## Summary
The closed-loop intelligence engine that takes real post metrics and changes future ranking and generation weights.

## Metrics Intake
- Manual logging form
- CSV batch upload
- Natural voice logging via [[voice-intake-pipeline]]

## Analysis & Loop
- Computes feature lift (hook type, length bucket, topic, time slot, platform).
- Updates `feature_weights` in Neon Postgres with exponential decay.
- Dynamically updates clip re-ranking in [[req-2-clip-selection]].
- Changes future copy hooks in [[req-3-platform-copy]].
- Updates calendar slot timing in [[req-5-content-calendar]].
- "What Changed and Why" visual feed displaying concrete causal explanations.
- Seeded with 30+ realistic demo posts across platforms.
