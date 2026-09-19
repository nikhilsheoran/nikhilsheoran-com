"use client";

/* eslint-disable react-hooks/immutability -- This pass updates Three.js uniforms and render targets in the render loop. */
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneProps } from "./portal";

const fragment = `
  uniform sampler2D tColor,tDepth;
  uniform mat4 uInverseVP,uPreviousVP;
  uniform vec2 uResolution;
  uniform float uNear,uFar,uFocus,uTime,uMotion,uStrength;
  varying vec2 vUv;
  float distanceAt(float depth) { return uNear*uFar/(uFar-depth*(uFar-uNear)); }
  float hash(vec2 p) { return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){
    vec4 original=texture2D(tColor,vUv);
    float depth=texture2D(tDepth,vUv).r;
    float distance=distanceAt(depth);
    float coc=clamp((abs(distance-uFocus)-1.25)*.78,0.,7.5)*uStrength;
    if(distance<uFocus) coc*=.38;
    if(original.a<.98) coc=0.;
    vec4 world=uInverseVP*vec4(vUv*2.-1.,depth*2.-1.,1.);
    world/=world.w;
    vec4 previous=uPreviousVP*world;
    vec2 velocity=(vUv-(previous.xy/previous.w*.5+.5))*uMotion;
    velocity=clamp(velocity,vec2(-.025),vec2(.025));
    vec3 sum=original.rgb;
    float total=1.;
    // Depth-aware disk samples keep a sharp silhouette from bleeding into distant cloth.
    for(int i=0;i<8;i++){
      float fi=float(i)+.5;
      float angle=fi*2.39996323;
      vec2 disk=vec2(cos(angle),sin(angle))*sqrt(fi/8.);
      vec2 uv=vUv+disk*coc/uResolution+velocity*(fi/8.-.5);
      vec4 sampleColor=texture2D(tColor,uv);
      float sampleDistance=distanceAt(texture2D(tDepth,uv).r);
      float weight=sampleColor.a*smoothstep(-1.2,.1,sampleDistance-distance);
      sum+=sampleColor.rgb*weight;total+=weight;
    }
    vec3 color=sum/total;
    vec2 centered=(vUv-.5)*vec2(1.,.8);
    color*=1.-dot(centered,centered)*.28*uStrength;
    color+=(hash(gl_FragCoord.xy+floor(uTime*24.))-.5)*.008*uStrength;
    gl_FragColor=vec4(color,original.a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Camera-reprojection motion blur and actual depth-buffer focus, not a CSS canvas blur. */
export function Lens({ runtimeRef }: Pick<SceneProps, "runtimeRef">) {
  const { gl, size } = useThree();
  const pipeline = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      depthBuffer: true,
      samples: 2,
    });
    target.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: target.texture },
        tDepth: { value: target.depthTexture },
        uInverseVP: { value: new THREE.Matrix4() },
        uPreviousVP: { value: new THREE.Matrix4() },
        uResolution: { value: new THREE.Vector2() },
        uNear: { value: 0.04 },
        uFar: { value: 60 },
        uFocus: { value: 8 },
        uTime: { value: 0 },
        uMotion: { value: 0 },
        uStrength: { value: 1 },
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
      gl.getPixelRatio(),
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
  }, [size, gl, pipeline]);
  useEffect(
    () => () => {
      pipeline.target.dispose();
      pipeline.material.dispose();
      pipeline.geometry.dispose();
    },
    [pipeline],
  );
  useFrame(({ scene, camera, clock }, delta) => {
    const state = runtimeRef.current;
    const uniforms = pipeline.material.uniforms;
    camera.updateMatrixWorld();
    pipeline.vp.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    if (!pipeline.initialized) {
      pipeline.previous.copy(pipeline.vp);
      pipeline.initialized = true;
    }
    uniforms.uInverseVP.value.copy(pipeline.vp).invert();
    uniforms.uPreviousVP.value.copy(pipeline.previous);
    uniforms.uFocus.value = THREE.MathUtils.damp(
      uniforms.uFocus.value,
      state.focusDistance,
      6,
      Math.min(delta, 0.05),
    );
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uStrength.value = (1 - state.entry) * (size.width < 600 ? 0.6 : 1);
    // Normalize shutter time against frame rate and remove temporal effects for reduced motion.
    uniforms.uMotion.value = state.reducedMotion
      ? 0
      : Math.min(0.65, 0.012 / Math.max(delta, 0.008)) * (1 - state.entry);
    gl.setRenderTarget(pipeline.target);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(pipeline.scene, pipeline.camera);
    pipeline.previous.copy(pipeline.vp);
  }, 1);
  return null;
}
