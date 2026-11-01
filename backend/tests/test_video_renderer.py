"""
Tests for Video Slicing & Short-Form Clip Rendering Engine (Req 2 Extension).
Validates ffmpeg 9:16 vertical MP4 export, single clip render, and batch render.
"""

from pathlib import Path
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.clips.video_renderer import (
    is_ffmpeg_available,
    render_short_clip,
    STATIC_CLIPS_DIR,
)

client = TestClient(app)


def test_ffmpeg_available():
    """Verify host ffmpeg is present."""
    assert is_ffmpeg_available() is True


def test_render_short_clip_creates_mp4(tmp_path):
    """Verify render_short_clip cuts a valid 9:16 MP4 video file."""
    out_file = tmp_path / "test_slice.mp4"
    res = render_short_clip(
        start_time=0.0,
        end_time=2.0,
        output_path=out_file,
        aspect_ratio="9:16",
    )
    assert res.exists()
    assert res.stat().st_size > 1000
    assert str(res).endswith(".mp4")


def test_api_render_clip_endpoint():
    """Test POST /clips/{id}/render returns 200 and video URL."""
    response = client.post(
        "/clips/clip_1/render",
        json={"start_time": 0.0, "end_time": 3.0, "aspect_ratio": "9:16"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["clip_id"] == "clip_1"
    assert data["status"] == "ready"
    assert "/static/rendered_clips/clip_1.mp4" in data["video_url"]
    assert "9:16" in data["format"]


def test_api_stream_clip_video():
    """Test GET /clips/{id}/video returns 200 and video/mp4 content type."""
    response = client.get("/clips/clip_1/video")
    assert response.status_code == 200
    assert "video/mp4" in response.headers.get("content-type", "")
    assert len(response.content) > 1000


def test_api_batch_render_endpoint():
    """Test POST /clips/render-batch returns 14 rendered short forms."""
    response = client.post("/clips/render-batch")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["count"] == 14
    assert len(data["clips"]) == 14
