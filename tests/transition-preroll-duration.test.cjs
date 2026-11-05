"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "src", "renderer", "index.html"), "utf8");
function extract(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `missing renderer source: ${startMarker}`);
  return html.slice(start, end);
}
const helpersSource = extract("function getTransitionPrerollInfo(clip, time) {", "\nfunction isCompatible(");
const renderStateSource = extract("function computeClipRenderState(clip, time) {", "\nfunction applyProjectCanvasSize()");

function loadPrerollSandbox(extra = {}) {
  const sandbox = {
    OVERLAP_TRANSITION_MODES: new Set(["fire-whirl", "crossfade", "wipe-left", "wipe-right", "wipe-up", "wipe-down", "slide-left", "slide-right", "slide-up", "slide-down", "zoom-in", "zoom-out", "iris", "diamond", "blur", "spin"]),
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    frameDur: () => 1 / 30,
    getSlideshowMotionState: () => ({ scale: 1, shiftX: 0, shiftY: 0 }),
    ...extra
  };
  vm.runInNewContext(helpersSource + "\n" + renderStateSource + `
globalThis.info = getTransitionPrerollInfo;
globalThis.sourceTime = getClipSourceTimeAtTimeline;
globalThis.virtualClip = makeTransitionPrerollRenderClip;
globalThis.compute = computeClipRenderState;`, sandbox);
  return sandbox;
}

test("pre-roll transition keeps the incoming clip start and end unchanged", () => {
  const sandbox = loadPrerollSandbox();
  const incoming = { id: "in", timelineStart: 3, duration: 3.033, sourceIn: 3, sourceOut: 6.033,
    transIn: { mode: "fire-whirl", duration: 0.667, placement: "pre-roll" } };
  const before = incoming.timelineStart + incoming.duration;
  assert.equal(incoming.timelineStart, 3);
  assert.ok(Math.abs(before - 6.033) < 1e-9);
  assert.equal(sandbox.info(incoming, 2.333).progress, 0);
  assert.ok(Math.abs(sandbox.info(incoming, 2.6665).progress - 0.5) < 1e-9);
  assert.equal(sandbox.info(incoming, 3), null, "at the edit point the normal incoming clip takes over");
  assert.equal(incoming.timelineStart + incoming.duration, before);
});

test("incoming source pre-roll reaches sourceIn exactly at the original edit point", () => {
  const sandbox = loadPrerollSandbox();
  const incoming = { timelineStart: 3, duration: 3.033, sourceIn: 3, sourceOut: 6.033,
    transIn: { mode: "fire-whirl", duration: 0.667, placement: "pre-roll" } };
  assert.ok(Math.abs(sandbox.sourceTime(incoming, 2.333) - 2.333) < 1e-6);
  assert.ok(Math.abs(sandbox.sourceTime(incoming, 2.6665) - 2.6665) < 1e-6);
  assert.ok(Math.abs(sandbox.sourceTime(incoming, 3) - 3) < 1e-6);
  assert.ok(Math.abs(sandbox.sourceTime(incoming, 6.0) - 6.0) < 1e-6);
});

test("pre-roll source mapping handles insufficient source headroom without running before zero", () => {
  const sandbox = loadPrerollSandbox();
  const incoming = { timelineStart: 2, duration: 2, sourceIn: 0.2, sourceOut: 2.2,
    transIn: { mode: "fire-whirl", duration: 0.6, placement: "pre-roll" } };
  assert.equal(sandbox.sourceTime(incoming, 1.4), 0);
  assert.ok(Math.abs(sandbox.sourceTime(incoming, 1.7) - 0.1) < 1e-6);
  assert.ok(Math.abs(sandbox.sourceTime(incoming, 2) - 0.2) < 1e-6);
});

test("render state activates incoming layer before cut and completes transition exactly at cut", () => {
  const sandbox = loadPrerollSandbox();
  const incoming = { id: "in", timelineStart: 3, duration: 3.033, fadeIn: 0, fadeOut: 0,
    transIn: { mode: "crossfade", duration: 0.667, placement: "pre-roll" }, transOut: null, motionPreset: "none" };
  const beginning = sandbox.compute(incoming, 2.333);
  const middle = sandbox.compute(incoming, 2.6665);
  const atCut = sandbox.compute(incoming, 3);
  assert.ok(beginning);
  assert.ok(middle);
  assert.ok(atCut);
  assert.ok(beginning.opacity < 0.01);
  assert.ok(middle.opacity > 0.1 && middle.opacity < 0.9);
  assert.equal(atCut.opacity, 1);
  assert.equal(sandbox.compute(incoming, 6.033), null, "there is no synthetic held frame after the actual clip end");
});

test("legacy transition migration restores the final video cut when audio end matches lost overlap", () => {
  const migrationSource = extract("function migrateLegacyTerminalOverlapTransitions() {", "\nfunction deserializeProject(");
  const previous = { id: "out", timelineStart: 0, duration: 3 };
  const incoming = { id: "in", timelineStart: 2.333, duration: 3.033, transIn: { mode: "fire-whirl", duration: 0.667 } };
  const sandbox = {
    project: { tracks: [
      { id: "V1", kind: "video", clips: [previous, incoming] },
      { id: "A1", kind: "audio", clips: [{ timelineStart: 0, duration: 6.033 }] }
    ] },
    OVERLAP_TRANSITION_MODES: new Set(["fire-whirl", "crossfade"]),
    frameDur: () => 1 / 30,
    roundToFrame: value => Math.round(value * 30) / 30,
    findPreviousClip(track, clip) {
      return track.clips.filter(candidate => candidate.id !== clip.id && candidate.timelineStart < clip.timelineStart + 1e-6)
        .sort((a, b) => (b.timelineStart + b.duration) - (a.timelineStart + a.duration))[0] || null;
    }
  };
  vm.runInNewContext(migrationSource + "\nglobalThis.migrate = migrateLegacyTerminalOverlapTransitions;", sandbox);
  assert.equal(sandbox.migrate(), 1);
  assert.ok(Math.abs(incoming.timelineStart - 3) < 1e-6);
  assert.equal(incoming.transIn.placement, "pre-roll");
  assert.ok(Math.abs(incoming.timelineStart + incoming.duration - 6.033) < 1e-6);
});

test("legacy migration does not shift clips when audio gap does not match transition duration", () => {
  const migrationSource = extract("function migrateLegacyTerminalOverlapTransitions() {", "\nfunction deserializeProject(");
  const previous = { id: "out", timelineStart: 0, duration: 3 };
  const incoming = { id: "in", timelineStart: 2.333, duration: 3.033, transIn: { mode: "fire-whirl", duration: 0.667 } };
  const sandbox = {
    project: { tracks: [
      { id: "V1", kind: "video", clips: [previous, incoming] },
      { id: "A1", kind: "audio", clips: [{ timelineStart: 0, duration: 6.5 }] }
    ] },
    OVERLAP_TRANSITION_MODES: new Set(["fire-whirl", "crossfade"]),
    frameDur: () => 1 / 30,
    roundToFrame: value => Math.round(value * 30) / 30,
    findPreviousClip(track, clip) { return previous; }
  };
  vm.runInNewContext(migrationSource + "\nglobalThis.migrate = migrateLegacyTerminalOverlapTransitions;", sandbox);
  assert.equal(sandbox.migrate(), 0);
  assert.equal(incoming.timelineStart, 2.333);
  assert.equal(incoming.transIn.placement, undefined);
});

test("frame-accurate preview and export use the same pre-roll source-time mapper", () => {
  assert.match(html, /function syncClipVideo\([\s\S]*?getClipSourceTimeAtTimeline\(clip, time\)/);
  assert.match(html, /async prepareFrameAccurateVideoSources\([\s\S]*?getClipSourceTimeAtTimeline\(clip, timelineTime\)/);
  assert.match(html, /async frameAccurateSourcesAtTime\([\s\S]*?getClipSourceTimeAtTimeline\(clip, timelineTime\)/);
  assert.match(html, /async seekVideoElementsAtTime\([\s\S]*?getClipSourceTimeAtTimeline\(clip, timelineTime\)/);
  assert.match(html, /const expected = getClipSourceTimeAtTimeline\(clip, timelineTime\)/);
  assert.match(html, /const audioActive = !track\.hidden && timelineTime >= clip\.timelineStart/,
    "video pre-roll must not start embedded clip audio before the actual cut");
});

test("new overlap transitions no longer move the incoming clip left", () => {
  const source = extract("function applyOverlapTransitionWithPrevious(mode, label) {", "\nfunction applyAudioCrossfadeWithPrevious()");
  assert.match(source, /incoming\.transIn = \{ duration, mode, placement: "pre-roll" \}/);
  assert.doesNotMatch(source, /incoming\.timelineStart = newStart/);
  assert.match(html, /function projectDuration\(\)[\s\S]*?max = Math\.max\(max, clip\.timelineStart \+ clip\.duration\)/);
});

test("timeline marker shows the pre-roll transition on the outgoing clip tail, not the incoming clip start", () => {
  const buildClip = extract("function buildClipElement(clip, track) {", "\nfunction ");
  assert.match(buildClip, /nextVideoClip\.transIn\.placement === "pre-roll"/);
  assert.match(buildClip, /class="clip-transition-marker out"/);
  assert.match(buildClip, /style="right:0;width:/);
  assert.match(buildClip, /clip\.transIn\.placement !== "pre-roll"/);
});

test("pre-roll transitions preserve true sequence duration and do not add a held frame", () => {
  assert.match(html, /function projectDuration\(\)[\s\S]*?clip\.timelineStart \+ clip\.duration/);
  assert.match(renderStateSource, /const end = clip\.timelineStart \+ clip\.duration/);
  assert.match(renderStateSource, /time >= end - 1e-7\) return null/);
  assert.doesNotMatch(renderStateSource, /holdLastFrame|freezeLastFrame|syntheticEndFrame/);
});

test("legacy overlap repair is part of normal project deserialization", () => {
  const deserialize = extract("function deserializeProject(json) {", "\n/* Object URLs");
  assert.match(deserialize, /migrateLegacyTerminalOverlapTransitions\(\);/);
});
