"use client";

import { Component, useState, type ReactNode } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { ConvexClientProvider } from "@/app/_components/convex-provider";
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

const day = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

class GuestbookBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed)
      return (
        <section className={styles.guestbook}>
          <p className={styles.note}>The guestbook can’t be reached right now.</p>
        </section>
      );
    return this.props.children;
  }
}

/** The guestbook under a shared note, on both the desktop and the phone view. */
export function Guestbook() {
  return (
    <GuestbookBoundary>
      <ConvexClientProvider>
        <GuestbookLive />
      </ConvexClientProvider>
    </GuestbookBoundary>
  );
}

function GuestbookLive() {
  const { data: session } = authClient.useSession();
  const messages = useQuery(api.guestbook.list);
  const addMessage = useMutation(api.guestbook.add);
  const signIn = () =>
    authClient.signIn.social({ provider: "google", callbackURL: window.location.href });
  return (
    <GuestbookView
      messages={messages}
      signedInAs={session ? (session.user.name ?? "you") : null}
      onSignIn={signIn}
      onSignOut={() => authClient.signOut()}
      onSend={(message) => addMessage({ message })}
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
          placeholder={signedInAs ? "Leave a message" : "Sign in to leave a message"}
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
          <button type="button" className={`${styles.button} ${styles.signIn}`} onClick={onSignIn}>
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
        <>
          <p className={styles.count}>
            {messages.length} message{messages.length === 1 ? "" : "s"}
          </p>
          <ul className={styles.entries}>
            {messages.map((entry) => (
              <li key={entry._id} className={styles.entry}>
                {entry.avatarUrl ? (
                  <Image
                    src={entry.avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    className={styles.avatar}
                    unoptimized
                  />
                ) : (
                  <span className={styles.initial} aria-hidden>
                    {entry.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                )}
                <div className={styles.body}>
                  <p className={styles.who}>
                    <span className={styles.name}>{entry.name}</span>
                    <time
                      className={styles.when}
                      dateTime={new Date(entry._creationTime).toISOString()}
                    >
                      {day.format(entry._creationTime)}
                    </time>
                  </p>
                  <p className={styles.message}>{entry.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
