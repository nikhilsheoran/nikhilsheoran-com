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

function WifiIconSm({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 12) / 16} viewBox="0 0 16 12" fill="none" aria-hidden>
      <path d="M8 9.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Z" fill="currentColor" />
      <path d="M4.7 7.1a4.6 4.6 0 0 1 6.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M1.6 4.2a8.8 8.8 0 0 1 12.8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BluetoothIconSm({ size = 14 }: { size?: number }) {
  return (
    <svg width={size * 0.7} height={size} viewBox="0 0 10 14" fill="none" aria-hidden>
      <path
        d="M2.5 3.5L7.5 8 5 10.5V1L7.5 6 2.5 10.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function AirDropIconSm({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 2.2c2.5 0 4.6 1.7 5.3 4M9 2.2c-2.5 0-4.6 1.7-5.3 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 5.6c1.4 0 2.6 1 3 2.3M9 5.6c-1.4 0-2.6 1-3 2.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 9.8v6.2M6.5 12.4 9 9.9l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2.5" y="5.5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 5.5l1-1.5h4l1 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function DarkModeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 3.5v13a6.5 6.5 0 0 0 0-13Z" fill="currentColor" />
    </svg>
  );
}

function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13 9.5A5.5 5.5 0 0 1 6.5 3a.5.5 0 0 0-.7-.5 6 6 0 1 0 7.7 7.7.5.5 0 0 0-.5-.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StageManagerTahoe() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="6" y="4.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6" y="6.5" width="3" height="2" rx="0.5" fill="currentColor" />
      <path d="M3 8v4M1.5 9v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function MirrorTahoe() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="4.5" width="14" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6" y="7.5" width="11" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}

function AirPlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 9.5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M7 8l3 4H4l3-4Z" fill="currentColor" />
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
    <div className={`${styles.panel} ${styles.glassDark} ${styles.appleMenu}`}>
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
    <div className={`${styles.panel} ${styles.glassDark} ${styles.appMenu}`} style={{ left: leftOffset }}>
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
// Wi-Fi panel — Tahoe light glass
// ─────────────────────────────────────────────────────────────────────────────
function WiFiPanel() {
  const [wifiEnabled, setWifiEnabled] = useState(true);

  return (
    <div className={`${styles.wifiPanel} ${styles.glassLight}`}>
      <div className={styles.wifiHeader}>
        <span className={styles.wifiHeaderTitle}>Wi-Fi</span>
        <Toggle checked={wifiEnabled} onClick={() => setWifiEnabled((v) => !v)} />
      </div>

      {wifiEnabled ? (
        <>
          <div className={styles.wifiConnectedRow}>
            <span>Unsecured Network...</span>
            <WarningIcon />
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
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
                  <rect x="0" y="8" width="2.4" height="3" rx="0.5" fill="currentColor" />
                  <rect x="3.6" y="6" width="2.4" height="5" rx="0.5" fill="currentColor" />
                  <rect x="7.2" y="3.5" width="2.4" height="7.5" rx="0.5" fill="currentColor" opacity="0.3" />
                  <rect x="10.8" y="0.5" width="2.4" height="10.5" rx="0.5" fill="currentColor" opacity="0.3" />
                </svg>
                <span style={{ fontWeight: 600 }}>4G</span>
                <svg width="22" height="11" viewBox="0 0 22 11" fill="none" aria-hidden>
                  <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="currentColor" opacity="0.4" />
                  <rect x="2" y="2" width="5" height="7" rx="1" fill="currentColor" />
                  <rect x="19.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
                </svg>
              </span>
            </button>
          </div>

          <div className={styles.wifiDivider} />

          <div className={styles.wifiSection}>
            <p className={styles.wifiSectionLabel}>Known Network</p>
            <button type="button" className={styles.wifiRow}>
              <span className={styles.wifiIconCircle}>
                <WifiIconSm size={14} />
              </span>
              <span className={styles.wifiRowText}>{wifiInfo.networkName}</span>
            </button>
          </div>

          <div className={styles.wifiDivider} />

          <button type="button" className={styles.wifiSettingsRow}>
            <span>Other Networks</span>
            <span className={styles.wifiChevron}><ChevronRight /></span>
          </button>

          <div className={styles.wifiDivider} />

          <button type="button" className={styles.wifiSettingsRow}>
            <span>Wi-Fi Settings...</span>
          </button>
        </>
      ) : (
        <div style={{ padding: "8px 16px 12px", color: "rgba(0,0,0,0.45)", fontSize: 13 }}>
          Wi-Fi is turned off
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Control Center panel — Tahoe dark glass
// ─────────────────────────────────────────────────────────────────────────────
function CCSlider({
  value,
  min,
  max,
  onChange,
  iconLeft,
  iconRight,
  endButton,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  endButton?: React.ReactNode;
  ariaLabel: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={styles.ccSliderRow}>
      <div className={styles.ccSliderTrack}>
        <div className={styles.ccSliderBg} />
        <div className={styles.ccSliderFill} style={{ width: `${pct}%` }} />
        {iconLeft && <div className={styles.ccSliderIconLeft}>{iconLeft}</div>}
        {iconRight && <div className={styles.ccSliderIconRight}>{iconRight}</div>}
        <input
          type="range"
          className={styles.ccSlider}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={ariaLabel}
        />
      </div>
      {endButton}
    </div>
  );
}

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
    return () => {
      document.documentElement.style.filter = "";
    };
  }, [brightness]);

  return (
    <div className={styles.ccWrap}>
      {/* Top: Wi-Fi + Bluetooth pills (left col) | Now Playing (right col, spans 2 rows) */}
      <div className={styles.ccTopLeft}>
        <button
          type="button"
          className={`${styles.ccPill} ${styles.glassDark}`}
          onClick={() => setWifiOn((v) => !v)}
        >
          <span className={`${styles.ccPillIcon} ${!wifiOn ? styles.ccPillIconOff : ""}`}>
            <WifiIconSm size={22} />
          </span>
          <span className={styles.ccPillText}>
            <span className={styles.ccPillLabel}>Wi-Fi</span>
            <span className={styles.ccPillSub}>{wifiOn ? wifiInfo.networkName : "Off"}</span>
          </span>
        </button>

        <button
          type="button"
          className={`${styles.ccPill} ${styles.glassDark}`}
          onClick={() => setBluetoothOn((v) => !v)}
        >
          <span className={`${styles.ccPillIcon} ${!bluetoothOn ? styles.ccPillIconOff : ""}`}>
            <BluetoothIconSm size={20} />
          </span>
          <span className={styles.ccPillText}>
            <span className={styles.ccPillLabel}>Bluetooth</span>
            <span className={styles.ccPillSub}>{bluetoothOn ? "On" : "Off"}</span>
          </span>
        </button>
      </div>

      <div className={styles.ccTopRight}>
        {nowPlaying ? (
          <div className={`${styles.ccNowPlaying} ${styles.glassDark}`}>
            <div className={styles.ccNpHeader}>
              <Image
                src={nowPlaying.artworkUrl}
                alt={nowPlaying.title}
                width={36}
                height={36}
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
              <button
                type="button"
                className={styles.ccNpBtn}
                onClick={onMusicToggle}
                aria-label={nowPlaying.isPlaying ? "Pause" : "Play"}
              >
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
            className={`${styles.ccPill} ${styles.glassDark}`}
            onClick={() => setAirdropOn((v) => !v)}
            style={{ flex: 1, height: 154 }}
          >
            <span className={`${styles.ccPillIcon} ${!airdropOn ? styles.ccPillIconOff : ""}`}>
              <AirDropIconSm size={22} />
            </span>
            <span className={styles.ccPillText}>
              <span className={styles.ccPillLabel}>AirDrop</span>
              <span className={styles.ccPillSub}>{airdropOn ? "Everyone" : "Off"}</span>
            </span>
          </button>
        )}
      </div>

      {/* AirDrop pill + Stage Manager + Mirror (only when nowPlaying shown above) */}
      {nowPlaying && (
        <>
          <button
            type="button"
            className={`${styles.ccPill} ${styles.glassDark}`}
            onClick={() => setAirdropOn((v) => !v)}
          >
            <span className={`${styles.ccPillIcon} ${!airdropOn ? styles.ccPillIconOff : ""}`}>
              <AirDropIconSm size={22} />
            </span>
            <span className={styles.ccPillText}>
              <span className={styles.ccPillLabel}>AirDrop</span>
              <span className={styles.ccPillSub}>{airdropOn ? "Everyone" : "Off"}</span>
            </span>
          </button>
          <div className={styles.ccRoundRow} style={{ justifyContent: "flex-end" }}>
            <button
              type="button"
              className={`${styles.ccRoundTile} ${styles.glassDark}`}
              aria-label="Stage Manager"
            >
              <StageManagerTahoe />
            </button>
            <button
              type="button"
              className={`${styles.ccRoundTile} ${styles.glassDark}`}
              aria-label="Screen Mirroring"
            >
              <MirrorTahoe />
            </button>
          </div>
        </>
      )}

      {/* Dark Mode + Camera + Focus pill */}
      <div className={`${styles.ccRoundRow} ${styles.ccFullRow}`}>
        <button
          type="button"
          className={`${styles.ccRoundTile} ${styles.glassDark}`}
          aria-label="Dark Mode"
        >
          <DarkModeIcon />
        </button>
        <button
          type="button"
          className={`${styles.ccRoundTile} ${styles.glassDark}`}
          aria-label="Screenshot"
        >
          <CameraIcon />
        </button>
        <button
          type="button"
          className={`${styles.ccFocusPill} ${styles.glassDark} ${focusOn ? styles.ccFocusPillActive : ""}`}
          onClick={() => setFocusOn((v) => !v)}
        >
          <span className={styles.ccFocusIcon}>
            <MoonIcon size={22} />
          </span>
          <span>Focus</span>
        </button>
      </div>

      {/* Display slider */}
      <div className={`${styles.ccSliderTile} ${styles.glassDark} ${styles.ccFullRow}`}>
        <span className={styles.ccSliderLabel}>Display</span>
        <CCSlider
          value={brightness}
          min={20}
          max={100}
          onChange={setBrightness}
          iconLeft={<SunIconSm />}
          iconRight={<SunIconLg />}
          ariaLabel="Display brightness"
        />
      </div>

      {/* Sound slider */}
      <div className={`${styles.ccSliderTile} ${styles.glassDark} ${styles.ccFullRow}`}>
        <span className={styles.ccSliderLabel}>Sound</span>
        <CCSlider
          value={volume}
          min={0}
          max={100}
          onChange={setVolume}
          iconLeft={<SpeakerLow />}
          iconRight={<SpeakerHigh />}
          endButton={
            <button type="button" className={styles.ccSoundEnd} aria-label="AirPlay">
              <AirPlayIcon />
            </button>
          }
          ariaLabel="Sound volume"
        />
      </div>

      <button
        type="button"
        className={`${styles.ccEditBtn} ${styles.glassDark} ${styles.ccFullRow}`}
      >
        Edit Controls
      </button>
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
