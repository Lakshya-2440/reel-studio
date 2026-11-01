"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Film,
  Volume2,
  X,
  Maximize2,
} from "lucide-react";
import { SeedClip } from "@/lib/seed-data";

interface ClipsCarouselProps {
  clips: SeedClip[];
  onSelectClip?: (clipId: string) => void;
}

export function ClipsCarousel({ clips, onSelectClip }: ClipsCarouselProps) {
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(true);
  const [activeModalClip, setActiveModalClip] = useState<SeedClip | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Repeat clips twice for seamless infinite loop effect
  const repeatedClips = [...clips, ...clips];

  const handleManualScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-5 shadow-card space-y-4 overflow-hidden">
        {/* Carousel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-primary tracking-tight">
                  14 Days of Vertical Short Forms
                </h3>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-surface">
                  9:16 REEL
                </span>
                <span className="text-[11px] font-mono text-tertiary hidden sm:inline">
                  • 14/14 Rendered MP4s
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Moving animated gallery of all 14 platform-native clips. Hover to pause, click to play with audio.
              </p>
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
              className="px-2.5 py-1.5 rounded bg-surface-subtle hover:bg-canvas text-secondary hover:text-primary border border-border text-xs font-mono flex items-center gap-1.5 transition-colors"
              title={isPlayingAnimation ? "Pause Auto-Scroll" : "Resume Auto-Scroll"}
            >
              {isPlayingAnimation ? (
                <>
                  <Pause className="w-3 h-3 text-accent" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-accent text-accent" />
                  <span>Auto-Play</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1 border-l border-border pl-2">
              <button
                onClick={() => handleManualScroll("left")}
                className="p-1.5 rounded bg-surface-subtle hover:bg-canvas text-secondary hover:text-primary border border-border transition-colors"
                title="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleManualScroll("right")}
                className="p-1.5 rounded bg-surface-subtle hover:bg-canvas text-secondary hover:text-primary border border-border transition-colors"
                title="Scroll Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Moving Ribbon */}
        <div
          ref={scrollContainerRef}
          className="relative w-full overflow-x-auto overflow-y-hidden no-scrollbar py-2"
          style={{ scrollBehavior: "smooth" }}
        >
          <div
            className={`flex items-center gap-4 ${
              isPlayingAnimation ? "animate-marquee" : ""
            }`}
            style={{
              animationDuration: "50s",
              animationPlayState: isPlayingAnimation ? "running" : "paused",
            }}
          >
            {repeatedClips.map((clip, index) => {
              const videoSrc = clip.video_url || `/rendered_clips/${clip.id}.mp4`;
              return (
                <div
                  key={`${clip.id}-${index}`}
                  onClick={() => {
                    setActiveModalClip(clip);
                    onSelectClip?.(clip.id);
                  }}
                  className="relative w-[190px] sm:w-[210px] h-[340px] sm:h-[370px] shrink-0 rounded-xl overflow-hidden cursor-pointer group border border-border hover:border-accent hover:ring-2 hover:ring-accent/40 shadow-md transition-all duration-300 hover:scale-[1.02] bg-black"
                >
                  {/* 9:16 Video Player Preview */}
                  <video
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />

                  {/* Top Gradient Overlay */}
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none p-3 flex items-start justify-between">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-surface shadow">
                      DAY #{clip.rank.toString().padStart(2, "0")}
                    </span>

                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white border border-white/20 backdrop-blur-sm">
                      ★ {clip.overall_score.toFixed(1)}
                    </span>
                  </div>

                  {/* Center Hover Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-accent/90 text-surface flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-surface ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Gradient Scrim & Info */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface/20 text-white font-medium">
                        {clip.duration_fmt}
                      </span>
                      <span className="font-mono text-[9px] text-zinc-300">
                        9:16 MP4
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug drop-shadow-md">
                      {clip.title}
                    </h4>

                    <p className="text-[10px] text-zinc-300 line-clamp-1 italic font-mono">
                      &ldquo;{clip.hook_line}&rdquo;
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive 9:16 Video Player Modal */}
      {activeModalClip && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModalClip(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-canvas">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-surface">
                    DAY #{activeModalClip.rank.toString().padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] text-tertiary">
                    9:16 Vertical Short Form
                  </span>
                </div>
                <h4 className="text-xs font-bold text-primary truncate max-w-[260px] mt-1.5">
                  {activeModalClip.title}
                </h4>
              </div>
              <button
                onClick={() => setActiveModalClip(null)}
                className="p-1.5 rounded-full text-secondary hover:text-primary hover:bg-surface-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 9:16 Video Player */}
            <div className="relative bg-black flex items-center justify-center aspect-[9/16] max-h-[68vh]">
              <video
                src={activeModalClip.video_url || `/rendered_clips/${activeModalClip.id}.mp4`}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-surface border-t border-border flex items-center justify-between gap-3">
              <div className="text-[11px] text-secondary font-mono">
                Duration: {activeModalClip.duration_fmt} • Score: {activeModalClip.overall_score.toFixed(1)}/10
              </div>
              <a
                href={activeModalClip.video_url || `/rendered_clips/${activeModalClip.id}.mp4`}
                download={`clip_${activeModalClip.rank}_short.mp4`}
                className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
