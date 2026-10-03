"use client";

// Line icons come from Phosphor so every app shares one consistent, well-drawn set.
import {
  AppStoreLogoIcon,
  ArrowCircleDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ClockIcon,
  CloudIcon,
  DesktopIcon,
  DotsThreeIcon,
  FileIcon,
  FolderIcon,
  FolderUserIcon,
  HouseIcon,
  ImageIcon,
  LaptopIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import styles from "../finder-window.module.css";

export function IconClock() {
  return <ClockIcon size={18} aria-hidden />;
}

export function IconSharedFolder() {
  return <FolderUserIcon size={18} aria-hidden />;
}

export function IconAppGrid() {
  return <AppStoreLogoIcon size={18} aria-hidden />;
}

export function IconDesktop() {
  return <DesktopIcon size={18} aria-hidden />;
}

export function IconDocument() {
  return <FileIcon size={18} aria-hidden />;
}

export function IconArrowDown() {
  return <ArrowCircleDownIcon size={18} aria-hidden />;
}

export function IconFolder() {
  return <FolderIcon size={18} aria-hidden />;
}

export function IconImage() {
  return <ImageIcon size={18} aria-hidden />;
}

export function IconCloud() {
  return <CloudIcon size={18} aria-hidden />;
}

export function IconHouse() {
  return <HouseIcon size={18} aria-hidden />;
}

export function IconLaptop() {
  return <LaptopIcon size={18} aria-hidden />;
}

// Map sidebar item name → { icon component, color }
export const sidebarIconMap: Record<string, { icon: React.FC; color: string }> = {
  Recents: { icon: IconClock, color: "#007aff" },
  Shared: { icon: IconSharedFolder, color: "#007aff" },
  Applications: { icon: IconAppGrid, color: "#007aff" },
  Desktop: { icon: IconDesktop, color: "#007aff" },
  Documents: { icon: IconDocument, color: "#007aff" },
  Downloads: { icon: IconArrowDown, color: "#007aff" },
  Projects: { icon: IconFolder, color: "#007aff" },
  Pictures: { icon: IconImage, color: "#007aff" },
  "iCloud Drive": { icon: IconCloud, color: "#5e5e5e" },
  nikhilsheoran: { icon: IconHouse, color: "#5e5e5e" },
  "Nikhil's MacBook Pro": { icon: IconLaptop, color: "#5e5e5e" },
};

/** macOS blue folder icon — proper folder tab shape */
export function FolderIcon16() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden className={styles.rowIconSvg}>
      <path
        d="M1 5C1 3.89543 1.89543 3 3 3H7.17157C7.70201 3 8.21071 3.21071 8.58579 3.58579L9.41421 4.41421C9.78929 4.78929 10.298 5 10.8284 5H17C18.1046 5 19 5.89543 19 7V14C19 15.1046 18.1046 16 17 16H3C1.89543 16 1 15.1046 1 14V5Z"
        fill="url(#folderGrad)"
      />
      <path
        d="M1 5C1 3.89543 1.89543 3 3 3H7.17157C7.70201 3 8.21071 3.21071 8.58579 3.58579L9.41421 4.41421C9.78929 4.78929 10.298 5 10.8284 5H17C18.1046 5 19 5.89543 19 7V14C19 15.1046 18.1046 16 17 16H3C1.89543 16 1 15.1046 1 14V5Z"
        stroke="#2489D1"
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />
      <defs>
        <linearGradient id="folderGrad" x1="10" y1="3" x2="10" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6DC5F7" />
          <stop offset="1" stopColor="#3CA0E6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Generic document icon with a page curl */
export function DocIcon16() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden className={styles.rowIconSvg}>
      <path
        d="M2 1.5A1.5 1.5 0 0 1 3.5 0h6.379a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 14.5 4.62V18.5A1.5 1.5 0 0 1 13 20H3.5A1.5 1.5 0 0 1 2 18.5V1.5Z"
        fill="#E8E8E8"
        stroke="#C8C8C8"
        strokeWidth="0.6"
      />
      <path d="M9.5 0v3.5a1 1 0 0 0 1 1H14" stroke="#C0C0C0" strokeWidth="0.6" />
      <path d="M5 9h6.5M5 12h6.5M5 15h4" stroke="#AEAEAE" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}

/** App icon — rounded rect with gradient */
export function AppIcon16() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className={styles.rowIconSvg}>
      <rect x="1" y="1" width="16" height="16" rx="4" fill="url(#appGrad)" stroke="#7444C9" strokeWidth="0.4" strokeOpacity="0.3" />
      <path d="M6 9h6M9 6v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <defs>
        <linearGradient id="appGrad" x1="9" y1="1" x2="9" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B8A3F8" />
          <stop offset="1" stopColor="#7C5DE6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Small folder icon for breadcrumbs */
export function BreadcrumbFolderIcon() {
  return (
    <svg width="12" height="11" viewBox="0 0 12 11" fill="none" aria-hidden className={styles.breadcrumbIcon}>
      <path
        d="M0.5 2.5C0.5 1.94772 0.947715 1.5 1.5 1.5H4.08579C4.35101 1.5 4.60536 1.60536 4.79289 1.79289L5.20711 2.20711C5.39464 2.39464 5.649 2.5 5.91421 2.5H10.5C11.0523 2.5 11.5 2.94772 11.5 3.5V8.5C11.5 9.05228 11.0523 9.5 10.5 9.5H1.5C0.947715 9.5 0.5 9.05228 0.5 8.5V2.5Z"
        fill="#65B5F4"
        stroke="#3D9ADB"
        strokeWidth="0.35"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

export function ChevronLeft() {
  return <CaretLeftIcon size={17} weight="bold" aria-hidden />;
}

export function ChevronRight() {
  return <CaretRightIcon size={17} weight="bold" aria-hidden />;
}

export function IconListView() {
  return <ListBulletsIcon size={17} weight="bold" aria-hidden />;
}

export function IconEllipsis() {
  return <DotsThreeIcon size={20} weight="bold" aria-hidden />;
}

export function IconSearch() {
  return <MagnifyingGlassIcon size={17} weight="bold" aria-hidden />;
}
