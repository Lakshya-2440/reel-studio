"use client";

import { useState } from "react";
import { Mic, X, MessageSquare, Check, AlertCircle } from "lucide-react";

interface ClipRejectModalProps {
  clipTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReject: (reason: string) => void;
}

const QUICK_REASONS = [
  "Too salesy / promotional",
  "Context debt too high (confusing without full episode)",
  "Mentions confidential metrics or partners",
  "Tone too combative / contrarian",
  "Audio quality or background laughter",
  "Overly technical for target social audience",
];

export function ClipRejectModal({
  clipTitle,
  isOpen,
  onClose,
  onSubmitReject,
}: ClipRejectModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customText, setCustomText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const finalReason = customText.trim() || selectedReason || "Declined by creator";
    onSubmitReject(finalReason);
    onClose();
  };

  const handleSimulateVoice = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setCustomText("Too aggressive on the margin critique. Our target buyers are actually early stage founders who might feel called out.");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-destructive/10 rounded text-destructive border border-destructive/20">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Reject Clip & Train Agent</h3>
              <p className="text-[11px] text-secondary">
                Rejection feedback updates the Clip Prior & Voice Memory models.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-subtle rounded text-tertiary hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <div className="text-xs font-semibold text-primary mb-1">Clip:</div>
          <div className="text-xs font-mono p-2 bg-canvas border border-border rounded text-secondary">
            {clipTitle}
          </div>
        </div>

        {/* Quick Reason Chips */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-tertiary block">
            SELECT QUICK REASON OR DICTATE VIA VOICE:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedReason(reason);
                    if (!customText) setCustomText(reason);
                  }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors border text-left ${
                    isSelected
                      ? "bg-accent-subtle border-accent text-accent font-semibold"
                      : "bg-canvas border-border text-primary hover:bg-surface-subtle"
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Text / Voice Intake */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-primary">
              Voice or Text Explanation:
            </label>
            <button
              type="button"
              onClick={handleSimulateVoice}
              disabled={isRecording}
              className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${
                isRecording
                  ? "bg-destructive text-surface border-destructive animate-pulse"
                  : "bg-surface-subtle text-primary border-border hover:border-accent"
              }`}
            >
              <Mic className="w-3 h-3 text-accent" />
              <span>{isRecording ? "Listening..." : "Dictate via Wispr Voice"}</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. 'Too salesy, doesn't match our thoughtful tone...'"
            className="w-full p-2.5 text-xs bg-canvas border border-border rounded focus:outline-none focus:border-accent text-primary placeholder:text-tertiary"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-surface-subtle text-primary hover:bg-border text-xs font-medium rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-destructive hover:bg-red-700 text-surface text-xs font-semibold rounded transition-colors"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
