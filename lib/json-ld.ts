import { getAllNotes } from "@/lib/content";
import { desktopApps } from "@/lib/desktop-apps";
import { albums } from "@/lib/music-data";
import { getRouteMeta, type RouteMeta } from "@/lib/route-meta";
import { accountInfo } from "@/lib/settings-data";
import { getSiteTagline, getSiteUrl } from "@/lib/site";
import { movies, shows } from "@/lib/tv-data";

function personNode() {
  const siteUrl = getSiteUrl();
  return {
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: accountInfo.name,
    url: siteUrl,
    email: accountInfo.email,
    image: `${siteUrl}${accountInfo.avatarPath}`,
    jobTitle: accountInfo.jobTitle,
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: accountInfo.alumniOf,
    },
    sameAs: accountInfo.sameAs,
  };
}

function websiteNode() {
  const siteUrl = getSiteUrl();
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: accountInfo.name,
    url: siteUrl,
    description: getSiteTagline(),
    publisher: { "@id": `${siteUrl}/#person` },
    inLanguage: "en",
  };
}

function pageNode(meta: RouteMeta): Record<string, unknown> | null {
  const siteUrl = getSiteUrl();
  const person = { "@id": `${siteUrl}/#person` };
  const website = { "@id": `${siteUrl}/#website` };

  if (meta.appId === "notes" && meta.note) {
    return {
      "@type": meta.ogType === "profile" ? "ProfilePage" : "Article",
      "@id": `${meta.canonical}#page`,
      url: meta.canonical,
      name: meta.note.frontmatter.title,
      headline: meta.note.frontmatter.title,
      description: meta.description,
      datePublished: meta.note.frontmatter.date,
      dateModified: meta.note.frontmatter.updatedAt ?? meta.note.frontmatter.date,
      author: person,
      publisher: person,
      mainEntityOfPage: meta.canonical,
      isPartOf: website,
    };
  }

  if (meta.appId === "music") {
    return {
      "@type": "CollectionPage",
      "@id": `${meta.canonical}#page`,
      url: meta.canonical,
      name: meta.title,
      description: meta.description,
      author: person,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: albums.map((album, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${album.title} - ${album.artist}`,
        })),
      },
    };
  }

  if (meta.appId === "tv") {
    return {
      "@type": "CollectionPage",
      "@id": `${meta.canonical}#page`,
      url: meta.canonical,
      name: meta.title,
      description: meta.description,
      author: person,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [...shows, ...movies].map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
        })),
      },
    };
  }

  if (meta.appId === "finder" || meta.appId === "system-settings") {
    return {
      "@type": "WebPage",
      "@id": `${meta.canonical}#page`,
      url: meta.canonical,
      name: meta.title,
      description: meta.description,
      author: person,
      isPartOf: website,
    };
  }

  return null;
}

export function jsonLdFromRouteMeta(meta: RouteMeta): Record<string, unknown> {
  const graph: Record<string, unknown>[] = [personNode(), websiteNode()];
  const page = pageNode(meta);
  if (page) {
    graph.push(page);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function getJsonLdGraph(pathname: string): Record<string, unknown> {
  return jsonLdFromRouteMeta(getRouteMeta(pathname));
}

export function getLlmsTxt(): string {
  const siteUrl = getSiteUrl();
  const notes = getAllNotes();
  const noteLines = notes
    .map((note) => `- [${note.frontmatter.title}](${siteUrl}/notes/${note.slug}): ${note.preview}`)
    .join("\n");
  const appLines = desktopApps
    .map((app) => `- [${app.name}](${siteUrl}${app.route})`)
    .join("\n");

  return `# ${accountInfo.name}

> ${getSiteTagline()}

The HTML for every route is generated from the same content used by the desktop apps. JavaScript is not required to read the notes, music library, or TV list.

## Notes

${noteLines}

## Apps

${appLines}

## Identity

- Site: ${siteUrl}
- Email: ${accountInfo.email}
- Profiles: ${accountInfo.sameAs.join(", ")}
`;
}
