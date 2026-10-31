---
tags:
  - "#feature/voice-intake"
  - "#agent/voice-intake-agent"
---

# Voice Intake Pipeline & Voice Studio

## Summary
The primary interaction model of Reel powered by Wispr Flow dictation. Converts messy, rambling speech with fillers and self-corrections into clean, structured intent.

## Architecture
- **Global Voice Command Bar:** Persistent input + `Cmd+K`.
- **FastAPI `/voice/interpret` endpoint:**
  - Extracts intent (`create_brief`, `edit_caption`, `schedule`, `log_performance`, `brand_note`, `question`).
  - Resolves fuzzy clip references via vector similarity.
  - Normalizes relative times into **IST**.
  - Detects and removes fillers ("um", "like", "you know").
  - Identifies and executes self-corrections (e.g., strike-through "Instagram" -> "LinkedIn").
- **Voice Studio UI Panel:** Live side-by-side view showing raw speech vs cleaned intent chips.
