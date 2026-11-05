"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const renderer = fs.readFileSync(path.join(__dirname, "..", "src", "renderer", "index.html"), "utf8");

function loadRendererFunction(name, globals = {}) {
  const match = renderer.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, "m"));
  assert.ok(match, `renderer function ${name} should exist`);
  const sandbox = { ...globals };
  vm.runInNewContext(`${match[0]}\nthis.fn = ${name};`, sandbox);
  return sandbox.fn;
}

const track = { id: "A1", kind: "audio" };
const getTrack = id => id === track.id ? track : null;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

 test("audio crossfade is equal-power at the midpoint and continuous at both ends", () => {
  const factor = loadRendererFunction("audioCrossfadeFactorForClip", { getTrack, clamp });
  const outgoing = { id: "out", trackId: "A1", timelineStart: 0, duration: 10, audioCrossfadeOut: 2 };
  const incoming = { id: "in", trackId: "A1", timelineStart: 8, duration: 5, audioCrossfadeIn: 2 };
  assert.equal(factor(outgoing, 8), 1);
  assert.equal(factor(incoming, 8), 0);
  const outMid = factor(outgoing, 9);
  const inMid = factor(incoming, 9);
  assert.ok(Math.abs(outMid - Math.SQRT1_2) < 1e-12);
  assert.ok(Math.abs(inMid - Math.SQRT1_2) < 1e-12);
  assert.ok(Math.abs(outMid * outMid + inMid * inMid - 1) < 1e-12);
  assert.ok(factor(outgoing, 9.999) < 0.001);
  assert.equal(factor(incoming, 10), 1);
});

test("only matching adjacent audio clips are allowed to overlap for a crossfade", () => {
  const isOverlap = loadRendererFunction("isIntentionalAudioCrossfadeOverlap", {
    getTrack,
    frameDur: () => 1 / 30
  });
  const outgoing = { id: "out", trackId: "A1", timelineStart: 0, duration: 10, audioCrossfadeOut: 2 };
  const incoming = { id: "in", trackId: "A1", timelineStart: 8, duration: 5, audioCrossfadeIn: 2 };
  assert.equal(isOverlap(outgoing, incoming), true);
  assert.equal(isOverlap(outgoing, { ...incoming, audioCrossfadeIn: 1.5 }), false);
  assert.equal(isOverlap(outgoing, { ...incoming, trackId: "A2" }), false);
});

test("crossfade timing is persisted and the audio menu exposes apply and clear actions", () => {
  assert.ok(renderer.includes("audioCrossfadeIn: Number(c.audioCrossfadeIn) || 0"));
  assert.ok(renderer.includes("audioCrossfadeOut: Number(c.audioCrossfadeOut) || 0"));
  assert.ok(renderer.includes("function applyAudioCrossfadeWithPrevious("));
  assert.ok(renderer.includes("function clearAudioCrossfadeFromSelection("));
  assert.ok(renderer.includes("Перекрёстное затухание с предыдущим"));
  assert.ok(renderer.includes("Убрать аудиопереход"));
});
