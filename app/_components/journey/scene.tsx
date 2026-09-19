"use client";

/* eslint-disable react-hooks/immutability -- The animation loop updates mutable Three.js scene objects. */
import { Suspense, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Environment } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  chapters,
  chapterProgress,
  SCREEN_POSITION,
  SCREEN_TILT,
} from "@/lib/journey/story";
import {
  journeyPose,
  safeCameraPosition,
  screenApproach,
  ribbonPose,
  smoothStep,
} from "@/lib/journey/path";
import { Apartment, Desk, Laptop } from "./objects";
import { Cloth } from "./cloth";
import { Lens } from "./lens";
import { ScreenProjection } from "./screen";
import type { SceneProps } from "./portal";

function CameraRig({
  runtimeRef,
  onArrive,
  onEnter,
  onProgress,
  onReady,
  onReturnComplete,
}: SceneProps) {
  const { camera, size, pointer } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 1.4, 0));
  const fromRef = useRef(new THREE.Vector3());
  const fromTargetRef = useRef(new THREE.Vector3());
  const wasEnteringRef = useRef(false);
  const lastReportRef = useRef(0);
  const parallaxRef = useRef(new THREE.Vector2());
  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      screen: new THREE.Vector3(...SCREEN_POSITION),
      focus: new THREE.Vector3(),
    }),
    [],
  );
  useEffect(() => {
    onReady();
  }, [onReady]);
  useFrame(({ clock }, rawDelta) => {
    const state = runtimeRef.current;

    const delta = Math.min(rawDelta, 0.05);
    const before = state.progress;
    state.progress =
      state.entering || state.returning || state.desktop
        ? state.progress
        : state.reducedMotion
          ? state.target
          : THREE.MathUtils.damp(state.progress, state.target, 4.2, delta);
    state.velocity = state.reducedMotion
      ? 0
      : THREE.MathUtils.damp(
          state.velocity,
          (state.progress - before) / Math.max(delta, 0.001),
          5,
          delta,
        );
    const aspect = size.width / size.height;
    const pose = journeyPose(
      state.progress,
      aspect,
      (camera as THREE.PerspectiveCamera).fov,
    );
    scratch.position.fromArray(pose.position);
    scratch.target.fromArray(pose.target);
    parallaxRef.current.lerp(
      state.reducedMotion ? new THREE.Vector2() : pointer,
      1 - Math.exp(-3 * delta),
    );
    const offset =
      (1 - smoothStep(state.progress)) *
      (state.entering || state.returning || state.desktop ? 0 : 1);
    scratch.position.x += parallaxRef.current.x * 0.15 * offset;
    scratch.position.y += parallaxRef.current.y * 0.08 * offset;
    if (state.entering && !wasEnteringRef.current) {
      fromRef.current.copy(camera.position);
      fromTargetRef.current.copy(targetRef.current);
    }

    if (state.entering || state.returning || state.desktop) {
      state.entry = state.reducedMotion
        ? state.returning
          ? 0
          : 1
        : THREE.MathUtils.clamp(
            state.entry + ((state.returning ? -1 : 1) * delta) / 1.65,
            0,
            1,
          );
      const t = smoothStep(state.entry);
      camera.position.fromArray(
        screenApproach(
          fromRef.current.toArray(),
          t,
          aspect,
          (camera as THREE.PerspectiveCamera).fov,
        ),
      );
      targetRef.current.lerpVectors(
        fromTargetRef.current,
        scratch.screen,
        smoothStep(Math.min(1, state.entry * 1.4)),
      );
      if (state.entering && state.entry >= 1) onArrive();
      if (state.returning && state.entry <= 0) {
        state.returning = false;
        onReturnComplete();
      }
    } else {
      camera.position.copy(scratch.position);
      targetRef.current.copy(scratch.target);
    }
    camera.position.fromArray(safeCameraPosition(camera.position.toArray()));
    if (state.progress < 0.88) state.snapArmed = true;
    if (
      state.snapArmed &&
      state.progress > 0.965 &&
      !state.dragging &&
      !state.entering &&
      !state.returning &&
      !state.desktop
    )
      onEnter();
    camera.lookAt(targetRef.current);
    const roll = state.reducedMotion
      ? 0
      : THREE.MathUtils.clamp(state.velocity * -0.028, -0.015, 0.015) *
        (1 - state.entry);
    camera.rotateZ(roll);
    state.cameraPosition = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ];
    const closest = chapters.reduce(
      (best, _, i) =>
        Math.abs(chapterProgress(i) - state.progress) <
        Math.abs(chapterProgress(best) - state.progress)
          ? i
          : best,
      0,
    );
    const clothPose = ribbonPose(state.progress, chapterProgress(closest));
    scratch.focus.set(
      Math.sin(clothPose.angle) * clothPose.radius,
      clothPose.height,
      clothPose.centerZ +
        Math.cos(clothPose.angle) * clothPose.radius * Math.cos(SCREEN_TILT),
    );
    const clothFocus =
      state.entry < 0.2 && state.progress > 0.055 && state.progress < 0.89;
    const focusBlend = smoothStep((state.progress - 0.76) / 0.12);
    scratch.focus.lerp(targetRef.current, clothFocus ? focusBlend : 1);
    state.focusDistance = -scratch.focus.applyMatrix4(camera.matrixWorldInverse)
      .z;
    wasEnteringRef.current = state.entering;
    if (clock.elapsedTime - lastReportRef.current > 0.08) {
      onProgress(state.progress);
      lastReportRef.current = clock.elapsedTime;
    }
  }, -2);
  return null;
}

function Atmosphere() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const result = new Float32Array(150 * 3);
    for (let i = 0; i < 150; i++) {
      const phase = i * 2.39996,
        r = 2 + (i % 19) * 0.35;
      result[i * 3] = Math.sin(phase) * r;
      result[i * 3 + 1] = (i * 0.371) % 8;
      result[i * 3 + 2] = Math.cos(phase) * r;
    }
    return result;
  }, []);
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#b2c2b7"
        transparent
        opacity={0.24}
        depthWrite={false}
      />
    </points>
  );
}

function World(props: SceneProps) {
  return (
    <>
      <color attach="background" args={["#c9c9c2"]} />
      <fog attach="fog" args={["#c9c9c2", 45, 95]} />
      <Environment
        files="/journey/studio_small_09_1k.hdr"
        environmentIntensity={0.45}
      />
      <ambientLight intensity={0.06} />
      <hemisphereLight args={["#fff5e7", "#b6a791", 0.32]} />
      <directionalLight
        position={[-3, 7, 7.5]}
        intensity={2.1}
        color="#fff5e8"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-normalBias={0.035}
        shadow-bias={-0.00015}
        shadow-radius={12}
      />
      <directionalLight
        position={[1, 4, -4]}
        intensity={0.35}
        color="#eef3ff"
      />
      <Apartment />
      <Desk />
      <Laptop onEnter={() => props.onEnter()} runtimeRef={props.runtimeRef} />
      {chapters.map((item, index) => (
        <Cloth
          key={item.year}
          item={item}
          index={index}
          runtimeRef={props.runtimeRef}
        />
      ))}
      <Atmosphere />
      <CameraRig {...props} />
      <ScreenProjection {...props} />
      <Lens runtimeRef={props.runtimeRef} />
    </>
  );
}

export function JourneyScene(props: SceneProps) {
  return (
    <Canvas
      frameloop="always"
      camera={{ position: [-5.9, 2.65, -5.8], fov: 40, near: 0.04, far: 120 }}
      dpr={[1, 2]}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      fallback={<Link href="/notes/about-me">Open the accessible website</Link>}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.AgXToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <Suspense fallback={null}>
        <World {...props} />
      </Suspense>
    </Canvas>
  );
}
