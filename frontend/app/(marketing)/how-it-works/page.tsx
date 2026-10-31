import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  Scissors,
  Share2,
  Brain,
  Calendar,
  LineChart,
  Mic,
  Palette,
  CheckCircle2,
} from "lucide-react";

export default function HowItWorksPage() {
  const requirements = [
    {
      reqNumber: "Req 1",
      title: "Long Video / Podcast Ingestion",
      screenPath: "/app/ingest",
      screenName: "Ingestion Engine",
      icon: UploadCloud,
      problem: "Long 30-90 min files are heavy, lose context, and take forever to parse.",
      solution:
        "Chunked Whisper ASR pipeline with speaker-aware boundary detection, semantic chapters, and pgvector embeddings. Real-time SSE progress streaming.",
      proofPoint:
        "Upload audio/video file, enter URL, or paste transcript. Includes pre-loaded 'Founder Files Ep. 42' seed.",
    },
    {
      reqNumber: "Req 2",
      title: "Clip Selection with Verifiable Reasons",
      screenPath: "/app/clips",
      screenName: "Clip Finder & Scorer",
      icon: Scissors,
      problem: "AI clip tools produce arbitrary snippets without explaining why they chose them.",
      solution:
        "8-signal scoring matrix (hook strength, clarity, emotional resonance, standalone value, brand fit, performance prior). Each clip presents 3-5 bullet reasons and an exact transcript quote.",
      proofPoint:
        "12 ranked candidate clips with 0-10 radar score breakdown and risks analysis (e.g., 'references earlier conversation').",
    },
    {
      reqNumber: "Req 3",
      title: "Platform-Tailored Captions & Copy",
      screenPath: "/app/copy",
      screenName: "Platform Copy Engine",
      icon: Share2,
      problem: "One-size-fits-all copy flops across different platform algorithms.",
      solution:
        "5 distinct variants: LinkedIn (210-char hook cut, insight-led), Reels (on-screen text cues), Shorts (pinned comment + keywords), X (280 char single post + 4-part thread), TikTok (punchy hook + trending tags).",
      proofPoint:
        "Includes voice-match score meter, character counter, A/B hook options, and platform feed mocks.",
    },
    {
      reqNumber: "Req 4",
      title: "Brand-Voice Memory from Creator Edits",
      screenPath: "/app/voice-memory",
      screenName: "Brand Voice Memory",
      icon: Brain,
      problem: "AI models forget corrections and repeat the same generic corporate voice.",
      solution:
        "Diff analyst calculates word-level deltas whenever you edit a caption. Extracts style rules with confidence scores and red/green visual evidence diffs.",
      proofPoint:
        "Shows active rules (e.g. 'Never use emojis on LinkedIn', 'Avoid corporate buzzwords'), before/after generation comparison.",
    },
    {
      reqNumber: "Req 5",
      title: "Content Calendar with IST Prior Scheduling",
      screenPath: "/app/calendar",
      screenName: "Content Calendar",
      icon: Calendar,
      problem: "Scheduling across 5 platforms creates cadence chaos and suboptimal post timing.",
      solution:
        "Interactive calendar with month and week views. AI slot recommendations specifically calibrated for Indian Standard Time (IST) peak engagement.",
      proofPoint:
        "Drag-and-drop rescheduling, 'Plan My Week' one-click auto-scheduler, and .ics export.",
    },
    {
      reqNumber: "Req 6",
      title: "Performance Feedback Loop with Causal Lift",
      screenPath: "/app/performance",
      screenName: "Performance Loop",
      icon: LineChart,
      problem: "Content generation is disconnected from real-world analytics and viewer outcomes.",
      solution:
        "Logs views, retention, likes, and shares via manual form, CSV upload, or voice. Mathematical feature lift model computes which hook formats drive results and updates clip prior weights.",
      proofPoint:
        "Historical dataset of 30+ posts, feature weight delta indicators, and plain-language causal insight feed.",
    },
    {
      reqNumber: "Req V2",
      title: "Wispr Flow Voice Main Input & Studio",
      screenPath: "/app/voice-studio",
      screenName: "Voice Studio Drawer",
      icon: Mic,
      problem: "Natural human speech is messy with 'umms', 'ahhs', false starts, and mid-sentence corrections.",
      solution:
        "Wispr Flow integration that captures raw messy dictation and cleans it into structured JSON intent while visually highlighting removed fillers and striking out self-corrections.",
      proofPoint:
        "Side-by-side inspection view: raw speech with highlighted hesitations vs. clean executed intent chips.",
    },
    {
      reqNumber: "Req B1",
      title: "Brand Kit & Social Scraper Adapter",
      screenPath: "/app/brand",
      screenName: "Brand Kit Studio",
      icon: Palette,
      problem: "Onboarding requires tedious questionnaire forms to define visual and verbal identity.",
      solution:
        "Scrapling adapter extracts recent social posts to bootstrap color palettes, typography vibe, and initial voice guidelines with instant fallback to demo profile.",
      proofPoint:
        "Interactive brand card with extracted hex swatches, tone sliders, and typography pairing.",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-primary">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-tertiary">Product Space Hackathon 2026</span>
          </div>

          <Link
            href="/app/clips"
            className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors"
          >
            Launch Demo
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-mono uppercase tracking-wider text-accent font-semibold mb-2">
            Judge Inspection Matrix
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
            Explicit Capability-to-Screen Mapping
          </h1>
          <p className="text-base text-secondary mt-3 leading-relaxed">
            Every required PRD capability maps directly to a dedicated studio screen.
            Click any capability below to jump straight to its functional interface.
          </p>
        </div>

        {/* Capability Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requirements.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.reqNumber}
                className="bg-surface border border-border rounded-lg p-6 flex flex-col justify-between shadow-card hover:border-tertiary transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
                        {item.reqNumber}
                      </span>
                      <span className="text-xs font-mono text-tertiary">
                        {item.screenName}
                      </span>
                    </div>
                    <Icon className="w-4 h-4 text-tertiary" />
                  </div>

                  <h3 className="text-base font-bold text-primary mt-4 tracking-tight">
                    {item.title}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-secondary">The Problem: </span>
                      <span className="text-secondary">{item.problem}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-primary">Reel Architecture: </span>
                      <span className="text-secondary">{item.solution}</span>
                    </div>
                    <div className="pt-2 border-t border-border/60">
                      <span className="font-mono text-tertiary font-medium">Verification in Demo: </span>
                      <span className="text-secondary font-mono text-[11px]">{item.proofPoint}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-mono text-tertiary">{item.screenPath}</span>
                  <Link
                    href={item.screenPath}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-surface-subtle hover:bg-border rounded border border-border transition-colors font-mono"
                  >
                    <span>Inspect Screen</span>
                    <ArrowRight className="w-3.5 h-3.5 text-accent" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Architecture Summary */}
        <div className="mt-12 p-6 rounded-lg bg-surface border border-border shadow-card">
          <div className="flex items-center gap-2 text-xs font-mono text-accent font-semibold mb-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span>Continuous Feedback Loop Architecture</span>
          </div>
          <h2 className="text-lg font-bold text-primary mb-2">
            Why Reel is Not Another Wrapper
          </h2>
          <p className="text-xs text-secondary leading-relaxed">
            Traditional AI content tools treat every generation as a stateless prompt. Reel builds a closed-loop system:
            <strong> Ingestion</strong> creates semantic anchors → <strong>Scoring</strong> ranks with deterministic signals → 
            <strong> Platform Copy</strong> outputs strict platform specs → <strong>Voice Memory</strong> learns from user edits via diff analysis → 
            <strong> Calendar</strong> plans in IST peak hours → <strong>Performance Loop</strong> closes the cycle by altering feature priors.
          </p>
        </div>
      </main>
    </div>
  );
}
