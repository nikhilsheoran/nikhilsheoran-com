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
  return `Personal website of ${accountInfo.name}, ${accountInfo.jobTitle.toLowerCase()} and ${accountInfo.alumniOf} alum. Presented as a macOS desktop.`;
}

export function getSiteKeywords(): string[] {
  return [
    accountInfo.name,
    accountInfo.alumniOf,
    accountInfo.jobTitle.toLowerCase(),
    "personal website",
  ];
}
