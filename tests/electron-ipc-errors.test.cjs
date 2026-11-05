"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  ERROR_DEFINITIONS,
  CHANNEL_FALLBACKS,
  classifyIpcError,
  createIpcError,
  createIpcErrorResult,
  normalizeIpcResult,
  registerStructuredIpcHandler
} = require("../electron/ipc-errors.cjs");
const { formatSemanticMessage } = require("../electron/i18n-core.cjs");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function loadNotificationCatalog() {
  const source = read("src/renderer/locales/notifications.js");
  const context = {
    window: {
      MontazhnayaLocalePacks: { ru: { messages: {} }, en: { messages: {} } },
      MontazhnayaSemanticCatalog: {
        ru: { messages: {} },
        en: { messages: {} }
      }
    },
    Map,
    Object,
    RegExp,
    Number,
    String
  };
  const vm = require("node:vm");
  vm.runInNewContext(source, context, { filename: "notifications.js" });
  return context.window;
}

test("every Electron IPC error key has a permanent Russian and English message", () => {
  const window = loadNotificationCatalog();
  const entries = window.MontazhnayaNotificationCatalog.entries;
  const byKey = new Map(entries.map(entry => [entry.key, entry]));
  for (const key of Object.keys(ERROR_DEFINITIONS)) {
    assert.ok(byKey.has(key), `Missing catalogue entry for ${key}`);
    assert.ok(window.MontazhnayaSemanticCatalog.ru.messages[key], `Missing Russian message for ${key}`);
    assert.ok(window.MontazhnayaSemanticCatalog.en.messages[key], `Missing English message for ${key}`);
  }
});

test("IPC error classification maps security, disk, tools, media and export validation", () => {
  assert.equal(classifyIpcError("media:inspect-audio", new Error("Запрос получен не из окна редактора.")).key,
    "error.ipc.untrustedRequest");
  assert.equal(classifyIpcError("export:finish-png-sequence", Object.assign(new Error("failed"), { code: "ENOSPC" })).key,
    "error.storage.insufficientSpace");
  assert.equal(classifyIpcError("export:start-png-stream", new Error("FFmpeg не найден. Проверьте PATH.")).key,
    "error.tool.ffmpegMissing");
  assert.equal(classifyIpcError("media:inspect-webm-duration", new Error("ffprobe вернул некорректные данные о файле.")).key,
    "error.media.probeFailed");
  assert.equal(classifyIpcError("export:finish-png-sequence", new Error("Проверка MP4 не пройдена: неверная частота кадров.")).key,
    "error.export.validationFailed");
  assert.equal(classifyIpcError("media:inspect-audio", Object.assign(new Error("ENOENT: no such file or directory"), { code: "ENOENT" })).key,
    "error.media.invalidFile");
  assert.equal(classifyIpcError("export:prepare-source-frames", Object.assign(new Error("ENOENT: no such file or directory"), { code: "ENOENT" })).key,
    "error.export.prepareSourceFramesFailed");
});

test("unknown failures use the stable fallback for their IPC channel", () => {
  for (const [channel, key] of Object.entries(CHANNEL_FALLBACKS)) {
    assert.equal(classifyIpcError(channel, new Error("unclassified internal failure")).key, key, channel);
  }
  assert.equal(classifyIpcError("unregistered:channel", new Error("internal" )).key, "error.operation.failed");
});

test("structured IPC error payloads never expose raw main-process messages", () => {
  const raw = "ffmpeg.exe exited with code 429 and a localized Russian diagnostic";
  const result = createIpcErrorResult("export:start-png-stream", new Error(raw), { mp4: false, webmVp8: false });
  assert.equal(result.status, "error");
  assert.equal(result.mp4, false);
  assert.equal(result.webmVp8, false);
  assert.ok(result.error.code);
  assert.match(result.error.key, /^error\./);
  assert.deepEqual(Object.keys(result.error.params), []);
  assert.equal(Object.hasOwn(result, "message"), false);
  assert.equal(JSON.stringify(result).includes(raw), false);
});

test("structured error parameters are bounded and allow only scalar values", () => {
  const result = createIpcError({ key: "error.tool.notFound", params: {
    tool: "ffprobe", oversized: "x".repeat(5000), object: { secret: true }, invalid: NaN
  } }, "media:inspect-webm-duration");
  assert.equal(result.key, "error.tool.notFound");
  assert.equal(result.params.tool, "ffprobe");
  assert.equal(result.params.oversized.length, 240);
  assert.equal(Object.hasOwn(result.params, "object"), false);
  assert.equal(Object.hasOwn(result.params, "invalid"), false);
});

test("legacy error envelopes are normalized while non-error result fields are preserved", () => {
  const normalized = normalizeIpcResult("export:get-codec-capabilities", {
    status: "error", message: "Не удалось определить кодеки", mp4: false, webmVp8: false
  });
  assert.deepEqual({ status: normalized.status, mp4: normalized.mp4, webmVp8: normalized.webmVp8 },
    { status: "error", mp4: false, webmVp8: false });
  assert.equal(normalized.error.key, "error.export.capabilitiesFailed");
  assert.equal(Object.hasOwn(normalized, "message"), false);
});

test("IPC handler wrapper normalizes returned errors and caught exceptions", async () => {
  const registered = new Map();
  const fakeIpcMain = { handle: (channel, handler) => registered.set(channel, handler) };
  registerStructuredIpcHandler(fakeIpcMain, "media:inspect-audio", async () => ({ status: "error", message: "ffprobe failed" }));
  registerStructuredIpcHandler(fakeIpcMain, "frame:save-still", async () => { throw new Error("EACCES: permission denied"); });

  const returned = await registered.get("media:inspect-audio")({}, {});
  assert.equal(returned.status, "error");
  assert.equal(returned.error.key, "error.media.probeFailed");
  assert.equal(Object.hasOwn(returned, "message"), false);

  const thrown = await registered.get("frame:save-still")({}, {});
  assert.equal(thrown.status, "error");
  assert.equal(thrown.error.key, "error.process.permissionDenied");
  assert.equal(Object.hasOwn(thrown, "message"), false);
});

test("preload localizes structured errors with the selected locale and English fallback", () => {
  const window = loadNotificationCatalog();
  window.MontazhnayaNotificationCatalog.augmentLocale("ru");
  window.MontazhnayaNotificationCatalog.augmentLocale("en");
  const ru = {
    messages: window.MontazhnayaSemanticCatalog.ru.messages
  };
  const en = {
    messages: window.MontazhnayaSemanticCatalog.en.messages
  };
  assert.match(formatSemanticMessage(ru, "ru", "error.storage.insufficientSpace"), /Недостаточно свободного места/);
  assert.match(formatSemanticMessage(en, "en", "error.storage.insufficientSpace"), /not enough free disk space/i);
  assert.match(formatSemanticMessage(en, "en", "error.tool.notFound", { tool: "ffprobe" }), /ffprobe/);
});

test("all main-process invoke handlers are registered through the structured IPC boundary", () => {
  const main = read("electron/main.cjs");
  assert.doesNotMatch(main, /ipcMain\.handle\(/, "main.cjs must not register unnormalized IPC handlers");
  assert.match(main, /registerStructuredIpcHandler\(ipcMain, "ui:set-locale"/);
  assert.match(main, /registerStructuredIpcHandler\(ipcMain, LOCAL_WEBM_DURATION_CHANNEL/);
  const registeredChannels = [...main.matchAll(/registerStructuredIpcHandler\(ipcMain,\s*(?:"([^"]+)"|LOCAL_WEBM_DURATION_CHANNEL)/g)];
  assert.equal(registeredChannels.length, 19, "all 19 IPC channels must be normalized");
});

test("preload is the only compatibility layer that adds localized message text", () => {
  const preload = read("electron/preload.cjs");
  const main = read("electron/main.cjs");
  const ipcErrors = read("electron/ipc-errors.cjs");
  assert.match(preload, /function localizeIpcResult\(result\)/);
  assert.match(preload, /formatSemanticMessage\(activeUiSemantic, activeUiLocale, key, params\)/);
  assert.match(preload, /return \{ \.\.\.result, message: resolveIpcErrorMessage\(result\.error\) \}/);
  assert.match(preload, /function invokeIpc\(channel, request\)/);
  assert.doesNotMatch(main, /ipcMain\.handle\(/, "all main-process handlers must pass through the structured boundary");
  assert.match(ipcErrors, /return normalizeIpcResult\(channel, result\)/);
});

test("preload bridge converts structured IPC failures into messages in the selected locale", async () => {
  const vm = require("node:vm");
  const source = read("electron/preload.cjs");
  let exposedApi = null;
  const responses = new Map();
  const mockElectron = {
    contextBridge: { exposeInMainWorld: (_name, api) => { exposedApi = api; } },
    ipcRenderer: {
      invoke: async (channel, request) => {
        const handler = responses.get(channel);
        return handler ? handler(request) : { status: "success" };
      },
      on() {},
      removeListener() {}
    },
    webUtils: { getPathForFile: () => "" }
  };
  const sandbox = {
    require: name => name === "electron" ? mockElectron : require(path.join(root, "electron", name.replace(/^\.\//, ""))),
    console
  };
  vm.runInNewContext(source, sandbox, { filename: "preload.cjs" });
  assert.ok(exposedApi);

  const ruSemantic = { messages: { "error.storage.insufficientSpace": "Недостаточно свободного места на диске." } };
  const enSemantic = { messages: { "error.storage.insufficientSpace": "There is not enough free disk space." } };
  responses.set("system:tool-diagnostics", () => ({
    status: "error",
    error: { code: "STORAGE_INSUFFICIENT_SPACE", key: "error.storage.insufficientSpace", params: {}, retryable: true }
  }));

  await exposedApi.setUiLocale({ locale: "ru", semantic: ruSemantic, semanticFallback: enSemantic });
  const russian = await exposedApi.runToolDiagnostics();
  assert.equal(russian.message, "Недостаточно свободного места на диске.");
  assert.equal(russian.error.key, "error.storage.insufficientSpace");

  await exposedApi.setUiLocale({ locale: "de", semantic: { messages: {} }, semanticFallback: enSemantic });
  const englishFallback = await exposedApi.runToolDiagnostics();
  assert.equal(englishFallback.message, "There is not enough free disk space.");
});
