import { story } from "@/lib/journey/story";
import { accountInfo } from "@/lib/settings-data";

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  }
  return url;
}

export function getCanonicalUrl(pathname: string): string {
  const siteUrl = getSiteUrl();
  return pathname === "/" ? siteUrl : `${siteUrl}${pathname}`;
}

export function getSiteTagline(): string {
  return `I'm ${accountInfo.name.split(" ")[0]}. ${story.tagline} Scroll through my story, then use the Mac on my desk.`;
}

/** The picture links to the site unfurl with: the opening view of the room. */
export const socialImage = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: `${accountInfo.name} at his desk in a sunlit studio above the city`,
} as const;

export function getSiteKeywords(): string[] {
  return [
    accountInfo.name,
    accountInfo.alumniOf,
    accountInfo.jobTitle.toLowerCase(),
    "personal website",
  ];
}
