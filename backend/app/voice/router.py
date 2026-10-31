"""Voice Intake API Router for Reel.

Provides:
- POST /voice/interpret: Interprets natural dictation, removes fillers, resolves self-corrections,
  and returns clean structured actions.
"""

import logging
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.llm.router import LLMRouter
from app.voice.cleaner import VoiceCleaner
from app.voice.schemas import VoiceInterpretRequest, VoiceInterpretResponse

logger = logging.getLogger("reel.voice.router")

router = APIRouter(prefix="/voice", tags=["Voice Intake"])

# Singleton cleaner instance
_voice_cleaner: Optional[VoiceCleaner] = None


def get_voice_cleaner() -> VoiceCleaner:
    """Dependency provider for VoiceCleaner."""
    global _voice_cleaner
    if _voice_cleaner is None:
        llm_router = LLMRouter()
        _voice_cleaner = VoiceCleaner(llm_router=llm_router)
    return _voice_cleaner


def persist_voice_intake_to_db(
    raw_transcript: str,
    response: VoiceInterpretResponse,
    project_id: Optional[str] = None,
) -> None:
    """Optionally record voice interpretation audit log into Neon/SQLite."""
    try:
        from db.connection import SessionLocal
        from sqlalchemy import text

        with SessionLocal() as session:
            session.execute(
                text(
                    """
                    INSERT INTO voice_intakes (id, project_id, raw_transcript, clean_text, intent_json, status)
                    VALUES (:id, :project_id, :raw_transcript, :clean_text, :intent_json, :status)
                    """
                ),
                {
                    "id": f"voice_{uuid.uuid4().hex[:12]}",
                    "project_id": project_id or "proj_founderfiles",
                    "raw_transcript": raw_transcript,
                    "clean_text": response.clean_text,
                    "intent_json": response.model_dump_json(),
                    "status": "processed",
                },
            )
            session.commit()
    except Exception as exc:
        logger.debug("Failed saving voice intake record to DB: %s", exc)


@router.post(
    "/interpret",
    response_model=VoiceInterpretResponse,
    summary="Interpret messy speech into clean structured intent",
    description=(
        "Consumes messy voice transcripts (from Wispr Flow), detects and removes filler words, "
        "applies speech self-corrections (e.g. 'Instagram, actually no, LinkedIn'), extracts "
        "entities (platform, clip reference, IST timestamps, metrics), and returns a validated "
        "action payload."
    ),
)
async def interpret_voice_intake(
    payload: VoiceInterpretRequest,
    cleaner: VoiceCleaner = Depends(get_voice_cleaner),
) -> VoiceInterpretResponse:
    """Endpoint for interpreting voice dictation into structured studio commands."""
    raw_text = (payload.text or payload.raw_text or "").strip()
    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Speech input cannot be empty.",
        )

    response = await cleaner.interpret(raw_text=raw_text, context=payload.context)

    # Persist log to DB
    proj_id = (payload.context or {}).get("project_id", "proj_founderfiles")
    persist_voice_intake_to_db(raw_transcript=raw_text, response=response, project_id=proj_id)

    return response
