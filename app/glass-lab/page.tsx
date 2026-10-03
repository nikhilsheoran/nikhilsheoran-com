"use client";

import { type CSSProperties, useState } from "react";
import { ArrowUpRightIcon, XLogoIcon } from "@phosphor-icons/react";
import { Glass } from "@/app/_components/journey/glass";
import { journeySerif } from "@/app/_components/journey/fonts";
import styles from "./lab.module.css";

/**
 * Material lab: the same four elements in a set of liquid-glass recipes, over
 * the room. Pick a letter; that recipe becomes the site's glass. Chromium only
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

const CLEAR = (shadow: string, tint = 0.03): Record<string, string> => ({
  ...WHITE_TEXT,
  "--glass-top": `rgb(255 255 255 / ${tint + 0.02})`,
  "--glass-bottom": `rgb(255 255 255 / ${tint})`,
  "--glass-shadow": shadow,
});
const FLAT = `${SOFT_SHADOW}, inset 0 0 0 0.5px rgb(255 255 255 / 0.18)`;
const DROP =
  "0 18px 30px -12px rgb(20 18 12 / 0.5), inset 0 2px 1px rgb(255 255 255 / 0.5), inset 0 -3px 6px rgb(0 0 0 / 0.14)";
const HALF =
  "0 17px 32px -13px rgb(20 18 12 / 0.44), inset 0 1.5px 1px rgb(255 255 255 / 0.34), inset 0 -2px 4px rgb(0 0 0 / 0.08)";

const RECIPES: Recipe[] = [
  {
    id: "A",
    name: "Clear lens (reference)",
    note: "No frost, no tint; a thin bending rim.",
    lens: { bezel: 22, depth: 44, blur: 0.4, saturate: 1.2, fringe: 0.05, rimPower: 6, rimGain: 1, bevelGain: 0.6 },
    vars: { ...CLEAR(FLAT), "--glass-rim": "0.7" },
  },
  {
    id: "F",
    name: "Water drop (reference)",
    note: "Very deep bezel, strong magnifying rim, colour fringe.",
    lens: { bezel: 30, depth: 70, blur: 0.3, saturate: 1.35, fringe: 0.14, rimPower: 4, rimGain: 1.4, bevelGain: 1.3 },
    vars: CLEAR(DROP),
  },
  {
    id: "1",
    name: "A leaning to F",
    note: "A, with a slightly deeper rim and a touch more fringe.",
    lens: { bezel: 24, depth: 50, blur: 0.4, saturate: 1.25, fringe: 0.07, rimPower: 5.5, rimGain: 1.1, bevelGain: 0.8 },
    vars: { ...CLEAR(FLAT), "--glass-rim": "0.8" },
  },
  {
    id: "2",
    name: "Halfway",
    note: "Even blend of A and F.",
    lens: { bezel: 26, depth: 57, blur: 0.35, saturate: 1.28, fringe: 0.095, rimPower: 5, rimGain: 1.2, bevelGain: 0.95 },
    vars: CLEAR(HALF),
  },
  {
    id: "3",
    name: "F leaning to A",
    note: "F, a little shallower and calmer.",
    lens: { bezel: 28, depth: 64, blur: 0.3, saturate: 1.32, fringe: 0.12, rimPower: 4.5, rimGain: 1.3, bevelGain: 1.15 },
    vars: CLEAR(DROP),
  },
  {
    id: "4",
    name: "A body, F rim",
    note: "A's flat clear pane with F's bright, fringed rim.",
    lens: { bezel: 22, depth: 48, blur: 0.4, saturate: 1.25, fringe: 0.14, rimPower: 4, rimGain: 1.4, bevelGain: 0.7 },
    vars: CLEAR(FLAT),
  },
  {
    id: "5",
    name: "F depth, no rainbow",
    note: "F's deep magnifying bezel with A's faint fringe.",
    lens: { bezel: 30, depth: 70, blur: 0.3, saturate: 1.3, fringe: 0.03, rimPower: 5, rimGain: 1.1, bevelGain: 1.1 },
    vars: CLEAR(DROP),
  },
  {
    id: "6",
    name: "Halfway, dimmed",
    note: "Blend 2 with a faint smoke so white text always reads.",
    lens: { bezel: 26, depth: 57, blur: 0.5, saturate: 1.28, fringe: 0.095, rimPower: 5, rimGain: 1.2, bevelGain: 0.95 },
    vars: {
      ...CLEAR(HALF),
      "--glass-top": "rgb(30 32 36 / 0.14)",
      "--glass-bottom": "rgb(22 24 28 / 0.24)",
    },
  },
  {
    id: "7",
    name: "Wide soft bezel",
    note: "A broad, gentle bending band instead of a tight one.",
    lens: { bezel: 36, depth: 54, blur: 0.35, saturate: 1.28, fringe: 0.08, rimPower: 5, rimGain: 1.1, bevelGain: 0.9 },
    vars: CLEAR(HALF),
  },
  {
    id: "8",
    name: "Halfway, wet rim",
    note: "Blend 2 with longer, brighter specular arcs.",
    lens: { bezel: 26, depth: 57, blur: 0.35, saturate: 1.3, fringe: 0.1, rimPower: 2.6, rimGain: 1.7, bevelGain: 1.2 },
    vars: CLEAR(DROP),
  },
];

/** Years as a tab bar. The selection slides: its leading edge goes first and
 * the trailing edge catches up, so the pill stretches like liquid, then settles. */
function Tabs({
  recipe,
  style,
}: {
  recipe: Recipe;
  style: CSSProperties;
}) {
  const [year, setYear] = useState(2);
  const [forward, setForward] = useState(true);
  return (
    <Glass
      className={styles.tabs}
      style={{ ...style, "--i": year } as CSSProperties}
      data-forward={forward}
      {...recipe.lens}
    >
      <span className={styles.selection} aria-hidden />
      {[2022, 2023, 2024, 2025, 2026].map((y, index) => (
        <button
          key={y}
          aria-current={year === index ? "step" : undefined}
          onClick={() => {
            setForward(index > year);
            setYear(index);
          }}
        >
          {y}
        </button>
      ))}
    </Glass>
  );
}

const BACKDROPS = [
  ["Room", "/journey/lab-room.jpg"],
  ["Tweet (dark)", "/journey/works/first-dollar.jpg"],
  ["Thumbnail (colour)", "/journey/works/first-video.jpg"],
] as const;

export default function GlassLab() {
  const [backdrop, setBackdrop] = useState(0);
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
              <Tabs recipe={recipe} style={style} />
            </section>
          );
        })}
      </div>
    </main>
  );
}
