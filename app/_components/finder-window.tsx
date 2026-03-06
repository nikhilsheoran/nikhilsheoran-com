"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import { WindowControls } from "@/app/_components/window-controls";
import {
  getFileSystem,
  getPathForSidebarItem,
  listDirectory,
  breadcrumbs,
  type FSNode,
} from "@/lib/virtual-fs";
import styles from "./finder-window.module.css";

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

const DEFAULT_PATH = getPathForSidebarItem("Projects");

// ---------------------------------------------------------------------------
// Sidebar icon components — modeled after macOS Finder SF Symbols
// ---------------------------------------------------------------------------

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5V8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSharedFolder() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.6" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.2 13c.5-2 2-3.2 3.8-3.2s3.3 1.2 3.8 3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconAppGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="2" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="9.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IconDesktop() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="8.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 13.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 11v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 2.5h5.5L13 6v7.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 2.5V6H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5v6M5.5 8.5 8 11l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M1.75 4.5c0-.69.56-1.25 1.25-1.25h3l1.5 1.5h5.5c.69 0 1.25.56 1.25 1.25v6c0 .69-.56 1.25-1.25 1.25H3c-.69 0-1.25-.56-1.25-1.25v-7.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="6" r="1.25" stroke="currentColor" strokeWidth="1.1" />
      <path d="M1.75 11l3.25-3 2.5 2 3-3.5 3.75 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCloud() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4.5 12.5A3 3 0 0 1 3 6.8a4 4 0 0 1 7.8-1.1A3.5 3.5 0 0 1 12.5 12.5h-8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function IconHouse() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 7.5 8 3l5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.75 8.5v4.75h8.5V8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6.25" y="10" width="3.5" height="3.25" rx="0.4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconLaptop() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="3" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 12.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Map sidebar item name → { icon component, color }
const sidebarIconMap: Record<string, { icon: React.FC; color: string }> = {
  Recents: { icon: IconClock, color: "#007aff" },
  Shared: { icon: IconSharedFolder, color: "#007aff" },
  Applications: { icon: IconAppGrid, color: "#007aff" },
  Desktop: { icon: IconDesktop, color: "#007aff" },
  Documents: { icon: IconDocument, color: "#007aff" },
  Downloads: { icon: IconArrowDown, color: "#007aff" },
  Projects: { icon: IconFolder, color: "#007aff" },
  Pictures: { icon: IconImage, color: "#007aff" },
  "iCloud Drive": { icon: IconCloud, color: "#5e5e5e" },
  nikhilsheoran: { icon: IconHouse, color: "#5e5e5e" },
  "Nikhil's MacBook Pro": { icon: IconLaptop, color: "#5e5e5e" },
};

// ---------------------------------------------------------------------------
// File row icon components
// ---------------------------------------------------------------------------

/** macOS blue folder icon — proper folder tab shape */
function FolderIcon16() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden className={styles.rowIconSvg}>
      <path
        d="M1 5C1 3.89543 1.89543 3 3 3H7.17157C7.70201 3 8.21071 3.21071 8.58579 3.58579L9.41421 4.41421C9.78929 4.78929 10.298 5 10.8284 5H17C18.1046 5 19 5.89543 19 7V14C19 15.1046 18.1046 16 17 16H3C1.89543 16 1 15.1046 1 14V5Z"
        fill="url(#folderGrad)"
      />
      <path
        d="M1 5C1 3.89543 1.89543 3 3 3H7.17157C7.70201 3 8.21071 3.21071 8.58579 3.58579L9.41421 4.41421C9.78929 4.78929 10.298 5 10.8284 5H17C18.1046 5 19 5.89543 19 7V14C19 15.1046 18.1046 16 17 16H3C1.89543 16 1 15.1046 1 14V5Z"
        stroke="#2489D1"
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />
      <defs>
        <linearGradient id="folderGrad" x1="10" y1="3" x2="10" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6DC5F7" />
          <stop offset="1" stopColor="#3CA0E6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Generic document icon with a page curl */
function DocIcon16() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden className={styles.rowIconSvg}>
      <path
        d="M2 1.5A1.5 1.5 0 0 1 3.5 0h6.379a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 14.5 4.62V18.5A1.5 1.5 0 0 1 13 20H3.5A1.5 1.5 0 0 1 2 18.5V1.5Z"
        fill="#E8E8E8"
        stroke="#C8C8C8"
        strokeWidth="0.6"
      />
      <path d="M9.5 0v3.5a1 1 0 0 0 1 1H14" stroke="#C0C0C0" strokeWidth="0.6" />
      <path d="M5 9h6.5M5 12h6.5M5 15h4" stroke="#AEAEAE" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}

/** App icon — rounded rect with gradient */
function AppIcon16() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className={styles.rowIconSvg}>
      <rect x="1" y="1" width="16" height="16" rx="4" fill="url(#appGrad)" stroke="#7444C9" strokeWidth="0.4" strokeOpacity="0.3" />
      <path d="M6 9h6M9 6v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <defs>
        <linearGradient id="appGrad" x1="9" y1="1" x2="9" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B8A3F8" />
          <stop offset="1" stopColor="#7C5DE6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Small folder icon for breadcrumbs */
function BreadcrumbFolderIcon() {
  return (
    <svg width="12" height="11" viewBox="0 0 12 11" fill="none" aria-hidden className={styles.breadcrumbIcon}>
      <path
        d="M0.5 2.5C0.5 1.94772 0.947715 1.5 1.5 1.5H4.08579C4.35101 1.5 4.60536 1.60536 4.79289 1.79289L5.20711 2.20711C5.39464 2.39464 5.649 2.5 5.91421 2.5H10.5C11.0523 2.5 11.5 2.94772 11.5 3.5V8.5C11.5 9.05228 11.0523 9.5 10.5 9.5H1.5C0.947715 9.5 0.5 9.05228 0.5 8.5V2.5Z"
        fill="#65B5F4"
        stroke="#3D9ADB"
        strokeWidth="0.35"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Nav arrow icons (proper chevrons, no circle)
// ---------------------------------------------------------------------------

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Toolbar icons (right side)
// ---------------------------------------------------------------------------

function IconListView() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3 4.5h12M3 9h12M3 13.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.5 4.5V4M15.5 9v-.5M15.5 13.5V13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconEllipsis() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="4.5" cy="9" r="1.25" fill="currentColor" />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" />
      <circle cx="13.5" cy="9" r="1.25" fill="currentColor" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="7.8" cy="7.8" r="5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11.5 11.5L15.5 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sidebar groups
// ---------------------------------------------------------------------------

const sidebarGroups = [
  {
    title: "",
    items: ["Recents", "Shared"],
  },
  {
    title: "Favorites",
    items: ["Applications", "Desktop", "Documents", "Downloads", "Projects", "Pictures"],
  },
  {
    title: "Locations",
    items: ["iCloud Drive", "nikhilsheoran", "Nikhil's MacBook Pro"],
  },
] as const;

/** Reverse-lookup: given a path, find which sidebar item it maps to (if any). */
function sidebarItemForPath(path: string): string | null {
  for (const group of sidebarGroups) {
    for (const item of group.items) {
      if (getPathForSidebarItem(item) === path) return item;
    }
  }
  return null;
}

interface FinderWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate?: () => void;
  zIndex?: number;
}

export function FinderWindow({ isOpen, onClose, onActivate, zIndex }: FinderWindowProps) {
  const getBounds = useCallback((windowSize: WindowSize) => {
    return {
      minX: -(windowSize.width - WINDOW_VISIBLE_EDGE),
      maxX: window.innerWidth - WINDOW_VISIBLE_EDGE,
      minY: MENU_BAR_HEIGHT + 8,
      maxY: window.innerHeight - DOCK_RESERVED_HEIGHT - WINDOW_VISIBLE_TOP,
    };
  }, []);

  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 72, y: 70 },
    getBounds,
    disabled: !isOpen,
  });

  // --- Navigation state ---
  const [currentPath, setCurrentPath] = useState(DEFAULT_PATH);
  const [history, setHistory] = useState<string[]>([DEFAULT_PATH]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // --- Search state ---
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Derived data ---
  const fs = useMemo(() => getFileSystem(), []);
  const directoryContents = useMemo(() => listDirectory(fs, currentPath), [fs, currentPath]);
  const filteredContents = useMemo(() => {
    if (!searchActive || !searchQuery.trim()) return directoryContents;
    const q = searchQuery.trim().toLowerCase();
    return directoryContents.filter((n) => n.name.toLowerCase().includes(q));
  }, [directoryContents, searchActive, searchQuery]);
  const crumbs = useMemo(() => breadcrumbs(currentPath), [currentPath]);
  const activeSidebarItem = useMemo(() => sidebarItemForPath(currentPath), [currentPath]);

  /** The name shown in the top bar — last path segment */
  const pathTitle = crumbs.length > 0 ? crumbs[crumbs.length - 1].name : "/";

  // --- Navigation helpers ---
  const navigateTo = useCallback(
    (path: string) => {
      setCurrentPath(path);
      setSelectedRow(null);
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(path);
        return next;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCurrentPath(history[newIndex]);
    setSelectedRow(null);
  }, [canGoBack, historyIndex, history]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setCurrentPath(history[newIndex]);
    setSelectedRow(null);
  }, [canGoForward, historyIndex, history]);

  const handleSidebarClick = useCallback(
    (item: string) => {
      const path = getPathForSidebarItem(item);
      navigateTo(path);
    },
    [navigateTo],
  );

  const handleRowClick = useCallback((node: FSNode) => {
    setSelectedRow(node.name);
  }, []);

  const handleRowDoubleClick = useCallback(
    (node: FSNode) => {
      if (node.kind === "directory") {
        if (node.url) {
          window.open(node.url, "_blank", "noopener");
        } else {
          navigateTo(node.path);
        }
      } else if (node.kind === "file") {
        if (node.url) {
          window.open(node.url, "_blank", "noopener");
        }
      }
    },
    [navigateTo],
  );

  const toggleSearch = useCallback(() => {
    setSearchActive((prev) => {
      if (!prev) {
        // Opening — focus input after render
        setTimeout(() => searchInputRef.current?.focus(), 0);
      } else {
        setSearchQuery("");
      }
      return !prev;
    });
  }, []);

  const dismissSearch = useCallback(() => {
    setSearchActive(false);
    setSearchQuery("");
  }, []);

  // Dismiss search on Escape
  useEffect(() => {
    if (!searchActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchActive, dismissSearch]);

  if (!isOpen) return null;

  return (
    <section
      ref={windowRef}
      className={styles.window}
      onPointerDownCapture={onActivate}
      style={{
        width: "min(1280px, calc(100vw - 84px))",
        height: "min(620px, calc(100vh - 126px))",
        zIndex,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <div className={styles.layout}>
        {/* ======================== SIDEBAR ======================== */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} windowName="Finder" />
          </div>

          <div className={styles.sidebarScroll}>
            {sidebarGroups.map((group) => (
              <div key={group.title || "root"} className={styles.sidebarGroup}>
                {group.title ? <p className={styles.groupTitle}>{group.title}</p> : null}
                {group.items.map((item) => {
                  const isActive = activeSidebarItem === item;
                  const iconEntry = sidebarIconMap[item];
                  const SidebarIcon = iconEntry?.icon;

                  return (
                    <button
                      key={item}
                      type="button"
                      data-window-drag-ignore
                      onClick={() => handleSidebarClick(item)}
                      className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ""}`}
                    >
                      {SidebarIcon && (
                        <span className={styles.sidebarIcon}>
                          <SidebarIcon />
                        </span>
                      )}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* ======================== CONTENT ======================== */}
        <main className={styles.content}>
          <header className={styles.topBar} onPointerDown={handleDragStart}>
            <div className={styles.pathHeader}>
              <div className={styles.navGroup}>
                <button
                  type="button"
                  className={`${styles.navButton} ${!canGoBack ? styles.navButtonDisabled : ""}`}
                  data-window-drag-ignore
                  aria-label="Back"
                  onClick={goBack}
                  disabled={!canGoBack}
                >
                  <ChevronLeft />
                </button>
                <span className={styles.navSeparator} />
                <button
                  type="button"
                  className={`${styles.navButton} ${!canGoForward ? styles.navButtonDisabled : ""}`}
                  data-window-drag-ignore
                  aria-label="Forward"
                  onClick={goForward}
                  disabled={!canGoForward}
                >
                  <ChevronRight />
                </button>
              </div>
              {searchActive ? (
                <div className={styles.searchBar} data-window-drag-ignore>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden className={styles.searchBarIcon}>
                    <circle cx="7.8" cy="7.8" r="5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M11.5 11.5L15.5 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder={`Search "${pathTitle}"`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-window-drag-ignore
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className={styles.searchClearBtn}
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      data-window-drag-ignore
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <circle cx="7" cy="7" r="6" fill="rgba(0,0,0,0.15)" />
                        <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <p className={styles.pathTitle}>{pathTitle}</p>
              )}
            </div>

            <div className={styles.toolbarActions}>
              <button
                type="button"
                className={styles.toolbarButton}
                data-window-drag-ignore
                aria-label="List view"
              >
                <IconListView />
              </button>
              <button
                type="button"
                className={styles.toolbarButton}
                data-window-drag-ignore
                aria-label="More actions"
              >
                <IconEllipsis />
              </button>
              <button
                type="button"
                className={`${styles.toolbarButton} ${searchActive ? styles.toolbarButtonActive : ""}`}
                data-window-drag-ignore
                aria-label={searchActive ? "Close search" : "Search"}
                onClick={toggleSearch}
              >
                <IconSearch />
              </button>
            </div>
          </header>

          {/* ======================== TABLE ======================== */}
          <section className={styles.tableWrap}>
            <div className={styles.tableHeader}>
              <span>Name</span>
              <span>Date Modified</span>
              <span>Size</span>
              <span>Kind</span>
            </div>

            <div className={styles.tableBody}>
              {filteredContents.length === 0 && (
                <div className={styles.emptyState}>
                  <p>{searchActive && searchQuery ? `No results for "${searchQuery}"` : "This folder is empty"}</p>
                </div>
              )}
              {filteredContents.map((node) => (
                <button
                  key={node.name}
                  type="button"
                  data-window-drag-ignore
                  onClick={() => handleRowClick(node)}
                  onDoubleClick={() => handleRowDoubleClick(node)}
                  className={`${styles.tableRow} ${selectedRow === node.name ? styles.tableRowActive : ""}`}
                >
                  <span className={styles.fileName}>
                    <span className={styles.rowIcon}>
                      {node.kind === "directory" ? (
                        <FolderIcon16 />
                      ) : node.kind === "file" && node.fileKind === "Application" ? (
                        <AppIcon16 />
                      ) : (
                        <DocIcon16 />
                      )}
                    </span>
                    {node.name}
                  </span>
                  <span>{node.dateModified}</span>
                  <span>{node.kind === "file" ? node.size : "--"}</span>
                  <span>{node.kind === "directory" ? "Folder" : node.fileKind}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ======================== FOOTER ======================== */}
          <footer className={styles.footer}>
            <div className={styles.footerBreadcrumb}>
              {crumbs.map((crumb, i) => (
                <span key={crumb.path} className={styles.breadcrumbSegment}>
                  {i > 0 && <span className={styles.breadcrumbSep}>&gt;</span>}
                  <BreadcrumbFolderIcon />
                  <span>{i === 0 ? "Macintosh HD" : crumb.name}</span>
                </span>
              ))}
            </div>
            <div className={styles.footerInfo}>
              {searchActive && searchQuery
                ? `${filteredContents.length} of ${directoryContents.length} item${directoryContents.length !== 1 ? "s" : ""}`
                : `${directoryContents.length} item${directoryContents.length !== 1 ? "s" : ""}, 313.3 GB available`}
            </div>
          </footer>
        </main>
      </div>
    </section>
  );
}
