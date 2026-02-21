"use client";

import Image from "next/image";
import { Dock } from "@/app/_components/dock";
import { TopBar } from "@/app/_components/top-bar";
import { useMediaQuery } from "@/lib/use-media-query";

export default function Home() {
  const isMobile = useMediaQuery("(max-width: 639px)");

  return (
    <div className="fixed inset-0 select-none">
      <Image
        src="/wallpapers/Sonoma.jpeg"
        alt="Background"
        fill
        className="-z-10 inset-0 object-cover"
      />
      <TopBar />
      <Dock disableMagnification={isMobile} />
    </div>
  );
}
