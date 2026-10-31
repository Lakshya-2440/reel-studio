from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.jobs import router as jobs_router
from app.api.stubs import router as stubs_router
from app.clips.router import router as clips_router
from app.copy.router import router as copy_router
from app.ingest.router import router as ingest_router
from app.performance.router import router as performance_router

api_router = APIRouter()

# Mount core health probe
api_router.include_router(health_router)

# Mount background job runner and SSE broadcaster
api_router.include_router(jobs_router)

# Mount Ingestion Pipeline (Req 1)
api_router.include_router(ingest_router)

# Mount Clip Finder and 8-Signal Scoring Engine (Req 2)
api_router.include_router(clips_router)

# Mount Platform Copy Engine (Req 3)
api_router.include_router(copy_router)

# Mount Performance Feedback Loop (Req 6)
api_router.include_router(performance_router)

# Mount LLM debug router (from llm-router module) if available
try:
    from app.api.debug import router as debug_router
    api_router.include_router(debug_router)
except ImportError:
    pass

# Mount PRD section 9 endpoint stubs
api_router.include_router(stubs_router)
