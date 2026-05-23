"use client";

import { useEffect } from "react";
import { create } from "zustand";
import {
  getDesktopAppName,
  isDesktopAppId,
  type DesktopAppId,
} from "@/lib/desktop-apps";
import {
  getFirstNoteSlugForFolder,
  getFolderById,
  getNoteRoutePath,
  getPreferredFolderIdForNote,
  folderContainsNote,
  type NotesData,
} from "@/lib/mock-desktop-data";

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const normalized =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;
  return normalized || "/";
}

function parseDesktopPath(pathname: string): {
  appId: string;
  noteSlug: string | null;
} {
  const segments = normalizePathname(pathname)
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  const appId = segments[0] ?? "finder";
  const noteSlug = appId === "notes" ? segments[1] ?? null : null;
  return { appId, noteSlug };
}

function activateInStack(
  stack: DesktopAppId[],
  appId: DesktopAppId
): DesktopAppId[] {
  return [...stack.filter((item) => item !== appId), appId];
}

// ── Types ───────────────────────────────────────────────────────────────────

interface DesktopState {
  // Window management
  windowStack: DesktopAppId[];
  pathname: string;

  // Notes selection
  selectedFolderId: string;
  selectedNoteSlug: string | null;

  // Data reference (set once at init)
  notesData: NotesData | null;
}

interface DesktopActions {
  // Initialization
  init: (notesData: NotesData, initialPathname: string) => void;

  // Navigation
  navigate: (pathname: string, options?: { replace?: boolean }) => void;

  // Window management
  openApp: (appId: DesktopAppId) => void;
  closeWindow: (appId: DesktopAppId) => void;
  activateWindow: (appId: DesktopAppId) => void;

  // Notes
  selectFolder: (folderId: string) => void;
  selectNote: (noteSlug: string) => void;

  // Sync URL → state (for popstate events)
  syncFromUrl: () => void;

  // Derived
  getActiveWindowId: () => DesktopAppId | null;
  getActiveAppName: () => string;
  isWindowOpen: (appId: DesktopAppId) => boolean;
  getResolvedNoteSlug: () => string | null;
  getSelectedFolder: () => ReturnType<typeof getFolderById>;
}

export type DesktopStore = DesktopState & DesktopActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  // Initial state
  windowStack: [],
  pathname: "/",
  selectedFolderId: "",
  selectedNoteSlug: null,
  notesData: null,

  // ── Initialization ──────────────────────────────────────────────────────

  init: (notesData, initialPathname) => {
    const route = parseDesktopPath(initialPathname);

    let selectedNoteSlug: string | null = notesData.defaultNoteSlug;
    if (
      route.appId === "notes" &&
      route.noteSlug &&
      notesData.notesBySlug[route.noteSlug]
    ) {
      selectedNoteSlug = route.noteSlug;
    }

    let windowStack: DesktopAppId[] = [];
    if (initialPathname !== "/" && isDesktopAppId(route.appId)) {
      windowStack = [route.appId];
    }

    set({
      notesData,
      pathname: normalizePathname(initialPathname),
      selectedFolderId: notesData.defaultFolderId,
      selectedNoteSlug,
      windowStack,
    });

    // Auto-open notes on root path
    if (initialPathname === "/") {
      const defaultSlug =
        notesData.defaultNoteSlug ?? "opendictate-readme";
      set({
        selectedNoteSlug: defaultSlug,
        windowStack: activateInStack([], "notes"),
        pathname: getNoteRoutePath(defaultSlug),
      });
      window.history.replaceState(null, "", getNoteRoutePath(defaultSlug));
    }
  },

  // ── Navigation ──────────────────────────────────────────────────────────

  navigate: (nextPathname, options) => {
    const normalized = normalizePathname(nextPathname);
    const current = get().pathname;
    if (normalized === current) return;

    if (options?.replace) {
      window.history.replaceState(null, "", normalized);
    } else {
      window.history.pushState(null, "", normalized);
    }

    set({ pathname: normalized });
    get().syncFromUrl();
  },

  // ── Window management ─────────────────────────────────────────────────

  openApp: (appId) => {
    const state = get();
    const wasOpen = state.windowStack.includes(appId);

    if (isDesktopAppId(appId)) {
      const nextStack = activateInStack(state.windowStack, appId);
      set({ windowStack: nextStack });

      if (appId === "notes") {
        const slug = state.getResolvedNoteSlug();
        const path = slug ? getNoteRoutePath(slug) : "/notes";
        state.navigate(path, { replace: wasOpen });
      } else {
        state.navigate(`/${appId}`, { replace: wasOpen });
      }
    }
  },

  closeWindow: (appId) => {
    const state = get();
    const nextStack = state.windowStack.filter((item) => item !== appId);
    set({ windowStack: nextStack });

    const nextActive = nextStack[nextStack.length - 1] ?? null;
    if (!nextActive) {
      state.navigate("/", { replace: true });
      return;
    }
    if (nextActive === "notes") {
      const slug = state.getResolvedNoteSlug();
      const path = slug ? getNoteRoutePath(slug) : "/notes";
      state.navigate(path, { replace: true });
      return;
    }
    state.navigate(`/${nextActive}`, { replace: true });
  },

  activateWindow: (appId) => {
    const state = get();
    if (state.getActiveWindowId() === appId) return;
    state.openApp(appId);
  },

  // ── Notes ─────────────────────────────────────────────────────────────

  selectFolder: (folderId) => {
    const state = get();
    if (!state.notesData) return;

    const firstNoteSlug = getFirstNoteSlugForFolder(
      state.notesData,
      folderId
    );
    const nextStack = activateInStack(state.windowStack, "notes");
    set({
      selectedFolderId: folderId,
      selectedNoteSlug: firstNoteSlug,
      windowStack: nextStack,
    });
    state.navigate(
      firstNoteSlug ? getNoteRoutePath(firstNoteSlug) : "/notes",
      { replace: true }
    );
  },

  selectNote: (noteSlug) => {
    const state = get();
    const nextStack = activateInStack(state.windowStack, "notes");
    set({
      selectedNoteSlug: noteSlug,
      windowStack: nextStack,
    });
    state.navigate(getNoteRoutePath(noteSlug), { replace: true });
  },

  // ── Sync URL → state ─────────────────────────────────────────────────

  syncFromUrl: () => {
    const state = get();
    const pathname = normalizePathname(window.location.pathname);
    const route = parseDesktopPath(pathname);

    if (pathname === "/") {
      set({ windowStack: [], pathname });
      return;
    }

    if (route.appId === "notes") {
      const nextStack = activateInStack(state.windowStack, "notes");
      const updates: Partial<DesktopState> = {
        windowStack: nextStack,
        pathname,
      };
      if (
        route.noteSlug &&
        state.notesData?.notesBySlug[route.noteSlug] &&
        route.noteSlug !== state.selectedNoteSlug
      ) {
        updates.selectedNoteSlug = route.noteSlug;
      }
      set(updates);
      return;
    }

    if (isDesktopAppId(route.appId)) {
      set({
        windowStack: activateInStack(state.windowStack, route.appId),
        pathname,
      });
      return;
    }

    set({ windowStack: [], pathname });
  },

  // ── Derived getters ───────────────────────────────────────────────────

  getActiveWindowId: () => {
    const stack = get().windowStack;
    return stack[stack.length - 1] ?? null;
  },

  getActiveAppName: () => {
    const state = get();
    const activeId = state.getActiveWindowId();
    if (activeId) return getDesktopAppName(activeId);
    const route = parseDesktopPath(state.pathname);
    return getDesktopAppName(
      state.pathname === "/" ? "finder" : route.appId
    );
  },

  isWindowOpen: (appId) => get().windowStack.includes(appId),

  getResolvedNoteSlug: () => {
    const state = get();
    if (!state.notesData) return null;
    const { selectedNoteSlug, notesData, selectedFolderId } = state;

    if (selectedNoteSlug && notesData.notesBySlug[selectedNoteSlug]) {
      return selectedNoteSlug;
    }

    const folder =
      getFolderById(notesData, selectedFolderId) ?? notesData.folders[0];
    return (
      getFirstNoteSlugForFolder(notesData, folder.id) ??
      notesData.defaultNoteSlug
    );
  },

  getSelectedFolder: () => {
    const state = get();
    if (!state.notesData) return null;
    return (
      getFolderById(state.notesData, state.selectedFolderId) ??
      state.notesData.folders[0]
    );
  },
}));

// ── Folder sync hook (keeps selected folder in sync with resolved note) ──

export function useSyncFolderToNote() {
  const notesData = useDesktopStore((s) => s.notesData);
  const selectedFolderId = useDesktopStore((s) => s.selectedFolderId);
  const windowStack = useDesktopStore((s) => s.windowStack);
  const resolvedNoteSlug = useDesktopStore((s) => s.getResolvedNoteSlug());
  const isNotesOpen = windowStack.includes("notes");

  // useEffect instead of running during render — calling setState during
  // render can interact badly with selectors that return new object refs
  // (e.g. getWindowZIndex) and cause infinite re-render loops.
  useEffect(() => {
    if (!isNotesOpen || !resolvedNoteSlug || !notesData) return;

    const folder =
      getFolderById(notesData, selectedFolderId) ?? notesData.folders[0];
    if (!folder) return;
    if (folderContainsNote(notesData, folder.id, resolvedNoteSlug)) return;

    const preferredFolderId =
      getPreferredFolderIdForNote(notesData, resolvedNoteSlug) ??
      notesData.defaultFolderId;
    if (preferredFolderId !== folder.id) {
      useDesktopStore.setState({ selectedFolderId: preferredFolderId });
    }
  }, [isNotesOpen, resolvedNoteSlug, notesData, selectedFolderId]);
}
