"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  Database,
  Volume2,
  Cpu,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

export interface ProgressStage {
  id: string;
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: ProgressStage[] = [
  { id: "uploading", name: "Uploading", label: "Media Upload", icon: Volume2 },
  { id: "extracting", name: "Extracting Audio", label: "16kHz Mono Demux", icon: Cpu },
  { id: "asr", name: "Chunked ASR", label: "Whisper Large-v3", icon: RefreshCw },
  { id: "segmenting", name: "Segmenting", label: "Sentence Windows", icon: Layers },
  { id: "vectorizing", name: "Vectorizing", label: "pgvector 384-dim", icon: Database },
  { id: "completed", name: "Done", label: "Indexed & Scored", icon: FileCheck },
];

interface SSEProgressTrackerProps {
  isProcessing: boolean;
  currentStageIndex: number;
  progressPct: number;
  statusMessage: string;
  onComplete?: () => void;
}

export function SSEProgressTracker({
  isProcessing,
  currentStageIndex,
  progressPct,
  statusMessage,
}: SSEProgressTrackerProps) {
  const isComplete = progressPct >= 100 || currentStageIndex >= STAGES.length - 1;

  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-4">
      {/* Header with live SSE badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isComplete
                ? "bg-success"
                : isProcessing
                ? "bg-accent animate-ping"
                : "bg-tertiary"
            }`}
          />
          <div>
            <div className="text-xs font-semibold text-primary flex items-center gap-2">
              <span>Ingestion Pipeline SSE Stream</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle text-secondary border border-border">
                {isProcessing ? "STREAMING: /jobs/{id}/events" : isComplete ? "STREAM COMPLETED" : "READY"}
              </span>
            </div>
            <div className="text-[11px] text-secondary font-mono mt-0.5">
              {statusMessage}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-primary">
              {progressPct}%
            </div>
            <div className="text-[10px] font-mono text-tertiary">PROGRESS</div>
          </div>
          {isComplete && (
            <Link
              href="/app/clips"
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Inspect 12 Clips</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            isComplete ? "bg-success" : "bg-accent"
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
        {STAGES.map((stage, idx) => {
          const StepIcon = stage.icon;
          const isDone = idx < currentStageIndex || isComplete;
          const isCurrent = idx === currentStageIndex && !isComplete && isProcessing;

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded border transition-colors ${
                isDone
                  ? "bg-success/5 border-success/30 text-success"
                  : isCurrent
                  ? "bg-accent-subtle border-accent text-accent shadow-sm"
                  : "bg-canvas border-border text-tertiary opacity-75"
              }`}
            >
              <div className="flex items-center justify-between">
                <StepIcon
                  className={`w-3.5 h-3.5 ${
                    isCurrent ? "animate-spin text-accent" : isDone ? "text-success" : "text-tertiary"
                  }`}
                />
                <span className="text-[10px] font-mono font-semibold">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : isCurrent ? (
                    <span className="text-accent">{Math.min(99, progressPct)}%</span>
                  ) : (
                    `0${idx + 1}`
                  )}
                </span>
              </div>
              <div
                className={`text-xs font-semibold mt-1.5 truncate ${
                  isDone
                    ? "text-primary"
                    : isCurrent
                    ? "text-primary font-bold"
                    : "text-secondary"
                }`}
              >
                {stage.name}
              </div>
              <div className="text-[10px] font-mono text-tertiary truncate mt-0.5">
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Telemetry strip */}
      <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between text-[11px] font-mono text-tertiary gap-2">
        <div className="flex items-center gap-4">
          <span>THROUGHPUT: 18.4x real-time</span>
          <span>·</span>
          <span>CHUNKS: 148 / 148</span>
          <span>·</span>
          <span>MODEL: Whisper L-v3 (FP16)</span>
        </div>
        <div className="text-primary font-semibold">
          {isComplete ? "12 Candidate Clips Extracted (Avg Score 9.0/10)" : "Processing audio segments..."}
        </div>
      </div>
    </div>
  );
}
