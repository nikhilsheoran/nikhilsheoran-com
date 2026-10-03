import type { RefObject } from "react";
import { createMotion, type Mode, type Motion } from "@/lib/journey/machine";
import { beats, type Beats } from "@/lib/journey/timeline";
import { tuning } from "@/lib/journey/tuning";
import { works } from "@/lib/journey/works";
import type { Vec3 } from "@/lib/journey/path";

/** Mutable per-frame state shared by the DOM layer and the WebGL scene. */
export interface JourneyRuntime {
  motion: Motion;
  beats: Beats;
  /** The embedded desktop has posted "journey:ready". */
  frameReady: boolean;
  /** The pointer is over the live screen, so the iframe owns input. */
  pointerOnScreen: boolean;
  /** A drag just ended; swallow the click it would otherwise produce. */
  suppressClickUntil: number;
  cameraPosition: Vec3;
  /** The clock detour: `amount` eases 0..1 toward the clock while `active`. */
  detour: { active: boolean; amount: number; heldTarget: number };
}

export function createRuntime(): JourneyRuntime {
  return {
    motion: createMotion(),
    beats: beats(tuning, works.length),
    frameReady: false,
    pointerOnScreen: false,
    suppressClickUntil: 0,
    cameraPosition: [0, 0, 0],
    detour: { active: false, amount: 0, heldTarget: 0 },
  };
}

export interface FrameReport {
  mode: Mode;
  progress: number;
  /** The camera is at, or on its way to or from, the clock. */
  detour: boolean;
}

/** Preview switches read from the URL: `?live` (the pre-bake real-time room). */
export interface SceneFlags {
  live: boolean;
}

export interface SceneProps {
  flags: SceneFlags;
  runtimeRef: RefObject<JourneyRuntime>;
  screenRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  surfaceRef: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onFrame: (report: FrameReport) => void;
}
