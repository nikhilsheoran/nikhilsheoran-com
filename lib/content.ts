/**
 * MDX Content Loader
 *
 * Reads MDX files from content/notes/, parses frontmatter with gray-matter,
 * and provides typed access to blog posts for the Notes app.
 *
 * This file uses Node.js fs/path and must only be imported in server code.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { NoteFrontmatter, NoteEntry } from "@/lib/types";
import { formatDateLabel, formatUpdatedAtLabel } from "@/lib/date-time";

export type { NoteFrontmatter, NoteEntry } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_DIR = path.join(process.cwd(), "content", "notes");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generatePreview(content: string, maxLength = 80): string {
  // Strip MDX/JSX tags and markdown formatting
  const plain = content
    .replace(/<[^>]+>/g, "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trim() + "...";
}

// ---------------------------------------------------------------------------
// File system reading
// ---------------------------------------------------------------------------

function getMDXFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));
}

function parseNoteFile(filename: string): NoteEntry | null {
  const filePath = path.join(CONTENT_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const frontmatter = data as NoteFrontmatter;

  // Validate required fields
  if (!frontmatter.title || !frontmatter.date) {
    console.warn(`Skipping ${filename}: missing required frontmatter (title, date)`);
    return null;
  }

  // Default folders if not specified
  if (!frontmatter.folders) {
    frontmatter.folders = ["notes"];
  }

  const stats = readingTime(content);
  const slug = filename.replace(/\.mdx?$/, "");

  return {
    slug,
    frontmatter,
    content,
    readingTime: Math.ceil(stats.minutes),
    readingTimeText: stats.text,
    preview: frontmatter.preview ?? generatePreview(content),
    dateLabel: formatDateLabel(new Date(frontmatter.date)),
    updatedAtLabel: formatUpdatedAtLabel(new Date(frontmatter.updatedAt ?? frontmatter.date)),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get all notes, sorted by date descending. Excludes drafts in production. */
export function getAllNotes(): NoteEntry[] {
  const files = getMDXFiles();
  const notes: NoteEntry[] = [];

  for (const file of files) {
    const entry = parseNoteFile(file);
    if (!entry) continue;

    // Exclude drafts in production
    if (entry.frontmatter.draft && process.env.NODE_ENV === "production") continue;

    notes.push(entry);
  }

  // Sort by date descending (newest first)
  notes.sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());

  return notes;
}

/** Get a single note by slug, or null if not found. */
export function getNoteBySlug(slug: string): NoteEntry | null {
  const files = getMDXFiles();

  for (const file of files) {
    const fileSlug = file.replace(/\.mdx?$/, "");
    if (fileSlug !== slug) continue;

    const entry = parseNoteFile(file);
    if (!entry) return null;

    // Allow drafts in development
    if (entry.frontmatter.draft && process.env.NODE_ENV === "production") return null;

    return entry;
  }

  return null;
}

/** Get all unique tags across all notes. */
export function getAllTags(): string[] {
  const notes = getAllNotes();
  const tagSet = new Set<string>();

  for (const note of notes) {
    for (const tag of note.frontmatter.tags ?? []) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort();
}

/** Get all unique folder IDs referenced by notes. */
export function getAllNoteFolderIds(): string[] {
  const notes = getAllNotes();
  const folderSet = new Set<string>();

  for (const note of notes) {
    for (const folder of note.frontmatter.folders) {
      folderSet.add(folder);
    }
  }

  return Array.from(folderSet);
}

/** Get the raw MDX content for a note (for rendering with next-mdx-remote). */
export function getNoteContent(slug: string): string | null {
  const note = getNoteBySlug(slug);
  return note?.content ?? null;
}
