"use client";

import {
  Component,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  desktop: boolean;
  frameReady: boolean;
  velocity: number;
  focusDistance: number;
  cameraPosition: [number, number, number];
}
export interface SceneProps {
  runtimeRef: RefObject<JourneyRuntime>;
  screenRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  paused: boolean;
  onEnter: (note?: string) => void;
  onArrive: () => void;
  onReturnComplete: () => void;
  onProgress: (progress: number) => void;
  onReady: () => void;
}
const Scene = dynamic(() => import("./scene").then((m) => m.JourneyScene), {
  ssr: false,
  loading: () => <div className={styles.loading}>Opening the scene…</div>,
});
class SceneBoundary extends Component<
  { children: ReactNode; onSkip: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className={styles.fallback}>
        <h2>The desktop is still open.</h2>
        <p>This browser couldn’t render the scene.</p>
        <button onClick={this.props.onSkip}>Enter my Mac</button>
      </div>
    ) : (
      this.props.children
    );
  }
}

type Mode = "orbit" | "entering" | "desktop" | "returning";
export function JourneyPortal({ notesData }: { notesData: NotesData }) {
  const [mode, setMode] = useState<Mode>("orbit");
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [chapter, setChapter] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const entryButtonRef = useRef<HTMLButtonElement>(null);
  const lastChapterRef = useRef(-1);
  const pendingNoteRef = useRef<string | null>(null);
  const runtimeRef = useRef<JourneyRuntime>({
    progress: 0,
    target: 0,
    entry: 0,
    entering: false,
    returning: false,
    reducedMotion: false,
    desktop: false,
    frameReady: false,
    velocity: 0,
    focusDistance: 8,
    cameraPosition: [-5.9, 2.65, -5.8],
  });
  const desktop = mode === "desktop";
  const transitioning = mode === "entering" || mode === "returning";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      runtimeRef.current.reducedMotion = media.matches;
      setReducedMotion(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const arrive = useCallback(() => {
    const state = runtimeRef.current;
    state.entering = false;
    state.returning = false;
    state.desktop = true;
    state.entry = 1;
    setFallback(!state.frameReady);
    setMode("desktop");
  }, []);
  const enter = useCallback(
    (slug?: string) => {
      const state = runtimeRef.current;
      if (state.entering || state.returning || state.desktop) return;
      if (slug) {
        pendingNoteRef.current = slug;
        iframeRef.current?.contentWindow?.postMessage(
          { type: "journey:open-note", slug },
          window.location.origin,
        );
      }
      if (!ready || state.reducedMotion) {
        arrive();
        return;
      }
      state.entry = 0;
      state.entering = true;
      setShowHelp(false);
      setMode("entering");
    },
    [ready, arrive],
  );
  const returned = useCallback(() => {
    runtimeRef.current.entry = 0;
    runtimeRef.current.returning = false;
    setMode("orbit");
    entryButtonRef.current?.focus();
  }, []);
  const returnToScene = useCallback(() => {
    const state = runtimeRef.current;
    state.desktop = false;
    state.entering = false;
    state.target = Math.min(state.target, 0.82);
    state.progress = Math.min(state.progress, 0.82);
    state.returning = true;
    setFallback(false);
    setMode("returning");
    if (state.reducedMotion || !ready) returned();
  }, [ready, returned]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow
      )
        return;
      if (event.data?.type === "journey:ready") {
        runtimeRef.current.frameReady = true;
        if (pendingNoteRef.current)
          iframeRef.current?.contentWindow?.postMessage(
            { type: "journey:open-note", slug: pendingNoteRef.current },
            window.location.origin,
          );
      }
      if (event.data?.type === "journey:return" && runtimeRef.current.desktop)
        returnToScene();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [returnToScene]);
  useEffect(() => {
    if (desktop) document.getElementById("back-to-journey")?.focus();
  }, [desktop]);
  useEffect(() => {
    const node = surfaceRef.current;
    if (!node || desktop) return;
    let touchY: number | null = null;
    const advance = (delta: number) => {
      const state = runtimeRef.current;
      if (state.entering || state.returning) return;
      state.target = Math.max(0, Math.min(1, state.target + delta));
    };
    const wheel = (event: WheelEvent) => {
      if ((event.target as Element).closest("button,input,a")) return;
      event.preventDefault();
      const units =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? node.clientHeight
            : 1;
      advance(Math.max(-0.045, Math.min(0.045, (event.deltaY * units) / 7800)));
    };
    const start = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const move = (event: TouchEvent) => {
      if (
        touchY === null ||
        (event.target as Element).closest("button,input,a")
      )
        return;
      const y = event.touches[0]?.clientY ?? touchY;
      advance((touchY - y) / 2300);
      touchY = y;
    };
    const key = (event: KeyboardEvent) => {
      if ((event.target as Element).closest("input,button,a,textarea")) return;
      const delta = (
        {
          ArrowDown: 0.025,
          ArrowRight: 0.025,
          ArrowUp: -0.025,
          ArrowLeft: -0.025,
          PageDown: 0.12,
          PageUp: -0.12,
          " ": 0.08,
        } as Record<string, number>
      )[event.key];
      if (delta !== undefined) {
        event.preventDefault();
        advance(delta);
      }
      if (event.key === "Home") {
        event.preventDefault();
        runtimeRef.current.target = 0;
      }
      if (event.key === "End") {
        event.preventDefault();
        runtimeRef.current.target = 1;
      }
    };
    node.addEventListener("wheel", wheel, { passive: false });
    node.addEventListener("touchstart", start, { passive: true });
    node.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("keydown", key);
    return () => {
      node.removeEventListener("wheel", wheel);
      node.removeEventListener("touchstart", start);
      node.removeEventListener("touchmove", move);
      window.removeEventListener("keydown", key);
    };
  }, [desktop]);
  const progressChanged = useCallback((progress: number) => {
    if (rangeRef.current)
      rangeRef.current.value = String(Math.round(progress * 1000));
    const next = activeChapter(progress);
    if (lastChapterRef.current !== next) {
      lastChapterRef.current = next;
      setChapter(next);
    }
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  return (
    <>
      <noscript>
        <style>{`.portfolio-journey { display: none !important; }`}</style>
      </noscript>
      <div
        ref={surfaceRef}
        className={`portfolio-journey ${styles.journey} ${desktop ? styles.inMac : ""}`}
        data-testid="journey"
        data-mode={mode}
      >
        <div
          ref={screenRef}
          className={styles.liveScreen}
          inert={!desktop}
          aria-hidden={!desktop}
        >
          <iframe
            ref={iframeRef}
            src="/desktop"
            title="Nikhil’s Mac"
            className={styles.iframe}
            tabIndex={desktop ? 0 : -1}
          />
        </div>
        <div ref={canvasRef} className={styles.canvasLayer}>
          <SceneBoundary onSkip={arrive}>
            <Scene
              runtimeRef={runtimeRef}
              screenRef={screenRef}
              canvasRef={canvasRef}
              paused={desktop}
              onEnter={enter}
              onArrive={arrive}
              onReturnComplete={returned}
              onProgress={progressChanged}
              onReady={onReady}
            />
          </SceneBoundary>
        </div>
        <div
          className={`${styles.ui} ${transitioning || desktop ? styles.faded : ""}`}
          inert={transitioning || desktop}
          aria-hidden={transitioning || desktop}
        >
          <header className={styles.header}>
            <Link className={styles.wordmark} href="/">
              Nikhil Sheoran<span>A life in the making.</span>
            </Link>
            <button
              ref={entryButtonRef}
              className={styles.desktopButton}
              onClick={() => enter()}
            >
              Enter my Mac <span aria-hidden="true">↗</span>
            </button>
          </header>
          <section className={styles.caption} aria-live="polite">
            <span className={styles.year}>
              {chapter >= 0
                ? chapters[chapter].year
                : chapter === -2
                  ? "One more thing."
                  : "Hello, I’m Nikhil."}
            </span>
            <h1>
              {chapter >= 0
                ? chapters[chapter].name
                : chapter === -2
                  ? "Make yourself at home."
                  : "It started at a desk."}
            </h1>
            <p>
              {chapter >= 0
                ? chapters[chapter].subtitle
                : chapter === -2
                  ? "Keep going. My notes, projects, and favorite things are all here."
                  : "A few years of curiosity, experiments, and things I’ve built."}
            </p>
            {chapter >= 0 && (
              <button
                className={styles.readLink}
                onClick={() => enter(chapters[chapter].note)}
              >
                Read this chapter <span aria-hidden="true">↗</span>
              </button>
            )}
          </section>
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
                onChange={(e) => {
                  runtimeRef.current.target = Number(e.target.value) / 1000;
                }}
                aria-valuetext={
                  chapter >= 0
                    ? `${chapters[chapter].year}: ${chapters[chapter].name}`
                    : chapter === -2
                      ? "Approaching the Mac"
                      : "At the desk"
                }
              />
              <div className={styles.years}>
                {chapters.map((item, index) => (
                  <button
                    key={item.year}
                    aria-current={chapter === index ? "step" : undefined}
                    onClick={() => {
                      runtimeRef.current.target = chapterProgress(index);
                    }}
                  >
                    {item.year}
                  </button>
                ))}
              </div>
            </div>
            <button
              className={styles.helpButton}
              aria-expanded={showHelp}
              onClick={() => setShowHelp(!showHelp)}
            >
              How to explore{" "}
              <span aria-hidden="true">{showHelp ? "−" : "+"}</span>
            </button>
          </footer>
          {showHelp && (
            <aside className={styles.help}>
              <p>
                Scroll or swipe along the spiral. Hover over the fabric to
                reveal its color. Hover or click the Mac to step inside.
              </p>
              <p>
                Use the years or slider to navigate. Press Escape inside the Mac
                to return. The figure is a placeholder.
              </p>
              {reducedMotion && (
                <p>
                  Reduced motion is on. Camera changes are immediate and the
                  fabric stays still.
                </p>
              )}
            </aside>
          )}
        </div>
        {desktop && fallback && (
          <div className={styles.desktop}>
            <DesktopShell
              initialPathname="/notes/about-me"
              notesData={notesData}
            />
          </div>
        )}
        {desktop && (
          <button
            id="back-to-journey"
            className={styles.returnButton}
            onClick={returnToScene}
          >
            ↖ Back to the scene
          </button>
        )}
      </div>
    </>
  );
}
