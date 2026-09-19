import { SCREEN_POSITION, SCREEN_TILT } from "./story";

export function smoothStep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

export const HELIX_TURNS = 1.4;
export const HELIX_START = -Math.PI * 2 * HELIX_TURNS;

// Solve the last pose first. The screen occupies 76% of the limiting viewport
// dimension, leaving a real bezel and a pointer-accessible border on every device.
export function screenFillDistance(aspect: number, fovDegrees: number) {
  const halfFov = Math.tan((fovDegrees * Math.PI) / 360);
  return Math.max(0.679 / (2 * halfFov), 1.085 / (2 * halfFov * aspect)) / 0.76;
}

export function monitorLift(aspect: number) {
  return Math.max(0, 0.9 - aspect) * 2.5;
}

export function orbitAngle(progress: number) {
  return HELIX_START * (1 - smoothStep(progress));
}

/** The entire journey converges on the desk pose; no separate final zoom segment. */
export function journeyPose(progress: number, aspect: number, fov = 40) {
  const t = smoothStep(progress);
  const distance = screenFillDistance(aspect, fov);
  const endRadius = distance * 1.16;
  const startRadius = aspect < 0.8 ? 13 : 8.6;
  const radius = endRadius + (startRadius - endRadius) * (1 - t);
  const angle = orbitAngle(progress);
  const centerZ = SCREEN_POSITION[2] * t;
  const endY =
    SCREEN_POSITION[1] -
    Math.sin(SCREEN_TILT) * endRadius +
    monitorLift(aspect);
  return {
    radius,
    position: [
      Math.sin(angle) * radius,
      endY + 0.65 * (1 - t) + Math.sin(Math.PI * t) * 2.15,
      centerZ + Math.cos(angle) * radius * Math.cos(SCREEN_TILT),
    ] as [number, number, number],
    target: [0, 1.45 + (SCREEN_POSITION[1] - 1.45) * t, centerZ] as [
      number,
      number,
      number,
    ],
  };
}

/** Earlier chapters rise above the camera; later chapters arrive from below. */
export function ribbonPose(progress: number, chapterAt: number) {
  const offset = chapterAt - progress;
  return {
    angle:
      orbitAngle(progress) +
      offset * 8.8 +
      0.23 * (1 - smoothStep((progress - 0.4) / 0.4)),
    centerZ: SCREEN_POSITION[2] * smoothStep(progress),
    // A smooth floor keeps future panels above the ground from the first frame.
    height:
      1.05 +
      Math.log1p(Math.exp((2.3 + progress * 1.1 - offset * 9 - 1.05) * 2)) / 2,
    radius: 3 - smoothStep(progress) * 1.4,
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
