"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Dock, type DockAppId } from "@/app/_components/dock";
import { TopBar } from "@/app/_components/top-bar";
import { MobileNotes } from "@/app/_components/mobile-notes";
import { useMediaQuery } from "@/lib/use-media-query";
import { useMusicPlayer } from "@/lib/use-music-player";
import { isDesktopAppId, type DesktopAppId } from "@/lib/desktop-apps";
import { useDesktopStore, useSyncFolderToNote } from "@/lib/stores/desktop-store";
import type { NotesData } from "@/lib/mock-desktop-data";

// Lazy-load window components — only loaded when first opened
const FinderWindow = dynamic(() => import("@/app/_components/finder-window").then((m) => ({ default: m.FinderWindow })), { ssr: false });
const NotesWindow = dynamic(() => import("@/app/_components/notes-window").then((m) => ({ default: m.NotesWindow })), { ssr: false });
const SettingsWindow = dynamic(() => import("@/app/_components/settings-window").then((m) => ({ default: m.SettingsWindow })), { ssr: false });
const MusicWindow = dynamic(() => import("@/app/_components/music-window").then((m) => ({ default: m.MusicWindow })), { ssr: false });
const TVWindow = dynamic(() => import("@/app/_components/tv-window").then((m) => ({ default: m.TVWindow })), { ssr: false });

interface DesktopShellProps {
  initialPathname: string;
  notesData: NotesData;
}

export function DesktopShell({ initialPathname, notesData }: DesktopShellProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const didInitRef = useRef(false);

  // ── Initialize store once ──
  const init = useDesktopStore((s) => s.init);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    init(notesData, initialPathname);
  }, [init, notesData, initialPathname]);

  // ── Popstate listener ──
  const syncFromUrl = useDesktopStore((s) => s.syncFromUrl);
  useEffect(() => {
    const handler = () => syncFromUrl();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [syncFromUrl]);

  // ── Keep folder in sync with active note ──
  useSyncFolderToNote();

  // ── Store selectors ──
  const windowStack = useDesktopStore((s) => s.windowStack);
  const selectedFolderId = useDesktopStore((s) => s.selectedFolderId);
  const selectedNoteSlug = useDesktopStore((s) => s.selectedNoteSlug);
  const openApp = useDesktopStore((s) => s.openApp);
  const closeWindow = useDesktopStore((s) => s.closeWindow);
  const activateWindow = useDesktopStore((s) => s.activateWindow);
  const selectFolder = useDesktopStore((s) => s.selectFolder);
  const selectNote = useDesktopStore((s) => s.selectNote);

  // Derive primitives inline (stable references for useSyncExternalStore)
  const activeWindowId = useDesktopStore(
    (s) => s.windowStack[s.windowStack.length - 1] ?? null,
  );
  const activeAppName = useDesktopStore((s) => s.getActiveAppName());
  const resolvedNoteSlug = useDesktopStore((s) => s.getResolvedNoteSlug());

  // Compute zIndex with useMemo — getWindowZIndex() creates a new object
  // on every call which breaks useSyncExternalStore's reference equality.
  const zIndex = useMemo(() => {
    const baseZ = 40;
    const zMap: Record<DesktopAppId, number> = {
      finder: baseZ,
      notes: baseZ,
      "system-settings": baseZ,
      music: baseZ,
      tv: baseZ,
    };
    windowStack.forEach((appId, i) => {
      zMap[appId] = baseZ + i;
    });
    return zMap;
  }, [windowStack]);

  // ── Music player (lifted for TopBar now-playing) ──
  const musicPlayer = useMusicPlayer();
  const isMusicOpen = windowStack.includes("music");

  // Pause music when window closes
  useEffect(() => {
    if (!isMusicOpen) musicPlayer.pause();
  }, [isMusicOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Window open flags ──
  const isFinderOpen = windowStack.includes("finder");
  const isNotesOpen = windowStack.includes("notes");
  const isSettingsOpen = windowStack.includes("system-settings");
  const isTVOpen = windowStack.includes("tv");

  // ── Running apps for dock indicator ──
  const runningApps = useMemo(
    () => ({
      finder: isFinderOpen,
      notes: isNotesOpen,
      "system-settings": isSettingsOpen,
      music: isMusicOpen,
      tv: isTVOpen,
    }),
    [isFinderOpen, isNotesOpen, isSettingsOpen, isMusicOpen, isTVOpen],
  );

  const handleAppOpen = (appId: DockAppId) => {
    if (isDesktopAppId(appId)) {
      openApp(appId);
    }
  };

  // ── Mobile view ──
  if (isMobile) {
    return (
      <div className="fixed inset-0">
        <Image
          src="/wallpapers/Sonoma.jpeg"
          alt="Background"
          fill
          priority
          className="-z-10 inset-0 object-cover"
        />
        <MobileNotes
          notesData={notesData}
          selectedNoteSlug={resolvedNoteSlug}
          onNoteSelect={selectNote}
        />
      </div>
    );
  }

  // ── Desktop view ──
  return (
    <div className="fixed inset-0 select-none">
      <Image
        src="/wallpapers/Sonoma.jpeg"
        alt="Background"
        fill
        priority
        className="-z-10 inset-0 object-cover"
      />

      {isFinderOpen && (
        <FinderWindow
          isOpen
          onClose={() => closeWindow("finder")}
          onActivate={() => activateWindow("finder")}
          zIndex={zIndex.finder}
        />
      )}

      {isNotesOpen && (
        <NotesWindow
          isOpen
          notesData={notesData}
          selectedFolderId={selectedFolderId}
          selectedNoteSlug={resolvedNoteSlug}
          onFolderSelect={selectFolder}
          onNoteSelect={selectNote}
          onClose={() => closeWindow("notes")}
          onActivate={() => activateWindow("notes")}
          zIndex={zIndex.notes}
        />
      )}

      {isSettingsOpen && (
        <SettingsWindow
          isOpen
          onClose={() => closeWindow("system-settings")}
          onActivate={() => activateWindow("system-settings")}
          zIndex={zIndex["system-settings"]}
        />
      )}

      {isMusicOpen && (
        <MusicWindow
          isOpen
          onClose={() => closeWindow("music")}
          onActivate={() => activateWindow("music")}
          zIndex={zIndex.music}
          player={musicPlayer}
        />
      )}

      {isTVOpen && (
        <TVWindow
          isOpen
          onClose={() => closeWindow("tv")}
          onActivate={() => activateWindow("tv")}
          zIndex={zIndex.tv}
        />
      )}

      <TopBar
        activeAppName={activeAppName}
        onOpenSettings={() => openApp("system-settings")}
        onOpenAbout={() => openApp("system-settings")}
        onCloseActiveWindow={() => {
          if (activeWindowId) closeWindow(activeWindowId);
        }}
        nowPlaying={
          musicPlayer.currentSong
            ? {
                title: musicPlayer.currentSong.title,
                artist: musicPlayer.currentSong.artist,
                artworkUrl: musicPlayer.currentSong.artworkUrl,
                isPlaying: musicPlayer.isPlaying,
              }
            : null
        }
        onMusicPrev={musicPlayer.prev}
        onMusicNext={musicPlayer.next}
        onMusicToggle={() => musicPlayer.togglePlay()}
      />

      <Dock
        disableMagnification={isMobile}
        runningApps={runningApps}
        onAppOpen={handleAppOpen}
      />
    </div>
  );
}
