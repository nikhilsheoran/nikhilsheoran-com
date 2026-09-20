"use client";

/* eslint-disable react-hooks/immutability -- Uniforms and Three objects are intentionally mutable outside React rendering. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { chapterProgress, type Chapter } from "@/lib/journey/story";
import {
  ribbonPose,
  smoothStep,
  panelScale,
  panelPresence,
} from "@/lib/journey/path";
import { createPageTexture, createActionTexture } from "./textures";
import type { SceneProps } from "./portal";

const vertexShader = `
  uniform float uTime, uHover, uVelocity, uRevealTime;
  uniform vec2 uPointer, uTouch;
  varying vec2 vUv;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec3 p = position;
    float x = uv.x, y = uv.y;
    // Broad, soft folds and loose edges read as fabric without distorting the
    // printed image with small, fast ripples. Scroll momentum pulls the sheet.
    float momentum = uVelocity * (1. - uHover * .35);
    float edgeFreedom = .3 + .7 * pow(abs(x - .5) * 2., 1.5);
    float wind = uTime * .5;
    float fold = sin(x * 7.4 + y * 1.4 - wind) * .065;
    float billow = sin(x * 2.8 - y * 3.6 + wind * .7) * .055;
    float curl = pow(abs(x - .5) * 2., 3.) * sin(y * 4.2 + wind * .6) * .085;
    p.x += momentum * (.48 * (y - .5) - .14 * sin(y * 3.14159));
    p.z += (cos((x - .5) * 2.) - 1.) * .12;
    p.z += ((fold + billow) * edgeFreedom + curl) * (1. - uHover * .25);
    p.z += momentum * sin(x * 3.14159) * .075;
    p.y -= sin(x * 3.14159) * (.025 + .012 * sin(wind + y * 2.));
    float touch = exp(-dot((uv-uTouch)*vec2(1.55,1.),(uv-uTouch)*vec2(1.55,1.))*20.);
    p.z -= touch * .045 * uHover;
    vec4 view = modelViewMatrix * vec4(p,1.);
    vView = view.xyz;
    gl_Position = projectionMatrix * view;
  }
`;
const fragmentShader = `
  uniform sampler2D uMap, uActionMap;
  uniform float uHover, uOpacity, uRevealTime, uDefocus;
  uniform vec2 uPointer;
  varying vec2 vUv;
  varying vec3 vView;
  void main() {
    vec2 coord = gl_FrontFacing ? vUv : vec2(1.-vUv.x,vUv.y);
    vec2 delta = (vUv-uPointer)*vec2(1.55,1.);
    float d = length(delta);
    float front = uRevealTime * 5.;
    // Mipmapped photographs with a restrained blur for the neighbouring sheets.
    vec2 blur = vec2(uDefocus * .009);
    vec3 ink = texture2D(uMap, coord).rgb * .28;
    ink += texture2D(uMap, coord + vec2(blur.x,0.)).rgb * .18;
    ink += texture2D(uMap, coord - vec2(blur.x,0.)).rgb * .18;
    ink += texture2D(uMap, coord + vec2(0.,blur.y)).rgb * .18;
    ink += texture2D(uMap, coord - vec2(0.,blur.y)).rgb * .18;
    float gray = dot(ink,vec3(.2126,.7152,.0722));
    float reveal = (1.-smoothstep(front-.18,front+.12,d))*uHover;
    vec3 monochrome = mix(vec3(gray * .95), vec3(.26,.275,.25), .12);
    vec3 color = mix(monochrome, mix(ink, monochrome, .06), reveal);
    // Printed controls deform, occlude, blur and receive light with the cloth itself.
    vec4 action = texture2D(uActionMap, coord + vec2(0., (1.-uHover)*.012));
    color = mix(color, action.rgb, action.a * smoothstep(.12,.8,uHover));
    vec3 n = normalize(cross(dFdx(vView),dFdy(vView)));
    if(!gl_FrontFacing) n=-n;
    vec3 light = normalize(vec3(-.4,.7,1.));
    float diffuse = abs(dot(n,light));
    // Soft diffuse folds with a broad textile sheen, never a hard specular glint.
    float sheen = pow(1. - abs(dot(n, normalize(-vView))), 3.);
    color *= .88 + diffuse * .16;
    color += vec3(.035, .033, .029) * sheen;
    float fog = smoothstep(6.,17.,-vView.z);
    color = mix(color,vec3(.63,.63,.59),fog*.8);
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
}: { item: Chapter; index: number } & Pick<SceneProps, "runtimeRef">) {
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
        depthWrite: false,
        uniforms: {
          uMap: { value: null },
          uActionMap: { value: null },
          uTime: { value: 0 },
          uHover: { value: 0 },
          uRevealTime: { value: 0 },
          uVelocity: { value: 0 },
          uOpacity: { value: 0 },
          uDefocus: { value: 0 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uTouch: { value: new THREE.Vector2(0.5, 0.5) },
        },
      }),
    [],
  );
  useEffect(() => {
    let cancelled = false;
    let textures: THREE.Texture[] = [];
    Promise.all([
      createPageTexture(item, index),
      createActionTexture(item.kind),
    ]).then(([t, action]) => {
      textures = [t, action];
      if (cancelled) textures.forEach((texture) => texture.dispose());
      else {
        material.uniforms.uMap.value = t;
        material.uniforms.uActionMap.value = action;
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
      textures.forEach((texture) => texture.dispose());
    };
  }, [item, index, material]);
  useEffect(
    () => () => {
      material.dispose();
      document.body.style.removeProperty("--journey-cursor");
    },
    [material],
  );
  const viewPosition = useMemo(() => new THREE.Vector3(), []);
  const touchTarget = useRef(new THREE.Vector2(0.5, 0.5));
  useFrame(({ clock, size, camera }, delta) => {
    const state = runtimeRef.current;
    const pose = ribbonPose(
      state.progress,
      chapterProgress(index),
      size.width / size.height,
      (camera as THREE.PerspectiveCamera).fov,
    );
    const group = groupRef.current;
    if (!group) return;
    const entryFade = 1 - smoothStep(state.entry / 0.45);
    const ending = panelPresence(state.progress, index);
    material.uniforms.uOpacity.value = ending * entryFade;
    group.visible =
      material.uniforms.uOpacity.value > 0.015 && pose.height > -0.4;
    if (!group.visible && hoveredRef.current) {
      hoveredRef.current = false;
      document.body.style.removeProperty("--journey-cursor");
    }
    if (!group.visible) return;
    const t = state.reducedMotion ? index * 2 : clock.elapsedTime;
    group.position.set(
      pose.centerX + Math.sin(pose.angle) * pose.radius,
      pose.height,
      pose.centerZ + Math.cos(pose.angle) * pose.radius,
    );
    // Retain the radial orientation; only correct it by up to seven degrees.
    const cameraAngle = Math.atan2(
      camera.position.x - pose.centerX,
      camera.position.z - pose.centerZ,
    );
    group.rotation.set(
      -0.1,
      pose.angle + Math.sin(cameraAngle - pose.angle) * 0.12,
      -Math.min(0.38, Math.abs(state.progress - chapterProgress(index)) * 2.9),
    );
    viewPosition.copy(group.position).applyMatrix4(camera.matrixWorldInverse);
    const targetScale = panelScale(
      -viewPosition.z,
      size.width / size.height,
      state.progress,
      (camera as THREE.PerspectiveCamera).fov,
    );
    group.scale.setScalar(targetScale);
    material.uniforms.uDefocus.value =
      smoothStep(
        (Math.abs(state.progress - chapterProgress(index)) - 0.055) / 0.18,
      ) * (hoveredRef.current ? 0.2 : 1);
    material.uniforms.uTouch.value.lerp(
      touchTarget.current,
      1 - Math.exp(-14 * delta),
    );
    material.uniforms.uTime.value = t + index * 3.1;
    if (hoveredRef.current)
      material.uniforms.uRevealTime.value = state.reducedMotion
        ? 3
        : material.uniforms.uRevealTime.value + Math.min(delta, 0.05);
    material.uniforms.uVelocity.value = THREE.MathUtils.damp(
      material.uniforms.uVelocity.value,
      state.reducedMotion
        ? 0
        : THREE.MathUtils.clamp(state.velocity * 3, -1, 1),
      9,
      delta,
    );
    material.uniforms.uHover.value = THREE.MathUtils.damp(
      material.uniforms.uHover.value,
      hoveredRef.current && !state.dragging ? 1 : 0,
      state.reducedMotion ? 1000 : 18,
      delta,
    );
    if (hoveredRef.current && group.visible)
      state.focusDistance = -viewPosition.z;
  });
  if (!loaded) return null;
  return (
    <group ref={groupRef} name="journey-panel">
      <mesh
        material={material}
        raycast={visibleRaycast}
        onPointerOver={(e) => {
          e.stopPropagation();
          hoveredRef.current = true;
          document.body.style.setProperty("--journey-cursor", "pointer");
          material.uniforms.uRevealTime.value = 0;
          if (e.uv) {
            material.uniforms.uPointer.value.copy(e.uv);
            touchTarget.current.copy(e.uv);
          }
        }}
        onPointerMove={(e) => {
          if (e.uv) touchTarget.current.copy(e.uv);
        }}
        onPointerOut={() => {
          hoveredRef.current = false;
          document.body.style.removeProperty("--journey-cursor");
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (
            runtimeRef.current.dragging ||
            performance.now() < runtimeRef.current.suppressClickUntil
          )
            return;
          window.open(item.url, "_blank", "noopener,noreferrer");
        }}
      >
        <planeGeometry args={[2.8, 1.8, 48, 32]} />
      </mesh>
    </group>
  );
}
