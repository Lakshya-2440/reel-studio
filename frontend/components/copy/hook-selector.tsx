"use client";

import { useState } from "react";
import { Check, Sparkles, SlidersHorizontal, ArrowLeftRight } from "lucide-react";

interface HookSelectorProps {
  hookA: string;
  hookB: string;
  activeHook: "A" | "B";
  onSelectHook: (hookKey: "A" | "B") => void;
}

export function HookSelector({
  hookA,
  hookB,
  activeHook,
  onSelectHook,
}: HookSelectorProps) {
  return (
    <div className="space-y-2 bg-surface p-3.5 rounded border border-border">
      <div className="flex items-center justify-between text-[11px] font-mono text-tertiary">
        <span className="uppercase tracking-wider flex items-center gap-1.5">
          <ArrowLeftRight className="w-3 h-3 text-accent" />
          A/B Hook Variant Selector
        </span>
        <span className="text-secondary font-medium">Click to test alternate hook opening</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {/* Variant A */}
        <button
          type="button"
          onClick={() => onSelectHook("A")}
          className={`p-3 rounded text-left transition-all border space-y-1.5 ${
            activeHook === "A"
              ? "bg-accent-subtle/40 border-accent text-primary shadow-xs"
              : "bg-canvas border-border text-secondary hover:bg-surface-subtle"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-primary flex items-center gap-1">
              {activeHook === "A" && <Check className="w-3 h-3 text-accent" />}
              HOOK VARIANT A (PRIMARY)
            </span>
            <span className="text-[10px] font-mono text-accent font-semibold">96% Conv.</span>
          </div>
          <div className="text-xs italic leading-relaxed text-primary">
            &ldquo;{hookA}&rdquo;
          </div>
          <div className="text-[10px] font-mono text-tertiary">
            Angle: Paradox & Concrete Numbers (Historical 2.4x lift)
          </div>
        </button>

        {/* Variant B */}
        <button
          type="button"
          onClick={() => onSelectHook("B")}
          className={`p-3 rounded text-left transition-all border space-y-1.5 ${
            activeHook === "B"
              ? "bg-accent-subtle/40 border-accent text-primary shadow-xs"
              : "bg-canvas border-border text-secondary hover:bg-surface-subtle"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-primary flex items-center gap-1">
              {activeHook === "B" && <Check className="w-3 h-3 text-accent" />}
              HOOK VARIANT B (CONTRARIAN)
            </span>
            <span className="text-[10px] font-mono text-tertiary">91% Conv.</span>
          </div>
          <div className="text-xs italic leading-relaxed text-primary">
            &ldquo;{hookB}&rdquo;
          </div>
          <div className="text-[10px] font-mono text-tertiary">
            Angle: Direct Challenge / Question (High comment velocity)
          </div>
        </button>
      </div>
    </div>
  );
}
