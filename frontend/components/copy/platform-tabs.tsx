"use client";

import {
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
  Music,
  Share2,
} from "lucide-react";

export type PlatformKey = "linkedin" | "reels" | "shorts" | "x" | "tiktok";

interface PlatformTabsProps {
  activePlatform: PlatformKey;
  onSelectPlatform: (platform: PlatformKey) => void;
  voiceScores?: Record<PlatformKey, number>;
}

export const PLATFORMS: {
  id: PlatformKey;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
}[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    shortName: "LI",
    icon: Linkedin,
    tagline: "Insight-led B2B post with 210-char hook fold",
  },
  {
    id: "reels",
    name: "Instagram Reels",
    shortName: "Reels",
    icon: Instagram,
    tagline: "Vertical 9:16 video caption with on-screen text",
  },
  {
    id: "shorts",
    name: "YouTube Shorts",
    shortName: "Shorts",
    icon: Youtube,
    tagline: "<100 char title, description & pinned comment",
  },
  {
    id: "x",
    name: "X (Twitter)",
    shortName: "X",
    icon: Twitter,
    tagline: "Punchy post / thread under 280-char limit",
  },
  {
    id: "tiktok",
    name: "TikTok",
    shortName: "TikTok",
    icon: Music,
    tagline: "Curiosity hook caption + sound synchronization",
  },
];

export function PlatformTabs({
  activePlatform,
  onSelectPlatform,
  voiceScores,
}: PlatformTabsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs scrollbar-thin">
      {PLATFORMS.map((plat) => {
        const Icon = plat.icon;
        const isActive = plat.id === activePlatform;
        const score = voiceScores ? voiceScores[plat.id] : 94;

        return (
          <button
            key={plat.id}
            onClick={() => onSelectPlatform(plat.id)}
            className={`px-3 py-2 rounded-t flex items-center gap-2 font-medium transition-all shrink-0 border-b-2 ${
              isActive
                ? "bg-surface border-accent text-primary shadow-xs font-semibold"
                : "bg-canvas/50 border-transparent text-secondary hover:text-primary hover:bg-surface-subtle"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                isActive ? "text-accent" : "text-tertiary"
              }`}
            />
            <span>{plat.name}</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                isActive
                  ? "bg-accent-subtle text-accent border-accent/30 font-bold"
                  : "bg-surface text-tertiary border-border"
              }`}
            >
              {score}% match
            </span>
          </button>
        );
      })}
    </div>
  );
}
