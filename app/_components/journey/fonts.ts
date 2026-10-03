import { Newsreader } from "next/font/google";

/** The serif used for the titles on the glass cards. */
export const journeySerif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  variable: "--font-journey-serif",
  display: "swap",
});
