"use client";

import { ClipScoreBreakdown } from "@/lib/seed-data";

interface ClipScoreBarsProps {
  scores: ClipScoreBreakdown;
  compact?: boolean;
}

export function ClipScoreBars({ scores, compact = false }: ClipScoreBarsProps) {
  const signalConfigs = [
    { key: "hook_strength", label: "Hook Strength", val: scores.hook_strength, desc: "First 3-second hook grip" },
    { key: "standalone_clarity", label: "Standalone Clarity", val: scores.standalone_clarity, desc: "Makes complete sense with zero context debt" },
    { key: "emotional_peak", label: "Emotional Peak", val: scores.emotional_peak, desc: "Arousal and vulnerability spike" },
    { key: "novelty", label: "Novelty & Contrarian", val: scores.novelty, desc: "Counters prevailing industry cliché" },
    { key: "quotability", label: "Quotability & Density", val: scores.quotability, desc: "High density of memorable soundbites" },
    { key: "platform_fit", label: "Platform Fit", val: scores.platform_fit, desc: "Compatibility with vertical 9:16 feeds" },
    { key: "brand_fit", label: "Brand Voice Fit", val: scores.brand_fit, desc: "Matches active Voice Memory rules" },
    { key: "performance_prior", label: "Performance Prior", val: scores.performance_prior, desc: "Learned lift from historical engagement loop" },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-[11px] font-mono text-tertiary">
        <span className="uppercase tracking-wider">8-Signal Scoring Engine (0-10)</span>
        <span className="text-primary font-bold">Overall: {scores.overall.toFixed(1)} / 10</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {signalConfigs.map((sig) => {
          const pct = Math.min(100, Math.max(0, (sig.val / 10) * 100));
          const isHigh = sig.val >= 9.0;

          return (
            <div key={sig.key} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-secondary truncate" title={sig.desc}>
                  {sig.label}
                </span>
                <span
                  className={`font-mono font-bold ${
                    isHigh ? "text-accent" : "text-primary"
                  }`}
                >
                  {sig.val.toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-surface-subtle h-1.5 rounded-full overflow-hidden border border-border/80">
                <div
                  className={`h-full transition-all duration-300 ${
                    isHigh ? "bg-accent" : "bg-primary/80"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
