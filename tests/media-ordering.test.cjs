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


function loadTimelineDropHarness(trackKind, assets) {
  const sortHelper = section("function sortMediaByFilename(items) {", "\nfunction isNumberedMediaName");
  const compatibilityHelper = section("function isCompatible(mediaKind, trackKind) {", "\nfunction isClipCompatible");
  const placementFunction = section(
    "async function importAndPlaceFilesOnTrack(files, track, startTime) {",
    "\nfunction bindTimelineDelegation()"
  );
  const track = { id: trackKind === "audio" ? "A1" : "V1", kind: trackKind, label: trackKind, locked: false, clips: [] };
  const messages = [];
  const sandbox = {
    importFiles: async files => files,
    getTrack: id => id === track.id ? track : null,
    getMedia: id => assets.find(media => media.id === id) || null,
    roundToFrame: value => Math.round(value * 30) / 30,
    detectEmbeddedAudio: async () => false,
    addClipFromMedia: (mediaId, trackId, startTime) => {
      const media = assets.find(item => item.id === mediaId);
      const clip = {
        id: "clip-" + mediaId,
        mediaId,
        trackId,
        timelineStart: Math.round(startTime * 30) / 30,
        duration: media.duration
      };
      track.clips.push(clip);
      return clip;
    },
    toastKey: (key, params, level) => messages.push({ key, params, level }),
    uiText: value => value,
    uiCount: (_kind, count) => String(count)
  };
  vm.createContext(sandbox);
  vm.runInContext(
    [sortHelper, compatibilityHelper, placementFunction, "this.placeFiles = importAndPlaceFilesOnTrack;"].join("\n"),
    sandbox,
    { filename: "timeline-drop-ordering-test.js" }
  );
  return { track, messages, placeFiles: (files, startTime) => sandbox.placeFiles(files, track, startTime) };
}

test("external files dropped on a video lane are naturally ordered and incompatible audio is skipped", async () => {
  const assets = [
    { id: "v10", name: "take_10.mp4", kind: "video", duration: 4, missing: false },
    { id: "a3", name: "voice_03.mp3", kind: "audio", duration: 8, missing: false },
    { id: "i2", name: "take_2.jpg", kind: "image", duration: 3, missing: false },
    { id: "v1", name: "take_1.mp4", kind: "video", duration: 2, missing: false }
  ];
  const harness = loadTimelineDropHarness("video", assets);

  await harness.placeFiles(assets, 7);

  assert.deepEqual(
    harness.track.clips.map(clip => assets.find(media => media.id === clip.mediaId).name),
    ["take_1.mp4", "take_2.jpg", "take_10.mp4"]
  );
  assert.deepEqual(harness.track.clips.map(clip => clip.timelineStart), [7, 9, 12]);
  assert.equal(harness.messages.at(-1).key, "notification.media.addedWithSkipped");
});

test("external files dropped on an audio lane retain only audio and use natural numeric ordering", async () => {
  const assets = [
    { id: "a10", name: "voice_10.mp3", kind: "audio", duration: 5, missing: false },
    { id: "v2", name: "scene_2.mp4", kind: "video", duration: 6, missing: false },
    { id: "a2", name: "voice_2.mp3", kind: "audio", duration: 3, missing: false },
    { id: "a1", name: "voice_1.mp3", kind: "audio", duration: 2, missing: false }
  ];
  const harness = loadTimelineDropHarness("audio", assets);

  await harness.placeFiles(assets, 1.5);

  assert.deepEqual(
    harness.track.clips.map(clip => assets.find(media => media.id === clip.mediaId).name),
    ["voice_1.mp3", "voice_2.mp3", "voice_10.mp3"]
  );
  assert.deepEqual(harness.track.clips.map(clip => clip.timelineStart), [1.5, 3.5, 6.5]);
  assert.equal(harness.messages.at(-1).key, "notification.media.addedWithSkipped");
});
