"use client";

import { type RefObject } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { HANDOFF, INTRO } from "@/lib/journey/timeline";
import { works } from "@/lib/journey/works";
import styles from "./journey.module.css";

const SOCIALS = [
  { label: "X", href: "https://x.com/_nikhilsheoran" },
  { label: "Instagram", href: "https://instagram.com/thenikhilsheoran/" },
  { label: "LinkedIn", href: "https://linkedin.com/in/nikhilsheoran/" },
];

const ACTION_LABEL = {
  youtube: "Watch the video",
  x: "Read the post",
  web: "See it live",
} as const;

const pad = (n: number) => String(n).padStart(2, "0");

function stamp(date: string | null, year: string) {
  if (!date) return year;
  const [y, m] = date.split("-").map(Number);
  if (!m) return year;
  return new Date(y, m - 1)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();
}

/**
 * The title-card layer over the scene: who this is (top), the beat being read
 * (lower left), and a log of every beat (bottom). The story is told in ages.
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
  return (
    <div
      data-journey-ui
      className={`${styles.ui} ${hidden ? styles.faded : ""}`}
      inert={hidden}
      aria-hidden={hidden}
    >
      <header className={styles.masthead}>
        <Link className={styles.wordmark} href="/">
          Nikhil Sheoran
        </Link>
        <p className={styles.tagline}>
          Building things since 16. Someday, a movie.
        </p>
      </header>

      <nav className={styles.socials} aria-label="Social profiles">
        {SOCIALS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (opens in a new tab)`}
          >
            {label}
          </a>
        ))}
      </nav>

      {chapter !== HANDOFF && (
        <section key={chapter} className={styles.caption} aria-live="polite">
          <p className={styles.stamp}>
            {work ? (
              <>
                <span className={styles.age}>Age {work.age}</span>
                <span>{stamp(work.date, work.year)}</span>
                <span>
                  {pad(chapter + 1)}/{pad(works.length)}
                </span>
              </>
            ) : (
              <>
                <span className={styles.age}>Age 20</span>
                <span>The story so far</span>
              </>
            )}
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

      <footer className={styles.log}>
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
              ? `Age ${work.age}: ${work.title}`
              : chapter === INTRO
                ? "The beginning"
                : "Opening the Mac"
          }
        />
        <ol className={styles.beats}>
          {works.map((item, index) => (
            <li key={item.slug}>
              <button
                aria-current={chapter === index ? "step" : undefined}
                aria-label={`Age ${item.age}: ${item.title}`}
                title={item.title}
                onClick={() => onChapter(index)}
              >
                {(index === 0 || works[index - 1].age !== item.age) && (
                  <span>{item.age}</span>
                )}
              </button>
            </li>
          ))}
          <li className={styles.destination}>
            <button onClick={onFocusScreen} title="Open my Mac">
              <span>Now</span>
            </button>
          </li>
        </ol>
      </footer>

      <p className={styles.hint}>Scroll · drag · ← →</p>
    </div>
  );
}
