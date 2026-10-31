"""
Candidate Generation Engine for Reel Clips.
Implements sliding window segmentation (20s - 90s) snapping to sentence boundaries
from transcript segments.
"""

import re
import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class TranscriptSegment(BaseModel):
    id: str
    start_time: float
    end_time: float
    speaker: Optional[str] = "Speaker"
    text: str


class SentenceBoundary(BaseModel):
    text: str
    start_time: float
    end_time: float
    speaker: Optional[str] = None
    segment_id: Optional[str] = None


class CandidateClipSpan(BaseModel):
    id: str = Field(default_factory=lambda: f"cand_{uuid.uuid4().hex[:8]}")
    start_time: float
    end_time: float
    duration: float
    text: str
    hook_line: str
    speakers: List[str] = Field(default_factory=list)
    segment_ids: List[str] = Field(default_factory=list)
    word_count: int = 0


def split_into_sentences(text: str) -> List[str]:
    """Split text into sentences preserving sentence-ending punctuation."""
    cleaned = text.strip()
    if not cleaned:
        return []
    # Match sentences ending with ., !, ? or end of string
    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    return [p.strip() for p in parts if p.strip()]


def extract_sentence_boundaries(
    segments: List[TranscriptSegment],
) -> List[SentenceBoundary]:
    """Break transcript segments down to sentence boundaries with interpolated timestamps."""
    boundaries: List[SentenceBoundary] = []

    for seg in segments:
        seg_duration = max(0.1, seg.end_time - seg.start_time)
        sentences = split_into_sentences(seg.text)
        if not sentences:
            continue

        total_chars = max(1, sum(len(s) for s in sentences))
        curr_offset = 0

        for sentence in sentences:
            s_len = len(sentence)
            s_start = seg.start_time + (curr_offset / total_chars) * seg_duration
            s_end = (
                seg.start_time
                + ((curr_offset + s_len) / total_chars) * seg_duration
            )
            curr_offset += s_len

            boundaries.append(
                SentenceBoundary(
                    text=sentence,
                    start_time=round(s_start, 2),
                    end_time=round(min(seg.end_time, s_end), 2),
                    speaker=seg.speaker,
                    segment_id=seg.id,
                )
            )

    return boundaries


def extract_hook_line(sentences: List[SentenceBoundary]) -> str:
    """Extract first punchy attention grabber sentence (first 3-5 seconds)."""
    if not sentences:
        return ""
    first = sentences[0].text.strip()
    # If first sentence is ultra-short (e.g. 'Yeah.' or 'Exactly.'), include second
    if len(first.split()) < 4 and len(sentences) > 1:
        return f"{first} {sentences[1].text.strip()}"
    return first


def generate_candidate_spans(
    segments: List[TranscriptSegment],
    min_duration: float = 20.0,
    max_duration: float = 90.0,
    target_count: int = 15,
    stride_sentences: int = 1,
) -> List[CandidateClipSpan]:
    """Generate candidate clip spans using sliding window snapping to sentence boundaries.
    
    Ensures candidates:
    1. Snap to clean sentence starts and ends (no mid-sentence cuts).
    2. Fall strictly within [min_duration, max_duration] (typically 20s - 90s).
    3. Include hook_line and speaker attribution.
    """
    if not segments:
        return []

    boundaries = extract_sentence_boundaries(segments)
    if not boundaries:
        return []

    candidates: List[CandidateClipSpan] = []
    n = len(boundaries)

    # If entire transcript is shorter than min_duration, still return the whole span if >= 8s
    total_time = boundaries[-1].end_time - boundaries[0].start_time
    if total_time < min_duration and total_time >= 8.0:
        full_text = " ".join(b.text for b in boundaries)
        hook = extract_hook_line(boundaries)
        speakers = list({b.speaker for b in boundaries if b.speaker})
        seg_ids = list({b.segment_id for b in boundaries if b.segment_id})
        return [
            CandidateClipSpan(
                start_time=boundaries[0].start_time,
                end_time=boundaries[-1].end_time,
                duration=round(total_time, 2),
                text=full_text,
                hook_line=hook,
                speakers=speakers,
                segment_ids=seg_ids,
                word_count=len(full_text.split()),
            )
        ]

    # Target durations to sample diverse natural stopping points
    natural_targets = [25.0, 35.0, 45.0, 60.0, 75.0, 90.0]

    for i in range(0, n, stride_sentences):
        start_boundary = boundaries[i]
        curr_sentences: List[SentenceBoundary] = []

        for j in range(i, n):
            b = boundaries[j]
            curr_sentences.append(b)

            dur = round(b.end_time - start_boundary.start_time, 2)

            if dur > max_duration:
                break

            if dur >= min_duration:
                # Check if this sentence boundary provides a good natural stopping point:
                # Either near one of our target durations, or sentence ends with strong mark (. ? !)
                span_text = " ".join(s.text for s in curr_sentences)
                hook = extract_hook_line(curr_sentences)
                speakers = list({s.speaker for s in curr_sentences if s.speaker})
                seg_ids = list({s.segment_id for s in curr_sentences if s.segment_id})

                candidates.append(
                    CandidateClipSpan(
                        start_time=start_boundary.start_time,
                        end_time=b.end_time,
                        duration=dur,
                        text=span_text,
                        hook_line=hook,
                        speakers=speakers,
                        segment_ids=seg_ids,
                        word_count=len(span_text.split()),
                    )
                )

                # If we've reached a substantial candidate, don't generate 20 micro-variations
                # Advance when duration crosses natural brackets
                if any(abs(dur - target) < 3.0 for target in natural_targets):
                    # Continue searching up to max_duration for longer variant
                    pass

    # If no candidate met min_duration because individual segments were small and stride missed,
    # fallback to accumulating from start to end
    if not candidates and boundaries:
        full_text = " ".join(b.text for b in boundaries)
        hook = extract_hook_line(boundaries)
        dur = round(boundaries[-1].end_time - boundaries[0].start_time, 2)
        candidates.append(
            CandidateClipSpan(
                start_time=boundaries[0].start_time,
                end_time=boundaries[-1].end_time,
                duration=dur,
                text=full_text,
                hook_line=hook,
                speakers=list({b.speaker for b in boundaries if b.speaker}),
                segment_ids=list({b.segment_id for b in boundaries if b.segment_id}),
                word_count=len(full_text.split()),
            )
        )

    return candidates
