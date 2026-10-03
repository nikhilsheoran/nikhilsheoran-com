"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Glass } from "../journey/glass";
import { APP_GLASS, appGlass } from "./app-glass";
import { GoogleG } from "./icons";
import styles from "./guestbook.module.css";

export interface GuestbookMessage {
  _id: string;
  _creationTime: number;
  name: string;
  avatarUrl?: string;
  message: string;
}

const stamp = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * The guestbook under a shared note, on both the desktop and the phone view.
 * Messages live in the site's database behind /api/guestbook; signing in is
 * Google, through Better Auth.
 */
export function Guestbook() {
  const { data: session } = authClient.useSession();
  const [messages, setMessages] = useState<GuestbookMessage[] | undefined>();
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/guestbook", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      setMessages((await response.json()) as GuestbookMessage[]);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // Load on arrival, and again whenever the tab is looked at, so messages
  // other people leave show up without a reload.
  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  if (failed && !messages)
    return (
      <section className={styles.guestbook}>
        <p className={styles.note}>The guestbook can’t be reached right now.</p>
      </section>
    );

  return (
    <GuestbookView
      messages={messages}
      signedInAs={session ? (session.user.name ?? "you") : null}
      onSignIn={() =>
        authClient.signIn.social({
          provider: "google",
          callbackURL: window.location.href,
        })
      }
      onSignOut={() => authClient.signOut()}
      onSend={async (message) => {
        const response = await fetch("/api/guestbook", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message }),
        });
        if (!response.ok) throw new Error(String(response.status));
        await refresh();
      }}
    />
  );
}

/** Everything the guestbook shows, with no knowledge of where the data comes from. */
export function GuestbookView({
  messages,
  signedInAs,
  onSignIn,
  onSignOut,
  onSend,
}: {
  /** `undefined` while loading. Newest first. */
  messages: GuestbookMessage[] | undefined;
  signedInAs: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onSend: (message: string) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!signedInAs) return onSignIn();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={styles.guestbook} data-window-drag-ignore>
      <Glass
        as="div"
        {...APP_GLASS}
        className={`${appGlass} ${styles.composer}`}
        style={{ "--radius": "23px" } as React.CSSProperties}
      >
        <input
          type="text"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          className={styles.input}
          placeholder={
            signedInAs ? "Leave a message" : "Sign in to leave a message"
          }
          aria-label="Your message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void send();
          }}
          maxLength={280}
          disabled={sending}
        />
        {signedInAs ? (
          <button
            type="button"
            className={`${styles.button} ${styles.send}`}
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
          >
            Send
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.button} ${styles.signIn}`}
            onClick={onSignIn}
          >
            <GoogleG />
            Sign in
          </button>
        )}
      </Glass>
      {signedInAs && (
        <p className={styles.account}>
          Signed in as {signedInAs}.{" "}
          <button type="button" className={styles.signOut} onClick={onSignOut}>
            Sign out
          </button>
        </p>
      )}

      {messages === undefined ? (
        <p className={styles.note}>Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className={styles.note}>No messages yet. Be the first.</p>
      ) : (
        <ul className={styles.entries}>
          {messages.map((entry) => (
            <li
              key={entry._id}
              className={styles.entry}
              tabIndex={0}
              aria-label={`${entry.name}, ${stamp.format(entry._creationTime)}: ${entry.message}`}
            >
              {entry.avatarUrl ? (
                <Image
                  src={entry.avatarUrl}
                  alt=""
                  width={26}
                  height={26}
                  className={styles.avatar}
                  unoptimized
                />
              ) : (
                <span className={styles.initial} aria-hidden>
                  {entry.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
              )}
              <p className={styles.message}>{entry.message}</p>
              {/* Who and when, shown only while the row is hovered or focused. */}
              <span className={styles.tip} role="tooltip">
                {entry.name} · {stamp.format(entry._creationTime)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
