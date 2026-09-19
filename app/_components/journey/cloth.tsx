"use client";

/* eslint-disable react-hooks/immutability -- Uniforms and Three objects are intentionally mutable outside React rendering. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { chapterProgress, type Chapter } from "@/lib/journey/story";
import { ribbonPose, smoothStep } from "@/lib/journey/path";
import { createPageTexture } from "./textures";
import type { SceneProps } from "./portal";

const vertexShader = `
  uniform float uTime, uHover, uVelocity;
  varying vec2 vUv;
  varying vec3 vView;
  varying float vFold;
  void main() {
    vUv = uv;
    vec3 p = position;
    float x = uv.x, y = uv.y;
    float freeEdge = .3 + .7 * pow(abs(x-.5)*2., 1.3);
    float billow = sin(x*4.4 + y*1.2 - uTime*.55) * .24;
    float ripple = sin(x*11. - y*3.5 - uTime*1.15) * .047;
    float diagonal = sin(x*6. + y*5. + uTime*.7) * .055;
    float curl = pow(abs(x-.5)*2., 3.) * .26 * sin(y*2.9 + uTime*.3);
    float settle = 1. - uHover*.48;
    p.z += ((billow+ripple+diagonal)*freeEdge + curl) * settle;
    p.z += sin(x*3.14159) * uVelocity * .17;
    p.y += sin(x*5.2-uTime*.7)*.06*freeEdge;
    p.x += sin(y*3.14159)*.06*sin(uTime*.45+x*2.);
    vFold = billow;
    vec4 view = modelViewMatrix * vec4(p,1.);
    vView = view.xyz;
    gl_Position = projectionMatrix * view;
  }
`;
const fragmentShader = `
  uniform sampler2D uMap;
  uniform float uHover, uOpacity;
  uniform vec2 uPointer;
  varying vec2 vUv;
  varying vec3 vView;
  varying float vFold;
  void main() {
    vec2 coord = gl_FrontFacing ? vUv : vec2(1.-vUv.x,vUv.y);
    vec3 ink = texture2D(uMap, coord).rgb;
    float gray = dot(ink,vec3(.2126,.7152,.0722));
    float reveal = 1.-smoothstep(uHover*1.65-.16,uHover*1.65+.08,distance(vUv,uPointer));
    reveal *= smoothstep(0.,.1,uHover);
    vec3 color = mix(vec3(gray),ink,reveal);
    vec3 n = normalize(cross(dFdx(vView),dFdy(vView)));
    if(!gl_FrontFacing) n=-n;
    vec3 light = normalize(vec3(-.4,.7,1.));
    float diffuse = abs(dot(n,light));
    float grazing = pow(1.-abs(dot(n,normalize(-vView))),3.);
    float weave = sin(vUv.x*1900.)*sin(vUv.y*1300.);
    color *= .69 + diffuse*.36 + weave*.014;
    color += grazing*.05 + vFold*.025;
    float fog = smoothstep(6.,17.,-vView.z);
    color = mix(color,vec3(.24,.29,.27),fog*.8);
    float edge = smoothstep(0.,.004,min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)));
    gl_FragColor = vec4(color,uOpacity*edge);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function visibleRaycast(
  this: THREE.Mesh,
  raycaster: THREE.Raycaster,
  intersections: THREE.Intersection[],
) {
  if (this.parent?.visible)
    THREE.Mesh.prototype.raycast.call(this, raycaster, intersections);
}

export function Cloth({
  item,
  index,
  runtimeRef,
  onEnter,
}: { item: Chapter; index: number } & Pick<
  SceneProps,
  "runtimeRef" | "onEnter"
>) {
  const [loaded, setLoaded] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const hoveredRef = useRef(false);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: true,
        uniforms: {
          uMap: { value: null },
          uTime: { value: 0 },
          uHover: { value: 0 },
          uVelocity: { value: 0 },
          uOpacity: { value: 0 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        },
      }),
    [],
  );
  useEffect(() => {
    let cancelled = false;
    let texture: THREE.Texture | null = null;
    createPageTexture(item, index).then((t) => {
      texture = t;
      if (cancelled) t.dispose();
      else {
        material.uniforms.uMap.value = t;
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
      texture?.dispose();
    };
  }, [item, index, material]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock, size }, delta) => {
    const state = runtimeRef.current;
    const pose = ribbonPose(state.progress, chapterProgress(index));
    const group = groupRef.current;
    if (!group) return;
    const entryFade = 1 - smoothStep(state.entry / 0.45);
    const ending = 1 - smoothStep((state.progress - 0.8) / 0.095);
    const opening = smoothStep(state.progress / 0.065);
    material.uniforms.uOpacity.value = opening * ending * entryFade;
    group.visible =
      material.uniforms.uOpacity.value > 0.015 && pose.height > -0.4;
    const t = state.reducedMotion ? index * 2 : clock.elapsedTime;
    const angle = pose.angle - (size.width / size.height < 0.8 ? 0.23 : 0);
    group.position.set(
      Math.sin(angle) * pose.radius,
      pose.height + Math.sin(t * 0.4 + index) * 0.025,
      Math.cos(angle) * pose.radius,
    );
    group.rotation.set(
      -0.09 + Math.sin(index * 2) * 0.06,
      angle,
      Math.sin(index * 1.8) * 0.11,
    );
    group.scale.setScalar(size.width / size.height < 0.8 ? 0.8 : 1);
    material.uniforms.uTime.value = t + index * 3.1;
    material.uniforms.uVelocity.value = THREE.MathUtils.damp(
      material.uniforms.uVelocity.value,
      state.velocity,
      5,
      delta,
    );
    material.uniforms.uHover.value = THREE.MathUtils.damp(
      material.uniforms.uHover.value,
      hoveredRef.current ? 1 : 0,
      5,
      delta,
    );
    if (hoveredRef.current && group.visible)
      state.focusDistance = Math.hypot(
        group.position.x - state.cameraPosition[0],
        group.position.y - state.cameraPosition[1],
        group.position.z - state.cameraPosition[2],
      );
  });
  if (!loaded) return null;
  return (
    <group ref={groupRef}>
      <mesh
        material={material}
        raycast={visibleRaycast}
        onPointerOver={(e) => {
          e.stopPropagation();
          hoveredRef.current = true;
        }}
        onPointerMove={(e) => {
          if (e.uv) material.uniforms.uPointer.value.copy(e.uv);
        }}
        onPointerOut={() => {
          hoveredRef.current = false;
        }}
        onClick={(e) => {
          e.stopPropagation();
          onEnter(item.note);
        }}
      >
        <planeGeometry args={[2.8, 1.8, 72, 46]} />
      </mesh>
    </group>
  );
}
