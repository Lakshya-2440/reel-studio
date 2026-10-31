"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  Link as LinkIcon,
  FileText,
  Sparkles,
  Check,
  FileAudio,
  Film,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface MediaDropzoneProps {
  onStartIngest: (sourceType: "sample" | "file" | "url" | "paste", sourceData?: any) => void;
  isProcessing: boolean;
}

export function MediaDropzone({ onStartIngest, isProcessing }: MediaDropzoneProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "paste">("upload");
  const [urlInput, setUrlInput] = useState("https://youtube.com/watch?v=founder-files-ep42");
  const [pastedTranscript, setPastedTranscript] = useState(
    `[00:00:12] Marcus Vance: At fifty thousand MRR, we thought we were geniuses. But our compute bills from OpenAI were forty-two thousand dollars. We were effectively subsidizing Fortune 500 experiments out of our personal credit cards.\n[00:01:45] Sarah Chen: Forty-two thousand on fifty thousand revenue. That is a sixteen percent gross margin on paper, before payroll. How did you not panic?\n[00:02:25] Marcus Vance: If your gross margin on an AI product is under seventy percent, stop calling yourself a software company.`
  );
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-4">
      {/* Top Quick-Demo Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-accent-subtle/50 border border-accent/20 rounded">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
          <div>
            <div className="text-xs font-semibold text-primary">
              Judge Evaluation Mode: 1-Click Instant Demo
            </div>
            <div className="text-[11px] text-secondary">
              Load &quot;The Founder Files — Ep. 42&quot; (~48m audio, 12 scored clips, 148 vectors).
            </div>
          </div>
        </div>
        <button
          onClick={() => onStartIngest("sample")}
          disabled={isProcessing}
          className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating Pipeline...</span>
            </>
          ) : (
            <>
              <span>Try Sample Podcast (Ep. 42)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-3 text-xs">
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-3 py-1.5 rounded flex items-center gap-2 font-medium transition-colors ${
            activeTab === "upload"
              ? "bg-primary text-surface font-semibold"
              : "text-secondary hover:text-primary hover:bg-surface-subtle"
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload File (MP4, MOV, MP3, WAV)</span>
        </button>

        <button
          onClick={() => setActiveTab("url")}
          className={`px-3 py-1.5 rounded flex items-center gap-2 font-medium transition-colors ${
            activeTab === "url"
              ? "bg-primary text-surface font-semibold"
              : "text-secondary hover:text-primary hover:bg-surface-subtle"
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>YouTube / Podcast URL</span>
        </button>

        <button
          onClick={() => setActiveTab("paste")}
          className={`px-3 py-1.5 rounded flex items-center gap-2 font-medium transition-colors ${
            activeTab === "paste"
              ? "bg-primary text-surface font-semibold"
              : "text-secondary hover:text-primary hover:bg-surface-subtle"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Paste Transcript</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "upload" && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              dragActive
                ? "border-accent bg-accent-subtle/30"
                : "border-border bg-canvas hover:bg-surface-subtle/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov,.mp3,.wav,.m4a"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="p-3 bg-surface rounded border border-border mb-2.5 shadow-sm">
              <UploadCloud className="w-5 h-5 text-accent" />
            </div>

            {selectedFileName ? (
              <div className="space-y-2">
                <div className="text-xs font-mono font-semibold text-primary flex items-center justify-center gap-2">
                  <Film className="w-3.5 h-3.5 text-accent" />
                  <span>{selectedFileName}</span>
                </div>
                <div className="text-[11px] text-secondary">
                  Ready to ingest via Whisper Large-v3 (FP16).
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartIngest("file", selectedFileName);
                  }}
                  disabled={isProcessing}
                  className="mt-2 px-4 py-1.5 bg-primary hover:bg-black text-surface text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  Start Audio Extraction & Transcription
                </button>
              </div>
            ) : (
              <>
                <div className="text-sm font-semibold text-primary">
                  Drag and drop podcast or video file here
                </div>
                <div className="text-xs text-secondary mt-1 max-w-md">
                  Supports MP4, MOV, MP3, WAV, M4A up to 1.2GB. ffmpeg extracts 16kHz mono audio,
                  chunked through Whisper ASR.
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-tertiary">
                    MP4 / MOV / WAV / MP3
                  </span>
                  <span className="text-[11px] text-tertiary">or click to browse files</span>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "url" && (
          <div className="space-y-3 pt-1">
            <label className="text-xs font-semibold text-primary block">
              Source Media Link (YouTube, Apple Podcasts, Spotify RSS)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-border rounded bg-surface focus:outline-none focus:border-accent font-mono text-primary"
                placeholder="https://youtube.com/watch?v=..."
              />
              <button
                onClick={() => onStartIngest("url", urlInput)}
                disabled={isProcessing}
                className="px-4 py-2 bg-primary text-surface text-xs font-medium rounded hover:bg-black transition-colors shrink-0 disabled:opacity-50"
              >
                Ingest & Process
              </button>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-tertiary">
              <span>Automatic audio demuxing via yt-dlp/ffmpeg</span>
              <span>·</span>
              <button
                type="button"
                onClick={() => setUrlInput("https://youtube.com/watch?v=the-founder-files-ep42")}
                className="text-accent hover:underline font-mono"
              >
                Paste Ep. 42 URL
              </button>
            </div>
          </div>
        )}

        {activeTab === "paste" && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-primary block">
                Raw Transcript (with or without timestamps)
              </label>
              <span className="text-[11px] font-mono text-tertiary">
                Auto-detects speaker tags `Speaker: Text` or `[00:00]`
              </span>
            </div>
            <textarea
              rows={4}
              value={pastedTranscript}
              onChange={(e) => setPastedTranscript(e.target.value)}
              className="w-full p-3 text-xs border border-border rounded bg-surface focus:outline-none focus:border-accent font-mono text-primary leading-relaxed"
              placeholder="Paste speaker transcript here..."
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-secondary">
                {pastedTranscript.split("\n").filter(Boolean).length} lines detected
              </span>
              <button
                onClick={() => onStartIngest("paste", pastedTranscript)}
                disabled={isProcessing}
                className="px-4 py-2 bg-primary text-surface text-xs font-medium rounded hover:bg-black transition-colors disabled:opacity-50"
              >
                Segment & Vectorize Transcript
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
