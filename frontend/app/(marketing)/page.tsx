"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TheContentCompanyLogo } from "@/components/brand/logo";
import {
  ArrowRight,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  Sliders,
  History,
  Calendar,
  BarChart3,
  Mic,
  ChevronRight,
  Volume2,
  Share2,
  FileText,
  Flame,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Target,
  ArrowUpRight,
  Radio,
  Eye,
  Sparkle,
} from "lucide-react";

export default function MarketingHomePage() {
  // Live Simulator States
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(38);
  const [activePlatformTab, setActivePlatformTab] = useState<"linkedin" | "shorts" | "x" | "reels">("linkedin");
  const [copiedPlatform, setCopiedPlatform] = useState(false);
  const [activeGrowthStage, setActiveGrowthStage] = useState(0);

  // Interactive Voice Diff Simulator State
  const [userEditedText, setUserEditedText] = useState(
    "In Ep. 42, we proved why early B2B startups fail when they copy enterprise sales decks instead of shipping opinionated teardowns."
  );
  const [isDiffAnalyzed, setIsDiffAnalyzed] = useState(false);
  const [isAnalyzingDiff, setIsAnalyzingDiff] = useState(false);

  // Simulated audio playback effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setAudioProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleCopyPlatformText = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedPlatform(true);
    setTimeout(() => setCopiedPlatform(false), 2000);
  };

  const handleTriggerDiffAnalysis = () => {
    setIsAnalyzingDiff(true);
    setTimeout(() => {
      setIsAnalyzingDiff(false);
      setIsDiffAnalyzed(true);
    }, 600);
  };

  // 6 Stages of Business Growth
  const growthTimeline = [
    {
      stage: "01",
      title: "Zero-Friction Ingest",
      timeframe: "Minute 0",
      headline: "Drop 1 Raw Podcast or Video. Save 6 Hours of Manual Slicing.",
      description:
        "Upload any 30-90 min interview, founder chat, or audio recording. Whisper ASR extracts sub-word timestamps and speaker boundaries with zero transcription latency.",
      businessImpact: "Replaces $3,500/mo manual editing agency costs.",
      metric: "6.2 hrs",
      metricLabel: "Time saved per episode",
      badge: "Whisper Precision Diarization",
      capabilities: [
        "Sub-second timestamp synchronization",
        "Speaker diarization with natural turn-taking",
        "Semantic chunking preserving full context",
      ],
      previewSnippet: "founder_files_ep42_raw.mp4 · 54m 12s · 2 Speakers identified",
    },
    {
      stage: "02",
      title: "8-Signal Viral Extraction",
      timeframe: "Minute 2",
      headline: "Mathematically Discover the Top 5% Standalone Moments.",
      description:
        "Standard AI clips arbitrary silence. TheContentCompany scores clips across 8 distinct psychological vectors—contrarian hook, emotional resonance, tactical density, and standalone clarity.",
      businessImpact: "3.8x increase in organic watch-through and retention.",
      metric: "9.4 / 10",
      metricLabel: "Average hook retention score",
      badge: "8-Dimensional Evaluation Matrix",
      capabilities: [
        "Contrarian claim & pattern interruption scoring",
        "Verifiable quote extraction with evidence anchor",
        "Zero missing punchlines or cut-off arguments",
      ],
      previewSnippet: "Clip #04: 'Why Enterprise Sales Decks Kill Seed Startups' (9.4/10)",
    },
    {
      stage: "03",
      title: "Platform-Native Repurposing",
      timeframe: "Minute 5",
      headline: "5 Bespoke Formats. Zero Repetitive Cross-Posting Slop.",
      description:
        "Every channel demands unique algorithmic pacing. Generate LinkedIn authority breakdowns, YouTube Shorts vertical scripts with visual cues, high-engagement X threads, and Reel captions.",
      businessImpact: "5x organic distribution footprint from 1 single recording.",
      metric: "5 Platforms",
      metricLabel: "Generated simultaneously",
      badge: "Strict Platform Budget Rules",
      capabilities: [
        "LinkedIn 210-character line-break hook formatting",
        "Shorts scripts with visual director notes [00:00-00:05]",
        "280-character strict X thread opener calibration",
      ],
      previewSnippet: "LinkedIn Post + YouTube Shorts + X Thread + Reels + Newsletter",
    },
    {
      stage: "04",
      title: "Continuous Voice Memory",
      timeframe: "Minute 10",
      headline: "Edit Once. Train Your Private Voice Vector Permanently.",
      description:
        "Every time you polish a line or delete generic buzzwords, our neural diff engine extracts your exact stylistic preference. Future drafts permanently sound like you—never like generic ChatGPT.",
      businessImpact: "98.4% brand voice consistency across all output.",
      metric: "0% Drift",
      metricLabel: "Permanent stylistic retention",
      badge: "Adaptive Levenshtein Diff Memory",
      capabilities: [
        "Instant rule extraction on every text edit",
        "Vocabulary ban-lists and preferred syntax anchors",
        "Zero prompt engineering required from the user",
      ],
      previewSnippet: "Rule #08: Never use 'game-changer' → Use 'tactical edge' (98% conf)",
    },
    {
      stage: "05",
      title: "Deterministic IST Scheduling",
      timeframe: "Minute 15",
      headline: "Deterministic Spacing Across High-Velocity Peak Slots.",
      description:
        "Automate your publishing calendar with peak Indian Standard Time & Global engagement windows. Spacing algorithms prevent audience fatigue while maintaining daily pipeline visibility.",
      businessImpact: "Consistent 14-day publishing backlog without creator burnout.",
      metric: "14 Days",
      metricLabel: "Automated queue pre-scheduled",
      badge: "Algorithmic Cadence Engine",
      capabilities: [
        "08:30 AM & 06:15 PM IST optimal peak-hour slots",
        "Anti-collision topic spacing between consecutive posts",
        "One-click sync to Google Calendar & Apple iCal (.ics)",
      ],
      previewSnippet: "Slot 1: Mon 08:30 AM IST (LinkedIn) · Slot 2: Tue 06:15 PM IST (Shorts)",
    },
    {
      stage: "06",
      title: "Causal Growth & Pipeline Loop",
      timeframe: "Day 30+",
      headline: "Actual Engagement Metrics Re-Weight Future Generation.",
      description:
        "Log post impressions, shares, and inbound leads via voice note, form, or CSV. The causal engine computes feature lift to prioritize the exact narrative angles that drive real customer pipeline.",
      businessImpact: "$48,000+ attributed inbound revenue from founder-led authority.",
      metric: "+340%",
      metricLabel: "Quarterly inbound pipeline lift",
      badge: "Closed-Loop Feature Feedback",
      capabilities: [
        "Direct correlation between hook structure & retention",
        "Voice-memo logging for zero-friction metric entry",
        "Continuous self-improving content flywheel",
      ],
      previewSnippet: "Episode 42 generated 184k impressions & 14 inbound founder demos",
    },
  ];

  const platformContent = {
    linkedin: {
      tag: "LinkedIn · Authority Breakdown",
      chars: "784 chars · 2 min read",
      hook: "Most founders treat content like a megaphone. The best use it as a radar.",
      body: `In Ep. 42 of The Founder Files, we broke down why top B2B companies get 80% of pipeline from unpolished founder perspectives—not slick corporate marketing.

3 rules we live by:
1. Share the breakdown first, the framework second.
2. Cut every buzzword before clicking publish.
3. One sharp thesis per post. No multifaceted essays.

When you speak with high conviction about specific customer friction, qualified buyers find you.`,
      cta: "What is your biggest content bottleneck right now?",
    },
    shorts: {
      tag: "YouTube Shorts · Script + Visual Direction",
      chars: "48s runtime · 142 words",
      hook: "[Hook 0-3s · Text on screen: The $0 B2B Marketing Secret]",
      body: `[Speaker looking directly into camera with high energy]

Stop editing your podcasts like a legacy media company.

If your first 5 seconds sound like 'Hey everyone, welcome back to episode 42'—you've already lost 85% of your audience.

[B-Roll Cut: Studio mic waveform peaking]

Here is what you do instead:
Start directly with the contrarian realization that cost you $50,000 to learn. No intro music. No pleasantries. Just the insight.`,
      cta: "[Pinned Comment: Full breakdown in bio + calendar template]",
    },
    x: {
      tag: "X / Twitter · High-Retention Thread Opener",
      chars: "238 / 280 chars",
      hook: "A 60-minute podcast contains 12 high-conviction posts if you know where to cut.",
      body: `Most creators waste 90% of their best ideas because they clip for soundbites instead of thesis statements.

Here is the 8-signal scoring matrix we use to identify 9.4/10 standalone moments without losing nuance 🧵👇`,
      cta: "1/8 · Signal #1: The Pattern Interruption...",
    },
    reels: {
      tag: "Instagram Reels · Tactical Hook & Story Arc",
      chars: "35s runtime · Fast Pacing",
      hook: "Why 99% of founder videos get skipped in 2 seconds flat.",
      body: `It is not the lighting.
It is not your microphone.
It is because you buried the punchline at minute 4.

When you front-load the unexpected truth, retention stays above 80% through the entire reel.`,
      cta: "Save this reel before your next recording session.",
    },
  };

  return (
    <div className="min-h-screen bg-canvas text-primary selection:bg-accent selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <TheContentCompanyLogo size={32} subtitle="Studio · Brand Memory" />

          <nav className="hidden lg:flex items-center gap-8 text-sm">
            <a
              href="#growth-timeline"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              Growth Timeline
            </a>
            <a
              href="#interactive-engine"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              Live Simulator
            </a>
            <a
              href="#architecture"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              Architecture
            </a>
            <Link
              href="/how-it-works"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              Capability Map
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-subtle border border-border text-[11px] font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Studio Engine Live</span>
            </div>

            <Link
              href="/app/clips"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-black rounded-md transition-all duration-200 shadow-sm hover:shadow"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-xs font-mono text-secondary mb-8 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-accent" />
            <span className="font-semibold text-primary">Autonomous Content Studio</span>
            <span className="text-tertiary">·</span>
            <span>Continuous Voice Memory</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-primary leading-[1.08] mb-8">
            Turn 1 Raw Episode Into{" "}
            <span className="underline decoration-accent/40 decoration-wavy underline-offset-8">
              14 Days of Authority
            </span>
            . <br />
            <span className="text-secondary font-normal">Zero Fluff. Zero Drift.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-secondary max-w-2xl mx-auto leading-relaxed mb-10">
            TheContentCompany ingests raw founder recordings, ranks high-retention clips across 8 psychological signals, generates platform-native copy, and continuously learns your exact voice from every edit.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/app/clips"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-md transition-all shadow-md hover:shadow-lg transform active:scale-[0.99]"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Launch Content Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#interactive-engine"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-primary bg-surface hover:bg-surface-subtle border border-border rounded-md transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-accent fill-accent" />
              <span>Try Live Simulator</span>
            </a>
          </div>

          {/* Key Value Proof Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-border/80">
            <div className="p-4 rounded-lg bg-surface border border-border text-left">
              <div className="text-2xl font-bold font-mono text-primary">8 Signals</div>
              <div className="text-xs text-secondary mt-1">Multi-vector clip retention scoring</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border text-left">
              <div className="text-2xl font-bold font-mono text-primary">0% Drift</div>
              <div className="text-xs text-secondary mt-1">Neural diff voice memory vector</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border text-left">
              <div className="text-2xl font-bold font-mono text-primary">5 Formats</div>
              <div className="text-xs text-secondary mt-1">Strict algorithmic platform budgets</div>
            </div>
            <div className="p-4 rounded-lg bg-surface border border-border text-left">
              <div className="text-2xl font-bold font-mono text-primary">Smart IST</div>
              <div className="text-xs text-secondary mt-1">Peak-hour cadence scheduling</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Interactive Working Component (Content Engine Simulator) */}
      <section id="interactive-engine" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle border border-accent/20 text-xs font-mono text-accent mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Interactive Live Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
            Experience the Core Studio Engine
          </h2>
          <p className="text-secondary text-sm sm:text-base mt-3">
            Inspect real-time 8-signal clip detection, switch platform copy formats with one click, and see how the neural diff memory learns from your custom edits.
          </p>
        </div>

        {/* Live Simulator Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-card">
          {/* Left Column: Live Waveform Player & Clip Radar (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
                  Clip #04 · Multi-Signal Analysis
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-accent text-white">
                  9.4 / 10 Match
                </span>
              </div>

              <h3 className="text-lg font-bold text-primary leading-snug">
                &quot;Why Enterprise Sales Decks Kill Seed-Stage Momentum&quot;
              </h3>
              <p className="text-xs text-secondary mt-2">
                Episode 42 · Speaker 1 (Founder) · 02:14 - 03:02 (48s duration)
              </p>

              {/* Interactive Audio Waveform Card */}
              <div className="mt-6 p-4 rounded-lg bg-surface-subtle border border-border">
                <div className="flex items-center justify-between mb-3 text-xs font-mono text-secondary">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-all shadow-sm"
                      aria-label={isPlaying ? "Pause audio preview" : "Play audio preview"}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white translate-x-0.5" />
                      )}
                    </button>
                    <span className="font-semibold text-primary">
                      {isPlaying ? "Playing Audio Stream..." : "Preview Synchronized Audio"}
                    </span>
                  </div>
                  <span>{isPlaying ? "00:24 / 00:48" : "00:00 / 00:48"}</span>
                </div>

                {/* Animated Waveform Bars */}
                <div className="h-10 flex items-center justify-between gap-1 px-1">
                  {[
                    40, 65, 80, 50, 95, 75, 45, 90, 100, 60, 35, 70, 85, 95, 60, 80, 50, 70, 90, 65,
                    45, 85, 100, 55, 75, 90, 60, 40, 70, 95, 80, 50,
                  ].map((height, i) => {
                    const isPassed = (i / 32) * 100 <= audioProgress;
                    return (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-150 ${
                          isPassed ? "bg-accent" : "bg-border"
                        } ${isPlaying && isPassed ? "animate-pulse" : ""}`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 8-Signal Radar Breakdown */}
              <div className="mt-6">
                <div className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary mb-3">
                  Psychological Signal Radar
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Contrarian Pattern Interrupt", score: 9.6, color: "bg-accent" },
                    { label: "Emotional Resonance", score: 9.2, color: "bg-accent" },
                    { label: "Standalone Information Density", score: 9.5, color: "bg-accent" },
                    { label: "Direct Actionable Takeaway", score: 9.1, color: "bg-accent" },
                    { label: "Conversational Story Arc", score: 8.8, color: "bg-secondary" },
                  ].map((signal, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-secondary text-[11px]">{signal.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-surface-subtle rounded-full overflow-hidden border border-border">
                          <div
                            className={`h-full ${signal.color} rounded-full`}
                            style={{ width: `${(signal.score / 10) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-primary w-6 text-right text-[11px]">
                          {signal.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Evidence Anchor Quote */}
            <div className="p-3.5 bg-canvas border border-border rounded-lg mt-6">
              <span className="text-[10px] font-mono text-tertiary uppercase tracking-wider block mb-1">
                Verifiable Audio Transcript Anchor
              </span>
              <p className="text-xs text-secondary italic">
                &quot;The moment you start sending 30-slide PDF decks to seed founders, you stop building a movement and start looking like a commodity agency.&quot;
              </p>
            </div>
          </div>

          {/* Right Column: Platform Transmutation & Voice Diff Simulator (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              {/* Tabs for Platforms */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {(["linkedin", "shorts", "x", "reels"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActivePlatformTab(tab)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        activePlatformTab === tab
                          ? "bg-primary text-white shadow-sm"
                          : "text-secondary hover:text-primary hover:bg-surface-subtle"
                      }`}
                    >
                      {tab === "linkedin"
                        ? "LinkedIn"
                        : tab === "shorts"
                        ? "YT Shorts"
                        : tab === "x"
                        ? "X (Twitter)"
                        : "Reels"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    handleCopyPlatformText(
                      `${platformContent[activePlatformTab].hook}\n\n${platformContent[activePlatformTab].body}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-secondary hover:text-primary bg-surface-subtle border border-border rounded transition-colors"
                >
                  {copiedPlatform ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span className="text-success font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Active Platform Preview Box */}
              <div className="mt-4 p-5 rounded-lg bg-surface-subtle border border-border">
                <div className="flex items-center justify-between text-xs font-mono text-tertiary mb-3">
                  <span className="font-semibold text-accent">
                    {platformContent[activePlatformTab].tag}
                  </span>
                  <span>{platformContent[activePlatformTab].chars}</span>
                </div>

                {/* Hook Box */}
                <div className="p-3 bg-surface border-l-2 border-accent rounded-r mb-3 text-xs sm:text-sm font-semibold text-primary leading-snug">
                  {platformContent[activePlatformTab].hook}
                </div>

                {/* Body Content */}
                <div className="text-xs sm:text-sm text-secondary whitespace-pre-line leading-relaxed font-sans">
                  {platformContent[activePlatformTab].body}
                </div>

                {/* CTA Tag */}
                <div className="mt-4 pt-3 border-t border-border/60 text-xs font-mono text-tertiary">
                  {platformContent[activePlatformTab].cta}
                </div>
              </div>

              {/* Interactive Neural Voice Diff Learning Card */}
              <div className="mt-6 p-4 rounded-lg bg-canvas border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-semibold text-primary">
                      Interactive Voice Diff Learner
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-tertiary">
                    Try editing below & test
                  </span>
                </div>

                <p className="text-[11px] text-secondary mb-3">
                  Every user edit is parsed through a Levenshtein character & semantic classifier to formulate durable stylistic rules.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={userEditedText}
                    onChange={(e) => {
                      setUserEditedText(e.target.value);
                      setIsDiffAnalyzed(false);
                    }}
                    className="w-full text-xs font-mono p-2.5 rounded bg-surface border border-border text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Refine draft sentence here..."
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleTriggerDiffAnalysis}
                      disabled={isAnalyzingDiff}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface hover:bg-surface-subtle border border-border text-primary rounded transition-all shadow-sm"
                    >
                      <Sparkles className="w-3 h-3 text-accent" />
                      <span>{isAnalyzingDiff ? "Extracting Rules..." : "Extract Voice Rule"}</span>
                    </button>

                    {isDiffAnalyzed && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Rule Stored to Voice Memory (Confidence: 98.2%)</span>
                      </div>
                    )}
                  </div>

                  {isDiffAnalyzed && (
                    <div className="p-3 bg-surface border border-success/30 rounded text-xs space-y-1 mt-2">
                      <div className="font-mono text-[11px] text-primary font-semibold">
                        Extracted Rule #14: Replace generic hype (&quot;game-changer&quot;) with specific thesis
                      </div>
                      <div className="text-[11px] text-secondary">
                        Action: Pinned to Private Memory · Weight: +0.88 · Will auto-apply to future generations
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-tertiary pt-2 border-t border-border">
              <span>Ready to test your actual files?</span>
              <Link
                href="/app/clips"
                className="inline-flex items-center gap-1 text-accent font-semibold hover:underline"
              >
                <span>Go to Studio Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Visual Growth Timeline (User Requested Feature) */}
      <section id="growth-timeline" className="py-20 px-6 max-w-7xl mx-auto border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono text-secondary mb-4 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
            <span>The Continuous Authority Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary leading-tight">
            How TheContentCompany Scales Your Business
          </h2>
          <p className="text-secondary text-sm sm:text-base mt-4 leading-relaxed">
            From raw audio ingestion to high-converting inbound pipeline. Follow the exact 6-step mechanical progression that founders use to dominate their category.
          </p>
        </div>

        {/* Timeline Step Navigation Pills */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3 mb-10">
          {growthTimeline.map((item, index) => {
            const isActive = activeGrowthStage === index;
            return (
              <button
                key={index}
                onClick={() => setActiveGrowthStage(index)}
                className={`p-3 text-left rounded-lg border transition-all text-xs ${
                  isActive
                    ? "bg-surface border-accent shadow-sm ring-1 ring-accent/30"
                    : "bg-surface-subtle border-border hover:bg-surface text-secondary"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      isActive ? "text-accent" : "text-tertiary"
                    }`}
                  >
                    STAGE {item.stage}
                  </span>
                  <span className="text-[10px] text-tertiary font-mono">{item.timeframe}</span>
                </div>
                <div className="font-semibold text-primary truncate">{item.title}</div>
              </button>
            );
          })}
        </div>

        {/* Timeline Detailed Focus Card */}
        <div className="bg-surface border border-border rounded-xl p-8 shadow-card grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Info: Narrative & Business Impact (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-accent text-white font-mono text-xs font-bold">
                Stage {growthTimeline[activeGrowthStage].stage}
              </span>
              <span className="text-xs font-mono text-tertiary">
                Execution Time: {growthTimeline[activeGrowthStage].timeframe}
              </span>
              <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary">
                {growthTimeline[activeGrowthStage].badge}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
              {growthTimeline[activeGrowthStage].headline}
            </h3>

            <p className="text-sm sm:text-base text-secondary leading-relaxed">
              {growthTimeline[activeGrowthStage].description}
            </p>

            {/* Checklist of capabilities */}
            <div className="space-y-2.5 pt-2">
              {growthTimeline[activeGrowthStage].capabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-primary">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>

            {/* Direct Commercial Business Impact */}
            <div className="p-4 rounded-lg bg-surface-subtle border-l-4 border-accent text-xs">
              <span className="font-mono font-semibold uppercase text-tertiary block mb-1">
                Bottom-Line Business Impact:
              </span>
              <span className="font-medium text-primary text-sm">
                {growthTimeline[activeGrowthStage].businessImpact}
              </span>
            </div>
          </div>

          {/* Right Info: Live Snapshot & Impact Metric (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6 lg:pl-6 lg:border-l border-border">
            {/* Metric Callout Card */}
            <div className="p-6 rounded-xl bg-canvas border border-border text-center">
              <div className="text-xs font-mono text-tertiary uppercase tracking-wider mb-2">
                Proven Output Metric
              </div>
              <div className="text-4xl sm:text-5xl font-bold font-mono text-primary">
                {growthTimeline[activeGrowthStage].metric}
              </div>
              <div className="text-xs text-secondary mt-2 font-medium">
                {growthTimeline[activeGrowthStage].metricLabel}
              </div>
            </div>

            {/* Snapshot Terminal Mock */}
            <div className="p-4 rounded-lg bg-primary text-white font-mono text-xs space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-tertiary border-b border-white/10 pb-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="w-2 h-2 rounded-full bg-success" />
                </div>
                <span>thecontentcompany-core · active</span>
              </div>
              <div className="text-accent text-[11px] pt-1">
                &gt; stage_{growthTimeline[activeGrowthStage].stage}.execute()
              </div>
              <div className="text-white/80 text-[11px] leading-relaxed">
                {growthTimeline[activeGrowthStage].previewSnippet}
              </div>
              <div className="text-success text-[10px] pt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Verified deterministic pipeline pass</span>
              </div>
            </div>

            {/* Step navigation trigger */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={activeGrowthStage === 0}
                onClick={() => setActiveGrowthStage((prev) => Math.max(0, prev - 1))}
                className="text-xs text-secondary hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
              >
                ← Previous Stage
              </button>
              <button
                disabled={activeGrowthStage === growthTimeline.length - 1}
                onClick={() =>
                  setActiveGrowthStage((prev) => Math.min(growthTimeline.length - 1, prev + 1))
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>Next Stage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Studio Architecture / Capabilities */}
      <section id="architecture" className="py-20 px-6 max-w-7xl mx-auto border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono text-secondary mb-4 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Modular Studio System</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
            Engineered for Precision. Built for Scale.
          </h2>
          <p className="text-secondary text-sm sm:text-base mt-3">
            Every module solves a concrete bottleneck in the founder content pipeline with verifiable algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Mic,
              title: "Sub-Word Audio Ingestion",
              desc: "Deep Whisper ASR integration extracts exact millisecond timestamps and multi-speaker turn boundaries with zero drift.",
              link: "/app/ingest",
            },
            {
              icon: Sliders,
              title: "8-Signal Psychological Scoring",
              desc: "Every candidate clip delivers mathematical confidence ratings, evidence quotes, and 3-5 concrete reasons for its score.",
              link: "/app/clips",
            },
            {
              icon: Share2,
              title: "Platform-Specific Synthesis",
              desc: "No generic copy. Strict character budgets and formatting calibrated for LinkedIn, Shorts, X, Reels, and TikTok.",
              link: "/app/copy",
            },
            {
              icon: History,
              title: "Continuous Diff Memory",
              desc: "Adaptive Levenshtein and semantic diff classifier captures rules from every manual edit. Never correct the same tone twice.",
              link: "/app/voice-memory",
            },
            {
              icon: Calendar,
              title: "Smart Cadence Calendar",
              desc: "Deterministic spacing with peak IST engagement slots. Visual drag-and-drop planning with direct .ics export.",
              link: "/app/calendar",
            },
            {
              icon: BarChart3,
              title: "Causal Feedback Loop",
              desc: "Log real engagement via voice memo, form, or CSV. Feature lift math directly updates future hook rankings.",
              link: "/app/performance",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-surface border border-border hover:border-accent/50 transition-all duration-200 shadow-card flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-surface-subtle border border-border flex items-center justify-center mb-4 group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors">
                  <card.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-bold text-primary group-hover:text-accent transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-secondary mt-2.5 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <Link
                href={card.link}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:text-accent pt-6 mt-4 border-t border-border/60 transition-colors"
              >
                <span>Explore Module</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: Standard AI vs TheContentCompany Matrix */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">
              Generic AI Wrappers vs. TheContentCompany
            </h2>
            <p className="text-secondary text-sm mt-2">
              Why leading founders reject generic LLM copy and rely on continuous learning.
            </p>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl bg-surface shadow-card">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-subtle text-secondary font-mono text-xs uppercase">
                  <th className="p-4 sm:p-5">Capability</th>
                  <th className="p-4 sm:p-5 text-tertiary">Standard AI Tools</th>
                  <th className="p-4 sm:p-5 text-accent font-bold">TheContentCompany</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  {
                    feature: "Clip Boundary Detection",
                    bad: "Cuts at arbitrary silence; chops off conversational punchlines",
                    good: "Speaker-aware topic boundaries with sub-word Whisper alignment",
                  },
                  {
                    feature: "Virality Scoring",
                    bad: "Opaque 'viral score 88' with zero mathematical explanation",
                    good: "8 psychological signals, verifiable quotes, and 3-5 bullet reasons",
                  },
                  {
                    feature: "Platform Adaptation",
                    bad: "Same generic text pasted across every platform",
                    good: "5 distinct formats with strict character limits and visual scripts",
                  },
                  {
                    feature: "Handling Your Edits",
                    bad: "Forgotten immediately; repeats identical tone errors next time",
                    good: "Neural diff engine extracts durable rules into permanent memory",
                  },
                  {
                    feature: "Publishing Cadence",
                    bad: "Dumps 20 clips in a folder; no scheduling intelligence",
                    good: "Deterministic spacing in peak IST slots with .ics calendar export",
                  },
                  {
                    feature: "Post-Publishing Learning",
                    bad: "Zero feedback loop; detached from real business metrics",
                    good: "Causal feature lift updates future ranking based on real metrics",
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-4 sm:p-5 font-semibold text-primary">{row.feature}</td>
                    <td className="p-4 sm:p-5 text-secondary">{row.bad}</td>
                    <td className="p-4 sm:p-5 font-medium text-primary bg-accent/5">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{row.good}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Final Pre-Footer CTA */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-2xl bg-primary text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

          <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold block mb-4">
            Production-Grade Content Studio
          </span>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl mx-auto leading-tight mb-6">
            Stop losing 90% of your podcast value to manual editing.
          </h2>

          <p className="text-white/70 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
            Experience the full studio pre-seeded with Episode 42, or connect your own private database and voice models in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app/clips"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-md transition-all shadow-lg hover:shadow-xl"
            >
              <span>Launch Studio Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-md transition-colors"
            >
              <span>View System Specifications</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-secondary">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <TheContentCompanyLogo size={28} subtitle="Continuous Voice Memory" />
            <span className="hidden sm:inline text-tertiary">·</span>
            <span>Empowering founders to scale authority without voice compromise.</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              System Architecture
            </Link>
            <Link href="/app/clips" className="hover:text-primary transition-colors">
              Studio Workspace
            </Link>
            <span className="text-tertiary">© 2026 TheContentCompany, Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
