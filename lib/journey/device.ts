/**
 * Phones and small tablets. Their browsers kill a tab that asks for too much
 * memory, so they get the half-size room, smaller panel prints and a lower
 * drawing resolution. Decided once from the hardware, never from the window
 * size, so a narrow desktop window keeps the full version.
 */
let small: boolean | undefined;

export function isSmallDevice() {
  if (typeof window === "undefined") return false;
  if (small === undefined) {
    const memory = (navigator as { deviceMemory?: number }).deviceMemory;
    const touchFirst = window.matchMedia("(pointer: coarse)").matches;
    small = touchFirst || (memory !== undefined && memory <= 4);
  }
  return small;
}
