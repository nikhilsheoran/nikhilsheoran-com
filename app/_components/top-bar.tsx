"use client";

import { Icon } from "@iconify/react";
import batteryIcon from "@iconify-icons/bi/battery";
import lightningIcon from "@iconify-icons/bi/lightning-charge-fill";
import wifiIcon from "@iconify-icons/material-symbols/wifi";
import appleFill from "@iconify-icons/ri/apple-fill";
import { formatTopBarDate, formatTopBarTime } from "@/lib/date-time";
import { useBattery } from "@/lib/use-battery";
import { useClock } from "@/lib/use-clock";

const menuItems = ["File", "Edit", "View", "Window", "Help"] as const;

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

function BatteryIndicator() {
  const batteryState = useBattery();

  const width = 0.1 + batteryState.level * 0.96;
  const colorClass = batteryState.charging
    ? "bg-green-400"
    : batteryState.level < 0.2
      ? "bg-red-500"
      : batteryState.lowPowerMode
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

export function TopBar({ activeAppName = "Finder" }: { activeAppName?: string }) {
  const clock = useClock();

  return (
    <header
      id="menu-bar"
      className="fixed inset-x-0 top-0 z-50 h-8 bg-gray-700/10 px-2 text-white shadow-sm backdrop-blur-2xl"
    >
      <div className="flex h-full w-full items-center justify-between text-sm">
        <div className="flex cursor-default items-center gap-1">
          <span className="topbar-item px-2">
            <Icon icon={appleFill} className="text-base" />
          </span>
          <span className="topbar-item px-2 font-semibold tracking-[0.01em]">
            {activeAppName}
          </span>
          {menuItems.map((item) => (
            <span key={item} className="topbar-item px-2 text-white/95">
              {item}
            </span>
          ))}
        </div>

        <div className="flex cursor-default items-center gap-2">
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
  );
}
