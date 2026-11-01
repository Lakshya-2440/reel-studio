"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Play,
  Pause,
  Clock,
  User,
  Sliders,
  Bookmark,
  ChevronRight,
  Sparkles,
  Volume2,
  Download,
  Filter,
} from "lucide-react";
import {
  TRANSCRIPT_SEGMENTS,
  CHAPTERS,
  EPISODE_METADATA,
  TranscriptSegment,
  ChapterMarker,
} from "@/lib/seed-data";
import { getActiveProject, IngestedProject } from "@/lib/project-store";

interface TranscriptViewerProps {
  onSeek?: (seconds: number) => void;
}

export function TranscriptViewer({ onSeek }: TranscriptViewerProps) {
  const [activeProject, setActiveProject] = useState<IngestedProject>(getActiveProject());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all");
  const [activeSegmentId, setActiveSegmentId] = useState<string>("seg-02");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(12);
  const [playbackSpeed, setPlaybackSpeed] = useState<"1x" | "1.5x" | "2x">("1x");

  useEffect(() => {
    const proj = getActiveProject();
    setActiveProject(proj);

    const handleProjectChanged = (e: any) => {
      if (e.detail) {
        setActiveProject(e.detail);
        if (e.detail.clips?.[0]?.id) {
          setActiveSegmentId(e.detail.clips[0].id);
        }
      }
    };
    window.addEventListener("thecontentcompany_project_changed", handleProjectChanged);
    return () => window.removeEventListener("thecontentcompany_project_changed", handleProjectChanged);
  }, []);

  const segmentsToDisplay: TranscriptSegment[] = useMemo(() => {
    if (activeProject.sourceType === "default") {
      return TRANSCRIPT_SEGMENTS;
    }
    return activeProject.clips.map((c, i) => ({
      id: c.id,
      speaker: `Speaker ${((i % 2) + 1)}`,
      role: i % 2 === 0 ? "Host" : "Guest",
      start_time: c.start_time,
      end_time: c.end_time,
      start_time_fmt: c.start_time_fmt,
      end_time_fmt: c.end_time_fmt,
      text: c.evidence_quote || c.hook_line,
    }));
  }, [activeProject]);

  // Filtered segments
  const filteredSegments = useMemo(() => {
    return segmentsToDisplay.filter((seg) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        seg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seg.speaker.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpeaker =
        selectedSpeaker === "all" ||
        seg.speaker.toLowerCase().includes(selectedSpeaker.toLowerCase());

      return matchesSearch && matchesSpeaker;
    });
  }, [segmentsToDisplay, searchQuery, selectedSpeaker]);

  const handleSegmentClick = (seg: TranscriptSegment) => {
    setActiveSegmentId(seg.id);
    setCurrentTimeSeconds(seg.start_time);
    onSeek?.(seg.start_time);
  };

  const handleChapterClick = (ch: ChapterMarker) => {
    setCurrentTimeSeconds(ch.start_time);
    // Find closest segment
    const targetSeg = TRANSCRIPT_SEGMENTS.find(
      (s) => s.start_time >= ch.start_time && s.start_time <= ch.end_time
    );
    if (targetSeg) {
      setActiveSegmentId(targetSeg.id);
    }
    onSeek?.(ch.start_time);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
      {/* Top Header & Episode Info */}
      <div className="p-4 border-b border-border bg-canvas/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-primary">
              {EPISODE_METADATA.title}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 font-semibold">
              {EPISODE_METADATA.status}
            </span>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            {EPISODE_METADATA.duration_fmt} · {EPISODE_METADATA.word_count.toLocaleString()} words ·{" "}
            {EPISODE_METADATA.vector_chunks} vector segments (pgvector)
          </p>
        </div>

        {/* Audio Scrubber Bar */}
        <div className="flex items-center gap-3 bg-surface p-2 rounded border border-border">
          <button
            onClick={togglePlay}
            className="p-1.5 bg-primary text-surface rounded hover:bg-black transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-tertiary">
              <span className="text-primary font-semibold">{formatSeconds(currentTimeSeconds)}</span>
              <span>/ {EPISODE_METADATA.duration_fmt}</span>
            </div>
            <div className="w-36 bg-surface-subtle h-1.5 rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-accent transition-all duration-150"
                style={{
                  width: `${(currentTimeSeconds / EPISODE_METADATA.duration_seconds) * 100}%`,
                }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              const speeds: ("1x" | "1.5x" | "2x")[] = ["1x", "1.5x", "2x"];
              const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
              setPlaybackSpeed(next);
            }}
            className="px-1.5 py-0.5 bg-surface-subtle hover:bg-border text-[10px] font-mono font-semibold rounded text-primary transition-colors border border-border"
          >
            {playbackSpeed}
          </button>
        </div>
      </div>

      {/* Chapter Marker Timeline */}
      <div className="p-3 border-b border-border bg-surface">
        <div className="flex items-center justify-between text-[11px] font-mono text-tertiary mb-2">
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3 h-3 text-accent" />
            Semantic Chapters & Topics
          </span>
          <span>Click to jump playback</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CHAPTERS.map((ch) => {
            const isChapterActive =
              currentTimeSeconds >= ch.start_time && currentTimeSeconds < ch.end_time;
            return (
              <button
                key={ch.id}
                onClick={() => handleChapterClick(ch)}
                className={`px-2.5 py-1.5 rounded text-left shrink-0 transition-colors border text-xs ${
                  isChapterActive
                    ? "bg-accent-subtle border-accent text-accent font-semibold"
                    : "bg-canvas border-border text-primary hover:bg-surface-subtle"
                }`}
              >
                <div className="font-mono text-[10px] text-tertiary">
                  {ch.start_time_fmt} - {ch.end_time_fmt}
                </div>
                <div className="text-xs truncate max-w-[200px] mt-0.5">{ch.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3 border-b border-border bg-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript text, numbers, or quotes (e.g. 'OpenAI', 'gross margin')..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border rounded focus:outline-none focus:border-accent text-primary placeholder:text-tertiary"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-border rounded p-0.5 bg-surface text-[11px]">
            <button
              onClick={() => setSelectedSpeaker("all")}
              className={`px-2 py-0.5 rounded transition-colors ${
                selectedSpeaker === "all"
                  ? "bg-primary text-surface font-semibold"
                  : "text-secondary hover:text-primary"
              }`}
            >
              All Speakers
            </button>
            <button
              onClick={() => setSelectedSpeaker("Marcus Vance")}
              className={`px-2 py-0.5 rounded transition-colors ${
                selectedSpeaker === "Marcus Vance"
                  ? "bg-accent text-surface font-semibold"
                  : "text-secondary hover:text-primary"
              }`}
            >
              Marcus (Founder)
            </button>
            <button
              onClick={() => setSelectedSpeaker("Sarah Chen")}
              className={`px-2 py-0.5 rounded transition-colors ${
                selectedSpeaker === "Sarah Chen"
                  ? "bg-primary text-surface font-semibold"
                  : "text-secondary hover:text-primary"
              }`}
            >
              Sarah (Host)
            </button>
          </div>

          <span className="text-[11px] font-mono text-tertiary">
            {filteredSegments.length} of {TRANSCRIPT_SEGMENTS.length} turns
          </span>
        </div>
      </div>

      {/* Transcript Turn List */}
      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {filteredSegments.length === 0 ? (
          <div className="p-8 text-center text-xs text-secondary">
            No transcript segments match &quot;{searchQuery}&quot;. Clear search to view all dialogue.
          </div>
        ) : (
          filteredSegments.map((seg) => {
            const isActive = seg.id === activeSegmentId;
            const isMarcus = seg.speaker.includes("Marcus");

            return (
              <div
                key={seg.id}
                onClick={() => handleSegmentClick(seg)}
                className={`p-4 transition-colors cursor-pointer flex gap-3 text-xs ${
                  isActive
                    ? "bg-accent-subtle/50 border-l-2 border-l-accent"
                    : "hover:bg-surface-subtle"
                }`}
              >
                {/* Speaker Avatar & Timestamp */}
                <div className="shrink-0 flex flex-col items-center gap-1 w-20">
                  <div
                    className={`w-7 h-7 rounded border flex items-center justify-center font-mono font-bold text-[11px] ${
                      isMarcus
                        ? "bg-accent/10 border-accent/30 text-accent"
                        : "bg-surface-subtle border-border text-primary"
                    }`}
                  >
                    {isMarcus ? "MV" : "SC"}
                  </div>
                  <button
                    type="button"
                    className="font-mono text-[10px] text-tertiary hover:text-accent flex items-center gap-0.5"
                    title="Click to seek to timestamp"
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>{seg.start_time_fmt}</span>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{seg.speaker}</span>
                    <span className="text-[10px] font-mono text-tertiary">· {seg.role}</span>
                  </div>
                  <p className="text-secondary leading-relaxed text-xs">
                    {/* Highlight search query if present */}
                    {searchQuery ? (
                      highlightText(seg.text, searchQuery)
                    ) : (
                      seg.text
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Footer Verification */}
      <div className="p-3 border-t border-border bg-canvas flex items-center justify-between text-[11px] font-mono text-tertiary">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span>Whisper Large-v3 (FP16) word-level alignment complete</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Accuracy: 99.2%</span>
          <span>·</span>
          <span>pgvector indexed</span>
        </div>
      </div>
    </div>
  );
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-accent/20 text-accent font-semibold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
