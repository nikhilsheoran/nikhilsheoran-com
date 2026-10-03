import data from "@/content/journey/works.json";

/** A piece of work printed on one cloth panel. Edit content/journey/works.json. */
export interface Work {
  slug: string;
  year: string;
  date: string | null;
  /** How old Nikhil was; the story is told in ages. */
  age: number;
  kind: "youtube" | "x" | "web";
  url: string;
  image: string;
  title: string;
  subtitle: string;
}

/**
 * Chronological, one work per year so the panels match the timeline. Entries
 * marked "hidden" in the JSON are kept for later but not shown. Regenerate
 * artwork with `bun scripts/works/build.ts`.
 */
export const works: Work[] = (data as (Work & { hidden?: boolean })[])
  .filter((work) => !work.hidden)
  .map(
  ({ slug, year, date, age, kind, url, image, title, subtitle }) => ({
    slug,
    year,
    date,
    age,
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
