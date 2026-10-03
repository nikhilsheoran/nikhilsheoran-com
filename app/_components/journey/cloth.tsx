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
  uniform float uTime, uHover, uVelocity, uRevealTime, uAmp, uPin, uBend;
  uniform vec2 uPointer, uTouch;
  varying vec2 vUv;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec3 p = position;
    vec3 rest = position;
    float x = uv.x, y = uv.y;
    // A sheet of light cloth in moving air: the leading edge is held taut and
    // waves travel across it, growing toward the free trailing edge, whose
    // corners flap. Scroll momentum drags the whole sheet.
    float momentum = uVelocity * (1. - uHover * .35);
    float wind = uTime * 1.25;
    float free = .22 + .78 * pow(x, 1.35);
    float swell = sin(x * 6.5 - wind * 1.9 + y * 1.6) * .06 * free;
    float ripple = sin(x * 13. - wind * 3.4 - y * 2.8) * .02 * free * free;
    float corner = pow(x, 3.) * pow(abs(y - .5) * 2., 2.)
      * sin(wind * 2.7 + y * 5. + x * 3.) * .1;
    float calm = 1. - uHover * .45;
    p.z += (cos((x - .5) * 2.) - 1.) * .1;
    p.z += (swell + ripple + corner) * calm;
    p.z += momentum * sin(x * 3.14159) * .09;
    p.x += momentum * (.48 * (y - .5) - .14 * sin(y * 3.14159));
    // Gravity: the free edge hangs a little and lifts with each swell.
    p.y -= pow(x, 2.) * (.05 + .035 * sin(wind * 1.9 - x * 4.)) * calm;
    p.y -= sin(x * 3.14159) * .02;
    float touch = exp(-dot((uv-uTouch)*vec2(1.55,1.),(uv-uTouch)*vec2(1.55,1.))*20.);
    p.z -= touch * .045 * uHover;
    // Curtain: pinned along the top edge instead. It hangs in soft pleats,
    // sways from the hem, and the hem trails behind when the sheet moves.
    float hang = pow(1. - y, 1.2);
    vec3 c = rest;
    // Folds: a few broad drapes running down the cloth with finer pleats
    // inside them, wandering a little so they never look ruled.
    float wander = sin(y * 2.2 + wind * .5) * .9;
    c.z += sin(x * 8.5 + wander + 1.3) * .06 * (.3 + .7 * hang);
    c.z += sin(x * 21. + wander * .7) * .028 * (.35 + .65 * hang);
    c.z += sin((x + y * .6) * 5. - wind * .4) * .025 * hang;
    c.z += sin(wind * 1.1 + x * 2.4) * .09 * hang * calm + momentum * hang * .12;
    c.x += sin(wind * .9 + y * 2.) * .03 * hang * calm + momentum * hang * .3;
    c.z -= touch * .045 * uHover;
    p = mix(p, c, uPin);
    // Fold amplitudes were authored for a 2.8-unit sheet; keep them proportional.
    p = rest + (p - rest) * uAmp;
    // Bent round the spiral it hangs on: the edges fall back toward the desk.
    p.z -= uBend * rest.x * rest.x;
    vec4 view = modelViewMatrix * vec4(p,1.);
    vView = view.xyz;
    gl_Position = projectionMatrix * view;
  }
`;
const fragmentShader = `
  uniform sampler2D uMap, uActionMap;
  uniform float uHover, uOpacity, uRevealTime, uDefocus, uHazeNear, uHazeFar;
  uniform float uColor, uBorder, uRound;
  const float ASPECT = .625;
  uniform vec2 uPointer;
  varying vec2 vUv;
  varying vec3 vView;
  void main() {
    vec2 face = gl_FrontFacing ? vUv : vec2(1.-vUv.x,vUv.y);
    // Print look: the artwork sits inside a paper margin.
    vec2 margin = vec2(uBorder, uBorder / ASPECT);
    vec2 coord = (face - margin) / (1. - 2. * margin);
    vec2 inset = step(vec2(0.), coord) * step(coord, vec2(1.));
    vec2 delta = (vUv-uPointer)*vec2(1.55,1.);
    float d = length(delta);
    float front = uRevealTime * 5.;
    // Depth of field: far works sample blurrier mips plus a small disc of taps.
    float bias = uDefocus * 3.2;
    vec2 blur = vec2(uDefocus * .012);
    vec3 ink = texture2D(uMap, coord, bias).rgb * .28;
    ink += texture2D(uMap, coord + vec2(blur.x,0.), bias).rgb * .18;
    ink += texture2D(uMap, coord - vec2(blur.x,0.), bias).rgb * .18;
    ink += texture2D(uMap, coord + vec2(0.,blur.y), bias).rgb * .18;
    ink += texture2D(uMap, coord - vec2(0.,blur.y), bias).rgb * .18;
    float gray = dot(ink,vec3(.2126,.7152,.0722));
    float reveal = (1.-smoothstep(front-.18,front+.12,d))*uHover;
    vec3 monochrome = mix(vec3(gray * .95), vec3(.26,.275,.25), .12);
    vec3 color = mix(monochrome, mix(ink, monochrome, .06), max(reveal, uColor));
    // Printed controls deform, occlude, blur and receive light with the cloth itself.
    vec4 action = texture2D(uActionMap, coord + vec2(0., (1.-uHover)*.012), bias);
    color = mix(color, action.rgb, action.a * smoothstep(.12,.8,uHover));
    color = mix(vec3(.95,.94,.91), color, inset.x * inset.y);
    vec3 n = normalize(cross(dFdx(vView),dFdy(vView)));
    if(!gl_FrontFacing) n=-n;
    vec3 light = normalize(vec3(-.4,.7,1.));
    float diffuse = abs(dot(n,light));
    // Soft diffuse folds with a broad textile sheen, never a hard specular glint.
    float sheen = pow(1. - abs(dot(n, normalize(-vView))), 3.);
    color *= .8 + diffuse * .26;
    color += vec3(.035, .033, .029) * sheen;
    // Atmospheric depth, like Greta: distant sheets dissolve into the room's
    // warm daylight haze instead of turning transparent.
    float haze = smoothstep(uHazeNear, uHazeFar, -vView.z);
    color = mix(color, vec3(.86,.84,.8), haze * .15);
    // Edge of the sheet, with corners rounded by uRound (in sheet widths).
    vec2 q = abs(vUv - .5) * vec2(1., ASPECT) - (vec2(.5, .5 * ASPECT) - uRound);
    float edge = 1. - smoothstep(-.004, 0., length(max(q, 0.)) + min(max(q.x, q.y), 0.) - uRound);
    gl_FragColor = vec4(color,uOpacity*edge*(1. - haze * .5));
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
          uHazeNear: { value: tuning.panels.hazeNear },
          uHazeFar: { value: tuning.panels.hazeFar },
          uAmp: { value: (tuning.panels.width / 2.8) * tuning.panels.folds },
          uPin: { value: 0 },
          uBend: { value: 0 },
          uColor: { value: 0 },
          uBorder: { value: 0 },
          uRound: { value: 0 },
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
    // The clock detour clears the air too.
    const detourFade = 1 - smoothStep(runtime.detour.amount / 0.5);
    const opacity = pose.opacity * approachFade * focusFade * detourFade;
    material.uniforms.uOpacity.value = opacity;
    // Lab variants: how the cloth moves and how the sheet is printed.
    const { cloth, look, far } = tuning.lab;
    material.uniforms.uAmp.value =
      (tuning.panels.width / 2.8) *
      tuning.panels.folds *
      (cloth === 3 ? 0 : cloth === 2 ? 0.3 : 1);
    material.uniforms.uPin.value = cloth === 1 ? 1 : 0;
    material.uniforms.uColor.value = look === 0 ? 0 : 1;
    material.uniforms.uBorder.value = look === 2 ? 0.03 : 0;
    material.uniforms.uRound.value = look === 2 ? 0.035 : 0;
    material.uniforms.uHazeNear.value = tuning.panels.hazeNear;
    material.uniforms.uHazeFar.value = tuning.panels.hazeFar;
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
      pose.scale *
        panelScale(
          distance,
          size.width / size.height,
          (camera as THREE.PerspectiveCamera).fov,
          tuning.panels.width * pose.scale,
          tuning.panels.maxViewFraction,
        ),
    );
    // Bend the sheet to the spiral it hangs on (in the sheet's own units).
    material.uniforms.uBend.value = (group.scale.x * pose.curve) / 2;
    material.uniforms.uDefocus.value =
      pose.away *
      (tuning.lab.far === 2 ? 0 : tuning.panels.farBlur) *
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
