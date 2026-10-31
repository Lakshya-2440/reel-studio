import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, AsyncGenerator, Callable, Coroutine, Dict, List, Optional, Set
from pydantic import BaseModel, Field

logger = logging.getLogger("reel.jobs")


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobEvent(BaseModel):
    job_id: str
    stage: str
    progress: int = Field(ge=0, le=100)
    detail: str = ""
    status: JobStatus = JobStatus.RUNNING
    data: Optional[Dict[str, Any]] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "generic"
    status: JobStatus = JobStatus.PENDING
    stage: str = "queued"
    progress: int = Field(default=0, ge=0, le=100)
    detail: str = "Job queued"
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class JobManager:
    """In-memory asyncio job manager and real-time SSE event broadcaster."""

    def __init__(self):
        self._jobs: Dict[str, Job] = {}
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._tasks: Dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()

    def create_job(
        self,
        type: str = "generic",
        initial_stage: str = "queued",
        detail: str = "Job created",
    ) -> Job:
        job = Job(type=type, stage=initial_stage, detail=detail)
        self._jobs[job.id] = job
        self._subscribers[job.id] = set()
        logger.info(f"Created job {job.id} of type {type}")
        return job

    def get_job(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)

    def list_jobs(self, limit: int = 50) -> List[Job]:
        jobs = list(self._jobs.values())
        jobs.sort(key=lambda j: j.created_at, reverse=True)
        return jobs[:limit]

    def _broadcast(self, event: JobEvent) -> None:
        subscribers = self._subscribers.get(event.job_id, set())
        dead_queues = set()
        for q in list(subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                dead_queues.add(q)
            except Exception as e:
                logger.warning(f"Error publishing to subscriber queue: {e}")
                dead_queues.add(q)
        if dead_queues:
            subscribers.difference_update(dead_queues)

    def update_progress(
        self,
        job_id: str,
        stage: str,
        progress: int,
        detail: str = "",
        data: Optional[Dict[str, Any]] = None,
    ) -> Optional[Job]:
        job = self._jobs.get(job_id)
        if not job:
            return None

        job.status = JobStatus.RUNNING
        job.stage = stage
        job.progress = max(0, min(100, progress))
        job.detail = detail or job.detail
        job.updated_at = datetime.now(timezone.utc).isoformat()

        event = JobEvent(
            job_id=job.id,
            stage=job.stage,
            progress=job.progress,
            detail=job.detail,
            status=job.status,
            data=data,
        )
        self._broadcast(event)
        return job

    def complete_job(
        self,
        job_id: str,
        result: Optional[Dict[str, Any]] = None,
        detail: str = "Completed successfully",
    ) -> Optional[Job]:
        job = self._jobs.get(job_id)
        if not job:
            return None

        job.status = JobStatus.COMPLETED
        job.stage = "done"
        job.progress = 100
        job.detail = detail
        job.result = result or {}
        job.updated_at = datetime.now(timezone.utc).isoformat()

        event = JobEvent(
            job_id=job.id,
            stage="done",
            progress=100,
            detail=job.detail,
            status=JobStatus.COMPLETED,
            data=result,
        )
        self._broadcast(event)
        return job

    def fail_job(
        self,
        job_id: str,
        error: str,
        detail: str = "Job execution failed",
    ) -> Optional[Job]:
        job = self._jobs.get(job_id)
        if not job:
            return None

        job.status = JobStatus.FAILED
        job.stage = "failed"
        job.detail = detail
        job.error = error
        job.updated_at = datetime.now(timezone.utc).isoformat()

        event = JobEvent(
            job_id=job.id,
            stage="failed",
            progress=job.progress,
            detail=detail,
            status=JobStatus.FAILED,
            data={"error": error},
        )
        self._broadcast(event)
        return job

    async def subscribe(
        self, job_id: str, ping_interval: float = 15.0
    ) -> AsyncGenerator[JobEvent, None]:
        """Subscribe to live events for a job. Yields current state first, then stream."""
        job = self._jobs.get(job_id)
        if not job:
            # Yield error event and exit
            yield JobEvent(
                job_id=job_id,
                stage="not_found",
                progress=0,
                detail=f"Job {job_id} not found",
                status=JobStatus.FAILED,
            )
            return

        # Initial snapshot event
        initial_event = JobEvent(
            job_id=job.id,
            stage=job.stage,
            progress=job.progress,
            detail=job.detail,
            status=job.status,
            data=job.result if job.status == JobStatus.COMPLETED else ({"error": job.error} if job.status == JobStatus.FAILED else None),
        )
        yield initial_event

        # If already in terminal state, exit immediately
        if job.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
            return

        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        if job_id not in self._subscribers:
            self._subscribers[job_id] = set()
        self._subscribers[job_id].add(queue)

        try:
            while True:
                try:
                    event: JobEvent = await asyncio.wait_for(
                        queue.get(), timeout=ping_interval
                    )
                    yield event
                    if event.status in (
                        JobStatus.COMPLETED,
                        JobStatus.FAILED,
                        JobStatus.CANCELLED,
                    ):
                        break
                except asyncio.TimeoutError:
                    # Keepalive ping
                    current_job = self._jobs.get(job_id)
                    if not current_job or current_job.status in (
                        JobStatus.COMPLETED,
                        JobStatus.FAILED,
                        JobStatus.CANCELLED,
                    ):
                        break
                    yield JobEvent(
                        job_id=job_id,
                        stage=current_job.stage,
                        progress=current_job.progress,
                        detail="keepalive ping",
                        status=current_job.status,
                    )
        finally:
            if job_id in self._subscribers:
                self._subscribers[job_id].discard(queue)

    def spawn(
        self,
        job_id: str,
        coro_fn: Callable[..., Coroutine[Any, Any, Any]],
        *args,
        **kwargs,
    ) -> asyncio.Task:
        """Spawn an asynchronous coroutine as a tracked background job."""
        async def _wrapper():
            self.update_progress(job_id, stage="started", progress=5, detail="Task running")
            try:
                result = await coro_fn(job_id, *args, **kwargs)
                self.complete_job(job_id, result=result if isinstance(result, dict) else {"result": str(result)})
            except asyncio.CancelledError:
                job = self._jobs.get(job_id)
                if job:
                    job.status = JobStatus.CANCELLED
                    job.stage = "cancelled"
                    job.detail = "Job cancelled by user"
                    self._broadcast(JobEvent(
                        job_id=job.id,
                        stage="cancelled",
                        progress=job.progress,
                        detail=job.detail,
                        status=JobStatus.CANCELLED
                    ))
            except Exception as exc:
                logger.exception(f"Unhandled exception in background job {job_id}: {exc}")
                self.fail_job(job_id, error=str(exc), detail="Unhandled error during task execution")

        task = asyncio.create_task(_wrapper(), name=f"job-{job_id}")
        self._tasks[job_id] = task
        return task


job_manager = JobManager()
