"use client";

import type { ReactNode } from "react";

interface WindowControlsProps {
  onClose?: () => void;
}

function iconClassNames(isVisible: boolean): string {
  return `pointer-events-none absolute inset-0 flex items-center justify-center text-black/55 transition-opacity ${
    isVisible ? "opacity-0 group-hover:opacity-100" : "opacity-0"
  }`;
}

function DotButton({
  colorClassName,
  icon,
  iconVisible,
  onClick,
  ariaLabel,
}: {
  colorClassName: string;
  icon: ReactNode;
  iconVisible: boolean;
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      data-window-control
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative h-3 w-3 cursor-default rounded-full border border-black/10 ${colorClassName}`}
    >
      <span className={iconClassNames(iconVisible)}>{icon}</span>
    </button>
  );
}

function CloseIcon() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <path d="M2.5 1.5L5 4L7.5 1.5L8.5 2.5L6 5L8.5 7.5L7.5 8.5L5 6L2.5 8.5L1.5 7.5L4 5L1.5 2.5Z" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      className="h-2.5 w-2.5"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M2 5h6" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <polygon points="2,2 6,2 2,6" />
      <polygon points="8,8 4,8 8,4" />
    </svg>
  );
}

export function WindowControls({ onClose }: WindowControlsProps) {
  const hasCloseAction = typeof onClose === "function";

  return (
    <div className="window-controls group flex items-center gap-1.5">
      <DotButton
        colorClassName="bg-[#ff5f57]"
        icon={<CloseIcon />}
        iconVisible={hasCloseAction}
        onClick={onClose}
        ariaLabel="Close notes window"
      />
      <DotButton
        colorClassName="bg-[#febc2e]"
        icon={<MinimizeIcon />}
        iconVisible={false}
        ariaLabel="Minimize unavailable"
      />
      <DotButton
        colorClassName="bg-[#28c840]"
        icon={<ExpandIcon />}
        iconVisible={false}
        ariaLabel="Maximize unavailable"
      />
    </div>
  );
}
