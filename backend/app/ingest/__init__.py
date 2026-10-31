"""
Reel Ingestion Package
Provides audio processing, Whisper ASR chunked transcription,
chapter segmentation, pgvector embeddings, and real-time SSE progress pipelines.
"""

from app.ingest.audio_processor import chunk_audio, extract_audio, is_ffmpeg_available
from app.ingest.job_pipeline import process_media_file, process_sample_podcast, process_transcript_text
from app.ingest.transcriber import detect_chapters, embed_segments, parse_pasted_transcript

__all__ = [
    "chunk_audio",
    "extract_audio",
    "is_ffmpeg_available",
    "process_media_file",
    "process_sample_podcast",
    "process_transcript_text",
    "detect_chapters",
    "embed_segments",
    "parse_pasted_transcript",
]
