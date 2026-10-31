"use client";

import { useState } from "react";
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Send,
  ThumbsUp,
  Repeat2,
  MoreHorizontal,
  Volume2,
  CheckCircle,
  Eye,
  Film,
  Music,
  Globe,
  Pin,
} from "lucide-react";
import { PlatformKey } from "./platform-tabs";

interface FeedPreviewCardProps {
  platform: PlatformKey;
  caption: string;
  hook: string;
  hashtags: string[];
  cta: string;
  onScreenText?: string;
  foldCutoff: number;
}

export function FeedPreviewCard({
  platform,
  caption,
  hook,
  hashtags,
  cta,
  onScreenText,
  foldCutoff,
}: FeedPreviewCardProps) {
  const [isSeeMoreExpanded, setIsSeeMoreExpanded] = useState(false);

  // LinkedIn Formatting
  if (platform === "linkedin") {
    const isOverFold = caption.length > foldCutoff;
    const displayedText =
      isOverFold && !isSeeMoreExpanded
        ? caption.slice(0, foldCutoff)
        : caption;

    return (
      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden max-w-xl mx-auto">
        {/* Header Strip */}
        <div className="p-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary text-surface flex items-center justify-center font-bold text-xs font-mono">
              MV
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-primary">Marcus Vance</span>
                <span className="text-[10px] text-tertiary">· 1st</span>
              </div>
              <div className="text-[11px] text-secondary truncate max-w-[280px]">
                Founder & CEO @ Arcus · Host of The Founder Files
              </div>
              <div className="text-[10px] text-tertiary flex items-center gap-1">
                <span>1h ·</span>
                <Globe className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
          <button className="text-tertiary hover:text-primary p-1">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Post Body */}
        <div className="p-4 space-y-3 text-xs leading-relaxed text-primary">
          <div className="whitespace-pre-wrap">
            {displayedText}
            {isOverFold && !isSeeMoreExpanded && (
              <button
                type="button"
                onClick={() => setIsSeeMoreExpanded(true)}
                className="text-secondary hover:text-accent font-semibold ml-1 inline"
              >
                ...see more
              </button>
            )}
          </div>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hashtags.map((tag, idx) => (
                <span key={idx} className="text-accent hover:underline font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Video Card Thumbnail Mockup */}
        <div className="mx-4 mb-3 border border-border rounded bg-canvas p-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-primary">
            <Film className="w-4 h-4 text-accent" />
            <span>Video Attachment: The $42k OpenAI Bill</span>
          </div>
          <div className="text-[11px] font-mono text-tertiary">
            00:46 · 1080x1920 (9:16) · High Bitrate H.264
          </div>
        </div>

        {/* Engagement Stats Strip */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[11px] text-tertiary">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center text-[9px] text-surface font-bold">
              👍
            </div>
            <span>1,428 likes</span>
          </div>
          <div>142 comments · 86 reposts</div>
        </div>

        {/* Action Bar */}
        <div className="px-4 py-2.5 border-t border-border bg-canvas/40 flex items-center justify-around text-xs text-secondary font-medium">
          <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Like</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comment</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Repeat2 className="w-3.5 h-3.5" />
            <span>Repost</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    );
  }

  // Instagram Reels Formatting
  if (platform === "reels") {
    return (
      <div className="bg-[#0B0B0C] text-white border border-border rounded-lg shadow-card overflow-hidden max-w-sm mx-auto relative aspect-[9/16] flex flex-col justify-between p-4">
        {/* Top Overlay */}
        <div className="flex items-center justify-between text-xs z-10">
          <span className="font-bold tracking-wider text-xs">Reels</span>
          <Film className="w-4 h-4" />
        </div>

        {/* Center On-screen Text Graphic Beat */}
        <div className="my-auto text-center px-4 z-10 space-y-2">
          {onScreenText && (
            <div className="inline-block bg-accent px-3 py-1.5 rounded font-bold text-xs uppercase tracking-wider text-white shadow-lg">
              {onScreenText}
            </div>
          )}
          <div className="text-[11px] opacity-75 font-mono">
            [Audio: The Founder Files Ep. 42]
          </div>
        </div>

        {/* Right Floating Actions */}
        <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-10 text-xs">
          <button className="flex flex-col items-center gap-0.5">
            <Heart className="w-5 h-5 text-white" />
            <span className="text-[10px] font-mono">24.2k</span>
          </button>
          <button className="flex flex-col items-center gap-0.5">
            <MessageSquare className="w-5 h-5 text-white" />
            <span className="text-[10px] font-mono">482</span>
          </button>
          <button className="flex flex-col items-center gap-0.5">
            <Send className="w-5 h-5 text-white" />
            <span className="text-[10px] font-mono">1.1k</span>
          </button>
          <button className="flex flex-col items-center gap-0.5">
            <Bookmark className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Bottom Overlay Info */}
        <div className="space-y-2 z-10 max-w-[260px] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center font-bold text-[10px]">
              MV
            </div>
            <span className="font-bold">marcusvance</span>
            <button className="text-[10px] border border-white/40 px-2 py-0.5 rounded font-semibold">
              Follow
            </button>
          </div>

          <p className="text-[11px] line-clamp-2 leading-relaxed opacity-90">
            {caption}
          </p>

          <div className="flex items-center gap-1.5 text-[10px] opacity-75">
            <Music className="w-3 h-3" />
            <span className="truncate">Original audio · The Founder Files Ep. 42</span>
          </div>
        </div>
      </div>
    );
  }

  // YouTube Shorts Formatting
  if (platform === "shorts") {
    return (
      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden max-w-sm mx-auto space-y-3 p-4">
        <div className="flex items-center justify-between text-xs font-bold text-red-600 border-b border-border pb-2">
          <span>YouTube Shorts Preview</span>
          <span className="font-mono text-[10px] text-tertiary">&lt;=100 Chars</span>
        </div>

        {/* Shorts Card Visual */}
        <div className="bg-[#18181B] text-white rounded p-4 text-center aspect-[9/12] flex flex-col justify-between">
          <div className="text-right">
            <span className="text-[10px] font-mono bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">
              SHORTS
            </span>
          </div>

          <div className="space-y-2 px-2">
            {onScreenText && (
              <div className="bg-white text-black font-extrabold text-xs px-2 py-1 rounded inline-block uppercase">
                {onScreenText}
              </div>
            )}
            <p className="text-xs font-semibold leading-snug line-clamp-3">
              {hook}
            </p>
          </div>

          <div className="text-left text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs truncate">The Founder Files</span>
              <button className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Pinned Comment Box (YouTube Shorts requirement) */}
        <div className="p-3 bg-canvas border border-border rounded space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-mono text-tertiary">
            <Pin className="w-3 h-3 text-red-500" />
            <span>AI PINNED COMMENT CALLOUT</span>
          </div>
          <p className="text-xs text-primary font-medium">
            &ldquo;{cta}&rdquo;
          </p>
        </div>
      </div>
    );
  }

  // X (Twitter) Formatting
  if (platform === "x") {
    const isThread = caption.length > 280;

    return (
      <div className="bg-surface border border-border rounded-lg shadow-card p-4 max-w-xl mx-auto space-y-3">
        {/* Post Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary text-surface flex items-center justify-center font-bold text-xs font-mono">
              MV
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-primary">Marcus Vance</span>
                <CheckCircle className="w-3 h-3 text-accent fill-accent text-surface" />
                <span className="text-[11px] text-tertiary">@marcusvance · 2h</span>
              </div>
              <div className="text-[10px] font-mono text-tertiary">
                {isThread ? "Multi-Post Thread (1/3)" : "Single Post"}
              </div>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-tertiary" />
        </div>

        {/* Content */}
        <div className="text-xs text-primary leading-relaxed whitespace-pre-wrap pl-11">
          {caption}
        </div>

        {/* Action Counters */}
        <div className="flex items-center justify-between pl-11 pt-2 border-t border-border text-tertiary text-xs">
          <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">48</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-success transition-colors">
            <Repeat2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">112</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-destructive transition-colors">
            <Heart className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">894</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">34.1K</span>
          </button>
          <button className="hover:text-primary transition-colors">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // TikTok Formatting
  return (
    <div className="bg-[#121212] text-white border border-border rounded-lg shadow-card overflow-hidden max-w-sm mx-auto aspect-[9/16] p-4 flex flex-col justify-between relative">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-xs tracking-wider">TikTok</span>
        <Music className="w-4 h-4" />
      </div>

      <div className="my-auto text-center px-4 space-y-2">
        {onScreenText && (
          <div className="bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded inline-block uppercase shadow-lg">
            {onScreenText}
          </div>
        )}
      </div>

      <div className="space-y-2 text-xs">
        <div className="font-bold">@marcus.vance</div>
        <p className="text-[11px] opacity-90 line-clamp-3">
          {caption}
        </p>
        <div className="flex items-center gap-2 text-[10px] opacity-75 font-mono">
          <Music className="w-3 h-3" />
          <span>The Founder Files Ep. 42 (Sound)</span>
        </div>
      </div>
    </div>
  );
}
