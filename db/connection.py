"""
Database Connection & Engine Factory for Reel
Provides unified SQLAlchemy engine and session makers with automatic SQLite fallback.
"""

import os
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Load .env if present
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

SQLITE_PATH = Path(__file__).resolve().parent / "reel.db"


def get_engine():
    raw_url = os.getenv("DATABASE_URL", "").strip()

    if raw_url and (raw_url.startswith("postgresql://") or raw_url.startswith("postgres://")):
        # Normalise postgres:// -> postgresql:// for SQLAlchemy
        if raw_url.startswith("postgres://"):
            raw_url = raw_url.replace("postgres://", "postgresql://", 1)
        try:
            engine = create_engine(raw_url, pool_pre_ping=True)
            # Test connection
            with engine.connect() as conn:
                pass
            return engine
        except Exception as e:
            print(f"[db] Warning: Could not connect to Postgres ({e}). Using SQLite fallback.")

    sqlite_url = f"sqlite:///{SQLITE_PATH}"
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
