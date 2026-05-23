"use client";

import { useMemo } from "react";
import { MDXRemote } from "next-mdx-remote";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDraggableWindow } from "@/lib/use-draggable-window";
import { getDesktopWindowBounds } from "@/lib/desktop-window";
import { formatDateLabel, formatUpdatedAtLabel } from "@/lib/date-time";
import {
  getFolderById,
  getGroupedNotesForFolder,
  type NotesData,
} from "@/lib/mock-desktop-data";
import { WindowControls } from "@/app/_components/window-controls";
import { Guestbook } from "@/app/_components/shared/guestbook";
import { PinIcon } from "@/app/_components/shared/icons";
import { createMdxComponents } from "@/app/_components/shared/mdx-components";
import styles from "./notes-window.module.css";

// ── Notes-specific icons (unique to this window) ────────────────────────────

function FolderIcon({ active }: { active: boolean }) {
  const color = active ? "#f09a00" : "#7a7a7a";
  return (
    <svg className={styles.sidebarIcon} width="18" height="15" viewBox="0 0 20 16" fill="none" aria-hidden>
      <path
        d="M1.3 3.6C1.3 2.61 2.11 1.8 3.1 1.8H7.1L8.7 3.4H16.9C17.89 3.4 18.7 4.21 18.7 5.2V12.9C18.7 13.89 17.89 14.7 16.9 14.7H3.1C2.11 14.7 1.3 13.89 1.3 12.9V3.6Z"
        stroke={color}
        strokeWidth="1.35"
        strokeLinejoin="round"
        fill={active ? "rgba(240,154,0,0.1)" : "none"}
      />
    </svg>
  );
}

function SharedSidebarIcon({ active }: { active: boolean }) {
  const color = active ? "#3d82e0" : "#7a7a7a";
  return (
    <svg className={styles.sidebarIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.2" r="2.3" stroke={color} strokeWidth="1.3" />
      <path d="M3.5 13C4.2 10.9 5.9 9.6 8 9.6C10.1 9.6 11.8 10.9 12.5 13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SharedNoteIndicator() {
  return (
    <svg className={styles.sharedNoteIndicator} width="13" height="13" viewBox="0 0 16 16" fill="none" aria-label="Shared note">
      <circle cx="8" cy="5.2" r="2.3" stroke="#3d82e0" strokeWidth="1.4" />
      <path d="M3.5 13C4.2 10.9 5.9 9.6 8 9.6C10.1 9.6 11.8 10.9 12.5 13" stroke="#3d82e0" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
      <path d="M1.25 3.1C1.25 2.27 1.92 1.6 2.75 1.6H6.45L7.75 2.9H15.25C16.08 2.9 16.75 3.57 16.75 4.4V11.25C16.75 12.08 16.08 12.75 15.25 12.75H2.75C1.92 12.75 1.25 12.08 1.25 11.25V3.1Z" stroke="#8D8D8D" strokeWidth="1.25" strokeLinejoin="round" />
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

// ── Component ───────────────────────────────────────────────────────────────

interface NotesWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate?: () => void;
  zIndex?: number;
  notesData: NotesData;
  selectedFolderId: string;
  selectedNoteSlug: string | null;
  onFolderSelect: (folderId: string) => void;
  onNoteSelect: (noteSlug: string) => void;
}

const mdxComponents = createMdxComponents(styles);

export function NotesWindow({
  isOpen,
  onClose,
  onActivate,
  zIndex,
  notesData,
  selectedFolderId,
  selectedNoteSlug,
  onFolderSelect,
  onNoteSelect,
}: NotesWindowProps) {
  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 36, y: 46 },
    getBounds: getDesktopWindowBounds,
    disabled: !isOpen,
  });

  // Query guestbook to get the latest comment date for shared notes
  const guestbookMessages = useQuery(api.guestbook.list);
  const latestCommentDate = useMemo(() => {
    if (!guestbookMessages?.length) return null;
    return new Date(guestbookMessages[0]._creationTime);
  }, [guestbookMessages]);

  if (!isOpen) return null;

  const selectedFolder = getFolderById(notesData, selectedFolderId) ?? notesData.folders[0];
  const groupedNotes = getGroupedNotesForFolder(notesData, selectedFolder.id);
  const selectedNote = selectedNoteSlug ? notesData.notesBySlug[selectedNoteSlug] ?? null : null;
  const isSharedNote = selectedNote?.isShared ?? false;
  const iCloudFolders = notesData.folders.filter((f) => f.id !== "shared" && f.noteSlugs.length > 0);

  return (
    <section
      ref={windowRef}
      className={styles.window}
      onPointerDownCapture={onActivate}
      style={{
        width: "min(1280px, calc(100vw - 72px))",
        height: "min(640px, calc(100vh - 98px))",
        zIndex,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <div className={styles.layout}>
        {/* ── Left sidebar ── */}
        <aside className={styles.leftPane}>
          <div className={styles.leftPaneHeader} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} windowName="Notes" />
          </div>
          <div className={styles.leftPaneContent}>
            <div className={styles.quickGroup}>
              {notesData.quickGroups.map((item) => {
                const isActive = selectedFolder.id === item.folderId;
                return (
                  <button key={item.id} type="button" data-window-drag-ignore onClick={() => onFolderSelect(item.folderId)} className={`${styles.quickRow} ${isActive ? styles.quickRowActive : ""}`}>
                    <span className={styles.quickLabel}>
                      <SharedSidebarIcon active={isActive} />
                      <span>{item.label}</span>
                    </span>
                    <span className={styles.countBadge}>{item.count}</span>
                  </button>
                );
              })}
            </div>

            <p className={styles.sectionLabel}>Category</p>
            <div className={styles.folderList}>
              {iCloudFolders.map((folder) => {
                const isActive = folder.id === selectedFolder.id;
                return (
                  <button key={folder.id} type="button" data-window-drag-ignore onClick={() => onFolderSelect(folder.id)} className={`${styles.folderRow} ${isActive ? styles.folderRowActive : ""}`}>
                    <span className={styles.folderLabel}>
                      <FolderIcon active={isActive} />
                      <span>{folder.label}</span>
                    </span>
                    <span className={styles.countBadge}>{folder.noteSlugs.length}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── List column header ── */}
        <div className={styles.headerList} onPointerDown={handleDragStart}>
          <div className={styles.listHeadingBlock}>
            <p className={styles.listHeadingTitle}>{selectedFolder.label}</p>
            <p className={styles.listHeadingMeta}>{selectedFolder.noteSlugs.length} note{selectedFolder.noteSlugs.length === 1 ? "" : "s"}</p>
          </div>
          <div className={styles.headerListSpacer} />
        </div>

        {/* ── Editor toolbar ── */}
        <div className={styles.headerEditor} onPointerDown={handleDragStart}>
          <div className={styles.editorToolbar}>
            <button type="button" data-window-drag-ignore className={styles.toolbarButtonPrimary} aria-label="Share note">
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

        {/* ── Note list ── */}
        <section className={styles.noteList}>
          {groupedNotes.map((group) => (
            <div key={group.heading} className={styles.noteGroup}>
              <h3 className={`${styles.noteGroupTitle} ${group.heading === "Pinned" ? styles.noteGroupTitlePinned : ""}`}>
                {group.heading === "Pinned" && <PinIcon />}
                {group.heading}
              </h3>
              {group.items.map((note) => {
                const isActive = selectedNote?.slug === note.slug;
                const folderLabel = notesData.folders.find((f) => f.id !== "all-icloud" && f.id !== "shared" && note.folderIds.includes(f.id))?.label;
                const displayDate = note.isShared && latestCommentDate
                  ? formatDateLabel(latestCommentDate)
                  : note.dateLabel;
                return (
                  <button key={note.slug} type="button" data-window-drag-ignore onClick={() => onNoteSelect(note.slug)} className={`${styles.noteCard} ${isActive ? styles.noteCardActive : ""}`}>
                    <div className={styles.noteCardTitleRow}>
                      <p className={styles.noteCardTitle}>{note.title}</p>
                      {note.isShared && <SharedNoteIndicator />}
                    </div>
                    <div className={styles.noteCardMeta}>
                      <span className={styles.noteDate}>{displayDate}</span>
                      <span className={styles.notePreview}>{note.preview}</span>
                    </div>
                    <div className={styles.noteSource}>
                      <NotesIcon />
                      <span>{folderLabel ?? "Notes"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </section>

        {/* ── Editor ── */}
        <article className={styles.editorContent}>
          {selectedNote ? (
            <>
              <p className={styles.editorMeta}>
                {selectedNote.isShared && latestCommentDate
                  ? formatUpdatedAtLabel(latestCommentDate)
                  : selectedNote.updatedAtLabel}
                {selectedNote.isShared ? " · Shared" : ""}
                {selectedNote.readingTime > 0 ? ` · ${selectedNote.readingTime} min read` : ""}
              </p>
              <h1 className={styles.editorTitle}>{selectedNote.title}</h1>
              <div className={styles.editorBody}>
                {selectedNote.mdxSource ? (
                  <MDXRemote {...selectedNote.mdxSource} components={mdxComponents} />
                ) : (
                  <p>No content available.</p>
                )}
              </div>
              {isSharedNote && <Guestbook styles={styles} />}
            </>
          ) : (
            <>
              <p className={styles.editorMeta}>No note selected</p>
              <h1 className={styles.editorTitle}>Select a note</h1>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
