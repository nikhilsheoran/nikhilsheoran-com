"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Dock, type DockAppId } from "@/app/_components/dock";
import { NotesWindow } from "@/app/_components/notes-window";
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

const APP_NAME_BY_ID: Record<string, string> = {
  finder: "Finder",
  notes: "Notes",
  messages: "Messages",
  music: "Music",
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
  const didAutoOpenRootRef = useRef(false);
  const [selectedFolderId, setSelectedFolderId] = useState(notesData.defaultFolderId);
  const { pathname, navigate } = useDesktopPathname(initialPathname);
  const route = useMemo(() => parseDesktopPath(pathname), [pathname]);
  const isNotesWindowOpen = route.appId === "notes";
  const selectedFolder = getFolderById(notesData, selectedFolderId) ?? notesData.folders[0];
  const routeNoteSlug =
    route.noteSlug && notesData.notesBySlug[route.noteSlug] ? route.noteSlug : null;
  const fallbackNoteSlug = getFirstNoteSlugForFolder(notesData, selectedFolder.id) ?? notesData.defaultNoteSlug;
  const selectedNoteSlug = isNotesWindowOpen ? routeNoteSlug ?? fallbackNoteSlug : null;
  const selectedNote = selectedNoteSlug ? notesData.notesBySlug[selectedNoteSlug] ?? null : null;

  useEffect(() => {
    if (didAutoOpenRootRef.current) return;
    if (initialPathname !== "/") return;
    if (pathname !== "/") return;

    didAutoOpenRootRef.current = true;
    const defaultRootNoteSlug = notesData.defaultNoteSlug ?? "opendictate-readme";
    navigate(getNoteRoutePath(defaultRootNoteSlug), { replace: true });
  }, [initialPathname, navigate, notesData.defaultNoteSlug, pathname]);

  useEffect(() => {
    if (!isNotesWindowOpen || !selectedNoteSlug) return;
    if (folderContainsNote(notesData, selectedFolder.id, selectedNoteSlug)) return;

    const preferredFolderId =
      getPreferredFolderIdForNote(notesData, selectedNoteSlug) ?? notesData.defaultFolderId;
    if (preferredFolderId !== selectedFolder.id) {
      setSelectedFolderId(preferredFolderId);
    }
  }, [isNotesWindowOpen, notesData, selectedFolder.id, selectedNoteSlug]);

  useEffect(() => {
    if (!isNotesWindowOpen || !selectedNoteSlug) return;
    const canonicalPath = getNoteRoutePath(selectedNoteSlug);
    if (pathname !== canonicalPath) {
      navigate(canonicalPath, { replace: true });
    }
  }, [isNotesWindowOpen, navigate, pathname, selectedNoteSlug]);

  const handleAppOpen = useCallback(
    (appId: DockAppId) => {
      if (appId === "notes") {
        const nextNoteSlug = selectedNoteSlug ?? notesData.defaultNoteSlug;
        navigate(nextNoteSlug ? getNoteRoutePath(nextNoteSlug) : "/notes");
        return;
      }

      navigate(`/${appId}`);
    },
    [navigate, notesData.defaultNoteSlug, selectedNoteSlug],
  );

  const handleFolderSelect = useCallback(
    (folderId: string) => {
      setSelectedFolderId(folderId);
      const firstNoteSlug = getFirstNoteSlugForFolder(notesData, folderId);
      navigate(firstNoteSlug ? getNoteRoutePath(firstNoteSlug) : "/notes");
    },
    [navigate, notesData],
  );

  const handleNoteSelect = useCallback(
    (noteSlug: string) => {
      navigate(getNoteRoutePath(noteSlug));
    },
    [navigate],
  );

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
        notesData={notesData}
        selectedFolderId={selectedFolder.id}
        selectedNoteSlug={selectedNote?.slug ?? null}
        onFolderSelect={handleFolderSelect}
        onNoteSelect={handleNoteSelect}
        onClose={() => navigate("/")}
      />
      <TopBar activeAppName={formatAppName(route.appId)} />
      <Dock
        disableMagnification={isMobile}
        runningApps={{ notes: isNotesWindowOpen }}
        onAppOpen={handleAppOpen}
      />
    </div>
  );
}
