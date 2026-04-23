"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import batteryIcon from "@iconify-icons/bi/battery";
import lightningIcon from "@iconify-icons/bi/lightning-charge-fill";
import wifiIcon from "@iconify-icons/material-symbols/wifi";
import appleFill from "@iconify-icons/ri/apple-fill";
import { formatTopBarDate, formatTopBarTime } from "@/lib/date-time";
import { useBattery } from "@/lib/use-battery";
import { useClock } from "@/lib/use-clock";
import { wifiInfo } from "@/lib/settings-data";
import styles from "./top-bar.module.css";

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
// SVG icons
// ─────────────────────────────────────────────────────────────────────────────
function CCMIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 29 29" width={size} height={size} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M7.5,13h14a5.5,5.5,0,0,0,0-11H7.5a5.5,5.5,0,0,0,0,11Zm0-9h14a3.5,3.5,0,0,1,0,7H7.5a3.5,3.5,0,0,1,0-7Zm0,6A2.5,2.5,0,1,0,5,7.5,2.5,2.5,0,0,0,7.5,10Zm14,6H7.5a5.5,5.5,0,0,0,0,11h14a5.5,5.5,0,0,0,0-11Zm1.43439,8a2.5,2.5,0,1,1,2.5-2.5A2.5,2.5,0,0,1,22.93439,24Z" />
    </svg>
  );
}

function WifiIconSm() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <path d="M7 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" fill="white" />
      <path d="M4.3 7.6a3.8 3.8 0 0 1 5.4 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1.6 5a7.2 7.2 0 0 1 10.8 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function BluetoothIconSm() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden>
      <path d="M2 3.5L8 8 5 11V1l3 3.5L2 9.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AirDropIconSm() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 12c.5-2 2-3.5 4-3.5s3.5 1.5 4 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1.5 9a9 9 0 0 1 13 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function SunIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1.1 1.1M10.1 10.1l1.1 1.1M10.1 2.8l-1.1 1.1M3.9 10.1l-1.1 1.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function SunIconLg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M11.4 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerLow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 5v4h2l3 2.5V2.5L4 5H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function SpeakerHigh() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 5v4h2l3 2.5V2.5L4 5H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9.5 5a2.8 2.8 0 0 1 0 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 3.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function StageManagerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="4" y="2" width="8" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 5v4M0.5 6v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function MirrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="4" width="8" height="4" rx="0.8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M5 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 10v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 3v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="9.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function IconPrev() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 4v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 4L6 8l6 4V4Z" fill="currentColor" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M5 3.5l8 4.5-8 4.5V3.5Z" fill="currentColor" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3.5" y="3" width="3" height="10" rx="0.8" fill="currentColor" />
      <rect x="9.5" y="3" width="3" height="10" rx="0.8" fill="currentColor" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M12.5 4v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 4l6 4-6 4V4Z" fill="currentColor" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1L1 13h12L7 1Z" stroke="#f5a623" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 5.5V9" stroke="#f5a623" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="7" cy="11" r="0.7" fill="#f5a623" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M3.5 2L7 5 3.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HotspotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 4.5a5 5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4.5 11.5a5 5 0 0 0 7 0" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Battery indicator (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
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
          <Icon icon={lightningIcon} className="absolute inset-0 m-auto -translate-x-0.5 text-xs" />
        ) : null}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────────────────────────────────────
function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`${styles.wifiToggle} ${checked ? styles.wifiToggleOn : ""}`}
      aria-label={checked ? "Enabled" : "Disabled"}
    >
      <span className={`${styles.wifiToggleThumb} ${checked ? styles.wifiToggleThumbOn : ""}`} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Apple menu panel
// ─────────────────────────────────────────────────────────────────────────────
function AppleMenuPanel({ onAction }: { onAction: (action: string) => void }) {
  return (
    <div className={`${styles.panel} ${styles.appleMenu}`}>
      <button type="button" className={styles.menuItem} onClick={() => onAction("about")}>
        <span>About This Mac</span>
      </button>
      <div className={styles.menuDivider} />
      <button type="button" className={styles.menuItem} onClick={() => onAction("settings")}>
        <span>System Settings...</span>
      </button>
      <div className={styles.menuDivider} />
      <button type="button" className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
        <span>Recent Items</span>
        <span className={styles.menuItemShortcut}><ChevronRight /></span>
      </button>
      <div className={styles.menuDivider} />
      <button type="button" className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
        <span>Force Quit...</span>
        <span className={styles.menuItemShortcut}>&#x2325;&#x2318;Esc</span>
      </button>
      <div className={styles.menuDivider} />
      <button type="button" className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
        <span>Sleep</span>
      </button>
      <button type="button" className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
        <span>Restart...</span>
      </button>
      <button type="button" className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
        <span>Shut Down...</span>
      </button>
      <div className={styles.menuDivider} />
      <button type="button" className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
        <span>Lock Screen</span>
        <span className={styles.menuItemShortcut}>&#x2303;&#x2318;Q</span>
      </button>
      <button type="button" className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
        <span>Log Out Nikhil Sheoran...</span>
        <span className={styles.menuItemShortcut}>&#x21E7;&#x2318;Q</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App menu panels (File, Edit, View, Window, Help)
// ─────────────────────────────────────────────────────────────────────────────
interface AppMenuDef {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  dividerAfter?: boolean;
}

const APP_MENUS: Record<string, AppMenuDef[]> = {
  File: [
    { label: "New Window", shortcut: "&#x2318;N", disabled: true },
    { label: "Open...", shortcut: "&#x2318;O", disabled: true },
    { dividerAfter: true, label: "", disabled: true },
    { label: "Close Window", shortcut: "&#x2318;W" },
    { label: "Close All", shortcut: "&#x2325;&#x2318;W", disabled: true },
  ],
  Edit: [
    { label: "Undo", shortcut: "&#x2318;Z", disabled: true },
    { label: "Redo", shortcut: "&#x21E7;&#x2318;Z", disabled: true },
    { dividerAfter: true, label: "", disabled: true },
    { label: "Cut", shortcut: "&#x2318;X", disabled: true },
    { label: "Copy", shortcut: "&#x2318;C", disabled: true },
    { label: "Paste", shortcut: "&#x2318;V", disabled: true },
    { label: "Select All", shortcut: "&#x2318;A", disabled: true },
  ],
  View: [
    { label: "as Icons", shortcut: "&#x2318;1", disabled: true },
    { label: "as List", shortcut: "&#x2318;2", disabled: true },
    { label: "as Columns", shortcut: "&#x2318;3", disabled: true },
    { dividerAfter: true, label: "", disabled: true },
    { label: "Show Sidebar", disabled: true },
    { label: "Show Preview", disabled: true },
  ],
  Window: [
    { label: "Minimize", shortcut: "&#x2318;M", disabled: true },
    { label: "Zoom", disabled: true },
    { dividerAfter: true, label: "", disabled: true },
    { label: "Bring All to Front", disabled: true },
  ],
  Help: [
    { label: "Search", disabled: true },
    { dividerAfter: true, label: "", disabled: true },
    { label: "macOS Help", disabled: true },
  ],
};

function AppMenuPanel({
  menuId,
  leftOffset,
  onClose,
}: {
  menuId: string;
  leftOffset: number;
  onClose: () => void;
}) {
  const items = APP_MENUS[menuId] ?? [];
  return (
    <div className={`${styles.panel} ${styles.appMenu}`} style={{ left: leftOffset }}>
      {items.map((item, i) => {
        if (item.label === "" && item.dividerAfter) {
          return <div key={`divider-${i}`} className={styles.menuDivider} />;
        }
        return (
          <div key={item.label}>
            <button
              type="button"
              className={`${styles.menuItem} ${item.disabled ? styles.menuItemDisabled : ""}`}
              onClick={() => {
                if (item.label === "Close Window") onClose();
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span
                  className={styles.menuItemShortcut}
                  dangerouslySetInnerHTML={{ __html: item.shortcut }}
                />
              )}
            </button>
            {item.dividerAfter && <div className={styles.menuDivider} />}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Wi-Fi panel
// ─────────────────────────────────────────────────────────────────────────────
function WiFiPanel() {
  const [wifiEnabled, setWifiEnabled] = useState(true);

  return (
    <div className={`${styles.panel} ${styles.wifiPanel}`}>
      <div className={styles.wifiHeader}>
        <span className={styles.wifiHeaderTitle}>Wi-Fi</span>
        <Toggle checked={wifiEnabled} onClick={() => setWifiEnabled((v) => !v)} />
      </div>

      {wifiEnabled ? (
        <>
          <div className={styles.wifiConnectedLabel}>
            Unsecured Network...
            <span style={{ float: "right" }}><WarningIcon /></span>
          </div>

          <div className={styles.wifiDivider} />

          <div className={styles.wifiSection}>
            <p className={styles.wifiSectionLabel}>Personal Hotspot</p>
            <button type="button" className={styles.wifiRow}>
              <span className={`${styles.wifiIconCircle} ${styles.wifiIconCircleGray}`}>
                <HotspotIcon />
              </span>
              <span className={styles.wifiRowText}>{wifiInfo.hotspotName}</span>
              <span className={styles.wifiRowMeta}>
                <span>4G</span>
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
                  <rect x="0" y="7" width="2" height="3" rx="0.5" fill="rgba(255,255,255,0.5)" />
                  <rect x="3.5" y="5" width="2" height="5" rx="0.5" fill="rgba(255,255,255,0.5)" />
                  <rect x="7" y="2.5" width="2" height="7.5" rx="0.5" fill="rgba(255,255,255,0.5)" />
                  <rect x="10.5" y="0" width="2" height="10" rx="0.5" fill="rgba(255,255,255,0.3)" />
                </svg>
              </span>
            </button>
          </div>

          <div className={styles.wifiDivider} />

          <div className={styles.wifiSection}>
            <p className={styles.wifiSectionLabel}>Known Network</p>
            <button type="button" className={styles.wifiRow}>
              <span className={styles.wifiIconCircle}>
                <WifiIconSm />
              </span>
              <span className={styles.wifiRowText}>{wifiInfo.networkName}</span>
            </button>
          </div>

          <div className={styles.wifiDivider} />

          <button type="button" className={styles.wifiSettingsRow}>
            <span>Other Networks</span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}><ChevronRight /></span>
          </button>

          <div className={styles.wifiDivider} />

          <button type="button" className={styles.wifiSettingsRow}>
            <span>Wi-Fi Settings...</span>
          </button>
        </>
      ) : (
        <div style={{ padding: "8px 16px 12px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
          Wi-Fi is turned off
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Control Center panel
// ─────────────────────────────────────────────────────────────────────────────
function ControlCenterPanel({
  nowPlaying,
  onMusicPrev,
  onMusicNext,
  onMusicToggle,
}: {
  nowPlaying: { title: string; artist: string; artworkUrl: string; isPlaying: boolean } | null;
  onMusicPrev?: () => void;
  onMusicNext?: () => void;
  onMusicToggle?: () => void;
}) {
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [airdropOn, setAirdropOn] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(80);
  const [focusOn, setFocusOn] = useState(false);

  // Apply brightness
  useEffect(() => {
    document.documentElement.style.filter = `brightness(${brightness}%)`;
    return () => { document.documentElement.style.filter = ""; };
  }, [brightness]);

  return (
    <div className={`${styles.panel} ${styles.ccPanel}`}>
      {/* ── Top grid: Wi-Fi + Now Playing / Bluetooth ──────────── */}
      <div className={styles.ccGrid}>
        {/* Wi-Fi tile */}
        <button
          type="button"
          className={`${styles.ccTile} ${wifiOn ? styles.ccTileActive : ""}`}
          onClick={() => setWifiOn((v) => !v)}
        >
          <div className={styles.ccTileHeader}>
            <span className={`${styles.ccTileIcon} ${wifiOn ? styles.ccTileIconBlue : styles.ccTileIconGray}`}>
              <WifiIconSm />
            </span>
            <div>
              <p className={styles.ccTileLabel}>Wi-Fi</p>
              <p className={styles.ccTileSub}>{wifiOn ? wifiInfo.networkName : "Off"}</p>
            </div>
          </div>
        </button>

        {/* Now Playing tile (or Bluetooth if no music) */}
        {nowPlaying ? (
          <div className={styles.ccNowPlaying}>
            <div className={styles.ccNpHeader}>
              <Image
                src={nowPlaying.artworkUrl}
                alt={nowPlaying.title}
                width={40}
                height={40}
                className={styles.ccNpArt}
                unoptimized
              />
              <div className={styles.ccNpMeta}>
                <p className={styles.ccNpTitle}>{nowPlaying.title}</p>
                <p className={styles.ccNpArtist}>{nowPlaying.artist}</p>
              </div>
            </div>
            <div className={styles.ccNpControls}>
              <button type="button" className={styles.ccNpBtn} onClick={onMusicPrev} aria-label="Previous">
                <IconPrev />
              </button>
              <button type="button" className={styles.ccNpBtn} onClick={onMusicToggle} aria-label={nowPlaying.isPlaying ? "Pause" : "Play"}>
                {nowPlaying.isPlaying ? <IconPause /> : <IconPlay />}
              </button>
              <button type="button" className={styles.ccNpBtn} onClick={onMusicNext} aria-label="Next">
                <IconNext />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={`${styles.ccTile} ${bluetoothOn ? styles.ccTileActive : ""}`}
            onClick={() => setBluetoothOn((v) => !v)}
          >
            <div className={styles.ccTileHeader}>
              <span className={`${styles.ccTileIcon} ${bluetoothOn ? styles.ccTileIconBlue : styles.ccTileIconGray}`}>
                <BluetoothIconSm />
              </span>
              <div>
                <p className={styles.ccTileLabel}>Bluetooth</p>
                <p className={styles.ccTileSub}>{bluetoothOn ? "On" : "Off"}</p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* ── Second row: Bluetooth (if now playing shown) + AirDrop ── */}
      {nowPlaying && (
        <div className={styles.ccGrid}>
          <button
            type="button"
            className={`${styles.ccTile} ${bluetoothOn ? styles.ccTileActive : ""}`}
            onClick={() => setBluetoothOn((v) => !v)}
          >
            <div className={styles.ccTileHeader}>
              <span className={`${styles.ccTileIcon} ${bluetoothOn ? styles.ccTileIconBlue : styles.ccTileIconGray}`}>
                <BluetoothIconSm />
              </span>
              <div>
                <p className={styles.ccTileLabel}>Bluetooth</p>
                <p className={styles.ccTileSub}>{bluetoothOn ? "On" : "Off"}</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            className={`${styles.ccTile} ${airdropOn ? styles.ccTileActive : ""}`}
            onClick={() => setAirdropOn((v) => !v)}
          >
            <div className={styles.ccTileHeader}>
              <span className={`${styles.ccTileIcon} ${airdropOn ? styles.ccTileIconBlue : styles.ccTileIconGray}`}>
                <AirDropIconSm />
              </span>
              <div>
                <p className={styles.ccTileLabel}>AirDrop</p>
                <p className={styles.ccTileSub}>{airdropOn ? "Everyone" : "Off"}</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── AirDrop row (if no now playing) ──────────────────────── */}
      {!nowPlaying && (
        <div className={styles.ccGrid}>
          <button
            type="button"
            className={`${styles.ccTile} ${airdropOn ? styles.ccTileActive : ""}`}
            onClick={() => setAirdropOn((v) => !v)}
          >
            <div className={styles.ccTileHeader}>
              <span className={`${styles.ccTileIcon} ${airdropOn ? styles.ccTileIconBlue : styles.ccTileIconGray}`}>
                <AirDropIconSm />
              </span>
              <div>
                <p className={styles.ccTileLabel}>AirDrop</p>
                <p className={styles.ccTileSub}>{airdropOn ? "Everyone" : "Off"}</p>
              </div>
            </div>
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className={styles.ccSmallTile} style={{ flex: 1 }}>
              <span className={styles.ccSmallTileIcon}><StageManagerIcon /></span>
            </button>
            <button type="button" className={styles.ccSmallTile} style={{ flex: 1 }}>
              <span className={styles.ccSmallTileIcon}><MirrorIcon /></span>
            </button>
          </div>
        </div>
      )}

      {/* ── Small tiles row ──────────────────────────────────────── */}
      <div className={styles.ccSmallRow}>
        <button type="button" className={styles.ccSmallTile} onClick={() => setFocusOn((v) => !v)}>
          <span className={`${styles.ccSmallTileIcon} ${focusOn ? styles.ccSmallTileIconActive : ""}`}>
            <FocusIcon />
          </span>
          <span className={styles.ccSmallTileLabel}>Focus</span>
        </button>
        <button type="button" className={styles.ccSmallTile}>
          <span className={styles.ccSmallTileIcon}><StageManagerIcon /></span>
          <span className={styles.ccSmallTileLabel}>Stage Manager</span>
        </button>
        <button type="button" className={styles.ccSmallTile}>
          <span className={styles.ccSmallTileIcon}><MirrorIcon /></span>
          <span className={styles.ccSmallTileLabel}>Screen Mirroring</span>
        </button>
      </div>

      {/* ── Display slider ───────────────────────────────────────── */}
      <div className={styles.ccSliderTile}>
        <span className={styles.ccSliderLabel}>Display</span>
        <div className={styles.ccSliderRow}>
          <span className={styles.ccSliderIcon}><SunIconSm /></span>
          <input
            type="range"
            className={styles.ccSlider}
            min={20}
            max={100}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            style={{
              background: `linear-gradient(90deg, #fff ${((brightness - 20) / 80) * 100}%, rgba(255,255,255,0.15) ${((brightness - 20) / 80) * 100}%)`,
            }}
            aria-label="Display brightness"
          />
          <span className={styles.ccSliderIcon}><SunIconLg /></span>
        </div>
      </div>

      {/* ── Sound slider ─────────────────────────────────────────── */}
      <div className={styles.ccSliderTile}>
        <span className={styles.ccSliderLabel}>Sound</span>
        <div className={styles.ccSliderRow}>
          <span className={styles.ccSliderIcon}><SpeakerLow /></span>
          <input
            type="range"
            className={styles.ccSlider}
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{
              background: `linear-gradient(90deg, #fff ${volume}%, rgba(255,255,255,0.15) ${volume}%)`,
            }}
            aria-label="Sound volume"
          />
          <span className={styles.ccSliderIcon}><SpeakerHigh /></span>
        </div>
      </div>
    </div>
  );
}

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
      if (panelId) setOpenPanel(panelId);
    },
    [isAppMenuOpen, openPanel],
  );

  const handleAppleHover = useCallback(() => {
    if (isAppMenuOpen) setOpenPanel("apple");
  }, [isAppMenuOpen]);

  // Compute app menu left offset from ref
  const getMenuLeftOffset = useCallback((menuLabel: string): number => {
    const el = menuRefs.current[menuLabel];
    if (!el) return 120;
    const rect = el.getBoundingClientRect();
    return rect.left;
  }, []);

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
                onClick={() => togglePanel(menuIdMap[item]!)}
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
                leftOffset={getMenuLeftOffset(activeAppMenuLabel)}
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
