"use client";

import { useState } from "react";
import { NavRail } from "@/components/studio/nav-rail";
import { TopBar } from "@/components/studio/top-bar";
import { VoiceCommandBar } from "@/components/studio/voice-command-bar";
import { VoiceStudioModal } from "@/components/studio/voice-studio-modal";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-primary flex">
      {/* Left Navigation Rail */}
      <NavRail />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24">
        {/* Top Bar with Project Switcher & Status */}
        <TopBar onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)} />

        {/* Dynamic Studio Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>

        {/* Persistent Global Voice Command Bar */}
        <VoiceCommandBar onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)} />

        {/* Voice Studio Drawer / Modal */}
        <VoiceStudioModal
          isOpen={isVoiceStudioOpen}
          onClose={() => setIsVoiceStudioOpen(false)}
        />
      </div>
    </div>
  );
}
