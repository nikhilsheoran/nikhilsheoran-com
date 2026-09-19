import { test } from "node:test";
import assert from "node:assert/strict";
import {
  quadMatrix,
  orbitAngle,
  ribbonPose,
  journeyPose,
  screenFillDistance,
  monitorLift,
  panelScale,
} from "./path";
import { chapterProgress, SCREEN_POSITION, SCREEN_TILT } from "./story";

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
      3,
  );
  const earlier = ribbonPose(0.3, chapterProgress(2)),
    later = ribbonPose(0.5, chapterProgress(2));
  assert.ok(later.height > earlier.height);
  assert.notEqual(later.angle, earlier.angle);
  assert.ok(orbitAngle(0.84) - orbitAngle(0) > Math.PI * 2);
});

test("the helix tightens continuously into the precomputed desk pose on wide and narrow viewports", () => {
  for (const aspect of [390 / 844, 1045 / 770, 16 / 9, 2.4]) {
    let previous = Infinity;
    for (let i = 0; i <= 100; i++) {
      const pose = journeyPose(i / 100, aspect);
      assert.ok(pose.radius <= previous);
      previous = pose.radius;
    }
    const end = journeyPose(1, aspect);
    const d = screenFillDistance(aspect, 40) * 1.16;
    assert.ok(Math.abs(end.position[0]) < 1e-9);
    assert.ok(
      Math.abs(
        end.position[1] -
          (SCREEN_POSITION[1] -
            Math.sin(SCREEN_TILT) * d +
            monitorLift(aspect)),
      ) < 1e-9,
    );
    assert.ok(
      Math.abs(
        end.position[2] - (SCREEN_POSITION[2] + Math.cos(SCREEN_TILT) * d),
      ) < 1e-9,
    );
    assert.deepEqual(end.target, SCREEN_POSITION);
    const almost = journeyPose(0.9999, aspect);
    assert.ok(
      Math.hypot(...end.position.map((v, i) => v - almost.position[i])) <
        0.00001,
    );
  }
});

test("focused display fits with a 12% hover-out margin on each limiting edge", () => {
  for (const aspect of [390 / 844, 1045 / 770, 16 / 9, 2.4]) {
    const d = screenFillDistance(aspect, 40);
    const height = 2 * d * Math.tan((20 * Math.PI) / 180);
    const fraction = Math.max(0.679 / height, 1.085 / (height * aspect));
    assert.ok(Math.abs(fraction - 0.76) < 1e-9);
  }
});

test("all five panels start above the floor and rise continuously", () => {
  for (let i = 0; i < 5; i++) {
    let previous = 0;
    for (let p = 0; p <= 1; p += 0.01) {
      const height = ribbonPose(p, chapterProgress(i)).height;
      assert.ok(height >= 1.05);
      assert.ok(height > previous);
      previous = height;
    }
  }
});

test("panel size stays bounded as the camera gets close, including curled edges", () => {
  for (const aspect of [0.46, 1, 1.78])
    for (const progress of [0, 0.4, 0.7, 0.83]) {
      for (const depth of [0.2, 0.5, 1, 2, 4, 8]) {
        const radius = panelScale(depth, aspect, progress) * 1.8;
        const projected =
          radius /
          (Math.sqrt(depth * depth - radius * radius) *
            Math.tan((20 * Math.PI) / 180) *
            Math.min(1, aspect));
        assert.ok(projected <= 0.640001);
      }
      assert.ok(
        panelScale(1, aspect, progress) < panelScale(4, aspect, progress),
      );
    }
});
