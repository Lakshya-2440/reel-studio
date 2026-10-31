"use client";

import { useState } from "react";
import { Sliders, Clock, Scissors, RotateCcw, AlertTriangle } from "lucide-react";

interface ClipTrimEditorProps {
  initialStartSeconds: number;
  initialEndSeconds: number;
  initialDuration: number;
  onTrimChange?: (newStart: number, newEnd: number) => void;
}

export function ClipTrimEditor({
  initialStartSeconds,
  initialEndSeconds,
  initialDuration,
  onTrimChange,
}: ClipTrimEditorProps) {
  const [startSeconds, setStartSeconds] = useState(initialStartSeconds);
  const [endSeconds, setEndSeconds] = useState(initialEndSeconds);

  const duration = Math.max(1, endSeconds - startSeconds);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const handleStartChange = (val: number) => {
    const clamped = Math.min(val, endSeconds - 5);
    setStartSeconds(clamped);
    onTrimChange?.(clamped, endSeconds);
  };

  const handleEndChange = (val: number) => {
    const clamped = Math.max(val, startSeconds + 5);
    setEndSeconds(clamped);
    onTrimChange?.(startSeconds, clamped);
  };

  const handleReset = () => {
    setStartSeconds(initialStartSeconds);
    setEndSeconds(initialEndSeconds);
    onTrimChange?.(initialStartSeconds, initialEndSeconds);
  };

  return (
    <div className="bg-canvas p-3 rounded border border-border space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          <Scissors className="w-3.5 h-3.5 text-accent" />
          <span>Interactive Trim Boundaries</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-primary font-bold">
            Duration: {duration}s
          </span>
          <button
            onClick={handleReset}
            className="text-[11px] font-mono text-tertiary hover:text-primary flex items-center gap-1 transition-colors"
            title="Reset to AI detected boundary"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Waveform Bar Mockup with Trim Handles */}
      <div className="space-y-1.5">
        <div className="relative h-10 bg-surface rounded border border-border flex items-center px-2 overflow-hidden">
          {/* Simulated audio waveform bars */}
          <div className="w-full flex items-center justify-between gap-1 h-6 opacity-40">
            {Array.from({ length: 48 }).map((_, i) => {
              const h = 25 + Math.sin(i * 0.4) * 20 + ((i % 5) * 8);
              return (
                <div
                  key={i}
                  className="flex-1 bg-primary rounded-xs"
                  style={{ height: `${Math.min(100, Math.max(15, h))}%` }}
                />
              );
            })}
          </div>

          {/* Active Highlight Band */}
          <div
            className="absolute inset-y-0 bg-accent/15 border-x-2 border-accent"
            style={{
              left: `${Math.max(0, Math.min(90, ((startSeconds - initialStartSeconds + 5) / (initialDuration + 10)) * 100))}%`,
              right: `${Math.max(0, Math.min(90, ((initialEndSeconds - endSeconds + 5) / (initialDuration + 10)) * 100))}%`,
            }}
          />
        </div>

        {/* Stepper Inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-tertiary block">
              START BOUNDARY (SNAPPED TO SENTENCE)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={Math.max(0, initialStartSeconds - 15)}
                max={endSeconds - 5}
                value={startSeconds}
                onChange={(e) => handleStartChange(Number(e.target.value))}
                className="flex-1 accent-accent cursor-pointer"
              />
              <span className="font-mono text-xs font-semibold px-2 py-1 bg-surface border border-border rounded text-primary shrink-0">
                {formatSeconds(startSeconds)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-tertiary block">
              END BOUNDARY (SNAPPED TO SENTENCE)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={startSeconds + 5}
                max={initialEndSeconds + 15}
                value={endSeconds}
                onChange={(e) => handleEndChange(Number(e.target.value))}
                className="flex-1 accent-accent cursor-pointer"
              />
              <span className="font-mono text-xs font-semibold px-2 py-1 bg-surface border border-border rounded text-primary shrink-0">
                {formatSeconds(endSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
