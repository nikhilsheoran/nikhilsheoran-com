/**
 * The words of the journey that are not tied to one work: the line under the
 * name and the opening card. Kept here, beside works.json, so the 3D overlay
 * and the server-rendered document (what crawlers and agents read) print the
 * same text from one place.
 */
export const story = {
  tagline: "I love playing with tech, and my dream is to produce a movie someday.",
  intro: {
    tag: "Hello, I’m Nikhil.",
    title: "Welcome home",
    line: "Scroll or drag to see the journey of my life. The Mac on my desk is interactive, by the way.",
  },
} as const;
