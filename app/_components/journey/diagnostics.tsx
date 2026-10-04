"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { track } from "@/lib/analytics";
import type { SceneProps } from "./runtime";

const KEY = "journey-last-session";

interface Snapshot {
  seconds: number;
  mode: string;
  progress: number;
  textures: number;
  gpuMb: number;
  heapMb: number;
  dpr: number;
  width: number;
  height: number;
  visible: boolean;
  clean: boolean;
  contextLost: number;
  error: string;
}

/** Every texture the scene holds, as megabytes once unpacked on the graphics chip. */
function textureMegabytes(scene: THREE.Scene) {
  const seen = new Set<THREE.Texture>();
  scene.traverse((object) => {
    const materials = (object as THREE.Mesh).material;
    for (const material of Array.isArray(materials) ? materials : [materials]) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) seen.add(value);
      }
      const uniforms = (material as THREE.ShaderMaterial).uniforms;
      if (uniforms)
        for (const uniform of Object.values(uniforms))
          if (uniform?.value instanceof THREE.Texture) seen.add(uniform.value);
    }
  });
  let bytes = 0;
  for (const texture of seen) {
    const image = texture.image as { width?: number; height?: number } | null;
    if (!image?.width || !image?.height) continue;
    bytes += image.width * image.height * 4 * (texture.generateMipmaps ? 4 / 3 : 1);
  }
  return Math.round(bytes / 1e6);
}

/**
 * Finds out why a visit ends. Phones kill a tab without warning, so nothing
 * can be reported at that moment; instead a small note of where the visit is
 * (how far, how much is loaded) is kept in the browser every second or so. If
 * the next visit finds a note that never said goodbye while it was on screen,
 * the last visit died, and that note is sent to the analytics as
 * `visit_ended_abruptly`. Lost graphics contexts and script errors are
 * recorded the same way. Add `?debug` to the address to see all of it live.
 */
export function Diagnostics({ runtimeRef }: Pick<SceneProps, "runtimeRef">) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const started = performance.now();
    const debug = new URLSearchParams(window.location.search).has("debug");
    let previous: Snapshot | null = null;
    try {
      previous = JSON.parse(localStorage.getItem(KEY) ?? "null") as Snapshot | null;
    } catch {}
    const died = !!previous && previous.visible && !previous.clean;
    if (died && previous) {
      const { visible: _visible, clean: _clean, ...rest } = previous;
      track("visit_ended_abruptly", rest);
    }

    const state = { contextLost: 0, error: "", clean: false };
    const snapshot = (): Snapshot => {
      const motion = runtimeRef.current?.motion;
      const heap = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      return {
        seconds: Math.round((performance.now() - started) / 1000),
        mode: motion?.mode ?? "",
        progress: Math.round((motion?.progress ?? 0) * 1000) / 1000,
        textures: gl.info.memory.textures,
        gpuMb: textureMegabytes(scene),
        heapMb: heap ? Math.round(heap.usedJSHeapSize / 1e6) : 0,
        dpr: Math.round(gl.getPixelRatio() * 100) / 100,
        width: window.innerWidth,
        height: window.innerHeight,
        visible: document.visibilityState === "visible",
        clean: state.clean,
        contextLost: state.contextLost,
        error: state.error,
      };
    };

    let panel: HTMLPreElement | null = null;
    if (debug) {
      panel = document.createElement("pre");
      panel.style.cssText =
        "position:fixed;left:8px;bottom:8px;z-index:99999;margin:0;padding:8px 10px;max-width:92vw;" +
        "font:11px/1.35 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.78);border-radius:8px;" +
        "white-space:pre-wrap;pointer-events:none";
      document.body.appendChild(panel);
    }
    const line = (s: Snapshot) =>
      `${s.seconds}s  ${s.mode} ${s.progress}\n` +
      `textures ${s.textures}, about ${s.gpuMb} MB on the graphics chip` +
      (s.heapMb ? `, script ${s.heapMb} MB` : "") +
      `\nscreen ${s.width}x${s.height} at ${s.dpr}x` +
      (s.contextLost ? `\ngraphics context lost ${s.contextLost}x` : "") +
      (s.error ? `\nerror: ${s.error}` : "");
    const save = () => {
      const now = snapshot();
      try {
        localStorage.setItem(KEY, JSON.stringify(now));
      } catch {}
      if (panel)
        panel.textContent =
          `now: ${line(now)}` +
          (previous
            ? `\n\nlast visit ${died ? "DIED" : "ended normally"} at: ${line(previous)}`
            : "");
    };

    const onLost = () => {
      state.contextLost += 1;
      track("graphics_context_lost", { ...snapshot(), visible: true, clean: false });
      save();
    };
    const onError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const reason = "reason" in event ? event.reason : event.error ?? event.message;
      state.error = String((reason as Error)?.message ?? reason).slice(0, 160);
      save();
    };
    const onLeave = () => {
      state.clean = true;
      save();
    };
    const onShow = () => {
      state.clean = false;
      save();
    };
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onLost);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", save);
    save();
    const timer = window.setInterval(save, 1500);
    return () => {
      window.clearInterval(timer);
      canvas.removeEventListener("webglcontextlost", onLost);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", save);
      panel?.remove();
    };
  }, [gl, scene, runtimeRef]);

  return null;
}
