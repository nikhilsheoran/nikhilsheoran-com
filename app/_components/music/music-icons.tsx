"use client";

// Line icons come from Phosphor so every app shares one consistent, well-drawn set.
import {
  CaretLeftIcon,
  FastForwardIcon,
  HeartIcon,
  HouseIcon,
  MicrophoneStageIcon,
  MusicNoteIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
  SpeakerHighIcon,
  SpeakerLowIcon,
  StackIcon,
} from "@phosphor-icons/react";

export function IconHome() {
  return <HouseIcon size={18} aria-hidden />;
}
export function IconHeart() {
  return <HeartIcon size={18} aria-hidden />;
}
export function IconPerson() {
  return <MicrophoneStageIcon size={18} aria-hidden />;
}
export function IconDisc() {
  return <StackIcon size={18} aria-hidden />;
}
export function IconMusic() {
  return <MusicNoteIcon size={18} aria-hidden />;
}
export function IconPrev() {
  return <RewindIcon size={18} weight="fill" aria-hidden />;
}
export function IconPlay() {
  return <PlayIcon size={20} weight="fill" aria-hidden />;
}
export function IconPause() {
  return <PauseIcon size={20} weight="fill" aria-hidden />;
}
export function IconNext() {
  return <FastForwardIcon size={18} weight="fill" aria-hidden />;
}
export function IconVolumeLow() {
  return <SpeakerLowIcon size={18} weight="fill" aria-hidden />;
}
export function IconVolumeHigh() {
  return <SpeakerHighIcon size={18} weight="fill" aria-hidden />;
}
export function IconChevronLeft() {
  return <CaretLeftIcon size={14} weight="bold" aria-hidden />;
}
export function IconPlayFill({ size = 14 }: { size?: number }) {
  return <PlayIcon size={size} weight="fill" aria-hidden />;
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
