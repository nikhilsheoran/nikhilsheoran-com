"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  LAPTOP_POSITION,
  SCREEN_TILT,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SCREEN_LOCAL_POSITION,
} from "@/lib/journey/story";
import { createScreenTexture } from "./textures";
import { useStaticModel } from "./static-model";
import styles from "./journey.module.css";
import type { SceneProps } from "./portal";

const highlightColor = new THREE.Color(0.075, 0.064, 0.042);

export function SeatedPerson() {
  const model = useStaticModel("/journey/nikhil-seated.glb");
  return <primitive object={model} />;
}

/** Blender-authored furniture; the separate figure remains replaceable by the likeness. */
export function Apartment() {
  const model = useStaticModel("/journey/nyc-apartment.glb");
  return <primitive object={model} />;
}

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
  const [hovered, setHovered] = useState(false);
  const model = useStaticModel("/journey/macbook-air-calibrated.glb");
  const screenMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  useEffect(() => {
    let cancelled = false;
    let screenTexture: THREE.Texture | null = null;
    createScreenTexture().then((texture) => {
      screenTexture = texture;
      if (cancelled) texture.dispose();
      else {
        setScreen(texture);
      }
    });
    return () => {
      cancelled = true;
      screenTexture?.dispose();
    };
  }, []);
  const highlight = useMemo(() => {
    const materials: { material: THREE.MeshStandardMaterial; base: THREE.Color }[] = [];
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const original = object.material as THREE.MeshStandardMaterial;
      object.material = original.clone();
      const material = object.material as THREE.MeshStandardMaterial;
      materials.push({ material, base: material.emissive.clone() });
    });
    return materials;
  }, [model]);
  useEffect(() => () => {
    for (const { material } of highlight) material.dispose();
    document.body.style.removeProperty("--journey-cursor");
  }, [highlight]);
  useFrame((_, delta) => {
    if (screenMaterialRef.current) {
      screenMaterialRef.current.opacity = runtimeRef.current.frameReady ? 0 : 1;
    }
    const active = hovered && !runtimeRef.current.dragging && !runtimeRef.current.entering && !runtimeRef.current.desktop;
    if (hovered && (runtimeRef.current.entering || runtimeRef.current.desktop)) setHovered(false);
    for (const { material, base } of highlight) {
      if (material.emissiveMap) continue;
      material.emissive.lerp(active ? highlightColor : base, 1 - Math.exp(-12 * delta));
    }
  });
  return (
    <group
      position={LAPTOP_POSITION}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        setHovered(false);
        if (!runtimeRef.current.entering) onEnter();
      }}
    >
      {/* Separate invisible interaction volume avoids gaps between keys and screen. */}
      <HoverRegion
        onHover={setHovered}
        runtimeRef={runtimeRef}
      />
      {hovered && (
        <Html center position={[0, 0.36, -0.24]} style={{ pointerEvents: "none" }}>
          <div className={styles.laptopTooltip} role="tooltip">
            <span className={styles.tooltipDot} /> Click to view my Mac <span aria-hidden="true">↗</span>
          </div>
        </Html>
      )}
      <primitive object={model} />
      <group position={SCREEN_LOCAL_POSITION} rotation={[SCREEN_TILT, 0, 0]}>
        <mesh>
          <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
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
      </group>
    </group>
  );
}

function HoverRegion({ onHover, runtimeRef }: {
  onHover: (hovered: boolean) => void;
} & Pick<SceneProps, "runtimeRef">) {
  return (
    <mesh
      position={[0, 0.2, -0.04]}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (!runtimeRef.current.entering && !runtimeRef.current.dragging) {
          onHover(true);
          document.body.style.setProperty("--journey-cursor", "pointer");
        }
      }}
      onPointerOut={() => {
        onHover(false);
        document.body.style.removeProperty("--journey-cursor");
      }}
    >
      <boxGeometry args={[0.67, 0.48, 0.49]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
