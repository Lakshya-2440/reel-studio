// TheContentCompany Studio — Master Seed Data for The Founder Files Ep. 42
// Y-Combinator Startup Aesthetic & Exact Traceability for Reqs 1, 2, 3

export interface ClipScoreBreakdown {
  hook_strength: number;
  standalone_clarity: number;
  emotional_peak: number;
  novelty: number;
  quotability: number;
  platform_fit: number;
  brand_fit: number;
  performance_prior: number;
  overall: number;
}

export interface SeedClip {
  id: string;
  rank: number;
  title: string;
  start_time: number;
  end_time: number;
  duration: number;
  start_time_fmt: string;
  end_time_fmt: string;
  duration_fmt: string;
  hook_line: string;
  reasons: string[];
  scores: ClipScoreBreakdown;
  overall_score: number;
  evidence_quote: string;
  risks: string[];
  suggested_trim: {
    start: string;
    end: string;
  };
  recommended_platforms: string[];
  status: "accepted" | "suggested" | "rejected";
  rejection_reason?: string | null;
}

export interface PlatformVariantData {
  platform: "linkedin" | "reels" | "shorts" | "x" | "tiktok";
  hookA: string;
  hookB: string;
  activeHook: "A" | "B";
  caption: string;
  hashtags: string[];
  cta: string;
  on_screen_text: string;
  voice_match_score: number;
  voice_rules_matched: string[];
  char_limit: number;
  fold_cutoff: number;
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  role: string;
  start_time: number;
  end_time: number;
  start_time_fmt: string;
  end_time_fmt: string;
  text: string;
}

export interface ChapterMarker {
  id: string;
  title: string;
  start_time: number;
  end_time: number;
  start_time_fmt: string;
  end_time_fmt: string;
  summary: string;
  clips_count: number;
}

export const EPISODE_METADATA = {
  id: "founder-files-42",
  title: "The Founder Files — Ep. 42",
  full_title: "The Founder Files — Ep. 42: Scaling Arcus to M ARR & The k OpenAI Bill",
  guest: "Marcus Vance",
  guest_role: "Founder & CEO @ Arcus",
  host: "Sarah Chen",
  host_role: "General Partner @ Pioneer Ventures",
  duration_seconds: 2892,
  duration_fmt: "48m 12s",
  word_count: 11420,
  speakers_count: 2,
  asr_engine: "Whisper Large-v3 (FP16)",
  asr_confidence: 99.2,
  vector_chunks: 148,
  embedding_model: "BAAI/bge-small-en-v1.5 (384-dim)",
  indexed_at: "2026-10-31T14:30:00Z",
  status: "INDEXED & VECTORIZED",
};

export const CHAPTERS: ChapterMarker[] = [
  {
    "id": "chap_1",
    "title": "The $50k MRR Death Valley",
    "start_time": 0,
    "end_time": 420,
    "start_time_fmt": "00:00",
    "end_time_fmt": "07:00",
    "summary": "Why early AI traction often masks 110% net churn and zero unit margin.",
    "clips_count": 2
  },
  {
    "id": "chap_2",
    "title": "Cost-Plus AI Pricing Is Self-Harm",
    "start_time": 420,
    "end_time": 890,
    "start_time_fmt": "07:00",
    "end_time_fmt": "14:50",
    "summary": "How pass-through token pricing turns scale into an existential liability.",
    "clips_count": 3
  },
  {
    "id": "chap_3",
    "title": "Firing Early Adopter Tourists",
    "start_time": 890,
    "end_time": 1430,
    "start_time_fmt": "14:50",
    "end_time_fmt": "23:50",
    "summary": "The counterintuitive necessity of ruthlessly pruning non-ideal pilot users.",
    "clips_count": 3
  },
  {
    "id": "chap_4",
    "title": "Enterprise Sales Is Pure Psychology",
    "start_time": 1430,
    "end_time": 1980,
    "start_time_fmt": "23:50",
    "end_time_fmt": "33:00",
    "summary": "Bypassing procurement hesitation by anchoring on organizational anxiety.",
    "clips_count": 4
  },
  {
    "id": "chap_5",
    "title": "The Distribution Moat Fallacy",
    "start_time": 1980,
    "end_time": 2420,
    "start_time_fmt": "33:00",
    "end_time_fmt": "40:20",
    "summary": "Why foundation model moats are illusory and workflow lock-in is king.",
    "clips_count": 3
  },
  {
    "id": "chap_6",
    "title": "Closing Doctrine: Speed as Defense",
    "start_time": 2420,
    "end_time": 2724,
    "start_time_fmt": "40:20",
    "end_time_fmt": "45:24",
    "summary": "Shipping 4x faster as the sole durable advantage against Big Tech.",
    "clips_count": 2
  }
];

export const TRANSCRIPT_SEGMENTS: TranscriptSegment[] = [
  {
    "id": "seg-01",
    "speaker": "Sarah Chen",
    "role": "Host \u00b7 GP @ Pioneer Ventures",
    "start_time": 0,
    "end_time": 11,
    "start_time_fmt": "00:00",
    "end_time_fmt": "00:11",
    "text": "Welcome back to The Founder Files. Today I am sitting down with Marcus Vance, founder and CEO of Arcus. Marcus, before the mics were hot, you told me a story about your compute bills that gave me a physical chill."
  },
  {
    "id": "seg-02",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 12,
    "end_time": 58,
    "start_time_fmt": "00:12",
    "end_time_fmt": "00:58",
    "text": "At fifty thousand MRR, we thought we were geniuses. But our compute bills from OpenAI were forty-two thousand dollars. We were effectively subsidizing Fortune 500 experiments out of our personal credit cards."
  },
  {
    "id": "seg-03",
    "speaker": "Sarah Chen",
    "role": "Host \u00b7 GP @ Pioneer Ventures",
    "start_time": 59,
    "end_time": 92,
    "start_time_fmt": "00:59",
    "end_time_fmt": "01:32",
    "text": "Forty-two thousand on fifty thousand revenue. That is a sixteen percent gross margin on paper, before payroll. How did you not panic?"
  },
  {
    "id": "seg-04",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 93,
    "end_time": 144,
    "start_time_fmt": "01:33",
    "end_time_fmt": "02:24",
    "text": "Oh, we did panic. We had three weeks of cash left. That was the day I sat the engineering team down and instituted the margin audit. We realized we were returning full vector context for every trivial ping."
  },
  {
    "id": "seg-05",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 145,
    "end_time": 198,
    "start_time_fmt": "02:25",
    "end_time_fmt": "03:18",
    "text": "If your gross margin on an AI product is under seventy percent, stop calling yourself a software company. You are a boutique consulting shop with an API key, and your customer knows it."
  },
  {
    "id": "seg-06",
    "speaker": "Sarah Chen",
    "role": "Host \u00b7 GP @ Pioneer Ventures",
    "start_time": 199,
    "end_time": 252,
    "start_time_fmt": "03:19",
    "end_time_fmt": "04:12",
    "text": "That brings me to how you built distribution. You never hired an agency or ran paid ads. You started publishing raw breakdowns of this exact math."
  },
  {
    "id": "seg-07",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 253,
    "end_time": 310,
    "start_time_fmt": "04:13",
    "end_time_fmt": "05:10",
    "text": "Most founders treat content like a megaphone. They shout at buyers hoping for clicks. But the sharpest ones use it as a radar. You publish raw thoughts to see who signals back."
  },
  {
    "id": "seg-08",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 430,
    "end_time": 482,
    "start_time_fmt": "07:10",
    "end_time_fmt": "08:02",
    "text": "Never charge per token or per prompt. The customer perceives token cost as friction. Charge for the verified outcome. When we switched from ten cents per query to five thousand dollars per closed audit, conversion doubled."
  },
  {
    "id": "seg-09",
    "speaker": "Sarah Chen",
    "role": "Host \u00b7 GP @ Pioneer Ventures",
    "start_time": 512,
    "end_time": 565,
    "start_time_fmt": "08:32",
    "end_time_fmt": "09:25",
    "text": "That sounds terrifying for a seed stage team though. How did your early users react when you 10x'd the price overnight?"
  },
  {
    "id": "seg-010",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 566,
    "end_time": 622,
    "start_time_fmt": "09:26",
    "end_time_fmt": "10:22",
    "text": "Nine out of ten threw a fit and canceled. Good riddance. The one that stayed paid us more than the other nine combined and demanded enterprise SOC2 compliance. That single customer funded our entire engineering runway."
  },
  {
    "id": "seg-011",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 920,
    "end_time": 975,
    "start_time_fmt": "15:20",
    "end_time_fmt": "16:15",
    "text": "The most dangerous customer isn't the one who hates your product. It's the enthusiastic power user who pays twenty dollars a month, submits fifty feature requests, and distracts you from closing fifty-thousand dollar contracts."
  },
  {
    "id": "seg-012",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 1010,
    "end_time": 1065,
    "start_time_fmt": "16:50",
    "end_time_fmt": "17:45",
    "text": "We fired twelve customers in one afternoon. Our team cried. Three months later our average contract value jumped from eighty dollars to fourteen thousand dollars."
  },
  {
    "id": "seg-013",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 1450,
    "end_time": 1510,
    "start_time_fmt": "24:10",
    "end_time_fmt": "25:10",
    "text": "Enterprise procurement officers do not care about your precision metrics or benchmark charts. They care about whether buying your software will get them fired if your system leaks customer data."
  },
  {
    "id": "seg-014",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 1540,
    "end_time": 1598,
    "start_time_fmt": "25:40",
    "end_time_fmt": "26:38",
    "text": "Position your tool as the defensive compliance shield, not the offensive sword. Enterprise budgets unlocked ten times faster when we framed Arcus as regulatory insurance rather than a productivity boost."
  },
  {
    "id": "seg-015",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 2010,
    "end_time": 2068,
    "start_time_fmt": "33:30",
    "end_time_fmt": "34:28",
    "text": "Everyone talks about proprietary fine-tuned weights as the moat. In eighteen months, open weight models like Llama will commoditize your model. The only durable moat is workflow lock-in and deep system integration."
  },
  {
    "id": "seg-016",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 2120,
    "end_time": 2178,
    "start_time_fmt": "35:20",
    "end_time_fmt": "36:18",
    "text": "If taking your tool out of their daily workflow doesn't break someone's nine a.m. Monday routine, you don't have a software product. You have a shiny bookmark."
  },
  {
    "id": "seg-017",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 2440,
    "end_time": 2505,
    "start_time_fmt": "40:40",
    "end_time_fmt": "41:45",
    "text": "Big tech moves with the agility of an aircraft carrier. By the time their compliance committee schedules a kickoff call, you need to have shipped four full product iterations and locked down three pilot customers."
  },
  {
    "id": "seg-018",
    "speaker": "Marcus Vance",
    "role": "Guest \u00b7 Founder & CEO @ Arcus",
    "start_time": 2700,
    "end_time": 2758,
    "start_time_fmt": "45:00",
    "end_time_fmt": "45:58",
    "text": "The brutal math of founder survival is that you don't die from competition. You die from spending six months polishing something nobody was ever going to pay one thousand dollars for."
  }
];

export const CLIPS_DATA: SeedClip[] = [
  {
    "id": "clip_1",
    "rank": 1,
    "title": "The $42k OpenAI Bill That Almost Killed Us",
    "start_time": 12,
    "end_time": 58,
    "duration": 46,
    "start_time_fmt": "00:12",
    "end_time_fmt": "00:58",
    "duration_fmt": "46s",
    "hook_line": "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.",
    "reasons": [
      "Stark financial contrast creates instantaneous curiosity",
      "Subverts the 'high MRR = success' founder mythology",
      "Contains raw dollar vulnerability rarely shared publicly"
    ],
    "scores": {
      "hook_strength": 9.6,
      "standalone_clarity": 9.5,
      "emotional_peak": 9.2,
      "novelty": 8.9,
      "quotability": 9.8,
      "platform_fit": 9.2,
      "brand_fit": 9.2,
      "performance_prior": 9.0,
      "overall": 9.4
    },
    "overall_score": 9.4,
    "evidence_quote": "At fifty thousand MRR, we thought we were geniuses. But our compute bills from OpenAI were forty-two thousand dollars.",
    "risks": [
      "Financial vulnerability: reveals ,000 monthly server burn",
      "00:44 chuckles \u2014 suggested 0.4s audio clean edit"
    ],
    "suggested_trim": {
      "start": "00:12",
      "end": "00:58"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "accepted",
    "rejection_reason": null
  },
  {
    "id": "clip_6",
    "rank": 2,
    "title": "Firing 12 Customers in One Afternoon",
    "start_time": 1010,
    "end_time": 1065,
    "duration": 55,
    "start_time_fmt": "16:50",
    "end_time_fmt": "17:45",
    "duration_fmt": "55s",
    "hook_line": "We fired 12 customers in one afternoon. Our team wept. Three months later ACV jumped from $80 to $14,000.",
    "reasons": [
      "High emotional stakes combined with radical founder agency",
      "Dramatic quantitative turnaround ($80 to $14k ACV)",
      "Actionable lesson on the power of ruthless focus"
    ],
    "scores": {
      "hook_strength": 9.7,
      "standalone_clarity": 9.4,
      "emotional_peak": 9.4,
      "novelty": 9.0,
      "quotability": 9.6,
      "platform_fit": 9.3,
      "brand_fit": 9.2,
      "performance_prior": 9.3,
      "overall": 9.3
    },
    "overall_score": 9.3,
    "evidence_quote": "Three months later, our average contract value went from eighty dollars to fourteen thousand dollars.",
    "risks": [
      "Emotional intensity: discusses firing customers and team weeping",
      "Clean boundary at 17:45 mark"
    ],
    "suggested_trim": {
      "start": "16:50",
      "end": "17:45"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "accepted",
    "rejection_reason": null
  },
  {
    "id": "clip_2",
    "rank": 3,
    "title": "The 70% Gross Margin Rule for AI Startups",
    "start_time": 145,
    "end_time": 198,
    "duration": 53,
    "start_time_fmt": "02:25",
    "end_time_fmt": "03:18",
    "duration_fmt": "53s",
    "hook_line": "If your gross margin is under 70%, you didn't build software\u2014you built a glorified consultancy with an API key.",
    "reasons": [
      "Concrete quantifiable heuristic (70% gross margin rule)",
      "Provocative identity attack on AI wrapper companies",
      "High save-rate potential for startup founders and VCs"
    ],
    "scores": {
      "hook_strength": 9.5,
      "standalone_clarity": 9.4,
      "emotional_peak": 8.8,
      "novelty": 8.7,
      "quotability": 8.6,
      "platform_fit": 9.0,
      "brand_fit": 9.8,
      "performance_prior": 9.3,
      "overall": 9.2
    },
    "overall_score": 9.2,
    "evidence_quote": "If your gross margin on an AI product is under seventy percent, stop calling yourself a software company.",
    "risks": [
      "Contrarian margin claim counters conventional high-burn seed orthodoxy",
      "Verify no non-compete mentions with former employer"
    ],
    "suggested_trim": {
      "start": "02:25",
      "end": "03:18"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "accepted",
    "rejection_reason": null
  },
  {
    "id": "clip_4",
    "rank": 4,
    "title": "What Happens When You 10x Price Overnight",
    "start_time": 566,
    "end_time": 622,
    "duration": 56,
    "start_time_fmt": "09:26",
    "end_time_fmt": "10:22",
    "duration_fmt": "56s",
    "hook_line": "We 10x'd our price. 90% of customers canceled in 24 hours. It was the best decision of our lives.",
    "reasons": [
      "Extreme dramatic stakes with unexpected positive outcome",
      "Reveals enterprise filter dynamics",
      "Clear blueprint for filtering low-intent freemium users"
    ],
    "scores": {
      "hook_strength": 9.4,
      "standalone_clarity": 9.2,
      "emotional_peak": 9.0,
      "novelty": 8.8,
      "quotability": 9.4,
      "platform_fit": 8.9,
      "brand_fit": 9.1,
      "performance_prior": 9.2,
      "overall": 9.1
    },
    "overall_score": 9.1,
    "evidence_quote": "The one that stayed paid us more than the other nine combined and demanded enterprise SOC2 compliance.",
    "risks": [
      "References customer revolt: ensure team permission for public disclosure",
      "Trimmed 1.2s lead-in question from host"
    ],
    "suggested_trim": {
      "start": "09:26",
      "end": "10:22"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "accepted",
    "rejection_reason": null
  },
  {
    "id": "clip_10",
    "rank": 5,
    "title": "The Monday Morning Retention Test",
    "start_time": 2120,
    "end_time": 2178,
    "duration": 58,
    "start_time_fmt": "35:20",
    "end_time_fmt": "36:18",
    "duration_fmt": "58s",
    "hook_line": "If uninstalling your app doesn't break someone's 9 AM routine, you don't have a product\u2014you have a bookmark.",
    "reasons": [
      "Vivid, memorable diagnostic test for PMF",
      "High organic shareability across product circles",
      "Brutal self-evaluation tool for builders"
    ],
    "scores": {
      "hook_strength": 9.3,
      "standalone_clarity": 9.5,
      "emotional_peak": 8.8,
      "novelty": 8.9,
      "quotability": 9.0,
      "platform_fit": 8.9,
      "brand_fit": 9.3,
      "performance_prior": 8.9,
      "overall": 9.0
    },
    "overall_score": 9.0,
    "evidence_quote": "If taking your tool out of their daily workflow doesn't break at least two people's morning routine, you have no moat.",
    "risks": [
      "The 9 AM Monday test: zero context debt",
      "Snappy ending at 36:18 mark"
    ],
    "suggested_trim": {
      "start": "35:20",
      "end": "36:18"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "suggested",
    "rejection_reason": null
  },
  {
    "id": "clip_3",
    "rank": 6,
    "title": "Why Per-Token Pricing Kills Conversion",
    "start_time": 430,
    "end_time": 482,
    "duration": 52,
    "start_time_fmt": "07:10",
    "end_time_fmt": "08:02",
    "duration_fmt": "52s",
    "hook_line": "Charging per token reminds your customer of cost with every keystroke. Charge for verified outcomes.",
    "reasons": [
      "Actionable packaging shift from usage to value",
      "Direct revenue impact backed by 2x conversion lift",
      "Universal pain point for generative AI product managers"
    ],
    "scores": {
      "hook_strength": 8.9,
      "standalone_clarity": 9.1,
      "emotional_peak": 8.4,
      "novelty": 8.5,
      "quotability": 8.9,
      "platform_fit": 8.8,
      "brand_fit": 9.9,
      "performance_prior": 8.6,
      "overall": 8.9
    },
    "overall_score": 8.9,
    "evidence_quote": "When we switched from ten cents per query to five thousand dollars per closed audit, conversion doubled.",
    "risks": [
      "Contradicts standard usage-based pricing models popularized by OpenAI",
      "Safe standalone boundary: zero prior references"
    ],
    "suggested_trim": {
      "start": "07:10",
      "end": "08:02"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "suggested",
    "rejection_reason": null
  },
  {
    "id": "clip_9",
    "rank": 7,
    "title": "The Multi-Million Dollar Moat Delusion",
    "start_time": 2010,
    "end_time": 2068,
    "duration": 58,
    "start_time_fmt": "33:30",
    "end_time_fmt": "34:28",
    "duration_fmt": "58s",
    "hook_line": "Open weights will commoditize your fine-tuned model in 18 months. Your real moat is workflow glue.",
    "reasons": [
      "Contrarian critique of prevailing AI investor pitch decks",
      "Accurate technical prediction grounded in open source velocity",
      "Clear distinction between technology and defensible business architecture"
    ],
    "scores": {
      "hook_strength": 8.9,
      "standalone_clarity": 8.9,
      "emotional_peak": 8.5,
      "novelty": 9.2,
      "quotability": 8.4,
      "platform_fit": 8.7,
      "brand_fit": 9.9,
      "performance_prior": 9.1,
      "overall": 8.9
    },
    "overall_score": 8.9,
    "evidence_quote": "In two years, open weights will match frontier models for eighty percent of vertical tasks. Your moat is the messy workflow integration.",
    "risks": [
      "Calls fine-tuned weights illusory: will spark debate in ML circles",
      "High novelty: 2.1x comment lift prior on X"
    ],
    "suggested_trim": {
      "start": "33:30",
      "end": "34:28"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "suggested",
    "rejection_reason": null
  },
  {
    "id": "clip_5",
    "rank": 8,
    "title": "The Most Dangerous Customer in Early Stage",
    "start_time": 920,
    "end_time": 975,
    "duration": 55,
    "start_time_fmt": "15:20",
    "end_time_fmt": "16:15",
    "duration_fmt": "55s",
    "hook_line": "The biggest threat to your startup isn't an angry churner. It's the enthusiastic power user who pays $20/mo.",
    "reasons": [
      "Counter-intuitive trap identification",
      "High resonance with bootstrapped and seed founders",
      "Direct behavioral advice on product roadmapping"
    ],
    "scores": {
      "hook_strength": 9.2,
      "standalone_clarity": 9.0,
      "emotional_peak": 8.6,
      "novelty": 9.1,
      "quotability": 8.8,
      "platform_fit": 8.7,
      "brand_fit": 9.3,
      "performance_prior": 8.8,
      "overall": 8.8
    },
    "overall_score": 8.8,
    "evidence_quote": "The most dangerous customer isn't the one who hates your product. It's the enthusiast who uses it six hours a day but will never pay more than twenty bucks.",
    "risks": [
      "Potential customer friction: refers to low-tier power users as tourists",
      "Context self-contained: safe for broad social sharing"
    ],
    "suggested_trim": {
      "start": "15:20",
      "end": "16:15"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "suggested",
    "rejection_reason": null
  },
  {
    "id": "clip_11",
    "rank": 9,
    "title": "Out-Shipping Big Tech Aircraft Carriers",
    "start_time": 2440,
    "end_time": 2505,
    "duration": 65,
    "start_time_fmt": "40:40",
    "end_time_fmt": "41:45",
    "duration_fmt": "65s",
    "hook_line": "Google and Microsoft move like aircraft carriers. Ship 4 cycles before their committee can schedule a kickoff.",
    "reasons": [
      "Classic David vs Goliath founder inspiration",
      "Tactical operational cadence comparison",
      "Reassuring competitive doctrine for early startups"
    ],
    "scores": {
      "hook_strength": 9.1,
      "standalone_clarity": 9.1,
      "emotional_peak": 9.2,
      "novelty": 8.2,
      "quotability": 9.3,
      "platform_fit": 8.7,
      "brand_fit": 8.8,
      "performance_prior": 8.6,
      "overall": 8.8
    },
    "overall_score": 8.8,
    "evidence_quote": "Big tech moves with the agility of an aircraft carrier. By the time their committee approves an AI feature roadmap, you should have shipped it.",
    "risks": [
      "Aircraft carrier metaphor: sharp competitive insight",
      "Audio has slight ambient room noise at 41:20"
    ],
    "suggested_trim": {
      "start": "40:40",
      "end": "41:45"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "suggested",
    "rejection_reason": null
  },
  {
    "id": "clip_7",
    "rank": 10,
    "title": "What Enterprise Procurement Actually Fears",
    "start_time": 1450,
    "end_time": 1510,
    "duration": 60,
    "start_time_fmt": "24:10",
    "end_time_fmt": "25:10",
    "duration_fmt": "60s",
    "hook_line": "Enterprise buyers don't care about your F1 score. They care whether buying your software will get them fired.",
    "reasons": [
      "Exposes unstated corporate psychology",
      "Reframes pitch narrative from performance to personal career safety",
      "High utility for B2B sales reps and founders"
    ],
    "scores": {
      "hook_strength": 9.0,
      "standalone_clarity": 9.3,
      "emotional_peak": 8.3,
      "novelty": 8.6,
      "quotability": 8.7,
      "platform_fit": 8.6,
      "brand_fit": 9.7,
      "performance_prior": 8.7,
      "overall": 8.7
    },
    "overall_score": 8.7,
    "evidence_quote": "Enterprise procurement officers do not care about your precision or recall metrics. They care about one thing: will buying your software get them fired?",
    "risks": [
      "Mentions SOC2 compliance and procurement bureaucracy",
      "Zero context debt: highly quotable executive soundbite"
    ],
    "suggested_trim": {
      "start": "24:10",
      "end": "25:10"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "suggested",
    "rejection_reason": null
  },
  {
    "id": "clip_8",
    "rank": 11,
    "title": "Sell the Shield, Never the Sword",
    "start_time": 1540,
    "end_time": 1598,
    "duration": 58,
    "start_time_fmt": "25:40",
    "end_time_fmt": "26:38",
    "duration_fmt": "58s",
    "hook_line": "Fear of loss moves enterprise budgets 10x faster than ambition for upside. Pitch the compliance shield.",
    "reasons": [
      "Clean behavioral economics framing (loss aversion multiplier)",
      "Instantly applicable positioning shift",
      "Memorable conceptual metaphor (shield vs sword)"
    ],
    "scores": {
      "hook_strength": 8.8,
      "standalone_clarity": 9.2,
      "emotional_peak": 8.1,
      "novelty": 8.4,
      "quotability": 8.5,
      "platform_fit": 8.4,
      "brand_fit": 9.6,
      "performance_prior": 8.4,
      "overall": 8.6
    },
    "overall_score": 8.6,
    "evidence_quote": "Fear of loss drives enterprise budget ten times faster than ambition for upside.",
    "risks": [
      "Compliance shield metaphor: highly actionable B2B sales advice",
      "Start point snapped to sentence boundary"
    ],
    "suggested_trim": {
      "start": "25:40",
      "end": "26:38"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "suggested",
    "rejection_reason": null
  },
  {
    "id": "clip_12",
    "rank": 12,
    "title": "The Brutal Math of Founder Survival",
    "start_time": 2510,
    "end_time": 2568,
    "duration": 58,
    "start_time_fmt": "41:50",
    "end_time_fmt": "42:48",
    "duration_fmt": "58s",
    "hook_line": "Startups rarely die from competition. They die from spending 6 months building what nobody was willing to pay $1k for.",
    "reasons": [
      "Universal startup post-mortem reality",
      "Forces commercial validation ahead of technical vanity",
      "Strong closing hook for founder audiences"
    ],
    "scores": {
      "hook_strength": 8.7,
      "standalone_clarity": 9.2,
      "emotional_peak": 8.4,
      "novelty": 8.3,
      "quotability": 8.8,
      "platform_fit": 8.5,
      "brand_fit": 9.3,
      "performance_prior": 8.3,
      "overall": 8.5
    },
    "overall_score": 8.5,
    "evidence_quote": "Startups rarely die from competition. They die from building what nobody was willing to pay for.",
    "risks": [
      "Raw founder survival math: high resonance for early-stage founders",
      "Clean cutoff before concluding host remarks"
    ],
    "suggested_trim": {
      "start": "41:50",
      "end": "42:48"
    },
    "recommended_platforms": [
      "LinkedIn",
      "Instagram Reels",
      "YouTube Shorts",
      "X (Twitter)",
      "TikTok"
    ],
    "status": "rejected",
    "rejection_reason": "Requires deeper cap table context"
  }
];

export const PLATFORM_VARIANTS_DATA: Record<string, Record<string, PlatformVariantData>> = {
  "clip_1": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. At fifty thousand MRR, we thought we were geniuses. But our compute bills from OpenAI were forty-two thousand dollars.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: THE $42K OPENAI BILL THAT ALMOST KILLED US",
      "voice_match_score": 94,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 90,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "The $42k OpenAI Bill That Almost Killed Us \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "At $50k MRR, our compute bill was $42,000. We were subsidizing Fortune 500 pilots on credit cards.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 94,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_6": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "We fired 12 customers in one afternoon. Our team wept. Three months later ACV jumped from $80 to $14,000.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "We fired 12 customers in one afternoon. Our team wept. Three months later ACV jumped from $80 to $14,000.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. Three months later, our average contract value went from eighty dollars to fourteen thousand dollars.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: FIRING 12 CUSTOMERS IN ONE AFTERNOON",
      "voice_match_score": 94,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "We fired 12 customers in one afternoon. Our team wept. Three months later ACV jumped from $80 to $14,000.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "We fired 12 customers in one afternoon. Our team wept. Three months later ACV jumped from $80 to $14,000.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "Firing 12 Customers in One Afternoon \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 87,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "We fired 12 customers in one afternoon. Our team wept. Three months later ACV jumped from $80 to $14,000.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "We fired 12 customers in one afternoon. Our team wept. Three months later ACV jumped from $80 to $14,000.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 90,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 90,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_2": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "If your gross margin is under 70%, you didn't build software\u2014you built a glorified consultancy with an API key.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "If your gross margin is under 70%, you didn't build software\u2014you built a glorified consultancy with an API key.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. If your gross margin on an AI product is under seventy percent, stop calling yourself a software company.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: THE 70% GROSS MARGIN RULE FOR AI STARTUPS",
      "voice_match_score": 94,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "If your gross margin is under 70%, you didn't build software\u2014you built a glorified consultancy with an API key.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 87,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "If your gross margin is under 70%, you didn't build software\u2014you built a glorified consultancy with an API key.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "The 70% Gross Margin Rule for AI Startups \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 87,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "If your gross margin is under 70%, you didn't build software\u2014you built a glorified consultancy with an API key.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "If your gross margin is under 70%, you didn't build software\u2014you built a glorified consultancy with an API key.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 92,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_4": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "We 10x'd our price. 90% of customers canceled in 24 hours. It was the best decision of our lives.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "We 10x'd our price. 90% of customers canceled in 24 hours. It was the best decision of our lives.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. The one that stayed paid us more than the other nine combined and demanded enterprise SOC2 compliance.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: WHAT HAPPENS WHEN YOU 10X PRICE OVERNIGHT",
      "voice_match_score": 94,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "We 10x'd our price. 90% of customers canceled in 24 hours. It was the best decision of our lives.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 89,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "We 10x'd our price. 90% of customers canceled in 24 hours. It was the best decision of our lives.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "What Happens When You 10x Price Overnight \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "We 10x'd our price. 90% of customers canceled in 24 hours. It was the best decision of our lives.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "We 10x'd our price. 90% of customers canceled in 24 hours. It was the best decision of our lives.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 87,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_10": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "If uninstalling your app doesn't break someone's 9 AM routine, you don't have a product\u2014you have a bookmark.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "If uninstalling your app doesn't break someone's 9 AM routine, you don't have a product\u2014you have a bookmark.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. If taking your tool out of their daily workflow doesn't break at least two people's morning routine, you have no moat.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: THE MONDAY MORNING RETENTION TEST",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "If uninstalling your app doesn't break someone's 9 AM routine, you don't have a product\u2014you have a bookmark.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 90,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "If uninstalling your app doesn't break someone's 9 AM routine, you don't have a product\u2014you have a bookmark.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "The Monday Morning Retention Test \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 87,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "If uninstalling your app doesn't break someone's 9 AM routine, you don't have a product\u2014you have a bookmark.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "If uninstalling your app doesn't break someone's 9 AM routine, you don't have a product\u2014you have a bookmark.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 94,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_3": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "Charging per token reminds your customer of cost with every keystroke. Charge for verified outcomes.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "Charging per token reminds your customer of cost with every keystroke. Charge for verified outcomes.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. When we switched from ten cents per query to five thousand dollars per closed audit, conversion doubled.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: WHY PER-TOKEN PRICING KILLS CONVERSION",
      "voice_match_score": 87,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "Charging per token reminds your customer of cost with every keystroke. Charge for verified outcomes.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 93,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "Charging per token reminds your customer of cost with every keystroke. Charge for verified outcomes.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "Why Per-Token Pricing Kills Conversion \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "Charging per token reminds your customer of cost with every keystroke. Charge for verified outcomes.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "Charging per token reminds your customer of cost with every keystroke. Charge for verified outcomes.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 93,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_9": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "Open weights will commoditize your fine-tuned model in 18 months. Your real moat is workflow glue.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "Open weights will commoditize your fine-tuned model in 18 months. Your real moat is workflow glue.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. In two years, open weights will match frontier models for eighty percent of vertical tasks. Your moat is the messy workflow integration.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: THE MULTI-MILLION DOLLAR MOAT DELUSION",
      "voice_match_score": 89,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "Open weights will commoditize your fine-tuned model in 18 months. Your real moat is workflow glue.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "Open weights will commoditize your fine-tuned model in 18 months. Your real moat is workflow glue.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "The Multi-Million Dollar Moat Delusion \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 89,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "Open weights will commoditize your fine-tuned model in 18 months. Your real moat is workflow glue.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "Open weights will commoditize your fine-tuned model in 18 months. Your real moat is workflow glue.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 92,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_5": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "The biggest threat to your startup isn't an angry churner. It's the enthusiastic power user who pays $20/mo.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "The biggest threat to your startup isn't an angry churner. It's the enthusiastic power user who pays $20/mo.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. The most dangerous customer isn't the one who hates your product. It's the enthusiast who uses it six hours a day but will never pay more than twenty bucks.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: THE MOST DANGEROUS CUSTOMER IN EARLY STAGE",
      "voice_match_score": 93,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "The biggest threat to your startup isn't an angry churner. It's the enthusiastic power user who pays $20/mo.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "The biggest threat to your startup isn't an angry churner. It's the enthusiastic power user who pays $20/mo.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "The Most Dangerous Customer in Early Stage \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 93,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "The biggest threat to your startup isn't an angry churner. It's the enthusiastic power user who pays $20/mo.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "The biggest threat to your startup isn't an angry churner. It's the enthusiastic power user who pays $20/mo.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 92,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_11": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "Google and Microsoft move like aircraft carriers. Ship 4 cycles before their committee can schedule a kickoff.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "Google and Microsoft move like aircraft carriers. Ship 4 cycles before their committee can schedule a kickoff.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. Big tech moves with the agility of an aircraft carrier. By the time their committee approves an AI feature roadmap, you should have shipped it.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: OUT-SHIPPING BIG TECH AIRCRAFT CARRIERS",
      "voice_match_score": 92,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "Google and Microsoft move like aircraft carriers. Ship 4 cycles before their committee can schedule a kickoff.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "Google and Microsoft move like aircraft carriers. Ship 4 cycles before their committee can schedule a kickoff.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "Out-Shipping Big Tech Aircraft Carriers \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 90,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "Google and Microsoft move like aircraft carriers. Ship 4 cycles before their committee can schedule a kickoff.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "Google and Microsoft move like aircraft carriers. Ship 4 cycles before their committee can schedule a kickoff.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_7": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "Enterprise buyers don't care about your F1 score. They care whether buying your software will get them fired.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "Enterprise buyers don't care about your F1 score. They care whether buying your software will get them fired.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. Enterprise procurement officers do not care about your precision or recall metrics. They care about one thing: will buying your software get them fired?\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: WHAT ENTERPRISE PROCUREMENT ACTUALLY FEARS",
      "voice_match_score": 89,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "Enterprise buyers don't care about your F1 score. They care whether buying your software will get them fired.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "Enterprise buyers don't care about your F1 score. They care whether buying your software will get them fired.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "What Enterprise Procurement Actually Fears \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "Enterprise buyers don't care about your F1 score. They care whether buying your software will get them fired.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "Enterprise buyers don't care about your F1 score. They care whether buying your software will get them fired.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 93,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_8": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "Fear of loss moves enterprise budgets 10x faster than ambition for upside. Pitch the compliance shield.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "Fear of loss moves enterprise budgets 10x faster than ambition for upside. Pitch the compliance shield.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. Fear of loss drives enterprise budget ten times faster than ambition for upside.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: SELL THE SHIELD, NEVER THE SWORD",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "Fear of loss moves enterprise budgets 10x faster than ambition for upside. Pitch the compliance shield.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "Fear of loss moves enterprise budgets 10x faster than ambition for upside. Pitch the compliance shield.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "Sell the Shield, Never the Sword \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "Fear of loss moves enterprise budgets 10x faster than ambition for upside. Pitch the compliance shield.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "Fear of loss moves enterprise budgets 10x faster than ambition for upside. Pitch the compliance shield.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 92,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  },
  "clip_12": {
    "linkedin": {
      "platform": "linkedin",
      "hookA": "Startups rarely die from competition. They die from spending 6 months building what nobody was willing to pay $1k for.",
      "hookB": "Why 80% of our enterprise pipeline came from unpolished founder perspectives.",
      "activeHook": "A",
      "caption": "Startups rarely die from competition. They die from spending 6 months building what nobody was willing to pay $1k for.\n\nHere is what happened on our path to $4M ARR:\n\n1. Early traction disguised fatal unit economics.\n2. Startups rarely die from competition. They die from building what nobody was willing to pay for.\n3. We had to stop celebrating top-line MRR and focus on gross margin contribution.\n\nTakeaway for operators: If scaling your user base scales your server losses, you haven't found product-market fit\u2014you found a subsidized distribution leak.\n\nWhat is your gross margin floor before shipping an AI workflow? Disagree below.",
      "hashtags": [
        "#SaaS",
        "#Startups",
        "#UnitEconomics",
        "#Founders"
      ],
      "cta": "What is your gross margin floor before shipping an AI workflow? Disagree below.",
      "on_screen_text": "THE $50K MRR TRAP: THE BRUTAL MATH OF FOUNDER SURVIVAL",
      "voice_match_score": 88,
      "voice_rules_matched": [
        "Opens with paradoxical or contrarian hook",
        "No corporate buzzwords (delve, leverage, supercharge)",
        "Includes verified quantitative metric (,000 / k MRR)",
        "Short 1-2 sentence paragraphs for mobile scanability",
        "Single open question CTA for comment velocity"
      ],
      "char_limit": 3000,
      "fold_cutoff": 210
    },
    "reels": {
      "platform": "reels",
      "hookA": "Wait... our OpenAI bill was HOW much?!",
      "hookB": "Stop editing your podcast clips like a media company. (Do this instead)",
      "activeHook": "A",
      "caption": "Startups rarely die from competition. They die from spending 6 months building what nobody was willing to pay $1k for.\n\nThe untold story of why early AI traction almost bankrupt us. Full breakdown on The Founder Files podcast.",
      "hashtags": [
        "#startuplessons",
        "#techfounder",
        "#entrepreneurship",
        "#ai"
      ],
      "cta": "Share this with a founder who needs to audit their OpenAI bill.",
      "on_screen_text": "OPENAI BILL: $42,000 / MO",
      "voice_match_score": 92,
      "voice_rules_matched": [
        "Hook delivery in first 2.5 seconds",
        "On-screen text punch beat synchronization",
        "High-contrast narrative arc (crisis -> resolution)",
        "Save post call-to-action"
      ],
      "char_limit": 2200,
      "fold_cutoff": 125
    },
    "shorts": {
      "platform": "shorts",
      "hookA": "Startups rarely die from competition. They die from spending 6 months building what nobody was willing to pay $1k for.",
      "hookB": "The Brutal Unit Economics of AI Software (Ep. 42)",
      "activeHook": "A",
      "caption": "The Brutal Math of Founder Survival \u2014 Founder Marcus Vance breaks down the unit economics of AI software.",
      "hashtags": [
        "#Shorts",
        "#StartupLife",
        "#TechNews",
        "#AIStartup"
      ],
      "cta": "Subscribe for the full 45-minute breakdown on Ep. 42.",
      "on_screen_text": "THE 70% MARGIN RULE",
      "voice_match_score": 89,
      "voice_rules_matched": [
        "Title strictly under 100 characters",
        "Zero conversational throat-clearing",
        "Pinned comment conversation starter"
      ],
      "char_limit": 100,
      "fold_cutoff": 100
    },
    "x": {
      "platform": "x",
      "hookA": "Startups rarely die from competition. They die from spending 6 months building what nobody was willing to pay $1k for.",
      "hookB": "Most B2B content fails because founders shout instead of listening.",
      "activeHook": "A",
      "caption": "Startups rarely die from competition. They die from spending 6 months building what nobody was willing to pay $1k for.\n\nA painful lesson from scaling Arcus to $4M ARR:\n\n\u2022 Top line: $50k MRR\n\u2022 Compute: $42k/mo\n\u2022 Net sanity: 0\n\nStop building consultancies with API keys. Fix margins first.",
      "hashtags": [
        "#buildinpublic",
        "#ai"
      ],
      "cta": "Retweet the top tweet if you survived the $50k MRR valley.",
      "on_screen_text": "WHY 90% DIE AT $50K MRR",
      "voice_match_score": 89,
      "voice_rules_matched": [
        "Strictly under 280 characters for single post",
        "Bulleted quantitative breakdown",
        "Zero hedging language",
        "Retweet / quote-tweet trigger"
      ],
      "char_limit": 280,
      "fold_cutoff": 280
    },
    "tiktok": {
      "platform": "tiktok",
      "hookA": "If you're building an AI startup, hear this right now.",
      "hookB": "The 50-second lesson that saved our startup from going broke.",
      "activeHook": "A",
      "caption": "The $42k bill that almost shut our doors. Don't make this mistake.",
      "hashtags": [
        "#tech",
        "#softwareengineer",
        "#coding",
        "#startupstory"
      ],
      "cta": "Follow for unfiltered founder post-mortems every Tuesday.",
      "on_screen_text": "HOW WE ALMOST WENT BROKE AT $50K MRR",
      "voice_match_score": 91,
      "voice_rules_matched": [
        "Fast-paced conversational tone",
        "High curiosity gap in first line",
        "Punchy on-screen visual cues"
      ],
      "char_limit": 2200,
      "fold_cutoff": 150
    }
  }
};
