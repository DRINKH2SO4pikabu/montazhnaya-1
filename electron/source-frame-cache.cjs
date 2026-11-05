"use strict";

const MIB = 1024 * 1024;
const MAX_SOURCE_FRAME_CACHE_BYTES = 512 * MIB;
const DEFAULT_SOURCE_FRAME_WINDOW_FRAMES = 48;
// Planning heuristic for compressed source PNG batches. This is deliberately
// separate from disk-space preflight, which still reserves the raw RGBA upper
// bound. The actual PNG file sizes remain the hard 512 MiB cache guard.
const SOURCE_FRAME_WINDOW_PNG_ESTIMATE_RATIO = 0.25;
const MIN_SOURCE_FRAME_WINDOW_FRAMES = 1;
const SOURCE_FRAME_WINDOW_LOOK_BEHIND = 2;

function reduceSourceFrameWindowSize(windowFrames) {
  if (!Number.isInteger(windowFrames) || windowFrames <= 1) return null;
  return Math.max(1, Math.floor(windowFrames / 2));
}

function lowerBound(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (values[middle] < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function selectSourceFrameWindow(
  frameIndices,
  requestedIndex,
  windowFrames = DEFAULT_SOURCE_FRAME_WINDOW_FRAMES,
  lookBehind = SOURCE_FRAME_WINDOW_LOOK_BEHIND,
  maxFrameSpan = Math.max(1, windowFrames * 4)
) {
  if (!Array.isArray(frameIndices) || frameIndices.length === 0) {
    throw new Error("Для оконного декодирования не зарегистрированы индексы исходных кадров.");
  }
  if (!Number.isInteger(requestedIndex) || !Number.isInteger(windowFrames) || windowFrames < 1 ||
      !Number.isInteger(lookBehind) || lookBehind < 0 || !Number.isInteger(maxFrameSpan) || maxFrameSpan < 1) {
    throw new Error("Некорректные параметры окна исходных кадров.");
  }
  const position = lowerBound(frameIndices, requestedIndex);
  if (position >= frameIndices.length || frameIndices[position] !== requestedIndex) {
    throw new Error(`Исходный кадр ${requestedIndex} не входит в зарегистрированный план экспорта.`);
  }
  let start = Math.max(0, position - lookBehind);
  let end = Math.min(frameIndices.length, start + windowFrames);
  if (end - start < windowFrames) start = Math.max(0, end - windowFrames);
  // Sparse plans can contain clips from distant timeline sections that reuse
  // the same source. Do not decode across a large temporal gap just to fill a
  // count-based window; keep only indices near the requested source timestamp.
  const minFrame = requestedIndex - maxFrameSpan;
  const maxFrame = requestedIndex + maxFrameSpan;
  while (start < end && frameIndices[start] < minFrame) start++;
  while (end > start && frameIndices[end - 1] > maxFrame) end--;
  return frameIndices.slice(start, end);
}

function estimateSourceFrameWindowBytes(width, height, frameCount, ratio = 1, overhead = 24 * 1024) {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 ||
      !Number.isInteger(frameCount) || frameCount < 0 || !Number.isFinite(ratio) || ratio <= 0 || ratio > 1 ||
      !Number.isSafeInteger(overhead) || overhead < 0) {
    throw new Error("Некорректные параметры оценки дискового окна исходных кадров.");
  }
  const perFrame = Math.ceil(width * height * 4 * ratio + overhead);
  const total = perFrame * frameCount;
  if (!Number.isSafeInteger(total)) throw new Error("Оценка окна исходных кадров превышает безопасный целочисленный диапазон.");
  return { perFrameBytes: perFrame, totalBytes: total };
}

function calculateSourceFrameCacheEvictions(cacheEntries, currentBytes, targetBytes, protectedKeys = new Set()) {
  if (!(cacheEntries instanceof Map) || !Number.isSafeInteger(currentBytes) || currentBytes < 0 ||
      !Number.isSafeInteger(targetBytes) || targetBytes < 0 || !(protectedKeys instanceof Set)) {
    throw new Error("Некорректные параметры очистки кэша исходных кадров.");
  }
  const candidates = Array.from(cacheEntries.entries())
    .filter(([key]) => !protectedKeys.has(key))
    .sort((a, b) => (Number(a[1].lastUsed) || 0) - (Number(b[1].lastUsed) || 0));
  const evictKeys = [];
  let remainingBytes = currentBytes;
  for (const [key, entry] of candidates) {
    if (remainingBytes <= targetBytes) break;
    evictKeys.push(key);
    remainingBytes -= Math.max(0, Number(entry.sizeBytes) || 0);
  }
  if (remainingBytes > targetBytes) {
    throw new Error("Не удалось освободить место в оконном кэше: защищённые или занятые кадры превышают бюджет.");
  }
  return { evictKeys, remainingBytes, bytesToFree: currentBytes - remainingBytes };
}

function buildSourceFrameCacheKey(mediaId, frameIndex) {
  if (typeof mediaId !== "string" || !mediaId || !Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new Error("Некорректный ключ кэша исходного кадра.");
  }
  return `${mediaId}\u0000${frameIndex}`;
}

module.exports = {
  MIB,
  MAX_SOURCE_FRAME_CACHE_BYTES,
  DEFAULT_SOURCE_FRAME_WINDOW_FRAMES,
  SOURCE_FRAME_WINDOW_PNG_ESTIMATE_RATIO,
  reduceSourceFrameWindowSize,
  MIN_SOURCE_FRAME_WINDOW_FRAMES,
  SOURCE_FRAME_WINDOW_LOOK_BEHIND,
  lowerBound,
  selectSourceFrameWindow,
  estimateSourceFrameWindowBytes,
  calculateSourceFrameCacheEvictions,
  buildSourceFrameCacheKey
};
