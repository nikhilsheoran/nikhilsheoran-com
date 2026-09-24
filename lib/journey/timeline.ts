import type { Tuning } from "./tuning";

/**
 * Named beats along the scroll, all derived from tuning.timeline. Nothing else
 * in the journey should hard-code a progress value.
 *
 *   0 ── intro ── chapter 0 … chapter N-1 ── handoffStart ── settleArm ── 1 (Mac)
 *                                          └ panelsGone
 */
export interface Beats {
  chapters: number[];
  spacing: number;
  firstChapter: number;
  lastChapter: number;
  handoffStart: number;
  panelsGone: number;
  settleArm: number;
  /** Where "Back to the desk" returns along the rail. */
  returnTo: number;
}

export function beats(tuning: Tuning, count: number): Beats {
  const { firstChapter, lastChapter, handoffStart } = tuning.timeline;
  const spacing = count > 1 ? (lastChapter - firstChapter) / (count - 1) : 0.1;
  const handoff = 1 - handoffStart;
  return {
    chapters: Array.from(
      { length: count },
      (_, index) => firstChapter + index * spacing,
    ),
    spacing,
    firstChapter,
    lastChapter,
    handoffStart,
    panelsGone: handoffStart + tuning.timeline.panelsGone * handoff,
    settleArm: handoffStart + tuning.timeline.settleArm * handoff,
    returnTo: lastChapter,
  };
}

export const INTRO = -1;
export const HANDOFF = -2;

/** The chapter whose caption is shown, INTRO before the first, HANDOFF after the orbit. */
export function activeChapter(progress: number, beat: Beats) {
  if (progress >= beat.handoffStart) return HANDOFF;
  // The opening frame always gets the intro, however widely the works are spaced.
  if (progress < Math.max(beat.firstChapter - beat.spacing / 2, beat.firstChapter / 2))
    return INTRO;
  return Math.min(
    beat.chapters.length - 1,
    Math.max(
      0,
      Math.round((progress - beat.firstChapter) / beat.spacing),
    ),
  );
}

/** Chapters since this panel's reading moment (negative = still arriving). */
export function chapterPhase(progress: number, index: number, beat: Beats) {
  return (progress - beat.chapters[index]) / beat.spacing;
}
