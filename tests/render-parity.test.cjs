"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const rendererPath = path.join(__dirname, "..", "src", "renderer", "index.html");
const rendererHtml = fs.readFileSync(rendererPath, "utf8");

function extractBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `unable to extract ${startMarker}`);
  return source.slice(start, end);
}

function loadRenderStateEvaluator() {
  const source = extractBetween(
    rendererHtml,
    "function computeClipRenderState(clip, time) {",
    "\nfunction applyProjectCanvasSize()"
  );
  const sandbox = {
    clamp(value, min, max) { return Math.max(min, Math.min(max, value)); },
    getTransitionPrerollInfo() { return null; },
    frameDur() { return 1 / 30; },
    getSlideshowMotionState(preset, progress) {
      const p = Math.max(0, Math.min(1, progress));
      if (preset === "zoom-in") return { scale: 1 + 0.1 * p, shiftX: 0, shiftY: 0 };
      if (preset === "zoom-out") return { scale: 1.1 - 0.1 * p, shiftX: 0, shiftY: 0 };
      if (preset === "pan-left") return { scale: 1.08, shiftX: 0.04 - 0.08 * p, shiftY: 0 };
      if (preset === "pan-right") return { scale: 1.08, shiftX: -0.04 + 0.08 * p, shiftY: 0 };
      if (preset === "pan-up") return { scale: 1.08, shiftX: 0, shiftY: 0.04 - 0.08 * p };
      if (preset === "pan-down") return { scale: 1.08, shiftX: 0, shiftY: -0.04 + 0.08 * p };
      return { scale: 1, shiftX: 0, shiftY: 0 };
    }
  };
  vm.runInNewContext(source + "\nglobalThis.computeClipRenderState = computeClipRenderState;", sandbox);
  return sandbox.computeClipRenderState;
}

test("the 21 registered transitions all produce finite render states at their midpoint", () => {
  const catalogStart = rendererHtml.indexOf("const TRANSITION_CATALOG = [");
  const catalogEnd = rendererHtml.indexOf("\n];", catalogStart);
  assert.ok(catalogStart >= 0 && catalogEnd > catalogStart);
  const modes = [...rendererHtml.slice(catalogStart, catalogEnd).matchAll(/\{\s*mode:\s*[\"']([^\"']+)[\"']/g)]
    .map(match => match[1]);
  assert.equal(modes.length, 21);

  const compute = loadRenderStateEvaluator();
  for (const mode of modes) {
    const state = compute({
      id: `incoming-${mode}`,
      timelineStart: 0,
      duration: 3,
      fadeIn: 0,
      fadeOut: 0,
      transIn: { mode, duration: 1 },
      transOut: null,
      motionPreset: "none"
    }, 0.5);
    assert.ok(state, `${mode}: clip should be active`);
    for (const [key, value] of Object.entries(state)) {
      if (typeof value === "number") assert.ok(Number.isFinite(value), `${mode}: ${key} must be finite`);
    }
    assert.ok(state.opacity >= 0 && state.opacity <= 1, `${mode}: opacity must be clamped`);
  }
});

test("wipe, iris, diamond, slide, zoom, blur and spin transitions expose the expected render state", () => {
  const compute = loadRenderStateEvaluator();
  const stateFor = mode => compute({
    id: mode, timelineStart: 0, duration: 3, fadeIn: 0, fadeOut: 0,
    transIn: { mode, duration: 1 }, transOut: null, motionPreset: "none"
  }, 0.5);

  assert.ok(stateFor("wipe-left").clipRect.w > 0 && stateFor("wipe-left").clipRect.w < 1);
  assert.equal(stateFor("wipe-diagonal").clipMask.type, "diagonal");
  assert.equal(stateFor("iris").clipMask.type, "circle");
  assert.equal(stateFor("diamond").clipMask.type, "diamond");
  assert.notEqual(stateFor("slide-left").transitionShiftX, 0);
  assert.notEqual(stateFor("zoom-in").transitionScale, 1);
  assert.ok(stateFor("blur").transitionBlur > 0);
  assert.notEqual(stateFor("spin").transitionRotation, 0);
});

test("simultaneous entrance and exit masks on short clips are accumulated instead of overwriting each other", () => {
  const compute = loadRenderStateEvaluator();
  const state = compute({
    id: "short-overlap",
    timelineStart: 0,
    duration: 3,
    fadeIn: 0,
    fadeOut: 0,
    transIn: { mode: "iris", duration: 2 },
    transOut: { mode: "diamond", duration: 2 },
    motionPreset: "none"
  }, 1.5);
  assert.equal(state.clipMasks.length, 2);
  assert.deepEqual(Array.from(state.clipMasks, mask => mask.type), ["circle", "diamond"]);
  assert.ok(state.clipMasks.every(mask => Number.isFinite(mask.progress) && mask.progress > 0 && mask.progress < 1));
});

test("all transition directions and transform effects remain deterministic at their start, midpoint and end", () => {
  const compute = loadRenderStateEvaluator();
  const modes = [
    "opacity", "black", "white", "flash-white", "crossfade", "wipe-left", "wipe-right", "wipe-up", "wipe-down", "wipe-diagonal",
    "slide-left", "slide-right", "slide-up", "slide-down", "zoom-in", "zoom-out", "iris", "diamond", "blur", "spin"
  ];
  for (const mode of modes) {
    const at = progress => compute({
      id: mode, timelineStart: 0, duration: 3, fadeIn: 0, fadeOut: 0,
      transIn: { mode, duration: 1 }, transOut: null, motionPreset: "none"
    }, progress);
    const start = at(0), middle = at(0.5), end = at(1.001);
    assert.ok(start && middle && end, `${mode}: transition states should exist across its interval`);
    for (const state of [start, middle, end]) {
      assert.ok(Number.isFinite(state.opacity) && state.opacity >= 0 && state.opacity <= 1, `${mode}: finite opacity`);
      assert.ok(Number.isFinite(state.transitionScale) && state.transitionScale > 0, `${mode}: finite scale`);
      assert.ok(Number.isFinite(state.transitionRotation), `${mode}: finite rotation`);
      assert.ok(Number.isFinite(state.transitionShiftX) && Number.isFinite(state.transitionShiftY), `${mode}: finite position`);
      assert.ok(Number.isFinite(state.transitionBlur), `${mode}: finite blur`);
    }
  }
});

test("slide directions, zoom, spin and blur have correct incoming and outgoing endpoints", () => {
  const compute = loadRenderStateEvaluator();
  const incoming = (mode, t) => compute({
    id: mode, timelineStart: 0, duration: 3, fadeIn: 0, fadeOut: 0,
    transIn: { mode, duration: 1 }, transOut: null, motionPreset: "none"
  }, t);
  const outgoing = (mode, t) => compute({
    id: mode, timelineStart: 0, duration: 3, fadeIn: 0, fadeOut: 0,
    transIn: null, transOut: { mode, duration: 1 }, motionPreset: "none"
  }, t);
  const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-3,
    `${label}: expected ${expected}, got ${actual}`);

  for (const [mode, axis, inSign, outSign] of [
    ["slide-left", "transitionShiftX", 1, -1],
    ["slide-right", "transitionShiftX", -1, 1],
    ["slide-up", "transitionShiftY", 1, -1],
    ["slide-down", "transitionShiftY", -1, 1]
  ]) {
    near(incoming(mode, 0)[axis], inSign, `${mode} incoming start`);
    near(incoming(mode, 0.5)[axis], inSign * 0.5, `${mode} incoming midpoint`);
    near(incoming(mode, 1.001)[axis], 0, `${mode} incoming settled`);
    near(outgoing(mode, 2)[axis], 0, `${mode} outgoing start`);
    near(outgoing(mode, 2.5)[axis], outSign * 0.5, `${mode} outgoing midpoint`);
    near(outgoing(mode, 2.999)[axis], outSign, `${mode} outgoing end`);
  }

  near(incoming("zoom-in", 0).transitionScale, 0.72, "zoom-in start");
  near(incoming("zoom-in", 1.001).transitionScale, 1, "zoom-in settled");
  near(incoming("zoom-out", 0).transitionScale, 1.25, "zoom-out start");
  near(incoming("zoom-out", 1.001).transitionScale, 1, "zoom-out settled");
  near(incoming("spin", 0).transitionRotation, -180, "spin incoming start");
  near(incoming("spin", 1.001).transitionRotation, 0, "spin incoming settled");
  near(outgoing("spin", 2.999).transitionRotation, 180, "spin outgoing end");
  near(incoming("blur", 0).transitionBlur, 18, "blur incoming start");
  near(incoming("blur", 1.001).transitionBlur, 0, "blur incoming settled");
  near(outgoing("blur", 2.999).transitionBlur, 18, "blur outgoing end");
});

test("black and white sequence overlays are composited independently", () => {
  const render = extractBetween(
    rendererHtml,
    "// Black and white transitions are sequence-level overlays",
    "// Composition guides are editor-only overlays"
  );
  assert.match(render, /ctx\.fillStyle = "#000";[\s\S]*?ctx\.fillRect\(0, 0, canvas\.width, canvas\.height\);[\s\S]*?ctx\.fillStyle = "#fff9ee";/);
  assert.doesNotMatch(render, /const useWhite = whiteOverlay > blackOverlay/);
});

test("title design scale preserves authored size across preview, 1080p and 4K canvases", () => {
  const source = extractBetween(
    rendererHtml,
    "function getCanvasDesignScale(canvas) {",
    "\nfunction drawTitleOverlay(ctx, canvas, clip)"
  );
  const sandbox = { project: { width: 1280, height: 720 } };
  vm.runInNewContext(source + "\nglobalThis.getCanvasDesignScale = getCanvasDesignScale;", sandbox);
  const scale = sandbox.getCanvasDesignScale;
  assert.equal(scale({ width: 1280, height: 720 }), 1);
  assert.equal(scale({ width: 1920, height: 1080 }), 1.5);
  assert.equal(scale({ width: 3840, height: 2160 }), 3);
  assert.equal(scale({ width: 640, height: 360 }), 0.5);
  assert.equal(scale({ width: 0, height: 360 }), 1, "invalid canvases must use a safe scale");
});

test("title typography uses project-resolution scaling rather than fixed export pixels", () => {
  const title = extractBetween(
    rendererHtml,
    "function drawTitleOverlay(ctx, canvas, clip) {",
    "\nfunction drawClipFrame(ctx, canvas, media, clip, opacity"
  );
  assert.match(title, /clamp\(Number\(clip\.titleFontSize\)\s*\|\|\s*48,\s*12,\s*160\)\s*\*\s*getCanvasDesignScale\(canvas\)/);
  assert.match(title, /const lineHeight = Math\.round\(fontSize \* 1\.22\)/);
  assert.match(title, /const padX = Math\.max\(12, Math\.round\(fontSize \* 0\.32\)\)/);
});

test("clip titles inherit slide offset, transition zoom and spin rotation", () => {
  const draw = extractBetween(
    rendererHtml,
    "function drawClipFrame(ctx, canvas, media, clip, opacity",
    "\nfunction syncClipVideo(clip, media, time, playing)"
  );
  assert.match(draw, /const titleScale = transitionState[\s\S]*?transitionState\.transitionScale/);
  assert.match(draw, /const titleRotation = transitionState[\s\S]*?transitionState\.transitionRotation/);
  assert.match(draw, /ctx\.translate\(centerX, centerY\);\s*ctx\.rotate\(titleRotation \* Math\.PI \/ 180\);\s*ctx\.scale\(titleScale, titleScale\);/);
  assert.match(draw, /drawTitleOverlay\(ctx, canvas, clip\)/);
  assert.match(draw, /const shiftX = \(transitionState[\s\S]*?ctx\.translate\(shiftX, shiftY\)/);
});

test("preview and local export use the same compositor, sRGB contexts and smoothing quality", () => {
  assert.match(rendererHtml, /this\.canvas\.getContext\("2d",\s*\{\s*alpha:\s*false,\s*colorSpace:\s*"srgb"\s*\}\)/);
  assert.match(rendererHtml, /exportCanvas\.getContext\("2d",\s*\{\s*alpha:\s*false,\s*colorSpace:\s*"srgb"\s*\}\)/);
  assert.match(rendererHtml, /this\.ctx\.imageSmoothingEnabled\s*=\s*true/);
  assert.match(rendererHtml, /exportCtx\.imageSmoothingEnabled\s*=\s*true/);
  assert.match(rendererHtml, /this\.ctx\.imageSmoothingQuality\s*=\s*"high"/);
  assert.match(rendererHtml, /exportCtx\.imageSmoothingQuality\s*=\s*"high"/);
  assert.match(rendererHtml, /renderSequenceAtTime\(AppState\.playhead\)/);
  assert.match(rendererHtml, /renderSequenceAtTime\(timelineTime, this\.state\.ctx, this\.state\.canvas, frameSources\)/);
  assert.match(rendererHtml, /Composition guides are editor-only overlays and must never burn into export/);
});

test("the current mask scope is explicitly limited to transition masks, not arbitrary user masks", () => {
  const propsStart = rendererHtml.indexOf("<div class=\"prop-group\"><div class=\"prop-title\">Изображение</div>");
  const propsEnd = rendererHtml.indexOf("<div class=\"prop-group\"><div class=\"prop-title\">Цветокоррекция</div>", propsStart);
  assert.ok(propsStart >= 0 && propsEnd > propsStart);
  const imageProps = rendererHtml.slice(propsStart, propsEnd);
  assert.doesNotMatch(imageProps, /id=\"pfMask|id=\"pfMatte|id=\"pfLumaKey/);
  assert.match(rendererHtml, /mask\.type === \"circle\"/);
  assert.match(rendererHtml, /mask\.type === \"diamond\"/);
  assert.match(rendererHtml, /mask\.type === \"diagonal\"/);
});
