"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { LAPTOP_POSITION, SCREEN_TILT } from "@/lib/journey/story";
import { createLogoTexture, createScreenTexture } from "./textures";
import { useStaticModel } from "./static-model";
import type { SceneProps } from "./portal";

type Vec3 = [number, number, number];
const skin = "#b9957b";
const clothes = "#c8c4b8";
const pants = "#29322f";

function Joint({
  start,
  end,
  radius = 0.08,
  color = clothes,
}: {
  start: Vec3;
  end: Vec3;
  radius?: number;
  color?: string;
}) {
  const { midpoint, length, quaternion } = useMemo(() => {
    const a = new THREE.Vector3(...start),
      b = new THREE.Vector3(...end);
    return {
      midpoint: a.clone().add(b).multiplyScalar(0.5),
      length: a.distanceTo(b),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        b.clone().sub(a).normalize(),
      ),
    };
  }, [start, end]);
  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow>
      <capsuleGeometry
        args={[radius, Math.max(0.01, length - radius * 2), 6, 14]}
      />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  );
}

/** Original procedural placeholder: the final commissioned/scanned likeness replaces this group. */
export function SeatedPerson() {
  return (
    <group position={[0, 0, 1.33]}>
      <RoundedBox
        args={[0.65, 0.36, 0.5]}
        radius={0.15}
        position={[0, 1.09, 0]}
        castShadow
      >
        <meshStandardMaterial color={pants} roughness={0.9} />
      </RoundedBox>
      <mesh
        position={[0, 1.59, -0.07]}
        rotation={[-0.1, 0, 0]}
        scale={[0.38, 0.53, 0.24]}
        castShadow
      >
        <sphereGeometry args={[1, 24, 20]} />
        <meshStandardMaterial color={clothes} roughness={0.96} />
      </mesh>
      <Joint
        start={[0, 1.93, -0.11]}
        end={[0, 2.1, -0.14]}
        radius={0.095}
        color={skin}
      />
      <group position={[0, 2.25, -0.19]} rotation={[-0.09, 0.06, 0]}>
        <mesh scale={[0.205, 0.27, 0.205]} castShadow>
          <sphereGeometry args={[1, 28, 24]} />
          <meshStandardMaterial color={skin} roughness={0.83} />
        </mesh>
        <mesh
          position={[0, 0.105, 0.015]}
          scale={[0.215, 0.19, 0.212]}
          castShadow
        >
          <sphereGeometry
            args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65]}
          />
          <meshStandardMaterial color="#4b514e" roughness={1} />
        </mesh>
        <mesh
          position={[0, -0.015, -0.198]}
          scale={[0.045, 0.068, 0.059]}
          castShadow
        >
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color={skin} roughness={0.85} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.2, 0, 0]} scale={[0.035, 0.061, 0.04]}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial color={skin} />
            </mesh>
            <mesh position={[side * 0.078, 0.043, -0.189]}>
              <sphereGeometry args={[0.017, 10, 8]} />
              <meshStandardMaterial color="#575e58" />
            </mesh>
          </group>
        ))}
      </group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Joint
            start={[side * 0.32, 1.83, -0.06]}
            end={[side * 0.42, 1.39, -0.28]}
            radius={0.115}
          />
          <Joint
            start={[side * 0.42, 1.39, -0.28]}
            end={[side * 0.26, 1.63, -1.16]}
            radius={0.08}
            color={skin}
          />
          <mesh
            position={[side * 0.26, 1.64, -1.19]}
            rotation={[0.3, side * 0.25, 0]}
            scale={[0.073, 0.032, 0.13]}
            castShadow
          >
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          <Joint
            start={[side * 0.19, 1.06, -0.05]}
            end={[side * 0.24, 0.95, -0.65]}
            radius={0.14}
            color={pants}
          />
          <Joint
            start={[side * 0.24, 0.95, -0.65]}
            end={[side * 0.24, 0.23, -0.57]}
            radius={0.105}
            color={pants}
          />
          <RoundedBox
            args={[0.24, 0.16, 0.43]}
            radius={0.07}
            position={[side * 0.24, 0.12, -0.69]}
            castShadow
          >
            <meshStandardMaterial color="#d7d8cf" roughness={0.8} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

/** Blender-authored furniture; the separate figure remains replaceable by the likeness. */
export function Desk() {
  const model = useStaticModel("/journey/studio-furniture.glb");
  return (
    <group>
      <primitive object={model} />
      <SeatedPerson />
    </group>
  );
}

export function Laptop({
  onEnter,
  runtimeRef,
}: Pick<SceneProps, "onEnter" | "runtimeRef">) {
  const [screen, setScreen] = useState<THREE.Texture | null>(null);
  const [logo, setLogo] = useState<THREE.Texture | null>(null);
  const hoverStarted = useRef<number | null>(null);
  const model = useStaticModel("/journey/macbook-air-2017.glb");
  const screenMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const isTouch = useRef(false);
  useEffect(() => {
    isTouch.current = window.matchMedia("(hover: none)").matches;
    let cancelled = false;
    let screenTexture: THREE.Texture | null = null;
    const logoTexture = createLogoTexture();
    createScreenTexture().then((texture) => {
      screenTexture = texture;
      if (cancelled) texture.dispose();
      else {
        setScreen(texture);
        setLogo(logoTexture);
      }
    });
    return () => {
      cancelled = true;
      screenTexture?.dispose();
      logoTexture.dispose();
    };
  }, []);
  useFrame(({ clock }) => {
    if (runtimeRef.current.dragging) hoverStarted.current = null;
    if (screenMaterialRef.current) {
      screenMaterialRef.current.opacity = runtimeRef.current.frameReady ? 0 : 1;
    }
    if (
      !runtimeRef.current.entering &&
      !runtimeRef.current.dragging &&
      performance.now() > runtimeRef.current.suppressClickUntil &&
      hoverStarted.current !== null &&
      clock.elapsedTime - hoverStarted.current > 0.35
    ) {
      hoverStarted.current = null;
      onEnter();
    }
  });
  return (
    <group
      position={LAPTOP_POSITION}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!runtimeRef.current.entering) onEnter();
      }}
      onPointerOut={() => {
        hoverStarted.current = null;
      }}
    >
      {/* Separate invisible interaction volume avoids gaps between keys and screen. */}
      <HoverRegion
        startedRef={hoverStarted}
        runtimeRef={runtimeRef}
        touchRef={isTouch}
      />
      <primitive object={model} />
      <group position={[0, 0.38, -0.395]} rotation={[SCREEN_TILT, 0, 0]}>
        <mesh position={[0, 0.018, 0.019]}>
          <planeGeometry args={[1.085, 0.679]} />
          <meshBasicMaterial
            ref={screenMaterialRef}
            key={screen?.uuid ?? "loading"}
            map={screen}
            color={screen ? "white" : "#728376"}
            toneMapped={false}
            blending={THREE.NoBlending}
            transparent
          />
        </mesh>
        {logo && (
          <mesh position={[0, 0.025, -0.021]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshBasicMaterial
              map={logo}
              transparent
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

function HoverRegion({
  startedRef,
  runtimeRef,
  touchRef,
}: {
  startedRef: React.RefObject<number | null>;
  touchRef: React.RefObject<boolean>;
} & Pick<SceneProps, "runtimeRef">) {
  const elapsed = useRef(0);
  useFrame(({ clock }) => {
    elapsed.current = clock.elapsedTime;
  });
  return (
    <mesh
      position={[0, 0.28, -0.06]}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (
          !runtimeRef.current.entering &&
          !runtimeRef.current.reducedMotion &&
          !touchRef.current
        )
          startedRef.current = elapsed.current;
      }}
      onPointerOut={() => {
        startedRef.current = null;
      }}
    >
      <boxGeometry args={[1.25, 0.88, 0.88]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
