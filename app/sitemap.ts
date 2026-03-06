import type { MetadataRoute } from "next";
import { getAllNotes } from "@/lib/content";

const SITE_URL = "https://nikhilsheoran.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const notes = getAllNotes();

  const noteUrls: MetadataRoute.Sitemap = notes.map((note) => ({
    url: `${SITE_URL}/notes/${note.slug}`,
    lastModified: new Date(note.frontmatter.updatedAt ?? note.frontmatter.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/notes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/music`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/tv`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...noteUrls,
  ];
}
