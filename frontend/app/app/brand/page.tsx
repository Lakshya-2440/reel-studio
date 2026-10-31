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
} from "lucide-react";

export default function BrandKitPage() {
  const [handle, setHandle] = useState("alexvance.io");
  const [isScraping, setIsScraping] = useState(false);

  const [brandKit, setBrandKit] = useState({
    name: "The Founder Files",
    tagline: "Unvarnished perspective on scaling B2B companies from 0 to 10M ARR.",
    palette: [
      { name: "Executive Charcoal", hex: "#1E1E24", role: "Primary" },
      { name: "YC Flame Amber", hex: "#F26522", role: "Accent" },
      { name: "Cream Parchment", hex: "#FDFBF7", role: "Canvas" },
      { name: "Steel Slate", hex: "#4A4E69", role: "Secondary" },
      { name: "Terminal Olive", hex: "#22577A", role: "Highlight" },
    ],
    typography: {
      headlineFont: "Inter Tight / Newsreader",
      bodyFont: "Inter / Geist Sans",
      vibe: "High-density editorial, investor memo aesthetic. Zero fluff.",
    },
    visualRules: {
      dos: [
        "Single high-contrast statement per carousel slide",
        "Visible timestamp and episode metadata in monospace font",
        "Authentic audio waveforms without neon overlays",
      ],
      donts: [
        "No bubbly purple/cyan gradient backgrounds",
        "No cartoon illustrated avatars or floating 3D icons",
        "No generic AI sparkles or celebratory emojis",
      ],
    },
  });

  const handleSimulateScrape = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Brand
            </span>
            <span className="text-xs font-mono text-tertiary">Brand Kit & Visual Identity</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Brand Kit & Scraper Extraction
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Extracted from creator social profiles (Scrapling adapter) or seeded profile. Themes social post mockups and cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(brandKit, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "brand-kit.json");
              downloadAnchor.click();
            }}
            className="px-3.5 py-1.5 bg-surface text-primary border border-border hover:bg-surface-subtle text-xs font-medium rounded transition-colors flex items-center gap-1.5 font-mono"
          >
            <Download className="w-3.5 h-3.5 text-tertiary" />
            <span>Export Brand Kit JSON</span>
          </button>
        </div>
      </div>

      {/* Scraper / Intake Bar */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-3">
        <label className="text-xs font-semibold text-primary block">
          Analyze Social Profile (Scrapling Adapter: LinkedIn or Instagram)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-border rounded bg-surface focus:outline-none focus:border-accent font-mono"
            placeholder="Enter handle or profile URL (e.g. linkedin.com/in/founder)"
          />
          <button
            onClick={handleSimulateScrape}
            disabled={isScraping}
            className="px-4 py-2 bg-primary text-surface text-xs font-medium rounded hover:bg-black transition-colors shrink-0 flex items-center gap-1.5 font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
            <span>{isScraping ? "Scraping via Scrapling..." : "Extract Brand Identity"}</span>
          </button>
        </div>
        <div className="text-[11px] text-tertiary font-mono flex items-center justify-between">
          <span>Cached demo scrape active for @alexvance.io</span>
          <span className="text-success font-medium">Safe fallback ready</span>
        </div>
      </div>

      {/* Main Brand Kit Card */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-card space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="text-xs font-mono text-tertiary">BRAND CARD</div>
            <h2 className="text-xl font-bold text-primary mt-0.5">{brandKit.name}</h2>
            <p className="text-xs text-secondary mt-1 max-w-xl">{brandKit.tagline}</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-accent-subtle text-accent border border-accent/20 font-semibold self-start sm:self-auto">
            Brand Memory Synced
          </span>
        </div>

        {/* Color Palette Swatches */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
            Extracted Dominant Color Palette
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {brandKit.palette.map((color) => (
              <div
                key={color.hex}
                className="p-3 bg-canvas border border-border rounded flex flex-col justify-between space-y-3"
              >
                <div
                  className="w-full h-12 rounded border border-black/10 shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <div className="text-xs font-bold text-primary">{color.name}</div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-tertiary mt-1">
                    <span>{color.hex}</span>
                    <span>{color.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography & Visual Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
          {/* Typography Vibe */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
              Typography System
            </div>
            <div className="p-4 bg-canvas rounded border border-border space-y-2 text-xs">
              <div>
                <span className="font-mono text-tertiary text-[10px] block">HEADLINE PAIRING</span>
                <span className="font-bold text-primary text-sm">{brandKit.typography.headlineFont}</span>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="font-mono text-tertiary text-[10px] block">BODY SYSTEM</span>
                <span className="font-semibold text-secondary">{brandKit.typography.bodyFont}</span>
              </div>
              <div className="pt-2 border-t border-border text-[11px] text-tertiary leading-relaxed">
                {brandKit.typography.vibe}
              </div>
            </div>
          </div>

          {/* Visual Do's & Don'ts */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
              Visual Guardrails for Post Mocks
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-success/5 border border-success/20 rounded space-y-1.5">
                <div className="font-bold text-success text-[11px] flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DO EMBRACE</span>
                </div>
                {brandKit.visualRules.dos.map((item, i) => (
                  <div key={i} className="text-secondary text-[11px]">
                    • {item}
                  </div>
                ))}
              </div>

              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded space-y-1.5">
                <div className="font-bold text-destructive text-[11px] flex items-center gap-1.5 font-mono">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>AVOID (SLOP AUDIT)</span>
                </div>
                {brandKit.visualRules.donts.map((item, i) => (
                  <div key={i} className="text-secondary text-[11px]">
                    • {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
