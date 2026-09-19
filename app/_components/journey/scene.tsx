"use client";

// Three.js materials and vectors are mutable GPU objects, updated outside React render.
/* eslint-disable react-hooks/immutability */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapters, chapterProgress, SCREEN_POSITION, SCREEN_TILT, STORY_END, type Chapter } from "@/lib/journey/story";
import { orbitAngle, screenFillDistance, smoothStep } from "@/lib/journey/path";
import { Desk, Laptop } from "./objects";
import { createPageTexture } from "./textures";
import type { SceneProps } from "./portal";

const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uHover;
  uniform float uMotion;
  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin(uv.x * 5.0 + uTime * .8) * .055;
    float curl = sin(uv.y * 4.0 + uv.x * 2.0 + uTime * .65) * .06;
    p.z += (wave + curl) * uMotion + pow(abs(uv.x - .5) * 2.0, 2.0) * .1;
    p.z += sin(uv.x * 3.14159) * .045 * uHover;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uHover;
  uniform float uOpacity;
  void main() {
    vec2 coord = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec4 color = texture2D(uMap, coord);
    float gray = dot(color.rgb, vec3(.299, .587, .114));
    vec3 paper = mix(vec3(gray), color.rgb, uHover);
    float edge = smoothstep(0.0, .015, vUv.x) * smoothstep(0.0, .015, 1.0-vUv.x);
    float shade = .97 + .03 * sin(vUv.x * 6.283);
    gl_FragColor = vec4(paper * shade, color.a * uOpacity * edge);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Three's raycaster can hit invisible objects. Faded pages must not block the laptop.
function raycastVisiblePage(this: THREE.Mesh, raycaster: THREE.Raycaster, intersections: THREE.Intersection[]) {
  if (this.parent?.visible) THREE.Mesh.prototype.raycast.call(this, raycaster, intersections);
}

function StoryPage({ item, index, runtimeRef, onEnter }: { item: Chapter; index: number } & Pick<SceneProps, "runtimeRef" | "onEnter">) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const group = useRef<THREE.Group>(null);
  const hover = useRef(false);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader, side: THREE.DoubleSide, transparent: true,
    uniforms: { uMap: { value: null }, uTime: { value: 0 }, uHover: { value: 0 }, uOpacity: { value: 0 }, uMotion: { value: 1 } },
  }), []);
  const angle = orbitAngle(chapterProgress(index)) - .23;
  const y = 2.6 + index * .12;
  useEffect(() => {
    let cancelled = false;
    let pageTexture: THREE.Texture | null = null;
    createPageTexture(item, index).then((loaded) => {
      pageTexture = loaded;
      if (cancelled) loaded.dispose(); else { material.uniforms.uMap.value = loaded; setTexture(loaded); }
    });
    return () => { cancelled = true; pageTexture?.dispose(); };
  }, [item, index, material]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock, size }, delta) => {
    const runtime = runtimeRef.current;
    material.uniforms.uTime.value = clock.elapsedTime + index * 1.3;
    material.uniforms.uMotion.value = runtime.reducedMotion ? 0 : 1;
    material.uniforms.uHover.value = THREE.MathUtils.damp(material.uniforms.uHover.value, hover.current ? 1 : 0, 7, delta);
    const appearance = smoothStep((runtime.progress - .025) / .075);
    const ending = 1 - smoothStep((runtime.progress - .79) / .07);
    material.uniforms.uOpacity.value = appearance * ending * (1 - smoothStep(runtime.entry * 2));
    if (group.current) {
      group.current.visible = material.uniforms.uOpacity.value > .01;
      group.current.position.y = y + (runtime.reducedMotion ? 0 : Math.sin(clock.elapsedTime * .35 + index * 2) * .045);
      const narrow = size.width / size.height < .9;
      const pageAngle = angle + (narrow ? .23 : 0);
      group.current.position.x = Math.sin(pageAngle) * 3.25;
      group.current.position.z = Math.cos(pageAngle) * 3.25;
      group.current.rotation.y = pageAngle;
      const scale = (hover.current ? 1.045 : 1) * (narrow ? .85 : 1);
      group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, scale, 8, delta));
    }
  });
  if (!texture) return null;
  return <group ref={group} position={[Math.sin(angle) * 3.25, y, Math.cos(angle) * 3.25]} rotation={[0, angle, index % 2 ? -.045 : .04]}>
    <mesh material={material} raycast={raycastVisiblePage} onPointerOver={(event) => { event.stopPropagation(); hover.current = true; }} onPointerOut={() => { hover.current = false; }} onClick={(event) => { event.stopPropagation(); onEnter(item.note); }}>
      <planeGeometry args={[2.22, 1.665, 30, 22]} />
    </mesh>
  </group>;
}

function CameraRig({ runtimeRef, onEnter, onArrive, onProgress, onReady }: SceneProps) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 1.15, 0));
  const from = useRef(new THREE.Vector3());
  const fromTarget = useRef(new THREE.Vector3());
  const wasEntering = useRef(false);
  const arrived = useRef(false);
  const lastReport = useRef(0);
  const scratch = useMemo(() => ({ position: new THREE.Vector3(), target: new THREE.Vector3(), screen: new THREE.Vector3(...SCREEN_POSITION), normal: new THREE.Vector3(0, -Math.sin(SCREEN_TILT), Math.cos(SCREEN_TILT)), control: new THREE.Vector3(), end: new THREE.Vector3() }), []);
  useEffect(() => { onReady(); }, [onReady]);
  useFrame(({ clock }, rawDelta) => {
    const runtime = runtimeRef.current;
    const delta = Math.min(rawDelta, .05);
    const mobile = size.width < 768;
    const narrow = size.width / size.height < .9;
    runtime.progress = runtime.reducedMotion ? runtime.target : THREE.MathUtils.damp(runtime.progress, runtime.target, 5, delta);
    const angle = orbitAngle(runtime.progress);
    const zoom = smoothStep((runtime.progress - STORY_END) / .15);
    const radius = (narrow ? 14.6 : 7.8) - zoom * 2.5;
    const height = 3.9 + Math.sin(runtime.progress * Math.PI) * .6;
    scratch.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    // A small camera-local offset reserves the left edge for readable HTML captions.
    const offset = mobile ? 0 : -.45;
    scratch.target.set(Math.cos(angle) * offset, mobile ? 1.2 : 1.35, -Math.sin(angle) * offset);
    if (!runtime.entering && !runtime.returning) {
      camera.position.copy(scratch.position);
      target.current.copy(scratch.target);
    }
    if (runtime.entering && !wasEntering.current) {
      from.current.copy(camera.position); fromTarget.current.copy(target.current);
      arrived.current = false;
    }
    if (runtime.entering) {
      runtime.entry = runtime.reducedMotion ? 1 : Math.min(1, runtime.entry + delta / 2.6);
      const t = smoothStep(runtime.entry);
      const perspective = camera as THREE.PerspectiveCamera;
      scratch.end.copy(scratch.screen).addScaledVector(scratch.normal, screenFillDistance(size.width / size.height, perspective.fov));
      // Travel above the person before approaching the display from its front.
      scratch.control.copy(scratch.screen).addScaledVector(scratch.normal, 3.0); scratch.control.y = 5.6;
      camera.position.copy(from.current).multiplyScalar((1-t) ** 2).addScaledVector(scratch.control, 2*(1-t)*t).addScaledVector(scratch.end, t*t);
      target.current.lerpVectors(fromTarget.current, scratch.screen, smoothStep(Math.min(1, runtime.entry * 1.6)));
      if (runtime.entry >= 1 && !arrived.current) { arrived.current = true; onArrive(); }
    } else if (runtime.returning) {
      // The scene remounts on return; restore the remembered orbit immediately.
      runtime.entry = 0;
      camera.position.copy(scratch.position); target.current.copy(scratch.target);
      runtime.returning = false;
    }
    camera.lookAt(target.current);
    wasEntering.current = runtime.entering;
    if (clock.elapsedTime - lastReport.current > .08) { onProgress(runtime.progress); lastReport.current = clock.elapsedTime; }
    if (runtime.progress > .987 && !runtime.entering && !arrived.current) onEnter();
  });
  return null;
}

function World(props: SceneProps) {
  return <>
    <color attach="background" args={["#e8e9e5"]} />
    <fog attach="fog" args={["#e8e9e5", 14, 32]} />
    <ambientLight intensity={1.4} />
    <hemisphereLight args={["#f9faf6", "#89928a", 1.7]} />
    <directionalLight position={[-3, 8, -5]} intensity={3.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-normalBias={.04} shadow-bias={-.0002} />
    <directionalLight position={[5, 4, 3]} intensity={1.3} color="#e4eee9" />
    <Desk />
    <Laptop onEnter={() => props.onEnter()} runtimeRef={props.runtimeRef} />
    {chapters.map((item, index) => <StoryPage key={item.year} item={item} index={index} runtimeRef={props.runtimeRef} onEnter={props.onEnter} />)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.015, 0]} receiveShadow><planeGeometry args={[100, 100]} /><shadowMaterial transparent opacity={.14} color="#485147" /></mesh>
    <CameraRig {...props} />
  </>;
}

export function JourneyScene(props: SceneProps) {
  return <Canvas camera={{ position: [-5.5, 3.9, -5.5], fov: 38, near: .04, far: 50 }} dpr={[1, 1.5]} shadows={{ type: THREE.PCFShadowMap }} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} fallback={<div>Explore the 3D desk with the timeline controls, or use “Enter my Mac” to open the desktop.</div>} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1; }}>
    <Suspense fallback={null}><World {...props} /></Suspense>
  </Canvas>;
}
