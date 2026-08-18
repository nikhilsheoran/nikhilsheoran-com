"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDraggableWindow } from "@/lib/use-draggable-window";
import { getDesktopWindowBounds, getDesktopWindowFrameStyle } from "@/lib/desktop-window";
import { WindowControls } from "@/app/_components/window-controls";
import {
  getFileSystem,
  getPathForSidebarItem,
  listDirectory,
  breadcrumbs,
  type FSNode,
} from "@/lib/virtual-fs";
import {
  sidebarIconMap,
  FolderIcon16,
  DocIcon16,
  AppIcon16,
  BreadcrumbFolderIcon,
  ChevronLeft,
  ChevronRight,
  IconListView,
  IconEllipsis,
  IconSearch,
} from "@/app/_components/finder/finder-icons";
import styles from "./finder-window.module.css";

const DEFAULT_PATH = getPathForSidebarItem("Projects");

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
  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 72, y: 70 },
    getBounds: getDesktopWindowBounds,
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
      style={getDesktopWindowFrameStyle({
        maxWidth: 1280,
        maxHeight: 620,
        heightGutter: 126,
        position,
        zIndex,
        isDragging,
      })}
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
