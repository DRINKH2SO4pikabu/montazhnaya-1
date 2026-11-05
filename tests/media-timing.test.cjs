"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeFrameTimestamps, MAX_SAMPLE_TIMESTAMPS } = require("../electron/media-timing.cjs");

function makeTimestamps(count, fps, transform = (timestamp) => timestamp) {
  return Array.from({ length: count }, (_, index) => transform(index / fps, index)
    .toFixed(6)).join("\n");
}

test("accepts a complete, uniform 30 FPS timestamp sequence", () => {
  const analyzed = analyzeFrameTimestamps(makeTimestamps(210, 30), 30, 210, true);

  assert.equal(analyzed.allFramesInspected, true);
  assert.equal(analyzed.timestampsComplete, true);
  assert.equal(analyzed.timestampCount, 210);
  assert.equal(analyzed.missingTimestampCount, 0);
  assert.equal(analyzed.nonMonotonicCount, 0);
  assert.equal(analyzed.longGapCount, 0);
  assert.equal(analyzed.intervalDeviationCount, 0);
  assert.ok(Math.abs(analyzed.ptsMeasuredFps - 30) < 0.001);
});

test("detects a timestamp gap after frame 300 instead of checking only the beginning", () => {
  const timestamps = makeTimestamps(420, 30, (timestamp, index) =>
    timestamp + (index >= 350 ? 0.1 : 0));
  const analyzed = analyzeFrameTimestamps(timestamps, 30, 420, true);

  assert.equal(analyzed.sampledFrameCount, MAX_SAMPLE_TIMESTAMPS);
  assert.equal(analyzed.sampledTimestamps.length, MAX_SAMPLE_TIMESTAMPS);
  assert.equal(analyzed.timestampsComplete, true);
  assert.equal(analyzed.longGapCount, 1);
  assert.equal(analyzed.intervalDeviationCount, 1);
});

test("detects repeated or out-of-order PTS", () => {
  const analyzed = analyzeFrameTimestamps("0.000000\n0.033333\n0.033333\n0.100000", 30, 4, true);

  assert.equal(analyzed.timestampsComplete, true);
  assert.equal(analyzed.nonMonotonicCount, 1);
  assert.ok(analyzed.intervalDeviationCount >= 1);
});

test("does not claim complete verification when a frame timestamp is missing", () => {
  const analyzed = analyzeFrameTimestamps("0.000000\n0.033333\nN/A\n0.100000", 30, 4, true);

  assert.equal(analyzed.timestampCount, 3);
  assert.equal(analyzed.missingTimestampCount, 1);
  assert.equal(analyzed.timestampsComplete, false);
});

test("sample mode remains bounded and does not claim a full-file PTS audit", () => {
  const firstSamples = makeTimestamps(450, 30).split("\n").slice(0, MAX_SAMPLE_TIMESTAMPS).join("\n");
  const analyzed = analyzeFrameTimestamps(firstSamples, 30, 450, false);

  assert.equal(analyzed.allFramesInspected, false);
  assert.equal(analyzed.timestampsComplete, false);
  assert.equal(analyzed.sampledFrameCount, MAX_SAMPLE_TIMESTAMPS);
  assert.equal(analyzed.timestampCount, MAX_SAMPLE_TIMESTAMPS);
});

test("accepts a timestamp followed by H.264 side-data text in ffprobe CSV", () => {
  const analyzed = analyzeFrameTimestamps(
    "0.000000,H.26[45] User Data Unregistered SEI message\n0.033333\n0.066667",
    30,
    3,
    true
  );

  assert.equal(analyzed.timestampsComplete, true);
  assert.equal(analyzed.timestampCount, 3);
  assert.equal(analyzed.missingTimestampCount, 0);
  assert.equal(analyzed.longGapCount, 0);
});
