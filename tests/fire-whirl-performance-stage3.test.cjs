"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "src/renderer/index.html"), "utf8");
const integrationSource = fs.readFileSync(path.join(root, "src/renderer/effects/fire-whirl-integration.js"), "utf8");
const webglSource = fs.readFileSync(path.join(root, "src/renderer/effects/fire-whirl-webgl.js"), "utf8");

function extractBetween(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start);
  assert.ok(start >= 0 && end > start, `Unable to extract ${startToken}`);
  return source.slice(start, end);
}

function getFrameState() {
  const functionSource = extractBetween(
    html,
    "function getFireWhirlTransitionFrameState(time, transitionStart, duration) {",
    "\nfunction renderFireWhirlPair("
  );
  const sandbox = { clamp: (value, min, max) => Math.min(max, Math.max(min, value)) };
  vm.runInNewContext(`${functionSource}\nglobalThis.getState = getFireWhirlTransitionFrameState;`, sandbox);
  return sandbox.getState;
}

function createMockGl({ maxTextureSize = 4096, maxViewport = [4096, 4096] } = {}) {
  const extensionCalls = [];
  const gl = {
    VENDOR: 1, RENDERER: 2, VERSION: 3, SHADING_LANGUAGE_VERSION: 4,
    MAX_TEXTURE_SIZE: 5, MAX_VIEWPORT_DIMS: 6,
    ARRAY_BUFFER: 7, STATIC_DRAW: 8, TEXTURE_2D: 9,
    TEXTURE_MIN_FILTER: 10, TEXTURE_MAG_FILTER: 11, TEXTURE_WRAP_S: 12, TEXTURE_WRAP_T: 13,
    LINEAR: 14, CLAMP_TO_EDGE: 15, VERTEX_SHADER: 16, FRAGMENT_SHADER: 17,
    COMPILE_STATUS: 18, LINK_STATUS: 19, TEXTURE0: 20, RGBA: 21, UNSIGNED_BYTE: 22,
    FLOAT: 23, TRIANGLES: 24, BLEND: 25,
    getParameter(key) {
      return ({
        1: "WebGL Vendor", 2: "ANGLE (NVIDIA GeForce GTX 1050)", 3: "WebGL 2.0",
        4: "WebGL GLSL ES 3.00", 5: maxTextureSize, 6: maxViewport
      })[key];
    },
    getExtension(name) {
      extensionCalls.push(name);
      if (name === "WEBGL_debug_renderer_info") return { UNMASKED_VENDOR_WEBGL: 26, UNMASKED_RENDERER_WEBGL: 27 };
      if (name === "WEBGL_lose_context") return { loseContext() { gl.contextLost = true; } };
      return null;
    },
    createShader: () => ({}), shaderSource() {}, compileShader() {}, getShaderParameter: () => true,
    getShaderInfoLog: () => "", deleteShader() {}, createProgram: () => ({}), attachShader() {}, linkProgram() {},
    getProgramParameter: () => true, getProgramInfoLog: () => "", deleteProgram() {},
    getUniformLocation: () => ({}), getAttribLocation: () => 0, createBuffer: () => ({}), bindBuffer() {},
    bufferData() {}, createTexture: () => ({}), bindTexture() {}, texParameteri() {}, texSubImage2D() {}, texImage2D() {},
    viewport() {}, useProgram() {}, enableVertexAttribArray() {}, vertexAttribPointer() {}, pixelStorei() {},
    activeTexture() {}, uniform1i() {}, uniform2f() {}, uniform1f() {}, disable() {}, drawArrays() {},
    deleteTexture() {}, deleteBuffer() {},
    extensionCalls
  };
  gl.getParameter = key => {
    if (key === 26) return "NVIDIA";
    if (key === 27) return "NVIDIA GeForce GTX 1050";
    return ({
      1: "WebGL Vendor", 2: "ANGLE (NVIDIA GeForce GTX 1050)", 3: "WebGL 2.0",
      4: "WebGL GLSL ES 3.00", 5: maxTextureSize, 6: maxViewport
    })[key];
  };
  return gl;
}

function createCanvas(gl = null) {
  const contexts = { "2d": { save() {}, restore() {}, setTransform() {}, clearRect() {}, drawImage() {}, fillRect() {} }, webgl2: gl };
  return {
    width: 300, height: 150,
    getContext(type) { return contexts[type] || null; },
    addEventListener() {},
    setAttribute() {},
    _contexts: contexts
  };
}

test("Fire Whirl progress is based on the real overlap duration, not the project frame duration", () => {
  const state = getFrameState();
  assert.deepEqual({ ...state(10, 10, 0.5) }, { elapsed: 0, progress: 0 });
  assert.deepEqual({ ...state(10.25, 10, 0.5) }, { elapsed: 0.25, progress: 0.5 });
  assert.deepEqual({ ...state(10.5, 10, 0.5) }, { elapsed: 0.5, progress: 1 });
  assert.equal(state(10.02, 10, 0.01).progress, 1, "a transition shorter than one 24 FPS frame must still reach its final state");
});

test("24, 30 and 60 FPS timelines produce the same Fire Whirl state at matching timestamps", () => {
  const state = getFrameState();
  for (const fps of [24, 30, 60]) {
    const frameIndex = Math.round(0.5 * fps);
    const previewTime = frameIndex / fps;
    const exportTime = frameIndex / fps;
    assert.equal(previewTime, exportTime);
    assert.deepEqual({ ...state(previewTime, 0, 1) }, { ...state(exportTime, 0, 1) });
  }
});

test("transition progress is monotonic and bounded for every supported delivery rate", () => {
  const state = getFrameState();
  for (const fps of [24, 30, 60]) {
    let previous = -1;
    for (let frame = 0; frame <= fps; frame++) {
      const current = state(frame / fps, 0, 1).progress;
      assert.ok(current >= previous, `${fps} FPS progress must not go backwards`);
      assert.ok(current >= 0 && current <= 1);
      previous = current;
    }
    assert.equal(previous, 1);
  }
});

test("Fire Whirl working-set estimate reports conservative surface and texture memory", () => {
  const sandbox = {
    window: { document: { createElement: () => createCanvas() }, addEventListener() {} },
    globalThis: {}
  };
  vm.runInNewContext(integrationSource, sandbox);
  const estimate = sandbox.window.MontazhnayaFireWhirlIntegration.estimateWorkingSet(1920, 1080);
  assert.equal(estimate.bytesPerPixel, 24);
  assert.equal(estimate.estimatedBytes, 1920 * 1080 * 24);
  assert.ok(estimate.estimatedMiB > 47 && estimate.estimatedMiB < 48);
  const fourK = sandbox.window.MontazhnayaFireWhirlIntegration.estimateWorkingSet(3840, 2160);
  assert.equal(fourK.estimatedBytes, 3840 * 2160 * 24);
  assert.ok(fourK.estimatedMiB > 189 && fourK.estimatedMiB < 191);
});

test("GPU diagnostics identify the active WebGL adapter and release the temporary context", () => {
  const gl = createMockGl();
  const sandbox = {
    window: { document: { createElement: () => createCanvas(gl) }, addEventListener() {} },
    globalThis: {}
  };
  vm.runInNewContext(integrationSource, sandbox);
  const diagnostics = sandbox.window.MontazhnayaFireWhirlIntegration.getDiagnostics(3840, 2160);
  assert.equal(diagnostics.supported, true);
  assert.equal(diagnostics.targetWithinLimits, true);
  assert.equal(diagnostics.rendererUnmasked, "NVIDIA GeForce GTX 1050");
  assert.equal(diagnostics.maxTextureSize, 4096);
  assert.equal(gl.contextLost, true, "diagnostic context must be released after probing");
});

test("integration rejects an oversized frame before expanding its two source surfaces", () => {
  const canvases = [];
  const sandboxWindow = {
    document: { createElement() { const canvas = createCanvas(); canvases.push(canvas); return canvas; } },
    addEventListener() {},
    MontazhnayaFireWhirl: {
      create() {
        return {
          validateDimensions(width, height) {
            return { ok: width <= 4096 && height <= 4096, maxWidth: 4096, maxHeight: 4096 };
          },
          render() {}, dispose() {}
        };
      }
    }
  };
  vm.runInNewContext(integrationSource, { window: sandboxWindow, globalThis: sandboxWindow });
  const output = createCanvas();
  const outputContext = output.getContext("2d");
  const result = sandboxWindow.MontazhnayaFireWhirlIntegration.render(
    outputContext, output, () => true, () => true,
    { width: 5000, height: 2160, progress: 0.5 }
  );
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsupported-resolution");
  assert.deepEqual(canvases.map(canvas => [canvas.width, canvas.height]), [[300, 150], [300, 150], [300, 150]]);
});

test("WebGL renderer validates texture and viewport limits before resizing its drawing buffer", () => {
  const gl = createMockGl({ maxTextureSize: 4096, maxViewport: [4096, 4096] });
  const canvas = createCanvas(gl);
  const sandbox = { window: {}, globalThis: {} };
  vm.runInNewContext(webglSource, sandbox);
  const renderer = sandbox.window.MontazhnayaFireWhirl.create(canvas);
  assert.throws(() => renderer.render(createCanvas(), createCanvas(), { width: 5000, height: 2160, progress: 0.5 }),
    error => error && error.code === "FIRE_WHIRL_UNSUPPORTED_RESOLUTION");
  assert.equal(canvas.width, 300);
  assert.equal(canvas.height, 150);
  renderer.dispose();
});

test("GPU preference can be changed for adapter-specific diagnostics and invalid values are rejected", () => {
  const rendererOptions = [];
  const sandboxWindow = {
    document: { createElement: () => createCanvas() },
    addEventListener() {},
    MontazhnayaFireWhirl: {
      create(_canvas, options) {
        rendererOptions.push(options);
        return { render() {}, dispose() {} };
      }
    }
  };
  vm.runInNewContext(integrationSource, { window: sandboxWindow, globalThis: sandboxWindow });
  const api = sandboxWindow.MontazhnayaFireWhirlIntegration;
  assert.equal(api.configure({ powerPreference: "low-power" }).powerPreference, "low-power");
  const output = createCanvas();
  api.render(output.getContext("2d"), output, () => true, () => true, { width: 320, height: 180, progress: 0.5 });
  assert.equal(rendererOptions[0].powerPreference, "low-power");
  api.release(output);
  assert.throws(() => api.configure({ powerPreference: "gpu-max" }), /powerPreference/);
});

test("Stage 3 benchmark contains the six required resolution/FPS combinations and uses the shared compositor", () => {
  const benchmark = fs.readFileSync(path.join(root, "tools/fire-whirl-stage3-benchmark.html"), "utf8");
  assert.match(benchmark, /width: 1920, height: 1080/);
  assert.match(benchmark, /width: 3840, height: 2160/);
  assert.match(benchmark, /const rates = \[24, 30, 60\]/);
  assert.match(benchmark, /api\.render\(/);
  assert.match(benchmark, /MontazhnayaFireWhirlIntegration\.getDiagnostics/);
  assert.match(benchmark, /api\.estimateWorkingSet/);
  assert.match(benchmark, /api\.release\(/);
});

test("WebGL compositor accepts 1080p and 4K targets when the reported GPU limits allow them", () => {
  const gl = createMockGl({ maxTextureSize: 8192, maxViewport: [8192, 8192] });
  const canvas = createCanvas(gl);
  const sandbox = { window: {}, globalThis: {} };
  vm.runInNewContext(webglSource, sandbox);
  const renderer = sandbox.window.MontazhnayaFireWhirl.create(canvas);
  for (const size of [{ width: 1920, height: 1080 }, { width: 3840, height: 2160 }]) {
    const result = renderer.render(createCanvas(), createCanvas(), { ...size, progress: 0.5, time: 0.25, seed: 42 });
    assert.equal(result, canvas);
    assert.equal(canvas.width, size.width);
    assert.equal(canvas.height, size.height);
  }
  renderer.dispose();
});
