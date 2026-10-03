"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import styles from "./journey.module.css";

/**
 * Covers the canvas while scene assets stream in (useProgress) and lifts once
 * the scene has drawn its first frame, which only happens after everything loaded.
 */
export function Loader({ sceneReady }: { sceneReady: boolean }) {
  const { progress } = useProgress();
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const complete = sceneReady;

  useEffect(() => {
    if (!complete) return;
    const lift = window.setTimeout(() => setDone(true), 250);
    const remove = window.setTimeout(() => setGone(true), 1400);
    return () => {
      window.clearTimeout(lift);
      window.clearTimeout(remove);
    };
  }, [complete]);

  if (gone) return null;
  const shown = complete ? 100 : Math.round(Math.max(3, Math.min(99, progress)));
  return (
    <div
      className={`${styles.loader} ${done ? styles.loaderDone : ""}`}
      role="progressbar"
      aria-label="Loading the studio"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={shown}
    >
      <div className={styles.loaderInner}>
        <span className={styles.loaderName}>Nikhil Sheoran</span>
        <div className={styles.loaderTrack}>
          <div
            className={styles.loaderFill}
            style={{ transform: `scaleX(${shown / 100})` }}
          />
        </div>
        <span className={styles.loaderLabel}>
          {complete ? "Come in" : `Setting up the desk  ${shown}%`}
        </span>
      </div>
    </div>
  );
}
