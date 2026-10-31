---
tags:
  - "#arch/system"
  - "#meta/architecture"
---

# System Architecture

```mermaid
flowchart TD
    User([Creator Voice / Wispr Flow]) --> NextJS[Next.js App Router (Vercel)]
    NextJS -->|REST / SSE| FastAPI[FastAPI Docker Backend (Render)]
    FastAPI --> DB[(Neon Postgres + pgvector)]
    FastAPI --> Router{LLM Router}
    Router -->|Primary| HF[Hugging Face Inference]
    Router -->|Fallback| Gemini[Google Gemini API]
    FastAPI --> Scrapling[Scrapling Adapter]
    Scrapling --> Web[Instagram / LinkedIn]
```

## Stack Summary
- **Frontend:** Next.js 14/15 App Router, TypeScript, Tailwind CSS, shadcn/ui primitives (custom styled), TanStack Query, Framer Motion.
- **Backend:** Python FastAPI, Docker with `ffmpeg`, SSE event streaming for long jobs.
- **Database:** Neon Serverless Postgres with `pgvector`.
- **Inference:** Hugging Face API (primary) -> Gemini API (fallback).
- **Deployment:** Vercel (frontend), Render (backend), Neon (database).

## Backend Core (`backend-core`) Implementation
- **Containerization (`Dockerfile`):** Python 3.11-slim with system `ffmpeg`, `curl`, `build-essential`, and `libpq-dev`. Exposes port 8000 with a Docker native `HEALTHCHECK` probe against `/health`.
- **Render Blueprint (`render.yaml`):** Standard web service blueprint configured with auto-deploy, environment variables, model IDs, and health check path.
- **Configuration (`app/core/config.py`):** Pydantic-settings `Settings` reading `DATABASE_URL`, `HF_TOKEN`, `GEMINI_API_KEY`, and flexible `ALLOWED_ORIGINS` (comma-separated or JSON list).
- **In-Memory Job Engine & SSE (`app/core/jobs.py`):**
  - `JobManager` manages lifecycle transitions (`pending` -> `running` -> `completed` / `failed`).
  - Supports async coroutine task spawning via `job_manager.spawn(job_id, coro_fn)`.
  - Subscriber queue broadcasting with automatic keep-alive pings and memory leak protection.
  - Multi-engine SSE endpoint at `GET /jobs/{id}/events` supporting `sse-starlette` with seamless Starlette `StreamingResponse` fallback.
- **API Surface (`app/api`):**
  - `GET /health`: Returns `{"status": "ok", "service": "reel-backend"}` for uptime verification.
  - `GET /jobs` & `GET /jobs/{id}` & `GET /jobs/{id}/events`: Background job status and SSE stream.
  - Stubs for all PRD Section 9 endpoints (`/projects`, `/ingest/*`, `/clips/*`, `/variants/*`, `/voice/*`, `/calendar/*`, `/performance/*`, `/brand/*`, `/debug/llm`).
- **Verification:** Automated tests passed with `python3 -m py_compile` and `TestClient`.

## Database Layer (`infra-neon` & `seed-data-agent`) Implementation
- **Schema (`db/schema.sql`):** 21 tables covering projects, media assets, transcripts, segments (`vector(384)`), chapters, clips, platform variants, voice profiles, voice rules, voice examples, calendar items (IST), performance logs, post features, feature weights, insights, brand kits, scraped posts, llm calls, jobs, voice intakes, and clip feedback.
- **Migration Engine (`db/migrate.py`):** Multi-target migration runner with dynamic DDL conversion for SQLite fallback when `DATABASE_URL` is empty or offline.
- **Demo Seed (`db/seed_data.py`):** "The Founder Files — Ep. 42" fully populated with ~45min podcast transcript, 12 clips with 8-signal scoring breakdowns, 60 platform variants across 5 platforms, 6 voice edit histories & rules, 35 performance logs, 10 feature weights, 4 insights, and 1 brand kit.
- **ORM Connection (`db/connection.py`):** SQLAlchemy session provider and FastAPI dependency.
