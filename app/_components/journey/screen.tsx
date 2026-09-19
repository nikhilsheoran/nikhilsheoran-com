"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  SCREEN_POSITION,
  SCREEN_TILT,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from "@/lib/journey/story";
import { quadMatrix } from "@/lib/journey/path";
import type { SceneProps } from "./portal";

/** A persistent DOM iframe is projected onto the same four corners as the WebGL screen. */
export function ScreenProjection({
  runtimeRef,
  screenRef,
  canvasRef,
}: Pick<SceneProps, "runtimeRef" | "screenRef" | "canvasRef">) {
  const corners = useMemo(() => {
    const rotation = new THREE.Matrix4().makeRotationX(SCREEN_TILT);
    const origin = new THREE.Vector3(...SCREEN_POSITION);
    return [
      [-(SCREEN_WIDTH / 2), SCREEN_HEIGHT / 2],
      [SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2],
      [SCREEN_WIDTH / 2, -(SCREEN_HEIGHT / 2)],
      [-(SCREEN_WIDTH / 2), -(SCREEN_HEIGHT / 2)],
    ].map(([x, y]) =>
      new THREE.Vector3(x, y, 0).applyMatrix4(rotation).add(origin),
    );
  }, []);
  const projected = useMemo(
    () => corners.map(() => new THREE.Vector3()),
    [corners],
  );
  const previous = useMemo(() => new THREE.Matrix4(), []);
  const current = useMemo(() => new THREE.Matrix4(), []);
  const lastRef = useRef({ width: 0, height: 0, ready: false });
  useFrame(({ camera, size }) => {
    const last = lastRef.current;
    const element = screenRef.current,
      canvas = canvasRef.current,
      state = runtimeRef.current;
    if (!element || !canvas) return;
    camera.updateMatrixWorld();
    current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    if (
      current.equals(previous) &&
      last.width === size.width &&
      last.height === size.height &&
      last.ready === state.frameReady
    )
      return;
    previous.copy(current);
    last.width = size.width;
    last.height = size.height;
    last.ready = state.frameReady;
    const points = corners.map((corner, i): [number, number] => {
      projected[i].copy(corner).project(camera);
      const x = ((projected[i].x + 1) * size.width) / 2,
        y = ((1 - projected[i].y) * size.height) / 2;
      return [x, y];
    });
    element.style.width = "1440px";
    element.style.height = "900px";
    element.style.transform = `matrix3d(${quadMatrix(points, 1440, 900).join(",")})`;
    element.style.zIndex = "1";
    element.style.visibility = state.frameReady ? "visible" : "hidden";
    element.style.setProperty(
      "--screen-glare",
      String(
        0.48 +
          Math.min(
            0.3,
            Math.abs(camera.position.x - SCREEN_POSITION[0]) * 0.055,
          ),
      ),
    );
    canvas.style.opacity = "1";
  });
  return null;
}
