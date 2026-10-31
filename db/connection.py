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
    root_env = Path(__file__).resolve().parent.parent / ".env"
    backend_env = Path(__file__).resolve().parent.parent / "backend" / ".env"
    if root_env.exists():
        load_dotenv(root_env)
    elif backend_env.exists():
        load_dotenv(backend_env)
except ImportError:
    pass

SQLITE_PATH = Path(__file__).resolve().parent / "reel.db"


def get_engine():
    raw_url = os.getenv("DATABASE_URL", "").strip()

    if raw_url and (raw_url.startswith("postgresql://") or raw_url.startswith("postgres://") or raw_url.startswith("postgresql+")):
        # Normalise postgres:// -> postgresql:// for SQLAlchemy
        if raw_url.startswith("postgres://"):
            raw_url = raw_url.replace("postgres://", "postgresql://", 1)
        if raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
            try:
                import psycopg
                raw_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
            except ImportError:
                pass
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
