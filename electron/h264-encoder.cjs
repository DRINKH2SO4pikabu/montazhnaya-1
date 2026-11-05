"use strict";

const HARDWARE_H264_ENCODERS = Object.freeze([
  "h264_nvenc",
  "h264_amf",
  "h264_qsv"
]);

const ALL_H264_ENCODERS = Object.freeze([
  "libx264",
  ...HARDWARE_H264_ENCODERS
]);

function validateBitrate(videoBitrate) {
  if (!Number.isSafeInteger(videoBitrate) || videoBitrate < 250_000 || videoBitrate > 100_000_000) {
    throw new Error("Целевой средний битрейт видео должен быть от 0,25 до 100 Мбит/с.");
  }
  return {
    bitrate: String(videoBitrate),
    maxRate: String(Math.round(videoBitrate * 1.25)),
    bufferSize: String(videoBitrate * 2)
  };
}

function buildH264EncoderArgs(encoder, videoBitrate) {
  if (!ALL_H264_ENCODERS.includes(encoder)) {
    throw new Error("Выбран неподдерживаемый H.264-кодировщик.");
  }
  const rate = validateBitrate(videoBitrate);
  const rateArgs = [
    "-b:v", rate.bitrate,
    "-maxrate", rate.maxRate,
    "-bufsize", rate.bufferSize
  ];

  switch (encoder) {
    case "h264_nvenc":
      // The UI describes this value as the target average bitrate. NVENC VBR
      // may overshoot on short clips because its average is a long-term target.
      // CBR with maxrate == bitrate gives a predictable rate; cbr_padding keeps
      // simple scenes from falling substantially below the requested rate.
      return [
        "-c:v", "h264_nvenc", "-preset", "p4", "-rc", "cbr",
        "-b:v", rate.bitrate,
        "-maxrate", rate.bitrate,
        "-bufsize", rate.bufferSize,
        "-strict_gop", "1", "-cbr_padding", "1",
        "-profile:v", "high"
      ];
    case "h264_amf":
      return [
        "-c:v", "h264_amf", "-quality", "balanced", "-rc", "vbr_peak",
        ...rateArgs, "-profile:v", "high"
      ];
    case "h264_qsv":
      return [
        "-c:v", "h264_qsv", "-preset", "medium",
        ...rateArgs, "-profile:v", "high"
      ];
    default:
      return [
        "-c:v", "libx264", "-preset", "veryfast", "-threads", "0",
        ...rateArgs
      ];
  }
}

async function selectH264Encoder(encoderCapabilities, probeEncoder) {
  const capabilities = encoderCapabilities && typeof encoderCapabilities === "object"
    ? encoderCapabilities : {};
  for (const encoder of HARDWARE_H264_ENCODERS) {
    const capabilityKey = encoder === "h264_nvenc" ? "h264Nvenc"
      : encoder === "h264_amf" ? "h264Amf" : "h264Qsv";
    if (capabilities[capabilityKey] !== true || typeof probeEncoder !== "function") continue;
    try {
      if (await probeEncoder(encoder)) return { encoder, hardware: true };
    } catch (_) {
      // A driver/device can disappear between capability listing and runtime probe.
      // Continue to the next encoder and keep software encoding as the final fallback.
    }
  }
  return { encoder: "libx264", hardware: false };
}

function buildH264EncoderProbeArgs(encoder, nullOutputPath) {
  if (!HARDWARE_H264_ENCODERS.includes(encoder) || typeof nullOutputPath !== "string" || !nullOutputPath) {
    throw new Error("Некорректный запрос пробного аппаратного H.264-кодирования.");
  }
  const nvencCbrProbe = encoder === "h264_nvenc";
  const sourceArgs = nvencCbrProbe
    ? ["-f", "lavfi", "-i", "color=c=black:s=128x128:r=30:d=1", "-frames:v", "30"]
    : ["-f", "lavfi", "-i", "color=c=black:s=64x64:r=1:d=1", "-frames:v", "1"];
  return [
    "-hide_banner", "-loglevel", "error",
    ...sourceArgs, "-an",
    ...buildH264EncoderArgs(encoder, 250_000),
    "-f", "null", nullOutputPath
  ];
}

module.exports = {
  HARDWARE_H264_ENCODERS,
  ALL_H264_ENCODERS,
  buildH264EncoderArgs,
  buildH264EncoderProbeArgs,
  selectH264Encoder
};
