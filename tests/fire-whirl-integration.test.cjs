"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src/renderer/effects/fire-whirl-integration.js"), "utf8");

function createSandbox() {
  const calls = { created: 0, rendered: [], disposed: 0, drawn: [], listeners: {} };
  function makeContext(canvas) {
    return {
      canvas,
      save() {}, restore() {}, setTransform() {}, clearRect() {}, fillRect() {},
      drawImage(image, ...args) { calls.drawn.push({ target: canvas, image, args }); },
      set globalAlpha(value) {}, set globalCompositeOperation(value) {}, set filter(value) {}
    };
  }
  function makeCanvas() {
    const listeners = {};
    return {
      width: 300, height: 150,
      getContext(type) {
        if (type === "2d") return makeContext(this);
        return null;
      },
      addEventListener(name, fn) { listeners[name] = fn; calls.listeners[name] = fn; },
      _listeners: listeners
    };
  }
  const document = { createElement(name) { assert.equal(name, "canvas"); return makeCanvas(); } };
  const fakeWindow = {
    document,
    addEventListener() {},
    MontazhnayaFireWhirl: {
      create(canvas) {
        calls.created++;
        return {
          render(from, to, options) { calls.rendered.push({ from, to, options, canvas }); },
          dispose() { calls.disposed++; }
        };
      }
    }
  };
  vm.runInNewContext(source, { window: fakeWindow, globalThis: fakeWindow });
  return { api: fakeWindow.MontazhnayaFireWhirlIntegration, calls, makeCanvas };
}

test("Fire Whirl integration draws two prepared source surfaces through one shared WebGL compositor", () => {
  const { api, calls, makeCanvas } = createSandbox();
  const output = makeCanvas();
  const outputContext = makeCanvas().getContext("2d");
  let fromCalled = false, toCalled = false;
  const result = api.render(outputContext, output,
    (ctx, canvas) => { fromCalled = true; assert.equal(canvas.width, 1920); ctx.fillRect(0, 0, 1, 1); return true; },
    (ctx, canvas) => { toCalled = true; assert.equal(canvas.height, 1080); ctx.fillRect(0, 0, 1, 1); return true; },
    { width: 1920, height: 1080, progress: 0.4, time: 0.8, seed: 123 });
  assert.equal(result.ok, true);
  assert.equal(fromCalled, true);
  assert.equal(toCalled, true);
  assert.equal(calls.created, 1);
  assert.equal(calls.rendered.length, 1);
  assert.equal(calls.rendered[0].options.progress, 0.4);
  assert.equal(calls.rendered[0].options.time, 0.8);
  assert.equal(calls.rendered[0].options.seed, 123);
  assert.equal(calls.drawn.length, 1, "the WebGL surface must be copied into the shared output canvas");
});

test("Fire Whirl integration exposes the shader alpha matte through the shared compositor", () => {
  const { api, calls, makeCanvas } = createSandbox();
  const output = makeCanvas();
  const outputContext = makeCanvas().getContext("2d");
  const result = api.render(outputContext, output, () => true, () => true, {
    width: 640, height: 360, progress: 0.5, maskOnly: true
  });
  assert.equal(result.ok, true);
  assert.equal(calls.rendered.length, 1);
  assert.equal(calls.rendered[0].options.maskOnly, true, "the alpha matte request must reach the WebGL shader");
});

test("Fire Whirl integration does not draw stale frames if either source callback is not ready", () => {
  const { api, calls, makeCanvas } = createSandbox();
  const output = makeCanvas();
  const outputContext = makeCanvas().getContext("2d");
  const result = api.render(outputContext, output, () => true, () => false, { width: 640, height: 360, progress: 0.5 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "source-frame-not-ready");
  assert.equal(calls.rendered.length, 0);
  assert.equal(calls.drawn.length, 0);
});

test("Fire Whirl integration probes WebGL 2, releases surfaces and disposes renderer resources", () => {
  const { api, calls, makeCanvas } = createSandbox();
  assert.equal(api.probe(), true);
  const output = makeCanvas();
  const outputContext = makeCanvas().getContext("2d");
  api.render(outputContext, output, () => true, () => true, { width: 320, height: 180, progress: 0.5 });
  api.release(output);
  assert.ok(calls.disposed >= 2, "probe and output renderers should both be disposed");
  assert.equal(api.render(outputContext, output, () => true, () => true, { width: 320, height: 180, progress: 0.5 }).ok, true,
    "a released output canvas can safely create a fresh renderer");
});

test("Fire Whirl integration catches unavailable WebGL without silently claiming success", () => {
  const sandbox = createSandbox();
  sandbox.api; // ensure standard setup first
  const failingWindow = {
    document: { createElement() { return { getContext() { return null; }, addEventListener() {} }; } },
    addEventListener() {},
    MontazhnayaFireWhirl: { create() { throw new Error("WebGL 2 is unavailable"); } }
  };
  vm.runInNewContext(source, { window: failingWindow, globalThis: failingWindow });
  assert.equal(failingWindow.MontazhnayaFireWhirlIntegration.probe(), false);
  const output = { width: 320, height: 180 };
  const result = failingWindow.MontazhnayaFireWhirlIntegration.render({}, output, () => true, () => true, { progress: 0.5 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "webgl-unavailable");
});

test("Fire Whirl export preflight releases its temporary WebGL 2 context", () => {
  let lost = 0;
  const fakeGl = {
    getExtension(name) {
      assert.equal(name, "WEBGL_lose_context");
      return { loseContext() { lost++; } };
    }
  };
  function canvas() {
    return {
      width: 2, height: 2,
      getContext(type) {
        if (type === "webgl2") return fakeGl;
        if (type === "2d") return {
          fillRect() {}, set fillStyle(_) {}
        };
        return null;
      },
      addEventListener() {}
    };
  }
  const fakeWindow = {
    document: { createElement: canvas },
    addEventListener() {},
    MontazhnayaFireWhirl: {
      create() {
        return { render() {}, dispose() {} };
      }
    }
  };
  vm.runInNewContext(source, { window: fakeWindow, globalThis: fakeWindow });
  assert.equal(fakeWindow.MontazhnayaFireWhirlIntegration.probe(), true);
  assert.equal(lost, 1, "the disposable preflight context should be explicitly released");
});

test("Fire Whirl releases a partially created WebGL context when the preflight shader fails", () => {
  let lost = 0;
  const fakeGl = { getExtension(name) { assert.equal(name, "WEBGL_lose_context"); return { loseContext() { lost++; } }; } };
  function canvas() {
    return {
      width: 2, height: 2,
      getContext(type) {
        if (type === "webgl2") return fakeGl;
        if (type === "2d") return { fillRect() {}, set fillStyle(_) {} };
        return null;
      },
      addEventListener() {}
    };
  }
  const fakeWindow = {
    document: { createElement: canvas },
    addEventListener() {},
    MontazhnayaFireWhirl: { create(canvasElement) { canvasElement.getContext("webgl2"); throw new Error("shader compilation failed"); } }
  };
  vm.runInNewContext(source, { window: fakeWindow, globalThis: fakeWindow });
  assert.equal(fakeWindow.MontazhnayaFireWhirlIntegration.probe(), false);
  assert.equal(lost, 1, "a context created before a constructor failure must not leak");
});

test("Fire Whirl releases the output canvas WebGL context when a render session is disposed", () => {
  let lost = 0;
  const fakeGl = { getExtension(name) { assert.equal(name, "WEBGL_lose_context"); return { loseContext() { lost++; } }; } };
  function makeContext(canvas) {
    return { canvas, save() {}, restore() {}, setTransform() {}, clearRect() {}, fillRect() {}, drawImage() {},
      set globalAlpha(_) {}, set globalCompositeOperation(_) {}, set filter(_) {} };
  }
  function canvas() {
    return {
      width: 320, height: 180,
      getContext(type) { return type === "webgl2" ? fakeGl : type === "2d" ? makeContext(this) : null; },
      addEventListener() {}
    };
  }
  const fakeWindow = {
    document: { createElement: canvas },
    addEventListener() {},
    MontazhnayaFireWhirl: { create() { return { render() {}, dispose() {} }; } }
  };
  vm.runInNewContext(source, { window: fakeWindow, globalThis: fakeWindow });
  const api = fakeWindow.MontazhnayaFireWhirlIntegration;
  const output = canvas();
  assert.equal(api.render(makeContext(output), output, () => true, () => true, { width: 320, height: 180, progress: 0.5 }).ok, true);
  api.release(output);
  assert.equal(lost, 1, "disposing the compositor must release its WebGL context");
});


test("Fire Whirl releases a WebGL context acquired before render-session shader initialization fails", () => {
  let lost = 0;
  let effectCanvas = null;
  const fakeGl = {
    getExtension(name) {
      assert.equal(name, "WEBGL_lose_context");
      return { loseContext() { lost++; } };
    }
  };
  function makeContext(canvas) {
    return {
      canvas, save() {}, restore() {}, setTransform() {}, clearRect() {}, fillRect() {}, drawImage() {},
      set globalAlpha(_) {}, set globalCompositeOperation(_) {}, set filter(_) {}
    };
  }
  function makeCanvas() {
    return {
      width: 320,
      height: 180,
      getContext(type) {
        if (type === "webgl2") return fakeGl;
        if (type === "2d") return makeContext(this);
        return null;
      },
      addEventListener() {}
    };
  }
  const fakeWindow = {
    document: {
      createElement(name) {
        assert.equal(name, "canvas");
        const canvas = makeCanvas();
        effectCanvas = canvas;
        return canvas;
      }
    },
    addEventListener() {},
    MontazhnayaFireWhirl: {
      create(canvasElement) {
        canvasElement.getContext("webgl2");
        throw new Error("synthetic shader compilation failure");
      }
    }
  };
  vm.runInNewContext(source, { window: fakeWindow, globalThis: fakeWindow });
  const output = makeCanvas();
  const result = fakeWindow.MontazhnayaFireWhirlIntegration.render(
    makeContext(output), output, () => true, () => true,
    { width: 320, height: 180, progress: 0.5 }
  );
  assert.equal(result.ok, false);
  assert.equal(result.reason, "webgl-unavailable");
  assert.equal(lost, 1, "a partially initialized session must explicitly lose its acquired WebGL context");
  assert.equal(effectCanvas.width, 1, "failed offscreen surfaces must be reduced to release backing storage");
});
