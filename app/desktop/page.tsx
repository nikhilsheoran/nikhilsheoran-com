import type { Metadata } from "next";
import { serialize } from "next-mdx-remote/serialize";
import { getAllNotes } from "@/lib/content";
import { buildNotesData } from "@/lib/mock-desktop-data";
import { EmbeddedDesktop } from "@/app/_components/journey/embedded-desktop";

export const metadata: Metadata = {
  title: "Nikhil’s Mac",
  robots: { index: false, follow: false },
};

export default async function DesktopFramePage() {
  const entries = getAllNotes();
  const serialized = Object.fromEntries(
    await Promise.all(
      entries.map(async (entry) => [
        entry.slug,
        await serialize(entry.content),
      ]),
    ),
  );
  return <EmbeddedDesktop notesData={buildNotesData(entries, serialized)} />;
}
