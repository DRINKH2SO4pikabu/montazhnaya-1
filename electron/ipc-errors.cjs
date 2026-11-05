"use strict";

// IPC is an application API: it must never expose user-facing prose created by
// the main process. Every failure crosses the bridge as a stable code/key and
// bounded interpolation parameters. The preload resolves the key using the
// currently selected locale and adds a temporary `message` compatibility
// field for renderer code that has not yet been migrated to the error object.

const ERROR_DEFINITIONS = Object.freeze({
  "error.ipc.untrustedRequest": Object.freeze({ code: "IPC_UNTRUSTED_REQUEST", retryable: false }),
  "error.locale.syncFailed": Object.freeze({ code: "LOCALE_SYNC_FAILED", retryable: true }),
  "error.operation.failed": Object.freeze({ code: "OPERATION_FAILED", retryable: true }),
  "error.media.stageFailed": Object.freeze({ code: "MEDIA_STAGE_FAILED", retryable: true }),
  "error.media.inspectFailed": Object.freeze({ code: "MEDIA_INSPECTION_FAILED", retryable: true }),
  "error.media.invalidFile": Object.freeze({ code: "MEDIA_FILE_INVALID", retryable: false }),
  "error.media.probeFailed": Object.freeze({ code: "MEDIA_PROBE_FAILED", retryable: true }),
  "error.export.capabilitiesFailed": Object.freeze({ code: "EXPORT_CAPABILITIES_FAILED", retryable: true }),
  "error.export.beginFailed": Object.freeze({ code: "EXPORT_BEGIN_FAILED", retryable: true }),
  "error.export.writeFrameFailed": Object.freeze({ code: "EXPORT_FRAME_WRITE_FAILED", retryable: true }),
  "error.export.startFailed": Object.freeze({ code: "EXPORT_START_FAILED", retryable: true }),
  "error.export.prepareSourceFramesFailed": Object.freeze({ code: "EXPORT_SOURCE_PREPARATION_FAILED", retryable: true }),
  "error.export.readSourceFrameFailed": Object.freeze({ code: "EXPORT_SOURCE_FRAME_READ_FAILED", retryable: true }),
  "error.export.finishFailed": Object.freeze({ code: "EXPORT_FINALIZATION_FAILED", retryable: true }),
  "error.export.cancelFailed": Object.freeze({ code: "EXPORT_CANCELLATION_FAILED", retryable: true }),
  "error.audio.extractFailed": Object.freeze({ code: "AUDIO_EXTRACTION_FAILED", retryable: true }),
  "error.audio.inspectFailed": Object.freeze({ code: "AUDIO_INSPECTION_FAILED", retryable: true }),
  "error.audio.prepareFailed": Object.freeze({ code: "AUDIO_PREPARATION_FAILED", retryable: true }),
  "error.frame.saveFailed": Object.freeze({ code: "FRAME_SAVE_FAILED", retryable: true }),
  "error.diagnostics.failed": Object.freeze({ code: "TOOL_DIAGNOSTICS_FAILED", retryable: true }),
  "error.storage.insufficientSpace": Object.freeze({ code: "STORAGE_INSUFFICIENT_SPACE", retryable: true }),
  "error.tool.ffmpegMissing": Object.freeze({ code: "TOOL_FFMPEG_MISSING", retryable: false }),
  "error.tool.ffprobeMissing": Object.freeze({ code: "TOOL_FFPROBE_MISSING", retryable: false }),
  "error.tool.notFound": Object.freeze({ code: "TOOL_NOT_FOUND", retryable: false }),
  "error.process.timeout": Object.freeze({ code: "PROCESS_TIMEOUT", retryable: true }),
  "error.process.permissionDenied": Object.freeze({ code: "PROCESS_PERMISSION_DENIED", retryable: false }),
  "error.export.validationFailed": Object.freeze({ code: "EXPORT_VALIDATION_FAILED", retryable: true }),
  "error.export.sessionInvalid": Object.freeze({ code: "EXPORT_SESSION_INVALID", retryable: false }),
  "error.export.busy": Object.freeze({ code: "EXPORT_BUSY", retryable: true }),
  "error.audio.trackMissing": Object.freeze({ code: "AUDIO_TRACK_MISSING", retryable: false })
});

const CHANNEL_FALLBACKS = Object.freeze({
  "ui:set-locale": "error.locale.syncFailed",
  "frame:save-still": "error.frame.saveFailed",
  "system:tool-diagnostics": "error.diagnostics.failed",
  "export:get-codec-capabilities": "error.export.capabilitiesFailed",
  "export:begin-png-sequence": "error.export.beginFailed",
  "export:write-png-frame": "error.export.writeFrameFailed",
  "export:start-png-stream": "error.export.startFailed",
  "export:prepare-source-frames": "error.export.prepareSourceFramesFailed",
  "export:read-source-frame": "error.export.readSourceFrameFailed",
  "export:finish-png-sequence": "error.export.finishFailed",
  "export:cancel-png-sequence": "error.export.cancelFailed",
  "media:stage-file-begin": "error.media.stageFailed",
  "media:stage-file-write": "error.media.stageFailed",
  "media:stage-file-finish": "error.media.stageFailed",
  "media:stage-file-cleanup": "error.media.stageFailed",
  "media:inspect-webm-duration": "error.media.inspectFailed",
  "media:extract-video-audio": "error.audio.extractFailed",
  "media:inspect-audio": "error.audio.inspectFailed",
  "media:prepare-audio": "error.audio.prepareFailed"
});

function errorMessage(error) {
  if (typeof error === "string") return error;
  if (error && typeof error.message === "string") return error.message;
  return "";
}

function safeParams(params) {
  if (!params || typeof params !== "object" || Array.isArray(params)) return Object.freeze({});
  const clean = Object.create(null);
  for (const [key, value] of Object.entries(params)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) continue;
    if (typeof value === "string") clean[key] = value.slice(0, 240);
    else if (typeof value === "number" && Number.isFinite(value)) clean[key] = value;
    else if (typeof value === "boolean") clean[key] = value;
  }
  return Object.freeze(clean);
}

function classifyIpcError(channel, error) {
  const message = errorMessage(error);
  const nativeCode = error && typeof error.code === "string" ? error.code : "";
  const lower = message.toLowerCase();

  if (/untrusted|не из окна редактора|доверенн/.test(lower)) return { key: "error.ipc.untrustedRequest", params: {} };
  if (["TEMP_DISK_SPACE_LOW", "ENOSPC", "EDQUOT"].includes(nativeCode) || /недостаточно свободного места|заканчивается место|не хватает места|insufficient.*space|disk.*space/.test(lower)) {
    return { key: "error.storage.insufficientSpace", params: {} };
  }
  if (nativeCode === "ENOENT" || /не найден.*path|не найдено.*path|not found.*path/.test(lower)) {
    const toolMatch = message.match(/([a-z0-9_.-]+(?:\.exe)?)\s+(?:не найден|not found)/i);
    const tool = /ffprobe/i.test(message) ? "ffprobe" : /ffmpeg/i.test(message) ? "FFmpeg" : (toolMatch && toolMatch[1]) || "";
    if (tool.toLowerCase() === "ffprobe") return { key: "error.tool.ffprobeMissing", params: {} };
    if (tool.toLowerCase() === "ffmpeg") return { key: "error.tool.ffmpegMissing", params: {} };
    if (/^media:stage-file-/.test(channel)) return { key: "error.media.stageFailed", params: {} };
    if (/^media:/.test(channel)) return { key: "error.media.invalidFile", params: {} };
    if (tool) return { key: "error.tool.notFound", params: { tool } };
    return { key: CHANNEL_FALLBACKS[channel] || "error.operation.failed", params: {} };
  }
  if (/ffmpeg не найден|ffmpeg was not found/.test(lower)) return { key: "error.tool.ffmpegMissing", params: {} };
  if (/ffprobe не найден|ffprobe was not found/.test(lower)) return { key: "error.tool.ffprobeMissing", params: {} };
  if (nativeCode === "ETIMEDOUT" || /не завершил работу за отведённое время|timed out|timeout/.test(lower)) {
    return { key: "error.process.timeout", params: {} };
  }
  if (nativeCode === "EACCES" || nativeCode === "EPERM" || /недостаточно прав|permission denied|access is denied/.test(lower)) {
    return { key: "error.process.permissionDenied", params: {} };
  }
  if (/не найдена звуковая дорожка|не найден.*аудиопоток|no audio stream|audio track.*not found/.test(lower)) {
    return { key: "error.audio.trackMissing", params: {} };
  }
  if (/сессия .*не найдена|некорректный идентификатор сессии|session .*not found|invalid session/.test(lower)) {
    return { key: "error.export.sessionInvalid", params: {} };
  }
  if (/другой экспорт уже выполняется|another export.*progress/.test(lower)) {
    return { key: "error.export.busy", params: {} };
  }
  if (/проверка (mp4|webm)|проверка сохранения|не прошла|не пройдена|cfr временные метки/.test(lower)) {
    return { key: "error.export.validationFailed", params: {} };
  }
  if (/ffprobe|probe|потоки в файле|технические сведения/.test(lower)) {
    return { key: "error.media.probeFailed", params: {} };
  }
  if (/сигнатур|исходный медиафайл пуст|некорректный размер|не имеет корректную сигнатуру|не является корректным png/.test(lower)) {
    return { key: "error.media.invalidFile", params: {} };
  }

  const fallbackKey = CHANNEL_FALLBACKS[channel] || "error.operation.failed";
  return { key: fallbackKey, params: {} };
}

function createIpcError(error, channel) {
  if (error && typeof error === "object" && typeof error.key === "string" && ERROR_DEFINITIONS[error.key]) {
    const definition = ERROR_DEFINITIONS[error.key];
    return Object.freeze({
      code: definition.code,
      key: error.key,
      params: safeParams(error.params),
      retryable: definition.retryable
    });
  }
  const classified = classifyIpcError(channel, error);
  const definition = ERROR_DEFINITIONS[classified.key] || ERROR_DEFINITIONS["error.operation.failed"];
  return Object.freeze({
    code: definition.code,
    key: classified.key,
    params: safeParams(classified.params),
    retryable: definition.retryable
  });
}

function createIpcErrorResult(channel, error, extra = {}) {
  const cleanExtra = extra && typeof extra === "object" && !Array.isArray(extra) ? { ...extra } : {};
  delete cleanExtra.message;
  delete cleanExtra.error;
  return { ...cleanExtra, status: "error", error: createIpcError(error, channel) };
}

function normalizeIpcResult(channel, result) {
  if (!result || typeof result !== "object" || result.status !== "error") return result;
  if (result.error && typeof result.error.key === "string" && ERROR_DEFINITIONS[result.error.key]) {
    const { message, ...rest } = result;
    return { ...rest, status: "error", error: createIpcError(result.error, channel) };
  }
  const { message, ...extra } = result;
  return createIpcErrorResult(channel, message || result, extra);
}

function registerStructuredIpcHandler(ipcMain, channel, handler) {
  if (!ipcMain || typeof ipcMain.handle !== "function") throw new TypeError("ipcMain.handle is required");
  if (typeof channel !== "string" || !channel) throw new TypeError("A non-empty IPC channel is required");
  if (typeof handler !== "function") throw new TypeError("An IPC handler function is required");
  ipcMain.handle(channel, async (event, request) => {
    try {
      const result = await handler(event, request);
      return normalizeIpcResult(channel, result);
    } catch (error) {
      console.error(`[IPC:${channel}] Handler failed`, error);
      return createIpcErrorResult(channel, error);
    }
  });
}

module.exports = {
  ERROR_DEFINITIONS,
  CHANNEL_FALLBACKS,
  classifyIpcError,
  createIpcError,
  createIpcErrorResult,
  normalizeIpcResult,
  registerStructuredIpcHandler
};
