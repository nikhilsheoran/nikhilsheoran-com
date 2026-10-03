"use client";

import {
  createElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import styles from "./journey.module.css";

/**
 * Liquid glass as a lens, not a frost. Each pane gets a displacement map
 * computed for its own size and corner radius: light entering a convex bezel
 * (a squircle edge profile) is refracted by Snell's law, so the backdrop stays
 * clear in the middle and bends, magnified, in a narrow band along the rim.
 * A specular map adds the rim light from the upper left and its echo lower
 * right, and the red and blue channels refract slightly differently for a
 * faint colour fringe. Applied with backdrop-filter: url(), which Chromium
 * supports; elsewhere the CSS in .glass (clear tint, rim, shadow) stands alone.
 */

const IOR = 1.5;
/** How differently red and blue bend at the rim. */
const FRINGE = 0.07;
const CHANNELS = [
  ["r", 1, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"],
  ["g", 0, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"],
  ["b", -1, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"],
] as const;

interface Lens {
  width: number;
  height: number;
  map: string;
  specular: string;
  bevel: string;
  /** Alpha mask of the pane's interior, fading out across the bezel. */
  core: string;
  scale: number;
}

/** Signed distance to a rounded rectangle (negative inside). */
function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  const qx = Math.abs(x - w / 2) - (w / 2 - r);
  const qy = Math.abs(y - h / 2) - (h / 2 - r);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r
  );
}

function buildLens(
  width: number,
  height: number,
  radius: number,
  bezel: number,
  depth: number,
  rimPower: number,
  rimGain: number,
  bevelGain: number,
): Lens {
  const r = Math.min(radius, width / 2, height / 2);
  const edge = Math.min(bezel, r, width / 2, height / 2);
  const count = width * height;
  const dx = new Float32Array(count);
  const dy = new Float32Array(count);
  const rim = new Float32Array(count);
  // Signed bevel shading: + lit side of the raised edge, - shaded side.
  const shade = new Float32Array(count);
  // Light from the upper left, as on Apple's panes.
  const lx = -0.62,
    ly = -0.78;
  let peak = 1e-6;

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = i + 0.5,
        y = j + 0.5;
      const inside = -roundedRect(x, y, width, height, r);
      if (inside <= 0 || inside >= edge) continue;
      // Outward normal of the edge, from the distance field's gradient.
      const gx =
        roundedRect(x + 0.5, y, width, height, r) -
        roundedRect(x - 0.5, y, width, height, r);
      const gy =
        roundedRect(x, y + 0.5, width, height, r) -
        roundedRect(x, y - 0.5, width, height, r);
      const gl = Math.hypot(gx, gy) || 1;
      const nx = gx / gl,
        ny = gy / gl;

      // Convex squircle bezel: height f(t) rises from the rim to the flat top.
      const t = Math.max(inside / edge, 0.02);
      const u = 1 - t;
      const f = Math.pow(1 - u ** 4, 0.25);
      const slope = ((u ** 3 * Math.pow(1 - u ** 4, -0.75)) * depth) / edge;
      const incident = Math.atan(slope);
      const refracted = Math.asin(Math.sin(incident) / IOR);
      const shift = depth * f * Math.tan(incident - refracted);

      const k = j * width + i;
      // The rim shows content from further inside the pane.
      dx[k] = -nx * shift;
      dy[k] = -ny * shift;
      peak = Math.max(peak, shift);

      const toward = nx * lx + ny * ly;
      const band = Math.max(0, 1 - inside / 2);
      // Mostly invisible: the rim only catches light where it faces the
      // source (and its echo opposite), in short arcs.
      rim[k] = Math.pow(Math.abs(toward), rimPower) * band * rimGain;
      // A raised, rounded edge: brightest/darkest at the rim, easing inward.
      shade[k] = toward * Math.pow(u, 1.6);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(width, height);
  for (let k = 0; k < count; k++) {
    image.data[k * 4] = 127.5 + (dx[k] / peak) * 127.5;
    image.data[k * 4 + 1] = 127.5 + (dy[k] / peak) * 127.5;
    image.data[k * 4 + 2] = 128;
    image.data[k * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const map = canvas.toDataURL();

  for (let k = 0; k < count; k++) {
    image.data[k * 4] = image.data[k * 4 + 1] = image.data[k * 4 + 2] = 255;
    image.data[k * 4 + 3] = Math.min(1, rim[k]) * 255;
  }
  ctx.putImageData(image, 0, 0);
  const specular = canvas.toDataURL();

  for (let k = 0; k < count; k++) {
    const lit = shade[k] > 0;
    image.data[k * 4] = image.data[k * 4 + 1] = image.data[k * 4 + 2] = lit ? 255 : 0;
    image.data[k * 4 + 3] = Math.min(1, Math.abs(shade[k]) * (lit ? 0.26 : 0.3) * bevelGain) * 255;
  }
  ctx.putImageData(image, 0, 0);
  const bevel = canvas.toDataURL();

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const inside = -roundedRect(i + 0.5, j + 0.5, width, height, r);
      const t = Math.min(1, Math.max(0, (inside - edge * 0.5) / (edge * 1.2)));
      const k = j * width + i;
      image.data[k * 4] = image.data[k * 4 + 1] = image.data[k * 4 + 2] = 255;
      image.data[k * 4 + 3] = t * t * (3 - 2 * t) * 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return {
    width,
    height,
    map,
    specular,
    bevel,
    core: canvas.toDataURL(),
    scale: peak * 2,
  };
}

const supportsLens =
  typeof CSS !== "undefined" &&
  CSS.supports("backdrop-filter", "url(#a)") &&
  typeof navigator !== "undefined" &&
  /Chrome\//.test(navigator.userAgent);

type GlassProps<T extends ElementType> = {
  as?: T;
  /** Width of the refracting rim in px. */
  bezel?: number;
  /** Thickness of the pane; higher bends the rim harder. */
  depth?: number;
  /** Frost inside the pane, in px. */
  blur?: number;
  saturate?: number;
  /** How differently red and blue bend at the rim. */
  fringe?: number;
  /** Higher = shorter, sharper rim highlights. */
  rimPower?: number;
  rimGain?: number;
  /** Strength of the raised-edge light and shade. */
  bevelGain?: number;
  /** Blur (px) of the pane's interior only; the rim stays sharp. Aids text contrast. */
  coreBlur?: number;
  /** Interior blur to ease to while the pointer is over the pane. */
  hoverBlur?: number;
  /** Interior blur to ease to while the pane is pressed. */
  pressBlur?: number;
} & ComponentPropsWithoutRef<T>;

export function Glass<T extends ElementType = "div">({
  as,
  // Defaults are the chosen recipe: a clear pane with a deep refracting rim.
  bezel = 26,
  depth = 57,
  blur = 0.35,
  saturate = 1.28,
  fringe = FRINGE,
  rimPower = 5,
  rimGain = 1.2,
  bevelGain = 0.95,
  coreBlur = 0,
  hoverBlur,
  pressBlur,
  className,
  style,
  children,
  ...rest
}: GlassProps<T>) {
  const ref = useRef<HTMLElement>(null);
  const id = `glass-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [lens, setLens] = useState<Lens | null>(null);
  const deepRef = useRef<SVGFEGaussianBlurElement>(null);
  const blurNow = useRef(coreBlur);
  const blurFrame = useRef(0);
  /** Ease the interior blur toward a value without re-rendering. */
  const easeBlur = (target: number) => {
    cancelAnimationFrame(blurFrame.current);
    const tick = () => {
      blurNow.current += (target - blurNow.current) * 0.22;
      if (Math.abs(target - blurNow.current) < 0.05) blurNow.current = target;
      deepRef.current?.setAttribute("stdDeviation", String(Math.max(blurNow.current, 0.01)));
      if (blurNow.current !== target) blurFrame.current = requestAnimationFrame(tick);
    };
    tick();
  };

  useEffect(() => {
    const node = ref.current;
    if (!node || !supportsLens) return;
    const measure = () => {
      const width = Math.round(node.offsetWidth);
      const height = Math.round(node.offsetHeight);
      if (width < 8 || height < 8) return;
      const radius = parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0;
      setLens((current) =>
        current?.width === width && current.height === height
          ? current
          : buildLens(width, height, radius, bezel, depth, rimPower, rimGain, bevelGain),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [bezel, depth, rimPower, rimGain, bevelGain]);

  return (
    <>
      {createElement(
        as ?? "div",
        {
          ...rest,
          ref,
          className: `${styles.glass} ${className ?? ""}`,
          "data-lens": lens ? "" : undefined,
          // The rim light swings toward the pointer while it is over the pane.
          onPointerMove: (event: PointerEvent<HTMLElement>) => {
            const box = event.currentTarget.getBoundingClientRect();
            const dx = event.clientX - (box.left + box.width / 2);
            const dy = event.clientY - (box.top + box.height / 2);
            // Pointer position in -1..1, for hover effects that tilt or follow.
            event.currentTarget.style.setProperty("--px", (dx / (box.width / 2)).toFixed(3));
            event.currentTarget.style.setProperty("--py", (dy / (box.height / 2)).toFixed(3));
            event.currentTarget.style.setProperty(
              "--light",
              `${Math.round((Math.atan2(dx, -dy) * 180) / Math.PI)}deg`,
            );
          },
          onPointerDown: (event: PointerEvent<HTMLElement>) => {
            if (pressBlur !== undefined) easeBlur(pressBlur);
            (rest as { onPointerDown?: (e: PointerEvent<HTMLElement>) => void }).onPointerDown?.(event);
          },
          onPointerUp: () => {
            if (pressBlur !== undefined) easeBlur(hoverBlur ?? coreBlur);
          },
          onPointerEnter: () => {
            if (hoverBlur !== undefined) easeBlur(hoverBlur);
          },
          onPointerLeave: (event: PointerEvent<HTMLElement>) => {
            if (hoverBlur !== undefined || pressBlur !== undefined) easeBlur(coreBlur);
            event.currentTarget.style.removeProperty("--light");
          },
          style: lens
            ? { ...style, backdropFilter: `url(#${id})` }
            : style,
        },
        children,
      )}
      {lens &&
        createPortal(
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
            <filter
              id={id}
              x="0"
              y="0"
              width={lens.width}
              height={lens.height}
              filterUnits="userSpaceOnUse"
              primitiveUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(blur, 0.01)} result="soft" />
              <feImage
                href={lens.map}
                x="0"
                y="0"
                width={lens.width}
                height={lens.height}
                result="map"
              />
              {/* Filter primitives must be direct children: no wrappers. */}
              {CHANNELS.flatMap(([name, factor, matrix]) => [
                <feDisplacementMap
                  key={`bend-${name}`}
                  in="soft"
                  in2="map"
                  scale={lens.scale * (1 + factor * fringe)}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result={`bent-${name}`}
                />,
                <feColorMatrix
                  key={`keep-${name}`}
                  in={`bent-${name}`}
                  type="matrix"
                  values={matrix}
                  result={name}
                />,
              ])}
              <feBlend in="r" in2="g" mode="screen" result="rg" />
              <feBlend in="rg" in2="b" mode="screen" result="rgb" />
              <feColorMatrix in="rgb" type="saturate" values={String(saturate)} result="rich" />
              {/* Raised bevel: light on the edges facing the light, shade on the far ones. */}
              <feImage
                href={lens.bevel}
                x="0"
                y="0"
                width={lens.width}
                height={lens.height}
                result="bevel"
              />
              {/* Optional: frost only the interior, leaving the rim clear. */}
              <feGaussianBlur
                ref={deepRef}
                in="rich"
                stdDeviation={Math.max(coreBlur, 0.01)}
                result="deep"
              />
              <feImage
                href={lens.core}
                x="0"
                y="0"
                width={lens.width}
                height={lens.height}
                result="coreMask"
              />
              <feComposite in="deep" in2="coreMask" operator="in" result="deepCore" />
              <feComposite in="deepCore" in2="rich" operator="over" result="body" />
              <feComposite in="bevel" in2="body" operator="over" result="raised" />
              {/* The rim's shine comes from its surroundings: a wide, brightened
                  blur of what is behind the pane, shown only along the rim. */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="ambient" />
              <feColorMatrix
                in="ambient"
                type="matrix"
                values="1.9 0 0 0 0.12  0 1.9 0 0 0.12  0 0 1.9 0 0.12  0 0 0 1 0"
                result="glow"
              />
              <feImage
                href={lens.specular}
                x="0"
                y="0"
                width={lens.width}
                height={lens.height}
                result="rim"
              />
              <feComposite in="glow" in2="rim" operator="in" result="shine" />
              <feBlend in="shine" in2="raised" mode="screen" />
            </filter>
          </svg>,
          document.body,
        )}
    </>
  );
}
