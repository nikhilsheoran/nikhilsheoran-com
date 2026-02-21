"use client";

import { useEffect, useRef, useState } from "react";
import useRaf from "@rooks/use-raf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import {
  motion,
  type MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";

const dockApps = [
  { name: "Finder", icon: "/icons/finder.png", running: true },
  { name: "Notes", icon: "/icons/notes.png", running: true },
  { name: "Messages", icon: "/icons/messages.png", running: true },
  { name: "Music", icon: "/icons/music.png", running: true },
  { name: "TV", icon: "/icons/tv.png", running: false },
] as const;
const menuItems = ["File", "Edit", "View", "Window", "Help"] as const;

const DOCK_BASE_SIZE = 50;
const DOCK_MAG = 2;

function formatTopBarDate(date: Date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday} ${month} ${date.getDate()}`;
}

function formatTopBarTime(date: Date) {
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return time;
}

function useDockHoverAnimation(
  mouseX: MotionValue<number | null>,
  imgRef: React.RefObject<HTMLImageElement>,
  dockSize: number,
  dockMag: number,
) {
  const distanceLimit = dockSize * 6;
  const distanceInput = [
    -distanceLimit,
    -distanceLimit / (dockMag * 0.65),
    -distanceLimit / (dockMag * 0.85),
    0,
    distanceLimit / (dockMag * 0.85),
    distanceLimit / (dockMag * 0.65),
    distanceLimit,
  ];
  const widthOutput = [
    dockSize,
    dockSize * (dockMag * 0.55),
    dockSize * (dockMag * 0.75),
    dockSize * dockMag,
    dockSize * (dockMag * 0.75),
    dockSize * (dockMag * 0.55),
    dockSize,
  ];

  const beyondDistanceLimit = distanceLimit + 1;
  const distance = useMotionValue(beyondDistanceLimit);
  const widthPx = useSpring(useTransform(distance, distanceInput, widthOutput), {
    stiffness: 1700,
    damping: 90,
  });
  const width = useTransform(widthPx, (value) => `${value}px`);

  useRaf(() => {
    const el = imgRef.current;
    const mouseXValue = mouseX.get();

    if (el && mouseXValue !== null) {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      distance.set(mouseXValue - centerX);
      return;
    }

    distance.set(beyondDistanceLimit);
  }, true);

  return { width };
}

type DockApp = (typeof dockApps)[number];

function DockItem({
  app,
  mouseX,
  disableMagnify,
}: {
  app: DockApp;
  mouseX: MotionValue<number | null>;
  disableMagnify: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const { width } = useDockHoverAnimation(mouseX, imgRef, DOCK_BASE_SIZE, DOCK_MAG);

  return (
    <li className="dock-item relative flex flex-col justify-end mb-1">
      <p className="dock-tooltip">{app.name}</p>
      <motion.img
        ref={imgRef}
        src={app.icon}
        alt={app.name}
        draggable={false}
        style={
          disableMagnify
            ? { width: `${DOCK_BASE_SIZE}px` }
            : { width, willChange: "width" }
        }
        className="h-auto"
      />
      {app.running ? (
        <span className="h-1 w-1 mx-auto rounded-full bg-gray-800" />
      ) : (
        <span className="h-1 w-1 mx-auto invisible" />
      )}
    </li>
  );
}

export default function Home() {
  const dockMouseX = useMotionValue<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClock(new Date());
    }, 1000 * 60);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div className="fixed inset-0 select-none">
      <Image
        src="/wallpapers/Sonoma.jpeg"
        alt="Background"
        fill
        className="object-cover -z-10 inset-0"
      />
      <header
        id="menu-bar"
        className="fixed top-0 inset-x-0 z-50 h-8 px-2 bg-gray-700/10 backdrop-blur-2xl text-white shadow-sm"
      >
        <div className="h-full mx-auto flex max-w-[1440px] items-center justify-between text-sm">
          <div className="flex items-center gap-1 cursor-default">
            <span className="topbar-item px-2">
              <FontAwesomeIcon icon={faApple} width={15} height={15} />
            </span>
            <span className="topbar-item topbar-item-active font-semibold tracking-[0.01em] px-2">
              Finder
            </span>
            {menuItems.map((item) => (
              <span key={item} className="topbar-item text-white/95 px-2">
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 cursor-default">
            <span className="topbar-item px-1">
              <Image src="/icons/battery.svg" alt="Battery" width={22} height={22} />
            </span>
            <span className="topbar-item px-1">
              <Image src="/icons/wifi.svg" alt="WiFi" width={16} height={16} />
            </span>
            <span className="topbar-item px-1">
              <Image
                src="/icons/control-center.svg"
                alt="Control Center"
                width={14}
                height={14}
              />
            </span>
            <span className="topbar-item gap-1 px-2 tracking-[0.01em]">
              <span>{formatTopBarDate(clock)}</span>
              <span>{formatTopBarTime(clock)}</span>
            </span>
          </div>
        </div>
      </header>

      <div
        className="dock-shell fixed inset-x-0 mx-auto bottom-1 z-[60] w-full sm:w-max overflow-x-auto sm:overflow-visible"
      >
        <ul
          className="dock-list flex items-end space-x-2 px-2"
          style={{ height: `${DOCK_BASE_SIZE + 15}px` }}
          onMouseMove={(event) => {
            if (isMobile) return;
            dockMouseX.set(event.nativeEvent.x);
          }}
          onMouseLeave={() => dockMouseX.set(null)}
        >
          {dockApps.map((app) => (
            <DockItem
              key={app.name}
              app={app}
              mouseX={dockMouseX}
              disableMagnify={isMobile}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
