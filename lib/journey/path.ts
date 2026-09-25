import {
  SCREEN_POSITION,
  SCREEN_TILT,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from "./anchors";
import type { Tuning } from "./tuning";
import { chapterPhase, type Beats } from "./timeline";

export type Vec3 = [number, number, number];
export interface Pose {
  position: Vec3;
  target: Vec3;
}

export function smoothStep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

/** Zero endpoint velocity and acceleration for reversible camera handoffs. */
export function smootherStep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Camera and panels share one vertical axis through the laptop screen. */
export const AXIS = [SCREEN_POSITION[0], SCREEN_POSITION[2]] as const;

/** Portrait screens widen the lens so the orbit keeps the room in frame. */
export function viewFov(aspect: number, tuning: Tuning) {
  const base = tuning.camera.fov;
  if (aspect >= 1) return base;
  const widened =
    (2 * Math.atan((Math.tan((base * Math.PI) / 360) * 1.25) / aspect) * 180) /
    Math.PI;
  return Math.min(70, widened);
}

/** Where the camera rests at the Mac: the screen fills ~76% of the frame. */
export function screenPose(aspect: number, fov: number): Pose {
  const halfFov = Math.tan((fov * Math.PI) / 360);
  const fill =
    Math.max(
      SCREEN_HEIGHT / (2 * halfFov),
      SCREEN_WIDTH / (2 * halfFov * aspect),
    ) / 0.76;
  // On portrait phones the screen expands to full screen instead; stay in front of the statue.
  const distance = Math.min(fill, 0.85);
  return {
    position: [
      SCREEN_POSITION[0],
      SCREEN_POSITION[1] - Math.sin(SCREEN_TILT) * distance,
      SCREEN_POSITION[2] + Math.cos(SCREEN_TILT) * distance,
    ],
    target: [...SCREEN_POSITION] as Vec3,
  };
}

/**
 * Share of the total spin completed by `progress`. Constant angular speed while
 * reading, then the spin decelerates through the handoff and reaches zero
 * speed exactly at the Mac (continuous speed and acceleration throughout).
 */
function spin(progress: number, handoff: number) {
  const rate = 1 / (handoff + (1 - handoff) / 2);
  if (progress <= handoff) return rate * progress;
  const s = clamp01((progress - handoff) / (1 - handoff));
  return rate * handoff + rate * (1 - handoff) * (s - s ** 3 + s ** 4 / 2);
}

/** Ease-out with zero slope at 1. */
const settle = (u: number) => u * (2 - u);

export interface HelixPose extends Pose {
  angle: number;
  radius: number;
}

/**
 * The single camera rail, designed backwards from where it must end: the
 * resting Mac pose. Angle, radius, height and aim each converge on that pose
 * with zero velocity at progress 1, so the camera lands without overshooting
 * or swinging back. Before `handoffStart` it is the reading helix; after it,
 * the spin slows, the spiral tightens over the statue's head, and only once
 * the camera is in front of the face does it descend to the screen.
 */
export function helixPose(
  progress: number,
  aspect: number,
  fov: number,
  tuning: Tuning,
): HelixPose {
  const c = tuning.camera;
  const handoff = tuning.timeline.handoffStart;
  const end = screenPose(aspect, fov);
  const endRadius = Math.hypot(end.position[0] - AXIS[0], end.position[2] - AXIS[1]);

  const angle = -c.turns * Math.PI * 2 * (1 - spin(progress, handoff));

  let radius: number, height: number, aim: number;
  if (progress <= handoff) {
    const u = progress / handoff;
    radius =
      c.endRadius + (c.startRadius - c.endRadius) * Math.pow(1 - u, c.radiusCurve);
    height = lerp(c.startHeight, c.endHeight, settle(u));
    aim = lerp(c.targetStartHeight, c.targetEndHeight, settle(u));
  } else {
    const s = clamp01((progress - handoff) / (1 - handoff));
    radius = endRadius + (c.endRadius - endRadius) * (1 - smootherStep(s));
    const drop = smootherStep((s - c.descentStart) / (1 - c.descentStart));
    height = lerp(c.endHeight, end.position[1], drop);
    aim = lerp(c.targetEndHeight, end.target[1], smootherStep(s));
  }
  return {
    angle,
    radius,
    position: [
      AXIS[0] + Math.sin(angle) * radius,
      height,
      AXIS[1] + Math.cos(angle) * radius,
    ],
    target: [AXIS[0], aim, AXIS[1]],
  };
}

/** The scroll rail. railPose(1) is exactly the resting Mac pose. */
export function railPose(
  progress: number,
  aspect: number,
  fov: number,
  tuning: Tuning,
): Pose {
  const { position, target } = helixPose(progress, aspect, fov, tuning);
  return { position, target };
}

function bezier(a: Vec3, b: Vec3, c: Vec3, d: Vec3, t: number): Vec3 {
  const s = 1 - t;
  return a.map(
    (_, i) =>
      s * s * s * a[i] +
      3 * s * s * t * b[i] +
      3 * s * t * t * c[i] +
      t * t * t * d[i],
  ) as Vec3;
}

/** Fraction of the descent where a laptop-click flight joins the rail. */
const APPROACH_JOIN = 0.4;
/** Share of the flight spent reaching the rail; the rest rides the rail in. */
const APPROACH_SPLIT = 0.6;

/**
 * Clicking the laptop from anywhere on the orbit: rise, fly to the rail's
 * over-the-shoulder descent and ride it in, so every arrival looks the same.
 * The flight meets the rail at the rail's own speed, so there is no kink.
 */
export function approachPose(
  fromProgress: number,
  t: number,
  aspect: number,
  fov: number,
  tuning: Tuning,
): Pose {
  const handoff = tuning.timeline.handoffStart;
  const join = handoff + APPROACH_JOIN * (1 - handoff);
  const eased = smootherStep(t);
  if (eased >= APPROACH_SPLIT) {
    const along = (eased - APPROACH_SPLIT) / (1 - APPROACH_SPLIT);
    return railPose(join + along * (1 - join), aspect, fov, tuning);
  }
  const from = railPose(fromProgress, aspect, fov, tuning);
  const meet = railPose(join, aspect, fov, tuning);
  const e = 1e-4;
  const ahead = railPose(join + e, aspect, fov, tuning).position;
  // Rail velocity per unit of flight time, scaled into this segment's bezier.
  const scale = ((1 - join) / (1 - APPROACH_SPLIT)) * (APPROACH_SPLIT / 3) / e;
  const p2 = meet.position.map(
    (v, i) => v - (ahead[i] - v) * scale,
  ) as Vec3;
  const p1: Vec3 = [
    from.position[0],
    Math.max(from.position[1], meet.position[1]) + 0.6,
    from.position[2],
  ];
  const s = eased / APPROACH_SPLIT;
  const aim = smootherStep(s);
  return {
    position: bezier(from.position, p1, p2, meet.position, s),
    target: from.target.map((v, i) => lerp(v, meet.target[i], aim)) as Vec3,
  };
}

/** Analytic critically damped spring: carries velocity, independent of frame rate. */
export function advanceSpring(
  value: number,
  velocity: number,
  target: number,
  dt: number,
  omega = 11,
) {
  const error = value - target;
  const carry = velocity + omega * error;
  const decay = Math.exp(-omega * dt);
  return {
    value: target + (error + carry * dt) * decay,
    velocity: (velocity - omega * carry * dt) * decay,
  };
}

function panelRadius(progress: number, tuning: Tuning) {
  return lerp(
    tuning.panels.startRadius,
    tuning.panels.endRadius,
    clamp01(progress / tuning.timeline.handoffStart),
  );
}

function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export interface PanelPose {
  position: Vec3;
  rotation: Vec3;
  phase: number;
  opacity: number;
}

/**
 * Greta's vortex: every work hangs in one slow spiral around the desk, turning
 * against the camera and rising as the story advances. Far from its moment a
 * work drifts on its own wider orbit, fogged into the room; as its moment
 * arrives it swoops in to a reading spot just right of centre, facing the
 * camera, and then drifts back out. Depth comes from haze (in the shader),
 * not transparency, so several works share the air without ghosting.
 */
export function panelPose(
  index: number,
  progress: number,
  beat: Beats,
  tuning: Tuning,
  camera: readonly number[],
): PanelPose {
  const p = tuning.panels;
  const reading = beat.chapters[index];
  const phase = chapterPhase(progress, index, beat);

  const view = helixPose(reading, 16 / 9, tuning.camera.fov, tuning);
  const readingRadius = panelRadius(reading, tuning);
  const reach = Math.min(
    1,
    (Math.sin(p.viewOffset) * view.radius) / readingRadius,
  );
  const offset = Math.asin(reach) - p.viewOffset;
  const depth =
    (view.radius - readingRadius * Math.cos(offset)) / view.radius;
  const readingHeight = lerp(view.position[1], view.target[1], depth);

  // 0 at the reading moment, 1 once the work is back out in the vortex.
  const away = smoothStep((Math.abs(phase) - 0.25) / 1.1);
  const orbit =
    p.orbitRadius * (1 + p.orbitSpread * Math.sin(index * 2.399));
  const angle = view.angle + offset - p.counterSpin * phase;
  const radius = lerp(panelRadius(progress, tuning), orbit, away);
  const position: Vec3 = [
    AXIS[0] + Math.sin(angle) * radius,
    readingHeight +
      p.rise * phase +
      away * p.orbitSpread * 2.2 * Math.cos(index * 1.7),
    AXIS[1] + Math.cos(angle) * radius,
  ];
  const facing = Math.atan2(camera[0] - position[0], camera[2] - position[2]);
  const yaw = angle + p.faceCamera * wrapAngle(facing - angle);
  const roll = -Math.max(-0.3, Math.min(0.3, phase * p.passRoll));

  // Present for a few chapters either side; the shader's haze does the rest.
  const distance = Math.abs(phase);
  const window = 1 - smoothStep((distance - p.visibleChapters + 0.5) / 0.6);
  const handoff =
    1 -
    smoothStep(
      (progress - beat.handoffStart) / (beat.panelsGone - beat.handoffStart),
    );
  return {
    position,
    rotation: [-0.05, yaw, roll],
    phase,
    opacity: window * handoff,
  };
}

/**
 * Keeps a panel from filling the lens as it passes close: at most
 * `maxViewFraction` of the frame width, eased so the scale never kinks.
 */
export function panelScale(
  distance: number,
  aspect: number,
  fov: number,
  width: number,
  maxViewFraction = 0.55,
) {
  const halfWidth =
    Math.max(0.02, distance) * Math.tan((fov * Math.PI) / 360) * aspect;
  const limit = (2 * halfWidth * maxViewFraction) / width;
  return 1 / Math.pow(1 + Math.pow(1 / limit, 6), 1 / 6);
}

/** Project a rectangle onto four screen-space corners (TL, TR, BR, BL). */
export function quadMatrix(
  points: readonly (readonly [number, number])[],
  width: number,
  height: number,
) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points;
  const dx1 = x1 - x2,
    dx2 = x3 - x2,
    dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2,
    dy2 = y3 - y2,
    dy3 = y0 - y1 + y2 - y3;
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g =
    Math.abs(determinant) < 1e-8 ? 0 : (dx3 * dy2 - dx2 * dy3) / determinant;
  const h =
    Math.abs(determinant) < 1e-8 ? 0 : (dx1 * dy3 - dx3 * dy1) / determinant;
  return [
    (x1 - x0 + g * x1) / width,
    (y1 - y0 + g * y1) / width,
    0,
    g / width,
    (x3 - x0 + h * x3) / height,
    (y3 - y0 + h * y3) / height,
    0,
    h / height,
    0,
    0,
    1,
    0,
    x0,
    y0,
    0,
    1,
  ];
}
