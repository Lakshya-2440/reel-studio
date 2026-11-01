"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  Quote,
  Clock,
  Sliders,
  Check,
  Download,
  Film,
  Loader2,
  X,
} from "lucide-react";
import { SeedClip } from "@/lib/seed-data";
import { ClipTrimEditor } from "./clip-trim-editor";
import { ClipRejectModal } from "./clip-reject-modal";

interface ClipCardProps {
  clip: SeedClip;
  isSelected?: boolean;
  isRendered?: boolean;
  onSelect?: () => void;
  onUpdateStatus?: (clipId: string, status: SeedClip["status"], reason?: string) => void;
}

export function ClipCard({
  clip,
  isSelected = false,
  isRendered = false,
  onSelect,
  onUpdateStatus,
}: ClipCardProps) {
  const [localRendered, setLocalRendered] = useState(false);
  const isVideoReady = isRendered || localRendered;
  const [isTrimOpen, setIsTrimOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isAccepted, setIsAccepted] = useState(clip.status === "accepted");
  const [isRejected, setIsRejected] = useState(clip.status === "rejected");
  const [currentStatus, setCurrentStatus] = useState<SeedClip["status"]>(clip.status);
  const [rejectionReason, setRejectionReason] = useState<string | null>(clip.rejection_reason || null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderSuccess, setRenderSuccess] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string>(clip.video_url || `/rendered_clips/${clip.id}.mp4`);

  const handleRenderClip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRendering(true);
    try {
      const res = await fetch(`http://localhost:8000/clips/${clip.id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: clip.start_time,
          end_time: clip.end_time,
          aspect_ratio: "9:16",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.video_url) {
          setVideoUrl(data.video_url);
        }
      }
    } catch (err) {
      // Fallback: local public asset already exists
    } finally {
      setIsRendering(false);
      setRenderSuccess(true);
      setLocalRendered(true);
    }
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentStatus("accepted");
    setIsAccepted(true);
    setIsRejected(false);
    setRejectionReason(null);
    onUpdateStatus?.(clip.id, "accepted");
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = (reason: string) => {
    setCurrentStatus("rejected");
    setIsRejected(true);
    setIsAccepted(false);
    setRejectionReason(reason);
    onUpdateStatus?.(clip.id, "rejected", reason);
  };

  return (
    <>
      <div
        onClick={onSelect}
        className={`bg-surface border rounded-lg p-5 shadow-card transition-all space-y-4 ${
          isSelected
            ? "border-accent ring-1 ring-accent/30"
            : isAccepted
            ? "border-success/40 bg-surface"
            : isRejected
            ? "border-border opacity-70 bg-canvas/60"
            : "border-border hover:border-tertiary"
        }`}
      >
        {/* Top Meta Line: Rank, Title, Duration, Status */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Rank Badge */}
            <div
              className={`w-8 h-8 rounded border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                isAccepted
                  ? "bg-success/10 border-success/30 text-success"
                  : isRejected
                  ? "bg-surface-subtle border-border text-tertiary"
                  : "bg-accent-subtle border-accent/30 text-accent"
              }`}
            >
              #{clip.rank.toString().padStart(2, "0")}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-primary tracking-tight">
                  {clip.title}
                </h3>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-subtle text-secondary border border-border">
                  {clip.duration_fmt} ({clip.start_time_fmt} - {clip.end_time_fmt})
                </span>
                {isAccepted && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-success/10 text-success border border-success/30 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    ACCEPTED
                  </span>
                )}
                {isRejected && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30 font-semibold flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    REJECTED
                  </span>
                )}
              </div>

              {/* Hook Line */}
              <div className="mt-2 text-xs font-medium text-primary bg-canvas p-2.5 rounded border border-border/80 border-l-2 border-l-accent flex items-start gap-2">
                <Quote className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                <span className="italic leading-relaxed">&ldquo;{clip.hook_line}&rdquo;</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Score Badge */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* Quick Watch Button - Only if video rendered */}
            {isVideoReady && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded bg-accent text-surface text-xs font-semibold flex items-center gap-1.5 hover:bg-accent-hover transition-colors shadow-sm animate-in fade-in"
                title="Watch 9:16 Video"
              >
                <Play className="w-3.5 h-3.5 fill-surface" />
                <span>Watch 9:16</span>
              </button>
            )}

            <div className="text-right">
              <div className="text-base font-mono font-bold text-accent">
                {clip.overall_score.toFixed(1)}
              </div>
              <div className="text-[10px] font-mono text-tertiary">RETENTION</div>
            </div>

            <div className="h-7 w-px bg-border mx-1" />

            <button
              onClick={handleAccept}
              className={`p-1.5 rounded border transition-colors ${
                isAccepted
                  ? "bg-success text-surface border-success"
                  : "bg-surface-subtle text-secondary hover:text-success hover:border-success"
              }`}
              title="Accept Clip"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleRejectClick}
              className={`p-1.5 rounded border transition-colors ${
                isRejected
                  ? "bg-destructive text-surface border-destructive"
                  : "bg-surface-subtle text-secondary hover:text-destructive hover:border-destructive"
              }`}
              title="Reject Clip & give feedback"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rejection notice if rejected */}
        {isRejected && rejectionReason && (
          <div className="p-2.5 rounded bg-destructive/5 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Rejection Reason:</strong> {rejectionReason}
            </span>
          </div>
        )}

        {/* Interactive Trim Editor Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setIsTrimOpen(!isTrimOpen)}
            className="text-xs font-mono text-accent hover:underline flex items-center gap-1.5 font-medium"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isTrimOpen ? "Hide Trim Adjustments" : "Adjust Clip Trim Boundaries"}</span>
          </button>

          {isTrimOpen && (
            <div className="mt-2">
              <ClipTrimEditor
                initialStartSeconds={clip.start_time}
                initialEndSeconds={clip.end_time}
                initialDuration={clip.duration}
              />
            </div>
          )}
        </div>

        {/* Rendered 9:16 Video Player Section - ONLY shown after clicking Generate */}
        {isVideoReady && (
          <div className="p-3.5 rounded-lg bg-surface-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setIsVideoModalOpen(true)}
                className="w-12 h-16 rounded bg-black flex items-center justify-center relative cursor-pointer group border border-border/60 shrink-0 overflow-hidden"
              >
                <video 
                  src={videoUrl} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  muted 
                  playsInline 
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <Play className="w-5 h-5 text-surface fill-surface drop-shadow" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">
                    9:16 VERTICAL VIDEO
                  </span>
                </div>
                <p className="text-xs font-semibold text-primary mt-1">
                  Day #{clip.rank.toString().padStart(2, "0")} Short Form
                </p>
                <p className="text-[11px] text-secondary">
                  Ready for Reels, Shorts, TikTok &amp; LinkedIn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoModalOpen(true);
                }}
                className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-surface" />
                <span>Watch Video</span>
              </button>

              <a
                href={videoUrl}
                download={`clip_${clip.rank}_short.mp4`}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 bg-surface hover:bg-canvas text-secondary hover:text-primary text-xs font-mono font-medium rounded border border-border flex items-center gap-1.5 transition-colors"
                title="Download 9:16 MP4"
              >
                <Download className="w-3.5 h-3.5" />
                <span>MP4</span>
              </a>

              <button
                type="button"
                onClick={handleRenderClip}
                disabled={isRendering}
                className="px-2.5 py-1.5 bg-surface hover:bg-canvas text-secondary hover:text-primary text-xs font-mono rounded border border-border flex items-center gap-1 transition-colors"
                title="Re-render slice via ffmpeg"
              >
                {isRendering ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                ) : (
                  <Film className="w-3.5 h-3.5" />
                )}
                <span>{isRendering ? "Rendering..." : "Re-Cut"}</span>
              </button>
            </div>
          </div>
        )}

            {/* Card Footer: Recommended Platforms + Direct CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-tertiary">Platforms:</span>
                {clip.recommended_platforms.map((plat) => (
                  <span
                    key={plat}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-primary font-medium"
                  >
                    {plat}
                  </span>
                ))}
              </div>

              <Link
                href={`/app/copy?clip=${clip.id}`}
                className="px-4 py-2 bg-primary hover:bg-black text-surface text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
              >
                <span>Generate Platform Copy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
      </div>

      {/* Rejection Modal */}
      <ClipRejectModal
        clipTitle={clip.title}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmitReject={handleRejectSubmit}
      />

      {/* 9:16 Vertical Video Player Modal */}
      {isVideoModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div 
            className="bg-surface border border-border rounded-xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 border-b border-border flex items-center justify-between bg-canvas">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-accent/15 text-accent">
                    DAY #{clip.rank.toString().padStart(2, "0")} SHORT FORM
                  </span>
                  <span className="font-mono text-[10px] text-tertiary">9:16 MP4</span>
                </div>
                <h4 className="text-xs font-bold text-primary truncate max-w-[260px] mt-1">
                  {clip.title}
                </h4>
              </div>
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded text-secondary hover:text-primary hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative bg-black flex items-center justify-center aspect-[9/16] max-h-[65vh]">
              <video 
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-surface border-t border-border flex items-center justify-between gap-2">
              <div className="text-[11px] text-secondary font-mono">
                Duration: {clip.duration_fmt}
              </div>
              <a
                href={videoUrl}
                download={`clip_${clip.rank}_short.mp4`}
                className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download 9:16 MP4</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
