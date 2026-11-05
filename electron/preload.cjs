"use strict";

const { contextBridge, ipcRenderer, webUtils } = require("electron");

// IMPORTANT: this preload runs with sandbox:true. Electron's sandboxed
// preload require() can load Electron modules only; local CommonJS modules
// must not be required here. Keep this small, defensive formatter self-contained
// so the bridge is always exposed before the renderer starts.
const PLURAL_CATEGORIES = new Set(["zero", "one", "two", "few", "many", "other"]);

function sanitizeSemanticLocaleData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return Object.freeze({
      nouns: Object.freeze({}), cases: Object.freeze({}), genitive: Object.freeze({}),
      messages: Object.freeze({}), reviewStatus: "unreviewed"
    });
  }
  const nouns = Object.create(null);
  for (const [nounKey, rawForms] of Object.entries(data)) {
    if (["messages", "reviewStatus", "genitive", "cases"].includes(nounKey)) continue;
    if (!rawForms || typeof rawForms !== "object" || Array.isArray(rawForms)) continue;
    const forms = Object.create(null);
    for (const [category, phrase] of Object.entries(rawForms)) {
      if (PLURAL_CATEGORIES.has(category) && typeof phrase === "string" && phrase.length <= 160) forms[category] = phrase;
    }
    if (Object.keys(forms).length) nouns[nounKey] = Object.freeze(forms);
  }
  const cases = Object.create(null);
  const rawCases = data.cases && typeof data.cases === "object" && !Array.isArray(data.cases) ? data.cases : {};
  const legacyGenitive = data.genitive && typeof data.genitive === "object" && !Array.isArray(data.genitive) ? data.genitive : {};
  for (const caseName of new Set([...Object.keys(rawCases), ...(Object.keys(legacyGenitive).length ? ["genitive"] : [])])) {
    const rawCase = rawCases[caseName] || (caseName === "genitive" ? legacyGenitive : null);
    if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) continue;
    const caseNouns = Object.create(null);
    for (const [nounKey, rawForms] of Object.entries(rawCase)) {
      if (!rawForms || typeof rawForms !== "object" || Array.isArray(rawForms)) continue;
      const forms = Object.create(null);
      for (const [category, phrase] of Object.entries(rawForms)) {
        if (PLURAL_CATEGORIES.has(category) && typeof phrase === "string" && phrase.length <= 160) forms[category] = phrase;
      }
      if (Object.keys(forms).length) caseNouns[nounKey] = Object.freeze(forms);
    }
    if (Object.keys(caseNouns).length) cases[caseName] = Object.freeze(caseNouns);
  }
  const genitive = cases.genitive || Object.freeze(Object.create(null));
  const messages = Object.create(null);
  if (data.messages && typeof data.messages === "object" && !Array.isArray(data.messages)) {
    for (const [key, value] of Object.entries(data.messages)) {
      if (typeof key === "string" && key.length <= 160 && typeof value === "string" && value.length <= 2000) messages[key] = value;
    }
  }
  return Object.freeze({
    nouns: Object.freeze(nouns), cases: Object.freeze(cases), genitive,
    messages: Object.freeze(messages),
    reviewStatus: typeof data.reviewStatus === "string" ? data.reviewStatus : "unreviewed"
  });
}

function formatSemanticMessage(data, locale, key, values = {}) {
  const template = data && data.messages && data.messages[key];
  if (typeof template !== "string") return key;
  let numberLocale = "en";
  try { numberLocale = Intl.getCanonicalLocales(String(locale || "en").replace(/_/g, "-"))[0] || "en"; }
  catch (_) { numberLocale = "en"; }
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (token, name) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return token;
    const value = values[name];
    if (typeof value === "number") {
      try { return new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 2 }).format(value); }
      catch (_) { return String(value); }
    }
    return String(value == null ? "" : value);
  });
}

let activeUiLocale = "en";
let activeUiSemantic = sanitizeSemanticLocaleData(null);
let fallbackUiSemantic = sanitizeSemanticLocaleData(null);

function resolveIpcErrorMessage(error) {
  const key = error && typeof error.key === "string" ? error.key : "error.operation.failed";
  const params = error && error.params && typeof error.params === "object" ? error.params : {};
  const localized = formatSemanticMessage(activeUiSemantic, activeUiLocale, key, params);
  if (localized !== key) return localized;
  const fallback = formatSemanticMessage(fallbackUiSemantic, "en", key, params);
  return fallback !== key ? fallback : "The operation could not be completed.";
}

function localizeIpcResult(result) {
  if (!result || typeof result !== "object" || result.status !== "error" || !result.error) return result;
  // The IPC contract carries only codes, keys and safe parameters. Add the
  // localized message here as a backward-compatible renderer convenience.
  return { ...result, message: resolveIpcErrorMessage(result.error) };
}

function invokeIpc(channel, request) {
  return ipcRenderer.invoke(channel, request).then(localizeIpcResult);
}

const SOURCE_CHUNK_BYTES = 8 * 1024 * 1024;

async function withSourceFileReference(file, operation) {
  if (!file || typeof file.slice !== "function" || !Number.isSafeInteger(file.size) || file.size < 1) {
    throw new Error(resolveIpcErrorMessage({ key: "error.media.invalidFile", params: {} }));
  }

  // Files selected or dropped from the Windows filesystem can be passed to
  // FFmpeg directly. Electron removed File.path in v32; webUtils is the
  // supported way to resolve a disk-backed File without exposing its path to
  // renderer code.
  let diskPath = "";
  try { diskPath = webUtils.getPathForFile(file); } catch (_) { diskPath = ""; }
  if (typeof diskPath === "string" && diskPath.length > 0) {
    return operation({ sourcePath: diskPath });
  }

  // Files reconstructed from a portable project are memory-backed. Stage
  // them to disk in bounded chunks rather than sending one large ArrayBuffer
  // through IPC. Each invocation is awaited, providing backpressure.
  const begin = await invokeIpc("media:stage-file-begin", {
    fileName: typeof file.name === "string" ? file.name : "source.media",
    fileSize: file.size
  });
  if (!begin || begin.status !== "ready" || typeof begin.uploadId !== "string") {
    throw new Error(begin && begin.message || resolveIpcErrorMessage({ key: "error.media.stageFailed", params: {} }));
  }

  const uploadId = begin.uploadId;
  let retainedByExportSession = false;
  try {
    let chunkIndex = 0;
    for (let offset = 0; offset < file.size; offset += SOURCE_CHUNK_BYTES) {
      const end = Math.min(file.size, offset + SOURCE_CHUNK_BYTES);
      const chunkData = await file.slice(offset, end).arrayBuffer();
      const response = await invokeIpc("media:stage-file-write", {
        uploadId,
        chunkIndex,
        chunkData
      });
      if (!response || response.status !== "success" || response.nextChunkIndex !== chunkIndex + 1) {
        throw new Error(response && response.message || resolveIpcErrorMessage({ key: "error.media.stageFailed", params: {} }));
      }
      chunkIndex++;
    }

    const finish = await invokeIpc("media:stage-file-finish", { uploadId });
    if (!finish || finish.status !== "ready" || finish.size !== file.size) {
      throw new Error(finish && finish.message || resolveIpcErrorMessage({ key: "error.media.stageFailed", params: {} }));
    }
    const result = await operation({ stageToken: uploadId });
    retainedByExportSession = !!(result && result.retainSourceStage === true);
    if (retainedByExportSession) {
      const { retainSourceStage, ...publicResult } = result;
      return publicResult;
    }
    return result;
  } finally {
    // Source files registered for lazy decoding remain staged until their
    // export session finishes. Other staged operations clean up immediately.
    if (!retainedByExportSession) {
      await invokeIpc("media:stage-file-cleanup", { uploadId }).catch(() => {});
    }
  }
}

contextBridge.exposeInMainWorld("montazhnaya", {
  // Synchronize the user-selected UI locale with Electron-owned dialogs.
  // The main process validates the sender, locale and message map again.
  setUiLocale: (request) => {
    if (request && typeof request === "object") {
      activeUiLocale = typeof request.locale === "string" ? request.locale : "en";
      activeUiSemantic = sanitizeSemanticLocaleData(request.semantic);
      fallbackUiSemantic = sanitizeSemanticLocaleData(request.semanticFallback);
    }
    return invokeIpc("ui:set-locale", request);
  },
  saveStillFrame: (request) => withSourceFileReference(
    request && request.blob,
    sourceRef => invokeIpc("frame:save-still", {
      suggestedName: request && request.suggestedName,
      format: request && request.format,
      mimeType: request && request.mimeType,
      width: request && request.width,
      height: request && request.height,
      timeSeconds: request && request.timeSeconds,
      frameNumber: request && request.frameNumber,
      ...sourceRef
    })
  ),
  runToolDiagnostics: () => invokeIpc("system:tool-diagnostics"),
  getFrameSequenceExportCapabilities: () => invokeIpc("export:get-codec-capabilities"),
  inspectWebmDuration: (request) => withSourceFileReference(
    request && request.file,
    sourceRef => invokeIpc("media:inspect-webm-duration", sourceRef)
  ),
  beginFrameSequenceExport: (request) => invokeIpc("export:begin-png-sequence", request),
  // Start the managed FFmpeg image2pipe encoder. If the export includes an
  // offline audio mix, stage that Blob through the same bounded file path.
  startFrameSequenceEncoding: (request) => {
    const invoke = sourceRef => invokeIpc("export:start-png-stream", {
      sessionId: request.sessionId,
      ...sourceRef
    });
    return request && request.audioBlob
      ? withSourceFileReference(request.audioBlob, invoke)
      : invoke({});
  },
  writeFrameSequenceFrame: (request) => invokeIpc("export:write-png-frame", request),
  prepareFrameSequenceSourceFrames: (request) => withSourceFileReference(
    request && request.sourceFile,
    sourceRef => invokeIpc("export:prepare-source-frames", {
      sessionId: request.sessionId,
      mediaId: request.mediaId,
      sourceName: request.sourceName,
      expectedFps: request.expectedFps,
      frameIndices: request.frameIndices,
      ...sourceRef
    })
  ),
  extractVideoAudioForExport: (request) => withSourceFileReference(
    request && request.sourceFile,
    sourceRef => invokeIpc("media:extract-video-audio", {
      mediaId: request.mediaId,
      ...sourceRef
    })
  ),
  inspectAudioMedia: (request) => withSourceFileReference(
    request && request.file,
    sourceRef => invokeIpc("media:inspect-audio", {
      mediaId: request && request.mediaId,
      ...sourceRef
    })
  ),
  prepareAudioForExport: (request) => withSourceFileReference(
    request && request.file,
    sourceRef => invokeIpc("media:prepare-audio", {
      mediaId: request && request.mediaId,
      mediaName: request && request.mediaName,
      alignToVideo: !!(request && request.alignToVideo),
      ...sourceRef
    })
  ),
  readFrameSequenceSourceFrame: (request) => invokeIpc("export:read-source-frame", request),
  finishFrameSequenceExport: (request) => invokeIpc("export:finish-png-sequence", request),
  cancelFrameSequenceExport: (request) => invokeIpc("export:cancel-png-sequence", request),
  onFrameSequenceProgress: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("export:ffmpeg-progress", listener);
    return () => ipcRenderer.removeListener("export:ffmpeg-progress", listener);
  }
});
