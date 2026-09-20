import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Matrix4, Quaternion, Vector3 } from "three";

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
