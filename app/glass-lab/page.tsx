"use client";

import { type CSSProperties, useState } from "react";
import { ArrowUpRightIcon, XLogoIcon } from "@phosphor-icons/react";
import { Glass } from "@/app/_components/journey/glass";
import { journeySerif } from "@/app/_components/journey/fonts";
import styles from "./lab.module.css";

/**
 * Material lab: the same four elements in eight liquid-glass recipes, over the
 * room. Pick a letter; that recipe becomes the site's glass. Chromium only
 * (the lens needs backdrop-filter: url()).
 */
interface Recipe {
  id: string;
  name: string;
  note: string;
  lens: {
    bezel: number;
    depth: number;
    blur: number;
    saturate: number;
    fringe: number;
    rimPower: number;
    rimGain: number;
    bevelGain: number;
  };
  vars: Record<string, string>;
}

const WHITE_TEXT = {
  "--ink": "#fff",
  "--ink-soft": "rgb(255 255 255 / 0.86)",
  "--ink-muted": "rgb(255 255 255 / 0.62)",
  "--go-ink": "#121512",
  "--glass-text-shadow": "0 1px 2px rgb(0 0 0 / 0.4), 0 0 14px rgb(0 0 0 / 0.28)",
};
const SOFT_SHADOW =
  "0 16px 36px -14px rgb(30 26 18 / 0.36), 0 4px 10px -4px rgb(30 26 18 / 0.16)";

const RECIPES: Recipe[] = [
  {
    id: "A",
    name: "Clear lens",
    note: "No frost, no tint. Only the rim bends the room.",
    lens: { bezel: 22, depth: 44, blur: 0.4, saturate: 1.2, fringe: 0.05, rimPower: 6, rimGain: 1, bevelGain: 0.6 },
    vars: {
      ...WHITE_TEXT,
      "--glass-top": "rgb(255 255 255 / 0.03)",
      "--glass-bottom": "rgb(255 255 255 / 0.03)",
      "--glass-shadow": `${SOFT_SHADOW}, inset 0 0 0 0.5px rgb(255 255 255 / 0.18)`,
      "--glass-rim": "0.7",
    },
  },
  {
    id: "B",
    name: "Clear, dimmed",
    note: "A with a faint smoke so white text holds anywhere.",
    lens: { bezel: 22, depth: 44, blur: 0.8, saturate: 1.25, fringe: 0.05, rimPower: 6, rimGain: 1, bevelGain: 0.8 },
    vars: {
      ...WHITE_TEXT,
      "--glass-top": "rgb(40 42 46 / 0.2)",
      "--glass-bottom": "rgb(30 32 36 / 0.3)",
      "--glass-shadow": `${SOFT_SHADOW}, inset 0 1px 0.5px rgb(255 255 255 / 0.25)`,
      "--glass-rim": "0.8",
    },
  },
  {
    id: "C",
    name: "iOS light",
    note: "Luminous, lightly frosted, dark text.",
    lens: { bezel: 18, depth: 34, blur: 3.2, saturate: 1.55, fringe: 0.05, rimPower: 5, rimGain: 1, bevelGain: 1 },
    vars: {},
  },
  {
    id: "D",
    name: "Milk glass",
    note: "Heavier frost and a thicker, softer edge.",
    lens: { bezel: 26, depth: 30, blur: 9, saturate: 1.7, fringe: 0.03, rimPower: 3, rimGain: 0.8, bevelGain: 1.2 },
    vars: {
      "--glass-top": "rgb(255 255 255 / 0.56)",
      "--glass-bottom": "rgb(255 255 255 / 0.36)",
    },
  },
  {
    id: "E",
    name: "visionOS",
    note: "Deep frost, grey tint, even hairline rim, white text.",
    lens: { bezel: 10, depth: 14, blur: 16, saturate: 1.5, fringe: 0, rimPower: 1, rimGain: 0.35, bevelGain: 0.3 },
    vars: {
      ...WHITE_TEXT,
      "--glass-top": "rgb(128 128 132 / 0.42)",
      "--glass-bottom": "rgb(96 96 100 / 0.48)",
      "--glass-shadow":
        "0 24px 50px -20px rgb(0 0 0 / 0.5), inset 0 1px 0.5px rgb(255 255 255 / 0.4), inset 0 0 0 0.5px rgb(255 255 255 / 0.22)",
      "--glass-rim": "0.35",
      "--glass-text-shadow": "none",
    },
  },
  {
    id: "F",
    name: "Water drop",
    note: "Very deep bezel, strong magnifying rim, colour fringe.",
    lens: { bezel: 30, depth: 70, blur: 0.3, saturate: 1.35, fringe: 0.14, rimPower: 4, rimGain: 1.4, bevelGain: 1.3 },
    vars: {
      ...WHITE_TEXT,
      "--glass-top": "rgb(255 255 255 / 0.05)",
      "--glass-bottom": "rgb(255 255 255 / 0.02)",
      "--glass-shadow":
        "0 18px 30px -12px rgb(20 18 12 / 0.5), inset 0 2px 1px rgb(255 255 255 / 0.5), inset 0 -3px 6px rgb(0 0 0 / 0.14)",
    },
  },
  {
    id: "G",
    name: "Smoked",
    note: "Dark tint, light frost, bright rim arcs.",
    lens: { bezel: 18, depth: 34, blur: 4, saturate: 1.3, fringe: 0.04, rimPower: 6, rimGain: 1.3, bevelGain: 0.8 },
    vars: {
      ...WHITE_TEXT,
      "--glass-top": "rgb(18 20 22 / 0.42)",
      "--glass-bottom": "rgb(10 12 14 / 0.56)",
      "--glass-shadow":
        "0 18px 36px -14px rgb(0 0 0 / 0.55), inset 0 1px 0.5px rgb(255 255 255 / 0.28), inset 0 -1px 0.5px rgb(0 0 0 / 0.4)",
      "--glass-text-shadow": "none",
    },
  },
  {
    id: "H",
    name: "Crystal",
    note: "Clear with a raised, sculpted bevel and inner glow.",
    lens: { bezel: 20, depth: 46, blur: 1.4, saturate: 1.45, fringe: 0.07, rimPower: 3, rimGain: 1.3, bevelGain: 2.2 },
    vars: {
      "--glass-top": "rgb(255 255 255 / 0.2)",
      "--glass-bottom": "rgb(255 255 255 / 0.08)",
      "--glass-shadow":
        "0 20px 34px -14px rgb(20 18 12 / 0.5), 0 2px 3px rgb(20 18 12 / 0.2), inset 0 2px 1px rgb(255 255 255 / 0.85), inset 0 -2px 1px rgb(0 0 0 / 0.16), inset 0 0 20px rgb(255 255 255 / 0.3)",
    },
  },
];

const BACKDROPS = [
  ["Room", "/journey/lab-room.jpg"],
  ["Tweet (dark)", "/journey/works/first-dollar.jpg"],
  ["Thumbnail (colour)", "/journey/works/first-video.jpg"],
] as const;

export default function GlassLab() {
  const [backdrop, setBackdrop] = useState(0);
  const [year, setYear] = useState(2);
  return (
    <main
      className={`${styles.lab} ${journeySerif.variable}`}
      style={{ backgroundImage: `url(${BACKDROPS[backdrop][1]})` }}
    >
      <div className={styles.switcher}>
        {BACKDROPS.map(([label], index) => (
          <button
            key={label}
            aria-pressed={backdrop === index}
            onClick={() => setBackdrop(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {RECIPES.map((recipe) => {
          const style = recipe.vars as CSSProperties;
          return (
            <section key={recipe.id} className={styles.cell}>
              <p className={styles.label}>
                <b>{recipe.id}</b> {recipe.name}
                <span>{recipe.note}</span>
              </p>
              <div className={styles.row}>
                <Glass as="button" className={styles.pill} style={style} {...recipe.lens}>
                  Nikhil Sheoran
                </Glass>
                <Glass
                  as="button"
                  className={styles.circle}
                  style={style}
                  {...recipe.lens}
                  bezel={Math.min(recipe.lens.bezel, 16)}
                >
                  <XLogoIcon size={18} />
                </Glass>
              </div>
              <Glass className={styles.now} style={style} {...recipe.lens}>
                <div>
                  <p className={styles.when}>October 2024, age 18</p>
                  <h2>A hackathon, won</h2>
                  <p className={styles.line}>
                    We won it, and I ended up demoing our project to the
                    Director General of Police.
                  </p>
                </div>
                <span className={styles.go}>
                  <ArrowUpRightIcon size={18} weight="bold" />
                </span>
              </Glass>
              <Glass className={styles.tabs} style={style} {...recipe.lens}>
                {[2022, 2023, 2024, 2025, 2026].map((y, index) => (
                  <button
                    key={y}
                    aria-current={year === index ? "step" : undefined}
                    onClick={() => setYear(index)}
                  >
                    {y}
                  </button>
                ))}
              </Glass>
            </section>
          );
        })}
      </div>
    </main>
  );
}
