"use client";

import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  EyeIcon,
  EyeSlashIcon,
  HouseIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { HANDOFF, INTRO } from "@/lib/journey/timeline";
import { works, yearStops } from "@/lib/journey/works";
import { Glass } from "./glass";
import { MiniPlayer } from "./mini-player";
import type { MusicCommand, MusicSnapshot } from "./music-bridge";
import styles from "./journey.module.css";

const SOCIALS = [
  { label: "X", href: "https://x.com/_nikhilsheoran", Icon: XLogoIcon },
];

/** Set inline: the CSS pipeline drops the unprefixed property next to its -webkit- twin. */
const HAZE: CSSProperties = {
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

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

/** Top plus bottom padding of the story card (see .now). */
const CARD_PADDING = 50;

/** Born 22 February 2006 (local time). */
const BORN = new Date(2006, 1, 22).getTime();
const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000;

/** Top right: a small label and a live age, to nine decimal places. */
function AgeClock() {
  const digits = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (digits.current)
        digits.current.textContent = (
          (performance.timeOrigin + performance.now() - BORN) /
          YEAR_MS
        ).toFixed(9);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className={styles.clock}>
      <Glass as="p" className={styles.tag}>
        Age clock
      </Glass>
      <Glass as="p" className={styles.age} aria-label="My age in years">
        <span ref={digits}>20.000000000</span>
        <span className={styles.unit}>years</span>
      </Glass>
    </div>
  );
}

/**
 * The glass layer, arranged the way Apple floats controls: small capsules and
 * circles around the edges and along the bottom centre. A "now playing" bar
 * carries the work being read, above a tab bar of years; the name is a pill
 * with detached round buttons beside it.
 */
export function Overlay({
  chapter,
  ready,
  hidden,
  rangeRef,
  onSlide,
  onChapter,
  onFocusScreen,
  music,
  onMusic,
}: {
  music: MusicSnapshot | null;
  onMusic: (command: MusicCommand) => void;
  chapter: number;
  /** The room is on screen: the glass may arrive. */
  ready: boolean;
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
  // Clear the room: every pane fades away except the button that brings them back.
  const [clean, setClean] = useState(false);
  // The card eases its height to fit each work's words instead of jumping:
  // measure the words, then let CSS transition the card to that height.
  const [cardHeight, setCardHeight] = useState(0);
  const measureWords = (node: HTMLDivElement | null) => {
    if (!node) return;
    const fit = () => setCardHeight(node.offsetHeight + CARD_PADDING);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  };
  return (
    <div
      data-journey-ui
      data-ready={ready ? "" : undefined}
      data-clean={clean ? "" : undefined}
      className={`${styles.ui} ${hidden ? styles.faded : ""}`}
      inert={hidden}
      aria-hidden={hidden}
    >
      {/* A soft blur pooled in three corners (not the top right), behind the glass. */}
      <div
        className={`${styles.haze} ${styles.hazeTopLeft}`}
        style={HAZE}
        aria-hidden
      />
      <div
        className={`${styles.haze} ${styles.hazeBottomLeft}`}
        style={HAZE}
        aria-hidden
      />
      <div
        className={`${styles.haze} ${styles.hazeBottomRight}`}
        style={HAZE}
        aria-hidden
      />
      <div
        className={`${styles.haze} ${styles.hazeTopRight}`}
        style={HAZE}
        aria-hidden
      />

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
              >
                <Icon size={18} />
              </Glass>
            ))}
            <Glass
              as="button"
              className={`${styles.circle} ${styles.keep}`}
              aria-pressed={clean}
              aria-label={clean ? "Show the interface" : "Hide the interface"}
              title={clean ? "Show the interface" : "Hide the interface"}
              onClick={() => setClean(!clean)}
            >
              {clean ? <EyeIcon size={18} /> : <EyeSlashIcon size={18} />}
            </Glass>
          </nav>
        </div>
        <Glass as="p" className={`${styles.tagline} ${styles.pool}`}>
          I love playing with tech, and my dream is to produce a movie someday.
        </Glass>
      </header>

      <AgeClock />

      <div className={styles.dock}>
        <div className={styles.tags}>
          <Glass as="p" className={styles.tag}>
            <span key={chapter} className={styles.swap}>
              {work ? when(work.date, work.year) : "Hello, I’m Nikhil."}
            </span>
          </Glass>
          {work && (
            <Glass as="p" className={styles.tag}>
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
            style={cardHeight ? { height: cardHeight } : undefined}
          >
            <div
              key={chapter}
              ref={measureWords}
              className={`${styles.words} ${styles.swap}`}
            >
              <h1>{work ? work.title : "My little corner of the internet."}</h1>
              <p className={styles.line}>
                {work
                  ? work.subtitle
                  : "Scroll or drag to move through the years. The Mac on the desk opens everything else."}
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
              >
                <ArrowUpRightIcon size={18} weight="bold" />
              </Glass>
            )}
          </Glass>
        </div>

        <div className={styles.timeline}>
          <Glass
            as="button"
            className={styles.home}
            aria-label="Back to the start"
            title="Start"
            aria-current={chapter === INTRO ? "step" : undefined}
            onClick={() => onSlide(0)}
          >
            <HouseIcon
              size={19}
              weight={chapter === INTRO ? "fill" : "regular"}
            />
          </Glass>
          <Glass
            as="footer"
            className={styles.tabs}
            style={
              {
                "--count": years.length,
                "--active": activeYear,
              } as CSSProperties
            }
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
      </div>

      <MiniPlayer music={music} onCommand={onMusic} />

      <button className={styles.keyboardScreen} onClick={onFocusScreen}>
        Jump to Mac
      </button>
    </div>
  );
}
