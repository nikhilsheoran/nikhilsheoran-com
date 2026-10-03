"use client";

import Image from "next/image";
import {
  AddressBookIcon,
  AppStoreLogoIcon,
  AppleLogoIcon,
  ArrowsClockwiseIcon,
  BluetoothIcon,
  CalendarBlankIcon,
  ChatCircleIcon,
  ClockIcon,
  CloudIcon,
  CompassIcon,
  CreditCardIcon,
  CrosshairIcon,
  EnvelopeSimpleIcon,
  FlowerIcon,
  GameControllerIcon,
  GearSixIcon,
  GlobeIcon,
  HardDriveIcon,
  HouseIcon,
  InfoIcon,
  KeyIcon,
  ListChecksIcon,
  LockIcon,
  MusicNoteIcon,
  NoteIcon,
  PersonArmsSpreadIcon,
  PhoneIcon,
  ScribbleIcon,
  ShieldCheckIcon,
  TelevisionSimpleIcon,
  TranslateIcon,
  UserIcon,
  WaveformIcon,
  WifiHighIcon,
} from "@phosphor-icons/react";

import type { IconKey } from "@/lib/settings-data";

// ---------------------------------------------------------------------------
// Glyphs for the coloured tiles, from Phosphor so they are one consistent set.
// ---------------------------------------------------------------------------
export function IconWifi() {
  return <WifiHighIcon size={15} weight="bold" color="#fff" aria-hidden />;
}
export function IconBluetooth() {
  return <BluetoothIcon size={15} weight="bold" color="#fff" aria-hidden />;
}
export function IconGear() {
  return <GearSixIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconAccessibility() {
  return <PersonArmsSpreadIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconInfo() {
  return <InfoIcon size={15} weight="bold" color="#fff" aria-hidden />;
}
export function IconPerson() {
  return <UserIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconShield() {
  return <ShieldCheckIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconCard() {
  return <CreditCardIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconCloud() {
  return <CloudIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconStore() {
  return <AppStoreLogoIcon size={15} weight="bold" color="#fff" aria-hidden />;
}
export function IconApple() {
  return <AppleLogoIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconNetwork() {
  return <GlobeIcon size={15} weight="bold" color="#fff" aria-hidden />;
}
export function IconStorage() {
  return <HardDriveIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconDate() {
  return <ClockIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconLanguage() {
  return <TranslateIcon size={15} weight="bold" color="#fff" aria-hidden />;
}
export function IconSoftwareUpdate() {
  return <ArrowsClockwiseIcon size={15} weight="bold" color="#fff" aria-hidden />;
}

// ---------------------------------------------------------------------------
// iCloud service icons
// ---------------------------------------------------------------------------
export function IconPhotos() {
  return <FlowerIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconMail() {
  return <EnvelopeSimpleIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconContacts() {
  return <AddressBookIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconCalendar() {
  return <CalendarBlankIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconReminders() {
  return <ListChecksIcon size={15} weight="bold" color="#fff" aria-hidden />;
}
export function IconSafari() {
  return <CompassIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconNotes() {
  return <NoteIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconMessages() {
  return <ChatCircleIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconFindMy() {
  return <CrosshairIcon size={15} weight="bold" color="#fff" aria-hidden />;
}
export function IconSiri() {
  return <WaveformIcon size={15} weight="bold" color="#fff" aria-hidden />;
}
export function IconHome() {
  return <HouseIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconFreeform() {
  return <ScribbleIcon size={15} weight="bold" color="#fff" aria-hidden />;
}

// ---------------------------------------------------------------------------
// SVG icons — security
// ---------------------------------------------------------------------------
export function IconPhone() {
  return <PhoneIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconLock() {
  return <LockIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconKey() {
  return <KeyIcon size={15} weight="fill" color="#fff" aria-hidden />;
}

// ---------------------------------------------------------------------------
// SVG icons — Media & Purchases
// ---------------------------------------------------------------------------
export function IconAppleMusic() {
  return <MusicNoteIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconAppleTV() {
  return <TelevisionSimpleIcon size={15} weight="fill" color="#fff" aria-hidden />;
}
export function IconArcade() {
  return <GameControllerIcon size={15} weight="fill" color="#fff" aria-hidden />;
}

// ---------------------------------------------------------------------------
// Icon registry
// ---------------------------------------------------------------------------
export const ICON_COMPONENTS: Record<IconKey, React.FC> = {
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

export function IconBadge({ icon, size = "sm", styles }: { icon: IconKey; size?: "sm" | "lg"; styles: Record<string, string> }) {
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
export function ChevronIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path d="M4.1 2.3L7.1 5.5L4.1 8.7" stroke="#B0B0B0" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function NavChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function NavChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Bluetooth device type icons
// ---------------------------------------------------------------------------
export function BluetoothDeviceIcon({ type, styles }: { type: string; styles: Record<string, string> }) {
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
export function DeviceIcon({ type, styles }: { type: "mac" | "iphone" | "watch"; styles: Record<string, string> }) {
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
export function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07l-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Apple logo for About
// ---------------------------------------------------------------------------
export function AppleLogoLarge() {
  return (
    <svg width="56" height="56" viewBox="0 0 16 16" fill="#1d1d1f" aria-hidden>
      <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516c.024.034 1.52.087 2.475-1.258c.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422c.212-2.189 1.675-2.789 1.698-2.854c.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116c-.508.139-1.653.589-1.968.607c-.316.018-1.256-.522-2.267-.665c-.647-.125-1.333.131-1.824.328c-.49.196-1.422.754-2.074 2.237c-.652 1.482-.311 3.83-.067 4.56c.244.729.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899c.319.232 1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472c.357.013 1.061.154 1.782.539c.571.197 1.111.115 1.652-.105c.541-.221 1.324-1.059 2.238-2.758c.347-.79.505-1.217.473-1.282Z"/>
    </svg>
  );
}
