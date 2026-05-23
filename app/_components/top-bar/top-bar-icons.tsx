export function CCMIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 29 29" width={size} height={size} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M7.5,13h14a5.5,5.5,0,0,0,0-11H7.5a5.5,5.5,0,0,0,0,11Zm0-9h14a3.5,3.5,0,0,1,0,7H7.5a3.5,3.5,0,0,1,0-7Zm0,6A2.5,2.5,0,1,0,5,7.5,2.5,2.5,0,0,0,7.5,10Zm14,6H7.5a5.5,5.5,0,0,0,0,11h14a5.5,5.5,0,0,0,0-11Zm1.43439,8a2.5,2.5,0,1,1,2.5-2.5A2.5,2.5,0,0,1,22.93439,24Z" />
    </svg>
  );
}

export function WifiIconSm({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 12) / 16} viewBox="0 0 16 12" fill="none" aria-hidden>
      <path d="M8 9.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Z" fill="currentColor" />
      <path d="M4.7 7.1a4.6 4.6 0 0 1 6.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M1.6 4.2a8.8 8.8 0 0 1 12.8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function BluetoothIconSm({ size = 14 }: { size?: number }) {
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

export function AirDropIconSm({ size = 18 }: { size?: number }) {
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

export function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2.5" y="5.5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 5.5l1-1.5h4l1 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function DarkModeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 3.5v13a6.5 6.5 0 0 0 0-13Z" fill="currentColor" />
    </svg>
  );
}

export function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13 9.5A5.5 5.5 0 0 1 6.5 3a.5.5 0 0 0-.7-.5 6 6 0 1 0 7.7 7.7.5.5 0 0 0-.5-.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function StageManagerTahoe() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="6" y="4.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6" y="6.5" width="3" height="2" rx="0.5" fill="currentColor" />
      <path d="M3 8v4M1.5 9v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function MirrorTahoe() {
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="4.5" width="14" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6" y="7.5" width="11" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}

export function AirPlayIcon() {
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

export function SunIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1.1 1.1M10.1 10.1l1.1 1.1M10.1 2.8l-1.1 1.1M3.9 10.1l-1.1 1.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function SunIconLg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M11.4 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function SpeakerLow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 5v4h2l3 2.5V2.5L4 5H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function SpeakerHigh() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 5v4h2l3 2.5V2.5L4 5H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9.5 5a2.8 2.8 0 0 1 0 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 3.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 4v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 4L6 8l6 4V4Z" fill="currentColor" />
    </svg>
  );
}

export function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M5 3.5l8 4.5-8 4.5V3.5Z" fill="currentColor" />
    </svg>
  );
}

export function IconPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3.5" y="3" width="3" height="10" rx="0.8" fill="currentColor" />
      <rect x="9.5" y="3" width="3" height="10" rx="0.8" fill="currentColor" />
    </svg>
  );
}

export function IconNext() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M12.5 4v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 4l6 4-6 4V4Z" fill="currentColor" />
    </svg>
  );
}

export function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1L1 13h12L7 1Z" stroke="#f5a623" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 5.5V9" stroke="#f5a623" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="7" cy="11" r="0.7" fill="#f5a623" />
    </svg>
  );
}

export function ChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M3.5 2L7 5 3.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HotspotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 4.5a5 5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4.5 11.5a5 5 0 0 0 7 0" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
