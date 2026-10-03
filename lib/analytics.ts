/**
 * Custom events for the page analytics (visitors.now). Safe to call anywhere:
 * it does nothing on the server, in the embedded Mac, or when the script is
 * blocked or still loading.
 */
type Properties = Record<string, string | number | boolean>;

export function track(event: string, properties?: Properties) {
  if (typeof window === "undefined") return;
  const visitors = (window as { visitors?: { track: (name: string, props?: Properties) => void } })
    .visitors;
  try {
    visitors?.track(event, properties);
  } catch {}
}
