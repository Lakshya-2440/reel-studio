---
tags:
  - "#feature/voice-intake"
  - "#agent/voice-intake-agent"
---

# Voice Intake Pipeline & Voice Studio

## Summary
The primary interaction model of Reel powered by Wispr Flow dictation. Converts messy, rambling speech with fillers and self-corrections into clean, structured intent conforming strictly to Pydantic schemas.

## Component Ownership
- **Directory:** `/backend/app/voice`
- **Schemas:** `backend/app/voice/schemas.py`
- **Engine:** `backend/app/voice/cleaner.py` (`VoiceCleaner`)
- **API Router:** `backend/app/voice/router.py` (`POST /voice/interpret`)
- **Tests:** `backend/tests/test_voice_intake.py` (8/8 pytest passing)

## Technical Architecture

### 1. Pydantic Schemas (`schemas.py`)
- **`IntentEnum`:**
  - `create_brief`: Project creation / video ingestion directives.
  - `edit_caption`: Hook rewrites, character adjustments, platform targeting.
  - `schedule`: Calendar slotting and date/time commands in IST.
  - `log_performance`: Dictated post metrics (views, likes, comments).
  - `brand_note`: Voice profile guidelines, banned words, style constraints.
  - `question`: Explanations, status inquiries, studio help.
- **`Correction`:**
  - Maps `{"from": str, "to": str}` using Pydantic aliases (`from_` in Python, serialized as `from`).
  - Supports backward-compatible legacy keys (`original`, `corrected`).
- **`VoiceInterpretRequest`:**
  - Dual-field support for `text` and `raw_text` for seamless frontend compatibility.
  - Optional `context: dict` (e.g. `current_screen`, `selected_clip`, `project_id`).
- **`VoiceInterpretResponse`:**
  - `{clean_text, intent, entities, corrections_applied, fillers_removed, confidence, needs_clarification, raw_dictation}`.

### 2. Dual-Engine Cleaner (`cleaner.py`)
- **LLM-Assisted Engine:**
  - Leverages `LLMRouter` with HF primary (`Qwen/Qwen2.5-72B-Instruct`) and Gemini 2.0 Flash fallback.
  - Strict Pydantic JSON schema generation.
- **Deterministic Rule Engine (Zero-Config Offline):**
  - **Self-Correction Resolver:** Detects cues (`actually no`, `wait no`, `wait actually`, `actually make that`, `scratch that`, `or rather`).
    - Platform swap: `"make that for Instagram, actually no, LinkedIn"` -> target = `LinkedIn`, correction = `{"from": "Instagram", "to": "LinkedIn"}`.
    - Schedule swap: `"schedule at 5pm, wait no morning at 9am"` -> target = `09:00:00+05:30 IST`.
    - Date swap: `"schedule the pricing clip on Thursday morning, wait actually Friday on LinkedIn"` -> correction = `{"from": "Thursday morning", "to": "Friday"}`.
  - **Conversational Filler Remover:** Detects and removes `"um"`, `"uh"`, `"like"`, `"you know"`, `"actually wait"`, `"so yeah"`, `"basically"`, `"i mean"`, `"sort of"`, `"kinda"`.
    - Context-aware guarding: Never strips `"likes"` when used as a performance metric (e.g. `"400 likes"`).
  - **IST Datetime Resolver:** Converts relative expressions (`"Thursday morning"`, `"Friday"`, `"tomorrow at 9:30 AM"`) to ISO 8601 timestamps strictly ending with `+05:30` (India Standard Time).
  - **Fuzzy Database Clip Resolution:**
    - Queries `clips` table in Neon Postgres / SQLite.
    - Resolves natural speech references (e.g. `"the pricing clip"`) -> `clip_3` (*"Why Per-Token Pricing Kills Conversion"*).
  - **Performance Metrics Extractor:**
    - Parses numbers and multipliers (`15k views` -> `15000`, `400 likes` -> `400`, `1.2m impressions` -> `1200000`).

### 3. API Surface & Persistence (`router.py`)
- **`POST /voice/interpret`**:
  - Validates request payload.
  - Executes `cleaner.interpret(text, context)`.
  - Persists raw transcript, clean text, and intent JSON into the `voice_intakes` database table for live audit trail.
  - Returns `VoiceInterpretResponse`.

## Acceptance Verification (`test_voice_intake.py`)
1. `test_rambling_dictation_with_fillers_and_corrections`: Verifies `"um, like schedule the pricing clip on Thursday morning, wait actually Friday on LinkedIn"` -> Intent: `schedule`, Platform: `linkedin`, Clip ID: `clip_3`, When: `...T09:00:00+05:30`, Fillers: `["um", "like"]`, Corrections: `[{"from": "Thursday morning", "to": "Friday"}]`.
2. `test_metrics_logging_dictation`: Verifies `"the podcast clip got 15k views and 400 likes on LinkedIn"` -> Intent: `log_performance`, Metrics: `{"views": 15000, "likes": 400}`.
3. `test_speech_self_correction_platform_swap`: Verifies `"Instagram, actually no, LinkedIn"` -> `Make that for LinkedIn.`
4. `test_speech_self_correction_time_swap_ist_offset`: Verifies `5pm` -> `9am` with `+05:30` IST offset.
5. `test_fuzzy_clip_resolution`: Verifies fuzzy matches against database clips (`clip_2`, `clip_10`).
6. `test_brand_note_intent`: Verifies brand voice rules directives.
7. `test_empty_input_validation`: Verifies 422 HTTP status on empty inputs.
8. `test_correction_pydantic_schema_aliases`: Verifies Pydantic v2 alias serialization.
