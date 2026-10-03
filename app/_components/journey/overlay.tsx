"use client";

import { type CSSProperties, type RefObject } from "react";
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

/**
 * The glass layer over the scene, laid out like a visionOS window with its
 * ornaments: an identity pane (top left), and a story pane with a date tab
 * above it and one toolbar below it (bottom left). Capsules are controls,
 * the rounded rectangle is content, and everything shares one column.
 */
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
  const years = yearStops(works);
  const activeYear = years.findIndex((stop) => stop.year === work?.year);
  return (
    <div
      data-journey-ui
      className={`${styles.ui} ${hidden ? styles.faded : ""}`}
      inert={hidden}
      aria-hidden={hidden}
    >
      <Glass as="header" className={styles.identity}>
        <div className={styles.identityRow}>
          <Link className={styles.wordmark} href="/">
            Nikhil Sheoran
          </Link>
          <nav className={styles.socials} aria-label="Social profiles">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                className={styles.well}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} (opens in a new tab)`}
                title={label}
              >
                <Icon size={17} />
              </a>
            ))}
          </nav>
        </div>
        <p className={styles.tagline}>
          I’m 20, I love tech and my dream is to produce a movie someday.
        </p>
      </Glass>

      <section className={styles.story} aria-live="polite">
        <Glass as="p" className={styles.tab} bezel={11}>
          <span key={chapter} className={styles.swap}>
            {work
              ? `${when(work.date, work.year)}, age ${work.age}`
              : "Hello, I’m Nikhil."}
          </span>
        </Glass>

        <Glass className={styles.card} bezel={20} depth={30}>
          <div key={chapter} className={styles.swap}>
            <h1>{work ? work.title : "I wanted to fly planes."}</h1>
            <p>
              {work
                ? work.subtitle
                : "That plan fell through. So I started building things instead, and I haven’t stopped since."}
            </p>
          </div>
        </Glass>

        <Glass as="footer" className={styles.toolbar}>
          {work ? (
            <a
              key={work.slug}
              className={styles.action}
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ACTION_LABEL[work.kind]}
              <ArrowUpRightIcon size={13} aria-label="Opens in a new tab" />
            </a>
          ) : (
            <span className={styles.cue}>Scroll to begin</span>
          )}
          <span className={styles.divider} aria-hidden />
          <div
            className={styles.years}
            style={{ "--count": years.length, "--active": activeYear } as CSSProperties}
            data-active={activeYear >= 0 ? "" : undefined}
          >
            <label className={styles.srOnly} htmlFor="journey-progress">
              Move through the story
            </label>
            <input
              ref={rangeRef}
              id="journey-progress"
              className={styles.srOnly}
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
            <span className={styles.selection} aria-hidden />
            {years.map(({ year, index }) => (
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
      </section>

      <button className={styles.keyboardScreen} onClick={onFocusScreen}>
        Open my Mac
      </button>
    </div>
  );
}
