"use client";

/* eslint-disable react-hooks/immutability -- The animation loop updates mutable Three.js scene objects. */
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import Link from "next/link";
import { Environment } from "@react-three/drei";
import { Canvas, events, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapters } from "@/lib/journey/story";
import {
  journeyPose,
  screenPose,
  smootherStep,
  transitionPosition,
  advanceSpring,
  PANEL_END,
  SCREEN_SNAP_START,
} from "@/lib/journey/path";
import { Apartment, Desk, Laptop } from "./objects";
import { Cloth } from "./cloth";
import { Lens } from "./lens";
import { ScreenProjection } from "./screen";
import type { SceneProps } from "./portal";

function CameraRig({
  runtimeRef,
  onArrive,
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
      // Only explicit laptop clicks need a separate approach from an arbitrary angle.
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
      // Finish the last few centimetres even if the pointer enters the live
      // iframe and its own scrolling takes over. Reverse input can interrupt.
      if (
        state.snapArmed &&
        state.target >= SCREEN_SNAP_START &&
        state.progress >= SCREEN_SNAP_START - 0.005 &&
        !state.dragging
      ) {
        state.autoFocusing = true;
        state.target = Math.max(PANEL_END, state.target);
      }
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
      if (state.progress < 0.76) state.snapArmed = true;
      if (
        state.snapArmed &&
        state.target >= PANEL_END &&
        state.progress >= PANEL_END - 0.0005 &&
        !state.dragging
      ) {
        // We are already at the screen pose. Only interaction/UI state changes.
        state.progress = PANEL_END;
        state.target = PANEL_END;
        state.velocity = 0;
        onArrive();
      }
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
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-normalBias={0.0015}
        shadow-bias={-0.00002}
        shadow-radius={2}
      />
      <directionalLight
        position={[1, 4, -4]}
        intensity={0.35}
        color="#eef3ff"
      />
      <pointLight
        position={[-6.966, 1.48, 4]}
        color="#ffd09b"
        intensity={3}
        distance={4}
        decay={2}
      />
      <pointLight
        position={[-6.966, 4.58, 1.075]}
        color="#ffe1b8"
        intensity={5}
        distance={6}
        decay={2}
      />
      <pointLight
        position={[7.48, 3.55, 0.3]}
        color="#ffdcaa"
        intensity={2}
        distance={4}
        decay={2}
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
      eventSource={props.surfaceRef as RefObject<HTMLDivElement>}
      events={(root) => ({
        ...events(root),
        compute: (event, state) => {
          state.pointer.set(
            (event.clientX / state.size.width) * 2 - 1,
            -(event.clientY / state.size.height) * 2 + 1,
          );
          if (
            (event.target as Element)?.closest(
              "button,a,input,iframe,[data-journey-ui]",
            )
          )
            return;
          state.raycaster.setFromCamera(state.pointer, state.camera);
        },
      })}
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
