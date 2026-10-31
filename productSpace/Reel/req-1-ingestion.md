---
tags:
  - "#req/1-ingestion"
  - "#agent/ingestion-agent"
---

# Req 1: Long Video & Podcast Ingestion

## Summary
Ingestion pipeline handles uploaded audio/video files (mp4, mov, mp3, wav), URL attempts (`yt-dlp`), or pasted transcripts.

## Core Capabilities
- Mono 16kHz audio extraction via `ffmpeg`.
- Parallel chunked Whisper ASR via Hugging Face Inference (`whisper-large-v3`), fallback to Gemini audio understanding.
- Stitched transcript with timestamps: `[{start, end, speaker, text}]`.
- Automatic topic/chapter segmentation.
- Vector embeddings of segments stored in Neon Postgres with `pgvector`.
- Real-time SSE progress reporting (`/jobs/{id}/events`).
- Seeded demo podcast ("The Founder Files — Ep. 42") ready for instant zero-latency demo.

## Connections
- Feeds candidate generator in [[req-2-clip-selection]].
- Referenced by [[voice-intake-pipeline]] for fuzzy clip search.
