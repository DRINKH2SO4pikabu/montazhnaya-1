"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const MIB = 1024 * 1024;
const DEFAULT_RESERVE_BYTES = 256 * MIB;
const PNG_EXPECTED_RATIO = 0.14;
const PNG_UPPER_RATIO = 0.30;
const PNG_EXPECTED_OVERHEAD = 12 * 1024;
const PNG_UPPER_OVERHEAD = 24 * 1024;
const SOURCE_FRAME_CACHE_LIMIT_BYTES = 512 * MIB;

function safePositiveInteger(value, label, maximum = 16384) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${label} должно быть целым числом от 1 до ${maximum}.`);
  }
  return value;
}

function estimateExportStorage(input) {
  if (!input || typeof input !== "object") throw new Error("Не переданы параметры оценки дискового пространства.");
  const width = safePositiveInteger(input.width, "Ширина кадра");
  const height = safePositiveInteger(input.height, "Высота кадра");
  const frameCount = safePositiveInteger(input.frameCount, "Количество кадров", 100000);
  const fps = safePositiveInteger(input.fps, "FPS", 120);
  const duration = Number(input.duration);
  const audioBytes = input.audioBytes == null ? 0 : Number(input.audioBytes);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 60 * 60) {
    throw new Error("Длительность экспорта для оценки диска некорректна.");
  }
  if (!Number.isSafeInteger(audioBytes) || audioBytes < 0 || audioBytes > 512 * MIB) {
    throw new Error("Размер подготовленного WAV для оценки диска некорректен.");
  }

  const pixelsPerFrame = width * height;
  const rawFrameBytes = pixelsPerFrame * 4;
  const pngExpectedPerFrame = Math.ceil(rawFrameBytes * PNG_EXPECTED_RATIO + PNG_EXPECTED_OVERHEAD);
  const pngUpperPerFrame = Math.ceil(rawFrameBytes * PNG_UPPER_RATIO + PNG_UPPER_OVERHEAD);
  const pngExpectedBytes = pngExpectedPerFrame * frameCount;
  const pngUpperBytes = pngUpperPerFrame * frameCount;
  const streamFrames = input.streamFrames === true;
  const sourceVideoCount = input.sourceVideoCount == null ? 0 : Number(input.sourceVideoCount);
  if (!Number.isInteger(sourceVideoCount) || sourceVideoCount < 0 || sourceVideoCount > 10000) {
    throw new Error("Количество исходных видео для оценки оконного кэша некорректно.");
  }
  const sourceFrameCacheLimitBytes = streamFrames && sourceVideoCount > 0 ? SOURCE_FRAME_CACHE_LIMIT_BYTES : 0;
  const diskPngExpectedBytes = streamFrames ? 0 : pngExpectedBytes;
  const diskPngUpperBytes = streamFrames ? 0 : pngUpperBytes;

  // This is a planning estimate for CRF-based H.264 output, not a promised bitrate.
  // The upper estimate includes headroom for detail/noise-heavy source material.
  const pixelsInMegapixels = pixelsPerFrame / 1_000_000;
  const estimatedVideoBitrate = Math.max(1_500_000, pixelsInMegapixels * fps * 115_000);
  const mp4ExpectedBytes = Math.ceil((estimatedVideoBitrate * duration) / 8 + 2 * MIB);
  const mp4UpperBytes = Math.ceil(mp4ExpectedBytes * 1.5 + 3 * MIB);
  const totalUpper = diskPngUpperBytes + sourceFrameCacheLimitBytes + audioBytes + mp4UpperBytes * 2;
  const reserveBytes = Math.max(DEFAULT_RESERVE_BYTES, Math.ceil(totalUpper * 0.15));

  return {
    width,
    height,
    frameCount,
    fps,
    duration,
    audioBytes,
    rawFrameBytes,
    pngExpectedPerFrame,
    pngUpperPerFrame,
    pngExpectedBytes,
    pngUpperBytes,
    diskPngExpectedBytes,
    diskPngUpperBytes,
    streamFrames,
    sourceVideoCount,
    sourceFrameCacheLimitBytes,
    mp4ExpectedBytes,
    mp4UpperBytes,
    reserveBytes,
    sequenceLimitBytes: 2 * 1024 * 1024 * 1024,
    expectedSequenceLimitExceeded: pngExpectedBytes > 2 * 1024 * 1024 * 1024,
    upperSequenceLimitExceeded: pngUpperBytes > 2 * 1024 * 1024 * 1024
  };
}

async function queryDiskSpace(targetPath, fsApi = fs) {
  if (typeof targetPath !== "string" || !targetPath) throw new Error("Не задан путь к проверяемому диску.");
  const [statfs, stat] = await Promise.all([
    fsApi.statfs(targetPath),
    fsApi.stat(targetPath)
  ]);
  const blockSize = Number(statfs.bsize);
  const availableBlocks = Number(statfs.bavail == null ? statfs.bfree : statfs.bavail);
  const freeBytes = blockSize * availableBlocks;
  if (!Number.isFinite(freeBytes) || freeBytes < 0) throw new Error("Файловая система вернула некорректное значение свободного места.");
  return {
    path: targetPath,
    freeBytes: Math.floor(freeBytes),
    deviceId: stat.dev == null ? null : String(stat.dev),
    root: path.parse(path.resolve(targetPath)).root.toLowerCase()
  };
}

function sameVolume(first, second) {
  if (!first || !second) return false;
  if (first.deviceId != null && second.deviceId != null && first.deviceId !== "0" && second.deviceId !== "0") {
    return first.deviceId === second.deviceId;
  }
  return !!first.root && first.root === second.root;
}

function assessDiskSpace(estimate, tempVolume, outputVolume, isSameVolume) {
  const issues = [];
  const checks = [];
  const reserve = estimate.reserveBytes;

  const tempExpected = (estimate.diskPngExpectedBytes == null ? estimate.pngExpectedBytes : estimate.diskPngExpectedBytes) +
    (estimate.sourceFrameCacheLimitBytes || 0) + estimate.audioBytes + estimate.mp4ExpectedBytes + reserve +
    (isSameVolume ? estimate.mp4ExpectedBytes : 0);
  const tempUpper = (estimate.diskPngUpperBytes == null ? estimate.pngUpperBytes : estimate.diskPngUpperBytes) +
    (estimate.sourceFrameCacheLimitBytes || 0) + estimate.audioBytes + estimate.mp4UpperBytes + reserve +
    (isSameVolume ? estimate.mp4UpperBytes : 0);
  const tempFree = tempVolume && Number.isFinite(tempVolume.freeBytes) ? tempVolume.freeBytes : null;
  if (tempFree == null) {
    issues.push({ severity: "unknown", message: "Не удалось определить свободное место на диске временных файлов." });
  } else if (tempFree < tempExpected) {
    issues.push({ severity: "blocking", message: "На диске временных файлов недостаточно свободного места даже по базовой оценке." });
  } else if (tempFree < tempUpper) {
    issues.push({ severity: "warning", message: "Запас места на диске временных файлов меньше консервативной оценки." });
  }
  checks.push({ kind: "temporary", availableBytes: tempFree, expectedBytes: tempExpected, conservativeBytes: tempUpper });

  if (!isSameVolume) {
    const outputExpected = estimate.mp4ExpectedBytes + reserve;
    const outputUpper = estimate.mp4UpperBytes + reserve;
    const outputFree = outputVolume && Number.isFinite(outputVolume.freeBytes) ? outputVolume.freeBytes : null;
    if (outputFree == null) {
      issues.push({ severity: "unknown", message: "Не удалось определить свободное место на диске сохранения MP4." });
    } else if (outputFree < outputExpected) {
      issues.push({ severity: "blocking", message: "На диске сохранения MP4 недостаточно свободного места даже по базовой оценке." });
    } else if (outputFree < outputUpper) {
      issues.push({ severity: "warning", message: "Запас места на диске сохранения MP4 меньше консервативной оценки." });
    }
    checks.push({ kind: "output", availableBytes: outputFree, expectedBytes: outputExpected, conservativeBytes: outputUpper });
  }

  if (!estimate.streamFrames) {
    if (estimate.expectedSequenceLimitExceeded) {
      issues.push({ severity: "warning", message: "Ожидаемая оценка PNG превышает внутренний предел последовательности 2 ГиБ. Фактический размер зависит от содержимого кадров; если фактический предел будет превышен, текущий экспорт остановится с очисткой временных файлов." });
    } else if (estimate.upperSequenceLimitExceeded) {
      issues.push({ severity: "warning", message: "Консервативная оценка PNG может приблизиться к внутреннему пределу 2 ГиБ. Фактический размер зависит от содержимого кадров." });
    }
  }

  const status = issues.some(item => item.severity === "blocking") ? "insufficient" :
    issues.some(item => item.severity === "warning") ? "warning" :
      issues.some(item => item.severity === "unknown") ? "unknown" : "ok";
  return { status, issues, checks, sameVolume: !!isSameVolume };
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value < 0) return "неизвестно";
  if (value < MIB) return `${Math.round(value / 1024)} КиБ`;
  const gib = value / (1024 * MIB);
  if (gib >= 1) return `${gib.toFixed(2)} ГиБ`;
  return `${(value / MIB).toFixed(0)} МиБ`;
}

function calculateRemainingRequirements(estimate, options = {}) {
  const remainingOutputFrames = Math.max(0, Math.min(estimate.frameCount,
    Number.isInteger(options.remainingOutputFrames) ? options.remainingOutputFrames : estimate.frameCount));
  const pendingSourceFrames = Math.max(0, Number.isInteger(options.pendingSourceFrames) ? options.pendingSourceFrames : 0);
  const sourceWidth = Number.isInteger(options.sourceWidth) && options.sourceWidth > 0 ? options.sourceWidth : 0;
  const sourceHeight = Number.isInteger(options.sourceHeight) && options.sourceHeight > 0 ? options.sourceHeight : 0;
  // Source-frame windows are written as lossless PNG. Reserve up to the raw
  // RGBA surface size rather than the smaller output-PNG heuristic; detailed
  // or noisy frames can compress poorly and must not overrun the preflight.
  const pendingSourceBytes = sourceWidth && sourceHeight
    ? pendingSourceFrames * Math.ceil(sourceWidth * sourceHeight * 4 + PNG_UPPER_OVERHEAD)
    : 0;
  const remainingOutputBytes = estimate.streamFrames ? 0 : remainingOutputFrames * estimate.pngUpperPerFrame;
  const audioBytes = options.includeAudioBytes === false ? 0 : estimate.audioBytes;
  const tempMp4Bytes = options.includeTempMp4 === false ? 0 : estimate.mp4UpperBytes;
  const finalCopyBytes = options.includeFinalCopy === false ? 0 : estimate.mp4UpperBytes;
  const reserveBytes = options.includeReserve === false ? 0 : estimate.reserveBytes;
  return {
    remainingOutputBytes,
    pendingSourceBytes,
    audioBytes,
    tempMp4Bytes,
    finalCopyBytes,
    reserveBytes,
    temporaryRequiredBytes: remainingOutputBytes + pendingSourceBytes + audioBytes + tempMp4Bytes + finalCopyBytes + reserveBytes
  };
}

module.exports = {
  MIB,
  DEFAULT_RESERVE_BYTES,
  SOURCE_FRAME_CACHE_LIMIT_BYTES,
  estimateExportStorage,
  queryDiskSpace,
  sameVolume,
  assessDiskSpace,
  calculateRemainingRequirements,
  formatBytes
};
