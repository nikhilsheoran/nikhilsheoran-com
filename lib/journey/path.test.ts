import { test } from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import {
  quadMatrix,
  orbitAngle,
  ribbonPose,
  journeyPose,
  screenFillDistance,
  monitorLift,
  panelScale,
  panelPresence,
} from "./path";
import {
  chapterProgress,
  SCREEN_POSITION,
  SCREEN_TILT,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from "./story";

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
    const fraction = Math.max(
      SCREEN_HEIGHT / height,
      SCREEN_WIDTH / (height * aspect),
    );
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

test("the travelling chapter window shows at most three panels without a visibility jump", () => {
  for (let n = 0; n <= 1000; n++) {
    const p = n / 1000;
    const visible = Array.from({ length: 5 }, (_, i) =>
      panelPresence(p, i),
    ).filter((a) => a > 0.015);
    assert.ok(visible.length <= 3, `too many panels at ${p}`);
    for (let i = 0; i < 5; i++)
      assert.ok(
        Math.abs(panelPresence(p, i) - panelPresence(p + 0.0001, i)) < 0.006,
      );
  }
  assert.equal(
    Array.from({ length: 5 }, (_, i) => panelPresence(0, i)).filter(
      (a) => a > 0.015,
    ).length,
    3,
  );
  assert.equal(panelPresence(0.9, 4), 0);
  for (let i = 0; i < 5; i++)
    assert.ok(panelPresence(chapterProgress(i), i) > 0.95);
});

test("every chapter has a readable position within the camera frame", () => {
  for (const aspect of [0.46, 1, 1.78, 2.4])
    for (let i = 0; i < 5; i++) {
      const progress = chapterProgress(i);
      const pose = journeyPose(progress, aspect),
        cloth = ribbonPose(progress, progress);
      const camera = new PerspectiveCamera(40, aspect, 0.04, 60);
      camera.position.fromArray(pose.position);
      camera.lookAt(new Vector3(...pose.target));
      camera.updateMatrixWorld();
      const projected = new Vector3(
        Math.sin(cloth.angle) * cloth.radius,
        cloth.height,
        cloth.centerZ +
          Math.cos(cloth.angle) * cloth.radius * Math.cos(SCREEN_TILT),
      ).project(camera);
      assert.ok(Math.abs(projected.x) < 0.45 && Math.abs(projected.y) < 0.4);
      assert.ok(projected.z > -1 && projected.z < 1);
    }
});

// Physical specification independent of camera framing tests.
test("the display is 13.3 inches at 16:10 in the studio's half-metre units", () => {
  assert.ok(
    Math.abs((Math.hypot(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.5) / 0.0254 - 13.3) <
      1e-6,
  );
  assert.ok(Math.abs(SCREEN_WIDTH / SCREEN_HEIGHT - 1.6) < 1e-9);
});
