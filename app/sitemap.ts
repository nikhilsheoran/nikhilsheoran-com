import type { MetadataRoute } from "next";
import { getAllNotes } from "@/lib/content";
import { desktopApps } from "@/lib/desktop-apps";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const notes = getAllNotes();

  const noteUrls: MetadataRoute.Sitemap = notes.map((note) => ({
    url: `${siteUrl}/notes/${note.slug}`,
    lastModified: new Date(note.frontmatter.updatedAt ?? note.frontmatter.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...desktopApps.map((app) => ({
      url: `${siteUrl}${app.route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: app.id === "notes" ? 0.8 : 0.5,
    })),
    ...noteUrls,
  ];
}
