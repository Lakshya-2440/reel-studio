from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.jobs import job_manager

router = APIRouter()


# -----------------------------------------------------------------------------
# 1. Projects
# -----------------------------------------------------------------------------
class ProjectCreate(BaseModel):
    name: str = "The Founder Files — Ep. 42"


class ProjectResponse(BaseModel):
    id: str
    name: str
    created_at: str


@router.post("/projects", response_model=ProjectResponse, tags=["Projects"])
async def create_project(payload: ProjectCreate):
    """Create a new repurposing project."""
    return ProjectResponse(
        id="proj-demo-founder-42",
        name=payload.name,
        created_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
async def get_project(project_id: str):
    """Get project details."""
    return ProjectResponse(
        id=project_id,
        name="The Founder Files — Ep. 42",
        created_at=datetime.now(timezone.utc).isoformat(),
    )


# -----------------------------------------------------------------------------
# 2. Ingestion & Transcripts (Moved to real app.ingest.router)
# -----------------------------------------------------------------------------


# -----------------------------------------------------------------------------
# 3. Clips & Multi-Signal Scoring
# -----------------------------------------------------------------------------
class ClipFindRequest(BaseModel):
    project_id: str = "proj-demo-founder-42"
    min_duration: int = 25
    max_duration: int = 90


class ClipFeedbackRequest(BaseModel):
    reason: str = "Pacing too slow in opening 5 seconds"
    rating: Optional[int] = 3


# Note: Clip endpoints (/clips/find, /projects/{id}/clips, /clips/{id}, /clips/{id}/feedback)
# are implemented in app.clips.router (Req 2 Clip Selection with Reasons).


# -----------------------------------------------------------------------------
# 4. Copy Engine & Platform Variants (Implemented in app.copy.router)
# -----------------------------------------------------------------------------
class VariantUpdateRequest(BaseModel):
    creator_final: str
    instruction: Optional[str] = None

# Real implementations mounted via app.copy.router in app/api/router.py



# -----------------------------------------------------------------------------
# 5. Brand-Voice Memory (Implemented in app.memory)
# -----------------------------------------------------------------------------



# (Voice Intake /voice/interpret is mounted from app.voice.router)


# -----------------------------------------------------------------------------
# 7. Content Calendar
# -----------------------------------------------------------------------------
# 7. Calendar (Implemented in app.calendar.router)
# -----------------------------------------------------------------------------


# -----------------------------------------------------------------------------
# 8. Performance Feedback Loop (Implemented in app.performance.router)
# -----------------------------------------------------------------------------


# 9. Brand Identity & Scraper Adapter (Implemented in app.brand.router)
# -----------------------------------------------------------------------------


# (Debug router is provided by app.api.debug from llm-router)

