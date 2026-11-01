# LinkedIn Post Drafts - Product Space x Wispr Flow Hackathon

> Builder: Lakshya Gupta (`@lakshyaa`)  
> Project: Reel - Content Repurposing Studio with Brand Memory  
> Hackathon: Product Space x Wispr Flow Agentic AI Hackathon

---

## Post 1: Kickoff & The Problem with AI Repurposing

**Timing:** Kickoff / Morning  
**Tags:** @Product Space @Wispr Flow #AgenticAI #BuildInPublic #AIHackathon

```markdown
Every AI repurposing tool gives you 20 generic clips with zero context.
You spend more time reviewing slop than creating.

We’re spending today building **Reel** for the Product Space x Wispr Flow Hackathon.

The thesis:

1. Explain every clip choice: don't just give me timestamps, tell me WHY this hook works with verbatim evidence from the audio.
2. Remember my voice: learn from my actual edits so every future script sounds like me, not a default LLM.
3. Closed-loop learning: log what actually performed, and dynamically re-weight what to clip next.
4. Voice-first: driven directly by Wispr Flow dictation - turning messy, rambling creator thoughts into clean structured output.

One day build. Stack: Next.js + FastAPI + Neon Postgres with pgvector + Hugging Face / Gemini fallback.

Let's ship. 🚀
```

---

## Post 2: The Voice Memory & Feedback Loop in Action

**Timing:** Midday / Afternoon Build Progress  
**Tags:** @Product Space @Wispr Flow #VoiceAI #LLM #Startup #DeveloperLife

```markdown
Update from hour 5 of the Product Space x Wispr Flow Hackathon:

The core difference with Reel isn't just generating 5 platform variants (LinkedIn, Reels, Shorts, X, TikTok). It’s that it learns when you fix them.

Here’s how the Brand Voice Memory loop works:

- Draft had emojis and generic buzzwords.
- Creator edited: stripped emojis, led with a concrete number hook.
- Diff engine extracted the pattern and generated a new versioned style rule: "Open with concrete numbers. Max 14 words per sentence. Zero emojis."
- Next generation for LinkedIn immediately reflects it with a 98% voice match score.

Even better: the Voice Intake pipeline lets me dictate commands naturally through Wispr Flow ("schedule the pricing clip for Thursday morning on LinkedIn, wait actually Friday"). It strips fillers, resolves self-corrections, and books the slot in IST.

Public repo: https://github.com/Lakshya-2440/reel-studio

Next: deploying live to Vercel & Render.
```

---

## Post 3: Final Demo & Product Launch

**Timing:** Final Submission / Evening  
**Tags:** @Product Space @Wispr Flow #AIStudio #BuildInPublic #Innovation #DemoDay

```markdown
Shipped! 🎙️ Meet **Reel** - the content repurposing studio that actually remembers how you write.

Built in 8 hours for the Product Space x Wispr Flow Hackathon.

All 6 core capabilities live and end-to-end:

1. 🎙️ Long Video/Podcast Ingestion: Chunked Whisper ASR with live SSE streaming progress & chapter breakdown.
2. 🎯 8-Signal Clip Selection: Tells you _why_ each clip was chosen with score bars & transcript quotes.
3. 📱 Platform-Tailored Copy: Native formatting for LinkedIn, Reels, Shorts, X, and TikTok.
4. 🧠 Brand-Voice Memory: Learns from your edits via inline diffs and stores few-shot exemplars with pgvector embeddings.
5. 📅 Content Calendar: AI-suggested posting slots in IST and 1-click week planning.
6. 📈 Performance Feedback Loop: Post metrics dynamically shift future clip weights ("Number hooks beat questions by 2.4x on LinkedIn").

Plus a complete Voice Studio: real messy dictation via Wispr Flow converted into clean structured intent with real-time filler removal and self-correction.

Live Repo: https://github.com/Lakshya-2440/reel-studio
Design: Minimal, editorial Y-Combinator aesthetic - zero AI slop.

Huge thanks to @Product Space and @Wispr Flow for the prompt and platform!
```
