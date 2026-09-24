import * as THREE from "three";
import type { Work } from "@/lib/journey/works";

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

/** The work's artwork, cover-fitted to the sheet's 16:10 print area. No printed text. */
export async function createArtworkTexture(work: Work) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#3c4540";
  ctx.fillRect(0, 0, 1600, 1000);
  const image = await loadImage(work.image);
  if (image) cover(ctx, image, 0, 0, 1600, 1000);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.name = `work-${work.slug}`;
  return texture;
}

const ACTION_ICON = { youtube: "play", x: "x", web: "globe" } as const;

/** Transparent printed ink, sampled in the same UV space and lighting as the artwork. */
export async function createActionTexture(kind: Work["kind"]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d")!;
  const [icon, arrow] = await Promise.all([
    loadImage(`/journey/action-${ACTION_ICON[kind]}.svg`),
    loadImage("/journey/action-external.svg"),
  ]);
  ctx.fillStyle = "#08140fb3";
  ctx.strokeStyle = "#ffffffd9";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(800, 500, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (icon) ctx.drawImage(icon, 764, 464, 72, 72);
  ctx.beginPath();
  ctx.arc(1494, 104, 40, 0, Math.PI * 2);
  ctx.fill();
  if (arrow) ctx.drawImage(arrow, 1468, 78, 52, 52);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Shown on the laptop only until the live desktop iframe reports ready. */
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
