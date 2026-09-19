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

/** Blender-authored furniture, kept separate from the apartment and laptop. */
export function Apartment() {
  const model = useStaticModel("/journey/nyc-apartment.glb");
  return <primitive object={model} />;
}

export function Desk() {
  const model = useStaticModel("/journey/studio-furniture.glb");
  return (
    <group>
      <primitive object={model} />
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
    // Build an owned instance: mutating the cached model here breaks Strict Mode.
    const object = model.clone(true);
    const materials: THREE.MeshStandardMaterial[] = [];
    const strength = new THREE.Uniform(0);
    object.traverse((mesh) => {
      if (!(mesh instanceof THREE.Mesh)) return;
      const material = (mesh.material as THREE.MeshStandardMaterial).clone();
      mesh.material = material;
      // A single bounds mesh handles selection instead of ray-testing every key.
      mesh.raycast = () => {};
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uSelection = strength;
        shader.fragmentShader =
          `uniform float uSelection;\n${shader.fragmentShader}`.replace(
            "#include <emissivemap_fragment>",
            "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(uSelection);",
          );
      };
      material.customProgramCacheKey = () => "laptop-selection-v1";
      materials.push(material);
    });
    const bounds = new THREE.Box3().setFromObject(object);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3()).addScalar(0.015);
    return { object, materials, strength, center, size };
  }, [model]);
  useEffect(
    () => () => {
      for (const material of highlight.materials) material.dispose();
      document.body.style.removeProperty("--journey-cursor");
    },
    [highlight],
  );
  useFrame((_, delta) => {
    if (screenMaterialRef.current) {
      screenMaterialRef.current.opacity = runtimeRef.current.frameReady ? 0 : 1;
    }
    const active =
      hovered &&
      !runtimeRef.current.dragging &&
      !runtimeRef.current.entering &&
      !runtimeRef.current.returning &&
      !runtimeRef.current.desktop;
    if (
      hovered &&
      (runtimeRef.current.entering ||
        runtimeRef.current.returning ||
        runtimeRef.current.desktop)
    )
      setHovered(false);
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniforms are mutable GPU inputs, updated outside React rendering.
    highlight.strength.value = THREE.MathUtils.damp(
      highlight.strength.value,
      active ? 1.8 : 0,
      12,
      Math.min(delta, 0.05),
    );
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
        center={highlight.center}
        size={highlight.size}
      />
      {hovered && (
        <Html
          center
          position={[0.23, 0.47, -0.32]}
          style={{ pointerEvents: "none" }}
        >
          <div className={styles.laptopTooltip} role="tooltip">
            <span className={styles.tooltipDot} /> Click to use
          </div>
        </Html>
      )}
      <primitive object={highlight.object} />
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

function HoverRegion({
  onHover,
  runtimeRef,
  center,
  size,
}: {
  onHover: (hovered: boolean) => void;
  center: THREE.Vector3;
  size: THREE.Vector3;
} & Pick<SceneProps, "runtimeRef">) {
  return (
    <mesh
      position={center}
      onPointerOver={(event) => {
        event.stopPropagation();
        const state = runtimeRef.current;
        if (
          !state.entering &&
          !state.returning &&
          !state.desktop &&
          !state.dragging
        ) {
          onHover(true);
          document.body.style.setProperty("--journey-cursor", "pointer");
        }
      }}
      onPointerOut={() => {
        onHover(false);
        document.body.style.removeProperty("--journey-cursor");
      }}
    >
      <boxGeometry args={[size.x, size.y, size.z]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
