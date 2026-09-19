"use client";

import { useEffect } from "react";
import { DesktopShell } from "@/app/_components/desktop-shell";
import type { NotesData } from "@/lib/mock-desktop-data";
import { useDesktopStore } from "@/lib/stores/desktop-store";

export function EmbeddedDesktop({ notesData }: { notesData: NotesData }) {
  useEffect(() => {
    if (window.parent === window) return;
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent
      )
        return;
      if (
        event.data?.type === "journey:open-note" &&
        typeof event.data.slug === "string" &&
        notesData.notesBySlug[event.data.slug]
      ) {
        useDesktopStore.getState().selectNote(event.data.slug);
      }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape")
        window.parent.postMessage(
          { type: "journey:return" },
          window.location.origin,
        );
    };
    const send = (type: string, active?: boolean) =>
      window.parent.postMessage({ type, active }, window.location.origin);
    const down = () => send("journey:drag", true);
    const up = () => send("journey:drag", false);
    const inside = () => send("journey:inside");
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    document.documentElement.addEventListener("pointerenter", inside);
    window.addEventListener("message", receive);
    window.addEventListener("keydown", key);
    window.parent.postMessage(
      { type: "journey:ready" },
      window.location.origin,
    );
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      document.documentElement.removeEventListener("pointerenter", inside);
      window.removeEventListener("message", receive);
      window.removeEventListener("keydown", key);
    };
  }, [notesData]);
  return (
    <DesktopShell initialPathname="/notes/about-me" notesData={notesData} />
  );
}
