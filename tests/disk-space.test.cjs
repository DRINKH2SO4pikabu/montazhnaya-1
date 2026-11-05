"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const {
  MIB,
  estimateExportStorage,
  queryDiskSpace,
  sameVolume,
  assessDiskSpace,
  calculateRemainingRequirements,
  formatBytes
} = require("../electron/disk-space.cjs");

function standardEstimate(overrides = {}) {
  return estimateExportStorage({
    width: 1920,
    height: 1080,
    frameCount: 300,
    fps: 30,
    duration: 10,
    audioBytes: 12 * MIB,
    ...overrides
  });
}

test("export storage estimate scales with output dimensions and frame count", () => {
  const base = standardEstimate();
  const doubleFrames = standardEstimate({ frameCount: 600, duration: 20 });
  const fourK = standardEstimate({ width: 3840, height: 2160 });
  assert.ok(base.pngUpperBytes > base.pngExpectedBytes);
  assert.ok(doubleFrames.pngExpectedBytes > base.pngExpectedBytes * 1.99);
  assert.ok(fourK.pngExpectedBytes > base.pngExpectedBytes * 3.9);
  assert.ok(base.mp4UpperBytes > base.mp4ExpectedBytes);
  assert.ok(base.reserveBytes >= 256 * MIB);
});

test("estimate rejects unsafe dimensions, duration, FPS and WAV size", () => {
  assert.throws(() => estimateExportStorage({ width: 0, height: 1080, frameCount: 30, fps: 30, duration: 1 }), /Ширина кадра/);
  assert.throws(() => estimateExportStorage({ width: 1920, height: 1080, frameCount: 30, fps: 121, duration: 1 }), /FPS/);
  assert.throws(() => estimateExportStorage({ width: 1920, height: 1080, frameCount: 30, fps: 30, duration: 0 }), /Длительность/);
  assert.throws(() => estimateExportStorage({ width: 1920, height: 1080, frameCount: 30, fps: 30, duration: 1, audioBytes: 513 * MIB }), /WAV/);
});

test("same volume assessment combines temp files and final-copy headroom", () => {
  const estimate = standardEstimate();
  const sufficient = estimate.pngUpperBytes + estimate.audioBytes + estimate.mp4UpperBytes * 2 + estimate.reserveBytes + 1;
  const report = assessDiskSpace(estimate,
    { freeBytes: sufficient, deviceId: "1", root: "c:\\" },
    { freeBytes: sufficient, deviceId: "1", root: "c:\\" },
    true
  );
  assert.equal(report.status, "ok");
  assert.equal(report.checks.length, 1);
  assert.equal(report.checks[0].kind, "temporary");
});

test("separate temp/output disks are assessed independently", () => {
  const estimate = standardEstimate();
  const tempExpected = estimate.pngExpectedBytes + estimate.audioBytes + estimate.mp4ExpectedBytes + estimate.reserveBytes;
  const outputExpected = estimate.mp4ExpectedBytes + estimate.reserveBytes;
  const report = assessDiskSpace(estimate,
    { freeBytes: tempExpected + 1, deviceId: "1", root: "c:\\" },
    { freeBytes: outputExpected - 1, deviceId: "2", root: "d:\\" },
    false
  );
  assert.equal(report.status, "insufficient");
  assert.equal(report.checks.length, 2);
  assert.ok(report.issues.some(item => /диске сохранения MP4/.test(item.message)));
});

test("conservative shortfall is a warning, not a hard block", () => {
  const estimate = standardEstimate();
  const expected = estimate.pngExpectedBytes + estimate.audioBytes + estimate.mp4ExpectedBytes * 2 + estimate.reserveBytes;
  const conservative = estimate.pngUpperBytes + estimate.audioBytes + estimate.mp4UpperBytes * 2 + estimate.reserveBytes;
  const report = assessDiskSpace(estimate,
    { freeBytes: Math.floor((expected + conservative) / 2), deviceId: "1", root: "c:\\" },
    { freeBytes: 0, deviceId: "1", root: "c:\\" }, true
  );
  assert.equal(report.status, "warning");
});

test("PNG estimate warns when expected sequence exceeds the existing 2 GiB runtime cap", () => {
  const estimate = standardEstimate({ width: 3840, height: 2160, frameCount: 600, duration: 20 });
  assert.equal(estimate.expectedSequenceLimitExceeded, true);
  const report = assessDiskSpace(estimate,
    { freeBytes: 100 * 1024 * MIB, deviceId: "1", root: "c:\\" },
    { freeBytes: 100 * 1024 * MIB, deviceId: "1", root: "c:\\" }, true
  );
  assert.equal(report.status, "warning");
  assert.ok(report.issues.some(item => /внутренний предел последовательности 2 ГиБ/.test(item.message)));
});

test("runtime requirements account for remaining output, source frames, WAV, temp MP4 and final copy", () => {
  const estimate = standardEstimate();
  const requirements = calculateRemainingRequirements(estimate, {
    remainingOutputFrames: 100,
    pendingSourceFrames: 50,
    sourceWidth: 1280,
    sourceHeight: 720,
    includeAudioBytes: true,
    includeTempMp4: true,
    includeFinalCopy: true
  });
  assert.equal(requirements.remainingOutputBytes, 100 * estimate.pngUpperPerFrame);
  assert.ok(requirements.pendingSourceBytes > 50 * 1280 * 720 * 4 * 0.3);
  assert.equal(requirements.audioBytes, estimate.audioBytes);
  assert.equal(requirements.finalCopyBytes, estimate.mp4UpperBytes);
  assert.equal(requirements.temporaryRequiredBytes,
    requirements.remainingOutputBytes + requirements.pendingSourceBytes + requirements.audioBytes +
    requirements.tempMp4Bytes + requirements.finalCopyBytes + requirements.reserveBytes);
});


test("streamed MP4 reserves a bounded rolling source-frame cache instead of the full PNG sequence", () => {
  const estimate = standardEstimate({ width: 3840, height: 2160, frameCount: 9000, duration: 300, streamFrames: true, sourceVideoCount: 1 });
  assert.equal(estimate.streamFrames, true);
  assert.equal(estimate.diskPngExpectedBytes, 0);
  assert.equal(estimate.diskPngUpperBytes, 0);
  assert.equal(estimate.sourceFrameCacheLimitBytes, 512 * MIB);
  const report = assessDiskSpace(estimate,
    { freeBytes: 20 * 1024 * MIB, deviceId: "1", root: "c:\\" },
    { freeBytes: 20 * 1024 * MIB, deviceId: "1", root: "c:\\" }, true);
  assert.equal(report.status, "ok");
  assert.ok(!report.issues.some(item => /2 ГиБ/.test(item.message)));
  assert.ok(report.checks[0].expectedBytes >= 512 * MIB);
});

test("runtime source-window estimate reserves raw RGBA bytes for lossless PNG cache writes", () => {
  const estimate = estimateExportStorage({
    width: 1920, height: 1080, frameCount: 300, fps: 30, duration: 10,
    audioBytes: 0, streamFrames: true, sourceVideoCount: 1
  });
  const remaining = calculateRemainingRequirements(estimate, {
    pendingSourceFrames: 4, sourceWidth: 3840, sourceHeight: 2160,
    includeAudioBytes: false, includeTempMp4: false, includeFinalCopy: false
  });
  assert.ok(remaining.temporaryRequiredBytes >= 4 * (3840 * 2160 * 4));
});

test("streaming runtime checks do not count final PNG frames as disk files", () => {
  const estimate = standardEstimate({ streamFrames: true, sourceVideoCount: 1 });
  const requirements = calculateRemainingRequirements(estimate, {
    remainingOutputFrames: 100000,
    pendingSourceFrames: 8,
    sourceWidth: 3840,
    sourceHeight: 2160,
    includeAudioBytes: false
  });
  assert.equal(requirements.remainingOutputBytes, 0);
  assert.ok(requirements.pendingSourceBytes > 0);
});

test("queryDiskSpace returns a real available-byte value and volume identity", async () => {
  const result = await queryDiskSpace(os.tmpdir());
  assert.ok(Number.isFinite(result.freeBytes) && result.freeBytes > 0);
  assert.equal(typeof result.root, "string");
  assert.ok(result.deviceId == null || typeof result.deviceId === "string");
});

test("queryDiskSpace can be tested with an injected filesystem adapter", async () => {
  const fakeFs = {
    statfs: async () => ({ bsize: 4096, bavail: 100 }),
    stat: async () => ({ dev: 55 })
  };
  const result = await queryDiskSpace("C:\\Temp", fakeFs);
  assert.equal(result.freeBytes, 409600);
  assert.equal(result.deviceId, "55");
  assert.equal(result.root, path.parse(path.resolve("C:\\Temp")).root.toLowerCase());
});

test("sameVolume uses device identity and only falls back to normalized roots", () => {
  assert.equal(sameVolume({ deviceId: "10", root: "c:\\" }, { deviceId: "10", root: "d:\\" }), true);
  assert.equal(sameVolume({ deviceId: "10", root: "c:\\" }, { deviceId: "11", root: "c:\\" }), false);
  assert.equal(sameVolume({ deviceId: "0", root: "c:\\" }, { deviceId: "0", root: "c:\\" }), true);
});

test("formatBytes provides readable units", () => {
  assert.equal(formatBytes(1024 * 1024), "1 МиБ");
  assert.equal(formatBytes(2 * 1024 * 1024 * 1024), "2.00 ГиБ");
  assert.equal(formatBytes(Number.NaN), "неизвестно");
});

test("MP4 export passes canvas dimensions and exact offline WAV byte size to main process", () => {
  const renderer = require("node:fs").readFileSync(path.join(__dirname, "..", "src", "renderer", "index.html"), "utf8");
  assert.match(renderer, /expectedWidth:\s*this\.state\.canvas\.width/);
  assert.match(renderer, /expectedHeight:\s*this\.state\.canvas\.height/);
  assert.match(renderer, /expectedAudioBytes:\s*expectedAudio\s*\?\s*this\.state\.offlineAudioBlob\.size\s*:\s*0/);
});

test("main process performs preflight and repeated runtime free-space checks", () => {
  const main = require("node:fs").readFileSync(path.join(__dirname, "..", "electron", "main.cjs"), "utf8");
  assert.match(main, /inspectExportDiskSpace\(outputPath, settings\)/);
  assert.match(main, /dialog\.showMessageBox\(mainWindow[\s\S]*Недостаточно места для экспорта/);
  assert.match(main, /ensureSessionDiskSpace\(session/);
  assert.match(main, /ensureFinalOutputSpace\(session, outputInfo\.size\)/);
  assert.match(main, /queryDiskSpace\(session\.tempDir\)/);
});
