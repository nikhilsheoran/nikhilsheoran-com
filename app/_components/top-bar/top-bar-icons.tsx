"use client";

import { LinkSimpleIcon, WarningIcon as WarningIconGlyph } from "@phosphor-icons/react";

export function CCMIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 29 29" width={size} height={size} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M7.5,13h14a5.5,5.5,0,0,0,0-11H7.5a5.5,5.5,0,0,0,0,11Zm0-9h14a3.5,3.5,0,0,1,0,7H7.5a3.5,3.5,0,0,1,0-7Zm0,6A2.5,2.5,0,1,0,5,7.5,2.5,2.5,0,0,0,7.5,10Zm14,6H7.5a5.5,5.5,0,0,0,0,11h14a5.5,5.5,0,0,0,0-11Zm1.43439,8a2.5,2.5,0,1,1,2.5-2.5A2.5,2.5,0,0,1,22.93439,24Z" />
    </svg>
  );
}

export function WifiIconSm({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 18.2a1.85 1.85 0 1 0 0 3.7 1.85 1.85 0 0 0 0-3.7Z" />
      <path
        d="M7.05 15.05a7 7 0 0 1 9.9 0 1.15 1.15 0 0 1-1.63 1.63 4.7 4.7 0 0 0-6.64 0 1.15 1.15 0 1 1-1.63-1.63Z"
      />
      <path
        d="M4.22 12.22a11 11 0 0 1 15.56 0 1.15 1.15 0 0 1-1.63 1.63 8.7 8.7 0 0 0-12.3 0 1.15 1.15 0 1 1-1.63-1.63Z"
      />
      <path
        d="M1.4 9.4a15 15 0 0 1 21.2 0 1.15 1.15 0 0 1-1.63 1.63 12.7 12.7 0 0 0-17.94 0A1.15 1.15 0 0 1 1.4 9.4Z"
      />
    </svg>
  );
}

export function BluetoothIconSm({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.71 7.71 12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29ZM13 5.83l1.88 1.88L13 9.59V5.83Zm1.88 10.46L13 18.17v-3.76l1.88 1.88Z" />
    </svg>
  );
}

export function AirDropIconSm({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="2.15" fill="currentColor" />
      <circle cx="12" cy="12" r="5.15" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function CameraIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M9.15 4.5h5.7l1.35 1.9H20a2 2 0 0 1 2 2v10.1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.4a2 2 0 0 1 2-2h3.8l1.35-1.9Zm2.85 12.7a3.85 3.85 0 1 0 0-7.7 3.85 3.85 0 0 0 0 7.7Z"
      />
    </svg>
  );
}

export function DarkModeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.1" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 3.9a8.1 8.1 0 0 0 0 16.2V3.9Z" fill="currentColor" />
    </svg>
  );
}

export function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.6 2.6a1 1 0 0 1 1.12 1.33A8.1 8.1 0 0 0 20.1 12a8.15 8.15 0 0 1-8.7 8.13 8.7 8.7 0 0 1-8.04-8.9 8.65 8.65 0 0 1 7.9-8.37 1 1 0 0 1 1.34 1.12 6.6 6.6 0 0 0-.2 1.62 6.15 6.15 0 0 0 6.2 6.08c.5 0 1-.06 1.47-.18A8.7 8.7 0 0 1 12.6 2.6Z" />
    </svg>
  );
}

export function StageManagerTahoe({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9.2" y="4.8" width="11.2" height="14.4" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3.4" y="6.2" width="4.2" height="3.1" rx="0.7" fill="currentColor" />
      <rect x="3.4" y="10.45" width="4.2" height="3.1" rx="0.7" fill="currentColor" opacity="0.7" />
      <rect x="3.4" y="14.7" width="4.2" height="3.1" rx="0.7" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function MirrorTahoe({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.2" y="5.2" width="12.2" height="9.2" rx="2.1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="8.6" y="9.4" width="12.2" height="9.2" rx="2.1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function AirPlayIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 15.2V7.2A2.2 2.2 0 0 1 7.2 5h9.6A2.2 2.2 0 0 1 19 7.2v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 13.4 18 21H6l6-7.6Z" fill="currentColor" />
    </svg>
  );
}

export function SunIconSm() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6ZM12 2.4a1 1 0 0 1 1 1V5a1 1 0 1 1-2 0V3.4a1 1 0 0 1 1-1Zm0 16.6a1 1 0 0 1 1 1v1.6a1 1 0 1 1-2 0V20a1 1 0 0 1 1-1ZM3.4 11a1 1 0 0 1 1-1H6a1 1 0 1 1 0 2H4.4a1 1 0 0 1-1-1Zm16.6 0a1 1 0 0 1 1-1H22a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1ZM5.64 5.64a1 1 0 0 1 1.41 0l1.13 1.13a1 1 0 1 1-1.41 1.41L5.64 7.05a1 1 0 0 1 0-1.41Zm10.18 10.18a1 1 0 0 1 1.41 0l1.13 1.13a1 1 0 0 1-1.41 1.41l-1.13-1.13a1 1 0 0 1 0-1.41ZM18.36 5.64a1 1 0 0 1 0 1.41l-1.13 1.13a1 1 0 1 1-1.41-1.41l1.13-1.13a1 1 0 0 1 1.41 0ZM8.18 15.82a1 1 0 0 1 0 1.41L7.05 18.36a1 1 0 1 1-1.41-1.41l1.13-1.13a1 1 0 0 1 1.41 0Z" />
    </svg>
  );
}

export function SunIconLg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2ZM12 1.75a1 1 0 0 1 1 1V4.4a1 1 0 1 1-2 0V2.75a1 1 0 0 1 1-1Zm0 17.85a1 1 0 0 1 1 1v1.65a1 1 0 1 1-2 0v-1.65a1 1 0 0 1 1-1ZM1.75 12a1 1 0 0 1 1-1H4.4a1 1 0 1 1 0 2H2.75a1 1 0 0 1-1-1Zm17.85 0a1 1 0 0 1 1-1h1.65a1 1 0 1 1 0 2h-1.65a1 1 0 0 1-1-1ZM4.93 4.93a1 1 0 0 1 1.41 0l1.18 1.18a1 1 0 0 1-1.41 1.41L4.93 6.34a1 1 0 0 1 0-1.41Zm11.55 11.55a1 1 0 0 1 1.41 0l1.18 1.18a1 1 0 0 1-1.41 1.41l-1.18-1.18a1 1 0 0 1 0-1.41ZM19.07 4.93a1 1 0 0 1 0 1.41l-1.18 1.18a1 1 0 1 1-1.41-1.41l1.18-1.18a1 1 0 0 1 1.41 0ZM7.52 16.48a1 1 0 0 1 0 1.41l-1.18 1.18a1 1 0 0 1-1.41-1.41l1.18-1.18a1 1 0 0 1 1.41 0Z" />
    </svg>
  );
}

export function SpeakerLow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14.2 4.35a1 1 0 0 1 .55.9v13.5a1 1 0 0 1-1.62.78L8.4 15.4H5.2A2.2 2.2 0 0 1 3 13.2V10.8A2.2 2.2 0 0 1 5.2 8.6h3.2l4.73-4.13a1 1 0 0 1 1.07-.12Z" />
    </svg>
  );
}

export function SpeakerHigh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.2 4.35a1 1 0 0 1 .55.9v13.5a1 1 0 0 1-1.62.78L7.4 15.4H4.2A2.2 2.2 0 0 1 2 13.2V10.8A2.2 2.2 0 0 1 4.2 8.6h3.2l4.73-4.13a1 1 0 0 1 1.07-.12ZM17.1 8.05a1 1 0 0 1 1.41.05 4.6 4.6 0 0 1 0 7.8 1 1 0 1 1-1.36-1.46 2.6 2.6 0 0 0 0-4.88 1 1 0 0 1-.05-1.51ZM19.7 5.7a1 1 0 0 1 1.42.04 8.15 8.15 0 0 1 0 12.52 1 1 0 1 1-1.46-1.38 6.15 6.15 0 0 0 0-9.76 1 1 0 0 1 .04-1.42Z" />
    </svg>
  );
}

export function MusicNoteIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9.2 4.2a1 1 0 0 1 .86-.2l9 1.7a1 1 0 0 1 .84.98v8.67a3.35 3.35 0 1 1-2-3.06V8.05l-7.5-1.42v8.72a3.35 3.35 0 1 1-2-3.06V5a1 1 0 0 1 .8-.8Z" />
    </svg>
  );
}

export function StageManagerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="4" y="2" width="8" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 5v4M0.5 6v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function MirrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="4" width="8" height="4" rx="0.8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M5 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 10v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function FocusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 3v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="9.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function IconPrev() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.2 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Zm12.36.22a1 1 0 0 1 .44.83v11.9a1 1 0 0 1-1.57.83L8.7 12.83a1 1 0 0 1 0-1.66l8.73-5.95a1 1 0 0 1 1.13 0Z" />
    </svg>
  );
}

export function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8.2 4.7a1 1 0 0 1 1.53-.85l11 6.3a1 1 0 0 1 0 1.7l-11 6.3A1 1 0 0 1 8.2 17.3V4.7Z" />
    </svg>
  );
}

export function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4.5" width="4.2" height="15" rx="1.2" />
      <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" />
    </svg>
  );
}

export function IconNext() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.8 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1ZM5.44 5.22a1 1 0 0 1 1.13 0l8.73 5.95a1 1 0 0 1 0 1.66l-8.73 5.95A1 1 0 0 1 5 17.95V6.05a1 1 0 0 1 .44-.83Z" />
    </svg>
  );
}

export function WarningIcon() {
  return <WarningIconGlyph size={16} weight="fill" color="#f5a623" aria-hidden />;
}

export function ChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M3.5 2L7 5 3.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HotspotIcon() {
  return <LinkSimpleIcon size={14} weight="bold" aria-hidden />;
}
