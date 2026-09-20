"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Bake static node transforms and batch by material, retaining editable Blender sources. */
export function useStaticModel(url: string) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    scene.updateMatrixWorld(true);
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      // Keep the room's baked contact shading and any secondary texture UVs.
      const material = object.material as THREE.MeshStandardMaterial;
      for (const name of Object.keys(geometry.attributes)) {
        if (!["position", "normal", "uv", "uv1", "color"].includes(name))
          geometry.deleteAttribute(name);
      }
      if (!geometry.getAttribute("uv")) {
        geometry.setAttribute(
          "uv",
          new THREE.Float32BufferAttribute(
            new Float32Array(geometry.getAttribute("position").count * 2),
            2,
          ),
        );
      }
      const batch = batches.get(material) ?? [];
      batch.push(geometry);
      batches.set(material, batch);
    });
    const group = new THREE.Group();
    for (const [material, geometries] of batches) {
      const merged = mergeGeometries(geometries);
      if (merged) {
        geometries.forEach((geometry) => geometry.dispose());
        const mesh = new THREE.Mesh(merged, material);
        mesh.castShadow = mesh.receiveShadow = true;
        group.add(mesh);
      } else {
        // Preserve the visible asset if a later export introduces incompatible attributes.
        for (const geometry of geometries) {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = mesh.receiveShadow = true;
          group.add(mesh);
        }
      }
    }
    return group;
  }, [scene]);
  useEffect(
    () => () => {
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
    },
    [model],
  );
  return model;
}
