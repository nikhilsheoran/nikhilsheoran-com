import * as THREE from "three";
import type { Chapter } from "@/lib/journey/story";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let line = "";
  for (const word of text.split(" ")) {
    if (ctx.measureText(`${line}${word} `).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y); y += lineHeight; line = "";
    }
    line += `${word} `;
  }
  ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
}

export async function createPageTexture(chapter: Chapter, index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 768;
  const ctx = canvas.getContext("2d")!;
  const image = await loadImage(chapter.image);
  ctx.fillStyle = "#f4f2ed"; ctx.fillRect(0, 0, 1024, 768);
  ctx.fillStyle = chapter.accent; ctx.fillRect(0, 0, 1024, 12);
  ctx.fillStyle = "#626960";
  ctx.font = "20px -apple-system, sans-serif";
  ctx.fillText("NIKHIL SHEORAN", 48, 57);
  ctx.textAlign = "right"; ctx.fillText(chapter.year, 976, 57); ctx.textAlign = "left";
  ctx.strokeStyle = "#c6cbc0"; ctx.beginPath(); ctx.moveTo(48, 80); ctx.lineTo(976, 80); ctx.stroke();
  if (image) cover(ctx, image, index % 2 === 0 ? 480 : 48, 110, 496, 522);
  const textX = index % 2 === 0 ? 48 : 588;
  ctx.fillStyle = chapter.accent;
  ctx.font = "500 18px -apple-system, sans-serif";
  ctx.fillText(chapter.name.toUpperCase(), textX, 149);
  ctx.fillStyle = "#222b25";
  ctx.font = "500 55px -apple-system, sans-serif";
  const endY = wrap(ctx, chapter.title, textX, 234, 360, 61);
  ctx.font = "23px -apple-system, sans-serif"; ctx.fillStyle = "#5e665e";
  wrap(ctx, chapter.detail, textX, endY + 40, 350, 35);
  ctx.strokeStyle = "#c6cbc0"; ctx.beginPath(); ctx.moveTo(48, 672); ctx.lineTo(976, 672); ctx.stroke();
  ctx.font = "18px -apple-system, sans-serif"; ctx.fillStyle = "#626960";
  ctx.fillText("A FEW THINGS ALONG THE WAY", 48, 717);
  ctx.textAlign = "right"; ctx.fillText("OPEN CHAPTER ↗", 976, 717);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Lightweight on-device screen preview. Entry hands off to the real DesktopShell. */
export async function createScreenTexture() {
  const canvas = document.createElement("canvas"); canvas.width = 1280; canvas.height = 800;
  const ctx = canvas.getContext("2d")!;
  const images = await Promise.all(["/wallpapers/Sonoma.jpeg", "/icons/finder.png", "/icons/notes.png", "/icons/music.png", "/icons/tv.png", "/icons/settings.png"].map(loadImage));
  if (images[0]) cover(ctx, images[0], 0, 0, 1280, 800);
  else { ctx.fillStyle = "#708776"; ctx.fillRect(0, 0, 1280, 800); }
  ctx.fillStyle = "#ffffff66"; ctx.fillRect(0, 0, 1280, 28);
  ctx.font = "600 15px -apple-system, sans-serif"; ctx.fillStyle = "#182e22";
  ctx.fillText("    Finder    File    Edit    View    Go    Window    Help", 17, 20);
  ctx.textAlign = "center"; ctx.fillStyle = "#ffffffe0";
  ctx.font = "500 52px -apple-system, sans-serif"; ctx.fillText("Make yourself at home.", 640, 370);
  ctx.font = "23px -apple-system, sans-serif"; ctx.fillText("Nikhil’s Mac", 640, 418);
  ctx.fillStyle = "#ffffff70"; ctx.beginPath(); ctx.roundRect(420, 700, 440, 82, 24); ctx.fill();
  images.slice(1).forEach((image, index) => { if (image) ctx.drawImage(image, 442 + index * 82, 709, 64, 64); });
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createLogoTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.font = "100px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("", 64, 65);
  return new THREE.CanvasTexture(canvas);
}
