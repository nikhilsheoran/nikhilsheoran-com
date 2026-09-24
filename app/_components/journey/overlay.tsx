"use client";

import { type RefObject, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { HANDOFF, INTRO } from "@/lib/journey/timeline";
import { works, yearStops } from "@/lib/journey/works";
import styles from "./journey.module.css";

const SOCIALS = [
  { label: "X", href: "https://x.com/_nikhilsheoran", Icon: XLogoIcon },
  {
    label: "Instagram",
    href: "https://instagram.com/thenikhilsheoran/",
    Icon: InstagramLogoIcon,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/nikhilsheoran/",
    Icon: LinkedinLogoIcon,
  },
];

const ACTION_LABEL = {
  youtube: "Watch on YouTube",
  x: "Read on X",
  web: "Visit the site",
} as const;

function formatDate(date: string | null, year: string) {
  if (!date) return year;
  const [y, m] = date.split("-").map(Number);
  if (!m) return year;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function Overlay({
  chapter,
  hidden,
  reducedMotion,
  rangeRef,
  onSlide,
  onChapter,
  onFocusScreen,
}: {
  chapter: number;
  hidden: boolean;
  reducedMotion: boolean;
  rangeRef: RefObject<HTMLInputElement | null>;
  onSlide: (value: number) => void;
  onChapter: (index: number) => void;
  onFocusScreen: () => void;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const work = chapter >= 0 ? works[chapter] : null;
  const activeYear = work?.year;
  return (
    <div
      data-journey-ui
      className={`${styles.ui} ${hidden ? styles.faded : ""}`}
      inert={hidden}
      aria-hidden={hidden}
    >
      <header className={styles.profile}>
        <Link className={styles.wordmark} href="/">
          Nikhil Sheoran
        </Link>
        <p>I’m 20, I love tech and my dream is to produce a movie someday.</p>
        <nav className={styles.socials} aria-label="Social profiles">
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (opens in a new tab)`}
              title={label}
            >
              <Icon size={19} />
            </a>
          ))}
        </nav>
      </header>

      {chapter !== HANDOFF && (
        <section
          key={chapter}
          className={styles.caption}
          aria-live="polite"
        >
          <span className={styles.year}>
            {work ? formatDate(work.date, work.year) : "Hello, I’m Nikhil."}
          </span>
          <h1>{work ? work.title : "It started at a desk."}</h1>
          <p>
            {work
              ? work.subtitle
              : "A few years of curiosity, experiments, and things I’ve built. Scroll to begin."}
          </p>
          {work && (
            <a
              className={styles.readLink}
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ACTION_LABEL[work.kind]}
              <ArrowUpRightIcon size={14} aria-label="Opens in a new tab" />
            </a>
          )}
        </section>
      )}

      <button className={styles.keyboardScreen} onClick={onFocusScreen}>
        Use the laptop screen
      </button>

      <footer className={styles.footer}>
        <div className={styles.timeline}>
          <label className={styles.srOnly} htmlFor="journey-progress">
            Explore the timeline
          </label>
          <input
            ref={rangeRef}
            id="journey-progress"
            type="range"
            min="0"
            max="1000"
            defaultValue="0"
            onChange={(event) => onSlide(Number(event.target.value) / 1000)}
            aria-valuetext={
              work
                ? `${work.year}: ${work.title}`
                : chapter === INTRO
                  ? "At the desk"
                  : "Approaching the Mac"
            }
          />
          <div className={styles.years}>
            {yearStops(works).map(({ year, index }) => (
              <button
                key={year}
                aria-current={activeYear === year ? "step" : undefined}
                onClick={() => onChapter(index)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <button
          className={styles.helpButton}
          aria-expanded={showHelp}
          onClick={() => setShowHelp(!showHelp)}
        >
          How to explore <span aria-hidden="true">{showHelp ? "−" : "+"}</span>
        </button>
      </footer>

      {showHelp && (
        <aside className={styles.help}>
          <p>
            Scroll or drag to move along the spiral. Hover a panel to bring
            back its colour; click it to open the video, post or site.
          </p>
          <p>
            Click the laptop, or keep scrolling, to use its screen. Scroll back,
            press Escape or use “Back to the desk” to return.
          </p>
          {reducedMotion && (
            <p>
              Reduced motion is on: camera moves are immediate and the fabric
              stays still.
            </p>
          )}
        </aside>
      )}
    </div>
  );
}
