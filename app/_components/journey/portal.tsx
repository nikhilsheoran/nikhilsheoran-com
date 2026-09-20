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
import {
  ArrowUpRightIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { DesktopShell } from "@/app/_components/desktop-shell";
import type { NotesData } from "@/lib/mock-desktop-data";
import { activeChapter, chapters, chapterProgress } from "@/lib/journey/story";
import styles from "./journey.module.css";
import { PANEL_END } from "@/lib/journey/path";

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
  dragging: boolean;
  suppressClickUntil: number;
  focusDistance: number;
  cameraPosition: [number, number, number];
  snapArmed: boolean;
  autoFocusing: boolean;
  screenActive: boolean;
}
export interface SceneProps {
  runtimeRef: RefObject<JourneyRuntime>;
  screenRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  surfaceRef: RefObject<HTMLDivElement | null>;
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
        <button onClick={this.props.onSkip}>Open the website</button>
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
  const [nearScreen, setNearScreen] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [chapter, setChapter] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  const outsideRef = useRef(false);
  const [exitHint, setExitHint] = useState(false);
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
    dragging: false,
    suppressClickUntil: 0,
    focusDistance: 8,
    snapArmed: true,
    autoFocusing: false,
    screenActive: false,
    cameraPosition: [-5.9, 2.65, -5.8],
  });
  const desktop = mode === "desktop";
  const transitioning = mode === "entering" || mode === "returning";
  const uiHidden = transitioning || desktop || nearScreen;

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
    state.autoFocusing = false;
    state.returning = false;
    outsideRef.current = false;
    setExitHint(false);
    state.desktop = true;
    state.entry = 1;
    setFallback(!state.frameReady);
    setMode("desktop");
  }, []);
  const enter = useCallback(
    (slug?: string) => {
      const state = runtimeRef.current;
      if (
        state.entering ||
        state.returning ||
        state.desktop ||
        state.dragging ||
        performance.now() < state.suppressClickUntil
      )
        return;
      if (slug) {
        pendingNoteRef.current = slug;
        iframeRef.current?.contentWindow?.postMessage(
          { type: "journey:open-note", slug },
          window.location.origin,
        );
      }
      if (!ready) {
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
    rangeRef.current?.focus({ preventScroll: true });
  }, []);
  const returnToScene = useCallback(() => {
    const state = runtimeRef.current;
    if (state.returning) return;
    state.snapArmed = false;
    state.autoFocusing = false;
    state.target = Math.min(state.progress, 0.72);
    setExitHint(false);
    setFallback(false);
    if (!state.desktop && !state.entering) return;
    if (state.desktop && state.progress >= PANEL_END - 0.0005) {
      // Automatic focus returns along the very same rail, carrying scroll velocity.
      state.desktop = false;
      state.entry = 0;
      setMode("orbit");
      rangeRef.current?.focus({ preventScroll: true });
      return;
    }
    state.desktop = false;
    state.entering = false;
    state.returning = true;
    setMode("returning");
    if (!ready) returned();
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
      if (event.data?.type === "journey:drag") {
        draggingRef.current = event.data.active === true;
      }
      if (event.data?.type === "journey:inside") {
        runtimeRef.current.screenActive = true;
        outsideRef.current = false;
        setExitHint(false);
      }
      if (event.data?.type === "journey:return" && runtimeRef.current.desktop)
        returnToScene();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [returnToScene]);
  useEffect(() => {
    if (desktop) iframeRef.current?.focus();
  }, [desktop]);
  const leaveScreen = useCallback(() => {
    runtimeRef.current.screenActive = false;
    outsideRef.current = true;
    if (runtimeRef.current.desktop) setExitHint(true);
  }, []);
  useEffect(() => {
    const node = surfaceRef.current;
    if (!node) return;
    const inputState = runtimeRef.current;
    let drag: {
      id: number;
      x: number;
      y: number;
      start: number;
      axis: "x" | "y" | null;
      last: number;
      time: number;
      velocity: number;
    } | null = null;
    const advance = (delta: number) => {
      const state = runtimeRef.current;
      if (state.returning) {
        // Ignore the tail of the forward gesture during an explicit return.
        if (delta < 0) state.target = Math.max(0, state.target + delta);
        return;
      }
      if (state.desktop || state.entering) {
        // Trackpads keep emitting wheel events after arrival. Only a deliberate
        // reverse scroll outside the live screen should leave the desktop.
        if (delta < 0) returnToScene();
        return;
      }
      if (state.autoFocusing && delta < 0) {
        state.autoFocusing = false;
        state.snapArmed = false;
        state.target = state.progress;
      }
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
    const down = (event: PointerEvent) => {
      const state = runtimeRef.current;
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        state.returning ||
        (event.target as Element).closest("button,input,a,iframe")
      )
        return;
      if (state.autoFocusing) {
        state.autoFocusing = false;
        state.snapArmed = false;
      }
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        start: state.progress,
        axis: null,
        last: state.progress,
        time: event.timeStamp,
        velocity: 0,
      };
      state.target = state.progress;
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x,
        dy = event.clientY - drag.y;
      if (!drag.axis && Math.hypot(dx, dy) < 6) return;
      if (!drag.axis) {
        if (runtimeRef.current.desktop || runtimeRef.current.entering) {
          runtimeRef.current.target = Math.max(
            0,
            runtimeRef.current.progress - 0.06,
          );
          returnToScene();
          drag = null;
          return;
        }
        drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        node.setPointerCapture(event.pointerId);
        runtimeRef.current.dragging = true;
        node.dataset.dragging = "true";
      }
      event.preventDefault();
      event.stopPropagation();
      const travel = drag.axis === "x" ? dx : dy;
      const span =
        (drag.axis === "x" ? node.clientWidth : node.clientHeight) * 2.7;
      const next = Math.max(0, Math.min(1, drag.start - travel / span));
      const elapsed = Math.max(0.008, (event.timeStamp - drag.time) / 1000);
      drag.velocity =
        drag.velocity * 0.35 + ((next - drag.last) / elapsed) * 0.65;
      drag.last = next;
      drag.time = event.timeStamp;
      runtimeRef.current.target = next;
      runtimeRef.current.suppressClickUntil = performance.now() + 250;
    };
    const finish = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (drag.axis) {
        event.stopPropagation();
        const state = runtimeRef.current;
        const momentum =
          state.reducedMotion ||
          event.type !== "pointerup" ||
          event.timeStamp - drag.time > 100
            ? 0
            : Math.max(-0.07, Math.min(0.07, drag.velocity * 0.12));
        state.target = Math.max(0, Math.min(1, state.progress + momentum));
        state.dragging = false;
        state.suppressClickUntil = performance.now() + 250;
        delete node.dataset.dragging;
        if (node.hasPointerCapture(event.pointerId))
          node.releasePointerCapture(event.pointerId);
      }
      drag = null;
    };
    const click = (event: MouseEvent) => {
      if (performance.now() < runtimeRef.current.suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        returnToScene();
        return;
      }
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
        if (runtimeRef.current.desktop || runtimeRef.current.entering)
          returnToScene();
        runtimeRef.current.target = 0;
      }
      if (event.key === "End") {
        event.preventDefault();
        runtimeRef.current.target = 1;
      }
    };
    node.addEventListener("wheel", wheel, { passive: false });
    node.addEventListener("pointerdown", down, true);
    node.addEventListener("pointermove", move, true);
    node.addEventListener("pointerup", finish, true);
    node.addEventListener("pointercancel", finish, true);
    node.addEventListener("lostpointercapture", finish, true);
    node.addEventListener("click", click, true);
    window.addEventListener("keydown", key);
    return () => {
      node.removeEventListener("wheel", wheel);
      node.removeEventListener("pointerdown", down, true);
      node.removeEventListener("pointermove", move, true);
      node.removeEventListener("pointerup", finish, true);
      node.removeEventListener("pointercancel", finish, true);
      node.removeEventListener("lostpointercapture", finish, true);
      node.removeEventListener("click", click, true);
      inputState.dragging = false;
      delete node.dataset.dragging;
      window.removeEventListener("keydown", key);
    };
  }, [desktop, returnToScene]);
  const progressChanged = useCallback((progress: number) => {
    if (rangeRef.current)
      rangeRef.current.value = String(Math.round(progress * 1000));
    setNearScreen(progress > 0.795);
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
        onPointerMove={(event) => {
          if (!runtimeRef.current.desktop || event.pointerType === "touch")
            return;
          draggingRef.current = event.buttons !== 0;
          if (!(event.target as Element).closest("iframe")) leaveScreen();
        }}
        onPointerUp={() => {
          draggingRef.current = false;
          if (outsideRef.current && runtimeRef.current.desktop) leaveScreen();
        }}
      >
        <div
          ref={screenRef}
          className={styles.liveScreen}
          onPointerEnter={() => {
            runtimeRef.current.screenActive = true;
            outsideRef.current = false;
            setExitHint(false);
          }}
          onPointerLeave={leaveScreen}
        >
          <iframe
            ref={iframeRef}
            src="/desktop"
            title="Nikhil’s Mac"
            className={styles.iframe}
            tabIndex={0}
          />
        </div>
        <div ref={canvasRef} className={styles.canvasLayer}>
          <SceneBoundary onSkip={arrive}>
            <Scene
              runtimeRef={runtimeRef}
              screenRef={screenRef}
              canvasRef={canvasRef}
              surfaceRef={surfaceRef}
              paused={false}
              onEnter={enter}
              onArrive={arrive}
              onReturnComplete={returned}
              onProgress={progressChanged}
              onReady={onReady}
            />
          </SceneBoundary>
        </div>
        <div
          data-journey-ui
          className={`${styles.ui} ${uiHidden ? styles.faded : ""}`}
          inert={uiHidden}
          aria-hidden={uiHidden}
        >
          <header className={styles.header}>
            <div className={styles.profile}>
              <Link className={styles.wordmark} href="/">
                Nikhil Sheoran
              </Link>
              <p>
                I’m 20, I love tech and my dream is to produce a movie someday.
              </p>
              <nav className={styles.socials} aria-label="Social profiles">
                {[
                  ["X", "https://x.com/_nikhilsheoran", XLogoIcon],
                  [
                    "Instagram",
                    "https://instagram.com/thenikhilsheoran/",
                    InstagramLogoIcon,
                  ],
                  [
                    "LinkedIn",
                    "https://linkedin.com/in/nikhilsheoran/",
                    LinkedinLogoIcon,
                  ],
                ].map(([label, href, Icon]) => {
                  const SocialIcon = Icon as typeof XLogoIcon;
                  return (
                    <a
                      key={String(label)}
                      href={String(href)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} (opens in a new tab)`}
                      title={String(label)}
                    >
                      <SocialIcon size={19} />
                    </a>
                  );
                })}
              </nav>
            </div>
          </header>
          {chapter !== -2 && (
            <section className={styles.caption} aria-live="polite">
              <span className={styles.year}>
                {chapter >= 0 ? chapters[chapter].year : "Hello, I’m Nikhil."}
              </span>
              <h1>
                {chapter >= 0
                  ? chapters[chapter].name
                  : "It started at a desk."}
              </h1>
              <p>
                {chapter >= 0
                  ? chapters[chapter].subtitle
                  : "A few years of curiosity, experiments, and things I’ve built."}
              </p>
              {chapter >= 0 && (
                <a
                  className={styles.readLink}
                  href={chapters[chapter].url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chapters[chapter].kind === "youtube"
                    ? "Watch on YouTube"
                    : "Read on X"}
                  <ArrowUpRightIcon size={14} aria-label="Opens in a new tab" />
                </a>
              )}
            </section>
          )}
          <button className={styles.keyboardScreen} onClick={() => enter()}>
            Focus the laptop screen
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
                Scroll or drag the scene along the spiral. Hover over the fabric
                to reveal its color. Click the Mac, or finish the spiral, to use
                its screen.
              </p>
              <p>
                Use the years or slider to navigate. Click Back to the desk,
                scroll or drag outside the display, or press Escape to pull
                back.
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
        {uiHidden && (
          <button
            id="back-to-journey"
            className={`${styles.returnButton} ${exitHint ? styles.returnHint : ""}`}
            onClick={returnToScene}
          >
            Back to the desk
          </button>
        )}
      </div>
    </>
  );
}
