import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Nikhil Sheoran",
  description: "Welcome to my personal website!",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className={inter.className}>
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="07e351bf-9dbc-48c7-8b2c-b8d2434fae1b"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
