"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { PlatformKey } from "./platform-tabs";

interface CharacterCounterProps {
  currentLength: number;
  platform: PlatformKey;
  charLimit: number;
  foldCutoff: number;
}

export function CharacterCounter({
  currentLength,
  platform,
  charLimit,
  foldCutoff,
}: CharacterCounterProps) {
  const isOverLimit = currentLength > charLimit;
  const isOverFold = currentLength > foldCutoff;

  let guidance = "";
  if (platform === "linkedin") {
    guidance = isOverFold
      ? `Hook fold threshold: First ${foldCutoff} characters will appear before the '...see more' button. Ensure your core hook punchline lands before this threshold.`
      : `Optimal length: Your entire hook displays without truncation!`;
  } else if (platform === "x") {
    guidance = isOverLimit
      ? `Exceeds single X post limit by ${currentLength - charLimit} chars. Automatically splits into a thread card.`
      : `${charLimit - currentLength} chars remaining before single post limit.`;
  } else if (platform === "shorts") {
    guidance = `YouTube Shorts titles must be <=100 characters to prevent mobile truncation.`;
  } else if (platform === "reels") {
    guidance = `First 125 chars appear as overlay caption in feed scroll.`;
  } else {
    guidance = `TikTok algorithmic recommendation: concise captions under 150 chars maximize comment interactions.`;
  }

  return (
    <div className="bg-canvas p-3 rounded border border-border space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          <Info className="w-3.5 h-3.5 text-accent" />
          <span>Platform Character & Fold Optimizer</span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
              isOverLimit
                ? "bg-destructive/10 text-destructive border-destructive/30"
                : "bg-surface text-primary border-border"
            }`}
          >
            {currentLength} / {charLimit} chars
          </span>
          {platform === "linkedin" && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                currentLength <= 210
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-accent-subtle text-accent border-accent/30"
              }`}
            >
              Fold: {Math.min(210, currentLength)} / 210
            </span>
          )}
        </div>
      </div>

      <div className="text-[11px] text-secondary flex items-start gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
        <span>{guidance}</span>
      </div>
    </div>
  );
}
