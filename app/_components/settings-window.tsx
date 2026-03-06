"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import appleIcon from "@iconify-icons/bi/apple";
import twitterXIcon from "@iconify-icons/bi/twitter-x";
import { useDraggableWindow, type WindowSize } from "@/lib/use-draggable-window";
import { WindowControls } from "@/app/_components/window-controls";
import {
  macInfo,
  accountInfo,
  accountRowsSecondary,
  wifiInfo,
  bluetoothDevices,
  generalRows,
  appleDevices,
  icloudServices,
  icloudStorage,
  subscriptions,
  storageCategories,
  storageSegments,
  type IconKey,
} from "@/lib/settings-data";
import styles from "./settings-window.module.css";

const MENU_BAR_HEIGHT = 32;
const DOCK_RESERVED_HEIGHT = 92;
const WINDOW_VISIBLE_EDGE = 140;
const WINDOW_VISIBLE_TOP = 64;

type SettingsScreen =
  | "account"
  | "wifi"
  | "bluetooth"
  | "general"
  | "about"
  | "icloud"
  | "media-purchases"
  | "software-update"
  | "display"
  | "storage"
  | "airdrop";

interface SettingsWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate?: () => void;
  zIndex?: number;
}

const primarySidebarItems: { id: SettingsScreen; label: string; icon: IconKey }[] = [
  { id: "wifi", label: "Wi-Fi", icon: "wifi" },
  { id: "bluetooth", label: "Bluetooth", icon: "bluetooth" },
  { id: "general", label: "General", icon: "general" },
  { id: "about", label: "About This Mac", icon: "about" },
];

// ---------------------------------------------------------------------------
// SVG icons — existing
// ---------------------------------------------------------------------------
function IconWifi() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <path d="M7 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" fill="white" />
      <path d="M4.3 7.6a3.8 3.8 0 0 1 5.4 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1.6 5a7.2 7.2 0 0 1 10.8 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconBluetooth() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden>
      <path d="M2 3.5L8 8 5 11V1l3 3.5L2 9.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="2" stroke="white" strokeWidth="1.2" />
      <path d="M6.5 1v1.2M6.5 10.8V12M1 6.5h1.2M10.8 6.5H12M2.6 2.6l.85.85M9.55 9.55l.85.85M9.55 3.45l-.85.85M3.45 9.55l-.85.85" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function IconAccessibility() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <circle cx="6" cy="2" r="1.3" fill="white" />
      <path d="M1 4.5h10" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 4.5V8.5M4 13l2-4.5 2 4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <circle cx="6" cy="3" r="1.1" fill="white" />
      <path d="M6 6v5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconPerson() {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden>
      <circle cx="6.5" cy="4" r="2.2" stroke="white" strokeWidth="1.2" />
      <path d="M1 13c.7-2.8 2.9-4.5 5.5-4.5S11.3 10.2 12 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <path d="M6 1.2L11 3v4c0 3-2.5 5-5 5.8C3.5 12 1 10 1 7V3l5-1.8Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function IconCard() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
      <rect x="1" y="1.5" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.2" />
      <path d="M1 4.5h12" stroke="white" strokeWidth="1.2" />
      <path d="M3 7.5h3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function IconCloud() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
      <path d="M4 9.5A2.8 2.8 0 0 1 2.4 4.2a3.7 3.7 0 0 1 7.2-1A3.2 3.2 0 0 1 11.4 9.5H4Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function IconStore() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M1.5 5.5V11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M0.5 3l1 2.5h10L12.5 3H0.5Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.5 5.5v1a2 2 0 0 1-4 0v-1M8.5 5.5v1a2 2 0 0 1-4 0v-1M12.5 5.5v1a2 2 0 0 1-4 0v-1" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function IconApple() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <path d="M9.8 7.4c0-2 1.6-2.9 1.7-3-0.9-1.4-2.4-1.5-2.9-1.6-1.3-.1-2.4.7-3.1.7-.6 0-1.6-.7-2.7-.7C1.3 2.9 0 4.2 0 6.7c0 1.5.6 3.1 1.3 4.2.7.9 1.3 1.8 2.2 1.8.9 0 1.2-.6 2.3-.6 1.1 0 1.4.6 2.3.6.9 0 1.6-.9 2.2-1.8.3-.4.5-.9.7-1.4-1.6-.7-1.9-2.7-1.2-3.7-.1.6-0.0.1 0 0" fill="white" />
      <path d="M7.5 1C7.6.3 8.3-.2 9 0c.1.8-.7 1.6-1.5 1.5C7.5 1.3 7.5 1.1 7.5 1Z" fill="white" />
    </svg>
  );
}
function IconNetwork() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <circle cx="7" cy="6" r="1.3" stroke="white" strokeWidth="1.1" />
      <circle cx="1.5" cy="6" r="1.3" stroke="white" strokeWidth="1.1" />
      <circle cx="12.5" cy="6" r="1.3" stroke="white" strokeWidth="1.1" />
      <path d="M2.8 6h2.9M8.3 6h2.9" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IconStorage() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="4" rx="1.5" stroke="white" strokeWidth="1.1" />
      <rect x="1" y="7.5" width="12" height="2.5" rx="1.2" stroke="white" strokeWidth="1.1" />
      <circle cx="11" cy="4" r="0.8" fill="white" />
      <circle cx="11" cy="8.75" r="0.8" fill="white" />
    </svg>
  );
}
function IconDate() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect x="1" y="2.5" width="11" height="9" rx="1.5" stroke="white" strokeWidth="1.1" />
      <path d="M1 5.5h11" stroke="white" strokeWidth="1.1" />
      <path d="M4.2 1v2.5M8.8 1v2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4 8l1.5 1.5L9 7" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLanguage() {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden>
      <path d="M2 3h5M4.5 1.5v1.5M1 3c.5 2 2 3.5 4.5 4.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M3 5.5c.5 1 1.5 2 2.5 2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M7.5 9.5l2-6 2 6M8.2 7.5h2.6" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSoftwareUpdate() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.1" />
      <path d="M6.5 3.5v4M4.5 6l2 2 2-2" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SVG icons — new for iCloud services
// ---------------------------------------------------------------------------
function IconPhotos() {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden>
      <circle cx="4" cy="4" r="2" fill="white" opacity="0.9" />
      <circle cx="10" cy="4" r="2" fill="white" opacity="0.7" />
      <circle cx="4" cy="9.5" r="2" fill="white" opacity="0.5" />
      <circle cx="10" cy="9.5" r="2" fill="white" opacity="0.85" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
      <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.2" />
      <path d="M1 2.5l6 4.5 6-4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconContacts() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <circle cx="6" cy="5" r="2.2" stroke="white" strokeWidth="1.2" />
      <path d="M1 13c.7-2.8 2.7-4.5 5-4.5S10.3 10.2 11 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11.5 4v2.5M13 5.25h-3" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect x="1" y="2.5" width="11" height="9" rx="1.5" stroke="white" strokeWidth="1.1" />
      <path d="M1 5.5h11" stroke="white" strokeWidth="1.1" />
      <path d="M4.2 1v2.5M8.8 1v2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <text x="4.2" y="10.5" fill="white" fontSize="4.5" fontWeight="700" fontFamily="system-ui">7</text>
    </svg>
  );
}
function IconReminders() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <path d="M2 2.5h8a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" stroke="white" strokeWidth="1.1" />
      <circle cx="3.5" cy="6" r="0.9" fill="white" />
      <circle cx="3.5" cy="9" r="0.9" fill="white" />
      <path d="M5.5 6h4M5.5 9h4" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IconSafari() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.1" />
      <path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
      <path d="M8.5 4.5L5.5 7.5M5.5 4.5l1.5 1.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IconNotes() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <rect x="1" y="1" width="10" height="12" rx="1.5" stroke="white" strokeWidth="1.1" />
      <path d="M3.5 4.5h5M3.5 7h5M3.5 9.5h3" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IconMessages() {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden>
      <path d="M1 1.5h12a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H4L1 12.5V2a.5.5 0 0 1 0 0Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.5 5.5h5M4.5 7.5h3" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IconFindMy() {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.1" />
      <circle cx="6.5" cy="6.5" r="2" fill="white" opacity="0.6" />
      <circle cx="6.5" cy="6.5" r="0.8" fill="white" />
    </svg>
  );
}
function IconSiri() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <path d="M1 6c0-3 1.5-5 3-5s2.5 1.5 3 4c.5 2.5 1.5 4 3 4s3-2 3-5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M1.5 6L6.5 1.5 11.5 6V12h-3.5V9h-2v3H1.5V6Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function IconFreeform() {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden>
      <path d="M2 10C2 7 5 2 7 2s3 3 3 6-1 4-2 4-3-2-3-5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 2c2 0 5 3 5 6" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SVG icons — security
// ---------------------------------------------------------------------------
function IconPhone() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden>
      <path d="M2 1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z" stroke="white" strokeWidth="1.2" />
      <circle cx="5.5" cy="11.5" r="0.8" fill="white" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden>
      <rect x="1" y="6" width="9" height="7" rx="1.5" stroke="white" strokeWidth="1.2" />
      <path d="M3 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="5.5" cy="9.5" r="1" fill="white" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <circle cx="4.5" cy="6" r="3.5" stroke="white" strokeWidth="1.2" />
      <path d="M7.5 6h6M11 6v2M13 6v1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SVG icons — Media & Purchases
// ---------------------------------------------------------------------------
function IconAppleMusic() {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden>
      <path d="M12 1.5L5 3.5v7.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 3.5l7-2" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="3.5" cy="11" r="1.8" stroke="white" strokeWidth="1.1" />
      <circle cx="10.5" cy="9" r="1.8" stroke="white" strokeWidth="1.1" />
    </svg>
  );
}
function IconAppleTV() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
      <rect x="1" y="1" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.2" />
      <path d="M5 5.5l3-2v4l-3-2Z" fill="white" />
    </svg>
  );
}
function IconArcade() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <rect x="1" y="2.5" width="12" height="8" rx="2" stroke="white" strokeWidth="1.2" />
      <path d="M5 5.5v2M4 6.5h2" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="9.5" cy="6.5" r="0.9" fill="white" />
      <circle cx="11" cy="5.5" r="0.7" fill="white" opacity="0.6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Icon registry
// ---------------------------------------------------------------------------
const ICON_COMPONENTS: Record<IconKey, React.FC> = {
  wifi: IconWifi,
  bluetooth: IconBluetooth,
  general: IconGear,
  accessibility: IconAccessibility,
  about: IconInfo,
  person: IconPerson,
  shield: IconShield,
  card: IconCard,
  cloud: IconCloud,
  store: IconStore,
  apple: IconApple,
  network: IconNetwork,
  storage: IconStorage,
  date: IconDate,
  language: IconLanguage,
  softwareupdate: IconSoftwareUpdate,
  // iCloud
  photos: IconPhotos,
  mail: IconMail,
  contacts: IconContacts,
  calendar: IconCalendar,
  reminders: IconReminders,
  safari: IconSafari,
  notes: IconNotes,
  messages: IconMessages,
  findmy: IconFindMy,
  siri: IconSiri,
  home: IconHome,
  freeform: IconFreeform,
  // security
  phone: IconPhone,
  lock: IconLock,
  key: IconKey,
  // media
  applemusic: IconAppleMusic,
  appletv: IconAppleTV,
  arcade: IconArcade,
};

function IconBadge({ icon, size = "sm" }: { icon: IconKey; size?: "sm" | "lg" }) {
  const Comp = ICON_COMPONENTS[icon];
  return (
    <span
      className={`${styles.iconBadge} ${styles[`iconBadge_${icon}`]} ${size === "lg" ? styles.iconBadgeLg : ""}`}
      aria-hidden
    >
      {Comp ? <Comp /> : null}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Nav chevrons
// ---------------------------------------------------------------------------
function ChevronIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path d="M4.1 2.3L7.1 5.5L4.1 8.7" stroke="#B0B0B0" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NavChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NavChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Apple logo for About
// ---------------------------------------------------------------------------
function AppleLogoLarge() {
  return <Icon icon={appleIcon} width={56} height={56} color="#1d1d1f" aria-hidden />;
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------
function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-window-drag-ignore
      onClick={onClick}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
      aria-label={checked ? "Enabled" : "Disabled"}
    >
      <span className={`${styles.toggleThumb} ${checked ? styles.toggleThumbOn : ""}`} />
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className={styles.sectionHeading}>{children}</p>;
}

// ---------------------------------------------------------------------------
// Brightness slider (Display sub-screen)
// ---------------------------------------------------------------------------
function BrightnessSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className={styles.brightnessSliderWrap}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className={styles.brightnessIcon}>
        <circle cx="7" cy="7" r="2.5" stroke="#888" strokeWidth="1.2" />
        <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1.1 1.1M10.1 10.1l1.1 1.1M10.1 2.8l-1.1 1.1M3.9 10.1l-1.1 1.1" stroke="#888" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      <input
        type="range"
        min={20}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-window-drag-ignore
        className={styles.brightnessRange}
        style={{
          background: `linear-gradient(90deg, #1669d4 0%, #1669d4 ${((value - 20) / 80) * 100}%, #d0d0d0 ${((value - 20) / 80) * 100}%)`,
        }}
        aria-label="Brightness"
      />
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className={styles.brightnessIconLg}>
        <circle cx="9" cy="9" r="3.5" stroke="#555" strokeWidth="1.3" />
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M13.4 3.2l-1.4 1.4M4.6 13.4l-1.4 1.4" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AirDrop segmented picker (AirDrop sub-screen)
// ---------------------------------------------------------------------------
function AirdropToggle() {
  const [mode, setMode] = useState<"contacts" | "everyone" | "off">("contacts");
  return (
    <div className={styles.airdropPicker}>
      {(["off", "contacts", "everyone"] as const).map((m) => (
        <button
          key={m}
          type="button"
          data-window-drag-ignore
          className={`${styles.airdropPickerBtn} ${mode === m ? styles.airdropPickerBtnActive : ""}`}
          onClick={() => setMode(m)}
        >
          {m === "off" ? "No One" : m === "contacts" ? "Contacts Only" : "Everyone"}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bluetooth device type icons
// ---------------------------------------------------------------------------
function BluetoothDeviceIcon({ type }: { type: string }) {
  if (type === "headphones" || type === "headset") {
    return (
      <span className={styles.btDeviceIcon}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 9V8a5 5 0 0 1 10 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <rect x="1.5" y="9" width="3" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="11.5" y="9" width="3" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </span>
    );
  }
  if (type === "speaker") {
    return (
      <span className={styles.btDeviceIcon}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="1" y="3" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="8" cy="8" r="0.8" fill="currentColor" />
        </svg>
      </span>
    );
  }
  if (type === "keyboard") {
    return (
      <span className={styles.btDeviceIcon}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="1" y="4.5" width="14" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 7h1M7 7h1M10 7h1M4 9.5h8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (type === "watch") {
    return (
      <span className={styles.btDeviceIcon}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="4.5" y="3.5" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6 3.5V2.5h4V3.5M6 12.5v1h4v-1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M8 6.5V8l1.5 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className={styles.btDeviceIcon}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 13.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M8 11v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Apple device icons — real PNG images
// ---------------------------------------------------------------------------
function DeviceIcon({ type }: { type: "mac" | "iphone" | "watch" }) {
  const src =
    type === "mac" ? "/icons/mac-icon.png"
    : type === "iphone" ? "/icons/iphone-icon.png"
    : "/icons/watch-icon.png";
  const w = type === "mac" ? 40 : type === "iphone" ? 42 : 44;
  const h = type === "mac" ? 28 : type === "iphone" ? 68 : 64;
  return (
    <span className={styles.deviceIconWrap}>
      <Image src={src} alt={type} width={w} height={h} style={{ objectFit: "contain" }} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// X (Twitter) icon — Font Awesome via Iconify
// ---------------------------------------------------------------------------
function XIcon() {
  return <Icon icon={twitterXIcon} width={14} height={14} aria-hidden />;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SettingsWindow({ isOpen, onClose, onActivate, zIndex }: SettingsWindowProps) {
  const getBounds = useCallback((windowSize: WindowSize) => {
    return {
      minX: -(windowSize.width - WINDOW_VISIBLE_EDGE),
      maxX: window.innerWidth - WINDOW_VISIBLE_EDGE,
      minY: MENU_BAR_HEIGHT + 8,
      maxY: window.innerHeight - DOCK_RESERVED_HEIGHT - WINDOW_VISIBLE_TOP,
    };
  }, []);

  const { windowRef, position, isDragging, handleDragStart } = useDraggableWindow({
    initialPosition: { x: 100, y: 60 },
    getBounds,
    disabled: !isOpen,
  });

  const [history, setHistory] = useState<SettingsScreen[]>(["account"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [icloudToggles, setIcloudToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    icloudServices.forEach((s) => { init[s.label] = s.enabled; });
    return init;
  });

  // Display sub-screen state
  const [brightness, setBrightness] = useState(72);
  const [autoBrightness, setAutoBrightness] = useState(true);
  const [trueTone, setTrueTone] = useState(true);

  // AirDrop sub-screen state
  const [handoff, setHandoff] = useState(true);
  const [airplayReceiver, setAirplayReceiver] = useState(true);

  // Software Update sub-screen state
  const [autoUpdate, setAutoUpdate] = useState(true);

  // Apply brightness to document root via CSS filter
  useEffect(() => {
    document.documentElement.style.filter = `brightness(${brightness}%)`;
    return () => {
      document.documentElement.style.filter = "";
    };
  }, [brightness]);

  const selectedScreen = history[historyIndex];
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const isAccountFamily =
    selectedScreen === "account" ||
    selectedScreen === "icloud" ||
    selectedScreen === "media-purchases";

  const title = useMemo(() => {
    const map: Record<SettingsScreen, string> = {
      account: "Apple Account",
      wifi: "Wi-Fi",
      bluetooth: "Bluetooth",
      general: "General",
      about: "About This Mac",
      icloud: "iCloud",
      "media-purchases": "Media & Purchases",
      "software-update": "Software Update",
      display: "Display",
      storage: "Storage",
      airdrop: "AirDrop & Handoff",
    };
    return map[selectedScreen];
  }, [selectedScreen]);

  const navigateTo = useCallback(
    (screen: SettingsScreen) => {
      if (screen === selectedScreen) return;
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(screen);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    },
    [history, historyIndex, selectedScreen],
  );

  const goBack = useCallback(() => { if (canGoBack) setHistoryIndex((c) => c - 1); }, [canGoBack]);
  const goForward = useCallback(() => { if (canGoForward) setHistoryIndex((c) => c + 1); }, [canGoForward]);

  const usedPct = Math.round((icloudStorage.used / icloudStorage.total) * 100);

  if (!isOpen) return null;

  return (
    <section
      ref={windowRef}
      className={styles.window}
      onPointerDownCapture={onActivate}
      style={{
        width: "min(860px, calc(100vw - 84px))",
        height: "min(640px, calc(100vh - 108px))",
        zIndex,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <div className={styles.shell}>
        {/* ===================== SIDEBAR ===================== */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop} onPointerDown={handleDragStart}>
            <WindowControls onClose={onClose} windowName="System Settings" />
          </div>

          <div className={styles.sidebarScroll}>
            <button
              type="button"
              data-window-drag-ignore
              onClick={() => navigateTo("account")}
              className={`${styles.accountRow} ${isAccountFamily ? styles.accountRowActive : ""}`}
            >
              <span className={styles.accountAvatar}>
                <Image src={accountInfo.avatarPath} alt={accountInfo.name} width={36} height={36} className={styles.accountAvatarImg} />
              </span>
              <span className={styles.accountMeta}>
                <span className={styles.accountName}>{accountInfo.name}</span>
                <span className={styles.accountSub}>Apple Account</span>
              </span>
            </button>

            <div className={styles.sidebarGroup}>
              {primarySidebarItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-window-drag-ignore
                  onClick={() => navigateTo(item.id)}
                  className={`${styles.sidebarItem} ${selectedScreen === item.id ? styles.sidebarItemActive : ""}`}
                >
                  <IconBadge icon={item.icon} />
                  <span className={styles.sidebarItemLabel}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ===================== CONTENT ===================== */}
        <main className={styles.content}>
          <header className={styles.contentHeader} onPointerDown={handleDragStart}>
            <div className={styles.navGroup}>
              <button
                type="button"
                data-window-drag-ignore
                onClick={goBack}
                disabled={!canGoBack}
                className={`${styles.navButton} ${!canGoBack ? styles.navButtonDisabled : ""}`}
                aria-label="Go back"
              >
                <NavChevronLeft />
              </button>
              <span className={styles.navSeparator} />
              <button
                type="button"
                data-window-drag-ignore
                onClick={goForward}
                disabled={!canGoForward}
                className={`${styles.navButton} ${!canGoForward ? styles.navButtonDisabled : ""}`}
                aria-label="Go forward"
              >
                <NavChevronRight />
              </button>
            </div>
            <h1 className={styles.headerTitle}>{title}</h1>
          </header>

          <div className={styles.contentScroll}>

            {/* ===== ACCOUNT ===== */}
            {selectedScreen === "account" && (
              <>
                <section className={styles.accountProfile}>
                  <div className={styles.accountProfileAvatarWrap}>
                    <Image src={accountInfo.avatarPath} alt={accountInfo.name} width={94} height={94} className={styles.accountProfileAvatar} />
                  </div>
                  <p className={styles.accountProfileName}>{accountInfo.name}</p>
                  <p className={styles.accountProfileEmail}>{accountInfo.email}</p>

                  {/* Personal info + X link */}
                  <div className={styles.accountPersonalRow}>
                    <span className={styles.accountBirthday}>Born {accountInfo.birthday}</span>
                    <a
                      href={accountInfo.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.xLink}
                      data-window-drag-ignore
                      aria-label="X (Twitter) profile"
                    >
                      <XIcon />
                      <span>@{accountInfo.twitterHandle}</span>
                    </a>
                  </div>
                </section>

                <section className={styles.card}>
                  {accountRowsSecondary.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      data-window-drag-ignore
                      className={styles.cardRow}
                      onClick={() => navigateTo(item.label === "iCloud" ? "icloud" : "media-purchases")}
                    >
                      <span className={styles.cardRowLeft}>
                        <IconBadge icon={item.icon} />
                        <span>{item.label}</span>
                      </span>
                      <ChevronIcon />
                    </button>
                  ))}
                </section>

                <section className={styles.devicesSection}>
                  <SectionHeading>Devices</SectionHeading>
                  <div className={styles.card}>
                    {appleDevices.map((device) => (
                      <div key={device.name} className={styles.cardRow}>
                        <span className={styles.cardRowLeft}>
                          <DeviceIcon type={device.type} />
                          <span>
                            <span className={styles.deviceName}>{device.name}</span>
                            <span className={styles.deviceStatus}>{device.subtitle}</span>
                          </span>
                        </span>
                        <ChevronIcon />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ===== ICLOUD ===== */}
            {selectedScreen === "icloud" && (
              <>
                <section className={styles.generalHero}>
                  <span className={styles.generalHeroIcon}>
                    <IconBadge icon="cloud" size="lg" />
                  </span>
                  <p className={styles.generalHeroTitle}>iCloud</p>
                  <p className={styles.generalHeroText}>
                    iCloud keeps your photos, documents, and data in sync across all your Apple devices.
                  </p>

                  {/* Storage bar inline in hero */}
                  <div className={styles.icloudHeroStorage}>
                    <div className={styles.icloudHeroStorageTop}>
                      <span className={styles.icloudHeroStorageLabel}>{icloudStorage.used} GB of {icloudStorage.total} GB used</span>
                      <span className={styles.icloudHeroStoragePlan}>{icloudStorage.plan}</span>
                    </div>
                    <div className={styles.icloudBar}>
                      <div className={styles.icloudBarFill} style={{ width: `${usedPct}%` }} />
                    </div>
                  </div>
                </section>

                <SectionHeading>Apps Using iCloud</SectionHeading>
                <section className={styles.card}>
                  {icloudServices.map((svc) => (
                    <div key={svc.label} className={styles.cardRow}>
                      <span className={styles.cardRowLeft}>
                        <IconBadge icon={svc.icon} />
                        <span>{svc.label}</span>
                      </span>
                      <Toggle
                        checked={icloudToggles[svc.label] ?? svc.enabled}
                        onClick={() => setIcloudToggles((prev) => ({ ...prev, [svc.label]: !prev[svc.label] }))}
                      />
                    </div>
                  ))}
                </section>
              </>
            )}

            {/* ===== MEDIA & PURCHASES ===== */}
            {selectedScreen === "media-purchases" && (
              <>
                <section className={styles.generalHero}>
                  <span className={styles.generalHeroIcon}>
                    <IconBadge icon="store" size="lg" />
                  </span>
                  <p className={styles.generalHeroTitle}>Media &amp; Purchases</p>
                  <p className={styles.generalHeroText}>
                    Manage your Apple subscriptions and purchases across all your devices.
                  </p>
                </section>

                <SectionHeading>Subscriptions</SectionHeading>
                <section className={styles.card}>
                  {subscriptions.map((sub) => (
                    <div key={sub.label} className={styles.cardRow}>
                      <span className={styles.cardRowLeft}>
                        <IconBadge icon={sub.icon} />
                        <span>
                          <span className={styles.deviceName}>{sub.label}</span>
                          <span className={styles.deviceStatus}>{sub.detail}</span>
                        </span>
                      </span>
                      <span className={styles.valueGray}>—</span>
                    </div>
                  ))}
                </section>

                <SectionHeading>Sharing</SectionHeading>
                <section className={styles.card}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLeft}>
                      <IconBadge icon="person" />
                      <span>Family Sharing</span>
                    </span>
                    <span className={styles.valueGray}>On</span>
                  </div>
                </section>
              </>
            )}

            {/* ===== WI-FI ===== */}
            {selectedScreen === "wifi" && (
              <>
                <section className={styles.card}>
                  <div className={styles.settingsHeaderRow}>
                    <span className={styles.settingsHeaderLeft}>
                      <IconBadge icon="wifi" />
                      <span>
                        <span className={styles.settingsHeaderTitle}>Wi-Fi</span>
                        <span className={styles.settingsHeaderText}>
                          Set up Wi-Fi to wirelessly connect your Mac to the internet.
                          <br />
                          Turn on Wi-Fi, then choose a network to join.
                          <span className={styles.learnMore}> Learn More...</span>
                        </span>
                      </span>
                    </span>
                    <Toggle checked={wifiEnabled} onClick={() => setWifiEnabled((v) => !v)} />
                  </div>

                  {wifiEnabled ? (
                    <div className={styles.wifiConnectedRow}>
                      <div>
                        <p className={styles.wifiConnectedTitle}>{wifiInfo.networkName}</p>
                        <p className={styles.wifiConnectedMeta}>
                          <span className={styles.dotGreen} /> Connected · {wifiInfo.ipAddress}
                          <br />
                          <span className={styles.dotYellow} /> Unsecured Network
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.wifiConnectedRow}>
                      <p className={styles.offLineText}><span className={styles.dotRed} /> Wi-Fi is off</p>
                    </div>
                  )}
                </section>

                {wifiEnabled && (
                  <>
                    <SectionHeading>Personal Hotspots</SectionHeading>
                    <section className={styles.card}>
                      <div className={styles.cardRow}>
                        <span className={styles.cardRowLeft}>
                          <span>{wifiInfo.hotspotName}</span>
                        </span>
                        <span className={styles.rowMeta}>Secure</span>
                      </div>
                    </section>

                    <SectionHeading>Known Networks</SectionHeading>
                    <section className={styles.card}>
                      {wifiInfo.knownNetworks.map((n) => (
                        <div key={n} className={styles.cardRow}>
                          <span className={styles.cardRowLeft}>
                            <span className={styles.checkMark}>✓</span>
                            <span>{n}</span>
                          </span>
                        </div>
                      ))}
                    </section>
                  </>
                )}
              </>
            )}

            {/* ===== BLUETOOTH ===== */}
            {selectedScreen === "bluetooth" && (
              <>
                <section className={styles.card}>
                  <div className={styles.settingsHeaderRow}>
                    <span className={styles.settingsHeaderLeft}>
                      <IconBadge icon="bluetooth" />
                      <span>
                        <span className={styles.settingsHeaderTitle}>Bluetooth</span>
                        <span className={styles.settingsHeaderText}>
                          Connect to accessories you can use for activities such as streaming music,
                          typing, and gaming.
                          <span className={styles.learnMore}> Learn more...</span>
                        </span>
                      </span>
                    </span>
                    <Toggle checked={bluetoothEnabled} onClick={() => setBluetoothEnabled((v) => !v)} />
                  </div>
                  <div className={styles.bluetoothNote}>
                    {bluetoothEnabled
                      ? `This Mac is discoverable as "${accountInfo.device}" while Bluetooth Settings is open.`
                      : "AirDrop, AirPlay, Find My, and Location Services use Bluetooth."}
                  </div>
                </section>

                {bluetoothEnabled && (
                  <>
                    <SectionHeading>My Devices</SectionHeading>
                    <section className={styles.card}>
                      {bluetoothDevices.map((device) => (
                        <div key={device.name} className={styles.cardRow}>
                          <span className={styles.cardRowLeft}>
                            <BluetoothDeviceIcon type={device.type} />
                            <span>
                              <span className={styles.deviceName}>{device.name}</span>
                              <span className={`${styles.deviceStatus} ${device.status === "Connected" ? styles.deviceStatusConnected : ""}`}>
                                {device.status}{device.status === "Connected" && device.battery ? ` · ${device.battery}` : ""}
                              </span>
                            </span>
                          </span>
                        </div>
                      ))}
                    </section>
                  </>
                )}
              </>
            )}

            {/* ===== GENERAL ===== */}
            {selectedScreen === "general" && (
              <>
                <section className={styles.generalHero}>
                  <span className={styles.generalHeroIcon}>
                    <IconBadge icon="general" size="lg" />
                  </span>
                  <p className={styles.generalHeroTitle}>General</p>
                  <p className={styles.generalHeroText}>
                    Manage your Mac's software updates, display, storage, and connectivity.
                  </p>
                </section>
                <section className={styles.card}>
                  {generalRows.map((item) => {
                    const dest: SettingsScreen =
                      item.label === "Software Update" ? "software-update"
                      : item.label === "Display" ? "display"
                      : item.label === "Storage" ? "storage"
                      : "airdrop";
                    return (
                      <button
                        key={item.label}
                        type="button"
                        data-window-drag-ignore
                        className={styles.cardRow}
                        onClick={() => navigateTo(dest)}
                      >
                        <span className={styles.cardRowLeft}>
                          <IconBadge icon={item.icon} />
                          <span>{item.label}</span>
                        </span>
                        <ChevronIcon />
                      </button>
                    );
                  })}
                </section>
              </>
            )}

            {/* ===== SOFTWARE UPDATE ===== */}
            {selectedScreen === "software-update" && (
              <>
                <section className={styles.generalHero}>
                  <span className={styles.generalHeroIcon}>
                    <IconBadge icon="softwareupdate" size="lg" />
                  </span>
                  <p className={styles.generalHeroTitle}>Software Update</p>
                  <p className={styles.generalHeroText}>
                    macOS Tahoe 26.0 is up to date.
                  </p>
                </section>
                <section className={styles.card}>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>macOS Version</span>
                    <span className={styles.aboutSpecValue}>{macInfo.os}</span>
                  </div>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Build</span>
                    <span className={styles.aboutSpecValue}>{macInfo.osBuild}</span>
                  </div>
                  <div className={`${styles.aboutSpecRow} ${styles.aboutSpecRowLast}`}>
                    <span className={styles.aboutSpecLabel}>Last Checked</span>
                    <span className={styles.aboutSpecValue}>Today</span>
                  </div>
                </section>
                <section className={styles.card}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLeft}>
                      <IconBadge icon="softwareupdate" />
                      <span>Automatically keep my Mac up to date</span>
                    </span>
                    <Toggle checked={autoUpdate} onClick={() => setAutoUpdate((v) => !v)} />
                  </div>
                </section>
              </>
            )}

            {/* ===== DISPLAY ===== */}
            {selectedScreen === "display" && (
              <>
                <section className={styles.generalHero}>
                  <span className={styles.generalHeroIcon}>
                    <IconBadge icon="general" size="lg" />
                  </span>
                  <p className={styles.generalHeroTitle}>Display</p>
                  <p className={styles.generalHeroText}>
                    Adjust brightness and display settings for your {macInfo.display}.
                  </p>
                </section>
                <section className={styles.card}>
                  <div className={styles.preferenceRow}>
                    <span>
                      <span className={styles.preferenceTitle}>Brightness</span>
                    </span>
                    <BrightnessSlider value={brightness} onChange={setBrightness} />
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLeft}>
                      <span>Automatically adjust brightness</span>
                    </span>
                    <Toggle checked={autoBrightness} onClick={() => setAutoBrightness((v) => !v)} />
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLeft}>
                      <span>True Tone</span>
                    </span>
                    <Toggle checked={trueTone} onClick={() => setTrueTone((v) => !v)} />
                  </div>
                </section>
                <section className={styles.card}>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Display</span>
                    <span className={styles.aboutSpecValue}>{macInfo.display}</span>
                  </div>
                  <div className={`${styles.aboutSpecRow} ${styles.aboutSpecRowLast}`}>
                    <span className={styles.aboutSpecLabel}>Resolution</span>
                    <span className={styles.aboutSpecValue}>{macInfo.displayResolution}</span>
                  </div>
                </section>
              </>
            )}

            {/* ===== STORAGE ===== */}
            {selectedScreen === "storage" && (
              <>
                <section className={styles.storageHero}>
                  <div className={styles.storageHeroHeader}>
                    <span className={styles.storageHeroTitle}>Macintosh HD</span>
                    <span className={styles.storageHeroMeta}>{macInfo.storageUsed} of {macInfo.storage} used</span>
                  </div>
                  <div className={styles.storageMacBar}>
                    {storageSegments.map((seg) => (
                      <div
                        key={seg.label}
                        className={styles.storageMacBarSegment}
                        style={{ width: `${seg.pct}%`, background: seg.color }}
                        title={seg.label}
                      />
                    ))}
                  </div>
                  <div className={styles.storageLegend}>
                    {storageSegments.filter((s) => s.label !== "Free").map((seg) => (
                      <span key={seg.label} className={styles.storageLegendItem}>
                        <span className={styles.storageLegendDot} style={{ background: seg.color }} />
                        {seg.label}
                      </span>
                    ))}
                    <span className={styles.storageLegendItem}>
                      <span className={styles.storageLegendDot} style={{ background: "#dcdcdc", border: "1px solid #c0c0c0" }} />
                      Free ({macInfo.storageFree})
                    </span>
                  </div>
                </section>

                <SectionHeading>Recommendations</SectionHeading>
                <section className={styles.card}>
                  <div className={styles.storageRecommendRow}>
                    <span className={styles.storageRecommendIcon}>
                      <IconBadge icon="cloud" />
                    </span>
                    <span className={styles.storageRecommendText}>
                      <span className={styles.storageRecommendTitle}>Store in iCloud</span>
                      <span className={styles.storageRecommendDesc}>Store all files in iCloud Drive and save space by keeping only recent files on this Mac.</span>
                    </span>
                    <button type="button" data-window-drag-ignore className={styles.inlineButton}>Store in iCloud…</button>
                  </div>
                  <div className={styles.storageRecommendRow}>
                    <span className={styles.storageRecommendIcon}>
                      <IconBadge icon="appletv" />
                    </span>
                    <span className={styles.storageRecommendText}>
                      <span className={styles.storageRecommendTitle}>Optimize Storage</span>
                      <span className={styles.storageRecommendDesc}>Save space by automatically removing movies and TV shows you've already watched.</span>
                    </span>
                    <button type="button" data-window-drag-ignore className={styles.inlineButton}>Optimize…</button>
                  </div>
                </section>

                <section className={styles.card}>
                  {storageCategories.map((cat, i) => (
                    <div key={cat.label} className={`${styles.storageCatRow} ${i === storageCategories.length - 1 ? styles.storageCatRowLast : ""}`}>
                      <span className={styles.storageCatDot} style={{ background: cat.color }} />
                      <span className={styles.storageCatLabel}>{cat.label}</span>
                      <span className={styles.storageCatValue}>{cat.value}</span>
                    </div>
                  ))}
                </section>
              </>
            )}

            {/* ===== AIRDROP & HANDOFF ===== */}
            {selectedScreen === "airdrop" && (
              <>
                <section className={styles.generalHero}>
                  <span className={styles.generalHeroIcon}>
                    <IconBadge icon="network" size="lg" />
                  </span>
                  <p className={styles.generalHeroTitle}>AirDrop &amp; Handoff</p>
                  <p className={styles.generalHeroText}>
                    Share wirelessly with nearby Apple devices and hand off work between devices seamlessly.
                  </p>
                </section>
                <section className={styles.card}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLeft}>
                      <IconBadge icon="network" />
                      <span>
                        <span className={styles.preferenceTitle} style={{ display: "block" }}>AirDrop</span>
                        <span className={styles.settingsHeaderText}>Allow others to discover and share with you.</span>
                      </span>
                    </span>
                    <AirdropToggle />
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLeft}>
                      <IconBadge icon="general" />
                      <span>Handoff</span>
                    </span>
                    <Toggle checked={handoff} onClick={() => setHandoff((v) => !v)} />
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardRowLeft}>
                      <IconBadge icon="general" />
                      <span>AirPlay Receiver</span>
                    </span>
                    <Toggle checked={airplayReceiver} onClick={() => setAirplayReceiver((v) => !v)} />
                  </div>
                </section>
              </>
            )}

            {/* ===== ABOUT THIS MAC ===== */}
            {selectedScreen === "about" && (
              <>
                <section className={styles.aboutHero}>
                  <span className={styles.aboutAppleLogo}><AppleLogoLarge /></span>
                  <p className={styles.aboutModelName}>{macInfo.modelName}</p>
                  <p className={styles.aboutOS}>{macInfo.os}</p>
                  <p className={styles.aboutBuild}>Build {macInfo.osBuild}</p>
                </section>

                <section className={styles.card}>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Chip</span>
                    <span className={styles.aboutSpecValue}>{macInfo.chip}</span>
                  </div>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Cores</span>
                    <span className={styles.aboutSpecValue}>{macInfo.cores}</span>
                  </div>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Memory</span>
                    <span className={styles.aboutSpecValue}>{macInfo.memory}</span>
                  </div>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Storage</span>
                    <span className={styles.aboutSpecValue}>{macInfo.storage}</span>
                  </div>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Display</span>
                    <span className={styles.aboutSpecValue}>{macInfo.display}</span>
                  </div>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Resolution</span>
                    <span className={styles.aboutSpecValue}>{macInfo.displayResolution}</span>
                  </div>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Model Number</span>
                    <span className={styles.aboutSpecValue}>{macInfo.modelNumber}</span>
                  </div>
                  <div className={`${styles.aboutSpecRow} ${styles.aboutSpecRowLast}`}>
                    <span className={styles.aboutSpecLabel}>Serial Number</span>
                    <span className={styles.aboutSpecValue}>{macInfo.serialNumber}</span>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.aboutSpecRow}>
                    <span className={styles.aboutSpecLabel}>Battery Condition</span>
                    <span className={styles.aboutSpecValue}>{macInfo.batteryHealth}</span>
                  </div>
                  <div className={`${styles.aboutSpecRow} ${styles.aboutSpecRowLast}`}>
                    <span className={styles.aboutSpecLabel}>Battery Cycles</span>
                    <span className={styles.aboutSpecValue}>{macInfo.batteryCycles} cycles</span>
                  </div>
                </section>
              </>
            )}

          </div>
        </main>
      </div>
    </section>
  );
}
