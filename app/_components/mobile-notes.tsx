"use client";

import { useState } from "react";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote";
import {
  getGroupedNotesForFolder,
  type NotesData,
  type NoteRecord,
} from "@/lib/mock-desktop-data";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import styles from "./mobile-notes.module.css";

// ---------------------------------------------------------------------------
// MDX components
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function BackIcon() {
  return (
    <svg width="10" height="17" viewBox="0 0 10 17" fill="none" aria-hidden>
      <path
        d="M9 1.5L2 8.5L9 15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10.5 2.5L13.5 5.5L10.5 8.5L9 7L7 9L8.5 10.5L7.5 11.5L4.5 8.5L5.5 7.5L7 9L9 7L7.5 5.5L10.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M4.5 8.5L2 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SharedDot() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
      <circle cx="4" cy="4" r="3" fill="#3d82e0" />
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

// ---------------------------------------------------------------------------
// Note reader
// ---------------------------------------------------------------------------

interface NoteReaderProps {
  note: NoteRecord;
  onBack: () => void;
}

function NoteReader({ note, onBack }: NoteReaderProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: session } = authClient.useSession();
  const messages = useQuery(api.guestbook.list);
  const addMessage = useMutation(api.guestbook.add);

  const handleSignIn = () => {
    authClient.signIn.social({ provider: "google", callbackURL: window.location.href });
  };
  const handleSignOut = () => authClient.signOut();

  const handleCommentSubmit = async () => {
    if (!session) { handleSignIn(); return; }
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addMessage({ message: trimmed });
      setCommentText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.readerRoot}>
      {/* Header */}
      <header className={styles.readerHeader}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onBack}
          aria-label="Back to notes"
        >
          <BackIcon />
          <span>Notes</span>
        </button>
        <div className={styles.readerHeaderMeta}>
          {note.isShared && <span className={styles.sharedBadge}>Shared</span>}
        </div>
      </header>

      {/* Content */}
      <article className={styles.readerBody}>
        <p className={styles.readerMeta}>
          {note.updatedAtLabel}
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

        {/* Guestbook */}
        {note.isShared && (
          <div className={styles.guestBook}>
            <div className={styles.guestBookDivider} />

            {messages?.map((msg) => (
              <div key={msg._id} className={styles.commentRow}>
                {msg.avatarUrl ? (
                  <Image
                    src={msg.avatarUrl}
                    alt={msg.name}
                    width={30}
                    height={30}
                    className={styles.commentAvatar}
                    unoptimized
                  />
                ) : (
                  <span className={styles.commentAvatarEmpty} aria-hidden />
                )}
                <div className={styles.commentBubble}>
                  <span className={styles.commentText}>{msg.message}</span>
                </div>
              </div>
            ))}

            <div className={styles.commentInputRow}>
              {session ? (
                <Image
                  src={session.user.image ?? "/nikhil.jpg"}
                  alt={session.user.name ?? "You"}
                  width={30}
                  height={30}
                  className={styles.commentAvatar}
                  unoptimized
                />
              ) : (
                <span className={styles.commentAvatarEmpty} aria-hidden />
              )}
              <div className={styles.commentInputWrapper}>
                <input
                  type="text"
                  className={styles.commentInput}
                  placeholder={session ? "Leave a message…" : "Sign in to leave a message…"}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCommentSubmit(); }}
                  maxLength={280}
                  disabled={isSubmitting}
                />
                {session ? (
                  <button
                    type="button"
                    className={styles.commentSubmitBtn}
                    onClick={handleCommentSubmit}
                    disabled={isSubmitting || !commentText.trim()}
                  >
                    Send
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.commentSubmitBtn}
                    onClick={handleSignIn}
                  >
                    <GoogleG />
                    <span>Sign in</span>
                  </button>
                )}
              </div>
              {session && (
                <button
                  type="button"
                  className={styles.signOutBtn}
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Note list
// ---------------------------------------------------------------------------

interface MobileNotesProps {
  notesData: NotesData;
  selectedNoteSlug: string | null;
  onNoteSelect: (slug: string) => void;
}

export function MobileNotes({ notesData, selectedNoteSlug, onNoteSelect }: MobileNotesProps) {
  const [viewingSlug, setViewingSlug] = useState<string | null>(selectedNoteSlug);

  const viewingNote = viewingSlug ? notesData.notesBySlug[viewingSlug] ?? null : null;

  const handleNoteSelect = (slug: string) => {
    setViewingSlug(slug);
    onNoteSelect(slug);
  };

  const handleBack = () => {
    setViewingSlug(null);
  };

  // All notes from the default folder
  const allGroups = getGroupedNotesForFolder(notesData, notesData.defaultFolderId);

  if (viewingNote) {
    return <NoteReader note={viewingNote} onBack={handleBack} />;
  }

  return (
    <div className={styles.listRoot}>
      {/* Header */}
      <header className={styles.listHeader}>
        <div className={styles.listHeaderInner}>
          <h1 className={styles.listTitle}>Notes</h1>
          <span className={styles.listCount}>
            {notesData.noteOrder.length} note{notesData.noteOrder.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {/* Notes */}
      <div className={styles.listBody}>
        {allGroups.map((group) => (
          <div key={group.heading} className={styles.noteGroup}>
            <h2 className={styles.groupHeading}>
              {group.heading === "Pinned" && <PinIcon />}
              {group.heading}
            </h2>
            {group.items.map((note) => (
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
                  <span className={styles.noteDate}>{note.dateLabel}</span>
                  <span className={styles.notePreview}>{note.preview}</span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
