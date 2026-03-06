"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import { WindowControls } from "@/app/_components/window-controls";
import { useMusicPlayer } from "@/lib/use-music-player";
import {
  songs,
  albums,
  artists,
  songById,
  albumById,
  artistById,
  frequentlyPlayedIds,
  homeFeatured,
  type Song,
  type Album,
  type Artist,
} from "@/lib/music-data";
import styles from "./music-window.module.css";

// Deterministic seeded shuffle (mulberry32). Same seed → same order every time.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = seed >>> 0;
  const rand = () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const SHUFFLED_SONGS = seededShuffle(songs, 0xdeadbeef);

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

// ─────────────────────────────────────────────────────────────────────────────
// View types
// ─────────────────────────────────────────────────────────────────────────────
type View =
  | { id: "home" }
  | { id: "frequently-played" }
  | { id: "artists" }
  | { id: "albums" }
  | { id: "songs" }
  | { id: "album-detail"; albumId: string }
  | { id: "artist-detail"; artistId: string };

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
function IconHeart() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 13S2 9.5 2 5.5a3.5 3.5 0 0 1 6-2.45A3.5 3.5 0 0 1 14 5.5C14 9.5 8 13 8 13Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconPerson() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 13.5c.6-2.5 2.5-4 5-4s4.4 1.5 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconDisc() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function IconMusic() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 12V4l7-1.5v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.5" cy="12" r="1.75" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11.5" cy="10.5" r="1.75" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Player bar icons
// ─────────────────────────────────────────────────────────────────────────────
function IconPrev() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4 4v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 4L7 9l7 5V4Z" fill="currentColor" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M5.5 3.5L14.5 9l-9 5.5V3.5Z" fill="currentColor" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="4" y="3" width="3.5" height="12" rx="1" fill="currentColor" />
      <rect x="10.5" y="3" width="3.5" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}
function IconNext() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M14 4v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 4l7 5-7 5V4Z" fill="currentColor" />
    </svg>
  );
}
function IconVolumeLow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 5.5v5h2.5l3.5 3V2.5L5 5.5H2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 6a3 3 0 0 1 0 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconVolumeHigh() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 5.5v5h2.5l3.5 3V2.5L5 5.5H2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 6a3 3 0 0 1 0 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13 4a6 6 0 0 1 0 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPlayFill({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3.5 2.5L11.5 7l-8 4.5V2.5Z" fill="currentColor" />
    </svg>
  );
}
function IconEqualizer() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="0" y="4" width="2" height="8" rx="1" fill="currentColor">
        <animate attributeName="height" values="8;4;8;6;8" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="y" values="4;6;4;5;4" dur="1.2s" repeatCount="indefinite" />
      </rect>
      <rect x="5" y="2" width="2" height="10" rx="1" fill="currentColor">
        <animate attributeName="height" values="10;6;10;8;10" dur="0.9s" repeatCount="indefinite" />
        <animate attributeName="y" values="2;4;2;3;2" dur="0.9s" repeatCount="indefinite" />
      </rect>
      <rect x="10" y="5" width="2" height="7" rx="1" fill="currentColor">
        <animate attributeName="height" values="7;5;7;4;7" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="5;6;5;7;5" dur="1.5s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function formatSeconds(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface SongRowProps {
  song: Song;
  index?: number;
  isPlaying: boolean;
  isCurrent: boolean;
  onPlay: (songId: string, contextIds?: string[]) => void;
  contextIds?: string[];
  showAlbum?: boolean;
  showArtwork?: boolean;
}

function SongRow({
  song,
  index,
  isPlaying,
  isCurrent,
  onPlay,
  contextIds,
  showAlbum = false,
  showArtwork = true,
}: SongRowProps) {
  return (
    <div
      className={[
        styles.songRow,
        isCurrent ? styles.songRowActive : "",
        showAlbum ? styles.hasAlbum : "",
        !showArtwork ? styles.noArtwork : "",
      ].join(" ")}
      onDoubleClick={() => onPlay(song.id, contextIds)}
      data-window-drag-ignore
    >
      <div className={styles.songRowNum}>
        {isCurrent && isPlaying ? (
          <span className={styles.equalizerWrap}><IconEqualizer /></span>
        ) : isCurrent ? (
          <span className={styles.songRowPlayIcon}><IconPlayFill /></span>
        ) : (
          <span className={styles.songRowIndexText}>{index ?? song.trackNumber}</span>
        )}
      </div>
      {showArtwork && (
        <img
          src={song.artworkUrl}
          alt={song.albumTitle}
          className={styles.songRowArt}
          loading="lazy"
        />
      )}
      <div className={styles.songRowInfo}>
        <span className={styles.songRowTitle}>{song.title}</span>
        <span className={styles.songRowArtist}>{song.artist}</span>
      </div>
      {showAlbum && (
        <span className={styles.songRowAlbum}>{song.albumTitle}</span>
      )}
      <span className={styles.songRowDuration}>{formatDuration(song.durationMs)}</span>
    </div>
  );
}

// ── Home view ────────────────────────────────────────────────────────────────
function HomeView({
  player,
  onNavigate,
}: {
  player: ReturnType<typeof useMusicPlayer>;
  onNavigate: (v: View) => void;
}) {
  const frequentSongs = frequentlyPlayedIds
    .map((id) => songById[id])
    .filter(Boolean) as Song[];

  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <h1 className={styles.pageTitle}>Home</h1>

      {/* Featured picks */}
      <p className={styles.pageSubTitle}>Top Picks for Nikhil</p>
      <section className={styles.picksRow}>
        {homeFeatured.map((pick) => {
          const album = albumById[pick.albumId];
          return (
            <article
              key={pick.albumId}
              className={`${styles.pickCard} ${styles[`accent${pick.accent}`]}`}
              onClick={() => onNavigate({ id: "album-detail", albumId: pick.albumId })}
              data-window-drag-ignore
            >
              {album && (
                <img
                  src={album.artworkUrl}
                  alt={album.title}
                  className={styles.pickArt}
                  loading="lazy"
                />
              )}
              <div className={styles.pickMeta}>
                <p className={styles.pickLabel}>{pick.label}</p>
                <p className={styles.pickTitle}>{pick.title}</p>
              </div>
            </article>
          );
        })}
      </section>

      {/* Frequently played */}
      <p className={styles.sectionHeader}>Frequently Played</p>
      <section className={styles.songList}>
        {frequentSongs.map((song, i) => (
          <SongRow
            key={song.id}
            song={song}
            index={i + 1}
            isPlaying={player.isPlaying}
            isCurrent={player.currentSong?.id === song.id}
            onPlay={player.play}
            contextIds={frequentlyPlayedIds}
            showAlbum
          />
        ))}
      </section>
    </div>
  );
}

// ── Frequently Played view ────────────────────────────────────────────────────
function FrequentlyPlayedView({ player }: { player: ReturnType<typeof useMusicPlayer> }) {
  const frequentSongs = frequentlyPlayedIds
    .map((id) => songById[id])
    .filter(Boolean) as Song[];

  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <h1 className={styles.pageTitle}>Frequently Played</h1>
      <section className={styles.songList}>
        {frequentSongs.map((song, i) => (
          <SongRow
            key={song.id}
            song={song}
            index={i + 1}
            isPlaying={player.isPlaying}
            isCurrent={player.currentSong?.id === song.id}
            onPlay={player.play}
            contextIds={frequentlyPlayedIds}
            showAlbum
          />
        ))}
      </section>
    </div>
  );
}

// ── Artists view ──────────────────────────────────────────────────────────────
function ArtistsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <h1 className={styles.pageTitle}>Artists</h1>
      <section className={styles.artistGrid}>
        {artists.map((artist) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            onClick={() => onNavigate({ id: "artist-detail", artistId: artist.id })}
          />
        ))}
      </section>
    </div>
  );
}

// ── Albums view ───────────────────────────────────────────────────────────────
const HIDDEN_ALBUM_IDS = new Set(["singles", "fouryou"]);

function AlbumsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const visibleAlbums = albums.filter((a) => !HIDDEN_ALBUM_IDS.has(a.id));
  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <h1 className={styles.pageTitle}>Albums</h1>
      <section className={styles.albumGrid}>
        {visibleAlbums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => onNavigate({ id: "album-detail", albumId: album.id })}
          />
        ))}
      </section>
    </div>
  );
}

// ── Songs view ────────────────────────────────────────────────────────────────
function SongsView({ player }: { player: ReturnType<typeof useMusicPlayer> }) {
  const allIds = SHUFFLED_SONGS.map((s) => s.id);
  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <h1 className={styles.pageTitle}>Songs</h1>
      <div className={styles.songTableHeader}>
        <span>#</span>
        <span />
        <span>Title</span>
        <span className={styles.hideOnSmall}>Album</span>
        <span className={styles.songRowDurationHeader}>Time</span>
      </div>
      <section className={styles.songList}>
        {SHUFFLED_SONGS.map((song, i) => (
          <SongRow
            key={song.id}
            song={song}
            index={i + 1}
            isPlaying={player.isPlaying}
            isCurrent={player.currentSong?.id === song.id}
            onPlay={player.play}
            contextIds={allIds}
            showAlbum
          />
        ))}
      </section>
    </div>
  );
}

// ── Album detail view ─────────────────────────────────────────────────────────
function AlbumDetailView({
  albumId,
  player,
  onBack,
}: {
  albumId: string;
  player: ReturnType<typeof useMusicPlayer>;
  onBack: () => void;
}) {
  const album = albumById[albumId];
  if (!album) return null;
  const albumSongs = album.songIds
    .map((id) => songById[id])
    .filter(Boolean) as Song[];
  const isAlbumPlaying =
    player.isPlaying && albumSongs.some((s) => s.id === player.currentSong?.id);

  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      {/* Back button */}
      <button type="button" className={styles.backBtn} onClick={onBack} data-window-drag-ignore aria-label="Back">
        <IconChevronLeft />
      </button>

      {/* Hero */}
      <div className={styles.albumHero}>
        <img src={album.artworkUrl} alt={album.title} className={styles.albumHeroArt} />
        <div className={styles.albumHeroInfo}>
          <p className={styles.albumHeroLabel}>Album</p>
          <h1 className={styles.albumHeroTitle}>{album.title}</h1>
          <p className={styles.albumHeroArtist}>{album.artist}</p>
          <p className={styles.albumHeroMeta}>
            {album.year} · {album.genre} · {albumSongs.length} songs
          </p>
          <div className={styles.albumHeroActions}>
            <button
              type="button"
              className={styles.playAlbumBtn}
              data-window-drag-ignore
              onClick={() =>
                player.play(albumSongs[0].id, album.songIds)
              }
            >
              <IconPlay />
              {isAlbumPlaying ? "Playing" : "Play"}
            </button>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className={styles.albumTrackList}>
        {albumSongs.map((song, i) => (
          <SongRow
            key={song.id}
            song={song}
            index={i + 1}
            isPlaying={player.isPlaying}
            isCurrent={player.currentSong?.id === song.id}
            onPlay={player.play}
            contextIds={album.songIds}
            showArtwork={false}
          />
        ))}
      </div>
    </div>
  );
}

// ── Artist detail view ────────────────────────────────────────────────────────
function ArtistDetailView({
  artistId,
  player,
  onBack,
  onNavigate,
}: {
  artistId: string;
  player: ReturnType<typeof useMusicPlayer>;
  onBack: () => void;
  onNavigate: (v: View) => void;
}) {
  const artist = artistById[artistId];
  if (!artist) return null;
  const artistAlbums = artist.albumIds
    .map((id) => albumById[id])
    .filter(Boolean) as Album[];
  // Primary match: songs in albums owned by this artist
  // Fallback: songs where the artist's name is the primary (first) credited artist
  const artistSongs = songs.filter((s) => {
    const album = albumById[s.albumId];
    if (album?.artistId === artistId) return true;
    // Match "Harrdy Sandhu", "Harrdy Sandhu & B. Praak", "Inder Chahal", etc.
    const primary = s.artist.split(/[,&]/)[0].trim();
    return primary.toLowerCase() === artist.name.toLowerCase();
  });

  return (
    <div className={styles.contentScroll} data-window-drag-ignore>
      <button type="button" className={styles.backBtn} onClick={onBack} data-window-drag-ignore aria-label="Back">
        <IconChevronLeft />
      </button>

      {/* Artist hero */}
      <div className={styles.artistHero}>
        <img src={artist.artworkUrl} alt={artist.name} className={styles.artistHeroArt} />
        <div className={styles.artistHeroInfo}>
          <p className={styles.albumHeroLabel}>Artist</p>
          <h1 className={styles.albumHeroTitle}>{artist.name}</h1>
          <p className={styles.albumHeroMeta}>
            {artistAlbums.length > 0 && `${artistAlbums.length} album${artistAlbums.length !== 1 ? "s" : ""} · `}{artistSongs.length} song{artistSongs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Albums */}
      {artistAlbums.length > 0 && (
        <>
          <p className={styles.sectionHeader}>Albums</p>
          <section className={styles.albumGrid}>
            {artistAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => onNavigate({ id: "album-detail", albumId: album.id })}
              />
            ))}
          </section>
        </>
      )}

      {/* Songs */}
      {artistSongs.length > 0 && (
        <>
          <p className={styles.sectionHeader}>Songs</p>
          <section className={styles.songList}>
            {artistSongs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i + 1}
                isPlaying={player.isPlaying}
                isCurrent={player.currentSong?.id === song.id}
                onPlay={player.play}
                contextIds={artistSongs.map((s) => s.id)}
                showAlbum
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

// ── Reusable cards ────────────────────────────────────────────────────────────
function AlbumCard({ album, onClick }: { album: Album; onClick: () => void }) {
  return (
    <button type="button" className={styles.albumCard} onClick={onClick} data-window-drag-ignore>
      <img src={album.artworkUrl} alt={album.title} className={styles.albumCardArt} loading="lazy" />
      <p className={styles.albumCardTitle}>{album.title}</p>
      <p className={styles.albumCardArtist}>{album.artist}</p>
    </button>
  );
}

function ArtistCard({ artist, onClick }: { artist: Artist; onClick: () => void }) {
  return (
    <button type="button" className={styles.artistCard} onClick={onClick} data-window-drag-ignore>
      <img src={artist.artworkUrl} alt={artist.name} className={styles.artistCardArt} loading="lazy" />
      <p className={styles.artistCardName}>{artist.name}</p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Player bar
// ─────────────────────────────────────────────────────────────────────────────
function PlayerBar({ player }: { player: ReturnType<typeof useMusicPlayer> }) {
  const [volumeHovered, setVolumeHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVolumeEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setVolumeHovered(true);
  };
  const handleVolumeLeave = () => {
    leaveTimer.current = setTimeout(() => setVolumeHovered(false), 300);
  };

  const { currentSong, isPlaying, currentTime, duration, volume } = player;

  return (
    <div className={styles.playerBar} data-window-drag-ignore>
      {/* Left: transport controls */}
      <div className={styles.playerLeft}>
        <button
          type="button"
          className={styles.playerBtn}
          aria-label="Previous"
          onClick={player.prev}
          data-window-drag-ignore
        >
          <IconPrev />
        </button>
        <button
          type="button"
          className={`${styles.playerBtn} ${styles.playerBtnPlay}`}
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={() => player.togglePlay()}
          data-window-drag-ignore
        >
          {isPlaying ? <IconPause /> : <IconPlay />}
        </button>
        <button
          type="button"
          className={styles.playerBtn}
          aria-label="Next"
          onClick={player.next}
          data-window-drag-ignore
        >
          <IconNext />
        </button>
      </div>

      {/* Center: thumb · title — artist · progress · time (all one row) */}
      <div className={styles.playerCenter}>
        {currentSong ? (
          <>
            <img
              src={currentSong.artworkUrl}
              alt={currentSong.albumTitle}
              className={styles.trackThumb}
            />
            <div className={styles.trackMeta}>
              <p className={styles.trackTitle}>{currentSong.title}</p>
            </div>
            {duration > 0 && (
              <div className={styles.progressWrap} data-window-drag-ignore>
                <input
                  type="range"
                  className={styles.progressBar}
                  min={0}
                  max={duration}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => player.seek(Number(e.target.value))}
                  data-window-drag-ignore
                  style={{
                    "--progress": `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  } as React.CSSProperties}
                />
              </div>
            )}
            {duration > 0 && (
              <span className={styles.progressTime}>
                {formatSeconds(currentTime)}&thinsp;/&thinsp;{formatSeconds(duration)}
              </span>
            )}
          </>
        ) : (
          <span className={styles.noSong}>Double-click a song to play</span>
        )}
      </div>

      {/* Right: volume */}
      <div
        className={styles.playerRight}
        onMouseEnter={handleVolumeEnter}
        onMouseLeave={handleVolumeLeave}
      >
        <input
          type="range"
          className={`${styles.volumeSlider} ${volumeHovered ? styles.volumeSliderVisible : ""}`}
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => player.setVolume(Number(e.target.value))}
          aria-label="Volume"
          data-window-drag-ignore
        />
        <button
          type="button"
          className={styles.playerBtn}
          aria-label="Volume"
          data-window-drag-ignore
        >
          {volume === 0 ? <IconVolumeLow /> : <IconVolumeHigh />}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
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

  const player = useMusicPlayer();

  useEffect(() => {
    if (!isOpen) player.pause();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
        {/* ═══════════════════ SIDEBAR ═══════════════════ */}
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

        {/* ═══════════════════ CONTENT ═══════════════════ */}
        <main className={styles.content} onPointerDown={handleDragStart}>
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
