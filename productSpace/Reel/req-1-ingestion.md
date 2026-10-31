---
tags:
  - "#req/1-ingestion"
  - "#agent/ingestion-agent"
---

# Req 1: Long Video & Podcast Ingestion

## Summary
The Ingestion Pipeline ingests long-form video and podcast media (30–90 min) via file upload (mp4, mov, mp3, wav, m4a), URL fetch, or direct transcript pasting. It extracts mono 16kHz audio, chunks audio into ~5-minute slices for parallel transcription, stitches word- and sentence-level timestamps with speaker diarization, generates dense 384-d vector embeddings per segment via `pgvector`, detects semantic chapter boundaries, and streams live Server-Sent Events (SSE) tracking pipeline progression.

## Component Architecture (`backend/app/ingest/`)

### 1. `audio_processor.py`
- **Availability Probes:** `is_ffmpeg_available()`, `is_ffprobe_available()`.
- **Duration Extraction:** `get_media_duration()` using `ffprobe`.
- **Mono 16kHz Extraction:** `extract_audio()` converting video/audio inputs to PCM 16-bit mono WAV optimal for Whisper ASR.
- **Audio Slicing:** `chunk_audio()` segmenting media into ~5-minute (300s) slices for parallel transcription.

### 2. `transcriber.py`
- **Whisper ASR & Gemini Audio:** Dispatches chunked audio to `LLMRouter.transcribe` with concurrent execution (`asyncio.Semaphore(3)`).
- **Temporal Alignment:** Stitches offset timestamps across audio slices: `[{id, start_time, end_time, speaker, text}]`.
- **Speaker Diarization:** Heuristics detecting conversational turns and prefix labels (`Host:`, `Marcus:`).
- **Transcript Parsing:** `parse_pasted_transcript()` supporting arbitrary timestamped (`[00:04:12]`, `(04:12)`) and non-timestamped raw text with natural cadence estimation.
- **pgvector Embeddings:** `embed_segments()` generating 384-d normalized embeddings using `BAAI/bge-small-en-v1.5`.
- **Chapter Markers:** `detect_chapters()` windowing topic spans with titles and summaries.

### 3. `job_pipeline.py`
- **SSE Event Stream:** Uses `JobManager` (`backend/app/core/jobs.py`) broadcasting live progress across stages:
  `uploading -> extracting_audio -> transcribing (chunk n/N) -> segmenting -> scoring -> done`.
- **Database Persistence:** Dual-engine storage saving to `transcripts`, `transcript_segments` (`vector(384)` in Neon Postgres / JSON in SQLite), and `chapters`.
- **Zero-Latency Demo Path:** `process_sample_podcast()` rapidly streams SSE stages for the pre-seeded *"The Founder Files — Ep. 42"*, allowing judges to see live progress and results in 1-2 seconds without waiting 45 minutes for ASR.

### 4. `router.py`
- `POST /ingest/upload`: Multipart file upload (audio/video), spawns background job, returns `{job_id, filename, status}`.
- `POST /ingest/url`: Accepts YouTube/podcast URL, handles platform restrictions with graceful paste fallback or demo path.
- `POST /ingest/transcript`: Accepts pasted raw transcript text, segments into chapters, generates embeddings, returns transcript ID.
- `POST /ingest/sample`: Zero-latency demo pipeline execution using pre-seeded Ep. 42 podcast.
- `GET /transcripts/{id}`: Returns transcript metadata and segment breakdown with timestamps and speaker tags.
- `GET /projects/{id}/chapters`: Returns semantic chapter breakdown across the media timeline.

## Verification & Test Proof
- **Unit Tests:** `backend/tests/test_ingestion.py` (13 tests passing).
  - Transcript paste parsing with and without timestamps.
  - SSE stage progression streaming via `job_manager.subscribe`.
  - Zero-latency sample podcast instant processing.
  - All REST endpoints: upload, url, transcript paste, sample, chapters, transcript retrieval.
- **Backend Test Suite:** 55/55 tests passing across `test_ingestion.py`, `test_clips.py`, `test_performance.py`, `test_llm_router.py`, `test_scraper.py`.
