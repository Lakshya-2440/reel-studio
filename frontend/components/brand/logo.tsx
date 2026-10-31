import React from "react";
import Link from "next/link";

export interface LogoProps {
  size?: "sm" | "md" | "lg" | number;
  variant?: "mark" | "full" | "stacked";
  theme?: "light" | "dark" | "auto";
  subtitle?: string | null;
  className?: string;
  href?: string | null;
  showSubtitle?: boolean;
}

export function LogoMark({
  size = 32,
  className = "",
}: {
  size?: number | string;
  className?: string;
}) {
  const pixelSize = typeof size === "number" ? size : size === "sm" ? 24 : size === "lg" ? 40 : 32;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
      aria-label="TheContentCompany Logo"
    >
      <defs>
        <linearGradient id="tcc-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E1E22" />
          <stop offset="100%" stopColor="#0B0B0D" />
        </linearGradient>
        <linearGradient id="tcc-flame" x1="10" y1="10" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7A30" />
          <stop offset="100%" stopColor="#F26522" />
        </linearGradient>
        <linearGradient id="tcc-border" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.04)" />
        </linearGradient>
        <filter id="tcc-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#F26522" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer Squircle Container */}
      <rect width="32" height="32" rx="7.5" fill="url(#tcc-bg)" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7"
        stroke="url(#tcc-border)"
        strokeWidth="1"
        fill="none"
      />

      {/* Monogram T: Roof beam + center stem */}
      <path
        d="M 8 9.5 H 24"
        stroke="#FAF9F6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 16 9.5 V 13"
        stroke="#FAF9F6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Outer C (Content): Sweeping high-retention arc */}
      <path
        d="M 23.5 15.5 C 19 12.5 10 13.5 9 19.5 C 8 26 16.5 27 22.5 25"
        stroke="#FAF9F6"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Inner C (Company): Signature YC Amber-Flame arc with glow */}
      <path
        d="M 20.5 17.5 C 17.5 15.5 12 16.5 11.5 20 C 11 23.5 16.5 24.5 20 23"
        stroke="url(#tcc-flame)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        filter="url(#tcc-glow)"
      />

      {/* Video / Voice Playhead Spark */}
      <polygon
        points="19.5,19 23.5,20.5 19.5,22"
        fill="url(#tcc-flame)"
      />
    </svg>
  );
}

export function TheContentCompanyLogo({
  size = "md",
  variant = "full",
  theme = "auto",
  subtitle = null,
  showSubtitle = true,
  className = "",
  href = null,
}: LogoProps) {
  const pixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 24
      : size === "lg"
      ? 40
      : 30;

  const textColorClass =
    theme === "light"
      ? "text-white"
      : theme === "dark"
      ? "text-primary"
      : "text-primary";

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        variant === "stacked" ? "flex-col items-start gap-1" : ""
      } ${className}`}
    >
      <LogoMark size={pixelSize} />

      {variant !== "mark" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline">
            <span
              className={`font-bold tracking-tight ${textColorClass} ${
                pixelSize <= 26
                  ? "text-xs"
                  : pixelSize <= 34
                  ? "text-sm"
                  : "text-base"
              }`}
            >
              TheContent<span className="text-accent font-semibold">Company</span>
            </span>
          </div>
          {showSubtitle && (
            <span
              className={`font-mono text-tertiary mt-0.5 ${
                pixelSize <= 26 ? "text-[9px]" : "text-[10px]"
              }`}
            >
              {subtitle || "Studio · Brand Memory"}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group">
        {content}
      </Link>
    );
  }

  return content;
}

export default TheContentCompanyLogo;
