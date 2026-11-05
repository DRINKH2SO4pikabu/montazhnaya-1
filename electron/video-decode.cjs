"use strict";

const SAFE_NVDEC_DOWNLOAD_FORMATS = Object.freeze({
  yuv420p: "nv12",
  yuvj420p: "nv12",
  nv12: "nv12",
  yuv420p10le: "p010le",
  p010le: "p010le"
});

function getNvdecDownloadPixelFormat(sourcePixelFormat) {
  if (typeof sourcePixelFormat !== "string") return null;
  return SAFE_NVDEC_DOWNLOAD_FORMATS[sourcePixelFormat.toLowerCase()] || null;
}

async function selectSourceDecoder({ sourcePixelFormat, probeNvdec }) {
  const downloadPixelFormat = getNvdecDownloadPixelFormat(sourcePixelFormat);
  if (!downloadPixelFormat || typeof probeNvdec !== "function") {
    return {
      mode: "software",
      downloadPixelFormat: null,
      reason: !downloadPixelFormat
        ? `формат ${sourcePixelFormat || "неизвестен"} пока не включён в безопасный список NVDEC`
        : "проверка NVDEC недоступна"
    };
  }
  try {
    await probeNvdec(downloadPixelFormat);
    return { mode: "cuda", downloadPixelFormat, reason: null };
  } catch (error) {
    return {
      mode: "software",
      downloadPixelFormat: null,
      reason: String(error && error.message || error).slice(-1200)
    };
  }
}

async function runExtractionWithNvdecFallback({ decoderMode, runHardware, runSoftware, onNvdecFailure }) {
  if (typeof runSoftware !== "function") throw new Error("Не задан программный декодер исходного видео.");
  if (decoderMode !== "cuda") {
    return { mode: "software", usedHardware: false, result: await runSoftware(), fallback: false };
  }
  if (typeof runHardware !== "function") throw new Error("Не задан аппаратный декодер NVDEC.");
  try {
    return { mode: "cuda", usedHardware: true, result: await runHardware(), fallback: false };
  } catch (error) {
    if (typeof onNvdecFailure === "function") await onNvdecFailure(error);
    return { mode: "software", usedHardware: false, result: await runSoftware(), fallback: true, hardwareError: error };
  }
}

function buildNvdecProbeArgs({ inputPath, downloadPixelFormat, nullOutputPath }) {
  if (typeof inputPath !== "string" || !inputPath.trim() ||
      !["nv12", "p010le"].includes(downloadPixelFormat) ||
      typeof nullOutputPath !== "string" || !nullOutputPath.trim()) {
    throw new Error("Некорректные параметры проверки NVDEC.");
  }
  return [
    "-hide_banner", "-loglevel", "error", "-nostdin", "-xerror",
    "-hwaccel", "cuda", "-hwaccel_output_format", "cuda",
    "-i", inputPath,
    "-map", "0:v:0", "-an",
    "-vf", `hwdownload,format=${downloadPixelFormat}`,
    "-frames:v", "1", "-f", "null", nullOutputPath
  ];
}

module.exports = {
  SAFE_NVDEC_DOWNLOAD_FORMATS,
  getNvdecDownloadPixelFormat,
  selectSourceDecoder,
  runExtractionWithNvdecFallback,
  buildNvdecProbeArgs
};
