"use client";

import { useCallback, useRef, useState } from "react";
import { MDXRemote } from "next-mdx-remote";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import {
  getFolderById,
  getGroupedNotesForFolder,
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

/** Finder-style plain folder icon — thin stroke, no fill badge */
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

/** Finder-style plain person/shared icon */
function SharedSidebarIcon({ active }: { active: boolean }) {
  const color = active ? "#3d82e0" : "#7a7a7a";
  return (
    <svg className={styles.sidebarIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.2" r="2.3" stroke={color} strokeWidth="1.3" />
      <path
        d="M3.5 13C4.2 10.9 5.9 9.6 8 9.6C10.1 9.6 11.8 10.9 12.5 13"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small person icon inline in the note title row — right side */
function SharedNoteIndicator() {
  return (
    <svg
      className={styles.sharedNoteIndicator}
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-label="Shared note"
    >
      <circle cx="8" cy="5.2" r="2.3" stroke="#3d82e0" strokeWidth="1.4" />
      <path
        d="M3.5 13C4.2 10.9 5.9 9.6 8 9.6C10.1 9.6 11.8 10.9 12.5 13"
        stroke="#3d82e0"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10.5 2.5L13.5 5.5L10.5 8.5L9 7L7 9L8.5 10.5L7.5 11.5L4.5 8.5L5.5 7.5L7 9L9 7L7.5 5.5L10.5 2.5Z"
        stroke="#aaa"
        strokeWidth="1.1"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M4.5 8.5L2 11" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" />
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

function GoogleG() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

const mdxComponents = {
  h1: (props: React.ComponentProps<"h1">) => <h1 className={styles.mdxH1} {...props} />,
  h2: (props: React.ComponentProps<"h2">) => <h2 className={styles.mdxH2} {...props} />,
  h3: (props: React.ComponentProps<"h3">) => <h3 className={styles.mdxH3} {...props} />,
  a: (props: React.ComponentProps<"a">) => (
    <a className={styles.inlineLink} target="_blank" rel="noopener noreferrer" {...props} />
  ),
  code: (props: React.ComponentProps<"code">) => <code className={styles.inlineCode} {...props} />,
  pre: (props: React.ComponentProps<"pre">) => <pre className={styles.codeBlock} {...props} />,
};

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

  const [commentText, setCommentText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const selectedFolder = getFolderById(notesData, selectedFolderId) ?? notesData.folders[0];
  const groupedNotes = getGroupedNotesForFolder(notesData, selectedFolder.id);
  const selectedNote = selectedNoteSlug ? notesData.notesBySlug[selectedNoteSlug] ?? null : null;
  const isSharedNote = selectedNote?.isShared ?? false;

  // Folders shown in the iCloud section — exclude the virtual "shared" folder and empty folders
  const iCloudFolders = notesData.folders.filter((f) => f.id !== "shared" && f.noteSlugs.length > 0);

  const handleCommentSubmit = () => {
    window.open("https://accounts.google.com/signin", "_blank", "noopener");
  };

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

            {/* Quick row — "Shared" — clicking navigates to the virtual shared folder */}
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
            <p className={styles.listHeadingMeta}>
              {selectedFolder.noteSlugs.length} note{selectedFolder.noteSlugs.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className={styles.headerListSpacer} />
        </div>

        {/* ── Editor toolbar ── */}
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

        {/* ── Note list ── */}
        <section className={styles.noteList}>
          {groupedNotes.map((group) => (
            <div key={group.heading} className={styles.noteGroup}>
              <h3
                className={`${styles.noteGroupTitle} ${
                  group.heading === "Pinned" ? styles.noteGroupTitlePinned : ""
                }`}
              >
                {group.heading === "Pinned" && <PinIcon />}
                {group.heading}
              </h3>
              {group.items.map((note) => {
                const isActive = selectedNote?.slug === note.slug;
                const folderLabel = notesData.folders.find(
                  (f) => f.id !== "all-icloud" && f.id !== "shared" && note.folderIds.includes(f.id)
                )?.label;
                return (
                  <button
                    key={note.slug}
                    type="button"
                    data-window-drag-ignore
                    onClick={() => onNoteSelect(note.slug)}
                    className={`${styles.noteCard} ${isActive ? styles.noteCardActive : ""}`}
                  >
                    {/* Title row: title + optional shared indicator on the right */}
                    <div className={styles.noteCardTitleRow}>
                      <p className={styles.noteCardTitle}>{note.title}</p>
                      {note.isShared && <SharedNoteIndicator />}
                    </div>
                    <div className={styles.noteCardMeta}>
                      <span className={styles.noteDate}>{note.dateLabel}</span>
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

              {isSharedNote && (
                <div className={styles.guestBook}>
                  <div className={styles.guestBookDivider} />

                  {/* Seed comment — Nikhil's own message, no name */}
                  <div className={styles.commentRow}>
                    <img src="/nikhil.jpg" alt="Nikhil" className={styles.commentAvatar} />
                    <div className={styles.commentBubble}>
                      <span className={styles.editorBody}>
                      drop a piece of wisdom. this note is shared with everyone :)
                      </span>
                    </div>
                  </div>

                  {/* Input row */}
                  <div className={styles.commentInputRow} data-window-drag-ignore>
                    <span className={styles.commentAvatarEmpty} aria-hidden />
                    <div className={styles.commentInputWrapper}>
                      <input
                        ref={inputRef}
                        type="text"
                        className={styles.commentInput}
                        placeholder="Leave a message…"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCommentSubmit();
                        }}
                        maxLength={280}
                      />
                      <button
                        type="button"
                        className={styles.commentSubmitBtn}
                        onClick={handleCommentSubmit}
                        aria-label="Sign in with Google to submit"
                      >
                        <GoogleG />
                        <span>Sign in</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
