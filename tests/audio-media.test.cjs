"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const {
  selectAudioStream,
  describeAudioStream,
  estimatePcmWavBytes,
  buildPcmWavNormalizeArgs,
  inspectPcmWavHeader,
  calculateAudioBufferBytes,
  requiresAudioPreviewNormalization
} = require("../electron/audio-media.cjs");

const ffmpeg = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
const ffprobe = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
const hasFfmpeg = (() => { const r = spawnSync(ffmpeg, ["-version"], { stdio: "ignore", windowsHide: true }); return !r.error && r.status === 0; })();
const hasFfprobe = (() => { const r = spawnSync(ffprobe, ["-version"], { stdio: "ignore", windowsHide: true }); return !r.error && r.status === 0; })();

test("selectAudioStream prefers the default audio stream and otherwise keeps the first", () => {
  const streams = [
    { index: 1, codec_type: "audio", codec_name: "aac", disposition: { default: 0 } },
    { index: 2, codec_type: "video", codec_name: "h264" },
    { index: 3, codec_type: "audio", codec_name: "flac", disposition: { default: 1 } }
  ];
  assert.equal(selectAudioStream(streams).index, 3);
  assert.equal(selectAudioStream([{ index: 7, codec_type: "audio" }, { index: 8, codec_type: "audio" }]).index, 7);
  assert.equal(selectAudioStream([{ codec_type: "video" }]), null);
});

test("describeAudioStream normalizes metadata and uses container duration as fallback", () => {
  const info = describeAudioStream({
    index: 4, codec_type: "audio", codec_name: "flac", profile: "", sample_rate: "96000",
    channels: 6, channel_layout: "5.1", sample_fmt: "s32", bit_rate: "2304000",
    start_time: "0.125", disposition: { default: 1 }
  }, 12.5);
  assert.deepEqual(info, {
    streamIndex: 4, codec: "flac", profile: "", sampleRate: 96000, channels: 6,
    channelLayout: "5.1", sampleFormat: "s32", bitRate: 2304000,
    startTime: 0.125, duration: 12.5, isDefault: true
  });
  assert.throws(() => describeAudioStream({ codec_type: "video" }), /аудиопоток/);
});

test("preview codec policy normalizes codecs outside the browser-safe PCM/AAC/MP3/Opus set", () => {
  assert.equal(requiresAudioPreviewNormalization({ codec: "aac", sampleRate: 48000, channels: 2 }), false);
  assert.equal(requiresAudioPreviewNormalization({ codec: "flac", sampleRate: 44100, channels: 2 }), false);
  assert.equal(requiresAudioPreviewNormalization({ codec: "pcm_s24le", sampleRate: 48000, channels: 2 }), false);
  assert.equal(requiresAudioPreviewNormalization({ codec: "ac3", sampleRate: 48000, channels: 2 }), true);
  assert.equal(requiresAudioPreviewNormalization({ codec: "dts", sampleRate: 48000, channels: 2 }), true);
  assert.equal(requiresAudioPreviewNormalization({ codec: "alac", sampleRate: 44100, channels: 2 }), true);
  assert.equal(requiresAudioPreviewNormalization({ codec: "aac", sampleRate: 96000, channels: 2 }), true);
  assert.equal(requiresAudioPreviewNormalization({ codec: "aac", sampleRate: 48000, channels: 6 }), true);
  assert.equal(requiresAudioPreviewNormalization({}), true);
});

test("PCM WAV size and decoded-memory estimates are deterministic", () => {
  const estimate = estimatePcmWavBytes(10, { sampleRate: 48000, channels: 2, bytesPerSample: 2 });
  assert.equal(estimate.sampleFrames, 480000);
  assert.equal(estimate.dataBytes, 1920000);
  assert.equal(estimate.totalBytes, 1920044);
  assert.equal(calculateAudioBufferBytes(10, 48000, 2), 3840000);
  assert.equal(calculateAudioBufferBytes(-1), null);
  assert.throws(() => estimatePcmWavBytes(0), /Некорректные/);
});

test("normalizer maps the selected stream and produces a fixed 48 kHz stereo PCM WAV", () => {
  const args = buildPcmWavNormalizeArgs("input.flac", "output.wav", { streamIndex: 2 });
  assert.ok(args.includes("-map"));
  assert.ok(args.includes("0:2"));
  assert.ok(args.some((arg) => typeof arg === "string" && arg.includes("aresample=48000:async=1:first_pts=0")));
  assert.ok(args.includes("pcm_s16le"));
  assert.ok(args.includes("-ac"));
  assert.ok(args.includes("2"));
  assert.throws(() => buildPcmWavNormalizeArgs("a", "b", { streamIndex: -1 }), /индекс/);
});

test("normalizer preserves embedded video audio offset with leading silence or source trimming", () => {
  const delayed = buildPcmWavNormalizeArgs("video.mp4", "delayed.wav", { streamIndex: 1, startOffsetSeconds: 0.25 });
  const delayedFilter = delayed[delayed.indexOf("-af") + 1];
  assert.match(delayedFilter, /adelay=250\|250/);
  assert.match(delayedFilter, /aresample=48000:async=1:first_pts=0/);
  const trimmed = buildPcmWavNormalizeArgs("video.mp4", "trimmed.wav", { streamIndex: 1, startOffsetSeconds: -0.125 });
  const trimmedFilter = trimmed[trimmed.indexOf("-af") + 1];
  assert.match(trimmedFilter, /atrim=start=0\.125000/);
  assert.match(trimmedFilter, /asetpts=PTS-STARTPTS/);
  assert.throws(() => buildPcmWavNormalizeArgs("a", "b", { streamIndex: 0, startOffsetSeconds: 4000 }), /смещение/);
});

test("WAV parser verifies PCM format, channels, sample rate and complete data chunk", () => {
  const dataBytes = 4800 * 2 * 2;
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVE", 8);
  wav.write("fmt ", 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22); wav.writeUInt32LE(48000, 24); wav.writeUInt32LE(192000, 28);
  wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(dataBytes, 40);
  const parsed = inspectPcmWavHeader(wav, { channels: 2, sampleRate: 48000 });
  assert.equal(parsed.frameCount, 4800);
  assert.equal(parsed.dataOffset, 44);
  assert.throws(() => inspectPcmWavHeader(Buffer.alloc(20)), /RIFF\/WAVE/);
  assert.throws(() => inspectPcmWavHeader(wav, { channels: 1 }), /каналов/);
});

test("FFmpeg normalizes MP3, AAC, OGG, FLAC and WAV to one PCM profile", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-audio-normalize-"));
  const encoderOutput = spawnSync(ffmpeg, ["-hide_banner", "-encoders"], { encoding: "utf8", windowsHide: true });
  const encoderText = String(encoderOutput.stdout || "") + String(encoderOutput.stderr || "");
  const hasEncoder = name => new RegExp("\\b" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(encoderText);
  const cases = [
    { name: "music.mp3", args: ["-c:a", "libmp3lame", "-b:a", "128k"] },
    { name: "music.m4a", args: ["-c:a", "aac", "-b:a", "128k"] },
    { name: "music.ogg", args: ["-c:a", "libvorbis", "-q:a", "4"] },
    { name: "music.flac", args: ["-c:a", "flac"] },
    { name: "music.wav", args: ["-c:a", "pcm_s24le", "-ac", "2"] },
    ...(hasEncoder("ac3") ? [{ name: "music.ac3", args: ["-c:a", "ac3", "-b:a", "192k"] }] : []),
    ...(hasEncoder("eac3") ? [{ name: "music.eac3", args: ["-c:a", "eac3", "-b:a", "192k"] }] : []),
    ...(hasEncoder("wmav2") ? [{ name: "music.asf", args: ["-c:a", "wmav2", "-b:a", "128k"] }] : []),
    ...(hasEncoder("dca") ? [{ name: "music.dts", args: ["-c:a", "dca", "-strict", "-2"] }] : [])
  ];
  try {
    for (const item of cases) {
      const input = path.join(dir, item.name);
      const output = path.join(dir, item.name + ".normalized.wav");
      execFileSync(ffmpeg, [
        "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
        "sine=frequency=440:sample_rate=44100:duration=0.4", ...item.args, input
      ], { windowsHide: true });
      const probe = JSON.parse(execFileSync(ffprobe, ["-v", "error", "-show_streams", "-show_format", "-of", "json", input], { encoding: "utf8", windowsHide: true }));
      const selected = selectAudioStream(probe.streams);
      assert.ok(selected, item.name + " audio stream");
      const normalizedArgs = buildPcmWavNormalizeArgs(input, output, { streamIndex: Number(selected.index) });
      execFileSync(ffmpeg, normalizedArgs, { windowsHide: true });
      const bytes = await fs.readFile(output);
      const wav = inspectPcmWavHeader(bytes, { channels: 2, sampleRate: 48000 });
      assert.ok(Math.abs(wav.duration - 0.4) < 0.05, item.name + " duration: " + wav.duration);
    }
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});


test("FFmpeg normalization preserves positive and negative embedded-audio offsets in real WAV output", { skip: !hasFfmpeg }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-audio-offset-"));
  const input = path.join(dir, "tone.wav");
  const delayedPath = path.join(dir, "delayed.wav");
  const trimmedPath = path.join(dir, "trimmed.wav");
  try {
    execFileSync(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
      "sine=frequency=440:sample_rate=48000:duration=0.5",
      "-c:a", "pcm_s16le", input
    ], { windowsHide: true });

    const delayedArgs = buildPcmWavNormalizeArgs(input, delayedPath, { streamIndex: 0, startOffsetSeconds: 0.2 });
    execFileSync(ffmpeg, delayedArgs, { windowsHide: true });
    const delayedBytes = await fs.readFile(delayedPath);
    const delayedInfo = inspectPcmWavHeader(delayedBytes, { channels: 2, sampleRate: 48000 });
    assert.ok(Math.abs(delayedInfo.duration - 0.7) < 0.01, "positive offset should extend aligned WAV duration");
    const firstWindowBytes = delayedBytes.subarray(delayedInfo.dataOffset, delayedInfo.dataOffset + 7200 * 2 * 2);
    let leadingMax = 0;
    for (let offset = 0; offset + 1 < firstWindowBytes.length; offset += 2) {
      leadingMax = Math.max(leadingMax, Math.abs(firstWindowBytes.readInt16LE(offset)));
    }
    assert.ok(leadingMax <= 1, "leading 200 ms should be digital silence");
    const activeWindow = delayedBytes.subarray(delayedInfo.dataOffset + 24000 * 2 * 2, delayedInfo.dataOffset + 36000 * 2 * 2);
    let activeMax = 0;
    for (let offset = 0; offset + 1 < activeWindow.length; offset += 2) {
      activeMax = Math.max(activeMax, Math.abs(activeWindow.readInt16LE(offset)));
    }
    assert.ok(activeMax > 100, "audio should be present after the inserted delay");

    const trimmedArgs = buildPcmWavNormalizeArgs(input, trimmedPath, { streamIndex: 0, startOffsetSeconds: -0.125 });
    execFileSync(ffmpeg, trimmedArgs, { windowsHide: true });
    const trimmedBytes = await fs.readFile(trimmedPath);
    const trimmedInfo = inspectPcmWavHeader(trimmedBytes, { channels: 2, sampleRate: 48000 });
    assert.ok(Math.abs(trimmedInfo.duration - 0.375) < 0.01, "negative offset should trim samples before video origin");
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});


test("ffprobe stream selection prefers the actual default track in a multi-audio container", { skip: !(hasFfmpeg && hasFfprobe) }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-audio-multistream-"));
  const input = path.join(dir, "two-audio-tracks.mkv");
  try {
    execFileSync(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "lavfi", "-i", "sine=frequency=330:sample_rate=48000:duration=0.35",
      "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=0.35",
      "-map", "0:a:0", "-map", "1:a:0", "-c:a", "flac",
      "-disposition:a:0", "0", "-disposition:a:1", "default", input
    ], { windowsHide: true });
    const probe = JSON.parse(execFileSync(ffprobe, [
      "-v", "error", "-show_streams", "-show_format", "-of", "json", input
    ], { encoding: "utf8", windowsHide: true }));
    const audioStreams = probe.streams.filter(stream => stream.codec_type === "audio");
    assert.equal(audioStreams.length, 2);
    const selected = selectAudioStream(probe.streams);
    assert.equal(Number(selected.disposition.default), 1);
    assert.equal(Number(selected.index), Number(audioStreams[1].index));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("FFmpeg downmixes 5.1 24-bit audio to the editor's stereo PCM profile", { skip: !hasFfmpeg }, async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-audio-downmix-"));
  const input = path.join(dir, "surround-24bit.wav");
  const output = path.join(dir, "stereo.wav");
  try {
    execFileSync(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
      "anullsrc=channel_layout=5.1:sample_rate=48000:duration=0.25",
      "-c:a", "pcm_s24le", input
    ], { windowsHide: true });
    const args = buildPcmWavNormalizeArgs(input, output, { streamIndex: 0 });
    execFileSync(ffmpeg, args, { windowsHide: true });
    const bytes = await fs.readFile(output);
    const wav = inspectPcmWavHeader(bytes, { channels: 2, sampleRate: 48000 });
    assert.ok(wav.duration >= 0.24 && wav.duration <= 0.26);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
