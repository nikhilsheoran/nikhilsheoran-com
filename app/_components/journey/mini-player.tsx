"use client";

import { useRef } from "react";
import {
  FastForwardIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from "@phosphor-icons/react";
import { Glass } from "./glass";
import type { MusicCommand, MusicSnapshot } from "./music-bridge";
import styles from "./journey.module.css";

/**
 * A compact remote for the Mac's music player. It holds no audio of its own:
 * every control is a command sent to the desktop, and what it shows is the
 * desktop player's reported state, so the two are always in step.
 */
export function MiniPlayer({
  music,
  onCommand,
}: {
  music: MusicSnapshot | null;
  onCommand: (command: MusicCommand) => void;
}) {
  const lastVolume = useRef(0.8);
  if (!music) return null;
  const { title, artist, artworkUrl, isPlaying, volume } = music;
  const muted = volume === 0;
  return (
    <Glass as="section" className={styles.player} aria-label="Music">
      {/* eslint-disable-next-line @next/next/no-img-element -- Remote album art from the song data. */}
      <img className={styles.cover} src={artworkUrl} alt="" />
      <div className={styles.track}>
        <p className={styles.song}>{title}</p>
        <p className={styles.artist}>{artist}</p>
      </div>
      <div className={styles.transport}>
        <button aria-label="Previous" onClick={() => onCommand({ command: "prev" })}>
          <RewindIcon size={16} weight="fill" />
        </button>
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={() => onCommand({ command: "toggle" })}
        >
          {isPlaying ? (
            <PauseIcon size={20} weight="fill" />
          ) : (
            <PlayIcon size={20} weight="fill" />
          )}
        </button>
        <button aria-label="Next" onClick={() => onCommand({ command: "next" })}>
          <FastForwardIcon size={16} weight="fill" />
        </button>
      </div>
      <div className={styles.loudness}>
        <button
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          onClick={() => {
            if (!muted) lastVolume.current = volume;
            onCommand({ command: "volume", value: muted ? lastVolume.current : 0 });
          }}
        >
          {muted ? <SpeakerSlashIcon size={16} /> : <SpeakerHighIcon size={16} />}
        </button>
        <input
          className={styles.volume}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          aria-label="Volume"
          style={{ "--fill": `${volume * 100}%` } as React.CSSProperties}
          onChange={(event) =>
            onCommand({ command: "volume", value: Number(event.target.value) })
          }
        />
      </div>
    </Glass>
  );
}
