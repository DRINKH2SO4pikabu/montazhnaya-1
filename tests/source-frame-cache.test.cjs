"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MIB,
  MAX_SOURCE_FRAME_CACHE_BYTES,
  DEFAULT_SOURCE_FRAME_WINDOW_FRAMES,
  SOURCE_FRAME_WINDOW_PNG_ESTIMATE_RATIO,
  reduceSourceFrameWindowSize,
  selectSourceFrameWindow,
  estimateSourceFrameWindowBytes,
  calculateSourceFrameCacheEvictions,
  buildSourceFrameCacheKey
} = require("../electron/source-frame-cache.cjs");

const indices = Array.from({ length: 5000 }, (_, index) => index * 2);

test("source frame cache selects bounded windows around requested frames", () => {
  const window = selectSourceFrameWindow(indices, 2000, 32, 2);
  assert.equal(window.length, 32);
  assert.ok(window.includes(2000));
  assert.deepEqual(window, indices.slice(998, 1030));
  assert.equal(selectSourceFrameWindow(indices, 0, 8).length, 8);
  assert.equal(selectSourceFrameWindow(indices, 9998, 8).length, 8);
  assert.throws(() => selectSourceFrameWindow(indices, 9999, 8), /не входит/);
});

test("source frame cache window is bounded for long sequences and supports sparse frame plans", () => {
  const sparse = [0, 1, 4, 10, 20, 50, 100, 200, 500];
  assert.deepEqual(selectSourceFrameWindow(sparse, 20, 4, 1), [10, 20]);
  assert.deepEqual(selectSourceFrameWindow(sparse, 20, 4, 1, 100), [10, 20, 50, 100]);
  assert.deepEqual(selectSourceFrameWindow([0, 1, 2, 9000, 9001], 9000, 48), [9000, 9001]);
  assert.equal(DEFAULT_SOURCE_FRAME_WINDOW_FRAMES, 48);
  assert.ok(selectSourceFrameWindow(indices, 5000, 48).length <= 48);
});

test("source frame window estimate stays within the cache budget or can be reduced", () => {
  const estimate = estimateSourceFrameWindowBytes(3840, 2160, 16);
  assert.ok(estimate.totalBytes > 0);
  assert.ok(estimate.totalBytes < MAX_SOURCE_FRAME_CACHE_BYTES);
  assert.ok(estimate.totalBytes >= 3840 * 2160 * 4 * 16, "default estimate must be conservative up to raw RGBA size");
  const one = estimateSourceFrameWindowBytes(3840, 2160, 1);
  assert.ok(one.totalBytes < MAX_SOURCE_FRAME_CACHE_BYTES);
  assert.throws(() => estimateSourceFrameWindowBytes(0, 2160, 1), /Некорректные параметры/);
});

test("source frame window reduction halves safely and stops at one frame", () => {
  assert.equal(reduceSourceFrameWindowSize(48), 24);
  assert.equal(reduceSourceFrameWindowSize(24), 12);
  assert.equal(reduceSourceFrameWindowSize(3), 1);
  assert.equal(reduceSourceFrameWindowSize(1), null);
  assert.equal(reduceSourceFrameWindowSize(0), null);
});

test("4K PNG windows can use the configured 48-frame batch while the actual-size guard stays authoritative", () => {
  assert.equal(SOURCE_FRAME_WINDOW_PNG_ESTIMATE_RATIO, 0.25);
  const estimate = estimateSourceFrameWindowBytes(
    3840, 2160, DEFAULT_SOURCE_FRAME_WINDOW_FRAMES, SOURCE_FRAME_WINDOW_PNG_ESTIMATE_RATIO
  );
  assert.ok(estimate.totalBytes < MAX_SOURCE_FRAME_CACHE_BYTES);
  // The default estimator remains intentionally conservative for disk-space
  // safety; only the source-PNG batch planner uses the compression heuristic.
  const rawUpperBound = estimateSourceFrameWindowBytes(3840, 2160, DEFAULT_SOURCE_FRAME_WINDOW_FRAMES);
  assert.ok(rawUpperBound.totalBytes > MAX_SOURCE_FRAME_CACHE_BYTES);
});

test("source frame cache evicts least-recently-used entries and protects the requested frame", () => {
  const entries = new Map([
    ["old", { sizeBytes: 100 * MIB, lastUsed: 1 }],
    ["recent", { sizeBytes: 100 * MIB, lastUsed: 9 }],
    ["current", { sizeBytes: 100 * MIB, lastUsed: 10 }]
  ]);
  const plan = calculateSourceFrameCacheEvictions(entries, 300 * MIB, 150 * MIB, new Set(["current"]));
  assert.deepEqual(plan.evictKeys, ["old", "recent"]);
  assert.equal(plan.remainingBytes, 100 * MIB);
  assert.equal(plan.bytesToFree, 200 * MIB);
  assert.throws(() => calculateSourceFrameCacheEvictions(entries, 300 * MIB, 50 * MIB, new Set(["old", "recent", "current"])), /защищённые/);
});

test("renderer decoded-image cache is byte bounded rather than only item bounded", () => {
  const renderer = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "src", "renderer", "index.html"), "utf8");
  assert.match(renderer, /frameAccurateSourceImageCacheBytes/);
  assert.match(renderer, /maxDecodedCacheBytes\s*=\s*256\s*\*\s*1024\s*\*\s*1024/);
  assert.match(renderer, /naturalWidth\s*\*\s*image\.naturalHeight\s*\*\s*4/);
  assert.match(renderer, /decodedBytes\s*>\s*maxDecodedCacheBytes[\s\S]*?revokeObjectURL\(objectUrl\)[\s\S]*?return image/);
});

test("source cache keys are stable and scoped by media identity", () => {
  assert.equal(buildSourceFrameCacheKey("video-1", 42), "video-1\u000042");
  assert.notEqual(buildSourceFrameCacheKey("video-1", 42), buildSourceFrameCacheKey("video-2", 42));
  assert.throws(() => buildSourceFrameCacheKey("", 1), /Некорректный ключ/);
});
