"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const modulePath = path.join(root, "src/renderer/effects/fire-whirl-webgl.js");
const source = fs.readFileSync(modulePath, "utf8");

test("Fire Whirl WebGL compositor is isolated and does not mutate the existing Canvas2D pipeline", () => {
  const html = fs.readFileSync(path.join(root, "src/renderer/index.html"), "utf8");
  assert.ok(fs.existsSync(modulePath));
  assert.match(html, /<meta http-equiv="Content-Security-Policy"/);
  assert.match(source, /getContext\("webgl2"/);
  assert.match(source, /class FireWhirlWebGL/);
  assert.match(source, /dispose\(\)/);
  assert.match(html, /function renderSequenceAtTime\(time, ctxOverride/);
  assert.match(html, /drawClipFrame\(ctx, canvas, media, clip/);
});

test("Fire Whirl shader supports two source textures, resolution scaling and progress", () => {
  const sandbox = { window: {}, globalThis: {} };
  vm.runInNewContext(source, sandbox);
  const api = sandbox.window.MontazhnayaFireWhirl;
  assert.ok(api);
  assert.match(api.vertexShader, /#version 300 es/);
  for (const uniform of ["uFrom", "uTo", "uResolution", "uProgress", "uTime", "uMaskOnly"]) {
    assert.match(api.fragmentShader, new RegExp("uniform [^;]+\\b" + uniform + "\\s*;"));
  }
  assert.match(api.fragmentShader, /uMaskOnly\s*>\s*0\.5/);
  assert.match(api.fragmentShader, /outColor\s*=\s*vec4\(vec3\(reveal\),\s*reveal\)/);
});

test("Fire Whirl shader contains a procedural spiral frontier, flame edge and spark layer", () => {
  const sandbox = { window: {}, globalThis: {} };
  vm.runInNewContext(source, sandbox);
  const shader = sandbox.window.MontazhnayaFireWhirl.fragmentShader;
  assert.match(shader, /atan\(q\.y,\s*q\.x\)/);
  assert.match(shader, /sin\(angle\s*\*\s*3\.0/);
  assert.match(shader, /smoothstep\(frontier/);
  assert.match(shader, /fireColor/);
  assert.match(shader, /sparkDistance/);
});

test("Fire Whirl API validates sources, clamps progress and releases GPU resources", () => {
  assert.match(source, /Both transition source frames are required/);
  assert.match(source, /Math\.min\(1, Math\.max\(0, Number\(options\.progress\)/);
  assert.match(source, /gl\.deleteTexture/);
  assert.match(source, /gl\.deleteBuffer/);
  assert.match(source, /gl\.deleteProgram/);
});
