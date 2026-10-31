import json
import logging
from typing import List
from fastapi import APIRouter, HTTPException, Query
from starlette.responses import StreamingResponse

from app.core.jobs import job_manager, Job, JobEvent

logger = logging.getLogger("reel.api.jobs")

router = APIRouter(prefix="/jobs", tags=["Jobs"])

try:
    from sse_starlette.sse import EventSourceResponse
    HAS_SSE_STARLETTE = True
except ImportError:
    EventSourceResponse = None
    HAS_SSE_STARLETTE = False


@router.get("", response_model=List[Job])
async def list_jobs(limit: int = Query(50, ge=1, le=100)):
    """List recent background jobs and their current statuses."""
    return job_manager.list_jobs(limit=limit)


@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: str):
    """Retrieve full details of a specific job by ID."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job


@router.get("/{job_id}/events")
async def stream_job_events(job_id: str):
    """Stream real-time Server-Sent Events (SSE) for job progression."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    if HAS_SSE_STARLETTE and EventSourceResponse is not None:
        async def sse_starlette_generator():
            async for event in job_manager.subscribe(job_id):
                yield {
                    "event": "progress" if event.status == "running" else "status",
                    "data": json.dumps(event.model_dump()),
                }

        return EventSourceResponse(sse_starlette_generator())

    # Pure Starlette StreamingResponse fallback
    async def raw_sse_generator():
        async for event in job_manager.subscribe(job_id):
            payload = json.dumps(event.model_dump())
            event_type = "progress" if event.status == "running" else "status"
            yield f"event: {event_type}\ndata: {payload}\n\n"

    return StreamingResponse(
        raw_sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
