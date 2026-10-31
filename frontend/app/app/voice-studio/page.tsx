"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic,
  Sparkles,
  ArrowRight,
  Check,
  RefreshCw,
  Copy,
  Sliders,
  CornerDownLeft,
} from "lucide-react";

export default function VoiceStudioPage() {
  const sampleScenarios = [
    {
      id: "calendar",
      title: "Voice Scheduling Directive",
      description: "Schedule clips into optimal IST slots using natural messy speech.",
      raw: "Hey Reel um schedule the first three clips across next week, uh actually make that Tuesday and Thursday, on LinkedIn in the morning around 9:30 AM IST and Reels in the evening.",
      fillers: ["um", "uh actually", "around"],
      strikethrough: "across next week",
      cleanText: "Schedule clips 1, 2, and 3 on Tuesday and Thursday. LinkedIn at 09:30 AM IST, Reels at 07:30 PM IST.",
      intent: "schedule_calendar",
      parsedAction: {
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
      id: "perf",
      title: "Voice Performance Logging",
      description: "Dictate view and save metrics straight from phone after checking LinkedIn.",
      raw: "So the pricing clip on LinkedIn got like 14,200 views and uh 380 likes, but the contrarian one kinda flopped with only 1,100 views.",
      fillers: ["like", "uh", "kinda"],
      strikethrough: null,
      cleanText: "Log post metrics: Pricing clip (14,200 views, 380 likes). Contrarian clip (1,100 views).",
      intent: "log_performance",
      parsedAction: {
        action: "log_performance",
        posts: [
          { clip: "pricing", platform: "linkedin", views: 14200, likes: 380, status: "hit" },
          { clip: "contrarian", platform: "linkedin", views: 1100, likes: 24, status: "underperformed" },
        ],
        feature_lift_impact: "+18% weight to pricing analysis",
      },
    },
    {
      id: "rule",
      title: "Voice Brand Rule Extraction",
      description: "Refine voice memory guidelines conversationally without filling out forms.",
      raw: "Make the LinkedIn hook punchier and um remove the word leverage, actually don't ever use corporate buzzwords like leverage or synergy in any post.",
      fillers: ["um", "actually"],
      strikethrough: "remove the word leverage",
      cleanText: "Update brand rule: Ban 'leverage' and 'synergy' across all platforms. Enforce punchy founder tone.",
      intent: "update_voice_rule",
      parsedAction: {
        action: "update_voice_rule",
        banned_phrases: ["leverage", "synergy"],
        style_directive: "punchy, direct founder tone",
        confidence: 0.95,
      },
    },
  ];

  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const currentScenario = sampleScenarios[activeScenarioIdx];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Voice
            </span>
            <span className="text-xs font-mono text-tertiary">Wispr Flow Integration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Voice Studio & Structured Intent Parser
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Side-by-side inspection of conversational speech cleaning, filler removal, and self-correction resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/clips"
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Back to Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Scenario Switcher */}
      <div className="bg-surface border border-border rounded-lg p-2 flex items-center gap-2 overflow-x-auto shadow-card">
        {sampleScenarios.map((sc, idx) => (
          <button
            key={sc.id}
            onClick={() => setActiveScenarioIdx(idx)}
            className={`px-3 py-2 rounded text-xs font-medium shrink-0 transition-colors ${
              activeScenarioIdx === idx
                ? "bg-primary text-surface font-semibold shadow-sm"
                : "text-secondary hover:text-primary hover:bg-surface-subtle"
            }`}
          >
            {sc.title}
          </button>
        ))}
      </div>

      {/* Side-by-side View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Raw Speech with Fillers & Corrections */}
        <div className="lg:col-span-6 bg-surface border border-border rounded-lg p-6 shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-primary">
                  Raw Speech Transcript (Wispr Audio Input)
                </span>
              </div>
              <span className="text-[10px] font-mono text-tertiary">
                Filler Detection Active
              </span>
            </div>

            <div className="mt-4 p-4 bg-canvas rounded border border-border text-xs leading-relaxed font-mono">
              <p className="text-primary">
                {currentScenario.raw.split(" ").map((word, i) => {
                  const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
                  const isFiller = currentScenario.fillers.some((f) =>
                    f.toLowerCase().includes(cleanWord)
                  );
                  const isStrike =
                    currentScenario.strikethrough &&
                    currentScenario.strikethrough
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
                      >
                        {word}{" "}
                      </span>
                    );
                  }
                  return <span key={i}>{word} </span>;
                })}
              </p>
            </div>

            <div className="mt-4 space-y-1.5 text-xs font-mono text-tertiary">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>Orange highlights: Filtered conversational fillers ({currentScenario.fillers.join(", ")})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                <span>Red strikethrough: Discarded self-corrections</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border text-[11px] font-mono text-tertiary flex items-center justify-between">
            <span>Audio stream: 16kHz Mono</span>
            <span className="text-success font-medium">Wispr Flow Cleaned</span>
          </div>
        </div>

        {/* Right: Cleaned Structured Intent */}
        <div className="lg:col-span-6 bg-surface border border-border rounded-lg p-6 shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-primary">
                  Structured Intent & Action Schema
                </span>
              </div>
              <span className="text-xs font-mono text-accent font-semibold">
                {currentScenario.intent}
              </span>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="p-3 bg-surface-subtle rounded border border-border text-primary font-sans">
                <div className="text-[10px] text-tertiary font-mono uppercase mb-0.5">
                  CLEAN INTENT SUMMARY
                </div>
                {currentScenario.cleanText}
              </div>

              <div>
                <div className="text-[10px] text-tertiary uppercase mb-1">
                  PYDANTIC SCHEMA VALIDATED:
                </div>
                <pre className="p-3 bg-canvas rounded border border-border text-[11px] text-primary overflow-x-auto leading-relaxed">
                  {JSON.stringify(currentScenario.parsedAction, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-tertiary font-mono">
              Ready for Studio Execution
            </span>
            <button
              onClick={() => alert(`Executed: ${currentScenario.intent}`)}
              className="px-3 py-1.5 bg-primary hover:bg-black text-surface font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <span>Execute Action</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
