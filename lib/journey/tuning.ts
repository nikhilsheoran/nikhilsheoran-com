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
    approachSeconds: 1.5,
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
    /** Fraction of the handoff by which the spiral has closed in to screen distance. */
    closeIn: 0.55,
    fov: 40,
  },
  panels: {
    /** Radius at the reading moment, early and late in the story. */
    startRadius: 2.3,
    endRadius: 1.65,
    /** Radius of the vortex a work drifts back out to between its moments. */
    orbitRadius: 3.2,
    /** The band of clear air the works stay inside (above the statue, below the ceiling). */
    floor: 2.9,
    ceiling: 5.2,
    /** How much each work's orbit radius and height differ from its neighbours'. */
    orbitSpread: 0.18,
    /** World rotation per chapter, against the camera's direction. */
    counterSpin: 0.7,
    /** Height gained per chapter: upcoming works rise from below. */
    rise: 0.16,
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
    /** Helix: the turn between one work and the next (radians). */
    spacing: 0.9,
    /** How many chapters either side of the current one stay in the air. */
    visibleChapters: 3,
    /** Each work's own tumble while out in the vortex (radians); it squares up to be read. */
    tumble: 0.45,
    /** Opacity of a work once it's back out in the vortex. */
    farOpacity: 0.32,
    /** Depth-of-field blur of a work out in the vortex (0 = sharp). */
    farBlur: 1,
    /** Distance (scene units) where the haze starts and where it is thickest. */
    hazeNear: 2.6,
    hazeFar: 8.5,
    /** Fold strength of the fabric (1 = the old heavy cloth). */
    folds: 1,
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
  /** Panel variants under comparison; pick them in the lab (`?lab`). */
  lab: {
    /** 0 vortex, 1 gallery, 2 helix, 3 drop, 4 gust. */
    path: 2,
    /** 0 ink (colour on hover), 1 colour, 2 print (paper margin, round corners). */
    look: 0,
    /** Far panels: 0 fade and blur, 1 blur only, 2 sharp and solid. */
    far: 0,
    /** 0 flag, 1 curtain, 2 calm, 3 stiff card. */
    cloth: 1,
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
