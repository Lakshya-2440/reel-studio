const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface IngestJob {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress_pct: number;
  stage: string;
  detail?: string;
}

export interface ClipScoreBreakdown {
  hook_strength: number;
  information_density: number;
  emotional_resonance: number;
  brand_fit: number;
  performance_prior: number;
  clarity: number;
  standalone_value: number;
  overall: number;
}

export interface Clip {
  id: string;
  project_id: string;
  title: string;
  hook_line: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  scores: ClipScoreBreakdown;
  reasons: string[];
  evidence_quote: string;
  risks?: string[];
  suggested_trim?: { start: string; end: string };
  recommended_platforms: string[];
  status: "suggested" | "accepted" | "rejected" | "scheduled";
  rejection_reason?: string;
}

export interface PlatformVariant {
  id: string;
  clip_id: string;
  platform: "linkedin" | "reels" | "shorts" | "x" | "tiktok";
  hook_options: { id: string; text: string; score: number }[];
  selected_hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  on_screen_text?: string;
  alt_text?: string;
  voice_match_score: number;
  character_count: number;
  max_characters: number;
  creator_edited: boolean;
}

export interface VoiceRule {
  id: string;
  rule: string;
  category: "tone" | "length" | "vocabulary" | "structure" | "formatting" | "banned";
  confidence: number;
  edit_count: number;
  evidence_diff: {
    before: string;
    after: string;
  };
  is_active: boolean;
  is_pinned: boolean;
}

export interface VoiceProfile {
  version: number;
  summary: string;
  tone_sliders: {
    formal_casual: number; // 0 (formal) to 100 (casual)
    bold_measured: number; // 0 (measured) to 100 (bold)
    concise_detailed: number; // 0 (concise) to 100 (detailed)
  };
  signature_phrases: string[];
  banned_words: string[];
  rules: VoiceRule[];
  exemplars: {
    id: string;
    platform: string;
    text: string;
    note?: string;
  }[];
}

export interface CalendarItem {
  id: string;
  clip_id: string;
  title: string;
  platform: "linkedin" | "reels" | "shorts" | "x" | "tiktok";
  slot_time_ist: string; // ISO string in IST
  status: "draft" | "scheduled" | "posted" | "skipped";
  ai_confidence: number;
  is_ai_recommended: boolean;
  ai_rationale?: string;
}

export interface PerformanceLog {
  id: string;
  post_id: string;
  platform: string;
  title: string;
  posted_at_ist: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  retention_pct?: number;
  engagement_score: number;
  features: {
    hook_type: string;
    caption_length: string;
    has_cta: boolean;
    day_of_week: string;
    time_slot: string;
  };
}

export interface FeatureWeight {
  feature_name: string;
  feature_category: string;
  lift_ratio: number; // e.g. 2.4x
  sample_size: number;
  confidence: "high" | "moderate" | "low" | "prior";
  direction: "positive" | "negative" | "neutral";
  description: string;
}

export interface PerformanceInsight {
  id: string;
  timestamp: string;
  headline: string;
  explanation: string;
  impact_action: string;
  confidence: "high" | "moderate" | "prior";
}

export interface BrandKit {
  name: string;
  tagline: string;
  palette: {
    name: string;
    hex: string;
    role: "primary" | "secondary" | "accent" | "background" | "neutral";
  }[];
  typography: {
    headline_font: string;
    body_font: string;
    vibe: string;
  };
  visual_rules: {
    dos: string[];
    donts: string[];
  };
  voice_summary: string;
}

export interface VoiceInterpretation {
  raw_text: string;
  clean_text: string;
  intent: "edit_clip" | "schedule_post" | "generate_copy" | "log_performance" | "update_rule" | "general_query";
  entities: Record<string, any>;
  fillers_removed: string[];
  corrections_applied: {
    original: string;
    corrected: string;
  }[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`[API] Call to ${url} failed, using local/fallback behavior:`, err);
      throw err;
    }
  }

  // Projects
  async getProject(id: string = "demo-project"): Promise<Project> {
    return this.fetchJson<Project>(`/projects/${id}`).catch(() => ({
      id: "demo-project",
      name: "The Founder Files — Ep. 42",
      created_at: new Date().toISOString(),
    }));
  }

  // Clips
  async getClips(projectId: string = "demo-project"): Promise<Clip[]> {
    return this.fetchJson<Clip[]>(`/projects/${projectId}/clips`);
  }

  async updateClipStatus(clipId: string, status: Clip["status"], reason?: string): Promise<{ success: boolean }> {
    return this.fetchJson<{ success: boolean }>(`/clips/${clipId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejection_reason: reason }),
    });
  }

  // Copy Variants
  async getCopyVariants(clipId: string): Promise<PlatformVariant[]> {
    return this.fetchJson<PlatformVariant[]>(`/clips/${clipId}/copy`);
  }

  async updateVariant(variantId: string, data: { creator_final: string; ai_draft?: string }): Promise<{ success: boolean; voice_rules_updated: boolean }> {
    return this.fetchJson<{ success: boolean; voice_rules_updated: boolean }>(`/variants/${variantId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Voice Memory
  async getVoiceProfile(): Promise<VoiceProfile> {
    return this.fetchJson<VoiceProfile>("/voice/profile");
  }

  async toggleVoiceRule(ruleId: string, isActive: boolean): Promise<{ success: boolean }> {
    return this.fetchJson<{ success: boolean }>(`/voice/rules/${ruleId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  // Voice Intake / Studio
  async interpretVoice(rawTranscript: string): Promise<VoiceInterpretation> {
    return this.fetchJson<VoiceInterpretation>("/voice/interpret", {
      method: "POST",
      body: JSON.stringify({ raw_text: rawTranscript }),
    });
  }

  // Calendar
  async getCalendar(): Promise<CalendarItem[]> {
    return this.fetchJson<CalendarItem[]>("/calendar");
  }

  async planWeek(): Promise<CalendarItem[]> {
    return this.fetchJson<CalendarItem[]>("/calendar/plan-week", { method: "POST" });
  }

  // Performance
  async getPerformanceWeights(): Promise<FeatureWeight[]> {
    return this.fetchJson<FeatureWeight[]>("/performance/weights");
  }

  async getPerformanceInsights(): Promise<PerformanceInsight[]> {
    return this.fetchJson<PerformanceInsight[]>("/performance/insights");
  }

  // Brand Kit
  async getBrandKit(): Promise<BrandKit> {
    return this.fetchJson<BrandKit>("/brand/kit");
  }

  // Health
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.fetchJson<{ status: string; timestamp: string }>("/health");
  }
}

export const api = new ApiClient(API_BASE_URL);
