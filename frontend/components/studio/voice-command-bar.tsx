"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, CornerDownLeft, Sparkles, X, Loader2 } from "lucide-react";
import { api, VoiceInterpretation } from "@/lib/api";

interface VoiceCommandBarProps {
  onInterpretationReceived?: (data: VoiceInterpretation) => void;
  onOpenVoiceStudio?: () => void;
}

export function VoiceCommandBar({
  onInterpretationReceived,
  onOpenVoiceStudio,
}: VoiceCommandBarProps) {
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Simulate/call voice interpretation endpoint
      const interpretation: VoiceInterpretation = {
        raw_text: command,
        clean_text: command.replace(/um+|uh+|like\s+/gi, "").trim(),
        intent: command.toLowerCase().includes("schedule")
          ? "schedule_post"
          : command.toLowerCase().includes("view") || command.toLowerCase().includes("like")
          ? "log_performance"
          : command.toLowerCase().includes("rule") || command.toLowerCase().includes("ban")
          ? "update_rule"
          : "edit_clip",
        entities: { query: command },
        fillers_removed: ["um", "like", "you know"].filter((f) =>
          command.toLowerCase().includes(f)
        ),
        corrections_applied: [],
      };

      setLastResult(`Executed: ${interpretation.intent} ("${interpretation.clean_text}")`);
      if (onInterpretationReceived) {
        onInterpretationReceived(interpretation);
      }
      setCommand("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="bg-surface border border-border rounded-lg shadow-lg p-2 flex flex-col gap-1.5 transition-all focus-within:border-accent">
        {lastResult && (
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-mono bg-surface-subtle rounded border border-border text-secondary">
            <span className="truncate">{lastResult}</span>
            <button
              onClick={() => setLastResult(null)}
              className="text-tertiary hover:text-primary ml-2"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Wispr Flow Mic Indicator */}
          <button
            type="button"
            onClick={onOpenVoiceStudio}
            className="p-2 rounded bg-surface-subtle hover:bg-accent-subtle text-accent border border-border hover:border-accent/30 transition-colors shrink-0"
            title="Open Wispr Flow Raw/Clean Voice Studio"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Talk to Reel: 'Schedule top 3 clips for next week' or 'Rule: ban buzzwords' (Wispr Flow active)"
            className="flex-1 bg-transparent border-0 text-xs text-primary placeholder:text-tertiary focus:outline-none font-sans"
          />

          {/* Shortcut hint / submit */}
          <div className="flex items-center gap-1.5 shrink-0">
            {command.trim() ? (
              <button
                type="submit"
                disabled={isProcessing}
                className="px-2.5 py-1 bg-primary text-surface rounded text-xs font-medium hover:bg-black transition-colors flex items-center gap-1"
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <span>Run</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-mono text-tertiary border border-border px-1.5 py-0.5 rounded bg-surface-subtle">
                <span>⌘K</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
