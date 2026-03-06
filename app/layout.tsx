import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConvexClientProvider } from "@/app/_components/convex-provider";
import { getToken } from "@/lib/auth-server";

const SITE_URL = "https://nikhilsheoran.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nikhil Sheoran",
    template: "%s | Nikhil Sheoran",
  },
  description:
    "Nikhil Sheoran — builder, student at BITS Pilani, working on MediaGroww, FastCutAI, and more. Personal website as a macOS desktop.",
  keywords: ["Nikhil Sheoran", "BITS Pilani", "developer", "MediaGroww", "FastCutAI", "personal website"],
  authors: [{ name: "Nikhil Sheoran", url: SITE_URL }],
  creator: "Nikhil Sheoran",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Nikhil Sheoran",
    title: "Nikhil Sheoran",
    description:
      "Nikhil Sheoran — builder, student at BITS Pilani, working on MediaGroww, FastCutAI, and more.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Nikhil Sheoran",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nikhil Sheoran",
    description:
      "Nikhil Sheoran — builder, student at BITS Pilani, working on MediaGroww, FastCutAI, and more.",
    images: ["/og.png"],
    creator: "@nikhilsheoran",
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
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getToken();
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider initialToken={token}>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
