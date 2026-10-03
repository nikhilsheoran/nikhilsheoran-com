"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggableWindow } from "@/lib/use-draggable-window";
import {
  getDesktopWindowBounds,
  getDesktopWindowFrameStyle,
} from "@/lib/desktop-window";
import { WindowControls } from "./window-controls";
import styles from "./doom-window.module.css";

interface DoomWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate?: () => void;
  zIndex?: number;
}

type Phase = "loading" | "ready" | "running" | "error";

/**
 * Doom, the 1993 shareware episode, running in DOSBox compiled for the browser
 * (js-dos). The emulator lives in /games/doom.html inside a sandboxed frame
 * with no access to the rest of the site.
 *
 * The window is mounted (hidden) as soon as the desktop is idle, so the frame
 * fetches the emulator and the game in the background. Opening the window then
 * only has to say "start"; closing it says "stop" and keeps everything loaded.
 */
export function DoomWindow({
  isOpen,
  onClose,
  onActivate,
  zIndex,
}: DoomWindowProps) {
  const { windowRef, position, isDragging, handleDragStart } =
    useDraggableWindow({
      initialPosition: { x: 190, y: 44 },
      getBounds: getDesktopWindowBounds,
      disabled: !isOpen,
    });
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  // What the frame reports. It is sandboxed (no origin), so check the sender.
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source !== frameRef.current?.contentWindow ||
        event.data?.source !== "doom"
      )
        return;
      if (event.data.type === "ready")
        setPhase((now) => (now === "running" ? now : "ready"));
      if (event.data.type === "started") setPhase("running");
      if (event.data.type === "error") setPhase("error");
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  // Start when the window opens (or as soon as the game has loaded), stop when it closes.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame?.contentWindow || phase === "loading" || phase === "error")
      return;
    if (isOpen && phase === "ready") {
      frame.contentWindow.postMessage({ type: "doom:start" }, "*");
      frame.focus();
    }
    if (!isOpen && phase === "running") {
      frame.contentWindow.postMessage({ type: "doom:stop" }, "*");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Mirrors the frame, which has just been told to stop.
      setPhase("ready");
    }
  }, [isOpen, phase]);

  return (
    <section
      ref={windowRef}
      className={styles.window}
      hidden={!isOpen}
      onPointerDownCapture={onActivate}
      style={getDesktopWindowFrameStyle({
        maxWidth: 1060,
        maxHeight: 706,
        position,
        zIndex,
        isDragging,
      })}
    >
      <header className={styles.titleBar} onPointerDown={handleDragStart}>
        <WindowControls onClose={onClose} windowName="Doom" />
        <p className={styles.title}>Doom</p>
      </header>
      <div className={styles.screen}>
        <iframe
          ref={frameRef}
          className={`${styles.frame} ${isDragging ? styles.frameDragging : ""}`}
          src="/games/doom.html"
          title="Doom"
          sandbox="allow-scripts allow-pointer-lock"
          allow="autoplay; fullscreen"
        />
        {phase !== "running" && (
          <p className={styles.loading}>
            {phase === "error" ? "Doom could not be loaded." : "Loading Doom…"}
          </p>
        )}
      </div>
    </section>
  );
}
