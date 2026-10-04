"use client";

/* eslint-disable react-hooks/immutability -- This pass updates Three.js uniforms and render targets in the render loop. */
import { isSmallDevice } from "@/lib/journey/device";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneProps } from "./runtime";

const fragment = `
  uniform sampler2D tColor,tDepth;
  uniform mat4 uInverseVP,uPreviousVP;
  uniform vec2 uResolution;
  uniform float uMotion;
  varying vec2 vUv;
  void main(){
    vec4 original=texture2D(tColor,vUv);
    float depth=texture2D(tDepth,vUv).r;
    // The architecture and laptop stay optically sharp. Only the cloth shader
    // softens distant pages; a short shutter is used while the camera moves.
    vec4 world=uInverseVP*vec4(vUv*2.-1.,depth*2.-1.,1.);
    world/=world.w;
    vec4 previous=uPreviousVP*world;
    vec2 velocity=(vUv-(previous.xy/previous.w*.5+.5))*uMotion;
    velocity=clamp(velocity,-1.5/uResolution,1.5/uResolution);
    vec3 sum=original.rgb;
    float total=1.;
    for(int i=0;i<4;i++){
      float t=(float(i)+.5)/4.-.5;
      vec4 sampleColor=texture2D(tColor,vUv+velocity*t);
      float weight=step(.98,sampleColor.a)*step(.98,original.a)*.25;
      sum+=sampleColor.rgb*weight;total+=weight;
    }
    vec3 color=sum/total;
    // Only HDR emission blooms; the DOM-screen opening keeps its exact alpha.
    vec3 bloom=vec3(0.);
    for(int j=0;j<12;j++){
      float a=float(j)*2.39996323;
      vec2 offset=vec2(cos(a),sin(a))*(.8+float(j)*.22)/uResolution;
      vec4 glow=texture2D(tColor,vUv+offset);
      bloom+=max(glow.rgb-vec3(1.7),vec3(0.))*glow.a;
    }
    color+=bloom*.022*original.a;

    gl_FragColor=vec4(color,original.a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Restrained HDR bloom and short camera shutter; no full-scene defocus. */
export function Lens({ runtimeRef }: Pick<SceneProps, "runtimeRef">) {
  const { gl, size } = useThree();
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const pipeline = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      depthBuffer: true,
      samples: isSmallDevice() ? 0 : 2,
    });
    target.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: target.texture },
        tDepth: { value: target.depthTexture },
        uInverseVP: { value: new THREE.Matrix4() },
        uPreviousVP: { value: new THREE.Matrix4() },
        uResolution: { value: new THREE.Vector2() },
        uMotion: { value: 0 },
      },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
      fragmentShader: fragment,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));
    return {
      target,
      material,
      scene,
      camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
      vp: new THREE.Matrix4(),
      previous: new THREE.Matrix4(),
      initialized: false,
      geometry,
    };
  }, []);
  useEffect(() => {
    const dpr = Math.min(
      pixelRatio,
      2,
      3840 / size.width,
      2160 / size.height,
    );
    pipeline.target.setSize(
      Math.round(size.width * dpr),
      Math.round(size.height * dpr),
    );
    pipeline.material.uniforms.uResolution.value.set(
      size.width * dpr,
      size.height * dpr,
    );
    pipeline.initialized = false;
  }, [size, pixelRatio, pipeline]);
  useEffect(
    () => () => {
      pipeline.target.dispose();
      pipeline.material.dispose();
      pipeline.geometry.dispose();
    },
    [pipeline],
  );
  useFrame(({ scene, camera }, delta) => {
    const state = runtimeRef.current;
    const uniforms = pipeline.material.uniforms;
    camera.updateMatrixWorld();
    pipeline.vp.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    if (
      state.motion.mode === "focused" &&
      pipeline.initialized &&
      pipeline.vp.equals(pipeline.previous)
    )
      return;
    if (!pipeline.initialized) {
      pipeline.previous.copy(pipeline.vp);
      pipeline.initialized = true;
    }
    uniforms.uInverseVP.value.copy(pipeline.vp).invert();
    uniforms.uPreviousVP.value.copy(pipeline.previous);
    // Normalize shutter time against frame rate and remove temporal effects for reduced motion.
    uniforms.uMotion.value =
      state.motion.reducedMotion || state.motion.mode === "focused"
        ? 0
        : Math.min(0.18, 0.003 / Math.max(delta, 0.008));
    const toneMapping = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    gl.setRenderTarget(pipeline.target);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.toneMapping = toneMapping;
    gl.render(pipeline.scene, pipeline.camera);
    pipeline.previous.copy(pipeline.vp);
  }, 1);
  return null;
}
