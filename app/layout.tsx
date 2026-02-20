import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Nikhil Sheoran",
  description: `Welcome to my personal website!`,
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head suppressHydrationWarning>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="07e351bf-9dbc-48c7-8b2c-b8d2434fae1b"
        ></script>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
