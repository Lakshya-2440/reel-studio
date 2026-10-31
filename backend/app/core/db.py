"""
Database connection accessor for backend app.
Wraps /db/connection.py with robust path resolution and fallback.
"""

import sys
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add repo root to sys.path so 'db' package can be imported
repo_root = Path(__file__).resolve().parents[3]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

try:
    from db.connection import engine as db_engine, SessionLocal as db_SessionLocal, get_db as db_get_db
    engine = db_engine
    SessionLocal = db_SessionLocal
    get_db = db_get_db
except ImportError:
    # Direct fallback if running in container or isolated directory
    sqlite_path = repo_root / "db" / "reel.db"
    sqlite_url = f"sqlite:///{sqlite_path}"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def get_db() -> Generator[Session, None, None]:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

__all__ = ["engine", "SessionLocal", "get_db"]
