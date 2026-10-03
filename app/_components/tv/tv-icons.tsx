"use client";

// Line icons come from Phosphor so every app shares one consistent, well-drawn set.
import {
  BookmarkSimpleIcon,
  FilmStripIcon,
  HouseIcon,
  StarIcon,
  TelevisionSimpleIcon,
} from "@phosphor-icons/react";

export function IconHome() {
  return <HouseIcon size={18} aria-hidden />;
}
export function IconTV() {
  return <TelevisionSimpleIcon size={18} aria-hidden />;
}
export function IconFilm() {
  return <FilmStripIcon size={18} aria-hidden />;
}
export function IconBookmark() {
  return <BookmarkSimpleIcon size={18} aria-hidden />;
}
export function IconStar() {
  return <StarIcon size={18} aria-hidden />;
}
