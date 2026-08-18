import { getNoteBySlug, type NoteEntry } from "@/lib/content";
import {
  desktopAppById,
  isDesktopAppId,
  type DesktopAppId,
} from "@/lib/desktop-apps";
import { DEFAULT_NOTE_SLUG, getDocumentPath } from "@/lib/desktop-path";
import { accountInfo } from "@/lib/settings-data";
import { getCanonicalUrl, getSiteTagline } from "@/lib/site";

const APP_DESCRIPTIONS: Record<Exclude<DesktopAppId, "notes">, string> = {
  music: `Albums, artists, and tracks in ${accountInfo.name}'s library.`,
  tv: `Shows and movies ${accountInfo.name} has been watching.`,
  finder: `Files, projects, and apps on ${accountInfo.name}'s desktop.`,
  "system-settings": `About ${accountInfo.name}.`,
};

export type RouteOgType = "article" | "profile" | "website";

export interface RouteMeta {
  pathname: string;
  canonical: string;
  appId: string;
  noteSlug: string | null;
  note: NoteEntry | null;
  title: string;
  description: string;
  ogType: RouteOgType;
}

function notesMeta(
  pathname: string,
  canonical: string,
  note: NoteEntry,
): RouteMeta {
  return {
    pathname,
    canonical,
    appId: "notes",
    noteSlug: note.slug,
    note,
    title: pathname === "/" ? accountInfo.name : note.frontmatter.title,
    description: note.preview || note.frontmatter.preview || note.frontmatter.title,
    ogType: pathname === "/" ? "profile" : "article",
  };
}

function appMeta(
  pathname: string,
  canonical: string,
  appId: Exclude<DesktopAppId, "notes">,
): RouteMeta {
  return {
    pathname,
    canonical,
    appId,
    noteSlug: null,
    note: null,
    title: desktopAppById[appId].name,
    description: APP_DESCRIPTIONS[appId],
    ogType: "website",
  };
}

function fallbackMeta(
  pathname: string,
  canonical: string,
  appId: string,
  noteSlug: string | null,
): RouteMeta {
  return {
    pathname,
    canonical,
    appId,
    noteSlug,
    note: null,
    title: accountInfo.name,
    description: getSiteTagline(),
    ogType: "website",
  };
}

export function getRouteMeta(pathname: string): RouteMeta {
  const { appId, noteSlug } = getDocumentPath(pathname);
  const canonical = getCanonicalUrl(pathname);

  if (!isDesktopAppId(appId)) {
    return fallbackMeta(pathname, canonical, appId, noteSlug);
  }

  switch (appId) {
    case "notes": {
      const note = getNoteBySlug(noteSlug ?? DEFAULT_NOTE_SLUG);
      if (!note) {
        return fallbackMeta(pathname, canonical, appId, noteSlug);
      }
      return notesMeta(pathname, canonical, note);
    }
    case "music":
    case "tv":
    case "finder":
    case "system-settings":
      return appMeta(pathname, canonical, appId);
    default: {
      const _exhaustive: never = appId;
      return _exhaustive;
    }
  }
}
