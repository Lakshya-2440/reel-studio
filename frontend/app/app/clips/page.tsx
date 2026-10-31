"use client";

import { useState, useMemo } from "react";
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
  ArrowRight,
  Search,
  ListFilter,
  Layers,
} from "lucide-react";
import { CLIPS_DATA, SeedClip } from "@/lib/seed-data";
import { ClipCard } from "@/components/clips/clip-card";

export default function ClipsPage() {
  const [clips, setClips] = useState<SeedClip[]>(CLIPS_DATA);
  const [filter, setFilter] = useState<"all" | "accepted" | "suggested" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "score" | "duration">("rank");

  const handleUpdateStatus = (clipId: string, status: SeedClip["status"], reason?: string) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId ? { ...c, status, rejection_reason: reason || null } : c
      )
    );
  };

  const handleAcceptAllTop3 = () => {
    setClips((prev) =>
      prev.map((c, i) => (i < 3 ? { ...c, status: "accepted" } : c))
    );
  };

  const filteredClips = useMemo(() => {
    return clips
      .filter((c) => {
        const matchesFilter = filter === "all" || c.status === filter;
        const matchesSearch =
          searchQuery.trim() === "" ||
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.hook_line.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.evidence_quote.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.overall_score - a.overall_score;
        if (sortBy === "duration") return b.duration - a.duration;
        return a.rank - b.rank;
      });
  }, [clips, filter, searchQuery, sortBy]);

  const acceptedCount = clips.filter((c) => c.status === "accepted").length;
  const suggestedCount = clips.filter((c) => c.status === "suggested").length;
  const rejectedCount = clips.filter((c) => c.status === "rejected").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Engine 02
            </span>
            <span className="text-xs font-mono text-tertiary">Clip Selection Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Ranked High-Signal Clips & Evidence Rationale
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            12 candidate clips extracted and scored across 8 signals. Every clip includes verbatim transcript evidence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/copy"
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Proceed to Platform Copy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Control Strip & Metrics Banner */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded transition-colors border font-medium ${
              filter === "all"
                ? "bg-primary text-surface border-primary"
                : "bg-canvas border-border text-primary hover:bg-surface-subtle"
            }`}
          >
            All Clips ({clips.length})
          </button>
          <button
            onClick={() => setFilter("accepted")}
            className={`px-3 py-1.5 rounded transition-colors border font-medium ${
              filter === "accepted"
                ? "bg-success text-surface border-success"
                : "bg-canvas border-border text-primary hover:bg-surface-subtle"
            }`}
          >
            Accepted ({acceptedCount})
          </button>
          <button
            onClick={() => setFilter("suggested")}
            className={`px-3 py-1.5 rounded transition-colors border font-medium ${
              filter === "suggested"
                ? "bg-accent text-surface border-accent"
                : "bg-canvas border-border text-primary hover:bg-surface-subtle"
            }`}
          >
            Suggested ({suggestedCount})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-3 py-1.5 rounded transition-colors border font-medium ${
              filter === "rejected"
                ? "bg-destructive text-surface border-destructive"
                : "bg-canvas border-border text-primary hover:bg-surface-subtle"
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clips..."
              className="pl-8 pr-3 py-1.5 text-xs bg-canvas border border-border rounded focus:outline-none focus:border-accent text-primary w-44 sm:w-56"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-mono text-tertiary hidden sm:inline">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1.5 text-xs bg-canvas border border-border rounded text-primary focus:outline-none focus:border-accent font-mono"
            >
              <option value="rank">By AI Rank (#1 - #12)</option>
              <option value="score">By Score (High to Low)</option>
              <option value="duration">By Duration (Longest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Batch Bar */}
      <div className="p-3 bg-surface-subtle border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-secondary">
            <strong>{acceptedCount}</strong> of {clips.length} clips accepted. Ready to generate platform copy for LinkedIn, Reels, Shorts, X, and TikTok.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAcceptAllTop3}
            className="px-3 py-1 bg-surface border border-border text-primary hover:bg-canvas rounded font-medium text-xs transition-colors"
          >
            Accept Top 3
          </button>
          <Link
            href="/app/copy"
            className="px-3 py-1 bg-primary hover:bg-black text-surface rounded font-semibold text-xs transition-colors flex items-center gap-1"
          >
            <span>Proceed to Copy Engine</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 12 Ranked Clips List */}
      <div className="space-y-4">
        {filteredClips.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-border rounded-lg space-y-2">
            <Scissors className="w-6 h-6 text-tertiary mx-auto" />
            <div className="text-sm font-semibold text-primary">No clips match filter</div>
            <div className="text-xs text-secondary">
              Try resetting the status filter or clearing your search term.
            </div>
            <button
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
              className="mt-2 px-3.5 py-1.5 bg-primary text-surface text-xs rounded"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 bg-surface border border-border rounded-lg flex items-center justify-between shadow-card">
        <div>
          <div className="text-xs font-bold text-primary">
            Ready to generate platform copy?
          </div>
          <div className="text-[11px] text-secondary">
            Generate 5 distinct channel variants adhering strictly to `platforms.yaml` rules.
          </div>
        </div>

        <Link
          href="/app/copy"
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <span>Open Copy Engine</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
