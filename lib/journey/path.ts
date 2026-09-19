import {
  chapterProgress,
  SCREEN_POSITION,
  SCREEN_TILT,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from "./story";

export function smoothStep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

/** Zero endpoint velocity and acceleration for reversible camera handoffs. */
export function smootherStep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export const HELIX_TURNS = 1.4;
export const HELIX_START = -Math.PI * 2 * HELIX_TURNS;
export const HELIX_AXIS = [SCREEN_POSITION[0], SCREEN_POSITION[2]] as const;

export function screenFillDistance(aspect: number, fovDegrees: number) {
  const halfFov = Math.tan((fovDegrees * Math.PI) / 360);
  return (
    Math.max(
      SCREEN_HEIGHT / (2 * halfFov),
      SCREEN_WIDTH / (2 * halfFov * aspect),
    ) / 0.76
  );
}

export function screenPose(aspect: number, fov = 40) {
  const d = screenFillDistance(aspect, fov);
  return {
    position: [
      SCREEN_POSITION[0],
      SCREEN_POSITION[1] - Math.sin(SCREEN_TILT) * d,
      SCREEN_POSITION[2] + Math.cos(SCREEN_TILT) * d,
    ] as [number, number, number],
    target: SCREEN_POSITION,
  };
}

export function orbitAngle(progress: number) {
  return HELIX_START * (1 - smootherStep(progress));
}

/** One fixed vertical axis, one zoom curve, and no collision-driven detours. */
export function journeyPose(progress: number, aspect: number, fov = 40) {
  const t = smootherStep(progress);
  const end = screenPose(aspect, fov).position;
  const endRadius = end[2] - HELIX_AXIS[1];
  const radius = endRadius + (7.2 - endRadius) * (1 - t);
  const angle = orbitAngle(progress);
  return {
    radius,
    position: [
      HELIX_AXIS[0] + Math.sin(angle) * radius,
      end[1] + 1.4 * (1 - t),
      HELIX_AXIS[1] + Math.cos(angle) * radius,
    ] as [number, number, number],
    target: [
      HELIX_AXIS[0],
      SCREEN_POSITION[1] + 0.65 * (1 - t),
      HELIX_AXIS[1],
    ] as [number, number, number],
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

/** A travelling window never draws more than three chapters, even during fades. */
export function panelPresence(progress: number, index: number) {
  const start = index < 3 ? -1 : chapterProgress(index - 2) + 0.075;
  const end =
    index < 2
      ? chapterProgress(index + 1) + 0.075
      : chapterProgress(index) + 0.19;
  const arriving = index < 3 ? 1 : smoothStep((progress - start) / 0.065);
  const leaving = 1 - smoothStep((progress - (end - 0.085)) / 0.085);
  const handoff = 1 - smoothStep((progress - 0.765) / 0.085);
  const proximity =
    1 - smoothStep(Math.abs(progress - chapterProgress(index)) / 0.23);
  return arriving * leaving * handoff * (0.2 + proximity * 0.8);
}

/** Pages rise around the camera's axis; the active page lies on its sight line. */
export function ribbonPose(
  progress: number,
  chapterAt: number,
  aspect = 16 / 9,
  fov = 40,
) {
  const camera = journeyPose(progress, aspect, fov);
  const offset = chapterAt - progress;
  const radius = camera.radius * 0.52;
  const readingHeight =
    camera.target[1] + (camera.position[1] - camera.target[1]) * 0.52;
  const rawHeight = readingHeight - offset * 6.5;
  return {
    angle: orbitAngle(progress) + offset * 3.8,
    centerX: HELIX_AXIS[0],
    centerZ: HELIX_AXIS[1],
    height: 1.05 + Math.log1p(Math.exp((rawHeight - 1.05) * 5)) / 5,
    radius,
  };
}

/** Limit apparent size, including a margin for the deformed edges. */
export function panelScale(
  depth: number,
  aspect: number,
  progress: number,
  fov = 40,
) {
  const fraction = 0.64 - smoothStep((progress - 0.62) / 0.22) * 0.14;
  const natural = (aspect < 0.8 ? 0.8 : 1) * (1 - smoothStep(progress) * 0.28);
  // A bounding sphere includes curled edges and rotated corners, including their
  // perspective enlargement as the near edge approaches the camera.
  const slope =
    Math.tan((fov * Math.PI) / 360) * Math.min(1, aspect) * fraction;
  const bounded =
    (Math.max(0.02, depth) * slope) / Math.sqrt(1 + slope * slope) / 1.8;
  return Math.min(natural, bounded);
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

/** Direct, reversible approach with modest clearance over the laptop lid. */
export function screenApproach(
  from: readonly number[],
  t: number,
  aspect: number,
  fov = 40,
): [number, number, number] {
  return transitionPosition(from, screenPose(aspect, fov).position, t);
}

export function transitionPosition(
  from: readonly number[],
  to: readonly number[],
  t: number,
): [number, number, number] {
  if (t <= 0) return [from[0], from[1], from[2]];
  if (t >= 1) return [to[0], to[1], to[2]];
  const distance = Math.hypot(...from.map((v, i) => v - to[i]));
  const lift = 0.45 * smoothStep((distance - 0.4) / 2);
  // A single arch clears the lid. Its amplitude vanishes for the automatic handoff.
  return to.map(
    (v, i) =>
      from[i] + (v - from[i]) * t + (i === 1 ? lift * 4 * t * (1 - t) : 0),
  ) as [number, number, number];
}
