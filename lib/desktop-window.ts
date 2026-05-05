import type { WindowBounds, WindowSize } from "@/lib/use-draggable-window";

export const DESKTOP_WINDOW_BOUNDS = {
  menuBarHeight: 32,
  dockReservedHeight: 92,
  visibleEdge: 140,
  visibleTop: 64,
} as const;

export function getDesktopWindowBounds(windowSize: WindowSize): WindowBounds {
  return {
    minX: -(windowSize.width - DESKTOP_WINDOW_BOUNDS.visibleEdge),
    maxX: window.innerWidth - DESKTOP_WINDOW_BOUNDS.visibleEdge,
    minY: DESKTOP_WINDOW_BOUNDS.menuBarHeight + 8,
    maxY: window.innerHeight - DESKTOP_WINDOW_BOUNDS.dockReservedHeight - DESKTOP_WINDOW_BOUNDS.visibleTop,
  };
}
