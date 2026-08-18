import type { Metadata } from "next";
import { DesktopShell } from "@/app/_components/desktop-shell";
import { RouteDocument } from "@/app/_components/route-document";
import { getAllNotes } from "@/lib/content";
import { desktopApps } from "@/lib/desktop-apps";
import { pathnameFromRoute } from "@/lib/desktop-path";
import { buildNotesData } from "@/lib/mock-desktop-data";
import { getRouteMeta } from "@/lib/route-meta";
import { accountInfo } from "@/lib/settings-data";
import { getSiteUrl } from "@/lib/site";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

interface DesktopPageProps {
  params: Promise<{ route?: string[] }>;
}

export function generateStaticParams() {
  const notes = getAllNotes();

  return [
    { route: [] },
    ...desktopApps.map((app) => ({ route: [app.id] })),
    ...notes.map((note) => ({ route: ["notes", note.slug] })),
  ];
}

export async function generateMetadata({
  params,
}: DesktopPageProps): Promise<Metadata> {
  const { route } = await params;
  const pathname = pathnameFromRoute(route);
  const meta = getRouteMeta(pathname);
  const siteUrl = getSiteUrl();

  return {
    title: pathname === "/" ? { absolute: meta.title } : meta.title,
    description: meta.description,
    authors: [{ name: accountInfo.name, url: siteUrl }],
    creator: accountInfo.name,
    alternates: { canonical: meta.canonical },
    openGraph: {
      type: meta.ogType === "article" ? "article" : meta.ogType === "profile" ? "profile" : "website",
      title: meta.title,
      description: meta.description,
      url: meta.canonical,
      siteName: accountInfo.name,
      ...(meta.ogType === "article" && meta.note
        ? {
            publishedTime: meta.note.frontmatter.date,
            modifiedTime: meta.note.frontmatter.updatedAt ?? meta.note.frontmatter.date,
            authors: [accountInfo.name],
          }
        : {}),
    },
    twitter: {
      title: meta.title,
      description: meta.description,
      creator: `@${accountInfo.twitterHandle}`,
    },
  };
}

export default async function DesktopPage({ params }: DesktopPageProps) {
  const { route } = await params;
  const initialPathname = pathnameFromRoute(route);

  const noteEntries = getAllNotes();
  const serializedMap: Record<string, MDXRemoteSerializeResult> = {};

  await Promise.all(
    noteEntries.map(async (entry) => {
      serializedMap[entry.slug] = (await serialize(entry.content)) as MDXRemoteSerializeResult;
    }),
  );

  const notesData = buildNotesData(noteEntries, serializedMap);

  return (
    <>
      <RouteDocument pathname={initialPathname} />
      <DesktopShell initialPathname={initialPathname} notesData={notesData} />
    </>
  );
}
