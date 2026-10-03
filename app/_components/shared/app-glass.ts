import styles from "./app-glass.module.css";

/** Class and props that turn a `Glass` into a light in-app control. */
export const appGlass = styles.appGlass;
/** A shallow rim: over sharp app content a deep one smears text into streaks. */
export const APP_GLASS = { coreBlur: 8, bezel: 12, depth: 16, fringe: 0 } as const;

/** Keeps browsers and password managers from offering to fill a search field. */
export const NO_AUTOFILL = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "other",
} as const;
