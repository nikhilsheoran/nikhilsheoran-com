import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

export interface WindowPoint {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface UseDraggableWindowOptions {
  initialPosition: WindowPoint;
  getBounds: (size: WindowSize) => WindowBounds;
  disabled?: boolean;
}

interface UseDraggableWindowResult {
  windowRef: RefObject<HTMLDivElement>;
  position: WindowPoint;
  isDragging: boolean;
  handleDragStart: (event: ReactPointerEvent<HTMLElement>) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useDraggableWindow({
  initialPosition,
  getBounds,
  disabled = false,
}: UseDraggableWindowOptions): UseDraggableWindowResult {
  const windowRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  const positionRef = useRef(initialPosition);
  const dragOffsetRef = useRef<WindowPoint | null>(null);
  const dragSizeRef = useRef<WindowSize>({ width: 0, height: 0 });
  const latestPointerRef = useRef<WindowPoint | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const previousUserSelectRef = useRef<string>("");

  const applyPosition = useCallback((nextPosition: WindowPoint) => {
    positionRef.current = nextPosition;
    const windowElement = windowRef.current;
    if (!windowElement) return;
    windowElement.style.transform = `translate3d(${nextPosition.x}px, ${nextPosition.y}px, 0)`;
  }, []);

  const getWindowSize = useCallback((): WindowSize | null => {
    const windowElement = windowRef.current;
    if (!windowElement) return null;
    const rect = windowElement.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  const clampToBounds = useCallback(
    (nextPosition: WindowPoint, size: WindowSize): WindowPoint => {
      const bounds = getBounds(size);
      const maxX = Math.max(bounds.maxX, bounds.minX);
      const maxY = Math.max(bounds.maxY, bounds.minY);
      return {
        x: clamp(nextPosition.x, bounds.minX, maxX),
        y: clamp(nextPosition.y, bounds.minY, maxY),
      };
    },
    [getBounds],
  );

  const clampAndCommitPosition = useCallback(
    (size: WindowSize) => {
      const clampedPosition = clampToBounds(positionRef.current, size);
      applyPosition(clampedPosition);
      setPosition(clampedPosition);
    },
    [applyPosition, clampToBounds],
  );

  const flushPointerMove = useCallback(() => {
    rafIdRef.current = null;

    const pointer = latestPointerRef.current;
    const dragOffset = dragOffsetRef.current;
    if (!pointer || !dragOffset) return;

    const nextPosition = {
      x: pointer.x - dragOffset.x,
      y: pointer.y - dragOffset.y,
    };
    const clampedPosition = clampToBounds(nextPosition, dragSizeRef.current);

    if (
      clampedPosition.x !== positionRef.current.x ||
      clampedPosition.y !== positionRef.current.y
    ) {
      applyPosition(clampedPosition);
    }
  }, [applyPosition, clampToBounds]);

  const schedulePointerFlush = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = window.requestAnimationFrame(flushPointerMove);
  }, [flushPointerMove]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      latestPointerRef.current = { x: event.clientX, y: event.clientY };
      schedulePointerFlush();
    },
    [schedulePointerFlush],
  );

  const endDrag = useCallback(() => {
    if (!dragOffsetRef.current) return;

    dragOffsetRef.current = null;
    latestPointerRef.current = null;
    setIsDragging(false);

    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    window.removeEventListener("blur", endDrag);

    document.body.style.userSelect = previousUserSelectRef.current;
    setPosition(positionRef.current);
  }, [handlePointerMove]);

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return;
      if (
        (event.target as HTMLElement).closest(
          "[data-window-control],[data-window-drag-ignore]",
        )
      ) {
        return;
      }
      if (dragOffsetRef.current) return;

      const size = getWindowSize();
      if (!size) return;

      event.preventDefault();
      dragSizeRef.current = size;
      dragOffsetRef.current = {
        x: event.clientX - positionRef.current.x,
        y: event.clientY - positionRef.current.y,
      };
      latestPointerRef.current = { x: event.clientX, y: event.clientY };

      previousUserSelectRef.current = document.body.style.userSelect;
      document.body.style.userSelect = "none";
      setIsDragging(true);

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
      window.addEventListener("blur", endDrag);
    },
    [disabled, endDrag, getWindowSize, handlePointerMove],
  );

  useEffect(() => {
    applyPosition(position);
  }, [applyPosition, position]);

  useEffect(() => {
    const windowSize = getWindowSize();
    if (!windowSize) return;
    clampAndCommitPosition(windowSize);
  }, [clampAndCommitPosition, getWindowSize]);

  useEffect(() => {
    const handleResize = () => {
      const windowSize = getWindowSize();
      if (!windowSize) return;
      clampAndCommitPosition(windowSize);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampAndCommitPosition, getWindowSize]);

  useEffect(() => {
    const windowElement = windowRef.current;
    if (!windowElement || typeof ResizeObserver === "undefined") return;

    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const windowSize = getWindowSize();
        if (!windowSize) return;
        clampAndCommitPosition(windowSize);
      });
    });

    observer.observe(windowElement);
    return () => {
      observer.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [clampAndCommitPosition, getWindowSize]);

  useEffect(
    () => () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("blur", endDrag);
      document.body.style.userSelect = previousUserSelectRef.current;
    },
    [endDrag, handlePointerMove],
  );

  return {
    windowRef,
    position,
    isDragging,
    handleDragStart,
  };
}
