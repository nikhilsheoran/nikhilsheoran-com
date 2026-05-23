export function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 7.5 8 3l5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.75 8.5v4.75h8.5V8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconHeart() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 13S2 9.5 2 5.5a3.5 3.5 0 0 1 6-2.45A3.5 3.5 0 0 1 14 5.5C14 9.5 8 13 8 13Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
export function IconPerson() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 13.5c.6-2.5 2.5-4 5-4s4.4 1.5 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
export function IconDisc() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
export function IconMusic() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 12V4l7-1.5v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.5" cy="12" r="1.75" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11.5" cy="10.5" r="1.75" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
export function IconPrev() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4 4v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 4L7 9l7 5V4Z" fill="currentColor" />
    </svg>
  );
}
export function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M5.5 3.5L14.5 9l-9 5.5V3.5Z" fill="currentColor" />
    </svg>
  );
}
export function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="4" y="3" width="3.5" height="12" rx="1" fill="currentColor" />
      <rect x="10.5" y="3" width="3.5" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}
export function IconNext() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M14 4v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 4l7 5-7 5V4Z" fill="currentColor" />
    </svg>
  );
}
export function IconVolumeLow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 5.5v5h2.5l3.5 3V2.5L5 5.5H2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 6a3 3 0 0 1 0 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
export function IconVolumeHigh() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 5.5v5h2.5l3.5 3V2.5L5 5.5H2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 6a3 3 0 0 1 0 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13 4a6 6 0 0 1 0 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
export function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconPlayFill({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3.5 2.5L11.5 7l-8 4.5V2.5Z" fill="currentColor" />
    </svg>
  );
}
export function IconEqualizer() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="0" y="4" width="2" height="8" rx="1" fill="currentColor">
        <animate attributeName="height" values="8;4;8;6;8" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="y" values="4;6;4;5;4" dur="1.2s" repeatCount="indefinite" />
      </rect>
      <rect x="5" y="2" width="2" height="10" rx="1" fill="currentColor">
        <animate attributeName="height" values="10;6;10;8;10" dur="0.9s" repeatCount="indefinite" />
        <animate attributeName="y" values="2;4;2;3;2" dur="0.9s" repeatCount="indefinite" />
      </rect>
      <rect x="10" y="5" width="2" height="7" rx="1" fill="currentColor">
        <animate attributeName="height" values="7;5;7;4;7" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="5;6;5;7;5" dur="1.5s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}
