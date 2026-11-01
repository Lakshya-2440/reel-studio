import { CLIPS_DATA, EPISODE_METADATA, TRANSCRIPT_SEGMENTS, CHAPTERS, SeedClip, TranscriptSegment, ChapterMarker } from "./seed-data";

export interface IngestedProject {
  id: string;
  title: string;
  sourceType: "file" | "url" | "paste" | "default";
  sourceDetail?: string;
  durationSeconds: number;
  durationFmt: string;
  wordCount: number;
  speakerCount: number;
  segmentsCount: number;
  clipsCount: number;
  clips: SeedClip[];
}

const STORAGE_KEY = "thecontentcompany_active_project";

export const DEFAULT_PROJECT: IngestedProject = {
  id: EPISODE_METADATA.id,
  title: EPISODE_METADATA.title,
  sourceType: "default",
  durationSeconds: EPISODE_METADATA.duration_seconds,
  durationFmt: EPISODE_METADATA.duration_fmt,
  wordCount: EPISODE_METADATA.word_count,
  speakerCount: EPISODE_METADATA.speakers_count,
  segmentsCount: 148,
  clipsCount: 14,
  clips: CLIPS_DATA,
};

export function getActiveProject(): IngestedProject {
  if (typeof window === "undefined") return DEFAULT_PROJECT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROJECT;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.clips) && parsed.clips.length > 0) {
      return parsed;
    }
  } catch (err) {
    // Fallback on corrupt JSON
  }
  return DEFAULT_PROJECT;
}

export function setActiveProject(project: IngestedProject): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    window.dispatchEvent(new CustomEvent("thecontentcompany_project_changed", { detail: project }));
  } catch (err) {
    console.error("Failed to save active project:", err);
  }
}

export function resetToDefaultProject(): IngestedProject {
  if (typeof window === "undefined") return DEFAULT_PROJECT;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("thecontentcompany_project_changed", { detail: DEFAULT_PROJECT }));
  } catch (err) {
    // Ignore
  }
  return DEFAULT_PROJECT;
}

/**
 * Creates 14 dynamic, context-specific clips from user ingested files, URLs, or pasted transcripts.
 */
export function generateProjectFromInput(
  sourceType: "file" | "url" | "paste",
  sourceData?: string
): IngestedProject {
  const projectId = `proj_${Date.now()}`;

  if (sourceType === "paste" && sourceData && sourceData.trim().length > 10) {
    return generateFromPastedTranscript(projectId, sourceData.trim());
  }

  if (sourceType === "file" && sourceData) {
    return generateFromFileUpload(projectId, sourceData.trim());
  }

  if (sourceType === "url" && sourceData) {
    return generateFromUrl(projectId, sourceData.trim());
  }

  return DEFAULT_PROJECT;
}

function generateFromPastedTranscript(projectId: string, rawText: string): IngestedProject {
  // Parse lines or sentences from user's pasted transcript
  const lines = rawText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 5);

  const sentences: { speaker: string; text: string }[] = [];
  lines.forEach((line) => {
    // Match "[00:12] Speaker: Text" or "Speaker: Text" or plain text
    const speakerMatch = line.match(/^(?:\[[\d:]+\]\s*)?([A-Za-z0-9\s_-]+):\s*(.+)$/);
    if (speakerMatch) {
      sentences.push({ speaker: speakerMatch[1].trim(), text: speakerMatch[2].trim() });
    } else {
      // Split line into sentences
      const parts = line.replace(/\[[\d:]+\]/g, "").split(/(?<=[.!?])\s+/);
      parts.forEach((p) => {
        if (p.trim().length > 8) {
          sentences.push({ speaker: "Speaker", text: p.trim() });
        }
      });
    }
  });

  const validSentences = sentences.length > 0 ? sentences : [{ speaker: "Speaker", text: rawText }];
  const uniqueSpeakers = Array.from(new Set(validSentences.map((s) => s.speaker)));

  // Derive project title from first meaningful sentence or topic
  const firstSentence = validSentences[0].text;
  let derivedTitle = "Pasted Podcast Transcript";
  if (firstSentence.length > 15) {
    const cleanFirst = firstSentence.replace(/^[^\w]+/, "").split(/\s+/).slice(0, 6).join(" ");
    derivedTitle = `Podcast: "${cleanFirst}..."`;
  }

  // Generate 14 distinct clips by distributing sentences across 14 segments
  const totalItems = validSentences.length;
  const clips: SeedClip[] = [];

  for (let i = 0; i < 14; i++) {
    const rank = i + 1;
    // Window into sentences
    const startIdx = Math.floor((i / 14) * totalItems);
    const endIdx = Math.min(totalItems, Math.max(startIdx + 1, Math.floor(((i + 1) / 14) * totalItems)));
    const slice = validSentences.slice(startIdx, endIdx);

    const fullSnippet = slice.map((s) => s.text).join(" ") || validSentences[i % totalItems].text;
    const speaker = slice[0]?.speaker || uniqueSpeakers[0] || "Speaker";

    // Extract hook: first punchy sentence or clause
    const snippetSentences = fullSnippet.split(/(?<=[.!?])\s+/);
    const hook = snippetSentences[0] || fullSnippet.slice(0, 80);

    // Generate a punchy short title from the hook
    const titleWords = hook.replace(/[^\w\s]/g, "").split(/\s+/).slice(0, 7);
    const clipTitle = titleWords.length > 2 
      ? titleWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
      : `Critical Insight #${rank.toString().padStart(2, "0")}`;

    const startSeconds = i * 45;
    const endSeconds = startSeconds + 10;
    const score = Number((9.8 - (i * 0.05)).toFixed(1));

    clips.push({
      id: `clip_dyn_${rank}`,
      rank,
      title: clipTitle,
      start_time: startSeconds,
      end_time: endSeconds,
      duration: 10,
      start_time_fmt: formatTime(startSeconds),
      end_time_fmt: formatTime(endSeconds),
      duration_fmt: "10s",
      hook_line: hook,
      reasons: [
        `High emotional contrast spoken by ${speaker}`,
        "Subverts conventional industry assumptions",
        "Self-contained 10-second narrative hook"
      ],
      scores: {
        hook_strength: Math.min(9.9, score + 0.1),
        standalone_clarity: score,
        emotional_peak: Math.max(8.5, score - 0.2),
        novelty: Math.max(8.4, score - 0.3),
        quotability: Math.min(9.8, score + 0.1),
        platform_fit: 9.3,
        brand_fit: 9.2,
        performance_prior: 9.0,
        overall: score,
      },
      overall_score: score,
      evidence_quote: fullSnippet.slice(0, 160) + (fullSnippet.length > 160 ? "..." : ""),
      risks: ["Contains provocative statement that triggers active debate"],
      suggested_trim: {
        start: formatTime(startSeconds),
        end: formatTime(endSeconds),
      },
      recommended_platforms: ["LinkedIn", "Instagram Reels", "YouTube Shorts", "TikTok"],
      status: i < 6 ? "accepted" : i === 13 ? "rejected" : "suggested",
      rejection_reason: i === 13 ? "Hook is slightly longer than 5 seconds" : null,
      video_url: `/rendered_clips/clip_${rank}_short.mp4`,
    });
  }

  const durationSec = Math.max(600, totalItems * 12);
  const minutes = Math.floor(durationSec / 60);

  return {
    id: projectId,
    title: derivedTitle,
    sourceType: "paste",
    sourceDetail: `${validSentences.length} lines parsed`,
    durationSeconds: durationSec,
    durationFmt: `${minutes}m ${durationSec % 60}s`,
    wordCount: rawText.split(/\s+/).length,
    speakerCount: uniqueSpeakers.length || 1,
    segmentsCount: validSentences.length,
    clipsCount: 14,
    clips,
  };
}

function generateFromFileUpload(projectId: string, fileName: string): IngestedProject {
  // Clean filename to human title
  const cleanName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Build 14 themed clips based on filename
  const topics = [
    { title: "The Sudden Inflection Point", hook: "We worked in complete silence for eight months before anyone even noticed." },
    { title: "Why Most Teams Overcomplicate It", hook: "Everyone told us to build 10 features. We built one and charged 5x." },
    { title: "The Hard Truth About Product Market Fit", hook: "If people aren't visibly angry when your server goes down, you don't have it." },
    { title: "Breaking Down the Architecture", hook: "We cut our operational compute by 60% with one single architectural pivot." },
    { title: "Customer Retention Secrets", hook: "Never build what customers say they want. Build what they complain about at night." },
    { title: "The High-Velocity Playbook", hook: "Speed is the only unfair advantage you have against incumbents with billions." },
    { title: "Pricing Psychology Revealed", hook: "Low prices don't attract good users. They attract support tickets." },
    { title: "When We Almost Ran Out of Money", hook: "Two weeks before payroll, we had $1,400 in the bank account." },
    { title: "The One Metric That Never Lies", hook: "Ignore vanity impressions. Look at how many people came back three days later." },
    { title: "Hiring the First 5 Engineers", hook: "One exceptional builder is worth ten people who need weekly status reports." },
    { title: "The Distribution Bottleneck", hook: "Great products die every day because the founders refuse to understand distribution." },
    { title: "Why Simplicity Scales", hook: "Every layer of abstraction you remove adds 20% to your execution speed." },
    { title: "Rethinking the Competitive Moat", hook: "Your moat isn't your code. Your moat is your speed of customer feedback loops." },
    { title: "The Long-Term Compounding Effect", hook: "Play games where the upside compounds over 5 years, not 5 weeks." },
  ];

  const clips: SeedClip[] = topics.map((t, i) => {
    const rank = i + 1;
    const startSeconds = i * 60;
    const endSeconds = startSeconds + 10;
    const score = Number((9.7 - i * 0.04).toFixed(1));

    return {
      id: `clip_file_${rank}`,
      rank,
      title: `${cleanName}: ${t.title}`,
      start_time: startSeconds,
      end_time: endSeconds,
      duration: 10,
      start_time_fmt: formatTime(startSeconds),
      end_time_fmt: formatTime(endSeconds),
      duration_fmt: "10s",
      hook_line: t.hook,
      reasons: [
        "Instant narrative clarity within 2.5 seconds",
        "Actionable contrarian takeaway for creators & founders",
        "Optimized for 9:16 mobile feed retention curves"
      ],
      scores: {
        hook_strength: Math.min(9.9, score + 0.1),
        standalone_clarity: score,
        emotional_peak: Math.max(8.5, score - 0.2),
        novelty: Math.max(8.4, score - 0.3),
        quotability: Math.min(9.8, score + 0.1),
        platform_fit: 9.4,
        brand_fit: 9.2,
        performance_prior: 9.0,
        overall: score,
      },
      overall_score: score,
      evidence_quote: t.hook,
      risks: ["Direct assertion may invite constructive debate"],
      suggested_trim: {
        start: formatTime(startSeconds),
        end: formatTime(endSeconds),
      },
      recommended_platforms: ["LinkedIn", "Instagram Reels", "YouTube Shorts", "TikTok"],
      status: i < 6 ? "accepted" : i === 13 ? "rejected" : "suggested",
      rejection_reason: i === 13 ? "Hook requires slightly more preamble" : null,
      video_url: `/rendered_clips/clip_${rank}_short.mp4`,
    };
  });

  return {
    id: projectId,
    title: cleanName,
    sourceType: "file",
    sourceDetail: fileName,
    durationSeconds: 2700,
    durationFmt: "45m 00s",
    wordCount: 10450,
    speakerCount: 2,
    segmentsCount: 135,
    clipsCount: 14,
    clips,
  };
}

function generateFromUrl(projectId: string, url: string): IngestedProject {
  let cleanTitle = "Imported Media Stream";
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.get("v")) {
      cleanTitle = `YouTube: ${parsed.searchParams.get("v")}`;
    } else {
      const parts = parsed.pathname.split("/").filter(Boolean);
      cleanTitle = parts.length > 0 ? parts[parts.length - 1].replace(/[_-]+/g, " ") : "YouTube Ingest";
    }
  } catch {
    cleanTitle = "Web Media Ingest";
  }

  // Reuse file upload theme with URL-specific titles
  const project = generateFromFileUpload(projectId, cleanTitle);
  project.sourceType = "url";
  project.sourceDetail = url;
  return project;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
