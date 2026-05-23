"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-base" aria-hidden>
                <path d="M11.673 7.222c-.876 0-2.232-.996-3.66-.96c-1.884.024-3.612 1.092-4.584 2.784c-1.956 3.396-.504 8.412 1.404 11.172c.936 1.344 2.04 2.856 3.504 2.808c1.404-.06 1.932-.912 3.636-.912c1.692 0 2.172.912 3.66.876c1.512-.024 2.472-1.368 3.396-2.724c1.068-1.56 1.512-3.072 1.536-3.156c-.036-.012-2.94-1.128-2.976-4.488c-.024-2.808 2.292-4.152 2.4-4.212c-1.32-1.932-3.348-2.148-4.056-2.196c-1.848-.144-3.396 1.008-4.26 1.008Zm3.12-2.832c.78-.936 1.296-2.244 1.152-3.54c-1.116.048-2.46.744-3.264 1.68c-.72.828-1.344 2.16-1.176 3.432c1.236.096 2.508-.636 3.288-1.572Z"/>
              </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-lg" aria-hidden>
                <path d="M12 21q-1.05 0-1.775-.725T9.5 18.5q0-1.05.725-1.775T12 16q1.05 0 1.775.725T14.5 18.5q0 1.05-.725 1.775T12 21Zm-5.65-5.65l-2.1-2.15q1.475-1.475 3.463-2.337T12 10q2.3 0 4.288.875t3.462 2.375l-2.1 2.1q-1.1-1.1-2.55-1.725T12 13q-1.65 0-3.1.625T6.35 15.35ZM2.1 11.1L0 9q2.3-2.35 5.375-3.675T12 4q3.55 0 6.625 1.325T24 9l-2.1 2.1q-1.925-1.925-4.463-3.013T12 7Q9.1 7 6.562 8.088T2.1 11.1Z"/>
              </svg>
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
