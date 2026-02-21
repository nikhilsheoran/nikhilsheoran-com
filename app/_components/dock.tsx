"use client";

import { useRef, type RefObject } from "react";
import {
  motion,
  type MotionValue,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

const dockApps = [
  { name: "Finder", icon: "/icons/finder.png", running: true },
  { name: "Notes", icon: "/icons/notes.png", running: true },
  { name: "Messages", icon: "/icons/messages.png", running: true },
  { name: "Music", icon: "/icons/music.png", running: true },
  { name: "TV", icon: "/icons/tv.png", running: false },
] as const;

const DOCK_BASE_SIZE = 60;
const DOCK_MAGNIFICATION = 2;

type DockApp = (typeof dockApps)[number];

function useDockHoverAnimation(
  mouseX: MotionValue<number | null>,
  imgRef: RefObject<HTMLImageElement>,
  dockSize: number,
  dockMagnification: number,
) {
  const distanceLimit = dockSize * 6;
  const distanceInput = [
    -distanceLimit,
    -distanceLimit / (dockMagnification * 0.65),
    -distanceLimit / (dockMagnification * 0.85),
    0,
    distanceLimit / (dockMagnification * 0.85),
    distanceLimit / (dockMagnification * 0.65),
    distanceLimit,
  ];
  const widthOutput = [
    dockSize,
    dockSize * (dockMagnification * 0.55),
    dockSize * (dockMagnification * 0.75),
    dockSize * dockMagnification,
    dockSize * (dockMagnification * 0.75),
    dockSize * (dockMagnification * 0.55),
    dockSize,
  ];

  const beyondDistanceLimit = distanceLimit + 1;
  const distance = useMotionValue(beyondDistanceLimit);
  const widthPx = useSpring(useTransform(distance, distanceInput, widthOutput), {
    stiffness: 1700,
    damping: 90,
  });
  const width = useTransform(widthPx, (value) => `${value}px`);

  useAnimationFrame(() => {
    const element = imgRef.current;
    const mouseXValue = mouseX.get();

    if (!element || mouseXValue === null) {
      distance.set(beyondDistanceLimit);
      return;
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    distance.set(mouseXValue - centerX);
  });

  return { width };
}

function DockItem({
  app,
  mouseX,
  disableMagnification,
}: {
  app: DockApp;
  mouseX: MotionValue<number | null>;
  disableMagnification: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const { width } = useDockHoverAnimation(
    mouseX,
    imgRef,
    DOCK_BASE_SIZE,
    DOCK_MAGNIFICATION,
  );

  return (
    <li className="dock-item relative mb-1 flex flex-col justify-end">
      <p className="dock-tooltip">{app.name}</p>
      <motion.img
        ref={imgRef}
        src={app.icon}
        alt={app.name}
        draggable={false}
        style={
          disableMagnification
            ? { width: `${DOCK_BASE_SIZE}px` }
            : { width, willChange: "width" }
        }
        className="h-auto"
      />
      {app.running ? (
        <span className="mx-auto h-1 w-1 rounded-full bg-gray-800" />
      ) : (
        <span className="mx-auto h-1 w-1 invisible" />
      )}
    </li>
  );
}

export function Dock({
  disableMagnification,
}: {
  disableMagnification: boolean;
}) {
  const mouseX = useMotionValue<number | null>(null);

  return (
    <div className="dock-shell fixed inset-x-0 bottom-1 z-[60] mx-auto w-full overflow-x-auto sm:w-max sm:overflow-visible">
      <ul
        className="dock-list flex items-end space-x-2 px-2"
        style={{ height: `${DOCK_BASE_SIZE + 15}px` }}
        onMouseMove={(event) => {
          if (disableMagnification) {
            return;
          }

          mouseX.set(event.clientX);
        }}
        onMouseLeave={() => mouseX.set(null)}
      >
        {dockApps.map((app) => (
          <DockItem
            key={app.name}
            app={app}
            mouseX={mouseX}
            disableMagnification={disableMagnification}
          />
        ))}
      </ul>
    </div>
  );
}
