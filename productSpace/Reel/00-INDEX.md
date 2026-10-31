---
tags:
  - "#meta/index"
  - "#reel/core"
updated: 2026-10-31T15:04:00+05:30
status: active
---

# Reel — Knowledge Graph Map of Content (MOC)

> **Context Protocol:** ALWAYS check this index and `architecture.md` when starting a task, losing context, or making architectural decisions. Update before finishing.

## Quick Navigation

### 1. Requirements (6 Mandatory Capabilities)
- [[req-1-ingestion|Req 1: Long Video/Podcast Ingestion]] — `#req/1-ingestion`
- [[req-2-clip-selection|Req 2: Clip Selection with Evidence & Reasons]] — `#req/2-clip-selection`
- [[req-3-platform-copy|Req 3: Platform-Tailored Captions & Copy]] — `#req/3-platform-copy`
- [[req-4-brand-voice-memory|Req 4: Brand-Voice Memory from Creator Edits]] — `#req/4-brand-voice-memory`
- [[req-5-content-calendar|Req 5: Content Calendar & Slot Suggestions]] — `#req/5-content-calendar`
- [[req-6-performance-loop|Req 6: Performance Feedback Loop]] — `#req/6-performance-loop`

### 2. Voice & Wispr Flow Integration (20% Rubric)
- [[voice-intake-pipeline|Voice Intake Pipeline & Studio]] — `#feature/voice-intake`
- [[2026-10-31-log|Daily Build Log (IST)]] — `#meta/log`

### 3. Architecture & Infrastructure
- [[system-architecture|System Architecture & Services]] — `#arch/system`
- [[llm-router|LLM Router (Hugging Face primary -> Gemini fallback)]] — `#arch/llm-router`
- [[scraper-and-brand-kit|Scraper Adapter & Brand Kit Extraction]] — `#feature/scraper`

### 4. Deployments & Status
- **Frontend (Vercel):** Pending skeleton deploy
- **Backend (Render):** Pending skeleton deploy
- **Database (Neon Postgres + pgvector & SQLite Fallback):** ✅ Ready (`schema.sql` 21 tables verified, `migrate.py` + `seed_data.py` Ep. 42 dataset active in `db/reel.db`)
