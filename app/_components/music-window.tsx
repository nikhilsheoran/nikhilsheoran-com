"use client";

import { useCallback, useState } from "react";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import { WindowControls } from "@/app/_components/window-controls";
import styles from "./music-window.module.css";

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

const sidebarMain = ["Home", "New", "Radio"] as const;
const libraryItems = ["Recently Added", "Artists", "Albums", "Songs"] as const;

const topPicks = [
  { title: "New Music", subtitle: "Made for You", accent: "pink" },
  { title: "Block - Single", subtitle: "New Release", accent: "blue" },
  { title: "Energy", subtitle: "Mood for You", accent: "green" },
  { title: "Gym Focus", subtitle: "Featured", accent: "dark" },
] as const;

const recentCards = [
  { title: "AGE 19", artist: "Jass Manak" },
  { title: "Run", artist: "Diljit Dosanjh" },
  { title: "Workout", artist: "AP Dhillon" },
  { title: "Punjabi Mix", artist: "Various Artists" },
] as const;

interface MusicWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate?: () => void;
  zIndex?: number;
}

export function MusicWindow({ isOpen, onClose, onActivate, zIndex }: MusicWindowProps) {
  const getBounds = useCallback((windowSize: WindowSize) => {
    return {
      minX: -(windowSize.width - WINDOW_VISIBLE_EDGE),
      maxX: window.innerWidth - WINDOW_VISIBLE_EDGE,
      minY: MENU_BAR_HEIGHT + 8,
      maxY: window.innerHeight - DOCK_RESERVED_HEIGHT - WINDOW_VISIBLE_TOP,
    };
  }, []);

  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 130, y: 90 },
    getBounds,
    disabled: !isOpen,
  });

  const [selectedTab, setSelectedTab] = useState<(typeof sidebarMain)[number]>("Home");

  if (!isOpen) return null;

  return (
    <section
      ref={windowRef}
      className={styles.window}
      onPointerDownCapture={onActivate}
      style={{
        width: "min(1280px, calc(100vw - 92px))",
        height: "min(650px, calc(100vh - 132px))",
        zIndex,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} />
          </div>

          <div className={styles.sidebarScroll}>
            <div className={styles.searchRow}>Search</div>

            {sidebarMain.map((item) => (
              <button
                key={item}
                type="button"
                data-window-drag-ignore
                className={`${styles.sidebarItem} ${selectedTab === item ? styles.sidebarItemActive : ""}`}
                onClick={() => setSelectedTab(item)}
              >
                {item}
              </button>
            ))}

            <p className={styles.sectionTitle}>Library</p>
            {libraryItems.map((item) => (
              <button key={item} type="button" data-window-drag-ignore className={styles.sidebarItem}>
                {item}
              </button>
            ))}
          </div>
        </aside>

        <main className={styles.content}>
          <div className={styles.contentScroll}>
            <h1 className={styles.pageTitle}>{selectedTab}</h1>
            <p className={styles.pageSubTitle}>Top Picks for You</p>

            <section className={styles.picksRow}>
              {topPicks.map((pick) => (
                <article key={pick.title} className={`${styles.pickCard} ${styles[`accent${pick.accent}`]}`}>
                  <p className={styles.pickLabel}>{pick.subtitle}</p>
                  <p className={styles.pickTitle}>{pick.title}</p>
                </article>
              ))}
            </section>

            <p className={styles.sectionHeader}>Recently Played</p>
            <section className={styles.recentRow}>
              {recentCards.map((item) => (
                <article key={item.title} className={styles.recentCard}>
                  <div className={styles.recentArtwork} />
                  <p>{item.title}</p>
                  <span>{item.artist}</span>
                </article>
              ))}
            </section>
          </div>

          <div className={styles.playerBar}>
            <div className={styles.playerLeft}>
              <button type="button" data-window-drag-ignore className={styles.playerBtn}>
                ⏮
              </button>
              <button type="button" data-window-drag-ignore className={styles.playerBtn}>
                ⏯
              </button>
              <button type="button" data-window-drag-ignore className={styles.playerBtn}>
                ⏭
              </button>
            </div>
            <div className={styles.playerCenter}>
              <div className={styles.trackThumb} />
              <div>
                <p>Manaka Da Munda</p>
                <span>Jass Manak</span>
              </div>
            </div>
            <div className={styles.playerRight}>🔊</div>
          </div>
        </main>
      </div>
    </section>
  );
}

