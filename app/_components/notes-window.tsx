"use client";

import dynamic from "next/dynamic";
import { MDXRemote } from "next-mdx-remote";
import { useDraggableWindow } from "@/lib/use-draggable-window";
import { getDesktopWindowBounds, getDesktopWindowFrameStyle } from "@/lib/desktop-window";
import {
  getFolderById,
  getGroupedNotesForFolder,
  type NotesData,
} from "@/lib/mock-desktop-data";
import { WindowControls } from "@/app/_components/window-controls";
import { PinIcon } from "@/app/_components/shared/icons";
import { createMdxComponents } from "@/app/_components/shared/mdx-components";
import {
  ExportIcon,
  FolderIcon as PhFolderIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import styles from "./notes-window.module.css";

// ── Notes-specific icons (unique to this window) ────────────────────────────

function FolderIcon({ active }: { active: boolean }) {
  return (
    <PhFolderIcon
      className={styles.sidebarIcon}
      size={19}
      color="#e9a100"
      weight={active ? "fill" : "regular"}
      aria-hidden
    />
  );
}

function SharedSidebarIcon() {
  return (
    <UsersIcon className={styles.sidebarIcon} size={19} color="#0a7aff" aria-hidden />
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
  return <PhFolderIcon size={15} color="#8e8e93" aria-hidden />;
}

function ShareIcon() {
  return <ExportIcon size={18} color="#3a3a3c" aria-hidden />;
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

const Guestbook = dynamic(
  () =>
    import("@/app/_components/shared/guestbook").then((m) => ({
      default: m.Guestbook,
    })),
  { ssr: false },
);

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

  if (!isOpen) return null;

  const selectedFolder = getFolderById(notesData, selectedFolderId) ?? notesData.folders[0];
  const groupedNotes = getGroupedNotesForFolder(notesData, selectedFolder.id);
  const resolvedSlug = selectedNoteSlug ?? notesData.defaultNoteSlug;
  const selectedNote = resolvedSlug ? notesData.notesBySlug[resolvedSlug] ?? null : null;
  const isSharedNote = selectedNote?.isShared ?? false;
  const iCloudFolders = notesData.folders.filter((f) => f.id !== "shared" && f.noteSlugs.length > 0);

  return (
    <section
      ref={windowRef}
      className={styles.window}
      onPointerDownCapture={onActivate}
      style={getDesktopWindowFrameStyle({
        maxWidth: 1280,
        maxHeight: 640,
        position,
        zIndex,
        isDragging,
      })}
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
                      <SharedSidebarIcon />
                      <span>{item.label}</span>
                    </span>
                    <span className={styles.countBadge}>{item.count}</span>
                  </button>
                );
              })}
            </div>

            <p className={styles.sectionLabel}>iCloud</p>
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
                const displayDate = note.dateLabel;
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
                {selectedNote.updatedAtLabel}
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
