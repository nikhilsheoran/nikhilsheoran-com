"use client";

import { useState } from "react";
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

/**
 * Doom, the 1993 shareware episode, running in DOSBox compiled for the browser
 * (js-dos). The emulator lives in /games/doom.html inside a sandboxed frame:
 * nothing is fetched until Play is pressed (the game is a few megabytes), and
 * the frame has no access to the rest of the site.
 */
export function DoomWindow({ isOpen, onClose, onActivate, zIndex }: DoomWindowProps) {
  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 250, y: 74 },
    getBounds: getDesktopWindowBounds,
    disabled: !isOpen,
  });
  const [playing, setPlaying] = useState(false);

  if (!isOpen) return null;

  return (
    <section
      ref={windowRef}
      className={styles.window}
      onPointerDownCapture={onActivate}
      style={getDesktopWindowFrameStyle({
        maxWidth: 860,
        maxHeight: 620,
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
        {playing ? (
          <iframe
            className={`${styles.frame} ${isDragging ? styles.frameDragging : ""}`}
            src="/games/doom.html"
            title="Doom"
            sandbox="allow-scripts allow-pointer-lock"
            allow="autoplay; fullscreen"
          />
        ) : (
          <button
            type="button"
            className={styles.start}
            data-window-drag-ignore
            onClick={() => setPlaying(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- A static icon. */}
            <img className={styles.startIcon} src="/icons/doom.svg" alt="" />
            <p className={styles.startTitle}>Doom</p>
            <p className={styles.startHint}>
              The 1993 shareware episode. About 6 MB to load.
            </p>
            <span className={styles.startButton}>Play</span>
          </button>
        )}
      </div>
      <footer className={styles.status}>
        <span>Arrows to move, Ctrl to fire, Space to open doors</span>
        <span>Runs on js-dos and DOSBox</span>
      </footer>
    </section>
  );
}
