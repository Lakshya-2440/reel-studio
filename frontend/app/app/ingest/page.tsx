"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Layers,
  Film,
  Database,
  Volume2,
} from "lucide-react";
import { MediaDropzone } from "@/components/ingest/media-dropzone";
import { SSEProgressTracker } from "@/components/ingest/sse-progress-tracker";
import { TranscriptViewer } from "@/components/ingest/transcript-viewer";
import { EPISODE_METADATA } from "@/lib/seed-data";

export default function IngestPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(100);
  const [stageIndex, setStageIndex] = useState(5); // 0 to 5 (Done)
  const [statusMessage, setStatusMessage] = useState(
    "Indexed & vectorized: 148 segments, 12 candidate clips ready for scoring."
  );

  const startPipelineSimulation = (sourceType: string, sourceDetail?: any) => {
    setIsProcessing(true);
    setProgressPct(5);
    setStageIndex(0);
    setStatusMessage(`Uploading media from ${sourceType}...`);

    const stageTimeline = [
      {
        pct: 18,
        stage: 0,
        msg: "Uploaded 48m 12s audio payload (128kbps stereo source).",
      },
      {
        pct: 35,
        stage: 1,
        msg: "ffmpeg: Demuxing into 16kHz mono WAV for Whisper Large-v3...",
      },
      {
        pct: 58,
        stage: 2,
        msg: "Chunked ASR: Transcribing 24 overlapping audio windows (FP16)...",
      },
      {
        pct: 76,
        stage: 3,
        msg: "Segmenting: Snapping transcript sentences and detecting speaker boundaries...",
      },
      {
        pct: 92,
        stage: 4,
        msg: "Vectorizing: Generating 384-dim embeddings (BAAI/bge-small-en-v1.5) in pgvector...",
      },
      {
        pct: 100,
        stage: 5,
        msg: "Complete: 148 segments indexed, 6 semantic chapters, 12 candidate clips extracted.",
      },
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < stageTimeline.length) {
        const item = stageTimeline[step];
        setProgressPct(item.pct);
        setStageIndex(item.stage);
        setStatusMessage(item.msg);
        step++;
      } else {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 900);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Pipeline 01
            </span>
            <span className="text-xs font-mono text-tertiary">Ingestion Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Long-form Podcast & Video Ingestion
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Process 30-90 min files into chunked transcripts, speaker boundaries, and chapter embeddings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/clips"
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>View 12 Scored Clips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Ingestion Dropzone & Demo Trigger */}
      <MediaDropzone
        onStartIngest={startPipelineSimulation}
        isProcessing={isProcessing}
      />

      {/* Live SSE Stage Progress Tracker */}
      <SSEProgressTracker
        isProcessing={isProcessing}
        currentStageIndex={stageIndex}
        progressPct={progressPct}
        statusMessage={statusMessage}
      />

      {/* Interactive Transcript Viewer & Scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase text-tertiary tracking-wider">
              Indexed Transcript & Topic Scrubber
            </span>
            <span className="text-[11px] font-mono text-tertiary">
              (Click any timestamp to seek playback)
            </span>
          </div>
          <Link
            href="/app/clips"
            className="text-xs text-accent hover:underline font-mono flex items-center gap-1 font-medium"
          >
            <span>Proceed to Clip Finder</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <TranscriptViewer />
      </div>
    </div>
  );
}
