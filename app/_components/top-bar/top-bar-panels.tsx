"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import batteryIcon from "@iconify-icons/bi/battery";
import lightningIcon from "@iconify-icons/bi/lightning-charge-fill";
import { useBattery } from "@/lib/use-battery";
import { useClock } from "@/lib/use-clock";
import { wifiInfo } from "@/lib/settings-data";
import styles from "../top-bar.module.css";
import {
  WifiIconSm,
  BluetoothIconSm,
  AirDropIconSm,
  CameraIcon,
  DarkModeIcon,
  MoonIcon,
  StageManagerTahoe,
  MirrorTahoe,
  AirPlayIcon,
  SunIconSm,
  SunIconLg,
  SpeakerLow,
  SpeakerHigh,
  IconPrev,
  IconPlay,
  IconPause,
  IconNext,
  WarningIcon,
  ChevronRight,
  HotspotIcon,
} from "./top-bar-icons";

// ─────────────────────────────────────────────────────────────────────────────
// Battery indicator
// ─────────────────────────────────────────────────────────────────────────────
export function BatteryIndicator() {
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
export function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
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
export function AppleMenuPanel({ onAction }: { onAction: (action: string) => void }) {
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
export interface AppMenuDef {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  dividerAfter?: boolean;
}

export const APP_MENUS: Record<string, AppMenuDef[]> = {
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

export function AppMenuPanel({
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
// Wi-Fi panel
// ─────────────────────────────────────────────────────────────────────────────
export function WiFiPanel() {
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
// CC Slider
// ─────────────────────────────────────────────────────────────────────────────
export function CCSlider({
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

// ─────────────────────────────────────────────────────────────────────────────
// Control Center panel
// ─────────────────────────────────────────────────────────────────────────────
export function ControlCenterPanel({
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
