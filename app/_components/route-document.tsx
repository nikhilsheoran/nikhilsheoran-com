import type { ComponentProps, ReactNode } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { desktopApps, isDesktopAppId } from "@/lib/desktop-apps";
import { getAllNotes, getNoteBySlug } from "@/lib/content";
import { DEFAULT_NOTE_SLUG } from "@/lib/desktop-path";
import { albums, artists, frequentlyPlayedIds, homeFeatured, songById } from "@/lib/music-data";
import { homeFeatured as tvFeatured, itemById, movies, recentlyWatchedIds, shows } from "@/lib/tv-data";
import { getFileSystem, type FSNode } from "@/lib/virtual-fs";
import { jsonLdFromRouteMeta } from "@/lib/json-ld";
import { getRouteMeta, type RouteMeta } from "@/lib/route-meta";
import { accountInfo } from "@/lib/settings-data";
import { JsonLd } from "@/app/_components/json-ld";
import { Socials } from "@/app/_components/shared/mdx-components";
import styles from "./route-document.module.css";

const mdxComponents = {
  h1: (props: ComponentProps<"h1">) => <h1 {...props} />,
  h2: (props: ComponentProps<"h2">) => <h2 {...props} />,
  h3: (props: ComponentProps<"h3">) => <h3 {...props} />,
  a: (props: ComponentProps<"a">) => (
    <a {...props} rel={props.href?.startsWith("/") ? undefined : "noopener noreferrer"} />
  ),
  img: (props: ComponentProps<"img">) => (
    <img {...props} alt={props.alt ?? ""} />
  ),
  Socials,
};

function SiteNav() {
  return (
    <nav className={styles.nav} aria-label="Site">
      <a href="/">Home</a>
      {desktopApps.map((app) => (
        <a key={app.id} href={app.route}>
          {app.name}
        </a>
      ))}
    </nav>
  );
}

function NotesIndex() {
  const notes = getAllNotes();
  return (
    <ul className={styles.list}>
      {notes.map((note) => (
        <li key={note.slug}>
          <a href={`/notes/${note.slug}`}>{note.frontmatter.title}</a>
          {note.preview ? <span className={styles.meta}> — {note.preview}</span> : null}
        </li>
      ))}
    </ul>
  );
}

async function NotesDocument({ slug }: { slug: string }) {
  const note = getNoteBySlug(slug);
  if (!note) {
    return (
      <>
        <h1 className={styles.title}>Note not found</h1>
        <p>That note is not in this library.</p>
        <h2>All notes</h2>
        <NotesIndex />
      </>
    );
  }

  return (
    <>
      <p className={styles.meta}>{note.dateLabel}</p>
      <h1 className={styles.title}>{note.frontmatter.title}</h1>
      <div className={styles.article}>
        <MDXRemote source={note.content} components={mdxComponents} />
      </div>
      <section className={styles.section}>
        <h2>More notes</h2>
        <NotesIndex />
      </section>
    </>
  );
}

function MusicDocument({ title, description }: { title: string; description: string }) {
  const frequent = frequentlyPlayedIds
    .map((id) => songById[id])
    .filter((song): song is NonNullable<typeof song> => Boolean(song));

  return (
    <>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lede}>{description}</p>

      <section className={styles.section}>
        <h2>Featured</h2>
        <ul className={styles.list}>
          {homeFeatured.map((pick) => (
            <li key={pick.albumId}>
              {pick.label}: {pick.title}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Frequently played</h2>
        <ul className={styles.list}>
          {frequent.map((song) => (
            <li key={song.id}>
              {song.title} — {song.artist}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Albums</h2>
        <ul className={styles.list}>
          {albums.map((album) => (
            <li key={album.id}>
              {album.title} — {album.artist} ({album.year})
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Artists</h2>
        <ul className={styles.list}>
          {artists.map((artist) => (
            <li key={artist.id}>{artist.name}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

function TVDocument({ title, description }: { title: string; description: string }) {
  const recent = recentlyWatchedIds
    .map((id) => itemById[id])
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lede}>{description}</p>

      <section className={styles.section}>
        <h2>Featured</h2>
        <ul className={styles.list}>
          {tvFeatured.map((pick) => (
            <li key={pick.itemId}>
              {pick.label}: {pick.title}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Recently watched</h2>
        <ul className={styles.list}>
          {recent.map((item) => (
            <li key={item.id}>
              {item.title} ({item.year})
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Shows</h2>
        <ul className={styles.list}>
          {shows.map((show) => (
            <li key={show.id}>
              <strong>{show.title}</strong> ({show.year}
              {show.endYear ? `-${show.endYear}` : ""}) — {show.synopsis}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Movies</h2>
        <ul className={styles.list}>
          {movies.map((movie) => (
            <li key={movie.id}>
              <strong>{movie.title}</strong> ({movie.year}) — {movie.synopsis}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function FileTree({ node }: { node: FSNode }) {
  if (node.kind === "file") {
    return (
      <li>
        {node.route ? <a href={node.route}>{node.name}</a> : node.name}
        {node.fileKind ? <span className={styles.meta}> — {node.fileKind}</span> : null}
      </li>
    );
  }

  return (
    <li>
      {node.name}
      {node.children.length > 0 ? (
        <ul className={styles.list}>
          {node.children.map((child) => (
            <FileTree key={child.path} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function FinderDocument({ title, description }: { title: string; description: string }) {
  const root = getFileSystem();
  return (
    <>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lede}>{description}</p>
      <ul className={styles.list}>
        {root.children.map((child) => (
          <FileTree key={child.path} node={child} />
        ))}
      </ul>
    </>
  );
}

function SettingsDocument({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lede}>{description}</p>
      <p>
        Contact{" "}
        <a href={`mailto:${accountInfo.email}`}>{accountInfo.email}</a>
        {" "}or{" "}
        <a href={accountInfo.twitterUrl}>@{accountInfo.twitterHandle}</a>.
      </p>
    </>
  );
}

function DocumentBody({ meta }: { meta: RouteMeta }): ReactNode {
  const { appId, noteSlug, title, description } = meta;

  if (!isDesktopAppId(appId)) {
    return (
      <>
        <h1 className={styles.title}>{title}</h1>
        <p>{description}</p>
        <NotesIndex />
      </>
    );
  }

  switch (appId) {
    case "notes":
      return <NotesDocument slug={noteSlug ?? DEFAULT_NOTE_SLUG} />;
    case "music":
      return <MusicDocument title={title} description={description} />;
    case "tv":
      return <TVDocument title={title} description={description} />;
    case "finder":
      return <FinderDocument title={title} description={description} />;
    case "system-settings":
      return <SettingsDocument title={accountInfo.name} description={description} />;
    default: {
      const _exhaustive: never = appId;
      return _exhaustive;
    }
  }
}

export async function RouteDocument({ pathname }: { pathname: string }) {
  const meta = getRouteMeta(pathname);

  return (
    <main className={`route-document ${styles.document}`}>
      <JsonLd data={jsonLdFromRouteMeta(meta)} />
      <SiteNav />
      <DocumentBody meta={meta} />
    </main>
  );
}
