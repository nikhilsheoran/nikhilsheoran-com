"use client";

/* eslint-disable react-hooks/immutability -- The animation loop updates mutable Three.js scene objects. */
import { Suspense, useEffect, useRef, type RefObject } from "react";
import { Environment } from "@react-three/drei";
import { Canvas, events, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { works } from "@/lib/journey/works";
import { tuning } from "@/lib/journey/tuning";
import { beats } from "@/lib/journey/timeline";
import { step, type Mode, type Motion } from "@/lib/journey/machine";
import { approachPose, railPose, viewFov } from "@/lib/journey/path";
import { Apartment, Desk, Laptop } from "./objects";
import { Cloth } from "./cloth";
import { Lens } from "./lens";
import { ScreenProjection } from "./screen";
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
  const report = useRef({ at: 0, mode: "" as Mode | "" });
  const target = useRef(new THREE.Vector3());
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
    camera.lookAt(target.current.fromArray(pose.target));
    camera.updateMatrixWorld();
    camera.position.toArray(runtime.cameraPosition);

    const last = report.current;
    if (motion.mode !== last.mode || clock.elapsedTime - last.at > 0.08) {
      last.mode = motion.mode;
      last.at = clock.elapsedTime;
      onFrame({ mode: motion.mode, progress: motion.progress });
    }
  }, -2);
  return null;
}

function Lighting() {
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
      <directionalLight position={[1, 4, -4]} intensity={0.35} color="#eef3ff" />
    </>
  );
}

function World(props: SceneProps) {
  return (
    <>
      <color attach="background" args={["#c9c9c2"]} />
      <Lighting />
      <Apartment />
      <Desk />
      <Laptop onFocus={props.onFocus} runtimeRef={props.runtimeRef} />
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
              "button,a,input,iframe,[data-journey-ui],[data-tuner]",
            )
          )
            return;
          state.raycaster.setFromCamera(state.pointer, state.camera);
        },
      })}
      frameloop="always"
      camera={{ position: [-4.2, 3.3, -6.3], fov: 40, near: 0.04, far: 120 }}
      dpr={[1, 2]}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
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
