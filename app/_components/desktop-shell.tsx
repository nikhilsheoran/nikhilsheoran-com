"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Dock, type DockAppId } from "@/app/_components/dock";
import { FinderWindow } from "@/app/_components/finder-window";
import { MusicWindow } from "@/app/_components/music-window";
import { NotesWindow } from "@/app/_components/notes-window";
import { SettingsWindow } from "@/app/_components/settings-window";
import { TVWindow } from "@/app/_components/tv-window";
import { TopBar } from "@/app/_components/top-bar";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  getDesktopMockData,
  getFirstNoteSlugForFolder,
  getFolderById,
  getNoteRoutePath,
  getPreferredFolderIdForNote,
  folderContainsNote,
} from "@/lib/mock-desktop-data";

type WindowAppId = "finder" | "notes" | "system-settings" | "music" | "tv";

const APP_NAME_BY_ID: Record<string, string> = {
  finder: "Finder",
  notes: "Notes",
  music: "Music",
  "system-settings": "System Settings",
  tv: "TV",
};

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return normalized || "/";
}

function parseDesktopPath(pathname: string): { appId: string; noteSlug: string | null } {
  const segments = normalizePathname(pathname)
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  const appId = segments[0] ?? "finder";
  const noteSlug = appId === "notes" ? segments[1] ?? null : null;
  return { appId, noteSlug };
}

function isWindowAppId(appId: string): appId is WindowAppId {
  return appId === "finder" || appId === "notes" || appId === "system-settings" || appId === "music" || appId === "tv";
}

function activateWindowInStack(stack: WindowAppId[], appId: WindowAppId): WindowAppId[] {
  return [...stack.filter((item) => item !== appId), appId];
}

function formatAppName(appId: string): string {
  if (APP_NAME_BY_ID[appId]) return APP_NAME_BY_ID[appId];
  if (!appId) return "Finder";
  return appId.charAt(0).toUpperCase() + appId.slice(1);
}

function useDesktopPathname(initialPathname: string) {
  const [pathname, setPathname] = useState(() => normalizePathname(initialPathname));

  useEffect(() => {
    const handlePopState = () => setPathname(normalizePathname(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback(
    (nextPathname: string, options?: { replace?: boolean }) => {
      const normalized = normalizePathname(nextPathname);
      if (normalized === pathname) return;

      if (options?.replace) {
        window.history.replaceState(null, "", normalized);
      } else {
        window.history.pushState(null, "", normalized);
      }

      setPathname(normalized);
    },
    [pathname],
  );

  return { pathname, navigate };
}

interface DesktopShellProps {
  initialPathname: string;
}

export function DesktopShell({ initialPathname }: DesktopShellProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const [desktopData] = useState(() => getDesktopMockData());
  const notesData = desktopData.notes;
  const initialRoute = useMemo(() => parseDesktopPath(initialPathname), [initialPathname]);
  const didAutoOpenRootRef = useRef(false);
  const [selectedFolderId, setSelectedFolderId] = useState(notesData.defaultFolderId);
  const [selectedNoteSlug, setSelectedNoteSlug] = useState<string | null>(() => {
    if (
      initialRoute.appId === "notes" &&
      initialRoute.noteSlug &&
      notesData.notesBySlug[initialRoute.noteSlug]
    ) {
      return initialRoute.noteSlug;
    }
    return notesData.defaultNoteSlug;
  });
  const [windowStack, setWindowStack] = useState<WindowAppId[]>(() => {
    if (initialPathname !== "/" && isWindowAppId(initialRoute.appId)) {
      return [initialRoute.appId];
    }
    return [];
  });
  const { pathname, navigate } = useDesktopPathname(initialPathname);
  const route = useMemo(() => parseDesktopPath(pathname), [pathname]);
  const activeWindowId = windowStack[windowStack.length - 1] ?? null;
  const selectedFolder = getFolderById(notesData, selectedFolderId) ?? notesData.folders[0];
  const resolvedNoteSlug =
    selectedNoteSlug && notesData.notesBySlug[selectedNoteSlug]
      ? selectedNoteSlug
      : getFirstNoteSlugForFolder(notesData, selectedFolder.id) ?? notesData.defaultNoteSlug;
  const selectedNote = resolvedNoteSlug ? notesData.notesBySlug[resolvedNoteSlug] ?? null : null;
  const isFinderWindowOpen = windowStack.includes("finder");
  const isNotesWindowOpen = windowStack.includes("notes");
  const isSystemSettingsWindowOpen = windowStack.includes("system-settings");
  const isMusicWindowOpen = windowStack.includes("music");
  const isTVWindowOpen = windowStack.includes("tv");

  const notePath = useCallback(
    (preferredSlug?: string | null) => {
      const slug =
        preferredSlug && notesData.notesBySlug[preferredSlug]
          ? preferredSlug
          : resolvedNoteSlug ?? notesData.defaultNoteSlug;
      return slug ? getNoteRoutePath(slug) : "/notes";
    },
    [notesData.defaultNoteSlug, notesData.notesBySlug, resolvedNoteSlug],
  );

  useEffect(() => {
    if (didAutoOpenRootRef.current) return;
    if (initialPathname !== "/") return;
    if (pathname !== "/") return;

    didAutoOpenRootRef.current = true;
    const defaultRootNoteSlug = notesData.defaultNoteSlug ?? "opendictate-readme";
    setSelectedNoteSlug(defaultRootNoteSlug);
    setWindowStack((current) => activateWindowInStack(current, "notes"));
    navigate(getNoteRoutePath(defaultRootNoteSlug), { replace: true });
  }, [initialPathname, navigate, notesData.defaultNoteSlug, pathname]);

  useEffect(() => {
    if (pathname === "/") {
      setWindowStack([]);
      return;
    }

    if (route.appId === "notes") {
      setWindowStack((current) => activateWindowInStack(current, "notes"));
      if (route.noteSlug && notesData.notesBySlug[route.noteSlug] && route.noteSlug !== selectedNoteSlug) {
        setSelectedNoteSlug(route.noteSlug);
      }
      return;
    }

    if (isWindowAppId(route.appId)) {
      const routeWindowId = route.appId;
      setWindowStack((current) => activateWindowInStack(current, routeWindowId));
      return;
    }

    setWindowStack([]);
  }, [notesData.notesBySlug, pathname, route.appId, route.noteSlug, selectedNoteSlug]);

  useEffect(() => {
    if (!isNotesWindowOpen || !resolvedNoteSlug) return;
    if (folderContainsNote(notesData, selectedFolder.id, resolvedNoteSlug)) return;

    const preferredFolderId =
      getPreferredFolderIdForNote(notesData, resolvedNoteSlug) ?? notesData.defaultFolderId;
    if (preferredFolderId !== selectedFolder.id) {
      setSelectedFolderId(preferredFolderId);
    }
  }, [isNotesWindowOpen, notesData, resolvedNoteSlug, selectedFolder.id]);

  const setActiveWindow = useCallback(
    (appId: WindowAppId, options?: { replace?: boolean }) => {
      setWindowStack((current) => activateWindowInStack(current, appId));
      if (appId === "notes") {
        navigate(notePath(), options);
        return;
      }
      navigate(`/${appId}`, options);
    },
    [navigate, notePath],
  );

  const handleWindowClose = useCallback(
    (appId: WindowAppId) => {
      const nextStack = windowStack.filter((item) => item !== appId);
      setWindowStack(nextStack);

      const nextActive = nextStack[nextStack.length - 1] ?? null;
      if (!nextActive) {
        navigate("/", { replace: true });
        return;
      }
      if (nextActive === "notes") {
        navigate(notePath(), { replace: true });
        return;
      }
      navigate(`/${nextActive}`, { replace: true });
    },
    [navigate, notePath, windowStack],
  );

  const handleAppOpen = useCallback(
    (appId: DockAppId) => {
      if (isWindowAppId(appId)) {
        const wasOpen = windowStack.includes(appId);
        setActiveWindow(appId, { replace: wasOpen });
        return;
      }

      setWindowStack([]);
      navigate(`/${appId}`);
    },
    [navigate, setActiveWindow, windowStack],
  );

  const handleFolderSelect = useCallback(
    (folderId: string) => {
      const firstNoteSlug = getFirstNoteSlugForFolder(notesData, folderId);
      setSelectedFolderId(folderId);
      setSelectedNoteSlug(firstNoteSlug);
      setWindowStack((current) => activateWindowInStack(current, "notes"));
      navigate(firstNoteSlug ? getNoteRoutePath(firstNoteSlug) : "/notes", { replace: true });
    },
    [navigate, notesData],
  );

  const handleNoteSelect = useCallback(
    (noteSlug: string) => {
      setSelectedNoteSlug(noteSlug);
      setWindowStack((current) => activateWindowInStack(current, "notes"));
      navigate(getNoteRoutePath(noteSlug), { replace: true });
    },
    [navigate],
  );

  const handleWindowActivate = useCallback(
    (appId: WindowAppId) => {
      if (activeWindowId === appId) return;
      setActiveWindow(appId, { replace: true });
    },
    [activeWindowId, setActiveWindow],
  );

  const windowZIndex = useMemo(() => {
    const baseZIndex = 40;
    const zIndexByWindow: Record<WindowAppId, number> = {
      finder: baseZIndex,
      notes: baseZIndex,
      "system-settings": baseZIndex,
      music: baseZIndex,
      tv: baseZIndex,
    };
    windowStack.forEach((appId, index) => {
      zIndexByWindow[appId] = baseZIndex + index;
    });
    return zIndexByWindow;
  }, [windowStack]);

  const activeAppName = activeWindowId
    ? formatAppName(activeWindowId)
    : formatAppName(pathname === "/" ? "finder" : route.appId);

  return (
    <div className="fixed inset-0 select-none">
      <Image
        src="/wallpapers/Sonoma.jpeg"
        alt="Background"
        fill
        className="-z-10 inset-0 object-cover"
      />
      <FinderWindow
        isOpen={isFinderWindowOpen}
        onClose={() => handleWindowClose("finder")}
        onActivate={() => handleWindowActivate("finder")}
        zIndex={windowZIndex.finder}
      />
      <NotesWindow
        isOpen={isNotesWindowOpen}
        notesData={notesData}
        selectedFolderId={selectedFolder.id}
        selectedNoteSlug={selectedNote?.slug ?? null}
        onFolderSelect={handleFolderSelect}
        onNoteSelect={handleNoteSelect}
        onClose={() => handleWindowClose("notes")}
        onActivate={() => handleWindowActivate("notes")}
        zIndex={windowZIndex.notes}
      />
      <SettingsWindow
        isOpen={isSystemSettingsWindowOpen}
        onClose={() => handleWindowClose("system-settings")}
        onActivate={() => handleWindowActivate("system-settings")}
        zIndex={windowZIndex["system-settings"]}
      />
      <MusicWindow
        isOpen={isMusicWindowOpen}
        onClose={() => handleWindowClose("music")}
        onActivate={() => handleWindowActivate("music")}
        zIndex={windowZIndex.music}
      />
      <TVWindow
        isOpen={isTVWindowOpen}
        onClose={() => handleWindowClose("tv")}
        onActivate={() => handleWindowActivate("tv")}
        zIndex={windowZIndex.tv}
      />
      <TopBar activeAppName={activeAppName} />
      <Dock
        disableMagnification={isMobile}
        runningApps={{
          finder: isFinderWindowOpen,
          notes: isNotesWindowOpen,
          "system-settings": isSystemSettingsWindowOpen,
          music: isMusicWindowOpen,
          tv: isTVWindowOpen,
        }}
        onAppOpen={handleAppOpen}
      />
    </div>
  );
}
