#!/usr/bin/env python3
"""
Reel Database Migration Runner
Supports:
  1. Neon Postgres (via DATABASE_URL)
  2. Local SQLite fallback (db/reel.db) when DATABASE_URL is unset/offline
"""

import os
import re
import sys
import sqlite3
from pathlib import Path
from typing import List, Tuple, Optional

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

SCHEMA_FILE = Path(__file__).resolve().parent / "schema.sql"
SQLITE_DB_FILE = Path(__file__).resolve().parent / "reel.db"

EXPECTED_TABLES = [
    "projects",
    "media_assets",
    "transcripts",
    "transcript_segments",
    "chapters",
    "clips",
    "platform_variants",
    "voice_profiles",
    "voice_rules",
    "voice_examples",
    "calendar_items",
    "performance_logs",
    "post_features",
    "feature_weights",
    "insights",
    "brand_kits",
    "scraped_posts",
    "llm_calls",
    "jobs",
    "voice_intakes",
    "clip_feedback",
]


def get_database_url() -> Optional[str]:
    url = os.getenv("DATABASE_URL", "").strip()
    return url if url else None


def is_postgres(url: Optional[str]) -> bool:
    if not url:
        return False
    return url.startswith("postgresql://") or url.startswith("postgres://")


def convert_pg_sql_to_sqlite(sql: str) -> str:
    """Translate PostgreSQL schema statements into SQLite compatible DDL."""
    lines = []
    for line in sql.splitlines():
        trimmed = line.strip()
        # Drop extension commands
        if trimmed.upper().startswith("CREATE EXTENSION"):
            continue
        # Drop vector index operations that SQLite doesn't understand
        if "USING hnsw" in line or "USING ivfflat" in line:
            continue

        # Data type conversions
        line = re.sub(r"vector\(\d+\)", "TEXT", line, flags=re.IGNORECASE)
        line = re.sub(r"::jsonb", "", line, flags=re.IGNORECASE)
        line = re.sub(r"\bJSONB\b", "TEXT", line, flags=re.IGNORECASE)
        line = re.sub(r"\bTEXT\[\]", "TEXT", line, flags=re.IGNORECASE)
        line = re.sub(r"\bTIMESTAMPTZ DEFAULT NOW\(\)", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", line, flags=re.IGNORECASE)
        line = re.sub(r"\bTIMESTAMPTZ\b", "TIMESTAMP", line, flags=re.IGNORECASE)
        line = re.sub(r"\bNOW\(\)", "CURRENT_TIMESTAMP", line, flags=re.IGNORECASE)
        line = re.sub(r"\bBOOLEAN DEFAULT TRUE\b", "INTEGER DEFAULT 1", line, flags=re.IGNORECASE)
        line = re.sub(r"\bBOOLEAN DEFAULT FALSE\b", "INTEGER DEFAULT 0", line, flags=re.IGNORECASE)
        line = re.sub(r"\bBOOLEAN\b", "INTEGER", line, flags=re.IGNORECASE)

        lines.append(line)

    return "\n".join(lines)


def run_migration_postgres(database_url: str) -> List[str]:
    """Execute schema against PostgreSQL / Neon."""
    print(f"[migrate] Connecting to PostgreSQL at {database_url.split('@')[-1] if '@' in database_url else 'specified host'}...")
    schema_sql = SCHEMA_FILE.read_text(encoding="utf-8")

    # Try psycopg or psycopg2
    try:
        import psycopg
        with psycopg.connect(database_url, autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(schema_sql)
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public';
                """)
                rows = cur.fetchall()
                return [r[0] for r in rows]
    except ImportError:
        try:
            import psycopg2
            conn = psycopg2.connect(database_url)
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute(schema_sql)
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public';
                """)
                rows = cur.fetchall()
                table_names = [r[0] for r in rows]
            conn.close()
            return table_names
        except Exception as e:
            raise RuntimeError(f"PostgreSQL connection/migration failed: {e}")


def run_migration_sqlite() -> List[str]:
    """Execute schema against local SQLite database."""
    print(f"[migrate] Using SQLite fallback at {SQLITE_DB_FILE}...")
    schema_sql = SCHEMA_FILE.read_text(encoding="utf-8")
    sqlite_sql = convert_pg_sql_to_sqlite(schema_sql)

    conn = sqlite3.connect(str(SQLITE_DB_FILE))
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys = ON;")
    cur.executescript(sqlite_sql)
    conn.commit()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    rows = cur.fetchall()
    table_names = [r[0] for r in rows]
    conn.close()
    return table_names


def run_migrations() -> Tuple[bool, str, List[str]]:
    """Run migrations on available engine."""
    db_url = get_database_url()
    backend_type = "postgres" if is_postgres(db_url) else "sqlite"

    if backend_type == "postgres":
        try:
            tables = run_migration_postgres(db_url)
            return True, "postgres", tables
        except Exception as err:
            print(f"[migrate] WARNING: PostgreSQL connection failed: {err}")
            print("[migrate] Falling back to SQLite for offline capability.")
            tables = run_migration_sqlite()
            return True, "sqlite", tables
    else:
        tables = run_migration_sqlite()
        return True, "sqlite", tables


def verify_tables(existing_tables: List[str]) -> bool:
    """Verify expected tables exist."""
    print(f"\n[migrate] Verifying tables (Found {len(existing_tables)} tables):")
    missing = []
    for t in EXPECTED_TABLES:
        if t in existing_tables:
            print(f"  ✓ {t}")
        else:
            print(f"  ✗ {t} (MISSING)")
            missing.append(t)

    if missing:
        print(f"\n[migrate] FAILED: Missing {len(missing)} tables: {missing}")
        return False

    print("\n[migrate] SUCCESS: All required tables exist and verified.")
    return True


if __name__ == "__main__":
    ok, engine_type, found_tables = run_migrations()
    print(f"[migrate] Engine: {engine_type.upper()}")
    if not verify_tables(found_tables):
        sys.exit(1)
    print("[migrate] Migration completed successfully.")
