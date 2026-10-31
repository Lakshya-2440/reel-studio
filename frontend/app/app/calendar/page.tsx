"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Download,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Mic,
  AlertCircle,
  Share2,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { generateIcs, downloadIcsFile, CalendarEvent } from "@/components/calendar/ics-export";

interface CalendarSlot {
  id: string;
  day: string;
  dateStr: string;
  dayOfMonth: number;
  timeIst: string; // e.g. "08:30 AM IST"
  isoDate: string;
  platform: "linkedin" | "reels" | "shorts" | "x" | "tiktok";
  platformName: string;
  clipTitle: string;
  hookLine: string;
  status: "draft" | "scheduled" | "posted" | "skipped";
  rationale: string;
  isLearned: boolean;
  confidence: number;
  cadenceNote?: string;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [voiceSchedulingNotice, setVoiceSchedulingNotice] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  const [slots, setSlots] = useState<CalendarSlot[]>([
    {
      id: "slot-1",
      day: "Monday",
      dateStr: "Nov 2, 2026",
      dayOfMonth: 2,
      timeIst: "08:30 AM IST",
      isoDate: "2026-11-02T08:30:00+05:30",
      platform: "linkedin",
      platformName: "LinkedIn",
      clipTitle: "The $50k MRR Trap: When Growth Kills",
      hookLine: "At $50k MRR, our compute bill was $42,000.",
      status: "scheduled",
      rationale: "Learned IST peak: B2B Monday 08:30 AM commute has 2.4x higher organic share rate.",
      isLearned: true,
      confidence: 0.98,
      cadenceNote: "48h spacing enforced before next long-form drop",
    },
    {
      id: "slot-2",
      day: "Monday",
      dateStr: "Nov 2, 2026",
      dayOfMonth: 2,
      timeIst: "11:30 AM IST",
      isoDate: "2026-11-02T11:30:00+05:30",
      platform: "x",
      platformName: "X (Twitter)",
      clipTitle: "Why 90% of Startups Die at $50k MRR",
      hookLine: "If your gross margin is under 70%, you didn't build software.",
      status: "scheduled",
      rationale: "Mid-day tech discussion slot on X; aligns with EU morning overlap.",
      isLearned: true,
      confidence: 0.94,
    },
    {
      id: "slot-3",
      day: "Tuesday",
      dateStr: "Nov 3, 2026",
      dayOfMonth: 3,
      timeIst: "06:30 PM IST",
      isoDate: "2026-11-03T18:30:00+05:30",
      platform: "reels",
      platformName: "Instagram Reels",
      clipTitle: "The $42k Cloud Bill That Almost Shut Us Down",
      hookLine: "Wait... our OpenAI bill was HOW much?!",
      status: "scheduled",
      rationale: "Evening IST commute window: mobile Reels view velocity peak (+24% retention).",
      isLearned: true,
      confidence: 0.92,
    },
    {
      id: "slot-4",
      day: "Wednesday",
      dateStr: "Nov 4, 2026",
      dayOfMonth: 4,
      timeIst: "09:30 AM IST",
      isoDate: "2026-11-04T09:30:00+05:30",
      platform: "linkedin",
      platformName: "LinkedIn",
      clipTitle: "Why $50k Enterprise Checks Break Seed Startups",
      hookLine: "Never charge per token. When we switched to $5,000/audit, conversion doubled.",
      status: "scheduled",
      rationale: "Mid-week B2B founder deep-dive; 48h spacing guardrail strictly satisfied.",
      isLearned: true,
      confidence: 0.96,
      cadenceNote: "Complies with spacing guardrail after Monday LinkedIn drop",
    },
    {
      id: "slot-5",
      day: "Thursday",
      dateStr: "Nov 5, 2026",
      dayOfMonth: 5,
      timeIst: "07:00 PM IST",
      isoDate: "2026-11-05T19:00:00+05:30",
      platform: "shorts",
      platformName: "YouTube Shorts",
      clipTitle: "The 70% Gross Margin Rule for AI Founders",
      hookLine: "Why the sharpest founders use content as a radar rather than a megaphone.",
      status: "scheduled",
      rationale: "Developer evening tutorial peak; prior shows 18% higher subscription conversion.",
      isLearned: false,
      confidence: 0.81,
    },
    {
      id: "slot-6",
      day: "Friday",
      dateStr: "Nov 6, 2026",
      dayOfMonth: 6,
      timeIst: "08:30 AM IST",
      isoDate: "2026-11-06T08:30:00+05:30",
      platform: "linkedin",
      platformName: "LinkedIn",
      clipTitle: "Why We Fired 12 Pilot Customers in One Afternoon",
      hookLine: "We fired 12 customers in one afternoon. Our team wept.",
      status: "draft",
      rationale: "Friday morning reflection window. High comment-to-view ratio.",
      isLearned: true,
      confidence: 0.95,
      cadenceNote: "Separated 48h from Wednesday post",
    },
    {
      id: "slot-7",
      day: "Saturday",
      dateStr: "Nov 7, 2026",
      dayOfMonth: 7,
      timeIst: "11:00 AM IST",
      isoDate: "2026-11-07T11:00:00+05:30",
      platform: "tiktok",
      platformName: "TikTok",
      clipTitle: "The Brutal Truth About Scaling AI Startups",
      hookLine: "If you're building an AI startup, hear this right now.",
      status: "draft",
      rationale: "Weekend organic discovery slot; prior baseline.",
      isLearned: false,
      confidence: 0.78,
    },
  ]);

  const platformBadgeStyles: Record<string, { bg: string; text: string; border: string }> = {
    linkedin: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/30" },
    reels: { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-500/30" },
    shorts: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/30" },
    x: { bg: "bg-neutral-800/10", text: "text-neutral-900", border: "border-neutral-800/30" },
    tiktok: { bg: "bg-cyan-500/10", text: "text-cyan-600", border: "border-cyan-500/30" },
  };

  const handlePlanWeek = () => {
    setIsAutoFilled(true);
    setVoiceSchedulingNotice(
      "Optimizer executed: Distributed 7 accepted clips into high-lift IST windows. Spacing guardrails verified (zero same-platform collisions <48h)."
    );
    // Mark draft items as scheduled
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        status: "scheduled" as const,
      }))
    );
  };

  const handleSimulateVoiceSchedule = () => {
    setVoiceSchedulingNotice(
      "Wispr Voice Intent: 'Schedule pricing clip on Thursday morning on LinkedIn' -> Scheduled for Thursday, Nov 5 at 09:30 AM IST."
    );
    // Add/Update Thursday LinkedIn slot
    const existingIdx = slots.findIndex((s) => s.day === "Thursday" && s.platform === "linkedin");
    if (existingIdx >= 0) {
      const updated = [...slots];
      updated[existingIdx].status = "scheduled";
      setSlots(updated);
    } else {
      const newSlot: CalendarSlot = {
        id: `slot_voice_${Date.now()}`,
        day: "Thursday",
        dateStr: "Nov 5, 2026",
        dayOfMonth: 5,
        timeIst: "09:30 AM IST",
        isoDate: "2026-11-05T09:30:00+05:30",
        platform: "linkedin",
        platformName: "LinkedIn",
        clipTitle: "The Pricing Teardown: Why $50k Broke Us",
        hookLine: "Never charge per token. Value-based pricing wins.",
        status: "scheduled",
        rationale: "Voice dictation matched optimal Thursday morning B2B window.",
        isLearned: true,
        confidence: 0.97,
      };
      setSlots([...slots, newSlot]);
    }
  };

  const handleExportIcs = () => {
    const calendarEvents: CalendarEvent[] = slots.map((s) => {
      const d = new Date(s.isoDate);
      return {
        id: s.id,
        title: s.clipTitle,
        platform: s.platformName,
        description: `TheContentCompany Post\nPlatform: ${s.platformName}\nHook: "${s.hookLine}"\nAI Rationale: ${s.rationale}\nScheduled in IST (Asia/Kolkata UTC+05:30)`,
        startTime: isNaN(d.getTime()) ? new Date() : d,
        durationMinutes: 30,
      };
    });

    const icsString = generateIcs(calendarEvents);
    downloadIcsFile("thecontentcompany-schedule-ist.ics", icsString);
  };

  const filteredSlots = slots.filter((slot) => {
    if (filterPlatform === "all") return true;
    return slot.platform === filterPlatform;
  });

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Calendar 05
            </span>
            <span className="text-xs font-mono text-tertiary">Content Calendar & Slot Allocator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            IST Content Calendar & AI Slot Allocation
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Optimized for Indian Standard Time (IST) peak engagement. Auto-slots accepted clips with deterministic spacing guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePlanWeek}
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-sm font-sans"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plan My Week</span>
          </button>

          <button
            onClick={handleExportIcs}
            className="px-3.5 py-1.5 bg-surface text-primary border border-border hover:bg-surface-subtle text-xs font-medium rounded transition-colors flex items-center gap-1.5 font-mono shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            <span>Export .ICS</span>
          </button>
        </div>
      </div>

      {/* Voice Scheduling Quick Trigger Banner */}
      <div className="bg-surface border border-border rounded-lg p-3.5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-accent-subtle border border-accent/20 flex items-center justify-center shrink-0">
            <Mic className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <div className="text-xs font-bold text-primary flex items-center gap-2">
              <span>Voice Scheduling Directive (Wispr Flow)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle border border-border text-tertiary">
                Natural Speech
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5 font-mono">
              &ldquo;Schedule pricing clip on Thursday morning on LinkedIn&rdquo;
            </p>
          </div>
        </div>

        <button
          onClick={handleSimulateVoiceSchedule}
          className="px-3 py-1.5 bg-surface text-primary border border-border hover:bg-surface-subtle text-xs font-mono font-medium rounded transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-3 h-3 text-accent" />
          <span>Simulate Voice Schedule</span>
        </button>
      </div>

      {voiceSchedulingNotice && (
        <div className="p-3 bg-accent-subtle/50 border border-accent/30 rounded-lg text-xs font-mono text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span>{voiceSchedulingNotice}</span>
          </div>
          <button
            onClick={() => setVoiceSchedulingNotice(null)}
            className="text-tertiary hover:text-primary text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Calendar Toolbar & Filter Controls */}
      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-subtle">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-surface border border-border text-tertiary hover:text-primary">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 rounded hover:bg-surface border border-border text-tertiary hover:text-primary">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-bold font-mono text-primary flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5 text-accent" />
              Nov 2 – Nov 8, 2026 (IST Timezone: UTC+05:30)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Platform filter pills */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              {["all", "linkedin", "reels", "shorts", "x", "tiktok"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPlatform(p)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    filterPlatform === p
                      ? "bg-primary text-surface font-semibold"
                      : "text-secondary hover:text-primary bg-surface border border-border"
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>

            {/* View Mode switcher */}
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <button
                onClick={() => setViewMode("week")}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  viewMode === "week"
                    ? "bg-surface text-primary border border-border font-semibold shadow-xs"
                    : "text-secondary hover:text-primary"
                }`}
              >
                Week View
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  viewMode === "month"
                    ? "bg-surface text-primary border border-border font-semibold shadow-xs"
                    : "text-secondary hover:text-primary"
                }`}
              >
                Month View
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: WEEK VIEW */}
        {viewMode === "week" ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-7 gap-3">
            {daysOfWeek.map((dayName, idx) => {
              const dayDate = idx + 2; // Nov 2 - Nov 8
              const daySlots = filteredSlots.filter((s) => s.day === dayName);

              return (
                <div
                  key={dayName}
                  className="bg-canvas border border-border rounded-lg p-2.5 flex flex-col min-h-[380px] space-y-2.5"
                >
                  {/* Day Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-primary">{dayName.slice(0, 3)}</span>
                    <span className="text-[10px] font-mono text-tertiary">Nov {dayDate}</span>
                  </div>

                  {/* Slot Items in Day */}
                  <div className="flex-1 space-y-2">
                    {daySlots.length === 0 ? (
                      <div className="h-full flex items-center justify-center p-4 border border-dashed border-border/80 rounded text-center">
                        <span className="text-[10px] font-mono text-tertiary">
                          No posts · Guardrail open
                        </span>
                      </div>
                    ) : (
                      daySlots.map((slot) => {
                        const bStyle = platformBadgeStyles[slot.platform] || {
                          bg: "bg-surface",
                          text: "text-primary",
                          border: "border-border",
                        };

                        return (
                          <div
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className="p-2.5 bg-surface border border-border rounded-md shadow-2xs hover:border-accent transition-all cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}
                              >
                                {slot.platformName}
                              </span>
                              <span className="text-[10px] font-mono text-tertiary">
                                {slot.timeIst.split(" ")[0]}
                              </span>
                            </div>

                            <div className="text-xs font-bold text-primary line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                              {slot.clipTitle}
                            </div>

                            <div className="text-[10px] font-mono text-secondary line-clamp-1 italic">
                              &ldquo;{slot.hookLine}&rdquo;
                            </div>

                            {/* Rationale Pill */}
                            <div className="pt-1.5 border-t border-border/60">
                              <div className="flex items-center justify-between text-[9px] font-mono">
                                <span className={slot.isLearned ? "text-accent font-semibold" : "text-tertiary"}>
                                  {slot.isLearned ? "★ Learned Peak" : "Prior Baseline"}
                                </span>
                                <span className="text-tertiary">{(slot.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Day Footer Status */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[9px] font-mono text-tertiary">
                    <span>{daySlots.length} slot{daySlots.length === 1 ? "" : "s"}</span>
                    <span className="text-success font-medium">Cadence OK</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode: MONTH VIEW (November 2026 Grid) */
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono font-semibold text-tertiary pb-2 border-b border-border">
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Day 1 (Sunday Nov 1) */}
              <div className="h-28 p-2 bg-canvas border border-border rounded-lg text-xs font-mono text-tertiary opacity-50">
                1
              </div>

              {/* Days 2 through 30 */}
              {Array.from({ length: 29 }).map((_, i) => {
                const dayNum = i + 2;
                const dayMatches = filteredSlots.filter((s) => s.dayOfMonth === dayNum);
                const isCurrentWeek = dayNum >= 2 && dayNum <= 8;

                return (
                  <div
                    key={dayNum}
                    className={`h-28 p-2 rounded-lg border text-xs font-mono transition-colors flex flex-col justify-between ${
                      isCurrentWeek
                        ? "bg-surface border-border hover:border-tertiary"
                        : "bg-canvas border-border/60 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${isCurrentWeek ? "text-primary" : "text-tertiary"}`}>
                        {dayNum}
                      </span>
                      {dayMatches.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-16">
                      {dayMatches.map((m) => {
                        const bStyle = platformBadgeStyles[m.platform];
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedSlot(m)}
                            className={`p-1 rounded text-[9px] truncate border cursor-pointer ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}
                            title={`${m.platformName} @ ${m.timeIst}: ${m.clipTitle}`}
                          >
                            {m.platformName.slice(0, 2)}: {m.clipTitle}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[9px] text-tertiary text-right">
                      {dayMatches.length > 0 ? `${dayMatches.length} post` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cadence Guardrails & Optimization Logic Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 shadow-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Spacing Guardrails Active</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed font-sans">
            Enforces a strict 48-hour minimum interval between long-form LinkedIn thought-leadership drops to prevent algorithmic self-cannibalization.
          </p>
          <div className="pt-2 border-t border-border text-[11px] font-mono text-success flex items-center gap-1 font-semibold">
            <Check className="w-3 h-3" /> Mon 08:30 & Wed 09:30 & Fri 08:30 Compliant
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 shadow-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Clock className="w-4 h-4 text-accent" />
            <span>IST Engagement Optimization</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed font-sans">
            Slots are calculated in Asia/Kolkata (UTC+05:30). Executive commute windows (08:30 - 09:30 AM IST) are prioritized for B2B analysis.
          </p>
          <div className="pt-2 border-t border-border text-[11px] font-mono text-accent flex items-center gap-1 font-semibold">
            ★ +38.5% lift on morning drops
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 shadow-card space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>1-Click Week Optimizer</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed font-sans">
            Pulls highest-ranked candidate clips and platform copy variants, scheduling optimal posting windows automatically.
          </p>
          <div className="pt-2 border-t border-border text-[11px] font-mono text-tertiary">
            Status: {isAutoFilled ? "Week Fully Scheduled (7/7 Slots)" : "Ready for Auto-Fill"}
          </div>
        </div>
      </div>

      {/* Selected Slot Inspector Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded font-semibold border ${
                    platformBadgeStyles[selectedSlot.platform].bg
                  } ${platformBadgeStyles[selectedSlot.platform].text} ${
                    platformBadgeStyles[selectedSlot.platform].border
                  }`}
                >
                  {selectedSlot.platformName}
                </span>
                <span className="text-xs font-mono text-tertiary">{selectedSlot.timeIst}</span>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-tertiary hover:text-primary text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-primary">{selectedSlot.clipTitle}</h3>
                <div className="mt-1 p-2.5 bg-canvas rounded border border-border text-xs font-mono text-secondary">
                  &ldquo;{selectedSlot.hookLine}&rdquo;
                </div>
              </div>

              <div className="p-3 bg-surface-subtle rounded border border-border text-xs space-y-1.5 font-sans">
                <div className="font-mono text-[10px] text-tertiary uppercase">AI SLOT RATIONALE (IST):</div>
                <div className="text-secondary leading-relaxed">{selectedSlot.rationale}</div>
              </div>

              {selectedSlot.cadenceNote && (
                <div className="p-2.5 bg-success/5 border border-success/20 rounded text-xs font-mono text-success flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Cadence Guardrail: {selectedSlot.cadenceNote}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-mono text-tertiary pt-2 border-t border-border">
                <span>Confidence: {(selectedSlot.confidence * 100).toFixed(0)}%</span>
                <span className="text-success font-medium uppercase">{selectedSlot.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Link
                href="/app/copy"
                className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
              >
                <span>Edit Copy Variant</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="px-3 py-1.5 text-xs text-secondary hover:text-primary font-mono"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert(`Slot confirmed for ${selectedSlot.platformName} on ${selectedSlot.day}`);
                    setSelectedSlot(null);
                  }}
                  className="px-4 py-1.5 bg-primary text-surface text-xs font-medium rounded hover:bg-black transition-colors"
                >
                  Confirm Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
