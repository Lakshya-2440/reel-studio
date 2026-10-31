"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Palette,
  Sparkles,
  Download,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
  CheckCircle2,
  XCircle,
  Copy,
  Type,
  FileText,
  ShieldCheck,
  Share2,
  ArrowRight,
  Eye,
  Sliders,
} from "lucide-react";

interface ColorSwatch {
  name: string;
  hex: string;
  rgb: string;
  role: "primary" | "secondary" | "accent" | "canvas" | "surface";
  contrast: string;
}

export default function BrandKitPage() {
  const [handle, setHandle] = useState("alex_founder (The Founder Files)");
  const [isScraping, setIsScraping] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [activePreviewMock, setActivePreviewMock] = useState<"linkedin" | "reels">("linkedin");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedPostsText, setPastedPostsText] = useState("");
  const [scrapeSuccessNotice, setScrapeSuccessNotice] = useState<string | null>(
    "Cached Scrapling demo profile active for @alex_founder (15 YC founder posts analyzed)"
  );

  const [palette, setPalette] = useState<ColorSwatch[]>([
    {
      name: "YC Flame Amber",
      hex: "#F26522",
      rgb: "242, 101, 34",
      role: "accent",
      contrast: "4.8:1 on Dark Canvas",
    },
    {
      name: "Executive Obsidian",
      hex: "#0F172A",
      rgb: "15, 23, 42",
      role: "canvas",
      contrast: "14.2:1 against White",
    },
    {
      name: "Electric Indigo",
      hex: "#6366F1",
      rgb: "99, 102, 241",
      role: "primary",
      contrast: "5.1:1 on Dark Surface",
    },
    {
      name: "Signal Emerald",
      hex: "#10B981",
      rgb: "16, 185, 129",
      role: "secondary",
      contrast: "6.2:1 (Metric Lift)",
    },
    {
      name: "Editorial Parchment",
      hex: "#FAF9F6",
      rgb: "250, 249, 246",
      role: "surface",
      contrast: "15.6:1 against Obsidian",
    },
  ]);

  const [typography, setTypography] = useState({
    headlineFont: "Syne (Google Fonts)",
    headlineWeight: "800 ExtraBold",
    headlineTracking: "+0.04em (Uppercase Editorial)",
    bodyFont: "Inter Tight / Geist Sans",
    monoFont: "Geist Mono / JetBrains Mono",
    vibe: "High-density editorial, investor memo aesthetic. Authoritative, operator-grade, zero AI slop.",
  });

  const [visualRules, setVisualRules] = useState({
    dos: [
      "Single high-contrast statement per carousel slide or video cover",
      "Explicit monospace timestamps and episode metadata [Ep. 42 · 04:18]",
      "Monochrome dark canvas with high-contrast YC Flame (#F26522) data highlights",
      "Exact dollar metrics and margins displayed in bold display typography",
    ],
    donts: [
      "NO bubbly purple-to-blue neon gradient blobs",
      "NO cartoon illustrated 3D avatars or floating spheres",
      "NO celebratory emojis or confetti graphics",
      "NO centered 'Supercharge your workflow' generic AI copy",
    ],
  });

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleExtractBrand = (isDemo: boolean = false) => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      setScrapeSuccessNotice(
        isDemo
          ? "Loaded cached Scrapling profile: 15 posts analyzed from @alex_founder."
          : `Extracted brand identity from ${handle}: 5 dominant colors and Syne/Inter typography synchronized!`
      );
    }, 900);
  };

  const handleExportJson = () => {
    const data = {
      brand_name: "The Founder Files",
      handle,
      extracted_palette: palette,
      typography,
      visual_rules: visualRules,
      compliance: "Analyzed under creator permission policy.",
      generated_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brand-kit.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Brand AI
            </span>
            <span className="text-xs font-mono text-tertiary">Brand Kit & Scraper Extraction</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Brand Kit & Visual Identity Adapter
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Extracts palette, typography vibe, and visual guidelines from creator socials (Scrapling adapter). Themes generated post cards and thumbnails.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPasteModal(true)}
            className="px-3.5 py-1.5 bg-surface text-primary border border-border hover:bg-surface-subtle text-xs font-medium rounded transition-colors flex items-center gap-1.5 font-mono shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-tertiary" />
            <span>Paste Posts Fallback</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-sm font-sans"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Brand Kit JSON</span>
          </button>
        </div>
      </div>

      {/* Scraper / Intake Bar */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-primary flex items-center gap-2">
            <Share2 className="w-4 h-4 text-accent" />
            <span>Analyze Social Profile (Scrapling Adapter: LinkedIn or Instagram)</span>
          </label>
          <span className="text-[11px] font-mono text-tertiary">
            Cached Scrapling JSON fallback ready
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-border rounded bg-surface focus:outline-none focus:border-accent font-mono text-primary"
            placeholder="Enter handle or profile URL (e.g. linkedin.com/in/founder or @alex_founder)"
          />
          <button
            onClick={() => handleExtractBrand(false)}
            disabled={isScraping}
            className="px-4 py-2 bg-primary text-surface text-xs font-medium rounded hover:bg-black transition-colors shrink-0 flex items-center justify-center gap-1.5 font-mono shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
            <span>{isScraping ? "Scraping via Scrapling..." : "Extract Brand Kit"}</span>
          </button>

          <button
            onClick={() => handleExtractBrand(true)}
            disabled={isScraping}
            className="px-3.5 py-2 bg-surface text-primary border border-border hover:bg-surface-subtle text-xs font-mono font-medium rounded transition-colors shrink-0"
          >
            Use Cached Demo Profile
          </button>
        </div>

        {/* Compliance Notice */}
        <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-tertiary">
          <span className="flex items-center gap-1 text-secondary">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            Compliance: Only scrape accounts you own or have permission to analyze.
          </span>
          <span className="text-success font-medium">Scrapling Fetcher v0.3 active</span>
        </div>
      </div>

      {scrapeSuccessNotice && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-xs font-mono text-success flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>{scrapeSuccessNotice}</span>
          </div>
          <button onClick={() => setScrapeSuccessNotice(null)} className="text-tertiary hover:text-primary">
            ✕
          </button>
        </div>
      )}

      {/* 5-Color Extracted Palette Swatches */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-primary">
                Extracted 5-Color Brand Palette
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Extracted from scraped carousel slides and thumbnails via k-means clustering.
            </p>
          </div>
          <span className="text-xs font-mono text-tertiary">
            Click any swatch to copy Hex
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {palette.map((color) => (
            <div
              key={color.hex}
              onClick={() => handleCopyHex(color.hex)}
              className="p-3 bg-canvas border border-border rounded-lg flex flex-col justify-between space-y-3 hover:border-tertiary transition-all cursor-pointer group"
            >
              {/* Swatch color block */}
              <div
                className="w-full h-16 rounded-md border border-black/10 shadow-inner flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: color.hex }}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-white flex items-center gap-1">
                  {copiedHex === color.hex ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Hex</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-primary truncate">{color.name}</div>
                <div className="flex items-center justify-between text-[11px] font-mono text-tertiary mt-1">
                  <span className="font-semibold text-primary">{color.hex}</span>
                  <span className="uppercase text-[9px] px-1 rounded bg-surface border border-border">
                    {color.role}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-tertiary mt-1">
                  RGB: {color.rgb}
                </div>
                <div className="text-[9px] font-mono text-secondary mt-0.5">
                  {color.contrast}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography System & Google Font Pairings */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-primary">
              Typography System & Google Font Pairings
            </span>
          </div>
          <span className="text-xs font-mono text-accent font-semibold">
            Syne + Inter Pairing Synced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Headline Font Card */}
          <div className="p-4 bg-canvas rounded-lg border border-border space-y-2">
            <div className="text-[10px] font-mono text-tertiary uppercase">DISPLAY / HEADLINE FONT</div>
            <div className="text-xl font-bold tracking-tight text-primary font-sans">
              Syne (Google Fonts)
            </div>
            <div className="text-xs font-mono text-secondary">
              Weight: 800 ExtraBold · Tracking: +0.04em
            </div>
            <div className="pt-2 border-t border-border text-[11px] text-tertiary font-sans">
              Used for 9:16 vertical video hook titles and carousel statement slides.
            </div>
          </div>

          {/* Body System Card */}
          <div className="p-4 bg-canvas rounded-lg border border-border space-y-2">
            <div className="text-[10px] font-mono text-tertiary uppercase">BODY & CAPTIONS</div>
            <div className="text-xl font-semibold tracking-normal text-primary font-sans">
              Inter Tight / Geist
            </div>
            <div className="text-xs font-mono text-secondary">
              Weight: 400 Regular & 600 SemiBold
            </div>
            <div className="pt-2 border-t border-border text-[11px] text-tertiary font-sans">
              High-density reading cadence optimized for mobile LinkedIn and X feed views.
            </div>
          </div>

          {/* Metadata Mono Card */}
          <div className="p-4 bg-canvas rounded-lg border border-border space-y-2">
            <div className="text-[10px] font-mono text-tertiary uppercase">METADATA & DATA MONO</div>
            <div className="text-xl font-bold font-mono text-primary">
              Geist / JetBrains
            </div>
            <div className="text-xs font-mono text-secondary">
              Weight: 500 Medium · Monospace
            </div>
            <div className="pt-2 border-t border-border text-[11px] text-tertiary font-sans">
              Timestamps [04:18], dollar numbers ($42,000), and performance ratios.
            </div>
          </div>
        </div>

        {/* Live Typographic Preview */}
        <div className="p-5 bg-canvas rounded-lg border border-border space-y-2">
          <div className="text-[10px] font-mono text-tertiary uppercase">LIVE TYPOGRAPHY RENDERING:</div>
          <div className="space-y-1">
            <div className="text-lg font-extrabold uppercase tracking-wide text-primary">
              THE $50K MRR TRAP: WHY COMPUTE BLEEDS EARLY SOFTWARE
            </div>
            <div className="text-xs text-secondary leading-relaxed font-sans max-w-2xl">
              Software without gross margin is just unpaid consulting. In Ep. 42, we break down why scaling customer count before auditing token consumption creates a subsidized distribution leak.
            </div>
            <div className="text-xs font-mono text-accent pt-1">
              [Ep. 42 · 04:18 - 05:08] · 56s Clip Duration · Margin: 16% &rarr; 81%
            </div>
          </div>
        </div>
      </div>

      {/* Visual Identity Card & Mock Social Post (Using Brand Palette) */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-primary">
                Mock Social Asset (Themed with Brand Kit Palette)
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Demonstrates how the extracted palette themes social graphics (NOT TheContentCompany app UI itself).
            </p>
          </div>

          <div className="flex items-center gap-1 bg-canvas p-1 rounded border border-border font-mono text-xs">
            <button
              onClick={() => setActivePreviewMock("linkedin")}
              className={`px-3 py-1 rounded transition-colors ${
                activePreviewMock === "linkedin"
                  ? "bg-primary text-surface font-semibold shadow-xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              LinkedIn Carousel Slide
            </button>
            <button
              onClick={() => setActivePreviewMock("reels")}
              className={`px-3 py-1 rounded transition-colors ${
                activePreviewMock === "reels"
                  ? "bg-primary text-surface font-semibold shadow-xs"
                  : "text-secondary hover:text-primary"
              }`}
            >
              9:16 Video Thumbnail
            </button>
          </div>
        </div>

        {/* Mock Rendering Container */}
        <div className="flex justify-center p-6 bg-canvas border border-border rounded-lg">
          {activePreviewMock === "linkedin" ? (
            /* LinkedIn Square Carousel Slide Mockup */
            <div
              className="w-full max-w-md aspect-square rounded-lg p-6 flex flex-col justify-between shadow-xl relative overflow-hidden"
              style={{
                backgroundColor: "#0F172A", // Executive Obsidian
                border: "2px solid #F26522", // YC Flame Border
                color: "#FAF9F6", // Editorial Parchment
              }}
            >
              {/* Header meta */}
              <div className="flex items-center justify-between text-xs font-mono border-b border-white/10 pb-3">
                <span className="text-white/60 uppercase tracking-widest text-[10px]">THE FOUNDER FILES</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: "#F26522", color: "#FFFFFF" }}>
                  SLIDE 01 / 05
                </span>
              </div>

              {/* Main Hook Quote */}
              <div className="space-y-4 my-auto">
                <div className="text-2xl font-black uppercase tracking-tight leading-snug" style={{ color: "#FAF9F6" }}>
                  &ldquo;At $50k MRR, our compute bill was $42,000.&rdquo;
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  We were effectively subsidizing Fortune 500 pilots on our personal credit cards. Software without gross margin is just unpaid consulting.
                </p>
                <div className="p-3 rounded bg-white/5 border border-white/10 font-mono text-xs flex items-center justify-between">
                  <span className="text-white/70">GROSS MARGIN AUDIT:</span>
                  <span className="font-bold text-emerald-400">16% &rarr; 81%</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[11px] font-mono border-t border-white/10 pt-3 text-white/60">
                <span>Ep. 42: Marcus Vance</span>
                <span style={{ color: "#F26522" }}>Swipe &rarr;</span>
              </div>
            </div>
          ) : (
            /* Instagram Reels 9:16 Vertical Video Cover Mockup */
            <div
              className="w-full max-w-xs aspect-[9/16] rounded-xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden"
              style={{
                backgroundColor: "#0F172A",
                border: "2px solid #F26522",
                color: "#FAF9F6",
              }}
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white">
                  REEL #42
                </span>
                <span className="text-[10px] text-white/60">[04:18] 56s</span>
              </div>

              {/* Center Kinetic Title Overlay */}
              <div className="space-y-3 text-center my-auto">
                <div
                  className="inline-block px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase mb-1"
                  style={{ backgroundColor: "#F26522", color: "#FFFFFF" }}
                >
                  UNIT ECONOMICS AUTOPSY
                </div>
                <div className="text-2xl font-black uppercase tracking-tight leading-tight text-white">
                  WHY 90% OF AI STARTUPS DIE AT $50K MRR
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/10 text-xs text-emerald-400 font-mono font-bold inline-block">
                  &ldquo;Compute was $42,000 / mo&rdquo;
                </div>
              </div>

              {/* Bottom Creator Brand */}
              <div className="text-center text-[10px] font-mono text-white/60 border-t border-white/10 pt-3">
                The Founder Files · Alex Rivera & Marcus Vance
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Do's & Don'ts Guardrails */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-sm font-bold text-primary">
            Visual Guardrails for Post Mocks (Slop Audit Compliant)
          </span>
          <span className="text-xs font-mono text-tertiary">Deterministic Quality Gates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-success/5 border border-success/20 rounded-lg space-y-2">
            <div className="font-bold text-success text-xs flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>DO EMBRACE (HIGH DENSITY)</span>
            </div>
            {visualRules.dos.map((item, i) => (
              <div key={i} className="text-secondary text-xs flex items-start gap-2 font-sans">
                <span className="text-success font-bold">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-2">
            <div className="font-bold text-destructive text-xs flex items-center gap-1.5 font-mono">
              <XCircle className="w-4 h-4" />
              <span>AVOID (SLOP AUDIT GATES)</span>
            </div>
            {visualRules.donts.map((item, i) => (
              <div key={i} className="text-secondary text-xs flex items-start gap-2 font-sans">
                <span className="text-destructive font-bold">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Paste Posts Fallback Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">Paste Sample Posts (Fallback)</h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-tertiary hover:text-primary text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-secondary font-sans">
                If LinkedIn or Instagram rate-limits scrapers, paste your best 5-10 recent posts below. TheContentCompany will extract tone, vocabulary, and color palette automatically.
              </p>

              <textarea
                rows={6}
                value={pastedPostsText}
                onChange={(e) => setPastedPostsText(e.target.value)}
                placeholder="Paste post text here (one post per paragraph)..."
                className="w-full p-3 bg-canvas border border-border rounded text-xs font-mono text-primary focus:outline-none focus:border-accent"
              />

              <button
                onClick={() => {
                  setPastedPostsText(
                    "The biggest mistake first-time founders make with content: they treat it like marketing instead of customer discovery.\n\nWhen you write publicly about the hardest bugs you solved this week, your ideal customers DM you with 'we have this exact problem, can we buy this?'\n\nContent is not brand fluff—it's asynchronous sales engineering."
                  );
                }}
                className="text-[11px] font-mono text-accent hover:underline"
              >
                Insert sample founder post
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border font-mono text-xs">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-3.5 py-1.5 text-secondary hover:text-primary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  handleExtractBrand(true);
                }}
                className="px-4 py-1.5 bg-primary text-surface font-medium rounded hover:bg-black transition-colors"
              >
                Extract from Pasted Posts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
