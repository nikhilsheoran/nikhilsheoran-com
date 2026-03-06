import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import type { NoteEntry } from "@/lib/types";

// ---------------------------------------------------------------------------
// Group heading computation (duplicated from content.ts to avoid pulling
// Node.js fs/path modules into the client bundle)
// ---------------------------------------------------------------------------

function computeGroupHeading(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return "Last 7 Days";
  if (diffDays <= 30) return "Previous 30 Days";

  const currentYear = now.getFullYear();
  const noteYear = date.getFullYear();

  if (noteYear === currentYear) {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return months[date.getMonth()];
  }

  return noteYear.toString();
}

export interface NotesQuickGroup {
  id: "shared";
  label: string;
  count: number;
  /** Virtual folder id that clicking this quick row navigates to */
  folderId: string;
}

export interface NotesFolder {
  id: string;
  label: string;
  noteSlugs: string[];
}

export interface NoteRecord {
  slug: string;
  title: string;
  preview: string;
  dateLabel: string;
  updatedAtLabel: string;
  groupHeading: string;
  folderIds: string[];
  isShared: boolean;
  isPinned: boolean;
  /** Pre-compiled MDX source for client-side rendering */
  mdxSource: MDXRemoteSerializeResult | null;
  /** Reading time in minutes */
  readingTime: number;
}

export interface NotesListGroup {
  heading: string;
  items: NoteRecord[];
}

export interface NotesData {
  defaultFolderId: string;
  defaultNoteSlug: string | null;
  quickGroups: NotesQuickGroup[];
  folders: NotesFolder[];
  notesBySlug: Record<string, NoteRecord>;
  noteOrder: string[];
  groupOrder: string[];
}

// ---------------------------------------------------------------------------
// Folder registry
// ---------------------------------------------------------------------------

const folderDefinitions = [
  { id: "all-icloud", label: "All iCloud" },
  { id: "notes", label: "Notes" },
  { id: "archive", label: "Archive" },
  { id: "documents", label: "Documents" },
  { id: "imported-notes", label: "Imported Notes" },
  { id: "passwords", label: "Passwords" },
  { id: "quick-notes", label: "Quick Notes" },
  // Virtual folder — populated with all shared notes
  { id: "shared", label: "Shared" },
] as const;

const DEFAULT_FOLDER_ID = "all-icloud";

// ---------------------------------------------------------------------------
// Builder: NoteEntry[] + serialized MDX → NotesData
// ---------------------------------------------------------------------------

/**
 * Converts an array of NoteEntry (from lib/content.ts) plus a map of
 * pre-serialized MDX sources into the NotesData shape consumed by the
 * Notes window. This must be called server-side (in page.tsx) where
 * filesystem access and MDX compilation are available.
 */
export function buildNotesData(
  entries: NoteEntry[],
  serializedMap: Record<string, MDXRemoteSerializeResult>,
): NotesData {
  // Every note is implicitly in "all-icloud"
  const records: NoteRecord[] = entries.map((entry) => {
    const folderIds = [DEFAULT_FOLDER_ID, ...entry.frontmatter.folders];
    // Deduplicate while preserving order
    const uniqueFolderIds = [...new Set(folderIds)];

    return {
      slug: entry.slug,
      title: entry.frontmatter.title,
      preview: entry.preview,
      dateLabel: entry.dateLabel,
      updatedAtLabel: entry.updatedAtLabel,
      groupHeading: (entry.frontmatter.pinned ?? false) ? "Pinned" : computeGroupHeading(entry.frontmatter.date),
      folderIds: uniqueFolderIds,
      isShared: entry.frontmatter.shared ?? false,
      isPinned: entry.frontmatter.pinned ?? false,
      mdxSource: serializedMap[entry.slug] ?? null,
      readingTime: entry.readingTime,
    };
  });

  // Build folder → slugs mapping
  const folderNoteSlugs = new Map<string, string[]>();
  for (const folder of folderDefinitions) {
    folderNoteSlugs.set(folder.id, []);
  }
  for (const record of records) {
    for (const folderId of record.folderIds) {
      const list = folderNoteSlugs.get(folderId);
      if (list) list.push(record.slug);
    }
    // Also push into the virtual "shared" folder
    if (record.isShared) {
      folderNoteSlugs.get("shared")?.push(record.slug);
    }
  }

  const folders: NotesFolder[] = folderDefinitions.map((folder) => ({
    id: folder.id,
    label: folder.label,
    noteSlugs: folderNoteSlugs.get(folder.id) ?? [],
  }));

  const notesBySlug = Object.fromEntries(
    records.map((record) => [record.slug, record]),
  ) as Record<string, NoteRecord>;

  const sharedCount = records.filter((r) => r.isShared).length;

  // Compute ordered unique group headings — "Pinned" always first
  const seenGroups = new Set<string>();
  const groupOrder: string[] = [];
  // Seed Pinned first if any pinned notes exist
  if (records.some((r) => r.isPinned)) {
    seenGroups.add("Pinned");
    groupOrder.push("Pinned");
  }
  for (const record of records) {
    if (!seenGroups.has(record.groupHeading)) {
      seenGroups.add(record.groupHeading);
      groupOrder.push(record.groupHeading);
    }
  }

  const defaultNoteSlug =
    notesBySlug["opendictate-readme"]?.slug ??
    folders.find((f) => f.id === DEFAULT_FOLDER_ID)?.noteSlugs[0] ??
    null;

  return {
    defaultFolderId: DEFAULT_FOLDER_ID,
    defaultNoteSlug,
    quickGroups: [{ id: "shared", label: "Shared", count: sharedCount, folderId: "shared" }],
    folders,
    notesBySlug,
    noteOrder: records.map((r) => r.slug),
    groupOrder,
  };
}

export function getFolderById(notesData: NotesData, folderId: string): NotesFolder | null {
  return notesData.folders.find((folder) => folder.id === folderId) ?? null;
}

export function getFirstNoteSlugForFolder(notesData: NotesData, folderId: string): string | null {
  return getFolderById(notesData, folderId)?.noteSlugs[0] ?? null;
}

export function folderContainsNote(
  notesData: NotesData,
  folderId: string,
  noteSlug: string,
): boolean {
  const folder = getFolderById(notesData, folderId);
  return folder ? folder.noteSlugs.includes(noteSlug) : false;
}

export function getPreferredFolderIdForNote(notesData: NotesData, noteSlug: string): string | null {
  const note = notesData.notesBySlug[noteSlug];
  if (!note) return null;

  const preferredFolderId = note.folderIds.find((folderId) => folderId !== notesData.defaultFolderId);
  return preferredFolderId ?? notesData.defaultFolderId;
}

export function getGroupedNotesForFolder(
  notesData: NotesData,
  folderId: string,
): NotesListGroup[] {
  const folder = getFolderById(notesData, folderId);
  if (!folder) return [];

  const noteOrderIndex = new Map<string, number>();
  notesData.noteOrder.forEach((slug, index) => noteOrderIndex.set(slug, index));

  return notesData.groupOrder
    .map((heading) => {
      const items = folder.noteSlugs
        .map((slug) => notesData.notesBySlug[slug])
        .filter((note): note is NoteRecord => Boolean(note))
        .filter((note) => note.groupHeading === heading)
        .sort(
          (a, b) =>
            (noteOrderIndex.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
            (noteOrderIndex.get(b.slug) ?? Number.MAX_SAFE_INTEGER),
        );

      return { heading, items };
    })
    .filter((group) => group.items.length > 0);
}

export function getNoteRoutePath(noteSlug: string): string {
  return `/notes/${encodeURIComponent(noteSlug)}`;
}
