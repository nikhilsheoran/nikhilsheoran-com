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

export const HELIX_TURNS = 1.4;
export const HELIX_START = -Math.PI * 2 * HELIX_TURNS;

// Solve the last pose first. The screen occupies 76% of the limiting viewport
// dimension, leaving a real bezel and a pointer-accessible border on every device.
export function screenFillDistance(aspect: number, fovDegrees: number) {
  const halfFov = Math.tan((fovDegrees * Math.PI) / 360);
  return (
    Math.max(
      SCREEN_HEIGHT / (2 * halfFov),
      SCREEN_WIDTH / (2 * halfFov * aspect),
    ) / 0.76
  );
}

export function monitorLift(aspect: number) {
  return (
    Math.max(0, 0.9 - aspect) * 2.5 +
    0.85 * Math.exp(-Math.pow((aspect - 1) / 0.22, 2))
  );
}

export function orbitAngle(progress: number) {
  return HELIX_START * (1 - smoothStep(progress / 0.93));
}

/** The entire journey converges on the desk pose; no separate final zoom segment. */
export function journeyPose(progress: number, aspect: number, fov = 40) {
  const t = smoothStep(progress);
  const distance = screenFillDistance(aspect, fov);
  const endRadius = distance * 1.16;
  const startRadius = 8.6;
  const radius = endRadius + (startRadius - endRadius) * (1 - t);
  const angle = orbitAngle(progress);
  const centerZ = SCREEN_POSITION[2] * t;
  const endY =
    SCREEN_POSITION[1] -
    Math.sin(SCREEN_TILT) * endRadius +
    monitorLift(aspect);
  const reading = ribbonPose(progress, progress);
  const attention =
    (aspect < 1.4 ? 0.76 : 0.25) *
    smoothStep(progress / 0.07) *
    (1 - smoothStep((progress - 0.75) / 0.14));
  const center = [0, 1.45 + (SCREEN_POSITION[1] - 1.45) * t, centerZ];
  const page = [
    Math.sin(reading.angle) * reading.radius,
    reading.height,
    reading.centerZ +
      Math.cos(reading.angle) * reading.radius * Math.cos(SCREEN_TILT),
  ];
  return {
    radius,
    position: safeCameraPosition([
      Math.sin(angle) * radius,
      endY + 0.65 * (1 - t) + Math.sin(Math.PI * t) * 2.15,
      centerZ + Math.cos(angle) * radius * Math.cos(SCREEN_TILT),
    ]),
    target: center.map((v, i) => v + (page[i] - v) * attention) as [
      number,
      number,
      number,
    ],
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

/** Chapters rise through the helix, easing briefly through their reading position. */
export function ribbonPose(progress: number, chapterAt: number) {
  const offset = chapterAt - progress;
  const readingOffset = offset - 0.023 * Math.tanh(offset / 0.035);
  const clearScreen = smoothStep((progress - 0.755) / 0.095);
  return {
    angle:
      orbitAngle(progress) +
      readingOffset * 8.8 +
      0.23 * (1 - smoothStep((progress - 0.4) / 0.4)) +
      clearScreen * 0.7,
    centerZ: SCREEN_POSITION[2] * smoothStep(progress),
    height:
      1.05 +
      Math.log1p(
        Math.exp((2.3 + progress * 1.1 - readingOffset * 9 - 1.05) * 2),
      ) /
        2 +
      clearScreen * 0.28,
    radius: 3 - smoothStep(progress) * 1.4 - clearScreen * 0.6,
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

/** Camera clearance includes the lens near plane, hair and upper-body silhouette. */
export function safeCameraPosition(
  position: readonly number[],
): [number, number, number] {
  const p: [number, number, number] = [
    Math.max(-8.8, Math.min(8.8, position[0])),
    Math.max(1.9, position[1]),
    Math.max(-7.6, Math.min(7.6, position[2])),
  ];
  const center = [0, 2.42, 1.3],
    radius = [0.6, 0.65, 0.67];
  const q = p.map((v, i) => (v - center[i]) / radius[i]);
  const length = Math.hypot(...q);
  if (length < 0.001)
    return [center[0], center[1] + radius[1] * 1.18, center[2]];
  if (length < 1.18) {
    const target = 1.18;
    const blend = 1 - smoothStep((length - 1) / 0.18);
    const stretch = 1 + (target / Math.max(length, 0.001) - 1) * blend;
    for (let i = 0; i < 3; i++) p[i] = center[i] + q[i] * stretch * radius[i];
  }
  return p;
}

export function screenApproach(
  from: readonly number[],
  t: number,
  aspect: number,
  fov = 40,
): [number, number, number] {
  const d = screenFillDistance(aspect, fov);
  const end = [
    SCREEN_POSITION[0],
    SCREEN_POSITION[1] - Math.sin(SCREEN_TILT) * d + monitorLift(aspect),
    SCREEN_POSITION[2] + Math.cos(SCREEN_TILT) * d,
  ];
  // Near the endpoint this is a short snap. Earlier clicks travel above and beside the sitter.
  const distance = Math.hypot(...from.map((v, i) => v - end[i]));
  const clearance = smoothStep((distance - 0.5) / 1.8);
  const side = from[0] > 0 ? 1 : -1;
  const a = [from[0], Math.max(from[1], 4.1 * clearance), from[2]];
  const b = [
    end[0] + side * 1.25 * clearance,
    end[1] + 1.9 * clearance,
    end[2],
  ];
  const u = 1 - t;
  return safeCameraPosition(
    end.map(
      (v, i) =>
        u * u * u * from[i] +
        3 * u * u * t * a[i] +
        3 * u * t * t * b[i] +
        t * t * t * v,
    ),
  );
}
