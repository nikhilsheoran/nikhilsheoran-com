"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { MusicPlayer } from "@/lib/use-music-player";
import {
  IconPrev,
  IconPlay,
  IconPause,
  IconNext,
  IconVolumeLow,
  IconVolumeHigh,
} from "@/app/_components/music/music-icons";
import styles from "../music-window.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatSeconds(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PlayerBar
// ─────────────────────────────────────────────────────────────────────────────
export function PlayerBar({ player }: { player: MusicPlayer }) {
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
            <Image
              src={currentSong.artworkUrl}
              alt={currentSong.albumTitle}
              width={36}
              height={36}
              className={styles.trackThumb}
              unoptimized
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
