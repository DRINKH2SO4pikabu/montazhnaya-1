"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const mainPath = path.join(__dirname, "../electron/main.cjs");
const preloadPath = path.join(__dirname, "../electron/preload.cjs");
const rendererPath = path.join(__dirname, "../src/renderer/index.html");

test("local MP4 encoding is managed, cancellable and reports progress over IPC", () => {
  const main = fs.readFileSync(mainPath, "utf8");
  const preload = fs.readFileSync(preloadPath, "utf8");
  const renderer = fs.readFileSync(rendererPath, "utf8");
  assert.match(main, /const ffmpegExecutable = await resolveExecutable\("ffmpeg"\)/);
  assert.match(main, /startManagedProcess\(ffmpegExecutable/);
  assert.match(main, /session\.ffmpegJob\s*=\s*ffmpegJob/);
  assert.match(main, /session\.ffmpegJob\.cancel\(\)/);
  assert.match(main, /webContents\.send\("export:ffmpeg-progress"/);
  assert.match(preload, /onFrameSequenceProgress/);
  assert.match(preload, /removeListener\("export:ffmpeg-progress"/);
  assert.match(renderer, /api\.cancelFrameSequenceExport\(\{ sessionId \}\)/);
  assert.match(renderer, /progress\.stage === "encoding"/);
  assert.match(renderer, /progress\.stage === "verifying"[\s\S]*?this\.dom\.cancel\.disabled = true/);
  assert.doesNotMatch(renderer, /Локальную конвертацию нельзя прервать из окна экспорта/);
});
