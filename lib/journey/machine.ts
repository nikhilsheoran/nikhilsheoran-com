import { advanceSpring } from "./path";
import type { Beats } from "./timeline";
import type { Tuning } from "./tuning";

/**
 * orbit       – the camera follows the scroll rail (spring toward `target`)
 * settling    – the last stretch of the rail glides into the Mac by itself
 * approaching – a laptop click flies the camera straight to the Mac (reversible)
 * focused     – the camera rests at the screen; the Mac takes input
 */
export type Mode = "orbit" | "settling" | "approaching" | "focused";

export interface Motion {
  mode: Mode;
  progress: number;
  velocity: number;
  target: number;
  /** 0..1 along a direct laptop approach, travelling in `approachDirection`. */
  approach: number;
  approachDirection: 1 | -1;
  /** Rail position a direct approach left from; leaving the Mac flies back there. */
  approachFrom: number | null;
  dragging: boolean;
  /** Direction of the latest user input along the rail. */
  heading: 1 | -1;
  reducedMotion: boolean;
}

export type MotionEvent = "arrived" | "left" | null;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function createMotion(): Motion {
  return {
    mode: "orbit",
    progress: 0,
    velocity: 0,
    target: 0,
    approach: 0,
    approachDirection: 1,
    approachFrom: null,
    dragging: false,
    heading: 1,
    reducedMotion: false,
  };
}

/** Leave the Mac (or abandon an arrival) and return to the orbit. */
export function leave(m: Motion, beat: Beats) {
  if (m.mode === "approaching") {
    m.approachDirection = -1;
    return;
  }
  if (m.mode === "focused" && m.approachFrom !== null) {
    m.mode = "approaching";
    m.approachDirection = -1;
    m.approach = 1;
    return;
  }
  if (m.mode === "focused" || m.mode === "settling") {
    m.mode = "orbit";
    m.heading = -1;
    m.target = Math.min(m.progress, beat.returnTo);
  }
}

/** Relative input from the wheel, trackpad or arrow keys. */
export function nudge(m: Motion, delta: number, beat: Beats) {
  if (delta === 0) return;
  if (m.mode === "focused" || m.mode === "approaching") {
    // Trackpads keep emitting forward events after arrival; only a reverse leaves.
    if (delta < 0) leave(m, beat);
    return;
  }
  if (m.mode === "settling") {
    if (delta > 0) return;
    m.mode = "orbit";
    m.target = m.progress;
  }
  m.heading = delta > 0 ? 1 : -1;
  m.target = clamp01(m.target + delta);
}

/** Absolute input from dragging, the slider, the year buttons, Home/End. */
export function seek(m: Motion, value: number, beat: Beats) {
  if (m.mode === "focused" || m.mode === "approaching") {
    leave(m, beat);
    m.target = clamp01(value);
    return;
  }
  m.mode = "orbit";
  if (value !== m.progress) m.heading = value > m.progress ? 1 : -1;
  m.target = clamp01(value);
}

/** Click on the laptop (or its keyboard shortcut). */
export function focus(m: Motion, beat: Beats) {
  if (m.mode === "focused") return;
  if (m.mode === "approaching") {
    m.approachDirection = 1;
    return;
  }
  if (m.progress >= beat.handoffStart) {
    m.mode = "settling";
    m.heading = 1;
    m.target = 1;
    return;
  }
  m.mode = "approaching";
  m.approachFrom = m.progress;
  m.approach = 0;
  m.approachDirection = 1;
  m.target = m.progress;
  m.velocity = 0;
}

/** Advance one frame. Returns "arrived" when the Mac takes focus, "left" when it lets go. */
export function step(
  m: Motion,
  dt: number,
  beat: Beats,
  tuning: Tuning,
): MotionEvent {
  if (m.mode === "focused") return null;

  if (m.mode === "approaching") {
    const duration = m.reducedMotion ? 0 : tuning.timeline.approachSeconds;
    m.approach = clamp01(
      duration === 0
        ? (m.approachDirection + 1) / 2
        : m.approach + (m.approachDirection * dt) / duration,
    );
    if (m.approach >= 1) {
      m.mode = "focused";
      return "arrived";
    }
    if (m.approach <= 0) {
      m.mode = "orbit";
      m.approachFrom = null;
      m.heading = -1;
      return "left";
    }
    return null;
  }

  const omega = m.dragging
    ? tuning.motion.dragSpring
    : m.mode === "settling"
      ? tuning.motion.settleSpring
      : tuning.motion.spring;
  const next = advanceSpring(m.progress, m.velocity, m.target, dt, omega);
  m.progress = m.reducedMotion ? m.target : clamp01(next.value);
  m.velocity = m.reducedMotion ? 0 : next.velocity;

  if (m.mode === "settling") {
    if (m.progress >= 1 - 5e-4) {
      m.progress = m.target = 1;
      m.velocity = 0;
      m.mode = "focused";
      m.approachFrom = null;
      return "arrived";
    }
    return null;
  }

  // Past the last work the camera stays wherever the scroll leaves it. Only
  // moving forward beyond settleArm hands over and glides into the Mac.
  if (m.dragging || m.heading < 0 || m.progress < beat.settleArm) return null;
  m.mode = "settling";
  m.target = 1;
  return null;
}
