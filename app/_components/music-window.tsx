"use client";

import { useState } from "react";
import { useDraggableWindow } from "@/lib/use-draggable-window";
import { getDesktopWindowBounds } from "@/lib/desktop-window";
import { WindowControls } from "@/app/_components/window-controls";
import type { MusicPlayer } from "@/lib/use-music-player";
import { IconHome, IconHeart, IconPerson, IconDisc, IconMusic } from "@/app/_components/music/music-icons";
import {
  type View,
  HomeView,
  FrequentlyPlayedView,
  ArtistsView,
  AlbumsView,
  SongsView,
  AlbumDetailView,
  ArtistDetailView,
} from "@/app/_components/music/music-views";
import { PlayerBar } from "@/app/_components/music/music-player-bar";
import styles from "./music-window.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar items
// ─────────────────────────────────────────────────────────────────────────────
const sidebarTopItems: Array<{ viewId: View["id"]; label: string; Icon: React.FC }> = [
  { viewId: "home", label: "Home", Icon: IconHome },
];

const sidebarLibraryItems: Array<{ viewId: View["id"]; label: string; Icon: React.FC }> = [
  { viewId: "frequently-played", label: "Frequently Played", Icon: IconHeart },
  { viewId: "artists", label: "Artists", Icon: IconPerson },
  { viewId: "albums", label: "Albums", Icon: IconDisc },
  { viewId: "songs", label: "Songs", Icon: IconMusic },
];

// ─────────────────────────────────────────────────────────────────────────────
// MusicWindow
// ─────────────────────────────────────────────────────────────────────────────
interface MusicWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate?: () => void;
  zIndex?: number;
  player: MusicPlayer;
}

export function MusicWindow({ isOpen, onClose, onActivate, zIndex, player }: MusicWindowProps) {
  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 130, y: 90 },
    getBounds: getDesktopWindowBounds,
    disabled: !isOpen,
  });

  const [view, setView] = useState<View>({ id: "home" });
  const [viewHistory, setViewHistory] = useState<View[]>([{ id: "home" }]);

  const navigate = (v: View) => {
    setView(v);
    setViewHistory((h) => [...h, v]);
  };

  const goBack = () => {
    if (viewHistory.length <= 1) return;
    const prev = viewHistory[viewHistory.length - 2];
    setViewHistory((h) => h.slice(0, -1));
    setView(prev);
  };

  // Determine active sidebar key
  const activeSidebarId: View["id"] =
    view.id === "album-detail" || view.id === "artist-detail" ? "albums" : view.id;

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
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} windowName="Music" />
          </div>

          <div className={styles.sidebarScroll}>
            <div className={styles.sidebarGroup}>
              {sidebarTopItems.map(({ viewId, label, Icon }) => (
                <button
                  key={viewId}
                  type="button"
                  data-window-drag-ignore
                  className={`${styles.sidebarItem} ${activeSidebarId === viewId ? styles.sidebarItemActive : ""}`}
                  onClick={() => navigate({ id: viewId } as View)}
                >
                  <span className={styles.sidebarIcon}><Icon /></span>
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.sidebarGroup}>
              <p className={styles.sectionTitle}>Library</p>
              {sidebarLibraryItems.map(({ viewId, label, Icon }) => (
                <button
                  key={viewId}
                  type="button"
                  data-window-drag-ignore
                  className={`${styles.sidebarItem} ${activeSidebarId === viewId ? styles.sidebarItemActive : ""}`}
                  onClick={() => navigate({ id: viewId } as View)}
                >
                  <span className={styles.sidebarIcon}><Icon /></span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className={styles.content}>
          {/* Invisible drag strip across top of content area */}
          <div className={styles.contentDragHandle} onPointerDown={handleDragStart} />
          {view.id === "home" && (
            <HomeView player={player} onNavigate={navigate} />
          )}
          {view.id === "frequently-played" && (
            <FrequentlyPlayedView player={player} />
          )}
          {view.id === "artists" && (
            <ArtistsView onNavigate={navigate} />
          )}
          {view.id === "albums" && (
            <AlbumsView onNavigate={navigate} />
          )}
          {view.id === "songs" && (
            <SongsView player={player} />
          )}
          {view.id === "album-detail" && (
            <AlbumDetailView
              albumId={view.albumId}
              player={player}
              onBack={goBack}
            />
          )}
          {view.id === "artist-detail" && (
            <ArtistDetailView
              artistId={view.artistId}
              player={player}
              onBack={goBack}
              onNavigate={navigate}
            />
          )}

          <PlayerBar player={player} />
        </main>
      </div>
    </section>
  );
}
