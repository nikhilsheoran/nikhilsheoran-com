import type { CSSProperties } from "react";
import type { WindowBounds, WindowPoint, WindowSize } from "@/lib/use-draggable-window";

export const DESKTOP_WINDOW_BOUNDS = {
  menuBarHeight: 32,
  dockReservedHeight: 92,
  visibleEdge: 140,
  visibleTop: 64,
  screenMargin: 12,
  compactViewportWidth: 1100,
} as const;

function isCompactViewport(): boolean {
  return window.innerWidth < DESKTOP_WINDOW_BOUNDS.compactViewportWidth;
}

export function getDesktopWindowBounds(windowSize: WindowSize): WindowBounds {
  const top = DESKTOP_WINDOW_BOUNDS.menuBarHeight + 8;
  const bottomReserve = DESKTOP_WINDOW_BOUNDS.dockReservedHeight;

  if (isCompactViewport()) {
    const margin = DESKTOP_WINDOW_BOUNDS.screenMargin;
    return {
      minX: margin,
      maxX: Math.max(margin, window.innerWidth - windowSize.width - margin),
      minY: top,
      maxY: Math.max(top, window.innerHeight - windowSize.height - bottomReserve),
    };
  }

  return {
    minX: -(windowSize.width - DESKTOP_WINDOW_BOUNDS.visibleEdge),
    maxX: window.innerWidth - DESKTOP_WINDOW_BOUNDS.visibleEdge,
    minY: top,
    maxY: window.innerHeight - bottomReserve - DESKTOP_WINDOW_BOUNDS.visibleTop,
  };
}

export function getDesktopWindowFrameStyle(options: {
  maxWidth: number;
  maxHeight: number;
  position: WindowPoint;
  zIndex?: number;
  isDragging?: boolean;
  widthGutter?: number;
  heightGutter?: number;
}): CSSProperties {
  const widthGutter = options.widthGutter ?? 24;
  const heightGutter = options.heightGutter ?? 98;

  return {
    width: `min(${options.maxWidth}px, calc(100vw - ${widthGutter}px))`,
    height: `min(${options.maxHeight}px, calc(100vh - ${heightGutter}px))`,
    maxWidth: `calc(100vw - ${widthGutter}px)`,
    maxHeight: `calc(100vh - ${heightGutter}px)`,
    zIndex: options.zIndex,
    transform: `translate3d(${options.position.x}px, ${options.position.y}px, 0)`,
    willChange: options.isDragging ? "transform" : "auto",
  };
}
