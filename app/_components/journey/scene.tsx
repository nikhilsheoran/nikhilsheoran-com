"use client";

/* eslint-disable react-hooks/immutability -- The animation loop updates mutable Three.js scene objects. */
import { Suspense, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Environment } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapters } from "@/lib/journey/story";
import {
  journeyPose,
  screenPose,
  smootherStep,
  transitionPosition,
  advanceSpring,
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
  const { camera, size } = useThree();
  const lastReportRef = useRef(0);
  const motion = useMemo(
    () => ({
      mode: "orbit" as "orbit" | "entering" | "returning" | "desktop",
      elapsed: 0,
      duration: 1.4,
      startEntry: 0,
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
      startRotation: new THREE.Quaternion(),
      endRotation: new THREE.Quaternion(),
      look: new THREE.Matrix4(),
      target: new THREE.Vector3(),
    }),
    [],
  );
  useEffect(() => {
    onReady();
  }, [onReady]);
  useFrame(({ clock }, rawDelta) => {
    const state = runtimeRef.current;
    const dt = Math.min(rawDelta, 0.05);
    const aspect = size.width / size.height;
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const mode = state.entering
      ? "entering"
      : state.returning
        ? "returning"
        : state.desktop
          ? "desktop"
          : "orbit";
    if ((mode === "entering" || mode === "returning") && motion.mode !== mode) {
      // Snapshot the displayed pose once, including auto-entry and interrupted entry.
      motion.from.copy(camera.position);
      motion.startRotation.copy(camera.quaternion);
      motion.startEntry = state.entry;
      motion.elapsed = 0;
      state.velocity = 0;
      if (mode === "returning") state.progress = state.target;
      else state.target = state.progress;
      motion.duration = mode === "entering" ? 1.5 : 1.25;
    }
    motion.mode = mode;
    if (mode === "entering" || mode === "returning") {
      motion.elapsed = Math.min(motion.duration, motion.elapsed + dt);
      const t = state.reducedMotion
        ? 1
        : smootherStep(motion.elapsed / motion.duration);
      const destination =
        mode === "entering"
          ? screenPose(aspect, fov)
          : journeyPose(state.progress, aspect, fov);
      motion.to.fromArray(destination.position);
      motion.target.fromArray(destination.target);
      motion.look.lookAt(motion.to, motion.target, camera.up);
      motion.endRotation.setFromRotationMatrix(motion.look);
      camera.position.fromArray(
        transitionPosition(motion.from.toArray(), destination.position, t),
      );
      camera.quaternion.slerpQuaternions(
        motion.startRotation,
        motion.endRotation,
        t,
      );
      state.entry =
        motion.startEntry +
        ((mode === "entering" ? 1 : 0) - motion.startEntry) * t;
      if (t >= 1) {
        if (mode === "entering") onArrive();
        else onReturnComplete();
      }
    } else if (mode === "desktop") {
      const pose = screenPose(aspect, fov);
      camera.position.fromArray(pose.position);
      motion.target.fromArray(pose.target);
      camera.lookAt(motion.target);
    } else {
      const next = advanceSpring(
        state.progress,
        state.velocity,
        state.target,
        dt,
        state.dragging ? 28 : 11,
      );
      state.progress = state.reducedMotion
        ? state.target
        : THREE.MathUtils.clamp(next.value, 0, 1);
      state.velocity = state.reducedMotion ? 0 : next.velocity;
      const pose = journeyPose(state.progress, aspect, fov);
      camera.position.fromArray(pose.position);
      motion.target.fromArray(pose.target);
      camera.lookAt(motion.target);
      if (state.progress < 0.88) state.snapArmed = true;
      if (
        state.snapArmed &&
        state.target > 0.995 &&
        state.progress > 0.995 &&
        Math.abs(state.velocity) < 0.03 &&
        !state.dragging
      )
        onEnter();
    }
    camera.updateMatrixWorld();
    camera.position.toArray(state.cameraPosition);
    state.focusDistance = camera.position.distanceTo(motion.target);
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
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);
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
