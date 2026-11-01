from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Reel - Content Repurposing Studio with Brand Memory API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Static file mount for rendered short-form video clips (9:16 MP4s)
static_dir = Path(__file__).resolve().parent.parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
(static_dir / "rendered_clips").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# CORS setup: allow localhost:3000, 127.0.0.1:3000, and *.vercel.app frontend deployments
allowed_origins = [
    origin for origin in settings.ALLOWED_ORIGINS
    if not origin.startswith("https://*") and not origin.startswith("http://*")
]
if "http://localhost:3000" not in allowed_origins:
    allowed_origins.append("http://localhost:3000")
if "http://127.0.0.1:3000" not in allowed_origins:
    allowed_origins.append("http://127.0.0.1:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root entrypoint with service metadata and documentation links."""
    return {
        "service": "the-content-company-backend",
        "description": "TheContentCompany - Content Repurposing Studio with Brand Memory",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health", tags=["Health"])
async def direct_health_check():
    """Top-level health check returning required signature."""
    return {
        "status": "ok",
        "service": "the-content-company-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Mount the complete API router
app.include_router(api_router)
