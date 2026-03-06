"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { songs, songById, type Song } from "@/lib/music-data";

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number; // seconds
  duration: number; // seconds
  volume: number; // 0–1
  queue: Song[];
  queueIndex: number;
}

export interface PlayerControls {
  play: (songId: string, contextIds?: string[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: (songId?: string, contextIds?: string[]) => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
}

export type MusicPlayer = PlayerState & PlayerControls;

const IK_TARFA_ID = "1835109935";

const INITIAL_STATE: PlayerState = {
  currentSong: songById[IK_TARFA_ID] ?? null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  queue: songs,
  queueIndex: songs.findIndex((s) => s.id === IK_TARFA_ID),
};

/**
 * useMusicPlayer — manages a single HTMLAudioElement for preview playback.
 * Safe to call in a "use client" component; creates the Audio element lazily
 * so it never runs on the server.
 */
export function useMusicPlayer(): MusicPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>(INITIAL_STATE);

  // Lazily create the audio element once on the client
  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "none";
      audio.volume = INITIAL_STATE.volume;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  // Wire up audio events once
  useEffect(() => {
    const audio = getAudio();

    const onTimeUpdate = () => {
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    };

    const onDurationChange = () => {
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    };

    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));

    const onEnded = () => {
      setState((prev) => {
        const nextIndex = prev.queueIndex + 1;
        if (nextIndex < prev.queue.length) {
          const nextSong = prev.queue[nextIndex];
          audio.src = nextSong.previewUrl;
          audio.play().catch(() => {});
          return { ...prev, currentSong: nextSong, queueIndex: nextIndex, currentTime: 0 };
        }
        // End of queue
        return { ...prev, isPlaying: false, currentTime: 0 };
      });
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [getAudio]);

  // ── Controls ──────────────────────────────────────────────────────────────

  /**
   * play — start playing songId. contextIds defines the queue (defaults to
   * all songs in the same album, or all songs if no context given).
   */
  const play = useCallback(
    (songId: string, contextIds?: string[]) => {
      const song = songById[songId];
      if (!song) return;

      const audio = getAudio();

      // Build queue
      let queueSongs: Song[];
      if (contextIds && contextIds.length > 0) {
        queueSongs = contextIds
          .map((id) => songById[id])
          .filter(Boolean) as Song[];
      } else {
        // Default: all songs from the same album
        queueSongs = songs.filter((s) => s.albumId === song.albumId);
      }

      const queueIndex = queueSongs.findIndex((s) => s.id === songId);

      audio.src = song.previewUrl;
      audio.play().catch(() => {});

      setState((prev) => ({
        ...prev,
        currentSong: song,
        queue: queueSongs,
        queueIndex: queueIndex >= 0 ? queueIndex : 0,
        currentTime: 0,
      }));
    },
    [getAudio]
  );

  const pause = useCallback(() => {
    getAudio().pause();
  }, [getAudio]);

  const resume = useCallback(() => {
    getAudio().play().catch(() => {});
  }, [getAudio]);

  const togglePlay = useCallback(
    (songId?: string, contextIds?: string[]) => {
      if (songId && songId !== state.currentSong?.id) {
        play(songId, contextIds);
        return;
      }
      if (state.isPlaying) {
        getAudio().pause();
      } else {
        getAudio().play().catch(() => {});
      }
    },
    [state.currentSong?.id, state.isPlaying, play, getAudio]
  );

  const next = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.queueIndex + 1;
      if (nextIndex >= prev.queue.length) return prev;
      const nextSong = prev.queue[nextIndex];
      const audio = getAudio();
      audio.src = nextSong.previewUrl;
      audio.play().catch(() => {});
      return { ...prev, currentSong: nextSong, queueIndex: nextIndex, currentTime: 0 };
    });
  }, [getAudio]);

  const prev = useCallback(() => {
    setState((prev) => {
      const audio = getAudio();
      // If > 3s into track, restart it
      if (audio.currentTime > 3 && prev.currentSong) {
        audio.currentTime = 0;
        return prev;
      }
      const prevIndex = prev.queueIndex - 1;
      if (prevIndex < 0) return prev;
      const prevSong = prev.queue[prevIndex];
      audio.src = prevSong.previewUrl;
      audio.play().catch(() => {});
      return { ...prev, currentSong: prevSong, queueIndex: prevIndex, currentTime: 0 };
    });
  }, [getAudio]);

  const seek = useCallback(
    (time: number) => {
      const audio = getAudio();
      audio.currentTime = time;
      setState((s) => ({ ...s, currentTime: time }));
    },
    [getAudio]
  );

  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      getAudio().volume = clamped;
      setState((s) => ({ ...s, volume: clamped }));
    },
    [getAudio]
  );

  return {
    ...state,
    play,
    pause,
    resume,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
  };
}
