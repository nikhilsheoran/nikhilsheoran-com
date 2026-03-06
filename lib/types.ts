/**
 * Shared types for the Notes content system.
 *
 * This file must remain free of Node.js-specific imports (fs, path, etc.)
 * so it can be safely imported in both server and client code.
 */

export interface NoteFrontmatter {
  title: string;
  /** Short preview text (auto-generated from content if not provided) */
  preview?: string;
  /** ISO date string */
  date: string;
  /** ISO date string */
  updatedAt?: string;
  /** Folder IDs this note belongs to (e.g. ["notes", "documents"]) */
  folders: string[];
  /** Whether this note is shared */
  shared?: boolean;
  /** Draft notes are excluded from production */
  draft?: boolean;
  /** Optional tags for categorization */
  tags?: string[];
}

export interface NoteEntry {
  slug: string;
  frontmatter: NoteFrontmatter;
  /** Raw MDX content (without frontmatter) */
  content: string;
  /** Reading time in minutes */
  readingTime: number;
  /** Reading time display string, e.g. "3 min read" */
  readingTimeText: string;
  /** Auto-generated preview from content (first ~80 chars) */
  preview: string;
  /** Formatted date label for list display */
  dateLabel: string;
  /** Formatted "updated at" label */
  updatedAtLabel: string;
}
