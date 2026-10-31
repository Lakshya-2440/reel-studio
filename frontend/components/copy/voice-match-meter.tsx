"use client";

import { Brain, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

interface VoiceMatchMeterProps {
  score: number;
  rulesApplied: string[];
}

export function VoiceMatchMeter({ score, rulesApplied }: VoiceMatchMeterProps) {
  const isHigh = score >= 90;

  return (
    <div className="bg-surface p-3.5 rounded border border-border space-y-3">
      {/* Header & Gauge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent-subtle rounded border border-accent/20 text-accent">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span>Brand Voice Match Score</span>
              <span className="font-mono text-[10px] text-tertiary">· Profile v4</span>
            </div>
            <div className="text-[11px] text-secondary">
              Conditioned on 6 extracted creator rules & diff histories.
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-lg font-bold text-accent">
            {score}%
          </div>
          <div className="text-[10px] font-mono text-success font-semibold">
            ON-BRAND
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isHigh ? "bg-accent" : "bg-primary"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Rules Applied Checklist */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[10px] font-mono text-tertiary uppercase tracking-wider">
          Active Brand Rules Applied to this Draft:
        </div>
        <div className="grid grid-cols-1 gap-1 text-xs">
          {rulesApplied.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-1.5 rounded bg-canvas text-secondary font-mono text-[11px] border border-border/80"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
