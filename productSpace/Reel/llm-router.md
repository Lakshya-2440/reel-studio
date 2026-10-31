---
tags:
  - "#arch/llm-router"
  - "#agent/llm-router"
---

# LLM Router

## 1. Overview
The **LLM Router** (`backend/app/llm`) is Reel's single-point abstraction layer for all inference operations: chat generation, structured Pydantic extraction, speech-to-text (ASR), and vector embeddings. It guarantees high availability and zero unhandled agent crashes through a multi-tiered failover chain:
1. **Primary Provider:** Hugging Face Inference (`HF_TOKEN`) via OpenAI-compatible router endpoint (`https://router.huggingface.co/openai/v1/chat/completions`).
2. **Fallback Provider:** Google Gemini API (`GEMINI_API_KEY`) using `gemini-2.0-flash`.
3. **Safety Fallback:** Rule-based deterministic mock engine (`app.llm.fallbacks`) generating fully-validated Pydantic models, normalized 384-d pseudo-embeddings, and realistic transcripts if keys are omitted or external providers are down.

## 2. API Contract & Methods
- `async def chat(messages: list[dict], schema: type[BaseModel] | None = None, task: str = "general", force_fail_hf: bool = False) -> dict | str`
  - Validates outputs against Pydantic schemas.
  - On validation error: triggers 1 automatic repair prompt to the provider.
  - If repair fails: fails over to Gemini. If Gemini fails: generates rule-based schema instance.
- `async def transcribe(audio_path_or_bytes: str | bytes | Path) -> dict`
  - Primary: HF Whisper large-v3 ASR.
  - Fallback: Gemini multimodal audio transcription -> rule fallback.
- `async def embed(texts: list[str]) -> list[list[float]]`
  - Primary: HF Feature extraction (`BAAI/bge-small-en-v1.5`).
  - Fallback: 384-dimensional unit-normalized deterministic vector fallback.

## 3. Observability & `/debug/llm`
- In-memory ring buffer `llm_router.llm_calls` records every call with:
  `{id, timestamp, provider, task, latency_ms, fallback_used, success, model, error}`
- Endpoints mounted on FastAPI `api_router`:
  - `GET /debug/llm`: Returns router health, configured models, credential statuses, and recent call history.
  - `POST /debug/llm`: Executes diagnostic chat test, allows toggling `force_fail_hf`, and tests Pydantic schema validation.

## 4. Test Suite
- Test file: `backend/tests/test_llm_router.py` (9/9 tests passing):
  - `test_successful_mock_hf_call`: Verified HF primary path and logging.
  - `test_hf_failure_triggering_gemini_fallback`: Verified 500 error failover to Gemini.
  - `test_hf_timeout_triggers_gemini`: Verified timeout (>25s) failover.
  - `test_force_fail_hf_triggers_gemini`: Verified manual failover override.
  - `test_schema_repair_retry_success`: Verified malformed JSON triggers repair prompt that succeeds on HF without falling back.
  - `test_all_providers_fail_rule_based_schema_fallback`: Verified graceful fallback generation matching Pydantic schemas.
  - `test_embed_hf_and_fallback`: Verified 384-d embeddings and unit length normalization.
  - `test_transcribe_hf_and_fallback`: Verified Whisper & fallback transcription structure.
  - `test_debug_endpoint`: Verified GET/POST `/debug/llm` endpoints via FastAPI TestClient.

## 5. Linked Notes
- [[00-INDEX]]
- [[system-architecture]]
- [[req-1-ingestion]]
- [[req-2-clip-selection]]
- [[req-3-platform-copy]]
- [[voice-intake-pipeline]]
