"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCREEN_POSITION, SCREEN_TILT } from "@/lib/journey/story";
import { quadMatrix, smoothStep } from "@/lib/journey/path";
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
      [-0.5425, 0.3395],
      [0.5425, 0.3395],
      [0.5425, -0.3395],
      [-0.5425, -0.3395],
    ].map(([x, y]) =>
      new THREE.Vector3(x, y, 0).applyMatrix4(rotation).add(origin),
    );
  }, []);
  const projected = useMemo(
    () => corners.map(() => new THREE.Vector3()),
    [corners],
  );
  useFrame(({ camera, size }) => {
    const element = screenRef.current,
      canvas = canvasRef.current,
      state = runtimeRef.current;
    if (!element || !canvas) return;
    camera.updateMatrixWorld();
    const blend = smoothStep((state.entry - 0.82) / 0.18);
    const targets = [
      [0, 0],
      [size.width, 0],
      [size.width, size.height],
      [0, size.height],
    ];
    const points = corners.map((corner, i): [number, number] => {
      projected[i].copy(corner).project(camera);
      const x = ((projected[i].x + 1) * size.width) / 2,
        y = ((1 - projected[i].y) * size.height) / 2;
      return [
        THREE.MathUtils.lerp(x, targets[i][0], blend),
        THREE.MathUtils.lerp(y, targets[i][1], blend),
      ];
    });
    element.style.width = `${size.width}px`;
    element.style.height = `${size.height}px`;
    element.style.transform = `matrix3d(${quadMatrix(points, size.width, size.height).join(",")})`;
    // Once the screen expands beyond the physical bezel, bring it above the scene.
    element.style.zIndex = blend > 0 ? "4" : "1";
    element.style.visibility = state.frameReady ? "visible" : "hidden";
    canvas.style.opacity = String(1 - blend);
  });
  return null;
}
