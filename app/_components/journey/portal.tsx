"use client";

import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { SpeakerHighIcon, SpeakerSlashIcon } from "@phosphor-icons/react";
import { DesktopShell } from "@/app/_components/desktop-shell";
import type { NotesData } from "@/lib/mock-desktop-data";
import { focus, leave, seek, type Mode } from "@/lib/journey/machine";
import { activeChapter, INTRO } from "@/lib/journey/timeline";
import { loadSavedTuning } from "@/lib/journey/tuning";
import { createRuntime, type FrameReport } from "./runtime";
import { useJourneyInput } from "./use-journey-input";
import { Overlay } from "./overlay";
import { Loader } from "./loader";
import { RoomSound } from "./sound";
import styles from "./journey.module.css";

const Scene = dynamic(() => import("./scene").then((m) => m.JourneyScene), {
  ssr: false,
});
const Tuner = dynamic(() => import("./tuner").then((m) => m.Tuner), {
  ssr: false,
});

const noSubscription = () => () => {};

class SceneBoundary extends Component<
  { children: ReactNode; onFail: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function JourneyPortal({ notesData }: { notesData: NotesData }) {
  const runtimeRef = useRef(createRuntime());
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const soundRef = useRef<RoomSound | null>(null);
  const lastChapterRef = useRef(INTRO);

  const [mode, setMode] = useState<Mode>("orbit");
  const [chapter, setChapter] = useState(INTRO);
  const [nearScreen, setNearScreen] = useState(false);
  const [exitHint, setExitHint] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const search = useSyncExternalStore(
    noSubscription,
    () => window.location.search,
    () => "",
  );
  const params = new URLSearchParams(search);
  const tuning = process.env.NODE_ENV !== "production" && params.has("tune");
  const flags = useMemo(
    () => ({
      baked: new URLSearchParams(search).has("baked"),
      statue: new URLSearchParams(search).has("statue"),
    }),
    [search],
  );

  const focused = mode === "focused";
  const uiHidden = mode !== "orbit" || nearScreen;

  useJourneyInput(surfaceRef, runtimeRef);

  useEffect(() => {
    loadSavedTuning();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      runtimeRef.current.motion.reducedMotion = media.matches;
      setReducedMotion(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      soundRef.current?.dispose();
    };
  }, []);

  const onFrame = useCallback(({ mode: next, progress }: FrameReport) => {
    const runtime = runtimeRef.current;
    setSceneReady(true);
    if (rangeRef.current && next === "orbit")
      rangeRef.current.value = String(Math.round(progress * 1000));
    setMode(next);
    setNearScreen(progress >= runtime.beats.handoffStart);
    const nextChapter = activeChapter(progress, runtime.beats);
    if (nextChapter !== lastChapterRef.current) {
      if (nextChapter >= 0) soundRef.current?.pass();
      lastChapterRef.current = nextChapter;
    }
    setChapter(nextChapter);
    // The window wall is at +z; the city gets louder as the camera nears it.
    soundRef.current?.setWindowProximity((runtime.cameraPosition[2] - 1) / 5);
    if (next !== "focused") setExitHint(false);
  }, []);

  const focusScreen = useCallback(() => {
    const runtime = runtimeRef.current;
    if (performance.now() < runtime.suppressClickUntil) return;
    focus(runtime.motion, runtime.beats);
  }, []);

  const backToDesk = useCallback(() => {
    const runtime = runtimeRef.current;
    leave(runtime.motion, runtime.beats);
    rangeRef.current?.focus({ preventScroll: true });
  }, []);

  // Messages from the embedded desktop (same origin, same window only).
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow
      )
        return;
      const runtime = runtimeRef.current;
      switch (event.data?.type) {
        case "journey:ready":
          runtime.frameReady = true;
          break;
        case "journey:inside":
          runtime.pointerOnScreen = true;
          setExitHint(false);
          break;
        case "journey:key":
          soundRef.current?.key();
          break;
        case "journey:return":
          if (runtime.motion.mode === "focused") backToDesk();
          break;
      }
    };
    window.addEventListener("message", receive);
    // The desktop may have loaded before this listener existed; ask again.
    iframeRef.current?.contentWindow?.postMessage(
      { type: "journey:hello" },
      window.location.origin,
    );
    return () => window.removeEventListener("message", receive);
  }, [backToDesk]);

  useEffect(() => {
    if (focused) iframeRef.current?.focus();
  }, [focused]);

  return (
    <>
      <noscript>
        <style>{`.portfolio-journey { display: none !important; }`}</style>
      </noscript>
      <div
        ref={surfaceRef}
        className={`portfolio-journey ${styles.journey}`}
        data-testid="journey"
        data-mode={mode}
      >
        <div
          ref={screenRef}
          className={styles.liveScreen}
          onPointerEnter={() => {
            runtimeRef.current.pointerOnScreen = true;
            setExitHint(false);
          }}
          onPointerLeave={(event) => {
            runtimeRef.current.pointerOnScreen = false;
            // Holding a window drag across the bezel shouldn't nag.
            if (runtimeRef.current.motion.mode === "focused" && !event.buttons)
              setExitHint(true);
          }}
        >
          <iframe
            ref={iframeRef}
            // Same-origin frames share the main thread: let the scene load first.
            src={sceneReady || webglFailed ? "/desktop" : undefined}
            title="Nikhil’s Mac"
            className={styles.iframe}
            onLoad={(event) =>
              event.currentTarget.contentWindow?.postMessage(
                { type: "journey:hello" },
                window.location.origin,
              )
            }
          />
        </div>
        <div ref={canvasRef} className={styles.canvasLayer}>
          <SceneBoundary onFail={() => setWebglFailed(true)}>
            <Scene
              runtimeRef={runtimeRef}
              screenRef={screenRef}
              canvasRef={canvasRef}
              surfaceRef={surfaceRef}
              flags={flags}
              onFocus={focusScreen}
              onFrame={onFrame}
            />
          </SceneBoundary>
        </div>
        <Loader sceneReady={sceneReady || webglFailed} />
        <Overlay
          chapter={chapter}
          hidden={uiHidden}
          reducedMotion={reducedMotion}
          rangeRef={rangeRef}
          onSlide={(value) =>
            seek(runtimeRef.current.motion, value, runtimeRef.current.beats)
          }
          onChapter={(index) =>
            seek(
              runtimeRef.current.motion,
              runtimeRef.current.beats.chapters[index],
              runtimeRef.current.beats,
            )
          }
          onFocusScreen={focusScreen}
        />
        {uiHidden && (
          <button
            className={`${styles.returnButton} ${exitHint ? styles.returnHint : ""}`}
            onClick={backToDesk}
          >
            Back to the desk
          </button>
        )}
        {webglFailed && (
          <div className={styles.fallback}>
            <DesktopShell
              initialPathname="/notes/about-me"
              notesData={notesData}
            />
          </div>
        )}
        <button
          className={styles.soundButton}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
          onClick={() => {
            const sound = (soundRef.current ??= new RoomSound());
            if (soundOn) sound.stop();
            else void sound.start();
            setSoundOn(!soundOn);
          }}
        >
          {soundOn ? <SpeakerHighIcon size={16} /> : <SpeakerSlashIcon size={16} />}
          <span>{soundOn ? "Sound on" : "Sound off"}</span>
        </button>
        {tuning && <Tuner />}
      </div>
    </>
  );
}
