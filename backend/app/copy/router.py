from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.copy.edit_analyst import process_variant_edit
from app.copy.generator import copy_engine
from db.connection import get_db

router = APIRouter(tags=["Copy"])


class VariantEditPayload(BaseModel):
    final_text: Optional[str] = Field(default=None, description="Updated creator copy")
    creator_final: Optional[str] = Field(default=None, description="Alias for final_text")
    ai_draft: Optional[str] = Field(default=None, description="Original AI draft for diff comparison")


class GenerateCopyPayload(BaseModel):
    instruction: Optional[str] = Field(default=None, description="Optional voice instruction or directive")
    force_regenerate: bool = Field(default=False, description="Whether to bypass cache and regenerate")


@router.post("/clips/{clip_id}/copy", summary="Generate 5 platform copy variants for a clip")
async def generate_platform_copy(
    clip_id: str,
    payload: Optional[GenerateCopyPayload] = None,
    db: Session = Depends(get_db),
):
    """Generate 5 distinct platform-native copy variants (LinkedIn, Reels, Shorts, X, TikTok)
    conditioned on Voice Memory rules, tone sliders, and top exemplars.
    """
    try:
        result = await copy_engine.generate_variants(clip_id=clip_id, db=db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate platform copy: {str(e)}")


@router.get("/clips/{clip_id}/copy", summary="Get existing platform copy variants for a clip")
async def get_clip_copy_variants(
    clip_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve saved platform copy variants for a clip."""
    result = await copy_engine.generate_variants(clip_id=clip_id, db=db)
    return result


@router.patch("/variants/{variant_id}", summary="Edit variant copy and trigger voice memory learning")
async def update_variant_and_learn(
    variant_id: str,
    payload: VariantEditPayload,
    db: Session = Depends(get_db),
):
    """Handles creator edit on a platform variant, stores changes,
    and executes the Edit Analyst diff pipeline to extract style rules and update Voice Memory.
    """
    final_text = payload.final_text or payload.creator_final
    if not final_text:
        raise HTTPException(
            status_code=400,
            detail="Either 'final_text' or 'creator_final' must be provided in request body.",
        )

    try:
        analysis_result = process_variant_edit(
            variant_id=variant_id,
            creator_final=final_text,
            ai_draft=payload.ai_draft,
            db=db,
        )
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process creator edit: {str(e)}")


@router.get("/variants/{variant_id}", summary="Get single variant details")
async def get_single_variant(
    variant_id: str,
    db: Session = Depends(get_db),
):
    """Fetch single platform variant by ID."""
    row = db.execute(
        text("SELECT id, clip_id, platform, hook, caption, cta, on_screen_text, voice_match_score, is_edited, final_text FROM platform_variants WHERE id = :vid"),
        {"vid": variant_id},
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Variant {variant_id} not found.")

    return {
        "id": row[0],
        "clip_id": row[1],
        "platform": row[2],
        "hook": row[3],
        "caption": row[4],
        "cta": row[5],
        "on_screen_text": row[6],
        "voice_match_score": float(row[7] or 0.0),
        "is_edited": bool(row[8]),
        "final_text": row[9],
    }
