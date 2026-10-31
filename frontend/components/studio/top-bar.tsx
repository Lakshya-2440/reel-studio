"use client";

import { useState } from "react";
import {
  ChevronDown,
  RotateCcw,
  Cpu,
  Mic,
  ExternalLink,
  Check,
} from "lucide-react";

interface TopBarProps {
  onOpenVoiceStudio?: () => void;
}

export function TopBar({ onOpenVoiceStudio }: TopBarProps) {
  const [selectedProject, setSelectedProject] = useState("The Founder Files — Ep. 42");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [resetting, setResetting] = useState(false);

  const projects = [
    "The Founder Files — Ep. 42",
    "SaaS Scaling Decoded — Ep. 18",
    "Product Space Live: Agentic AI",
  ];

  const handleResetDemo = () => {
    setResetting(true);
    setTimeout(() => {
      setResetting(false);
      window.location.reload();
    }, 400);
  };

  return (
    <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Project Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-border bg-surface hover:bg-surface-subtle text-xs font-semibold text-primary transition-colors font-sans"
          >
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>{selectedProject}</span>
            <ChevronDown className="w-3.5 h-3.5 text-tertiary" />
          </button>

          {showProjectDropdown && (
            <div className="absolute left-0 mt-1.5 w-64 bg-surface border border-border rounded-md shadow-card py-1 z-50">
              <div className="px-3 py-1 text-[10px] font-mono text-tertiary uppercase tracking-wider">
                Select Project
              </div>
              {projects.map((proj) => (
                <button
                  key={proj}
                  onClick={() => {
                    setSelectedProject(proj);
                    setShowProjectDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-primary hover:bg-surface-subtle flex items-center justify-between"
                >
                  <span className={proj === selectedProject ? "font-semibold" : ""}>{proj}</span>
                  {proj === selectedProject && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs font-mono text-tertiary hidden sm:inline-block">
          Duration: 48m 12s · 12 clips ranked
        </span>
      </div>

      {/* Right: Model Status Chip, Reset Demo, Voice Studio trigger */}
      <div className="flex items-center gap-3">
        {/* Model status chip */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-surface-subtle text-[11px] font-mono text-secondary">
          <Cpu className="w-3 h-3 text-accent" />
          <span>Model:</span>
          <span className="font-semibold text-primary">HF Inference</span>
          <span className="text-tertiary">· Fallback ready (Gemini)</span>
        </div>

        {/* Voice Studio quick button */}
        <button
          onClick={onOpenVoiceStudio}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border bg-surface hover:bg-accent-subtle hover:text-accent hover:border-accent/30 text-xs font-medium text-secondary transition-colors"
          title="Open Voice Studio (Wispr Flow Intent Parser)"
        >
          <Mic className="w-3.5 h-3.5 text-accent" />
          <span className="hidden md:inline">Voice Studio</span>
        </button>

        {/* Reset Demo button */}
        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border bg-surface hover:bg-surface-subtle text-xs font-medium text-secondary hover:text-primary transition-colors disabled:opacity-50"
          title="Reset project demo state to clean seeds"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-tertiary ${resetting ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>
      </div>
    </header>
  );
}
