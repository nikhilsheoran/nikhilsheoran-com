/**
 * Custom events for the page analytics (visitors.now).
 *
 * The analytics script runs only in the top-level page. The Mac inside the 3D
 * room is the same site in a frame, so from there an event is handed up to
 * the room (see `relayTrackedEvent`), which records it. Either way a caller
 * just calls `track`. It does nothing on the server or when the script is
 * blocked or still loading.
 */
type Properties = Record<string, string | number | boolean>;

const RELAY = "journey:track";

export function track(event: string, properties?: Properties) {
  if (typeof window === "undefined") return;
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: RELAY, event, properties },
      window.location.origin,
    );
    return;
  }
  const visitors = (
    window as {
      visitors?: { track: (name: string, props?: Properties) => void };
    }
  ).visitors;
  try {
    visitors?.track(event, properties);
  } catch {}
}

/** In the room: record an event the embedded Mac handed up. Returns whether it was one. */
export function relayTrackedEvent(data: unknown) {
  const message = data as {
    type?: string;
    event?: unknown;
    properties?: Properties;
  } | null;
  if (message?.type !== RELAY || typeof message.event !== "string")
    return false;
  // Events from the Mac in the room are marked, so they can be told apart
  // from the same actions on the plain desktop pages.
  track(message.event, { ...message.properties, place: "room" });
  return true;
}
