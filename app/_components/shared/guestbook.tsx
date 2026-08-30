"use client";

import { Component, useState, useRef, type ReactNode } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { ConvexClientProvider } from "@/app/_components/convex-provider";
import { GoogleG } from "./icons";

interface GuestbookProps {
  styles: Record<string, string>;
}

/**
 * Shared Guestbook component used by both desktop NotesWindow and MobileNotes.
 * Expects the consumer to pass a CSS modules styles object with keys:
 * guestBook, guestBookDivider, commentRow, commentAvatar, commentAvatarEmpty,
 * commentBubble, editorBody / commentText, commentInputRow, commentInputWrapper,
 * commentInput, commentSubmitBtn, commentSignOutBtn / signOutBtn
 */
class GuestbookBoundary extends Component<
  { children: ReactNode; styles: Record<string, string> },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className={this.props.styles.guestBook}>
          <div className={this.props.styles.guestBookDivider} />
        </div>
      );
    }
    return this.props.children;
  }
}

export function Guestbook({ styles }: GuestbookProps) {
  return (
    <GuestbookBoundary styles={styles}>
      <ConvexClientProvider>
        <GuestbookInner styles={styles} />
      </ConvexClientProvider>
    </GuestbookBoundary>
  );
}

function GuestbookInner({ styles }: GuestbookProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: session } = authClient.useSession();
  const messages = useQuery(api.guestbook.list);
  const addMessage = useMutation(api.guestbook.add);

  const handleSignIn = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.href,
    });
  };

  const handleSignOut = () => authClient.signOut();

  const handleSubmit = async () => {
    if (!session) {
      handleSignIn();
      return;
    }
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

  // Support both desktop and mobile style key names
  const signOutBtnClass =
    styles.commentSignOutBtn ?? styles.signOutBtn ?? "";
  const messageTextClass =
    styles.editorBody ?? styles.commentText ?? "";

  return (
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
            <span className={messageTextClass}>{msg.message}</span>
          </div>
        </div>
      ))}

      <div
        className={styles.commentInputRow}
        data-window-drag-ignore
      >
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
            ref={inputRef}
            type="text"
            className={styles.commentInput}
            placeholder={
              session ? "Leave a message…" : "Sign in to leave a message…"
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            maxLength={280}
            disabled={isSubmitting}
          />
          {session ? (
            <button
              type="button"
              className={styles.commentSubmitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting || !commentText.trim()}
              aria-label="Submit message"
            >
              <span>Send</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.commentSubmitBtn}
              onClick={handleSignIn}
              aria-label="Sign in with Google to submit"
            >
              <GoogleG />
              <span>Sign in</span>
            </button>
          )}
        </div>
        {session && (
          <button
            type="button"
            className={signOutBtnClass}
            onClick={handleSignOut}
            aria-label="Sign out"
            data-window-drag-ignore
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
