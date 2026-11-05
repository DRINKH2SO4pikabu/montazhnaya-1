"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_SOURCE_RENDER_OVERSAMPLE,
  MAX_TRANSITION_SCALE_GUARD,
  calculateSourceFrameRenderSize
} = require("../electron/source-frame-render-size.cjs");

test("720p export uses an aspect-preserving 1.5x working frame while retaining room for transitions", () => {
  const size = calculateSourceFrameRenderSize(3840, 2160, 1280, 720, 1);
  assert.equal(DEFAULT_SOURCE_RENDER_OVERSAMPLE, 1.5);
  assert.equal(MAX_TRANSITION_SCALE_GUARD, 1.25);
  assert.deepEqual(
    { width: size.width, height: size.height, downscaled: size.downscaled },
    { width: 2400, height: 1350, downscaled: true }
  );
  assert.ok(Math.abs(size.width / size.height - 3840 / 2160) < 0.001);
  assert.ok(size.width <= 3840 && size.height <= 2160);
});

test("larger clip scale increases working resolution and never upscales native media", () => {
  const normal = calculateSourceFrameRenderSize(3840, 2160, 1280, 720, 1);
  const zoomed = calculateSourceFrameRenderSize(3840, 2160, 1280, 720, 2);
  assert.ok(zoomed.width > normal.width);
  assert.equal(zoomed.width, 3840);
  assert.equal(zoomed.height, 2160);
  assert.equal(zoomed.downscaled, false);
  assert.equal(calculateSourceFrameRenderSize(640, 360, 1280, 720, 1).downscaled, false);
});

test("full-resolution exports retain full-resolution source frames", () => {
  const size = calculateSourceFrameRenderSize(3840, 2160, 3840, 2160, 1);
  assert.equal(size.width, 3840);
  assert.equal(size.height, 2160);
  assert.equal(size.downscaled, false);
});

test("source working-size planning rejects invalid dimensions and clip scale", () => {
  assert.throws(() => calculateSourceFrameRenderSize(0, 2160, 1280, 720, 1), /Некорректный размер/);
  assert.throws(() => calculateSourceFrameRenderSize(3840, 2160, 1280, 720, 6), /от 0,1 до 5/);
});
