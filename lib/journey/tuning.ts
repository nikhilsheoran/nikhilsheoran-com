/**
 * Every hand-tuned number in the journey lives here. The render loop reads the
 * live `tuning` object each frame, so the dev tuner (`/?tune`) can change it
 * without a reload. Paste the tuner's "Copy JSON" output over DEFAULT_TUNING.
 *
 * Units: progress is 0..1 along the scroll; lengths are scene units (2 per metre);
 * angles are radians.
 */
export const DEFAULT_TUNING = {
  timeline: {
    /** Progress at which the first work is centred for reading. */
    firstChapter: 0.08,
    /** Progress at which the last work is centred for reading. */
    lastChapter: 0.72,
    /** The orbit ends and the camera starts its approach to the screen. */
    handoffStart: 0.8,
    /** Fraction of the handoff after which forward motion glides into the Mac. */
    settleArm: 0.3,
    /** Fraction of the handoff by which every panel has faded out. */
    panelsGone: 0.35,
    /** Seconds for the direct approach when the laptop is clicked. */
    approachSeconds: 1.7,
  },
  camera: {
    /** Full turns from the opening frame to the Mac; the spin ends facing the screen. */
    turns: 1.4,
    startRadius: 7.2,
    /** Radius when the reading helix ends and the spiral starts closing in. */
    endRadius: 2.75,
    /** >1 keeps the camera wide for longer before it tightens. */
    radiusCurve: 1.6,
    startHeight: 3.3,
    /** Height held over the statue until the camera is in front of its face. */
    endHeight: 3.35,
    targetStartHeight: 2.3,
    targetEndHeight: 2.05,
    /** Fraction of the handoff before the camera starts descending to the screen. */
    descentStart: 0.62,
    fov: 40,
  },
  panels: {
    /** Radius at the reading moment, early and late in the story. */
    startRadius: 2.3,
    endRadius: 1.65,
    /** Radius of the vortex a work drifts back out to between its moments. */
    orbitRadius: 3.1,
    /** How much each work's orbit radius and height differ from its neighbours'. */
    orbitSpread: 0.18,
    /** World rotation per chapter, against the camera's direction. */
    counterSpin: 0.7,
    /** Height gained per chapter: upcoming works rise from below. */
    rise: 0.5,
    /** Where the reading panel sits in view, right of centre (radians). */
    viewOffset: 0.2,
    /** 0 = faces straight out from the axis, 1 = faces the camera. */
    faceCamera: 0.75,
    /** Roll while a panel passes. */
    passRoll: 0.12,
    /** Physical width of a panel. */
    width: 1.55,
    /** Largest share of the frame width a passing panel may cover. */
    maxViewFraction: 0.42,
    /** How many chapters either side of the current one stay in the air. */
    visibleChapters: 3,
    /** Distance (scene units) where the haze starts and where it is thickest. */
    hazeNear: 2.6,
    hazeFar: 8.5,
    /** Fold strength of the fabric (1 = the old heavy cloth). */
    folds: 0.55,
    /** Sheet inertia: lower = heavier, lags and overshoots more. */
    inertia: 9,
    /** How strongly a sheet banks into its own turns. */
    bank: 0.35,
    /** Idle air drift amplitude. */
    drift: 0.02,
  },
  motion: {
    spring: 10,
    dragSpring: 26,
    wheelSensitivity: 1 / 7800,
    maxWheelStep: 0.045,
  },
};

export type Tuning = typeof DEFAULT_TUNING;

const STORAGE_KEY = "journey-tuning";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** The live, mutable tuning. Only the dev tuner writes to it. */
export const tuning: Tuning = clone(DEFAULT_TUNING);

export function applyTuning(next: Partial<Tuning>) {
  for (const group of Object.keys(tuning) as (keyof Tuning)[]) {
    Object.assign(tuning[group], next[group] ?? {});
  }
}

export function setTuningValue(
  group: keyof Tuning,
  key: string,
  value: number,
) {
  (tuning[group] as Record<string, number>)[key] = value;
  saveTuning();
}

export function resetTuning() {
  applyTuning(clone(DEFAULT_TUNING));
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function saveTuning() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tuning));
  } catch {}
}

/** Restores a tuner session in development only; production uses the defaults. */
export function loadSavedTuning() {
  if (process.env.NODE_ENV === "production") return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) applyTuning(JSON.parse(saved));
  } catch {}
}
