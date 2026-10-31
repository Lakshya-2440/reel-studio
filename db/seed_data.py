#!/usr/bin/env python3
"""
Seed Data Generator for Reel
Populates rich demo dataset for "The Founder Files — Ep. 42":
  - ~45 min podcast transcript with chapters & segments + embeddings
  - 12 high-scoring clips with 8-signal breakdowns & evidence quotes
  - 60 platform variants (5 per clip: LinkedIn, Reels, Shorts, X, TikTok)
  - 1 brand kit with color palette & typography
  - 6 voice edit histories (AI draft vs creator final with diff summaries)
  - 1 voice profile (v2) with 6 active learned rules
  - 35 performance logs across platforms with hook/time feature lift
  - Pre-computed feature weights & causal insights
  - Scheduled calendar items in IST
  - Cached scraped posts & LLM audit records
Works on both Neon Postgres and SQLite fallback!
"""

import os
import json
import math
import random
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Load .env if present
try:
    from dotenv import load_dotenv
    root_env = Path(__file__).resolve().parent.parent / ".env"
    backend_env = Path(__file__).resolve().parent.parent / "backend" / ".env"
    if root_env.exists():
        load_dotenv(root_env)
    elif backend_env.exists():
        load_dotenv(backend_env)
except ImportError:
    pass

SQLITE_DB_FILE = Path(__file__).resolve().parent / "reel.db"


def get_connection():
    db_url = os.getenv("DATABASE_URL", "").strip()
    if db_url and (db_url.startswith("postgresql://") or db_url.startswith("postgres://")):
        try:
            import psycopg
            conn = psycopg.connect(db_url, autocommit=True)
            return conn, "postgres"
        except Exception:
            try:
                import psycopg2
                conn = psycopg2.connect(db_url)
                conn.autocommit = True
                return conn, "postgres"
            except Exception as e:
                print(f"[seed] Postgres connection failed ({e}), using SQLite fallback.")
    
    conn = sqlite3.connect(str(SQLITE_DB_FILE))
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn, "sqlite"


def mock_embedding(seed_int: int, dim: int = 384):
    """Generate deterministic normalized unit vector for mock embeddings."""
    rng = random.Random(seed_int)
    raw = [rng.gauss(0, 1) for _ in range(dim)]
    norm = math.sqrt(sum(x * x for x in raw))
    return [round(x / norm, 5) for x in raw]


def format_vector(vec, engine: str):
    if engine == "postgres":
        return "[" + ",".join(str(x) for x in vec) + "]"
    return json.dumps(vec)


def format_json(obj, engine: str):
    if engine == "postgres":
        return json.dumps(obj)
    return json.dumps(obj)


def format_array(arr, engine: str):
    if engine == "postgres":
        return arr  # psycopg handles python list as PG text[]
    return json.dumps(arr)


def seed_database():
    conn, engine = get_connection()
    cur = conn.cursor()
    print(f"[seed] Connected to database engine: {engine.upper()}")

    # 1. Project
    project_id = "proj_founder_files_42"
    project_name = "The Founder Files — Ep. 42: Why 90% of AI Startups Die at $50k MRR"
    project_settings = {
        "host": "Sarah Chen",
        "guest": "Marcus Vance",
        "company": "Arcus AI",
        "target_platforms": ["linkedin", "instagram_reels", "youtube_shorts", "twitter", "tiktok"],
        "default_timezone": "Asia/Kolkata",
        "tone": "sharp, counterintuitive, operator-grade, data-driven",
    }

    # Clean existing data for this project if exists
    print(f"[seed] Cleaning any existing demo records for {project_id}...")
    if engine == "postgres":
        cur.execute("DELETE FROM projects WHERE id = %s;", (project_id,))
        cur.execute("DELETE FROM llm_calls WHERE id LIKE 'llm_%';")
        cur.execute("""
            INSERT INTO projects (id, name, created_at, settings)
            VALUES (%s, %s, NOW(), %s::jsonb)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, settings = EXCLUDED.settings;
        """, (project_id, project_name, format_json(project_settings, engine)))
    else:
        # SQLite: explicitly clean tables to be completely idempotent
        cur.execute("DELETE FROM post_features WHERE log_id IN (SELECT id FROM performance_logs WHERE project_id = ?);", (project_id,))
        cur.execute("DELETE FROM performance_logs WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM calendar_items WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM platform_variants WHERE clip_id IN (SELECT id FROM clips WHERE project_id = ?);", (project_id,))
        cur.execute("DELETE FROM clips WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM chapters WHERE transcript_id IN (SELECT id FROM transcripts WHERE project_id = ?);", (project_id,))
        cur.execute("DELETE FROM transcript_segments WHERE transcript_id IN (SELECT id FROM transcripts WHERE project_id = ?);", (project_id,))
        cur.execute("DELETE FROM transcripts WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM media_assets WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM voice_rules WHERE profile_id IN (SELECT id FROM voice_profiles WHERE project_id = ?);", (project_id,))
        cur.execute("DELETE FROM voice_examples WHERE profile_id IN (SELECT id FROM voice_profiles WHERE project_id = ?);", (project_id,))
        cur.execute("DELETE FROM voice_profiles WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM brand_kits WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM feature_weights WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM insights WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM scraped_posts WHERE project_id = ?;", (project_id,))
        cur.execute("DELETE FROM llm_calls WHERE id LIKE 'llm_%';")
        cur.execute("DELETE FROM projects WHERE id = ?;", (project_id,))
        cur.execute("""
            INSERT INTO projects (id, name, created_at, settings)
            VALUES (?, ?, datetime('now'), ?);
        """, (project_id, project_name, format_json(project_settings, engine)))

    print("  ✓ Project created")

    # 2. Media Asset
    media_id = "media_ep42"
    filename = "founder_files_ep42_final_master.mp4"
    duration = 2724.0  # 45 min 24 sec
    if engine == "postgres":
        cur.execute("""
            INSERT INTO media_assets (id, project_id, filename, file_type, file_path, duration_seconds, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW());
        """, (media_id, project_id, filename, "video/mp4", f"/uploads/{filename}", duration, "ready"))
    else:
        cur.execute("""
            INSERT INTO media_assets (id, project_id, filename, file_type, file_path, duration_seconds, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));
        """, (media_id, project_id, filename, "video/mp4", f"/uploads/{filename}", duration, "ready"))

    print("  ✓ Media asset created (~45m video)")

    # 3. Transcript
    transcript_id = "trans_ep42"
    full_text = (
        "Welcome back to The Founder Files. Today I'm joined by Marcus Vance, founder of Arcus AI. "
        "Marcus bootstrapped Arcus to $4M ARR in 18 months, but almost went bankrupt at the $50k MRR mark. "
        "We talk about why cost-plus AI pricing is suicide, why you must fire your first 10 customers, "
        "the enterprise procurement psychological game, and why wrappers with superior speed will beat slow foundation models."
    )
    if engine == "postgres":
        cur.execute("""
            INSERT INTO transcripts (id, project_id, media_asset_id, full_text, duration, speaker_count, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW());
        """, (transcript_id, project_id, media_id, full_text, duration, 2))
    else:
        cur.execute("""
            INSERT INTO transcripts (id, project_id, media_asset_id, full_text, duration, speaker_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'));
        """, (transcript_id, project_id, media_id, full_text, duration, 2))

    print("  ✓ Full transcript created")

    # 4. Chapters (6 chapters spanning full 45 mins)
    chapters_data = [
        ("chap_1", "The $50k MRR Death Valley", 0.0, 420.0, "Why early AI traction often masks 110% net churn and zero unit margin."),
        ("chap_2", "Cost-Plus AI Pricing Is Self-Harm", 420.0, 890.0, "How pass-through token pricing turns scale into an existential liability."),
        ("chap_3", "Firing Early Adopter Tourists", 890.0, 1430.0, "The counterintuitive necessity of ruthlessly pruning non-ideal pilot users."),
        ("chap_4", "Enterprise Sales Is Pure Psychology", 1430.0, 1980.0, "Bypassing procurement hesitation by anchoring on organizational anxiety."),
        ("chap_5", "The Distribution Moat Fallacy", 1980.0, 2420.0, "Why foundation model moats are illusory and workflow lock-in is king."),
        ("chap_6", "Closing Doctrine: Speed as Defense", 2420.0, 2724.0, "Shipping 4x faster as the sole durable advantage against Big Tech."),
    ]
    for cid, title, start_t, end_t, summary in chapters_data:
        if engine == "postgres":
            cur.execute("""
                INSERT INTO chapters (id, transcript_id, title, start_time, end_time, summary)
                VALUES (%s, %s, %s, %s, %s, %s);
            """, (cid, transcript_id, title, start_t, end_t, summary))
        else:
            cur.execute("""
                INSERT INTO chapters (id, transcript_id, title, start_time, end_time, summary)
                VALUES (?, ?, ?, ?, ?, ?);
            """, (cid, transcript_id, title, start_t, end_t, summary))

    print(f"  ✓ {len(chapters_data)} Chapters created")

    # 5. Transcript Segments (timed key segments)
    segments_data = [
        ("seg_1", 12.0, 58.0, "Marcus Vance", "At fifty thousand MRR, we thought we were geniuses. But our compute bills from OpenAI were forty-two thousand dollars. We were effectively subsidizing Fortune 500 experiments out of our personal credit cards."),
        ("seg_2", 145.0, 198.0, "Marcus Vance", "If your gross margin on an AI product is under seventy percent, stop calling yourself a software company. You are a boutique consulting shop with an API key, and your customer knows it."),
        ("seg_3", 430.0, 482.0, "Marcus Vance", "Never charge per token or per prompt. The customer perceives token cost as friction. Charge for the verified outcome. When we switched from ten cents per query to five thousand dollars per closed audit, conversion doubled."),
        ("seg_4", 512.0, 565.0, "Sarah Chen", "That sounds terrifying for a seed stage team though. How did your early users react when you 10x'd the price overnight?"),
        ("seg_5", 566.0, 622.0, "Marcus Vance", "Nine out of ten threw a fit and canceled. Good riddance. The one that stayed paid us more than the other nine combined and demanded enterprise SOC2 compliance. That single customer funded our entire engineering runway."),
        ("seg_6", 920.0, 975.0, "Marcus Vance", "The most dangerous customer isn't the one who hates your product. It's the enthusiast who uses it six hours a day, gives endless feature requests, but will never pay more than twenty bucks a month."),
        ("seg_7", 1010.0, 1065.0, "Marcus Vance", "We fired twelve customers in one afternoon. Our team cried. Three months later, our average contract value went from eighty dollars to fourteen thousand dollars. Ruthless subtraction is the real growth hack."),
        ("seg_8", 1450.0, 1510.0, "Marcus Vance", "Enterprise procurement officers do not care about your precision or recall metrics. They care about one thing: will buying your software get them fired if the model hallucinates a confidential leak?"),
        ("seg_9", 1540.0, 1598.0, "Marcus Vance", "Position your tool as the defensive compliance shield, not the cool playground. Fear of loss drives enterprise budget ten times faster than ambition for upside."),
        ("seg_10", 2010.0, 2068.0, "Marcus Vance", "Everyone talks about proprietary fine-tuned weights as the moat. In two years, open weights will match frontier models for eighty percent of vertical tasks. Your moat is the messy workflow integration."),
        ("seg_11", 2120.0, 2178.0, "Marcus Vance", "If taking your tool out of their daily workflow doesn't break at least two people's morning routine, you have no moat. Zero. You are just a transient tab in their browser."),
        ("seg_12", 2440.0, 2505.0, "Marcus Vance", "Big tech moves with the agility of an aircraft carrier. By the time their committee approves an AI feature roadmap, you should have shipped it, iterated three times, and captured the top forty logos."),
    ]
    for idx, (sid, st, et, spk, txt) in enumerate(segments_data):
        vec = mock_embedding(idx + 100)
        vec_formatted = format_vector(vec, engine)
        if engine == "postgres":
            cur.execute("""
                INSERT INTO transcript_segments (id, transcript_id, start_time, end_time, speaker, text, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s::vector);
            """, (sid, transcript_id, st, et, spk, txt, vec_formatted))
        else:
            cur.execute("""
                INSERT INTO transcript_segments (id, transcript_id, start_time, end_time, speaker, text, embedding)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (sid, transcript_id, st, et, spk, txt, vec_formatted))

    print(f"  ✓ {len(segments_data)} Transcript segments indexed with 384-d embeddings")

    # 6. Clips (12 high-conviction clips with 8-signal scoring breakdowns)
    clips_raw = [
        {
            "id": "clip_1",
            "title": "The $42k OpenAI Bill That Almost Killed Us",
            "start_time": 12.0, "end_time": 58.0, "duration": 46.0,
            "hook_line": "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.",
            "reasons": [
                "Stark financial contrast creates instantaneous curiosity",
                "Subverts the 'high MRR = success' founder mythology",
                "Contains raw dollar vulnerability rarely shared publicly"
            ],
            "score_breakdown": {
                "hook_strength": 9.6, "emotional_arousal": 9.2, "information_density": 8.8,
                "standalone_clarity": 9.5, "novelty": 8.9, "controversy": 8.4,
                "storytelling": 9.8, "retention_probability": 9.4
            },
            "overall_score": 9.4,
            "evidence_quote": "At fifty thousand MRR, we thought we were geniuses. But our compute bills from OpenAI were forty-two thousand dollars.",
            "status": "accepted"
        },
        {
            "id": "clip_2",
            "title": "The 70% Gross Margin Rule for AI Startups",
            "start_time": 145.0, "end_time": 198.0, "duration": 53.0,
            "hook_line": "If your gross margin is under 70%, you didn't build software—you built a glorified consultancy with an API key.",
            "reasons": [
                "Concrete quantifiable heuristic (70% gross margin rule)",
                "Provocative identity attack on AI wrapper companies",
                "High save-rate potential for startup founders and VCs"
            ],
            "score_breakdown": {
                "hook_strength": 9.5, "emotional_arousal": 8.8, "information_density": 9.3,
                "standalone_clarity": 9.4, "novelty": 8.7, "controversy": 9.1,
                "storytelling": 8.6, "retention_probability": 9.2
            },
            "overall_score": 9.2,
            "evidence_quote": "If your gross margin on an AI product is under seventy percent, stop calling yourself a software company.",
            "status": "accepted"
        },
        {
            "id": "clip_3",
            "title": "Why Per-Token Pricing Kills Conversion",
            "start_time": 430.0, "end_time": 482.0, "duration": 52.0,
            "hook_line": "Charging per token reminds your customer of cost with every keystroke. Charge for verified outcomes.",
            "reasons": [
                "Actionable packaging shift from usage to value",
                "Direct revenue impact backed by 2x conversion lift",
                "Universal pain point for generative AI product managers"
            ],
            "score_breakdown": {
                "hook_strength": 8.9, "emotional_arousal": 8.4, "information_density": 9.6,
                "standalone_clarity": 9.1, "novelty": 8.5, "controversy": 8.2,
                "storytelling": 8.9, "retention_probability": 9.0
            },
            "overall_score": 8.9,
            "evidence_quote": "When we switched from ten cents per query to five thousand dollars per closed audit, conversion doubled.",
            "status": "accepted"
        },
        {
            "id": "clip_4",
            "title": "What Happens When You 10x Price Overnight",
            "start_time": 566.0, "end_time": 622.0, "duration": 56.0,
            "hook_line": "We 10x'd our price. 90% of customers canceled in 24 hours. It was the best decision of our lives.",
            "reasons": [
                "Extreme dramatic stakes with unexpected positive outcome",
                "Reveals enterprise filter dynamics",
                "Clear blueprint for filtering low-intent freemium users"
            ],
            "score_breakdown": {
                "hook_strength": 9.4, "emotional_arousal": 9.0, "information_density": 8.7,
                "standalone_clarity": 9.2, "novelty": 8.8, "controversy": 9.0,
                "storytelling": 9.4, "retention_probability": 9.1
            },
            "overall_score": 9.1,
            "evidence_quote": "The one that stayed paid us more than the other nine combined and demanded enterprise SOC2 compliance.",
            "status": "accepted"
        },
        {
            "id": "clip_5",
            "title": "The Most Dangerous Customer in Early Stage",
            "start_time": 920.0, "end_time": 975.0, "duration": 55.0,
            "hook_line": "The biggest threat to your startup isn't an angry churner. It's the enthusiastic power user who pays $20/mo.",
            "reasons": [
                "Counter-intuitive trap identification",
                "High resonance with bootstrapped and seed founders",
                "Direct behavioral advice on product roadmapping"
            ],
            "score_breakdown": {
                "hook_strength": 9.2, "emotional_arousal": 8.6, "information_density": 8.9,
                "standalone_clarity": 9.0, "novelty": 9.1, "controversy": 8.5,
                "storytelling": 8.8, "retention_probability": 8.9
            },
            "overall_score": 8.8,
            "evidence_quote": "The most dangerous customer isn't the one who hates your product. It's the enthusiast who uses it six hours a day but will never pay more than twenty bucks.",
            "status": "accepted"
        },
        {
            "id": "clip_6",
            "title": "Firing 12 Customers in One Afternoon",
            "start_time": 1010.0, "end_time": 1065.0, "duration": 55.0,
            "hook_line": "We fired 12 customers in one afternoon. Our team wept. Three months later ACV jumped from $80 to $14,000.",
            "reasons": [
                "High emotional stakes combined with radical founder agency",
                "Dramatic quantitative turnaround ($80 to $14k ACV)",
                "Actionable lesson on the power of ruthless focus"
            ],
            "score_breakdown": {
                "hook_strength": 9.7, "emotional_arousal": 9.4, "information_density": 8.8,
                "standalone_clarity": 9.4, "novelty": 9.0, "controversy": 8.9,
                "storytelling": 9.6, "retention_probability": 9.5
            },
            "overall_score": 9.3,
            "evidence_quote": "Three months later, our average contract value went from eighty dollars to fourteen thousand dollars.",
            "status": "accepted"
        },
        {
            "id": "clip_7",
            "title": "What Enterprise Procurement Actually Fears",
            "start_time": 1450.0, "end_time": 1510.0, "duration": 60.0,
            "hook_line": "Enterprise buyers don't care about your F1 score. They care whether buying your software will get them fired.",
            "reasons": [
                "Exposes unstated corporate psychology",
                "Reframes pitch narrative from performance to personal career safety",
                "High utility for B2B sales reps and founders"
            ],
            "score_breakdown": {
                "hook_strength": 9.0, "emotional_arousal": 8.3, "information_density": 9.2,
                "standalone_clarity": 9.3, "novelty": 8.6, "controversy": 8.4,
                "storytelling": 8.7, "retention_probability": 8.8
            },
            "overall_score": 8.7,
            "evidence_quote": "Enterprise procurement officers do not care about your precision or recall metrics. They care about one thing: will buying your software get them fired?",
            "status": "accepted"
        },
        {
            "id": "clip_8",
            "title": "Sell the Shield, Never the Sword",
            "start_time": 1540.0, "end_time": 1598.0, "duration": 58.0,
            "hook_line": "Fear of loss moves enterprise budgets 10x faster than ambition for upside. Pitch the compliance shield.",
            "reasons": [
                "Clean behavioral economics framing (loss aversion multiplier)",
                "Instantly applicable positioning shift",
                "Memorable conceptual metaphor (shield vs sword)"
            ],
            "score_breakdown": {
                "hook_strength": 8.8, "emotional_arousal": 8.1, "information_density": 9.1,
                "standalone_clarity": 9.2, "novelty": 8.4, "controversy": 8.1,
                "storytelling": 8.5, "retention_probability": 8.6
            },
            "overall_score": 8.6,
            "evidence_quote": "Fear of loss drives enterprise budget ten times faster than ambition for upside.",
            "status": "accepted"
        },
        {
            "id": "clip_9",
            "title": "The Multi-Million Dollar Moat Delusion",
            "start_time": 2010.0, "end_time": 2068.0, "duration": 58.0,
            "hook_line": "Open weights will commoditize your fine-tuned model in 18 months. Your real moat is workflow glue.",
            "reasons": [
                "Contrarian critique of prevailing AI investor pitch decks",
                "Accurate technical prediction grounded in open source velocity",
                "Clear distinction between technology and defensible business architecture"
            ],
            "score_breakdown": {
                "hook_strength": 8.9, "emotional_arousal": 8.5, "information_density": 9.4,
                "standalone_clarity": 8.9, "novelty": 9.2, "controversy": 9.3,
                "storytelling": 8.4, "retention_probability": 8.9
            },
            "overall_score": 8.9,
            "evidence_quote": "In two years, open weights will match frontier models for eighty percent of vertical tasks. Your moat is the messy workflow integration.",
            "status": "accepted"
        },
        {
            "id": "clip_10",
            "title": "The Monday Morning Retention Test",
            "start_time": 2120.0, "end_time": 2178.0, "duration": 58.0,
            "hook_line": "If uninstalling your app doesn't break someone's 9 AM routine, you don't have a product—you have a bookmark.",
            "reasons": [
                "Vivid, memorable diagnostic test for PMF",
                "High organic shareability across product circles",
                "Brutal self-evaluation tool for builders"
            ],
            "score_breakdown": {
                "hook_strength": 9.3, "emotional_arousal": 8.8, "information_density": 8.9,
                "standalone_clarity": 9.5, "novelty": 8.9, "controversy": 8.6,
                "storytelling": 9.0, "retention_probability": 9.1
            },
            "overall_score": 9.0,
            "evidence_quote": "If taking your tool out of their daily workflow doesn't break at least two people's morning routine, you have no moat.",
            "status": "accepted"
        },
        {
            "id": "clip_11",
            "title": "Out-Shipping Big Tech Aircraft Carriers",
            "start_time": 2440.0, "end_time": 2505.0, "duration": 65.0,
            "hook_line": "Google and Microsoft move like aircraft carriers. Ship 4 cycles before their committee can schedule a kickoff.",
            "reasons": [
                "Classic David vs Goliath founder inspiration",
                "Tactical operational cadence comparison",
                "Reassuring competitive doctrine for early startups"
            ],
            "score_breakdown": {
                "hook_strength": 9.1, "emotional_arousal": 9.2, "information_density": 8.4,
                "standalone_clarity": 9.1, "novelty": 8.2, "controversy": 8.0,
                "storytelling": 9.3, "retention_probability": 8.9
            },
            "overall_score": 8.8,
            "evidence_quote": "Big tech moves with the agility of an aircraft carrier. By the time their committee approves an AI feature roadmap, you should have shipped it.",
            "status": "accepted"
        },
        {
            "id": "clip_12",
            "title": "The Brutal Math of Founder Survival",
            "start_time": 2510.0, "end_time": 2568.0, "duration": 58.0,
            "hook_line": "Startups rarely die from competition. They die from spending 6 months building what nobody was willing to pay $1k for.",
            "reasons": [
                "Universal startup post-mortem reality",
                "Forces commercial validation ahead of technical vanity",
                "Strong closing hook for founder audiences"
            ],
            "score_breakdown": {
                "hook_strength": 8.7, "emotional_arousal": 8.4, "information_density": 8.9,
                "standalone_clarity": 9.2, "novelty": 8.3, "controversy": 7.9,
                "storytelling": 8.8, "retention_probability": 8.7
            },
            "overall_score": 8.5,
            "evidence_quote": "Startups rarely die from competition. They die from building what nobody was willing to pay for.",
            "status": "suggested"
        }
    ]

    for clip in clips_raw:
        if engine == "postgres":
            cur.execute("""
                INSERT INTO clips (id, project_id, title, start_time, end_time, duration, hook_line, reasons, score_breakdown, overall_score, evidence_quote, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s, %s, %s, NOW());
            """, (
                clip["id"], project_id, clip["title"], clip["start_time"], clip["end_time"], clip["duration"],
                clip["hook_line"], format_json(clip["reasons"], engine), format_json(clip["score_breakdown"], engine),
                clip["overall_score"], clip["evidence_quote"], clip["status"]
            ))
        else:
            cur.execute("""
                INSERT INTO clips (id, project_id, title, start_time, end_time, duration, hook_line, reasons, score_breakdown, overall_score, evidence_quote, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));
            """, (
                clip["id"], project_id, clip["title"], clip["start_time"], clip["end_time"], clip["duration"],
                clip["hook_line"], format_json(clip["reasons"], engine), format_json(clip["score_breakdown"], engine),
                clip["overall_score"], clip["evidence_quote"], clip["status"]
            ))

    print(f"  ✓ {len(clips_raw)} Clips seeded with 8-signal scoring & reasons")

    # 7. Platform Variants (12 clips * 5 platforms = 60 variants)
    platforms = [
        ("linkedin", {
            "tone": "executive, structured, analytical, data-first",
            "hashtags": ["#SaaS", "#Startups", "#UnitEconomics", "#Founders"],
            "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below."
        }),
        ("instagram_reels", {
            "tone": "kinetic, visually captioned, emotionally intense",
            "hashtags": ["#startuplessons", "#techfounder", "#entrepreneurship", "#ai"],
            "cta": "Share this with a founder who needs to audit their OpenAI bill."
        }),
        ("youtube_shorts", {
            "tone": "fast hook, problem-solution arc, subscribing incentive",
            "hashtags": ["#Shorts", "#StartupLife", "#TechNews", "#AIStartup"],
            "cta": "Subscribe for the full 45-minute breakdown on Ep. 42."
        }),
        ("twitter", {
            "tone": "punchy, fragmented, zero fluff, contrarian stance",
            "hashtags": ["#buildinpublic", "#ai"],
            "cta": "Retweet the top tweet if you survived the $50k MRR valley."
        }),
        ("tiktok", {
            "tone": "conversational, unfiltered, rapid-fire pacing",
            "hashtags": ["#tech", "#softwareengineer", "#coding", "#startupstory"],
            "cta": "Follow for unfiltered founder post-mortems every Tuesday."
        })
    ]

    variant_count = 0
    edited_variant_ids = ["var_clip_1_linkedin", "var_clip_1_twitter", "var_clip_2_linkedin", "var_clip_4_linkedin", "var_clip_6_linkedin", "var_clip_10_twitter"]

    for clip in clips_raw:
        for p_name, p_meta in platforms:
            vid = f"var_{clip['id']}_{p_name}"
            is_ed = vid in edited_variant_ids

            if p_name == "linkedin":
                hook = f"{clip['hook_line']}"
                caption = (
                    f"{clip['hook_line']}\n\n"
                    f"Here is what happened on our path to $4M ARR:\n\n"
                    f"1. Early traction disguised fatal unit economics.\n"
                    f"2. {clip['evidence_quote']}\n"
                    f"3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\n"
                    f"Takeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit—you found a subsidized distribution leak.\n\n"
                    f"{p_meta['cta']}"
                )
                on_screen = f"THE $50K MRR TRAP: {clip['title'].upper()}"
            elif p_name == "twitter":
                hook = clip["hook_line"]
                caption = (
                    f"{clip['hook_line']}\n\n"
                    f"A painful lesson from scaling Arcus to $4M ARR:\n\n"
                    f"• Top line: $50k MRR\n"
                    f"• Compute: $42k/mo\n"
                    f"• Net sanity: 0\n\n"
                    f"Stop building consultancies with API keys. Fix margins first."
                )
                on_screen = f"WHY 90% DIE AT $50K MRR"
            elif p_name == "instagram_reels":
                hook = f"Wait... our OpenAI bill was HOW much?!"
                caption = f"{clip['hook_line']}\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast."
                on_screen = f"OPENAI BILL: $42,000 / MO"
            elif p_name == "youtube_shorts":
                hook = clip["hook_line"]
                caption = f"{clip['title']} — Founder Marcus Vance breaks down the unit economics of AI software."
                on_screen = f"THE 70% MARGIN RULE"
            else:  # tiktok
                hook = f"If you're building an AI startup, hear this right now."
                caption = f"The $42k bill that almost shut our doors. Don't make this mistake."
                on_screen = f"HOW WE ALMOST WENT BROKE AT $50K MRR"

            voice_score = 0.94 if is_ed else round(random.uniform(0.87, 0.93), 2)
            final_txt = caption if not is_ed else caption.replace("Here is what happened", "The brutal reality").replace("disguised fatal", "masked terminal")

            if engine == "postgres":
                cur.execute("""
                    INSERT INTO platform_variants (id, clip_id, platform, hook, caption, hashtags, cta, on_screen_text, voice_match_score, is_edited, final_text)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    vid, clip["id"], p_name, hook, caption, format_array(p_meta["hashtags"], engine),
                    p_meta["cta"], on_screen, voice_score, is_ed, final_txt
                ))
            else:
                cur.execute("""
                    INSERT INTO platform_variants (id, clip_id, platform, hook, caption, hashtags, cta, on_screen_text, voice_match_score, is_edited, final_text)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    vid, clip["id"], p_name, hook, caption, format_array(p_meta["hashtags"], engine),
                    p_meta["cta"], on_screen, voice_score, 1 if is_ed else 0, final_txt
                ))
            variant_count += 1

    print(f"  ✓ {variant_count} Platform variants generated (5 per clip across LinkedIn, Reels, Shorts, X, TikTok)")

    # 8. Voice Profile (v2)
    profile_id = "vp_founder_files"
    tone_attrs = {
        "formality": 4,
        "punchiness": 9,
        "data_density": 8,
        "emoji_tolerance": 1,
        "banned_phrases": [
            "In today's fast-paced world",
            "game-changer",
            "delve into",
            "unlock the power of",
            "synergies"
        ],
        "preferred_structure": "Lead with specific number/loss metric -> 2-3 bullet point autopsy -> single provocative debate question",
        "primary_perspective": "first-person battle-tested operator"
    }
    if engine == "postgres":
        cur.execute("""
            INSERT INTO voice_profiles (id, project_id, version, summary, tone_attributes, created_at)
            VALUES (%s, %s, %s, %s, %s::jsonb, NOW());
        """, (profile_id, project_id, 2, "Sharp, metric-driven founder voice. Zero corporate throat-clearing, anti-buzzword, loss-framed unit economics.", format_json(tone_attrs, engine)))
    else:
        cur.execute("""
            INSERT INTO voice_profiles (id, project_id, version, summary, tone_attributes, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'));
        """, (profile_id, project_id, 2, "Sharp, metric-driven founder voice. Zero corporate throat-clearing, anti-buzzword, loss-framed unit economics.", format_json(tone_attrs, engine)))

    print("  ✓ Voice Profile v2 established")

    # 9. Voice Rules (6 active rules extracted from creator edits)
    voice_rules_data = [
        ("vrule_1", "Drop opening throat-clearing ('In today's fast-paced world', 'It's no secret that...'). Always lead directly with an exact dollar figure or shocking unit metric.", 0.98, {"diff_type": "deletion", "trigger": "rhetorical intro", "rule": "lead_with_data"}, "opening_hooks"),
        ("vrule_2", "Zero emojis in the first 3 lines of LinkedIn posts. Maximum 1 bookmark or arrow emoji permitted at the footer.", 0.95, {"diff_type": "replacement", "before": "🚀 Big news founders! 🔥", "after": "At $50k MRR, our compute bill was $42,000."}, "formatting"),
        ("vrule_3", "Convert passive corporate generalities into first-person founder war stories ('Mistakes were made' -> 'We burned $42k in 30 days').", 0.94, {"diff_type": "active_voice_shift", "original": "Unit economics should be monitored", "revised": "We almost died because our margins were 16%"}, "perspective"),
        ("vrule_4", "On Twitter/X, format takeaways as single-sentence punches under 16 words. Enforce blank line between every sentence.", 0.96, {"diff_type": "formatting", "line_length_max": 16, "stanza_break": True}, "syntax"),
        ("vrule_5", "Replace AI buzzwords ('groundbreaking AI', 'supercharge workflows') with tangible operational mechanics ('gross margins', 'churn decay', 'audit cycles').", 0.92, {"diff_type": "lexical_substitution", "banned": ["game-changer", "supercharge"], "preferred": ["gross margins", "closed audit"]}, "vocabulary"),
        ("vrule_6", "End posts with an open, high-stakes debate prompt ('What's your minimum margin floor?') instead of passive engagement bait ('Agree? Let me know below!').", 0.97, {"diff_type": "cta_overhaul", "banned_cta": "Thoughts? Agree?", "preferred_cta": "Disagree? What's your floor?"}, "closing_cta"),
    ]
    for rid, rtext, conf, ev_diff, cat in voice_rules_data:
        if engine == "postgres":
            cur.execute("""
                INSERT INTO voice_rules (id, profile_id, rule_text, confidence, evidence_diff, category, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s::jsonb, %s, TRUE, NOW());
            """, (rid, profile_id, rtext, conf, format_json(ev_diff, engine), cat))
        else:
            cur.execute("""
                INSERT INTO voice_rules (id, profile_id, rule_text, confidence, evidence_diff, category, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'));
            """, (rid, profile_id, rtext, conf, format_json(ev_diff, engine), cat))

    print(f"  ✓ {len(voice_rules_data)} Active Voice Rules loaded with diff evidence")

    # 10. Voice Examples (6 before/after edit histories)
    voice_examples_data = [
        (
            "vex_1", "linkedin",
            "🚀 In today's competitive tech ecosystem, startup founders often struggle with profitability! 💡 We found that compute expenses can be quite challenging when scaling AI solutions.",
            "At $50k MRR, our compute bill was $42,000. We were effectively subsidizing Fortune 500 pilots on our personal credit cards.",
            "Removed 3 emojis, deleted rhetorical question, substituted generic advice with specific $42k personal credit card war story."
        ),
        (
            "vex_2", "twitter",
            "Are you excited about generative AI? 🤖 Many startups are discovering that gross margins are super important for software companies!",
            "If your gross margin is under 70%, you didn't build software.\n\nYou built a glorified consultancy with an API key.",
            "Converted question hook into definitive declarative assertion; split into two single-sentence punches."
        ),
        (
            "vex_3", "linkedin",
            "Here is why you should always strive to provide value-based pricing rather than charging based on input tokens or queries. What do you think? Drop a comment!",
            "Never charge per token. When we switched from $0.10/query to $5,000/closed audit, conversion doubled overnight.\n\nDisagree? What is your pricing floor?",
            "Removed passive call to action; grounded in $5k metric; replaced 'thoughts?' with sharp binary debate."
        ),
        (
            "vex_4", "linkedin",
            "Customer success is the cornerstone of any great business! Today we want to discuss how difficult it can be to say goodbye to early users who are no longer aligned.",
            "We fired 12 customers in one afternoon. Our team wept. Three months later, ACV jumped from $80 to $14,000.",
            "Replaced corporate greeting with visceral action verb ('fired 12 customers'); quantified exact ACV transformation."
        ),
        (
            "vex_5", "twitter",
            "Big enterprise companies have very complex procurement processes that take lots of time and effort to navigate! Make sure your team is prepared.",
            "Enterprise buyers don't care about your F1 score.\n\nThey care whether buying your software will get them fired.\n\nSell the compliance shield.",
            "Eliminated fluff; established stark contrast between engineering vanity metric (F1 score) and executive career fear."
        ),
        (
            "vex_6", "twitter",
            "Defensibility in AI is a hot topic among Silicon Valley investors. Is your model really defensible, or could open source catch up soon?",
            "Open weights will commoditize your fine-tuned model in 18 months.\n\nYour moat isn't weights.\nIt's the messy workflow glue.",
            "Changed rhetorical question into authoritative timeline prediction ('18 months'); shortened syntax."
        ),
    ]

    for idx, (ex_id, plt, draft, final, diff) in enumerate(voice_examples_data):
        vec = mock_embedding(idx + 500)
        vec_formatted = format_vector(vec, engine)
        if engine == "postgres":
            cur.execute("""
                INSERT INTO voice_examples (id, profile_id, platform, ai_draft, creator_final, diff_summary, embedding, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s::vector, NOW());
            """, (ex_id, profile_id, plt, draft, final, diff, vec_formatted))
        else:
            cur.execute("""
                INSERT INTO voice_examples (id, profile_id, platform, ai_draft, creator_final, diff_summary, embedding, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));
            """, (ex_id, profile_id, plt, draft, final, diff, vec_formatted))

    print(f"  ✓ {len(voice_examples_data)} Voice Edit Histories recorded with diff analysis & embeddings")

    # 11. Brand Kit
    brand_kit_id = "bkit_founder_files"
    palette = ["#0F172A", "#6366F1", "#10B981", "#F59E0B", "#F8FAFC"]
    tagline = "The unfiltered autopsy of what actually builds venture-scale AI companies."
    typo_notes = "Display: Syne (800 weight, uppercase tracking +0.05em); Subtitles: Plus Jakarta Sans (SemiBold); Body: Inter (Regular 400)."
    visual_notes = "Dark slate background (#0F172A) with high-contrast electric indigo (#6366F1) card borders. Accent emerald (#10B981) for positive metrics, amber (#F59E0B) for alert stats. 9:16 vertical overlay with dark radial vignette and neon pill badges."
    voice_notes = "Direct, analytical, battle-hardened. Zero superficial hustle jargon. Focus on unit economics, real churn, and customer psychology."

    if engine == "postgres":
        cur.execute("""
            INSERT INTO brand_kits (id, project_id, name, tagline, palette_hex, typography_notes, visual_style_notes, voice_notes, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW());
        """, (brand_kit_id, project_id, "The Founder Files", tagline, format_array(palette, engine), typo_notes, visual_notes, voice_notes))
    else:
        cur.execute("""
            INSERT INTO brand_kits (id, project_id, name, tagline, palette_hex, typography_notes, visual_style_notes, voice_notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));
        """, (brand_kit_id, project_id, "The Founder Files", tagline, format_array(palette, engine), typo_notes, visual_notes, voice_notes))

    print("  ✓ Brand Kit established (palette, typography, visual style)")

    # 12. Calendar Items (IST scheduling)
    # Next 7 days starting from base
    base_time = datetime(2026, 11, 2, 8, 30, tzinfo=timezone(timedelta(hours=5, minutes=30)))
    calendar_entries = [
        ("cal_1", "clip_1", "var_clip_1_linkedin", "linkedin", base_time, "scheduled", "Optimal Monday morning executive commute window in IST (08:30 AM). Number-led hook matches historic peak engagement."),
        ("cal_2", "clip_1", "var_clip_1_twitter", "twitter", base_time + timedelta(hours=3), "scheduled", "Mid-day tech discussion slot on X (11:30 AM IST)."),
        ("cal_3", "clip_2", "var_clip_2_instagram_reels", "instagram_reels", base_time + timedelta(hours=10), "scheduled", "Evening mobile browse peak for startup creators (06:30 PM IST)."),
        ("cal_4", "clip_4", "var_clip_4_linkedin", "linkedin", base_time + timedelta(days=1), "scheduled", "Tuesday B2B thought-leadership slot. High share-rate window."),
        ("cal_5", "clip_6", "var_clip_6_twitter", "twitter", base_time + timedelta(days=1, hours=4), "scheduled", "Contrarian founder war story slot."),
        ("cal_6", "clip_3", "var_clip_3_youtube_shorts", "youtube_shorts", base_time + timedelta(days=2, hours=9), "scheduled", "Mid-week developer tutorial peak."),
        ("cal_7", "clip_10", "var_clip_10_linkedin", "linkedin", base_time + timedelta(days=3), "scheduled", "Thursday strategy deep-dive slot."),
    ]
    for cid, clp_id, var_id, plt, sched_dt, st, rsn in calendar_entries:
        sched_str = sched_dt.isoformat()
        if engine == "postgres":
            cur.execute("""
                INSERT INTO calendar_items (id, project_id, clip_id, variant_id, platform, scheduled_for, status, slot_reason)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """, (cid, project_id, clp_id, var_id, plt, sched_str, st, rsn))
        else:
            cur.execute("""
                INSERT INTO calendar_items (id, project_id, clip_id, variant_id, platform, scheduled_for, status, slot_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (cid, project_id, clp_id, var_id, plt, sched_str, st, rsn))

    print(f"  ✓ {len(calendar_entries)} Calendar items scheduled with IST slots and rationale")

    # 13. Performance Logs & Post Features (35 realistic records with clear statistical divergence)
    # Number-led hooks in morning IST significantly beat question hooks in afternoon
    hook_types = ["number", "contrarian", "storytelling", "question"]
    time_slots = ["morning_ist", "afternoon_ist", "evening_ist"]
    platforms_pool = ["linkedin", "twitter", "instagram_reels", "youtube_shorts", "tiktok"]

    perf_logs_count = 35
    rng = random.Random(42)

    for i in range(1, perf_logs_count + 1):
        log_id = f"perf_log_{i:03d}"
        post_id = f"post_ext_{1000 + i}"
        
        # Bias assignment to create strong statistical signal
        if i <= 14:
            h_type = "number"
            t_slot = "morning_ist" if i % 2 == 0 else "evening_ist"
            base_views = rng.randint(18000, 45000)
            eng_rate = rng.uniform(0.038, 0.054)  # ~4.6% engagement
        elif i <= 23:
            h_type = "contrarian"
            t_slot = "evening_ist" if i % 2 == 0 else "morning_ist"
            base_views = rng.randint(12000, 28000)
            eng_rate = rng.uniform(0.030, 0.042)  # ~3.6% engagement
        elif i <= 29:
            h_type = "storytelling"
            t_slot = "morning_ist"
            base_views = rng.randint(14000, 32000)
            eng_rate = rng.uniform(0.028, 0.039)  # ~3.3% engagement
        else:
            h_type = "question"
            t_slot = "afternoon_ist"
            base_views = rng.randint(4000, 11000)
            eng_rate = rng.uniform(0.012, 0.021)  # ~1.7% engagement (underperformer)

        plt = platforms_pool[(i - 1) % len(platforms_pool)]
        views = base_views
        total_eng = int(views * eng_rate)
        likes = int(total_eng * 0.70)
        comments = int(total_eng * 0.12)
        shares = int(total_eng * 0.10)
        saves = int(total_eng * 0.08)
        retention = round(rng.uniform(62.0, 78.0) if h_type in ["number", "contrarian"] else rng.uniform(38.0, 52.0), 1)
        followers = int(shares * 0.35 + likes * 0.02)
        score = round(eng_rate * 100, 2)
        log_created = (datetime.now(timezone.utc) - timedelta(days=(36 - i))).isoformat()

        if engine == "postgres":
            cur.execute("""
                INSERT INTO performance_logs (id, project_id, post_id, platform, views, likes, comments, shares, saves, retention_pct, followers_gained, engagement_score, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (log_id, project_id, post_id, plt, views, likes, comments, shares, saves, retention, followers, score, log_created))

            cur.execute("""
                INSERT INTO post_features (id, log_id, hook_type, length_bucket, topic, time_slot, day_of_week)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (
                f"feat_{log_id}", log_id, h_type,
                "medium_30-45s" if i % 2 == 0 else "short_<30s",
                "unit_economics" if i % 3 == 0 else "pricing_psychology",
                t_slot,
                ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][i % 5]
            ))
        else:
            cur.execute("""
                INSERT INTO performance_logs (id, project_id, post_id, platform, views, likes, comments, shares, saves, retention_pct, followers_gained, engagement_score, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (log_id, project_id, post_id, plt, views, likes, comments, shares, saves, retention, followers, score, log_created))

            cur.execute("""
                INSERT INTO post_features (id, log_id, hook_type, length_bucket, topic, time_slot, day_of_week)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (
                f"feat_{log_id}", log_id, h_type,
                "medium_30-45s" if i % 2 == 0 else "short_<30s",
                "unit_economics" if i % 3 == 0 else "pricing_psychology",
                t_slot,
                ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][i % 5]
            ))

    print(f"  ✓ {perf_logs_count} Performance logs & feature tags recorded with statistical divergence")

    # 14. Feature Weights (Pre-computed causal lifts)
    feature_weights_data = [
        ("fwt_1", "hook_type", "number", 1.48, 38.5, 14),
        ("fwt_2", "hook_type", "contrarian", 1.34, 27.2, 9),
        ("fwt_3", "hook_type", "storytelling", 1.15, 12.0, 6),
        ("fwt_4", "hook_type", "question", 0.79, -21.4, 6),
        ("fwt_5", "time_slot", "morning_ist", 1.28, 22.5, 16),
        ("fwt_6", "time_slot", "evening_ist", 1.06, 4.8, 11),
        ("fwt_7", "time_slot", "afternoon_ist", 0.72, -28.0, 8),
        ("fwt_8", "length_bucket", "medium_30-45s", 1.31, 24.0, 18),
        ("fwt_9", "length_bucket", "short_<30s", 1.05, 5.0, 14),
        ("fwt_10", "length_bucket", "long_>45s", 0.81, -19.0, 3),
    ]
    for fid, fname, fval, wt, lft, smp in feature_weights_data:
        if engine == "postgres":
            cur.execute("""
                INSERT INTO feature_weights (id, project_id, feature_name, feature_value, weight, lift_pct, sample_count, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW());
            """, (fid, project_id, fname, fval, wt, lft, smp))
        else:
            cur.execute("""
                INSERT INTO feature_weights (id, project_id, feature_name, feature_value, weight, lift_pct, sample_count, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));
            """, (fid, project_id, fname, fval, wt, lft, smp))

    print(f"  ✓ {len(feature_weights_data)} Feature Weights updated with exponential decay values")

    # 15. Insights (Causal narrative takeaways)
    insights_data = [
        ("ins_1", "Number-Led Hooks Drive 2.4x Higher Engagement", "Posts leading with specific dollar amounts or percentage margins averaged 4.6% engagement vs 1.9% for question hooks.", "+38.5% lift", "Condition AI copy engine to lead with financial unit metrics on LinkedIn and X."),
        ("ins_2", "Morning IST Commute Window Dominates B2B Reach", "Scheduling posts at 08:30 AM IST yielded 3.1x more organic shares than 02:00 PM IST across tech founder demographics.", "+22.5% lift", "Auto-slot top 3 weekly clips into Monday-Wednesday 08:30 IST calendar slots."),
        ("ins_3", "30-45s Duration Retains 68% Viewers on Reels", "Clips in the 30-45s bracket maintain strong visual pacing, whereas clips exceeding 50s experience a 41% drop-off at second 32.", "+24.0% lift", "Set clip selection engine duration ceiling to 45s for vertical video exports."),
        ("ins_4", "Contrarian Framing Generates 5x Comment Density", "Challenging mainstream dogma (e.g., 'cost-plus pricing is suicide') spurred extended executive debate in comments.", "+27.2% lift", "Incorporate contrarian debate CTAs in all Friday afternoon drops."),
    ]
    for iid, ttl, desc, lift, rec in insights_data:
        if engine == "postgres":
            cur.execute("""
                INSERT INTO insights (id, project_id, title, description, metric_lift, recommendation, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW());
            """, (iid, project_id, ttl, desc, lift, rec))
        else:
            cur.execute("""
                INSERT INTO insights (id, project_id, title, description, metric_lift, recommendation, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'));
            """, (iid, project_id, ttl, desc, lift, rec))

    print(f"  ✓ {len(insights_data)} Plain-language causal insights generated")

    # 16. Scraped Posts (Cached cold start data)
    scraped_data = [
        ("scraped_1", "linkedin", "marcus-vance", "https://linkedin.com/posts/marcus-vance-491", "We almost went bankrupt at $50k MRR because compute cost $42k. Software without gross margin is just unpaid consulting.", ["https://images.unsplash.com/photo-1551836022-d5d88e9218df"], 1420, 184, "2026-10-15T08:30:00Z"),
        ("scraped_2", "linkedin", "marcus-vance", "https://linkedin.com/posts/marcus-vance-492", "Firing your first 10 customers is the hardest thing you'll ever do. It's also the only reason Arcus survived to $4M ARR.", ["https://images.unsplash.com/photo-1460925895917-afdab827c52f"], 980, 112, "2026-10-18T08:30:00Z"),
        ("scraped_3", "instagram", "@founderfiles", "https://instagram.com/p/DB1234", "The 70% Gross Margin rule every AI founder needs to tattoo on their forehead.", ["https://images.unsplash.com/photo-1559136555-9303baea8ebd"], 3410, 245, "2026-10-21T18:30:00Z"),
    ]
    for scid, plt, hndl, url, txt, murls, lks, cmts, pdt in scraped_data:
        if engine == "postgres":
            cur.execute("""
                INSERT INTO scraped_posts (id, project_id, platform, handle, post_url, text, media_urls, likes, comments, posted_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (scid, project_id, plt, hndl, url, txt, format_array(murls, engine), lks, cmts, pdt))
        else:
            cur.execute("""
                INSERT INTO scraped_posts (id, project_id, platform, handle, post_url, text, media_urls, likes, comments, posted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (scid, project_id, plt, hndl, url, txt, format_array(murls, engine), lks, cmts, pdt))

    print(f"  ✓ {len(scraped_data)} Cached scraped social posts saved")

    # 17. LLM Calls (Audit logging)
    llm_logs = [
        ("llm_1", "huggingface", "extract_clip_candidates", 412.5, False, True),
        ("llm_2", "huggingface", "score_clip_8_signals", 580.2, False, True),
        ("llm_3", "gemini-2.0-flash", "generate_platform_variants", 340.0, True, True),
        ("llm_4", "huggingface", "diff_edit_rules", 295.8, False, True),
        ("llm_5", "huggingface", "compute_feature_lift", 210.4, False, True),
    ]
    for lid, prov, tsk, lat, fb, succ in llm_logs:
        if engine == "postgres":
            cur.execute("""
                INSERT INTO llm_calls (id, timestamp, provider, task, latency_ms, fallback_used, success)
                VALUES (%s, NOW(), %s, %s, %s, %s, %s);
            """, (lid, prov, tsk, lat, fb, succ))
        else:
            cur.execute("""
                INSERT INTO llm_calls (id, timestamp, provider, task, latency_ms, fallback_used, success)
                VALUES (?, datetime('now'), ?, ?, ?, ?, ?);
            """, (lid, prov, tsk, lat, 1 if fb else 0, 1 if succ else 0))

    print(f"  ✓ {len(llm_logs)} LLM Router telemetry logs written")

    if engine == "sqlite":
        conn.commit()

    print("\n=======================================================")
    print("✅ REEL DEMO SEEDING COMPLETED SUCCESSFULLY!")
    print(f"Project: {project_name}")
    print(f"Summary: ~45min podcast, {len(clips_raw)} clips, {variant_count} platform variants,")
    print(f"         {len(voice_rules_data)} voice rules, {len(voice_examples_data)} edit histories,")
    print(f"         {perf_logs_count} performance logs, {len(feature_weights_data)} feature weights, {len(insights_data)} insights.")
    print("=======================================================")
    conn.close()


if __name__ == "__main__":
    seed_database()
