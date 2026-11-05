"use strict";

const DEFAULT_SOURCE_RENDER_OVERSAMPLE = 1.5;
const MAX_TRANSITION_SCALE_GUARD = 1.25;
const MIN_EVEN_DIMENSION = 2;

/**
 * Computes a bounded, aspect-preserving working size for source frames used by
 * offline export. It never upscales the source. The target output size is padded
 * by an oversampling margin and the largest user-authored clip scale so Canvas
 * retains detail for ordinary pan/zoom/transition operations.
 */
function calculateSourceFrameRenderSize(sourceWidth, sourceHeight, outputWidth, outputHeight, maxClipScale = 1) {
  for (const [name, value] of Object.entries({
    sourceWidth, sourceHeight, outputWidth, outputHeight
  })) {
    if (!Number.isInteger(value) || value < 2 || value > 16384) {
      throw new Error(`Некорректный размер ${name} для рабочих кадров исходного видео.`);
    }
  }
  if (!Number.isFinite(maxClipScale) || maxClipScale < 0.1 || maxClipScale > 5) {
    throw new Error("Масштаб клипа для подготовки рабочих кадров должен быть от 0,1 до 5.");
  }

  const sourceMaxDimension = Math.max(sourceWidth, sourceHeight);
  const requestedMaxDimension = Math.ceil(
    Math.max(outputWidth, outputHeight) *
    DEFAULT_SOURCE_RENDER_OVERSAMPLE *
    Math.max(1, maxClipScale) *
    MAX_TRANSITION_SCALE_GUARD
  );
  const scale = Math.min(1, requestedMaxDimension / sourceMaxDimension);

  if (scale >= 1) {
    return {
      width: sourceWidth,
      height: sourceHeight,
      scale: 1,
      downscaled: false,
      requestedMaxDimension
    };
  }

  // PNG/4:2:0 processing benefits from even dimensions. Rounding down avoids
  // accidentally exceeding the bounded target after aspect-preserving scaling.
  const width = Math.max(MIN_EVEN_DIMENSION, Math.floor((sourceWidth * scale) / 2) * 2);
  const height = Math.max(MIN_EVEN_DIMENSION, Math.floor((sourceHeight * scale) / 2) * 2);
  return {
    width: Math.min(sourceWidth, width),
    height: Math.min(sourceHeight, height),
    scale: Math.min(width / sourceWidth, height / sourceHeight),
    downscaled: width < sourceWidth || height < sourceHeight,
    requestedMaxDimension
  };
}

module.exports = {
  DEFAULT_SOURCE_RENDER_OVERSAMPLE,
  MAX_TRANSITION_SCALE_GUARD,
  calculateSourceFrameRenderSize
};
