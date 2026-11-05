const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "..", "src", "renderer", "index.html");
const source = fs.readFileSync(sourcePath, "utf8");

function loadHelper(name) {
  const normalizeMatch = source.match(/function normalizeImageClipTiming\([^)]*\)\s*\{[\s\S]*?\n\}/m);
  const trimMatch = source.match(/function applyStillImageLeftTrim\([^)]*\)\s*\{[\s\S]*?\n\}/m);
  assert.ok(normalizeMatch, "normalizeImageClipTiming should be defined in the renderer");
  assert.ok(trimMatch, "applyStillImageLeftTrim should be defined in the renderer");
  const sandbox = {
    MIN_CLIP_DURATION: 0.05,
    roundToFrame: value => Math.round(value * 30) / 30
  };
  vm.runInNewContext(`${normalizeMatch[0]}\n${trimMatch[0]}\nthis.helper = ${name};`, sandbox);
  return sandbox.helper;
}
test("still-image timing is normalized independently from source duration", () => {
  const normalize = loadHelper("normalizeImageClipTiming");
  const clip = { sourceIn: 2, sourceOut: 4, duration: 2 };
  normalize(clip, 18.2);
  assert.equal(clip.sourceIn, 0);
  assert.ok(Math.abs(clip.duration - 18.2) < 1 / 30);
  assert.equal(clip.sourceOut, clip.duration);
});

test("dragging the left edge of a still image left extends its duration", () => {
  const trimLeft = loadHelper("applyStillImageLeftTrim");
  const clip = { timelineStart: 10, duration: 5, sourceIn: 0, sourceOut: 5 };
  trimLeft(clip, { timelineStart: 10, duration: 5 }, -3);
  assert.equal(clip.timelineStart, 7);
  assert.equal(clip.duration, 8);
  assert.equal(clip.sourceIn, 0);
  assert.equal(clip.sourceOut, 8);
});

test("dragging the left edge of a still image right shortens it without moving its end", () => {
  const trimLeft = loadHelper("applyStillImageLeftTrim");
  const clip = { timelineStart: 10, duration: 5, sourceIn: 0, sourceOut: 5 };
  trimLeft(clip, { timelineStart: 10, duration: 5 }, 2);
  assert.equal(clip.timelineStart, 12);
  assert.equal(clip.duration, 3);
  assert.equal(clip.timelineStart + clip.duration, 15);
});

test("renderer exposes duration editing but hides source trim points for images", () => {
  assert.match(source, /const isImage = !!\(media && media\.kind === "image"\)/);
  assert.match(source, /Фото можно растягивать за левый и правый край клипа/);
  assert.match(source, /isImage \? -Infinity : -origin\.sourceIn/);
  assert.match(source, /if \(isImage\) \{\s*applyStillImageLeftTrim\(clip, origin, dt\);/);
});
