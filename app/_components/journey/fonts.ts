import { IBM_Plex_Mono, Newsreader } from "next/font/google";

/** Title-card serif for the lines that matter. */
export const journeySerif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  variable: "--font-journey-serif",
  display: "swap",
});

/** Flight-log mono for stamps, ticks and controls. */
export const journeyMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-journey-mono",
  display: "swap",
});
