# context.md - Project Context for Antigravity Agents

> Read this file FIRST, every session. Then read `architecture.md`. Then `prd.md`.
> If you ever feel confused or lose context: STOP, re-read `architecture.md` and the Obsidian vault index before doing anything else.

---

## 1. What this project is

We are competing in the **Product Space x Wispr Flow "Agentic AI Hackathon"** (build an AI-powered product with your voice).

- **Date:** Saturday, 31 Oct 2026. One day build.
- **Submission deadline:** 31 Oct 2026, **11:59 PM IST** (hard). We are building in IST (UTC+05:30).
- **LinkedIn streak submission:** 1 Nov 2026, 11:59 PM IST (bonus points).
- **Demo Day:** date TBA, with a panel of judges. The product must demo cleanly in under 3 minutes.
- **Goal:** WIN. Every decision should be checked against the scoring rubric below.

## 2. Chosen problem statement

**Problem 01 - Media: content repurposing studio with brand memory**

Teams must build (ALL SIX are mandatory, judges will check each one):

1. Long video or podcast ingestion
2. Clip selection with reasons given for each choice
3. Captions and copy tailored to each platform
4. A brand-voice memory that learns from the creator's edits
5. A content calendar
6. A performance feedback loop that changes future suggestions based on what actually performed

### Rules that apply to EVERY problem statement

- **Build it by voice:** The builder (human) dictates prompts, specs and fixes with Wispr Flow into the AI builder (Antigravity). We must **document this** (see `VOICE_LOG.md` in prd.md).
- **Make it work with voice:** The **main input to the product is natural speech captured through Wispr Flow**. Real speech has filler words, digressions and self-corrections ("um, so, like, actually no, make that LinkedIn not Instagram"). The agent must turn messy dictated text into **clear, structured output**. This is a first-class feature, not a bonus.

## 3. Scoring rubric (out of 100) - optimize for this

| Criterion                       | Weight | What it means for us                                                                                                                                                                                                                   |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wispr Flow usage                | 20%    | Voice is the primary input everywhere: voice-brief box, voice edits, voice performance logging. Voice Cleanup pipeline visible in UI (raw transcript -> cleaned structured intent). `VOICE_LOG.md` + in-app "Voice Studio" showing it. |
| Prototype quality and UX        | 20%    | Real, working, deployed, fast, beautiful. No dead buttons. Seeded demo data so it never looks empty.                                                                                                                                   |
| AI integration                  | 20%    | Real agentic pipeline (multi-step, tool-using, memory-using), not one prompt. Show reasoning, scores, memory retrieval, learning.                                                                                                      |
| Problem understanding           | 15%    | Every one of the 6 required capabilities clearly present, labeled, and demoable. In-app "How it learns" explainer.                                                                                                                     |
| LinkedIn content and engagement | 15%    | Out of the app's code scope, but we must produce screenshots/GIF-friendly UI and post templates (`/docs/linkedin-posts.md`).                                                                                                           |
| Innovation and creativity       | 10%    | Visible "learning loop": brand memory diffs, performance-weighted suggestions, scraped brand identity.                                                                                                                                 |

LinkedIn bonus (+6 to +10) is extra. Prepare 3 post drafts (after kickoff / while building / final demo). Tag **Product Space**.

## 4. Tech stack (fixed - do not substitute without writing an ADR in architecture.md)

| Layer              | Choice                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Frontend           | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, deployed on **Vercel**                                        |
| Backend            | Python **FastAPI** in **Docker** (ffmpeg included), deployed on **Render** (Web Service)                                |
| Database           | **Neon** Postgres (with `pgvector` extension)                                                                           |
| Primary inference  | **Hugging Face** Inference (access token) - LLM chat + Whisper ASR + embeddings                                         |
| Fallback inference | **Google Gemini API** (API key) - used automatically if HF fails, times out, rate limits, or returns invalid JSON       |
| Scraping           | The user's already-installed **scraping GitHub repo** (see prd.md section "Scraper integration") for Instagram/LinkedIn |
| Agent tooling      | **Render CLI**, **Vercel CLI**, **Neon CLI (`neonctl`)** - the agent must use them for provisioning and deployment      |
| Memory             | `architecture.md` (knowledge graph + context) + the **Obsidian vault** in the project folder                            |

### Secrets (never print, never commit)

- `HF_TOKEN` - Hugging Face access token
- `GEMINI_API_KEY` - Gemini fallback
- `DATABASE_URL` - Neon connection string
- `NEXT_PUBLIC_API_URL` - Render backend URL
- Any scraper credentials / cookies

Keep a `.env.example` with names only. `.env` is in `.gitignore`. Set production values with `vercel env add` and `render` env settings via CLI/dashboard. If a secret is missing, ASK the user once, clearly, listing exactly which keys are needed.

## 5. Agent working mode: Antigravity AGENTS MODE

- Operate as an **orchestrator**. Spawn **subagents in parallel** wherever work is independent (see prd.md section "Subagent plan").
- Each subagent has a narrow scope, owns specific folders, and **must update `architecture.md` and the Obsidian vault** when it finishes.
- Prefer many small, verifiable tasks over one giant task. Produce **Artifacts** (task list, implementation plan, screenshots/browser recordings, walkthrough) so the human can verify fast.
- Use the **browser subagent** to actually open the deployed frontend, click through the whole demo flow, and screenshot it.

## 6. Skills the agent MUST use

- **Impeccable skill** - for all frontend design/UX quality work. Invoke it before and after building UI.
- **UI/UX Pro Max skill** - already installed. Use it for design system, palette, typography, spacing, component patterns.
- If either skill is not found, search the workspace's skills/rules directories (`.agent/skills`, `~/.gemini/antigravity/skills`, etc.) and tell the user exactly what is missing. Do NOT silently skip them.

## 7. Memory and anti-context-loss protocol (CRITICAL)

1. **`architecture.md`** (repo root) is the single source of truth: architecture, decisions (ADRs), data model, API contracts, knowledge graph, task status, deploy URLs, known issues, "what is true right now".
2. **Obsidian vault** (find the folder containing `.obsidian/` in the project; if several, ask the user which one) mirrors and extends `architecture.md` as linked notes (wikilinks `[[...]]`) so the human can browse the knowledge graph visually.
3. A **rule file** (see prd.md) tells every agent: _"Whenever you are confused, lose context, or start a new task, FIRST read `architecture.md` and the Obsidian vault index (`00-INDEX.md`). Update them before ending your task."_
4. Never rely on chat memory. If it is not in `architecture.md`, it does not exist.

## 8. Design direction (hard requirement)

The frontend must **NOT look like AI slop**. It should look like a **Y Combinator-backed startup** website/product: confident, minimal, fast, editorial, high-information-density, real product screenshots, real copy.

**Banned:** purple/blue neon gradients, glassmorphism everywhere, generic gradient blobs, emoji as icons, centered hero with "Supercharge your workflow", stock 3-card feature grids with icon circles, lorem ipsum, fake logos, "AI-powered" sparkles on everything, rainbow shadows, overly rounded bubbly cards, Inter-everything default look with no point of view.

**Wanted:** off-white or near-black canvas, one sharp accent color, strong typographic hierarchy, tight grid, 1px borders, subtle monospace accents for metadata, real data tables, keyboard-first feel, dense but breathable, short punchy copy, product UI itself is the hero. See prd.md "Design system".

## 9. Definition of done (all must be true)

- [ ] All 6 required capabilities work end-to-end on the **deployed** URLs.
- [ ] Voice-dictated text is the main input and is cleaned into structured intent visibly.
- [ ] Demo project seeded: one long podcast already ingested with clips, captions, calendar, and performance history.
- [ ] HF primary + Gemini fallback both tested.
- [ ] Vercel, Render, Neon all deployed via CLIs; URLs in `architecture.md`.
- [ ] `architecture.md` + Obsidian vault up to date.
- [ ] README with 3-minute demo script, architecture diagram, setup steps.
- [ ] `/docs/linkedin-posts.md` with 3 post drafts.
- [ ] `VOICE_LOG.md` documenting voice-driven build.
- [ ] Browser-subagent walkthrough recording/screenshots saved to `/docs/demo/`.
- [ ] Submitted before **11:59 PM IST**.
