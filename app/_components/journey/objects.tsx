"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html, useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  LAPTOP_POSITION,
  SCREEN_TILT,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SCREEN_POSITION,
  SCREEN_LOCAL_POSITION,
} from "@/lib/journey/anchors";
import {
  clockEgg,
  type DeskLink as DeskLinkData,
} from "@/lib/journey/desk-links";
import { createScreenTexture } from "./textures";
import { useStaticModel } from "./static-model";
import baked from "@/public/journey/studio-baked.json";
import { Glass } from "./glass";
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

/**
 * The Cycles-baked studio (scripts/room/bake.py). Its textures already hold
 * albedo × light, scaled down by K for highlight headroom, so every surface is
 * drawn unlit with its colour scaled back up by exposureScale.
 */
export function BakedStudio() {
  const { scene } = useGLTF("/journey/studio-baked.glb");
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const source = object.material as THREE.MeshStandardMaterial;
      object.material = new THREE.MeshBasicMaterial({
        map: source.map ?? source.emissiveMap,
        color: new THREE.Color().setScalar(baked.exposureScale),
        alphaTest: source.alphaTest,
        side: source.side,
      });
      object.castShadow = object.receiveShadow = false;
    });
    return root;
  }, [scene]);
  return <primitive object={model} />;
}

/**
 * The selection outline shared by the laptop and desk links: back faces pushed
 * out along their normals by about one screen pixel, drawn as a soft white rim.
 */
function createOutline(cacheKey: string) {
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
  material.customProgramCacheKey = () => cacheKey;
  return { material, strength, thickness };
}

/** About one screen pixel at this distance, in world units. */
function pixelWidth(distance: number, viewportHeight: number) {
  return Math.min(0.006, Math.max(0.0012, (distance * 0.9) / viewportHeight));
}

/** Hover and click invite the direct approach only while orbiting, before the descent. */
function laptopInviting(runtime: JourneyRuntime) {
  const motion = runtime.motion;
  return (
    motion.mode === "orbit" &&
    runtime.detour.amount === 0 &&
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
    const { material, strength, thickness } = createOutline(
      "laptop-selection-outline-v3",
    );
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
  const labelRef = useRef<THREE.Group>(null);
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
    highlight.thickness.value = pixelWidth(
      camera.position.distanceTo(highlight.worldCenter),
      size.height,
    );
    // The label lies in the lid's plane; turn it to read from whichever side
    // of the lid the camera is on.
    if (labelRef.current) {
      const behind =
        (camera.position.z - SCREEN_POSITION[2]) * Math.cos(SCREEN_TILT) -
          (camera.position.y - SCREEN_POSITION[1]) * Math.sin(SCREEN_TILT) <
        0;
      labelRef.current.rotation.y = behind ? Math.PI : 0;
    }
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
      <primitive object={highlight.object} />
      <primitive object={highlight.outline} />
      <group position={SCREEN_LOCAL_POSITION} rotation={[SCREEN_TILT, 0, 0]}>
        {/* A small label floating just above the lid's top edge, in the lid's own plane. */}
        <group ref={labelRef} position={[0, SCREEN_HEIGHT / 2 + 0.11, 0]}>
          {hovered && (
            <Html transform scale={0.1} style={{ pointerEvents: "none" }}>
              <Glass as="div" className={styles.laptopTooltip} role="tooltip">
                Jump to Mac
              </Glass>
            </Html>
          )}
        </group>
        <mesh>
          <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
          <meshBasicMaterial
            ref={screenMaterialRef}
            key={screen?.uuid ?? "loading"}
            map={screen}
            color={screen ? "white" : "#728376"}
            toneMapped={false}
            blending={THREE.NoBlending}
            // Once the live desktop is ready this becomes a hole: rgb must reach
            // zero with alpha, or the compositor adds the placeholder over it.
            premultipliedAlpha
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

/**
 * The hidden extra on the shelf. No glow and no hint: only the pointer changes
 * over the clock. A click sends the camera over; once it is there a single
 * line appears above the clock.
 */
export function ClockEgg({ runtimeRef }: Pick<SceneProps, "runtimeRef">) {
  const [arrived, setArrived] = useState(false);
  useFrame(() => {
    const there = runtimeRef.current.detour.amount > 0.75;
    if (there !== arrived) setArrived(there);
  });
  useEffect(
    () => () => {
      document.body.style.removeProperty("--journey-cursor");
    },
    [],
  );
  return (
    <>
      <mesh
        position={clockEgg.position}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (laptopInviting(runtimeRef.current))
            document.body.style.setProperty("--journey-cursor", "pointer");
        }}
        onPointerOut={() =>
          document.body.style.removeProperty("--journey-cursor")
        }
        onClick={(event) => {
          event.stopPropagation();
          const runtime = runtimeRef.current;
          if (
            !laptopInviting(runtime) ||
            performance.now() < runtime.suppressClickUntil
          )
            return;
          document.body.style.removeProperty("--journey-cursor");
          runtime.detour.heldTarget = runtime.motion.target;
          runtime.detour.active = true;
        }}
      >
        <boxGeometry args={clockEgg.size} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {arrived && (
        <Html center position={clockEgg.label} style={{ pointerEvents: "none" }}>
          <Glass as="div" className={styles.eggLine} role="status">
            Hmm, #watdatmean
            {/* The emoji as an image, so it looks the same on every device. */}
            {[0, 1].map((n) => (
              // eslint-disable-next-line @next/next/no-img-element -- A tiny inline glyph.
              <img
                key={n}
                className={styles.emoji}
                src="/journey/emoji/distorted-face.png"
                alt="🫪"
              />
            ))}
          </Glass>
        </Html>
      )}
    </>
  );
}

/**
 * A baked desk object that opens a link: same invitation as the laptop (a soft
 * outline glow and a small hint on hover), only while orbiting.
 */
export function DeskLink({
  link,
  runtimeRef,
}: { link: DeskLinkData } & Pick<SceneProps, "runtimeRef">) {
  const [hovered, setHovered] = useState(false);
  const glow = useMemo(() => {
    const outline = createOutline("desk-link-outline-v2");
    // A rounded box hugs a Rubik's cube's silhouette; smooth normals keep the
    // extruded rim even at the corners.
    const geometry = new RoundedBoxGeometry(...link.size, 4, link.cornerRadius);
    return { ...outline, geometry, center: new THREE.Vector3(...link.position) };
  }, [link]);
  const outlineRef = useRef<THREE.Mesh>(null);
  useEffect(
    () => () => {
      glow.material.dispose();
      glow.geometry.dispose();
      document.body.style.removeProperty("--journey-cursor");
    },
    [glow],
  );
  useFrame(({ camera, size }, delta) => {
    // eslint-disable-next-line react-hooks/immutability -- Uniform animated in the render loop.
    glow.thickness.value = pixelWidth(
      camera.position.distanceTo(glow.center),
      size.height,
    );
    const inviting = laptopInviting(runtimeRef.current);
    if (hovered && !inviting) setHovered(false);
    glow.strength.value = THREE.MathUtils.damp(
      glow.strength.value,
      hovered && inviting ? 1 : 0,
      12,
      Math.min(delta, 0.05),
    );
    if (outlineRef.current)
      outlineRef.current.visible = glow.strength.value > 0.001;
  });
  return (
    <group position={link.position} rotation={[0, link.rotationY, 0]}>
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          if (!laptopInviting(runtimeRef.current)) return;
          setHovered(true);
          document.body.style.setProperty("--journey-cursor", "pointer");
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.removeProperty("--journey-cursor");
        }}
        onClick={(event) => {
          event.stopPropagation();
          const runtime = runtimeRef.current;
          if (
            runtime.motion.dragging ||
            performance.now() < runtime.suppressClickUntil
          )
            return;
          window.open(link.url, "_blank", "noopener,noreferrer");
        }}
      >
        {/* Slightly larger than the cube so its edges are easy to catch. */}
        <boxGeometry args={link.size.map((v) => v * 1.25) as [number, number, number]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh
        ref={outlineRef}
        geometry={glow.geometry}
        material={glow.material}
        visible={false}
        raycast={() => {}}
      />
      {hovered && (
        <Html
          center
          position={[0, link.size[1] * 1.3, 0]}
          style={{ pointerEvents: "none" }}
        >
          <Glass as="div" className={styles.laptopTooltip} role="tooltip">
            {link.label}
          </Glass>
        </Html>
      )}
    </group>
  );
}
