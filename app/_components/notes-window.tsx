"use client";

import { useCallback } from "react";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import {
  getFolderById,
  getGroupedNotesForFolder,
  type NoteBodyBlock,
  type NotesData,
} from "@/lib/mock-desktop-data";
import { WindowControls } from "@/app/_components/window-controls";
import styles from "./notes-window.module.css";

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

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

function renderBodyBlock(block: NoteBodyBlock, index: number) {
  if (block.type === "paragraph") {
    return <p key={`paragraph-${index}`}>{block.text}</p>;
  }

  if (block.type === "ordered-list") {
    return (
      <ol key={`ordered-${index}`}>
        {block.items.map((item, itemIndex) => (
          <li key={`${item}-${itemIndex}`}>{item}</li>
        ))}
      </ol>
    );
  }

  return (
    <ul key={`unordered-${index}`}>
      {block.items.map((item, itemIndex) => (
        <li key={`${item}-${itemIndex}`}>{item}</li>
      ))}
    </ul>
  );
}

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

  const selectedFolder = getFolderById(notesData, selectedFolderId) ?? notesData.folders[0];
  const groupedNotes = getGroupedNotesForFolder(notesData, selectedFolder.id);
  const selectedNote = selectedNoteSlug ? notesData.notesBySlug[selectedNoteSlug] ?? null : null;

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
        <aside className={styles.leftPane}>
          <div className={styles.leftPaneHeader} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} />
          </div>
          <div className={styles.leftPaneContent}>
            <div className={styles.quickGroup}>
              {notesData.quickGroups.map((item) => (
                <div key={item.id} className={styles.quickRow}>
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
              {notesData.folders.map((folder) => {
                const isActive = folder.id === selectedFolder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    data-window-drag-ignore
                    onClick={() => onFolderSelect(folder.id)}
                    className={`${styles.folderRow} ${isActive ? styles.folderRowActive : ""}`}
                  >
                    <div className={styles.folderLabel}>
                      <FolderIcon active={isActive} />
                      <span>{folder.label}</span>
                    </div>
                    <span className={styles.countValue}>{folder.noteSlugs.length}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className={styles.headerList} onPointerDown={handleDragStart}>
          <div className={styles.listHeadingBlock}>
            <p className={styles.listHeadingTitle}>{selectedFolder.label}</p>
            <p className={styles.listHeadingMeta}>
              {selectedFolder.noteSlugs.length} note{selectedFolder.noteSlugs.length === 1 ? "" : "s"}
            </p>
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

        <section className={styles.noteList}>
          {groupedNotes.map((group) => (
            <div key={group.heading} className={styles.noteGroup}>
              <h3 className={styles.noteGroupTitle}>{group.heading}</h3>
              {group.items.map((note) => {
                const isActive = selectedNote?.slug === note.slug;
                return (
                  <button
                    key={note.slug}
                    type="button"
                    data-window-drag-ignore
                    onClick={() => onNoteSelect(note.slug)}
                    className={`${styles.noteCard} ${isActive ? styles.noteCardActive : ""}`}
                  >
                    <p className={styles.noteCardTitle}>{note.title}</p>
                    <div className={styles.noteCardMeta}>
                      <span className={styles.noteDate}>{note.dateLabel}</span>
                      <span className={styles.notePreview}>{note.preview}</span>
                    </div>
                    <div className={styles.noteSource}>
                      <NotesIcon />
                      <span>Notes</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </section>

        <article className={styles.editorContent}>
          {selectedNote ? (
            <>
              <p className={styles.editorMeta}>
                {selectedNote.updatedAtLabel}
                {selectedNote.isShared ? " - Shared" : ""}
              </p>
              <h1 className={styles.editorTitle}>{selectedNote.title}</h1>
              <div className={styles.editorBody}>
                {selectedNote.body.map((block, index) => renderBodyBlock(block, index))}
              </div>
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
