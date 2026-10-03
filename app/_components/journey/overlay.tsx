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
import { Glass } from "./glass";
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
        <Glass as={Link} className={styles.wordmark} href="/" bezel={12}>
          Nikhil Sheoran
        </Glass>
        <Glass as="p" className={styles.tagline} bezel={12}>
          I’m 20, I love tech and my dream is to produce a movie someday.
        </Glass>
        <Glass
          as="nav"
          className={styles.socials}
          aria-label="Social profiles"
          bezel={12}
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
        </Glass>
      </header>

      {chapter !== HANDOFF && (
        <section key={chapter} className={styles.caption} aria-live="polite">
          <Glass as="p" className={styles.when} bezel={10}>
            {work
              ? `${when(work.date, work.year)}, age ${work.age}`
              : "Hello, I’m Nikhil."}
          </Glass>
          <Glass as="h1" className={styles.title}>
            {work ? work.title : "I wanted to fly planes."}
          </Glass>
          <Glass as="p" className={styles.body}>
            {work
              ? work.subtitle
              : "That plan fell through. So I started building things instead, and I haven’t stopped since."}
          </Glass>
          {work ? (
            <Glass
              as="a"
              className={styles.readLink}
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
              bezel={10}
            >
              {ACTION_LABEL[work.kind]}
              <ArrowUpRightIcon size={13} aria-label="Opens in a new tab" />
            </Glass>
          ) : (
            <Glass as="p" className={styles.cue} bezel={10}>
              Scroll to begin
            </Glass>
          )}
        </section>
      )}

      <button className={styles.keyboardScreen} onClick={onFocusScreen}>
        Open my Mac
      </button>

      <Glass as="footer" className={styles.timeline} bezel={12}>
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
      </Glass>
    </div>
  );
}
