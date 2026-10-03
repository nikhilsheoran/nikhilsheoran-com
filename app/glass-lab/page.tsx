"use client";

import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  useState,
} from "react";
import { ArrowUpRightIcon, XLogoIcon } from "@phosphor-icons/react";
import { Glass } from "@/app/_components/journey/glass";
import { journeySerif } from "@/app/_components/journey/fonts";
import styles from "./lab.module.css";

/**
 * Glass lab, round three. The material is fixed (recipe 2, "Halfway": a clear
 * pane with a deep refracting rim). Each section varies one thing so it can be
 * judged on its own: text contrast, hover, press, corner radius, text layout.
 * Chromium only (the lens needs backdrop-filter: url()).
 */
const LENS = {
  bezel: 26,
  depth: 57,
  blur: 0.35,
  saturate: 1.28,
  fringe: 0.07,
  rimPower: 5,
  rimGain: 1.2,
  bevelGain: 0.95,
};
const VARS = {
  "--ink": "#fff",
  "--ink-soft": "rgb(255 255 255 / 0.86)",
  "--ink-muted": "rgb(255 255 255 / 0.62)",
  "--go-ink": "#121512",
  "--glass-text-shadow": "0 1px 2px rgb(0 0 0 / 0.4), 0 0 14px rgb(0 0 0 / 0.28)",
  "--glass-top": "rgb(255 255 255 / 0.05)",
  "--glass-bottom": "rgb(255 255 255 / 0.03)",
  "--glass-shadow":
    "0 17px 32px -13px rgb(20 18 12 / 0.44), inset 0 1.5px 1px rgb(255 255 255 / 0.34), inset 0 -2px 4px rgb(0 0 0 / 0.08)",
} as CSSProperties;

const BACKDROPS = [
  ["Room", "/journey/lab-room.jpg"],
  ["Tweet (dark)", "/journey/works/first-dollar.jpg"],
  ["Thumbnail (colour)", "/journey/works/first-video.jpg"],
] as const;

function Words({ align = "left" }: { align?: "left" | "center" }) {
  return (
    <div style={{ textAlign: align, flex: 1 }}>
      <p className={styles.when}>October 2024, age 18</p>
      <h2>A hackathon, won</h2>
      <p className={styles.line}>
        We won it, and I ended up demoing our project to the Director General
        of Police.
      </p>
    </div>
  );
}
const Go = () => (
  <span className={styles.go}>
    <ArrowUpRightIcon size={18} weight="bold" />
  </span>
);

function Cell({ id, name, note, children }: { id: string; name: string; note: string; children: ReactNode }) {
  return (
    <section className={styles.cell}>
      <p className={styles.label}>
        <b>{id}</b> {name}
        <span>{note}</span>
      </p>
      {children}
    </section>
  );
}

/** One-shot press effects that need the pointer position. */
function press(kind: string, event: PointerEvent<HTMLElement>) {
  if (kind !== "ripple") return;
  const node = event.currentTarget;
  const box = node.getBoundingClientRect();
  const layer = document.createElement("span");
  layer.className = styles.fx;
  const mark = document.createElement("span");
  mark.className = styles.ripple;
  mark.style.left = `${event.clientX - box.left}px`;
  mark.style.top = `${event.clientY - box.top}px`;
  layer.append(mark);
  node.append(layer);
  mark.addEventListener("animationend", () => layer.remove());
}

/** Locked so far: recipe 2 glass, C4 shadow pool behind text, H1 rim-light
 * hover, T5 date as a tag, R2 32px corners. */
const POOL = { "--pool": "0.34" } as CSSProperties;
const RADIUS = { "--radius": "32px" } as CSSProperties;

/** Press, kept barely noticeable. `fx` names a one-shot effect run from JS. */
const PRESS = [
  { id: "P1", name: "Hair squish", note: "Shrinks 1.5%, back in a blink.", cls: styles.pTiny, fx: "" },
  { id: "P2", name: "Dim", note: "Darkens a touch; nothing moves.", cls: styles.pDim, fx: "" },
  { id: "P3", name: "Settle", note: "Sinks one pixel and its shadow tightens.", cls: styles.pSettle, fx: "" },
  { id: "P4", name: "Rim blink", note: "The rim brightens for an instant.", cls: styles.pRim, fx: "" },
  { id: "P5", name: "Squish + dim", note: "P1 and P2 together, both faint.", cls: `${styles.pTiny} ${styles.pDim}`, fx: "" },
  { id: "P6", name: "Inner well", note: "A soft hollow appears while held.", cls: styles.pWell, fx: "" },
  { id: "P7", name: "Faint ring", note: "A barely visible ring from the pointer.", cls: styles.pNone, fx: "ripple" },
  { id: "P8", name: "Breath", note: "Blur deepens slightly while held.", cls: styles.pNone, fx: "", blur: 5 },
];

/** Years as a tab bar. The selection slides: its leading edge goes first and
 * the trailing edge catches up, so the pill stretches like liquid, then settles. */
function Tabs({
  className = "",
  style,
  hoverBlur,
  pressBlur,
  onPress,
}: {
  className?: string;
  style: CSSProperties;
  hoverBlur?: number;
  pressBlur?: number;
  onPress?: (event: PointerEvent<HTMLElement>) => void;
}) {
  const [year, setYear] = useState(2);
  const [forward, setForward] = useState(true);
  return (
    <Glass
      className={`${styles.tabs} ${className}`}
      style={{ ...style, "--i": year } as CSSProperties}
      data-forward={forward}
      {...LENS}
      hoverBlur={hoverBlur}
      pressBlur={pressBlur}
      onPointerDown={onPress}
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

export default function GlassLab() {
  const [backdrop, setBackdrop] = useState(0);
  return (
    <main
      className={`${styles.lab} ${journeySerif.variable}`}
      style={{ backgroundImage: `url(${BACKDROPS[backdrop][1]})` }}
    >
      <div className={styles.switcher}>
        {BACKDROPS.map(([label], index) => (
          <button key={label} aria-pressed={backdrop === index} onClick={() => setBackdrop(index)}>
            {label}
          </button>
        ))}
      </div>

      <h1 className={styles.heading}>Locked so far: glass 2, shadow pool, rim-light hover, date tag, 32px corners</h1>
      <div className={styles.locked}>
        <div className={styles.row}>
          <Glass as="button" className={`${styles.pill} ${styles.hv} ${styles.hvRim}`} style={VARS} {...LENS}>
            Nikhil Sheoran
          </Glass>
          <Glass as="button" className={`${styles.circle} ${styles.hv} ${styles.hvRim}`} style={VARS} {...LENS} bezel={16}>
            <XLogoIcon size={18} />
          </Glass>
        </div>
        <Glass as="p" className={styles.tag} style={VARS} {...LENS} bezel={12}>
          October 2024, age 18
        </Glass>
        <Glass className={`${styles.now} ${styles.pool}`} style={{ ...VARS, ...POOL, ...RADIUS }} {...LENS}>
          <div style={{ flex: 1 }}>
            <h2>A hackathon, won</h2>
            <p className={styles.line}>
              We won it, and I ended up demoing our project to the Director
              General of Police.
            </p>
          </div>
          <Glass as="button" className={`${styles.goGlass} ${styles.hv} ${styles.hvRim}`} style={VARS} {...LENS} bezel={14}>
            <ArrowUpRightIcon size={18} weight="bold" />
          </Glass>
        </Glass>
        <Tabs className={`${styles.hv} ${styles.hvRim}`} style={VARS} />
      </div>

      <h1 className={styles.heading}>Press: click and hold each. All deliberately faint.</h1>
      <div className={styles.grid}>
        {PRESS.map(({ id, name, note, cls, fx, blur }) => {
          const all = `${styles.hv} ${styles.hvRim} ${cls}`;
          const down = (event: PointerEvent<HTMLElement>) => press(fx, event);
          return (
            <Cell key={id} id={id} name={name} note={note}>
              <div className={styles.row}>
                <Glass as="button" className={`${styles.pill} ${all}`} style={VARS} {...LENS} pressBlur={blur} onPointerDown={down}>
                  Nikhil Sheoran
                </Glass>
                <Glass as="button" className={`${styles.circle} ${all}`} style={VARS} {...LENS} bezel={16} pressBlur={blur} onPointerDown={down}>
                  <XLogoIcon size={18} />
                </Glass>
                <Glass as="button" className={`${styles.pill} ${all}`} style={VARS} {...LENS} pressBlur={blur} onPointerDown={down}>
                  Read the post <ArrowUpRightIcon size={13} weight="bold" />
                </Glass>
              </div>
              <Tabs className={all} style={VARS} onPress={down} pressBlur={blur} />
            </Cell>
          );
        })}
      </div>
    </main>
  );
}
