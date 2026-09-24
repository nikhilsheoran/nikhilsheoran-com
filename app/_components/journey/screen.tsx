"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  SCREEN_POSITION,
  SCREEN_TILT,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from "@/lib/journey/anchors";
import { quadMatrix } from "@/lib/journey/path";
import type { SceneProps } from "./runtime";

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
  const lastRef = useRef({ width: 0, height: 0, ready: false, full: false });
  const interaction = useMemo(() => {
    const origin = new THREE.Vector3(...SCREEN_POSITION);
    const normal = new THREE.Vector3(
      0,
      -Math.sin(SCREEN_TILT),
      Math.cos(SCREEN_TILT),
    );
    return {
      origin,
      normal,
      direction: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin),
      raycaster: new THREE.Raycaster(),
      panels: [] as THREE.Object3D[],
    };
  }, []);
  useFrame(({ camera, size, pointer, scene }) => {
    const last = lastRef.current;
    const element = screenRef.current,
      canvas = canvasRef.current,
      state = runtimeRef.current;
    if (!element || !canvas) return;
    camera.updateMatrixWorld();
    const front =
      interaction.direction
        .copy(camera.position)
        .sub(interaction.origin)
        .dot(interaction.normal) > 0.01;
    // The canvas draws in front but receives input from the surrounding surface.
    // Let the real iframe receive clicks through the screen opening at every distance.
    interaction.raycaster.setFromCamera(pointer, camera);
    const hit = interaction.raycaster.ray.intersectPlane(
      interaction.plane,
      interaction.hit,
    );
    let obscured = false;
    const onScreen =
      hit &&
      Math.abs(hit.x - interaction.origin.x) <= SCREEN_WIDTH / 2 &&
      Math.abs(
        (hit.y - interaction.origin.y) * Math.cos(SCREEN_TILT) +
          (hit.z - interaction.origin.z) * Math.sin(SCREEN_TILT),
      ) <=
        SCREEN_HEIGHT / 2;
    if (
      front &&
      onScreen &&
      Math.abs(pointer.x) <= 1 &&
      Math.abs(pointer.y) <= 1
    ) {
      interaction.panels.splice(0);
      scene.traverse((object) => {
        if (object.name === "journey-panel" && object.visible)
          interaction.panels.push(object);
      });
      const screenDistance = camera.position.distanceTo(interaction.hit);
      obscured = interaction.raycaster
        .intersectObjects(interaction.panels, true)
        .some((item) => item.distance < screenDistance);
    }
    element.style.pointerEvents =
      front && state.frameReady && !obscured ? "auto" : "none";
    // Phones can't use a 1440-wide desktop in a 16:10 bezel: once focused, the
    // screen becomes the whole viewport and the desktop switches to its mobile layout.
    const full = state.motion.mode === "focused" && size.width < 768;
    if (full !== last.full) {
      last.full = full;
      element.dataset.fullscreen = String(full);
      if (full) {
        element.style.transform = "none";
        element.style.width = `${size.width}px`;
        element.style.height = `${size.height}px`;
        element.style.visibility = "visible";
        element.style.pointerEvents = "auto";
      }
    }
    if (full) {
      element.style.pointerEvents = "auto";
      return;
    }
    current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    if (
      current.equals(previous) &&
      last.width === size.width &&
      last.height === size.height &&
      last.ready === state.frameReady &&
      element.style.width === "1440px"
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
    element.style.visibility = state.frameReady && front ? "visible" : "hidden";
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
