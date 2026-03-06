import { DesktopShell } from "@/app/_components/desktop-shell";
import { getAllNotes } from "@/lib/content";
import { buildNotesData } from "@/lib/mock-desktop-data";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

interface DesktopPageProps {
  params: Promise<{ route?: string[] }>;
}

export default async function DesktopPage({ params }: DesktopPageProps) {
  const { route = [] } = await params;
  const initialPathname =
    route.length === 0
      ? "/"
      : `/${route.map((segment) => encodeURIComponent(segment)).join("/")}`;

  // Load all MDX notes and serialize them server-side
  const noteEntries = getAllNotes();
  const serializedMap: Record<string, MDXRemoteSerializeResult> = {};

  await Promise.all(
    noteEntries.map(async (entry) => {
      serializedMap[entry.slug] = await serialize(entry.content) as MDXRemoteSerializeResult;
    }),
  );

  const notesData = buildNotesData(noteEntries, serializedMap);

  return <DesktopShell initialPathname={initialPathname} notesData={notesData} />;
}
