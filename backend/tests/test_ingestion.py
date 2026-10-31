"""
Unit Tests for Reel Ingestion Pipeline (Req 1)
Tests:
  - Transcript paste parsing (timestamped & non-timestamped).
  - SSE job progress broadcasting across all stages.
  - Sample podcast instant zero-latency processing.
  - Ingestion API endpoints (POST /ingest/sample, POST /ingest/transcript, GET /transcripts/{id}, GET /projects/{id}/chapters).
"""

import asyncio
import io
import pytest
from fastapi.testclient import TestClient

from app.core.jobs import JobStatus, job_manager
from app.ingest.audio_processor import is_ffmpeg_available
from app.ingest.job_pipeline import (
    process_sample_podcast,
    process_transcript_text,
)
from app.ingest.transcriber import (
    detect_chapters,
    parse_pasted_transcript,
)
from app.main import app

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Transcript Paste Parsing Tests
# -----------------------------------------------------------------------------
def test_parse_pasted_transcript_with_timestamps():
    """Test parsing transcript containing standard timestamps and speaker labels."""
    raw_text = """
    [00:04:12] Alex Vance: Most founders build content as a megaphone to shout at buyers.
    [00:04:45] Elena: But the sharpest ones use it as a radar to detect market demand.
    [00:05:20] Alex Vance: Outcome-based pricing isn't the future—it's the present.
    """
    segments = parse_pasted_transcript(raw_text)

    assert len(segments) == 3
    assert segments[0]["start"] == 252.0  # 4 * 60 + 12
    assert segments[0]["end"] == 285.0    # 4 * 60 + 45
    assert segments[0]["speaker"] == "Alex Vance"
    assert "megaphone to shout" in segments[0]["text"]

    assert segments[1]["start"] == 285.0
    assert segments[1]["end"] == 320.0
    assert segments[1]["speaker"] == "Elena"
    assert "radar to detect" in segments[1]["text"]

    assert segments[2]["start"] == 320.0
    assert segments[2]["speaker"] == "Alex Vance"


def test_parse_pasted_transcript_without_timestamps():
    """Test parsing raw text without timestamps, synthesizing realistic pacing."""
    raw_text = """
    Sarah: Welcome to the show today Marcus.
    Marcus: Thanks for having me Sarah, excited to dive in.
    Software gross margins under seventy percent are dangerous for AI wrappers.
    """
    segments = parse_pasted_transcript(raw_text)

    assert len(segments) >= 2
    assert segments[0]["speaker"] == "Sarah"
    assert segments[0]["start"] == 0.0
    assert segments[0]["end"] > segments[0]["start"]

    # Timestamps should be monotonic
    for i in range(1, len(segments)):
        assert segments[i]["start"] >= segments[i - 1]["end"] or segments[i]["start"] >= segments[i - 1]["start"]
        assert segments[i]["end"] > segments[i]["start"]


def test_parse_empty_transcript():
    """Test empty transcript handling."""
    segments = parse_pasted_transcript("")
    assert segments == []


def test_detect_chapters():
    """Test semantic chapter generation over segments."""
    dummy_segments = [
        {"start_time": 0.0, "end_time": 30.0, "speaker": "A", "text": "Starting the podcast discussion on early seed funding."},
        {"start_time": 30.0, "end_time": 60.0, "speaker": "B", "text": "Pricing models are critical for survival."},
    ]
    chapters = detect_chapters(dummy_segments)
    assert len(chapters) >= 1
    assert "start_time" in chapters[0]
    assert "end_time" in chapters[0]
    assert "title" in chapters[0]


# -----------------------------------------------------------------------------
# 2. SSE Job Progress Broadcasting Tests
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_sse_job_progress_broadcasting():
    """Test that JobManager broadcasts stages and progress updates to subscribers."""
    job = job_manager.create_job(type="test_ingest", initial_stage="queued", detail="Queueing")
    assert job.status == JobStatus.PENDING

    stages_seen = []

    async def subscriber_task():
        async for event in job_manager.subscribe(job.id, ping_interval=1.0):
            stages_seen.append((event.stage, event.progress, event.status))
            if event.status in (JobStatus.COMPLETED, JobStatus.FAILED):
                break

    sub_fut = asyncio.create_task(subscriber_task())

    # Simulate pipeline progression:
    # uploading -> extracting_audio -> transcribing -> segmenting -> scoring -> done
    await asyncio.sleep(0.02)
    job_manager.update_progress(job.id, stage="uploading", progress=10, detail="Uploading file")
    await asyncio.sleep(0.02)
    job_manager.update_progress(job.id, stage="extracting_audio", progress=25, detail="Extracting audio")
    await asyncio.sleep(0.02)
    job_manager.update_progress(job.id, stage="transcribing (chunk 1/2)", progress=50, detail="Transcribing ASR")
    await asyncio.sleep(0.02)
    job_manager.update_progress(job.id, stage="segmenting", progress=80, detail="Segmenting chapters")
    await asyncio.sleep(0.02)
    job_manager.update_progress(job.id, stage="scoring", progress=90, detail="Generating embeddings")
    await asyncio.sleep(0.02)
    job_manager.complete_job(job.id, result={"success": True}, detail="Finished")

    await asyncio.wait_for(sub_fut, timeout=2.0)

    stages = [s[0] for s in stages_seen]
    assert "uploading" in stages
    assert "extracting_audio" in stages
    assert "segmenting" in stages
    assert "scoring" in stages
    assert "done" in stages


# -----------------------------------------------------------------------------
# 3. Sample Podcast Instant Processing Tests
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_sample_podcast_instant_processing():
    """Test zero-latency demo path using the pre-seeded Founder Files Ep 42."""
    job = job_manager.create_job(type="ingest_sample", initial_stage="uploading", detail="Starting demo")
    result = await process_sample_podcast(job_id=job.id, project_id="proj_founder_files_42")

    assert result["project_id"] == "proj_founder_files_42"
    assert result["transcript_id"] == "trans_ep42"
    assert result["duration_seconds"] == 2724.0
    assert result["chapter_count"] == 6
    assert result["segment_count"] == 12
    assert result["status"] == "ready"


# -----------------------------------------------------------------------------
# 4. Ingestion API Endpoint Tests
# -----------------------------------------------------------------------------
def test_api_sample_ingest():
    """Test POST /ingest/sample spawns background demo job."""
    resp = client.post("/ingest/sample", json={"project_id": "proj_founder_files_42"})
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
    assert data["project_id"] == "proj_founder_files_42"
    assert data["transcript_id"] == "trans_ep42"
    assert data["status"] == "processing"


def test_api_transcript_paste():
    """Test POST /ingest/transcript parses, segments, and embeds raw text."""
    payload = {
        "project_id": "proj_test_paste",
        "transcript_text": (
            "[00:00] Alex: Hello and welcome to the testing episode.\n"
            "[00:15] Sarah: We are discussing multi-agent systems and real-time streaming."
        ),
        "title": "Automated Test Podcast",
    }
    resp = client.post("/ingest/transcript", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_id"] == "proj_test_paste"
    assert "transcript_id" in data
    assert data["segment_count"] == 2
    assert data["chapter_count"] >= 1


def test_api_get_transcript():
    """Test GET /transcripts/{id} returns segments and metadata."""
    resp = client.get("/transcripts/trans_ep42")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "trans_ep42"
    assert data["project_id"] == "proj_founder_files_42"
    assert len(data["segments"]) >= 12
    assert "speaker" in data["segments"][0]
    assert "text" in data["segments"][0]


def test_api_get_project_chapters():
    """Test GET /projects/{id}/chapters returns chapter breakdown."""
    resp = client.get("/projects/proj_founder_files_42/chapters")
    assert resp.status_code == 200
    chapters = resp.json()
    assert isinstance(chapters, list)
    assert len(chapters) == 6
    assert "title" in chapters[0]
    assert chapters[0]["title"] == "The $50k MRR Death Valley"
    assert chapters[0]["start_time"] == 0.0


def test_api_ingest_url_sample_and_fallback():
    """Test POST /ingest/url handles sample URLs and fallbacks."""
    # Demo URL
    resp_demo = client.post("/ingest/url", json={"url": "https://youtube.com/watch?v=sample-founder-files-42"})
    assert resp_demo.status_code == 200
    assert resp_demo.json()["status"] == "processing"

    # Blocked/unknown URL fallback
    resp_other = client.post("/ingest/url", json={"url": "https://youtube.com/watch?v=unseeded-podcast-123"})
    assert resp_other.status_code == 200
    assert resp_other.json()["status"] in ("paste_fallback", "processing")


def test_api_upload_file():
    """Test POST /ingest/upload accepts multipart media file."""
    dummy_wav_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    file_payload = {"file": ("test_podcast.wav", io.BytesIO(dummy_wav_bytes), "audio/wav")}

    resp = client.post("/ingest/upload", files=file_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
    assert data["filename"] == "test_podcast.wav"
    assert data["status"] == "processing"


def test_ffmpeg_availability():
    """Verify ffmpeg is available on the system."""
    assert is_ffmpeg_available() is True
