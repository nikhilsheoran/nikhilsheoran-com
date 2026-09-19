"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { LAPTOP_POSITION, SCREEN_TILT } from "@/lib/journey/story";
import { createLogoTexture, createScreenTexture } from "./textures";
import type { SceneProps } from "./portal";

type Vec3 = [number, number, number];
const skin = "#b8b8b0";
const clothes = "#858c85";
const pants = "#535e59";

function Joint({ start, end, radius = .08, color = clothes }: { start: Vec3; end: Vec3; radius?: number; color?: string }) {
  const { midpoint, length, quaternion } = useMemo(() => {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    return { midpoint: a.clone().add(b).multiplyScalar(.5), length: a.distanceTo(b), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()) };
  }, [start, end]);
  return <mesh position={midpoint} quaternion={quaternion} castShadow><capsuleGeometry args={[radius, Math.max(.01, length - radius * 2), 6, 14]} /><meshStandardMaterial color={color} roughness={.88} /></mesh>;
}

/** Original procedural placeholder: the final commissioned/scanned likeness replaces this group. */
export function SeatedPerson() {
  return <group position={[0, 0, 1.03]}>
    <RoundedBox args={[.65, .36, .5]} radius={.15} position={[0, 1.09, 0]} castShadow><meshStandardMaterial color={pants} roughness={.9} /></RoundedBox>
    <mesh position={[0, 1.59, -.07]} rotation={[-.1, 0, 0]} scale={[.38, .53, .24]} castShadow><sphereGeometry args={[1, 24, 20]} /><meshStandardMaterial color={clothes} roughness={.96} /></mesh>
    <Joint start={[0, 1.93, -.11]} end={[0, 2.1, -.14]} radius={.095} color={skin} />
    <group position={[0, 2.25, -.19]} rotation={[-.09, .06, 0]}>
      <mesh scale={[.205, .27, .205]} castShadow><sphereGeometry args={[1, 28, 24]} /><meshStandardMaterial color={skin} roughness={.83} /></mesh>
      <mesh position={[0, .105, .015]} scale={[.215, .19, .212]} castShadow><sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI * .65]} /><meshStandardMaterial color="#4b514e" roughness={1} /></mesh>
      <mesh position={[0, -.015, -.198]} scale={[.045, .068, .059]} castShadow><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={skin} roughness={.85} /></mesh>
      {[-1, 1].map((side) => <group key={side}>
        <mesh position={[side * .2, 0, 0]} scale={[.035, .061, .04]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[side * .078, .043, -.189]}><sphereGeometry args={[.017, 10, 8]} /><meshStandardMaterial color="#575e58" /></mesh>
      </group>)}
    </group>
    {[-1, 1].map((side) => <group key={side}>
      <Joint start={[side * .32, 1.83, -.06]} end={[side * .42, 1.39, -.28]} radius={.115} />
      <Joint start={[side * .42, 1.39, -.28]} end={[side * .26, 1.63, -.86]} radius={.08} color={skin} />
      <mesh position={[side * .26, 1.64, -.89]} rotation={[.3, side * .25, 0]} scale={[.073, .032, .13]} castShadow><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={skin} /></mesh>
      <Joint start={[side * .19, 1.06, -.05]} end={[side * .24, .95, -.65]} radius={.14} color={pants} />
      <Joint start={[side * .24, .95, -.65]} end={[side * .24, .23, -.57]} radius={.105} color={pants} />
      <RoundedBox args={[.24, .16, .43]} radius={.07} position={[side * .24, .12, -.69]} castShadow><meshStandardMaterial color="#d7d8cf" roughness={.8} /></RoundedBox>
    </group>)}
  </group>;
}

function Chair() {
  return <group position={[0, 0, 1.15]}>
    <RoundedBox args={[.8, .12, .76]} radius={.055} position={[0, .93, 0]} castShadow><meshStandardMaterial color="#4e5a54" roughness={.8} /></RoundedBox>
    <RoundedBox args={[.75, .7, .12]} radius={.1} position={[0, 1.32, .38]} rotation={[-.12, 0, 0]} castShadow><meshStandardMaterial color="#59635b" roughness={.8} /></RoundedBox>
    <Joint start={[0, .1, 0]} end={[0, .92, 0]} radius={.06} color="#939b93" />
    {Array.from({ length: 5 }, (_, i) => {
      const angle = (i / 5) * Math.PI * 2;
      const end: Vec3 = [Math.sin(angle) * .5, .1, Math.cos(angle) * .5];
      return <group key={i}><Joint start={[0, .19, 0]} end={end} radius={.035} color="#7e8880" /><mesh position={end} rotation={[Math.PI / 2, 0, angle]} castShadow><cylinderGeometry args={[.07, .07, .065, 16]} /><meshStandardMaterial color="#3f4841" /></mesh></group>;
    })}
  </group>;
}

export function Desk() {
  return <group>
    <RoundedBox args={[3.05, .12, 1.5]} radius={.035} position={[0, 1.53, -.08]} castShadow receiveShadow><meshStandardMaterial color="#a3a69a" roughness={.8} /></RoundedBox>
    {[-1.3, 1.3].flatMap((x) => [-.67, .5].map((z) => <mesh key={`${x},${z}`} position={[x, .75, z]} castShadow><boxGeometry args={[.065, 1.47, .065]} /><meshStandardMaterial color="#707b72" metalness={.5} roughness={.4} /></mesh>))}
    <Joint start={[-1.3, .21, -.67]} end={[1.3, .21, -.67]} radius={.022} color="#707b72" />
    <Chair />
    <SeatedPerson />
    <group position={[-1.04, 1.66, .15]}>
      <mesh castShadow><cylinderGeometry args={[.09, .085, .2, 32]} /><meshStandardMaterial color="#cdd0c5" roughness={.6} /></mesh>
      <mesh position={[.102, 0, 0]} rotation={[0, 0, 0]}><torusGeometry args={[.062, .016, 10, 24]} /><meshStandardMaterial color="#cdd0c5" /></mesh>
      <mesh position={[0, .102, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.074, 32]} /><meshStandardMaterial color="#514e45" /></mesh>
    </group>
    <group position={[1.04, 1.61, -.13]} rotation={[0, -.25, 0]}>
      <RoundedBox args={[.44, .04, .62]} radius={.015} castShadow><meshStandardMaterial color="#d4d4ca" roughness={.95} /></RoundedBox>
      <mesh position={[-.12, .031, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.014, .014, .46, 8]} /><meshStandardMaterial color="#555c55" /></mesh>
    </group>
    <group position={[-1.17, 1.59, -.62]}>
      <mesh position={[0, .11, 0]} castShadow><cylinderGeometry args={[.12, .085, .22, 20]} /><meshStandardMaterial color="#cccfc2" /></mesh>
      {[0, 1, 2, 3, 4].map((i) => <group key={i} rotation={[0, i * 2.4, 0]}>
        <Joint start={[0, .19, 0]} end={[.1, .43 + (i % 2) * .1, .025]} radius={.009} color="#727e6b" />
        <mesh position={[.1, .4 + (i % 2) * .1, .025]} rotation={[0, 0, -.5]} scale={[.055, .12, .015]} castShadow><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#87927c" roughness={1} /></mesh>
      </group>)}
    </group>
  </group>;
}

export function Laptop({ onEnter, runtimeRef }: Pick<SceneProps, "onEnter" | "runtimeRef">) {
  const [screen, setScreen] = useState<THREE.Texture | null>(null);
  const [logo, setLogo] = useState<THREE.Texture | null>(null);
  const hoverStarted = useRef<number | null>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const isTouch = useRef(false);
  useEffect(() => {
    isTouch.current = window.matchMedia("(hover: none)").matches;
    let cancelled = false;
    let screenTexture: THREE.Texture | null = null;
    const logoTexture = createLogoTexture();
    createScreenTexture().then((texture) => {
      screenTexture = texture;
      if (cancelled) texture.dispose();
      else { setScreen(texture); setLogo(logoTexture); }
    });
    return () => { cancelled = true; screenTexture?.dispose(); logoTexture.dispose(); };
  }, []);
  useFrame(({ clock }, delta) => {
    if (glow.current) glow.current.emissiveIntensity = THREE.MathUtils.damp(glow.current.emissiveIntensity, hoverStarted.current !== null ? .4 : .05, 7, delta);
    if (!runtimeRef.current.entering && hoverStarted.current !== null && clock.elapsedTime - hoverStarted.current > .85) {
      hoverStarted.current = null; onEnter();
    }
  });
  return <group position={LAPTOP_POSITION}
    onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (!runtimeRef.current.entering) onEnter(); }}
    onPointerOut={() => { hoverStarted.current = null; }}>
    {/* Separate invisible interaction volume avoids gaps between keys and screen. */}
    <HoverRegion startedRef={hoverStarted} runtimeRef={runtimeRef} touchRef={isTouch} />
    <RoundedBox args={[1.2, .045, .79]} radius={.025} castShadow><meshStandardMaterial ref={glow} color="#c4c9ca" metalness={.82} roughness={.3} emissive="#93a995" emissiveIntensity={.05} /></RoundedBox>
    <RoundedBox args={[.98, .005, .34]} radius={.012} position={[0, .026, -.09]}><meshStandardMaterial color="#373b3c" metalness={.1} roughness={.65} /></RoundedBox>
    {Array.from({ length: 5 }, (_, row) => Array.from({ length: 13 }, (_, col) => <mesh key={`${row}-${col}`} position={[-.452 + col * .075, .032, -.224 + row * .065]}><boxGeometry args={[.063, .008, .049]} /><meshStandardMaterial color="#5b5e5e" roughness={.7} /></mesh>))}
    <RoundedBox args={[.41, .006, .235]} radius={.012} position={[0, .027, .22]}><meshStandardMaterial color="#a5adae" metalness={.7} roughness={.38} /></RoundedBox>
    <group position={[0, .38, -.395]} rotation={[SCREEN_TILT, 0, 0]}>
      <RoundedBox args={[1.2, .79, .035]} radius={.025} castShadow><meshStandardMaterial color="#cbd0d1" metalness={.8} roughness={.3} /></RoundedBox>
      <mesh position={[0, .018, .019]}><planeGeometry args={[1.085, .679]} /><meshBasicMaterial key={screen?.uuid ?? "loading"} map={screen} color={screen ? "white" : "#728376"} toneMapped={false} /></mesh>
      <mesh position={[0, .366, .022]}><circleGeometry args={[.008, 16]} /><meshBasicMaterial color="#303835" /></mesh>
      {logo && <mesh position={[0, .025, -.021]} rotation={[0, Math.PI, 0]}><planeGeometry args={[.2, .2]} /><meshBasicMaterial map={logo} transparent toneMapped={false} side={THREE.DoubleSide} /></mesh>}
    </group>
  </group>;
}

function HoverRegion({ startedRef, runtimeRef, touchRef }: { startedRef: React.RefObject<number | null>; touchRef: React.RefObject<boolean> } & Pick<SceneProps, "runtimeRef">) {
  const elapsed = useRef(0);
  useFrame(({ clock }) => { elapsed.current = clock.elapsedTime; });
  return <mesh position={[0, .28, -.06]} onPointerOver={(event) => { event.stopPropagation(); if (!runtimeRef.current.entering && !runtimeRef.current.reducedMotion && !touchRef.current) startedRef.current = elapsed.current; }} onPointerOut={() => { startedRef.current = null; }}>
    <boxGeometry args={[1.25, .88, .88]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
  </mesh>;
}
