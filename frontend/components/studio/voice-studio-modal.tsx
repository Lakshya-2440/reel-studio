"use client";

import { useState } from "react";
import { X, Mic, ArrowRight, Sparkles, Check, Play, RefreshCw } from "lucide-react";
import { VoiceInterpretation } from "@/lib/api";

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyIntent?: (intent: any) => void;
}

export function VoiceStudioModal({
  isOpen,
  onClose,
  onApplyIntent,
}: VoiceStudioModalProps) {
  const samplePresets = [
    {
      label: "Schedule Week",
      raw: "Hey TheContentCompany um schedule the first three clips across next week, uh actually make that Tuesday and Thursday, on LinkedIn in the morning around 9:30 AM IST and Reels in the evening.",
      fillers: ["um", "uh actually", "around"],
      strikethrough: "across next week",
      correction: "Tuesday and Thursday at 09:30 IST & 19:30 IST",
      intent: "schedule_calendar",
      json: {
        action: "schedule_calendar",
        target_clips: ["clip-01", "clip-02", "clip-03"],
        slots: [
          { day: "Tuesday", time_ist: "09:30", platform: "linkedin" },
          { day: "Tuesday", time_ist: "19:30", platform: "reels" },
          { day: "Thursday", time_ist: "09:30", platform: "linkedin" },
        ],
        corrected_from: "across next week",
      },
    },
    {
      label: "Log Performance",
      raw: "So the pricing clip on LinkedIn got like 14,200 views and uh 380 likes, but the contrarian one kinda flopped with only 1,100 views.",
      fillers: ["like", "uh", "kinda"],
      strikethrough: null,
      correction: "Logged 2 metric points; feature weight updated for 'pricing breakdown'",
      intent: "log_metrics",
      json: {
        action: "log_performance",
        posts: [
          { clip: "pricing", platform: "linkedin", views: 14200, likes: 380, status: "hit" },
          { clip: "contrarian", platform: "linkedin", views: 1100, likes: 24, status: "underperformed" },
        ],
        feature_lift_impact: "+18% weight to pricing analysis",
      },
    },
    {
      label: "Refine Voice Rule",
      raw: "Make the LinkedIn hook punchier and um remove the word leverage, actually don't ever use corporate buzzwords like leverage or synergy in any post.",
      fillers: ["um", "actually"],
      strikethrough: "remove the word leverage",
      correction: "Global rule: Ban 'leverage', 'synergy' across all variants",
      intent: "update_voice_rule",
      json: {
        action: "update_voice_rule",
        banned_phrases: ["leverage", "synergy"],
        style_directive: "punchy, direct founder tone",
        confidence: 0.95,
      },
    },
  ];

  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const currentPreset = samplePresets[activePresetIndex];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="h-14 border-b border-border px-6 flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-accent-subtle text-accent border border-accent/20">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-primary">Voice Studio & Intent Inspector</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-tertiary">
                  Wispr Flow Pipeline
                </span>
              </div>
              <p className="text-[11px] text-secondary">
                Transforms conversational speech into deterministic actions and brand rules.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-surface-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="px-6 py-2.5 bg-surface-subtle border-b border-border flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-tertiary font-mono text-[11px] shrink-0">Sample Voice Scenarios:</span>
          {samplePresets.map((preset, idx) => (
            <button
              key={preset.label}
              onClick={() => setActivePresetIndex(idx)}
              className={`px-3 py-1 rounded text-xs font-medium shrink-0 transition-colors ${
                activePresetIndex === idx
                  ? "bg-surface text-primary border border-border shadow-sm font-semibold"
                  : "text-secondary hover:text-primary hover:bg-surface/60"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Modal Body: Side-by-side View */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left Column: Raw Speech Transcript */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
                Raw Wispr Audio Input
              </span>
              <span className="text-[10px] font-mono text-tertiary">
                Fillers: {currentPreset.fillers.length} detected
              </span>
            </div>

            <div className="flex-1 p-4 bg-canvas rounded border border-border text-xs leading-relaxed font-mono flex flex-col justify-between">
              <div>
                <p className="text-primary whitespace-pre-wrap">
                  {currentPreset.raw.split(" ").map((word, i) => {
                    const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
                    const isFiller = currentPreset.fillers.some((f) =>
                      f.toLowerCase().includes(cleanWord)
                    );
                    const isStrike =
                      currentPreset.strikethrough &&
                      currentPreset.strikethrough
                        .toLowerCase()
                        .includes(cleanWord);

                    if (isStrike) {
                      return (
                        <span
                          key={i}
                          className="line-through text-destructive bg-destructive/10 px-0.5 rounded mr-1"
                        >
                          {word}{" "}
                        </span>
                      );
                    }
                    if (isFiller) {
                      return (
                        <span
                          key={i}
                          className="bg-accent-subtle text-accent font-semibold px-1 py-0.5 rounded border border-accent/20 mr-1"
                          title="Filler word filtered by Wispr model"
                        >
                          {word}{" "}
                        </span>
                      );
                    }
                    return <span key={i}>{word} </span>;
                  })}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border text-[11px] text-tertiary flex items-center justify-between">
                <span>Audio input: 16kHz PCM</span>
                <span className="text-success font-medium">Whisper ASR + Wispr Filter</span>
              </div>
            </div>

            <div className="text-[11px] text-tertiary font-mono space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>Orange highlights: Discarded hesitation markers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                <span>Red strikethrough: Auto-resolved self-corrections</span>
              </div>
            </div>
          </div>

          {/* Right Column: Cleaned Structured Intent */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
                Cleaned Intent & Schema
              </span>
              <span className="text-[10px] font-mono text-accent font-semibold">
                Intent: {currentPreset.intent}
              </span>
            </div>

            <div className="flex-1 p-4 bg-surface rounded border border-border text-xs leading-relaxed font-mono flex flex-col justify-between">
              <div>
                <div className="mb-3 p-2 bg-surface-subtle rounded border border-border text-xs text-primary font-sans font-medium">
                  {currentPreset.correction}
                </div>

                <div className="text-[11px] text-tertiary mb-1 font-mono">
                  Parsed Action JSON:
                </div>
                <pre className="p-3 bg-canvas rounded border border-border text-[11px] text-primary overflow-x-auto">
                  {JSON.stringify(currentPreset.json, null, 2)}
                </pre>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-tertiary font-mono">Status: Ready to apply</span>
                <span className="text-success font-mono font-medium">Deterministic Pydantic</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded text-xs font-medium text-secondary hover:text-primary border border-border bg-surface hover:bg-surface-subtle"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (onApplyIntent) onApplyIntent(currentPreset.json);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded text-xs font-medium text-surface bg-accent hover:bg-accent-hover flex items-center gap-1.5 transition-colors"
              >
                <span>Execute Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
