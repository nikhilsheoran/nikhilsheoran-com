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
    // Close in early, while still turning, so the spiral comes round beside
    // the statue rather than over it; the last few degrees then turn at the
    // screen's own distance.
    radius =
      endRadius + (c.endRadius - endRadius) * (1 - smootherStep(s / c.closeIn));
    aim = lerp(c.targetEndHeight, end.target[1], smootherStep(s));
    // Height follows distance, so the camera keeps looking down at the same
    // gentle angle all the way in: no dip, no nod.
    const startSlope = (c.endHeight - c.targetEndHeight) / c.endRadius;
    const endSlope = (end.position[1] - end.target[1]) / endRadius;
    height = aim + lerp(startSlope, endSlope, smootherStep(s)) * radius;
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

/**
 * Clicking the laptop: no path, just the pose you are in eased into the Mac
 * pose. Position and aim interpolate together on one ease, with a single soft
 * rise in the middle so a move that starts behind the statue clears its head.
 */
export function approachPose(
  fromProgress: number,
  t: number,
  aspect: number,
  fov: number,
  tuning: Tuning,
): Pose {
  const from = railPose(fromProgress, aspect, fov, tuning);
  const end = screenPose(aspect, fov);
  const e = smootherStep(t);
  const behind = smoothStep((from.position[2] - AXIS[1] - 1.2) / 1.2);
  const lift = Math.sin(Math.PI * e) * (0.2 + 1.5 * behind);
  return {
    position: [
      lerp(from.position[0], end.position[0], e),
      lerp(from.position[1], end.position[1], e) + lift,
      lerp(from.position[2], end.position[2], e),
    ],
    target: from.target.map((v, i) => lerp(v, end.target[i], e)) as Vec3,
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

/** Smooth max(x, 0): bends gently instead of clamping. */
function softPlus(x: number, k: number) {
  return k * Math.log1p(Math.exp(x / k));
}

function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export interface PanelPose {
  position: Vec3;
  rotation: Vec3;
  phase: number;
  opacity: number;
  /** 0 at the reading moment, 1 once the work is back out in the vortex. */
  away: number;
  /** Size relative to the work's full size at its reading moment. */
  scale: number;
  /** How tightly the sheet bends round the desk (1 / radius; 0 = flat). */
  curve: number;
}

/** Where a work is read from the camera pose at `progress`: just right of centre. */
function readingSpot(progress: number, tuning: Tuning) {
  const p = tuning.panels;
  const view = helixPose(progress, 16 / 9, tuning.camera.fov, tuning);
  const radius = panelRadius(progress, tuning);
  const reach = Math.min(1, (Math.sin(p.viewOffset) * view.radius) / radius);
  const offset = Math.asin(reach) - p.viewOffset;
  const depth = (view.radius - radius * Math.cos(offset)) / view.radius;
  return {
    view,
    angle: view.angle + offset,
    radius,
    height: lerp(view.position[1], view.target[1], depth),
  };
}

interface Flight {
  position: Vec3;
  rotation: Vec3;
  away: number;
  /** Presence, before the handoff and far fades are applied. */
  presence: number;
}

const onAxis = (angle: number, radius: number, height: number): Vec3 => [
  AXIS[0] + Math.sin(angle) * radius,
  height,
  AXIS[1] + Math.cos(angle) * radius,
];
const facingFrom = (position: Vec3, eye: readonly number[]) =>
  Math.atan2(eye[0] - position[0], eye[2] - position[2]);

/**
 * Greta's vortex: every work hangs in one slow spiral around the desk, turning
 * against the camera and rising as the story advances. Far from its moment a
 * work drifts on its own wider orbit; as its moment arrives it swoops in to
 * the reading spot, facing the camera, and then drifts back out.
 */
function vortex(
  index: number,
  progress: number,
  phase: number,
  beat: Beats,
  tuning: Tuning,
  camera: readonly number[],
): Flight {
  const p = tuning.panels;
  const spot = readingSpot(beat.chapters[index], tuning);
  // 0 at the reading moment, 1 once the work is back out in the vortex.
  const away = smoothStep((Math.abs(phase) - 0.25) / 1.1);
  const orbit =
    p.orbitRadius * (1 + p.orbitSpread * Math.sin(index * 2.399));
  const angle = spot.angle - p.counterSpin * phase;
  const radius = lerp(panelRadius(progress, tuning), orbit, away);
  // Clear air only: above the desk, laptop and seated figure, below the
  // ceiling. Works arrive round the spiral, never up through the furniture.
  const drift =
    p.rise * phase + away * p.orbitSpread * 2.2 * Math.cos(index * 1.7);
  const height = p.floor + softPlus(spot.height + drift - p.floor, 0.25);
  const position = onAxis(angle, radius, Math.min(height, p.ceiling));
  // Out in the vortex every work tumbles its own way (a fixed personality per
  // index); it squares up to the camera only as it swoops in to be read.
  const tumble = p.tumble * away;
  const yaw =
    angle +
    p.faceCamera * wrapAngle(facingFrom(position, camera) - angle) +
    tumble * Math.sin(index * 1.93 + 0.4);
  const roll =
    -Math.max(-0.3, Math.min(0.3, phase * p.passRoll)) *
      Math.cos(index * 2.2) +
    tumble * 0.45 * Math.cos(index * 2.71);
  const pitch = -0.05 + tumble * 0.35 * Math.sin(index * 3.17 + 1.1);
  const presence =
    1 - smoothStep((Math.abs(phase) - p.visibleChapters + 0.5) / 0.6);
  return { position, rotation: [pitch, yaw, roll], away, presence };
}

/**
 * Gallery: nothing flies. Each work hangs still at its own reading spot and
 * the camera's orbit carries you past them, one after another.
 */
function gallery(
  index: number,
  phase: number,
  beat: Beats,
  tuning: Tuning,
): Flight {
  const p = tuning.panels;
  const spot = readingSpot(beat.chapters[index], tuning);
  const height = p.floor + softPlus(spot.height - p.floor, 0.25);
  const position = onAxis(spot.angle, spot.radius, height);
  const yaw =
    facingFrom(position, spot.view.position) + 0.1 * Math.sin(index * 1.93);
  return {
    position,
    rotation: [-0.05, yaw, 0.03 * Math.cos(index * 2.2)],
    away: smoothStep((Math.abs(phase) - 0.3) / 1),
    presence: 1,
  };
}

/**
 * The ring the helix is wound on at `progress`. Early on it is wide and
 * centred between the person and the desk, so the works go round both; as the
 * camera closes in it tightens and its centre slides onto the Mac, always
 * leaving `clearance` between the camera and the sheet in front of it.
 */
function helixRing(progress: number, tuning: Tuning) {
  const p = tuning.panels;
  const c = tuning.camera;
  const view = helixPose(progress, 16 / 9, c.fov, tuning);
  const wide = clamp01((view.radius - c.endRadius) / (c.startRadius - c.endRadius));
  const shift = p.around * smoothStep(wide * 1.6);
  return {
    view,
    centre: [AXIS[0], AXIS[1] + shift] as const,
    radius: Math.min(
      p.startRadius,
      Math.max(p.endRadius, view.radius - shift - p.clearance),
    ),
  };
}

/**
 * The helix. The works hang evenly round one ring that encloses the person
 * and the desk, each a step lower than the one before, and the ring tightens
 * as you scroll, the sheets shrinking with it. Scrolling turns it like a
 * screw. Positions are worked backwards from the screen: the work being read
 * is placed where the camera's line of sight meets the ring, so it is dead
 * centre, and the others follow round from there. Every sheet lies along the
 * ring (bent to its curve), so the neighbours are seen at a slant and those
 * across the desk from behind, far off.
 */
function helix(
  progress: number,
  phase: number,
  beat: Beats,
  tuning: Tuning,
): Flight & { scale: number; curve: number } {
  const p = tuning.panels;
  const { view, centre, radius } = helixRing(
    Math.min(Math.max(0, progress), beat.handoffStart),
    tuning,
  );
  // Where the line of sight (camera to its target, seen from above) first
  // crosses the ring.
  const eye = [view.position[0], view.position[2]];
  const reach = Math.hypot(view.target[0] - eye[0], view.target[2] - eye[1]) || 1;
  const sight = [(view.target[0] - eye[0]) / reach, (view.target[2] - eye[1]) / reach];
  const toCentre = [centre[0] - eye[0], centre[1] - eye[1]];
  const along = toCentre[0] * sight[0] + toCentre[1] * sight[1];
  const off = Math.hypot(toCentre[0] - along * sight[0], toCentre[1] - along * sight[1]);
  const front = along - Math.sqrt(Math.max(0, radius * radius - off * off));
  const hero = [eye[0] + sight[0] * front, eye[1] + sight[1] * front];
  // Evenly round the ring, so it is balanced whichever work is in front.
  const turn = -((Math.PI * 2) / beat.chapters.length) * phase;
  const angle = Math.atan2(hero[0] - centre[0], hero[1] - centre[1]) + turn;
  // On the line of sight at its own moment; each next work hangs lower.
  const height =
    lerp(view.position[1], view.target[1], front / reach) + p.descent * phase;
  // How far round from the front it is: 0 facing you, 1 across the desk.
  // Distance, and with it haze, blur and dimness, all grow with this.
  const round = Math.abs(wrapAngle(turn));
  const away = smoothStep((1 - Math.cos(round)) / 1.2);
  return {
    position: [
      centre[0] + Math.sin(angle) * radius,
      Math.min(p.ceiling, p.floor + softPlus(height - p.floor, 0.25)),
      centre[1] + Math.cos(angle) * radius,
    ],
    rotation: [-0.04, angle, 0],
    away,
    presence: 1 - smoothStep((Math.abs(phase) - p.visibleChapters + 0.5) / 0.6),
    scale: radius / 2,
    curve: 1 / radius,
  };
}

/**
 * Drop: each work is let down from above like a banner as its moment comes,
 * then stays where it was read while the camera moves on.
 */
function drop(
  index: number,
  progress: number,
  phase: number,
  beat: Beats,
  tuning: Tuning,
  camera: readonly number[],
): Flight {
  const p = tuning.panels;
  const spot = readingSpot(beat.chapters[index], tuning);
  const now = phase < 0 ? readingSpot(Math.max(0, progress), tuning) : spot;
  const fall = phase < 0 ? 1 - smoothStep(1 + phase) : 0;
  const base = p.floor + softPlus(now.height - p.floor, 0.25);
  const position = onAxis(
    now.angle,
    now.radius,
    base + 2.4 * fall + (phase > 0 ? 0.25 * smoothStep(phase) : 0),
  );
  const eye = phase < 0 ? camera : spot.view.position;
  // It swings a little as it comes down and steadies as it arrives.
  const swing = fall * Math.sin(phase * 5 + index);
  return {
    position,
    rotation: [-0.05 + 0.12 * swing, facingFrom(position, eye), 0.1 * swing],
    away: smoothStep((Math.abs(phase) - 0.25) / 0.9),
    presence:
      phase < 0
        ? 1 - smoothStep((-phase - 0.45) / 0.5)
        : 1 - smoothStep((phase - 0.6) / 0.7),
  };
}

/**
 * Gust: a sheet caught by the wind. It tumbles in from deep on the right,
 * steadies in front of you to be read, and is blown past your left shoulder.
 */
function gust(
  index: number,
  progress: number,
  phase: number,
  beat: Beats,
  tuning: Tuning,
  camera: readonly number[],
): Flight {
  const p = tuning.panels;
  const now = readingSpot(Math.min(Math.max(0, progress), beat.handoffStart), tuning);
  const spot = onAxis(now.angle, now.radius, now.height);
  const eye = now.view.position;
  // The camera's own right and forward, flat on the floor plane.
  const fx = now.view.target[0] - eye[0];
  const fz = now.view.target[2] - eye[2];
  const length = Math.hypot(fx, fz) || 1;
  const forward = [fx / length, fz / length];
  const right = [-forward[1], forward[0]];
  // Hold still around the reading moment, then let go.
  const loose = Math.sign(phase) * smoothStep((Math.abs(phase) - 0.15) / 0.85);
  const side = -1.9 * loose;
  const deep = phase < 0 ? 2.2 * -loose : -0.9 * loose;
  const position: Vec3 = [
    spot[0] + right[0] * side + forward[0] * deep,
    Math.min(
      p.ceiling,
      p.floor + softPlus(spot[1] + 0.55 * loose * loose - p.floor, 0.25),
    ),
    spot[2] + right[1] * side + forward[1] * deep,
  ];
  const spin = Math.sin(index * 1.93 + 0.4) > 0 ? 1 : -1;
  return {
    position,
    rotation: [
      -0.05 + 0.5 * loose * Math.sin(index * 3.17 + 1.1),
      facingFrom(position, camera) + 1.1 * loose * spin,
      0.45 * loose,
    ],
    away: Math.abs(loose),
    presence: 1 - smoothStep((Math.abs(phase) - 0.75) / 0.45),
  };
}

/**
 * Where a work is at `progress`. The way it travels is one of the lab's
 * variants (tuning.lab.path); all of them bring it to the same reading spot,
 * just right of centre and facing the camera, at its own moment.
 */
export function panelPose(
  index: number,
  progress: number,
  beat: Beats,
  tuning: Tuning,
  camera: readonly number[],
): PanelPose {
  const p = tuning.panels;
  const phase = chapterPhase(progress, index, beat);
  const flight: Flight & { scale?: number; curve?: number } =
    tuning.lab.path === 1
      ? gallery(index, phase, beat, tuning)
      : tuning.lab.path === 2
        ? helix(progress, phase, beat, tuning)
        : tuning.lab.path === 3
          ? drop(index, progress, phase, beat, tuning, camera)
          : tuning.lab.path === 4
            ? gust(index, progress, phase, beat, tuning, camera)
            : vortex(index, progress, phase, beat, tuning, camera);
  const handoff =
    1 -
    smoothStep(
      (progress - beat.handoffStart) / (beat.panelsGone - beat.handoffStart),
    );
  // Far works fade toward farOpacity (unless the lab keeps them solid) and
  // the shader blurs them by `away`.
  const farOpacity = tuning.lab.far === 0 ? p.farOpacity : 1;
  return {
    position: flight.position,
    rotation: flight.rotation,
    phase,
    opacity: flight.presence * handoff * lerp(1, farOpacity, flight.away),
    away: flight.away,
    scale: flight.scale ?? 1,
    curve: flight.curve ?? 0,
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
