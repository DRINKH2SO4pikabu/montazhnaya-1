"use strict";

const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { registerStructuredIpcHandler } = require("./ipc-errors.cjs");
const { installWindowCloseGuard } = require("./window-close-guard.cjs");
const {
  AVAILABLE_LOCALES,
  resolveLocale,
  sanitizeMessages,
  sanitizeSemanticLocaleData,
  formatSemanticMessage,
  formatByteSize,
  translate: translateUiMessage
} = require("./i18n-core.cjs");
const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { promisify } = require("node:util");
const { pathToFileURL } = require("node:url");
const { randomUUID } = require("node:crypto");
const {
  selectAudioStream,
  describeAudioStream,
  estimatePcmWavBytes,
  buildPcmWavNormalizeArgs,
  inspectPcmWavHeader,
  calculateAudioBufferBytes,
  requiresAudioPreviewNormalization,
  DEFAULT_MAX_WAV_BYTES,
  DEFAULT_MAX_DECODED_BYTES
} = require("./audio-media.cjs");
const { startManagedProcess, timeToSeconds } = require("./managed-process.cjs");
const { createStagedFileManager } = require("./staged-file.cjs");
const { collectToolDiagnostics, resolveExecutable, parseEncoderSupport, parseMuxerSupport } = require("./tool-diagnostics.cjs");
const { HARDWARE_H264_ENCODERS, buildH264EncoderProbeArgs, selectH264Encoder } = require("./h264-encoder.cjs");
const { selectSourceDecoder, runExtractionWithNvdecFallback, buildNvdecProbeArgs } = require("./video-decode.cjs");
const {
  estimateExportStorage,
  queryDiskSpace,
  sameVolume,
  assessDiskSpace,
  calculateRemainingRequirements,
} = require("./disk-space.cjs");

let mainWindow = null;
let frameSequenceExportActive = false;
let activeUiLocale = "ru";
let activeUiMessages = Object.freeze(Object.create(null));
let activeUiSemantic = sanitizeSemanticLocaleData(null);
let fallbackUiSemantic = sanitizeSemanticLocaleData(null);

function uiText(source, values = {}) {
  if (typeof source !== "string") return source;
  const translateLine = line => {
    const prefix = line.match(/^(\s*(?:(?:\d+[.)])|[•·])\s*)/u)?.[0] || "";
    let result = translateUiMessage(line.slice(prefix.length), activeUiMessages);
    for (const [name, value] of Object.entries(values || {})) {
      result = result.replace(new RegExp("\\{" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\}", "g"), String(value));
    }
    return prefix + result;
  };
  return source.split("\n").map(translateLine).join("\n");
}

function uiTextKey(key, values = {}) {
  const translated = formatSemanticMessage(activeUiSemantic, activeUiLocale, key, values);
  if (translated !== key) return translated;
  return formatSemanticMessage(fallbackUiSemantic, "en", key, values);
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value < 0) return uiText("неизвестно");
  return formatByteSize(value, activeUiLocale, { maximumFractionDigits: 2 });
}
const hardwareH264ProbePromises = new Map();
const frameSequenceExports = new Map();
const stagedFileManager = createStagedFileManager();

app.setName("Монтажная");
if (process.platform === "win32") app.setAppUserModelId("ru.montazhnaya.desktop");

const execFileAsync = promisify(execFile);
const { analyzeFrameTimestamps } = require("./media-timing.cjs");
const {
  MAX_SEQUENCE_BYTES,
  MAX_FRAME_BYTES,
  MAX_AUDIO_WAV_BYTES,
  validateSourceFrameIndices,
  splitSourceFrameIndicesForFfmpeg,
  validateFrameSequenceSettings,
  toPngBuffer,
  toRgbaBuffer,
  toWavBuffer,
  frameFileName,
  buildSourceFrameExtractionFfmpegArgs,
  buildPngSequenceFfmpegArgs,
  buildPngPipeFfmpegArgs,
  buildRawRgbaPipeFfmpegArgs
} = require("./frame-sequence.cjs");
const {
  MAX_SOURCE_FRAME_CACHE_BYTES,
  DEFAULT_SOURCE_FRAME_WINDOW_FRAMES,
  SOURCE_FRAME_WINDOW_PNG_ESTIMATE_RATIO,
  reduceSourceFrameWindowSize,
  selectSourceFrameWindow,
  estimateSourceFrameWindowBytes,
  calculateSourceFrameCacheEvictions,
  buildSourceFrameCacheKey
} = require("./source-frame-cache.cjs");
const { calculateSourceFrameRenderSize } = require("./source-frame-render-size.cjs");
const LOCAL_WEBM_DURATION_CHANNEL = "media:inspect-webm-duration";
const {
  validateStillFrameRequest,
  validateStillFramePayload,
  resolveStillFrameOutputPath
} = require("./still-frame.cjs");

function registerUiLocaleHandler() {
  registerStructuredIpcHandler(ipcMain, "ui:set-locale", async (event, request) => {
    if (!isTrustedExportSender(event)) {
      return { status: "error", message: "Untrusted UI locale request." };
    }
    const requestedLocale = request && typeof request.locale === "string" ? request.locale : "ru";
    activeUiLocale = resolveLocale(requestedLocale, app.getLocale(), AVAILABLE_LOCALES);
    activeUiMessages = sanitizeMessages(request && request.messages);
    activeUiSemantic = sanitizeSemanticLocaleData(request && request.semantic);
    fallbackUiSemantic = sanitizeSemanticLocaleData(request && request.semanticFallback);
    return { status: "success", locale: activeUiLocale };
  });
}

function isTrustedExportSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents ||
      event.senderFrame !== mainWindow.webContents.mainFrame) return false;

  const editorPath = path.resolve(__dirname, "..", "src", "renderer", "index.html");
  const editorUrl = pathToFileURL(editorPath).href;
  if (event.senderFrame.url === editorUrl) return true;
  return process.env.MONTAZHNAYA_TOOLTIP_QA === "1" &&
    event.senderFrame.url === editorUrl + "?tooltip-audit=1";
}

async function inspectExportDiskSpace(outputPath, settings) {
  const estimate = estimateExportStorage({
    width: settings.width,
    height: settings.height,
    frameCount: settings.frameCount,
    fps: settings.fps,
    duration: settings.duration,
    audioBytes: settings.expectedAudioBytes,
    streamFrames: settings.streamFrames,
    sourceVideoCount: settings.expectedSourceVideoCount
  });
  const tempPath = os.tmpdir();
  const outputDirectory = path.dirname(outputPath);
  const [tempVolume, outputVolume] = await Promise.all([
    queryDiskSpace(tempPath),
    queryDiskSpace(outputDirectory)
  ]);
  const volumesMatch = sameVolume(tempVolume, outputVolume);
  return {
    estimate,
    tempPath,
    outputDirectory,
    tempVolume,
    outputVolume,
    sameVolume: volumesMatch,
    assessment: assessDiskSpace(estimate, tempVolume, outputVolume, volumesMatch)
  };
}

function formatDiskSpacePreflight(settings, diskInfo, assessment) {
  const estimate = diskInfo && diskInfo.estimate;
  const lines = [
    `План: ${settings.width}×${settings.height}, ${settings.fps} FPS, ${settings.frameCount} кадров (${settings.duration.toFixed(1)} с).`,
    estimate ? (estimate.streamFrames
      ? (settings.frameTransport === "rgba"
        ? `Кадры RGBA: передаются напрямую в FFmpeg без PNG-сжатия и без последовательности на диске; размер одного кадра ограничен 32 МиБ.`
        : `PNG-кадры: передаются потоком напрямую в FFmpeg; постоянная последовательность на диске не создаётся (буфер в памяти ограничен).`)
      : `PNG-кадры: ориентировочно ${formatBytes(estimate.pngExpectedBytes)}, консервативно до ${formatBytes(estimate.pngUpperBytes)}.`) : "PNG-кадры: оценить не удалось.",
    estimate ? `Временный WAV: ${formatBytes(estimate.audioBytes)}.` : "WAV: размер неизвестен.",
    estimate ? `${settings.outputFormat === "webm" ? "WebM" : "MP4"}: ориентировочно ${formatBytes(estimate.mp4ExpectedBytes)}, с запасом до ${formatBytes(estimate.mp4UpperBytes)}.` : "MP4: оценить не удалось."
  ];
  if (diskInfo && diskInfo.tempVolume) {
    lines.push(`Временные файлы (${diskInfo.tempPath}): свободно ${formatBytes(diskInfo.tempVolume.freeBytes)}.`);
  }
  if (diskInfo && diskInfo.outputVolume) {
    lines.push(`Файл результата (${diskInfo.outputDirectory}): свободно ${formatBytes(diskInfo.outputVolume.freeBytes)}.`);
  }
  if (assessment && assessment.issues.length) {
    lines.push("", ...assessment.issues.map(item => `• ${item.message}`));
  }
  if (estimate && estimate.streamFrames) {
    lines.push("", `${settings.frameTransport === "rgba" ? "Сырые RGBA-кадры" : "PNG-кадры"} передаются напрямую в FFmpeg без постоянной выходной последовательности на диске. Исходные кадры декодируются ленивыми окнами; дисковый LRU-кэш ограничен ${formatBytes(MAX_SOURCE_FRAME_CACHE_BYTES)} и освобождает старые кадры по мере продвижения экспорта. WAV и временный/готовый MP4 также учитываются. Во время экспорта редактор повторно проверяет свободное место.`);
  } else {
    lines.push("", "Оценка PNG приблизительная: фактический размер зависит от изображения каждого кадра. Во время экспорта редактор дополнительно контролирует свободное место.");
  }
  return lines.join("\n");
}

async function ensureSessionDiskSpace(session, options = {}) {
  if (!session || !session.storageEstimate || !session.diskSpace || !session.diskSpace.canCheck) return;
  let remainingTempMp4Bytes;
  if (session.streamingFrames && session.outputPathTemp) {
    try {
      const currentOutput = await fs.stat(session.outputPathTemp);
      remainingTempMp4Bytes = Math.max(0, session.storageEstimate.mp4UpperBytes - currentOutput.size);
    } catch (_) { remainingTempMp4Bytes = session.storageEstimate.mp4UpperBytes; }
  }
  const remaining = calculateRemainingRequirements(session.storageEstimate, {
    remainingOutputFrames: options.remainingOutputFrames == null
      ? Math.max(0, session.frameCount - session.nextFrameIndex) : options.remainingOutputFrames,
    pendingSourceFrames: options.pendingSourceFrames || 0,
    sourceWidth: options.sourceWidth || 0,
    sourceHeight: options.sourceHeight || 0,
    includeAudioBytes: options.includeAudioBytes !== false,
    includeTempMp4: options.includeTempMp4 !== false,
    remainingTempMp4Bytes,
    includeFinalCopy: session.diskSpace.sameVolume && options.includeFinalCopy !== false,
    includeReserve: options.includeReserve !== false,
    streamFrames: session.streamingFrames === true
  });
  const tempVolume = await queryDiskSpace(session.tempDir);
  if (tempVolume.freeBytes < remaining.temporaryRequiredBytes) {
    const error = new Error(`Во время экспорта заканчивается место на диске временных файлов: свободно ${formatBytes(tempVolume.freeBytes)}, требуется ещё примерно ${formatBytes(remaining.temporaryRequiredBytes)} с учётом оставшихся кадров и резерва. Экспорт остановлен до заполнения диска.`);
    error.code = "TEMP_DISK_SPACE_LOW";
    throw error;
  }
  if (!session.diskSpace.sameVolume) {
    const outputVolume = await queryDiskSpace(path.dirname(session.outputPath));
    const outputRequired = (options.exactOutputBytes == null
      ? session.storageEstimate.mp4UpperBytes
      : options.exactOutputBytes) + (options.includeReserve === false ? 0 : session.storageEstimate.reserveBytes);
    if (outputVolume.freeBytes < outputRequired) {
      throw new Error(`На диске сохранения видео заканчивается место: свободно ${formatBytes(outputVolume.freeBytes)}, требуется ещё ${formatBytes(outputRequired)}.`);
    }
  }
  return { tempFreeBytes: tempVolume.freeBytes };
}

async function ensureFinalOutputSpace(session, outputBytes) {
  if (!session.diskSpace || !session.diskSpace.canCheck) return;
  const outputVolume = await queryDiskSpace(path.dirname(session.outputPath));
  const required = outputBytes + session.storageEstimate.reserveBytes;
  if (outputVolume.freeBytes < required) {
    throw new Error(`Недостаточно места для записи готового видео: свободно ${formatBytes(outputVolume.freeBytes)}, требуется ${formatBytes(required)} с учётом резерва.`);
  }
}

async function runLocalTool(executable, args, timeout, maxBuffer = 2 * 1024 * 1024) {
  const resolvedExecutable = await resolveExecutable(executable);
  if (!resolvedExecutable) throw new Error(`${executable} не найден в PATH. Укажите ${executable.toUpperCase()}_PATH или добавьте папку bin в PATH.`);
  const safeArgs = args.map((arg) => {
    const name = path.basename(arg).toLowerCase();
    if (name === "input.webm") return "<temporary input WebM>";
    if (name === "audio.wav") return "<temporary audio WAV>";
    if (name === "prepared.mp4") return "<temporary prepared video MP4>";
    if (name === "output.mp4") return "<temporary output MP4>";
    return arg;
  });
  console.info(`[Локальный инструмент] Запуск ${resolvedExecutable}:`, JSON.stringify(safeArgs));

  return execFileAsync(resolvedExecutable, args, {
    shell: false,
    windowsHide: true,
    timeout,
    maxBuffer
  }).then((result) => {
    console.info(`[Локальный инструмент] ${executable}: код завершения 0; stderr:`,
      String(result.stderr || "").trim() || "(пусто)");
    return result;
  }).catch((error) => {
    const exitCode = typeof error.code === "number" ? error.code : error.code || "неизвестен";
    console.error(`[Локальный инструмент] ${executable}: код завершения ${exitCode}; stderr:`,
      String(error.stderr || "").trim() || "(пусто)");
    let reason;
    if (error.code === "ENOENT") {
      reason = `${executable} не найден в PATH`;
    } else if (error.code === "ETIMEDOUT") {
      reason = `${executable} не завершил работу за отведённое время`;
    } else if (error.code === "EACCES") {
      reason = `недостаточно прав для запуска ${executable}`;
    } else if (typeof error.code === "number") {
      reason = `${executable} завершился с кодом ${error.code}`;
    } else {
      reason = `не удалось запустить ${executable}: ${error.message}`;
    }

    const details = String(error.stderr || "").trim().slice(-2000);
    throw new Error(`${reason}${details ? `: ${details}` : ""}`);
  });
}

async function probeLocalMedia(filePath) {
  const { stdout } = await runLocalTool("ffprobe", [
    "-v", "error",
    "-show_entries", "format=format_name,duration:stream=index,codec_type,codec_name,profile,width,height,pix_fmt,avg_frame_rate,r_frame_rate,start_time,duration,time_base,nb_frames,sample_rate,channels,channel_layout,sample_fmt,bit_rate,disposition=default",
    "-of", "json",
    filePath
  ], 60000);

  let data;
  try {
    data = JSON.parse(stdout);
  } catch {
    throw new Error("ffprobe вернул некорректные данные о файле.");
  }
  if (!Array.isArray(data.streams)) {
    throw new Error("ffprobe не обнаружил потоки в файле.");
  }

  console.info("[Локальный медианализ] Результат ffprobe файла:", JSON.stringify({
    formatName: String(data.format && data.format.format_name || ""),
    duration: Number(data.format && data.format.duration),
    streams: data.streams
  }));
  return {
    streams: data.streams,
    formatName: String(data.format && data.format.format_name || ""),
    duration: Number(data.format && data.format.duration)
  };
}

async function resolveIncomingMediaPath(event, request, minimumBytes = 1) {
  if (!isTrustedExportSender(event)) throw new Error("Запрос медиафайла получен не из окна редактора.");
  let filePath;
  if (typeof request.stageToken === "string" && request.stageToken) {
    filePath = stagedFileManager.getPath(event.sender.id, request.stageToken);
  } else if (typeof request.sourcePath === "string" && path.isAbsolute(request.sourcePath)) {
    filePath = path.resolve(request.sourcePath);
  } else {
    throw new Error("Не передан доступный исходный файл. Повторно выберите исходник и попробуйте ещё раз.");
  }
  const stat = await fs.stat(filePath);
  if (!stat.isFile() || !Number.isSafeInteger(stat.size) || stat.size < minimumBytes) {
    throw new Error("Исходный медиафайл пуст, недоступен или имеет некорректный размер.");
  }
  return { filePath, size: stat.size, stageToken: typeof request.stageToken === "string" ? request.stageToken : null };
}

async function handleBeginStagedMediaFile(event, request) {
  if (!isTrustedExportSender(event)) return { status: "error", message: "Запрос временной передачи файла получен не из окна редактора." };
  try {
    const result = await stagedFileManager.begin(event.sender.id, request);
    return result;
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }
}

async function handleWriteStagedMediaFileChunk(event, request) {
  if (!isTrustedExportSender(event)) return { status: "error", message: "Запрос передачи фрагмента получен не из окна редактора." };
  try {
    return await stagedFileManager.write(event.sender.id, request);
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }
}

async function handleFinishStagedMediaFile(event, request) {
  if (!isTrustedExportSender(event)) return { status: "error", message: "Запрос завершения передачи файла получен не из окна редактора." };
  try {
    return await stagedFileManager.finish(event.sender.id, request);
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }
}

async function handleCleanupStagedMediaFile(event, request) {
  if (!isTrustedExportSender(event)) return { status: "error", message: "Запрос очистки временного файла получен не из окна редактора." };
  try {
    return await stagedFileManager.cleanup(event.sender.id, request && request.uploadId);
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }
}

async function handleWebmDurationInspection(event, request) {
  if (!isTrustedExportSender(event)) {
    return { status: "error", message: "Запрос анализа WebM получен не из окна редактора." };
  }
  let result;
  try {
    const { filePath, size } = await resolveIncomingMediaPath(event, request, 4);
    const handle = await fs.open(filePath, "r");
    let signature;
    try {
      const firstBytes = Buffer.alloc(4);
      const readResult = await handle.read(firstBytes, 0, 4, 0);
      signature = firstBytes.subarray(0, readResult.bytesRead);
    } finally {
      await handle.close();
    }
    if (!signature.equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
      throw new Error("Файл не имеет сигнатуру контейнера WebM.");
    }

    const mediaInfo = await probeLocalMedia(filePath);
    if (!mediaInfo.formatName.split(",").includes("webm")) {
      throw new Error("ffprobe не распознал входной файл как WebM.");
    }
    const video = mediaInfo.streams.find((stream) => stream.codec_type === "video");
    if (!video) throw new Error("В WebM не найдена видеодорожка.");
    if (Number.isFinite(mediaInfo.duration) && mediaInfo.duration > 0) {
      result = { status: "success", duration: mediaInfo.duration, size };
    } else {
      const { stdout } = await runLocalTool("ffprobe", [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_packets",
        "-show_entries", "packet=pts_time,dts_time,duration_time",
        "-of", "csv=p=0",
        filePath
      ], 120000, 16 * 1024 * 1024);

      let duration = 0;
      for (const line of stdout.split(/\r?\n/)) {
        const values = line.split(",");
        const timestamp = Number(values[0]);
        const decodeTimestamp = Number(values[1]);
        const packetDuration = Number(values[2]);
        const start = Number.isFinite(timestamp) ? timestamp : decodeTimestamp;
        if (!Number.isFinite(start) || start < 0) continue;
        const end = start + (Number.isFinite(packetDuration) && packetDuration > 0 ? packetDuration : 0);
        duration = Math.max(duration, end);
      }

      if (!(duration > 0)) {
        const frameRate = parseFrameRate(video.avg_frame_rate || video.r_frame_rate);
        if (Number.isFinite(frameRate) && frameRate > 0) {
          const { stdout: frameData } = await runLocalTool("ffprobe", [
            "-v", "error",
            "-select_streams", "v:0",
            "-count_frames",
            "-show_entries", "stream=nb_read_frames",
            "-of", "default=noprint_wrappers=1:nokey=1",
            filePath
          ], 120000);
          const frames = Number(frameData.trim());
          if (Number.isInteger(frames) && frames > 0) duration = frames / frameRate;
        }
      }

      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error("ffprobe не смог определить длительность WebM по пакетам или кадрам.");
      }
      result = { status: "success", duration, size };
    }
    console.info("[Импорт WebM] Определена длительность:", JSON.stringify({
      duration: result.duration,
      size,
      codec: video.codec_name,
      width: video.width,
      height: video.height
    }));
  } catch (error) {
    console.error("[Импорт WebM] Не удалось определить длительность:", error);
    result = { status: "error", message: String(error && error.message || error) };
  }
  console.info("[Импорт WebM] Итоговый IPC-ответ:", JSON.stringify(result));
  return result;
}

function parseFrameRate(value) {
  if (typeof value !== "string") return NaN;
  const parts = value.split("/");
  if (parts.length === 1) return Number(parts[0]);
  if (parts.length !== 2) return NaN;
  const numerator = Number(parts[0]);
  const denominator = Number(parts[1]);
  return denominator > 0 ? numerator / denominator : NaN;
}

async function inspectVideoFrameTiming(filePath, expectedFps, knownStream = null, inspectAllFrames = false, timestampToleranceSeconds = null) {
  let video = knownStream;
  if (!video) {
    const { stdout: streamData } = await runLocalTool("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-count_frames",
      "-show_entries", "stream=avg_frame_rate,nb_read_frames,duration",
      "-of", "json",
      filePath
    ], 10 * 60 * 1000);
    try {
      const streams = JSON.parse(streamData).streams;
      video = Array.isArray(streams) ? streams[0] : null;
    } catch {
      throw new Error("ffprobe вернул некорректные данные о количестве видеокадров.");
    }
  }

  const frameArgs = ["-v", "error", "-select_streams", "v:0"];
  if (!inspectAllFrames) frameArgs.push("-read_intervals", "%+#300");
  frameArgs.push(
    "-show_frames",
    "-show_entries", "frame=best_effort_timestamp_time",
    "-of", "csv=p=0",
    filePath
  );
  const { stdout: frameData } = await runLocalTool(
    "ffprobe",
    frameArgs,
    inspectAllFrames ? 10 * 60 * 1000 : 60000,
    inspectAllFrames ? 64 * 1024 * 1024 : 4 * 1024 * 1024
  );

  const frameCount = Number(video && video.nb_read_frames);
  if (!video || !Number.isInteger(frameCount) || frameCount <= 0 || !frameData.trim()) {
    throw new Error("ffprobe не смог проверить количество и временные метки видеокадров.");
  }

  const timing = analyzeFrameTimestamps(frameData, expectedFps, frameCount, inspectAllFrames, timestampToleranceSeconds);
  if (timing.sampledFrameCount === 0) {
    throw new Error("ffprobe не выдал пригодные временные метки видеокадров.");
  }

  return {
    frameCount,
    averageFps: parseFrameRate(video.avg_frame_rate),
    duration: Number(video.duration),
    ...timing
  };
}

async function verifyLocalMp4(filePath, inputDuration, audioExpected, expectedFps, expectedFrameCount,
  expectedWidth = null, expectedHeight = null, expectedVideoBitrate = null) {
  const { stdout } = await runLocalTool("ffprobe", [
    "-v", "error",
    "-count_frames",
    "-show_entries", "stream=codec_type,codec_name,width,height,pix_fmt,avg_frame_rate,nb_read_frames,start_time,duration,bit_rate,color_range,color_space,color_transfer,color_primaries:format=format_name,duration",
    "-of", "json",
    filePath
  ], 10 * 60 * 1000);

  let data;
  try {
    data = JSON.parse(stdout);
  } catch {
    throw new Error("ffprobe вернул некорректную проверку выходного MP4.");
  }
  if (!Array.isArray(data.streams)) {
    throw new Error("Не удалось проверить потоки выходного MP4.");
  }
  console.info("[Локальный MP4] Результат ffprobe выходного файла:", JSON.stringify(data));
  if (!String(data.format && data.format.format_name || "").split(",").includes("mp4")) {
    throw new Error("Проверка MP4 не пройдена: выходной файл не распознан как контейнер MP4.");
  }

  const video = data.streams.find((stream) => stream.codec_type === "video");
  const audio = data.streams.find((stream) => stream.codec_type === "audio");
  if (!video || video.codec_name !== "h264" || video.pix_fmt !== "yuv420p") {
    throw new Error("Проверка MP4 не пройдена: не найдены ожидаемые H.264 и yuv420p.");
  }
  const width = Number(video.width);
  const height = Number(video.height);
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error("Проверка MP4 не пройдена: не удалось определить размер видеокадра.");
  }
  if ((Number.isInteger(expectedWidth) && width !== expectedWidth) ||
      (Number.isInteger(expectedHeight) && height !== expectedHeight)) {
    throw new Error(`Проверка MP4 не пройдена: получено ${width}×${height}, ожидалось ${expectedWidth}×${expectedHeight}.`);
  }
  if (video.color_range !== "tv" || video.color_space !== "bt709" ||
      video.color_transfer !== "bt709" || video.color_primaries !== "bt709") {
    throw new Error("Проверка MP4 не пройдена: выходной видеопоток не имеет согласованного профиля BT.709 limited-range.");
  }
  const videoBitrate = Number(video.bit_rate);
  if (Number.isFinite(expectedVideoBitrate) && expectedVideoBitrate > 0 &&
      Number.isFinite(videoBitrate) && videoBitrate > expectedVideoBitrate * 1.6) {
    throw new Error(`Проверка MP4 не пройдена: средний битрейт ${Math.round(videoBitrate / 1000)} Кбит/с существенно выше целевого ${(expectedVideoBitrate / 1000).toFixed(0)} Кбит/с.`);
  }
  if (!!audio !== audioExpected || (audioExpected && audio.codec_name !== "aac")) {
    throw new Error(audioExpected
      ? "Проверка MP4 не пройдена: ожидаемая дорожка AAC отсутствует или имеет другой кодек."
      : "Проверка MP4 не пройдена: обнаружена неожиданная аудиодорожка.");
  }
  if (audioExpected) {
    const audioStart = Number(audio.start_time);
    const audioDuration = Number(audio.duration);
    if (!Number.isFinite(audioStart) || Math.abs(audioStart) > Math.max(0.05, 1 / expectedFps)) {
      throw new Error("Проверка MP4 не пройдена: звуковая дорожка AAC начинается не с начала видеошкалы.");
    }
    if (!Number.isFinite(audioDuration) ||
        Math.abs(audioDuration - inputDuration) > Math.max(0.1, 2 / expectedFps)) {
      throw new Error("Проверка MP4 не пройдена: длительность AAC заметно отличается от длительности видео.");
    }
  }

  const frameCount = Number(video.nb_read_frames);
  const averageFps = parseFrameRate(video.avg_frame_rate);
  const duration = Number(video.duration || (data.format && data.format.duration));
  const fileDuration = Number(data.format && data.format.duration);
  if (!Number.isInteger(frameCount) || frameCount <= 0) {
    throw new Error("Проверка MP4 не пройдена: не удалось подтвердить число видеокадров.");
  }
  if (!Number.isFinite(averageFps) || averageFps <= 0) {
    throw new Error("Проверка MP4 не пройдена: не удалось определить среднюю частоту кадров.");
  }
  if (frameCount !== expectedFrameCount) {
    throw new Error(`Проверка MP4 не пройдена: ожидалось ${expectedFrameCount} кадров при ${expectedFps} кадр/с, найдено ${frameCount}.`);
  }
  if (Math.abs(averageFps - expectedFps) > Math.max(0.1, expectedFps * 0.005)) {
    throw new Error(`Проверка MP4 не пройдена: средняя частота ${averageFps.toFixed(3)} кадр/с, ожидалось ${expectedFps} кадр/с.`);
  }
  if (!Number.isFinite(duration) || duration <= 0 ||
      !Number.isFinite(fileDuration) || fileDuration <= 0) {
    throw new Error("Проверка MP4 не пройдена: не удалось определить длительность.");
  }
  if (Math.abs(duration - inputDuration) > Math.max(0.5, inputDuration * 0.02)) {
    throw new Error("Проверка MP4 не пройдена: длительность видео заметно отличается от исходного WebM.");
  }
  const timing = await inspectVideoFrameTiming(filePath, expectedFps, video, true);
  if (!timing.timestampsComplete || timing.timestampCount !== frameCount) {
    throw new Error(`Проверка MP4 не пройдена: временные метки подтверждены только для ${timing.timestampCount} из ${frameCount} кадров.`);
  }
  if (timing.nonMonotonicCount > 0) {
    throw new Error(`Проверка MP4 не пройдена: обнаружено ${timing.nonMonotonicCount} непоследовательных или повторяющихся временных меток PTS.`);
  }
  if (timing.intervalDeviationCount > 0) {
    throw new Error(`Проверка MP4 не пройдена: ${timing.intervalDeviationCount} межкадровых интервалов отклоняются от CFR более чем на ${timing.intervalTolerance.toFixed(6)} с.`);
  }
  if (timing.longGapCount > 0) {
    throw new Error(`Проверка MP4 не пройдена: обнаружено ${timing.longGapCount} разрывов временных меток больше 1,5 кадра.`);
  }

  return {
    videoCodec: video.codec_name,
    width,
    height,
    pixelFormat: video.pix_fmt,
    videoBitrate: Number.isFinite(videoBitrate) ? videoBitrate : null,
    colorRange: video.color_range,
    colorSpace: video.color_space,
    colorTransfer: video.color_transfer,
    colorPrimaries: video.color_primaries,
    frameCount,
    averageFps,
    duration,
    ptsMeasuredFps: timing.ptsMeasuredFps,
    ptsIntervalHistogram: timing.intervalHistogram,
    allFramesInspected: timing.allFramesInspected,
    timestampsComplete: timing.timestampsComplete,
    timestampCount: timing.timestampCount,
    missingTimestampCount: timing.missingTimestampCount,
    nonMonotonicCount: timing.nonMonotonicCount,
    intervalDeviationCount: timing.intervalDeviationCount,
    intervalTolerance: timing.intervalTolerance,
    longGapCount: timing.longGapCount,
    minPtsInterval: timing.minInterval,
    maxPtsInterval: timing.maxInterval,
    hasAudio: !!audio,
    audioCodec: audio ? audio.codec_name : null,
    audioStartTime: audio ? Number(audio.start_time) : null,
    audioDuration: audio ? Number(audio.duration) : null
  };
}

async function verifyLocalWebm(filePath, inputDuration, audioExpected, expectedFps, expectedFrameCount, expectedVideoCodec, expectedWidth = null, expectedHeight = null, expectedVideoBitrate = null) {
  const { stdout } = await runLocalTool("ffprobe", [
    "-v", "error", "-count_frames",
    "-show_entries", "stream=codec_type,codec_name,width,height,pix_fmt,avg_frame_rate,nb_read_frames,start_time,duration,time_base,bit_rate,color_range,color_space,color_transfer,color_primaries:format=format_name,duration",
    "-of", "json", filePath
  ], 10 * 60 * 1000);
  let data;
  try { data = JSON.parse(stdout); } catch { throw new Error("ffprobe вернул некорректную проверку выходного WebM."); }
  if (!Array.isArray(data.streams) || !String(data.format && data.format.format_name || "").split(",").includes("webm")) {
    throw new Error("Проверка WebM не пройдена: выходной файл не распознан как контейнер WebM.");
  }
  const video = data.streams.find(stream => stream.codec_type === "video");
  const audio = data.streams.find(stream => stream.codec_type === "audio");
  if (!video || video.codec_name !== expectedVideoCodec || video.pix_fmt !== "yuv420p") {
    throw new Error(`Проверка WebM не пройдена: ожидался ${expectedVideoCodec} с yuv420p.`);
  }
  const width = Number(video.width);
  const height = Number(video.height);
  if ((Number.isInteger(expectedWidth) && width !== expectedWidth) ||
      (Number.isInteger(expectedHeight) && height !== expectedHeight)) {
    throw new Error(`Проверка WebM не пройдена: получено ${width}×${height}, ожидалось ${expectedWidth}×${expectedHeight}.`);
  }
  const videoBitrate = Number(video.bit_rate);
  if (Number.isFinite(expectedVideoBitrate) && expectedVideoBitrate > 0 &&
      Number.isFinite(videoBitrate) && videoBitrate > expectedVideoBitrate * 1.6) {
    throw new Error(`Проверка WebM не пройдена: средний битрейт ${Math.round(videoBitrate / 1000)} Кбит/с существенно выше целевого ${(expectedVideoBitrate / 1000).toFixed(0)} Кбит/с.`);
  }
  if (video.color_range !== "tv" || video.color_space !== "bt709" ||
      video.color_transfer !== "bt709" || video.color_primaries !== "bt709") {
    throw new Error("Проверка WebM не пройдена: выходной видеопоток не имеет согласованного профиля BT.709 limited-range.");
  }
  if (!!audio !== audioExpected || (audioExpected && audio.codec_name !== "opus")) {
    throw new Error(audioExpected
      ? "Проверка WebM не пройдена: ожидаемая дорожка Opus отсутствует или имеет другой кодек."
      : "Проверка WebM не пройдена: обнаружена неожиданная аудиодорожка.");
  }
  if (audioExpected) {
    const audioStart = Number(audio.start_time);
    if (!Number.isFinite(audioStart) || Math.abs(audioStart) > Math.max(0.08, 2 / expectedFps)) {
      throw new Error("Проверка WebM не пройдена: дорожка Opus заметно смещена относительно начала видео.");
    }
    let audioDuration = Number(audio.duration);
    if (!Number.isFinite(audioDuration) || audioDuration <= 0) {
      // WebM often stores Opus duration at packet level rather than on the stream.
      // The first packet can start around -7 ms because of Opus pre-skip; that is expected.
      const { stdout: packetData } = await runLocalTool("ffprobe", [
        "-v", "error", "-select_streams", "a:0", "-show_packets",
        "-show_entries", "packet=pts_time,duration_time", "-of", "csv=p=0", filePath
      ], 10 * 60 * 1000, 32 * 1024 * 1024);
      let firstPts = null;
      let lastEnd = null;
      for (const line of packetData.split(/\r?\n/)) {
        const fields = line.split(",");
        const pts = Number(fields[0]);
        const packetDuration = Number(fields[1]);
        if (!Number.isFinite(pts) || !Number.isFinite(packetDuration) || packetDuration <= 0) continue;
        if (firstPts === null) firstPts = pts;
        lastEnd = pts + packetDuration;
      }
      if (firstPts === null || !Number.isFinite(lastEnd)) {
        throw new Error("Проверка WebM не пройдена: ffprobe не смог подтвердить временной диапазон пакетов Opus.");
      }
      audioDuration = lastEnd - firstPts;
    }
    if (!Number.isFinite(audioDuration) || Math.abs(audioDuration - inputDuration) > Math.max(0.2, 3 / expectedFps)) {
      throw new Error("Проверка WebM не пройдена: временной диапазон Opus заметно отличается от длительности видео.");
    }
  }
  const frameCount = Number(video.nb_read_frames);
  const averageFps = parseFrameRate(video.avg_frame_rate);
  const duration = Number(video.duration || (data.format && data.format.duration));
  if (!Number.isInteger(frameCount) || frameCount !== expectedFrameCount) {
    throw new Error(`Проверка WebM не пройдена: ожидалось ${expectedFrameCount} кадров, найдено ${Number.isFinite(frameCount) ? frameCount : "неизвестно"}.`);
  }
  if (!Number.isFinite(averageFps) || Math.abs(averageFps - expectedFps) > Math.max(0.1, expectedFps * 0.005)) {
    throw new Error(`Проверка WebM не пройдена: средняя частота ${Number(averageFps).toFixed(3)} FPS, ожидалось ${expectedFps} FPS.`);
  }
  if (!Number.isFinite(duration) || Math.abs(duration - inputDuration) > Math.max(0.5, inputDuration * 0.02)) {
    throw new Error("Проверка WebM не пройдена: длительность видео заметно отличается от плана экспорта.");
  }
  // WebM/Matroska timestamps are quantized to the container time scale (commonly 1 ms).
  // At 50/60 FPS adjacent intervals may alternate by one time-base tick even when the
  // encoded frame grid is CFR. Validate against the actual muxer clock resolution.
  const timeBaseParts = String(video.time_base || "1/1000").split("/").map(Number);
  const timeBaseStep = timeBaseParts.length === 2 && timeBaseParts[1] > 0
    ? timeBaseParts[0] / timeBaseParts[1] : 0.001;
  const quantizedTolerance = Math.max(0.0005, timeBaseStep + 0.00005, (1 / expectedFps) * 0.02);
  const timing = await inspectVideoFrameTiming(filePath, expectedFps, video, true, quantizedTolerance);
  if (!timing.timestampsComplete || timing.timestampCount !== frameCount || timing.missingTimestampCount > 0 ||
      timing.nonMonotonicCount > 0 || timing.longGapCount > 0 || timing.intervalDeviationCount > 0) {
    throw new Error(`Проверка WebM не пройдена: CFR временные метки не подтверждены (${timing.intervalDeviationCount} отклонений).`);
  }
  return {
    container: "webm", videoCodec: video.codec_name, width: Number(video.width), height: Number(video.height),
    pixelFormat: video.pix_fmt, frameCount, averageFps, duration,
    videoBitrate: Number.isFinite(Number(video.bit_rate)) ? Number(video.bit_rate) : null,
    colorRange: video.color_range, colorSpace: video.color_space,
    colorTransfer: video.color_transfer, colorPrimaries: video.color_primaries,
    allFramesInspected: timing.allFramesInspected, timestampsComplete: timing.timestampsComplete,
    timestampCount: timing.timestampCount, missingTimestampCount: timing.missingTimestampCount,
    nonMonotonicCount: timing.nonMonotonicCount, intervalDeviationCount: timing.intervalDeviationCount,
    intervalTolerance: Math.max(timing.intervalTolerance, quantizedTolerance), longGapCount: timing.longGapCount,
    hasAudio: !!audio, audioCodec: audio ? audio.codec_name : null,
    audioStartTime: audio ? Number(audio.start_time) : null, audioDuration: audio ? Number(audio.duration) : null
  };
}

async function handleGetFrameSequenceExportCapabilities(event) {
  if (!isTrustedExportSender(event)) return { status: "error", message: "Запрос кодеков получен не из окна редактора." };
  try {
    const ffmpegPath = await resolveExecutable("ffmpeg");
    if (!ffmpegPath) return { status: "missing", message: "FFmpeg не найден.", mp4: false, webmVp8: false, webmVp9: false };
    const [encoderResult, muxerResult] = await Promise.all([
      runLocalTool("ffmpeg", ["-hide_banner", "-encoders"], 15000, 8 * 1024 * 1024),
      runLocalTool("ffmpeg", ["-hide_banner", "-muxers"], 15000, 4 * 1024 * 1024)
    ]);
    const encoders = parseEncoderSupport(String(encoderResult.stdout || "") + "\n" + String(encoderResult.stderr || ""));
    const muxers = parseMuxerSupport(String(muxerResult.stdout || "") + "\n" + String(muxerResult.stderr || ""));
    const pngDecoderAvailable = true;
    return {
      status: "success", ffmpegPath,
      mp4: encoders.has("libx264") && encoders.has("aac") && muxers.has("mp4") && pngDecoderAvailable,
      webmVp8: encoders.has("libvpx") && encoders.has("libopus") && muxers.has("webm") && pngDecoderAvailable,
      webmVp9: encoders.has("libvpx-vp9") && encoders.has("libopus") && muxers.has("webm") && pngDecoderAvailable,
      encoders: {
        h264: encoders.has("libx264"),
        h264Nvenc: encoders.has("h264_nvenc"),
        h264Amf: encoders.has("h264_amf"),
        h264Qsv: encoders.has("h264_qsv"),
        aac: encoders.has("aac"),
        vp8: encoders.has("libvpx"),
        vp9: encoders.has("libvpx-vp9"),
        opus: encoders.has("libopus")
      },
      muxers: { mp4: muxers.has("mp4"), webm: muxers.has("webm") }
    };
  } catch (error) {
    return { status: "error", message: String(error && error.message || error), mp4: false, webmVp8: false, webmVp9: false };
  }
}

async function handleBeginFrameSequenceExport(event, request) {
  if (!isTrustedExportSender(event)) {
    return { status: "error", message: "Запрос последовательности кадров получен не из окна редактора." };
  }
  if (frameSequenceExportActive) {
    return { status: "error", message: "Другой экспорт уже выполняется." };
  }

  let settings;
  try {
    settings = validateFrameSequenceSettings(request);
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }

  frameSequenceExportActive = true;
  let tempDir = null;
  try {
    const outputExtension = settings.outputFormat === "webm" ? "webm" : "mp4";
    const saveDialog = await dialog.showSaveDialog(mainWindow, {
      title: uiText("Сохранить покадровый {format}", { format: outputExtension.toUpperCase() }),
      defaultPath: `${settings.suggestedName}.${outputExtension}`,
      filters: [{ name: uiText("Видео {format}", { format: outputExtension.toUpperCase() }), extensions: [outputExtension] }]
    });
    if (saveDialog.canceled || !saveDialog.filePath) {
      frameSequenceExportActive = false;
      return { status: "cancelled" };
    }

    const selectedExtension = path.extname(saveDialog.filePath).toLowerCase();
    const outputPath = selectedExtension === `.${outputExtension}`
      ? saveDialog.filePath
      : selectedExtension
        ? `${saveDialog.filePath.slice(0, -selectedExtension.length)}.${outputExtension}`
        : `${saveDialog.filePath}.${outputExtension}`;
    let diskInfo = null;
    let assessment = null;
    try {
      diskInfo = await inspectExportDiskSpace(outputPath, settings);
      assessment = diskInfo.assessment;
    } catch (diskError) {
      assessment = {
        status: "unknown",
        issues: [{ severity: "unknown", message: `Не удалось автоматически проверить свободное место: ${String(diskError && diskError.message || diskError)}` }]
      };
    }
    const preflightDetails = formatDiskSpacePreflight(settings, diskInfo, assessment);
    if (assessment.status === "insufficient") {
      await dialog.showMessageBox(mainWindow, {
        type: "error",
        title: uiText("Недостаточно места для экспорта"),
        message: uiText("Экспорт не запущен: прогнозируемого свободного места недостаточно."),
        detail: uiText(preflightDetails),
        buttons: [uiText("Понятно")],
        defaultId: 0
      });
      frameSequenceExportActive = false;
      return { status: "error", message: "Недостаточно свободного места для безопасного экспорта. Освободите место или уменьшите длительность/разрешение и повторите попытку." };
    }
    if (assessment.status !== "ok") {
      const prompt = await dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: uiText("Проверка свободного места"),
        message: assessment.status === "unknown"
          ? uiText("Не удалось полностью проверить свободное место. Продолжить на свой риск?")
          : uiText("Свободного места может быть меньше консервативной оценки. Продолжить экспорт?"),
        detail: uiText(preflightDetails),
        buttons: [uiText("Отменить экспорт"), uiText("Продолжить")],
        defaultId: 0,
        cancelId: 0,
        noLink: true
      });
      if (prompt.response !== 1) {
        frameSequenceExportActive = false;
        return { status: "cancelled" };
      }
    }
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-png-sequence-"));
    const sessionId = randomUUID();
    frameSequenceExports.set(sessionId, {
      sessionId,
      ownerWebContentsId: event.sender.id,
      webContents: event.sender,
      tempDir,
      outputPath,
      fps: settings.fps,
      frameCount: settings.frameCount,
      duration: settings.duration,
      width: settings.width,
      height: settings.height,
      frameTransport: settings.frameTransport,
      videoBitrate: settings.videoBitrate,
      audioExpected: settings.audioExpected,
      expectedAudioBytes: settings.expectedAudioBytes,
      outputFormat: settings.outputFormat,
      videoCodec: settings.videoCodec,
      audioCodec: settings.audioCodec,
      streamingFrames: settings.streamFrames === true,
      streamingStarted: false,
      streamedFrameBytes: 0,
      audioPath: null,
      outputPathTemp: null,
      storageEstimate: diskInfo ? diskInfo.estimate : estimateExportStorage({
        width: settings.width, height: settings.height, frameCount: settings.frameCount,
        fps: settings.fps, duration: settings.duration, audioBytes: settings.expectedAudioBytes,
        streamFrames: settings.streamFrames === true, sourceVideoCount: settings.expectedSourceVideoCount
      }),
      diskSpace: {
        canCheck: !!diskInfo,
        sameVolume: diskInfo ? diskInfo.sameVolume : true,
        outputDirectory: path.dirname(outputPath),
        preflightStatus: assessment.status
      },
      lastSpaceCheckBytes: 0,
      nextFrameIndex: 0,
      totalFrameBytes: 0,
      sourceFrameBytes: 0,
      sourceFrameCounter: 0,
      sourceFrameCacheSequence: 0,
      sourceFrameCacheEntries: new Map(),
      sourceFrames: new Map(),
      createdAt: Date.now(),
      ffmpegJob: null,
      cancelRequested: false,
      finalizing: false
    });
    console.info(`[Frame-sequence ${outputExtension.toUpperCase()}] Начата сессия:`, JSON.stringify({
      sessionId,
      fileName: path.basename(outputPath),
      outputFormat: settings.outputFormat, videoCodec: settings.videoCodec, audioCodec: settings.audioCodec,
      frameTransport: settings.frameTransport,
      fps: settings.fps,
      frameCount: settings.frameCount,
      duration: settings.duration,
      audioExpected: settings.audioExpected,
      preflightStatus: assessment.status,
      pngEstimate: diskInfo ? diskInfo.estimate.pngExpectedBytes : null,
      mp4Estimate: diskInfo ? diskInfo.estimate.mp4ExpectedBytes : null
    }));
    return { status: "ready", sessionId };
  } catch (error) {
    if (tempDir) {
      try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (_) {}
    }
    frameSequenceExportActive = false;
    return { status: "error", message: `Не удалось подготовить экспорт последовательности PNG: ${String(error && error.message || error)}` };
  }
}

function getTrustedFrameSequenceSession(event, request) {
  if (!isTrustedExportSender(event)) {
    throw new Error("Запрос покадрового экспорта получен не из окна редактора.");
  }
  if (!request || typeof request !== "object" || Array.isArray(request) ||
      typeof request.sessionId !== "string" || request.sessionId.length > 64) {
    throw new Error("Некорректный идентификатор сессии покадрового экспорта.");
  }
  const session = frameSequenceExports.get(request.sessionId);
  if (!session || session.ownerWebContentsId !== event.sender.id) {
    throw new Error("Сессия покадрового экспорта не найдена или уже закрыта.");
  }
  return session;
}

async function handleWriteFrameSequenceFrame(event, request) {
  let session;
  try {
    session = getTrustedFrameSequenceSession(event, request);
    if (!Number.isInteger(request.index) || request.index !== session.nextFrameIndex ||
        request.index >= session.frameCount) {
      throw new Error(`Ожидался кадр ${session.nextFrameIndex + 1} из ${session.frameCount}; получен индекс ${request.index}.`);
    }
    const frameBuffer = session.frameTransport === "rgba"
      ? toRgbaBuffer(request.rgbaData, session.width, session.height)
      : toPngBuffer(request.pngData);
    if (session.streamingFrames) {
      if (!session.streamingStarted || !session.ffmpegJob) {
        throw new Error("Потоковый кодировщик FFmpeg ещё не запущен.");
      }
      await session.ffmpegJob.writeInput(frameBuffer);
      session.streamedFrameBytes += frameBuffer.length;
      session.nextFrameIndex++;
      if (session.nextFrameIndex === session.frameCount || session.streamedFrameBytes - session.lastSpaceCheckBytes >= 64 * 1024 * 1024) {
        await ensureSessionDiskSpace(session, { remainingOutputFrames: 0, pendingSourceFrames: 0, includeAudioBytes: false });
        session.lastSpaceCheckBytes = session.streamedFrameBytes;
      }
      if (session.nextFrameIndex === session.frameCount || session.nextFrameIndex % 30 === 0) {
        console.info(`[${session.frameTransport === "rgba" ? "RGBA-rawvideo" : "PNG-image2pipe"}] Кадры переданы FFmpeg:`, `${session.nextFrameIndex}/${session.frameCount}`, `(${session.streamedFrameBytes} bytes)`);
      }
      return { status: "success", index: request.index, framesWritten: session.nextFrameIndex, streamedBytes: session.streamedFrameBytes };
    }
    if (session.totalFrameBytes + session.sourceFrameBytes + frameBuffer.length > MAX_SEQUENCE_BYTES) {
      throw new Error(`Общий объём временных исходных и выходных PNG превышает лимит ${Math.round(MAX_SEQUENCE_BYTES / 1024 / 1024)} МБ.`);
    }
    const framePath = path.join(session.tempDir, frameFileName(request.index));
    await fs.writeFile(framePath, frameBuffer, { flag: "wx" });
    session.nextFrameIndex++;
    session.totalFrameBytes += frameBuffer.length;
    const currentPngBytes = session.totalFrameBytes + session.sourceFrameBytes;
    if (session.nextFrameIndex === session.frameCount || currentPngBytes - session.lastSpaceCheckBytes >= 64 * 1024 * 1024) {
      await ensureSessionDiskSpace(session, { remainingOutputFrames: session.frameCount - session.nextFrameIndex });
      session.lastSpaceCheckBytes = currentPngBytes;
    }
    if (session.nextFrameIndex === session.frameCount || session.nextFrameIndex % 30 === 0) {
      console.info("[PNG-sequence MP4] Кадры записаны:", `${session.nextFrameIndex}/${session.frameCount}`);
    }
    return { status: "success", index: request.index, framesWritten: session.nextFrameIndex };
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }
}

function createFrameSequenceProgressHandler(session) {
  return (progress) => {
    const currentSeconds = timeToSeconds(progress.out_time) ??
      (Number.isFinite(Number(progress.out_time_ms)) ? Number(progress.out_time_ms) / 1000000 : null);
    const percent = currentSeconds == null || !(session.duration > 0)
      ? null : Math.max(0, Math.min(99.5, currentSeconds / session.duration * 100));
    try {
      if (session.webContents && !session.webContents.isDestroyed()) {
        session.webContents.send("export:ffmpeg-progress", {
          sessionId: session.sessionId,
          stage: progress.progress === "end" ? "verifying" : "encoding",
          frame: Number.isFinite(Number(progress.frame)) ? Number(progress.frame) : null,
          currentSeconds,
          duration: session.duration,
          percent
        });
      }
    } catch (error) {
      console.warn("Не удалось передать прогресс FFmpeg в интерфейс:", error.message);
    }
  };
}

async function probeRuntimeH264EncoderSupport(encoder) {
  if (!HARDWARE_H264_ENCODERS.includes(encoder)) return false;
  if (!hardwareH264ProbePromises.has(encoder)) {
    const probe = runLocalTool("ffmpeg", buildH264EncoderProbeArgs(encoder, os.devNull),
      15000, 2 * 1024 * 1024).then(() => true).catch(error => {
      console.info(`[${encoder}] Аппаратный H.264 недоступен; проверяется следующий вариант:`,
        String(error && error.message || error));
      return false;
    });
    hardwareH264ProbePromises.set(encoder, probe);
  }
  return hardwareH264ProbePromises.get(encoder);
}

async function handleStartFrameSequenceEncoding(event, request) {
  let session;
  try {
    session = getTrustedFrameSequenceSession(event, request);
    if (!session.streamingFrames) throw new Error("Эта сессия не настроена для потоковой передачи кадров.");
    if (session.streamingStarted || session.ffmpegJob) throw new Error("Потоковое кодирование уже запущено.");
    if (session.cancelRequested) throw Object.assign(new Error("Экспорт отменён пользователем."), { code: "PROCESS_CANCELLED" });
    const capabilities = await handleGetFrameSequenceExportCapabilities(event);
    const selectedCapability = session.outputFormat === "webm"
      ? (session.videoCodec === "vp9" ? capabilities.webmVp9 : capabilities.webmVp8)
      : capabilities.mp4;
    if (!selectedCapability) {
      throw new Error(`Установленная сборка FFmpeg не поддерживает выбранный экспорт ${session.outputFormat.toUpperCase()} (${session.videoCodec}/${session.audioExpected ? session.audioCodec : "без аудио"}). Откройте диагностику FFmpeg и ffprobe.`);
    }

    let audioPath = null;
    if (session.audioExpected) {
      const audioSource = await resolveIncomingMediaPath(event, request, 44);
      if (audioSource.size !== session.expectedAudioBytes || audioSource.size > MAX_AUDIO_WAV_BYTES) {
        throw new Error("Переданный WAV не совпадает с предварительно заявленным размером или превышает допустимый лимит.");
      }
      await ensureSessionDiskSpace(session, { remainingOutputFrames: 0, pendingSourceFrames: 0, includeAudioBytes: true });
      audioPath = path.join(session.tempDir, "audio.wav");
      await fs.copyFile(audioSource.filePath, audioPath, fs.constants.COPYFILE_EXCL);
      const audioStat = await fs.stat(audioPath);
      if (!audioStat.isFile() || audioStat.size !== session.expectedAudioBytes || audioStat.size < 44) {
        throw new Error("Проверка временного WAV после потоковой передачи не пройдена.");
      }
      const headerHandle = await fs.open(audioPath, "r");
      try {
        const header = Buffer.alloc(12);
        const { bytesRead } = await headerHandle.read(header, 0, 12, 0);
        if (bytesRead !== 12 || header.toString("ascii", 0, 4) !== "RIFF" || header.toString("ascii", 8, 12) !== "WAVE") {
          throw new Error("Переданный аудиофайл не имеет корректную сигнатуру WAV.");
        }
      } finally { await headerHandle.close(); }
      const audioInfo = await probeLocalMedia(audioPath);
      if (!audioInfo.formatName.split(",").includes("wav") ||
          !audioInfo.streams.some(stream => stream.codec_type === "audio")) {
        throw new Error("FFprobe не подтвердил аудиодорожку временного WAV.");
      }
      if (!Number.isFinite(audioInfo.duration) ||
          Math.abs(audioInfo.duration - session.duration) > Math.max(0.02, 1 / session.fps)) {
        throw new Error("Длительность WAV не совпадает с точной длительностью плана кадров.");
      }
      await ensureSessionDiskSpace(session, { remainingOutputFrames: 0, pendingSourceFrames: 0, includeAudioBytes: false });
    } else if (request && (request.stageToken || request.sourcePath)) {
      throw new Error("Передан неожиданный WAV: проект не заявлял звуковую дорожку.");
    }

    if (session.cancelRequested) throw Object.assign(new Error("Экспорт отменён пользователем."), { code: "PROCESS_CANCELLED" });
    const outputExtension = session.outputFormat === "webm" ? "webm" : "mp4";
    const outputPathTemp = path.join(session.tempDir, `output.${outputExtension}`);
    let videoEncoder = "libx264";
    let args;
    if (session.frameTransport === "rgba") {
      const selection = await selectH264Encoder(
        capabilities.encoders,
        probeRuntimeH264EncoderSupport
      );
      videoEncoder = selection.encoder;
      console.info(`[H.264] Для этой сессии выбран ${selection.hardware ? "аппаратный" : "программный"} кодировщик: ${videoEncoder}.`);
      args = buildRawRgbaPipeFfmpegArgs({
        outputPath: outputPathTemp,
        width: session.width,
        height: session.height,
        fps: session.fps,
        frameCount: session.frameCount,
        duration: session.duration,
        audioPath,
        audioExpected: session.audioExpected,
        videoBitrate: session.videoBitrate,
        videoEncoder
      });
    } else {
      args = buildPngPipeFfmpegArgs({
        outputPath: outputPathTemp,
        fps: session.fps,
        frameCount: session.frameCount,
        duration: session.duration,
        audioPath,
        audioExpected: session.audioExpected,
        outputFormat: session.outputFormat,
        videoCodec: session.videoCodec,
        audioCodec: session.audioCodec,
        videoBitrate: session.videoBitrate
      });
    }
    const executable = await resolveExecutable("ffmpeg");
    if (!executable) throw new Error("FFmpeg не найден. Проверьте PATH или переменную FFMPEG_PATH и перезапустите редактор.");

    const ffmpegArgs = ["-progress", "pipe:1", "-stats_period", "0.5", ...args];
    const job = startManagedProcess(executable, ffmpegArgs, {
      timeoutMs: 30 * 60 * 1000,
      killGraceMs: 7000,
      stdinMode: "binary",
      onProgress: createFrameSequenceProgressHandler(session)
    });
    // Attach a rejection observer immediately; the same promise is awaited at
    // finalization or cancellation after the renderer has finished sending frames.
    job.promise.catch(() => {});
    session.ffmpegJob = job;
    session.ffmpegStartedAt = Date.now();
    session.audioPath = audioPath;
    session.outputPathTemp = outputPathTemp;
    session.streamingStarted = true;
    console.info(`[${session.frameTransport === "rgba" ? "RGBA-rawvideo" : "PNG-pipe"} ${outputExtension.toUpperCase()}] Потоковый FFmpeg запущен:`, JSON.stringify({
      sessionId: session.sessionId, outputFormat: session.outputFormat, videoCodec: session.videoCodec,
      audioCodec: session.audioCodec, frameTransport: session.frameTransport, videoEncoder, fps: session.fps, frameCount: session.frameCount,
      duration: session.duration, audioExpected: session.audioExpected, audioBytes: session.expectedAudioBytes
    }));
    session.videoEncoder = videoEncoder;
    return { status: "ready", sessionId: session.sessionId, transport: session.frameTransport === "rgba" ? "rawvideo-rgba" : "image2pipe", videoEncoder };
  } catch (error) {
    if (session && session.ffmpegJob && !session.finalizing) {
      try { session.ffmpegJob.cancel(); await session.ffmpegJob.promise.catch(() => {}); } catch (_) {}
      session.ffmpegJob = null;
    }
    return { status: "error", message: String(error && error.message || error) };
  }
}

async function handleFinishStreamingFrameSequenceExport(event, request, session) {
  let tempDir = null;
  try {
    if (!session.streamingFrames || !session.streamingStarted || !session.ffmpegJob) {
      throw new Error("Потоковый кодировщик не был запущен для этой сессии.");
    }
    if (session.finalizing) throw new Error("Финализация этой сессии экспорта уже выполняется.");
    session.finalizing = true;
    tempDir = session.tempDir;
    if (session.cancelRequested) throw Object.assign(new Error("Экспорт отменён пользователем."), { code: "PROCESS_CANCELLED" });
    if (session.nextFrameIndex !== session.frameCount) {
      throw new Error(`Поток неполный: передано ${session.nextFrameIndex} из ${session.frameCount} кадров.`);
    }

    const job = session.ffmpegJob;
    try {
      await job.endInput();
      const ffmpegInputClosedAt = Date.now();
      await job.promise;
      session.ffmpegFinalizeMs = Math.max(0, Date.now() - ffmpegInputClosedAt);
      session.ffmpegProcessWallMs = Number.isFinite(session.ffmpegStartedAt)
        ? Math.max(0, Date.now() - session.ffmpegStartedAt) : null;
    } finally {
      if (session.ffmpegJob === job && job.settled) session.ffmpegJob = null;
    }
    if (session.cancelRequested || job.cancelRequested) {
      throw Object.assign(new Error("Экспорт отменён пользователем."), { code: "PROCESS_CANCELLED" });
    }

    const outputPathTemp = session.outputPathTemp;
    const outputInfo = await fs.stat(outputPathTemp);
    if (!outputInfo.isFile() || outputInfo.size === 0) {
      throw new Error("FFmpeg не создал непустой MP4 из потоковой последовательности кадров.");
    }
    const verification = session.outputFormat === "webm"
      ? await verifyLocalWebm(outputPathTemp, session.duration, session.audioExpected, session.fps, session.frameCount,
        session.videoCodec, session.width, session.height, session.videoBitrate)
      : await verifyLocalMp4(outputPathTemp, session.duration, session.audioExpected, session.fps, session.frameCount,
        session.width, session.height, session.videoBitrate);
    if (session.cancelRequested) throw Object.assign(new Error("Экспорт отменён пользователем."), { code: "PROCESS_CANCELLED" });
    await runLocalTool("ffmpeg", ["-hide_banner", "-v", "error", "-xerror", "-i", outputPathTemp, "-f", "null", os.devNull], 10 * 60 * 1000);
    if (session.cancelRequested) throw Object.assign(new Error("Экспорт отменён пользователем."), { code: "PROCESS_CANCELLED" });
    await ensureFinalOutputSpace(session, outputInfo.size);
    await fs.copyFile(outputPathTemp, session.outputPath);
    const savedInfo = await fs.stat(session.outputPath);
    if (!savedInfo.isFile() || savedInfo.size !== outputInfo.size) {
      throw new Error("Проверка сохранения MP4 не пройдена: размер сохранённого файла отличается от проверенного результата.");
    }
    return {
      status: "success", fileName: path.basename(session.outputPath), sizeBytes: outputInfo.size,
      verification, outputFormat: session.outputFormat,
      captureMethod: session.frameTransport === "rgba" ? "rgba-rawvideo-pipe" : "png-image2pipe",
      frameTransport: session.frameTransport, videoEncoder: session.videoEncoder || "libx264", streamedFrameBytes: session.streamedFrameBytes,
      performance: {
        ffmpegProcessWallMs: Number.isFinite(session.ffmpegProcessWallMs) ? session.ffmpegProcessWallMs : null,
        ffmpegFinalizeMs: Number.isFinite(session.ffmpegFinalizeMs) ? session.ffmpegFinalizeMs : null
      }
    };
  } catch (error) {
    if (error && error.code === "PROCESS_CANCELLED") return { status: "cancelled" };
    console.error("[Потоковый MP4] Экспорт завершился ошибкой:", error);
    return { status: "error", message: String(error && error.message || error) };
  } finally {
    if (session.ffmpegJob && !session.ffmpegJob.settled) {
      const activeJob = session.ffmpegJob;
      activeJob.cancel();
      await activeJob.promise.catch(() => {});
    }
    session.ffmpegJob = null;
    await cleanupFrameSequenceSourceStages(session);
    frameSequenceExports.delete(session.sessionId);
    if (tempDir) {
      try { await fs.rm(tempDir, { recursive: true, force: true }); }
      catch (error) { console.error("[Потоковый MP4] Не удалось удалить временные данные:", error); }
    }
    frameSequenceExportActive = false;
  }
}

async function handleExtractVideoAudioForExport(event, request) {
  let tempDir = null;
  let outputPath = null;
  try {
    if (!isTrustedExportSender(event)) throw new Error("Запрос извлечения звука получен не из окна редактора.");
    if (typeof request.mediaId !== "string" || !request.mediaId || request.mediaId.length > 200) {
      throw new Error("Некорректный идентификатор видеоисточника для извлечения звука.");
    }
    const { filePath, size } = await resolveIncomingMediaPath(event, request, 12);
    const probe = await probeLocalMedia(filePath);
    const audioStream = selectAudioStream(probe.streams);
    if (!audioStream) throw new Error("Во входном видео не найдена звуковая дорожка.");
    const videoStream = probe.streams.find(stream => stream.codec_type === "video");

    // Align extracted audio to the video stream's origin before the browser
    // decodes it into an AudioBuffer. Reuse the same normalizer as standalone
    // audio so positive delay, negative trim, resampling and downmixing cannot
    // drift between preview and export paths.
    const audioStart = Number(audioStream.start_time);
    const videoStart = Number(videoStream && videoStream.start_time);
    const offset = (Number.isFinite(audioStart) ? audioStart : 0) - (Number.isFinite(videoStart) ? videoStart : 0);

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-video-audio-"));
    outputPath = path.join(tempDir, "embedded-audio.wav");
    const audioArgs = buildPcmWavNormalizeArgs(filePath, outputPath, {
      streamIndex: Number.isInteger(Number(audioStream.index)) ? Number(audioStream.index) : 0,
      sampleRate: 48000,
      channels: 2,
      startOffsetSeconds: offset
    });
    await runLocalTool("ffmpeg", audioArgs, 30 * 60 * 1000);
    const audioStat = await fs.stat(outputPath);
    const estimatedDecodedBytes = Math.max(0, audioStat.size - 44) * 2;
    if (!audioStat.isFile() || audioStat.size < 44 || audioStat.size > Math.min(MAX_AUDIO_WAV_BYTES, DEFAULT_MAX_WAV_BYTES) ||
        estimatedDecodedBytes > DEFAULT_MAX_DECODED_BYTES) {
      throw new Error(`Извлечённая звуковая дорожка не помещается в лимит оффлайн-микшера: WAV ${Math.round(audioStat.size / 1024 / 1024)} МБ, оценка AudioBuffer ${Math.round(estimatedDecodedBytes / 1024 / 1024)} МБ (предел 256 МБ). Само видео не ограничено размером 128 МиБ.`);
    }
    const audioBuffer = await fs.readFile(outputPath);
    const wavInfo = inspectPcmWavHeader(audioBuffer, { channels: 2, sampleRate: 48000 });
    const audioData = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength);
    console.info("[MP4 export audio] Extracted embedded audio:", JSON.stringify({
      mediaId: request.mediaId,
      sourceBytes: size,
      wavBytes: audioBuffer.length,
      codec: audioStream.codec_name,
      sourceAudioOffsetSeconds: offset,
      sampleRate: audioStream.sample_rate,
      channels: audioStream.channels,
      normalizedSampleRate: wavInfo.sampleRate,
      normalizedChannels: wavInfo.channels,
      normalizedDuration: wavInfo.duration
    }));
    // The WAV duration includes any leading silence introduced to align a
    // delayed audio stream with the video timeline, so return the normalized
    // duration rather than the raw audio stream duration.
    const audioDuration = wavInfo.duration;
    return {
      status: "success", mediaId: request.mediaId, wavData: audioData,
      sourceBytes: size, wavBytes: audioBuffer.length, audioDuration,
      sourceAudioDuration: Number(audioStream.duration) > 0 ? Number(audioStream.duration) : probe.duration,
      audioOffsetSeconds: offset
    };
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  } finally {
    if (tempDir) {
      try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (_) {}
    }
  }
}

async function handleInspectAudioMedia(event, request) {
  try {
    if (!isTrustedExportSender(event)) throw new Error("Запрос анализа аудио получен не из окна редактора.");
    const { filePath, size } = await resolveIncomingMediaPath(event, request, 1);
    const probe = await probeLocalMedia(filePath);
    const stream = selectAudioStream(probe.streams);
    if (!stream) return { status: "success", hasAudio: false, audioInfo: null, sourceBytes: size, formatName: probe.formatName };
    const audioInfo = describeAudioStream(stream, probe.duration);
    const videoStream = probe.streams.find(item => String(item.codec_type || "").toLowerCase() === "video");
    const videoStart = Number(videoStream && videoStream.start_time);
    const videoStartTime = Number.isFinite(videoStart) ? videoStart : 0;
    const audioOffsetSeconds = audioInfo.startTime - videoStartTime;
    return {
      status: "success",
      hasAudio: true,
      requiresPreviewNormalization: requiresAudioPreviewNormalization(audioInfo),
      audioInfo,
      audioOffsetSeconds,
      sourceBytes: size,
      formatName: probe.formatName,
      normalizedProfile: { sampleRate: 48000, channels: 2, codec: "pcm_s16le", container: "wav" }
    };
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }
}

async function handlePrepareAudioForExport(event, request) {
  let tempDir = null;
  try {
    if (!isTrustedExportSender(event)) throw new Error("Запрос подготовки аудио получен не из окна редактора.");
    if (typeof request.mediaId !== "string" || !request.mediaId || request.mediaId.length > 200) {
      throw new Error("Некорректный идентификатор аудиоисточника.");
    }
    const { filePath, size } = await resolveIncomingMediaPath(event, request, 1);
    const probe = await probeLocalMedia(filePath);
    const stream = selectAudioStream(probe.streams);
    if (!stream) throw new Error("В источнике «" + String(request.mediaName || request.mediaId) + "» не найдена звуковая дорожка.");
    const audioInfo = describeAudioStream(stream, probe.duration);
    if (!(audioInfo.duration > 0)) throw new Error("ffprobe не смог определить длительность звуковой дорожки.");

    const videoStream = request.alignToVideo
      ? probe.streams.find(item => String(item.codec_type || "").toLowerCase() === "video")
      : null;
    const videoStart = Number(videoStream && videoStream.start_time);
    const audioOffsetSeconds = request.alignToVideo
      ? audioInfo.startTime - (Number.isFinite(videoStart) ? videoStart : 0)
      : 0;
    const expectedDuration = Math.max(0, audioInfo.duration + audioOffsetSeconds);
    const wavEstimate = estimatePcmWavBytes(expectedDuration || audioInfo.duration, { sampleRate: 48000, channels: 2, bytesPerSample: 2 });
    const decodedBytes = calculateAudioBufferBytes(expectedDuration || audioInfo.duration, 48000, 2);
    if (!wavEstimate || wavEstimate.totalBytes > Math.min(MAX_AUDIO_WAV_BYTES, DEFAULT_MAX_WAV_BYTES)) {
      throw new Error(`Нормализованный WAV будет слишком большим (${wavEstimate ? Math.round(wavEstimate.totalBytes / 1048576) : "неизвестно"} МиБ; лимит ${Math.round(Math.min(MAX_AUDIO_WAV_BYTES, DEFAULT_MAX_WAV_BYTES) / 1048576)} МиБ).`);
    }
    if (!decodedBytes || decodedBytes > DEFAULT_MAX_DECODED_BYTES) {
      throw new Error(`Аудиодорожка слишком длинная для текущего OfflineAudioContext: оценка памяти ${decodedBytes ? Math.round(decodedBytes / 1048576) : "неизвестно"} МиБ, предел ${Math.round(DEFAULT_MAX_DECODED_BYTES / 1048576)} МиБ. Для длинных дорожек требуется потоковый аудиомикшер.`);
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-normalized-audio-"));
    const outputPath = path.join(tempDir, "normalized-audio.wav");
    const args = buildPcmWavNormalizeArgs(filePath, outputPath, {
      streamIndex: audioInfo.streamIndex,
      sampleRate: 48000,
      channels: 2,
      startOffsetSeconds: audioOffsetSeconds
    });
    await runLocalTool("ffmpeg", args, 30 * 60 * 1000);
    const stat = await fs.stat(outputPath);
    if (!stat.isFile() || stat.size < 44 || stat.size > Math.min(MAX_AUDIO_WAV_BYTES, DEFAULT_MAX_WAV_BYTES)) {
      throw new Error("Нормализованный WAV пуст или превышает допустимый размер.");
    }
    const wavBuffer = await fs.readFile(outputPath);
    const wavInfo = inspectPcmWavHeader(wavBuffer, { channels: 2, sampleRate: 48000 });
    const durationReference = expectedDuration > 0 ? expectedDuration : audioInfo.duration;
    if (Math.abs(wavInfo.duration - durationReference) > Math.max(0.15, 0.01 * durationReference)) {
      throw new Error(`Длительность нормализованного звука (${wavInfo.duration.toFixed(3)} с) заметно отличается от ожидаемой (${durationReference.toFixed(3)} с).`);
    }
    const wavData = wavBuffer.buffer.slice(wavBuffer.byteOffset, wavBuffer.byteOffset + wavBuffer.byteLength);
    return {
      status: "success",
      mediaId: request.mediaId,
      audioInfo,
      normalized: { codec: "pcm_s16le", sampleRate: 48000, channels: 2, channelLayout: "stereo", duration: wavInfo.duration },
      audioOffsetSeconds,
      sourceBytes: size,
      wavBytes: wavBuffer.length,
      wavData
    };
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  } finally {
    if (tempDir) {
      try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (_) {}
    }
  }
}

async function cleanupFrameSequenceSourceStages(session) {
  if (!session || !session.sourceFrames) return;
  const cleanupTasks = [];
  for (const source of session.sourceFrames.values()) {
    if (source && source.stageToken) {
      cleanupTasks.push(stagedFileManager.cleanup(session.ownerWebContentsId, source.stageToken));
      source.stageToken = null;
    }
  }
  await Promise.all(cleanupTasks.map(task => Promise.resolve(task).catch(error => {
    console.error("[Точное декодирование источника] Не удалось удалить временный исходник:", error);
  })));
}

async function evictSourceFrameCache(session, targetBytes, protectedKeys = new Set()) {
  const plan = calculateSourceFrameCacheEvictions(
    session.sourceFrameCacheEntries,
    session.sourceFrameBytes,
    targetBytes,
    protectedKeys
  );
  for (const key of plan.evictKeys) {
    const entry = session.sourceFrameCacheEntries.get(key);
    if (!entry) continue;
    await fs.rm(entry.path, { force: true });
    entry.source.frameFiles.delete(entry.frameIndex);
    entry.source.bytes = Math.max(0, entry.source.bytes - entry.sizeBytes);
    session.sourceFrameCacheEntries.delete(key);
    session.sourceFrameBytes = Math.max(0, session.sourceFrameBytes - entry.sizeBytes);
  }
  return { evictedFrames: plan.evictKeys.length, bytesFreed: plan.bytesToFree };
}

function touchSourceFrameCacheEntry(session, entry) {
  const nextUse = ++session.sourceFrameCacheSequence;
  entry.lastUsed = nextUse;
  const key = buildSourceFrameCacheKey(entry.mediaId, entry.frameIndex);
  session.sourceFrameCacheEntries.set(key, entry);
  entry.source.frameFiles.set(entry.frameIndex, entry);
}

async function ensureSourceDecoderMode(source) {
  if (source.decodeMode) return source.decodeMode;
  if (source.decodeProbePromise) return source.decodeProbePromise;
  source.decodeProbePromise = (async () => {
    const decision = await selectSourceDecoder({
      sourcePixelFormat: source.pixelFormat,
      probeNvdec: async (downloadPixelFormat) => {
        const args = buildNvdecProbeArgs({
          inputPath: source.filePath,
          downloadPixelFormat,
          nullOutputPath: process.platform === "win32" ? "NUL" : "/dev/null"
        });
        await runLocalTool("ffmpeg", args, 20000);
      }
    });
    source.decodeMode = decision.mode;
    source.downloadPixelFormat = decision.downloadPixelFormat;
    source.decodeFallbackReason = decision.reason;
    if (decision.mode === "cuda") {
      console.info("[NVDEC_PROBE_PASS] Аппаратное декодирование исходника прошло пробу:", JSON.stringify({
        mediaId: source.mediaId, codec: source.codec, pixelFormat: source.pixelFormat,
        downloadPixelFormat: decision.downloadPixelFormat, decoder: "cuda"
      }));
    } else {
      console.info("[NVDEC_SOFTWARE_FALLBACK] Для источника оставлен программный декодер:", JSON.stringify({
        mediaId: source.mediaId, codec: source.codec, pixelFormat: source.pixelFormat,
        reason: decision.reason
      }));
    }
    return source.decodeMode;
  })();
  try {
    return await source.decodeProbePromise;
  } finally {
    source.decodeProbePromise = null;
  }
}

async function decodeSourceFrameWindow(session, source, requestedIndex) {
  const current = source.frameFiles.get(requestedIndex);
  if (current) return current;
  if (source.windowPromise) {
    await source.windowPromise;
    const afterWait = source.frameFiles.get(requestedIndex);
    if (afterWait) return afterWait;
  }

  const operation = (async () => {
    await ensureSourceDecoderMode(source);
    let windowSize = source.windowFrames || DEFAULT_SOURCE_FRAME_WINDOW_FRAMES;
    while (windowSize >= 1) {
      const selectedWindow = selectSourceFrameWindow(source.frameIndices, requestedIndex, windowSize);
      const missingIndices = selectedWindow.filter(index => !source.frameFiles.has(index));
      if (!missingIndices.length) return source.frameFiles.get(requestedIndex);

      // PNG cache files are compressed; estimating every cached file at full RGBA size
      // artificially shrinks 4K windows to 12 frames and launches FFmpeg repeatedly.
      // Use a conservative 25% planning estimate, while the real stat() batchBytes check
      // below remains the hard 512 MiB limit and halves/retries oversized batches.
      const estimate = estimateSourceFrameWindowBytes(
        source.renderWidth, source.renderHeight, missingIndices.length, SOURCE_FRAME_WINDOW_PNG_ESTIMATE_RATIO
      );
      console.info("[Оконный кэш исходных кадров] План окна:", JSON.stringify({
        mediaId: source.mediaId,
        requestedIndex,
        windowFrames: windowSize,
        missingFrames: missingIndices.length,
        estimatedPngBytes: estimate.totalBytes,
        estimateRatio: SOURCE_FRAME_WINDOW_PNG_ESTIMATE_RATIO,
        cacheLimitBytes: MAX_SOURCE_FRAME_CACHE_BYTES
      }));
      if (estimate.totalBytes > MAX_SOURCE_FRAME_CACHE_BYTES) {
        const reducedWindow = reduceSourceFrameWindowSize(windowSize);
        if (reducedWindow == null) {
          throw new Error("Даже одно PNG-окно исходного видео превышает бюджет 512 МиБ.");
        }
        windowSize = reducedWindow;
        source.windowFrames = windowSize;
        console.info("[Оконный кэш исходных кадров] Окно уменьшено по оценке PNG:", JSON.stringify({
          mediaId: source.mediaId, requestedIndex, windowFrames: windowSize,
          estimateBytes: estimate.totalBytes, cacheLimitBytes: MAX_SOURCE_FRAME_CACHE_BYTES
        }));
        continue;
      }
      const targetCacheBytes = Math.max(0, MAX_SOURCE_FRAME_CACHE_BYTES - estimate.totalBytes);
      await evictSourceFrameCache(session, targetCacheBytes);
      try {
        await ensureSessionDiskSpace(session, {
          remainingOutputFrames: 0,
          pendingSourceFrames: missingIndices.length,
          sourceWidth: source.renderWidth,
          sourceHeight: source.renderHeight,
          includeAudioBytes: false
        });
      } catch (spaceError) {
        const reducedWindow = spaceError && spaceError.code === "TEMP_DISK_SPACE_LOW"
          ? reduceSourceFrameWindowSize(windowSize) : null;
        if (reducedWindow == null) throw spaceError;
        windowSize = reducedWindow;
        source.windowFrames = windowSize;
        console.warn("[Оконный кэш исходных кадров] Окно уменьшено из-за нехватки места на временном диске:", JSON.stringify({
          mediaId: source.mediaId, requestedIndex, windowFrames: windowSize,
          reason: String(spaceError && spaceError.message || spaceError).slice(-600)
        }));
        continue;
      }

      const batchDir = path.join(source.cacheDir, `.window_${String(++source.windowCounter).padStart(6, "0")}`);
      await fs.mkdir(batchDir, { recursive: false });
      try {
        const outputPattern = path.join(batchDir, "frame_%06d.png");
        const buildExtractionArgs = (hardwareDecode) => buildSourceFrameExtractionFfmpegArgs({
          inputPath: source.filePath,
          outputPattern,
          fps: source.fps,
          frameIndices: missingIndices,
          seekStartIndex: selectedWindow[0],
          sourceStartTime: source.startTime,
          hardwareDecode,
          downloadPixelFormat: source.downloadPixelFormat || "nv12",
          renderWidth: source.renderDownscaled ? source.renderWidth : null,
          renderHeight: source.renderDownscaled ? source.renderHeight : null
        });
        await runExtractionWithNvdecFallback({
          decoderMode: source.decodeMode,
          runHardware: () => runLocalTool("ffmpeg", buildExtractionArgs(true), 30 * 60 * 1000),
          runSoftware: () => runLocalTool("ffmpeg", buildExtractionArgs(false), 30 * 60 * 1000),
          onNvdecFailure: async (decodeError) => {
            // A probe may pass but a later seek/window can still fail due to a
            // driver reset, unsupported bitstream feature or decoder surface limit.
            source.decodeMode = "software";
            source.decodeFallbackReason = String(decodeError && decodeError.message || decodeError).slice(-1200);
            console.warn("[NVDEC_WINDOW_FALLBACK] Оконное декодирование не удалось; повторяем это окно программно:", JSON.stringify({
              mediaId: source.mediaId, requestedIndex, reason: source.decodeFallbackReason
            }));
            await fs.rm(batchDir, { recursive: true, force: true });
            await fs.mkdir(batchDir, { recursive: false });
          }
        });
        const names = (await fs.readdir(batchDir))
          .filter(name => /^frame_\d{6}\.png$/i.test(name))
          .sort((a, b) => Number(a.slice(6, -4)) - Number(b.slice(6, -4)));
        if (names.length !== missingIndices.length) {
          throw new Error(`FFmpeg декодировал ${names.length} из ${missingIndices.length} кадров в оконном кэше источника.`);
        }

        const batchFiles = [];
        let batchBytes = 0;
        for (let i = 0; i < names.length; i++) {
          const framePath = path.join(batchDir, names[i]);
          const stat = await fs.stat(framePath);
          if (!stat.isFile() || stat.size < 8 || stat.size > MAX_FRAME_BYTES) {
            throw new Error(`PNG исходного кадра ${missingIndices[i]} пуст или превышает безопасный размер 64 МиБ.`);
          }
          if (stat.size > MAX_FRAME_BYTES) throw new Error("Размер PNG исходного кадра превышает предел одного кадра.");
          batchBytes += stat.size;
          batchFiles.push({ frameIndex: missingIndices[i], sourcePath: framePath, sizeBytes: stat.size });
        }

        if (batchBytes > MAX_SOURCE_FRAME_CACHE_BYTES) {
          const reducedWindow = reduceSourceFrameWindowSize(windowSize);
          if (reducedWindow == null) {
            throw new Error("Один исходный кадр превышает весь бюджет оконного кэша 512 МиБ.");
          }
          windowSize = reducedWindow;
          source.windowFrames = windowSize;
          console.warn("[Оконный кэш исходных кадров] Фактический размер PNG превысил бюджет; окно уменьшено и будет повторено:", JSON.stringify({
            mediaId: source.mediaId, requestedIndex, windowFrames: windowSize,
            batchBytes, cacheLimitBytes: MAX_SOURCE_FRAME_CACHE_BYTES
          }));
          await fs.rm(batchDir, { recursive: true, force: true });
          continue;
        }
        if (batchBytes > MAX_SOURCE_FRAME_CACHE_BYTES) {
          throw new Error("Один исходный кадр превышает весь бюджет оконного кэша 512 МиБ.");
        }

        // The actual PNG ratio can differ from the estimate. Free additional
        // LRU entries before moving the verified batch into the persistent cache.
        await evictSourceFrameCache(session, Math.max(0, MAX_SOURCE_FRAME_CACHE_BYTES - batchBytes));
        for (const file of batchFiles) {
          const targetPath = path.join(source.cacheDir, `frame_${String(file.frameIndex).padStart(6, "0")}.png`);
          await fs.rename(file.sourcePath, targetPath);
          const entry = {
            mediaId: source.mediaId,
            frameIndex: file.frameIndex,
            path: targetPath,
            sizeBytes: file.sizeBytes,
            lastUsed: 0,
            source
          };
          session.sourceFrameBytes += entry.sizeBytes;
          source.bytes += entry.sizeBytes;
          touchSourceFrameCacheEntry(session, entry);
        }
        await fs.rm(batchDir, { recursive: true, force: true });
        await ensureSessionDiskSpace(session, {
          remainingOutputFrames: 0,
          pendingSourceFrames: 0,
          includeAudioBytes: false
        });
        console.info("[Оконный кэш исходных кадров] Декодировано:", JSON.stringify({
          mediaId: source.mediaId,
          requestedIndex,
          frames: batchFiles.length,
          windowFrames: windowSize,
          batchBytes,
          cacheBytes: session.sourceFrameBytes,
          cacheLimitBytes: MAX_SOURCE_FRAME_CACHE_BYTES
        }));
        return source.frameFiles.get(requestedIndex);
      } catch (error) {
        await fs.rm(batchDir, { recursive: true, force: true }).catch(() => {});
        throw error;
      }
    }
    throw new Error(`Не удалось подготовить окно исходных кадров для кадра ${requestedIndex}.`);
  })();

  source.windowPromise = operation;
  try {
    const entry = await operation;
    if (!entry) throw new Error(`Исходный кадр ${requestedIndex} не появился в оконном кэше.`);
    return entry;
  } finally {
    if (source.windowPromise === operation) source.windowPromise = null;
  }
}

async function handlePrepareFrameSequenceSourceFrames(event, request) {
  let session = null;
  let frameDir = null;
  try {
    session = getTrustedFrameSequenceSession(event, request);
    if (typeof request.mediaId !== "string" || !request.mediaId || request.mediaId.length > 200) {
      throw new Error("Некорректный идентификатор видеоисточника для покадрового декодирования.");
    }
    if (session.sourceFrames.has(request.mediaId)) {
      throw new Error("Кадры этого видеоисточника уже зарегистрированы в текущей сессии.");
    }
    if (!Number.isInteger(request.expectedFps) || request.expectedFps !== session.fps) {
      throw new Error("FPS подготовки исходных кадров не совпадает с FPS экспорта.");
    }
    const maxClipScale = request.maxClipScale == null ? 1 : Number(request.maxClipScale);
    if (!Number.isFinite(maxClipScale) || maxClipScale < 0.1 || maxClipScale > 5) {
      throw new Error("Масштаб клипа для подготовки рабочих кадров должен быть от 0,1 до 5.");
    }
    const frameIndices = validateSourceFrameIndices(request.frameIndices);
    const sourceInfo = await resolveIncomingMediaPath(event, request, 12);
    const probe = await probeLocalMedia(sourceInfo.filePath);
    const videoStream = probe.streams.find(stream => stream.codec_type === "video");
    if (!videoStream || !Number.isFinite(Number(videoStream.width)) || !Number.isFinite(Number(videoStream.height)) ||
        Number(videoStream.width) <= 0 || Number(videoStream.height) <= 0 ||
        Number(videoStream.width) > 16384 || Number(videoStream.height) > 16384) {
      throw new Error("FFprobe не обнаружил корректную видеодорожку с поддерживаемыми размерами.");
    }
    const renderSize = calculateSourceFrameRenderSize(
      Number(videoStream.width), Number(videoStream.height),
      session.width, session.height, maxClipScale
    );

    const sourceCounter = session.sourceFrameCounter++;
    const sourceStem = `source_${String(sourceCounter).padStart(3, "0")}`;
    frameDir = path.join(session.tempDir, `${sourceStem}_cache`);
    await fs.mkdir(frameDir, { recursive: false });
    const source = {
      mediaId: request.mediaId,
      filePath: sourceInfo.filePath,
      stageToken: sourceInfo.stageToken,
      fps: session.fps,
      startTime: Number.isFinite(Number(videoStream.start_time)) ? Number(videoStream.start_time) : 0,
      frameIndices,
      frameIndexSet: new Set(frameIndices),
      frameFiles: new Map(),
      frameCount: frameIndices.length,
      bytes: 0,
      width: Number(videoStream.width),
      height: Number(videoStream.height),
      renderWidth: renderSize.width,
      renderHeight: renderSize.height,
      renderScale: renderSize.scale,
      renderDownscaled: renderSize.downscaled,
      maxClipScale,
      pixelFormat: typeof videoStream.pix_fmt === "string" ? videoStream.pix_fmt : null,
      codec: typeof videoStream.codec_name === "string" ? videoStream.codec_name : null,
      decodeMode: null,
      decodeProbePromise: null,
      decodeFallbackReason: null,
      downloadPixelFormat: null,
      cacheDir: frameDir,
      windowFrames: DEFAULT_SOURCE_FRAME_WINDOW_FRAMES,
      windowCounter: 0,
      windowPromise: null
    };
    session.sourceFrames.set(request.mediaId, source);
    if (source.renderDownscaled) {
      console.info("[Оконный кэш исходных кадров] Рабочий кадр уменьшен для разрешения экспорта:", JSON.stringify({
        mediaId: source.mediaId,
        sourceWidth: source.width,
        sourceHeight: source.height,
        renderWidth: source.renderWidth,
        renderHeight: source.renderHeight,
        renderScale: Number(source.renderScale.toFixed(4)),
        maxClipScale: source.maxClipScale,
        outputWidth: session.width,
        outputHeight: session.height
      }));
    }
    console.info("[Оконный кэш исходных кадров] Источник зарегистрирован:", JSON.stringify({
      mediaId: request.mediaId,
      sourceName: String(request.sourceName || "").slice(0, 100),
      fps: session.fps,
      plannedFrameCount: frameIndices.length,
      sourceStartTime: source.startTime,
      width: source.width,
      height: source.height,
      renderWidth: source.renderWidth,
      renderHeight: source.renderHeight,
      renderScale: Number(source.renderScale.toFixed(4)),
      renderDownscaled: source.renderDownscaled,
      maxClipScale: source.maxClipScale,
      codec: source.codec,
      pixelFormat: source.pixelFormat,
      inputBytes: sourceInfo.size,
      windowFrames: source.windowFrames,
      cacheLimitBytes: MAX_SOURCE_FRAME_CACHE_BYTES,
      stagedSource: !!source.stageToken
    }));
    return {
      status: "success",
      mediaId: request.mediaId,
      frameCount: frameIndices.length,
      byteCount: 0,
      deferred: true,
      retainSourceStage: !!source.stageToken
    };
  } catch (error) {
    if (frameDir) {
      try { await fs.rm(frameDir, { recursive: true, force: true }); } catch (_) {}
    }
    const message = String(error && error.message || error);
    console.error("[Оконный кэш исходных кадров] Не удалось зарегистрировать источник:", message);
    return { status: "error", message };
  }
}

function countFrameIndexRanges(indices) {
  let count = 0;
  let previous = -2;
  for (const index of indices) {
    if (index !== previous + 1) count++;
    previous = index;
  }
  return count;
}

async function handleReadFrameSequenceSourceFrame(event, request) {
  try {
    const session = getTrustedFrameSequenceSession(event, request);
    if (typeof request.mediaId !== "string" || request.mediaId.length > 200 ||
        !Number.isInteger(request.sourceFrameIndex) || request.sourceFrameIndex < 0) {
      throw new Error("Некорректные параметры чтения исходного кадра.");
    }
    const source = session.sourceFrames.get(request.mediaId);
    if (!source || !source.frameIndexSet.has(request.sourceFrameIndex)) {
      throw new Error(`Исходный кадр ${request.sourceFrameIndex} не входит в зарегистрированный план экспорта.`);
    }
    const entry = await decodeSourceFrameWindow(session, source, request.sourceFrameIndex);
    const buffer = await fs.readFile(entry.path);
    if (buffer.length < 8 || buffer.length > MAX_FRAME_BYTES ||
        !buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      throw new Error(`Подготовленный исходный кадр ${request.sourceFrameIndex} не является корректным PNG или превышает безопасный размер.`);
    }
    touchSourceFrameCacheEntry(session, entry);
    const pngData = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    return { status: "success", mediaId: request.mediaId, sourceFrameIndex: request.sourceFrameIndex, pngData };
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }
}

async function handleFinishFrameSequenceExport(event, request) {
  let initialSession;
  try {
    initialSession = getTrustedFrameSequenceSession(event, request);
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }
  if (initialSession.streamingFrames) {
    return handleFinishStreamingFrameSequenceExport(event, request, initialSession);
  }

  let session;
  let tempDir = null;
  let ownsFinalization = false;
  try {
    session = getTrustedFrameSequenceSession(event, request);
    if (session.finalizing) throw new Error("Финализация этой сессии экспорта уже выполняется.");
    session.finalizing = true;
    ownsFinalization = true;
    tempDir = session.tempDir;
    if (session.cancelRequested) {
      const cancelled = new Error("Экспорт отменён пользователем.");
      cancelled.code = "PROCESS_CANCELLED";
      throw cancelled;
    }
    if (session.nextFrameIndex !== session.frameCount) {
      throw new Error(`Последовательность неполная: записано ${session.nextFrameIndex} из ${session.frameCount} кадров.`);
    }

    const wavBuffer = toWavBuffer(request.audioWavData);
    if (session.audioExpected && !wavBuffer) {
      throw new Error("Звук ожидался, но WAV не передан для финального сведения.");
    }
    if (!session.audioExpected && wavBuffer) {
      throw new Error("Передан неожиданный WAV: проект не заявлял звуковую дорожку.");
    }

    if (wavBuffer && wavBuffer.length !== session.expectedAudioBytes) {
      throw new Error("Размер WAV отличается от предварительной оценки, переданной перед экспортом. Повторите экспорт.");
    }
    await ensureSessionDiskSpace(session, { remainingOutputFrames: 0, includeAudioBytes: true });
    let audioPath = null;
    if (wavBuffer) {
      audioPath = path.join(session.tempDir, "audio.wav");
      await fs.writeFile(audioPath, wavBuffer, { flag: "wx" });
      await ensureSessionDiskSpace(session, { remainingOutputFrames: 0, includeAudioBytes: false });
      const audioInfo = await probeLocalMedia(audioPath);
      if (!audioInfo.formatName.split(",").includes("wav") ||
          !audioInfo.streams.some((stream) => stream.codec_type === "audio")) {
        throw new Error("FFprobe не подтвердил аудиодорожку WAV.");
      }
      if (!Number.isFinite(audioInfo.duration) ||
          Math.abs(audioInfo.duration - session.duration) > Math.max(0.02, 1 / session.fps)) {
        throw new Error("Длительность WAV не совпадает с точной длительностью плана кадров.");
      }
    }

    const outputPathTemp = path.join(session.tempDir, "output.mp4");
    const args = buildPngSequenceFfmpegArgs({
      tempDir: session.tempDir,
      outputPath: outputPathTemp,
      fps: session.fps,
      frameCount: session.frameCount,
      duration: session.duration,
      audioPath,
      audioExpected: session.audioExpected
    });
    if (session.cancelRequested) {
      const cancelled = new Error("Экспорт отменён пользователем.");
      cancelled.code = "PROCESS_CANCELLED";
      throw cancelled;
    }
    console.info("[PNG-sequence MP4] Кодирование последовательности:", JSON.stringify({
      fps: session.fps,
      frameCount: session.frameCount,
      duration: session.duration,
      imageBytes: session.totalFrameBytes,
      audioExpected: session.audioExpected
    }));
    const ffmpegArgs = ["-progress", "pipe:1", "-stats_period", "0.5", ...args];
    const ffmpegExecutable = await resolveExecutable("ffmpeg");
    if (!ffmpegExecutable) throw new Error("FFmpeg не найден. Проверьте PATH или переменную FFMPEG_PATH и перезапустите редактор.");
    const ffmpegJob = startManagedProcess(ffmpegExecutable, ffmpegArgs, {
      timeoutMs: 30 * 60 * 1000,
      killGraceMs: 7000,
      onProgress: (progress) => {
        const currentSeconds = timeToSeconds(progress.out_time) ??
          (Number.isFinite(Number(progress.out_time_ms)) ? Number(progress.out_time_ms) / 1000000 : null);
        const percent = currentSeconds == null || !(session.duration > 0)
          ? null : Math.max(0, Math.min(99.5, currentSeconds / session.duration * 100));
        try {
          if (session.webContents && !session.webContents.isDestroyed()) {
            session.webContents.send("export:ffmpeg-progress", {
              sessionId: session.sessionId,
              stage: progress.progress === "end" ? "verifying" : "encoding",
              frame: Number.isFinite(Number(progress.frame)) ? Number(progress.frame) : null,
              currentSeconds,
              duration: session.duration,
              percent
            });
          }
        } catch (error) {
          console.warn("Не удалось передать прогресс FFmpeg в интерфейс:", error.message);
        }
      }
    });
    session.ffmpegJob = ffmpegJob;
    try {
      await ffmpegJob.promise;
    } finally {
      if (session.ffmpegJob === ffmpegJob) session.ffmpegJob = null;
    }
    if (session.cancelRequested || ffmpegJob.cancelRequested) {
      const cancelled = new Error("Экспорт отменён пользователем.");
      cancelled.code = "PROCESS_CANCELLED";
      throw cancelled;
    }
    const outputInfo = await fs.stat(outputPathTemp);
    if (!outputInfo.isFile() || outputInfo.size === 0) {
      throw new Error("FFmpeg не создал непустой выходной MP4 из PNG-последовательности.");
    }
    const verification = await verifyLocalMp4(
      outputPathTemp,
      session.duration,
      session.audioExpected,
      session.fps,
      session.frameCount
    );
    if (session.cancelRequested) {
      const cancelled = new Error("Экспорт отменён пользователем.");
      cancelled.code = "PROCESS_CANCELLED";
      throw cancelled;
    }
    await runLocalTool("ffmpeg", [
      "-hide_banner", "-v", "error", "-xerror", "-i", outputPathTemp, "-f", "null", os.devNull
    ], 10 * 60 * 1000);
    if (session.cancelRequested) {
      const cancelled = new Error("Экспорт отменён пользователем.");
      cancelled.code = "PROCESS_CANCELLED";
      throw cancelled;
    }
    await ensureFinalOutputSpace(session, outputInfo.size);
    await fs.copyFile(outputPathTemp, session.outputPath);
    const savedInfo = await fs.stat(session.outputPath);
    if (!savedInfo.isFile() || savedInfo.size !== outputInfo.size) {
      throw new Error("Проверка сохранения MP4 не пройдена: размер сохранённого файла отличается от проверенного результата.");
    }

    return {
      status: "success",
      fileName: path.basename(session.outputPath),
      sizeBytes: outputInfo.size,
      verification,
      captureMethod: "png-sequence"
    };
  } catch (error) {
    if (error && error.code === "PROCESS_CANCELLED") {
      console.info("[PNG-sequence MP4] Финальное кодирование отменено пользователем.");
      return { status: "cancelled" };
    }
    console.error("[PNG-sequence MP4] Экспорт завершился ошибкой:", error);
    return { status: "error", message: String(error && error.message || error) };
  } finally {
    const sessionId = ownsFinalization && session && session.sessionId;
    if (sessionId) {
      await cleanupFrameSequenceSourceStages(session);
      frameSequenceExports.delete(sessionId);
      if (tempDir) {
        try { await fs.rm(tempDir, { recursive: true, force: true }); }
        catch (error) { console.error("[PNG-sequence MP4] Не удалось удалить временную последовательность:", error); }
      }
      frameSequenceExportActive = false;
      }
  }
}

async function handleCancelFrameSequenceExport(event, request) {
  try {
    const session = getTrustedFrameSequenceSession(event, request);
    session.cancelRequested = true;
    if (session.ffmpegJob) {
      const job = session.ffmpegJob;
      job.cancel();
      if (session.streamingFrames && !session.finalizing) {
        await job.promise.catch(() => {});
        if (!session.finalizing && frameSequenceExports.get(session.sessionId) === session) {
          session.ffmpegJob = null;
          await cleanupFrameSequenceSourceStages(session);
          frameSequenceExports.delete(session.sessionId);
          try { await fs.rm(session.tempDir, { recursive: true, force: true }); }
          catch (error) { console.error("[PNG-pipe MP4] Не удалось очистить потоковую сессию при отмене:", error); }
          frameSequenceExportActive = false;
        }
        return { status: "cancelled", stage: "ffmpeg" };
      }
      return { status: "cancelling", stage: "ffmpeg" };
    }
    if (session.finalizing) {
      // The finalization handler owns cleanup and keeps the global export lock
      // until verification/copying has either completed or been aborted.
      return { status: "cancelling", stage: "finalizing" };
    }
    await cleanupFrameSequenceSourceStages(session);
    frameSequenceExports.delete(session.sessionId);
    try { await fs.rm(session.tempDir, { recursive: true, force: true }); }
    catch (error) { console.error("[PNG-sequence MP4] Не удалось удалить временные кадры при отмене:", error); }
    frameSequenceExportActive = false;
    return { status: "cancelled" };
  } catch (error) {
    return { status: "error", message: String(error && error.message || error) };
  }
}

async function handleToolDiagnostics(event) {
  if (!isTrustedExportSender(event)) {
    return { status: "error", message: "Запрос диагностики получен не из окна редактора." };
  }
  try {
    return { status: "success", report: await collectToolDiagnostics() };
  } catch (error) {
    console.error("[Диагностика FFmpeg] Ошибка проверки инструментов:", error);
    return { status: "error", message: String(error && error.message || error) };
  }
}

async function handleSaveStillFrame(event, request) {
  if (!isTrustedExportSender(event)) {
    return { status: "error", message: "Запрос сохранения кадра получен не из окна редактора." };
  }
  let settings;
  try {
    settings = validateStillFrameRequest(request);
    const sourcePath = stagedFileManager.getPath(event.sender.id, request.stageToken);
    const stat = await fs.stat(sourcePath);
    if (!stat.isFile()) throw new Error("Временный файл кадра не найден.");
    const handle = await fs.open(sourcePath, "r");
    let firstBytes, lastBytes;
    try {
      const first = Buffer.alloc(8);
      const firstRead = await handle.read(first, 0, first.length, 0);
      firstBytes = first.subarray(0, firstRead.bytesRead);
      const tail = Buffer.alloc(2);
      const lastRead = await handle.read(tail, 0, tail.length, Math.max(0, stat.size - 2));
      lastBytes = tail.subarray(0, lastRead.bytesRead);
    } finally { await handle.close(); }
    validateStillFramePayload(settings.format, stat.size, firstBytes, lastBytes);

    const saveDialog = await dialog.showSaveDialog(mainWindow, {
      title: uiTextKey("dialog.frame.save.title"),
      defaultPath: path.join(app.getPath("pictures"), `${settings.suggestedName}${settings.extension}`),
      filters: settings.format === "png"
        ? [{ name: uiTextKey("dialog.frame.filter.png"), extensions: ["png"] }]
        : [{ name: uiTextKey("dialog.frame.filter.jpeg"), extensions: ["jpg", "jpeg"] }]
    });
    if (saveDialog.canceled || !saveDialog.filePath) return { status: "cancelled" };

    const outputPath = resolveStillFrameOutputPath(saveDialog.filePath, settings.format);
    const outputDirectory = path.dirname(outputPath);
    const disk = await queryDiskSpace(outputDirectory);
    const reserveBytes = 1024 * 1024;
    if (disk.freeBytes < stat.size + reserveBytes) {
      throw new Error(`Недостаточно места для изображения: свободно ${formatBytes(disk.freeBytes)}, требуется ${formatBytes(stat.size + reserveBytes)} с небольшим резервом.`);
    }

    // Write to a sibling temporary file and rename only after the copy completes.
    const temporaryPath = `${outputPath}.${randomUUID()}.tmp`;
    try {
      await fs.copyFile(sourcePath, temporaryPath);
      const copied = await fs.stat(temporaryPath);
      if (copied.size !== stat.size) throw new Error("Размер сохранённого кадра не совпадает с исходным изображением.");
      await fs.rename(temporaryPath, outputPath);
    } catch (error) {
      try { await fs.rm(temporaryPath, { force: true }); } catch (_) {}
      throw error;
    }

    console.info("[Сохранение кадра] Изображение сохранено:", JSON.stringify({
      fileName: path.basename(outputPath), size: stat.size,
      width: settings.width, height: settings.height, frameNumber: settings.frameNumber
    }));
    return {
      status: "success",
      fileName: path.basename(outputPath),
      size: stat.size,
      width: settings.width,
      height: settings.height,
      format: settings.format,
      timeSeconds: settings.timeSeconds,
      frameNumber: settings.frameNumber
    };
  } catch (error) {
    console.error("[Сохранение кадра] Ошибка:", error);
    return { status: "error", message: String(error && error.message || error) };
  }
}

registerUiLocaleHandler();
registerStructuredIpcHandler(ipcMain, "frame:save-still", handleSaveStillFrame);
registerStructuredIpcHandler(ipcMain, "system:tool-diagnostics", handleToolDiagnostics);
registerStructuredIpcHandler(ipcMain, "export:get-codec-capabilities", handleGetFrameSequenceExportCapabilities);

registerStructuredIpcHandler(ipcMain, "export:begin-png-sequence", handleBeginFrameSequenceExport);
registerStructuredIpcHandler(ipcMain, "export:write-png-frame", handleWriteFrameSequenceFrame);
registerStructuredIpcHandler(ipcMain, "export:start-png-stream", handleStartFrameSequenceEncoding);
registerStructuredIpcHandler(ipcMain, "export:prepare-source-frames", handlePrepareFrameSequenceSourceFrames);
registerStructuredIpcHandler(ipcMain, "media:extract-video-audio", handleExtractVideoAudioForExport);
registerStructuredIpcHandler(ipcMain, "media:inspect-audio", handleInspectAudioMedia);
registerStructuredIpcHandler(ipcMain, "media:prepare-audio", handlePrepareAudioForExport);
registerStructuredIpcHandler(ipcMain, "media:stage-file-begin", handleBeginStagedMediaFile);
registerStructuredIpcHandler(ipcMain, "media:stage-file-write", handleWriteStagedMediaFileChunk);
registerStructuredIpcHandler(ipcMain, "media:stage-file-finish", handleFinishStagedMediaFile);
registerStructuredIpcHandler(ipcMain, "media:stage-file-cleanup", handleCleanupStagedMediaFile);
registerStructuredIpcHandler(ipcMain, "export:read-source-frame", handleReadFrameSequenceSourceFrame);
registerStructuredIpcHandler(ipcMain, "export:finish-png-sequence", handleFinishFrameSequenceExport);
registerStructuredIpcHandler(ipcMain, "export:cancel-png-sequence", handleCancelFrameSequenceExport);
registerStructuredIpcHandler(ipcMain, LOCAL_WEBM_DURATION_CHANNEL, handleWebmDurationInspection);

function createWindow() {
  const appIcon = app.isPackaged
    ? path.join(path.dirname(process.execPath), "Montazhnaya.ico")
    : path.join(__dirname, "..", "assets", "montazhnaya.ico");
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 700,
    ...(process.platform === "win32" ? { icon: appIcon } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const editorPath = path.join(
    __dirname,
    "..",
    "src",
    "renderer",
    "index.html"
  );
  const tooltipAuditMode = process.env.MONTAZHNAYA_TOOLTIP_QA === "1";
  const editorUrl = pathToFileURL(editorPath).href;
  const editorUrlWithAuditQuery = tooltipAuditMode ? editorUrl + "?tooltip-audit=1" : editorUrl;

  // The renderer is a local, single-window editor. It has no need to navigate
  // to arbitrary documents or spawn additional BrowserWindow instances.
  // Keep the main frame pinned to the packaged editor document. The only
  // optional query flag enables the narrow local tooltip-audit bridge.
  const blockUnexpectedNavigation = (event, navigationUrl) => {
    if (navigationUrl !== editorUrl && navigationUrl !== editorUrlWithAuditQuery) {
      event.preventDefault();
      console.warn("[Безопасность] Заблокирована навигация из окна редактора:", navigationUrl);
    }
  };
  mainWindow.webContents.on("will-navigate", blockUnexpectedNavigation);
  mainWindow.webContents.on("will-redirect", blockUnexpectedNavigation);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.warn("[Безопасность] Заблокировано создание дополнительного окна:", url);
    return { action: "deny" };
  });

  mainWindow.loadFile(editorPath, tooltipAuditMode ? { query: { "tooltip-audit": "1" } } : undefined);
  installWindowCloseGuard(mainWindow, {
    getDirtyState: async () => {
      if (mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) return false;
      // AppState is a top-level lexical binding in the renderer, not a window property.
      return !!(await mainWindow.webContents.executeJavaScript(
        'Boolean(typeof AppState !== "undefined" && AppState.dirty === true)', true
      ));
    },
    confirmDiscard: async () => {
      if (mainWindow.isDestroyed()) return true;
      const result = await dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: uiText("Закрыть «Монтажную»?"),
        message: uiText("В проекте есть несохранённые изменения."),
        detail: uiText("Можно сохранить проект через меню «Файл» или выйти без сохранения. Видео и аудио, которые ещё не сохранены в проект, могут быть потеряны."),
        buttons: [uiText("Выйти без сохранения"), uiText("Отмена")],
        defaultId: 1,
        cancelId: 1,
        noLink: true
      });
      return result.response === 0;
    },
    onError: error => console.error("[Закрытие приложения] Не удалось проверить состояние проекта:", error)
  });
  const ownerWebContentsId = mainWindow.webContents.id;
  mainWindow.on("closed", () => {
    stagedFileManager.cleanupOwner(ownerWebContentsId).catch(error => {
      console.error("[Временные исходники] Не удалось очистить файлы закрытого окна:", error);
    });
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
