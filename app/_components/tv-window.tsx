"use client";

import { useCallback, useState } from "react";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import { WindowControls } from "@/app/_components/window-controls";
import styles from "./tv-window.module.css";

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

const sidebarItems = ["Home", "Apple TV", "MLS", "Store"] as const;
const libraryItems = ["Recently Added", "Movies", "TV Shows", "Family Sharing"] as const;

const continueWatching = ["Tehran", "Slow Horses", "Mythic Quest", "Severance"] as const;
const topShows = ["The Morning Show", "Silo", "Ted Lasso", "Shrinking", "Foundation"] as const;

interface TVWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate?: () => void;
  zIndex?: number;
}

export function TVWindow({ isOpen, onClose, onActivate, zIndex }: TVWindowProps) {
  const getBounds = useCallback((windowSize: WindowSize) => {
    return {
      minX: -(windowSize.width - WINDOW_VISIBLE_EDGE),
      maxX: window.innerWidth - WINDOW_VISIBLE_EDGE,
      minY: MENU_BAR_HEIGHT + 8,
      maxY: window.innerHeight - DOCK_RESERVED_HEIGHT - WINDOW_VISIBLE_TOP,
    };
  }, []);

  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 168, y: 114 },
    getBounds,
    disabled: !isOpen,
  });

  const [selectedMenu, setSelectedMenu] = useState<(typeof sidebarItems)[number]>("Apple TV");

  if (!isOpen) return null;

  return (
    <section
      ref={windowRef}
      className={styles.window}
      onPointerDownCapture={onActivate}
      style={{
        width: "min(1260px, calc(100vw - 92px))",
        height: "min(640px, calc(100vh - 132px))",
        zIndex,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <div className={styles.canvas}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} windowName="TV" />
          </div>

          <div className={styles.sidebarScroll}>
            <p className={styles.search}>Search</p>

            {sidebarItems.map((item) => (
              <button
                key={item}
                type="button"
                data-window-drag-ignore
                onClick={() => setSelectedMenu(item)}
                className={`${styles.sidebarItem} ${selectedMenu === item ? styles.sidebarItemActive : ""}`}
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

          <div className={styles.userRow}>
            <span className={styles.userAvatar}>NS</span>
            <span>Nikhil Sheoran</span>
          </div>
        </aside>

        <main className={styles.content}>
          <div className={styles.contentScroll}>
            <section className={styles.hero}>
              <div className={styles.heroGradient} />
              <div className={styles.heroText}>
                <p className={styles.heroTitle}>THE MORNING SHOW</p>
                <p className={styles.heroMeta}>TV Show · Drama</p>
                <p className={styles.heroCopy}>Scandals, affairs, conspiracies. And that&apos;s just the newsroom.</p>
                <div className={styles.heroActions}>
                  <button type="button" data-window-drag-ignore className={styles.playButton}>
                    Play
                  </button>
                  <button type="button" data-window-drag-ignore className={styles.plusButton}>
                    +
                  </button>
                </div>
              </div>
              <button type="button" data-window-drag-ignore className={styles.muteButton}>
                🔇
              </button>
            </section>

            <section className={styles.section}>
              <p className={styles.sectionHeading}>Continue Watching on Apple TV</p>
              <div className={styles.horizontalRow}>
                {continueWatching.map((item) => (
                  <article key={item} className={styles.posterCard}>
                    <div className={styles.posterImage} />
                    <p>{item}</p>
                    <span>S1, E1 · 49m</span>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <p className={styles.sectionHeading}>Top 10 TV Shows</p>
              <div className={styles.horizontalRow}>
                {topShows.map((item, index) => (
                  <article key={item} className={styles.rankCard}>
                    <span className={styles.rank}>{index + 1}</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </section>
  );
}

