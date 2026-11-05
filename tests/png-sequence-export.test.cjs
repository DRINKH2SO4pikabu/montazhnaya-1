"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  validateFrameSequenceSettings,
  toPngBuffer,
  toRgbaBuffer,
  toWavBuffer,
  MAX_RAW_RGBA_FRAME_BYTES,
  frameFileName,
  buildPngSequenceFfmpegArgs,
  buildPngPipeFfmpegArgs,
  buildRawRgbaPipeFfmpegArgs,
  MAX_SEQUENCE_BYTES
} = require("../electron/frame-sequence.cjs");

const root = path.join(__dirname, "..");
const rendererPath = path.join(root, "src", "renderer", "index.html");
const mainPath = path.join(root, "electron", "main.cjs");
const preloadPath = path.join(root, "electron", "preload.cjs");

function pngHeaderOnly() {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
}

test("frame sequence settings enforce exact FPS/count/duration agreement", () => {
  const result = validateFrameSequenceSettings({
    suggestedName: "test video",
    expectedFps: 24,
    expectedFrameCount: 240,
    expectedDuration: 10,
    expectedWidth: 1920,
    expectedHeight: 1080,
    audioExpected: true,
    expectedAudioBytes: 1024 * 1024,
    expectedVideoBitrate: 5_000_000,
    expectedSourceVideoCount: 2,
    streamFrames: true,
    outputFormat: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    frameTransport: "png"
  });
  assert.deepEqual(result, {
    suggestedName: "test video",
    fps: 24,
    frameCount: 240,
    duration: 10,
    audioExpected: true,
    width: 1920,
    height: 1080,
    expectedAudioBytes: 1024 * 1024,
    videoBitrate: 5_000_000,
    expectedSourceVideoCount: 2,
    streamFrames: true,
    outputFormat: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    frameTransport: "png"
  });
  assert.throws(() => validateFrameSequenceSettings({
    suggestedName: "bad", expectedFps: 24, expectedFrameCount: 240,
    expectedDuration: 9, expectedWidth: 1920, expectedHeight: 1080,
    audioExpected: false, expectedAudioBytes: 0
  }), /Длительность не соответствует/);
});

test("raw RGBA transport is permitted only for streamed MP4 frames within the 32 MiB IPC cap", () => {
  const base = {
    suggestedName: "rgba-safe", expectedFps: 60, expectedFrameCount: 120,
    expectedDuration: 2, expectedWidth: 3840, expectedHeight: 2160,
    audioExpected: false, expectedAudioBytes: 0, streamFrames: true,
    outputFormat: "mp4", videoCodec: "h264", audioCodec: "aac", frameTransport: "rgba"
  };
  assert.equal(validateFrameSequenceSettings(base).frameTransport, "rgba");
  assert.throws(() => validateFrameSequenceSettings({ ...base, outputFormat: "webm", videoCodec: "vp9", audioCodec: "opus" }), /только для потокового MP4/);
  assert.throws(() => validateFrameSequenceSettings({ ...base, streamFrames: false }), /только для потокового MP4/);
  assert.throws(() => validateFrameSequenceSettings({ ...base, expectedWidth: 7680, expectedHeight: 4320 }), /только для потокового MP4/);
  assert.equal(3840 * 2160 * 4 < MAX_RAW_RGBA_FRAME_BYTES, true);
});

test("RGBA payload validation enforces exact dimensions and bounded frame size", () => {
  const pixels = new Uint8ClampedArray(64 * 64 * 4);
  assert.equal(toRgbaBuffer(pixels, 64, 64).byteLength, 64 * 64 * 4);
  assert.throws(() => toRgbaBuffer(new Uint8Array(64 * 64 * 4 - 1), 64, 64), /не совпадает с ожидаемым/);
  assert.throws(() => toRgbaBuffer("not rgba", 64, 64), /бинарные RGBA-данные/);
  assert.throws(() => toRgbaBuffer(new Uint8Array(64 * 64 * 4), 0, 64), /размеры RGBA/);
  assert.throws(() => toRgbaBuffer(new Uint8Array(0), 8192, 4096), /32 МиБ/);
});

test("raw RGBA H.264 profile builds vendor-specific NVENC, AMF and QSV argument sets", () => {
  const common = {
    outputPath: "C:\\Temp\\encoder.mp4", width: 160, height: 90, fps: 30,
    frameCount: 30, duration: 1, audioExpected: false, videoBitrate: 2_000_000
  };
  const profiles = [
    { encoder: "h264_nvenc", expected: ["h264_nvenc", "p4", "cbr", "-cbr_padding"] },
    { encoder: "h264_amf", expected: ["h264_amf", "balanced", "vbr_peak"] },
    { encoder: "h264_qsv", expected: ["h264_qsv", "medium"] }
  ];
  for (const profile of profiles) {
    const args = buildRawRgbaPipeFfmpegArgs({ ...common, videoEncoder: profile.encoder });
    assert.ok(args.includes(profile.encoder));
    for (const option of profile.expected) assert.ok(args.includes(option));
    assert.ok(args.includes("2000000"));
    assert.ok(args.includes(profile.encoder === "h264_nvenc" ? "2000000" : "2500000"));
    assert.ok(args.includes("4000000"));
    assert.ok(args.includes("yuv420p"));
    assert.ok(args.includes("bt709"));
  }
});

test("raw RGBA FFmpeg profile supports CPU libx264 and NVIDIA NVENC without PNG decode", () => {
  const common = {
    outputPath: "C:\\Temp\\raw.mp4", width: 3840, height: 2160,
    fps: 60, frameCount: 120, duration: 2,
    audioPath: "C:\\Temp\\audio.wav", audioExpected: true, videoBitrate: 20_000_000
  };
  const cpu = buildRawRgbaPipeFfmpegArgs({ ...common, videoEncoder: "libx264" });
  assert.ok(cpu.includes("rawvideo"));
  assert.ok(cpu.includes("rgba"));
  assert.ok(cpu.includes("3840x2160"));
  assert.ok(cpu.includes("pipe:0"));
  assert.ok(!cpu.includes("image2pipe"));
  assert.ok(cpu.includes("libx264"));
  assert.ok(cpu.includes("-b:v") && cpu[cpu.indexOf("-b:v") + 1] === "20000000");
  assert.ok(cpu.includes("-color_trc") && cpu[cpu.indexOf("-color_trc") + 1] === "bt709");
  const nvenc = buildRawRgbaPipeFfmpegArgs({ ...common, videoEncoder: "h264_nvenc" });
  assert.ok(nvenc.includes("h264_nvenc"));
  assert.ok(nvenc.includes("-preset") && nvenc[nvenc.indexOf("-preset") + 1] === "p4");
  assert.ok(nvenc.includes("-rc") && nvenc[nvenc.indexOf("-rc") + 1] === "cbr");
  assert.equal(nvenc[nvenc.indexOf("-b:v") + 1], "20000000");
  assert.equal(nvenc[nvenc.indexOf("-maxrate") + 1], "20000000");
  assert.equal(nvenc[nvenc.indexOf("-bufsize") + 1], "40000000");
  assert.equal(nvenc[nvenc.indexOf("-strict_gop") + 1], "1");
  assert.equal(nvenc[nvenc.indexOf("-cbr_padding") + 1], "1");
  assert.throws(() => buildRawRgbaPipeFfmpegArgs({ ...common, videoEncoder: "unknown" }), /неподдерживаемый H.264/);
  assert.throws(() => buildRawRgbaPipeFfmpegArgs({ ...common, width: 8192, height: 4320 }), /Некорректные параметры/);
});

test("video bitrate is validated and passed to the FFmpeg rate-control profile", () => {
  const base = {
    suggestedName: "rate-control", expectedFps: 30, expectedFrameCount: 90,
    expectedDuration: 3, expectedWidth: 640, expectedHeight: 360,
    audioExpected: false, expectedAudioBytes: 0, streamFrames: true
  };
  assert.equal(validateFrameSequenceSettings(base).videoBitrate, 5_000_000);
  assert.equal(validateFrameSequenceSettings({ ...base, expectedVideoBitrate: 8_000_000 }).videoBitrate, 8_000_000);
  assert.throws(() => validateFrameSequenceSettings({ ...base, expectedVideoBitrate: 100_000 }), /от 0,25 до 100 Мбит\/с/);
  assert.throws(() => validateFrameSequenceSettings({ ...base, expectedVideoBitrate: 100_000_001 }), /от 0,25 до 100 Мбит\/с/);
  const args = buildPngPipeFfmpegArgs({
    outputPath: "rate.mp4", fps: 30, frameCount: 90, duration: 3,
    audioExpected: false, videoBitrate: 8_000_000
  });
  assert.equal(args[args.indexOf("-b:v") + 1], "8000000");
  assert.equal(args[args.indexOf("-maxrate") + 1], "10000000");
  assert.equal(args[args.indexOf("-bufsize") + 1], "16000000");
});

test("main process rejects exports with an unverified color profile or excessive bitrate", () => {
  const main = fs.readFileSync(mainPath, "utf8");
  assert.match(main, /video\.color_range !== "tv"/);
  assert.match(main, /video\.color_space !== "bt709"/);
  assert.match(main, /video\.color_transfer !== "bt709"/);
  assert.match(main, /video\.color_primaries !== "bt709"/);
  assert.match(main, /videoBitrate > expectedVideoBitrate \* 1\.6/);
  assert.match(main, /session\.width, session\.height, session\.videoBitrate/);
  assert.match(main, /ffmpegProcessWallMs:/);
  assert.match(main, /ffmpegFinalizeMs:/);
});



test("renderer overlaps one-frame source prefetch with bounded raw/PNG frame transfer and ordered writes", () => {
  const renderer = fs.readFileSync(rendererPath, "utf8");
  assert.match(renderer, /const startSourceReadTask = \(timelineTime\) =>/);
  assert.match(renderer, /Only one future source frame is prefetched/);
  assert.match(renderer, /Promise\.all\(\[writeTask, nextSourceTask\]\)/);
  assert.match(renderer, /framePayload = \{ rgbaData: imageData\.data\.buffer \}/);
  assert.match(renderer, /framePayload = \{ pngData \}/);
  assert.match(renderer, /sourcePrefetchOverlapMs/);
  assert.match(renderer, /pendingSourceTask = nextSourceOutcome \? Promise\.resolve\(nextSourceOutcome\) : null/);
});

test("NVENC, AMF and QSV are selected only after runtime probes, with libx264 as the final fallback", () => {
  const main = fs.readFileSync(mainPath, "utf8");
  assert.match(main, /async function probeRuntimeH264EncoderSupport\(encoder\)/);
  assert.match(main, /h264_nvenc/);
  assert.match(main, /h264_amf/);
  assert.match(main, /h264_qsv/);
  assert.match(main, /probeRuntimeH264EncoderSupport/);
  assert.match(main, /selectH264Encoder\(/);
  assert.match(main, /let videoEncoder = "libx264"/);
  assert.match(main, /hardwareH264ProbePromises/);
});

test("only PNG-signature frame payloads are accepted", () => {
  const png = pngHeaderOnly();
  assert.deepEqual(toPngBuffer(png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength)), png);
  assert.throws(() => toPngBuffer(Buffer.from("not png")), /Размер PNG|сигнатуру PNG/);
  assert.throws(() => toPngBuffer(null), /бинарные PNG-данные/);
});

test("WAV payload validates RIFF/WAVE signature", () => {
  const wav = Buffer.alloc(12);
  wav.write("RIFF", 0, "ascii");
  wav.write("WAVE", 8, "ascii");
  assert.equal(toWavBuffer(wav).length, 12);
  assert.equal(toWavBuffer(null), null);
  assert.throws(() => toWavBuffer(Buffer.from("not wav")), /корректный формат WAV/);
});

test("numbered PNG filenames are sequential and cannot traverse directories", () => {
  assert.equal(frameFileName(0), "frame_000000.png");
  assert.equal(frameFileName(239), "frame_000239.png");
  assert.throws(() => frameFileName(-1), /Индекс кадра/);
  assert.throws(() => frameFileName(100000), /Индекс кадра/);
});

test("FFmpeg reads a numbered PNG sequence on an exact CFR clock", () => {
  const args = buildPngSequenceFfmpegArgs({
    tempDir: "C:\\Temp\\frames",
    outputPath: "C:\\Temp\\out.mp4",
    fps: 24,
    frameCount: 240,
    duration: 10,
    audioPath: "C:\\Temp\\audio.wav",
    audioExpected: true
  });
  assert.ok(args.includes("-framerate"));
  assert.ok(args.includes("24"));
  assert.ok(args.some((arg) => arg.endsWith("frame_%06d.png")));
  assert.ok(args.includes("-frames:v"));
  assert.ok(args.includes("240"));
  assert.ok(args.includes("-fps_mode") && args.includes("cfr"));
  assert.ok(args.includes("C:\\Temp\\audio.wav"));
  assert.ok(!args.includes("input.webm"));
});

test("MP4 export warning describes raw RGBA transport, PNG fallback and bounded source-frame cache", () => {
  const renderer = fs.readFileSync(rendererPath, "utf8");
  const localeCatalog = fs.readFileSync(path.join(__dirname, "../src/renderer/locales/notifications.js"), "utf8");
  assert.match(renderer, /uiT\("dialog\.export\.frameSequenceWarning"/);
  assert.match(renderer, /uiT\("status\.export\.profileSummary"/);
  assert.match(localeCatalog, /несжатый RGBA rawvideo/);
  assert.match(localeCatalog, /PNG image2pipe/);
  assert.match(localeCatalog, /NVENC/);
  assert.match(localeCatalog, /Полная выходная последовательность на диск не записывается/);
  assert.match(localeCatalog, /дисковый LRU-кэш ограничен 512 МиБ/);
  assert.match(localeCatalog, /Старые кадры автоматически освобождаются/);
  assert.match(localeCatalog, /Целевой средний видеобитрейт/);
  assert.match(localeCatalog, /Профиль экспорта: цель/);
  assert.match(renderer, /\[Экспорт: профиль производительности\]/);
});

test("streaming PNG FFmpeg args use image2pipe stdin, CFR and optional AAC", () => {
  const args = buildPngPipeFfmpegArgs({
    outputPath: "C:\\Temp\\stream.mp4", fps: 30, frameCount: 300, duration: 10,
    audioPath: "C:\\Temp\\audio.wav", audioExpected: true
  });
  assert.ok(args.includes("image2pipe"));
  assert.ok(args.includes("pipe:0"));
  assert.ok(args.includes("-thread_queue_size") && args[args.indexOf("-thread_queue_size") + 1] === "8");
  assert.ok(args.includes("-threads") && args[args.indexOf("-threads") + 1] === "0");
  assert.ok(args.includes("-b:v") && args[args.indexOf("-b:v") + 1] === "5000000");
  assert.ok(args.includes("-maxrate") && args[args.indexOf("-maxrate") + 1] === "6250000");
  assert.ok(args.includes("-bufsize") && args[args.indexOf("-bufsize") + 1] === "10000000");
  assert.ok(!args.includes("-crf"), "MP4 average-bitrate mode must not be silently overridden by CRF");
  assert.ok(args.includes("-framerate"));
  assert.ok(args.includes("30"));
  assert.ok(args.includes("-frames:v"));
  assert.ok(args.includes("300"));
  assert.ok(args.includes("-fps_mode") && args.includes("cfr"));
  assert.ok(args.includes("-c:a") && args.includes("aac"));
  assert.ok(args.includes("C:\\Temp\\audio.wav"));
  const silentArgs = buildPngPipeFfmpegArgs({ outputPath: "out.mp4", fps: 25, frameCount: 50, duration: 2, audioExpected: false });
  assert.ok(silentArgs.includes("pipe:0"));
  assert.ok(silentArgs.includes("-an"));
  assert.ok(!silentArgs.includes("-i") || silentArgs.filter(value => value === "-i").length === 1);
  assert.throws(() => buildPngPipeFfmpegArgs({ outputPath: "out.mp4", fps: 25, frameCount: 50, duration: 2, audioExpected: true }), /WAV-файл/);
});

test("WebM FFmpeg args select VP8/VP9 plus Opus on an exact CFR clock", () => {
  for (const [videoCodec, encoder, fps, frameCount] of [["vp8", "libvpx", 25, 50], ["vp9", "libvpx-vp9", 60, 120]]) {
    const args = buildPngPipeFfmpegArgs({
      outputPath: `C:\\Temp\\stream-${videoCodec}.webm`, fps, frameCount, duration: frameCount / fps,
      audioPath: "C:\\Temp\\audio.wav", audioExpected: true,
      outputFormat: "webm", videoCodec, audioCodec: "opus"
    });
    assert.ok(args.includes("image2pipe"));
    assert.ok(args.includes("pipe:0"));
    assert.ok(args.includes("-framerate") && args.includes(String(fps)));
    assert.ok(args.includes("-frames:v") && args.includes(String(frameCount)));
    assert.ok(args.includes("-fps_mode") && args.includes("cfr"));
    assert.ok(args.includes("-c:v") && args.includes(encoder));
    assert.ok(args.includes("-c:a") && args.includes("libopus"));
    assert.ok(args.includes("-b:v") && args[args.indexOf("-b:v") + 1] === "5000000");
    assert.ok(args.includes("-threads") && args[args.indexOf("-threads") + 1] === "0");
    assert.ok(args.includes("-f") && args.includes("webm"));
    assert.ok(args.at(-1).endsWith(".webm"));
  }
  assert.throws(() => buildPngPipeFfmpegArgs({ outputPath: "bad.webm", fps: 25, frameCount: 50, duration: 2, audioExpected: false, outputFormat: "webm", videoCodec: "h264", audioCodec: "aac" }), /комбинац/);
});

test("PNG sequence IPC is exposed narrowly and validates sequential frame indices", () => {
  const renderer = fs.readFileSync(rendererPath, "utf8");
  const main = fs.readFileSync(mainPath, "utf8");
  const preload = fs.readFileSync(preloadPath, "utf8");
  assert.match(preload, /beginFrameSequenceExport:\s*\(request\)\s*=>\s*invokeIpc\("export:begin-png-sequence"/);
  assert.match(preload, /startFrameSequenceEncoding:[\s\S]*?export:start-png-stream/);
  assert.match(main, /registerStructuredIpcHandler\(ipcMain, "export:start-png-stream", handleStartFrameSequenceEncoding\)/);
  assert.match(preload, /writeFrameSequenceFrame:\s*\(request\)\s*=>\s*invokeIpc\("export:write-png-frame"/);
  assert.match(preload, /finishFrameSequenceExport:\s*\(request\)\s*=>\s*invokeIpc\("export:finish-png-sequence"/);
  assert.match(main, /request\.index\s*!==\s*session\.nextFrameIndex/);
  assert.match(main, /isTrustedExportSender\(event\)/);
  const start = renderer.indexOf("async start() {");
  const pngBranch = renderer.indexOf("await this.exportPngSequenceToMp4(filename, fmt, bitrate);", start);
  const oldRecorderCapture = renderer.indexOf("exportCanvas.captureStream(0)", start);
  assert.ok(start >= 0 && pngBranch > start && oldRecorderCapture > pngBranch,
    "MP4 sequential mode must branch into PNG output before the old MediaRecorder canvas path");
  assert.match(renderer.slice(start, oldRecorderCapture), /this\.state\.frameSequenceMode/);
  assert.match(renderer, /this\.state\.canvas\.toBlob\(blob\s*=>/);
  assert.match(renderer, /this\.state\.ctx\.getImageData\(0, 0, this\.state\.canvas\.width, this\.state\.canvas\.height\)/);
  assert.match(renderer, /frameTransport,/);
  assert.match(renderer, /await api\.startFrameSequenceEncoding\(/);
  assert.match(renderer, /outputFormat, videoCodec: expectedVideoCodec, audioCodec: expectedAudioCodec,[\s\S]{0,100}expectedVideoBitrate: videoBitrate/);
  assert.match(renderer, /verification\.videoCodec !== expectedVideoCodec/);
  assert.match(renderer, /streamFrames:\s*true/);
  assert.match(renderer, /const writeTask = api\.writeFrameSequenceFrame\(/);
  assert.match(renderer, /Promise\.all\(\[writeTask, nextSourceTask\]\)/);
  assert.match(main, /session\.ffmpegJob\.writeInput\(frameBuffer\)/);
  assert.match(main, /toRgbaBuffer\(request\.rgbaData, session\.width, session\.height\)/);
  assert.match(main, /probeRuntimeH264EncoderSupport/);
  assert.match(main, /let videoEncoder = "libx264"/);
  assert.match(main, /h264_amf/);
  assert.match(main, /h264_qsv/);
  const exportStart = renderer.indexOf("async exportPngSequenceToMp4(filename, format = {}, videoBitrate");
  const exportEnd = renderer.indexOf("  cancel() {", exportStart);
  assert.ok(exportStart >= 0 && exportEnd > exportStart);
  const pngExportMethod = renderer.slice(exportStart, exportEnd);
  assert.doesNotMatch(pngExportMethod, /\.captureStream\s*\(|\.requestFrame\s*\(|new\s+MediaRecorder/,
    "the PNG-sequence MP4 path must not use realtime canvas capture");
  assert.ok(MAX_SEQUENCE_BYTES >= 2 * 1024 * 1024 * 1024);
});

test("streaming MP4 and WebM explicitly convert sRGB PNG frames to BT.709 limited-range YUV", () => {
  const mp4 = buildPngPipeFfmpegArgs({ outputPath: "out.mp4", fps: 30, frameCount: 30, duration: 1, audioExpected: false });
  const webm = buildPngPipeFfmpegArgs({ outputPath: "out.webm", fps: 30, frameCount: 30, duration: 1, audioExpected: false, outputFormat: "webm", videoCodec: "vp8", audioCodec: "opus" });
  for (const args of [mp4, webm]) {
    const vfIndex = args.indexOf("-vf");
    assert.ok(vfIndex >= 0, "video filter must be explicit");
    assert.equal(args[vfIndex + 1], "colorspace=ispace=gbr:irange=pc:iprimaries=bt709:itrc=iec61966-2-1:space=bt709:range=tv:primaries=bt709:trc=bt709:format=yuv420p");
    assert.ok(args.includes("-color_range") && args[args.indexOf("-color_range") + 1] === "tv");
    assert.ok(args.includes("-colorspace") && args[args.indexOf("-colorspace") + 1] === "bt709");
    assert.ok(args.includes("-color_primaries") && args[args.indexOf("-color_primaries") + 1] === "bt709");
    assert.ok(args.includes("-color_trc") && args[args.indexOf("-color_trc") + 1] === "bt709");
  }
});
