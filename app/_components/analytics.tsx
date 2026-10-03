"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";

const never = () => () => {};

/**
 * Page analytics, loaded only in the top-level page. The Mac inside the 3D
 * room is this same site in a frame; counting it too would record every visit
 * twice and log the frame's own addresses as pages.
 */
export function Analytics() {
  const topLevel = useSyncExternalStore(
    never,
    () => window.parent === window,
    () => false,
  );
  if (!topLevel) return null;
  return (
    <Script
      src="https://cdn.visitors.now/v.js"
      data-token="d502ca42-8a2f-41a4-8a35-56450cb6af1a"
    />
  );
}
