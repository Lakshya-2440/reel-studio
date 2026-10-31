# Reel — Content Repurposing Studio with Brand Memory

> **Product Space x Wispr Flow "Agentic AI Hackathon"**  
> Problem Statement 01: Media  
> Builder: Lakshya Gupta (`@lakshyaa`)  
> Dictated via **Wispr Flow** | Built with **Antigravity Agents**

---

## 🌟 What is Reel?

Drop in a long podcast or video recording. **Reel** does four things no other tool does together:
1. **Finds the best clips and explicitly explains *why*** with an 8-signal scoring engine and transcript evidence quotes.
2. **Drafts platform-tailored copy** (LinkedIn, Instagram Reels, YouTube Shorts, X, TikTok) obeying each platform's distinct formatting, hook, and length rules.
3. **Remembers your brand voice** by continuously learning from every edit you make, generating verifiable diff-backed rules and exemplars.
4. **Closes the loop with real post performance**: logs metrics, measures feature lift (e.g., number-led hooks beating questions by 2.4x on LinkedIn), and dynamically shifts future clip ranking and slot timing.

All guided and controlled by **natural speech through Wispr Flow** — turning messy, rambling thoughts and self-corrections into clean structured intent.

---

## 🎯 6 Mandatory Capabilities Traceability

| # | Capability | How Reel Solves It | Acceptance Verification |
|---|---|---|---|
| **1** | **Long Video/Podcast Ingestion** | Chunked ffmpeg audio extraction + Whisper ASR + SSE progress + chapter markers + pgvector embeddings | Upload 30-90m media or 1-click load pre-seeded 45m "The Founder Files" |
| **2** | **Clip Selection with Reasons** | 8-signal candidate scoring (Hook, Standalone clarity, Energy, Novelty, Quotability, Platform fit, Brand fit, Performance prior) | 12 ranked clips with "Why this clip" bullets + quote citations |
| **3** | **Platform-Tailored Copy** | Per-platform generation for LinkedIn (210-char cutoff), Reels, Shorts, X, TikTok with A/B hooks & Voice Match score | 5 distinct platform feed previews per clip |
| **4** | **Brand-Voice Memory from Edits** | Diff engine captures `(ai_draft, creator_final)` pairs, extracts rules with confidence & diff citations, maintains `Voice Profile vN` | Edit any caption -> rule appears with diff proof -> Memory ON vs OFF comparison |
| **5** | **Content Calendar** | Week/month views, drag-drop, optimal slot suggestions in IST, "Plan My Week" auto-allocator, `.ics` export | Schedule by click or voice ("put pricing clip on Thursday morning on LinkedIn") |
| **6** | **Performance Feedback Loop** | Logs metrics (manual, CSV, voice), calculates feature lift, updates suggestion weights, generates causal "What changed & why" feed | Log post metrics -> suggestion weights shift -> clip ranking updates with explanation |

---

## 🎙️ Wispr Flow & Voice Intake Pipeline

Wispr Flow allows the creator to dictate naturally into any text area. Real human speech contains filler words ("um", "like", "you know") and mid-sentence self-corrections ("make that for Instagram, wait no, LinkedIn").

Reel's **Voice Intake Pipeline** (`/voice/interpret`):
1. **Cleans messy speech:** strips fillers and applies self-corrections visibly.
2. **Extracts structured intent:** intent classification, entity extraction, and IST timezone normalization.
3. **Voice Studio UI:** Live side-by-side view showing raw transcript vs cleaned structured intent.

---

## 🏗️ Architecture

```
Wispr Flow Dictation
         │
         ▼
Next.js 14 App Router (Vercel) ─── REST / SSE ───► FastAPI Docker + ffmpeg (Render)
                                                        │
                      ┌─────────────────────────────────┼──────────────────────────────┐
                      ▼                                 ▼                              ▼
             Neon Serverless Postgres               LLM Router                 Scrapling Adapter
             (+ pgvector embeddings)         HF (Primary) -> Gemini (Fallback)   (IG / LinkedIn)
```

### Design Philosophy: Y Combinator Startup, NOT AI Slop
Reel was built following strict design tokens from the **Impeccable** and **UI/UX Pro Max** skills:
- Warm off-white editorial paper canvas (`#FAF9F6`) with crisp near-black typography (`#121212`).
- Single confident YC-amber accent (`#F26522`).
- 1px hairline geometric borders with 6-8px border radii.
- Zero generic neon gradients, zero glassmorphism, zero emoji icons.

---

## 🚀 Quickstart

### Backend (FastAPI + Docker)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js App Router)
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Database & Seed Demo
```bash
cd db
python migrate.py   # Dual-target: Neon Postgres or SQLite fallback
python seed_data.py # Populates "The Founder Files" 45m podcast & 35 performance posts
```

---

## 🧪 Testing & Verification
```bash
pytest backend/tests/ -v
# 14+ tests passing: LLM router fallback, schema repair, Scrapling adapter, diff extraction
```
