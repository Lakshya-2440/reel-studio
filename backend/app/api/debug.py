from typing import Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm.router import llm_router


class DebugChatRequest(BaseModel):
    prompt: str = Field(default="Say hello and describe your purpose in 1 sentence.")
    task: str = Field(default="debug_chat")
    force_fail_hf: Optional[bool] = Field(default=None, description="Explicitly set force_fail_hf for router")
    toggle_force_fail: Optional[bool] = Field(default=False, description="Toggle current force_fail_hf flag")
    test_schema: Optional[bool] = Field(default=False, description="Test structured Pydantic schema output")


class SampleDebugSchema(BaseModel):
    summary: str
    confidence: float
    tags: list[str]


router = APIRouter(tags=["debug"])


@router.get("/debug/llm")
@router.get("/llm")
async def get_debug_llm_status() -> dict[str, Any]:
    """Inspect LLM router status, config, active failover flags, and recent in-memory call logs."""
    recent_calls = llm_router.get_recent_calls(limit=50)
    total_calls = len(llm_router.llm_calls)
    fallback_count = sum(1 for c in llm_router.llm_calls if c.get("fallback_used"))
    success_count = sum(1 for c in llm_router.llm_calls if c.get("success"))

    return {
        "status": "ok",
        "primary_provider": "huggingface",
        "fallback_provider": "gemini",
        "force_fail_hf": llm_router.force_fail_hf,
        "config": {
            "hf_chat_model": llm_router.hf_chat_model,
            "hf_asr_model": llm_router.hf_asr_model,
            "hf_embed_model": llm_router.hf_embed_model,
            "gemini_model": llm_router.gemini_model,
            "hf_token_configured": bool(llm_router.hf_token),
            "gemini_key_configured": bool(llm_router.gemini_api_key),
            "timeout_seconds": llm_router.timeout,
        },
        "stats": {
            "total_calls": total_calls,
            "fallback_count": fallback_count,
            "success_count": success_count,
        },
        "recent_calls": recent_calls,
    }


@router.post("/debug/llm")
@router.post("/llm")
async def post_debug_llm_test(request: DebugChatRequest) -> dict[str, Any]:
    """Trigger a test chat through LLM router, optionally toggling force_fail_hf and testing schema validation."""
    if request.toggle_force_fail:
        llm_router.set_force_fail_hf(not llm_router.force_fail_hf)
    elif request.force_fail_hf is not None:
        llm_router.set_force_fail_hf(request.force_fail_hf)

    schema = SampleDebugSchema if request.test_schema else None
    messages = [
        {"role": "system", "content": "You are Reel LLM Router diagnostic agent."},
        {"role": "user", "content": request.prompt},
    ]

    response = await llm_router.chat(
        messages=messages,
        schema=schema,
        task=request.task,
        force_fail_hf=llm_router.force_fail_hf,
    )

    recent_call = llm_router.llm_calls[-1] if llm_router.llm_calls else {}

    return {
        "message": "Chat test executed successfully",
        "prompt": request.prompt,
        "response": response,
        "provider": recent_call.get("provider"),
        "fallback_used": recent_call.get("fallback_used"),
        "force_fail_hf": llm_router.force_fail_hf,
        "latency_ms": recent_call.get("latency_ms"),
        "call_log": recent_call,
    }
