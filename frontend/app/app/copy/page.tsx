"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Share2,
  Sliders,
  RotateCw,
  Edit3,
} from "lucide-react";

export default function CopyPage() {
  const [activePlatform, setActivePlatform] = useState<
    "linkedin" | "reels" | "shorts" | "x" | "tiktok"
  >("linkedin");

  const [copied, setCopied] = useState(false);
  const [editedNotification, setEditedNotification] = useState(false);

  const [variants, setVariants] = useState({
    linkedin: {
      platformName: "LinkedIn",
      hookA: "Most founders treat content like a megaphone. The best use it as a radar.",
      hookB: "Why 80% of our enterprise pipeline came from unpolished founder thoughts.",
      activeHook: 0,
      caption: `Most founders treat content like a megaphone. The best use it as a radar.

In Ep. 42 of The Founder Files, we broke down why top B2B companies get 80% of pipeline from unpolished founder perspectives—not slick corporate marketing.

3 rules we live by:
1. Share the failure first, the lesson second
2. Kill corporate buzzwords before publishing
3. One sharp takeaway per post

What is the single biggest pivot in your content strategy this quarter?`,
      hashtags: ["#B2BMarketing", "#FounderLedGrowth", "#Startups"],
      cta: "Drop your biggest content bottleneck below 👇",
      charLimit: 3000,
      cutOffAt: 210,
      voiceMatchScore: 98,
      onScreenText: null,
      notes: "First 210 chars optimized for the 'see more' click fold.",
    },
    reels: {
      platformName: "Instagram Reels",
      hookA: "Stop editing your podcast clips like a media company.",
      hookB: "The 56-second framework that changed how we share podcast takeaways.",
      activeHook: 0,
      caption: `Stop editing your podcast clips like a media company. (Do this instead)

Rule #1 of founder clips: never bury the contrarian point behind 30 seconds of small talk. 

Full Ep. 42 link in bio. What format is working best on your feed right now?`,
      hashtags: ["#founders", "#contentcreator", "#podcastclips", "#startuplife"],
      cta: "Save this post for your next recording session 📌",
      charLimit: 2200,
      cutOffAt: 125,
      voiceMatchScore: 94,
      onScreenText: "Rule #1: Never bury the contrarian takeaway.",
      notes: "On-screen text beat synchronized to 04:18 mark.",
    },
    shorts: {
      platformName: "YouTube Shorts",
      hookA: "The Radar vs Megaphone Content Paradox (Ep. 42)",
      hookB: "Why Megaphone Marketing is Dead in 2026",
      activeHook: 0,
      caption: `Why the sharpest founders use content as a radar rather than a megaphone.

Watch the full 48-minute conversation on The Founder Files channel.`,
      hashtags: ["#Shorts", "#Podcasting", "#StartupAdvice"],
      cta: "Pinned Comment: 'What would happen if you cut buzzwords from your next post?'",
      charLimit: 100,
      cutOffAt: 100,
      voiceMatchScore: 95,
      onScreenText: "Why megaphone marketing fails in 2026",
      notes: "Title strictly under 100 characters for mobile display.",
    },
    x: {
      platformName: "X (Post & Thread)",
      hookA: "A 60-minute podcast contains 12 high-conviction posts if you know where to cut.",
      hookB: "Most B2B content fails because founders shout instead of listening.",
      activeHook: 0,
      caption: `A 60-minute podcast contains 12 high-conviction posts if you know where to cut.

Here is the exact scoring matrix we use to find 9.2/10 standalone moments without losing conversational nuance:

1/ Hook density > 9.0
2/ Zero context debt
3/ Verifiable evidence quote

Read the thread below 🧵`,
      hashtags: [],
      cta: "Repost if you believe in founder-led distribution.",
      charLimit: 280,
      cutOffAt: 280,
      voiceMatchScore: 96,
      onScreenText: null,
      notes: "Single post <= 280 chars; initiates 4-part thread.",
    },
    tiktok: {
      platformName: "TikTok",
      hookA: "This one podcast clip completely changed how we think about distribution.",
      hookB: "The number one reason founders fail at content creation.",
      activeHook: 0,
      caption: `Content is a radar, not a megaphone. Stop shouting at people who don't care yet. #startuptok #founders #businessadvice #podcast`,
      hashtags: ["#startuptok", "#founders", "#businessadvice"],
      cta: "Follow for weekly teardowns from Ep. 42",
      charLimit: 2200,
      cutOffAt: 150,
      voiceMatchScore: 92,
      onScreenText: "Content = Radar (NOT megaphone)",
      notes: "Fast 3-second visual text cue.",
    },
  });

  const current = variants[activePlatform];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextChange = (newText: string) => {
    setVariants((prev) => ({
      ...prev,
      [activePlatform]: {
        ...prev[activePlatform],
        caption: newText,
      },
    }));
    setEditedNotification(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Req 3
            </span>
            <span className="text-xs font-mono text-tertiary">Platform Copy Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Platform-Tailored Captions & Copy
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            5 distinct platform engines obeying <code className="font-mono bg-surface-subtle px-1 rounded">platforms.yaml</code> constraints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/voice-memory"
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Inspect Voice Memory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {editedNotification && (
        <div className="p-3 bg-accent-subtle border border-accent/30 rounded-lg flex items-center justify-between text-xs text-primary font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>
              Creator edit recorded. Diff analyzer extracted 1 rule candidate into Brand Voice Memory.
            </span>
          </div>
          <Link
            href="/app/voice-memory"
            className="text-accent underline font-semibold hover:text-accent-hover"
          >
            View Diff
          </Link>
        </div>
      )}

      {/* Main Grid: Platform Tabs & Live Editor */}
      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        {/* Platform Selector Bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-surface-subtle">
          <div className="flex items-center gap-1">
            {(
              [
                { id: "linkedin", label: "LinkedIn" },
                { id: "reels", label: "Instagram Reels" },
                { id: "shorts", label: "YouTube Shorts" },
                { id: "x", label: "X (Twitter)" },
                { id: "tiktok", label: "TikTok" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activePlatform === p.id
                    ? "bg-surface text-primary border border-border shadow-sm font-semibold"
                    : "text-secondary hover:text-primary hover:bg-surface/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-tertiary">
              Source: Clip #01 (56s)
            </span>
          </div>
        </div>

        {/* Editor Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Variant Controls & Hook A/B */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
                Hook Options (A/B)
              </span>
              <span className="text-[11px] font-mono text-accent font-semibold">
                Voice Match: {current.voiceMatchScore}%
              </span>
            </div>

            <div className="space-y-2">
              <div
                onClick={() =>
                  setVariants((prev) => ({
                    ...prev,
                    [activePlatform]: { ...prev[activePlatform], activeHook: 0 },
                  }))
                }
                className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                  current.activeHook === 0
                    ? "bg-accent-subtle border-accent/40 font-medium text-primary"
                    : "bg-canvas border-border text-secondary hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-tertiary mb-1">
                  <span>VARIANT A (CONTRARIAN)</span>
                  <span>9.6 Score</span>
                </div>
                <div>&ldquo;{current.hookA}&rdquo;</div>
              </div>

              <div
                onClick={() =>
                  setVariants((prev) => ({
                    ...prev,
                    [activePlatform]: { ...prev[activePlatform], activeHook: 1 },
                  }))
                }
                className={`p-3 rounded border text-xs cursor-pointer transition-colors ${
                  current.activeHook === 1
                    ? "bg-accent-subtle border-accent/40 font-medium text-primary"
                    : "bg-canvas border-border text-secondary hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-tertiary mb-1">
                  <span>VARIANT B (DATA-LED)</span>
                  <span>9.2 Score</span>
                </div>
                <div>&ldquo;{current.hookB}&rdquo;</div>
              </div>
            </div>

            {/* Platform Constraints Info */}
            <div className="p-3 bg-canvas rounded border border-border space-y-2 text-xs">
              <div className="font-mono text-[10px] text-tertiary uppercase tracking-wider">
                Platform Rules ({current.platformName})
              </div>
              <div className="text-secondary text-[11px] leading-relaxed">
                {current.notes}
              </div>
              {current.onScreenText && (
                <div className="pt-2 border-t border-border">
                  <span className="font-mono text-[10px] text-tertiary block">
                    ON-SCREEN TEXT CUE:
                  </span>
                  <span className="font-mono text-primary text-[11px]">
                    &quot;{current.onScreenText}&quot;
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Editable Caption & Feed Mock */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
                  Editable Caption
                </span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-tertiary">
                    {current.caption.length} / {current.charLimit} chars
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-primary hover:text-accent font-medium transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span className="text-success">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                rows={9}
                value={current.caption}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full mt-3 p-3 text-xs border border-border rounded bg-surface focus:outline-none focus:border-accent font-sans leading-relaxed text-primary"
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-tertiary">HASHTAGS:</span>
                {current.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Bar: Diff trigger & Voice Memory Link */}
            <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-tertiary font-mono">
                Edits automatically compile into Brand Voice Memory.
              </span>
              <Link
                href="/app/voice-memory"
                className="text-accent hover:text-accent-hover font-medium flex items-center gap-1 font-mono"
              >
                <span>View Learned Rules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
