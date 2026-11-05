"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  HARDWARE_H264_ENCODERS,
  ALL_H264_ENCODERS,
  buildH264EncoderArgs,
  buildH264EncoderProbeArgs,
  selectH264Encoder
} = require("../electron/h264-encoder.cjs");
const { buildRawRgbaPipeFfmpegArgs } = require("../electron/frame-sequence.cjs");

test("H.264 encoder catalog contains CPU, NVIDIA, AMD and Intel implementations", () => {
  assert.deepEqual(HARDWARE_H264_ENCODERS, ["h264_nvenc", "h264_amf", "h264_qsv"]);
  assert.deepEqual(ALL_H264_ENCODERS, ["libx264", "h264_nvenc", "h264_amf", "h264_qsv"]);
});

test("each encoder receives bounded bitrate and VBV buffer parameters", () => {
  for (const encoder of ALL_H264_ENCODERS) {
    const args = buildH264EncoderArgs(encoder, 4_000_000);
    assert.ok(args.includes("-b:v"));
    assert.equal(args[args.indexOf("-b:v") + 1], "4000000");
    assert.equal(args[args.indexOf("-maxrate") + 1], encoder === "h264_nvenc" ? "4000000" : "5000000");
    assert.equal(args[args.indexOf("-bufsize") + 1], "8000000");
  }
  assert.throws(() => buildH264EncoderArgs("h264_unknown", 4_000_000), /неподдерживаемый/);
  assert.throws(() => buildH264EncoderArgs("h264_nvenc", 100), /битрейт/);
});

test("NVENC uses CBR at the requested target with padding and strict GOP", () => {
  const args = buildH264EncoderArgs("h264_nvenc", 5_000_000);
  assert.equal(args[args.indexOf("-rc") + 1], "cbr");
  assert.equal(args[args.indexOf("-b:v") + 1], "5000000");
  assert.equal(args[args.indexOf("-maxrate") + 1], "5000000");
  assert.equal(args[args.indexOf("-bufsize") + 1], "10000000");
  assert.equal(args[args.indexOf("-strict_gop") + 1], "1");
  assert.equal(args[args.indexOf("-cbr_padding") + 1], "1");
  assert.ok(!args.includes("vbr"));
});

test("AMF uses supported balanced peak-VBR options and QSV uses a documented quality preset", () => {
  const amf = buildH264EncoderArgs("h264_amf", 2_000_000);
  const qsv = buildH264EncoderArgs("h264_qsv", 2_000_000);
  assert.ok(amf.includes("-quality") && amf.includes("balanced"));
  assert.ok(amf.includes("-rc") && amf.includes("vbr_peak"));
  assert.ok(qsv.includes("-preset") && qsv.includes("medium"));
});

test("hardware probes execute a real encode; NVENC probe exercises a 30-frame CBR segment", () => {
  for (const encoder of HARDWARE_H264_ENCODERS) {
    const args = buildH264EncoderProbeArgs(encoder, "NUL");
    assert.ok(args.includes("-f") && args.includes("lavfi"));
    assert.ok(args.includes("-c:v") && args.includes(encoder));
    assert.equal(args.at(-1), "NUL");
    assert.equal(args[args.indexOf("-frames:v") + 1], encoder === "h264_nvenc" ? "30" : "1");
    if (encoder === "h264_nvenc") {
      assert.equal(args[args.indexOf("-rc") + 1], "cbr");
      assert.equal(args[args.indexOf("-maxrate") + 1], "250000");
      assert.equal(args[args.indexOf("-cbr_padding") + 1], "1");
    }
  }
  assert.throws(() => buildH264EncoderProbeArgs("libx264", "NUL"), /пробного аппаратного/);
});

test("runtime selector falls through NVENC, AMF and QSV in order before CPU fallback", async () => {
  const attempts = [];
  const result = await selectH264Encoder({ h264Nvenc: true, h264Amf: true, h264Qsv: true }, async encoder => {
    attempts.push(encoder);
    return encoder === "h264_qsv";
  });
  assert.deepEqual(attempts, ["h264_nvenc", "h264_amf", "h264_qsv"]);
  assert.deepEqual(result, { encoder: "h264_qsv", hardware: true });
});

test("runtime selector skips uncompiled codecs and falls back to libx264 on probe errors", async () => {
  const attempts = [];
  const result = await selectH264Encoder({ h264Nvenc: true, h264Amf: false, h264Qsv: true }, async encoder => {
    attempts.push(encoder);
    if (encoder === "h264_nvenc") throw new Error("driver unavailable");
    return false;
  });
  assert.deepEqual(attempts, ["h264_nvenc", "h264_qsv"]);
  assert.deepEqual(result, { encoder: "libx264", hardware: false });
});

test("raw RGBA export accepts each H.264 implementation without changing CFR or BT.709 settings", () => {
  for (const encoder of ALL_H264_ENCODERS) {
    const args = buildRawRgbaPipeFfmpegArgs({
      outputPath: "out.mp4", width: 160, height: 90, fps: 30,
      frameCount: 30, duration: 1, audioExpected: false,
      videoBitrate: 1_000_000, videoEncoder: encoder
    });
    assert.ok(args.includes(encoder));
    assert.equal(args[args.indexOf("-fps_mode") + 1], "cfr");
    assert.ok(args.includes("bt709"));
    assert.equal(args[args.indexOf("-frames:v") + 1], "30");
  }
});
