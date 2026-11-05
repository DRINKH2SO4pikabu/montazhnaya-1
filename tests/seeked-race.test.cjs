"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");

const rendererPath = path.join(__dirname, "..", "src", "renderer", "index.html");
const rendererHtml = fs.readFileSync(rendererPath, "utf8");

function getDeclaration(startMarker, endMarker, name, context) {
  const start = rendererHtml.indexOf(startMarker);
  const end = rendererHtml.indexOf(endMarker, start);
  assert.notEqual(start, -1, `must find ${startMarker}`);
  assert.notEqual(end, -1, `must find ${endMarker}`);
  const declaration = rendererHtml.slice(start, end).trim();
  return vm.runInNewContext(`${declaration}\n${name};`, context);
}

function makeEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(callback);
    },
    removeEventListener(name, callback) {
      const callbacks = listeners.get(name);
      if (callbacks) callbacks.delete(callback);
    },
    dispatch(name) {
      for (const callback of [...(listeners.get(name) || [])]) callback();
    }
  };
}

function loadSeekTo(fakeElement, state) {
  return getDeclaration(
    "const seekTo = seekTarget => new Promise",
    "    try {\n      if (el.seeking)",
    "seekTo",
    {
      el: fakeElement,
      seeked: false,
      deadline: performance.now() + 1500,
      describeState: () => "simulated Chromium seek",
      makeWaitError: () => new Error("seek timeout"),
      performance,
      setTimeout,
      clearTimeout,
      Promise,
      Number,
      Math,
      Error
    }
  );
}


function loadPresentedTargetWait(fakeElement, targetTime, sourceFrameInterval, fakeContextExtras = {}) {
  const toleranceHelper = getDeclaration(
    "function sourceFramePresentationTolerance",
    "function isPresentedSourceFrameForTarget",
    "sourceFramePresentationTolerance",
    { Number, Math }
  );
  const frameMatchHelper = getDeclaration(
    "function isPresentedSourceFrameForTarget",
    "const Exporter =",
    "isPresentedSourceFrameForTarget",
    { Number, Math, sourceFramePresentationTolerance: toleranceHelper }
  );
  const context = {
    el: fakeElement,
    expectedPresentationTime: targetTime,
    sourceFrameInterval,
    presentationTolerance: Math.max(0.002, Math.min(0.05, sourceFrameInterval / 2 + 0.001)),
    deadline: performance.now() + 800,
    callbackObservedTime: null,
    presentedTime: null,
    presentedFrames: null,
    describeState: () => "simulated video-frame presentation",
    makeWaitError: () => new Error("presentation timeout"),
    performance,
    setTimeout,
    clearTimeout,
    Promise,
    Number,
    Math,
    Error,
    sourceFramePresentationTolerance: toleranceHelper,
    isPresentedSourceFrameForTarget: frameMatchHelper,
    ...fakeContextExtras
  };
  const wait = getDeclaration(
    "const waitForPresentedTargetWhilePlaying = () => new Promise",
    "    try {\n      if (el.seeking)",
    "waitForPresentedTargetWhilePlaying",
    context
  );
  return { wait, context };
}

function makeFakeVideoFrameElement(frameTimes, cadenceMs = 2) {
  let nextId = 1;
  const pending = new Map();
  let paused = true;
  let pausedCount = 0;
  const el = {
    requestVideoFrameCallback(callback) {
      const id = nextId++;
      pending.set(id, callback);
      return id;
    },
    cancelVideoFrameCallback(id) { pending.delete(id); },
    play() {
      paused = false;
      let frameIndex = 0;
      const deliver = () => {
        if (paused || frameIndex >= frameTimes.length) return;
        const first = pending.entries().next();
        if (first.done) {
          setTimeout(deliver, cadenceMs);
          return;
        }
        const [id, callback] = first.value;
        pending.delete(id);
        const time = frameTimes[frameIndex++];
        callback(performance.now(), { mediaTime: time, presentedFrames: frameIndex });
        if (!paused) setTimeout(deliver, cadenceMs);
      };
      setTimeout(deliver, cadenceMs);
      return Promise.resolve();
    },
    pause() { paused = true; pausedCount++; },
    get paused() { return paused; },
    get pausedCount() { return pausedCount; }
  };
  return el;
}

test("presentation callback ignores the preceding source frame and accepts the target frame", async () => {
  const sourceInterval = 1 / 24;
  const el = makeFakeVideoFrameElement([0, sourceInterval]);
  const { wait, context } = loadPresentedTargetWait(el, sourceInterval, sourceInterval);
  await wait();
  assert.ok(Math.abs(context.presentedTime - sourceInterval) < 1e-6);
  assert.ok(Math.abs(context.callbackObservedTime - sourceInterval) < 1e-6);
  assert.equal(el.paused, true, "video must pause immediately after the correct frame is confirmed");
});

test("presentation callback chooses the nearest source frame for 24-to-30 FPS timing", async () => {
  const sourceInterval = 1 / 24;
  const target = 1 / 30;
  const el = makeFakeVideoFrameElement([0, sourceInterval]);
  const { wait, context } = loadPresentedTargetWait(el, target, sourceInterval);
  await wait();
  assert.ok(Math.abs(context.presentedTime - sourceInterval) < 1e-6);
  assert.ok(Math.abs(context.presentedTime - target) < sourceInterval / 2);
});

test("presentation callback rejects a frame that jumped past the target window", async () => {
  const sourceInterval = 1 / 24;
  const el = makeFakeVideoFrameElement([0, 2 * sourceInterval]);
  const { wait, context } = loadPresentedTargetWait(el, sourceInterval, sourceInterval);
  await assert.rejects(wait(), /перескочил окно целевого кадра/);
  assert.ok(Math.abs(context.callbackObservedTime - 2 * sourceInterval) < 1e-6);
});

test("does not accept synchronous currentTime update before delayed seeked event", async () => {
  const events = makeEventTarget();
  let currentTime = 0;
  let seekedEventFired = false;
  let seeking = false;
  const el = Object.create(events);
  Object.defineProperties(el, {
    error: { value: null, writable: true },
    seeking: { get() { return seeking; }, set(value) { seeking = value; } },
    currentTime: {
      get() { return currentTime; },
      set(value) {
        // Simulate the Chromium race from the user's log: currentTime is
        // updated immediately, while seeking still reports false and seeked
        // is dispatched later. This must not let seekTo resolve too early.
        currentTime = value;
        setTimeout(() => {
          seeking = false;
          seekedEventFired = true;
          events.dispatch("seeked");
        }, 35);
      }
    }
  });
  const seekTo = loadSeekTo(el, {});
  const target = 1 / 24;
  const started = performance.now();
  await seekTo(target);
  const elapsed = performance.now() - started;
  assert.equal(seekedEventFired, true);
  assert.ok(elapsed >= 25, `resolved too early (${elapsed} ms)`);
  assert.ok(Math.abs(currentTime - target) < 1e-6);
});

test("skips a seek only when currentTime was already at the target before assignment", async () => {
  const events = makeEventTarget();
  let currentTime = 1 / 24;
  let setterCalls = 0;
  const el = Object.create(events);
  Object.defineProperties(el, {
    error: { value: null, writable: true },
    seeking: { get() { return false; } },
    currentTime: {
      get() { return currentTime; },
      set(value) { setterCalls++; currentTime = value; }
    }
  });
  const seekTo = loadSeekTo(el, {});
  await seekTo(1 / 24);
  assert.equal(setterCalls, 0, "the no-seek fast path must not assign currentTime");
});

test("sequential capture seeks to the preceding source frame and confirms the presented target", () => {
  const start = rendererHtml.indexOf("async seekVideoElement(el, target, timeoutMs)");
  const end = rendererHtml.indexOf("async seekVideoElementsAtTime(timelineTime)", start);
  assert.notEqual(start, -1, "seekVideoElement implementation must exist");
  assert.notEqual(end, -1, "seekVideoElementsAtTime implementation must exist");
  const method = rendererHtml.slice(start, end);
  assert.match(method, /const prerollTime = Math\.max\(0, expectedPresentationTime - sourceFrameInterval\)/,
    "must begin from the preceding measured source frame");
  assert.match(method, /await seekTo\(prerollTime\)/,
    "must seek to the prior source frame before playback");
  assert.match(method, /await waitForPresentedTargetWhilePlaying\(\)/,
    "must wait for compositor-confirmed target frame");
  assert.match(method, /el\.requestVideoFrameCallback/,
    "must use actual video-frame presentation metadata");
  assert.match(method, /frameConfirmation = "preroll\+requestVideoFrameCallback"/,
    "must record presentation callback as confirmation");
});

test("presentation-time tolerance follows measured source frame interval", () => {
  const tolerance = getDeclaration(
    "function sourceFramePresentationTolerance",
    "function isPresentedSourceFrameForTarget",
    "sourceFramePresentationTolerance",
    { Number, Math }
  );
  const isPresented = getDeclaration(
    "function isPresentedSourceFrameForTarget",
    "const Exporter =",
    "isPresentedSourceFrameForTarget",
    { Number, Math, sourceFramePresentationTolerance: tolerance }
  );
  const frame24 = 1 / 24;
  assert.equal(isPresented(0, frame24, frame24), false, "a stale previous frame must not match the next 24 FPS target");
  assert.equal(isPresented(frame24, frame24, frame24), true, "the correct source frame must match");
  assert.equal(isPresented(5 / 24, 4 / 24, frame24), false, "a one-frame-late callback must be rejected");
  assert.equal(isPresented(1 / 24, 1 / 30, frame24), true, "nearest source frame can be accepted for 24-to-30 FPS conversion");
  assert.equal(isPresented(0, 1 / 60, frame24), true, "the current source frame remains valid when output time falls within its half-frame window");
});

test("video preparation measures source cadence on a probe without advancing the render element", () => {
  assert.match(rendererHtml, /async measureSourceFrameInterval\(el, fallbackFps, timeoutMs\)/,
    "must measure the actual source presentation cadence");
  const prepStart = rendererHtml.indexOf("async prepareVideoElements() {");
  const prepEnd = rendererHtml.indexOf("async waitForVideoData(el, timeoutMs)", prepStart);
  const method = rendererHtml.slice(prepStart, prepEnd);
  assert.match(method, /const cadenceProbe = document\.createElement\("video"\)/,
    "preparation must create an independent probe decoder");
  assert.match(method, /await this\.measureSourceFrameInterval\(cadenceProbe,\s*fallbackFps,\s*1800\)/,
    "video preparation must measure cadence on the probe, not on the render element");
  assert.doesNotMatch(method, /await this\.measureSourceFrameInterval\(el,/,
    "preparation must not advance the export element before initial-frame confirmation");
  assert.match(method, /this\.state\.sourceFrameIntervalsByElement\.set\(el,\s*measuredSourceFrameInterval\)/,
    "measured source cadence must be saved against the render element");
  assert.match(method, /await this\.seekVideoElement\(el,/,
    "render element must still be aligned to clip source-in after probe measurement");
});

test("a paused currentTime alone is not treated as proof of a presented frame", () => {
  const start = rendererHtml.indexOf("async seekVideoElement(el, target, timeoutMs)");
  const end = rendererHtml.indexOf("async seekVideoElementsAtTime(timelineTime)", start);
  const method = rendererHtml.slice(start, end);
  assert.doesNotMatch(method, /frameConfirmation = "seeked\+readyState\+currentTime"/,
    "seeked and readyState alone do not confirm the displayed image");
  assert.match(method, /confirmedSourceFrameTimes/,
    "cached frames must come from a prior presentation confirmation");
  assert.match(method, /const presentationError = Math\.abs\(presentedTime - targetTime\)/,
    "final validation must use the presented frame timestamp when available");
});

test("MP4 uses ordered PNG frame export instead of the retired MediaRecorder frame loop", () => {
  const start = rendererHtml.indexOf("async exportPngSequenceToMp4(filename, format = {}, videoBitrate");
  const end = rendererHtml.indexOf("  cancel() {", start);
  const method = rendererHtml.slice(start, end);
  assert.match(method, /for \(let frameIndex = 0; frameIndex < plan\.frameCount; frameIndex\+\+\)/,
    "the exporter must iterate each planned frame exactly once and in order");
  assert.match(method, /writeFrameSequenceFrame\(\{[\s\S]*?index:\s*frameIndex/,
    "each PNG must be written using its exact frame index");
  assert.doesNotMatch(method, /MediaRecorder|captureStream|requestFrame/,
    "the active MP4 pipeline must not depend on realtime browser capture cadence");
  assert.doesNotMatch(rendererHtml, /startSequentialFrameLoop/,
    "the obsolete second sequential-capture implementation must stay removed");
});
