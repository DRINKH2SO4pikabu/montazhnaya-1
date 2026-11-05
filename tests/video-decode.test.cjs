"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  SAFE_NVDEC_DOWNLOAD_FORMATS,
  getNvdecDownloadPixelFormat,
  selectSourceDecoder,
  runExtractionWithNvdecFallback,
  buildNvdecProbeArgs
} = require("../electron/video-decode.cjs");
const { buildSourceFrameExtractionFfmpegArgs } = require("../electron/frame-sequence.cjs");

test("NVDEC maps only known 8-bit and 10-bit 4:2:0 formats to safe download formats", () => {
  assert.equal(getNvdecDownloadPixelFormat("yuv420p"), "nv12");
  assert.equal(getNvdecDownloadPixelFormat("yuvj420p"), "nv12");
  assert.equal(getNvdecDownloadPixelFormat("nv12"), "nv12");
  assert.equal(getNvdecDownloadPixelFormat("yuv420p10le"), "p010le");
  assert.equal(getNvdecDownloadPixelFormat("p010le"), "p010le");
  assert.equal(getNvdecDownloadPixelFormat("yuv422p"), null);
  assert.equal(getNvdecDownloadPixelFormat("yuv444p"), null);
  assert.equal(getNvdecDownloadPixelFormat(null), null);
  assert.deepEqual(Object.keys(SAFE_NVDEC_DOWNLOAD_FORMATS).sort(), [
    "nv12", "p010le", "yuv420p", "yuv420p10le", "yuvj420p"
  ]);
});

test("NVDEC is enabled only after a real source-specific probe succeeds", async () => {
  let probedFormat = null;
  const result = await selectSourceDecoder({
    sourcePixelFormat: "yuv420p",
    probeNvdec: async (format) => { probedFormat = format; }
  });
  assert.equal(probedFormat, "nv12");
  assert.deepEqual(result, { mode: "cuda", downloadPixelFormat: "nv12", reason: null });
});

test("unsupported pixel formats stay on software decode without probing", async () => {
  let called = false;
  const result = await selectSourceDecoder({
    sourcePixelFormat: "yuv422p",
    probeNvdec: async () => { called = true; }
  });
  assert.equal(called, false);
  assert.equal(result.mode, "software");
  assert.equal(result.downloadPixelFormat, null);
  assert.match(result.reason, /yuv422p/);
});

test("NVDEC runtime failure falls back to software decode without failing the export", async () => {
  const result = await selectSourceDecoder({
    sourcePixelFormat: "yuv420p",
    probeNvdec: async () => { throw new Error("CUDA driver API mismatch"); }
  });
  assert.deepEqual(result, {
    mode: "software",
    downloadPixelFormat: null,
    reason: "CUDA driver API mismatch"
  });
});

test("NVDEC probe exercises decode and hardware-to-system-memory transfer", () => {
  const args = buildNvdecProbeArgs({
    inputPath: "C:\\Temp\\source.mp4",
    downloadPixelFormat: "nv12",
    nullOutputPath: "NUL"
  });
  assert.ok(args.includes("-hwaccel") && args[args.indexOf("-hwaccel") + 1] === "cuda");
  assert.ok(args.includes("-hwaccel_output_format") && args[args.indexOf("-hwaccel_output_format") + 1] === "cuda");
  assert.ok(args.includes("hwdownload,format=nv12"));
  assert.ok(args.includes("-frames:v") && args[args.indexOf("-frames:v") + 1] === "1");
  assert.equal(args.at(-1), "NUL");
  assert.throws(() => buildNvdecProbeArgs({ inputPath: "", downloadPixelFormat: "nv12", nullOutputPath: "NUL" }), /NVDEC/);
});

test("NVDEC extraction keeps exact CFR/seek selection and downloads frames before CPU filters", () => {
  const args = buildSourceFrameExtractionFfmpegArgs({
    inputPath: "C:\\Temp\\source.mp4",
    outputPattern: "C:\\Temp\\frames\\frame_%06d.png",
    fps: 30,
    frameIndices: [56, 57, 60, 79],
    seekStartIndex: 56,
    sourceStartTime: 0,
    hardwareDecode: true,
    downloadPixelFormat: "nv12"
  });
  assert.ok(args.includes("-hwaccel") && args[args.indexOf("-hwaccel") + 1] === "cuda");
  assert.ok(args.includes("-hwaccel_output_format") && args[args.indexOf("-hwaccel_output_format") + 1] === "cuda");
  assert.ok(args.indexOf("-hwaccel") < args.indexOf("-i"));
  const filter = args[args.indexOf("-vf") + 1];
  assert.match(filter, /^hwdownload,format=nv12,/);
  assert.match(filter, /fps=fps=30:start_time=0:round=near/);
  assert.match(filter, /between\(n,0,1\)/);
  assert.match(filter, /eq\(n,4\)/);
  assert.equal(args[args.indexOf("-ss") + 1], "1.866666667");
});

test("software source extraction remains the unchanged default", () => {
  const args = buildSourceFrameExtractionFfmpegArgs({
    inputPath: "source.mp4", outputPattern: "frame_%06d.png", fps: 30,
    frameIndices: [0, 1]
  });
  assert.equal(args.includes("-hwaccel"), false);
  assert.doesNotMatch(args[args.indexOf("-vf") + 1], /hwdownload/);
});

test("NVDEC window failure retries with software decode and does not leak the hardware error", async () => {
  const attempts = [];
  const result = await runExtractionWithNvdecFallback({
    decoderMode: "cuda",
    runHardware: async () => { attempts.push("cuda"); throw new Error("decoder surface error"); },
    onNvdecFailure: async () => { attempts.push("reset-window"); },
    runSoftware: async () => { attempts.push("software"); return "frames-ready"; }
  });
  assert.deepEqual(attempts, ["cuda", "reset-window", "software"]);
  assert.equal(result.mode, "software");
  assert.equal(result.fallback, true);
  assert.equal(result.result, "frames-ready");
});

test("software decode path does not attempt NVDEC and propagates software errors", async () => {
  let hardwareCalls = 0;
  const result = await runExtractionWithNvdecFallback({
    decoderMode: "software",
    runHardware: async () => { hardwareCalls++; },
    runSoftware: async () => "software-frames"
  });
  assert.equal(hardwareCalls, 0);
  assert.deepEqual(result, { mode: "software", usedHardware: false, result: "software-frames", fallback: false });
  await assert.rejects(() => runExtractionWithNvdecFallback({
    decoderMode: "cuda",
    runHardware: async () => { throw new Error("CUDA failed"); },
    runSoftware: async () => { throw new Error("software failed too"); }
  }), /software failed too/);
});
