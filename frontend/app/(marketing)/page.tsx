"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { TheContentCompanyLogo } from "@/components/brand/logo";
import {
  ArrowRight,
  Play,
  Pause,
  X,
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
  SlidersHorizontal,
  RefreshCw,
  Coins,
  Users,
  Compass,
} from "lucide-react";

export default function MarketingHomePage() {
  // Live Simulator States
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(42);
  const [activePlatformTab, setActivePlatformTab] = useState<"linkedin" | "shorts" | "x" | "reels">("linkedin");
  const [copiedPlatform, setCopiedPlatform] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Interactive Voice Diff Simulator State
  const [userEditedText, setUserEditedText] = useState(
    "In Ep. 42, we proved why early B2B startups fail when they copy enterprise sales decks instead of shipping opinionated teardowns."
  );
  const [isDiffAnalyzed, setIsDiffAnalyzed] = useState(false);
  const [isAnalyzingDiff, setIsAnalyzingDiff] = useState(false);

  // Parallax Scroll Tracking for Timeline with Ultra-Smooth LERP Physics
  const timelineRef = useRef<HTMLDivElement>(null);
  const curveRef = useRef<SVGPathElement>(null);
  const curveGlowRef = useRef<SVGPathElement>(null);
  const sparkGroupRef = useRef<SVGGElement>(null);
  const curveLengthRef = useRef<number>(0);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const stageLabelRef = useRef<HTMLSpanElement>(null);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  // Scroll Slide-in Visibility Tracking for the 6 Stages
  const [visibleStages, setVisibleStages] = useState<boolean[]>([false, false, false, false, false, false]);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Interactive Stage Mini-Components State
  // Stage 1: Ingest Speaker Filter
  const [selectedSpeaker, setSelectedSpeaker] = useState<"all" | "s1" | "s2">("all");
  // Stage 2: Signal Weight Interactive Sliders
  const [contrarianWeight, setContrarianWeight] = useState(9.6);
  const [densityWeight, setDensityWeight] = useState(9.2);
  const [resonanceWeight, setResonanceWeight] = useState(9.4);
  // Stage 4: Interactive Diff Toggle
  const [diffMode, setDiffMode] = useState<"before" | "after" | "diff">("diff");
  // Stage 5: Interactive IST Slot Selection
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  // Stage 6: Interactive ROI Calculator Slider
  const [monthlyEpisodes, setMonthlyEpisodes] = useState<number>(4);

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

  // IntersectionObserver to smoothly slide stage boxes in from left & right
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    stageRefs.current.forEach((el, index) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleStages((prev) => {
              if (prev[index]) return prev;
              const next = [...prev];
              next[index] = true;
              return next;
            });
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  // Ultra-Smooth 60/120fps LERP Animation Loop for Curvy Timeline Spine
  useEffect(() => {
    let animationFrameId: number;
    let isRunning = true;

    // Cache total SVG curve length once
    if (curveRef.current) {
      curveLengthRef.current = curveRef.current.getTotalLength();
      curveRef.current.style.strokeDasharray = `${curveLengthRef.current}`;
      curveRef.current.style.strokeDashoffset = `${curveLengthRef.current}`;
    }
    if (curveGlowRef.current) {
      const len = curveGlowRef.current.getTotalLength();
      curveGlowRef.current.style.strokeDasharray = `${len}`;
      curveGlowRef.current.style.strokeDashoffset = `${len}`;
    }

    const handleScroll = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;
      // Start when timeline top hits viewport center, complete before bottom exits
      const startOffset = windowHeight * 0.55;
      const totalScrollable = sectionHeight - windowHeight * 0.3;
      const rawProgress = (startOffset - rect.top) / totalScrollable;
      targetProgressRef.current = Math.max(0, Math.min(1, rawProgress));
    };

    const smoothUpdateLoop = () => {
      if (!isRunning) return;

      // Silky smooth physical dampening (LERP factor 0.12)
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current += diff * 0.12;
      } else {
        currentProgressRef.current = targetProgressRef.current;
      }

      const p = currentProgressRef.current;

      // 1. Hardware-accelerated curvy SVG laser trail drawing
      if (curveRef.current && curveGlowRef.current) {
        const len = curveLengthRef.current || curveRef.current.getTotalLength();
        curveLengthRef.current = len;
        const offset = len * (1 - p);
        curveRef.current.style.strokeDashoffset = `${offset}`;
        curveGlowRef.current.style.strokeDashoffset = `${offset}`;

        // 2. Traveling Spark Head rides accurately along curve point (pt.x, pt.y)
        if (sparkGroupRef.current) {
          const clampedP = Math.min(1, Math.max(0, p));
          const pt = curveRef.current.getPointAtLength(len * clampedP);
          sparkGroupRef.current.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);
          sparkGroupRef.current.style.opacity = p > 0.005 ? "1" : "0.2";
        }
      }

      // 3. Update overall progress bar & counter & live phase name
      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${Math.round(p * 100)}%`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.innerText = `${Math.round(p * 100)}%`;
      }
      if (stageLabelRef.current) {
        const stageNames = [
          "Stage 01 · Ingest",
          "Stage 02 · 8-Signal Scoring",
          "Stage 03 · Repurposing",
          "Stage 04 · Voice Memory",
          "Stage 05 · IST Cadence",
          "Stage 06 · Growth Loop",
        ];
        const currentStageIdx = Math.min(5, Math.floor(p * 6));
        stageLabelRef.current.innerText = stageNames[currentStageIdx];
      }

      // 4. Milestone node rings bloom in warm yellow-orange as laser reaches each stage
      for (let i = 0; i <= 5; i++) {
        const nodeEl = document.getElementById(`spine-milestone-${i}`);
        if (nodeEl) {
          const milestoneThreshold = i / 5;
          if (p >= milestoneThreshold - 0.03) {
            nodeEl.classList.add("scale-125", "bg-accent", "border-white", "shadow-[0_0_16px_#FFAE33]");
            nodeEl.classList.remove("bg-canvas", "border-border");
          } else {
            nodeEl.classList.remove("scale-125", "bg-accent", "border-white", "shadow-[0_0_16px_#FFAE33]");
            nodeEl.classList.add("bg-canvas", "border-border");
          }
        }
      }

      animationFrameId = requestAnimationFrame(smoothUpdateLoop);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    animationFrameId = requestAnimationFrame(smoothUpdateLoop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  // Calculated composite virality score based on sliders
  const compositeViralityScore = (
    (contrarianWeight * 0.4 + densityWeight * 0.3 + resonanceWeight * 0.3)
  ).toFixed(1);

  // 6 Stages of Business Growth with Custom Rich Widgets
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
              How We Do It
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

            <button
              onClick={() => setIsVideoOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-primary bg-surface hover:bg-surface-subtle border border-accent/40 rounded-md transition-all shadow-sm hover:border-accent group"
            >
              <Play className="w-3.5 h-3.5 text-accent fill-accent group-hover:scale-110 transition-transform" />
              <span>Watch Launch Video</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent font-bold">1:12</span>
            </button>

            <a
              href="#growth-timeline"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-secondary hover:text-primary bg-surface hover:bg-surface-subtle border border-border rounded-md transition-colors shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span>How We Do It</span>
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

      {/* SECTION: SCROLL PARALLAX VISUAL TIMELINE WITH GLOWING CURVED SPINE */}
      <section
        id="growth-timeline"
        ref={timelineRef}
        className="py-28 px-6 max-w-7xl mx-auto border-t border-border relative"
      >
        {/* Floating Ambient Glows */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary leading-tight">
            How TheContentCompany Scales Your Business
          </h2>
          <p className="text-secondary text-sm sm:text-base mt-4 leading-relaxed">
            Scroll down to watch the continuous authority line illuminate each stage. Interact with the live modules to see how founders save 24+ hours every month while generating inbound pipeline.
          </p>
        </div>

        {/* Sleek Glassmorphic Sticky Progress HUD (Docked at top-16 right below navbar) */}
        <div className="sticky top-16 z-40 py-3 mb-12 -mx-6 px-6 bg-canvas/90 backdrop-blur-md border-y border-border/80 shadow-sm transition-all">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 text-xs font-mono">
            {/* Left: Active Stage Live Indicator */}
            <div className="flex items-center gap-2 min-w-[170px]">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-tertiary hidden sm:inline">Active Phase:</span>
              <span ref={stageLabelRef} className="font-bold text-primary truncate">
                Stage 01 · Ingest
              </span>
            </div>

            {/* Center: Glowing Yellow-Orange Progress Track */}
            <div className="flex items-center gap-3 flex-1 max-w-md justify-center">
              <div className="w-full h-2 bg-surface border border-border rounded-full overflow-hidden shadow-inner">
                <div
                  ref={progressFillRef}
                  className="h-full bg-gradient-to-r from-[#FFAE33] via-[#FF7A30] to-[#F26522] rounded-full shadow-[0_0_8px_#FF7A30] will-change-[width]"
                  style={{ width: "0%" }}
                />
              </div>
              <span ref={progressTextRef} className="font-bold text-accent min-w-[36px] text-right">
                0%
              </span>
            </div>

            {/* Right: Growth Path Counter */}
            <div className="hidden md:flex items-center gap-2 text-tertiary text-[11px]">
              <span>6-Stage Flywheel</span>
            </div>
          </div>
        </div>

        {/* PARALLAX TIMELINE CONTAINER */}
        <div className="relative">
          {/* THE GLOWING CURVY TIMELINE SPINE (Desktop Center, Mobile Left) */}
          <div className="absolute left-6 md:left-1/2 top-4 bottom-12 -translate-x-1/2 w-20 sm:w-28 pointer-events-none z-0">
            {/* Curvy SVG Background Track & Yellow-Orange Laser Beam */}
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 100 1200"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Pure Warm Yellow-Orange Laser Gradient */}
                <linearGradient id="warm-laser-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFAE33" />
                  <stop offset="50%" stopColor="#FF7A30" />
                  <stop offset="100%" stopColor="#F26522" />
                </linearGradient>

                {/* Soft Ambient Neon Glow Filter */}
                <filter id="laser-glow-soft" x="-50%" y="-10%" width="200%" height="120%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FFAE33" floodOpacity="0.8" />
                  <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#F26522" floodOpacity="0.5" />
                </filter>

                <filter id="spark-laser-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FFAE33" floodOpacity="0.9" />
                  <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#F26522" floodOpacity="0.7" />
                </filter>
              </defs>

              {/* 1. Inactive Curvy Dotted Guide Line */}
              <path
                d="M 50 0 C 85 120, 85 120, 50 240 C 15 360, 15 360, 50 480 C 85 600, 85 600, 50 720 C 15 840, 15 840, 50 960 C 85 1080, 85 1080, 50 1200"
                stroke="#E5E3DC"
                strokeWidth="3"
                strokeDasharray="6 6"
                fill="none"
              />

              {/* 2. Soft Ambient Neon Glow Curvy Trail */}
              <path
                ref={curveGlowRef}
                d="M 50 0 C 85 120, 85 120, 50 240 C 15 360, 15 360, 50 480 C 85 600, 85 600, 50 720 C 15 840, 15 840, 50 960 C 85 1080, 85 1080, 50 1200"
                stroke="url(#warm-laser-grad)"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
                filter="url(#laser-glow-soft)"
                style={{ strokeDasharray: 2000, strokeDashoffset: 2000 }}
              />

              {/* 3. Bold High-Contrast Yellow-Orange Laser Trail Core */}
              <path
                ref={curveRef}
                d="M 50 0 C 85 120, 85 120, 50 240 C 15 360, 15 360, 50 480 C 85 600, 85 600, 50 720 C 15 840, 15 840, 50 960 C 85 1080, 85 1080, 50 1200"
                stroke="url(#warm-laser-grad)"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
                style={{ strokeDasharray: 2000, strokeDashoffset: 2000 }}
              />

              {/* 4. Traveling Spark Head (Rides mathematically on top of the curvy wave) */}
              <g ref={sparkGroupRef} opacity="0" filter="url(#spark-laser-glow)">
                <circle r="14" fill="#FFAE33" opacity="0.35" className="animate-ping" />
                <circle r="9" fill="#F26522" stroke="#FFF" strokeWidth="2.5" />
                <circle r="4" fill="#FFF" />
              </g>
            </svg>

            {/* Stage Milestone Waypoints along the spine */}
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 pointer-events-none"
                style={{ top: `${(idx / 5) * 96 + 2}%` }}
              >
                <div
                  id={`spine-milestone-${idx}`}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-canvas border-2 border-border transition-all duration-300 flex items-center justify-center shadow-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-surface" />
                </div>
              </div>
            ))}
          </div>

          {/* STAGE CARDS (Smooth Left & Right Slide-in on Scroll) */}
          <div className="space-y-24 sm:space-y-36 relative z-10">
            {/* STAGE 01: Zero-Friction Ingest */}
            <div
              ref={(el) => {
                stageRefs.current[0] = el;
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pl-12 md:pl-0"
            >
              {/* Left Side: Slides from Left */}
              <div
                className={`space-y-4 md:pr-12 md:text-right order-2 md:order-1 transition-all duration-700 ease-out transform ${
                  visibleStages[0] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-14"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface border border-border text-xs font-mono text-tertiary">
                  <span className="text-accent font-bold">STAGE 01</span>
                  <span>·</span>
                  <span>Minute 0</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
                  Zero-Friction Ingest
                </h3>
                <p className="text-sm sm:text-base text-secondary leading-relaxed">
                  Drop any 30-90 min interview or podcast. Whisper ASR extracts sub-word timestamps and speaker boundaries with zero transcription latency.
                </p>
                <div className="p-3 bg-surface-subtle border border-border rounded-lg inline-block text-left text-xs text-secondary font-mono">
                  <div className="text-primary font-semibold mb-1">Business Metric:</div>
                  Replaces $3,500/mo manual video editor fees · 6.2 hours saved per recording.
                </div>
              </div>

              {/* Right Side: Slides from Right */}
              <div
                className={`order-1 md:order-2 md:pl-12 transition-all duration-700 ease-out transform ${
                  visibleStages[0] ? "opacity-100 translate-x-0" : "opacity-0 translate-x-14"
                }`}
              >
                <div className="bg-surface border border-border hover:border-accent/50 rounded-xl p-5 shadow-card transition-all">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4 text-xs font-mono">
                    <span className="font-semibold text-primary flex items-center gap-2">
                      <Mic className="w-4 h-4 text-accent" />
                      <span>Ingest Engine Demo</span>
                    </span>
                    <span className="text-tertiary">ep_42_audio.mp3</span>
                  </div>

                  {/* Interactive Speaker Filter Controls */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] font-mono text-tertiary">Filter Audio:</span>
                    <button
                      onClick={() => setSelectedSpeaker("all")}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                        selectedSpeaker === "all"
                          ? "bg-accent text-white"
                          : "bg-surface-subtle text-secondary hover:text-primary"
                      }`}
                    >
                      All Speakers
                    </button>
                    <button
                      onClick={() => setSelectedSpeaker("s1")}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                        selectedSpeaker === "s1"
                          ? "bg-accent text-white"
                          : "bg-surface-subtle text-secondary hover:text-primary"
                      }`}
                    >
                      Speaker 1 (Founder)
                    </button>
                    <button
                      onClick={() => setSelectedSpeaker("s2")}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                        selectedSpeaker === "s2"
                          ? "bg-accent text-white"
                          : "bg-surface-subtle text-secondary hover:text-primary"
                      }`}
                    >
                      Speaker 2 (Co-Host)
                    </button>
                  </div>

                  {/* Waveform Visualization */}
                  <div className="p-3 bg-canvas border border-border rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-secondary">
                      <span>Diarized Timeline [00:00 - 02:30]</span>
                      <span className="text-accent font-bold">Whisper V3 Alignment</span>
                    </div>
                    <div className="h-8 flex items-center gap-1">
                      {[60, 90, 45, 80, 100, 75, 40, 85, 95, 30, 70, 85, 90, 60, 40, 80, 100, 70, 50, 90, 80, 40].map((h, i) => {
                        const isS1 = i % 2 === 0;
                        const isDimmed =
                          (selectedSpeaker === "s1" && !isS1) ||
                          (selectedSpeaker === "s2" && isS1);
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-200 ${
                              isDimmed
                                ? "bg-border opacity-30"
                                : isS1
                                ? "bg-accent"
                                : "bg-primary"
                            }`}
                            style={{ height: `${h}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-tertiary flex items-center justify-between pt-1">
                      <span>Orange: Speaker 1 (68% talking time)</span>
                      <span>Dark: Speaker 2 (32% talking time)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 02: 8-Signal Viral Extraction */}
            <div
              ref={(el) => {
                stageRefs.current[1] = el;
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pl-12 md:pl-0"
            >
              {/* Left Side: Slides from Left */}
              <div
                className={`order-1 md:pr-12 transition-all duration-700 ease-out transform ${
                  visibleStages[1] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-14"
                }`}
              >
                <div className="bg-surface border border-border hover:border-accent/50 rounded-xl p-5 shadow-card transition-all">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4 text-xs font-mono">
                    <span className="font-semibold text-primary flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-accent" />
                      <span>Interactive Virality Weight Matrix</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-accent text-white font-bold">
                      {compositeViralityScore} / 10
                    </span>
                  </div>

                  <p className="text-[11px] text-secondary mb-3">
                    Adjust psychological signal weights to see how the mathematical ranking reacts:
                  </p>

                  {/* Live Sliders */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-secondary">Contrarian Hook Lift</span>
                        <span className="text-accent font-bold">{contrarianWeight}</span>
                      </div>
                      <input
                        type="range"
                        min="5.0"
                        max="10.0"
                        step="0.1"
                        value={contrarianWeight}
                        onChange={(e) => setContrarianWeight(parseFloat(e.target.value))}
                        className="w-full accent-accent h-1.5 bg-surface-subtle rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-secondary">Information Density</span>
                        <span className="text-accent font-bold">{densityWeight}</span>
                      </div>
                      <input
                        type="range"
                        min="5.0"
                        max="10.0"
                        step="0.1"
                        value={densityWeight}
                        onChange={(e) => setDensityWeight(parseFloat(e.target.value))}
                        className="w-full accent-accent h-1.5 bg-surface-subtle rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-secondary">Emotional Resonance</span>
                        <span className="text-accent font-bold">{resonanceWeight}</span>
                      </div>
                      <input
                        type="range"
                        min="5.0"
                        max="10.0"
                        step="0.1"
                        value={resonanceWeight}
                        onChange={(e) => setResonanceWeight(parseFloat(e.target.value))}
                        className="w-full accent-accent h-1.5 bg-surface-subtle rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-2.5 bg-surface-subtle rounded border border-border text-[11px] text-secondary flex items-center justify-between font-mono">
                    <span>Ranked Output:</span>
                    <span className="text-primary font-semibold">Clip #04 qualifies for Top 5% Distribution</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Slides from Right */}
              <div
                className={`space-y-4 md:pl-12 order-2 transition-all duration-700 ease-out transform ${
                  visibleStages[1] ? "opacity-100 translate-x-0" : "opacity-0 translate-x-14"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface border border-border text-xs font-mono text-tertiary">
                  <span className="text-accent font-bold">STAGE 02</span>
                  <span>·</span>
                  <span>Minute 2</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
                  8-Signal Viral Extraction
                </h3>
                <p className="text-sm sm:text-base text-secondary leading-relaxed">
                  No arbitrary silence cuts. The engine scans for contrarian claims, concrete takeaways, and emotional hooks with mathematical confidence.
                </p>
                <div className="p-3 bg-surface-subtle border border-border rounded-lg inline-block text-left text-xs text-secondary font-mono">
                  <div className="text-primary font-semibold mb-1">Business Metric:</div>
                  3.8x increase in audience completion & retention vs standard clips.
                </div>
              </div>
            </div>

            {/* STAGE 03: Platform-Native Repurposing */}
            <div
              ref={(el) => {
                stageRefs.current[2] = el;
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pl-12 md:pl-0"
            >
              {/* Left Side: Slides from Left */}
              <div
                className={`space-y-4 md:pr-12 md:text-right order-2 md:order-1 transition-all duration-700 ease-out transform ${
                  visibleStages[2] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-14"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface border border-border text-xs font-mono text-tertiary">
                  <span className="text-accent font-bold">STAGE 03</span>
                  <span>·</span>
                  <span>Minute 5</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
                  Platform-Native Repurposing
                </h3>
                <p className="text-sm sm:text-base text-secondary leading-relaxed">
                  One conversation creates 5 distinct algorithmic formats: LinkedIn thought leadership, YouTube Shorts script with visual pacing, and high-retention X threads.
                </p>
                <div className="p-3 bg-surface-subtle border border-border rounded-lg inline-block text-left text-xs text-secondary font-mono">
                  <div className="text-primary font-semibold mb-1">Business Metric:</div>
                  5x content footprint without hiring a multi-person social media team.
                </div>
              </div>

              {/* Right Side: Slides from Right */}
              <div
                className={`order-1 md:order-2 md:pl-12 transition-all duration-700 ease-out transform ${
                  visibleStages[2] ? "opacity-100 translate-x-0" : "opacity-0 translate-x-14"
                }`}
              >
                <div className="bg-surface border border-border hover:border-accent/50 rounded-xl p-5 shadow-card transition-all">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                    <span className="text-xs font-mono font-semibold text-primary">
                      Multi-Platform Output Switcher
                    </span>
                    <span className="text-[10px] font-mono text-accent">Auto-Budgeted</span>
                  </div>

                  {/* Platform Pills */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {(["linkedin", "shorts", "x"] as const).map((plat) => (
                      <button
                        key={plat}
                        onClick={() => setActivePlatformTab(plat)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          activePlatformTab === plat
                            ? "bg-primary text-white"
                            : "bg-surface-subtle text-secondary hover:text-primary"
                        }`}
                      >
                        {plat === "linkedin" ? "LinkedIn Post" : plat === "shorts" ? "YT Shorts" : "X Thread"}
                      </button>
                    ))}
                  </div>

                  {/* Formatted Preview Box */}
                  <div className="p-3.5 bg-surface-subtle border border-border rounded-lg text-xs font-sans space-y-2">
                    <div className="font-mono text-[10px] text-tertiary flex items-center justify-between border-b border-border/50 pb-1.5">
                      <span>{platformContent[activePlatformTab].tag}</span>
                      <span>{platformContent[activePlatformTab].chars}</span>
                    </div>
                    <div className="font-semibold text-primary">
                      {platformContent[activePlatformTab].hook}
                    </div>
                    <div className="text-secondary text-[11px] line-clamp-3 leading-relaxed">
                      {platformContent[activePlatformTab].body}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 04: Continuous Voice Memory */}
            <div
              ref={(el) => {
                stageRefs.current[3] = el;
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pl-12 md:pl-0"
            >
              {/* Left Side: Slides from Left */}
              <div
                className={`order-1 md:pr-12 transition-all duration-700 ease-out transform ${
                  visibleStages[3] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-14"
                }`}
              >
                <div className="bg-surface border border-border hover:border-accent/50 rounded-xl p-5 shadow-card transition-all">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                    <span className="text-xs font-mono font-semibold text-primary flex items-center gap-2">
                      <History className="w-4 h-4 text-accent" />
                      <span>Neural Diff Rule Extractor</span>
                    </span>
                    <span className="text-[10px] font-mono text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active Memory</span>
                    </span>
                  </div>

                  {/* Diff View Selector */}
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-mono">
                    <button
                      onClick={() => setDiffMode("before")}
                      className={`px-2 py-0.5 rounded ${
                        diffMode === "before"
                          ? "bg-destructive/20 text-destructive font-bold"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      Raw LLM Draft
                    </button>
                    <button
                      onClick={() => setDiffMode("after")}
                      className={`px-2 py-0.5 rounded ${
                        diffMode === "after"
                          ? "bg-success/20 text-success font-bold"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      Founder Polish
                    </button>
                    <button
                      onClick={() => setDiffMode("diff")}
                      className={`px-2 py-0.5 rounded ${
                        diffMode === "diff"
                          ? "bg-accent text-white font-bold"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      Diff View
                    </button>
                  </div>

                  {/* Diff Content Box */}
                  <div className="p-3 bg-canvas border border-border rounded-lg text-xs font-mono leading-relaxed">
                    {diffMode === "before" && (
                      <p className="text-secondary">
                        In this game-changing video, we basically reveal how top founders scale fast without burning capital...
                      </p>
                    )}
                    {diffMode === "after" && (
                      <p className="text-primary">
                        In Ep. 42, we broke down why top founders ignore vanity metrics and focus on 90-day retention cohorts...
                      </p>
                    )}
                    {diffMode === "diff" && (
                      <p className="space-x-1">
                        <span>In</span>
                        <span className="line-through bg-destructive/20 text-destructive px-1 rounded">
                          this game-changing video, we basically reveal how
                        </span>
                        <span className="bg-success/20 text-success px-1 rounded font-semibold">
                          Ep. 42, we broke down why
                        </span>
                        <span>top founders</span>
                        <span className="line-through bg-destructive/20 text-destructive px-1 rounded">
                          scale fast without burning capital...
                        </span>
                        <span className="bg-success/20 text-success px-1 rounded font-semibold">
                          ignore vanity metrics and focus on 90-day retention cohorts...
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="mt-3 p-2 bg-surface-subtle border border-border rounded text-[10px] font-mono text-tertiary">
                    Rule Extracted: Ban hype words (&quot;game-changing&quot;) → Permanent Weight: +0.92
                  </div>
                </div>
              </div>

              {/* Right Side: Slides from Right */}
              <div
                className={`space-y-4 md:pl-12 order-2 transition-all duration-700 ease-out transform ${
                  visibleStages[3] ? "opacity-100 translate-x-0" : "opacity-0 translate-x-14"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface border border-border text-xs font-mono text-tertiary">
                  <span className="text-accent font-bold">STAGE 04</span>
                  <span>·</span>
                  <span>Minute 10</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
                  Continuous Voice Memory
                </h3>
                <p className="text-sm sm:text-base text-secondary leading-relaxed">
                  Every edit permanently trains your private voice vector. The model adopts your unique vocabulary and stops repeating generic buzzwords.
                </p>
                <div className="p-3 bg-surface-subtle border border-border rounded-lg inline-block text-left text-xs text-secondary font-mono">
                  <div className="text-primary font-semibold mb-1">Business Metric:</div>
                  0% tone drift. 98.4% brand consistency across all company channels.
                </div>
              </div>
            </div>

            {/* STAGE 05: Deterministic IST Scheduling */}
            <div
              ref={(el) => {
                stageRefs.current[4] = el;
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pl-12 md:pl-0"
            >
              {/* Left Side: Slides from Left */}
              <div
                className={`space-y-4 md:pr-12 md:text-right order-2 md:order-1 transition-all duration-700 ease-out transform ${
                  visibleStages[4] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-14"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface border border-border text-xs font-mono text-tertiary">
                  <span className="text-accent font-bold">STAGE 05</span>
                  <span>·</span>
                  <span>Minute 15</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
                  Deterministic IST Scheduling
                </h3>
                <p className="text-sm sm:text-base text-secondary leading-relaxed">
                  Plan two weeks of content in one click. Posts are spaced across peak Indian Standard Time & Global engagement windows with calendar export.
                </p>
                <div className="p-3 bg-surface-subtle border border-border rounded-lg inline-block text-left text-xs text-secondary font-mono">
                  <div className="text-primary font-semibold mb-1">Business Metric:</div>
                  Zero creator burnout. 100% posting consistency 14 days in advance.
                </div>
              </div>

              {/* Right Side: Slides from Right */}
              <div
                className={`order-1 md:order-2 md:pl-12 transition-all duration-700 ease-out transform ${
                  visibleStages[4] ? "opacity-100 translate-x-0" : "opacity-0 translate-x-14"
                }`}
              >
                <div className="bg-surface border border-border hover:border-accent/50 rounded-xl p-5 shadow-card transition-all">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-3 text-xs font-mono">
                    <span className="font-semibold text-primary flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span>Interactive Peak IST Slots</span>
                    </span>
                    <span className="text-tertiary">Asia/Kolkata</span>
                  </div>

                  <p className="text-[11px] text-secondary mb-3">
                    Click a slot to allocate scheduled clips to optimal reach windows:
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { time: "08:30 AM IST", title: "Morning Commute", plat: "LinkedIn" },
                      { time: "01:15 PM IST", title: "Lunch Break", plat: "X Thread" },
                      { time: "06:15 PM IST", title: "Evening Prime", plat: "YT Shorts" },
                      { time: "09:00 PM IST", title: "Night Scroll", plat: "Reels" },
                    ].map((slot, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSlot(i)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          selectedSlot === i
                            ? "bg-accent text-white border-accent shadow-sm"
                            : "bg-surface-subtle border-border text-secondary hover:text-primary hover:bg-surface"
                        }`}
                      >
                        <div className="text-[10px] font-mono opacity-80">{slot.time}</div>
                        <div className="text-xs font-bold leading-tight mt-0.5">{slot.title}</div>
                        <div className="text-[10px] font-mono mt-1 opacity-90">{slot.plat}</div>
                      </button>
                    ))}
                  </div>

                  <div className="p-2.5 bg-canvas border border-border rounded text-[11px] font-mono text-secondary flex items-center justify-between">
                    <span>Export Target:</span>
                    <span className="text-accent font-semibold">Google Calendar + Apple .ics</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 06: Causal Growth & Pipeline Loop */}
            <div
              ref={(el) => {
                stageRefs.current[5] = el;
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pl-12 md:pl-0"
            >
              {/* Left Side: Slides from Left */}
              <div
                className={`order-1 md:pr-12 transition-all duration-700 ease-out transform ${
                  visibleStages[5] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-14"
                }`}
              >
                <div className="bg-surface border border-border hover:border-accent/50 rounded-xl p-5 shadow-card transition-all">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-3 text-xs font-mono">
                    <span className="font-semibold text-primary flex items-center gap-2">
                      <Coins className="w-4 h-4 text-accent" />
                      <span>Interactive Founder Pipeline Calculator</span>
                    </span>
                    <span className="text-success font-bold">+340% Lift</span>
                  </div>

                  {/* Interactive Slider for Monthly Episodes */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-secondary">Episodes Published / Month:</span>
                      <span className="text-accent font-bold text-sm">{monthlyEpisodes} episodes</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={monthlyEpisodes}
                      onChange={(e) => setMonthlyEpisodes(parseInt(e.target.value))}
                      className="w-full accent-accent h-2 bg-surface-subtle rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Computed Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-canvas border border-border rounded-lg">
                      <div className="text-[10px] font-mono text-tertiary">Attributed ARR</div>
                      <div className="text-base sm:text-lg font-bold font-mono text-primary mt-1">
                        ${(monthlyEpisodes * 12000).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-canvas border border-border rounded-lg">
                      <div className="text-[10px] font-mono text-tertiary">Organic Reach</div>
                      <div className="text-base sm:text-lg font-bold font-mono text-primary mt-1">
                        {(monthlyEpisodes * 45).toLocaleString()}k
                      </div>
                    </div>
                    <div className="p-3 bg-canvas border border-border rounded-lg">
                      <div className="text-[10px] font-mono text-tertiary">Hours Saved</div>
                      <div className="text-base sm:text-lg font-bold font-mono text-accent mt-1">
                        {monthlyEpisodes * 24} hrs
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] font-mono text-tertiary text-center">
                    Based on real conversion metrics from Ep. 42 founder distribution.
                  </div>
                </div>
              </div>

              {/* Right Side: Slides from Right */}
              <div
                className={`space-y-4 md:pl-12 order-2 transition-all duration-700 ease-out transform ${
                  visibleStages[5] ? "opacity-100 translate-x-0" : "opacity-0 translate-x-14"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface border border-border text-xs font-mono text-tertiary">
                  <span className="text-accent font-bold">STAGE 06</span>
                  <span>·</span>
                  <span>Day 30+</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
                  Causal Growth & Pipeline Loop
                </h3>
                <p className="text-sm sm:text-base text-secondary leading-relaxed">
                  Log impressions and deals back into the engine. Feature lift math automatically updates which hooks get prioritized for future episodes.
                </p>
                <div className="p-3 bg-surface-subtle border border-border rounded-lg inline-block text-left text-xs text-secondary font-mono">
                  <div className="text-primary font-semibold mb-1">Business Metric:</div>
                  Self-improving flywheel: content quality compounds month over month.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Interactive Working Component (Content Engine Simulator) */}
      <section id="interactive-engine" className="py-20 px-6 max-w-7xl mx-auto border-t border-border">
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
      {/* Launch Video Cinematic Modal */}
      {isVideoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-[#09090C] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-xs text-white/80 font-bold uppercase tracking-wider">
                  TheContentCompany · Official Product Launch
                </span>
              </div>
              <button
                onClick={() => setIsVideoOpen(false)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <video
                src="/videos/launch_video.mp4"
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
