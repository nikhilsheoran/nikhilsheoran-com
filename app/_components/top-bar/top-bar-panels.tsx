"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  FastForwardIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
} from "@phosphor-icons/react";
import { useBattery } from "@/lib/use-battery";
import { wifiInfo } from "@/lib/settings-data";
import { Glass } from "../journey/glass";
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
  SpeakerHigh,
  WarningIcon,
  ChevronRight,
  HotspotIcon,
  MusicNoteIcon,
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
        <svg
          width="24"
          height="24"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="text-2xl"
          aria-hidden
        >
          <path d="M0 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6zm2-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H2zm14 3a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8z" />
        </svg>
        <span
          className={`battery-level ${colorClass}`}
          style={{ width: `${width}rem` }}
        />
        {batteryState.charging ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="absolute inset-0 m-auto -translate-x-0.5 text-xs"
            aria-hidden
          >
            <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z" />
          </svg>
        ) : null}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────────────────────────────────────
export function Toggle({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${styles.wifiToggle} ${checked ? styles.wifiToggleOn : ""}`}
      aria-label={checked ? "Enabled" : "Disabled"}
    >
      <span
        className={`${styles.wifiToggleThumb} ${checked ? styles.wifiToggleThumbOn : ""}`}
      />
    </button>
  );
}

/** Frost inside a menu pane: enough to keep a long list readable over anything. */
const MENU_FROST = 16;

// ─────────────────────────────────────────────────────────────────────────────
// Apple menu panel
// ─────────────────────────────────────────────────────────────────────────────
export function AppleMenuPanel({
  onAction,
}: {
  onAction: (action: string) => void;
}) {
  return (
    <div className={`${styles.panel} ${styles.appleMenu}`}>
      <Glass as="div" coreBlur={MENU_FROST} className={styles.menuGlass}>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => onAction("about")}
        >
          <span>About This Mac</span>
        </button>
        <div className={styles.menuDivider} />
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => onAction("settings")}
        >
          <span>System Settings...</span>
        </button>
        <div className={styles.menuDivider} />
        <button
          type="button"
          className={`${styles.menuItem} ${styles.menuItemDisabled}`}
        >
          <span>Recent Items</span>
          <span className={styles.menuItemShortcut}>
            <ChevronRight />
          </span>
        </button>
        <div className={styles.menuDivider} />
        <button
          type="button"
          className={`${styles.menuItem} ${styles.menuItemDisabled}`}
        >
          <span>Force Quit...</span>
          <span className={styles.menuItemShortcut}>&#x2325;&#x2318;Esc</span>
        </button>
        <div className={styles.menuDivider} />
        <button
          type="button"
          className={`${styles.menuItem} ${styles.menuItemDisabled}`}
        >
          <span>Sleep</span>
        </button>
        <button
          type="button"
          className={`${styles.menuItem} ${styles.menuItemDisabled}`}
        >
          <span>Restart...</span>
        </button>
        <button
          type="button"
          className={`${styles.menuItem} ${styles.menuItemDisabled}`}
        >
          <span>Shut Down...</span>
        </button>
        <div className={styles.menuDivider} />
        <button
          type="button"
          className={`${styles.menuItem} ${styles.menuItemDisabled}`}
        >
          <span>Lock Screen</span>
          <span className={styles.menuItemShortcut}>&#x2303;&#x2318;Q</span>
        </button>
        <button
          type="button"
          className={`${styles.menuItem} ${styles.menuItemDisabled}`}
        >
          <span>Log Out Nikhil Sheoran...</span>
          <span className={styles.menuItemShortcut}>&#x21E7;&#x2318;Q</span>
        </button>
      </Glass>
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
    <div
      className={`${styles.panel} ${styles.appMenu}`}
      style={{ left: leftOffset }}
    >
      <Glass as="div" coreBlur={MENU_FROST} className={styles.menuGlass}>
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
      </Glass>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Wi-Fi panel
// ─────────────────────────────────────────────────────────────────────────────
export function WiFiPanel() {
  const [wifiEnabled, setWifiEnabled] = useState(true);

  return (
    <div className={styles.wifiPanel}>
      <Glass as="div" coreBlur={MENU_FROST} className={styles.menuGlass}>
        <div className={styles.wifiHeader}>
          <span className={styles.wifiHeaderTitle}>Wi-Fi</span>
          <Toggle
            checked={wifiEnabled}
            onClick={() => setWifiEnabled((v) => !v)}
          />
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
                <span
                  className={`${styles.wifiIconCircle} ${styles.wifiIconCircleGray}`}
                >
                  <HotspotIcon />
                </span>
                <span className={styles.wifiRowText}>
                  {wifiInfo.hotspotName}
                </span>
                <span className={styles.wifiRowMeta}>
                  <svg
                    width="14"
                    height="11"
                    viewBox="0 0 14 11"
                    fill="none"
                    aria-hidden
                  >
                    <rect
                      x="0"
                      y="8"
                      width="2.4"
                      height="3"
                      rx="0.5"
                      fill="currentColor"
                    />
                    <rect
                      x="3.6"
                      y="6"
                      width="2.4"
                      height="5"
                      rx="0.5"
                      fill="currentColor"
                    />
                    <rect
                      x="7.2"
                      y="3.5"
                      width="2.4"
                      height="7.5"
                      rx="0.5"
                      fill="currentColor"
                      opacity="0.3"
                    />
                    <rect
                      x="10.8"
                      y="0.5"
                      width="2.4"
                      height="10.5"
                      rx="0.5"
                      fill="currentColor"
                      opacity="0.3"
                    />
                  </svg>
                  <span style={{ fontWeight: 600 }}>4G</span>
                  <svg
                    width="22"
                    height="11"
                    viewBox="0 0 22 11"
                    fill="none"
                    aria-hidden
                  >
                    <rect
                      x="0.5"
                      y="0.5"
                      width="18"
                      height="10"
                      rx="2.5"
                      stroke="currentColor"
                      opacity="0.4"
                    />
                    <rect
                      x="2"
                      y="2"
                      width="5"
                      height="7"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="19.5"
                      y="3.5"
                      width="1.5"
                      height="4"
                      rx="0.5"
                      fill="currentColor"
                      opacity="0.4"
                    />
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
                <span className={styles.wifiRowText}>
                  {wifiInfo.networkName}
                </span>
              </button>
            </div>

            <div className={styles.wifiDivider} />

            <button type="button" className={styles.wifiSettingsRow}>
              <span>Other Networks</span>
              <span className={styles.wifiChevron}>
                <ChevronRight />
              </span>
            </button>

            <div className={styles.wifiDivider} />

            <button type="button" className={styles.wifiSettingsRow}>
              <span>Wi-Fi Settings...</span>
            </button>
          </>
        ) : (
          <div
            style={{
              padding: "8px 16px 12px",
              color: "rgba(0,0,0,0.45)",
              fontSize: 13,
            }}
          >
            Wi-Fi is turned off
          </div>
        )}
      </Glass>
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
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  endButton?: ReactNode;
  ariaLabel: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={styles.ccSliderRow}>
      <div className={styles.ccSliderTrack}>
        <div className={styles.ccSliderBg} />
        <div className={styles.ccSliderFill} style={{ width: `${pct}%` }} />
        {iconLeft && <div className={styles.ccSliderIconLeft}>{iconLeft}</div>}
        {iconRight && (
          <div className={styles.ccSliderIconRight}>{iconRight}</div>
        )}
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
/** Frost inside each control-centre pane, for contrast over bright windows. */
const CC_FROST = 10;

function CCConnectivityPill({
  label,
  sub,
  on,
  onClick,
  areaClass,
  children,
}: {
  label: string;
  sub: string;
  on: boolean;
  onClick: () => void;
  areaClass: string;
  children: ReactNode;
}) {
  return (
    <Glass
      as="button"
      type="button"
      coreBlur={CC_FROST}
      className={`${styles.ccPill} ${styles.ccTile} ${areaClass}`}
      onClick={onClick}
    >
      <span
        className={`${styles.ccPillIcon} ${on ? "" : styles.ccPillIconOff}`}
      >
        {children}
      </span>
      <span className={styles.ccPillText}>
        <span className={styles.ccPillLabel}>{label}</span>
        <span className={styles.ccPillSub}>{sub}</span>
      </span>
    </Glass>
  );
}

export function ControlCenterPanel({
  nowPlaying,
  onMusicPrev,
  onMusicNext,
  onMusicToggle,
}: {
  nowPlaying: {
    title: string;
    artist: string;
    artworkUrl: string;
    isPlaying: boolean;
  } | null;
  onMusicPrev?: () => void;
  onMusicNext?: () => void;
  onMusicToggle?: () => void;
}) {
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [airdropOn, setAirdropOn] = useState(true);
  const [darkOn, setDarkOn] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(80);
  const [focusOn, setFocusOn] = useState(false);

  useEffect(() => {
    if (brightness >= 100) {
      document.documentElement.style.filter = "";
      return;
    }
    document.documentElement.style.filter = `brightness(${brightness}%)`;
    return () => {
      document.documentElement.style.filter = "";
    };
  }, [brightness]);

  return (
    <div className={styles.ccWrap}>
      <CCConnectivityPill
        areaClass={styles.ccWifi}
        label="Wi-Fi"
        sub={wifiOn ? wifiInfo.networkName : "Off"}
        on={wifiOn}
        onClick={() => setWifiOn((v) => !v)}
      >
        <WifiIconSm size={21} />
      </CCConnectivityPill>

      <Glass
        as="div"
        coreBlur={CC_FROST}
        className={`${styles.ccNowPlaying} ${styles.ccTile}`}
      >
        <div className={styles.ccNpHead}>
          {nowPlaying ? (
            <Image
              src={nowPlaying.artworkUrl}
              alt=""
              width={50}
              height={50}
              className={styles.ccNpArt}
              unoptimized
            />
          ) : (
            <span className={styles.ccNpArtFallback}>
              <MusicNoteIcon size={16} />
            </span>
          )}
          <div className={styles.ccNpMeta}>
            <p className={styles.ccNpTitle}>
              {nowPlaying?.title ?? "Not Playing"}
            </p>
            <p className={styles.ccNpArtist}>{nowPlaying?.artist ?? "Music"}</p>
          </div>
        </div>
        <div
          className={`${styles.ccNpControls} ${nowPlaying ? "" : styles.ccNpControlsIdle}`}
        >
          <button
            type="button"
            className={styles.ccNpBtn}
            onClick={onMusicPrev}
            aria-label="Previous"
            disabled={!nowPlaying}
          >
            <RewindIcon size={17} weight="fill" />
          </button>
          <button
            type="button"
            className={styles.ccNpBtn}
            onClick={onMusicToggle}
            aria-label={nowPlaying?.isPlaying ? "Pause" : "Play"}
            disabled={!nowPlaying}
          >
            {nowPlaying?.isPlaying ? (
              <PauseIcon size={21} weight="fill" />
            ) : (
              <PlayIcon size={21} weight="fill" />
            )}
          </button>
          <button
            type="button"
            className={styles.ccNpBtn}
            onClick={onMusicNext}
            aria-label="Next"
            disabled={!nowPlaying}
          >
            <FastForwardIcon size={17} weight="fill" />
          </button>
        </div>
      </Glass>

      <CCConnectivityPill
        areaClass={styles.ccBluetooth}
        label="Bluetooth"
        sub={bluetoothOn ? "On" : "Off"}
        on={bluetoothOn}
        onClick={() => setBluetoothOn((v) => !v)}
      >
        <BluetoothIconSm size={21} />
      </CCConnectivityPill>

      <CCConnectivityPill
        areaClass={styles.ccAirdrop}
        label="AirDrop"
        sub={airdropOn ? "Everyone" : "Off"}
        on={airdropOn}
        onClick={() => setAirdropOn((v) => !v)}
      >
        <AirDropIconSm size={21} />
      </CCConnectivityPill>

      <Glass
        as="button"
        coreBlur={CC_FROST}
        type="button"
        className={`${styles.ccRoundTile} ${styles.ccTile} ${styles.ccStage}`}
        aria-label="Stage Manager"
      >
        <StageManagerTahoe size={30} />
      </Glass>
      <Glass
        as="button"
        coreBlur={CC_FROST}
        type="button"
        className={`${styles.ccRoundTile} ${styles.ccTile} ${styles.ccMirror}`}
        aria-label="Screen Mirroring"
      >
        <MirrorTahoe size={30} />
      </Glass>

      <Glass
        as="button"
        coreBlur={CC_FROST}
        type="button"
        className={`${styles.ccRoundTile} ${styles.ccTile} ${styles.ccDark} ${darkOn ? styles.ccRoundTileActive : ""}`}
        aria-label="Dark Mode"
        onClick={() => setDarkOn((v) => !v)}
      >
        <DarkModeIcon size={30} />
      </Glass>
      <Glass
        as="button"
        coreBlur={CC_FROST}
        type="button"
        className={`${styles.ccRoundTile} ${styles.ccTile} ${styles.ccCamera}`}
        aria-label="Screenshot"
      >
        <CameraIcon size={30} />
      </Glass>
      <Glass
        as="button"
        coreBlur={CC_FROST}
        type="button"
        className={`${styles.ccFocusPill} ${styles.ccTile} ${focusOn ? styles.ccFocusPillActive : ""}`}
        onClick={() => setFocusOn((v) => !v)}
      >
        <span className={styles.ccFocusIcon}>
          <MoonIcon size={21} />
        </span>
        <span>Focus</span>
      </Glass>

      <Glass
        as="div"
        coreBlur={CC_FROST}
        className={`${styles.ccSliderTile} ${styles.ccTile} ${styles.ccDisplay}`}
      >
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
      </Glass>

      <Glass
        as="div"
        coreBlur={CC_FROST}
        className={`${styles.ccSliderTile} ${styles.ccTile} ${styles.ccSound}`}
      >
        <span className={styles.ccSliderLabel}>Sound</span>
        <CCSlider
          value={volume}
          min={0}
          max={100}
          onChange={setVolume}
          iconLeft={<SpeakerHigh />}
          endButton={
            <button
              type="button"
              className={styles.ccSoundEnd}
              aria-label="AirPlay"
            >
              <AirPlayIcon size={12} />
            </button>
          }
          ariaLabel="Sound volume"
        />
      </Glass>

      <Glass
        as="button"
        coreBlur={CC_FROST}
        type="button"
        className={`${styles.ccEditBtn} ${styles.ccTile}`}
      >
        Edit Controls
      </Glass>
    </div>
  );
}
