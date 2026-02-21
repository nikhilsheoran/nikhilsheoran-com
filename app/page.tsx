"use client";

import { useEffect, useRef, useState } from "react";
import useRaf from "@rooks/use-raf";
import { Icon } from "@iconify/react";
import appleFill from "@iconify-icons/ri/apple-fill";
import batteryIcon from "@iconify-icons/bi/battery";
import lightningIcon from "@iconify-icons/bi/lightning-charge-fill";
import wifiIcon from "@iconify-icons/material-symbols/wifi";
import {
  motion,
  type MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useBattery } from "@/lib/use-battery";

const dockApps = [
  { name: "Finder", icon: "/icons/finder.png", running: true },
  { name: "Notes", icon: "/icons/notes.png", running: true },
  { name: "Messages", icon: "/icons/messages.png", running: true },
  { name: "Music", icon: "/icons/music.png", running: true },
  { name: "TV", icon: "/icons/tv.png", running: false },
] as const;
const menuItems = ["File", "Edit", "View", "Window", "Help"] as const;

const DOCK_BASE_SIZE = 60;
const DOCK_MAG = 2;

function CCMIcon({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 29 29"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path d="M7.5,13h14a5.5,5.5,0,0,0,0-11H7.5a5.5,5.5,0,0,0,0,11Zm0-9h14a3.5,3.5,0,0,1,0,7H7.5a3.5,3.5,0,0,1,0-7Zm0,6A2.5,2.5,0,1,0,5,7.5,2.5,2.5,0,0,0,7.5,10Zm14,6H7.5a5.5,5.5,0,0,0,0,11h14a5.5,5.5,0,0,0,0-11Zm1.43439,8a2.5,2.5,0,1,1,2.5-2.5A2.5,2.5,0,0,1,22.93439,24Z" />
    </svg>
  );
}

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

function BatteryIndicator() {
  const batteryState = useBattery();

  const width = 0.1 + batteryState.level * 0.96;
  const colorClass = batteryState.charging
    ? "bg-green-400"
    : batteryState.level < 0.2
      ? "bg-red-500"
      : batteryState.level < 0.5
        ? "bg-yellow-500"
        : "bg-white";

  return (
    <span className="topbar-item gap-2 px-2">
      <span className="text-xs">{(batteryState.level * 100).toFixed()}%</span>
      <span className="relative flex items-center">
        <Icon icon={batteryIcon} className="text-2xl" />
        <span className={`battery-level ${colorClass}`} style={{ width: `${width}rem` }} />
        {batteryState.charging ? (
          <Icon
            icon={lightningIcon}
            className="absolute inset-0 m-auto -translate-x-0.5 text-xs"
          />
        ) : null}
      </span>
    </span>
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
        <div className="h-full w-full flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 cursor-default">
            <span className="topbar-item px-2">
              <Icon icon={appleFill} className="text-base" />
            </span>
            <span className="topbar-item font-semibold tracking-[0.01em] px-2">
              Finder
            </span>
            {menuItems.map((item) => (
              <span key={item} className="topbar-item text-white/95 px-2">
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 cursor-default">
            <BatteryIndicator />
            <span className="topbar-item px-1">
              <Icon icon={wifiIcon} className="text-lg" />
            </span>
            <span className="topbar-item px-1">
              <CCMIcon size={16} />
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
