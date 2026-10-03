"use client";

import { useEffect, useRef } from "react";
import { frequentlyPlayedIds, songById } from "@/lib/music-data";
import type { MusicPlayer } from "@/lib/use-music-player";

/** What the journey's mini player needs to draw itself. */
export interface MusicSnapshot {
  title: string;
  artist: string;
  artworkUrl: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export type MusicCommand =
  | { command: "toggle" | "next" | "prev" }
  | { command: "seek" | "volume"; value: number };

/**
 * Lets the journey (the parent page) drive the desktop's own music player, so
 * there is one audio source and the two can never drift apart. Runs inside the
 * embedded desktop: it reports the player's state up and applies commands sent
 * down. Does nothing when the desktop is not embedded.
 */
export function useJourneyMusicBridge(player: MusicPlayer) {
  const latest = useRef(player);
  const started = useRef(false);
  useEffect(() => {
    latest.current = player;
  });

  const { currentSong, isPlaying, currentTime, duration, volume } = player;
  useEffect(() => {
    if (window.parent === window) return;
    if (isPlaying) started.current = true;
    // Until something has played, show what the first press will start.
    const song = started.current
      ? currentSong
      : (songById[frequentlyPlayedIds[0]] ?? currentSong);
    if (!song) return;
    const snapshot: MusicSnapshot = {
      title: song.title,
      artist: song.artist,
      artworkUrl: song.artworkUrl,
      isPlaying,
      currentTime: started.current ? currentTime : 0,
      // Tracks are 30-second previews; fall back to that before audio loads.
      duration: (started.current && duration) || 30,
      volume,
    };
    window.parent.postMessage(
      { type: "journey:music", snapshot },
      window.location.origin,
    );
  }, [currentSong, isPlaying, currentTime, duration, volume]);

  useEffect(() => {
    if (window.parent === window) return;
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== "journey:music-command"
      )
        return;
      const music = latest.current;
      const message = event.data as MusicCommand;
      switch (message.command) {
        case "toggle":
          // The first press starts Frequently Played from the top.
          if (!started.current) {
            started.current = true;
            music.play(frequentlyPlayedIds[0], frequentlyPlayedIds);
          } else music.togglePlay();
          break;
        case "next":
          music.next();
          break;
        case "prev":
          music.prev();
          break;
        case "seek":
          music.seek(message.value);
          break;
        case "volume":
          music.setVolume(message.value);
          break;
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
}
