"use client";

import { useState } from "react";
import {
  DEFAULT_TUNING,
  resetTuning,
  setTuningValue,
  tuning,
  type Tuning,
} from "@/lib/journey/tuning";
import styles from "./tuner.module.css";

type Range = [min: number, max: number, step: number];

/** Slider bounds for each value; anything unlisted gets 0…2× its default. */
const RANGES: Record<string, Range> = {
  "timeline.firstChapter": [0, 0.3, 0.005],
  "timeline.lastChapter": [0.4, 0.95, 0.005],
  "timeline.handoffStart": [0.5, 0.97, 0.005],
  "timeline.settleArm": [0, 1, 0.01],
  "timeline.panelsGone": [0.05, 1, 0.01],
  "timeline.approachSeconds": [0.4, 4, 0.05],
  "camera.turns": [0.25, 3, 0.01],
  "camera.endAngle": [-3.14, 3.14, 0.01],
  "camera.startRadius": [2, 10, 0.05],
  "camera.endRadius": [1, 5, 0.05],
  "camera.radiusCurve": [0.5, 4, 0.05],
  "camera.startHeight": [1.5, 6, 0.05],
  "camera.endHeight": [2, 5, 0.05],
  "camera.targetStartHeight": [1, 4, 0.05],
  "camera.targetEndHeight": [1, 4, 0.05],
  "camera.arrivalLift": [0, 2.5, 0.05],
  "camera.arrivalBack": [-1, 1.5, 0.02],
  "camera.fov": [20, 70, 0.5],
  "panels.startRadius": [0.5, 5, 0.05],
  "panels.endRadius": [0.5, 5, 0.05],
  "panels.counterSpin": [-2, 2, 0.01],
  "panels.rise": [-1.5, 1.5, 0.01],
  "panels.viewOffset": [-0.6, 0.6, 0.01],
  "panels.faceCamera": [0, 1, 0.01],
  "panels.passRoll": [0, 1, 0.01],
  "panels.width": [0.6, 3, 0.05],
  "panels.maxViewFraction": [0.2, 1, 0.01],
  "panels.onion": [0, 4, 0.05],
  "motion.spring": [2, 30, 0.5],
  "motion.dragSpring": [5, 60, 0.5],
};

function rangeFor(key: string, value: number): Range {
  return RANGES[key] ?? [0, Math.max(1, value * 2), Math.max(1, value * 2) / 200];
}

export function Tuner() {
  const [, redraw] = useState(0);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);
  const groups = Object.keys(DEFAULT_TUNING) as (keyof Tuning)[];

  const set = (group: keyof Tuning, key: string, value: number) => {
    setTuningValue(group, key, value);
    redraw((n) => n + 1);
  };

  return (
    <aside className={styles.tuner} data-tuner aria-label="Choreography tuner">
      <header>
        <strong>Tuner</strong>
        <button onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"}</button>
      </header>
      {open && (
        <>
          <div className={styles.actions}>
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(JSON.stringify(tuning, null, 2))
                  .then(() => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  })
                  .catch(() => {});
              }}
            >
              {copied ? "Copied" : "Copy JSON"}
            </button>
            <button
              onClick={() => {
                resetTuning();
                redraw((n) => n + 1);
              }}
            >
              Reset
            </button>
          </div>
          {groups.map((group) => (
            <fieldset key={group}>
              <legend>{group}</legend>
              {Object.entries(tuning[group]).map(([key, value]) => {
                const id = `tune-${group}-${key}`;
                if (key === "wheelSensitivity") return null;
                const [min, max, stepSize] = rangeFor(`${group}.${key}`, value);
                const changed =
                  value !==
                  (DEFAULT_TUNING[group] as Record<string, number>)[key];
                return (
                  <label key={key} htmlFor={id} data-changed={changed}>
                    <span>{key}</span>
                    <input
                      id={id}
                      type="range"
                      min={min}
                      max={max}
                      step={stepSize}
                      value={value}
                      onChange={(event) =>
                        set(group, key, Number(event.target.value))
                      }
                    />
                    <output>{Number(value.toFixed(3))}</output>
                  </label>
                );
              })}
            </fieldset>
          ))}
          <p className={styles.note}>
            Saved in this browser. “Copy JSON” and paste over DEFAULT_TUNING in
            lib/journey/tuning.ts to make it permanent.
          </p>
        </>
      )}
    </aside>
  );
}
