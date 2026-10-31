"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Scissors,
  CheckCircle2,
  XCircle,
  Play,
  Share2,
  AlertTriangle,
  Sliders,
  Filter,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function ClipsPage() {
  const [filter, setFilter] = useState<"all" | "accepted" | "suggested">("all");
  const [selectedClipIndex, setSelectedClipIndex] = useState(0);

  const [clips, setClips] = useState([
    {
      id: "clip-01",
      title: "The Radar vs. Megaphone Content Philosophy",
      hook: "Most founders treat content like a megaphone. The best use it as a radar.",
      start_time: "04:12",
      end_time: "05:08",
      duration: "56s",
      scores: {
        overall: 9.4,
        hook: 9.6,
        density: 9.2,
        brand_fit: 9.5,
        standalone: 9.3,
        performance_prior: 9.4,
      },
      reasons: [
        "High Contrarian Punchline (radar vs megaphone metaphor captures executive attention)",
        "Zero context debt: does not reference prior segments or unmentioned people",
        "Directly matches Founder Authority voice memory rule (open with paradox)",
        "Proven high engagement format: 2.4x historical lift on B2B LinkedIn",
      ],
      evidence_quote:
        "Most founders build content as a megaphone to shout at buyers. But the sharpest ones use it as a radar. You publish raw thoughts to see who signals back.",
      risks: ["Guest laughs midway (04:42) — suggest 0.5s audio clean cut"],
      recommended_platforms: ["LinkedIn", "Reels", "X"],
      status: "accepted" as "suggested" | "accepted" | "rejected",
    },
    {
      id: "clip-02",
      title: "Why $50k Enterprise Contracts Break Most Seed Startups",
      hook: "The moment you close your first $50k check is usually when your product roadmap dies.",
      start_time: "25:30",
      end_time: "26:45",
      duration: "75s",
      scores: {
        overall: 9.1,
        hook: 9.4,
        density: 9.0,
        brand_fit: 9.1,
        standalone: 8.9,
        performance_prior: 9.1,
      },
      reasons: [
        "Unconventional pricing truth that counters prevailing 'go upmarket' advice",
        "Concrete numbers and metrics cited directly by the guest",
        "High comment propensity among founders experiencing custom feature demands",
      ],
      evidence_quote:
        "You think you won when the enterprise wire lands. Then you realize you just hired yourself out as an outsourced dev shop for one demanding logo.",
      risks: ["References earlier customer mention — boundary adjusted to start at 25:30"],
      recommended_platforms: ["LinkedIn", "Shorts", "X"],
      status: "suggested" as "suggested" | "accepted" | "rejected",
    },
    {
      id: "clip-03",
      title: "The Death of Generic AI Summaries",
      hook: "If your AI output sounds like a press release, nobody is reading past line two.",
      start_time: "32:10",
      end_time: "33:05",
      duration: "55s",
      scores: {
        overall: 8.8,
        hook: 9.0,
        density: 8.7,
        brand_fit: 8.9,
        standalone: 8.8,
        performance_prior: 8.6,
      },
      reasons: [
        "Strong audience resonance for creators feeling AI fatigue",
        "Direct advice actionable within 60 seconds",
        "Aligns with core brand manifesto against corporate buzzwords",
      ],
      evidence_quote:
        "The moment you use the word 'delve' or 'leverage', your reader mentally closes the tab.",
      risks: [],
      recommended_platforms: ["TikTok", "Reels", "X"],
      status: "suggested" as "suggested" | "accepted" | "rejected",
    },
    {
      id: "clip-04",
      title: "How to Build Conviction When Revenue is Flat",
      hook: "You don't need hockey-stick growth to know you have product-market fit.",
      start_time: "39:15",
      end_time: "40:20",
      duration: "65s",
      scores: {
        overall: 8.5,
        hook: 8.6,
        density: 8.4,
        brand_fit: 8.7,
        standalone: 8.5,
        performance_prior: 8.3,
      },
      reasons: [
        "Vulnerable, high-empathy narrative suited for founder Sunday reflection posts",
        "Clear contrast between vanity metric growth and true retention",
      ],
      evidence_quote:
        "Look at your 5 most obsessed customers. If they would scream if you shut down tomorrow, you have something real.",
      risks: ["Slightly lower audio tempo in opening 4 seconds"],
      recommended_platforms: ["LinkedIn", "X"],
      status: "suggested" as "suggested" | "accepted" | "rejected",
    },
  ]);

  const activeClip = clips[selectedClipIndex];

  const handleUpdateStatus = (status: "accepted" | "rejected") => {
    setClips((prev) =>
      prev.map((c, i) => (i === selectedClipIndex ? { ...c, status } : c))
    );
  };

  const filteredClips = clips.filter((c) => {
    if (filter === "accepted") return c.status === "accepted";
    if (filter === "suggested") return c.status === "suggested";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Req 2
            </span>
            <span className="text-xs font-mono text-tertiary">Multi-Signal Clip Ranking</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Ranked Clips & Verifiable Reasons
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            8-signal scoring engine identifies high-retention moments with evidence quotes and risk flags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/copy"
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Generate Copy Variants</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Left List (40%), Right Deep Dive (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ranked Clip List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-mono text-tertiary uppercase tracking-wider">
              12 Candidates Extracted
            </span>
            <div className="flex items-center gap-1 text-xs">
              {(["all", "suggested", "accepted"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    filter === tab
                      ? "bg-primary text-surface font-semibold"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredClips.map((clip, idx) => {
              const isSelected = clips[selectedClipIndex]?.id === clip.id;
              return (
                <button
                  key={clip.id}
                  onClick={() =>
                    setSelectedClipIndex(clips.findIndex((c) => c.id === clip.id))
                  }
                  className={`w-full text-left p-3.5 rounded border transition-all ${
                    isSelected
                      ? "bg-surface border-accent shadow-sm"
                      : "bg-surface/60 border-border hover:bg-surface hover:border-tertiary"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-tertiary">
                      {clip.start_time} - {clip.end_time} ({clip.duration})
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
                      Score: {clip.scores.overall}/10
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-primary line-clamp-1">
                    {clip.title}
                  </h3>
                  <p className="text-[11px] text-secondary line-clamp-2 mt-1 leading-snug font-sans">
                    &ldquo;{clip.hook}&rdquo;
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      {clip.status === "accepted" && (
                        <span className="text-success flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3" /> Accepted
                        </span>
                      )}
                      {clip.status === "rejected" && (
                        <span className="text-destructive flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                      {clip.status === "suggested" && (
                        <span className="text-tertiary">Ready to review</span>
                      )}
                    </div>
                    <span className="text-tertiary">
                      {clip.recommended_platforms.join(" · ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Clip Full Inspection */}
        {activeClip && (
          <div className="lg:col-span-7 bg-surface border border-border rounded-lg p-6 shadow-card space-y-5 flex flex-col justify-between">
            <div>
              {/* Top Meta & Score Breakdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <div className="text-[11px] font-mono text-tertiary">
                    {activeClip.start_time} - {activeClip.end_time} ({activeClip.duration}) · Ranked #01
                  </div>
                  <h2 className="text-base font-bold text-primary mt-0.5">
                    {activeClip.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-tertiary uppercase">OVERALL SCORE</div>
                    <div className="text-lg font-bold font-mono text-accent">
                      {activeClip.scores.overall} / 10
                    </div>
                  </div>
                </div>
              </div>

              {/* 8-Signal Radar Scores */}
              <div className="py-3 border-b border-border">
                <div className="text-[11px] font-mono text-tertiary uppercase tracking-wider mb-2">
                  Signal Score Breakdown
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                  <div className="p-2 bg-canvas rounded border border-border">
                    <div className="text-[10px] text-tertiary">HOOK</div>
                    <div className="font-bold text-primary mt-0.5">{activeClip.scores.hook}</div>
                  </div>
                  <div className="p-2 bg-canvas rounded border border-border">
                    <div className="text-[10px] text-tertiary">DENSITY</div>
                    <div className="font-bold text-primary mt-0.5">{activeClip.scores.density}</div>
                  </div>
                  <div className="p-2 bg-canvas rounded border border-border">
                    <div className="text-[10px] text-tertiary">BRAND FIT</div>
                    <div className="font-bold text-primary mt-0.5">{activeClip.scores.brand_fit}</div>
                  </div>
                  <div className="p-2 bg-canvas rounded border border-border">
                    <div className="text-[10px] text-tertiary">STANDALONE</div>
                    <div className="font-bold text-primary mt-0.5">{activeClip.scores.standalone}</div>
                  </div>
                  <div className="p-2 bg-canvas rounded border border-border">
                    <div className="text-[10px] text-tertiary">PERF PRIOR</div>
                    <div className="font-bold text-accent mt-0.5">{activeClip.scores.performance_prior}</div>
                  </div>
                </div>
              </div>

              {/* Verifiable Transcript Evidence Quote */}
              <div className="py-3 border-b border-border space-y-2">
                <div className="text-[11px] font-mono text-tertiary uppercase tracking-wider">
                  Verifiable Evidence Quote (Audio Timestamp: {activeClip.start_time})
                </div>
                <div className="p-3 bg-canvas rounded border border-border text-xs font-mono text-primary leading-relaxed">
                  &ldquo;{activeClip.evidence_quote}&rdquo;
                </div>
              </div>

              {/* Why This Clip - 3 to 5 Bullet Reasons */}
              <div className="py-3 space-y-2">
                <div className="text-[11px] font-mono text-tertiary uppercase tracking-wider">
                  Why This Clip (Traceable Multi-Signal Reasons)
                </div>
                <div className="space-y-1.5">
                  {activeClip.reasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {activeClip.risks.length > 0 && (
                  <div className="mt-3 p-2.5 bg-accent-subtle rounded border border-accent/20 text-xs text-primary flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold">Context Risk Note: </strong>
                      {activeClip.risks[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus("accepted")}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    activeClip.status === "accepted"
                      ? "bg-success text-surface font-semibold"
                      : "bg-surface border border-border text-primary hover:bg-surface-subtle"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Clip</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus("rejected")}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    activeClip.status === "rejected"
                      ? "bg-destructive text-surface font-semibold"
                      : "bg-surface border border-border text-destructive hover:bg-destructive/10"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>

              <Link
                href="/app/copy"
                className="px-3.5 py-1.5 bg-primary text-surface hover:bg-black rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>Platform Copy Engine</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
