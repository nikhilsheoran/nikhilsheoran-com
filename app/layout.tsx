import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConvexClientProvider } from "@/app/_components/convex-provider";
import { getToken } from "@/lib/auth-server";
import { accountInfo } from "@/lib/settings-data";
import { getSiteKeywords, getSiteTagline, getSiteUrl } from "@/lib/site";
import Script from "next/script";

const SITE_URL = getSiteUrl();
const siteTagline = getSiteTagline();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: accountInfo.name,
    template: `%s | ${accountInfo.name}`,
  },
  description: siteTagline,
  keywords: getSiteKeywords(),
  authors: [{ name: accountInfo.name, url: SITE_URL }],
  creator: accountInfo.name,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: accountInfo.name,
    title: accountInfo.name,
    description: siteTagline,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: accountInfo.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: accountInfo.name,
    description: siteTagline,
    images: ["/og.png"],
    creator: `@${accountInfo.twitterHandle}`,
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getToken();
  return (
    <html lang="en" className="no-js">
      <head>
        <Script id="detect-js" strategy="beforeInteractive">
          {`document.documentElement.classList.replace('no-js','js')`}
        </Script>
        <Script 
          src="https://cdn.visitors.now/v.js" 
          data-token="d502ca42-8a2f-41a4-8a35-56450cb6af1a"
        />
      </head>
      <body className={inter.variable}>
        <ConvexClientProvider initialToken={token}>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
