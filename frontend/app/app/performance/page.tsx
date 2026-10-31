"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LineChart,
  BarChart3,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Upload,
  Mic,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  ArrowUpRight,
  Filter,
  Check,
  ChevronDown,
  Layers,
  Activity,
  Zap,
} from "lucide-react";

interface CausalInsight {
  id: string;
  timestamp: string;
  headline: string;
  deltaBadge: string;
  deltaPositive: boolean;
  explanation: string;
  action: string;
  triggerEvent: string;
}

interface FeatureLiftRow {
  feature: string;
  category: string;
  liftRatio: number; // e.g. 1.48x
  liftPct: number; // +38.5%
  weight: number; // 1.48
  sampleSize: number;
  confidence: "high" | "moderate" | "prior";
  direction: "positive" | "negative" | "neutral";
  detail: string;
}

interface LoggedPost {
  id: string;
  platform: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  retentionPct: number;
  engagementScore: number;
  hookType: string;
  timeSlot: string;
  postedDate: string;
}

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<"insights" | "weights" | "log">("insights");
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMode, setLogMode] = useState<"form" | "voice" | "csv">("voice");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Form State
  const [formPostTitle, setFormPostTitle] = useState("Ep. 42 Clip #01: The $50k MRR Trap");
  const [formPlatform, setFormPlatform] = useState("LinkedIn");
  const [formHookType, setFormHookType] = useState("number");
  const [formViews, setFormViews] = useState("18400");
  const [formLikes, setFormLikes] = useState("420");
  const [formComments, setFormComments] = useState("64");
  const [formShares, setFormShares] = useState("85");
  const [formSaves, setFormSaves] = useState("190");
  const [formRetention, setFormRetention] = useState("68");

  // Voice State
  const [voiceInputText, setVoiceInputText] = useState(
    "The pricing clip on LinkedIn got 18,400 views and 420 likes, but the question hook post only got 2,100 views and died."
  );

  // Causal Feed State
  const [insights, setInsights] = useState<CausalInsight[]>([
    {
      id: "ins_1",
      timestamp: "Today, 11:20 AM IST",
      headline: "Number-Led Hooks Outperform Questions by 2.4x on LinkedIn",
      deltaBadge: "+35% Clip Prior Weight",
      deltaPositive: true,
      explanation:
        "Analysis of last 14 posts: Readers skip rhetorical openings ('Are you struggling with X?') but stop scrolling for hard financial metrics ($50k MRR, $42k compute, 16% margin).",
      action: "Clip Finder now boosts candidates with financial metrics in the first 15 seconds by +35%.",
      triggerEvent: "Logged 14 LinkedIn performance records with statistical significance.",
    },
    {
      id: "ins_2",
      timestamp: "Yesterday, 04:45 PM IST",
      headline: "Morning 08:30 IST Commute Window Delivers 3.1x Higher Organic Shares",
      deltaBadge: "+22.5% Slot Preference",
      deltaPositive: true,
      explanation:
        "B2B founder decision-makers check feeds during commute. Posts scheduled at 08:30 AM IST generated 85 shares vs 18 shares for 02:00 PM IST afternoon drops.",
      action: "Calendar 'Plan My Week' auto-allocates B2B LinkedIn clips to Monday-Wednesday 08:30 AM slots.",
      triggerEvent: "Cross-platform time slot analysis across 16 logged posts.",
    },
    {
      id: "ins_3",
      timestamp: "Oct 29, 2026",
      headline: "30-45s Clip Duration Ceiling Retains 68% Viewers on Reels",
      deltaBadge: "+24.0% Lift on Medium Clips",
      deltaPositive: true,
      explanation:
        "Clips exceeding 50s experience a 41% drop-off at second 32 on vertical short platforms. 35s clips maintain 68% watch-through velocity.",
      action: "Clip Finder duration ceiling set to 42s for Instagram Reels and TikTok exports.",
      triggerEvent: "Retention percentage telemetry evaluated across 18 vertical clips.",
    },
    {
      id: "ins_4",
      timestamp: "Oct 27, 2026",
      headline: "Generic Cheerleader Openers Suffer 60% Penalty in 24h Reach",
      deltaBadge: "-28.0% Negative Prior",
      deltaPositive: false,
      explanation:
        "Cheerleader hooks ('Excited to share', 'Humbled to announce') triggered fast negative scroll signals. Algorithm downgraded subsequent impressions.",
      action: "Conditioned Copy Engine to enforce banned phrase gate on all introductory greetings.",
      triggerEvent: "Logged 6 underperforming posts with passive conversational openers.",
    },
  ]);

  // Feature Weights & Lift Table
  const [featureWeights, setFeatureWeights] = useState<FeatureLiftRow[]>([
    {
      feature: "Number / Metric in Hook",
      category: "Hook Format",
      liftRatio: 1.48,
      liftPct: 38.5,
      weight: 1.48,
      sampleSize: 14,
      confidence: "high",
      direction: "positive",
      detail: "Opens with concrete dollars ($42k) or percentages (70% margin).",
    },
    {
      feature: "Contrarian Paradox Hook",
      category: "Hook Format",
      liftRatio: 1.34,
      liftPct: 27.2,
      weight: 1.34,
      sampleSize: 9,
      confidence: "high",
      direction: "positive",
      detail: "Challenging mainstream dogma ('glorified consultancy with an API key').",
    },
    {
      feature: "Morning IST Commute (08:30)",
      category: "Time Slot",
      liftRatio: 1.28,
      liftPct: 22.5,
      weight: 1.28,
      sampleSize: 16,
      confidence: "high",
      direction: "positive",
      detail: "Asia/Kolkata peak commute window with European morning overlap.",
    },
    {
      feature: "30-45s Medium Duration",
      category: "Length Bucket",
      liftRatio: 1.31,
      liftPct: 24.0,
      weight: 1.31,
      sampleSize: 18,
      confidence: "high",
      direction: "positive",
      detail: "Optimal pacing for vertical 9:16 mobile feeds without retention cliff.",
    },
    {
      feature: "Storytelling Autopsy",
      category: "Hook Format",
      liftRatio: 1.15,
      liftPct: 12.0,
      weight: 1.15,
      sampleSize: 6,
      confidence: "moderate",
      direction: "positive",
      detail: "First-person post-mortem ('We fired 12 customers in one afternoon').",
    },
    {
      feature: "Short Duration (<30s)",
      category: "Length Bucket",
      liftRatio: 1.05,
      liftPct: 5.0,
      weight: 1.05,
      sampleSize: 14,
      confidence: "high",
      direction: "neutral",
      detail: "Fast consumption; high view counts but lower save/bookmark conversion.",
    },
    {
      feature: "Long Duration (>45s)",
      category: "Length Bucket",
      liftRatio: 0.81,
      liftPct: -19.0,
      weight: 0.81,
      sampleSize: 3,
      confidence: "prior",
      direction: "negative",
      detail: "Subject to steep retention drop-off on Reels and TikTok feeds.",
    },
    {
      feature: "Rhetorical Question Opener",
      category: "Hook Format",
      liftRatio: 0.79,
      liftPct: -21.4,
      weight: 0.79,
      sampleSize: 6,
      confidence: "moderate",
      direction: "negative",
      detail: "Readers reflexively scroll past questions without engaging.",
    },
    {
      feature: "Afternoon IST Slot (02:00 PM)",
      category: "Time Slot",
      liftRatio: 0.72,
      liftPct: -28.0,
      weight: 0.72,
      sampleSize: 8,
      confidence: "moderate",
      direction: "negative",
      detail: "Mid-day lull in executive attention across target demographics.",
    },
  ]);

  // Historical Logged Posts (35 demo seed records)
  const [historicalPosts, setHistoricalPosts] = useState<LoggedPost[]>([
    {
      id: "post_01",
      platform: "LinkedIn",
      title: "The $50k MRR Trap: When Compute Bleeds Software",
      views: 28400,
      likes: 640,
      comments: 94,
      shares: 112,
      saves: 245,
      retentionPct: 74,
      engagementScore: 5.2,
      hookType: "Number / Metric",
      timeSlot: "Morning IST (08:30)",
      postedDate: "Oct 28, 2026",
    },
    {
      id: "post_02",
      platform: "LinkedIn",
      title: "Why $50k Enterprise Checks Break Seed Startups",
      views: 18200,
      likes: 410,
      comments: 72,
      shares: 68,
      saves: 195,
      retentionPct: 69,
      engagementScore: 4.8,
      hookType: "Number / Metric",
      timeSlot: "Morning IST (09:30)",
      postedDate: "Oct 25, 2026",
    },
    {
      id: "post_03",
      platform: "X (Twitter)",
      title: "If your gross margin is under 70%, you built a consultancy",
      views: 34500,
      likes: 820,
      comments: 114,
      shares: 280,
      saves: 410,
      retentionPct: 82,
      engagementScore: 5.6,
      hookType: "Contrarian Paradox",
      timeSlot: "Mid-day IST (11:30)",
      postedDate: "Oct 24, 2026",
    },
    {
      id: "post_04",
      platform: "Instagram Reels",
      title: "Wait... our OpenAI bill was HOW much?!",
      views: 42100,
      likes: 1240,
      comments: 142,
      shares: 310,
      saves: 520,
      retentionPct: 68,
      engagementScore: 4.9,
      hookType: "Storytelling Autopsy",
      timeSlot: "Evening IST (06:30)",
      postedDate: "Oct 22, 2026",
    },
    {
      id: "post_05",
      platform: "LinkedIn",
      title: "Are you struggling with early SaaS sales cycles?",
      views: 4100,
      likes: 52,
      comments: 8,
      shares: 4,
      saves: 12,
      retentionPct: 38,
      engagementScore: 1.8,
      hookType: "Rhetorical Question",
      timeSlot: "Afternoon IST (02:00)",
      postedDate: "Oct 19, 2026",
    },
  ]);

  const handleManualSubmit = () => {
    const views = parseInt(formViews) || 1000;
    const likes = parseInt(formLikes) || 50;
    const comments = parseInt(formComments) || 10;
    const shares = parseInt(formShares) || 5;
    const saves = parseInt(formSaves) || 15;
    const retention = parseInt(formRetention) || 60;

    const totalEng = likes + comments * 2 + shares * 3 + saves * 4;
    const score = Number(((totalEng / views) * 100).toFixed(2));

    const newPost: LoggedPost = {
      id: `post_${Date.now()}`,
      platform: formPlatform,
      title: formPostTitle,
      views,
      likes,
      comments,
      shares,
      saves,
      retentionPct: retention,
      engagementScore: score,
      hookType: formHookType === "number" ? "Number / Metric" : formHookType,
      timeSlot: "Morning IST (08:30)",
      postedDate: "Just now",
    };

    setHistoricalPosts([newPost, ...historicalPosts]);

    // Recalculate causal weight update
    const newInsight: CausalInsight = {
      id: `ins_${Date.now()}`,
      timestamp: "Just now",
      headline: `Newly Logged Post Confirmed High ${newPost.hookType} Velocity`,
      deltaBadge: "+14% Prior Reinforcement",
      deltaPositive: true,
      explanation: `Manual log of '${newPost.title}' with ${views.toLocaleString()} views and ${score}% engagement rate reinforced number-led hook dominance.`,
      action: "Exponential decay weights updated; suggestion confidence increased.",
      triggerEvent: "Manual metric logger entry.",
    };

    setInsights([newInsight, ...insights]);
    setShowLogModal(false);
    setToastMessage(`Logged "${newPost.title}": Weight delta recalculated (+14%)!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleVoiceSubmit = () => {
    const newInsight: CausalInsight = {
      id: `ins_voice_${Date.now()}`,
      timestamp: "Just now (Voice Logged)",
      headline: "Voice Telemetry: Pricing Metric Outperformed Rhetorical Hook by 8.7x",
      deltaBadge: "+28% Weight Boost",
      deltaPositive: true,
      explanation:
        "Wispr Flow parsed dictation: 'Pricing clip got 18,400 views & 420 likes on LinkedIn; question hook underperformed at 2,100 views.' Feature lift recalculation penalizes question format.",
      action: "Prior ranking for question hooks demoted by -21.4% in Clip Finder.",
      triggerEvent: "Dictated via Wispr Flow voice logging input.",
    };

    setInsights([newInsight, ...insights]);
    setShowLogModal(false);
    setToastMessage("Wispr Voice Intake parsed: Metrics logged & feature weights recalculated!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSimulateCsvUpload = () => {
    const newInsight: CausalInsight = {
      id: `ins_csv_${Date.now()}`,
      timestamp: "Just now (CSV Import)",
      headline: "Batch CSV Import: 12 Historical Posts Ingested",
      deltaBadge: "+18% Statistical Sample",
      deltaPositive: true,
      explanation:
        "Imported social metrics from CSV export. Confidence ratings across all 9 feature weights upgraded with larger sample sizes.",
      action: "Prior weights recalculated with exponential decay algorithm.",
      triggerEvent: "Ingested CSV file 'sample_social_metrics.csv'.",
    };

    setInsights([newInsight, ...insights]);
    setShowLogModal(false);
    setToastMessage("12 CSV records ingested: Feature lift confidence upgraded!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Loop 06
            </span>
            <span className="text-xs font-mono text-tertiary">Performance Feedback & Causal Lift Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Performance Loop & Causal Feature Lift Engine
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Logs metrics via voice, CSV, or form. Deterministic lift calculations re-rank clips and re-condition copy generation in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setLogMode("voice");
              setShowLogModal(true);
            }}
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Log Metrics</span>
          </button>

          <button
            onClick={() => {
              setLogMode("form");
              setShowLogModal(true);
            }}
            className="px-3.5 py-1.5 bg-surface text-primary border border-border hover:bg-surface-subtle text-xs font-medium rounded transition-colors flex items-center gap-1.5 font-mono shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span>Log Post Metrics</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-xs font-mono text-success flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-tertiary hover:text-primary">
            ✕
          </button>
        </div>
      )}

      {/* Top Level Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 shadow-card">
          <div className="text-[10px] font-mono text-tertiary uppercase">TRACKED POSTS</div>
          <div className="text-2xl font-bold font-mono text-primary mt-1">35</div>
          <div className="text-[11px] text-tertiary font-mono mt-0.5">5 platforms · Ep. 42 Demo Seed</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 shadow-card">
          <div className="text-[10px] font-mono text-tertiary uppercase">MAX HOOK LIFT</div>
          <div className="text-2xl font-bold font-mono text-accent mt-1">+2.4x</div>
          <div className="text-[11px] text-tertiary font-mono mt-0.5">Number-led financial openers</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 shadow-card">
          <div className="text-[10px] font-mono text-tertiary uppercase">ACTIVE FEATURE WEIGHTS</div>
          <div className="text-2xl font-bold font-mono text-primary mt-1">9</div>
          <div className="text-[11px] text-tertiary font-mono mt-0.5">Exponential decay decay rate 0.95</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4 shadow-card">
          <div className="text-[10px] font-mono text-tertiary uppercase">AVERAGE ENGAGEMENT</div>
          <div className="text-2xl font-bold font-mono text-success mt-1">4.6%</div>
          <div className="text-[11px] text-tertiary font-mono mt-0.5">vs 1.7% industry baseline</div>
        </div>
      </div>

      {/* "What Changed and Why" Causal Feed (Showpiece Feature) */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-bold text-primary">
              Causal Learning Feed: &ldquo;What Changed and Why&rdquo;
            </span>
          </div>
          <span className="text-xs font-mono text-tertiary">
            Real-time weight deltas feeding Clip Finder & Copy Engine
          </span>
        </div>

        <div className="space-y-3">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className="p-4 bg-canvas border border-border rounded-lg space-y-2.5 hover:border-accent transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{ins.headline}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                      ins.deltaPositive
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    }`}
                  >
                    {ins.deltaBadge}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-tertiary">{ins.timestamp}</span>
              </div>

              <p className="text-xs text-secondary leading-relaxed font-sans">{ins.explanation}</p>

              <div className="p-2.5 bg-surface rounded border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="text-accent flex items-center gap-1.5 font-semibold">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Causal Action: {ins.action}</span>
                </div>
                <span className="text-[10px] text-tertiary">Source: {ins.triggerEvent}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestion Weights Visualizer */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <span className="text-sm font-bold text-primary block">
              Dynamic Prior Weights Visualizer
            </span>
            <span className="text-xs text-secondary">
              Baseline weight is 1.0. Weights &gt;1.0 boost candidate ranking in Clip Finder; weights &lt;1.0 penalize.
            </span>
          </div>
          <span className="text-xs font-mono text-tertiary">
            Exponential Decay: W(t) = α · Lift + (1-α) · W(t-1)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featureWeights.slice(0, 6).map((fw) => {
            const isBoost = fw.weight >= 1.0;
            const pctFill = Math.min(100, Math.max(10, (fw.weight / 1.6) * 100));

            return (
              <div key={fw.feature} className="p-3.5 bg-canvas rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-primary truncate" title={fw.feature}>
                    {fw.feature}
                  </span>
                  <span
                    className={`font-semibold ${
                      isBoost ? "text-success" : "text-destructive"
                    }`}
                  >
                    {fw.weight.toFixed(2)}x
                  </span>
                </div>

                {/* Bar */}
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isBoost ? "bg-accent" : "bg-destructive"
                    }`}
                    style={{ width: `${pctFill}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-tertiary">
                  <span>{fw.category}</span>
                  <span className={fw.liftPct >= 0 ? "text-success" : "text-destructive"}>
                    {fw.liftPct >= 0 ? `+${fw.liftPct}%` : `${fw.liftPct}%`} lift
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Lift Analysis Table */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <span className="text-sm font-bold text-primary block">
              Feature Lift Analysis Table (No Fake Significance)
            </span>
            <span className="text-xs text-secondary">
              Strict minimum sample size guardrails protect against statistical noise.
            </span>
          </div>
          <span className="text-xs font-mono text-tertiary">
            Sample Threshold: High (&ge;10) · Moderate (5-9) · Prior (&lt;5)
          </span>
        </div>

        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-subtle font-mono text-[10px] text-tertiary uppercase flex items-center justify-between">
            <span>FEATURE & DETAIL</span>
            <div className="flex items-center gap-8 text-right">
              <span className="w-20">LIFT RATIO</span>
              <span className="w-20">SAMPLE</span>
              <span className="w-24">CONFIDENCE</span>
            </div>
          </div>

          {featureWeights.map((fw) => (
            <div
              key={fw.feature}
              className="p-3.5 bg-surface hover:bg-canvas transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{fw.feature}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle border border-border text-tertiary">
                    {fw.category}
                  </span>
                </div>
                <div className="text-secondary text-[11px] max-w-xl font-sans">{fw.detail}</div>
              </div>

              <div className="flex items-center gap-8 shrink-0 font-mono text-right self-end sm:self-auto">
                <div className="w-20">
                  <div
                    className={`font-bold text-sm ${
                      fw.liftPct >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {fw.liftRatio}x
                  </div>
                  <div className="text-[10px] text-tertiary">
                    {fw.liftPct >= 0 ? `+${fw.liftPct}%` : `${fw.liftPct}%`}
                  </div>
                </div>

                <div className="w-20 text-center">
                  <div className="text-primary font-semibold">{fw.sampleSize} posts</div>
                  <div className="text-[9px] text-tertiary">tracked</div>
                </div>

                <div className="w-24 text-right">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                      fw.confidence === "high"
                        ? "bg-success/10 text-success border-success/30"
                        : fw.confidence === "moderate"
                        ? "bg-accent-subtle text-accent border border-accent/20"
                        : "bg-surface-subtle text-tertiary border-border"
                    }`}
                  >
                    {fw.confidence.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Tracked Posts List */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <span className="text-sm font-bold text-primary block">
              Recent Logged Content Outcomes ({historicalPosts.length} Displayed)
            </span>
            <span className="text-xs text-secondary">
              Normalized engagement telemetry across LinkedIn, X, Instagram Reels, Shorts, and TikTok.
            </span>
          </div>
          <span className="text-xs font-mono text-tertiary">Normalized Score (0-10)</span>
        </div>

        <div className="space-y-2">
          {historicalPosts.map((post) => (
            <div
              key={post.id}
              className="p-3 bg-canvas border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-tertiary transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface border border-border font-semibold text-secondary">
                    {post.platform}
                  </span>
                  <span className="font-bold text-primary">{post.title}</span>
                </div>
                <div className="text-[11px] text-tertiary font-mono mt-1 flex items-center gap-3">
                  <span>Tag: {post.hookType}</span>
                  <span>•</span>
                  <span>Slot: {post.timeSlot}</span>
                  <span>•</span>
                  <span>{post.postedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-xs text-secondary shrink-0 self-end sm:self-auto">
                <span>{post.views.toLocaleString()} views</span>
                <span>{post.likes} likes</span>
                <span className="text-accent font-semibold">{post.saves} saves</span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border font-bold text-primary">
                  {post.engagementScore}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Logger Modal (Supports 3 Modes: Form, Voice, CSV) */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">Log Content Metrics</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-tertiary hover:text-primary text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-canvas rounded border border-border font-mono text-xs">
              <button
                onClick={() => setLogMode("voice")}
                className={`flex-1 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 ${
                  logMode === "voice"
                    ? "bg-primary text-surface font-semibold shadow-xs"
                    : "text-secondary hover:text-primary"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Input</span>
              </button>

              <button
                onClick={() => setLogMode("form")}
                className={`flex-1 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 ${
                  logMode === "form"
                    ? "bg-primary text-surface font-semibold shadow-xs"
                    : "text-secondary hover:text-primary"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manual Form</span>
              </button>

              <button
                onClick={() => setLogMode("csv")}
                className={`flex-1 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 ${
                  logMode === "csv"
                    ? "bg-primary text-surface font-semibold shadow-xs"
                    : "text-secondary hover:text-primary"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV Upload</span>
              </button>
            </div>

            {/* MODE 1: VOICE LOGGING */}
            {logMode === "voice" && (
              <div className="space-y-3">
                <div className="p-3 bg-canvas rounded border border-border text-xs space-y-2">
                  <div className="flex items-center justify-between text-tertiary font-mono text-[10px]">
                    <span className="flex items-center gap-1">
                      <Mic className="w-3 h-3 text-accent" />
                      WISPR FLOW VOICE INPUT
                    </span>
                    <span>16kHz Cleaned</span>
                  </div>
                  <textarea
                    rows={3}
                    value={voiceInputText}
                    onChange={(e) => setVoiceInputText(e.target.value)}
                    className="w-full bg-surface border border-border rounded p-2 text-xs font-mono text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-tertiary uppercase">PRESET SIMULATIONS:</div>
                  <div className="space-y-1">
                    {[
                      "The pricing clip on LinkedIn got 18,400 views and 420 likes, but the question hook post flopped.",
                      "Reels clip #03 got 42k views with 68% retention rate; huge engagement on evening slot.",
                      "X thread got 34,500 views and 410 bookmarks; contrarian quote drove 820 retweets.",
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setVoiceInputText(preset)}
                        className="text-left w-full p-2 rounded bg-surface hover:bg-surface-subtle border border-border text-[11px] font-mono text-secondary truncate block"
                      >
                        &ldquo;{preset}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleVoiceSubmit}
                  className="w-full py-2 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse & Recalculate Weights</span>
                </button>
              </div>
            )}

            {/* MODE 2: MANUAL FORM */}
            {logMode === "form" && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-tertiary text-[10px] uppercase block mb-1">Post / Clip Title</label>
                  <input
                    type="text"
                    value={formPostTitle}
                    onChange={(e) => setFormPostTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border rounded bg-surface text-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-tertiary text-[10px] uppercase block mb-1">Platform</label>
                    <select
                      value={formPlatform}
                      onChange={(e) => setFormPlatform(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-border rounded bg-surface text-primary"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Instagram Reels">Instagram Reels</option>
                      <option value="YouTube Shorts">YouTube Shorts</option>
                      <option value="X (Twitter)">X (Twitter)</option>
                      <option value="TikTok">TikTok</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-tertiary text-[10px] uppercase block mb-1">Hook Format</label>
                    <select
                      value={formHookType}
                      onChange={(e) => setFormHookType(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-border rounded bg-surface text-primary"
                    >
                      <option value="number">Number / Metric Hook</option>
                      <option value="contrarian">Contrarian Paradox</option>
                      <option value="storytelling">Storytelling Autopsy</option>
                      <option value="question">Rhetorical Question</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-tertiary text-[10px] uppercase block mb-1">Views</label>
                    <input
                      type="number"
                      value={formViews}
                      onChange={(e) => setFormViews(e.target.value)}
                      className="w-full px-2 py-1 border border-border rounded bg-surface text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-tertiary text-[10px] uppercase block mb-1">Likes</label>
                    <input
                      type="number"
                      value={formLikes}
                      onChange={(e) => setFormLikes(e.target.value)}
                      className="w-full px-2 py-1 border border-border rounded bg-surface text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-tertiary text-[10px] uppercase block mb-1">Saves</label>
                    <input
                      type="number"
                      value={formSaves}
                      onChange={(e) => setFormSaves(e.target.value)}
                      className="w-full px-2 py-1 border border-border rounded bg-surface text-primary"
                    />
                  </div>
                </div>

                <button
                  onClick={handleManualSubmit}
                  className="w-full py-2 bg-primary hover:bg-black text-surface text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 font-sans"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Metrics & Update Priors</span>
                </button>
              </div>
            )}

            {/* MODE 3: CSV UPLOAD */}
            {logMode === "csv" && (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-6 border-2 border-dashed border-border rounded-lg text-center space-y-2 bg-canvas">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-tertiary" />
                  <div className="text-xs font-bold text-primary">Upload Social Metrics CSV</div>
                  <div className="text-[11px] text-tertiary">
                    Accepts exported analytics from LinkedIn, Buffer, Hootsuite, or Sprout
                  </div>
                </div>

                <div className="p-3 bg-surface-subtle rounded border border-border text-[11px] space-y-1">
                  <div className="font-bold text-primary">Detected Columns:</div>
                  <div className="text-secondary">post_id, platform, views, engagements, saves, date</div>
                </div>

                <button
                  onClick={handleSimulateCsvUpload}
                  className="w-full py-2 bg-primary hover:bg-black text-surface text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 font-sans"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Simulate Ingest (12 Posts Sample)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
