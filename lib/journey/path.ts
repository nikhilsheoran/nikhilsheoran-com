import { STORY_END } from "./story";

export function smoothStep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

export const HELIX_START = -2.35;
export const HELIX_TURNS = 1.65;

export function orbitAngle(progress: number) {
  const t = Math.max(0, Math.min(progress / STORY_END, 1));
  return HELIX_START + t * Math.PI * 2 * HELIX_TURNS;
}

/** A moving helix: earlier chapters rise above us, later chapters arrive from below. */
export function ribbonPose(progress: number, chapterAt: number) {
  const offset = chapterAt - progress;
  return {
    angle: orbitAngle(progress) + offset * 8.8 + 0.23,
    height: 2.3 + progress * 1.55 - offset * 9,
    radius: 3,
  };
}

export function screenFillDistance(aspect: number, fovDegrees: number) {
  const halfFov = Math.tan((fovDegrees * Math.PI) / 360);
  return Math.max(0.679 / (2 * halfFov), 1.085 / (2 * halfFov * aspect)) * 1.04;
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
