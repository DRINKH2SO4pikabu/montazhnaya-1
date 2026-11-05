"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const {
  resolveExecutable,
  parseEncoderSupport,
  parseDecoderSupport,
  parseMuxerSupport,
  parseHardwareAccelerationSupport,
  collectToolDiagnostics
} = require("../electron/tool-diagnostics.cjs");

async function makeExecutable(directory, name, body = "#!/bin/sh\nexit 0\n") {
  const filePath = path.join(directory, name);
  await fs.writeFile(filePath, body, { mode: 0o755 });
  await fs.chmod(filePath, 0o755);
  return filePath;
}

test("hardware acceleration parser recognizes CUDA/NVDEC support without inferring a physical GPU", () => {
  const methods = parseHardwareAccelerationSupport("Hardware acceleration methods:\ncuda\ndxva2\nd3d11va\n");
  assert.ok(methods.has("cuda"));
  assert.ok(methods.has("dxva2"));
  assert.equal(methods.has("nvenc"), false);
});

test("resolveExecutable finds executable in PATH", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-diag-path-"));
  try {
    const bin = path.join(root, "bin");
    await fs.mkdir(bin);
    const platform = process.platform;
    const executableName = platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    const expected = await makeExecutable(bin, executableName);
    const found = await resolveExecutable("ffmpeg", { platform, env: { PATH: bin } });
    assert.equal(found, expected);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("resolveExecutable prefers explicit FFMPEG_PATH", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-diag-override-"));
  try {
    const pathBin = path.join(root, "path");
    const overrideBin = path.join(root, "override");
    await fs.mkdir(pathBin);
    await fs.mkdir(overrideBin);
    await makeExecutable(pathBin, "ffmpeg");
    const expected = await makeExecutable(overrideBin, "custom-ffmpeg");
    const found = await resolveExecutable("ffmpeg", {
      platform: "linux",
      env: { PATH: pathBin, FFMPEG_PATH: expected }
    });
    assert.equal(found, expected);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("resolveExecutable returns null when tool is absent", async () => {
  const found = await resolveExecutable("ffprobe", { platform: "linux", env: { PATH: "" } });
  assert.equal(found, null);
});

test("capability parsers identify required FFmpeg components", () => {
  const encoders = parseEncoderSupport(" V....D libx264 H.264 encoder\n A....D aac AAC encoder\n V..... mpeg4 MPEG-4 encoder");
  const decoders = parseDecoderSupport(" V....D png PNG image decoder\n V....D h264 H.264 decoder");
  const muxers = parseMuxerSupport(" E mp4 MP4 container\n E matroska Matroska container\n E webm WebM container\n D mov MOV demuxer");
  assert.ok(encoders.has("libx264"));
  assert.ok(encoders.has("aac"));
  assert.ok(encoders.has("mpeg4"));
  assert.ok(decoders.has("png"));
  assert.ok(muxers.has("mp4"));
  assert.ok(muxers.has("matroska"));
});

test("diagnostics return actionable missing-tool result without throwing", async () => {
  const report = await collectToolDiagnostics({ env: { PATH: "" }, platform: "linux" });
  assert.equal(report.tools.ffmpeg.status, "missing");
  assert.equal(report.tools.ffprobe.status, "missing");
  assert.equal(report.exportReady, false);
  assert.ok(report.warnings.some((message) => message.includes("FFmpeg")));
});

test("live FFmpeg/ffprobe diagnostic can encode and inspect a tiny MP4", async (t) => {
  const pathValue = process.env.PATH || "";
  const hasFfmpeg = pathValue.split(path.delimiter).some((dir) => require("node:fs").existsSync(path.join(dir, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg")));
  const hasFfprobe = pathValue.split(path.delimiter).some((dir) => require("node:fs").existsSync(path.join(dir, process.platform === "win32" ? "ffprobe.exe" : "ffprobe")));
  if (!hasFfmpeg || !hasFfprobe) return t.skip("FFmpeg/ffprobe are not installed in this test environment.");

  const ffmpegPath = pathValue.split(path.delimiter).map(dir => path.join(dir, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg")).find(file => require("node:fs").existsSync(file));
  const ffprobePath = pathValue.split(path.delimiter).map(dir => path.join(dir, process.platform === "win32" ? "ffprobe.exe" : "ffprobe")).find(file => require("node:fs").existsSync(file));
  const report = await collectToolDiagnostics({ env: { PATH: "", FFMPEG_PATH: ffmpegPath, FFPROBE_PATH: ffprobePath } });
  assert.equal(report.tools.ffmpeg.status, "ok");
  assert.equal(report.tools.ffprobe.status, "ok");
  assert.equal(report.capabilities.h264Encoder.available, true);
  assert.equal(report.capabilities.aacEncoder.available, true);
  assert.equal(report.capabilities.mp4Muxer.available, true);
  assert.equal(report.capabilities.pngDecoder.available, true);
  assert.equal(report.smokeTest.videoOnly.status, "passed", report.smokeTest.videoOnly.message);
  assert.equal(report.smokeTest.withAudio.status, "passed", report.smokeTest.withAudio.message);
  assert.equal(report.exportReady, true);
  assert.equal(report.audioReady, true);
  assert.equal(report.smokeTest.webmVp8.status, "passed", report.smokeTest.webmVp8.message);
  assert.equal(report.smokeTest.webmVp9.status, "passed", report.smokeTest.webmVp9.message);
  assert.equal(report.webmVp8Ready, true);
  assert.equal(report.webmVp9Ready, true);
  assert.deepEqual(report.smokeTest.withAudio.streams, [
    { type: "video", codec: "h264" },
    { type: "audio", codec: "aac" }
  ]);
});

test("tool diagnostics are wired through a narrow preload API and trusted main-process IPC", async () => {
  const preload = await fs.readFile(path.join(__dirname, "..", "electron", "preload.cjs"), "utf8");
  const main = await fs.readFile(path.join(__dirname, "..", "electron", "main.cjs"), "utf8");
  const renderer = await fs.readFile(path.join(__dirname, "..", "src", "renderer", "index.html"), "utf8");
  assert.match(preload, /runToolDiagnostics:\s*\(\)\s*=>\s*invokeIpc\("system:tool-diagnostics"\)/);
  assert.match(main, /registerStructuredIpcHandler\(ipcMain, "system:tool-diagnostics",\s*handleToolDiagnostics\)/);
  assert.match(main, /async function handleToolDiagnostics\(event\)[\s\S]{0,220}isTrustedExportSender\(event\)/);
  assert.match(main, /resolveExecutable\(executable\)/);
  assert.match(main, /const ffmpegExecutable = await resolveExecutable\("ffmpeg"\)/);
  assert.doesNotMatch(main, /checkToolAvailability/);
  assert.match(renderer, /data-action="tool-diagnostics"/);
  assert.match(renderer, /function openToolDiagnosticsDialog\(\)/);
});

test("Windows executable lookup accepts ffmpeg.exe in a semicolon-delimited PATH", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-diag-winpath-"));
  try {
    const bin = path.join(root, "Program Files", "FFmpeg", "bin");
    await fs.mkdir(bin, { recursive: true });
    const expected = await makeExecutable(bin, "ffmpeg.exe");
    const found = await resolveExecutable("ffmpeg", { platform: "win32", env: { PATH: `${root};${bin}` } });
    assert.equal(found, expected);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});


test("capability parsers identify VP8, VP9, Opus and WebM components", () => {
  const encoders = parseEncoderSupport(" V....D libvpx VP8 encoder\n V....D libvpx-vp9 VP9 encoder\n A....D libopus Opus encoder");
  const muxers = parseMuxerSupport(" E webm WebM container\n D matroska Matroska demuxer");
  assert.ok(encoders.has("libvpx"));
  assert.ok(encoders.has("libvpx-vp9"));
  assert.ok(encoders.has("libopus"));
  assert.ok(muxers.has("webm"));
});
