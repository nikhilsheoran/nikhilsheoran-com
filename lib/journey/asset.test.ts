import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Matrix4, Quaternion, Vector3 } from "three";

test("the furnished room retains contact shading and surface maps within its runtime budget", () => {
  const bytes = readFileSync(
    new URL("../../public/journey/nyc-apartment.glb", import.meta.url),
  );
  const data = JSON.parse(
    bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)),
  );
  const primitives = data.meshes.flatMap(
    (mesh: {
      primitives: {
        attributes: Record<string, number>;
        indices: number;
        material: number;
      }[];
    }) => mesh.primitives,
  );
  assert.ok(
    bytes.length < 8_000_000,
    "the room must stay below the 8 MB transfer budget",
  );
  assert.ok(
    primitives.length <= 64,
    "static furnishings must be batched by material",
  );
  const contactSurfaces = primitives.filter((primitive: { material: number }) =>
    /floor|upholstery|boucle|limestone/.test(
      data.materials[primitive.material].name,
    ),
  );
  assert.ok(contactSurfaces.length >= 4, "main room surfaces must be present");
  assert.ok(
    contactSurfaces.every(
      (primitive: { attributes: Record<string, number> }) =>
        primitive.attributes.COLOR_0 !== undefined,
    ),
    "baked contact shading must survive export and optimization",
  );
  const triangles = primitives.reduce(
    (total: number, primitive: { indices: number }) =>
      total + data.accessors[primitive.indices].count / 3,
    0,
  );
  assert.ok(
    triangles < 400_000,
    "bevels and foliage must be simplified for real-time use",
  );
  assert.ok(
    data.materials.filter(
      (material: { normalTexture?: unknown }) => material.normalTexture,
    ).length >= 6,
    "fabric, plaster, wood and stone detail must use portable texture maps",
  );
});

test("exported laptop retains physical dimensions and an emissive logo", () => {
  const bytes = readFileSync(
    new URL("../../public/journey/macbook-air-calibrated.glb", import.meta.url),
  );
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  const data = JSON.parse(
    bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)),
  );
  const index = data.nodes.findIndex(
    (node: { name: string }) => node.name === "Air / CORPO",
  );
  assert.ok(index >= 0, "calibrated chassis must be present");
  const world = new Matrix4();
  let current = index;
  while (current >= 0) {
    const node = data.nodes[current];
    const local = node.matrix
      ? new Matrix4().fromArray(node.matrix)
      : new Matrix4().compose(
          new Vector3().fromArray(node.translation ?? [0, 0, 0]),
          new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
          new Vector3().fromArray(node.scale ?? [1, 1, 1]),
        );
    world.premultiply(local);
    current = data.nodes.findIndex((parent: { children?: number[] }) =>
      parent.children?.includes(current),
    );
  }
  const primitive = data.meshes[data.nodes[index].mesh].primitives[0];
  const bounds = data.accessors[primitive.attributes.POSITION];
  const min = new Vector3().fromArray(bounds.min).applyMatrix4(world);
  const max = new Vector3().fromArray(bounds.max).applyMatrix4(world);
  assert.ok(Math.abs(max.x - min.x - 0.65) < 1e-5, "case must be 325 mm wide");
  assert.ok(Math.abs(max.z - min.z - 0.454) < 1e-5, "case must be 227 mm deep");
  const logo = data.materials.find((material: { name: string }) =>
    material.name.includes("illuminated Apple"),
  );
  assert.ok(logo.emissiveTexture, "logo emission must survive glTF export");
  assert.ok(
    logo.emissiveFactor[0] > logo.emissiveFactor[2] &&
      logo.emissiveFactor[2] > logo.emissiveFactor[1],
    "logo tint must remain pink after export",
  );
  assert.ok(
    logo.extensions.KHR_materials_emissive_strength.emissiveStrength > 1,
  );
});
