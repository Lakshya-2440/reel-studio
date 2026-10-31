"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Quote,
  Share2,
  Clock,
  Sliders,
  Check,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { SeedClip } from "@/lib/seed-data";
import { ClipScoreBars } from "./clip-score-bars";
import { ClipTrimEditor } from "./clip-trim-editor";
import { ClipRejectModal } from "./clip-reject-modal";

interface ClipCardProps {
  clip: SeedClip;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdateStatus?: (clipId: string, status: SeedClip["status"], reason?: string) => void;
}

export function ClipCard({
  clip,
  isSelected = false,
  onSelect,
  onUpdateStatus,
}: ClipCardProps) {
  const [isExpanded, setIsExpanded] = useState(isSelected || clip.rank <= 3);
  const [isTrimOpen, setIsTrimOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<SeedClip["status"]>(clip.status);
  const [rejectionReason, setRejectionReason] = useState<string | null>(clip.rejection_reason || null);

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentStatus("accepted");
    setRejectionReason(null);
    onUpdateStatus?.(clip.id, "accepted");
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = (reason: string) => {
    setCurrentStatus("rejected");
    setRejectionReason(reason);
    onUpdateStatus?.(clip.id, "rejected", reason);
  };

  const isAccepted = currentStatus === "accepted";
  const isRejected = currentStatus === "rejected";

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
            <div className="text-right">
              <div className="text-base font-mono font-bold text-accent">
                {clip.overall_score.toFixed(1)}
              </div>
              <div className="text-[10px] font-mono text-tertiary">OVERALL</div>
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

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded border border-border text-tertiary hover:text-primary hover:bg-surface-subtle transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Rejection notice if rejected */}
        {isRejected && rejectionReason && (
          <div className="p-2.5 rounded bg-destructive/5 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Rejection Reason:</strong> {rejectionReason} (Feeding into Clip Prior learner)
            </span>
          </div>
        )}

        {/* Expandable Deep Inspection */}
        {isExpanded && (
          <div className="space-y-4 pt-3 border-t border-border">
            {/* "Why This Clip" Section with >=3 Bullet Reasons & Evidence Quote */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-accent" />
                Why This Clip (AI Multi-Signal Rationale)
              </div>

              <div className="bg-canvas p-3 rounded border border-border space-y-2">
                <ul className="space-y-1.5">
                  {clip.reasons.map((reason, idx) => (
                    <li key={idx} className="text-xs text-secondary flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>

                {/* Verbatim Evidence Quote */}
                <div className="pt-2 border-t border-border/80">
                  <div className="text-[10px] font-mono text-tertiary uppercase tracking-wider mb-1">
                    Verbatim Evidence Quote from Transcript:
                  </div>
                  <blockquote className="text-xs text-primary font-mono bg-surface p-2.5 rounded border border-border leading-relaxed">
                    &ldquo;{clip.evidence_quote}&rdquo;
                  </blockquote>
                </div>
              </div>
            </div>

            {/* Score Breakdown (8 signals: 0-10) */}
            <ClipScoreBars scores={clip.scores} />

            {/* Context Risk Badges */}
            {clip.risks && clip.risks.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-secondary" />
                  Context Risk Assessment
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {clip.risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono px-2.5 py-1 rounded bg-surface-subtle text-secondary border border-border flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3 h-3 text-accent shrink-0" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
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
        )}
      </div>

      {/* Rejection Modal */}
      <ClipRejectModal
        clipTitle={clip.title}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmitReject={handleRejectSubmit}
      />
    </>
  );
}
