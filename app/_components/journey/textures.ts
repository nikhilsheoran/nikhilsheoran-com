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

function cover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
  ctx.restore();
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  let line = "";
  for (const word of text.split(" ")) {
    if (ctx.measureText(`${line}${word} `).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      y += lineHeight;
      line = "";
    }
    line += `${word} `;
  }
  ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
}

/** Full-bleed photographic fabric. Labels are printed into the surface, not framed cards. */
export async function createPageTexture(chapter: Chapter, index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d")!;
  const image = await loadImage(chapter.image);
  ctx.fillStyle = chapter.accent;
  ctx.fillRect(0, 0, 1400, 900);
  if (image) cover(ctx, image, 0, 0, 1400, 900);
  const shade = ctx.createLinearGradient(0, 280, 0, 900);
  shade.addColorStop(0, "#0a151900");
  shade.addColorStop(1, "#071516d9");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 1400, 900);
  ctx.fillStyle = "#f0f1e8";
  ctx.font = "500 24px -apple-system, sans-serif";
  ctx.fillText(chapter.year + "   /   " + chapter.name, 65, 698);
  ctx.font = "500 70px -apple-system, sans-serif";
  wrap(ctx, chapter.title, 60, 790, 1250, 76);
  // Deterministic, extremely fine print grain; the shader supplies the changing folds/light.
  for (let y = 0; y < 900; y += 3) {
    ctx.fillStyle = y % 6 ? "#ffffff05" : "#00000005";
    ctx.fillRect(0, y, 1400, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.name = `chapter-fabric-${index}`;
  return texture;
}

/** Lightweight on-device screen preview. Entry hands off to the real DesktopShell. */
export async function createScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 800;
  const ctx = canvas.getContext("2d")!;
  const images = await Promise.all(
    [
      "/wallpapers/Sonoma.jpeg",
      "/icons/finder.png",
      "/icons/notes.png",
      "/icons/music.png",
      "/icons/tv.png",
      "/icons/settings.png",
    ].map(loadImage),
  );
  if (images[0]) cover(ctx, images[0], 0, 0, 1280, 800);
  else {
    ctx.fillStyle = "#708776";
    ctx.fillRect(0, 0, 1280, 800);
  }
  ctx.fillStyle = "#ffffff66";
  ctx.fillRect(0, 0, 1280, 28);
  ctx.font = "600 15px -apple-system, sans-serif";
  ctx.fillStyle = "#182e22";
  ctx.fillText(
    "    Finder    File    Edit    View    Go    Window    Help",
    17,
    20,
  );
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffffe0";
  ctx.font = "500 52px -apple-system, sans-serif";
  ctx.fillText("Make yourself at home.", 640, 370);
  ctx.font = "23px -apple-system, sans-serif";
  ctx.fillText("Nikhil’s Mac", 640, 418);
  ctx.fillStyle = "#ffffff70";
  ctx.beginPath();
  ctx.roundRect(420, 700, 440, 82, 24);
  ctx.fill();
  images.slice(1).forEach((image, index) => {
    if (image) ctx.drawImage(image, 442 + index * 82, 709, 64, 64);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createLogoTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.font = "100px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("", 64, 65);
  return new THREE.CanvasTexture(canvas);
}
