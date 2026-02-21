"use client";

import { useState } from "react";
import Image from "next/image";
import { Dock, type DockAppId } from "@/app/_components/dock";
import { NotesWindow } from "@/app/_components/notes-window";
import { TopBar } from "@/app/_components/top-bar";
import { useMediaQuery } from "@/lib/use-media-query";

export default function Home() {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const [isNotesWindowOpen, setIsNotesWindowOpen] = useState(true);

  const handleAppOpen = (appId: DockAppId) => {
    if (appId === "notes") {
      setIsNotesWindowOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 select-none">
      <Image
        src="/wallpapers/Sonoma.jpeg"
        alt="Background"
        fill
        className="-z-10 inset-0 object-cover"
      />
      <NotesWindow
        isOpen={isNotesWindowOpen}
        onClose={() => setIsNotesWindowOpen(false)}
      />
      <TopBar activeAppName={isNotesWindowOpen ? "Notes" : "Finder"} />
      <Dock
        disableMagnification={isMobile}
        runningApps={{ notes: isNotesWindowOpen }}
        onAppOpen={handleAppOpen}
      />
    </div>
  );
}
