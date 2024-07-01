import { ThemeProvider } from "@/app/components/theme-provider";
import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Image from "next/image";
import { ModeToggle } from "@/app/components/ui/mode-toggle";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import {
  BoxIcon,
  BrushIcon,
  Code2Icon,
  SchoolIcon,
  VideoIcon,
} from "lucide-react";
import SocialIcons from "@/app/components/SocialIcons";

const Satoshi = localFont({
  src: "../public/fonts/Satoshi-Variable.ttf",
});

export const metadata: Metadata = {
  title: "Nikhil Sheoran",
  description: `I'm a 17-year-old student pursuing an Electronics and Communication engineering degree at BITS Goa.
  Currently, I'm working on two projects: Media Groww and FastCut.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <head suppressHydrationWarning>
          <script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id="07e351bf-9dbc-48c7-8b2c-b8d2434fae1b"
          ></script>
        </head>
        <body className={Satoshi.className}>
          <main className="lg:max-w-7xl mx-auto bg-white dark:bg-black border-r border-l min-h-screen">
            <div className="w-full flex justify-between p-4">
              <div />
              <Navbar />
              <ModeToggle />
            </div>
            <div className="w-full p-4">
              <div className="w-full flex flex-col gap-4 max-w-2xl lg:max-w-5xl mx-auto">
                <div className="relative w-12 xl:w-16 rounded-full overflow-clip">
                  <Image
                    src={`/images/nikhil.jpeg`}
                    alt={`nikhil-image`}
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="text-xl sm:text-2xl xl:text-3xl font-bold">
                    Nikhil Sheoran
                  </div>
                  <div className="text-md sm:text-lg xl:text-xl text-secondary-foreground">
                    Founder & Designer
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={"http://github.com/nikhilsheoran"}
                    target="_blank"
                  >
                    <div className="flex gap-1 items-center py-0.5 px-1.5 text-[12px] rounded-full border text-red-600 border-red-600 bg-red-600/10">
                      <Code2Icon size={16} />
                      <div className="font-medium">Tech Enthusiast</div>
                    </div>
                  </Link>
                  <Link
                    href={"https://www.youtube.com/watch?v=oawuPeaBOMc"}
                    target="_blank"
                  >
                    <div className="flex gap-1 items-center py-0.5 px-1.5 text-[12px] rounded-full border text-blue-600 border-blue-600 bg-blue-600/10">
                      <SchoolIcon size={16} />
                      <div className="font-medium">Student</div>
                    </div>
                  </Link>
                  <Link
                    href={"https://www.youtube.com/shorts/9BAOak6PotE"}
                    target="_blank"
                  >
                    <div className="flex gap-1 items-center py-0.5 px-1.5 text-[12px] rounded-full border text-green-600 border-green-600 bg-green-600/10">
                      <BoxIcon size={16} />
                      <div className="font-medium">SpeedCuber</div>
                    </div>
                  </Link>
                  <Link href={"/"}>
                    <div className="flex gap-1 items-center py-0.5 px-1.5 text-[12px] rounded-full border text-yellow-600 border-yellow-600 bg-yellow-600/10">
                      <BrushIcon size={16} />
                      <div className="font-medium">Designer</div>
                    </div>
                  </Link>
                  <Link href={"/"}>
                    <div className="flex gap-1 items-center py-0.5 px-1.5 text-[12px] rounded-full border text-orange-600 border-orange-600 bg-orange-600/10">
                      <VideoIcon size={16} />
                      <div className="font-medium">Video Editor</div>
                    </div>
                  </Link>
                </div>
                <SocialIcons />
              </div>
            </div>
            <div className="w-full p-4">{children}</div>
          </main>
        </body>
      </ThemeProvider>
    </html>
  );
}
