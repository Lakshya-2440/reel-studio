import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.llm.router import LLMRouter, llm_router
from app.api.debug import router as debug_router


class MockClipSchema(BaseModel):
    title: str
    score: float
    reasons: list[str]


def make_mock_response(status_code: int = 200, json_data: dict = None, text: str = ""):
    resp = MagicMock()
    resp.status_code = status_code
    if json_data is not None:
        resp.json.return_value = json_data
    resp.text = text or (json.dumps(json_data) if json_data else "")
    return resp


@pytest.fixture
def router_instance():
    return LLMRouter(
        hf_token="test_hf_token",
        gemini_api_key="test_gemini_key",
        timeout=5.0,
    )


@pytest.mark.asyncio
async def test_successful_mock_hf_call(router_instance):
    """Test standard chat completion via primary Hugging Face endpoint."""
    mock_response = make_mock_response(
        status_code=200,
        json_data={
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "Hugging Face primary response: SaaS pricing transformed.",
                    }
                }
            ]
        },
    )

    with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=mock_response)):
        messages = [{"role": "user", "content": "What is the core pricing insight?"}]
        result = await router_instance.chat(messages, task="clip_analysis")

        assert "Hugging Face primary response" in result
        assert len(router_instance.llm_calls) == 1
        latest_call = router_instance.llm_calls[-1]
        assert latest_call["provider"] == "huggingface"
        assert latest_call["fallback_used"] is False
        assert latest_call["success"] is True


@pytest.mark.asyncio
async def test_hf_failure_triggering_gemini_fallback(router_instance):
    """Test that HTTP 500 / 429 from Hugging Face triggers Gemini fallback."""
    hf_fail_response = make_mock_response(status_code=500, text="Internal Server Error")
    gemini_success_response = make_mock_response(
        status_code=200,
        json_data={
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": "Gemini fallback response: High-converting hooks require friction removal."
                            }
                        ]
                    }
                }
            ]
        },
    )

    with patch(
        "httpx.AsyncClient.post",
        side_effect=[hf_fail_response, gemini_success_response],
    ):
        messages = [{"role": "user", "content": "Analyze hook strength"}]
        result = await router_instance.chat(messages, task="hook_analysis")

        assert "Gemini fallback response" in result
        assert len(router_instance.llm_calls) == 1
        latest_call = router_instance.llm_calls[-1]
        assert latest_call["provider"] == "gemini"
        assert latest_call["fallback_used"] is True
        assert latest_call["success"] is True


@pytest.mark.asyncio
async def test_hf_timeout_triggers_gemini(router_instance):
    """Test that timeout on Hugging Face triggers Gemini fallback."""
    gemini_response = make_mock_response(
        status_code=200,
        json_data={
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "Gemini recovered from HF timeout."}]
                    }
                }
            ]
        },
    )

    with patch(
        "httpx.AsyncClient.post",
        side_effect=[httpx.TimeoutException("HF call timed out >25s"), gemini_response],
    ):
        messages = [{"role": "user", "content": "Test timeout failover"}]
        result = await router_instance.chat(messages, task="timeout_test")

        assert "Gemini recovered from HF timeout" in result
        latest_call = router_instance.llm_calls[-1]
        assert latest_call["provider"] == "gemini"
        assert latest_call["fallback_used"] is True


@pytest.mark.asyncio
async def test_force_fail_hf_triggers_gemini(router_instance):
    """Test that force_fail_hf=True directly skips HF and uses Gemini."""
    gemini_response = make_mock_response(
        status_code=200,
        json_data={
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "Forced failover to Gemini successful."}]
                    }
                }
            ]
        },
    )

    with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=gemini_response)):
        messages = [{"role": "user", "content": "Test forced failover"}]
        result = await router_instance.chat(
            messages, task="test_failover", force_fail_hf=True
        )

        assert "Forced failover to Gemini" in result
        latest_call = router_instance.llm_calls[-1]
        assert latest_call["provider"] == "gemini"
        assert latest_call["fallback_used"] is True


@pytest.mark.asyncio
async def test_schema_repair_retry_success(router_instance):
    """Test that invalid initial schema output triggers a repair retry that succeeds on HF."""
    bad_hf_response = make_mock_response(
        status_code=200,
        json_data={
            "choices": [
                {
                    "message": {
                        "content": "Not JSON or invalid fields: {'wrong_key': 123}"
                    }
                }
            ]
        },
    )

    repaired_hf_response = make_mock_response(
        status_code=200,
        json_data={
            "choices": [
                {
                    "message": {
                        "content": json.dumps({
                            "title": "Repaired Pricing Clip",
                            "score": 9.4,
                            "reasons": [
                                "Contrarian opening statement",
                                "Data-backed metric",
                            ],
                        })
                    }
                }
            ]
        },
    )

    with patch(
        "httpx.AsyncClient.post",
        side_effect=[bad_hf_response, repaired_hf_response],
    ):
        messages = [{"role": "user", "content": "Extract top clip"}]
        result = await router_instance.chat(
            messages, schema=MockClipSchema, task="clip_selection"
        )

        assert isinstance(result, dict)
        assert result["title"] == "Repaired Pricing Clip"
        assert result["score"] == 9.4
        assert len(result["reasons"]) == 2
        latest_call = router_instance.llm_calls[-1]
        assert latest_call["provider"] == "huggingface"
        assert latest_call["fallback_used"] is False
        assert latest_call["success"] is True


@pytest.mark.asyncio
async def test_all_providers_fail_rule_based_schema_fallback(router_instance):
    """Test that when both HF and Gemini fail, rule-based fallback generates valid schema."""
    with patch(
        "httpx.AsyncClient.post",
        side_effect=RuntimeError("Total network failure"),
    ):
        messages = [{"role": "user", "content": "Extract clip"}]
        result = await router_instance.chat(
            messages, schema=MockClipSchema, task="clip_selection"
        )

        assert isinstance(result, dict)
        validated = MockClipSchema.model_validate(result)
        assert isinstance(validated.title, str)
        assert isinstance(validated.score, float)
        assert isinstance(validated.reasons, list)
        latest_call = router_instance.llm_calls[-1]
        assert latest_call["provider"] == "rule_fallback"
        assert latest_call["fallback_used"] is True


@pytest.mark.asyncio
async def test_embed_hf_and_fallback(router_instance):
    """Test embedding primary HF success and fallback."""
    # 1. Primary HF success
    mock_hf_embed = make_mock_response(
        status_code=200,
        json_data=[[0.1] * 384, [0.2] * 384],
    )
    with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=mock_hf_embed)):
        res = await router_instance.embed(["text1", "text2"])
        assert len(res) == 2
        assert len(res[0]) == 384
        assert router_instance.llm_calls[-1]["provider"] == "huggingface"

    # 2. Fallback
    embeddings = await router_instance.embed(["Sample fallback"])
    assert len(embeddings) == 1
    assert len(embeddings[0]) == 384
    norm = sum(x * x for x in embeddings[0]) ** 0.5
    assert pytest.approx(norm, rel=1e-3) == 1.0


@pytest.mark.asyncio
async def test_transcribe_hf_and_fallback(router_instance):
    """Test audio transcription primary HF success and rule fallback."""
    # 1. Primary HF Whisper
    mock_hf_asr = make_mock_response(
        status_code=200,
        json_data={
            "text": "Transcribed live audio test.",
            "chunks": [{"timestamp": [0.0, 3.5], "text": "Transcribed live audio test."}],
        },
    )
    with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=mock_hf_asr)):
        res = await router_instance.transcribe(b"valid_audio_bytes")
        assert res["text"] == "Transcribed live audio test."
        assert len(res["segments"]) == 1
        assert router_instance.llm_calls[-1]["provider"] == "huggingface"

    # 2. Rule fallback
    transcript = await router_instance.transcribe(b"dummy audio bytes")
    assert "text" in transcript
    assert "segments" in transcript
    assert len(transcript["segments"]) >= 1


def test_debug_endpoint():
    """Test GET and POST on /debug/llm endpoint."""
    app = FastAPI()
    app.include_router(debug_router)
    client = TestClient(app)

    # 1. GET /debug/llm
    get_res = client.get("/debug/llm")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["status"] == "ok"
    assert "config" in data
    assert "recent_calls" in data

    # 2. POST /debug/llm without schema
    post_res = client.post(
        "/debug/llm",
        json={"prompt": "Diagnose router status", "task": "debug_test"},
    )
    assert post_res.status_code == 200
    post_data = post_res.json()
    assert "response" in post_data
    assert post_data["provider"] in ("huggingface", "gemini", "rule_fallback")

    # 3. POST /debug/llm toggle force_fail_hf
    toggle_res = client.post(
        "/debug/llm",
        json={"prompt": "Test toggling", "toggle_force_fail": True},
    )
    assert toggle_res.status_code == 200
    toggle_data = toggle_res.json()
    assert toggle_data["force_fail_hf"] is True

    # 4. POST /debug/llm with schema test
    schema_res = client.post(
        "/debug/llm",
        json={"prompt": "Test schema structure", "test_schema": True},
    )
    assert schema_res.status_code == 200
    schema_data = schema_res.json()
    assert isinstance(schema_data["response"], dict)
    assert "summary" in schema_data["response"]
    assert "confidence" in schema_data["response"]
