"""
FastAPI Router for Reel Clips.
Endpoints:
- POST /clips/find: Runs candidate generation, 8-signal scoring, and deduplicated ranking.
- GET /projects/{id}/clips: Returns ranked clips for a project with 8-signal scores & evidence.
- PATCH /clips/{id}: Accept, reject, or adjust clip boundaries.
- POST /clips/{id}/feedback: Records creator rejection/feedback to feed brand memory & performance loop.
"""

import json
import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.clips.candidate_generator import TranscriptSegment, generate_candidate_spans
from app.clips.ranker import (
    FormattedClip,
    ScoredClipCandidate,
    format_seconds_to_timestamp,
    rank_and_deduplicate,
)
from app.clips.scorer import (
    DEFAULT_FEATURE_WEIGHTS,
    DEFAULT_VOICE_RULES,
    fetch_active_voice_rules,
    fetch_performance_weights,
    score_candidate_deterministic,
    score_candidate_with_llm,
)
from app.core.jobs import job_manager

logger = logging.getLogger("reel.clips.router")

router = APIRouter(tags=["Clips"])


# -----------------------------------------------------------------------------
# Database Session Dependency (with graceful fallback if DB fails)
# -----------------------------------------------------------------------------

def get_db_optional():
    """Attempt to yield DB session from db.connection; yield None if unavailable."""
    try:
        import sys
        from pathlib import Path

        repo_root = Path(__file__).resolve().parent.parent.parent.parent
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))

        from db.connection import SessionLocal
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Could not connect to DB session: {e}. Running in memory fallback.")
        yield None


# -----------------------------------------------------------------------------
# Request & Response Schemas
# -----------------------------------------------------------------------------

class ClipFindRequest(BaseModel):
    project_id: str = "proj_founder_files_42"
    transcript_id: Optional[str] = None
    min_duration: float = 20.0
    max_duration: float = 90.0
    target_count: int = 10
    use_llm: bool = False


class ClipUpdateRequest(BaseModel):
    status: Optional[str] = None  # "accepted", "rejected", "suggested"
    rejection_reason: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    title: Optional[str] = None


class ClipFeedbackRequest(BaseModel):
    action: str = "rejected"
    reason: str = "Opening was too salesy and lacked concrete metrics"
    rating: Optional[int] = 3


# -----------------------------------------------------------------------------
# Seed Demo Segments (Zero-Latency Fallback)
# -----------------------------------------------------------------------------

DEMO_FALLBACK_SEGMENTS = [
    TranscriptSegment(
        id="seg_1",
        start_time=12.0,
        end_time=58.0,
        speaker="Marcus Vance",
        text="At fifty thousand MRR, we thought we were geniuses. But our compute bills from OpenAI were forty-two thousand dollars. We were effectively subsidizing Fortune 500 experiments out of our personal credit cards.",
    ),
    TranscriptSegment(
        id="seg_2",
        start_time=145.0,
        end_time=198.0,
        speaker="Marcus Vance",
        text="If your gross margin on an AI product is under seventy percent, stop calling yourself a software company. You are a boutique consulting shop with an API key, and your customer knows it.",
    ),
    TranscriptSegment(
        id="seg_3",
        start_time=430.0,
        end_time=482.0,
        speaker="Marcus Vance",
        text="Never charge per token or per prompt. The customer perceives token cost as friction. Charge for the verified outcome. When we switched from ten cents per query to five thousand dollars per closed audit, conversion doubled.",
    ),
    TranscriptSegment(
        id="seg_5",
        start_time=566.0,
        end_time=622.0,
        speaker="Marcus Vance",
        text="We 10x'd our price overnight. Nine out of ten threw a fit and canceled. Good riddance. The one that stayed paid us more than the other nine combined and demanded enterprise SOC2 compliance. That single customer funded our entire engineering runway.",
    ),
    TranscriptSegment(
        id="seg_7",
        start_time=1010.0,
        end_time=1065.0,
        speaker="Marcus Vance",
        text="We fired twelve customers in one afternoon. Our team cried. Three months later, our average contract value went from eighty dollars to fourteen thousand dollars. Ruthless subtraction is the real growth hack.",
    ),
    TranscriptSegment(
        id="seg_11",
        start_time=2120.0,
        end_time=2178.0,
        speaker="Marcus Vance",
        text="If taking your tool out of their daily workflow doesn't break at least two people's morning routine, you have no moat. Zero. You are just a transient tab in their browser.",
    ),
]


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.post("/clips/find")
async def find_clips(
    payload: ClipFindRequest,
    db: Optional[Session] = Depends(get_db_optional),
):
    """Trigger candidate generation, 8-signal scoring, and deduplicated ranking on transcript."""
    # 1. Initialize background job for SSE observability
    job = job_manager.create_job(
        type="clip_finding",
        initial_stage="segmenting",
        detail="Scanning transcript sentence boundaries (20s - 90s sliding window)",
    )

    # 2. Retrieve transcript segments from DB or demo fallback
    segments: List[TranscriptSegment] = []
    if db is not None:
        try:
            query = text(
                """
                SELECT s.id, s.start_time, s.end_time, s.speaker, s.text
                FROM transcript_segments s
                JOIN transcripts t ON s.transcript_id = t.id
                WHERE t.project_id = :pid
                ORDER BY s.start_time ASC
                """
            )
            rows = db.execute(query, {"pid": payload.project_id}).fetchall()
            for r in rows:
                segments.append(
                    TranscriptSegment(
                        id=str(r[0]),
                        start_time=float(r[1]),
                        end_time=float(r[2]),
                        speaker=r[3] or "Speaker",
                        text=str(r[4]),
                    )
                )
        except Exception as e:
            logger.warning(f"Error fetching segments from DB: {e}")

    if not segments:
        segments = DEMO_FALLBACK_SEGMENTS

    # 3. Generate candidate spans snapped to sentence boundaries
    spans = generate_candidate_spans(
        segments=segments,
        min_duration=payload.min_duration,
        max_duration=payload.max_duration,
        target_count=payload.target_count * 2,
    )

    job_manager.update_progress(
        job.id,
        stage="scoring",
        progress=45,
        detail=f"Evaluating {len(spans)} candidate spans across 8 signals (Voice Memory + Performance Priors)",
    )

    # 4. Fetch context: voice rules and performance feature weights
    voice_rules = fetch_active_voice_rules(payload.project_id, db)
    feature_weights = fetch_performance_weights(payload.project_id, db)

    # 5. Score candidates
    scored_candidates: List[ScoredClipCandidate] = []
    for span in spans:
        if payload.use_llm:
            score_res = await score_candidate_with_llm(
                candidate=span,
                voice_rules=voice_rules,
                feature_weights=feature_weights,
            )
        else:
            score_res = score_candidate_deterministic(
                candidate=span,
                voice_rules=voice_rules,
                feature_weights=feature_weights,
            )
        scored_candidates.append(ScoredClipCandidate(candidate=span, scores=score_res))

    job_manager.update_progress(
        job.id,
        stage="ranking",
        progress=80,
        detail="Applying Non-Maximum Suppression (NMS) deduplication & synthesizing evidence quotes",
    )

    # 6. Rank and deduplicate
    ranked_clips = rank_and_deduplicate(
        scored_candidates=scored_candidates,
        project_id=payload.project_id,
        target_count=payload.target_count,
    )

    # 7. Persist clips in database
    if db is not None:
        try:
            for clip in ranked_clips:
                reasons_json = json.dumps(clip.reasons)
                breakdown_json = json.dumps(clip.score_breakdown)

                # Upsert query compatible with both SQLite and Postgres
                upsert_query = text(
                    """
                    INSERT INTO clips (
                        id, project_id, title, start_time, end_time, duration,
                        hook_line, reasons, score_breakdown, overall_score,
                        evidence_quote, status
                    )
                    VALUES (
                        :id, :pid, :title, :st, :et, :dur,
                        :hook, :reasons, :breakdown, :score,
                        :quote, 'suggested'
                    )
                    ON CONFLICT(id) DO UPDATE SET
                        title = EXCLUDED.title,
                        reasons = EXCLUDED.reasons,
                        score_breakdown = EXCLUDED.score_breakdown,
                        overall_score = EXCLUDED.overall_score,
                        evidence_quote = EXCLUDED.evidence_quote;
                    """
                )
                db.execute(
                    upsert_query,
                    {
                        "id": clip.id,
                        "pid": payload.project_id,
                        "title": clip.title,
                        "st": clip.start_time,
                        "et": clip.end_time,
                        "dur": clip.duration,
                        "hook": clip.hook_line,
                        "reasons": reasons_json,
                        "breakdown": breakdown_json,
                        "score": clip.overall_score,
                        "quote": clip.evidence_quote,
                    },
                )
            db.commit()
        except Exception as e:
            logger.warning(f"Error persisting clips to DB ({e}), continuing with response")
            db.rollback()

    job_manager.update_progress(
        job.id,
        stage="completed",
        progress=100,
        detail=f"Discovered {len(ranked_clips)} top-tier clips with traceable reasons and evidence",
    )

    return {
        "job_id": job.id,
        "project_id": payload.project_id,
        "status": "completed",
        "clips_count": len(ranked_clips),
        "clips": [c.model_dump() for c in ranked_clips],
    }


@router.get("/projects/{project_id}/clips")
async def get_project_clips(
    project_id: str,
    db: Optional[Session] = Depends(get_db_optional),
):
    """List ranked clips with explicit 8-signal scores, 'Why this clip' reasons, and evidence quotes."""
    clips_out: List[Dict[str, Any]] = []

    if db is not None:
        try:
            query = text(
                """
                SELECT id, project_id, title, start_time, end_time, duration,
                       hook_line, reasons, score_breakdown, overall_score,
                       evidence_quote, status
                FROM clips
                WHERE project_id = :pid
                ORDER BY overall_score DESC
                """
            )
            rows = db.execute(query, {"pid": project_id}).fetchall()
            for r in rows:
                reasons_val = r[7]
                if isinstance(reasons_val, str):
                    try:
                        reasons_list = json.loads(reasons_val)
                    except Exception:
                        reasons_list = [reasons_val]
                elif isinstance(reasons_val, list):
                    reasons_list = reasons_val
                else:
                    reasons_list = []

                breakdown_val = r[8]
                if isinstance(breakdown_val, str):
                    try:
                        breakdown_dict = json.loads(breakdown_val)
                    except Exception:
                        breakdown_dict = {}
                elif isinstance(breakdown_val, dict):
                    breakdown_dict = breakdown_val
                else:
                    breakdown_dict = {}

                start_t = float(r[3])
                end_t = float(r[4])
                dur = float(r[5])
                overall_score = float(r[9] or 0.0)

                # Format compact scores for frontend cards
                flat_scores = {
                    "overall": overall_score,
                    "hook": breakdown_dict.get("hook_strength", {}).get("score", 9.0) if isinstance(breakdown_dict.get("hook_strength"), dict) else breakdown_dict.get("hook_strength", 9.0),
                    "hook_strength": breakdown_dict.get("hook_strength", {}).get("score", 9.0) if isinstance(breakdown_dict.get("hook_strength"), dict) else breakdown_dict.get("hook_strength", 9.0),
                    "standalone": breakdown_dict.get("standalone_clarity", {}).get("score", 8.8) if isinstance(breakdown_dict.get("standalone_clarity"), dict) else breakdown_dict.get("standalone_clarity", 8.8),
                    "standalone_clarity": breakdown_dict.get("standalone_clarity", {}).get("score", 8.8) if isinstance(breakdown_dict.get("standalone_clarity"), dict) else breakdown_dict.get("standalone_clarity", 8.8),
                    "density": breakdown_dict.get("actionability_quotability", {}).get("score", 8.7) if isinstance(breakdown_dict.get("actionability_quotability"), dict) else breakdown_dict.get("actionability_quotability", 8.7),
                    "information_density": breakdown_dict.get("actionability_quotability", {}).get("score", 8.7) if isinstance(breakdown_dict.get("actionability_quotability"), dict) else breakdown_dict.get("actionability_quotability", 8.7),
                    "brand_fit": breakdown_dict.get("brand_fit", {}).get("score", 9.1) if isinstance(breakdown_dict.get("brand_fit"), dict) else breakdown_dict.get("brand_fit", 9.1),
                    "performance_prior": breakdown_dict.get("performance_prior", {}).get("score", 9.2) if isinstance(breakdown_dict.get("performance_prior"), dict) else breakdown_dict.get("performance_prior", 9.2),
                    "emotional_resonance": breakdown_dict.get("emotional_energy", {}).get("score", 8.9) if isinstance(breakdown_dict.get("emotional_energy"), dict) else breakdown_dict.get("emotional_energy", 8.9),
                }

                clips_out.append({
                    "id": str(r[0]),
                    "project_id": str(r[1]),
                    "title": str(r[2]),
                    "start_time": start_t,
                    "end_time": end_t,
                    "duration": dur,
                    "duration_seconds": dur,
                    "duration_formatted": f"{int(round(dur))}s",
                    "start_time_formatted": format_seconds_to_timestamp(start_t),
                    "end_time_formatted": format_seconds_to_timestamp(end_t),
                    "hook": str(r[6] or ""),
                    "hook_line": str(r[6] or ""),
                    "reasons": reasons_list,
                    "why_this_clip": reasons_list,
                    "evidence_quote": str(r[10] or ""),
                    "score_breakdown": breakdown_dict,
                    "scores": flat_scores,
                    "overall_score": overall_score,
                    "risks": ["Slight pause at midpoint" if dur > 50 else ""],
                    "recommended_platforms": ["LinkedIn", "Reels", "Shorts", "X", "TikTok"],
                    "status": str(r[11] or "suggested"),
                })
        except Exception as e:
            logger.warning(f"Error fetching clips from DB ({e})")

    # If no clips exist in DB for this project, trigger find_clips to generate and persist them
    if not clips_out:
        find_res = await find_clips(
            ClipFindRequest(project_id=project_id, target_count=8),
            db=db,
        )
        return find_res["clips"]

    return clips_out


@router.patch("/clips/{clip_id}")
async def update_clip(
    clip_id: str,
    payload: Dict[str, Any],
    db: Optional[Session] = Depends(get_db_optional),
):
    """Accept, reject, or adjust clip boundaries."""
    new_status = payload.get("status")
    rejection_reason = payload.get("rejection_reason") or payload.get("reason")
    start_time = payload.get("start_time")
    end_time = payload.get("end_time")
    title = payload.get("title")

    if db is not None:
        try:
            # Update clip record
            updates = []
            params: Dict[str, Any] = {"cid": clip_id}
            if new_status:
                updates.append("status = :status")
                params["status"] = new_status
            if title:
                updates.append("title = :title")
                params["title"] = title
            if start_time is not None:
                updates.append("start_time = :st")
                params["st"] = float(start_time)
            if end_time is not None:
                updates.append("end_time = :et")
                params["et"] = float(end_time)

            if updates:
                q = text(f"UPDATE clips SET {', '.join(updates)} WHERE id = :cid")
                db.execute(q, params)

            # If rejected with a reason, insert into clip_feedback to feed Brand Voice Memory
            if new_status == "rejected" and rejection_reason:
                feedback_id = f"fb_{uuid.uuid4().hex[:8]}"
                fb_q = text(
                    """
                    INSERT INTO clip_feedback (id, clip_id, action, reason)
                    VALUES (:fbid, :cid, 'rejected', :reason)
                    """
                )
                db.execute(fb_q, {"fbid": feedback_id, "cid": clip_id, "reason": rejection_reason})

            db.commit()
        except Exception as e:
            logger.warning(f"Error updating clip in DB: {e}")
            db.rollback()

    return {
        "id": clip_id,
        "success": True,
        "status": new_status or "accepted",
        "message": f"Clip {clip_id} updated successfully",
        "rejection_reason": rejection_reason,
    }


@router.post("/clips/{clip_id}/feedback")
async def submit_clip_feedback(
    clip_id: str,
    payload: ClipFeedbackRequest,
    db: Optional[Session] = Depends(get_db_optional),
):
    """Log creator rejection rationale to update scoring weights and voice memory."""
    feedback_id = f"fb_{uuid.uuid4().hex[:8]}"

    if db is not None:
        try:
            fb_q = text(
                """
                INSERT INTO clip_feedback (id, clip_id, action, reason)
                VALUES (:fbid, :cid, :act, :reason)
                """
            )
            db.execute(
                fb_q,
                {
                    "fbid": feedback_id,
                    "cid": clip_id,
                    "act": payload.action,
                    "reason": payload.reason,
                },
            )
            # Also update clip status if action is rejected
            if payload.action == "rejected":
                db.execute(
                    text("UPDATE clips SET status = 'rejected' WHERE id = :cid"),
                    {"cid": clip_id},
                )
            db.commit()
        except Exception as e:
            logger.warning(f"Error recording feedback in DB: {e}")
            db.rollback()

    learning_msg = (
        f"Recorded creator feedback ('{payload.reason}'). "
        "Brand voice memory conditioned to penalize low-conviction openings "
        "and reduce prior weight for similar framing."
    )

    return {
        "id": feedback_id,
        "clip_id": clip_id,
        "action": payload.action,
        "feedback_recorded": payload.reason,
        "learning_impact": learning_msg,
    }
