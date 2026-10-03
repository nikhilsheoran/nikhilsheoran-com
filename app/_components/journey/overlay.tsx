"use client";

import { type CSSProperties, type RefObject, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, XLogoIcon } from "@phosphor-icons/react";
import { HANDOFF, INTRO } from "@/lib/journey/timeline";
import { works, yearStops } from "@/lib/journey/works";
import { Glass } from "./glass";
import styles from "./journey.module.css";

const SOCIALS = [
  { label: "X", href: "https://x.com/_nikhilsheoran", Icon: XLogoIcon },
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
 * The glass layer, arranged the way Apple floats controls: small capsules and
 * circles around the edges and along the bottom centre. A "now playing" bar
 * carries the work being read, above a tab bar of years; the name is a pill
 * with detached round buttons beside it.
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
  // Which way the selection is travelling, so its leading edge can go first.
  const [travel, setTravel] = useState({ year: activeYear, forward: true });
  if (activeYear !== travel.year)
    setTravel({ year: activeYear, forward: activeYear > travel.year });
  const forward = travel.forward;
  return (
    <div
      data-journey-ui
      className={`${styles.ui} ${hidden ? styles.faded : ""}`}
      inert={hidden}
      aria-hidden={hidden}
    >
      <header className={styles.identity}>
        <div className={styles.identityRow}>
          <Glass as={Link} className={styles.namePill} href="/">
            Nikhil Sheoran
          </Glass>
          <nav className={styles.socials} aria-label="Social profiles">
            {SOCIALS.map(({ label, href, Icon }) => (
              <Glass
                as="a"
                key={label}
                className={styles.circle}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} (opens in a new tab)`}
                title={label}
                bezel={14}
              >
                <Icon size={18} />
              </Glass>
            ))}
          </nav>
        </div>
        <Glass as="p" className={`${styles.tagline} ${styles.pool}`} bezel={16}>
          I’m 20, I love tech and my dream is to produce a movie someday.
        </Glass>
      </header>

      <div className={styles.dock}>
        <div className={styles.tags}>
          <Glass as="p" className={styles.tag} bezel={12}>
            <span key={chapter} className={styles.swap}>
              {work ? when(work.date, work.year) : "Hello, I’m Nikhil."}
            </span>
          </Glass>
          {work && (
            <Glass as="p" className={styles.tag} bezel={12}>
              <span key={work.age} className={styles.swap}>
                Age {work.age}
              </span>
            </Glass>
          )}
        </div>
        <div className={styles.card}>
          <Glass
            as="section"
            className={`${styles.now} ${styles.pool}`}
            aria-live="polite"
          >
            <div key={chapter} className={`${styles.words} ${styles.swap}`}>
              <h1>{work ? work.title : "I wanted to fly planes."}</h1>
              <p className={styles.line}>
                {work
                  ? work.subtitle
                  : "That plan fell through. So I started building things instead, and I haven’t stopped since."}
              </p>
            </div>
            {work && (
              <Glass
                as="a"
                className={styles.go}
                href={work.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${ACTION_LABEL[work.kind]} (opens in a new tab)`}
                title={ACTION_LABEL[work.kind]}
                bezel={14}
              >
                <ArrowUpRightIcon size={18} weight="bold" />
              </Glass>
            )}
          </Glass>
        </div>

        <Glass
          as="footer"
          className={styles.tabs}
          style={{ "--count": years.length, "--active": activeYear } as CSSProperties}
          data-active={activeYear >= 0 ? "" : undefined}
          data-forward={forward}
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
        </Glass>
      </div>

      <button className={styles.keyboardScreen} onClick={onFocusScreen}>
        Open my Mac
      </button>
    </div>
  );
}
