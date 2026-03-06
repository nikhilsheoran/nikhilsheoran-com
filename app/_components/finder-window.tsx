"use client";

import { useCallback, useState } from "react";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import { WindowControls } from "@/app/_components/window-controls";
import styles from "./finder-window.module.css";

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

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

const fileRows = [
  { name: "superclarity", modified: "Today at 4:43 PM", size: "--", kind: "Folder" },
  { name: "nikhilsheoran-com", modified: "Today at 2:27 PM", size: "--", kind: "Folder" },
  { name: "playground-macos", modified: "Today at 12:45 PM", size: "--", kind: "Folder" },
  { name: "alanagoyal", modified: "Yesterday at 7:14 PM", size: "--", kind: "Folder" },
  { name: "spot-the-scam", modified: "Yesterday at 4:05 PM", size: "--", kind: "Folder" },
  { name: "nullclaw", modified: "Yesterday at 7:51 AM", size: "--", kind: "Folder" },
  { name: "twenty", modified: "19 Feb 2026 at 5:52 AM", size: "--", kind: "Folder" },
  { name: "citerank", modified: "18 Feb 2026 at 5:53 PM", size: "--", kind: "Folder" },
  { name: "dhcp_capture.pcap", modified: "17 Feb 2026 at 4:26 AM", size: "2 KB", kind: "Packet Capture" },
  { name: "dhcp_capture.sh", modified: "17 Feb 2026 at 4:23 AM", size: "2 KB", kind: "Terminal script" },
] as const;

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

  const [selectedItem, setSelectedItem] = useState("Projects");
  const [selectedRow, setSelectedRow] = useState("nikhilsheoran-com");

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
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} />
          </div>

          <div className={styles.sidebarScroll}>
            {sidebarGroups.map((group) => (
              <div key={group.title || "root"} className={styles.sidebarGroup}>
                {group.title ? <p className={styles.groupTitle}>{group.title}</p> : null}
                {group.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    data-window-drag-ignore
                    onClick={() => setSelectedItem(item)}
                    className={`${styles.sidebarItem} ${selectedItem === item ? styles.sidebarItemActive : ""}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <main className={styles.content}>
          <header className={styles.topBar} onPointerDown={handleDragStart}>
            <div className={styles.pathHeader}>
              <button type="button" className={styles.circleButton} data-window-drag-ignore aria-label="Back">
                ‹
              </button>
              <button type="button" className={styles.circleButton} data-window-drag-ignore aria-label="Forward">
                ›
              </button>
              <p className={styles.pathTitle}>Projects</p>
            </div>

            <div className={styles.toolbarActions}>
              <span className={styles.iconButton} data-window-drag-ignore>
                ⟳
              </span>
              <span className={styles.iconButton} data-window-drag-ignore>
                ⋯
              </span>
              <span className={styles.iconButton} data-window-drag-ignore>
                ⌕
              </span>
            </div>
          </header>

          <section className={styles.tableWrap}>
            <div className={styles.tableHeader}>
              <span>Name</span>
              <span>Date Modified</span>
              <span>Size</span>
              <span>Kind</span>
            </div>

            <div className={styles.tableBody}>
              {fileRows.map((row) => (
                <button
                  key={row.name}
                  type="button"
                  data-window-drag-ignore
                  onClick={() => setSelectedRow(row.name)}
                  className={`${styles.tableRow} ${selectedRow === row.name ? styles.tableRowActive : ""}`}
                >
                  <span className={styles.fileName}>
                    <span className={`${styles.fileIcon} ${row.kind === "Folder" ? styles.folderIcon : styles.docIcon}`} />
                    {row.name}
                  </span>
                  <span>{row.modified}</span>
                  <span>{row.size}</span>
                  <span>{row.kind}</span>
                </button>
              ))}
            </div>
          </section>

          <footer className={styles.footer}>
            <span>Macintosh HD &gt; Users &gt; nikhilsheoran &gt; Documents &gt; Projects</span>
            <span>78 items, 313.3 GB available</span>
          </footer>
        </main>
      </div>
    </section>
  );
}

