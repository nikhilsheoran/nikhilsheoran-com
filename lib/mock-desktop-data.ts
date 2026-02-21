export type DesktopAppId =
  | "finder"
  | "notes"
  | "system-settings"
  | "messages"
  | "music"
  | "tv";

export type NoteBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] };

export interface NotesQuickGroup {
  id: "shared";
  label: string;
  count: number;
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
  body: NoteBodyBlock[];
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

export interface DesktopMockData {
  notes: NotesData;
}

const folderDefinitions = [
  { id: "all-icloud", label: "All iCloud" },
  { id: "notes", label: "Notes" },
  { id: "archive", label: "Archive" },
  { id: "documents", label: "Documents" },
  { id: "imported-notes", label: "Imported Notes" },
  { id: "passwords", label: "Passwords" },
  { id: "quick-notes", label: "Quick Notes" },
] as const;

const notes: NoteRecord[] = [
  {
    slug: "problem-statement-mobile-ux",
    title: "Problem Statement",
    preview: "Imagine that your mobile",
    dateLabel: "19/01/26",
    updatedAtLabel: "19 January 2026 at 10:32 AM",
    groupHeading: "Previous 30 Days",
    folderIds: ["all-icloud", "notes"],
    isShared: true,
    body: [
      {
        type: "paragraph",
        text: "Imagine that your mobile checkout drops at the last step when internet quality is unstable.",
      },
      {
        type: "unordered-list",
        items: [
          "Users lose entered payment details.",
          "Retry path is unclear.",
          "Drop-off spikes on lower-end devices.",
        ],
      },
      {
        type: "paragraph",
        text: "Goal: reduce failed checkout exits by introducing robust local recovery and clear retry messaging.",
      },
    ],
  },
  {
    slug: "problem-statement-two-numbers",
    title: "Problem Statement",
    preview: "You are given two numeri",
    dateLabel: "19/01/26",
    updatedAtLabel: "19 January 2026 at 9:55 AM",
    groupHeading: "Previous 30 Days",
    folderIds: ["all-icloud", "notes"],
    isShared: false,
    body: [
      {
        type: "paragraph",
        text: "You are given two numeric arrays and a target sum. Return any pair indices whose values add up to the target.",
      },
      {
        type: "ordered-list",
        items: [
          "Clarify whether duplicates are allowed.",
          "Prefer O(n) over O(n^2).",
          "Return deterministic ordering for stable tests.",
        ],
      },
    ],
  },
  {
    slug: "clean-reconstruction-notes",
    title: "Here is the clean, reconstru...",
    preview: "in text form, with examp...",
    dateLabel: "19/01/26",
    updatedAtLabel: "19 January 2026 at 9:22 AM",
    groupHeading: "Previous 30 Days",
    folderIds: ["all-icloud", "notes"],
    isShared: true,
    body: [
      {
        type: "paragraph",
        text: "Here is the clean reconstruction in text form, with examples and practical caveats added.",
      },
      {
        type: "unordered-list",
        items: [
          "Normalize all examples before comparing outputs.",
          "Keep intermediate steps explicit for debugging.",
          "Prefer small test fixtures with known edge cases.",
        ],
      },
    ],
  },
  {
    slug: "tally-server-setup-readme",
    title: "tally server setup readme",
    preview: "setup cloudflare tunnel +",
    dateLabel: "17/01/26",
    updatedAtLabel: "17 January 2026 at 1:16 PM",
    groupHeading: "Previous 30 Days",
    folderIds: ["all-icloud", "notes", "documents"],
    isShared: true,
    body: [
      {
        type: "ordered-list",
        items: [
          "Setup cloudflare tunnel and wrap zero trust on server and all clients.",
          "Go to network/connectors, add tunnel (cloudflared), and enter private IP under CIDR.",
          "Create users and security policies and then grant access.",
        ],
      },
      {
        type: "paragraph",
        text: "Type sysdm.cpl, go to Advanced, and set performance options for better remote responsiveness.",
      },
      {
        type: "unordered-list",
        items: [
          "Enforce removal of remote desktop wallpaper.",
          "Limit maximum color depth to 16 bit.",
          "Set RemoteFX adaptive graphics image quality to Medium.",
        ],
      },
      {
        type: "paragraph",
        text: "Reference: https://github.com/sebaxakerhtc/rdpwrap/releases",
      },
    ],
  },
  {
    slug: "opendictate-readme",
    title: "opendictate readme",
    preview: "# OpenDictate",
    dateLabel: "15/01/26",
    updatedAtLabel: "15 January 2026 at 8:40 PM",
    groupHeading: "Previous 30 Days",
    folderIds: ["all-icloud", "documents"],
    isShared: false,
    body: [
      {
        type: "paragraph",
        text: "OpenDictate is a local-first transcription setup focused on quick capture and low-latency edits.",
      },
      {
        type: "unordered-list",
        items: [
          "Input watcher writes timestamped snippets.",
          "Post-processor cleans punctuation and casing.",
          "Daily archive keeps raw and polished output.",
        ],
      },
    ],
  },
  {
    slug: "to-order-amazon",
    title: "to order - amazon",
    preview: "instamart",
    dateLabel: "05/01/26",
    updatedAtLabel: "05 January 2026 at 6:10 PM",
    groupHeading: "January",
    folderIds: ["all-icloud", "passwords"],
    isShared: false,
    body: [
      {
        type: "unordered-list",
        items: [
          "Instamart shelf bins.",
          "USB-C hub for travel desk.",
          "Cable labels and velcro ties.",
        ],
      },
      {
        type: "paragraph",
        text: "Recheck shipping dates before final order.",
      },
    ],
  },
  {
    slug: "bunx-bun-shadcn-maia",
    title: "bunx --bun shadcn@latest...",
    preview: "?base=radix&style=maia",
    dateLabel: "30/12/25",
    updatedAtLabel: "30 December 2025 at 11:42 PM",
    groupHeading: "2025",
    folderIds: ["all-icloud", "archive"],
    isShared: false,
    body: [
      {
        type: "paragraph",
        text: "Command notes for bootstrapping shadcn with bun and the maia style preset.",
      },
      {
        type: "ordered-list",
        items: [
          "Run bunx --bun shadcn@latest init.",
          "Select base radix setup and maia style.",
          "Verify generated config and import paths.",
        ],
      },
    ],
  },
];

function createNotesData(): NotesData {
  const notesBySlug = Object.fromEntries(notes.map((note) => [note.slug, note])) as Record<
    string,
    NoteRecord
  >;

  const folderNoteSlugs = new Map<string, string[]>();
  for (const folder of folderDefinitions) {
    folderNoteSlugs.set(folder.id, []);
  }

  for (const note of notes) {
    for (const folderId of note.folderIds) {
      const list = folderNoteSlugs.get(folderId);
      if (!list) continue;
      list.push(note.slug);
    }
  }

  const folders: NotesFolder[] = folderDefinitions.map((folder) => ({
    id: folder.id,
    label: folder.label,
    noteSlugs: folderNoteSlugs.get(folder.id) ?? [],
  }));

  const sharedCount = notes.filter((note) => note.isShared).length;
  const defaultFolderId = "all-icloud";
  const defaultNoteSlug =
    notesBySlug["opendictate-readme"]?.slug ??
    folders.find((folder) => folder.id === defaultFolderId)?.noteSlugs[0] ??
    null;

  return {
    defaultFolderId,
    defaultNoteSlug,
    quickGroups: [{ id: "shared", label: "Shared", count: sharedCount }],
    folders,
    notesBySlug,
    noteOrder: notes.map((note) => note.slug),
    groupOrder: ["Previous 30 Days", "January", "2025"],
  };
}

const desktopMockData: DesktopMockData = {
  notes: createNotesData(),
};

export function getDesktopMockData(): DesktopMockData {
  return desktopMockData;
}

export function getFolderById(notesData: NotesData, folderId: string): NotesFolder | null {
  return notesData.folders.find((folder) => folder.id === folderId) ?? null;
}

export function getDefaultFolder(notesData: NotesData): NotesFolder {
  return getFolderById(notesData, notesData.defaultFolderId) ?? notesData.folders[0];
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
