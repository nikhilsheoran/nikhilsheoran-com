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
} from "@/lib/journey/anchors";
import { createScreenTexture } from "./textures";
import { useStaticModel } from "./static-model";
import styles from "./journey.module.css";
import type { JourneyRuntime, SceneProps } from "./runtime";

/** Blender-authored furniture, kept separate from the apartment and laptop. */
export function Apartment() {
  const model = useStaticModel("/journey/nyc-apartment.glb?v=designed-studio-2");
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

/** Hover and click invite the direct approach only while orbiting, before the descent. */
function laptopInviting(runtime: JourneyRuntime) {
  const motion = runtime.motion;
  return (
    motion.mode === "orbit" &&
    !motion.dragging &&
    !runtime.pointerOnScreen &&
    motion.progress < runtime.beats.handoffStart
  );
}

export function Laptop({
  onFocus,
  runtimeRef,
}: Pick<SceneProps, "onFocus" | "runtimeRef">) {
  const [screen, setScreen] = useState<THREE.Texture | null>(null);
  const [hovered, setHovered] = useState(false);
  const model = useStaticModel(
    "/journey/macbook-air-calibrated.glb?v=pink-logo-2",
  );
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
    const strength = new THREE.Uniform(0);
    const thickness = new THREE.Uniform(0.002);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(2.4, 2.4, 2.4),
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uSelection = strength;
      shader.uniforms.uOutlineWidth = thickness;
      shader.vertexShader =
        `uniform float uOutlineWidth;\n${shader.vertexShader}`.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\ntransformed += normal * uOutlineWidth;",
        );
      shader.fragmentShader =
        `uniform float uSelection;\n${shader.fragmentShader}`.replace(
          "#include <opaque_fragment>",
          "diffuseColor.a *= uSelection * .4;\n#include <opaque_fragment>",
        );
    };
    material.customProgramCacheKey = () => "laptop-selection-outline-v3";
    const outline = model.clone(true);
    outline.traverse((mesh) => {
      if (!(mesh instanceof THREE.Mesh)) return;
      mesh.material = material;
      mesh.castShadow = mesh.receiveShadow = false;
      mesh.raycast = () => {};
    });
    object.traverse((mesh) => {
      if (mesh instanceof THREE.Mesh) mesh.raycast = () => {};
    });
    const bounds = new THREE.Box3().setFromObject(object);
    const center = bounds.getCenter(new THREE.Vector3());
    const worldCenter = center
      .clone()
      .add(new THREE.Vector3(...LAPTOP_POSITION));
    const size = bounds.getSize(new THREE.Vector3()).addScalar(0.015);
    return {
      object,
      outline,
      material,
      strength,
      thickness,
      center,
      worldCenter,
      size,
    };
  }, [model]);
  useEffect(
    () => () => {
      highlight.material.dispose();
      document.body.style.removeProperty("--journey-cursor");
    },
    [highlight],
  );
  useFrame(({ camera, size }, delta) => {
    if (screenMaterialRef.current) {
      screenMaterialRef.current.opacity = runtimeRef.current.frameReady ? 0 : 1;
    }
    // eslint-disable-next-line react-hooks/immutability -- Keep the outline near one screen pixel across viewing distances.
    highlight.thickness.value = Math.min(
      0.006,
      Math.max(
        0.0012,
        (camera.position.distanceTo(highlight.worldCenter) * 0.9) / size.height,
      ),
    );
    const inviting = laptopInviting(runtimeRef.current);
    const active = hovered && inviting;
    if (hovered && !inviting) setHovered(false);

    highlight.strength.value = THREE.MathUtils.damp(
      highlight.strength.value,
      active ? 1 : 0,
      12,
      Math.min(delta, 0.05),
    );

    highlight.outline.visible = highlight.strength.value > 0.001;
  });
  return (
    <group
      position={LAPTOP_POSITION}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        setHovered(false);
        onFocus();
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
      <primitive object={highlight.outline} />
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
        if (laptopInviting(runtimeRef.current)) {
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
