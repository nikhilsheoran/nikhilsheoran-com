"use client";

/* eslint-disable react-hooks/immutability -- The animation loop updates mutable Three.js scene objects. */
import { Suspense, useEffect, useRef, useState, type RefObject } from "react";
import { Environment, PerformanceMonitor } from "@react-three/drei";
import { Canvas, events, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { works } from "@/lib/journey/works";
import { LAPTOP_POSITION } from "@/lib/journey/anchors";
import { tuning } from "@/lib/journey/tuning";
import { beats } from "@/lib/journey/timeline";
import { step, type Mode, type Motion } from "@/lib/journey/machine";
import {
  approachPose,
  railPose,
  smootherStep,
  viewFov,
} from "@/lib/journey/path";
import {
  Apartment,
  BakedStudio,
  ClockEgg,
  Desk,
  DeskLink,
  Laptop,
} from "./objects";
import { clockEgg, deskLinks } from "@/lib/journey/desk-links";
import { Cloth } from "./cloth";
import { Lens } from "./lens";
import { ScreenProjection } from "./screen";
import { isSmallDevice } from "@/lib/journey/device";
import { Diagnostics } from "./diagnostics";
import type { SceneProps } from "./runtime";

/** The one camera driver: the rail, or the direct arc after a laptop click. */
function cameraPose(motion: Motion, aspect: number, fov: number) {
  if (motion.approachFrom !== null && motion.mode !== "orbit")
    return approachPose(
      motion.approachFrom,
      motion.mode === "focused" ? 1 : motion.approach,
      aspect,
      fov,
      tuning,
    );
  return railPose(motion.progress, aspect, fov, tuning);
}

function CameraRig({
  runtimeRef,
  onFrame,
}: Pick<SceneProps, "runtimeRef" | "onFrame">) {
  const { camera, size } = useThree();
  const report = useRef({ at: 0, mode: "" as Mode | "", away: false });
  const target = useRef(new THREE.Vector3());
  const aside = useRef(new THREE.Vector3());
  useFrame(({ clock }, rawDelta) => {
    const runtime = runtimeRef.current;
    const motion = runtime.motion;
    const perspective = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const fov = viewFov(aspect, tuning);
    if (perspective.fov !== fov) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }
    runtime.beats = beats(tuning, works.length);
    step(motion, Math.min(rawDelta, 0.05), runtime.beats, tuning);

    const pose = cameraPose(motion, aspect, fov);
    camera.position.fromArray(pose.position);
    target.current.fromArray(pose.target);
    // The clock detour: ease from wherever the rail has the camera over to
    // the clock and back. Scrolling on ends it.
    const detour = runtime.detour;
    if (detour.active && Math.abs(motion.target - detour.heldTarget) > 0.002)
      detour.active = false;
    detour.amount = THREE.MathUtils.clamp(
      detour.amount +
        ((detour.active ? 1 : -1) * Math.min(rawDelta, 0.05)) /
          clockEgg.seconds,
      0,
      1,
    );
    if (detour.amount > 0) {
      const ease = smootherStep(detour.amount);
      camera.position.lerp(
        aside.current.fromArray(clockEgg.camera.position),
        ease,
      );
      target.current.lerp(
        aside.current.fromArray(clockEgg.camera.target),
        ease,
      );
    }
    camera.lookAt(target.current);
    camera.updateMatrixWorld();
    camera.position.toArray(runtime.cameraPosition);

    const last = report.current;
    const away = detour.amount > 0;
    if (
      motion.mode !== last.mode ||
      away !== last.away ||
      clock.elapsedTime - last.at > 0.08
    ) {
      last.away = away;
      last.mode = motion.mode;
      last.at = clock.elapsedTime;
      onFrame({ mode: motion.mode, progress: motion.progress, detour: away });
    }
  }, -2);
  return null;
}

/** The pre-bake look: real-time lights and a 4K shadow map over the old room. */
function LiveLighting() {
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);
  return (
    <>
      <Environment
        files="/journey/studio_small_09_1k.hdr"
        environmentIntensity={0.45}
      />
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
    </>
  );
}

/**
 * Baked mode: the room carries its own light, so nothing here lights it. The
 * laptop (the only PBR object) reflects a one-time cube snapshot of the baked
 * room taken from where the laptop sits, plus a soft key from the window side.
 */
function BakedLighting() {
  return (
    <>
      <Environment frames={1} resolution={256} environmentIntensity={0.9}>
        <group
          position={LAPTOP_POSITION.map((v) => -v) as [number, number, number]}
        >
          <BakedStudio />
        </group>
      </Environment>
      <directionalLight position={[-2, 6, 8]} intensity={0.6} color="#fff3e2" />
    </>
  );
}

function World(props: SceneProps) {
  const live = props.flags.live;
  return (
    <>
      <color attach="background" args={["#c9c9c2"]} />
      {live ? (
        <>
          <LiveLighting />
          <Apartment />
          <Desk />
        </>
      ) : (
        <>
          <BakedLighting />
          <BakedStudio />
        </>
      )}
      <Laptop onFocus={props.onFocus} runtimeRef={props.runtimeRef} />
      <ClockEgg runtimeRef={props.runtimeRef} />
      {deskLinks.map((link) => (
        <DeskLink key={link.id} link={link} runtimeRef={props.runtimeRef} />
      ))}
      {works.map((work, index) => (
        <Cloth
          key={work.slug}
          work={work}
          index={index}
          runtimeRef={props.runtimeRef}
        />
      ))}
      <CameraRig runtimeRef={props.runtimeRef} onFrame={props.onFrame} />
      <ScreenProjection {...props} />
      <Lens runtimeRef={props.runtimeRef} />
      <Diagnostics runtimeRef={props.runtimeRef} />
    </>
  );
}

export function JourneyScene(props: SceneProps) {
  // Start sharp; step the pixel ratio down (and back up) with measured frame rate.
  // Phones stop at 1.5: the extra sharpness is not worth the memory there.
  const cap = isSmallDevice() ? 1.5 : 2;
  const [dpr, setDpr] = useState(cap);
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
              "button,a,input,iframe,[data-journey-ui],[data-tuner]",
            )
          )
            return;
          state.raycaster.setFromCamera(state.pointer, state.camera);
        },
      })}
      frameloop="always"
      camera={{ position: [-4.2, 3.3, -6.3], fov: 40, near: 0.04, far: 120 }}
      dpr={dpr}
      shadows={props.flags.live ? { type: THREE.PCFShadowMap } : false}
      gl={{
        antialias: !isSmallDevice(),
        alpha: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.AgXToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <PerformanceMonitor
        bounds={() => [50, 110]}
        flipflops={3}
        onChange={({ factor }) =>
          setDpr(Math.min(window.devicePixelRatio, cap, 1 + factor))
        }
      />
      <Suspense fallback={null}>
        <World {...props} />
      </Suspense>
    </Canvas>
  );
}
