"""Unit tests for Voice Intake & Cleanup Engine (Wispr Flow requirement).

Covers:
- Rambling speech cleanup (fillers + self-corrections)
- Metrics extraction (views, likes, comments)
- Structured intent classification
- IST timezone verification (+05:30 offset)
- Fuzzy reference resolution over database clips
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.voice.cleaner import VoiceCleaner
from app.voice.schemas import Correction, IntentEnum, VoiceInterpretRequest, VoiceInterpretResponse


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def cleaner():
    return VoiceCleaner()


def test_rambling_dictation_with_fillers_and_corrections(client):
    """Test rambling dictation with fillers ('um', 'like') and self-correction ('Thursday' -> 'Friday')."""
    payload = {
        "text": "um, like schedule the pricing clip on Thursday morning, wait actually Friday on LinkedIn"
    }
    response = client.post("/voice/interpret", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    # 1. Clean text validation
    assert "Schedule the pricing clip on Friday on LinkedIn" in data["clean_text"]
    assert "um" not in data["clean_text"].lower().split()
    assert "like" not in data["clean_text"].lower().split()

    # 2. Intent validation
    assert data["intent"] == "schedule"

    # 3. Entity extraction & IST timezone offset (+05:30)
    entities = data["entities"]
    assert entities.get("platform") == "linkedin"
    assert "pricing" in entities.get("clip_ref", "").lower()
    assert entities.get("resolved_clip_id") == "clip_3"
    assert entities.get("resolved_clip_title") == "Why Per-Token Pricing Kills Conversion"
    assert "when" in entities
    assert entities["when"].endswith("+05:30"), f"Expected IST timezone offset '+05:30', got {entities['when']}"

    # 4. Fillers removed
    assert "um" in data["fillers_removed"]
    assert "like" in data["fillers_removed"]

    # 5. Corrections applied
    assert len(data["corrections_applied"]) >= 1
    corr = data["corrections_applied"][0]
    assert corr["from"] == "Thursday morning"
    assert corr["to"] == "Friday"

    # 6. High confidence
    assert data["confidence"] >= 0.8
    assert data["needs_clarification"] is None


def test_metrics_logging_dictation(client):
    """Test performance logging dictation with views and likes extraction."""
    payload = {
        "text": "the podcast clip got 15k views and 400 likes on LinkedIn"
    }
    response = client.post("/voice/interpret", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["intent"] == "log_performance"
    entities = data["entities"]
    assert entities.get("platform") == "linkedin"
    assert "podcast clip" in entities.get("clip_ref", "").lower()

    # Verify structured metrics
    metrics = entities.get("metrics", {})
    assert metrics.get("views") == 15000
    assert metrics.get("likes") == 400

    # No unnecessary corrections or fillers
    assert data["corrections_applied"] == []
    assert data["confidence"] >= 0.8


def test_speech_self_correction_platform_swap(client):
    """Test platform replacement ('Instagram' -> 'LinkedIn')."""
    payload = {
        "raw_text": "make that for Instagram, actually no, LinkedIn"
    }
    response = client.post("/voice/interpret", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    assert "Make that for LinkedIn." in data["clean_text"]
    assert data["entities"].get("platform") == "linkedin"

    assert len(data["corrections_applied"]) == 1
    assert data["corrections_applied"][0]["from"] == "Instagram"
    assert data["corrections_applied"][0]["to"] == "LinkedIn"


def test_speech_self_correction_time_swap_ist_offset(cleaner):
    """Test time swap ('at 5pm' -> 'morning at 9am') and IST offset resolution."""
    raw = "schedule at 5pm, wait no morning at 9am"
    result = cleaner.interpret_sync(raw)

    assert result.intent == IntentEnum.schedule
    assert len(result.corrections_applied) >= 1
    assert "5pm" in result.corrections_applied[0].from_
    assert "9am" in result.corrections_applied[0].to

    # Verify IST timestamp
    when_val = result.entities.get("when")
    assert when_val is not None
    assert when_val.endswith("+05:30")
    assert "T09:00:00" in when_val


def test_fuzzy_clip_resolution(cleaner):
    """Test fuzzy reference resolution against seeded database clips."""
    # Test Gross Margin clip
    res1 = cleaner.interpret_sync("schedule the margin rule clip on Tuesday morning")
    assert res1.entities.get("resolved_clip_id") == "clip_2"
    assert "Gross Margin" in res1.entities.get("resolved_clip_title", "")

    # Test Retention Test clip
    res2 = cleaner.interpret_sync("create a brief for the Monday retention test clip")
    assert res2.entities.get("resolved_clip_id") == "clip_10"
    assert "Retention Test" in res2.entities.get("resolved_clip_title", "")


def test_brand_note_intent(client):
    """Test brand voice note capture intent."""
    payload = {
        "text": "update brand rule: never use the word leverage or synergy in LinkedIn posts"
    }
    response = client.post("/voice/interpret", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["intent"] == "brand_note"
    assert data["confidence"] >= 0.8


def test_empty_input_validation(client):
    """Test empty input handling returns 422 error."""
    response = client.post("/voice/interpret", json={"text": "   "})
    assert response.status_code == 422


def test_correction_pydantic_schema_aliases():
    """Verify Correction schema correctly populates and serializes alias 'from'."""
    c1 = Correction(**{"from": "Instagram", "to": "LinkedIn"})
    assert c1.from_ == "Instagram"
    assert c1.to == "LinkedIn"
    dump = c1.model_dump()
    assert "from" in dump
    assert dump["from"] == "Instagram"

    # Test backward-compatible legacy keys
    c2 = Correction.model_validate({"original": "Thursday", "corrected": "Friday"})
    assert c2.from_ == "Thursday"
    assert c2.to == "Friday"
    assert c2.model_dump()["from"] == "Thursday"
