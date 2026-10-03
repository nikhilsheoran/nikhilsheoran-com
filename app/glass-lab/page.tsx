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

/** Click effects that need the pointer position or a one-shot animation. */
function press(kind: string, event: PointerEvent<HTMLElement>) {
  const node = event.currentTarget;
  if (kind === "jelly") {
    node.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.07, 0.9)", offset: 0.25 },
        { transform: "scale(0.95, 1.06)", offset: 0.5 },
        { transform: "scale(1.02, 0.98)", offset: 0.75 },
        { transform: "scale(1)" },
      ],
      { duration: 560, easing: "ease-out" },
    );
    return;
  }
  if (kind !== "ripple" && kind !== "flash") return;
  const box = node.getBoundingClientRect();
  const layer = document.createElement("span");
  layer.className = styles.fx;
  const mark = document.createElement("span");
  mark.className = kind === "ripple" ? styles.ripple : styles.flash;
  mark.style.left = `${event.clientX - box.left}px`;
  mark.style.top = `${event.clientY - box.top}px`;
  layer.append(mark);
  node.append(layer);
  mark.addEventListener("animationend", () => layer.remove());
}

const CONTRAST = [
  { id: "C1", name: "Nothing", note: "The bare material.", core: 0, extra: {} },
  { id: "C2", name: "Soft centre blur", note: "Interior blurred 5px; rim stays sharp.", core: 5, extra: {} },
  { id: "C3", name: "Strong centre blur", note: "Interior blurred 11px; rim stays sharp.", core: 11, extra: {} },
  {
    id: "C4",
    name: "Shadow pool",
    note: "A soft dark pool behind the text, no blur.",
    core: 0,
    extra: { "--pool": "0.34" },
  },
  {
    id: "C5",
    name: "Blur + faint pool",
    note: "Centre blur 5px with a light pool.",
    core: 5,
    extra: { "--pool": "0.18" },
  },
  {
    id: "C6",
    name: "Smoke tint",
    note: "The whole pane very slightly dimmed.",
    core: 0,
    extra: { "--glass-top": "rgb(30 32 36 / 0.16)", "--glass-bottom": "rgb(22 24 28 / 0.26)" },
  },
];

/** Hover is built from three ingredients on the clickable elements:
 * background blur, darkness, and rim light. */
const HOVER = [
  { id: "H1", name: "Rim light", note: "Only the rim brightens and turns to the pointer.", cls: styles.hvRim, blur: undefined },
  { id: "H2", name: "Blur", note: "Only the background behind it frosts over.", cls: styles.hvPlain, blur: 7 },
  { id: "H3", name: "Darken", note: "Only the pane dims.", cls: styles.hvDark, blur: undefined },
  { id: "H4", name: "Rim + blur", note: "Rim light and a frosted background.", cls: styles.hvRim, blur: 7 },
  { id: "H5", name: "Rim + darken", note: "Rim light and a dimmed pane.", cls: `${styles.hvRim} ${styles.hvDark}`, blur: undefined },
  { id: "H6", name: "Blur + darken", note: "Frosted and dimmed, rim unchanged.", cls: styles.hvDark, blur: 7 },
  { id: "H7", name: "All three", note: "Rim light, frosted background and a dimmed pane.", cls: `${styles.hvRim} ${styles.hvDark}`, blur: 7 },
  { id: "H8", name: "All three, strong", note: "The same, pushed harder, with a slight lift.", cls: `${styles.hvRim} ${styles.hvDarker} ${styles.hvLift}`, blur: 12 },
];

const PRESS = [
  { id: "P1", name: "Squish", note: "Shrinks a little, springs back.", cls: styles.pSquish, fx: "" },
  { id: "P2", name: "Deep press", note: "Sinks further and darkens.", cls: styles.pDeep, fx: "" },
  { id: "P3", name: "Jelly", note: "Wobbles wide, then tall, then settles.", cls: styles.pNone, fx: "jelly" },
  { id: "P4", name: "Ripple", note: "A ring spreads from where you pressed.", cls: styles.pSquish, fx: "ripple" },
  { id: "P5", name: "Flash", note: "A brief bloom of light under the finger.", cls: styles.pSquish, fx: "flash" },
];

const RADII = [
  { id: "R1", name: "Capsule", note: "Fully round ends.", radius: 999 },
  { id: "R2", name: "32", note: "Large, soft corners.", radius: 32 },
  { id: "R3", name: "24", note: "Medium corners.", radius: 24 },
  { id: "R4", name: "16", note: "Tighter corners.", radius: 16 },
  { id: "R5", name: "10", note: "Nearly square.", radius: 10 },
];

/** Years as a tab bar. The selection slides: its leading edge goes first and
 * the trailing edge catches up, so the pill stretches like liquid, then settles. */
function Tabs({
  className = "",
  style,
  hoverBlur,
  onPress,
}: {
  className?: string;
  style: CSSProperties;
  hoverBlur?: number;
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

      <h1 className={styles.heading}>Text contrast: what sits behind the words</h1>
      <div className={styles.grid}>
        {CONTRAST.map(({ id, name, note, core, extra }) => (
          <Cell key={id} id={id} name={name} note={note}>
            <Glass
              className={`${styles.now} ${styles.pool}`}
              style={{ ...VARS, ...extra } as CSSProperties}
              {...LENS}
              coreBlur={core}
            >
              <Words />
              <Go />
            </Glass>
          </Cell>
        ))}
      </div>

      <h1 className={styles.heading}>Hover on clickable elements: blur, darkness, rim light</h1>
      <div className={styles.grid}>
        {HOVER.map(({ id, name, note, cls, blur }) => (
          <Cell key={id} id={id} name={name} note={note}>
            <div className={styles.row}>
              <Glass as="button" className={`${styles.pill} ${styles.hv} ${cls}`} style={VARS} {...LENS} hoverBlur={blur}>
                Nikhil Sheoran
              </Glass>
              <Glass as="button" className={`${styles.circle} ${styles.hv} ${cls}`} style={VARS} {...LENS} bezel={16} hoverBlur={blur}>
                <XLogoIcon size={18} />
              </Glass>
              <Glass as="button" className={`${styles.pill} ${styles.hv} ${cls}`} style={VARS} {...LENS} hoverBlur={blur}>
                Read the post <ArrowUpRightIcon size={13} weight="bold" />
              </Glass>
            </div>
            <Tabs className={`${styles.hv} ${cls}`} style={VARS} hoverBlur={blur} />
          </Cell>
        ))}
      </div>

      <h1 className={styles.heading}>Press: click each</h1>
      <div className={styles.grid}>
        {PRESS.map(({ id, name, note, cls, fx }) => (
          <Cell key={id} id={id} name={name} note={note}>
            <div className={styles.row}>
              <Glass
                as="button"
                className={`${styles.pill} ${cls}`}
                style={VARS}
                {...LENS}
                onPointerDown={(event: PointerEvent<HTMLElement>) => press(fx, event)}
              >
                Nikhil Sheoran
              </Glass>
              <Glass
                as="button"
                className={`${styles.circle} ${cls}`}
                style={VARS}
                {...LENS}
                bezel={16}
                onPointerDown={(event: PointerEvent<HTMLElement>) => press(fx, event)}
              >
                <XLogoIcon size={18} />
              </Glass>
            </div>
            <Glass
              as="button"
              className={`${styles.now} ${styles.asButton} ${cls}`}
              style={VARS}
              {...LENS}
              onPointerDown={(event: PointerEvent<HTMLElement>) => press(fx, event)}
            >
              <Words />
              <Go />
            </Glass>
            <Tabs className={cls} style={VARS} onPress={(event) => press(fx, event)} />
          </Cell>
        ))}
      </div>

      <h1 className={styles.heading}>Corner radius</h1>
      <div className={styles.grid}>
        {RADII.map(({ id, name, note, radius }) => {
          const style = { ...VARS, "--radius": `${radius}px` } as CSSProperties;
          return (
            <Cell key={id} id={id} name={name} note={note}>
              <div className={styles.row}>
                <Glass as="button" className={styles.pill} style={style} {...LENS}>
                  Nikhil Sheoran
                </Glass>
                <Glass as="button" className={styles.circle} style={style} {...LENS} bezel={16}>
                  <XLogoIcon size={18} />
                </Glass>
              </div>
              <Glass className={styles.now} style={style} {...LENS}>
                <Words />
                <Go />
              </Glass>
              <Tabs style={style} />
            </Cell>
          );
        })}
      </div>

      <h1 className={styles.heading}>Text layout inside the pane</h1>
      <div className={styles.grid}>
        <Cell id="T1" name="Left, action right" note="Date, title, line; arrow at the end.">
          <Glass className={styles.now} style={VARS} {...LENS}>
            <Words />
            <Go />
          </Glass>
        </Cell>
        <Cell id="T2" name="Centred" note="Everything centred, action beneath.">
          <Glass className={`${styles.now} ${styles.stack}`} style={VARS} {...LENS}>
            <Words align="center" />
            <span className={styles.textAction}>
              Read the post <ArrowUpRightIcon size={13} weight="bold" />
            </span>
          </Glass>
        </Cell>
        <Cell id="T3" name="Title leads" note="Big title first; date and action on one quiet row.">
          <Glass className={`${styles.now} ${styles.column}`} style={VARS} {...LENS}>
            <h2 className={styles.big}>A hackathon, won</h2>
            <p className={styles.line}>
              We won it, and I ended up demoing our project to the Director
              General of Police.
            </p>
            <p className={styles.meta}>
              <span>October 2024, age 18</span>
              <span className={styles.textAction}>
                Read the post <ArrowUpRightIcon size={13} weight="bold" />
              </span>
            </p>
          </Glass>
        </Cell>
        <Cell id="T4" name="Thumbnail left" note="Artwork, then the words, then the arrow.">
          <Glass className={styles.now} style={VARS} {...LENS}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Lab sample. */}
            <img className={styles.art} src="/journey/works/goa-police-hackathon.jpg" alt="" />
            <Words />
            <Go />
          </Glass>
        </Cell>
        <Cell id="T5" name="Date as a tag" note="Date floats above as its own small pill.">
          <Glass as="p" className={styles.tag} style={VARS} {...LENS} bezel={12}>
            October 2024, age 18
          </Glass>
          <Glass className={styles.now} style={VARS} {...LENS}>
            <div style={{ flex: 1 }}>
              <h2>A hackathon, won</h2>
              <p className={styles.line}>
                We won it, and I ended up demoing our project to the Director
                General of Police.
              </p>
            </div>
            <Go />
          </Glass>
        </Cell>
        <Cell id="T6" name="Title only" note="Just the title in glass; the line sits beneath as plain text.">
          <Glass className={styles.now} style={VARS} {...LENS}>
            <div style={{ flex: 1 }}>
              <p className={styles.when}>October 2024, age 18</p>
              <h2 className={styles.big}>A hackathon, won</h2>
            </div>
            <Go />
          </Glass>
          <p className={styles.bare}>
            We won it, and I ended up demoing our project to the Director
            General of Police.
          </p>
        </Cell>
      </div>
    </main>
  );
}
