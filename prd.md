# PRD — "Reel": Content Repurposing Studio with Brand Memory

> Working name: **Reel** (rename freely). Problem Statement 01 — Media.
> Read `context.md` and `architecture.md` before this file. This PRD is the build spec.
> Deadline: **31 Oct 2026, 11:59 PM IST**. Budget the day (see section 17).

---

## 0. One-line pitch

Drop in a long video or podcast. Reel finds the best clips and **explains why**, writes platform-native captions in **your voice**, schedules them on a calendar, and **learns** from your edits and from what actually performed — all driven by your **voice** through Wispr Flow.

## 1. Requirement traceability matrix (judges will check every row)

| # | Required by problem statement | Feature in this PRD | Section | Acceptance test |
|---|---|---|---|---|
| 1 | Long video or podcast ingestion | Ingestion pipeline: upload file / paste URL / paste transcript; ffmpeg audio extract; chunked Whisper ASR; transcript with timestamps and speakers (best effort) | 6.1 | Upload 30–90 min file (or seeded demo) -> transcript with timestamps appears; progress stream visible |
| 2 | Clip selection with reasons given for each choice | Clip Finder: candidate segmentation -> multi-signal scoring -> ranked clips each with **reason, score breakdown, hook, timestamp, evidence quote** | 6.2 | Each clip card shows "Why this clip" with >=3 specific reasons + score bars |
| 3 | Captions and copy tailored to each platform | Copy Engine: per-platform generation for LinkedIn, Instagram Reels, YouTube Shorts, X, TikTok (+ hashtags, hooks, CTAs, length rules) | 6.3 | One clip -> 5 distinct platform variants, each obeying platform rules |
| 4 | Brand-voice memory that learns from the creator's edits | Voice Memory: stores (AI draft, creator edit) pairs, extracts diffs -> style rules + exemplars + embeddings, versioned, applied to every future generation, visible "Voice Memory" page | 6.4 | Edit a caption -> memory updates (new rule appears with diff evidence) -> next generation visibly reflects it |
| 5 | A content calendar | Calendar: month/week views, drag-drop scheduling, AI-suggested slots, status (draft/scheduled/posted), export .ics | 6.5 | Schedule clips by drag-drop and by voice ("put the pricing clip on Thursday morning on LinkedIn") |
| 6 | Performance feedback loop that changes future suggestions based on what actually performed | Performance Loop: log metrics (manual, CSV, or voice), compute lift per feature (hook type, length, topic, platform, time slot), update **suggestion weights**, show "What changed and why" | 6.6 | Log metrics -> weights change -> re-rank clips / new slot suggestions differ, with an explicit "because X outperformed Y by N%" explanation |
| V1 | Build by voice | `VOICE_LOG.md`, voice-driven build workflow | 13 | File exists with real entries |
| V2 | Main input is natural speech via Wispr Flow, messy -> structured | Voice Intake Pipeline everywhere (brief, edits, calendar commands, metrics) | 5 | Dictate a rambling self-correcting sentence -> clean structured intent shown side by side |
| B1 | Scrape IG/LinkedIn, build brand visual/identity | Brand Kit from scraper repo | 7 | Enter handle/URL -> brand kit (voice profile + palette + visual identity + sample posts) |

**The agent must verify this matrix at the end and tick every row in `architecture.md` under "Requirement coverage".**

## 2. Users and primary job

- **Primary user:** solo creator / podcaster / founder-creator / small media team.
- **Job to be done:** "I have one 60-minute recording. Turn it into a week of on-brand posts, tell me why, and get smarter each week."
- **Judge persona:** a product panelist with 3 minutes. They must *get it* in 10 seconds and see the learning loop in 60.

## 3. Product principles

1. **Explain every AI choice.** No black boxes. Reasons, scores, evidence.
2. **Voice first.** Anything typeable should be dictatable; messy speech is expected.
3. **It learns visibly.** Every learning event shows a diff, a rule, a "before/after".
4. **Never empty.** Seed demo data so every screen is alive.
5. **Fast and honest.** Stream progress. Show real errors with recovery.

## 4. System architecture

```
 Wispr Flow (user dictates into any text field)
        |
 Next.js (Vercel) ----REST/SSE----> FastAPI (Render, Docker + ffmpeg)
                                         |
                       +-----------------+--------------------+
                       |                 |                    |
                 Neon Postgres      LLM Router            Scraper adapter
                 (+pgvector)     HF primary -> Gemini      (user's GitHub repo)
                                  fallback (auto)
```

### 4.1 LLM Router (must be built carefully)
- Single interface: `llm.chat(messages, schema=None, task=...)`, `llm.transcribe(audio)`, `llm.embed(texts)`.
- **Primary: Hugging Face Inference** using `HF_TOKEN`. Use the OpenAI-compatible HF router endpoint for chat. **Verify current model IDs at build time** (models change) and make them env-configurable: `HF_CHAT_MODEL`, `HF_ASR_MODEL` (Whisper large-v3 family), `HF_EMBED_MODEL`.
- **Fallback: Gemini** using `GEMINI_API_KEY`. Env-configurable `GEMINI_MODEL`. Fallback triggers on: HTTP 429/5xx, timeout (>25s per call), empty output, JSON that fails schema validation after 1 repair retry.
- **Structured output:** every LLM call returns JSON validated by Pydantic. On validation failure: one repair prompt, then fallback provider.
- Log every call to `llm_calls` table (provider, task, latency, tokens if known, fallback_used). Show a tiny "Model: HF · Fallback ready" status chip in the UI. Add a hidden `/debug/llm` page to demo failover (toggle "force HF failure").
- ASR fallback: if HF ASR fails, use Gemini audio understanding for transcription of chunks. If both fail and the user pasted a transcript, use it.

### 4.2 Long-job handling
- Jobs table + background worker in-process (FastAPI `BackgroundTasks` or an asyncio task queue; keep it simple, no Redis).
- Progress via **SSE** (`/jobs/{id}/events`) with stages: `uploading -> extracting_audio -> transcribing (n/N chunks) -> segmenting -> scoring -> done`.
- Chunk audio into ~5-minute pieces with ffmpeg, transcribe in parallel (limit concurrency 3), stitch with offset timestamps.
- Render free/starter instances can sleep or have limited disk: store uploaded media on ephemeral disk, store **transcripts/derived data** in Neon. Add a **demo path** that never depends on heavy processing: seeded transcript + "Process sample podcast" button that runs the real scoring/copy pipeline on a pre-stored transcript. **Also add keep-alive/health ping and a "warming up backend" UI state.**
- If a URL is pasted (YouTube etc.): attempt via `yt-dlp` in the backend; if blocked (common on cloud IPs), show a graceful message offering upload or transcript paste. Do not let this block the demo.

## 5. Voice Intake Pipeline (the Wispr Flow requirement — 20% of score)

Wispr Flow works by dictating into any text field, so product surfaces must be **excellent dictation targets** and must **handle messy transcripts**.

### 5.1 Voice-first UI
- A global **"Talk to Reel"** command bar (`Cmd/Ctrl+K` and a persistent bottom input). Large multi-line textarea, auto-focus, placeholder: *"Hold your Wispr Flow key and talk..."*.
- Voice surfaces: (a) project brief, (b) caption edit instructions ("make it punchier, drop the emojis, lead with the number"), (c) calendar commands, (d) performance logging ("the pricing clip got 12k views and 340 likes on LinkedIn, the intro one flopped"), (e) brand notes.
- Autofocus, no blocking key handlers that break dictation, no debounce that drops text, submit on explicit button or `Cmd+Enter` (never on Enter alone, so dictated newlines are safe).
- Show a **"Voice Studio" panel**: left = raw transcript exactly as dictated; right = cleaned, structured intent (JSON-like pretty view with chips). Highlight removed fillers and applied self-corrections (e.g. strike-through "Instagram" -> "LinkedIn"). This makes the voice requirement *visible to judges*.

### 5.2 Voice Cleanup agent (`/voice/interpret`)
Input: raw text + context (current screen, selected clip, project).
Output (validated schema):
```json
{
  "clean_text": "...",
  "intent": "create_brief | edit_caption | schedule | log_performance | brand_note | question",
  "entities": {"platform": "linkedin", "clip_ref": "pricing clip", "when": "2026-11-05T09:00+05:30", "metrics": {...}},
  "corrections_applied": [{"from": "Instagram", "to": "LinkedIn"}],
  "fillers_removed": ["um", "like", "you know"],
  "confidence": 0.0,
  "needs_clarification": null
}
```
- Resolves fuzzy references ("the pricing clip") via embedding search over clip titles/transcripts.
- Resolves relative dates in **IST** ("Thursday morning").
- If confidence < 0.6, ask ONE clarifying question inline.
- Every action by voice shows a confirm-chip ("Schedule *Pricing is a lie* on LinkedIn, Thu 5 Nov 9:00 IST — Confirm / Edit").

## 6. Core features (detailed)

### 6.1 Long video / podcast ingestion (Req 1)
- Inputs: file upload (mp4/mov/mp3/wav/m4a, up to a sensible limit with clear error), URL attempt, or paste transcript (with/without timestamps).
- Pipeline: store -> `ffmpeg` extract mono 16k audio -> chunk -> ASR (HF Whisper, Gemini fallback) -> stitched transcript `[{start,end,speaker?,text}]` -> store in Neon -> embed segments (pgvector).
- UI: Ingest screen with drag-drop, live stage progress (SSE), waveform/timeline preview, transcript viewer with search and click-to-seek, duration/word-count/speaker stats.
- Detect topics (chapter markers) via LLM over transcript windows -> show chapter timeline.
- Handle long inputs: map-reduce prompts over windows (e.g. 3–4 min windows w/ overlap), never one giant prompt.

### 6.2 Clip selection with reasons (Req 2)
Pipeline (multi-step agent, visible in UI as "Agent steps"):
1. **Candidate generation:** sliding windows snapped to sentence boundaries, 20–90s, plus LLM-proposed spans.
2. **Signal scoring** per candidate (each 0–10 with a one-line justification):
   - Hook strength (first 3 seconds)
   - Standalone clarity (makes sense without context)
   - Emotional/energy peak
   - Novelty / contrarian insight
   - Actionability / quotability
   - Platform fit (which platforms)
   - **Brand fit** (uses Voice Memory + brand topics)
   - **Performance prior** (uses Performance Loop weights — Req 6 link)
3. **Rank + dedupe** (avoid overlapping/duplicate topics; diversity pass).
4. **Output per clip:** title, start/end, duration, hook line, **"Why this clip" (3–5 bullet reasons with evidence quote from transcript)**, score breakdown bars, risks ("references 'earlier' — needs context trim"), suggested trim, recommended platforms.
- User actions: accept / reject (with optional voice reason: "too salesy") / adjust boundaries / regenerate. **Rejections and reasons are stored and feed learning.**
- **Actually render clips:** use ffmpeg to cut preview clips (copy or re-encode) with burned-in captions as a stretch goal (see 6.7). Minimum: playable preview range (start/end) on the source media player with a waveform-style trim bar.

### 6.3 Platform-tailored captions and copy (Req 3)
Per clip, generate variants for: **LinkedIn, Instagram Reels, YouTube Shorts, X (thread/post), TikTok**. Encode platform rules in a config (`platforms.yaml`):
- LinkedIn: strong first line (cut at ~210 chars before "see more"), short paragraphs, insight-led, 0–3 hashtags, question CTA.
- Instagram Reels: caption hook, line breaks, 3–8 hashtags, on-screen text suggestion, CTA to comment/save.
- YouTube Shorts: title <=100 chars, description w/ keywords, pinned-comment idea.
- X: <=280 chars single post + optional 3-5 post thread.
- TikTok: ultra-short hook caption, trending-style hashtags (generic, no fake trend claims), on-screen text beats.
Each variant includes: hook options (A/B), caption, hashtags, CTA, on-screen text, alt text, character counter, **"Voice match score"** (how close to Brand Voice Memory).
- UI: tabs per platform with live preview mocks (look like the real platform feed card, tasteful, not infringing logos), editable inline, copy button, regenerate with a voice instruction.

### 6.4 Brand-voice memory that learns from edits (Req 4)
Data captured:
- `voice_examples`: `(clip_id, platform, ai_draft, creator_final, instruction_text?, created_at)`.
Learning pipeline on every save/edit:
1. Compute **word/sentence diff** (diff-match-patch / difflib).
2. LLM **Edit Analyst** classifies edit types: tone, length, emoji removal, hook rewrite, jargon swap, CTA change, structure, vocabulary, forbidden phrases.
3. Produce/merge **style rules** with confidence + evidence, e.g. `"Never use emojis in LinkedIn posts" (conf 0.86, 4 edits)`, `"Opens with a concrete number"`, `"Avoids the word 'leverage'"`, `"Short sentences. Max 14 words."`.
4. Store **exemplars** (best creator-final texts) with embeddings for few-shot retrieval.
5. Maintain a **Voice Profile v{n}**: summary paragraph, rules list, do/don't phrases, tone sliders (formal<->casual, bold<->measured, short<->long), signature phrases, banned words.
Application:
- Every generation prompt includes: Voice Profile + top-k retrieved exemplars for that platform + active rules.
- Rules decay/strengthen: confidence up on repeated evidence; down if the creator reverses it.
UI ("Voice Memory" page — must be a showpiece):
- Rule list with confidence meters, evidence diffs (red/green inline), toggle/pin/delete rule by voice or click.
- Version timeline v1 -> vN, with "what changed".
- **Before/After demo button:** regenerate the same clip with memory OFF vs ON side by side with voice match scores.
- Cold start: bootstrap profile from scraped posts (section 7) or pasted writing samples.

### 6.5 Content calendar (Req 5)
- Month + Week + List views; cards color-coded by platform; status: idea / draft / scheduled / posted / skipped.
- Drag-and-drop between slots; click to open the post editor.
- **AI slot suggestions** per post (best day/time in **IST**) using Performance Loop data (and sensible defaults when no data: label them "prior" not "learned").
- Voice scheduling via Voice Intake ("schedule the first three clips across next week, LinkedIn mornings, Reels evenings").
- Cadence guardrails (max posts/day/platform, spacing, no same-topic back-to-back).
- Auto-fill week: "Plan my week" button -> fills calendar from accepted clips with reasons per slot.
- Export `.ics`; optional "mark as posted" which opens performance logging.
- No real posting integrations required (note as roadmap), but design a `publish` adapter interface.

### 6.6 Performance feedback loop (Req 6)
Inputs (all three must work):
1. **Manual form** per post (views, likes, comments, shares, saves, watch-time/retention %, followers gained).
2. **CSV upload** (flexible column mapping by LLM).
3. **Voice logging** ("the pricing clip got 12k views and 340 likes on LinkedIn, the intro one flopped").
Analysis engine (deterministic stats + LLM narrative):
- Normalize into **engagement score** per platform (e.g. weighted interactions / views, percentile within platform).
- Tag each post with features: hook type (number, question, contrarian, story), length bucket, topic/chapter, platform, day-of-week, time slot, emotion, has-CTA, caption length.
- Compute **lift per feature** vs baseline (with min-sample guardrails; show sample size and "low confidence" labels; no fake significance).
- Maintain **suggestion weights** (`feature_weights` table), updated with exponential decay so recent results matter more.
Effects (must be visible — this is what judges test):
- Clip re-ranking changes (the "Performance prior" score in 6.2).
- Slot suggestions change in calendar.
- Hook/caption generation is conditioned on top performers ("Your number-led hooks beat question hooks by 2.4x on LinkedIn").
- **"What changed and why" feed:** after each log, show diff of weights and 1–3 plain-language insights + next experiments ("Test a contrarian hook on X this week").
- A/B experiment suggestions and tracking (variant A vs B results).
- Dashboard: top posts, per-platform trend charts, feature lift bars, "Learning log".
- Seed realistic performance history for the demo project (>= 30 posts across platforms) so the loop is demonstrable instantly; label as **demo data**.

### 6.7 Stretch (only after all of 6.1–6.6 are deployed and verified)
- ffmpeg render of vertical 9:16 clips with burned-in captions (word-level timing from ASR).
- Hook thumbnails using the brand kit.
- Multi-project switcher.
- Team comments.

## 7. Scraper integration & Brand Kit (user's GitHub repo)

> The user has **already installed a scraping GitHub repo** in the project folder. Locate it (look in the workspace root and subfolders for a cloned repo with scraper code/README; if more than one candidate or none, ASK the user once for the path/name). **Read its README first and use it as-is** (wrap, don't rewrite), noting its auth/cookie/proxy needs in `architecture.md`.

Integration rules:
- Wrap the repo in a backend **adapter** `scraper/` exposing `scrape_profile(platform, handle_or_url, limit=30)` returning normalized `Post[]` (text, date, media URLs, likes/comments if available, hashtags, URL).
- Supports **Instagram** and **LinkedIn** (whatever the repo supports; for unsupported ones, show a clear message and allow paste/upload fallback).
- Run scraping as a background job with progress; cache results in Neon (`scraped_posts`); respect rate limits; never log credentials.
- **Reliability fallback is mandatory:** social platforms block scrapers often. If scraping fails in the demo, the UI must offer "Paste your best 10 posts" and "Use demo creator profile (cached scrape)". Pre-seed one cached scrape result so the demo never fails live.
- Compliance note in UI: "Only scrape accounts you own or have permission to analyze."

Brand Kit generation from scraped data ("Brand Identity" page):
- **Voice profile** (feeds Voice Memory v1): tone, sentence length, vocabulary, signature phrases, emoji/hashtag habits, formatting patterns, top topics.
- **Visual identity:** extract **dominant colors / palette** from scraped images (colorthief / PIL k-means), typography vibe (descriptive; suggest closest Google Fonts), image style notes (photography vs graphic, text-on-image, faces, etc.) via a vision-capable model call (HF vision model or Gemini fallback).
- **Brand card:** name, tagline suggestion, palette swatches with hex, font pairing, do/don't visual rules, sample post mockups using the palette.
- Brand kit colors are used to theme the **post preview cards and thumbnails**, NOT the Reel app UI itself.
- Exports: brand kit JSON + PNG brand card.

## 8. Data model (Neon Postgres, `pgvector`)

Create with migrations (Alembic or plain SQL files run via CLI). Tables (minimum):
`users` (single demo user is fine; simple auth optional), `projects`, `media_assets`, `jobs`, `transcripts`, `transcript_segments (embedding vector)`, `chapters`, `clips`, `clip_scores`, `clip_feedback`, `platform_variants`, `voice_profiles (versioned)`, `voice_rules`, `voice_examples (embedding vector)`, `calendar_items`, `performance_logs`, `post_features`, `feature_weights`, `insights`, `experiments`, `scraped_posts`, `brand_kits`, `llm_calls`, `voice_intakes`.
Document ER diagram in `architecture.md`.
Use Neon CLI to create the project/branch/database, enable `vector`, and print the connection string into env (never into logs). Use **Neon branching** for a `dev` branch vs `main` and mention in architecture.md.

## 9. API surface (FastAPI) — minimum

`POST /projects`, `GET /projects/{id}`
`POST /ingest/upload`, `POST /ingest/url`, `POST /ingest/transcript`, `GET /jobs/{id}`, `GET /jobs/{id}/events` (SSE)
`GET /transcripts/{id}`, `GET /projects/{id}/chapters`
`POST /clips/find`, `GET /projects/{id}/clips`, `PATCH /clips/{id}` (accept/reject/trim), `POST /clips/{id}/feedback`
`POST /clips/{id}/copy` (generate platform variants), `PATCH /variants/{id}` (edit -> triggers learning)
`GET /voice/profile`, `GET /voice/rules`, `PATCH /voice/rules/{id}`, `POST /voice/compare` (memory ON vs OFF)
`POST /voice/interpret`
`GET/POST/PATCH /calendar`, `POST /calendar/plan-week`, `GET /calendar/export.ics`
`POST /performance/log`, `POST /performance/csv`, `GET /performance/insights`, `GET /performance/weights`
`POST /brand/scrape`, `GET /brand/kit`
`GET /health`, `GET /debug/llm`
Auto-generate OpenAPI; frontend uses a typed client. CORS locked to the Vercel domain.

## 10. Frontend spec

Next.js App Router, TypeScript, Tailwind, shadcn/ui as primitives (restyled — never default look), TanStack Query, Zustand (light), Framer Motion (restrained), `@dnd-kit` for calendar drag/drop, Recharts or visx for charts.

### 10.1 Information architecture
1. **Landing page (`/`)** — YC-style marketing page (see 10.3) with an embedded *real* product screenshot/live demo and "Open the demo" button (no signup friction).
2. **Studio (`/app`)** — app shell with left rail: `Ingest · Clips · Copy · Voice Memory · Calendar · Performance · Brand`, plus the persistent **Talk to Reel** voice bar and `Cmd+K`.
3. Each of the six requirements has its own named screen so judges can find it instantly. Add a small "Requirement" tag nowhere intrusive, but include a **"How Reel works"** route that maps the 6 capabilities to screens (this directly boosts Problem Understanding).

### 10.2 Key UX moments (polish these first)
- Clip card with **"Why this clip"** reasons + score bars + evidence quote.
- Voice Studio side-by-side (raw vs cleaned) with animated strike-throughs.
- Voice Memory rule evidence diffs + before/after toggle.
- Calendar drag-drop and "Plan my week".
- Performance "What changed and why" feed with weight deltas animating.
- Empty/loading/error states designed (skeletons, not spinners everywhere). Keyboard shortcuts displayed.

### 10.3 Design system — "Y Combinator startup", NOT AI slop
**Mandatory process:** Before writing UI, invoke **UI/UX Pro Max skill** (design system, palette, type, spacing) and **Impeccable skill** (quality bar, critique, polish). Save the resulting design tokens to `design-system.md` and reference it in `architecture.md`. After building each screen, run Impeccable critique and fix findings. Use the **frontend-design** guidance if available.

Direction:
- **Canvas:** warm off-white (`#FAF9F6`-ish) with near-black text (`#111`), OR a true dark mode with `#0B0B0C` — support both, default light. 
- **One accent:** a single confident hue (e.g. YC-adjacent orange `#F26522`-family, or electric ink-blue/green — pick ONE after Pro Max consult). No gradients as decoration.
- **Type:** pair a sharp grotesk/sans (e.g. Geist, Söhne-alternative, Inter Tight, or General Sans) with a **mono** (Geist Mono / JetBrains Mono) for metadata, timestamps, scores. One display serif is allowed for the landing headline only if it reads editorial and intentional.
- **Layout:** strict 8px grid, 1px hairline borders, minimal shadows, 6–8px radii max (not bubbly), dense tables, generous but purposeful whitespace.
- **Copy:** plain, specific, punchy. e.g. *"One podcast in. A week of posts out. It remembers how you write."* No buzzwords.
- **Imagery:** product UI screenshots are the hero; no stock photos; no fake testimonials/logos; any social proof is clearly labeled "demo".
- **Motion:** quick (120–200ms), purposeful: progress, diffs, weight changes.
- **Accessibility:** WCAG AA contrast, focus rings, keyboard nav, reduced-motion respect.
- **Responsive:** desktop-first, fully usable on tablet; mobile at least viewable.
- Run a final **"slop audit"**: check against the banned list in `context.md`. Fail the build if violated.

## 11. Agent orchestration plan (Antigravity Agents mode — USE SUBAGENTS HEAVILY)

You are the **Orchestrator**. Create the plan Artifact first, then spawn subagents **in parallel** with explicit file ownership. Each subagent writes its summary into `architecture.md` + the Obsidian vault before finishing, and returns an Artifact (screenshots/logs/tests).

**Wave 0 — Bootstrap (orchestrator, sequential, short)**
- Create repo structure, `.gitignore`, `.env.example`, rules file, `architecture.md` skeleton, locate Obsidian vault and scraper repo, verify CLIs installed and logged in (`vercel whoami`, `render whoami`, `neonctl me`).

**Wave 1 — Parallel foundations**
| Subagent | Owns | Tasks |
|---|---|---|
| `infra-neon` | `/db` | `neonctl` project/branch/db, enable pgvector, migrations, seed script skeleton, write connection info to env safely |
| `backend-core` | `/backend/app/core`, `/api` | FastAPI skeleton, config, Docker (ffmpeg), jobs + SSE, health, CORS, Pydantic models |
| `llm-router` | `/backend/app/llm` | HF + Gemini router, schema validation, repair, fallback, logging, `/debug/llm`, unit tests with mocked failures |
| `design-system` | `/frontend/design`, `design-system.md` | Invoke UI/UX Pro Max + Impeccable; tokens, typography, components, landing wireframe |
| `scraper-adapter` | `/backend/app/scraper` | Read user's scraper repo, build adapter, normalize, cache, fallback flows |
| `knowledge-keeper` | `architecture.md`, Obsidian vault | Build the knowledge graph notes, index, wikilinks, rules file; update continuously |

**Wave 2 — Parallel features** (start as soon as Wave 1 contracts exist; contracts first in `architecture.md`)
| Subagent | Owns | Tasks |
|---|---|---|
| `ingestion-agent` | `/backend/app/ingest` | Req 1: upload, ffmpeg, chunked ASR, transcript, chapters, embeddings |
| `clip-agent` | `/backend/app/clips` | Req 2: candidates, scoring, reasons, ranking, feedback |
| `copy-agent` | `/backend/app/copy`, `platforms.yaml` | Req 3: platform variants, voice-match score |
| `voice-memory-agent` | `/backend/app/memory` | Req 4: diffs, edit analyst, rules, exemplars, versions, ON/OFF compare |
| `calendar-agent` | `/backend/app/calendar` | Req 5: items, slot suggestions, plan-week, ICS |
| `performance-agent` | `/backend/app/performance` | Req 6: logs, CSV, features, lift, weights, insights, experiments |
| `voice-intake-agent` | `/backend/app/voice` | Voice cleanup/intent/entities, fuzzy refs, IST dates |
| `brand-agent` | `/backend/app/brand` | Brand kit: voice profile, palette extraction, vision notes |
| `frontend-shell` | `/frontend/app/(shell)` | App shell, nav, Talk-to-Reel bar, Voice Studio, API client |
| `frontend-landing` | `/frontend/app/(marketing)` | YC-style landing, "How Reel works" |
| `frontend-screens-a` | `/frontend/app/app/{ingest,clips,copy}` | Screens for Req 1–3 |
| `frontend-screens-b` | `/frontend/app/app/{voice-memory,calendar,performance,brand}` | Screens for Req 4–6 + brand |
| `seed-data-agent` | `/db/seed` | Realistic demo podcast transcript (~45 min equivalent), 12+ clips w/ reasons, voice edits history, 30+ perf posts, cached scrape |

**Wave 3 — Integration, deploy, verify** (parallel where possible)
| Subagent | Tasks |
|---|---|
| `deploy-backend` | Render CLI: create/update service from Dockerfile or `render.yaml`, set env vars, deploy, tail logs, verify `/health` |
| `deploy-frontend` | Vercel CLI: link, set env (`NEXT_PUBLIC_API_URL`), `vercel --prod`, verify |
| `qa-browser` | **Browser subagent** runs the full demo script on the deployed URLs, records screenshots/video to `/docs/demo/`, files bugs to a task list |
| `qa-requirements` | Walk the traceability matrix (section 1) row by row with proof; tick in `architecture.md` |
| `design-review` | Impeccable critique + slop audit on every screen; fix list |
| `test-agent` | Pytest for LLM router/fallback, diff->rules, weights update; Playwright smoke tests |
| `docs-agent` | README, demo script, `/docs/linkedin-posts.md`, `VOICE_LOG.md` scaffolding |

**Rules of engagement**
- Contracts-first: publish API schemas/types in `architecture.md` before dependents start.
- No two subagents edit the same file. If needed, ask the owner via the orchestrator.
- Every subagent: (1) reads `architecture.md`, (2) does its task, (3) runs its own tests, (4) updates `architecture.md` + Obsidian, (5) reports.
- On a blocker >10 min, write it to "Known issues" and move on with a stub; never stall the whole build.

## 12. CLI usage (mandatory)

The agent must actually use these CLIs (not manual dashboards), checking auth first and asking the user to log in only if needed:

**Neon CLI (`neonctl`)**
- `neonctl auth` (if needed), `neonctl projects create`, `neonctl branches create --name dev`, `neonctl connection-string`, enable extension via SQL `CREATE EXTENSION IF NOT EXISTS vector;`.
- Record project ID, branch names, region in `architecture.md` (not secrets).

**Render CLI**
- Check `render whoami`/login. Create the web service from `/backend` Dockerfile (prefer `render.yaml` blueprint committed to repo), set env vars (`DATABASE_URL`, `HF_TOKEN`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS`, model IDs), trigger deploy, stream logs, verify `GET /health`.
- Add health check path and note cold-start behavior.

**Vercel CLI**
- `vercel login` (if needed), `vercel link`, `vercel env add NEXT_PUBLIC_API_URL production`, `vercel --prod`, capture production URL; set Render `ALLOWED_ORIGINS` to that URL and redeploy backend.

Deployment order: Neon -> backend (Render) -> frontend (Vercel) -> update CORS -> verify E2E. Re-deploy iteratively; deploy early (Wave 1 skeleton) so deployment issues surface in hour 2, not hour 9.

## 13. Voice-driven build log (Wispr Flow 20%)

Create `VOICE_LOG.md` and an in-app `/how-reel-was-built` section:
- Template entries: timestamp (IST), what the human dictated (raw excerpt, messy and real), what it became (the clean prompt/spec), result.
- The human will paste real excerpts; the agent must **prompt the user to add at least 8 entries during the day** and keep the file ready.
- Provide `/docs/voice-build-notes.md` with talking points for the demo ("I built this by talking: dictated the PRD, specs, bug fixes, even the demo script").

## 14. Memory & rules setup (anti-context-loss)

Create these in Wave 0:

1. **`architecture.md`** (repo root) with sections:
   - Project summary & current status (updated each task)
   - Requirement coverage checklist (matrix from section 1)
   - Knowledge graph (Mermaid + bullet adjacency list: Entity -> relation -> Entity)
   - Components & ownership (which subagent owns what)
   - Data model / ER
   - API contracts
   - LLM router behavior & model IDs in use
   - Deploy info (Vercel URL, Render service, Neon project/branches — no secrets)
   - ADRs (decision, reason, date)
   - Known issues & TODO
   - Glossary
   - "If you are lost, start here" checklist
2. **Obsidian vault:** find the folder containing `.obsidian/`. Create `/<vault>/Reel/` with `00-INDEX.md` (map of content), and notes per component/feature/decision/daily-log (`YYYY-MM-DD-log.md`), linked with `[[wikilinks]]`, with frontmatter tags (`#req/1-ingestion`, `#agent/clip-agent`, etc.). `architecture.md` and the vault must stay in sync: architecture.md = canonical summary; vault = deeper, linked notes. The agent should also **read** any notes the human adds in the vault (human may drop ideas there).
3. **Rules file** — create `.agent/rules/00-context-protocol.md` (and mirror to `AGENTS.md`/`GEMINI.md` if the project uses them) containing exactly:
   > **ALWAYS refer to `architecture.md` and the Obsidian vault index (`00-INDEX.md`) whenever you are confused, lose context, start a new task, or are about to make an architectural decision. Update both before finishing any task. If something is not in `architecture.md`, treat it as unknown and verify. Never contradict an ADR without writing a new ADR. Read `context.md` and `prd.md` at the start of every session. Use the Impeccable and UI/UX Pro Max skills for any frontend work. Use subagents for parallelizable work. Never print or commit secrets.**
4. Create `.agent/workflows/` slash workflows (e.g. `/deploy-all`, `/verify-requirements`, `/slop-audit`, `/update-memory`).

## 15. Seed/demo data (critical for judges)

- **Demo project:** "The Founder Files — Ep. 42" podcast (fictional creator, fictional guests), ~45 min transcript with realistic dialogue, chapters, ~15 candidate clips, ~8 accepted.
- Pre-existing **voice edits history** (6+ edits) producing visible rules and Voice Profile v3.
- **Performance history:** 30+ posts across LinkedIn/Instagram/X/Shorts with believable metrics where "number-led hooks" and "contrarian takes" win on LinkedIn, "story hooks" win on Reels (so the loop yields clear, explainable insights).
- **Cached scraped profile** for the demo creator.
- Clearly label as demo data in-app (small mono tag).
- One-click **"Reset demo"** button.

## 16. Quality bar & test plan

- Unit tests: LLM router fallback (mock 429/timeout/invalid JSON), diff->rule extraction, weights update math, date parsing in IST, voice interpret schema.
- Integration: ingest sample -> clips -> copy -> edit -> memory update -> schedule -> log perf -> weights change -> re-rank. This **single flow = the demo**; automate it with Playwright against deployed URL.
- Performance: transcript of 60 min processes in a reasonable time with progress streamed; UI never freezes.
- Error handling: all failures show human messages + retry.
- Security basics: no secrets in repo/logs, CORS locked, upload size/type limits, sanitize outputs.

## 17. Time plan (IST, today)

Deadline 11:59 PM IST. Build window assumes start ~3:00 PM.
- 3:00–3:30 Wave 0 bootstrap + plan Artifact
- 3:30–5:30 Wave 1 + **first deploy of skeletons** (all three platforms live, health green)
- 5:30–9:30 Wave 2 features in parallel (prioritize: ingest -> clips -> copy -> voice memory -> perf loop -> calendar -> brand/scraper)
- 9:30–10:30 Wave 3 integration + deploy + seed
- 10:30–11:15 QA by browser subagent, slop audit, fixes
- 11:15–11:45 Submit project (human), final deploy freeze at 11:30
- **Freeze rule:** after 11:15 PM only bug fixes, no features.
- If behind schedule, cut in this order: ffmpeg clip rendering -> multi-project -> URL ingestion -> brand visual polish. **Never cut any of the 6 required capabilities or voice features.**

## 18. Submission checklist (human + agent)

- [ ] Deployed frontend URL (Vercel) public, loads in < 3s
- [ ] Deployed backend URL (Render) `/health` OK
- [ ] GitHub repo with README (setup, architecture diagram, demo script, screenshots/GIF)
- [ ] 2–3 minute demo video (browser-subagent recording as raw material)
- [ ] `VOICE_LOG.md` + screenshots of Wispr Flow usage
- [ ] Requirement matrix ticked with proof
- [ ] Submit on Product Space portal before 11:59 PM IST
- [ ] LinkedIn: post 1 (after kickoff), post 2 (progress screenshot), post 3 (demo) — tag Product Space; submit links + engagement screenshot by 1 Nov 11:59 PM IST

## 19. Demo script (3 minutes, optimize for judges)

1. (0:00) Landing: one-liner. Click "Open the demo".
2. (0:15) **Voice:** dictate a rambling brief with a self-correction; show Voice Studio raw -> clean.
3. (0:35) **Ingest:** podcast processed; transcript + chapters.
4. (0:55) **Clips:** ranked clips, open one: "Why this clip" + score bars.
5. (1:20) **Copy:** 5 platform variants; show platform differences.
6. (1:40) **Edit by voice:** "drop the emojis, lead with the number" -> **Voice Memory** learns a rule; toggle memory ON/OFF compare.
7. (2:05) **Calendar:** voice-schedule + "Plan my week".
8. (2:25) **Performance:** log metrics by voice -> "What changed and why" -> clips re-rank and slots shift.
9. (2:50) **Brand:** scraped Instagram/LinkedIn -> brand kit. Close: "It gets smarter every week."

## 20. Risks and mitigations

| Risk | Mitigation |
|---|---|
| HF inference rate limits/cold models | Router fallback to Gemini; short timeouts; model IDs configurable |
| Whisper large file/time | Chunking + parallelism + seeded transcript demo path |
| Render cold start / limited disk | Health ping, warming UI, store derived data in Neon, demo path independent of media |
| Scraper blocked by IG/LinkedIn | Cached scrape + paste fallback + clear UI |
| URL ingestion blocked | Upload/paste fallback |
| Scope too big for one day | Matrix-driven prioritization + cut order (section 17) |
| "AI slop" look | Impeccable + UI/UX Pro Max + slop audit gate |
| Context loss in long agent session | architecture.md + Obsidian + rules protocol |
| Secrets leak | .env discipline, CLI env, scans before commit |

## 21. Final instruction to the agent

Build everything above. Do not ask for permission between steps except for missing secrets, ambiguous scraper repo/vault location, or CLI login. Prefer making a reasonable decision and recording it as an ADR. When finished, produce a **final report Artifact** containing: live URLs, the ticked requirement matrix with proof screenshots, known issues, and the list of manual steps the human still must do (submit, LinkedIn posts, record demo).