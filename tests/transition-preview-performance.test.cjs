"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "src", "renderer", "index.html"), "utf8");

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `missing source range: ${startMarker}`);
  return source.slice(start, end);
}

function loadRenderState() {
  const source = between(html, "function computeClipRenderState(clip, time) {", "\nfunction applyProjectCanvasSize()");
  const sandbox = {
    clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
    getTransitionPrerollInfo: () => null,
    frameDur: () => 1 / 30,
    getSlideshowMotionState: () => ({ scale: 1, shiftX: 0, shiftY: 0 })
  };
  vm.runInNewContext(source + "\nglobalThis.compute = computeClipRenderState;", sandbox);
  return sandbox.compute;
}

const previewModes = [
  "opacity", "black", "white", "flash-white", "crossfade",
  "wipe-left", "wipe-right", "wipe-up", "wipe-down", "wipe-diagonal",
  "slide-left", "slide-right", "slide-up", "slide-down",
  "zoom-in", "zoom-out", "iris", "diamond", "blur", "spin", "fire-whirl"
];

test("public source catalog includes all 21 Grok-attributed transition previews and posters", () => {
  const root = path.join(__dirname, "..");
  const start = html.indexOf("const TRANSITION_CATALOG = [");
  const end = html.indexOf("\nconst TRANSITION_BY_MODE", start);
  assert.ok(start >= 0 && end > start);
  const catalog = html.slice(start, end);
  const videoNames = [...catalog.matchAll(/previewVideo\s*:\s*"([^"]+)"/g)].map(match => match[1]);
  const posterNames = [...catalog.matchAll(/previewPoster\s*:\s*"([^"]+)"/g)].map(match => match[1]);
  assert.equal(videoNames.length, previewModes.length);
  assert.equal(posterNames.length, previewModes.length);
  const dir = path.join(root, "assets", "transition-previews");
  for (const name of videoNames) assert.ok(fs.statSync(path.join(dir, name)).size > 1000, `missing preview ${name}`);
  for (const name of posterNames) assert.ok(fs.statSync(path.join(dir, "posters", name)).size > 1000, `missing poster ${name}`);
  const files = fs.readdirSync(dir, { recursive: true }).filter(name => /\.(mp4|jpg)$/i.test(String(name)));
  assert.equal(files.length, previewModes.length * 2);
  const readme = fs.readFileSync(path.join(dir, "README.md"), "utf8");
  assert.match(readme, /Created with Grok/);
  assert.match(fs.readFileSync(path.join(root, "ASSET_CREDITS.md"), "utf8"), /Created with Grok/);
});

test("Fire Whirl keeps a clean compact SVG glyph for source builds without demo media", () => {
  const start = html.indexOf("function transitionIconSvg(mode) {");
  const end = html.indexOf("\nfunction uiT(", start);
  assert.ok(start >= 0 && end > start, "transition icon renderer must exist");
  const source = html.slice(start, end);
  const sandbox = {
    getTransitionDefinition: mode => ({ color: mode === "fire-whirl" ? "#ff8b32" : "#76b8ff" }),
    esc: value => String(value).replace(/[&<>\"']/g, "")
  };
  vm.runInNewContext(source + "\nglobalThis.icon = transitionIconSvg;", sandbox);
  const markup = sandbox.icon("fire-whirl");
  assert.match(markup, /transition-icon--fire-whirl/);
  assert.match(markup, /data-transition-icon=\"fire-whirl\"/);
  assert.match(markup, /fill=\"#ff9a32\"/);
  assert.match(markup, /M37 36C28 29 31 17/);
  assert.match(markup, /<circle cx=\"66\" cy=\"29\"/);
  assert.match(markup, /fill=\"#142633\"/);
  assert.match(html, /mode: \"fire-whirl\"[^\n]*category: \"stylized\"/);
  assert.match(html, /transitionIconSvg\(nextPreRollTransition\.mode\)/,
    "the same glyph must appear on the timeline transition marker");
});

test("transition card markup uses muted, lazy, non-looping user video clips", () => {
  const source = between(html, "function transitionVideoPreviewMarkup(transition) {", "\nfunction transitionIconSvg(mode)");
  const sandbox = {
    esc: value => String(value).replace(/[&<>"']/g, ""),
    transitionIconSvg: () => "<svg></svg>"
  };
  vm.runInNewContext(source + "\nglobalThis.markup = transitionVideoPreviewMarkup;", sandbox);
  const markup = sandbox.markup({ mode: "wipe-diagonal", previewVideo: "wipe-diagonal.mp4", previewPoster: "wipe-diagonal.jpg" });
  assert.match(markup, /<video/);
  assert.match(markup, /muted/);
  assert.match(markup, /playsinline/);
  assert.match(markup, /preload="none"/);
  assert.match(markup, /data-transition-preview-src="..\/..\/assets\/transition-previews\/wipe-diagonal\.mp4"/);
  assert.match(markup, /poster="..\/..\/assets\/transition-previews\/posters\/wipe-diagonal\.jpg"/);
  assert.doesNotMatch(markup, /autoplay|\sloop(?:=|\s|>)/i, "the clip is played only while a card is hovered/focused");
});

test("transition card falls back to a compact SVG glyph when no poster is configured", () => {
  const source = between(html, "function transitionVideoPreviewMarkup(transition) {", "\nfunction transitionIconSvg(mode)");
  const sandbox = {
    esc: value => String(value).replace(/[&<>"']/g, ""),
    transitionIconSvg: mode => `<svg data-fallback="${mode}"></svg>`
  };
  vm.runInNewContext(source + "\nglobalThis.markup = transitionVideoPreviewMarkup;", sandbox);
  const markup = sandbox.markup({ mode: "fire-whirl" });
  assert.match(markup, /<svg data-fallback="fire-whirl"><\/svg>/);
  assert.doesNotMatch(markup, /<video|<img/);
});

test("only one transition preview video is loaded at a time and reduced-motion is respected", () => {
  assert.match(html, /loadedTransitionPreviewVideo && loadedTransitionPreviewVideo !== video/);
  assert.match(html, /releaseTransitionPreviewVideo\(loadedTransitionPreviewVideo\)/);
  assert.match(html, /card\.addEventListener\("pointerenter"/);
  assert.match(html, /card\.addEventListener\("pointerleave"/);
  assert.match(html, /card\.addEventListener\("focus"/);
  assert.match(html, /card\.addEventListener\("blur"/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.match(html, /document\.addEventListener\("visibilitychange"/);
  assert.doesNotMatch(html, /@keyframes ti-wipe|\.ti-scene--new/,
    "the old hand-drawn SVG animation path must not remain as the transition-card preview");
  assert.match(html, /function transitionIconSvg\(mode\)/,
    "small static SVGs remain for timeline markers where autoplay is undesirable");
});

test("white flash peaks at the center of its interval and is dark at both ends", () => {
  const compute = loadRenderState();
  const at = t => compute({
    id: "flash", timelineStart: 0, duration: 3, fadeIn: 0, fadeOut: 0,
    transIn: { mode: "flash-white", duration: 1 }, transOut: null, motionPreset: "none"
  }, t);
  const start = at(0.001).whiteOverlay;
  const middle = at(0.5).whiteOverlay;
  const end = at(0.999).whiteOverlay;
  assert.ok(middle > 0.99, `expected a full central flash, got ${middle}`);
  assert.ok(start < 0.01, `flash should not begin with a white fade, got ${start}`);
  assert.ok(end < 0.01, `flash should clear before the end, got ${end}`);
});

test("directional wipe render masks reveal from the named edge", () => {
  const compute = loadRenderState();
  const at = mode => compute({
    id: mode, timelineStart: 0, duration: 3, fadeIn: 0, fadeOut: 0,
    transIn: { mode, duration: 1 }, transOut: null, motionPreset: "none"
  }, 0.5).clipRect;
  const left = at("wipe-left");
  const right = at("wipe-right");
  const up = at("wipe-up");
  const down = at("wipe-down");
  for (const rect of [left, right, up, down]) {
    assert.ok(rect && rect.w > 0 && rect.h > 0);
  }
  assert.equal(left.x, 0);
  assert.ok(left.w < 1 && Math.abs(left.h - 1) < 1e-9);
  assert.ok(right.x > 0 && right.w < 1 && Math.abs(right.h - 1) < 1e-9);
  assert.ok(up.y > 0 && up.h < 1 && Math.abs(up.w - 1) < 1e-9);
  assert.equal(down.y, 0);
  assert.ok(down.h < 1 && Math.abs(down.w - 1) < 1e-9);
});

test("preview compositor can reuse the exact render state map created during media synchronization", () => {
  assert.match(html, /function renderSequenceAtTime\(time, ctxOverride, canvasOverride, videoElsOverride, renderStatesOverride\)/);
  assert.match(html, /renderStatesOverride && renderStatesOverride\.has\(clip\.id\)[\s\S]*?renderStatesOverride\.get\(clip\.id\)/);
  assert.match(html, /const renderStates = new Map\(\);[\s\S]*?renderStates\.set\(clip\.id, state\);[\s\S]*?renderSequenceAtTime\(time, null, null, null, renderStates\)/);
});

test("playback render cadence is quantized to the project FPS without deriving the clock from rounded playhead time", () => {
  const source = between(html, "function playbackFrameIndex(clockTime, fps) {", "\nfunction play() {");
  const sandbox = { DEFAULT_FPS: 30 };
  vm.runInNewContext(source + "\nglobalThis.frameIndex = playbackFrameIndex;", sandbox);
  assert.equal(sandbox.frameIndex(0.015, 30), 0);
  assert.equal(sandbox.frameIndex(0.034, 30), 1);
  assert.equal(sandbox.frameIndex(0.034, 60), 2);
  assert.equal(sandbox.frameIndex(1.001, 24), 24);
  assert.match(html, /let playbackClockTime = 0;/);
  assert.match(html, /playbackClockTime = Math\.min\(duration, playbackClockTime \+ dt\)/);
});

test("neutral preview frames skip per-pixel Canvas CSS filter work", () => {
  assert.match(html, /const needsCanvasFilter = Math\.abs\(brightness - 1\)/);
  assert.match(html, /ctx\.filter = needsCanvasFilter[\s\S]*?: "none"/);
});

test("media decode events do not schedule an extra paint during active playback", () => {
  assert.match(html, /const requestPausedPreviewRender = \(\) => \{[\s\S]*?if \(!AppState\.playing\) this\.scheduleRender\(\);/);
  assert.match(html, /el\.addEventListener\("seeked", requestPausedPreviewRender\)/);
  assert.match(html, /el\.addEventListener\("loadeddata", requestPausedPreviewRender\)/);
});

test("active transparent transition clips are synchronized before their first visible frame", () => {
  assert.match(html, /const activeOnVisibleTrack = !!state && !track\.hidden/);
  assert.match(html, /if \(!activeOnVisibleTrack\) \{[\s\S]*?syncClipVideo\(clip, media, time, playing\)/);
  assert.doesNotMatch(html, /const visible = state && state\.opacity > 0\.0005 && !track\.hidden/);
});

test("outgoing wipe preserves the opposite side so entrance and exit travel in the same named direction", () => {
  const compute = loadRenderState();
  const out = mode => compute({
    id: mode, timelineStart: 0, duration: 3, fadeIn: 0, fadeOut: 0,
    transIn: null, transOut: { mode, duration: 1 }, motionPreset: "none"
  }, 2.5).clipRect;
  const left = out("wipe-left");
  const right = out("wipe-right");
  const up = out("wipe-up");
  const down = out("wipe-down");
  assert.ok(left.x > 0 && left.w < 1, "wipe-left exit must leave the right side");
  assert.equal(right.x, 0);
  assert.ok(right.w < 1, "wipe-right exit must leave the left side");
  assert.equal(up.y, 0);
  assert.ok(up.h < 1, "wipe-up exit must leave the top side");
  assert.ok(down.y > 0 && down.h < 1, "wipe-down exit must leave the bottom side");
});


test("Fire Whirl is registered as a real overlap transition and uses the shared sequence renderer", () => {
  assert.match(html, /mode: "fire-whirl", label: "Огненный вихрь"[^\n]*overlap: true/);
  assert.match(html, /if \(def\.mode === "fire-whirl"\) \{/);
  assert.match(html, /function findActiveFireWhirlPairs\(track, active, time\)/);
  assert.match(html, /renderFireWhirlPair\(ctx, canvas, firePair\.outgoing, firePair\.incoming, time, videoEls, firePair\)/);
  assert.match(html, /function renderSequenceAtTime\(time, ctxOverride, canvasOverride, videoElsOverride, renderStatesOverride\)/);
  assert.match(html, /MontazhnayaFireWhirlIntegration/);
});

test("Fire Whirl export preflight probes WebGL 2 only for visible video tracks and rejects invalid pairing", () => {
  assert.match(html, /const usesFireWhirl = project\.tracks\.some\(track => track\.kind === "video" && !track\.hidden/);
  assert.match(html, /integration\.probe\(\)/);
  assert.match(html, /Переход «Огненный вихрь» требует работающего WebGL 2/);
  assert.match(html, /clip\.transIn && clip\.transIn\.mode === "fire-whirl"[\s\S]*?findPreviousClip\(track, clip\)[\s\S]*?isIntentionalTransitionOverlap\(fireWhirlOutgoing, clip\)/);
  assert.match(html, /Fire Whirl export failed/);
});
