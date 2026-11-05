"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "renderer", "index.html"), "utf8");

function loadHelper(name, globals = {}) {
  const match = source.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
  assert.ok(match, `${name} should be defined in renderer`);
  const sandbox = { ...globals };
  vm.runInNewContext(`${match[0]}\nthis.helper = ${name};`, sandbox);
  return sandbox.helper;
}

test("sorts numbered files by numeric value instead of lexicographic order", () => {
  const sortMediaByFilename = loadHelper("sortMediaByFilename");
  const sorted = sortMediaByFilename(["10.jpg", "2.jpg", "1.jpg", "11.jpg", "3.jpg"]);
  assert.deepEqual(Array.from(sorted), ["1.jpg", "2.jpg", "3.jpg", "10.jpg", "11.jpg"]);
});

test("supports zero-padded numbering and numbers embedded in filenames", () => {
  const sortMediaByFilename = loadHelper("sortMediaByFilename");
  const zeroPadded = sortMediaByFilename(["003.png", "001.png", "002.png"]);
  assert.deepEqual(Array.from(zeroPadded), ["001.png", "002.png", "003.png"]);
  const embedded = sortMediaByFilename(["scene_10.mp4", "scene_2.mp4", "scene_1.mp4"]);
  assert.deepEqual(Array.from(embedded), ["scene_1.mp4", "scene_2.mp4", "scene_10.mp4"]);
});

test("detects numeric tokens in the filename stem but ignores digits only in the extension", () => {
  const isNumberedMediaName = loadHelper("isNumberedMediaName");
  assert.equal(isNumberedMediaName("001.jpg"), true);
  assert.equal(isNumberedMediaName("scene_12_final.mp4"), true);
  assert.equal(isNumberedMediaName("photo-final.jpg"), false);
  assert.equal(isNumberedMediaName("image.png7"), false);
  assert.equal(isNumberedMediaName("image7.png"), true);
});


test("finds a free contiguous segment after colliding with existing timeline clips", () => {
  const findFreeSequenceStart = loadHelper("findFreeSequenceStart", {
    roundToFrame: value => Math.round(value * 30) / 30,
    frameDur: () => 1 / 30
  });
  const track = { clips: [
    { timelineStart: 5, duration: 10 },
    { timelineStart: 20, duration: 3 }
  ] };
  assert.equal(findFreeSequenceStart(track, 0, 8), 23);
  assert.equal(findFreeSequenceStart(track, 30, 8), 30);
});

test("the media panel exposes numbered arrangement and timeline lanes handle external file drops", () => {
  assert.match(source, /data-action="arrange-numbered"/);
  assert.match(source, /case "arrange-numbered": openNumberedSequenceDialog\(\)/);
  assert.match(source, /const carriesFiles = Array\.from\(ev\.dataTransfer && ev\.dataTransfer\.types \|\| \[\]\)\.includes\("Files"\)/);
  assert.match(source, /const droppedFiles = Array\.from\(ev\.dataTransfer && ev\.dataTransfer\.files \|\| \[\]\)/);
  assert.match(source, /await importAndPlaceFilesOnTrack\(droppedFiles, track, time\)/);
});
