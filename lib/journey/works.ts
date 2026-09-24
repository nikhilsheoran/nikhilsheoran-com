import data from "@/content/journey/works.json";

/** A piece of work printed on one cloth panel. Edit content/journey/works.json. */
export interface Work {
  slug: string;
  year: string;
  date: string | null;
  kind: "youtube" | "x" | "web";
  url: string;
  image: string;
  title: string;
  subtitle: string;
}

/** Chronological. Regenerate artwork with `bun scripts/works/build.ts`. */
export const works: Work[] = (data as Work[]).map(
  ({ slug, year, date, kind, url, image, title, subtitle }) => ({
    slug,
    year,
    date,
    kind,
    url,
    image,
    title,
    subtitle,
  }),
);

/** First chapter index for each year, for the timeline's year buttons. */
export function yearStops(list: readonly Work[]) {
  const stops: { year: string; index: number }[] = [];
  list.forEach((work, index) => {
    if (!stops.some((stop) => stop.year === work.year))
      stops.push({ year: work.year, index });
  });
  return stops;
}
