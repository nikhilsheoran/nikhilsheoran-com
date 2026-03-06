"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import { WindowControls } from "@/app/_components/window-controls";
import {
  shows,
  movies,
  showById,
  homeFeatured,
  recentlyWatchedIds,
  itemById,
  type TVShow,
  type TVItem,
  type WatchStatus,
} from "@/lib/tv-data";
import styles from "./tv-window.module.css";

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

// ─────────────────────────────────────────────────────────────────────────────
// View types
// ─────────────────────────────────────────────────────────────────────────────
type View =
  | { id: "home" }
  | { id: "my-picks" }
  | { id: "shows" }
  | { id: "movies" }
  | { id: "watchlist" };

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar icons
// ─────────────────────────────────────────────────────────────────────────────
function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 7.5 8 3l5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.75 8.5v4.75h8.5V8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconTV() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 11.5V14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconFilm() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1.5 6h3M1.5 10h3M11.5 6h3M11.5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconBookmark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 2.5h8a1 1 0 0 1 1 1v10l-5-3-5 3v-10a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2l1.6 4H14l-3.5 2.5 1.4 4.5L8 10.5 4.1 13l1.4-4.5L2 6h4.4L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Watch status badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status, progress }: { status: WatchStatus; progress?: string }) {
  const map: Record<WatchStatus, { label: string; cls: string }> = {
    completed: { label: "Completed", cls: styles.statusCompleted },
    watching: { label: progress ? `Watching · ${progress}` : "Watching", cls: styles.statusWatching },
    dropped: { label: progress ? `Dropped · ${progress}` : "Dropped", cls: styles.statusDropped },
    watchlist: { label: "Watchlist", cls: styles.statusWatchlist },
  };
  const { label, cls } = map[status];
  return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Poster card (shared for shows + movies grid)
// ─────────────────────────────────────────────────────────────────────────────
function PosterCard({ item }: { item: TVItem }) {
  return (
    <article className={styles.posterCard} data-window-drag-ignore>
      <div className={styles.posterImageWrap}>
        <Image
          src={item.posterUrl}
          alt={item.title}
          width={150}
          height={225}
          className={styles.posterImg}
          loading="lazy"
          unoptimized
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
            const fallback = el.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "block";
          }}
        />
        <div
          className={styles.posterFallback}
          style={{ background: item.posterGradient, display: "none" }}
        />
        <div className={styles.posterStatusBadge}>
          <StatusBadge status={item.status} progress={"watchProgress" in item ? item.watchProgress : undefined} />
        </div>
      </div>
      <div className={styles.posterBelow}>
        <p className={styles.posterTitle}>{item.title}</p>
        <div
          className={styles.posterRatingRow}
          data-tooltip={[
            `IMDb  ${item.imdbRating}`,
            item.myRating != null ? `My Rating  ${item.myRating}` : null,
          ]
            .filter(Boolean)
            .join("\n")}
        >
          <span className={styles.posterImdb}>
            <span className={styles.posterRatingStar}>★</span>
            {item.imdbRating}
          </span>
          {item.myRating && (
            <span className={styles.posterMine}>
              <span className={styles.posterRatingStarMine}>★</span>
              {item.myRating}
            </span>
          )}
        </div>
        <p className={styles.posterSubMeta}>
          {item.year}
          {item.type === "show" && ` · S${item.seasons}`}
          {item.type === "movie" && ` · ${item.runtime}m`}
          {" · "}{item.genres[0]}
        </p>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Wide landscape card (Recently Watched row on Home)
// ─────────────────────────────────────────────────────────────────────────────
function WideCard({ item }: { item: TVItem }) {
  const progress = "watchProgress" in item && item.watchProgress ? item.watchProgress : null;
  const show = item.type === "show" ? (item as TVShow) : null;
  let pct = 0;
  if (show && progress && item.status === "watching") {
    const m = progress.match(/S(\d+)/i);
    if (m) pct = Math.min(((Number(m[1]) - 0.5) / show.seasons) * 100, 95);
  } else if (item.status === "completed") {
    pct = 100;
  }
  return (
    <article className={styles.wideCard} data-window-drag-ignore>
      <Image
        src={item.posterUrl}
        alt={item.title}
        width={180}
        height={270}
        className={styles.wideCardImg}
        loading="lazy"
        unoptimized
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          el.style.display = "none";
          const fb = el.nextElementSibling as HTMLElement | null;
          if (fb) fb.style.display = "block";
        }}
      />
      <div
        className={styles.wideCardFallback}
        style={{ background: item.posterGradient }}
      />
      <div className={styles.wideCardOverlay}>
        <p className={styles.wideCardTitle}>{item.title}</p>
        <div className={styles.wideCardMeta}>
          <div className={styles.wideCardProgress}>
            <div className={styles.wideCardProgressFill} style={{ width: `${pct}%` }} />
          </div>
          {progress && <span className={styles.wideCardEp}>{progress}</span>}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home view
// ─────────────────────────────────────────────────────────────────────────────
function HomeView() {
  const recentItems = recentlyWatchedIds
    .map((id) => itemById[id])
    .filter(Boolean) as TVItem[];

  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      {/* Hero — Succession */}
      <section className={styles.hero}>
        <Image
          src="https://image.tmdb.org/t/p/w1280/bcdUYUFk8GdpZJPiSAas9UeocLH.jpg"
          alt="Succession"
          fill
          className={styles.heroImg}
          unoptimized
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <div className={styles.heroGradient} />
        <div className={styles.heroText}>
          <p className={styles.heroEyebrow}>Drama · 4 Seasons</p>
          <p className={styles.heroTitle}>SUCCESSION</p>
          <p className={styles.heroCopy}>
            Money. Power. Family. The Roys have it all — and it&apos;s tearing them apart.
          </p>
          <div className={styles.heroRatings}>
            <span className={styles.heroImdb}><span className={styles.imdbBadge}>IMDb</span> 8.9</span>
            <span className={styles.heroMyRating}>★ 10/10</span>
            <StatusBadge status="completed" />
          </div>
        </div>
      </section>

      {/* Featured picks */}
      <p className={styles.sectionHeader}>Top Picks for Nikhil</p>
      <section className={styles.picksRow}>
        {homeFeatured.map((pick) => {
          const item = itemById[pick.itemId];
          if (!item) return null;
          return (
            <article
              key={pick.itemId}
              className={`${styles.pickCard} ${styles[`accent${pick.accent}`]}`}
              data-window-drag-ignore
            >
              <Image
                src={item.posterUrl}
                alt={item.title}
                width={120}
                height={180}
                className={styles.pickArt}
                loading="lazy"
                unoptimized
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                  const fb = el.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = "block";
                }}
              />
              <div
                className={styles.pickFallback}
                style={{ background: item.posterGradient, display: "none" }}
              />
              <div className={styles.pickMeta}>
                <p className={styles.pickLabel}>{pick.label}</p>
                <p className={styles.pickTitle}>{pick.title}</p>
              </div>
            </article>
          );
        })}
      </section>

      {/* Recently watched */}
      <p className={styles.sectionHeader}>Continue Watching</p>
      <div className={styles.horizontalScroll}>
        {recentItems.map((item) => (
          <WideCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// My Picks view
// ─────────────────────────────────────────────────────────────────────────────
function MyPicksView() {
  const topShows = shows.filter((s) => s.myRating && s.myRating >= 9 && s.status !== "dropped" && s.status !== "watchlist");
  const topMovies = movies.filter((m) => m.myRating && m.myRating >= 9);
  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <h1 className={styles.pageTitle}>My Picks</h1>
      <p className={styles.pageSubTitle}>Shows I&apos;d rate 9 or 10</p>
      <section className={styles.posterGrid}>
        {topShows.map((s) => (
          <PosterCard key={s.id} item={s} />
        ))}
      </section>
      <p className={styles.sectionHeader}>Movies I&apos;d rate 9 or 10</p>
      <section className={styles.posterGrid}>
        {topMovies.map((m) => (
          <PosterCard key={m.id} item={m} />
        ))}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shows view
// ─────────────────────────────────────────────────────────────────────────────
function ShowsView() {
  const watching = shows.filter((s) => s.status === "watching");
  const completed = shows.filter((s) => s.status === "completed");
  const dropped = shows.filter((s) => s.status === "dropped");

  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <h1 className={styles.pageTitle}>TV Shows</h1>
      {watching.length > 0 && (
        <>
          <p className={styles.sectionHeader}>Currently Watching</p>
          <section className={styles.posterGrid}>
            {watching.map((s) => (
              <PosterCard key={s.id} item={s} />
            ))}
          </section>
        </>
      )}
      <p className={styles.sectionHeader}>Completed</p>
      <section className={styles.posterGrid}>
        {completed.map((s) => (
          <PosterCard key={s.id} item={s} />
        ))}
      </section>
      <p className={styles.sectionHeader}>Left In Between</p>
      <section className={styles.posterGrid}>
        {dropped.map((s) => (
          <PosterCard key={s.id} item={s} />
        ))}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Movies view
// ─────────────────────────────────────────────────────────────────────────────
function MoviesView() {
  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <h1 className={styles.pageTitle}>Movies</h1>
      <section className={styles.posterGrid}>
        {movies.map((m) => (
          <PosterCard key={m.id} item={m} />
        ))}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Watchlist view
// ─────────────────────────────────────────────────────────────────────────────
function WatchlistView() {
  const watchlistShows = shows.filter((s) => s.status === "watchlist");
  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <h1 className={styles.pageTitle}>Watchlist</h1>
      <p className={styles.pageSubTitle}>Up next</p>
      <section className={styles.watchlistList}>
        {watchlistShows.map((s, i) => (
          <article
            key={s.id}
            className={styles.watchlistRow}
            data-window-drag-ignore
          >
            <span className={styles.watchlistIndex}>{i + 1}</span>
            <div className={styles.watchlistPoster}>
              <Image
                src={s.posterUrl}
                alt={s.title}
                width={50}
                height={75}
                className={styles.watchlistPosterImg}
                loading="lazy"
                unoptimized
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                  const fb = el.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = "flex";
                }}
              />
              <div
                className={styles.watchlistPosterFallback}
                style={{ background: s.posterGradient }}
              />
            </div>
            <div className={styles.watchlistInfo}>
              <p className={styles.watchlistTitle}>{s.title}</p>
              <p className={styles.watchlistMeta}>
                {s.year}
                {s.endYear ? `–${s.endYear}` : ""} · {s.seasons} season{s.seasons !== 1 ? "s" : ""} · {s.genres.join(", ")}
              </p>
              <div className={styles.watchlistRatings}>
                <span className={styles.posterImdb}>
                  <span className={styles.posterRatingStar}>★</span>
                  {s.imdbRating}
                </span>
                {s.network && <span className={styles.networkTag}>{s.network}</span>}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar item groups
// ─────────────────────────────────────────────────────────────────────────────
const sidebarTopItems: Array<{ viewId: View["id"]; label: string; Icon: React.FC }> = [
  { viewId: "home", label: "Home", Icon: IconHome },
];

const sidebarLibraryItems: Array<{ viewId: View["id"]; label: string; Icon: React.FC }> = [
  { viewId: "shows", label: "TV Shows", Icon: IconTV },
  { viewId: "movies", label: "Movies", Icon: IconFilm },
  { viewId: "watchlist", label: "Watchlist", Icon: IconBookmark },
];

const sidebarPicksItems: Array<{ viewId: View["id"]; label: string; Icon: React.FC }> = [
  { viewId: "my-picks", label: "My Picks", Icon: IconStar },
];

// ─────────────────────────────────────────────────────────────────────────────
// TVWindow
// ─────────────────────────────────────────────────────────────────────────────
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

  const [view, setView] = useState<View>({ id: "home" });

  const navigate = (v: View) => setView(v);

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
        {/* ═══════════════════ SIDEBAR ═══════════════════ */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} windowName="TV" />
          </div>

          <div className={styles.sidebarScroll}>
            <div className={styles.sidebarGroup}>
              {sidebarTopItems.map(({ viewId, label, Icon }) => (
                <button
                  key={viewId}
                  type="button"
                  data-window-drag-ignore
                  className={`${styles.sidebarItem} ${view.id === viewId ? styles.sidebarItemActive : ""}`}
                  onClick={() => navigate({ id: viewId } as View)}
                >
                  <span className={styles.sidebarIcon}><Icon /></span>
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.sidebarGroup}>
              <p className={styles.sectionTitle}>My Library</p>
              {sidebarLibraryItems.map(({ viewId, label, Icon }) => (
                <button
                  key={viewId}
                  type="button"
                  data-window-drag-ignore
                  className={`${styles.sidebarItem} ${view.id === viewId ? styles.sidebarItemActive : ""}`}
                  onClick={() => navigate({ id: viewId } as View)}
                >
                  <span className={styles.sidebarIcon}><Icon /></span>
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.sidebarGroup}>
              <p className={styles.sectionTitle}>Curated</p>
              {sidebarPicksItems.map(({ viewId, label, Icon }) => (
                <button
                  key={viewId}
                  type="button"
                  data-window-drag-ignore
                  className={`${styles.sidebarItem} ${view.id === viewId ? styles.sidebarItemActive : ""}`}
                  onClick={() => navigate({ id: viewId } as View)}
                >
                  <span className={styles.sidebarIcon}><Icon /></span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ═══════════════════ CONTENT ═══════════════════ */}
        <main className={styles.content} onPointerDown={handleDragStart}>
          <div className={styles.contentDragStrip} />
          {view.id === "home" && <HomeView />}
          {view.id === "my-picks" && <MyPicksView />}
          {view.id === "shows" && <ShowsView />}
          {view.id === "movies" && <MoviesView />}
          {view.id === "watchlist" && <WatchlistView />}
        </main>
      </div>
    </section>
  );
}
