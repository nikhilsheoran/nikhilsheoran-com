"use client";

import { Component, type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { DesktopShell } from "@/app/_components/desktop-shell";
import type { NotesData } from "@/lib/mock-desktop-data";
import { activeChapter, chapters, chapterProgress } from "@/lib/journey/story";
import styles from "./journey.module.css";

export interface JourneyRuntime {
  progress: number;
  target: number;
  entering: boolean;
  returning: boolean;
  entry: number;
  reducedMotion: boolean;
}

export interface SceneProps {
  runtimeRef: RefObject<JourneyRuntime>;
  onEnter: (note?: string) => void;
  onArrive: () => void;
  onProgress: (progress: number) => void;
  onReady: () => void;
}

const Scene = dynamic(() => import("./scene").then((m) => m.JourneyScene), {
  ssr: false,
  loading: () => <div className={styles.loading}>Setting the desk…</div>,
});

class SceneBoundary extends Component<{ children: ReactNode; onSkip: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className={styles.fallback}><h2>The desk is taking a break.</h2><p>Your browser couldn’t open the 3D scene. The desktop is still available.</p><button onClick={this.props.onSkip}>Open the desktop</button></div>;
    return this.props.children;
  }
}

export function JourneyPortal({ notesData }: { notesData: NotesData }) {
  const [desktop, setDesktop] = useState(false);
  const [ready, setReady] = useState(false);
  const [entering, setEntering] = useState(false);
  const [chapter, setChapter] = useState(-1);
  const [desktopPath, setDesktopPath] = useState("/notes/about-me");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const entryButton = useRef<HTMLButtonElement>(null);
  const lastChapter = useRef(-1);
  const savedPath = useRef("/");
  const runtime = useRef<JourneyRuntime>({ progress: 0, target: 0, entry: 0, entering: false, returning: false, reducedMotion: false });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { runtime.current.reducedMotion = media.matches; setReducedMotion(media.matches); };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const arrive = useCallback(() => {
    setDesktop(true);
    setEntering(false);
    runtime.current.entering = false;
  }, []);

  const enter = useCallback((slug?: string) => {
    if (runtime.current.entering) return;
    if (slug) savedPath.current = "/";
    setDesktopPath(slug ? `/notes/${slug}` : savedPath.current === "/" ? "/notes/about-me" : savedPath.current);
    if (!ready || runtime.current.reducedMotion) { arrive(); return; }
    setEntering(true);
    runtime.current.entering = true;
    runtime.current.returning = false;
  }, [ready, arrive]);

  const returnToScene = useCallback(() => {
    savedPath.current = window.location.pathname;
    window.history.replaceState({}, "", "/");
    runtime.current.entering = false;
    runtime.current.returning = true;
    // Move back before the automatic-entry threshold, so returning never loops.
    runtime.current.target = Math.min(runtime.current.target, 0.82);
    runtime.current.progress = Math.min(runtime.current.progress, 0.82);
    setDesktop(false);
    setEntering(false);
    requestAnimationFrame(() => entryButton.current?.focus());
  }, []);

  useEffect(() => {
    if (!desktop) return;
    const button = document.getElementById("back-to-journey");
    button?.focus();
  }, [desktop]);

  useEffect(() => {
    const node = surface.current;
    if (!node || desktop) return;
    let touchY: number | null = null;
    const advance = (delta: number) => {
      if (runtime.current.entering) return;
      runtime.current.target = Math.max(0, Math.min(1, runtime.current.target + delta));
    };
    const wheel = (event: WheelEvent) => {
      if ((event.target as Element).closest("button, input, a, [role=dialog]")) return;
      event.preventDefault();
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1;
      advance(Math.max(-0.07, Math.min(0.07, event.deltaY * units / 6200)));
    };
    const touchStart = (event: TouchEvent) => { touchY = event.touches[0]?.clientY ?? null; };
    const touchMove = (event: TouchEvent) => {
      if (touchY === null || (event.target as Element).closest("button, input, a")) return;
      const nextY = event.touches[0]?.clientY ?? touchY;
      advance((touchY - nextY) / 2200);
      touchY = nextY;
    };
    const key = (event: KeyboardEvent) => {
      if ((event.target as Element).closest("input, button, a, textarea")) return;
      const delta = ({ ArrowDown: 0.04, ArrowRight: 0.04, ArrowUp: -0.04, ArrowLeft: -0.04, PageDown: 0.15, PageUp: -0.15, " ": 0.1 } as Record<string, number>)[event.key];
      if (delta !== undefined) { event.preventDefault(); advance(delta); }
      if (event.key === "Home") { event.preventDefault(); runtime.current.target = 0; }
      if (event.key === "End") { event.preventDefault(); enter(); }
    };
    node.addEventListener("wheel", wheel, { passive: false });
    node.addEventListener("touchstart", touchStart, { passive: true });
    node.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("keydown", key);
    return () => {
      node.removeEventListener("wheel", wheel);
      node.removeEventListener("touchstart", touchStart);
      node.removeEventListener("touchmove", touchMove);
      window.removeEventListener("keydown", key);
    };
  }, [desktop, enter]);

  const progressChanged = useCallback((progress: number) => {
    if (range.current) range.current.value = String(Math.round(progress * 1000));
    const nextChapter = activeChapter(progress);
    if (lastChapter.current !== nextChapter) { lastChapter.current = nextChapter; setChapter(nextChapter); }
  }, []);
  const onReady = useCallback(() => setReady(true), []);

  return <>
    <noscript><style>{`.portfolio-journey { display: none !important; }`}</style></noscript>
    <div ref={surface} className={`portfolio-journey ${styles.journey} ${desktop ? styles.hidden : ""}`} inert={desktop} aria-hidden={desktop} data-testid="journey" data-mode={desktop ? "desktop" : entering ? "entering" : "orbit"}>
      {!desktop && <SceneBoundary onSkip={arrive}><Scene runtimeRef={runtime} onEnter={enter} onArrive={arrive} onProgress={progressChanged} onReady={onReady} /></SceneBoundary>}
      <header className={`${styles.header} ${entering ? styles.faded : ""}`}>
        <Link className={styles.wordmark} href="/">Nikhil Sheoran<span>A life in the making.</span></Link>
        <button ref={entryButton} className={styles.desktopButton} onClick={() => enter()} disabled={entering}>Enter my Mac <span aria-hidden="true">↗</span></button>
      </header>
      <section className={`${styles.caption} ${entering ? styles.faded : ""}`} aria-live="polite">
        <span className={styles.year}>{chapter >= 0 ? chapters[chapter].year : chapter === -2 ? "One more thing." : "Hello, I’m Nikhil."}</span>
        <h1>{chapter >= 0 ? chapters[chapter].name : chapter === -2 ? "Make yourself at home." : "It started at a desk."}</h1>
        <p>{chapter >= 0 ? chapters[chapter].subtitle : chapter === -2 ? "Keep scrolling to step inside. My notes, projects, and favorite things are all here." : "A few years of curiosity, experiments, and things I’ve built."}</p>
        {chapter >= 0 && <button className={styles.readLink} onClick={() => enter(chapters[chapter].note)}>Read this chapter <span aria-hidden="true">↗</span></button>}
      </section>
      <footer className={`${styles.footer} ${entering ? styles.faded : ""}`}>
        <div className={styles.timeline}>
          <label className={styles.srOnly} htmlFor="journey-progress">Explore the timeline</label>
          <input ref={range} id="journey-progress" type="range" min="0" max="1000" defaultValue="0" onChange={(event) => { runtime.current.target = Number(event.target.value) / 1000; }} aria-valuetext={chapter >= 0 ? `${chapters[chapter].year}: ${chapters[chapter].name}` : chapter === -2 ? "Approaching the Mac" : "At the desk"} />
          <div className={styles.years}>{chapters.map((item, index) => <button key={item.year} aria-current={chapter === index ? "step" : undefined} onClick={() => { runtime.current.target = chapterProgress(index); }}>{item.year}</button>)}</div>
        </div>
        <button className={styles.helpButton} aria-expanded={showHelp} onClick={() => setShowHelp(!showHelp)}>How to explore <span aria-hidden="true">{showHelp ? "−" : "+"}</span></button>
      </footer>
      {showHelp && <aside className={styles.help}><p>Scroll or swipe to circle the desk. Hover over a page to bring it into color. Point at the Mac for a moment, or click it, to enter.</p><p>Use the years, slider, or arrow keys to navigate. The person and objects are placeholders.</p>{reducedMotion && <p>Reduced motion is on. Camera changes are immediate and the pages stay still.</p>}</aside>}
    </div>
    {desktop && <div className={styles.desktop}>
      <DesktopShell initialPathname={desktopPath} notesData={notesData} />
      <button id="back-to-journey" className={styles.returnButton} onClick={returnToScene}>↖ Back to the scene</button>
    </div>}
  </>;
}
