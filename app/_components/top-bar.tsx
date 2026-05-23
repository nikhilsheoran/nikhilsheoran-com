"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import wifiIcon from "@iconify-icons/material-symbols/wifi";
import appleFill from "@iconify-icons/ri/apple-fill";
import { formatTopBarDate, formatTopBarTime } from "@/lib/date-time";
import { useClock } from "@/lib/use-clock";
import styles from "./top-bar.module.css";
import { CCMIcon } from "./top-bar/top-bar-icons";
import {
  BatteryIndicator,
  AppleMenuPanel,
  AppMenuPanel,
  WiFiPanel,
  ControlCenterPanel,
} from "./top-bar/top-bar-panels";

// ─────────────────────────────────────────────────────────────────────────────
// Panel type
// ─────────────────────────────────────────────────────────────────────────────
type PanelId =
  | "apple"
  | "app-file"
  | "app-edit"
  | "app-view"
  | "app-window"
  | "app-help"
  | "wifi"
  | "control-center"
  | null;

// ─────────────────────────────────────────────────────────────────────────────
// TopBar — main export
// ─────────────────────────────────────────────────────────────────────────────
interface TopBarProps {
  activeAppName?: string;
  onOpenSettings?: () => void;
  onOpenAbout?: () => void;
  onCloseActiveWindow?: () => void;
  nowPlaying?: { title: string; artist: string; artworkUrl: string; isPlaying: boolean } | null;
  onMusicPrev?: () => void;
  onMusicNext?: () => void;
  onMusicToggle?: () => void;
}

const menuItems = ["File", "Edit", "View", "Window", "Help"] as const;
const menuIdMap: Record<string, PanelId> = {
  File: "app-file",
  Edit: "app-edit",
  View: "app-view",
  Window: "app-window",
  Help: "app-help",
};

export function TopBar({
  activeAppName = "Finder",
  onOpenSettings,
  onOpenAbout,
  onCloseActiveWindow,
  nowPlaying = null,
  onMusicPrev,
  onMusicNext,
  onMusicToggle,
}: TopBarProps) {
  const clock = useClock();
  const [openPanel, setOpenPanel] = useState<PanelId>(null);
  const [isHoveringMenus, setIsHoveringMenus] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuBarRef = useRef<HTMLElement>(null);
  const menuRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const togglePanel = useCallback((id: PanelId) => {
    setOpenPanel((current) => (current === id ? null : id));
  }, []);

  const [appMenuLeftOffset, setAppMenuLeftOffset] = useState(120);

  const updateAppMenuLeftOffset = useCallback((menuLabel: string) => {
    const el = menuRefs.current[menuLabel];
    setAppMenuLeftOffset(el ? el.getBoundingClientRect().left : 120);
  }, []);

  const closePanel = useCallback(() => {
    setOpenPanel(null);
    setIsHoveringMenus(false);
  }, []);

  // Handle Apple menu actions
  const handleAppleAction = useCallback(
    (action: string) => {
      closePanel();
      if (action === "settings" && onOpenSettings) onOpenSettings();
      if (action === "about" && onOpenAbout) onOpenAbout();
    },
    [closePanel, onOpenAbout, onOpenSettings],
  );

  // Close on Escape
  useEffect(() => {
    if (!openPanel) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openPanel, closePanel]);

  // Which menu-bar app items are "active" (for hover-to-switch)
  const isAppMenuOpen = openPanel?.startsWith("app-") ?? false;

  const handleMenuHover = useCallback(
    (menuLabel: string) => {
      if (!isAppMenuOpen && openPanel !== "apple") return;
      const panelId = menuIdMap[menuLabel];
      if (panelId) {
        updateAppMenuLeftOffset(menuLabel);
        setOpenPanel(panelId);
      }
    },
    [isAppMenuOpen, openPanel, updateAppMenuLeftOffset],
  );

  const handleAppleHover = useCallback(() => {
    if (isAppMenuOpen) setOpenPanel("apple");
  }, [isAppMenuOpen]);

  const activeAppMenuLabel = openPanel?.startsWith("app-")
    ? openPanel.replace("app-", "").charAt(0).toUpperCase() + openPanel.replace("app-", "").slice(1)
    : null;

  return (
    <>
      <header
        ref={menuBarRef}
        id="menu-bar"
        className="fixed inset-x-0 top-0 z-50 h-8 bg-gray-700/10 px-2 text-white shadow-sm backdrop-blur-2xl"
      >
        <div className="flex h-full w-full items-center justify-between text-sm">
          {/* ── Left: Apple logo + App name + menus ────────────── */}
          <div className="flex cursor-default items-center gap-1">
            <span
              className={`${styles.menuLabel} ${openPanel === "apple" ? styles.menuLabelActive : ""}`}
              onClick={() => togglePanel("apple")}
              onMouseEnter={handleAppleHover}
            >
              <Icon icon={appleFill} className="text-base" />
            </span>
            <span className="topbar-item px-2 font-semibold tracking-[0.01em]">
              {activeAppName}
            </span>
            {menuItems.map((item) => (
              <span
                key={item}
                ref={(el) => { menuRefs.current[item] = el; }}
                className={`${styles.menuLabel} text-white/95 ${
                  activeAppMenuLabel === item ? styles.menuLabelActive : ""
                }`}
                onClick={() => {
                  updateAppMenuLeftOffset(item);
                  togglePanel(menuIdMap[item]!);
                }}
                onMouseEnter={() => handleMenuHover(item)}
              >
                {item}
              </span>
            ))}
          </div>

          {/* ── Right: Battery, Wi-Fi, CCM, Clock ─────────────── */}
          <div className="flex cursor-default items-center gap-2">
            <BatteryIndicator />
            <span
              className={`${styles.topbarBtn} px-1 ${openPanel === "wifi" ? styles.topbarBtnActive : ""}`}
              onClick={() => togglePanel("wifi")}
            >
              <Icon icon={wifiIcon} className="text-lg" />
            </span>
            <span
              className={`${styles.topbarBtn} px-1 ${openPanel === "control-center" ? styles.topbarBtnActive : ""}`}
              onClick={() => togglePanel("control-center")}
            >
              <CCMIcon size={16} />
            </span>
            <span className="topbar-item gap-1 px-2 tracking-[0.01em]">
              <span>{formatTopBarDate(clock)}</span>
              <span>{formatTopBarTime(clock)}</span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Panel backdrop + active panel ─────────────────────── */}
      {openPanel && (
        <div className={styles.panelBackdrop} onClick={closePanel}>
          <div onClick={(e) => e.stopPropagation()}>
            {openPanel === "apple" && (
              <AppleMenuPanel onAction={handleAppleAction} />
            )}
            {openPanel.startsWith("app-") && activeAppMenuLabel && (
              <AppMenuPanel
                menuId={activeAppMenuLabel}
                leftOffset={appMenuLeftOffset}
                onClose={() => {
                  closePanel();
                  onCloseActiveWindow?.();
                }}
              />
            )}
            {openPanel === "wifi" && <WiFiPanel />}
            {openPanel === "control-center" && (
              <ControlCenterPanel
                nowPlaying={nowPlaying}
                onMusicPrev={onMusicPrev}
                onMusicNext={onMusicNext}
                onMusicToggle={onMusicToggle}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
