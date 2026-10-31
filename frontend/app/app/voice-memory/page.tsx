"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Check,
  Sparkles,
  ArrowRight,
  Pin,
  Trash2,
  Sliders,
  History,
  FileDiff,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Volume2,
  ChevronDown,
  Layers,
} from "lucide-react";
import { InlineDiff } from "@/components/memory/diff-viewer";

interface DiffSegment {
  type: "added" | "removed" | "unchanged";
  text: string;
}

interface RuleItem {
  id: string;
  name: string;
  category: "opening_hooks" | "formatting" | "perspective" | "syntax" | "vocabulary" | "closing_cta";
  categoryLabel: string;
  confidence: number;
  editCount: number;
  isPinned: boolean;
  isActive: boolean;
  sourceClip: string;
  citation: string;
  diffSegments: DiffSegment[];
  rawBefore: string;
  rawAfter: string;
  ruleExplanation: string;
}

export default function VoiceMemoryPage() {
  const [activeVersion, setActiveVersion] = useState<"v1" | "v2" | "v3" | "v4">("v4");
  const [showBeforeAfter, setShowBeforeAfter] = useState(true);
  const [comparisonClipIdx, setComparisonClipIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleText, setNewRuleText] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState<RuleItem["category"]>("opening_hooks");

  // Tone Sliders State
  const [formality, setFormality] = useState(18); // 18 = Casual/Direct (82%)
  const [boldness, setBoldness] = useState(88); // 88 = Bold/Contrarian
  const [density, setDensity] = useState(90); // 90 = High Density

  // Signature phrases & banned words
  const [signaturePhrases, setSignaturePhrases] = useState([
    "radar not a megaphone",
    "burned $42k in 30 days",
    "fired 12 customers in one afternoon",
    "subsidized distribution leak",
    "compliance shield",
  ]);
  const [newPhrase, setNewPhrase] = useState("");

  const [bannedWords, setBannedWords] = useState([
    "delve into",
    "game-changer",
    "synergies",
    "in today's fast-paced world",
    "supercharge",
    "excited to announce",
  ]);
  const [newBanned, setNewBanned] = useState("");

  const [rules, setRules] = useState<RuleItem[]>([
    {
      id: "vrule_1",
      name: "Drop throat-clearing openings. Lead with exact dollar figures or shocking unit metrics.",
      category: "opening_hooks",
      categoryLabel: "Opening Hooks",
      confidence: 0.98,
      editCount: 9,
      isPinned: true,
      isActive: true,
      sourceClip: "Ep. 42 Clip #01 — LinkedIn",
      citation: "Extracted after creator deleted rhetorical intro and replaced with $42,000 compute statistic",
      diffSegments: [
        { type: "removed", text: "🚀 In today's fast-paced tech world, it's no secret that scaling software has challenges! 💡" },
        { type: "unchanged", text: " " },
        { type: "added", text: "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on personal credit cards." },
      ],
      rawBefore: "🚀 In today's fast-paced tech world, it's no secret that scaling software has challenges! 💡",
      rawAfter: "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on personal credit cards.",
      ruleExplanation: "Creator consistently strikes introductory pleasantries and opens on financial loss mechanics.",
    },
    {
      id: "vrule_2",
      name: "Zero emojis in the first 3 lines of LinkedIn posts. Maximum 1 bookmark or arrow at footer.",
      category: "formatting",
      categoryLabel: "Formatting",
      confidence: 0.95,
      editCount: 7,
      isPinned: true,
      isActive: true,
      sourceClip: "Ep. 42 Clip #01 — LinkedIn",
      citation: "Diff inspection: 4 emojis stripped across 3 consecutive post edits",
      diffSegments: [
        { type: "unchanged", text: "3 rules for gross margins:\n1. Share the failure first " },
        { type: "removed", text: "🔥" },
        { type: "unchanged", text: "\n2. Audit token churn " },
        { type: "removed", text: "💡" },
        { type: "unchanged", text: "\n3. Fire unprofitable pilot tiers " },
        { type: "removed", text: "🚀" },
      ],
      rawBefore: "3 rules for gross margins:\n1. Share the failure first 🔥\n2. Audit token churn 💡\n3. Fire unprofitable pilot tiers 🚀",
      rawAfter: "3 rules for gross margins:\n1. Share the failure first\n2. Audit token churn\n3. Fire unprofitable pilot tiers",
      ruleExplanation: "High-density editorial tone demands zero decorative cartoon emojis in the hook and body text.",
    },
    {
      id: "vrule_3",
      name: "Convert passive corporate generalities into first-person founder war stories.",
      category: "perspective",
      categoryLabel: "Perspective",
      confidence: 0.94,
      editCount: 6,
      isPinned: false,
      isActive: true,
      sourceClip: "Ep. 42 Clip #04 — LinkedIn",
      citation: "Replaced third-person guidance with visceral personal operator account",
      diffSegments: [
        { type: "removed", text: "When evaluating early-stage customer alignment, founders should occasionally consider pruning accounts that demand excessive custom work." },
        { type: "unchanged", text: " " },
        { type: "added", text: "We fired 12 customers in one afternoon. Our team wept. Three months later, ACV jumped from $80 to $14,000." },
      ],
      rawBefore: "When evaluating early-stage customer alignment, founders should occasionally consider pruning accounts that demand excessive custom work.",
      rawAfter: "We fired 12 customers in one afternoon. Our team wept. Three months later, ACV jumped from $80 to $14,000.",
      ruleExplanation: "Personal accountability and explicit stakeholder emotional tension perform 2.8x better than advice.",
    },
    {
      id: "vrule_4",
      name: "On X (Twitter), enforce single-sentence punches under 16 words with blank line breaks.",
      category: "syntax",
      categoryLabel: "Syntax & Pacing",
      confidence: 0.96,
      editCount: 11,
      isPinned: true,
      isActive: true,
      sourceClip: "Ep. 42 Clip #02 — X Post",
      citation: "Creator restructured paragraph block into 2 crisp assertions",
      diffSegments: [
        { type: "removed", text: "Are you excited about generative AI? Many software startups are discovering that gross margin health is super critical to long-term viability." },
        { type: "unchanged", text: " " },
        { type: "added", text: "If your gross margin is under 70%, you didn't build software.\n\nYou built a glorified consultancy with an API key." },
      ],
      rawBefore: "Are you excited about generative AI? Many software startups are discovering that gross margin health is super critical to long-term viability.",
      rawAfter: "If your gross margin is under 70%, you didn't build software.\n\nYou built a glorified consultancy with an API key.",
      ruleExplanation: "Prevents conversational drifting. Forces every sentence to deliver a standalone high-conviction punch.",
    },
    {
      id: "vrule_5",
      name: "Replace corporate buzzwords ('game-changer', 'synergy') with operational mechanics ('gross margins', 'churn decay').",
      category: "vocabulary",
      categoryLabel: "Vocabulary",
      confidence: 0.92,
      editCount: 8,
      isPinned: false,
      isActive: true,
      sourceClip: "Ep. 42 Clip #05 — LinkedIn",
      citation: "Automatic lexical filter triggered by repeated replacement of buzzword list",
      diffSegments: [
        { type: "unchanged", text: "How we leveraged " },
        { type: "removed", text: "game-changing enterprise workflows to unlock synergies" },
        { type: "added", text: "audited unit margins to cut server churn by 64%" },
        { type: "unchanged", text: " without hiring more SDRs." },
      ],
      rawBefore: "How we leveraged game-changing enterprise workflows to unlock synergies without hiring more SDRs.",
      rawAfter: "How we audited unit margins to cut server churn by 64% without hiring more SDRs.",
      ruleExplanation: "Replaces empty marketing puffery with concrete, auditable enterprise engineering reality.",
    },
    {
      id: "vrule_6",
      name: "End posts with an open, high-stakes debate question rather than passive engagement bait.",
      category: "closing_cta",
      categoryLabel: "Closing CTA",
      confidence: 0.97,
      editCount: 5,
      isPinned: false,
      isActive: true,
      sourceClip: "Ep. 42 Clip #03 — LinkedIn",
      citation: "Deleted generic 'Thoughts? Agree?' and replaced with actionable threshold question",
      diffSegments: [
        { type: "unchanged", text: "Never charge per token. Value-based pricing wins. " },
        { type: "removed", text: "Do you agree? Let me know your thoughts in the comments below! 👇" },
        { type: "added", text: "Disagree? What is your gross margin floor before deploying an agent workflow?" },
      ],
      rawBefore: "Never charge per token. Value-based pricing wins. Do you agree? Let me know your thoughts in the comments below! 👇",
      rawAfter: "Never charge per token. Value-based pricing wins. Disagree? What is your gross margin floor before deploying an agent workflow?",
      ruleExplanation: "Passive 'thoughts?' invites spam comments. High-stakes boundary prompts invite genuine executive discussion.",
    },
  ]);

  const comparisonClips = [
    {
      clipId: "clip_01",
      title: "The $50k MRR Trap: When Growth Kills",
      timestamp: "04:12 - 05:08 (56s)",
      off: {
        title: "MEMORY OFF (DEFAULT AI SLOP)",
        matchScore: 58,
        badgeColor: "text-destructive border-destructive/30 bg-destructive/5",
        text: `🚀 Exciting news for startup founders! In today's fast-paced world, it's no secret that building an AI business has its ups and downs! 💡

In this super insightful episode of The Founder Files, we delve into how you can leverage compute optimizations to supercharge your workflow and unlock massive synergies! 🔥

Remember: Every hurdle is a stepping stone to greatness! 🌟

Drop your thoughts below! Agree? 👇✨ #Startups #Motivation #AI`,
        violations: [
          "Banned opening throat-clearing ('In today's fast-paced world')",
          "6 decorative emojis in hook and body (Rule #2 violation)",
          "Banned buzzwords: 'delve into', 'leverage', 'supercharge', 'synergies'",
          "Cheerleader platitudes with zero dollar figures or unit economics",
          "Passive engagement bait CTA ('Drop your thoughts below!')",
        ],
      },
      on: {
        title: "MEMORY ON (THECONTENTCOMPANY V4 PROFILE)",
        matchScore: 98,
        badgeColor: "text-success border-success/30 bg-success/5",
        text: `At $50k MRR, our compute bill was $42,000. 

We were effectively subsidizing Fortune 500 enterprise pilots on our personal credit cards.

Here is what happened on our path to $4M ARR:
1. Early traction disguised fatal unit economics.
2. We celebrated top-line subscriber growth while server costs compounded at 3x revenue.
3. We fired 12 pilot accounts that refused value-based pricing.

If scaling your user base scales your server losses, you haven't found product-market fit. You found a subsidized distribution leak.

Disagree? What is your gross margin floor before shipping an AI workflow?`,
        adhered: [
          "Lead immediately with concrete metrics ($50k MRR vs $42,000 compute)",
          "Zero emojis in opening lines; high-density editorial pacing",
          "100% buzzword-free; grounded in gross margins and customer autopsies",
          "Enforced single-sentence punch line-breaks for mobile readability",
          "High-stakes operator debate CTA with zero cheerleading",
        ],
      },
    },
    {
      clipId: "clip_02",
      title: "Why Gross Margins Under 70% Kill Software Valuations",
      timestamp: "12:45 - 13:30 (45s)",
      off: {
        title: "MEMORY OFF (DEFAULT AI SLOP)",
        matchScore: 62,
        badgeColor: "text-destructive border-destructive/30 bg-destructive/5",
        text: `Are you navigating the complex world of SaaS profitability? 🤖 Check out this incredible quote from Marcus Vance about why gross margins are a total game-changer for AI companies! 🚀

Make sure to bookmark this and share it with your entrepreneurial network! 📌 #SaaS #Finance #GrowthHacking`,
        violations: [
          "Rhetorical question opener ('Are you navigating...?')",
          "Forbidden buzzword 'game-changer'",
          "Passive promotional framing instead of authoritative thesis",
          "Generic hashtags (#GrowthHacking)",
        ],
      },
      on: {
        title: "MEMORY ON (THECONTENTCOMPANY V4 PROFILE)",
        matchScore: 96,
        badgeColor: "text-success border-success/30 bg-success/5",
        text: `If your gross margin is under 70%, you didn't build software.

You built a glorified consultancy with an API key.

When we stopped charging per token and transitioned to $5,000 per closed compliance audit:
• Gross margin jumped from 16% to 81% in 60 days
• Enterprise pilot conversion doubled
• Customer support tickets dropped 40%

Stop giving away compute at cost. What is your current gross margin?`,
        adhered: [
          "Sharp contrarian paradox hook ('glorified consultancy with API key')",
          "Concrete quantitative transformation (+16% to 81% margin, $5k audit)",
          "Monospace-friendly bullets with zero decorative emojis",
          "Direct debate prompt at footer",
        ],
      },
    },
  ];

  const currentComparison = comparisonClips[comparisonClipIdx];

  const toggleRuleActive = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const toggleRulePin = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isPinned: !r.isPinned } : r))
    );
  };

  const deleteRule = (ruleId: string) => {
    if (confirm("Delete this learned rule from the voice memory prompt pipeline?")) {
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    }
  };

  const handleAddSignaturePhrase = () => {
    if (newPhrase.trim() && !signaturePhrases.includes(newPhrase.trim())) {
      setSignaturePhrases([...signaturePhrases, newPhrase.trim()]);
      setNewPhrase("");
    }
  };

  const removeSignaturePhrase = (phrase: string) => {
    setSignaturePhrases(signaturePhrases.filter((p) => p !== phrase));
  };

  const handleAddBannedWord = () => {
    if (newBanned.trim() && !bannedWords.includes(newBanned.trim())) {
      setBannedWords([...bannedWords, newBanned.trim().toLowerCase()]);
      setNewBanned("");
    }
  };

  const removeBannedWord = (word: string) => {
    setBannedWords(bannedWords.filter((w) => w !== word));
  };

  const handleCreateRule = () => {
    if (!newRuleText.trim()) return;
    const newRule: RuleItem = {
      id: `vrule_${Date.now()}`,
      name: newRuleText.trim(),
      category: newRuleCategory,
      categoryLabel: newRuleCategory.replace("_", " ").toUpperCase(),
      confidence: 0.95,
      editCount: 1,
      isPinned: false,
      isActive: true,
      sourceClip: "Creator Manual Rule (v4 Prompt Pipeline)",
      citation: "Manually registered rule with high priority prompt injection",
      diffSegments: [
        { type: "added", text: newRuleText.trim() },
      ],
      rawBefore: "(Unconstrained AI output)",
      rawAfter: newRuleText.trim(),
      ruleExplanation: "Explicitly defined by creator to enforce continuous consistency.",
    };
    setRules([newRule, ...rules]);
    setNewRuleText("");
    setShowAddRuleModal(false);
  };

  const filteredRules = rules.filter((rule) => {
    const matchesCategory = selectedCategory === "all" || rule.category === selectedCategory;
    const matchesQuery =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.citation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.sourceClip.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const sortedRules = [...filteredRules].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.confidence - a.confidence;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20">
              Memory 04
            </span>
            <span className="text-xs font-mono text-tertiary">Brand Voice Memory · Continuous Learning Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">
            Diff-Based Voice Memory & Style Invariant Engine
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Learns immutable tone guidelines and banned idioms by extracting word-level diffs from creator edits. Closes the creative feedback loop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBeforeAfter(!showBeforeAfter)}
            className="px-3.5 py-1.5 bg-surface text-primary border border-border hover:bg-surface-subtle text-xs font-medium rounded transition-colors flex items-center gap-1.5 font-mono shadow-sm"
          >
            <FileDiff className="w-3.5 h-3.5 text-accent" />
            <span>{showBeforeAfter ? "Hide A/B Verification" : "Compare Memory ON vs OFF"}</span>
          </button>

          <button
            onClick={() => setShowAddRuleModal(true)}
            className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Before / After Demo Banner (Memory ON vs OFF Showpiece) */}
      {showBeforeAfter && (
        <div className="bg-surface border border-accent/30 rounded-lg p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-bold text-primary">
                A/B Demonstration: Same Transcript with Voice Memory OFF vs ON
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-tertiary">Select Demonstration Clip:</span>
              <div className="flex items-center gap-1 font-mono text-xs">
                {comparisonClips.map((clip, idx) => (
                  <button
                    key={clip.clipId}
                    onClick={() => setComparisonClipIdx(idx)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors border ${
                      comparisonClipIdx === idx
                        ? "bg-primary text-surface font-semibold border-primary"
                        : "bg-canvas text-secondary hover:text-primary border-border"
                    }`}
                  >
                    Clip #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-tertiary flex items-center justify-between">
            <span>Evaluating: <strong className="text-primary font-sans">{currentComparison.title}</strong></span>
            <span>Duration: {currentComparison.timestamp}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Memory OFF */}
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-destructive/20">
                  <span className="text-destructive font-bold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    MEMORY OFF (GENERIC AI)
                  </span>
                  <span className="text-destructive font-semibold px-2 py-0.5 rounded bg-destructive/10 border border-destructive/20">
                    Voice Match: {currentComparison.off.matchScore}%
                  </span>
                </div>

                <div className="mt-3 p-3 bg-surface rounded border border-destructive/20 text-xs text-secondary leading-relaxed font-sans whitespace-pre-wrap">
                  {currentComparison.off.text}
                </div>
              </div>

              <div className="pt-3 border-t border-destructive/20 space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-destructive uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Violations Detected (Failed Profile Check):
                </div>
                <ul className="space-y-1">
                  {currentComparison.off.violations.map((v, i) => (
                    <li key={i} className="text-[11px] text-destructive/90 flex items-start gap-1.5 font-sans">
                      <span className="text-destructive font-bold shrink-0">•</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Memory ON */}
            <div className="p-4 rounded-lg border border-success/40 bg-success/5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-success/30">
                  <span className="text-success font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    MEMORY ON (THECONTENTCOMPANY V4 PROFILE)
                  </span>
                  <span className="text-success font-bold px-2 py-0.5 rounded bg-success/15 border border-success/30">
                    Voice Match: {currentComparison.on.matchScore}%
                  </span>
                </div>

                <div className="mt-3 p-3 bg-surface rounded border border-success/30 text-xs text-primary leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {currentComparison.on.text}
                </div>
              </div>

              <div className="pt-3 border-t border-success/30 space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-success uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Prompt Invariants Adhered To (6/6 Active Rules):
                </div>
                <ul className="space-y-1">
                  {currentComparison.on.adhered.map((a, i) => (
                    <li key={i} className="text-[11px] text-secondary flex items-start gap-1.5 font-sans">
                      <span className="text-success font-bold shrink-0">✓</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Profile v4 Summary & Tone Sliders */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-primary">Founder Voice Profile</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent-subtle text-accent font-semibold border border-accent/20">
                Active: Version 4
              </span>
              <span className="text-xs font-mono text-tertiary">12 Edits Analyzed</span>
            </div>
            <p className="text-xs text-secondary mt-1">
              Sharp, metric-driven founder voice. Zero corporate throat-clearing, anti-buzzword, loss-framed unit economics.
            </p>
          </div>

          {/* Version timeline */}
          <div className="flex items-center gap-1 text-xs font-mono self-start sm:self-auto bg-canvas p-1 rounded border border-border">
            {[
              { id: "v1", label: "v1 (Cold Start)", notes: "Bootstrapped from Scrapling social scrape" },
              { id: "v2", label: "v2 (+2 edits)", notes: "Suppressed introductory emojis" },
              { id: "v3", label: "v3 (+5 edits)", notes: "Banned 'delve into' and 'leverage'" },
              { id: "v4", label: "v4 (Current)", notes: "Enforced $ metric openers & high-stakes debate CTA" },
            ].map((ver) => (
              <button
                key={ver.id}
                onClick={() => setActiveVersion(ver.id as any)}
                title={ver.notes}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  activeVersion === ver.id
                    ? "bg-primary text-surface font-semibold shadow-sm"
                    : "text-secondary hover:text-primary hover:bg-surface-subtle"
                }`}
              >
                {ver.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone Sliders (Interactive) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
              Continuous Tone Controllers (Prompt Conditioners)
            </span>
            <span className="text-[11px] font-mono text-tertiary">
              Adjust to shift generation weights across all 5 platforms
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Slider 1: Formal vs Casual */}
            <div className="p-3.5 bg-canvas rounded-lg border border-border space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-tertiary">FORMAL</span>
                <span className="font-bold text-primary">
                  {formality < 50 ? `CASUAL / DIRECT (${100 - formality}%)` : `FORMAL (${formality}%)`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formality}
                onChange={(e) => setFormality(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-border rounded-lg cursor-pointer"
              />
              <div className="text-[10px] text-tertiary font-mono flex justify-between">
                <span>0% Corporate Memo</span>
                <span>100% Raw Founder Dictation</span>
              </div>
            </div>

            {/* Slider 2: Measured vs Bold */}
            <div className="p-3.5 bg-canvas rounded-lg border border-border space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-tertiary">MEASURED</span>
                <span className="font-bold text-primary">CONTRARIAN / BOLD ({boldness}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={boldness}
                onChange={(e) => setBoldness(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-border rounded-lg cursor-pointer"
              />
              <div className="text-[10px] text-tertiary font-mono flex justify-between">
                <span>0% Diplomatic Consensus</span>
                <span>100% Polarizing Paradox</span>
              </div>
            </div>

            {/* Slider 3: Concise vs Dense */}
            <div className="p-3.5 bg-canvas rounded-lg border border-border space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-tertiary">EXPANSIVE</span>
                <span className="font-bold text-primary">HIGH DENSITY ({density}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={density}
                onChange={(e) => setDensity(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-border rounded-lg cursor-pointer"
              />
              <div className="text-[10px] text-tertiary font-mono flex justify-between">
                <span>0% Story Fluff</span>
                <span>100% Metric-per-Line</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Phrases & Banned Words Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border">
          {/* Signature Phrases */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-tertiary">
                Signature Lexical Anchors ({signaturePhrases.length})
              </span>
              <span className="text-[10px] font-mono text-tertiary">Included in prompt exemplars</span>
            </div>
            <div className="p-3 bg-canvas rounded-lg border border-border min-h-[90px] flex flex-wrap gap-1.5 items-center">
              {signaturePhrases.map((phrase) => (
                <span
                  key={phrase}
                  className="px-2 py-1 rounded bg-surface border border-border text-xs text-primary font-mono flex items-center gap-1.5 shadow-2xs"
                >
                  <span>&ldquo;{phrase}&rdquo;</span>
                  <button
                    onClick={() => removeSignaturePhrase(phrase)}
                    className="text-tertiary hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 mt-1 w-full">
                <input
                  type="text"
                  placeholder="Add signature phrase..."
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSignaturePhrase()}
                  className="flex-1 px-2.5 py-1 text-xs border border-border rounded bg-surface font-mono focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleAddSignaturePhrase}
                  className="px-2.5 py-1 text-xs bg-surface border border-border hover:bg-surface-subtle text-primary rounded font-mono"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Banned Words / Idioms */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-destructive">
                Banned Corporate Slop ({bannedWords.length})
              </span>
              <span className="text-[10px] font-mono text-destructive/80">Strict regex rejection gate</span>
            </div>
            <div className="p-3 bg-canvas rounded-lg border border-destructive/20 min-h-[90px] flex flex-wrap gap-1.5 items-center">
              {bannedWords.map((word) => (
                <span
                  key={word}
                  className="px-2 py-1 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono flex items-center gap-1.5 line-through"
                >
                  <span>{word}</span>
                  <button
                    onClick={() => removeBannedWord(word)}
                    className="text-destructive/60 hover:text-destructive no-underline transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 mt-1 w-full">
                <input
                  type="text"
                  placeholder="Add banned buzzword..."
                  value={newBanned}
                  onChange={(e) => setNewBanned(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddBannedWord()}
                  className="flex-1 px-2.5 py-1 text-xs border border-destructive/30 rounded bg-surface font-mono focus:outline-none focus:border-destructive text-destructive"
                />
                <button
                  onClick={handleAddBannedWord}
                  className="px-2.5 py-1 text-xs bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 text-destructive rounded font-mono"
                >
                  Ban
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules with Evidence Diffs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-primary flex items-center gap-2">
              <span>Learned Style Rules & Diff Citations</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border text-tertiary">
                {rules.length} active invariants
              </span>
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Each rule is backed by verifiable red/green editor diff citations. Toggle or pin rules directly.
            </p>
          </div>

          {/* Filter & Category Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "All Rules" },
              { id: "opening_hooks", label: "Hooks" },
              { id: "formatting", label: "Formatting" },
              { id: "perspective", label: "Perspective" },
              { id: "syntax", label: "Syntax" },
              { id: "vocabulary", label: "Vocabulary" },
              { id: "closing_cta", label: "CTA" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-surface font-semibold"
                    : "bg-surface text-secondary hover:text-primary border border-border"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 gap-4">
          {sortedRules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-surface border rounded-lg p-5 shadow-card transition-all ${
                rule.isActive ? "border-border" : "border-border/60 opacity-60"
              } ${rule.isPinned ? "ring-1 ring-accent/30" : ""}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-tertiary font-semibold">
                      {rule.categoryLabel}
                    </span>
                    <span className="text-xs font-mono text-tertiary">
                      Trigger: {rule.sourceClip}
                    </span>
                    {rule.isPinned && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-subtle text-accent border border-accent/20 font-bold flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5" /> PINNED
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-primary leading-snug">
                    {rule.name}
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed font-sans">
                    {rule.ruleExplanation}
                  </p>
                </div>

                {/* Meter & Controls */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto font-mono text-xs">
                  {/* Confidence meter */}
                  <div className="text-right">
                    <div className="text-[10px] text-tertiary uppercase">CONFIDENCE</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${rule.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-accent">
                        {(rule.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <span className="text-tertiary text-[11px]">
                    ({rule.editCount} edits)
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pl-2 border-l border-border">
                    <button
                      onClick={() => toggleRulePin(rule.id)}
                      title={rule.isPinned ? "Unpin rule" : "Pin rule to top"}
                      className={`p-1.5 rounded transition-colors ${
                        rule.isPinned
                          ? "bg-accent-subtle text-accent border border-accent/20"
                          : "text-tertiary hover:text-primary hover:bg-surface-subtle"
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleRuleActive(rule.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors border ${
                        rule.isActive
                          ? "bg-success/10 text-success border-success/30 hover:bg-success/20"
                          : "bg-surface text-tertiary border-border hover:text-primary"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Paused"}
                    </button>

                    <button
                      onClick={() => deleteRule(rule.id)}
                      title="Delete rule"
                      className="p-1.5 rounded text-tertiary hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Exact Red/Green Inline Diff Citation */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-tertiary flex items-center gap-1 font-semibold">
                    <FileDiff className="w-3 h-3 text-accent" />
                    INLINE CREATOR EDIT DIFF CITATION:
                  </span>
                  <span className="text-secondary">{rule.citation}</span>
                </div>

                <div className="p-3.5 bg-canvas rounded-lg border border-border">
                  <InlineDiff segments={rule.diffSegments} />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-tertiary pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-destructive/30" /> Red strikethrough: Discarded AI phrasing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-success/30" /> Green highlight: Creator-injected operator invariant
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">Add Voice Memory Rule</h3>
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="text-tertiary hover:text-primary text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-tertiary uppercase block mb-1">
                  Category
                </label>
                <select
                  value={newRuleCategory}
                  onChange={(e) => setNewRuleCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-border rounded bg-surface text-primary font-mono focus:outline-none focus:border-accent"
                >
                  <option value="opening_hooks">Opening Hooks</option>
                  <option value="formatting">Formatting</option>
                  <option value="perspective">Perspective</option>
                  <option value="syntax">Syntax & Pacing</option>
                  <option value="vocabulary">Vocabulary</option>
                  <option value="closing_cta">Closing CTA</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-tertiary uppercase block mb-1">
                  Rule Specification
                </label>
                <textarea
                  rows={3}
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                  placeholder="e.g. Always state the exact dollar figure before explaining the engineering cause."
                  className="w-full px-3 py-2 text-xs border border-border rounded bg-surface text-primary font-mono focus:outline-none focus:border-accent leading-relaxed"
                />
              </div>

              <div className="p-3 bg-canvas rounded border border-border text-[11px] text-tertiary font-mono space-y-1">
                <div className="font-semibold text-primary">Prompt Pipeline Impact:</div>
                <div>This rule will be injected into all future LLM platform variant prompts with 0.95 confidence priority.</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="px-3.5 py-1.5 text-xs text-secondary hover:text-primary font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={!newRuleText.trim()}
                className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-surface text-xs font-medium rounded transition-colors disabled:opacity-50"
              >
                Save Rule to Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
