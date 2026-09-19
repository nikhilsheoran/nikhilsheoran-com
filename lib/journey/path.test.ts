import { test } from "node:test";
import assert from "node:assert/strict";
import { quadMatrix, orbitAngle, ribbonPose } from "./path";
import { chapterProgress } from "./story";

test("screen projection maps all four corners without stretching the iframe's coordinate space", () => {
  const quads = [
    [
      [20, 80],
      [470, 130],
      [425, 415],
      [95, 480],
    ],
    [
      [0, 0],
      [1280, 0],
      [1280, 720],
      [0, 720],
    ],
    [
      [735, 225],
      [837, 367],
      [784, 568],
      [611, 419],
    ],
  ] as const;
  for (const points of quads) {
    const matrix = quadMatrix(points, 1280, 800);
    const corners = [
      [0, 0],
      [1280, 0],
      [1280, 800],
      [0, 800],
    ];
    corners.forEach(([x, y], i) => {
      const w = matrix[3] * x + matrix[7] * y + matrix[15];
      assert.ok(
        Math.abs(
          (matrix[0] * x + matrix[4] * y + matrix[12]) / w - points[i][0],
        ) < 1e-6,
      );
      assert.ok(
        Math.abs(
          (matrix[1] * x + matrix[5] * y + matrix[13]) / w - points[i][1],
        ) < 1e-6,
      );
    });
  }
});

test("chapters form a vertical helix and rise as scroll advances", () => {
  const poses = Array.from({ length: 5 }, (_, i) =>
    ribbonPose(0.4, chapterProgress(i)),
  );
  assert.ok(new Set(poses.map((p) => p.height)).size === 5);
  assert.ok(
    Math.max(...poses.map((p) => p.height)) -
      Math.min(...poses.map((p) => p.height)) >
      5,
  );
  const earlier = ribbonPose(0.3, chapterProgress(2)),
    later = ribbonPose(0.5, chapterProgress(2));
  assert.ok(later.height > earlier.height);
  assert.notEqual(later.angle, earlier.angle);
  assert.ok(orbitAngle(0.84) - orbitAngle(0) > Math.PI * 2);
});
