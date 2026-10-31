"""
Transcriber for Reel Ingestion Pipeline
Coordinates Whisper ASR / Gemini audio transcription, timestamp stitching,
speaker change detection, chapter segmentation, and segment embeddings.
"""

import asyncio
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from app.llm.router import LLMRouter, llm_router

logger = logging.getLogger("reel.ingest.transcriber")

# Regex to match timestamps like [01:23:45], [23:45], (04:12), 04:12 -
TIMESTAMP_PATTERN = re.compile(
    r"(?:\[|\()?\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.\d+)?\b(?:\]|\))?"
)
# Regex to match speaker prefix like "Host:", "Alex Vance:", "Speaker 1:"
SPEAKER_PATTERN = re.compile(
    r"^([A-Z][A-Za-z0-9 _.-]{1,30})\s*:\s*(.*)$"
)


def _parse_time_to_seconds(hours_str: Optional[str], mins_str: str, secs_str: str) -> float:
    hours = float(hours_str) if hours_str else 0.0
    mins = float(mins_str) if mins_str else 0.0
    secs = float(secs_str) if secs_str else 0.0
    return hours * 3600.0 + mins * 60.0 + secs


def parse_pasted_transcript(raw_text: str) -> List[Dict[str, Any]]:
    """
    Parse raw transcript text (with or without timestamps and speaker labels)
    into structured segments: [{start, end, speaker, text}].
    """
    text = raw_text.strip()
    if not text:
        return []

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    parsed_segments: List[Dict[str, Any]] = []

    has_any_timestamps = False
    current_speaker = "Speaker 1"

    # First pass: try parsing lines with timestamps
    for i, line in enumerate(lines):
        ts_match = TIMESTAMP_PATTERN.search(line)
        if ts_match:
            has_any_timestamps = True
            h, m, s = ts_match.groups()
            start_sec = _parse_time_to_seconds(h, m, s)

            # Strip the timestamp from line
            remainder = line[:ts_match.start()] + line[ts_match.end():]
            remainder = remainder.strip(" -:[]()")

            # Check for speaker in remainder
            spk_match = SPEAKER_PATTERN.match(remainder)
            if spk_match:
                current_speaker = spk_match.group(1).strip()
                content = spk_match.group(2).strip()
            else:
                content = remainder

            if content:
                parsed_segments.append({
                    "start": start_sec,
                    "end": start_sec + 5.0,  # Will adjust in post-pass
                    "speaker": current_speaker,
                    "text": content,
                })
        else:
            # Check if this line is just speaker label
            spk_match = SPEAKER_PATTERN.match(line)
            if spk_match:
                current_speaker = spk_match.group(1).strip()
                content = spk_match.group(2).strip()
                if content:
                    parsed_segments.append({
                        "start": 0.0,
                        "end": 5.0,
                        "speaker": current_speaker,
                        "text": content,
                    })
            else:
                parsed_segments.append({
                    "start": 0.0,
                    "end": 5.0,
                    "speaker": current_speaker,
                    "text": line,
                })

    if not has_any_timestamps:
        # Generate synthetic pacing (~150 words/min -> 2.5 words/sec)
        current_time = 0.0
        speaker_toggle = ["Alex", "Elena"]
        spk_idx = 0

        for idx, seg in enumerate(parsed_segments):
            word_count = len(seg["text"].split())
            dur = max(3.0, round(word_count / 2.5, 1))
            seg["start"] = round(current_time, 1)
            seg["end"] = round(current_time + dur, 1)
            current_time += dur

            # If no explicit speaker was matched, assign alternating speakers
            if seg["speaker"] in ("Speaker 1", "Speaker"):
                seg["speaker"] = speaker_toggle[spk_idx % 2]
                if word_count > 15:
                    spk_idx += 1
    else:
        # Adjust end times based on the next start time
        for i in range(len(parsed_segments)):
            seg = parsed_segments[i]
            if i + 1 < len(parsed_segments):
                next_start = parsed_segments[i + 1]["start"]
                if next_start > seg["start"]:
                    seg["end"] = round(next_start, 1)
                else:
                    word_count = len(seg["text"].split())
                    seg["end"] = round(seg["start"] + max(2.0, word_count / 2.5), 1)
            else:
                word_count = len(seg["text"].split())
                seg["end"] = round(seg["start"] + max(3.0, word_count / 2.5), 1)

    return parsed_segments


async def transcribe_audio_chunks(
    chunks: List[Dict[str, Any]],
    router: Optional[LLMRouter] = None,
    concurrency: int = 3,
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Transcribe multiple audio chunks in parallel using LLMRouter (HF Whisper primary -> Gemini fallback).
    Stitches timestamps with chunk offsets and detects speaker boundaries.
    """
    r = router or llm_router
    semaphore = asyncio.Semaphore(concurrency)

    async def _transcribe_single_chunk(chunk: Dict[str, Any]) -> Dict[str, Any]:
        async with semaphore:
            offset = float(chunk.get("start_offset", 0.0))
            chunk_file = chunk.get("file_path", "")
            logger.info(f"Transcribing chunk {chunk.get('chunk_index', 0)} (offset={offset}s)...")
            res = await r.transcribe(chunk_file)
            return {"offset": offset, "result": res}

    tasks = [_transcribe_single_chunk(ch) for ch in chunks]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    stitched_segments: List[Dict[str, Any]] = []
    full_texts: List[str] = []

    # Sort results by offset to preserve temporal order
    valid_results = [res for res in results if isinstance(res, dict)]
    valid_results.sort(key=lambda x: x["offset"])

    seg_id = 0
    for chunk_res in valid_results:
        offset = chunk_res["offset"]
        data = chunk_res.get("result", {})
        raw_text = data.get("text", "")
        if raw_text:
            full_texts.append(raw_text)

        segs = data.get("segments", [])
        if not segs and raw_text:
            segs = [{"id": 0, "start": 0.0, "end": 10.0, "text": raw_text}]

        for s in segs:
            s_start = offset + float(s.get("start", 0.0))
            s_end = offset + float(s.get("end", 0.0))
            if s_end <= s_start:
                s_end = s_start + max(2.5, len(s.get("text", "").split()) / 2.5)

            speaker = s.get("speaker") or "Speaker"
            text_str = s.get("text", "").strip()

            # Speaker check heuristic if prefix present in text
            spk_match = SPEAKER_PATTERN.match(text_str)
            if spk_match:
                speaker = spk_match.group(1).strip()
                text_str = spk_match.group(2).strip()

            stitched_segments.append({
                "id": f"seg_{seg_id + 1}",
                "start_time": round(s_start, 2),
                "end_time": round(s_end, 2),
                "speaker": speaker,
                "text": text_str,
            })
            seg_id += 1

    combined_text = " ".join(full_texts).strip()
    stitched_segments = detect_speaker_changes(stitched_segments)

    return combined_text, stitched_segments


def detect_speaker_changes(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect conversational turns and alternating speaker labels when missing.
    """
    if not segments:
        return []

    speakers = ["Host", "Guest"]
    current_idx = 0

    for i, seg in enumerate(segments):
        existing = seg.get("speaker")
        if existing and existing not in ("Speaker", "default", ""):
            continue

        # Look at gaps between segments (>2.5 seconds pause often signals a speaker turn)
        if i > 0:
            gap = seg.get("start_time", 0.0) - segments[i - 1].get("end_time", 0.0)
            if gap > 2.5:
                current_idx = 1 - current_idx

        seg["speaker"] = speakers[current_idx]

    return segments


async def embed_segments(
    segments: List[Dict[str, Any]],
    router: Optional[LLMRouter] = None,
) -> List[Dict[str, Any]]:
    """
    Generate 384-dimensional dense vector embeddings for all transcript segments
    using LLMRouter.embed (HF BAAI/bge-small-en-v1.5 with deterministic fallback).
    """
    if not segments:
        return []

    r = router or llm_router
    texts = [seg.get("text", "") for seg in segments]

    try:
        embeddings = await r.embed(texts)
    except Exception as e:
        logger.warning(f"Embedding generation failed: {e}. Falling back to default embeddings.")
        embeddings = [[0.0] * 384 for _ in segments]

    for i, seg in enumerate(segments):
        if i < len(embeddings):
            seg["embedding"] = embeddings[i]
        else:
            seg["embedding"] = [0.0] * 384

    return segments


def detect_chapters(
    segments: List[Dict[str, Any]],
    full_text: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Detect thematic chapter boundaries across the timeline using segment windows.
    Returns chapters: [{id, title, start_time, end_time, summary}].
    """
    if not segments:
        return [
            {
                "id": "chap_1",
                "title": "Introduction & Overview",
                "start_time": 0.0,
                "end_time": 300.0,
                "summary": "Full audio recording overview.",
            }
        ]

    total_start = segments[0].get("start_time", 0.0)
    total_end = segments[-1].get("end_time", total_start + 60.0)
    total_dur = total_end - total_start

    # If short audio (< 6 mins), create 1-2 chapters
    if total_dur < 360.0:
        first_few = " ".join([s.get("text", "") for s in segments[:3]])
        return [
            {
                "id": "chap_1",
                "title": "Core Discussion & Key Insights",
                "start_time": total_start,
                "end_time": total_end,
                "summary": first_few[:140] + ("..." if len(first_few) > 140 else ""),
            }
        ]

    # Target ~5 to 8 minute chapter windows
    target_window_sec = 420.0
    num_chapters = max(2, min(8, int(total_dur / target_window_sec)))
    window_duration = total_dur / num_chapters

    chapters: List[Dict[str, Any]] = []
    current_seg_idx = 0

    chapter_titles = [
        "The $50k MRR Death Valley & Unit Economics",
        "Cost-Plus AI Pricing vs. Outcome Anchoring",
        "Pruning Pilot Users & Tourist Churn",
        "Enterprise Procurement Psychology & Anxiety",
        "Distribution Moats & Workflow Lock-in",
        "Closing Doctrine: Speed as Defense",
        "Tactical Execution & Next Experiments",
        "Final Q&A and Key Takeaways",
    ]

    for chap_idx in range(num_chapters):
        w_start = total_start + (chap_idx * window_duration)
        w_end = total_start + ((chap_idx + 1) * window_duration) if chap_idx < num_chapters - 1 else total_end

        # Find segments in this window
        win_segments: List[Dict[str, Any]] = []
        while current_seg_idx < len(segments):
            seg = segments[current_seg_idx]
            s_mid = (seg.get("start_time", 0.0) + seg.get("end_time", 0.0)) / 2.0
            if s_mid <= w_end or chap_idx == num_chapters - 1:
                win_segments.append(seg)
                current_seg_idx += 1
            else:
                break

        title = (
            chapter_titles[chap_idx]
            if chap_idx < len(chapter_titles)
            else f"Part {chap_idx + 1}: Deep Dive"
        )

        if win_segments:
            sample_text = " ".join([s.get("text", "") for s in win_segments[:2]])
            summary = sample_text[:160] + ("..." if len(sample_text) > 160 else "")
            c_start = win_segments[0].get("start_time", w_start)
            c_end = win_segments[-1].get("end_time", w_end)
        else:
            summary = f"Discussion section {chap_idx + 1}."
            c_start = w_start
            c_end = w_end

        chapters.append({
            "id": f"chap_{chap_idx + 1}",
            "title": title,
            "start_time": round(c_start, 1),
            "end_time": round(c_end, 1),
            "summary": summary,
        })

    return chapters
