"use client";

import { useState, useMemo } from "react";
import { MDXRemote } from "next-mdx-remote";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDateLabel, formatUpdatedAtLabel } from "@/lib/date-time";
import {
  getGroupedNotesForFolder,
  type NotesData,
  type NoteRecord,
} from "@/lib/mock-desktop-data";
import { Guestbook } from "@/app/_components/shared/guestbook";
import { PinIcon } from "@/app/_components/shared/icons";
import { createMdxComponents } from "@/app/_components/shared/mdx-components";
import styles from "./mobile-notes.module.css";

const mdxComponents = createMdxComponents(styles);

// ── Icons (single-consumer, not shared) ─────────────────────────────────────

function SharedDot() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
      <circle cx="4" cy="4" r="3" fill="#3d82e0" />
    </svg>
  );
}

function BackChevron() {
  return (
    <svg width="10" height="17" viewBox="0 0 10 17" fill="none" aria-hidden>
      <path d="M9 1.5L2 8.5L9 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Note reader ─────────────────────────────────────────────────────────────

function NoteReader({ note, latestCommentDate, onBack }: { note: NoteRecord; latestCommentDate: Date | null; onBack: () => void }) {
  const displayUpdatedAt = note.isShared && latestCommentDate
    ? formatUpdatedAtLabel(latestCommentDate)
    : note.updatedAtLabel;

  return (
    <div className={styles.readerRoot}>
      <header className={styles.readerHeader}>
        <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Back to notes">
          <BackChevron />
          <span>Notes</span>
        </button>
        <div className={styles.readerHeaderMeta}>
          {note.isShared && <span className={styles.sharedBadge}>Shared</span>}
        </div>
      </header>

      <article className={styles.readerBody}>
        <p className={styles.readerMeta}>
          {displayUpdatedAt}
          {note.readingTime > 0 ? ` · ${note.readingTime} min read` : ""}
        </p>
        <h1 className={styles.readerTitle}>{note.title}</h1>

        <div className={styles.mdxBody}>
          {note.mdxSource ? (
            <MDXRemote {...note.mdxSource} components={mdxComponents} />
          ) : (
            <p>No content available.</p>
          )}
        </div>

        {note.isShared && <Guestbook styles={styles} />}
      </article>
    </div>
  );
}

// ── Note list ───────────────────────────────────────────────────────────────

interface MobileNotesProps {
  notesData: NotesData;
  selectedNoteSlug: string | null;
  onNoteSelect: (slug: string) => void;
}

export function MobileNotes({ notesData, selectedNoteSlug, onNoteSelect }: MobileNotesProps) {
  const [viewingSlug, setViewingSlug] = useState<string | null>(selectedNoteSlug);
  const viewingNote = viewingSlug ? notesData.notesBySlug[viewingSlug] ?? null : null;

  // Query guestbook to get the latest comment date for shared notes
  const guestbookMessages = useQuery(api.guestbook.list);
  const latestCommentDate = useMemo(() => {
    if (!guestbookMessages?.length) return null;
    return new Date(guestbookMessages[0]._creationTime);
  }, [guestbookMessages]);

  const handleNoteSelect = (slug: string) => {
    setViewingSlug(slug);
    onNoteSelect(slug);
  };

  const allGroups = getGroupedNotesForFolder(notesData, notesData.defaultFolderId);

  if (viewingNote) {
    return <NoteReader note={viewingNote} latestCommentDate={latestCommentDate} onBack={() => setViewingSlug(null)} />;
  }

  return (
    <div className={styles.listRoot}>
      <header className={styles.listHeader}>
        <div className={styles.listHeaderInner}>
          <h1 className={styles.listTitle}>Notes</h1>
          <span className={styles.listCount}>
            {notesData.noteOrder.length} note{notesData.noteOrder.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className={styles.listBody}>
        {allGroups.map((group) => (
          <div key={group.heading} className={styles.noteGroup}>
            <h2 className={styles.groupHeading}>
              {group.heading === "Pinned" && <PinIcon size={10} />}
              {group.heading}
            </h2>
            {group.items.map((note) => {
              const displayDate = note.isShared && latestCommentDate
                ? formatDateLabel(latestCommentDate)
                : note.dateLabel;
              return (
                <button
                  key={note.slug}
                  type="button"
                  className={`${styles.noteCard} ${viewingSlug === note.slug ? styles.noteCardActive : ""}`}
                  onClick={() => handleNoteSelect(note.slug)}
                >
                  <div className={styles.noteCardTop}>
                    <p className={styles.noteCardTitle}>{note.title}</p>
                    {note.isShared && <SharedDot />}
                  </div>
                  <div className={styles.noteCardBottom}>
                    <span className={styles.noteDate}>{displayDate}</span>
                    <span className={styles.notePreview}>{note.preview}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
