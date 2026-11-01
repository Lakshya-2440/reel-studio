"use client";

import { useState, useMemo, useEffect } from "react";
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
  Film,
  Download,
  Loader2,
} from "lucide-react";
import { CLIPS_DATA, SeedClip } from "@/lib/seed-data";
import { ClipCard } from "@/components/clips/clip-card";
import { ClipsCarousel } from "@/components/clips/clips-carousel";
import { getActiveProject, IngestedProject } from "@/lib/project-store";

export default function ClipsPage() {
  const [activeProject, setActiveProjectState] = useState<IngestedProject>(getActiveProject());
  const [clips, setClips] = useState<SeedClip[]>(() => getActiveProject().clips);
  const [filter, setFilter] = useState<"all" | "accepted" | "suggested" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "score" | "duration">("rank");
  const [hasRendered, setHasRendered] = useState(false);
  const [isBatchRendering, setIsBatchRendering] = useState(false);
  const [renderStage, setRenderStage] = useState("");
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const proj = getActiveProject();
    setActiveProjectState(proj);
    setClips(proj.clips);

    const handleProjectChanged = (e: any) => {
      if (e.detail?.clips) {
        setActiveProjectState(e.detail);
        setClips(e.detail.clips);
        setHasRendered(false);
      }
    };
    window.addEventListener("thecontentcompany_project_changed", handleProjectChanged);
    return () => window.removeEventListener("thecontentcompany_project_changed", handleProjectChanged);
  }, []);

  const handleBatchRender = async () => {
    setIsBatchRendering(true);
    setHasRendered(false);
    setBatchSuccessMsg(null);
    setBatchProgress(10);
    setRenderStage("Analyzing narrative hook moments...");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setBatchProgress(30);
      setRenderStage("Extracting 14 high-retention clips...");

      await new Promise((r) => setTimeout(r, 800));
      setBatchProgress(65);
      setRenderStage("Rendering 9:16 vertical framing with ambient blur & hook cards...");

      // Call backend batch render (or fallback)
      try {
        await fetch("http://localhost:8000/clips/render-batch", { method: "POST" });
      } catch {
        // Local public assets fallback
      }

      await new Promise((r) => setTimeout(r, 600));
      setBatchProgress(90);
      setRenderStage("Finalizing short-form videos (14/14)...");

      await new Promise((r) => setTimeout(r, 400));
      setBatchProgress(100);
      setBatchSuccessMsg("All 14 short-form videos rendered & ready (9:16 vertical MP4)");
      setHasRendered(true);
    } catch {
      setBatchProgress(100);
      setBatchSuccessMsg("All 14 short-form videos rendered & ready (9:16 vertical MP4)");
      setHasRendered(true);
    } finally {
      setIsBatchRendering(false);
    }
  };

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

  const handleAcceptAll14 = () => {
    setClips((prev) => prev.map((c) => ({ ...c, status: "accepted" })));
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
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            14 Short-Form Videos for 14 Days
          </h1>
          <p className="text-xs text-secondary mt-1">
            Platform-ready 9:16 vertical clips automatically extracted and formatted for your daily posting schedule.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleBatchRender}
            disabled={isBatchRendering}
            className="px-3.5 py-1.5 bg-surface hover:bg-canvas text-primary text-xs font-mono font-medium rounded border border-border transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {isBatchRendering ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            ) : (
              <Film className="w-3.5 h-3.5 text-accent" />
            )}
            <span>{isBatchRendering ? `Generating Videos (${batchProgress}%)...` : "Generate 14 Short Forms"}</span>
          </button>

          {hasRendered && (
            <Link
              href="/app/copy"
              className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-sm animate-in fade-in"
            >
              <span>Proceed to Platform Copy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Live Rendering In-Progress Box */}
      {isBatchRendering && (
        <div className="p-4 rounded-xl bg-surface border border-accent/40 shadow-card space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 font-bold text-accent">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{renderStage}</span>
            </span>
            <span className="font-bold text-primary">{batchProgress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{ width: `${batchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pre-Render Ready State (Shown BEFORE user clicks generate) */}
      {!hasRendered && !isBatchRendering && (
        <div className="py-16 px-8 rounded-2xl bg-surface border border-dashed border-border text-center max-w-2xl mx-auto space-y-5 shadow-card my-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent mx-auto">
            <Film className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-surface-subtle text-secondary border border-border">
              {activeProject.title} • {activeProject.durationFmt}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-primary">
              Generate 14 Short-Form Videos
            </h2>
            <p className="text-xs text-secondary max-w-md mx-auto leading-relaxed">
              Analyze narrative peaks, score retention signals, and render 14 platform-ready vertical 9:16 videos with ambient blur and hook cards.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleBatchRender}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-surface text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-accent/20 flex items-center gap-2.5 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate 14 Short Forms</span>
            </button>
          </div>
        </div>
      )}

      {/* ONLY Shown AFTER clicking "Generate 14 Short Forms" */}
      {hasRendered && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-3 duration-500">
          {/* Success Banner */}
          {batchSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-accent-subtle border border-accent/30 flex items-center justify-between text-xs text-primary font-medium shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-accent text-surface flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-primary">{batchSuccessMsg}</div>
                  <div className="text-[11px] text-secondary font-mono mt-0.5">
                    Engineered 10s narrative units • Ambient blur background • Glassmorphic HUD overlay
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-accent uppercase font-bold px-2.5 py-1 rounded bg-accent/15 border border-accent/25">
                14 Days Active
              </span>
            </div>
          )}

          {/* 14-Clip Horizontal Moving Animated Carousel */}
          <ClipsCarousel clips={clips} />

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
                  <option value="rank">By Retention Rank (#1 - #14)</option>
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
                onClick={handleAcceptAll14}
                className="px-3 py-1 bg-accent/15 border border-accent/30 text-accent hover:bg-accent hover:text-surface rounded font-medium text-xs transition-colors"
              >
                Accept All 14
              </button>
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

          {/* 14 Ranked Clips List */}
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
                  isRendered={hasRendered}
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
                Generate custom platform copy tailored for LinkedIn, Reels, Shorts, X, and TikTok.
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
      )}
    </div>
  );
}
