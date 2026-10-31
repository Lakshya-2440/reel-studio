"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Share2,
  ArrowRight,
  Brain,
  Calendar,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import {
  CLIPS_DATA,
  PLATFORM_VARIANTS_DATA,
  SeedClip,
  PlatformVariantData,
} from "@/lib/seed-data";
import {
  PlatformTabs,
  PlatformKey,
  PLATFORMS,
} from "@/components/copy/platform-tabs";
import { FeedPreviewCard } from "@/components/copy/feed-preview-card";
import { HookSelector } from "@/components/copy/hook-selector";
import { CharacterCounter } from "@/components/copy/character-counter";
import { VoiceMatchMeter } from "@/components/copy/voice-match-meter";
import { CopyEditor } from "@/components/copy/copy-editor";

function CopyPageContent() {
  const searchParams = useSearchParams();
  const initialClipParam = searchParams?.get("clip") || "clip_1";

  const [selectedClipId, setSelectedClipId] = useState<string>(initialClipParam);
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("linkedin");
  const [activeHookChoice, setActiveHookChoice] = useState<"A" | "B">("A");

  // Sync param if changed
  useEffect(() => {
    if (searchParams?.get("clip")) {
      setSelectedClipId(searchParams.get("clip")!);
    }
  }, [searchParams]);

  // Current clip
  const currentClip = useMemo(() => {
    return (
      CLIPS_DATA.find((c) => c.id === selectedClipId) || CLIPS_DATA[0]
    );
  }, [selectedClipId]);

  // Current platform variant data
  const currentVariant: PlatformVariantData = useMemo(() => {
    const clipVariants = PLATFORM_VARIANTS_DATA[currentClip.id] || {};
    const fallbackVariant = clipVariants[activePlatform] || {
      platform: activePlatform,
      hookA: currentClip.hook_line,
      hookB: `Why ${currentClip.title} matters for every B2B founder.`,
      activeHook: "A",
      caption: `${currentClip.hook_line}\n\nHere is what we learned:\n1. Early traction can mask unit economics.\n2. Verbatim takeaway from Ep. 42: "${currentClip.evidence_quote}"\n\nWhat is your perspective on this?`,
      hashtags: ["#Startups", "#SaaS", "#FounderLedGrowth"],
      cta: "Drop your take below.",
      on_screen_text: currentClip.title.toUpperCase(),
      voice_match_score: 95,
      voice_rules_matched: [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric",
        "Single clear takeaway per post",
      ],
      char_limit: 3000,
      fold_cutoff: 210,
    };
    return fallbackVariant;
  }, [currentClip, activePlatform]);

  // Dynamic caption based on selected hook
  const activeHookText =
    activeHookChoice === "A" ? currentVariant.hookA : currentVariant.hookB;

  // Derive all platform scores for current clip
  const voiceScoresMap: Record<PlatformKey, number> = useMemo(() => {
    const clipVariants = PLATFORM_VARIANTS_DATA[currentClip.id] || {};
    return {
      linkedin: clipVariants.linkedin?.voice_match_score || 96,
      reels: clipVariants.reels?.voice_match_score || 94,
      shorts: clipVariants.shorts?.voice_match_score || 95,
      x: clipVariants.x?.voice_match_score || 97,
      tiktok: clipVariants.tiktok?.voice_match_score || 92,
    };
  }, [currentClip]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Copy Engine 03
            </span>
            <span className="text-xs font-mono text-tertiary">Platform Formats</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Platform-Tailored Copy & Realistic Feed Previews
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            5 distinct channel formats adhering strictly to character cutoffs and voice rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/voice-memory"
            className="px-3.5 py-1.5 bg-surface hover:bg-surface-subtle text-primary border border-border text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Brain className="w-3.5 h-3.5 text-accent" />
            <span>Brand Voice Memory</span>
          </Link>
          <Link
            href="/app/calendar"
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Schedule in Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Clip Selector Banner */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded border border-accent/30 bg-accent-subtle text-accent flex items-center justify-center font-mono font-bold text-xs shrink-0">
            #{currentClip.rank.toString().padStart(2, "0")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary">
                Active Source Clip:
              </span>
              <span className="text-xs font-semibold text-accent">
                {currentClip.title}
              </span>
            </div>
            <div className="text-[11px] font-mono text-tertiary mt-0.5">
              Duration: {currentClip.duration_fmt} · Overall Score: {currentClip.overall_score.toFixed(1)}/10
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-tertiary hidden sm:inline">SWITCH CLIP:</span>
          <select
            value={selectedClipId}
            onChange={(e) => setSelectedClipId(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-canvas border border-border rounded text-primary focus:outline-none focus:border-accent font-mono max-w-[280px] truncate"
          >
            {CLIPS_DATA.map((cl) => (
              <option key={cl.id} value={cl.id}>
                #{cl.rank.toString().padStart(2, "0")}: {cl.title} ({cl.overall_score.toFixed(1)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Platform Tabs */}
      <PlatformTabs
        activePlatform={activePlatform}
        onSelectPlatform={setActivePlatform}
        voiceScores={voiceScoresMap}
      />

      {/* A/B Hook Variant Selector */}
      <HookSelector
        hookA={currentVariant.hookA}
        hookB={currentVariant.hookB}
        activeHook={activeHookChoice}
        onSelectHook={setActiveHookChoice}
      />

      {/* 2-Column Responsive Workspace: Feed Preview (Left) vs Controls & Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Authentic Platform Feed Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-tertiary">
            <span className="uppercase tracking-wider">
              {activePlatform.toUpperCase()} High-Fidelity Feed Preview
            </span>
            <span>WYSIWYG Mockup</span>
          </div>

          <FeedPreviewCard
            platform={activePlatform}
            caption={currentVariant.caption}
            hook={activeHookText}
            hashtags={currentVariant.hashtags}
            cta={currentVariant.cta}
            onScreenText={currentVariant.on_screen_text}
            foldCutoff={currentVariant.fold_cutoff}
          />
        </div>

        {/* Right Column: Character Optimizer + Voice Match Score + Inline Editor */}
        <div className="lg:col-span-7 space-y-4">
          {/* Character Count & Fold Optimizer */}
          <CharacterCounter
            currentLength={currentVariant.caption.length}
            platform={activePlatform}
            charLimit={currentVariant.char_limit}
            foldCutoff={currentVariant.fold_cutoff}
          />

          {/* Voice Match Score Meter & Rules Applied */}
          <VoiceMatchMeter
            score={currentVariant.voice_match_score}
            rulesApplied={currentVariant.voice_rules_matched}
          />

          {/* Inline Text Editor with Save & Learn Button */}
          <CopyEditor
            key={`${selectedClipId}-${activePlatform}-${activeHookChoice}`}
            platform={activePlatform}
            initialCaption={currentVariant.caption}
            initialHook={activeHookText}
            initialHashtags={currentVariant.hashtags}
            initialCta={currentVariant.cta}
          />
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-4 bg-surface border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card">
        <div>
          <div className="text-xs font-bold text-primary flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>Multi-Platform Copy Ready for Scheduling</span>
          </div>
          <div className="text-[11px] text-secondary">
            Variants generated for LinkedIn, Instagram Reels, YouTube Shorts, X, and TikTok.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/clips"
            className="px-3 py-1.5 bg-canvas border border-border hover:bg-surface-subtle text-primary text-xs font-medium rounded transition-colors"
          >
            Back to Clips
          </Link>
          <Link
            href="/app/calendar"
            className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Proceed to Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CopyPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-mono text-tertiary">
          Loading platform copy engine...
        </div>
      }
    >
      <CopyPageContent />
    </Suspense>
  );
}
