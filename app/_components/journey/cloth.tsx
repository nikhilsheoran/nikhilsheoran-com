"use client";

/* eslint-disable react-hooks/immutability -- Uniforms and Three objects are intentionally mutable outside React rendering. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { tuning } from "@/lib/journey/tuning";
import { panelPose, panelScale, smoothStep } from "@/lib/journey/path";
import type { Work } from "@/lib/journey/works";
import { createActionTexture, createArtworkTexture } from "./textures";
import type { SceneProps } from "./runtime";

const vertexShader = `
  uniform float uTime, uHover, uVelocity, uRevealTime, uAmp;
  uniform vec2 uPointer, uTouch;
  varying vec2 vUv;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec3 p = position;
    vec3 rest = position;
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
    // Fold amplitudes were authored for a 2.8-unit sheet; keep them proportional.
    p = rest + (p - rest) * uAmp;
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

const ASPECT = 1000 / 1600;

export function Cloth({
  work,
  index,
  runtimeRef,
}: { work: Work; index: number } & Pick<SceneProps, "runtimeRef">) {
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
          uAmp: { value: tuning.panels.width / 2.8 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uTouch: { value: new THREE.Vector2(0.5, 0.5) },
        },
      }),
    [],
  );
  useEffect(() => {
    let cancelled = false;
    let textures: THREE.Texture[] = [];
    Promise.all([createArtworkTexture(work), createActionTexture(work.kind)]).then(
      ([art, action]) => {
        textures = [art, action];
        if (cancelled) textures.forEach((texture) => texture.dispose());
        else {
          material.uniforms.uMap.value = art;
          material.uniforms.uActionMap.value = action;
          setLoaded(true);
        }
      },
    );
    return () => {
      cancelled = true;
      textures.forEach((texture) => texture.dispose());
    };
  }, [work, material]);
  useEffect(
    () => () => {
      material.dispose();
      document.body.style.removeProperty("--journey-cursor");
    },
    [material],
  );
  const toCamera = useMemo(() => new THREE.Vector3(), []);
  // Each sheet is a light body chasing its point on the helix, not a car on a track.
  const body = useMemo(
    () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      target: new THREE.Vector3(),
      pull: new THREE.Vector3(),
      right: new THREE.Vector3(),
      ready: false,
      bank: 0,
      pitch: 0,
    }),
    [],
  );
  const touchTarget = useRef(new THREE.Vector2(0.5, 0.5));
  useFrame(({ clock, size, camera }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const runtime = runtimeRef.current;
    const motion = runtime.motion;
    const pose = panelPose(
      index,
      motion.progress,
      runtime.beats,
      tuning,
      runtime.cameraPosition,
    );
    // A direct laptop approach clears the panels out of its way.
    const approachFade =
      motion.approachFrom === null ? 1 : 1 - smoothStep(motion.approach / 0.35);
    const focusFade = motion.mode === "focused" ? 0 : 1;
    const opacity = pose.opacity * approachFade * focusFade;
    material.uniforms.uOpacity.value = opacity;
    material.uniforms.uAmp.value = tuning.panels.width / 2.8;
    group.visible = opacity > 0.012;
    if (!group.visible) {
      body.ready = false;
      if (hoveredRef.current) {
        hoveredRef.current = false;
        document.body.style.removeProperty("--journey-cursor");
      }
      return;
    }
    const dt = Math.min(delta, 1 / 30);
    const p = tuning.panels;
    body.target.fromArray(pose.position);
    if (
      !body.ready ||
      motion.reducedMotion ||
      body.position.distanceToSquared(body.target) > 9
    ) {
      body.position.copy(body.target);
      body.velocity.set(0, 0, 0);
      body.ready = true;
    } else {
      // Slightly underdamped: the sheet trails its path when the scroll picks
      // up and drifts a little past its mark when it stops.
      const omega = p.inertia;
      body.pull
        .copy(body.target)
        .sub(body.position)
        .multiplyScalar(omega * omega)
        .addScaledVector(body.velocity, -2 * 0.72 * omega);
      body.velocity.addScaledVector(body.pull, dt);
      body.position.addScaledVector(body.velocity, dt);
    }
    // Slow air currents, out of step from sheet to sheet.
    const t = clock.elapsedTime;
    const drift = motion.reducedMotion ? 0 : p.drift;
    group.position.set(
      body.position.x + drift * Math.sin(t * 0.37 + index * 1.3),
      body.position.y + drift * 1.4 * Math.sin(t * 0.53 + index * 2.1),
      body.position.z + drift * Math.cos(t * 0.31 + index * 0.7),
    );
    // Bank into its own turns: roll with sideways speed, pitch with climb.
    group.rotation.set(...pose.rotation);
    body.right.set(1, 0, 0).applyEuler(group.rotation);
    const sideways = body.velocity.dot(body.right);
    body.bank = THREE.MathUtils.damp(
      body.bank,
      THREE.MathUtils.clamp(-sideways * 0.12 * p.bank, -0.45, 0.45),
      6,
      dt,
    );
    body.pitch = THREE.MathUtils.damp(
      body.pitch,
      THREE.MathUtils.clamp(body.velocity.y * 0.1 * p.bank, -0.3, 0.3),
      6,
      dt,
    );
    group.rotation.z += body.bank + drift * 0.6 * Math.sin(t * 0.71 + index);
    group.rotation.x += body.pitch + drift * 0.4 * Math.sin(t * 0.43 + index * 1.9);
    const distance = toCamera.copy(group.position).sub(camera.position).length();
    group.scale.setScalar(
      panelScale(
        distance,
        size.width / size.height,
        (camera as THREE.PerspectiveCamera).fov,
        tuning.panels.width,
        tuning.panels.maxViewFraction,
      ),
    );
    material.uniforms.uDefocus.value =
      smoothStep((Math.abs(pose.phase) - 0.35) / 0.8) *
      (hoveredRef.current ? 0.2 : 1);
    material.uniforms.uTouch.value.lerp(
      touchTarget.current,
      1 - Math.exp(-14 * delta),
    );
    material.uniforms.uTime.value =
      (motion.reducedMotion ? 0 : clock.elapsedTime) + index * 3.1;
    if (hoveredRef.current)
      material.uniforms.uRevealTime.value = motion.reducedMotion
        ? 3
        : material.uniforms.uRevealTime.value + Math.min(delta, 0.05);
    material.uniforms.uVelocity.value = THREE.MathUtils.damp(
      material.uniforms.uVelocity.value,
      motion.reducedMotion
        ? 0
        : THREE.MathUtils.clamp(sideways * 0.25, -1, 1),
      9,
      delta,
    );
    material.uniforms.uHover.value = THREE.MathUtils.damp(
      material.uniforms.uHover.value,
      hoveredRef.current && !motion.dragging ? 1 : 0,
      motion.reducedMotion ? 1000 : 18,
      delta,
    );
  });
  if (!loaded) return null;
  const width = tuning.panels.width;
  return (
    <group ref={groupRef} name="journey-panel">
      <mesh
        material={material}
        raycast={visibleRaycast}
        onPointerOver={(event) => {
          event.stopPropagation();
          hoveredRef.current = true;
          document.body.style.setProperty("--journey-cursor", "pointer");
          material.uniforms.uRevealTime.value = 0;
          if (event.uv) {
            material.uniforms.uPointer.value.copy(event.uv);
            touchTarget.current.copy(event.uv);
          }
        }}
        onPointerMove={(event) => {
          if (event.uv) touchTarget.current.copy(event.uv);
        }}
        onPointerOut={() => {
          hoveredRef.current = false;
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
          window.open(work.url, "_blank", "noopener,noreferrer");
        }}
      >
        <planeGeometry args={[width, width * ASPECT, 48, 32]} />
      </mesh>
    </group>
  );
}
