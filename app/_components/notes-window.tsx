"use client";

import { useCallback } from "react";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import { WindowControls } from "@/app/_components/window-controls";
import styles from "./notes-window.module.css";

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

const quickGroups = [
  { label: "Shared", count: 6, icon: "shared" },
] as const;

const iCloudFolders = [
  { label: "All iCloud", count: 462, selected: true },
  { label: "Notes", count: 432, selected: false },
  { label: "Archive", count: 6, selected: false },
  { label: "Documents", count: 9, selected: false },
  { label: "Imported Notes", count: 0, selected: false },
  { label: "Passwords", count: 15, selected: false },
  { label: "Quick Notes", count: 0, selected: false },
] as const;

const noteGroups = [
  {
    heading: "Previous 30 Days",
    items: [
      {
        title: "Problem Statement",
        subtitle: "Imagine that your mobile",
        date: "19/01/26",
        selected: false,
      },
      {
        title: "Problem Statement",
        subtitle: "You are given two numeri",
        date: "19/01/26",
        selected: false,
      },
      {
        title: "Here is the clean, reconstru...",
        subtitle: "in text form, with examp...",
        date: "19/01/26",
        selected: false,
      },
      {
        title: "tally server setup readme",
        subtitle: "setup cloudflare tunnel +",
        date: "17/01/26",
        selected: true,
      },
      {
        title: "opendictate readme",
        subtitle: "# OpenDictate",
        date: "15/01/26",
        selected: false,
      },
    ],
  },
  {
    heading: "January",
    items: [
      {
        title: "to order - amazon",
        subtitle: "instamart",
        date: "05/01/26",
        selected: false,
      },
    ],
  },
  {
    heading: "2025",
    items: [
      {
        title: "bunx --bun shadcn@latest...",
        subtitle: "?base=radix&style=maia",
        date: "30/12/25",
        selected: false,
      },
    ],
  },
] as const;

interface NotesWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

function FolderIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={styles.folderIcon}
      width="20"
      height="16"
      viewBox="0 0 20 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M1.3 3.6C1.3 2.61 2.11 1.8 3.1 1.8H7.1L8.7 3.4H16.9C17.89 3.4 18.7 4.21 18.7 5.2V12.9C18.7 13.89 17.89 14.7 16.9 14.7H3.1C2.11 14.7 1.3 13.89 1.3 12.9V3.6Z"
        stroke={active ? "#E69C00" : "#1F1F1F"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SharedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.2" r="2.2" stroke="#1e1e1e" strokeWidth="1.2" />
      <path
        d="M3.8 12.8C4.4 10.9 6 9.8 8 9.8C10 9.8 11.6 10.9 12.2 12.8"
        stroke="#1e1e1e"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
      <path
        d="M1.25 3.1C1.25 2.27 1.92 1.6 2.75 1.6H6.45L7.75 2.9H15.25C16.08 2.9 16.75 3.57 16.75 4.4V11.25C16.75 12.08 16.08 12.75 15.25 12.75H2.75C1.92 12.75 1.25 12.08 1.25 11.25V3.1Z"
        stroke="#8D8D8D"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <path d="M8.5 2V11.45" stroke="#676767" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M5.2 5.3L8.5 2L11.8 5.3" stroke="#676767" strokeWidth="1.25" strokeLinecap="round" />
      <rect x="2.1" y="8.35" width="12.8" height="6.7" rx="1.65" stroke="#676767" strokeWidth="1.25" />
    </svg>
  );
}

export function NotesWindow({ isOpen, onClose }: NotesWindowProps) {
  const getBounds = useCallback((windowSize: WindowSize) => {
    return {
      minX: -(windowSize.width - WINDOW_VISIBLE_EDGE),
      maxX: window.innerWidth - WINDOW_VISIBLE_EDGE,
      minY: MENU_BAR_HEIGHT + 8,
      maxY: window.innerHeight - DOCK_RESERVED_HEIGHT - WINDOW_VISIBLE_TOP,
    };
  }, []);

  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 36, y: 46 },
    getBounds,
    disabled: !isOpen,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <section
      ref={windowRef}
      className={styles.window}
      style={{
        width: "min(1460px, calc(100vw - 72px))",
        height: "min(792px, calc(100vh - 98px))",
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <div className={styles.layout}>
        <div className={styles.headerSidebar} onPointerDown={handleDragStart}>
          <WindowControls onClose={onClose} />
        </div>

        <div className={styles.headerList} onPointerDown={handleDragStart}>
          <div className={styles.listHeadingBlock}>
            <p className={styles.listHeadingTitle}>All iCloud</p>
            <p className={styles.listHeadingMeta}>462 notes</p>
          </div>
          <div className={styles.headerListSpacer} />
        </div>

        <div className={styles.headerEditor} onPointerDown={handleDragStart}>
          <div className={styles.editorToolbar}>
            <button
              type="button"
              data-window-drag-ignore
              className={styles.toolbarButtonPrimary}
              aria-label="Share note"
            >
              <ShareIcon />
            </button>
          </div>

          <div className={styles.searchField} data-window-drag-ignore>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="6.2" cy="6.2" r="4.7" stroke="#787878" strokeWidth="1.2" />
              <path d="M9.7 9.7L12.7 12.7" stroke="#787878" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>Search</span>
          </div>
        </div>

        <aside className={styles.sidebarContent}>
          <div className={styles.sidebarInner}>
            <div className={styles.quickGroup}>
              {quickGroups.map((item) => (
                <div key={item.label} className={styles.quickRow}>
                  <div className={styles.quickLabel}>
                    <span className={styles.quickIcon} aria-hidden>
                      <SharedIcon />
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <span className={styles.countValue}>{item.count}</span>
                </div>
              ))}
            </div>

            <p className={styles.sectionLabel}>iCloud</p>
            <div className={styles.folderList}>
              {iCloudFolders.map((folder) => (
                <div
                  key={folder.label}
                  className={`${styles.folderRow} ${folder.selected ? styles.folderRowActive : ""}`}
                >
                  <div className={styles.folderLabel}>
                    <FolderIcon active={folder.selected} />
                    <span>{folder.label}</span>
                  </div>
                  <span className={styles.countValue}>{folder.count}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className={styles.noteList}>
          {noteGroups.map((group) => (
            <div key={group.heading} className={styles.noteGroup}>
              <h3 className={styles.noteGroupTitle}>{group.heading}</h3>
              {group.items.map((note) => (
                <article
                  key={`${group.heading}-${note.title}`}
                  className={`${styles.noteCard} ${note.selected ? styles.noteCardActive : ""}`}
                >
                  <p className={styles.noteCardTitle}>{note.title}</p>
                  <div className={styles.noteCardMeta}>
                    <span className={styles.noteDate}>{note.date}</span>
                    <span className={styles.notePreview}>{note.subtitle}</span>
                  </div>
                  <div className={styles.noteSource}>
                    <NotesIcon />
                    <span>Notes</span>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </section>

        <article className={styles.editorContent}>
          <p className={styles.editorMeta}>17 January 2026 at 1:16 PM - Shared</p>
          <h1 className={styles.editorTitle}>tally server setup readme</h1>
          <div className={styles.editorBody}>
            <ol>
              <li>
                setup <span className={styles.inlineLink}>cloudflare</span> tunnel + wrap zero trust on
                server and all clients
              </li>
              <li>go to network/connectors -&gt; add tunnel(cloudflared) -&gt; in cidr tab enter pvt ip.</li>
              <li>create users and security stuff give access.</li>
            </ol>

            <ul>
              <li>
                Type <span className={styles.inlineLink}>sysdm.cpl</span> and hit Enter.
              </li>
              <li>Go to the Advanced tab.</li>
              <li>Under Performance, click Settings.</li>
              <li>Select &quot;Adjust for best performance&quot;.</li>
              <li>
                Recommendation: check the box for &quot;Smooth edges of screen fonts&quot; so text is
                still readable.
              </li>
            </ul>

            <p>turn off virus and threat protection</p>

            <p>
              Navigate to: Computer Configuration -&gt; Administrative Templates -&gt; Windows Components
              -&gt; Remote Desktop Services.
            </p>

            <ul>
              <li>
                &quot;Enforce Removal of Remote Desktop Wallpaper&quot;: Set to <strong>Enabled</strong>.
              </li>
              <li>
                &quot;Limit maximum color depth&quot;: Set to <strong>Enabled</strong> -&gt;{" "}
                <strong>16 bit</strong>.
              </li>
              <li>
                &quot;Configure image quality for RemoteFX Adaptive Graphics&quot;: Set to{" "}
                <strong>Enabled</strong> -&gt; <strong>Medium</strong>.
              </li>
            </ul>

            <p className={styles.inlineLink}>https://github.com/sebaxakerhtc/rdpwrap/releases</p>
          </div>
        </article>
      </div>
    </section>
  );
}
