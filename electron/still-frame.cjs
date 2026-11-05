"use strict";

const path = require("node:path");

const MAX_STILL_FRAME_BYTES = 256 * 1024 * 1024;
const MAX_STILL_FRAME_DIMENSION = 16384;
const MAX_STILL_FRAME_PIXELS = 100_000_000;
const STILL_FRAME_FORMATS = Object.freeze({
  png: Object.freeze({ mimeType: "image/png", extension: ".png" }),
  jpeg: Object.freeze({ mimeType: "image/jpeg", extension: ".jpg" })
});

function sanitizeStillFrameName(value, fallback = "montazhnaya_frame") {
  let name = String(value == null ? "" : value)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 120);
  if (!name || name === "." || name === "..") name = fallback;
  return name;
}

function validateStillFrameRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("Не переданы настройки сохранения кадра.");
  }
  const format = String(request.format || "").toLowerCase();
  const definition = STILL_FRAME_FORMATS[format];
  if (!definition) throw new Error("Поддерживаются только форматы PNG и JPEG.");
  if (request.mimeType !== definition.mimeType) {
    throw new Error("Тип изображения не соответствует выбранному формату.");
  }
  const width = Number(request.width);
  const height = Number(request.height);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 2 || height < 2 || width > MAX_STILL_FRAME_DIMENSION || height > MAX_STILL_FRAME_DIMENSION ||
      width * height > MAX_STILL_FRAME_PIXELS) {
    throw new Error("Размер кадра некорректен или превышает безопасный предел 100 мегапикселей.");
  }
  const timeSeconds = Number(request.timeSeconds);
  const frameNumber = Number(request.frameNumber);
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0 || timeSeconds > 1_000_000 ||
      !Number.isSafeInteger(frameNumber) || frameNumber < 0) {
    throw new Error("Временная позиция или номер кадра некорректны.");
  }
  if (typeof request.stageToken !== "string" || !request.stageToken || request.stageToken.length > 128) {
    throw new Error("Не передан временный идентификатор изображения.");
  }
  return {
    format,
    mimeType: definition.mimeType,
    extension: definition.extension,
    width,
    height,
    timeSeconds,
    frameNumber,
    suggestedName: sanitizeStillFrameName(request.suggestedName)
  };
}

function validateStillFramePayload(format, size, firstBytes, lastBytes) {
  const definition = STILL_FRAME_FORMATS[String(format || "").toLowerCase()];
  if (!definition) throw new Error("Неизвестный формат сохраняемого кадра.");
  if (!Number.isSafeInteger(size) || size < 8 || size > MAX_STILL_FRAME_BYTES) {
    throw new Error(`Размер изображения должен быть от 8 байт до ${MAX_STILL_FRAME_BYTES} байт.`);
  }
  const head = Buffer.isBuffer(firstBytes) ? firstBytes : Buffer.from(firstBytes || []);
  const tail = Buffer.isBuffer(lastBytes) ? lastBytes : Buffer.from(lastBytes || []);
  if (format === "png") {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (head.length < 8 || !head.subarray(0, 8).equals(signature)) {
      throw new Error("Полученные данные не являются корректным PNG-изображением.");
    }
  } else {
    if (head.length < 3 || head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff ||
        tail.length < 2 || tail[tail.length - 2] !== 0xff || tail[tail.length - 1] !== 0xd9) {
      throw new Error("Полученные данные не являются корректным JPEG-изображением.");
    }
  }
  return { size, format, mimeType: definition.mimeType };
}

function resolveStillFrameOutputPath(selectedPath, format) {
  const definition = STILL_FRAME_FORMATS[String(format || "").toLowerCase()];
  if (!definition) throw new Error("Неизвестный формат сохраняемого кадра.");
  const candidate = String(selectedPath || "").trim();
  if (!candidate || (!path.isAbsolute(candidate) && !path.win32.isAbsolute(candidate))) throw new Error("Не выбрана корректная папка сохранения кадра.");
  const currentExtension = path.extname(candidate).toLowerCase();
  if (format === "jpeg" && (currentExtension === ".jpg" || currentExtension === ".jpeg")) return candidate;
  if (format === "png" && currentExtension === ".png") return candidate;
  return currentExtension
    ? candidate.slice(0, -currentExtension.length) + definition.extension
    : candidate + definition.extension;
}

module.exports = {
  MAX_STILL_FRAME_BYTES,
  MAX_STILL_FRAME_DIMENSION,
  MAX_STILL_FRAME_PIXELS,
  STILL_FRAME_FORMATS,
  sanitizeStillFrameName,
  validateStillFrameRequest,
  validateStillFramePayload,
  resolveStillFrameOutputPath
};
