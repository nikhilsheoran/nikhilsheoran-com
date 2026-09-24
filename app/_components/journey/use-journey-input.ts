"use client";

import { type RefObject, useEffect } from "react";
import { leave, nudge, seek } from "@/lib/journey/machine";
import { tuning } from "@/lib/journey/tuning";
import type { JourneyRuntime } from "./runtime";

const INTERACTIVE = "button,input,a,textarea,iframe,[data-tuner]";

const KEY_STEPS: Record<string, number> = {
  ArrowDown: 0.025,
  ArrowRight: 0.025,
  ArrowUp: -0.025,
  ArrowLeft: -0.025,
  PageDown: 0.1,
  PageUp: -0.1,
  " ": 0.07,
};

/**
 * Wheel, trackpad, drag (either axis, with release momentum) and keyboard all
 * move the same rail. Dragging outside the focused screen leaves the Mac.
 */
export function useJourneyInput(
  surfaceRef: RefObject<HTMLDivElement | null>,
  runtimeRef: RefObject<JourneyRuntime>,
) {
  useEffect(() => {
    const node = surfaceRef.current;
    if (!node) return;
    const runtime = runtimeRef.current;
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

    const wheel = (event: WheelEvent) => {
      if ((event.target as Element).closest("button,input,a,[data-tuner]"))
        return;
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? node.clientHeight
            : 1;
      const { wheelSensitivity, maxWheelStep } = tuning.motion;
      const delta = Math.max(
        -maxWheelStep,
        Math.min(maxWheelStep, event.deltaY * unit * wheelSensitivity),
      );
      nudge(runtime.motion, delta, runtime.beats);
    };

    const down = (event: PointerEvent) => {
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        (event.target as Element).closest(INTERACTIVE)
      )
        return;
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        start: runtime.motion.progress,
        axis: null,
        last: runtime.motion.progress,
        time: event.timeStamp,
        velocity: 0,
      };
    };

    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x,
        dy = event.clientY - drag.y;
      if (!drag.axis && Math.hypot(dx, dy) < 6) return;
      const motion = runtime.motion;
      if (!drag.axis) {
        if (motion.mode === "focused" || motion.mode === "approaching") {
          leave(motion, runtime.beats);
          drag = null;
          return;
        }
        drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        node.setPointerCapture(event.pointerId);
        motion.dragging = true;
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
      seek(motion, next, runtime.beats);
      runtime.suppressClickUntil = performance.now() + 250;
    };

    const finish = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (drag.axis) {
        event.stopPropagation();
        const motion = runtime.motion;
        const momentum =
          motion.reducedMotion ||
          event.type !== "pointerup" ||
          event.timeStamp - drag.time > 100
            ? 0
            : Math.max(-0.07, Math.min(0.07, drag.velocity * 0.12));
        motion.dragging = false;
        seek(motion, motion.progress + momentum, runtime.beats);
        runtime.suppressClickUntil = performance.now() + 250;
        delete node.dataset.dragging;
        if (node.hasPointerCapture(event.pointerId))
          node.releasePointerCapture(event.pointerId);
      }
      drag = null;
    };

    const click = (event: MouseEvent) => {
      if (performance.now() < runtime.suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const key = (event: KeyboardEvent) => {
      const motion = runtime.motion;
      if (event.key === "Escape") {
        event.preventDefault();
        leave(motion, runtime.beats);
        return;
      }
      if ((event.target as Element).closest("input,button,a,textarea")) return;
      const delta = KEY_STEPS[event.key];
      if (delta !== undefined) {
        event.preventDefault();
        nudge(motion, delta, runtime.beats);
      } else if (event.key === "Home") {
        event.preventDefault();
        seek(motion, 0, runtime.beats);
      } else if (event.key === "End") {
        event.preventDefault();
        seek(motion, 1, runtime.beats);
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
      window.removeEventListener("keydown", key);
      runtime.motion.dragging = false;
      delete node.dataset.dragging;
    };
  }, [surfaceRef, runtimeRef]);
}
