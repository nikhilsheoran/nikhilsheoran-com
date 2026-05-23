"use client";

import Image from "next/image";
import type { MusicPlayer } from "@/lib/use-music-player";
import {
  songs,
  albums,
  songById,
  albumById,
  artistById,
  artists,
  frequentlyPlayedIds,
  homeFeatured,
  type Song,
  type Album,
  type Artist,
} from "@/lib/music-data";
import {
  IconHeart,
  IconPrev,
  IconPlay,
  IconPause,
  IconNext,
  IconChevronLeft,
  IconPlayFill,
  IconEqualizer,
} from "@/app/_components/music/music-icons";
import styles from "../music-window.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// View types
// ─────────────────────────────────────────────────────────────────────────────
export type View =
  | { id: "home" }
  | { id: "frequently-played" }
  | { id: "artists" }
  | { id: "albums" }
  | { id: "songs" }
  | { id: "album-detail"; albumId: string }
  | { id: "artist-detail"; artistId: string };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SongRow
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
        <Image
          src={song.artworkUrl}
          alt={song.albumTitle}
          width={36}
          height={36}
          className={styles.songRowArt}
          loading="lazy"
          unoptimized
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

// ─────────────────────────────────────────────────────────────────────────────
// Reusable cards
// ─────────────────────────────────────────────────────────────────────────────
function AlbumCard({ album, onClick }: { album: Album; onClick: () => void }) {
  return (
    <button type="button" className={styles.albumCard} onClick={onClick} data-window-drag-ignore>
      <Image src={album.artworkUrl} alt={album.title} width={120} height={120} className={styles.albumCardArt} loading="lazy" unoptimized />
      <p className={styles.albumCardTitle}>{album.title}</p>
      <p className={styles.albumCardArtist}>{album.artist}</p>
    </button>
  );
}

function ArtistCard({ artist, onClick }: { artist: Artist; onClick: () => void }) {
  return (
    <button type="button" className={styles.artistCard} onClick={onClick} data-window-drag-ignore>
      <Image src={artist.artworkUrl} alt={artist.name} width={120} height={120} className={styles.artistCardArt} loading="lazy" unoptimized />
      <p className={styles.artistCardName}>{artist.name}</p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home view
// ─────────────────────────────────────────────────────────────────────────────
export function HomeView({
  player,
  onNavigate,
}: {
  player: MusicPlayer;
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
                <Image
                  src={album.artworkUrl}
                  alt={album.title}
                  width={160}
                  height={160}
                  className={styles.pickArt}
                  loading="lazy"
                  unoptimized
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

// ─────────────────────────────────────────────────────────────────────────────
// Frequently Played view
// ─────────────────────────────────────────────────────────────────────────────
export function FrequentlyPlayedView({ player }: { player: MusicPlayer }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Artists view
// ─────────────────────────────────────────────────────────────────────────────
export function ArtistsView({ onNavigate }: { onNavigate: (v: View) => void }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Albums view
// ─────────────────────────────────────────────────────────────────────────────
const HIDDEN_ALBUM_IDS = new Set(["singles", "fouryou"]);

export function AlbumsView({ onNavigate }: { onNavigate: (v: View) => void }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Songs view
// ─────────────────────────────────────────────────────────────────────────────
export function SongsView({ player }: { player: MusicPlayer }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Album detail view
// ─────────────────────────────────────────────────────────────────────────────
export function AlbumDetailView({
  albumId,
  player,
  onBack,
}: {
  albumId: string;
  player: MusicPlayer;
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
        <Image src={album.artworkUrl} alt={album.title} width={180} height={180} className={styles.albumHeroArt} unoptimized />
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

// ─────────────────────────────────────────────────────────────────────────────
// Artist detail view
// ─────────────────────────────────────────────────────────────────────────────
export function ArtistDetailView({
  artistId,
  player,
  onBack,
  onNavigate,
}: {
  artistId: string;
  player: MusicPlayer;
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
      <Image src={artist.artworkUrl} alt={artist.name} width={180} height={180} className={styles.artistHeroArt} unoptimized />
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
