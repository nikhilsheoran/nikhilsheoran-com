"use client";

import { type RefObject } from "react";
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
  youtube: "Watch the video",
  x: "Read the post",
  web: "See it live",
} as const;

function when(date: string | null, year: string) {
  if (!date) return year;
  const [y, m] = date.split("-").map(Number);
  if (!m) return year;
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Floating glass cards over the scene: who this is, and the work being read. */
export function Overlay({
  chapter,
  hidden,
  rangeRef,
  onSlide,
  onChapter,
  onFocusScreen,
}: {
  chapter: number;
  hidden: boolean;
  rangeRef: RefObject<HTMLInputElement | null>;
  onSlide: (value: number) => void;
  onChapter: (index: number) => void;
  onFocusScreen: () => void;
}) {
  const work = chapter >= 0 ? works[chapter] : null;
  return (
    <div
      data-journey-ui
      className={`${styles.ui} ${hidden ? styles.faded : ""}`}
      inert={hidden}
      aria-hidden={hidden}
    >
      <header className={styles.profile}>
        <Link className={`${styles.glass} ${styles.wordmark}`} href="/">
          Nikhil Sheoran
        </Link>
        <p className={`${styles.glass} ${styles.tagline}`}>
          I’m 20, I love tech and my dream is to produce a movie someday.
        </p>
        <nav
          className={`${styles.glass} ${styles.socials}`}
          aria-label="Social profiles"
        >
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (opens in a new tab)`}
              title={label}
            >
              <Icon size={18} />
            </a>
          ))}
        </nav>
      </header>

      {chapter !== HANDOFF && (
        <section
          key={chapter}
          className={`${styles.glass} ${styles.caption}`}
          aria-live="polite"
        >
          <p className={styles.when}>
            {work
              ? `${when(work.date, work.year)}, age ${work.age}`
              : "Hello, I’m Nikhil."}
          </p>
          <h1>{work ? work.title : "I wanted to fly planes."}</h1>
          <p className={styles.body}>
            {work
              ? work.subtitle
              : "That plan fell through. So I started building things instead, and I haven’t stopped since."}
          </p>
          {work ? (
            <a
              className={styles.readLink}
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ACTION_LABEL[work.kind]}
              <ArrowUpRightIcon size={13} aria-label="Opens in a new tab" />
            </a>
          ) : (
            <p className={styles.cue}>Scroll to begin</p>
          )}
        </section>
      )}

      <button className={styles.keyboardScreen} onClick={onFocusScreen}>
        Open my Mac
      </button>

      <footer className={`${styles.glass} ${styles.timeline}`}>
        <label className={styles.srOnly} htmlFor="journey-progress">
          Move through the story
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
                ? "The beginning"
                : "Opening the Mac"
          }
        />
        <div className={styles.years}>
          {yearStops(works).map(({ year, index }) => (
            <button
              key={year}
              aria-current={work?.year === year ? "step" : undefined}
              onClick={() => onChapter(index)}
            >
              {year}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
