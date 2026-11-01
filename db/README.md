# Reel Database Layer (`/db`)

This directory houses the schema definitions, migration runner, and seeding scripts for **Reel**.

## Architecture & Capabilities

- **Postgres + pgvector Ready:** Targeted for Neon Serverless Postgres with `vector(384)` embeddings and JSONB columns.
- **Instant Offline Fallback:** Automatic zero-config fallback to SQLite (`db/reel.db`) whenever `DATABASE_URL` is empty, offline, or inaccessible.
- **Unified Engine Access:** `db/connection.py` provides SQLAlchemy `engine`, `SessionLocal`, and FastAPI `get_db` dependency.

---

## Files

- `schema.sql`: Full DDL defining 21 tables (all 18 core tables + 3 supporting workflow tables), indexes, and constraints.
- `migrate.py`: Migration runner that executes `schema.sql` against Postgres (via `psycopg` / `psycopg2`) or translates DDL on the fly for SQLite. Verifies that all expected tables exist.
- `seed_data.py`: Populates the complete demo dataset for _"The Founder Files - Ep. 42: Why 90% of AI Startups Die at $50k MRR"_:
  - ~45 min podcast transcript (Host: Sarah Chen, Guest: Marcus Vance)
  - 6 timed chapters & 12 transcript segments with 384-d embeddings
  - 12 high-conviction clips with 8-signal scoring breakdowns & evidence quotes
  - 60 platform variants (5 platforms: LinkedIn, Instagram Reels, YouTube Shorts, X/Twitter, TikTok)
  - 1 Voice Profile (v2) with 6 active learned rules and evidence diffs
  - 6 Voice Edit Histories (AI draft vs creator final with diff summaries & embeddings)
  - 1 Brand Kit (Dark slate / electric indigo / emerald palette, typography guidelines)
  - 7 Scheduled Calendar items in IST
  - 35 Performance Logs with statistically significant hook type and time-of-day lift
  - 10 Pre-computed Feature Weights & 4 plain-language causal insights
  - 3 Cached scraped social posts
  - 5 LLM Router audit records
- `connection.py`: SQLAlchemy session provider.
- `reel.db`: Pre-seeded SQLite database for immediate offline usage.

---

## Commands

### Run Migrations

```bash
python3 db/migrate.py
```

### Seed Demo Dataset

```bash
python3 db/seed_data.py
```
