"use client";

import Image from "next/image";
import type { IconKey } from "@/lib/settings-data";

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------
export function IconWifi() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <path d="M7 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" fill="white" />
      <path d="M4.3 7.6a3.8 3.8 0 0 1 5.4 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1.6 5a7.2 7.2 0 0 1 10.8 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
export function IconBluetooth() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden>
      <path d="M2 3.5L8 8 5 11V1l3 3.5L2 9.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconGear() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="2" stroke="white" strokeWidth="1.2" />
      <path d="M6.5 1v1.2M6.5 10.8V12M1 6.5h1.2M10.8 6.5H12M2.6 2.6l.85.85M9.55 9.55l.85.85M9.55 3.45l-.85.85M3.45 9.55l-.85.85" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function IconAccessibility() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <circle cx="6" cy="2" r="1.3" fill="white" />
      <path d="M1 4.5h10" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 4.5V8.5M4 13l2-4.5 2 4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconInfo() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <circle cx="6" cy="3" r="1.1" fill="white" />
      <path d="M6 6v5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function IconPerson() {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden>
      <circle cx="6.5" cy="4" r="2.2" stroke="white" strokeWidth="1.2" />
      <path d="M1 13c.7-2.8 2.9-4.5 5.5-4.5S11.3 10.2 12 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function IconShield() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <path d="M6 1.2L11 3v4c0 3-2.5 5-5 5.8C3.5 12 1 10 1 7V3l5-1.8Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
export function IconCard() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
      <rect x="1" y="1.5" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.2" />
      <path d="M1 4.5h12" stroke="white" strokeWidth="1.2" />
      <path d="M3 7.5h3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function IconCloud() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
      <path d="M4 9.5A2.8 2.8 0 0 1 2.4 4.2a3.7 3.7 0 0 1 7.2-1A3.2 3.2 0 0 1 11.4 9.5H4Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
export function IconStore() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M1.5 5.5V11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M0.5 3l1 2.5h10L12.5 3H0.5Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.5 5.5v1a2 2 0 0 1-4 0v-1M8.5 5.5v1a2 2 0 0 1-4 0v-1M12.5 5.5v1a2 2 0 0 1-4 0v-1" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
export function IconApple() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <path d="M9.8 7.4c0-2 1.6-2.9 1.7-3-0.9-1.4-2.4-1.5-2.9-1.6-1.3-.1-2.4.7-3.1.7-.6 0-1.6-.7-2.7-.7C1.3 2.9 0 4.2 0 6.7c0 1.5.6 3.1 1.3 4.2.7.9 1.3 1.8 2.2 1.8.9 0 1.2-.6 2.3-.6 1.1 0 1.4.6 2.3.6.9 0 1.6-.9 2.2-1.8.3-.4.5-.9.7-1.4-1.6-.7-1.9-2.7-1.2-3.7-.1.6-0.0.1 0 0" fill="white" />
      <path d="M7.5 1C7.6.3 8.3-.2 9 0c.1.8-.7 1.6-1.5 1.5C7.5 1.3 7.5 1.1 7.5 1Z" fill="white" />
    </svg>
  );
}
export function IconNetwork() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <circle cx="7" cy="6" r="1.3" stroke="white" strokeWidth="1.1" />
      <circle cx="1.5" cy="6" r="1.3" stroke="white" strokeWidth="1.1" />
      <circle cx="12.5" cy="6" r="1.3" stroke="white" strokeWidth="1.1" />
      <path d="M2.8 6h2.9M8.3 6h2.9" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
export function IconStorage() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="4" rx="1.5" stroke="white" strokeWidth="1.1" />
      <rect x="1" y="7.5" width="12" height="2.5" rx="1.2" stroke="white" strokeWidth="1.1" />
      <circle cx="11" cy="4" r="0.8" fill="white" />
      <circle cx="11" cy="8.75" r="0.8" fill="white" />
    </svg>
  );
}
export function IconDate() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect x="1" y="2.5" width="11" height="9" rx="1.5" stroke="white" strokeWidth="1.1" />
      <path d="M1 5.5h11" stroke="white" strokeWidth="1.1" />
      <path d="M4.2 1v2.5M8.8 1v2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4 8l1.5 1.5L9 7" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconLanguage() {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden>
      <path d="M2 3h5M4.5 1.5v1.5M1 3c.5 2 2 3.5 4.5 4.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M3 5.5c.5 1 1.5 2 2.5 2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M7.5 9.5l2-6 2 6M8.2 7.5h2.6" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconSoftwareUpdate() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.1" />
      <path d="M6.5 3.5v4M4.5 6l2 2 2-2" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// iCloud service icons
// ---------------------------------------------------------------------------
export function IconPhotos() {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden>
      <circle cx="4" cy="4" r="2" fill="white" opacity="0.9" />
      <circle cx="10" cy="4" r="2" fill="white" opacity="0.7" />
      <circle cx="4" cy="9.5" r="2" fill="white" opacity="0.5" />
      <circle cx="10" cy="9.5" r="2" fill="white" opacity="0.85" />
    </svg>
  );
}
export function IconMail() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
      <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.2" />
      <path d="M1 2.5l6 4.5 6-4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconContacts() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <circle cx="6" cy="5" r="2.2" stroke="white" strokeWidth="1.2" />
      <path d="M1 13c.7-2.8 2.7-4.5 5-4.5S10.3 10.2 11 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11.5 4v2.5M13 5.25h-3" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
export function IconCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect x="1" y="2.5" width="11" height="9" rx="1.5" stroke="white" strokeWidth="1.1" />
      <path d="M1 5.5h11" stroke="white" strokeWidth="1.1" />
      <path d="M4.2 1v2.5M8.8 1v2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <text x="4.2" y="10.5" fill="white" fontSize="4.5" fontWeight="700" fontFamily="system-ui">7</text>
    </svg>
  );
}
export function IconReminders() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <path d="M2 2.5h8a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" stroke="white" strokeWidth="1.1" />
      <circle cx="3.5" cy="6" r="0.9" fill="white" />
      <circle cx="3.5" cy="9" r="0.9" fill="white" />
      <path d="M5.5 6h4M5.5 9h4" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
export function IconSafari() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.1" />
      <path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
      <path d="M8.5 4.5L5.5 7.5M5.5 4.5l1.5 1.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
export function IconNotes() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <rect x="1" y="1" width="10" height="12" rx="1.5" stroke="white" strokeWidth="1.1" />
      <path d="M3.5 4.5h5M3.5 7h5M3.5 9.5h3" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
export function IconMessages() {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden>
      <path d="M1 1.5h12a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H4L1 12.5V2a.5.5 0 0 1 0 0Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.5 5.5h5M4.5 7.5h3" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
export function IconFindMy() {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.1" />
      <circle cx="6.5" cy="6.5" r="2" fill="white" opacity="0.6" />
      <circle cx="6.5" cy="6.5" r="0.8" fill="white" />
    </svg>
  );
}
export function IconSiri() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <path d="M1 6c0-3 1.5-5 3-5s2.5 1.5 3 4c.5 2.5 1.5 4 3 4s3-2 3-5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
export function IconHome() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M1.5 6L6.5 1.5 11.5 6V12h-3.5V9h-2v3H1.5V6Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
export function IconFreeform() {
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
export function IconPhone() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden>
      <path d="M2 1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z" stroke="white" strokeWidth="1.2" />
      <circle cx="5.5" cy="11.5" r="0.8" fill="white" />
    </svg>
  );
}
export function IconLock() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden>
      <rect x="1" y="6" width="9" height="7" rx="1.5" stroke="white" strokeWidth="1.2" />
      <path d="M3 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="5.5" cy="9.5" r="1" fill="white" />
    </svg>
  );
}
export function IconKey() {
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
export function IconAppleMusic() {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden>
      <path d="M12 1.5L5 3.5v7.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 3.5l7-2" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="3.5" cy="11" r="1.8" stroke="white" strokeWidth="1.1" />
      <circle cx="10.5" cy="9" r="1.8" stroke="white" strokeWidth="1.1" />
    </svg>
  );
}
export function IconAppleTV() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
      <rect x="1" y="1" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.2" />
      <path d="M5 5.5l3-2v4l-3-2Z" fill="white" />
    </svg>
  );
}
export function IconArcade() {
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
