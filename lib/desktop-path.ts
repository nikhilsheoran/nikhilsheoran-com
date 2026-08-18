export const DEFAULT_NOTE_SLUG = "about-me";

export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const normalized =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;
  return normalized || "/";
}

export function parseDesktopPath(pathname: string): {
  appId: string;
  noteSlug: string | null;
} {
  const segments = normalizePathname(pathname)
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  const appId = segments[0] ?? "finder";
  const noteSlug = appId === "notes" ? (segments[1] ?? null) : null;
  return { appId, noteSlug };
}

/** Route used for the server document and metadata. `/` is the default note. */
export function getDocumentPath(pathname: string): {
  appId: string;
  noteSlug: string | null;
} {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") {
    return { appId: "notes", noteSlug: DEFAULT_NOTE_SLUG };
  }

  const parsed = parseDesktopPath(normalized);
  if (parsed.appId === "notes" && !parsed.noteSlug) {
    return { appId: "notes", noteSlug: DEFAULT_NOTE_SLUG };
  }

  return parsed;
}

export function pathnameFromRoute(route: string[] | undefined): string {
  if (!route || route.length === 0) return "/";
  return `/${route.map((segment) => encodeURIComponent(segment)).join("/")}`;
}
