"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rendererHtml = fs.readFileSync(path.join(__dirname, "..", "src", "renderer", "index.html"), "utf8");

function extractBetween(startMarker, endMarker) {
  const start = rendererHtml.indexOf(startMarker);
  const end = rendererHtml.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `cannot extract ${startMarker}`);
  return rendererHtml.slice(start, end);
}

function loadTolerance(fps) {
  const source = extractBetween("function getPausedMediaSeekTolerance() {", "\nfunction ");
  const sandbox = {
    project: { fps }, DEFAULT_FPS: 30,
    clamp(value, min, max) { return Math.min(max, Math.max(min, value)); },
    Number, Math
  };
  vm.runInNewContext(source + "\nglobalThis.getPausedMediaSeekTolerance = getPausedMediaSeekTolerance;", sandbox);
  return sandbox.getPausedMediaSeekTolerance();
}

function loadSyncClipVideo() {
  const source = extractBetween("function syncClipVideo(clip, media, time, playing) {", "\nfunction syncAudioFallback");
  const assignments = [];
  let currentTime = 1;
  const video = {
    paused: true,
    get currentTime() { return currentTime; },
    set currentTime(value) { assignments.push(value); currentTime = value; },
    pause() { this.paused = true; },
    play() { this.paused = false; return Promise.resolve(); }
  };
  const sandbox = {
    Preview: { getClipVideo() { return video; } },
    project: { fps: 60 },
    getPausedMediaSeekTolerance: () => loadTolerance(sandbox.project.fps),
    getTransitionPrerollInfo: () => null,
    getClipSourceTimeAtTimeline(clip, time) {
      return Math.max(Number(clip.sourceIn) || 0, (Number(clip.sourceIn) || 0) + Math.max(0, time - Number(clip.timelineStart || 0)));
    },
    clamp(value, min, max) { return Math.min(max, Math.max(min, value)); },
    Number, Math, isFinite
  };
  vm.runInNewContext(source + "\nglobalThis.syncClipVideo = syncClipVideo;", sandbox);
  return { sync: sandbox.syncClipVideo, video, assignments, get currentTime() { return currentTime; }, setFps(fps) { sandbox.project.fps = fps; } };
}

test("paused media seek tolerance stays below one quarter of a project frame", () => {
  assert.equal(loadTolerance(24), 0.01);
  assert.equal(loadTolerance(25), 0.01);
  assert.ok(Math.abs(loadTolerance(30) - (1 / 120)) < 1e-12);
  assert.ok(Math.abs(loadTolerance(60) - (1 / 240)) < 1e-12);
  assert.ok(Math.abs(loadTolerance(120) - (0.25 / 120)) < 1e-12, "120 FPS remains frame-relative");
});

test("paused 60 FPS video preview seeks to the immediately following frame", () => {
  const fixture = loadSyncClipVideo();
  const clip = { sourceIn: 0, sourceOut: 10, timelineStart: 0, duration: 10 };
  const media = { duration: 10 };
  fixture.sync(clip, media, 1 + 1 / 60, false);
  assert.equal(fixture.assignments.length, 1, "the next 60 FPS frame must not be skipped by a 30–50 ms fixed threshold");
  assert.ok(Math.abs(fixture.currentTime - (1 + 1 / 60)) < 1e-9);
});

test("paused preview avoids redundant seeks when the current time is already within the frame tolerance", () => {
  const fixture = loadSyncClipVideo();
  const clip = { sourceIn: 0, sourceOut: 10, timelineStart: 0, duration: 10 };
  const media = { duration: 10 };
  fixture.sync(clip, media, 1 + 0.001, false);
  assert.equal(fixture.assignments.length, 0, "a sub-tolerance nudge must not trigger a decoder seek");
});

test("video and both audio preview paths use the shared frame-relative paused seek tolerance", () => {
  assert.match(rendererHtml, /function syncClipVideo[\s\S]*?getPausedMediaSeekTolerance\(\)/);
  assert.match(rendererHtml, /syncClip\(clip, media, time, playing\)[\s\S]*?getPausedMediaSeekTolerance\(\)/);
  assert.match(rendererHtml, /function syncAudioFallback[\s\S]*?getPausedMediaSeekTolerance\(\)/);
  assert.doesNotMatch(rendererHtml, /Math\.abs\(el\.currentTime - target\) > 0\.(?:03|05)\)/);
});
