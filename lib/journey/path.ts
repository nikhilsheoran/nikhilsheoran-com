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

/** The helix: u = 0 is the opening frame, u = 1 is the end of the orbit. */
export function orbitPose(u: number, tuning: Tuning) {
  const c = tuning.camera;
  const angle = c.endAngle - c.turns * Math.PI * 2 * (1 - u);
  const radius =
    c.endRadius +
    (c.startRadius - c.endRadius) * Math.pow(1 - u, c.radiusCurve);
  const pose: Pose = {
    position: [
      AXIS[0] + Math.sin(angle) * radius,
      lerp(c.startHeight, c.endHeight, u),
      AXIS[1] + Math.cos(angle) * radius,
    ],
    target: [AXIS[0], lerp(c.targetStartHeight, c.targetEndHeight, u), AXIS[1]],
  };
  return { ...pose, angle, radius };
}

/** d(position)/du at the end of the orbit, for a seamless handoff. */
function orbitEndTangent(tuning: Tuning): Vec3 {
  const c = tuning.camera;
  const angularSpeed = c.turns * Math.PI * 2;
  const radialSpeed = c.radiusCurve > 1 ? 0 : -(c.startRadius - c.endRadius);
  const angle = c.endAngle;
  return [
    Math.cos(angle) * c.endRadius * angularSpeed +
      Math.sin(angle) * radialSpeed,
    c.endHeight - c.startHeight,
    -Math.sin(angle) * c.endRadius * angularSpeed +
      Math.cos(angle) * radialSpeed,
  ];
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

/** The control point every arrival passes near: above and just behind the final pose. */
function arrivalControl(end: Vec3, tuning: Tuning): Vec3 {
  return [
    end[0],
    end[1] + tuning.camera.arrivalLift,
    end[2] + tuning.camera.arrivalBack,
  ];
}

/**
 * The single scroll rail. The orbit runs to handoffStart, then a cubic curve
 * that continues the orbit's velocity descends over the statue into the screen.
 * railPose(1) is exactly the resting Mac pose.
 */
export function railPose(
  progress: number,
  aspect: number,
  fov: number,
  tuning: Tuning,
): Pose {
  const handoff = tuning.timeline.handoffStart;
  if (progress <= handoff) {
    const { position, target } = orbitPose(progress / handoff, tuning);
    return { position, target };
  }
  const s = clamp01((progress - handoff) / (1 - handoff));
  const start = orbitPose(1, tuning);
  const end = screenPose(aspect, fov);
  const tangent = orbitEndTangent(tuning);
  const reach = (1 - handoff) / handoff / 3;
  const p1 = start.position.map((v, i) => v + tangent[i] * reach) as Vec3;
  const p2 = arrivalControl(end.position, tuning);
  const aim = smootherStep(s);
  return {
    position: bezier(start.position, p1, p2, end.position, s),
    target: start.target.map((v, i) => lerp(v, end.target[i], aim)) as Vec3,
  };
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
 * Panels ride their own helix around the shared axis, turning against the
 * camera and rising as the story advances. The only coupling to the camera is
 * where each panel sits at its own reading moment: slightly right of centre,
 * on the line of sight.
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

  const view = orbitPose(reading / tuning.timeline.handoffStart, tuning);
  const readingRadius = panelRadius(reading, tuning);
  const reach = Math.min(
    1,
    (Math.sin(p.viewOffset) * view.radius) / readingRadius,
  );
  const offset = Math.asin(reach) - p.viewOffset;
  const depth =
    (view.radius - readingRadius * Math.cos(offset)) / view.radius;
  const readingHeight = lerp(view.position[1], view.target[1], depth);

  const angle = view.angle + offset - p.counterSpin * phase;
  const radius = panelRadius(progress, tuning);
  const position: Vec3 = [
    AXIS[0] + Math.sin(angle) * radius,
    readingHeight + p.rise * phase,
    AXIS[1] + Math.cos(angle) * radius,
  ];
  const facing = Math.atan2(camera[0] - position[0], camera[2] - position[2]);
  const yaw = angle + p.faceCamera * wrapAngle(facing - angle);
  const roll = -Math.max(-0.4, Math.min(0.4, phase * p.passRoll));

  const distance = Math.abs(phase);
  const onion = Math.exp(-p.onion * Math.pow(distance, 1.6));
  const window = 1 - smoothStep((distance - 1) / 0.5);
  const handoff =
    1 -
    smoothStep(
      (progress - beat.handoffStart) / (beat.panelsGone - beat.handoffStart),
    );
  return {
    position,
    rotation: [-0.05, yaw, roll],
    phase,
    opacity: onion * window * handoff,
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
