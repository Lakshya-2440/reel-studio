"""
Reel Clips Module - Clip Finder and 8-Signal Scoring Engine.
"""

from app.clips.candidate_generator import (
    CandidateClipSpan,
    SentenceBoundary,
    TranscriptSegment,
    generate_candidate_spans,
)
from app.clips.ranker import (
    FormattedClip,
    ScoredClipCandidate,
    rank_and_deduplicate,
)
from app.clips.scorer import (
    ClipScoreBreakdown,
    SignalScore,
    score_candidate_deterministic,
    score_candidate_with_llm,
)

__all__ = [
    "CandidateClipSpan",
    "SentenceBoundary",
    "TranscriptSegment",
    "generate_candidate_spans",
    "ClipScoreBreakdown",
    "SignalScore",
    "score_candidate_deterministic",
    "score_candidate_with_llm",
    "FormattedClip",
    "ScoredClipCandidate",
    "rank_and_deduplicate",
]
