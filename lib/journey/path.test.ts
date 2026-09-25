import { test } from "node:test";
import assert from "node:assert/strict";
import { Matrix4, PerspectiveCamera, Vector3 } from "three";
import {
  advanceSpring,
  approachPose,
  panelPose,
  quadMatrix,
  railPose,
  screenPose,
  viewFov,
  type Vec3,
} from "./path";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./anchors";
import { beats } from "./timeline";
import { DEFAULT_TUNING } from "./tuning";
import { createMotion, focus, leave, nudge, step } from "./machine";

const T = DEFAULT_TUNING;
const WORKS = 9;
const B = beats(T, WORKS);
const VIEWPORTS = [16 / 9, 16 / 10, 4 / 3, 0.46];

/** Where the seated statue is allowed to be (see scripts/statue). */
const HEAD = { center: [0, 2.6, 0.95] as Vec3, radius: 0.28 };
const TORSO = { min: [-0.45, 0.95, 0.72], max: [0.45, 2.4, 1.5] };

const distance = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function insideBox(p: readonly number[], box: typeof TORSO, pad: number) {
  return p.every((v, i) => v > box.min[i] - pad && v < box.max[i] + pad);
}

function cameraAt(pose: { position: Vec3; target: Vec3 }, aspect: number) {
  const camera = new PerspectiveCamera(viewFov(aspect, T), aspect, 0.04, 100);
  camera.position.fromArray(pose.position);
  camera.lookAt(new Vector3(...pose.target));
  camera.updateMatrixWorld();
  return camera;
}

test("screen projection maps all four corners without stretching the iframe's coordinate space", () => {
  const quads = [
    [
      [20, 80],
      [470, 130],
      [425, 415],
      [95, 480],
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
    [
      [0, 0],
      [1280, 0],
      [1280, 800],
      [0, 800],
    ].forEach(([x, y], i) => {
      const w = matrix[3] * x + matrix[7] * y + matrix[15];
      assert.ok(
        Math.abs((matrix[0] * x + matrix[4] * y + matrix[12]) / w - points[i][0]) < 1e-6,
      );
      assert.ok(
        Math.abs((matrix[1] * x + matrix[5] * y + matrix[13]) / w - points[i][1]) < 1e-6,
      );
    });
  }
});

test("the display is 13.3 inches at 16:10 in the studio's half-metre units", () => {
  assert.ok(
    Math.abs((Math.hypot(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.5) / 0.0254 - 13.3) < 1e-6,
  );
  assert.ok(Math.abs(SCREEN_WIDTH / SCREEN_HEIGHT - 1.6) < 1e-9);
});

test("the rail ends exactly at the resting Mac pose on every viewport", () => {
  for (const aspect of VIEWPORTS) {
    const fov = viewFov(aspect, T);
    const end = railPose(1, aspect, fov, T);
    const rest = screenPose(aspect, fov);
    assert.ok(distance(end.position, rest.position) < 1e-9);
    assert.ok(distance(end.target, rest.target) < 1e-9);
  }
});

test("the rail has no jumps and no kink where the orbit hands off to the descent", () => {
  for (const aspect of VIEWPORTS) {
    const fov = viewFov(aspect, T);
    const at = (p: number) => railPose(p, aspect, fov, T).position;
    const steps = 4000;
    let largest = 0;
    for (let i = 1; i <= steps; i++)
      largest = Math.max(largest, distance(at(i / steps), at((i - 1) / steps)));
    // 4000 samples: no single step may exceed 2.5 cm.
    assert.ok(largest < 0.05, `largest step ${largest}`);

    const h = T.timeline.handoffStart,
      e = 1e-4;
    const before = at(h).map((v, i) => (v - at(h - e)[i]) / e);
    const after = at(h + e).map((v, i) => (v - at(h)[i]) / e);
    const speedRatio = Math.hypot(...after) / Math.hypot(...before);
    const cosine =
      before.reduce((sum, v, i) => sum + v * after[i], 0) /
      (Math.hypot(...before) * Math.hypot(...after));
    assert.ok(Math.abs(speedRatio - 1) < 0.05, `speed ratio ${speedRatio}`);
    assert.ok(cosine > 0.999, `direction cosine ${cosine}`);
  }
});

test("the approach only ever closes in on the Mac: no overshoot, no swing back", () => {
  for (const aspect of VIEWPORTS) {
    const fov = viewFov(aspect, T);
    const rest = screenPose(aspect, fov).position;
    let last = Infinity;
    for (let i = 0; i <= 2000; i++) {
      const p = T.timeline.handoffStart + (i / 2000) * (1 - T.timeline.handoffStart);
      const d = distance(railPose(p, aspect, fov, T).position, rest);
      assert.ok(d <= last + 1e-9, `moved away from the Mac at progress ${p.toFixed(4)}`);
      last = d;
    }
    // Eases to rest: the last 1% of scroll covers under 5% of the approach.
    const start = railPose(T.timeline.handoffStart, aspect, fov, T).position;
    const nearEnd = railPose(0.99, aspect, fov, T).position;
    assert.ok(distance(nearEnd, rest) < 0.05 * distance(start, rest));
  }
});

test("neither the rail nor a direct approach passes through the seated statue", () => {
  for (const aspect of VIEWPORTS) {
    const fov = viewFov(aspect, T);
    const paths = [
      (t: number) => railPose(t, aspect, fov, T).position,
      ...[0, 0.2, 0.45, 0.7, 0.79].map(
        (from) => (t: number) => approachPose(from, t, aspect, fov, T).position,
      ),
    ];
    for (const path of paths) {
      for (let i = 0; i <= 1000; i++) {
        const p = path(i / 1000);
        assert.ok(
          distance(p, HEAD.center) > HEAD.radius + 0.1,
          `camera within ${distance(p, HEAD.center).toFixed(3)} of the head at ${p.map((v) => v.toFixed(2))}`,
        );
        assert.ok(!insideBox(p, TORSO, 0.08), `camera inside torso at ${p}`);
      }
    }
  }
});

test("a direct approach starts on the rail and arrives at the resting pose", () => {
  for (const from of [0, 0.33, 0.78]) {
    const start = approachPose(from, 0, 16 / 9, 40, T);
    const end = approachPose(from, 1, 16 / 9, 40, T);
    assert.ok(distance(start.position, railPose(from, 16 / 9, 40, T).position) < 1e-9);
    assert.ok(distance(end.position, screenPose(16 / 9, 40).position) < 1e-9);
  }
});

test("at most three panels are ever visible, with the reading panel most opaque", () => {
  for (let i = 0; i <= 2000; i++) {
    const progress = i / 2000;
    const camera = railPose(progress, 16 / 9, 40, T).position;
    const poses = Array.from({ length: WORKS }, (_, index) =>
      panelPose(index, progress, B, T, camera),
    );
    const visible = poses.filter((pose) => pose.opacity > 0.02);
    assert.ok(visible.length <= 3, `${visible.length} visible at ${progress}`);
    for (const pose of visible)
      assert.ok(pose.position[1] > 0.4, "visible panels stay above the floor");
  }
  B.chapters.forEach((reading, index) => {
    const camera = railPose(reading, 16 / 9, 40, T).position;
    const poses = Array.from({ length: WORKS }, (_, j) =>
      panelPose(j, reading, B, T, camera),
    );
    const brightest = poses.reduce((a, b) => (b.opacity > a.opacity ? b : a));
    assert.equal(brightest, poses[index]);
  });
});

test("each work is framed right of centre and in front of the camera at its reading moment", () => {
  for (const aspect of [16 / 9, 4 / 3, 0.46]) {
    B.chapters.forEach((reading, index) => {
      const pose = railPose(reading, aspect, viewFov(aspect, T), T);
      const camera = cameraAt(pose, aspect);
      const panel = panelPose(index, reading, B, T, pose.position);
      const ndc = new Vector3(...panel.position).project(camera);
      const view = new Vector3(...panel.position).applyMatrix4(
        new Matrix4().copy(camera.matrixWorldInverse),
      );
      assert.ok(view.z < -0.5, `panel ${index} is in front of the camera`);
      assert.ok(Math.abs(ndc.x) < 0.7 && Math.abs(ndc.y) < 0.7, `panel ${index} at ${ndc.x.toFixed(2)},${ndc.y.toFixed(2)}`);
      if (aspect > 1) assert.ok(ndc.x > 0, `panel ${index} sits right of centre`);
    });
  }
});

test("scroll spring is frame-rate independent", () => {
  const results = [30, 60, 120].map((fps) => {
    let value = 0,
      velocity = 0;
    for (let i = 0; i < fps; i++) {
      const next = advanceSpring(value, velocity, i < fps / 2 ? 0.8 : 0.15, 1 / fps);
      value = next.value;
      velocity = next.velocity;
    }
    return value;
  });
  assert.ok(Math.max(...results) - Math.min(...results) < 1e-9);
});

function run(motion: ReturnType<typeof createMotion>, seconds: number) {
  const events: string[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    const event = step(motion, 1 / 60, B, T);
    if (event) events.push(event);
  }
  return events;
}

test("scrolling past the settle point glides into the Mac; a reverse scroll returns to the last work", () => {
  const motion = createMotion();
  const events: string[] = [];
  for (let i = 0; i < 40; i++) {
    nudge(motion, 0.04, B);
    events.push(...run(motion, 0.05));
  }
  events.push(...run(motion, 3));
  assert.deepEqual(events, ["arrived"]);
  assert.equal(motion.mode, "focused");
  nudge(motion, 0.04, B);
  assert.equal(motion.mode, "focused", "trackpad momentum doesn't leave the Mac");
  nudge(motion, -0.02, B);
  assert.equal(motion.mode, "orbit");
  run(motion, 3);
  assert.ok(Math.abs(motion.progress - B.returnTo) < 0.005);
});

test("stopping partway down the descent never leaves the camera hanging", () => {
  const forward = createMotion();
  forward.progress = forward.target = B.handoffStart - 0.01;
  nudge(forward, 0.02, B);
  run(forward, 3);
  assert.equal(forward.mode, "focused");

  const backward = createMotion();
  backward.progress = backward.target = 0.95;
  nudge(backward, -0.04, B);
  run(backward, 3);
  assert.equal(backward.mode, "orbit");
  assert.ok(Math.abs(backward.progress - B.returnTo) < 0.005);
});

test("clicking the laptop flies in and leaving flies back to the same place", () => {
  const motion = createMotion();
  motion.progress = motion.target = 0.3;
  focus(motion, B);
  assert.equal(motion.mode, "approaching");
  assert.deepEqual(run(motion, T.timeline.approachSeconds + 0.2), ["arrived"]);
  leave(motion, B);
  assert.deepEqual(run(motion, T.timeline.approachSeconds + 0.2), ["left"]);
  assert.equal(motion.mode, "orbit");
  assert.ok(Math.abs(motion.progress - 0.3) < 1e-9);
});
