"use client";

import Link from "next/link";
import { useState } from "react";
import { TheContentCompanyLogo } from "@/components/brand/logo";
import {
  ArrowRight,
  Play,
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
} from "lucide-react";

export default function MarketingHomePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [activePlatform, setActivePlatform] = useState<"linkedin" | "reels" | "x">("linkedin");

  const steps = [
    {
      num: "01",
      title: "Deep Ingestion",
      summary: "Upload 30-90 min podcast, URL, or paste transcript.",
      detail:
        "Extracts speaker-aware timestamps, transcript embeddings, and natural topic boundaries with Whisper ASR.",
      route: "/app/ingest",
      tag: "Req 1",
    },
    {
      num: "02",
      title: "Multi-Signal Clip Ranking",
      summary: "8-signal scoring identifies high-impact moments.",
      detail:
        "Every candidate clip delivers 3-5 bullet reasons, a verifiable evidence quote, and a 0-10 confidence breakdown.",
      route: "/app/clips",
      tag: "Req 2",
    },
    {
      num: "03",
      title: "Platform-Native Copy",
      summary: "Five distinct platform variants without generic templates.",
      detail:
        "Strict character budgets, platform-specific hooks, and formatting calibrated for LinkedIn, Reels, Shorts, X, and TikTok.",
      route: "/app/copy",
      tag: "Req 3",
    },
    {
      num: "04",
      title: "Brand Voice Memory",
      summary: "Diff engine extracts enduring rules from your edits.",
      detail:
        "Every time you refine a sentence, TheContentCompany classifies the edit type, assigns confidence, and avoids repeating past patterns.",
      route: "/app/voice-memory",
      tag: "Req 4",
    },
    {
      num: "05",
      title: "IST Content Calendar",
      summary: "Deterministic cadence spacing with IST peak-hour slots.",
      detail:
        "Plan your week in one click. Drag-and-drop slots backed by platform performance priors and export to .ics.",
      route: "/app/calendar",
      tag: "Req 5",
    },
    {
      num: "06",
      title: "Performance Feedback Loop",
      summary: "Actual engagement metrics re-rank future content.",
      detail:
        "Log metrics via voice, CSV, or form. Feature lift math directly updates prior scoring and hook conditioning.",
      route: "/app/performance",
      tag: "Req 6",
    },
  ];

  const previewCopies = {
    linkedin: {
      hook: "Most founders treat content like a megaphone. The best use it as a radar.",
      body: "In Ep. 42 of The Founder Files, we broke down why top B2B companies get 80% of pipeline from unpolished founder perspectives—not slick corporate marketing.\n\n3 rules we live by:\n1. Share the failure first, the lesson second\n2. Kill corporate buzzwords before publishing\n3. One sharp takeaway per post",
      metric: "98% Voice Match",
      badge: "LinkedIn Post · Cut at 210 chars",
    },
    reels: {
      hook: "Stop editing your podcasts like a media company. (Do this instead)",
      body: "[On-screen text: Rule #1 of founder clips: never bury the contrarian point]\n\nFull breakdown in bio. What is your biggest content bottleneck right now? 👇",
      metric: "94% Voice Match",
      badge: "Reels / Shorts Script",
    },
    x: {
      hook: "A 60-minute podcast contains 12 high-conviction posts if you know where to cut.",
      body: "Here is the exact scoring matrix we use to find 9.2/10 standalone moments without losing conversational nuance 🧵",
      metric: "96% Voice Match",
      badge: "X Thread Opener · 138 / 280 chars",
    },
  };

  return (
    <div className="min-h-screen bg-canvas text-primary">
      {/* Top Banner / Nav */}
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <TheContentCompanyLogo size={32} subtitle="v1.0 · Product Space" />

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/how-it-works"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              Capability Map
            </Link>
            <a
              href="#interactive-breakdown"
              className="text-secondary hover:text-primary transition-colors font-medium"
            >
              How It Works
            </a>
            <span className="text-xs font-mono text-tertiary border border-border px-2 py-0.5 rounded">
              Seed: Founder Files Ep. 42
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/app/clips"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-surface bg-accent hover:bg-accent-hover rounded transition-colors shadow-sm"
            >
              <span>Open Demo Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border bg-surface text-xs font-mono text-secondary mb-6">
            <Flame className="w-3.5 h-3.5 text-accent" />
            <span>Agentic Content Studio with Continuous Learning</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary leading-[1.15] mb-6">
            One podcast in. <br />
            A week of posts out. <br />
            <span className="text-accent">It remembers how you write.</span>
          </h1>

          <p className="text-lg text-secondary leading-relaxed mb-8 max-w-2xl">
            TheContentCompany turns 60-minute conversations into high-retention clips, platform-tailored
            copy, and IST-optimized schedules. When you edit a word, its diff engine extracts
            durable brand voice rules so every future draft sounds more like you.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/app/clips"
              className="px-5 py-2.5 bg-primary hover:bg-black text-surface text-sm font-medium rounded transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>Launch Studio (No Sign-up)</span>
              <ArrowRight className="w-4 h-4 text-accent" />
            </Link>

            <Link
              href="/how-it-works"
              className="px-4 py-2.5 bg-surface hover:bg-surface-subtle text-primary border border-border text-sm font-medium rounded transition-colors flex items-center gap-2"
            >
              <span>Judge Inspection Matrix</span>
              <ChevronRight className="w-4 h-4 text-tertiary" />
            </Link>
          </div>
        </div>

        {/* Live Interactive Preview Card */}
        <div className="mt-12 bg-surface border border-border rounded-lg p-6 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-surface-subtle border border-border">
                <Volume2 className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="text-xs font-mono text-tertiary">Clip #01 · 04:12 - 05:08 (56s)</div>
                <h3 className="text-sm font-semibold text-primary">
                  The Radar vs. Megaphone Content Philosophy
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-accent-subtle text-accent px-2 py-0.5 rounded border border-accent/20 font-medium">
                Overall Score: 9.4 / 10
              </span>
              <span className="text-xs font-mono text-tertiary px-2 py-0.5 border border-border rounded">
                Why this clip: 4 verified signals
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
            {/* Left Col: Transcript Evidence */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                Transcript & Evidence Quote
              </div>
              <div className="p-3 bg-canvas rounded border border-border text-xs text-secondary leading-relaxed font-mono">
                <p className="text-primary font-medium mb-1">
                  &ldquo;Most founders build content as a megaphone to shout at buyers. But the
                  sharpest ones use it as a radar. You publish raw thoughts to see who signals back.&rdquo;
                </p>
                <div className="text-[11px] text-tertiary mt-2 flex items-center justify-between">
                  <span>Speaker: Alex Vance (Guest)</span>
                  <span>Timestamp: 04:31</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-medium text-primary">Why This Clip Selected:</div>
                <div className="text-xs text-secondary flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  <span>High Contrarian Punchline (radar vs megaphone metaphor)</span>
                </div>
                <div className="text-xs text-secondary flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  <span>Zero context debt (standalone punch without &quot;as I said before&quot;)</span>
                </div>
                <div className="text-xs text-secondary flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  <span>Matches Founder Persona voice memory rule (open with paradox)</span>
                </div>
              </div>
            </div>

            {/* Right Col: Platform Native Copy Generator */}
            <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-border lg:pl-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                  Platform Copy Engine
                </div>
                <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded border border-border text-xs">
                  {(["linkedin", "reels", "x"] as const).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setActivePlatform(platform)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        activePlatform === platform
                          ? "bg-surface text-primary shadow-sm"
                          : "text-secondary hover:text-primary"
                      }`}
                    >
                      {platform === "linkedin" ? "LinkedIn" : platform === "reels" ? "Reels" : "X Post"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-surface rounded border border-border space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-border pb-2">
                  <span className="font-mono text-tertiary">
                    {previewCopies[activePlatform].badge}
                  </span>
                  <span className="font-mono text-accent font-medium">
                    {previewCopies[activePlatform].metric}
                  </span>
                </div>

                <div className="text-sm font-semibold text-primary">
                  {previewCopies[activePlatform].hook}
                </div>

                <p className="text-xs text-secondary whitespace-pre-line leading-relaxed font-sans">
                  {previewCopies[activePlatform].body}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-border text-xs">
                  <span className="text-tertiary font-mono">
                    Brand Memory Active: &quot;Banned: &apos;leverage&apos;, &apos;synergy&apos;&quot;
                  </span>
                  <Link
                    href="/app/copy"
                    className="text-accent hover:text-accent-hover font-medium flex items-center gap-1"
                  >
                    <span>Test Full Editor</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 6-Step Breakdown */}
      <section
        id="interactive-breakdown"
        className="py-16 px-6 max-w-6xl mx-auto border-t border-border"
      >
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1 font-semibold">
            Product Architecture
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            How TheContentCompany Works: The End-to-End Loop
          </h2>
          <p className="text-sm text-secondary mt-1">
            Built to satisfy all 6 core hackathon capabilities with deterministic rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Step Selector List */}
          <div className="md:col-span-5 space-y-2">
            {steps.map((step, idx) => (
              <button
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={`w-full text-left p-3.5 rounded border transition-all ${
                  activeStep === idx
                    ? "bg-surface border-accent shadow-sm"
                    : "bg-surface/50 border-border hover:bg-surface hover:border-tertiary"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-accent">{step.num}</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-tertiary">
                    {step.tag}
                  </span>
                </div>
                <div className="text-sm font-semibold text-primary">{step.title}</div>
                <div className="text-xs text-secondary mt-0.5 line-clamp-1">{step.summary}</div>
              </button>
            ))}
          </div>

          {/* Active Step Deep Dive Card */}
          <div className="md:col-span-7 bg-surface border border-border rounded-lg p-6 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent-subtle text-accent font-semibold border border-accent/20">
                    Step {steps[activeStep].num}
                  </span>
                  <span className="text-xs font-mono text-tertiary">
                    {steps[activeStep].tag} Verification
                  </span>
                </div>
                <Link
                  href={steps[activeStep].route}
                  className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1 font-mono"
                >
                  <span>Open Screen</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                <h3 className="text-xl font-bold text-primary tracking-tight">
                  {steps[activeStep].title}
                </h3>
                <p className="text-sm text-secondary leading-relaxed">
                  {steps[activeStep].detail}
                </p>

                <div className="p-4 rounded bg-canvas border border-border space-y-2">
                  <div className="text-xs font-mono text-tertiary uppercase tracking-wider">
                    Traceability & System Guarantees:
                  </div>
                  <ul className="text-xs text-secondary space-y-1.5 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span>Zero hallucinated metrics or vanity templates</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span>Model router: Hugging Face Inference primary + Gemini failover</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span>Every user edit compiles into an immutable diff record</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-6 flex items-center justify-between">
              <span className="text-xs text-tertiary font-mono">
                Pre-seeded with &quot;Founder Files — Ep. 42&quot;
              </span>
              <Link
                href={steps[activeStep].route}
                className="px-3.5 py-1.5 bg-primary hover:bg-black text-surface text-xs font-medium rounded transition-colors"
              >
                Explore {steps[activeStep].title}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-tertiary">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-primary">TheContent<span className="text-accent font-semibold">Company</span></span>
            <span>· Built for Product Space x Wispr Flow Agentic AI Hackathon</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              Capability Map
            </Link>
            <Link href="/app/clips" className="hover:text-primary transition-colors">
              Demo Studio
            </Link>
            <span>Oct 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
