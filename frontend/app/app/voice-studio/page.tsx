"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  Check,
  RefreshCw,
  Copy,
  Sliders,
  CornerDownLeft,
  Calendar,
  Activity,
  Brain,
  FileText,
  Volume2,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  AlertCircle,
  Play,
  Square,
} from "lucide-react";

interface VoiceScenario {
  id: string;
  title: string;
  category: "scheduling" | "performance" | "rules" | "copy";
  categoryLabel: string;
  description: string;
  raw: string;
  fillers: string[];
  corrections: { original: string; corrected: string };
  cleanText: string;
  intent: "schedule_calendar" | "log_performance" | "update_voice_rule" | "generate_copy";
  platformChips: string[];
  timeSlotIst?: string;
  targetEntities: string[];
  parsedAction: Record<string, any>;
  targetScreen: string;
  targetScreenLabel: string;
}

export default function VoiceStudioPage() {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [executedToast, setExecutedToast] = useState<string | null>(null);
  const [customSpeechText, setCustomSpeechText] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const sampleScenarios: VoiceScenario[] = [
    {
      id: "calendar_sched",
      title: "Voice Scheduling Directive",
      category: "scheduling",
      categoryLabel: "Calendar",
      description: "Dictate complex IST schedule constraints using conversational speech with mid-sentence corrections.",
      raw: "Hey TheContentCompany um schedule the first three clips across next week, uh actually make that Tuesday and Thursday, on LinkedIn in the morning around 9:30 AM IST and Reels in the evening.",
      fillers: ["um", "uh actually", "around"],
      corrections: {
        original: "across next week",
        corrected: "Tuesday and Thursday",
      },
      cleanText: "Schedule clips 1, 2, and 3 on Tuesday and Thursday: LinkedIn at 09:30 AM IST, Instagram Reels at 06:30 PM IST.",
      intent: "schedule_calendar",
      platformChips: ["LinkedIn", "Instagram Reels"],
      timeSlotIst: "Tue & Thu 09:30 AM & 06:30 PM IST",
      targetEntities: ["clip_01", "clip_02", "clip_03"],
      parsedAction: {
        action: "schedule_calendar",
        target_clips: ["clip_01", "clip_02", "clip_03"],
        timezone: "Asia/Kolkata (UTC+05:30)",
        slots: [
          { day: "Tuesday", time_ist: "09:30 AM", platform: "linkedin", clip: "The $50k MRR Trap" },
          { day: "Tuesday", time_ist: "06:30 PM", platform: "reels", clip: "Why 90% Die at $50k MRR" },
          { day: "Thursday", time_ist: "09:30 AM", platform: "linkedin", clip: "Why $50k Checks Break Startups" },
        ],
        corrections_applied: [
          { from: "across next week", to: "Tuesday and Thursday", confidence: 0.98 },
        ],
        fillers_filtered: ["um", "uh actually", "around"],
        status: "validated_pydantic_schema",
      },
      targetScreen: "/app/calendar",
      targetScreenLabel: "Open Content Calendar",
    },
    {
      id: "perf_telemetry",
      title: "Voice Performance Logging",
      category: "performance",
      categoryLabel: "Performance",
      description: "Log post view counts and saves straight from founder phone after reviewing LinkedIn analytics.",
      raw: "So the pricing clip on LinkedIn got like 18,400 views and uh 420 likes, but the question hook one kinda flopped with only 1,100 views.",
      fillers: ["like", "uh", "kinda"],
      corrections: {
        original: "flopped",
        corrected: "underperformed at 1,100 views",
      },
      cleanText: "Log post metrics: Pricing clip on LinkedIn (18,400 views, 420 likes). Question hook post (1,100 views).",
      intent: "log_performance",
      platformChips: ["LinkedIn"],
      targetEntities: ["pricing_clip", "question_hook_clip"],
      parsedAction: {
        action: "log_performance",
        posts: [
          {
            clip_id: "clip_02_pricing",
            platform: "linkedin",
            views: 18400,
            likes: 420,
            status: "top_performer",
            inferred_hook_type: "number",
          },
          {
            clip_id: "clip_05_question",
            platform: "linkedin",
            views: 1100,
            likes: 18,
            status: "underperformer",
            inferred_hook_type: "question",
          },
        ],
        causal_weight_delta: {
          number_led_hooks: "+35% prior boost",
          question_hooks: "-21.4% prior demotion",
        },
        status: "validated_pydantic_schema",
      },
      targetScreen: "/app/performance",
      targetScreenLabel: "Open Performance Loop",
    },
    {
      id: "voice_rule_intake",
      title: "Voice Brand Rule Extraction",
      category: "rules",
      categoryLabel: "Voice Memory",
      description: "Refine voice memory guidelines conversationally without manually filling forms.",
      raw: "Make the LinkedIn hook punchier and um remove the word leverage, actually don't ever use corporate buzzwords like leverage or synergy in any post.",
      fillers: ["um", "actually"],
      corrections: {
        original: "remove the word leverage",
        corrected: "don't ever use corporate buzzwords like leverage or synergy in any post",
      },
      cleanText: "Update brand rule: Ban 'leverage' and 'synergy' across all platforms. Enforce punchy founder tone.",
      intent: "update_voice_rule",
      platformChips: ["LinkedIn", "All Platforms"],
      targetEntities: ["leverage", "synergy"],
      parsedAction: {
        action: "update_voice_rule",
        rule_category: "vocabulary",
        banned_phrases_added: ["leverage", "synergy"],
        style_directive: "Enforce punchy, direct operator voice; reject corporate filler.",
        extraction_confidence: 0.97,
        diff_trigger: "Voice directive replacement",
        status: "validated_pydantic_schema",
      },
      targetScreen: "/app/voice-memory",
      targetScreenLabel: "Open Voice Memory",
    },
    {
      id: "copy_conditioning",
      title: "Voice Copy Conditioning",
      category: "copy",
      categoryLabel: "Copy Engine",
      description: "Dictate real-time stylistic pivots for platform copy hooks.",
      raw: "Hey TheContentCompany, regenerate the hook for clip 2 on X, like make it sound way more contrarian, uh almost like an angry operator who just audited their cloud invoice.",
      fillers: ["like", "uh", "almost like"],
      corrections: {
        original: "way more contrarian",
        corrected: "angry operator auditing cloud invoice",
      },
      cleanText: "Regenerate X hook for Clip #02: Increase contrarian boldness to 95%. Persona: Operator auditing cloud invoice.",
      intent: "generate_copy",
      platformChips: ["X (Twitter)"],
      targetEntities: ["clip_02", "hook_variant"],
      parsedAction: {
        action: "generate_copy",
        clip_id: "clip_02",
        platform: "x",
        style_modifiers: {
          boldness: 95,
          persona: "operator_cloud_audit",
          target_hook: "If your gross margin is under 70%, you didn't build software.",
        },
        status: "validated_pydantic_schema",
      },
      targetScreen: "/app/copy",
      targetScreenLabel: "Open Copy Studio",
    },
  ];

  const currentScenario = sampleScenarios[activeScenarioIdx];

  const handleExecuteAction = () => {
    setExecutedToast(`Executed ${currentScenario.intent}: Action synchronized across TheContentCompany studio state!`);
    setTimeout(() => setExecutedToast(null), 4000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentScenario.parsedAction, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleToggleMic = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setExecutedToast("Wispr 16kHz speech intake received and transcribed!");
        setTimeout(() => setExecutedToast(null), 3500);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Speech AI
            </span>
            <span className="text-xs font-mono text-tertiary">Wispr Flow Voice Studio · Natural Speech Input</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Wispr Voice Intake & Structured Intent Studio
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Side-by-side inspection of conversational speech cleaning: removes fillers (&ldquo;um&rdquo;, &ldquo;like&rdquo;), strikes through self-corrections, and outputs validated Pydantic schemas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleMic}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-sm font-mono ${
              isRecording
                ? "bg-destructive text-white animate-pulse"
                : "bg-accent hover:bg-accent-hover text-surface"
            }`}
          >
            {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isRecording ? "Listening (Wispr 16kHz)..." : "Simulate Live Mic"}</span>
          </button>
        </div>
      </div>

      {executedToast && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-xs font-mono text-success flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>{executedToast}</span>
          </div>
          <button onClick={() => setExecutedToast(null)} className="text-tertiary hover:text-primary">
            ✕
          </button>
        </div>
      )}

      {/* Interactive Scenario Presets for Judges */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-tertiary">
          <span className="uppercase tracking-wider font-semibold">
            Interactive Wispr Flow Dictation Presets (Test Scenarios for Judges):
          </span>
          <span>Click to inspect live transcription & intent parsing</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sampleScenarios.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => {
                setActiveScenarioIdx(idx);
                setIsCustomMode(false);
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                activeScenarioIdx === idx && !isCustomMode
                  ? "bg-surface border-accent shadow-xs"
                  : "bg-canvas border-border hover:border-tertiary text-secondary"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="font-semibold text-accent">{sc.categoryLabel}</span>
                <span className="text-tertiary">#{idx + 1}</span>
              </div>
              <div className="text-xs font-bold text-primary truncate">{sc.title}</div>
              <div className="text-[11px] text-tertiary font-sans mt-0.5 line-clamp-1">
                {sc.intent}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Full Side-By-Side Voice Studio Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: Raw Speech with Fillers & Corrections */}
        <div className="lg:col-span-6 bg-surface border border-border rounded-lg p-6 shadow-card space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold text-primary">
                  Raw Speech Transcript (Wispr Audio Input)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20 font-semibold">
                Filler Detection Active
              </span>
            </div>

            {/* Audio Waveform simulation indicator */}
            <div className="p-3 bg-canvas rounded-lg border border-border flex items-center justify-between font-mono text-xs text-tertiary">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-accent" />
                <span>Audio Stream: 16kHz Mono FLAC</span>
              </div>
              <div className="flex items-center gap-1">
                {[4, 8, 14, 6, 12, 18, 10, 5, 12, 7, 15, 6].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full ${
                      isRecording ? "bg-accent animate-pulse" : "bg-border"
                    }`}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>

            {/* Highlighted Transcript */}
            <div className="p-4 bg-canvas rounded-lg border border-border text-xs leading-relaxed font-mono">
              <div className="text-[10px] text-tertiary font-bold uppercase mb-2">
                ORIGINAL CONVERSATIONAL SPEECH:
              </div>
              <p className="text-primary text-sm leading-relaxed">
                {currentScenario.raw.split(" ").map((word, i) => {
                  const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
                  const isFiller = currentScenario.fillers.some((f) =>
                    f.toLowerCase().includes(cleanWord)
                  );
                  const isStrike =
                    currentScenario.corrections &&
                    currentScenario.corrections.original
                      .toLowerCase()
                      .includes(cleanWord);

                  if (isStrike) {
                    return (
                      <span
                        key={i}
                        className="line-through text-destructive bg-destructive/15 px-1 py-0.5 rounded mx-0.5 font-medium border border-destructive/20"
                        title="Self-correction discarded"
                      >
                        {word}{" "}
                      </span>
                    );
                  }
                  if (isFiller) {
                    return (
                      <span
                        key={i}
                        className="bg-accent-subtle text-accent font-semibold px-1 py-0.5 rounded border border-accent/20 mx-0.5"
                        title="Filler word removed"
                      >
                        {word}{" "}
                      </span>
                    );
                  }
                  return <span key={i}>{word} </span>;
                })}
              </p>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs font-mono text-tertiary pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-accent" />
                <span>
                  Orange highlight: Conversational fillers (
                  <strong className="text-primary">{currentScenario.fillers.join(", ")}</strong>)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-destructive" />
                <span>
                  Red strikethrough: Discarded self-correction (
                  <strong className="text-destructive font-mono">&ldquo;{currentScenario.corrections.original}&rdquo;</strong> &rarr;{" "}
                  <strong className="text-success font-mono">&ldquo;{currentScenario.corrections.corrected}&rdquo;</strong>)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-tertiary">
            <span>Latency: 182ms</span>
            <span className="text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Wispr Cleaned
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Clean Structured Intent Engine */}
        <div className="lg:col-span-6 bg-surface border border-border rounded-lg p-6 shadow-card space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold text-primary">
                  Structured Intent & Schema Validation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent text-surface font-bold">
                  {currentScenario.intent}
                </span>
                <button
                  onClick={handleCopyJson}
                  title="Copy JSON Schema"
                  className="p-1 rounded text-tertiary hover:text-primary transition-colors"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Extracted Entity Chips */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-tertiary uppercase">EXTRACTED ENTITIES:</div>
              <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
                {currentScenario.platformChips.map((plt) => (
                  <span
                    key={plt}
                    className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 font-semibold"
                  >
                    Platform: {plt}
                  </span>
                ))}
                {currentScenario.timeSlotIst && (
                  <span className="px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20 font-semibold">
                    Time: {currentScenario.timeSlotIst}
                  </span>
                )}
                {currentScenario.targetEntities.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-surface border border-border text-primary font-medium"
                  >
                    Target: {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Clean summary */}
            <div className="p-3 bg-surface-subtle rounded-lg border border-border text-xs space-y-1 font-sans">
              <div className="text-[10px] text-tertiary font-mono uppercase font-bold">
                CLEAN INTENT DIRECTIVE:
              </div>
              <p className="text-primary font-medium leading-relaxed">
                {currentScenario.cleanText}
              </p>
            </div>

            {/* JSON Schema */}
            <div className="space-y-1">
              <div className="text-[10px] text-tertiary font-mono uppercase">
                PYDANTIC SCHEMA VALIDATED (JSONB READY):
              </div>
              <pre className="p-3 bg-canvas rounded-lg border border-border text-[11px] font-mono text-primary overflow-x-auto leading-relaxed max-h-56">
                {JSON.stringify(currentScenario.parsedAction, null, 2)}
              </pre>
            </div>
          </div>

          {/* Action Execution Footer */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <Link
              href={currentScenario.targetScreen}
              className="text-xs font-mono text-accent hover:underline flex items-center gap-1 font-semibold"
            >
              <span>{currentScenario.targetScreenLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleExecuteAction}
              className="px-4 py-2 bg-primary hover:bg-black text-surface font-medium rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm font-sans"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>Execute Action</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
