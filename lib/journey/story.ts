/** Content is adapted from content/notes/about-me.mdx. Artwork is intentionally provisional. */
export const chapters = [
  {
    year: "2022",
    title: "A little curiosity.",
    name: "The beginning",
    subtitle: "Making videos. Playing with game engines. Finding out I like building things.",
    detail: "From wanting to be a pilot to studying at BITS Goa, and discovering a different kind of making.",
    image: "/nikhil-about.jpg",
    accent: "#6a8f7b",
    note: "old-website-intro",
  },
  {
    year: "2023",
    title: "From cuts to code.",
    name: "Media Groww & FastCut",
    subtitle: "A video editing service became the starting point for an AI video editor.",
    detail: "Built Media Groww with Jeet, then FastCut with Harsh. 13k+ users across 38 countries.",
    image: "/22-feb.jpg",
    accent: "#a26546",
    note: "about-me",
  },
  {
    year: "2024",
    title: "Building for good.",
    name: "SpotTheScam",
    subtitle: "A Goa Police hackathon, a winning idea, and a tool to help people spot scams.",
    detail: "An experiment at college became something used beyond it. A new reason to keep building.",
    image: "/nikhil.jpg",
    accent: "#527da1",
    note: "about-me",
  },
  {
    year: "2025",
    title: "Finding my footing.",
    name: "Ponder",
    subtitle: "My first job as a founding engineer. A short chapter with a lot to learn.",
    detail: "Joined Ponder, worked remotely, and started figuring out what I wanted to do next.",
    image: "/nikhil-about.jpg",
    accent: "#8c6f9e",
    note: "about-me",
  },
  {
    year: "2026",
    title: "Another bet on myself.",
    name: "Backdoor",
    subtitle: "Building an AI agent to help people land interviews with early-stage startups.",
    detail: "Started Backdoor with Sarvagya. Still curious. Still making things.",
    image: "/22-feb.jpg",
    accent: "#457b65",
    note: "about-me",
  },
] as const;

export type Chapter = (typeof chapters)[number];

export const STORY_END = 0.84;
export const LAPTOP_POSITION: [number, number, number] = [0, 1.63, -0.13];
export const SCREEN_TILT = -0.18;
// Center of the display plane, including the lid's tilt and local screen offset.
export const SCREEN_POSITION: [number, number, number] = [
  0,
  LAPTOP_POSITION[1] + .38 + .018 * Math.cos(SCREEN_TILT) - .019 * Math.sin(SCREEN_TILT),
  LAPTOP_POSITION[2] - .395 + .018 * Math.sin(SCREEN_TILT) + .019 * Math.cos(SCREEN_TILT),
];

export function chapterProgress(index: number) {
  return 0.13 + (index / (chapters.length - 1)) * 0.61;
}

export function activeChapter(progress: number) {
  if (progress > STORY_END) return -2;
  if (progress < 0.075) return -1;
  return Math.min(chapters.length - 1, Math.max(0, Math.round(((progress - 0.13) / 0.61) * (chapters.length - 1))));
}
