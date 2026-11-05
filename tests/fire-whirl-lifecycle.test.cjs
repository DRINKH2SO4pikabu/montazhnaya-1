"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "src/renderer/index.html"), "utf8");
const functionStart = html.indexOf("async function saveCurrentFrame(options = {}) {");
const functionEnd = html.indexOf("\nfunction openSaveCurrentFrameDialog()", functionStart);
assert.ok(functionStart >= 0 && functionEnd > functionStart, "saveCurrentFrame must remain available for lifecycle regression testing");
const saveCurrentFrameSource = html.slice(functionStart, functionEnd);

function makeHarness({ renderError = null } = {}) {
  const releases = [];
  let outputCanvas = null;
  const outputContext = {
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low"
  };
  const sandbox = {
    Preview: { canvas: {}, ctx: {}, clipVideoEls: new Map() },
    Exporter: { state: { active: false } },
    project: { fps: 30 },
    AppState: { playhead: 1.25 },
    DEFAULT_FPS: 30,
    pause() {},
    updatePreview() {},
    setPlayhead(value) { sandbox.AppState.playhead = value; },
    async waitForCurrentPreviewFrame() {},
    getStillFrameDimensions() { return { width: 640, height: 360 }; },
    clamp(value, min, max) { return Math.min(max, Math.max(min, value)); },
    stillFrameSuggestedName(frameNumber, timeSeconds) { return `frame_${frameNumber}_${timeSeconds}`; },
    renderSequenceAtTime(timeSeconds, context, canvas) {
      outputCanvas = canvas;
      if (renderError) throw renderError;
    },
    canvasToBlob: async (canvas, mimeType) => ({ size: 64, type: mimeType }),
    document: {
      createElement(name) {
        assert.equal(name, "canvas");
        const canvas = {
          width: 0,
          height: 0,
          getContext(type) { return type === "2d" ? outputContext : null; }
        };
        outputCanvas = canvas;
        return canvas;
      }
    },
    window: {
      MontazhnayaFireWhirlIntegration: {
        release(canvas) { releases.push(canvas); }
      },
      montazhnaya: {
        async saveStillFrame(request) {
          assert.equal(request.blob.size, 64);
          return { status: "success", fileName: "saved-frame.png" };
        }
      }
    },
    console
  };
  vm.runInNewContext(`${saveCurrentFrameSource}\nglobalThis.saveCurrentFrame = saveCurrentFrame;`, sandbox, {
    filename: "Montazhnaya-saveCurrentFrame-lifecycle.vm.js"
  });
  return { sandbox, releases, getOutputCanvas: () => outputCanvas };
}

test("still-frame export releases its one-shot Fire Whirl compositor after Blob capture", async () => {
  const harness = makeHarness();
  const result = await harness.sandbox.saveCurrentFrame({ format: "png" });
  assert.equal(result.status, "success");
  assert.equal(harness.releases.length, 1);
  assert.equal(harness.releases[0], harness.getOutputCanvas());
  assert.equal(harness.getOutputCanvas().width, 1);
  assert.equal(harness.getOutputCanvas().height, 1);
});

test("still-frame export releases its one-shot Fire Whirl compositor when composition fails", async () => {
  const harness = makeHarness({ renderError: new Error("synthetic composition failure") });
  await assert.rejects(harness.sandbox.saveCurrentFrame({ format: "png" }), /synthetic composition failure/);
  assert.equal(harness.releases.length, 1);
  assert.equal(harness.releases[0], harness.getOutputCanvas());
  assert.equal(harness.getOutputCanvas().width, 1);
  assert.equal(harness.getOutputCanvas().height, 1);
});
