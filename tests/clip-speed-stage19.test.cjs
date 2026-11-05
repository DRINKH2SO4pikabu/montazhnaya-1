"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "src", "renderer", "index.html"), "utf8");
function extract(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `missing source: ${startMarker}`);
  return source.slice(start, end);
}
const timelineTimeHelpers = extract(html, "function getTransitionPrerollInfo(clip, time) {", "\nfunction isCompatible(");

function loadTimelineHelpers() {
  const sandbox = {
    OVERLAP_TRANSITION_MODES: new Set(["fire-whirl", "crossfade", "wipe-left", "wipe-right", "wipe-up", "wipe-down", "slide-left", "slide-right", "slide-up", "slide-down", "zoom-in", "zoom-out", "iris", "diamond", "blur", "spin"]),
    clamp: (value, min, max) => Math.max(min, Math.min(max, value))
  };
  vm.runInNewContext(timelineTimeHelpers + `\nglobalThis.speed = getClipSpeed;\nglobalThis.sourceTime = getClipSourceTimeAtTimeline;\nglobalThis.sourceDuration = getClipSourceDuration;\nglobalThis.prerollClip = makeTransitionPrerollRenderClip;`, sandbox);
  return sandbox;
}

test("clip speed maps timeline time to source time in source-clock seconds", () => {
  const h = loadTimelineHelpers();
  const clip = { timelineStart: 4, duration: 4, sourceIn: 10, sourceOut: 14, speed: 1 };
  assert.equal(h.speed(clip), 1);
  assert.equal(h.sourceDuration(clip), 4);
  assert.equal(h.sourceTime(clip, 6), 12);
  clip.speed = 2;
  clip.duration = 2;
  assert.equal(h.sourceTime(clip, 5), 12);
  assert.equal(h.sourceTime(clip, 6), 14);
  clip.speed = 0.5;
  clip.duration = 8;
  assert.equal(h.sourceTime(clip, 6), 11);
  assert.equal(h.sourceTime(clip, 12), 14, "source time clamps at sourceOut");
});

test("clip speed is clamped to the supported 0.25×–4× range and defaults to 1×", () => {
  const h = loadTimelineHelpers();
  assert.equal(h.speed({}), 1);
  assert.equal(h.speed({ speed: 0 }), 1);
  assert.equal(h.speed({ speed: -2 }), 1);
  assert.equal(h.speed({ speed: 0.1 }), 0.25);
  assert.equal(h.speed({ speed: 6 }), 4);
});

test("pre-roll transition uses source headroom scaled by clip speed", () => {
  const h = loadTimelineHelpers();
  const clip = { timelineStart: 5, duration: 3, sourceIn: 10, sourceOut: 16, speed: 2,
    transIn: { mode: "fire-whirl", duration: 1, placement: "pre-roll" } };
  const start = h.prerollClip(clip);
  assert.equal(start.timelineStart, 4);
  assert.equal(start.duration, 4);
  assert.equal(start.sourceIn, 8);
  assert.equal(start.sourceOut, 16);
  assert.equal(h.sourceTime(clip, 4), 8);
  assert.equal(h.sourceTime(clip, 5), 10);
});

test("speed changes duration without changing the selected source in/out range", () => {
  const fn = extract(html, "function setSelectedVideoClipSpeed(value) {", "\nfunction updateTransportUI()");
  const video = { id: "v", mediaId: "m", trackId: "V1", timelineStart: 2, duration: 4, sourceIn: 5, sourceOut: 9, speed: 1, fadeIn: 0, fadeOut: 0, transIn: null, transOut: null };
  const audio = { id: "a", mediaId: "m", trackId: "A1", timelineStart: 2, duration: 4, sourceIn: 5, sourceOut: 9, speed: 1, audioOnlyFromVideo: true, avLinkEnabled: true, avLinkId: "pair", fadeIn: 0, fadeOut: 0, transIn: null, transOut: null };
  video.avLinkEnabled = true; video.avLinkId = "pair";
  const tracks = [{ id: "V1", kind: "video", locked: false, clips: [video] }, { id: "A1", kind: "audio", locked: false, clips: [audio] }];
  const messages = [];
  const sandbox = {
    AppState: { selection: { type: "clip", id: "v" } },
    getClipById: id => tracks.flatMap(t => t.clips).find(c => c.id === id),
    getTrack: id => tracks.find(t => t.id === id),
    getMedia: id => id === "m" ? { id: "m", kind: "video" } : null,
    findLinkedAVPartner: clip => clip.avLinkId === "pair" ? tracks.flatMap(t => t.clips).find(c => c.id !== clip.id && c.avLinkId === "pair") : null,
    getClipSpeed: clip => Number.isFinite(Number(clip.speed)) && Number(clip.speed) > 0 ? Math.max(0.25, Math.min(4, Number(clip.speed))) : 1,
    getClipSourceDuration: clip => Number(clip.sourceOut) - Number(clip.sourceIn),
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    roundToFrame: value => Math.round(value * 30) / 30,
    MIN_CLIP_DURATION: 1 / 30,
    overlapsOnTrack: () => false,
    pause: () => { sandbox.paused = true; },
    History: { record: () => { sandbox.recorded = true; } },
    refreshAfterTimelineEdit: () => { sandbox.refreshed = true; },
    updateTransportUI: () => { sandbox.updated = true; },
    toastKey: (key) => messages.push(key)
  };
  vm.runInNewContext(fn + "\nglobalThis.applySpeed = setSelectedVideoClipSpeed;", sandbox);
  assert.equal(sandbox.applySpeed(2), true);
  assert.equal(video.speed, 2);
  assert.equal(video.duration, 2);
  assert.equal(video.sourceIn, 5);
  assert.equal(video.sourceOut, 9);
  assert.equal(audio.speed, 2, "linked audio follows the video speed");
  assert.equal(audio.duration, 2);
  assert.equal(audio.sourceIn, 5);
  assert.equal(audio.sourceOut, 9);
  assert.equal(sandbox.paused, true);
  assert.equal(sandbox.recorded, true);
  assert.equal(sandbox.refreshed, true);
  assert.deepEqual(messages, []);
});

test("speed change is rejected if the new duration overlaps another clip", () => {
  const fn = extract(html, "function setSelectedVideoClipSpeed(value) {", "\nfunction updateTransportUI()");
  const video = { id: "v", mediaId: "m", trackId: "V1", timelineStart: 2, duration: 4, sourceIn: 0, sourceOut: 4, speed: 1 };
  const track = { id: "V1", kind: "video", locked: false, clips: [video] };
  let toast = "";
  const sandbox = {
    AppState: { selection: { type: "clip", id: "v" } }, getClipById: () => video, getTrack: () => track,
    getMedia: () => ({ id: "m", kind: "video" }), findLinkedAVPartner: () => null,
    getClipSpeed: c => Number(c.speed) || 1, getClipSourceDuration: c => c.sourceOut - c.sourceIn,
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)), roundToFrame: v => Math.round(v * 30) / 30,
    MIN_CLIP_DURATION: 1 / 30, overlapsOnTrack: () => true,
    updateTransportUI() {}, toastKey: key => { toast = key; }, pause() { throw new Error("must not pause"); }, History: { record() { throw new Error("must not record"); } }, refreshAfterTimelineEdit() {}
  };
  vm.runInNewContext(fn + "\nglobalThis.applySpeed = setSelectedVideoClipSpeed;", sandbox);
  assert.equal(sandbox.applySpeed(0.5), false);
  assert.equal(video.speed, 1);
  assert.equal(video.duration, 4);
  assert.equal(toast, "notification.clip.speedWouldOverlap");
});

test("Split button is only in the lower timeline toolbar and sits next to speed control", () => {
  const topToolbar = extract(html, '<div class="toolbar">', '<button class="tbtn danger" data-action="delete" id="btnDelete"');
  const timeline = extract(html, '<section id="timelinePanel">', '<div class="tl-scroll"');
  assert.doesNotMatch(topToolbar, /id="btnSplit"|data-action="split"/);
  assert.match(timeline, /id=\"btnSplit\"/);
  assert.match(timeline, /id=\"clipSpeedSelect\"/);
  assert.ok(timeline.indexOf('id="btnSplit"') < timeline.indexOf('id="clipSpeedSelect"'));
  assert.match(timeline, /0\.25×|0,25×/);
  assert.match(timeline, /4×/);
});

test("speed selection is enabled only for an unlocked selected video clip", () => {
  const update = extract(html, "function updateTransportUI() {", "\nfunction updateTimeDisplay()");
  assert.match(update, /selectedTrack\.kind === "video"/);
  assert.match(update, /selectedMedia\.kind === "video"/);
  assert.match(update, /!selectedTrack\.locked/);
  assert.match(update, /speedSelect\.disabled = !canChangeClipSpeed/);
  assert.match(update, /uiT\("clip\.speed\.label"\)/);
  assert.match(html, /clipSpeedSelect\.addEventListener\("change", \(\) => setSelectedVideoClipSpeed\(clipSpeedSelect\.value\)\)/);
});

test("preview, audio preview and frame-accurate export all use clip speed", () => {
  assert.match(html, /function syncClipVideo\([\s\S]*?el\.playbackRate = getClipSpeed\(clip\)/);
  assert.match(html, /syncVideoClip\(clip, media, track, time, videoEl\)[\s\S]*?videoEl\.playbackRate = getClipSpeed\(clip\)/);
  assert.match(html, /syncClip\(clip, media, time, playing\)[\s\S]*?el\.playbackRate = getClipSpeed\(clip\)/);
  assert.match(html, /const target = clamp\(getClipSourceTimeAtTimeline\(clip, timelineTime\)/);
  assert.match(html, /const source = offline\.createBufferSource\(\);[\s\S]*?source\.playbackRate\.value = rate/);
  assert.match(html, /const source = audioCtx\.createBufferSource\(\);[\s\S]*?source\.playbackRate\.value = rate/);
});

test("project serialization, loading, clipboard and validation preserve speed", () => {
  assert.match(html, /sourceIn: c\.sourceIn, sourceOut: c\.sourceOut, speed: getClipSpeed\(c\)/);
  assert.match(html, /const speed = isFinite\(c\.speed\).*?clamp\(Number\(c\.speed\), 0\.25, 4\)/);
  assert.match(html, /speed,\s*volume: isFinite\(c\.volume\)/);
  assert.match(html, /speed: getClipSpeed\(source\)/);
  assert.match(html, /expectedSourceSpan = clip\.duration \* getClipSpeed\(clip\)/);
});

test("speed label and tooltip are supplied for all 36 selectable interface locales", () => {
  const source = fs.readFileSync(path.join(root, "src", "renderer", "locales", "semantic.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const catalog = context.window.MontazhnayaSemanticCatalog;
  assert.equal(Object.keys(catalog).length, 36);
  for (const [code, locale] of Object.entries(catalog)) {
    assert.ok(locale.messages["clip.speed.label"], `${code} is missing the speed label`);
    assert.ok(locale.messages["clip.speed.tooltip"], `${code} is missing the speed tooltip`);
  }
});
