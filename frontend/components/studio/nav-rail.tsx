"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TheContentCompanyLogo } from "@/components/brand/logo";
import {
  UploadCloud,
  Scissors,
  FileText,
  Brain,
  Calendar,
  LineChart,
  Palette,
  Mic,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  reqTag: string;
}

export const navItems: NavItem[] = [
  {
    name: "Ingest",
    href: "/app/ingest",
    icon: UploadCloud,
    reqTag: "Pipeline",
  },
  {
    name: "Clips",
    href: "/app/clips",
    icon: Scissors,
    badge: "14",
    reqTag: "9:16 MP4",
  },
  {
    name: "Copy",
    href: "/app/copy",
    icon: FileText,
    reqTag: "5 Formats",
  },
  {
    name: "Voice Memory",
    href: "/app/voice-memory",
    icon: Brain,
    badge: "v4",
    reqTag: "Adaptive",
  },
  {
    name: "Calendar",
    href: "/app/calendar",
    icon: Calendar,
    reqTag: "Smart IST",
  },
  {
    name: "Performance",
    href: "/app/performance",
    icon: LineChart,
    reqTag: "Analytics",
  },
  {
    name: "Brand Kit",
    href: "/app/brand",
    icon: Palette,
    reqTag: "Identity",
  },
  {
    name: "Voice Studio",
    href: "/app/voice-studio",
    icon: Mic,
    badge: "Wispr",
    reqTag: "Speech AI",
  },
];

export function NavRail() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-border bg-surface flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* App Logo & Project Header */}
        <Link
          href="/"
          className="h-14 border-b border-border flex items-center px-3.5 gap-2.5 hover:bg-surface-subtle transition-colors"
          title="Back to Landing Page"
        >
          <TheContentCompanyLogo size={28} subtitle="Studio · Wispr Flow" />
        </Link>

        {/* Navigation Section */}
        <div className="p-3">
          <div className="text-[10px] font-mono font-medium text-tertiary uppercase tracking-wider px-2 py-1">
            Studio Capabilities
          </div>
          <nav className="mt-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-accent-subtle text-accent border border-accent/20 font-semibold"
                      : "text-secondary hover:text-primary hover:bg-surface-subtle"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-accent" : "text-tertiary group-hover:text-primary"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          isActive
                            ? "bg-accent text-surface"
                            : "bg-surface-subtle text-tertiary border border-border"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-tertiary/80">{item.reqTag}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Footer in Rail */}
      <div className="p-3 border-t border-border bg-surface space-y-2">
        <Link
          href="/how-it-works"
          className="flex items-center justify-between px-2 py-1.5 rounded text-[11px] text-secondary hover:text-primary hover:bg-surface-subtle transition-colors border border-border font-mono"
        >
          <span>Capability Matrix</span>
          <ChevronRight className="w-3.5 h-3.5 text-tertiary" />
        </Link>
        <div className="px-2 py-1 text-[10px] text-tertiary font-mono flex items-center justify-between">
          <span>Active Project: Ep. 42</span>
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
        </div>
      </div>
    </aside>
  );
}
