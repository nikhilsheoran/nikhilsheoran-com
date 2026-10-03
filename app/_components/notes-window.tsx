"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MDXRemote } from "next-mdx-remote";
import { useDraggableWindow } from "@/lib/use-draggable-window";
import {
  getDesktopWindowBounds,
  getDesktopWindowFrameStyle,
} from "@/lib/desktop-window";
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
  MagnifyingGlassIcon,
  FolderIcon as PhFolderIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { Glass } from "./journey/glass";
import { APP_GLASS, NO_AUTOFILL, appGlass } from "./shared/app-glass";
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
    <UsersIcon
      className={styles.sidebarIcon}
      size={19}
      color="#0a7aff"
      aria-hidden
    />
  );
}

/** A clear "Shared" badge on a note in the list. */
function SharedNoteIndicator() {
  return (
    <span className={styles.sharedNoteIndicator}>
      <UsersIcon size={12} weight="fill" aria-hidden />
      Shared
    </span>
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
  const { windowRef, position, isDragging, handleDragStart } =
    useDraggableWindow({
      initialPosition: { x: 36, y: 46 },
      getBounds: getDesktopWindowBounds,
      disabled: !isOpen,
    });

  // Typing in the search field narrows the list to matching titles and previews.
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const selectedFolder =
    getFolderById(notesData, selectedFolderId) ?? notesData.folders[0];
  const needle = query.trim().toLowerCase();
  const groupedNotes = getGroupedNotesForFolder(notesData, selectedFolder.id)
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (note) =>
          !needle ||
          note.title.toLowerCase().includes(needle) ||
          note.preview.toLowerCase().includes(needle),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const resolvedSlug = selectedNoteSlug ?? notesData.defaultNoteSlug;
  const selectedNote = resolvedSlug
    ? (notesData.notesBySlug[resolvedSlug] ?? null)
    : null;
  const isSharedNote = selectedNote?.isShared ?? false;
  const iCloudFolders = notesData.folders.filter(
    (f) => f.id !== "shared" && f.noteSlugs.length > 0,
  );

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
          <div
            className={styles.leftPaneHeader}
            onPointerDown={handleDragStart}
          >
            <WindowControls onClose={onClose} windowName="Notes" />
          </div>
          <div className={styles.leftPaneContent}>
            <div className={styles.quickGroup}>
              {notesData.quickGroups.map((item) => {
                const isActive = selectedFolder.id === item.folderId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-window-drag-ignore
                    onClick={() => onFolderSelect(item.folderId)}
                    className={`${styles.quickRow} ${isActive ? styles.quickRowActive : ""}`}
                  >
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
                  <button
                    key={folder.id}
                    type="button"
                    data-window-drag-ignore
                    onClick={() => onFolderSelect(folder.id)}
                    className={`${styles.folderRow} ${isActive ? styles.folderRowActive : ""}`}
                  >
                    <span className={styles.folderLabel}>
                      <FolderIcon active={isActive} />
                      <span>{folder.label}</span>
                    </span>
                    <span className={styles.countBadge}>
                      {folder.noteSlugs.length}
                    </span>
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
            <p className={styles.listHeadingMeta}>
              {selectedFolder.noteSlugs.length} note
              {selectedFolder.noteSlugs.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className={styles.headerListSpacer} />
        </div>

        {/* ── Editor toolbar ── */}
        <div className={styles.headerEditor} onPointerDown={handleDragStart}>
          <div className={styles.editorToolbar}>
            <Glass
              as="button"
              type="button"
              {...APP_GLASS}
              data-window-drag-ignore
              className={`${appGlass} ${styles.toolbarButtonPrimary}`}
              aria-label="Share note"
            >
              <ShareIcon />
            </Glass>
          </div>
          <Glass
            as="label"
            {...APP_GLASS}
            className={`${appGlass} ${styles.searchField}`}
            data-window-drag-ignore
          >
            <MagnifyingGlassIcon
              size={15}
              weight="bold"
              color="#8e8e93"
              aria-hidden
            />
            <input
              type="text"
              {...NO_AUTOFILL}
              className={styles.searchInput}
              placeholder="Search"
              aria-label="Search notes"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              data-window-drag-ignore
            />
          </Glass>
        </div>

        {/* ── Note list ── */}
        <section className={styles.noteList}>
          {groupedNotes.length === 0 && (
            <p className={styles.noteListEmpty}>
              No notes match “{query.trim()}”.
            </p>
          )}
          {groupedNotes.map((group) => (
            <div key={group.heading} className={styles.noteGroup}>
              <h3
                className={`${styles.noteGroupTitle} ${group.heading === "Pinned" ? styles.noteGroupTitlePinned : ""}`}
              >
                {group.heading === "Pinned" && <PinIcon size={15} />}
                {group.heading}
              </h3>
              {group.items.map((note) => {
                const isActive = selectedNote?.slug === note.slug;
                const folderLabel = notesData.folders.find(
                  (f) =>
                    f.id !== "all-icloud" &&
                    f.id !== "shared" &&
                    note.folderIds.includes(f.id),
                )?.label;
                const displayDate = note.dateLabel;
                return (
                  <button
                    key={note.slug}
                    type="button"
                    data-window-drag-ignore
                    onClick={() => onNoteSelect(note.slug)}
                    className={`${styles.noteCard} ${isActive ? styles.noteCardActive : ""}`}
                  >
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
                {selectedNote.readingTime > 0
                  ? ` · ${selectedNote.readingTime} min read`
                  : ""}
              </p>
              <h1 className={styles.editorTitle}>{selectedNote.title}</h1>
              {isSharedNote && (
                <p className={styles.sharedBanner}>
                  <UsersIcon size={16} weight="fill" aria-hidden />
                  Shared note. Anyone can add to it.
                </p>
              )}
              <div className={styles.editorBody}>
                {selectedNote.mdxSource ? (
                  <MDXRemote
                    {...selectedNote.mdxSource}
                    components={mdxComponents}
                  />
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
