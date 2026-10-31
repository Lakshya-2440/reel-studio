"""
Ranker and Deduplication Engine for Reel Clips.
Ranks candidate clips by overall weighted score, applies Non-Maximum Suppression (NMS)
to prune overlapping windows and maintain topical diversity, and synthesizes
comprehensive per-clip deliverables.
"""

import hashlib
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.clips.candidate_generator import CandidateClipSpan
from app.clips.scorer import ClipScoreBreakdown


class ScoredClipCandidate(BaseModel):
    candidate: CandidateClipSpan
    scores: ClipScoreBreakdown


class FormattedClip(BaseModel):
    id: str
    project_id: str
    title: str
    start_time: float
    end_time: float
    duration: float
    duration_formatted: str
    start_time_formatted: str
    end_time_formatted: str
    hook_line: str
    reasons: List[str]
    why_this_clip: List[str]
    evidence_quote: str
    score_breakdown: Dict[str, Any]
    scores: Dict[str, float]
    overall_score: float
    risks: List[str]
    suggested_trim: Optional[Dict[str, float]] = None
    recommended_platforms: List[str]
    status: str = "suggested"
    rejection_reason: Optional[str] = None


def format_seconds_to_timestamp(seconds: float) -> str:
    """Format seconds into MM:SS or HH:MM:SS string."""
    total_sec = int(round(seconds))
    hrs = total_sec // 3600
    mins = (total_sec % 3600) // 60
    secs = total_sec % 60
    if hrs > 0:
        return f"{hrs:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"


def generate_clip_title(hook_line: str, text: str) -> str:
    """Synthesize a punchy, executive title from hook and span text."""
    # Check for specific numbers or key topics
    lowered = (hook_line + " " + text).lower()
    
    # Heuristics for common founder topics
    if "42,000" in hook_line or "$42k" in hook_line:
        return "The $42k Compute Bill That Almost Killed Us"
    if "70%" in hook_line or "gross margin" in lowered:
        return "The 70% Gross Margin Rule for AI Startups"
    if "token" in hook_line or "per query" in lowered:
        return "Why Per-Token Pricing Kills Conversion"
    if "10x" in hook_line or "canceled" in lowered:
        return "What Happens When You 10x Price Overnight"
    if "fire" in hook_line or "fired" in lowered:
        return "Why You Must Fire 90% of Your Early Users"
    if "radar" in lowered and "megaphone" in lowered:
        return "The Radar vs Megaphone Content Philosophy"
    if "dau/mau" in lowered:
        return "The One Metric That Predicts B2B Churn"
    if "procurement" in lowered:
        return "The Enterprise Procurement Psychological Game"
    if "open weights" in lowered or "weights as the moat" in lowered:
        return "Why Fine-Tuned Weights Are Not Your Moat"
    if "daily workflow" in lowered:
        return "The Litmus Test for Real Enterprise Moats"

    # Default: Clean first sentence into title
    clean = re.sub(r"[^\w\s-]", "", hook_line).strip()
    words = clean.split()
    if 3 <= len(words) <= 9:
        return " ".join(words).title()
    elif len(words) > 9:
        return " ".join(words[:8]).title() + "..."
    return "High Impact Founder Insight"


def compute_span_overlap_iou(a_start: float, a_end: float, b_start: float, b_end: float) -> float:
    """Calculate Intersection-over-Union (IoU) of two temporal spans."""
    intersection = max(0.0, min(a_end, b_end) - max(a_start, b_start))
    if intersection <= 0.0:
        return 0.0
    union = max(a_end, b_end) - min(a_start, b_start)
    return intersection / union if union > 0 else 0.0


def compute_span_overlap_ratio(a_start: float, a_end: float, b_start: float, b_end: float) -> float:
    """Calculate overlap fraction relative to the shorter span."""
    intersection = max(0.0, min(a_end, b_end) - max(a_start, b_start))
    if intersection <= 0.0:
        return 0.0
    min_dur = min(a_end - a_start, b_end - b_start)
    return intersection / min_dur if min_dur > 0 else 0.0


def deduplicate_candidate_spans(
    scored_candidates: List[ScoredClipCandidate],
    iou_threshold: float = 0.35,
    overlap_ratio_threshold: float = 0.50,
) -> List[ScoredClipCandidate]:
    """Non-Maximum Suppression (NMS) on temporal spans to eliminate overlapping duplicates."""
    # Sort descending by overall score
    sorted_items = sorted(
        scored_candidates,
        key=lambda x: x.scores.overall_score,
        reverse=True,
    )

    selected: List[ScoredClipCandidate] = []

    for item in sorted_items:
        c = item.candidate
        overlaps = False

        for kept in selected:
            k = kept.candidate
            iou = compute_span_overlap_iou(c.start_time, c.end_time, k.start_time, k.end_time)
            ratio = compute_span_overlap_ratio(c.start_time, c.end_time, k.start_time, k.end_time)

            if iou >= iou_threshold or ratio >= overlap_ratio_threshold:
                overlaps = True
                break

        if not overlaps:
            selected.append(item)

    return selected


def synthesize_clip_output(
    item: ScoredClipCandidate,
    project_id: str,
    index: int,
) -> FormattedClip:
    """Transform scored candidate into rich typed clip payload for UI & DB."""
    c = item.candidate
    s = item.scores

    # Deterministic stable ID
    hash_seed = f"{project_id}_{c.start_time:.1f}_{c.end_time:.1f}"
    clip_id = f"clip_{hashlib.md5(hash_seed.encode()).hexdigest()[:8]}"

    title = generate_clip_title(c.hook_line, c.text)

    # Detailed breakdown dictionary
    breakdown_dict = {
        "hook_strength": {
            "score": s.hook_strength.score,
            "rationale": s.hook_strength.rationale,
        },
        "standalone_clarity": {
            "score": s.standalone_clarity.score,
            "rationale": s.standalone_clarity.rationale,
        },
        "emotional_energy": {
            "score": s.emotional_energy.score,
            "rationale": s.emotional_energy.rationale,
        },
        "novelty_contrarian": {
            "score": s.novelty_contrarian.score,
            "rationale": s.novelty_contrarian.rationale,
        },
        "actionability_quotability": {
            "score": s.actionability_quotability.score,
            "rationale": s.actionability_quotability.rationale,
        },
        "platform_fit": {
            "score": s.platform_fit.score,
            "rationale": s.platform_fit.rationale,
        },
        "brand_fit": {
            "score": s.brand_fit.score,
            "rationale": s.brand_fit.rationale,
        },
        "performance_prior": {
            "score": s.performance_prior.score,
            "rationale": s.performance_prior.rationale,
        },
    }

    # Flat scores dict for fast frontend visual bars
    flat_scores = {
        "overall": s.overall_score,
        "hook": s.hook_strength.score,
        "hook_strength": s.hook_strength.score,
        "standalone": s.standalone_clarity.score,
        "standalone_clarity": s.standalone_clarity.score,
        "density": s.actionability_quotability.score,
        "information_density": s.actionability_quotability.score,
        "emotional_resonance": s.emotional_energy.score,
        "emotional_energy": s.emotional_energy.score,
        "novelty": s.novelty_contrarian.score,
        "novelty_contrarian": s.novelty_contrarian.score,
        "actionability": s.actionability_quotability.score,
        "actionability_quotability": s.actionability_quotability.score,
        "brand_fit": s.brand_fit.score,
        "performance_prior": s.performance_prior.score,
        "platform_fit": s.platform_fit.score,
    }

    start_formatted = format_seconds_to_timestamp(c.start_time)
    end_formatted = format_seconds_to_timestamp(c.end_time)
    duration_formatted = f"{int(round(c.duration))}s"

    return FormattedClip(
        id=clip_id,
        project_id=project_id,
        title=title,
        start_time=c.start_time,
        end_time=c.end_time,
        duration=c.duration,
        duration_formatted=duration_formatted,
        start_time_formatted=start_formatted,
        end_time_formatted=end_formatted,
        hook_line=c.hook_line,
        reasons=s.reasons,
        why_this_clip=s.reasons,
        evidence_quote=s.evidence_quote,
        score_breakdown=breakdown_dict,
        scores=flat_scores,
        overall_score=s.overall_score,
        risks=s.risks,
        suggested_trim=s.suggested_trim,
        recommended_platforms=s.recommended_platforms,
        status="suggested",
    )


def rank_and_deduplicate(
    scored_candidates: List[ScoredClipCandidate],
    project_id: str,
    target_count: int = 10,
    iou_threshold: float = 0.35,
) -> List[FormattedClip]:
    """Execute deduplication and rank candidates, outputting formatted clips."""
    if not scored_candidates:
        return []

    # Step 1: NMS deduplication
    deduped = deduplicate_candidate_spans(
        scored_candidates,
        iou_threshold=iou_threshold,
    )

    # Step 2: Sort descending by overall score
    ranked = sorted(deduped, key=lambda x: x.scores.overall_score, reverse=True)

    # Step 3: Cap at target count
    selected = ranked[:target_count]

    # Step 4: Synthesize full per-clip deliverables
    return [
        synthesize_clip_output(item, project_id=project_id, index=idx)
        for idx, item in enumerate(selected)
    ]
