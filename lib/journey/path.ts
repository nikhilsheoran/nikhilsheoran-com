import { STORY_END } from "./story";

export function orbitAngle(progress: number) {
  // One orbit for the chapters, then turn toward the display as the camera closes in.
  return -2.35 + Math.min(progress / STORY_END, 1) * Math.PI * 2
    + smoothStep((progress - STORY_END) / (1 - STORY_END)) * 2.35;
}

export function smoothStep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

/** Distance that lets a tilted 16:10 screen cover the camera view at any aspect ratio. */
export function screenFillDistance(aspect: number, fovDegrees: number) {
  const halfFov = Math.tan((fovDegrees * Math.PI) / 360);
  return Math.min(.679 / (2 * halfFov), 1.085 / (2 * halfFov * aspect)) * .92;
}
