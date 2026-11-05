"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const { buildPngPipeFfmpegArgs, buildRawRgbaPipeFfmpegArgs } = require("../electron/frame-sequence.cjs");
const { startManagedProcess } = require("../electron/managed-process.cjs");

function toolExists(name) {
  const result = spawnSync(name, ["-version"], { stdio: "ignore", windowsHide: true });
  return !result.error && result.status === 0;
}

const hasFfmpeg = toolExists(process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
const hasFfprobe = toolExists(process.platform === "win32" ? "ffprobe.exe" : "ffprobe");

test("real FFmpeg encodes ordered PNG frames from binary stdin with CFR and AAC", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-image2pipe-test-"));
  const output = path.join(dir, "streamed.mp4");
  const audioPath = path.join(dir, "audio.wav");
  try {
    const png = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=0x336699:s=96x64:r=25",
      "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"
    ], { maxBuffer: 8 * 1024 * 1024, windowsHide: true });
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=2",
      "-ac", "2", "-c:a", "pcm_s16le", "-f", "wav", audioPath
    ], { windowsHide: true });
    const args = buildPngPipeFfmpegArgs({ outputPath: output, fps: 25, frameCount: 50, duration: 2, audioPath, audioExpected: true });
    const job = startManagedProcess("ffmpeg", ["-progress", "pipe:1", "-stats_period", "0.1", ...args], {
      timeoutMs: 60000, stdinMode: "binary", killGraceMs: 1500
    });
    for (let index = 0; index < 50; index++) await job.writeInput(png);
    await job.endInput();
    await job.promise;
    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-show_streams", "-show_format", "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    const video = probe.streams.find(stream => stream.codec_type === "video");
    const audio = probe.streams.find(stream => stream.codec_type === "audio");
    assert.ok(video);
    assert.ok(audio);
    assert.equal(video.codec_name, "h264");
    assert.equal(video.color_range, "tv");
    assert.equal(video.color_space, "bt709");
    assert.equal(video.color_transfer, "bt709");
    assert.equal(video.color_primaries, "bt709");
    assert.equal(audio.codec_name, "aac");
    assert.equal(Number(video.nb_frames), 50);
    assert.equal(video.r_frame_rate, "25/1");
    assert.ok(Math.abs(Number(probe.format.duration) - 2) < 0.05);
    const filesAfterExport = await fs.readdir(dir);
    assert.deepEqual(filesAfterExport.sort(), ["audio.wav", "streamed.mp4"]);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("real MP4 average bitrate follows the selected target instead of CRF quality mode", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-bitrate-control-"));
  const framesDir = path.join(dir, "frames");
  const output = path.join(dir, "target-bitrate.mp4");
  await fs.mkdir(framesDir);
  try {
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:r=30:duration=3",
      "-frames:v", "90", "-threads", "1", "-compression_level", "1", path.join(framesDir, "frame_%03d.png")
    ], { windowsHide: true });
    const args = buildPngPipeFfmpegArgs({
      outputPath: output, fps: 30, frameCount: 90, duration: 3,
      audioExpected: false, videoBitrate: 1_000_000
    });
    const job = startManagedProcess("ffmpeg", args, {
      timeoutMs: 120000, stdinMode: "binary", killGraceMs: 1500
    });
    for (let index = 1; index <= 90; index++) {
      const png = await fs.readFile(path.join(framesDir, `frame_${String(index).padStart(3, "0")}.png`));
      await job.writeInput(png);
    }
    await job.endInput();
    await job.promise;
    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0", "-show_entries",
      "stream=bit_rate,codec_name,width,height,avg_frame_rate,color_range,color_space,color_transfer,color_primaries",
      "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    const video = probe.streams[0];
    const actualBitrate = Number(video.bit_rate);
    assert.equal(video.codec_name, "h264");
    assert.equal(video.width, 640);
    assert.equal(video.height, 360);
    assert.equal(video.avg_frame_rate, "30/1");
    assert.ok(Number.isFinite(actualBitrate) && actualBitrate > 0, "ffprobe must report the measured video stream bitrate");
    assert.ok(actualBitrate <= 1_600_000, `actual bitrate ${(actualBitrate / 1e6).toFixed(2)} Mbps exceeded the selected 1 Mbps target tolerance`);
    assert.ok(actualBitrate >= 450_000, `actual bitrate ${(actualBitrate / 1e6).toFixed(2)} Mbps is implausibly low for this moving test pattern`);
    assert.equal(video.color_range, "tv");
    assert.equal(video.color_space, "bt709");
    assert.equal(video.color_transfer, "bt709");
    assert.equal(video.color_primaries, "bt709");
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("real FFmpeg encodes raw RGBA frames from binary stdin with BT.709 tags and exact CFR", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-raw-rgba-pipe-"));
  const output = path.join(dir, "raw-rgba.mp4");
  try {
    const rgbaFrame = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=160x90:r=24",
      "-frames:v", "1", "-pix_fmt", "rgba", "-f", "rawvideo", "pipe:1"
    ], { maxBuffer: 4 * 1024 * 1024, windowsHide: true });
    assert.equal(rgbaFrame.length, 160 * 90 * 4);
    const frameCount = 12;
    const fps = 24;
    const args = buildRawRgbaPipeFfmpegArgs({
      outputPath: output, width: 160, height: 90, fps, frameCount, duration: frameCount / fps,
      audioExpected: false, videoBitrate: 1_000_000, videoEncoder: "libx264"
    });
    const job = startManagedProcess("ffmpeg", args, {
      timeoutMs: 90000, stdinMode: "binary", killGraceMs: 1500
    });
    for (let index = 0; index < frameCount; index++) await job.writeInput(rgbaFrame);
    await job.endInput();
    await job.promise;
    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    const video = probe.streams.find(stream => stream.codec_type === "video");
    assert.ok(video);
    assert.equal(video.codec_name, "h264");
    assert.equal(video.width, 160);
    assert.equal(video.height, 90);
    assert.equal(video.pix_fmt, "yuv420p");
    assert.equal(video.color_range, "tv");
    assert.equal(video.color_space, "bt709");
    assert.equal(video.color_transfer, "bt709");
    assert.equal(video.color_primaries, "bt709");
    assert.equal(Number(video.nb_read_frames), frameCount);
    assert.equal(video.avg_frame_rate, `${fps}/1`);
    assert.ok(Math.abs(Number(probe.format.duration) - frameCount / fps) < 0.05);
    assert.deepEqual(await fs.readdir(dir), ["raw-rgba.mp4"]);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("real FFmpeg raw RGBA MP4 path preserves AAC audio and exact duration", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-raw-rgba-audio-"));
  const output = path.join(dir, "raw-rgba-audio.mp4");
  const audioPath = path.join(dir, "audio.wav");
  try {
    const rgbaFrame = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=160x90:r=24",
      "-frames:v", "1", "-pix_fmt", "rgba", "-f", "rawvideo", "pipe:1"
    ], { maxBuffer: 4 * 1024 * 1024, windowsHide: true });
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=0.5",
      "-ac", "2", "-c:a", "pcm_s16le", "-f", "wav", audioPath
    ], { windowsHide: true });
    const frameCount = 12;
    const fps = 24;
    const args = buildRawRgbaPipeFfmpegArgs({
      outputPath: output, width: 160, height: 90, fps, frameCount, duration: frameCount / fps,
      audioPath, audioExpected: true, videoBitrate: 1_000_000, videoEncoder: "libx264"
    });
    const job = startManagedProcess("ffmpeg", args, {
      timeoutMs: 90000, stdinMode: "binary", killGraceMs: 1500
    });
    for (let index = 0; index < frameCount; index++) await job.writeInput(rgbaFrame);
    await job.endInput();
    await job.promise;
    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-show_streams", "-show_format", "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    const video = probe.streams.find(stream => stream.codec_type === "video");
    const audio = probe.streams.find(stream => stream.codec_type === "audio");
    assert.ok(video);
    assert.ok(audio);
    assert.equal(video.codec_name, "h264");
    assert.equal(audio.codec_name, "aac");
    assert.equal(video.avg_frame_rate, "24/1");
    assert.equal(Number(video.nb_frames), frameCount);
    assert.ok(Math.abs(Number(probe.format.duration) - 0.5) < 0.06);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("real FFmpeg accepts full-size 4K UHD RGBA rawvideo frames within the IPC frame cap", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-raw-rgba-4k-"));
  const output = path.join(dir, "raw-rgba-4k.mp4");
  try {
    const width = 3840;
    const height = 2160;
    const rgbaFrame = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", `testsrc2=size=${width}x${height}:r=1`,
      "-frames:v", "1", "-pix_fmt", "rgba", "-f", "rawvideo", "pipe:1"
    ], { maxBuffer: 48 * 1024 * 1024, windowsHide: true });
    assert.equal(rgbaFrame.length, width * height * 4);
    assert.ok(rgbaFrame.length < 32 * 1024 * 1024);
    const frameCount = 2;
    const fps = 60;
    const args = buildRawRgbaPipeFfmpegArgs({
      outputPath: output, width, height, fps, frameCount, duration: frameCount / fps,
      audioExpected: false, videoBitrate: 5_000_000, videoEncoder: "libx264"
    });
    const job = startManagedProcess("ffmpeg", args, {
      timeoutMs: 120000, stdinMode: "binary", killGraceMs: 1500
    });
    for (let index = 0; index < frameCount; index++) await job.writeInput(rgbaFrame);
    await job.endInput();
    await job.promise;
    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-count_frames", "-show_entries",
      "stream=codec_name,width,height,pix_fmt,avg_frame_rate,nb_read_frames,color_range,color_space,color_transfer,color_primaries",
      "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    const video = probe.streams[0];
    assert.equal(video.codec_name, "h264");
    assert.equal(video.width, width);
    assert.equal(video.height, height);
    assert.equal(video.pix_fmt, "yuv420p");
    assert.equal(video.avg_frame_rate, "60/1");
    assert.equal(Number(video.nb_read_frames), frameCount);
    assert.equal(video.color_range, "tv");
    assert.equal(video.color_space, "bt709");
    assert.equal(video.color_transfer, "bt709");
    assert.equal(video.color_primaries, "bt709");
    assert.deepEqual(await fs.readdir(dir), ["raw-rgba-4k.mp4"]);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("real FFmpeg image2pipe process can be cancelled without injecting text into PNG data", { skip: !hasFfmpeg }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-image2pipe-cancel-"));
  const output = path.join(dir, "cancelled.mp4");
  try {
    const args = [
      "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-vcodec", "png", "-framerate", "30", "-i", "pipe:0",
      "-frames:v", "100000", "-c:v", "libx264", "-pix_fmt", "yuv420p", output
    ];
    const job = startManagedProcess("ffmpeg", args, { timeoutMs: 60000, stdinMode: "binary", killGraceMs: 500 });
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(job.cancel(), true);
    await assert.rejects(job.promise, error => error.code === "PROCESS_CANCELLED");
    assert.equal(job.settled, true);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});


test("real FFmpeg streams 4K PNG frames to MP4 without a numbered frame sequence on disk", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-image2pipe-4k-"));
  const output = path.join(dir, "streamed-4k.mp4");
  try {
    const png = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=3840x2160:r=24",
      "-frames:v", "1", "-threads", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"
    ], { maxBuffer: 64 * 1024 * 1024, windowsHide: true });
    assert.ok(png.length > 8);
    const args = buildPngPipeFfmpegArgs({ outputPath: output, fps: 24, frameCount: 3, duration: 3 / 24, audioExpected: false });
    const job = startManagedProcess("ffmpeg", ["-progress", "pipe:1", "-stats_period", "0.1", ...args], {
      timeoutMs: 120000, stdinMode: "binary", killGraceMs: 1500
    });
    for (let index = 0; index < 3; index++) await job.writeInput(png);
    await job.endInput();
    await job.promise;
    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,nb_frames,r_frame_rate,codec_name,color_range,color_space,color_transfer,color_primaries",
      "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    const video = probe.streams[0];
    assert.equal(video.width, 3840);
    assert.equal(video.height, 2160);
    assert.equal(video.nb_frames, "3");
    assert.equal(video.r_frame_rate, "24/1");
    assert.equal(video.codec_name, "h264");
    assert.equal(video.color_range, "tv");
    assert.equal(video.color_space, "bt709");
    assert.equal(video.color_transfer, "bt709");
    assert.equal(video.color_primaries, "bt709");
    assert.deepEqual(await fs.readdir(dir), ["streamed-4k.mp4"]);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});


test("real FFmpeg streams WebM VP8 plus Opus with exact CFR timestamps at 25 FPS", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-webm-vp8-"));
  const output = path.join(dir, "streamed-vp8.webm");
  const audioPath = path.join(dir, "audio.wav");
  try {
    const png = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=160x90:r=25",
      "-frames:v", "1", "-threads", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"
    ], { maxBuffer: 8 * 1024 * 1024, windowsHide: true });
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=1",
      "-ac", "2", "-c:a", "pcm_s16le", "-f", "wav", audioPath
    ], { windowsHide: true });
    const args = buildPngPipeFfmpegArgs({
      outputPath: output, fps: 25, frameCount: 25, duration: 1, audioPath, audioExpected: true,
      outputFormat: "webm", videoCodec: "vp8", audioCodec: "opus"
    });
    const job = startManagedProcess("ffmpeg", ["-progress", "pipe:1", "-stats_period", "0.1", ...args], {
      timeoutMs: 90000, stdinMode: "binary", killGraceMs: 1500
    });
    for (let index = 0; index < 25; index++) await job.writeInput(png);
    await job.endInput();
    await job.promise;
    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    const video = probe.streams.find(stream => stream.codec_type === "video");
    const audio = probe.streams.find(stream => stream.codec_type === "audio");
    assert.ok(video);
    assert.ok(audio);
    assert.ok(String(probe.format.format_name).split(",").includes("webm"));
    assert.equal(video.codec_name, "vp8");
    assert.equal(video.color_range, "tv");
    assert.equal(video.color_space, "bt709");
    assert.equal(video.color_transfer, "bt709");
    assert.equal(video.color_primaries, "bt709");
    assert.equal(video.pix_fmt, "yuv420p");
    assert.equal(Number(video.nb_read_frames), 25);
    assert.equal(video.avg_frame_rate, "25/1");
    assert.equal(audio.codec_name, "opus");
    const packetProbe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "a:0", "-show_packets",
      "-show_entries", "packet=pts_time,duration_time", "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    assert.ok(packetProbe.packets.length > 0, "Opus packets must have timestamps");
    const firstPts = Number(packetProbe.packets[0].pts_time);
    const last = packetProbe.packets.at(-1);
    const audioEnd = Number(last.pts_time) + Number(last.duration_time);
    assert.ok(Number.isFinite(firstPts) && Number.isFinite(audioEnd));
    assert.ok(Math.abs((audioEnd - firstPts) - 1) < 0.2, "Opus packet span must cover the target audio duration");
    assert.deepEqual((await fs.readdir(dir)).sort(), ["audio.wav", "streamed-vp8.webm"]);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});


test("real FFmpeg streams WebM VP9 plus Opus with exact CFR timestamps at 60 FPS", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-webm-vp9-"));
  const output = path.join(dir, "streamed-vp9.webm");
  const audioPath = path.join(dir, "audio.wav");
  try {
    const png = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=160x90:r=60",
      "-frames:v", "1", "-threads", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"
    ], { maxBuffer: 8 * 1024 * 1024, windowsHide: true });
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=660:sample_rate=48000:duration=1",
      "-ac", "2", "-c:a", "pcm_s16le", "-f", "wav", audioPath
    ], { windowsHide: true });
    const args = buildPngPipeFfmpegArgs({
      outputPath: output, fps: 60, frameCount: 60, duration: 1, audioPath, audioExpected: true,
      outputFormat: "webm", videoCodec: "vp9", audioCodec: "opus"
    });
    const job = startManagedProcess("ffmpeg", ["-progress", "pipe:1", "-stats_period", "0.1", ...args], {
      timeoutMs: 120000, stdinMode: "binary", killGraceMs: 1500
    });
    for (let index = 0; index < 60; index++) await job.writeInput(png);
    await job.endInput();
    await job.promise;
    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    const video = probe.streams.find(stream => stream.codec_type === "video");
    const audio = probe.streams.find(stream => stream.codec_type === "audio");
    assert.ok(video && audio);
    assert.ok(String(probe.format.format_name).split(",").includes("webm"));
    assert.equal(video.codec_name, "vp9");
    assert.equal(video.color_range, "tv");
    assert.equal(video.color_space, "bt709");
    assert.equal(video.color_transfer, "bt709");
    assert.equal(video.color_primaries, "bt709");
    assert.equal(video.pix_fmt, "yuv420p");
    assert.equal(Number(video.nb_read_frames), 60);
    assert.equal(video.avg_frame_rate, "60/1");
    assert.equal(audio.codec_name, "opus");
    const timingCsv = execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0", "-show_frames",
      "-show_entries", "frame=best_effort_timestamp_time", "-of", "csv=p=0", output
    ], { encoding: "utf8", windowsHide: true });
    const { analyzeFrameTimestamps } = require("../electron/media-timing.cjs");
    const timing = analyzeFrameTimestamps(timingCsv, 60, 60, true, 0.0011);
    assert.equal(timing.timestampsComplete, true);
    assert.equal(timing.intervalDeviationCount, 0);
    assert.equal(timing.nonMonotonicCount, 0);
    assert.equal(timing.longGapCount, 0);
    const packetProbe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "a:0", "-show_packets",
      "-show_entries", "packet=pts_time,duration_time", "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    assert.ok(packetProbe.packets.length > 0);
    const firstPts = Number(packetProbe.packets[0].pts_time);
    const last = packetProbe.packets.at(-1);
    const audioEnd = Number(last.pts_time) + Number(last.duration_time);
    assert.ok(Math.abs((audioEnd - firstPts) - 1) < 0.2);
    assert.deepEqual((await fs.readdir(dir)).sort(), ["audio.wav", "streamed-vp9.webm"]);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("real MP4 export marks BT.709 limited-range video and preserves RGB reference within codec tolerance", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-color-parity-"));
  const output = path.join(dir, "color-parity.mp4");
  try {
    const png = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=0x336699:s=96x64:r=1",
      "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"
    ], { maxBuffer: 8 * 1024 * 1024, windowsHide: true });
    const referenceRgb = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-frames:v", "1",
      "-vf", "colorspace=ispace=gbr:irange=pc:iprimaries=bt709:itrc=iec61966-2-1:space=bt709:range=tv:primaries=bt709:trc=bt709:format=yuv420p",
      "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"
    ], { input: png, maxBuffer: 8 * 1024 * 1024, windowsHide: true });

    const args = buildPngPipeFfmpegArgs({
      outputPath: output, fps: 1, frameCount: 1, duration: 1, audioExpected: false
    });
    const job = startManagedProcess("ffmpeg", args, {
      timeoutMs: 60000, stdinMode: "binary", killGraceMs: 1500
    });
    await job.writeInput(png);
    await job.endInput();
    await job.promise;

    const probe = JSON.parse(execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0", "-show_streams", "-of", "json", output
    ], { encoding: "utf8", windowsHide: true }));
    const video = probe.streams[0];
    assert.equal(video.color_range, "tv");
    assert.equal(video.color_space, "bt709");
    assert.equal(video.color_transfer, "bt709");
    assert.equal(video.color_primaries, "bt709");

    const renderedRgb = execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-i", output, "-frames:v", "1",
      "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"
    ], { maxBuffer: 8 * 1024 * 1024, windowsHide: true });
    assert.equal(renderedRgb.length, referenceRgb.length);
    let absoluteError = 0;
    let maximumError = 0;
    for (let index = 0; index < referenceRgb.length; index += 1) {
      const error = Math.abs(referenceRgb[index] - renderedRgb[index]);
      absoluteError += error;
      maximumError = Math.max(maximumError, error);
    }
    const mae = absoluteError / referenceRgb.length;
    assert.ok(mae <= 6, `RGB mean absolute error ${mae.toFixed(3)} exceeds codec tolerance`);
    assert.ok(maximumError <= 12, `maximum RGB channel error ${maximumError} exceeds codec tolerance`);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
