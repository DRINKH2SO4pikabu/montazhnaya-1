"use strict";

const path = require("node:path");
const { buildH264EncoderArgs, ALL_H264_ENCODERS } = require("./h264-encoder.cjs");

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WAV_RIFF = Buffer.from("RIFF", "ascii");
const WAV_WAVE = Buffer.from("WAVE", "ascii");
const MAX_FRAME_BYTES = 64 * 1024 * 1024;
// 3840×2160 RGBA is 31.64 MiB and stays below the conservative 32 MiB IPC payload ceiling.
const MAX_RAW_RGBA_FRAME_BYTES = 32 * 1024 * 1024;
const MAX_SEQUENCE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_AUDIO_WAV_BYTES = 512 * 1024 * 1024;
const MAX_FRAME_COUNT = 100000;
const MAX_SOURCE_MEDIA_BYTES = 128 * 1024 * 1024;
const MAX_SOURCE_FRAME_INDICES = 100000;

function sanitizeSuggestedName(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 120) {
    throw new Error("Имя выходного файла имеет некорректный формат.");
  }
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/[. ]+$/g, "").slice(0, 120) || "montazhnaya";
}

function validateFrameSequenceSettings(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("Получены некорректные параметры последовательности кадров.");
  }
  const suggestedName = sanitizeSuggestedName(request.suggestedName);
  const fps = request.expectedFps;
  const frameCount = request.expectedFrameCount;
  const duration = request.expectedDuration;
  const width = request.expectedWidth;
  const height = request.expectedHeight;
  const expectedAudioBytes = request.expectedAudioBytes == null ? 0 : request.expectedAudioBytes;
  const videoBitrate = request.expectedVideoBitrate == null ? 5_000_000 : request.expectedVideoBitrate;
  if (!Number.isSafeInteger(videoBitrate) || videoBitrate < 250_000 || videoBitrate > 100_000_000) {
    throw new Error("Целевой средний битрейт видео должен быть от 0,25 до 100 Мбит/с.");
  }
  const expectedSourceVideoCount = request.expectedSourceVideoCount == null ? 0 : request.expectedSourceVideoCount;
  if (!Number.isInteger(width) || width < 64 || width > 16384 ||
      !Number.isInteger(height) || height < 64 || height > 16384) {
    throw new Error("Размеры кадра для оценки дискового пространства должны быть от 64 до 16384 пикселей.");
  }
  if (!Number.isSafeInteger(expectedAudioBytes) || expectedAudioBytes < 0 || expectedAudioBytes > MAX_AUDIO_WAV_BYTES ||
      (request.audioExpected && expectedAudioBytes < 44) || (!request.audioExpected && expectedAudioBytes !== 0)) {
    throw new Error("Размер WAV для оценки дискового пространства некорректен.");
  }
  if (!Number.isInteger(fps) || fps < 1 || fps > 120) {
    throw new Error("Частота кадров должна быть целым числом от 1 до 120.");
  }
  if (!Number.isInteger(frameCount) || frameCount < 1 || frameCount > MAX_FRAME_COUNT) {
    throw new Error(`Количество кадров должно быть от 1 до ${MAX_FRAME_COUNT}.`);
  }
  if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 60 * 60 ||
      Math.abs(duration - frameCount / fps) > Math.max(0.001, 0.25 / fps)) {
    throw new Error("Длительность не соответствует количеству кадров и FPS.");
  }
  if (typeof request.audioExpected !== "boolean") {
    throw new Error("Не удалось определить, ожидается ли звуковая дорожка.");
  }
  if (!Number.isInteger(expectedSourceVideoCount) || expectedSourceVideoCount < 0 || expectedSourceVideoCount > 10000) {
    throw new Error("Количество видеоисточников для оценки оконного кэша должно быть от 0 до 10000.");
  }
  const streamFrames = request.streamFrames === true;
  const outputFormat = request.outputFormat == null ? "mp4" : request.outputFormat;
  const frameTransport = request.frameTransport == null ? "png" : request.frameTransport;
  const videoCodec = request.videoCodec == null ? (outputFormat === "webm" ? "vp8" : "h264") : request.videoCodec;
  const audioCodec = request.audioCodec == null ? (outputFormat === "webm" ? "opus" : "aac") : request.audioCodec;
  if (!new Set(["mp4", "webm"]).has(outputFormat)) {
    throw new Error("Формат потокового экспорта должен быть MP4 или WebM.");
  }
  if (!new Set(["png", "rgba"]).has(frameTransport)) {
    throw new Error("Неизвестный формат передачи кадров.");
  }
  if (frameTransport === "rgba" && (!streamFrames || outputFormat !== "mp4" || width * height * 4 > MAX_RAW_RGBA_FRAME_BYTES)) {
    throw new Error("Передача RGBA доступна только для потокового MP4 и кадров размером не более 32 МиБ.");
  }
  const validCodecPair = outputFormat === "mp4"
    ? videoCodec === "h264" && audioCodec === "aac"
    : (videoCodec === "vp8" || videoCodec === "vp9") && audioCodec === "opus";
  if (!validCodecPair) throw new Error("Выбранная комбинация контейнера и кодеков не поддерживается потоковым экспортом.");
  return { suggestedName, fps, frameCount, duration, audioExpected: request.audioExpected,
    width, height, expectedAudioBytes, videoBitrate, expectedSourceVideoCount, streamFrames, outputFormat, videoCodec, audioCodec, frameTransport };
}

function toPngBuffer(payload) {
  let data;
  if (payload instanceof ArrayBuffer) data = Buffer.from(payload);
  else if (ArrayBuffer.isView(payload)) data = Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
  else throw new Error("Кадр должен передаваться как бинарные PNG-данные.");
  if (data.length < PNG_SIGNATURE.length || data.length > MAX_FRAME_BYTES) {
    throw new Error(`Размер PNG-кадра должен быть от 8 байт до ${MAX_FRAME_BYTES} байт.`);
  }
  if (!data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error("Переданный кадр не имеет сигнатуру PNG.");
  }
  return Buffer.from(data);
}

function toRgbaBuffer(payload, width, height) {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
    throw new Error("Некорректные размеры RGBA-кадра.");
  }
  const expectedBytes = width * height * 4;
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 4 || expectedBytes > MAX_RAW_RGBA_FRAME_BYTES) {
    throw new Error("Размер RGBA-кадра превышает безопасный лимит 32 МиБ.");
  }
  let data;
  if (payload instanceof ArrayBuffer) data = Buffer.from(payload);
  else if (ArrayBuffer.isView(payload)) data = Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
  else throw new Error("Кадр должен передаваться как бинарные RGBA-данные.");
  if (data.length !== expectedBytes) {
    throw new Error(`Размер RGBA-кадра не совпадает с ожидаемым: ${data.length} вместо ${expectedBytes} байт.`);
  }
  // Buffer.from(view) creates a bounded view for typed-array inputs and avoids
  // an extra full-frame copy before the managed stdin stream applies backpressure.
  return data;
}

function toWavBuffer(payload) {
  if (payload == null) return null;
  let data;
  if (payload instanceof ArrayBuffer) data = Buffer.from(payload);
  else if (ArrayBuffer.isView(payload)) data = Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
  else throw new Error("Подготовленный звук должен передаваться как бинарные WAV-данные.");
  if (data.length < 12 || data.length > MAX_AUDIO_WAV_BYTES ||
      !data.subarray(0, 4).equals(WAV_RIFF) || !data.subarray(8, 12).equals(WAV_WAVE)) {
    throw new Error("Подготовленная звуковая дорожка не имеет корректный формат WAV или превышает лимит размера.");
  }
  return Buffer.from(data);
}

function frameFileName(index) {
  if (!Number.isInteger(index) || index < 0 || index >= MAX_FRAME_COUNT) {
    throw new Error("Индекс кадра находится вне допустимого диапазона.");
  }
  return `frame_${String(index).padStart(6, "0")}.png`;
}


function validateSourceFrameIndices(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_SOURCE_FRAME_INDICES) {
    throw new Error(`Для точного декодирования требуется от 1 до ${MAX_SOURCE_FRAME_INDICES} индексов кадров.`);
  }
  const indices = [];
  let previous = -1;
  for (const index of value) {
    if (!Number.isInteger(index) || index < 0 || index >= MAX_FRAME_COUNT || index <= previous) {
      throw new Error("Индексы исходных кадров должны быть уникальными, возрастающими и находиться в допустимом диапазоне.");
    }
    indices.push(index);
    previous = index;
  }
  return indices;
}

function mergeFrameIndicesToRanges(indices) {
  const values = validateSourceFrameIndices(indices);
  const ranges = [];
  let start = values[0];
  let end = values[0];
  for (let i = 1; i < values.length; i++) {
    const value = values[i];
    if (value === end + 1) {
      end = value;
    } else {
      ranges.push([start, end]);
      start = end = value;
    }
  }
  ranges.push([start, end]);
  return ranges;
}

function splitSourceFrameIndicesForFfmpeg(frameIndices, maxFilterLength = 14000) {
  const indices = validateSourceFrameIndices(frameIndices);
  const safeMax = Number.isInteger(maxFilterLength) ? Math.max(1024, maxFilterLength) : 14000;
  const ranges = mergeFrameIndicesToRanges(indices);
  const batches = [];
  let currentRanges = [];
  let currentLength = 0;
  const termLength = ([start, end]) => start === end
    ? `eq(n\\,${start})`.length
    : `between(n\\,${start}\\,${end})`.length;
  const expandRanges = (rangeList) => {
    const result = [];
    for (const [start, end] of rangeList) {
      for (let value = start; value <= end; value++) result.push(value);
    }
    return result;
  };
  for (const range of ranges) {
    const length = termLength(range) + (currentRanges.length ? 1 : 0);
    if (currentRanges.length && currentLength + length > safeMax) {
      batches.push(expandRanges(currentRanges));
      currentRanges = [];
      currentLength = 0;
    }
    currentRanges.push(range);
    currentLength += termLength(range) + (currentRanges.length > 1 ? 1 : 0);
  }
  if (currentRanges.length) batches.push(expandRanges(currentRanges));
  return batches;
}

function buildSourceFrameExtractionFfmpegArgs({ inputPath, outputPattern, fps, frameIndices, seekStartIndex = 0,
  sourceStartTime = 0, hardwareDecode = false, downloadPixelFormat = "nv12", renderWidth = null, renderHeight = null }) {
  if (typeof inputPath !== "string" || !inputPath || typeof outputPattern !== "string" || !outputPattern ||
      !Number.isInteger(fps) || fps < 1 || fps > 120) {
    throw new Error("Некорректные параметры FFmpeg для подготовки исходных кадров.");
  }
  const indices = validateSourceFrameIndices(frameIndices);
  if (!Number.isInteger(seekStartIndex) || seekStartIndex < 0 || seekStartIndex > indices[0] ||
      !Number.isFinite(sourceStartTime)) {
    throw new Error("Некорректная начальная точка оконного декодирования исходных кадров.");
  }
  const hasRenderWidth = renderWidth != null;
  const hasRenderHeight = renderHeight != null;
  if (hasRenderWidth !== hasRenderHeight ||
      (hasRenderWidth && (!Number.isInteger(renderWidth) || renderWidth < 2 || renderWidth > 16384 ||
       !Number.isInteger(renderHeight) || renderHeight < 2 || renderHeight > 16384))) {
    throw new Error("Некорректные размеры рабочих кадров исходного видео.");
  }

  // Seek to the start of the current CFR window. FFmpeg performs accurate
  // seeking when transcoding: it seeks to a preceding keyframe, decodes and
  // discards the pre-roll, then starts the filter graph at the requested time.
  // The selected frame numbers are relative to this window, not to the entire
  // source. When the requested timestamp is <= 0, keep a full decode from zero.
  const seekOffsetSeconds = seekStartIndex / fps;
  const requestedSeekTime = sourceStartTime + seekOffsetSeconds;
  const effectiveSeekStartIndex = seekStartIndex;
  const shouldSeek = effectiveSeekStartIndex > 0;
  const relativeIndices = indices.map(index => index - effectiveSeekStartIndex);
  const ranges = mergeFrameIndicesToRanges(relativeIndices);
  // Reset the timestamp origin after accurate input seeking, then rebuild the
  // same CFR clock used by the full-source decode path.
  const selection = ranges.map(([start, end]) => start === end
    ? `eq(n\,${start})`
    : `between(n\,${start}\,${end})`).join("+");
  const timestampReset = shouldSeek
    ? `setpts=PTS-${requestedSeekTime.toFixed(9)}/TB`
    : "setpts=PTS-STARTPTS";
  const baseFilter = `${timestampReset},fps=fps=${fps}:start_time=0:round=near,select='${selection}'`;
  if (typeof hardwareDecode !== "boolean") throw new Error("Некорректный режим аппаратного декодирования исходного видео.");
  if (!new Set(["nv12", "p010le"]).has(downloadPixelFormat)) {
    throw new Error("Недопустимый формат передачи кадров из NVDEC в системную память.");
  }
  // Only selected output-clock frames are downscaled. NVDEC is retained when
  // enabled; frames are downloaded once and resized before PNG encoding/IPC.
  // The renderer then composites a bounded working image onto the final
  // output-resolution Canvas. The original media file is never modified.
  const resizeFilter = hasRenderWidth ? `,scale=${renderWidth}:${renderHeight}:flags=lanczos` : "";
  const filter = hardwareDecode
    ? `hwdownload,format=${downloadPixelFormat},${baseFilter}${resizeFilter}`
    : `${baseFilter}${resizeFilter}`;
  const args = ["-hide_banner", "-loglevel", "error", "-xerror", "-y"];
  if (shouldSeek) args.push("-copyts", "-ss", seekOffsetSeconds.toFixed(9));
  if (hardwareDecode) args.push("-hwaccel", "cuda", "-hwaccel_output_format", "cuda");
  args.push(
    "-i", inputPath,
    "-map", "0:v:0",
    "-vf", filter,
    "-fps_mode", "passthrough",
    "-frames:v", String(indices.length),
    "-start_number", "0",
    "-f", "image2",
    outputPattern
  );
  return args;
}

function buildPngPipeFfmpegArgs({ outputPath, fps, frameCount, duration, audioPath, audioExpected,
  outputFormat = "mp4", videoCodec, audioCodec, videoBitrate = 5_000_000 }) {
  if (!Number.isInteger(fps) || fps < 1 || fps > 120 ||
      !Number.isInteger(frameCount) || frameCount < 1 || frameCount > MAX_FRAME_COUNT ||
      !Number.isFinite(duration) || duration <= 0 || typeof outputPath !== "string" || !outputPath) {
    throw new Error("Некорректные параметры FFmpeg для потоковой последовательности PNG.");
  }
  if (!Number.isSafeInteger(videoBitrate) || videoBitrate < 250_000 || videoBitrate > 100_000_000) {
    throw new Error("Целевой средний битрейт видео должен быть от 0,25 до 100 Мбит/с.");
  }
  if (audioExpected && (typeof audioPath !== "string" || !audioPath)) {
    throw new Error("Для ожидаемой звуковой дорожки не задан WAV-файл.");
  }
  if (!new Set(["mp4", "webm"]).has(outputFormat)) throw new Error("Неподдерживаемый контейнер потокового экспорта.");
  const selectedVideoCodec = videoCodec || (outputFormat === "webm" ? "vp8" : "h264");
  const selectedAudioCodec = audioCodec || (outputFormat === "webm" ? "opus" : "aac");
  const validCodecPair = outputFormat === "mp4"
    ? selectedVideoCodec === "h264" && selectedAudioCodec === "aac"
    : (selectedVideoCodec === "vp8" || selectedVideoCodec === "vp9") && selectedAudioCodec === "opus";
  if (!validCodecPair) throw new Error("Недопустимая комбинация кодеков для выбранного контейнера.");

  // Keep enough compressed PNG packets queued to overlap input decoding and
  // video encoding without allowing an unbounded memory queue at 4K.
  const args = [
    "-hide_banner", "-loglevel", "error", "-xerror", "-y",
    "-thread_queue_size", "8",
    "-f", "image2pipe", "-vcodec", "png", "-framerate", String(fps), "-i", "pipe:0"
  ];
  if (audioExpected) args.push("-i", audioPath);
  args.push("-map", "0:v:0");
  if (audioExpected) args.push("-map", "1:a:0");
  else args.push("-an");

  // Renderer Canvas is RGB/sRGB, full range. Convert the sRGB transfer curve,
  // RGB matrix and full range to conventional BT.709 limited-range YUV rather
  // than only changing matrix/range tags. This makes pixel values and metadata agree.
  args.push("-vf", "colorspace=ispace=gbr:irange=pc:iprimaries=bt709:itrc=iec61966-2-1:space=bt709:range=tv:primaries=bt709:trc=bt709:format=yuv420p");

  const maxRate = Math.round(videoBitrate * 1.25);
  const bufferSize = videoBitrate * 2;
  if (outputFormat === "mp4") {
    args.push(
      "-c:v", "libx264", "-preset", "veryfast", "-threads", "0",
      "-b:v", String(videoBitrate), "-maxrate", String(maxRate), "-bufsize", String(bufferSize),
      "-pix_fmt", "yuv420p", "-r", String(fps), "-fps_mode", "cfr", "-frames:v", String(frameCount),
      "-t", duration.toFixed(6)
    );
    if (audioExpected) args.push("-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-shortest");
    args.push("-color_range", "tv", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", outputPath);
    return args;
  }

  const encoder = selectedVideoCodec === "vp9" ? "libvpx-vp9" : "libvpx";
  const quality = selectedVideoCodec === "vp9" ? "33" : "30";
  args.push(
    "-c:v", encoder, "-deadline", "good", "-cpu-used", "4", "-threads", "0",
    "-b:v", String(videoBitrate), "-maxrate", String(maxRate), "-bufsize", String(bufferSize),
    "-crf", quality, "-pix_fmt", "yuv420p", "-r", String(fps), "-fps_mode", "cfr",
    "-frames:v", String(frameCount), "-t", duration.toFixed(6)
  );
  if (selectedVideoCodec === "vp9") args.push("-row-mt", "1");
  if (audioExpected) args.push("-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-compression_level", "6", "-ar", "48000", "-ac", "2", "-shortest");
  args.push("-color_range", "tv", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-f", "webm", outputPath);
  return args;
}

function buildRawRgbaPipeFfmpegArgs({ outputPath, width, height, fps, frameCount, duration, audioPath, audioExpected,
  videoBitrate = 5_000_000, videoEncoder = "libx264" }) {
  if (!Number.isInteger(width) || width < 64 || width > 16384 ||
      !Number.isInteger(height) || height < 64 || height > 16384 ||
      width * height * 4 > MAX_RAW_RGBA_FRAME_BYTES ||
      !Number.isInteger(fps) || fps < 1 || fps > 120 ||
      !Number.isInteger(frameCount) || frameCount < 1 || frameCount > MAX_FRAME_COUNT ||
      !Number.isFinite(duration) || duration <= 0 || typeof outputPath !== "string" || !outputPath) {
    throw new Error("Некорректные параметры FFmpeg для потоковых RGBA-кадров.");
  }
  if (!Number.isSafeInteger(videoBitrate) || videoBitrate < 250_000 || videoBitrate > 100_000_000) {
    throw new Error("Целевой средний битрейт видео должен быть от 0,25 до 100 Мбит/с.");
  }
  if (audioExpected && (typeof audioPath !== "string" || !audioPath)) {
    throw new Error("Для ожидаемой звуковой дорожки не задан WAV-файл.");
  }
  if (!ALL_H264_ENCODERS.includes(videoEncoder)) {
    throw new Error("Выбран неподдерживаемый H.264-кодировщик.");
  }

  const args = [
    "-hide_banner", "-loglevel", "error", "-xerror", "-y",
    "-thread_queue_size", "2",
    "-f", "rawvideo", "-pixel_format", "rgba", "-video_size", `${width}x${height}`,
    "-framerate", String(fps), "-i", "pipe:0"
  ];
  if (audioExpected) args.push("-i", audioPath);
  args.push("-map", "0:v:0");
  if (audioExpected) args.push("-map", "1:a:0");
  else args.push("-an");

  // Raw Canvas pixels are RGBA/sRGB full-range. Convert pixel values as well as
  // tags to BT.709 limited-range YUV; do not merely relabel RGB bytes.
  args.push("-vf", "colorspace=ispace=gbr:irange=pc:iprimaries=bt709:itrc=iec61966-2-1:space=bt709:range=tv:primaries=bt709:trc=bt709:format=yuv420p");
  args.push(...buildH264EncoderArgs(videoEncoder, videoBitrate));
  args.push(
    "-pix_fmt", "yuv420p", "-r", String(fps), "-fps_mode", "cfr",
    "-frames:v", String(frameCount), "-t", duration.toFixed(6)
  );
  if (audioExpected) args.push("-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-shortest");
  args.push("-color_range", "tv", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", outputPath);
  return args;
}

function buildPngSequenceFfmpegArgs({ tempDir, outputPath, fps, frameCount, duration, audioPath, audioExpected }) {
  if (!Number.isInteger(fps) || fps < 1 || fps > 120 ||
      !Number.isInteger(frameCount) || frameCount < 1 || frameCount > MAX_FRAME_COUNT ||
      !Number.isFinite(duration) || duration <= 0 ||
      typeof tempDir !== "string" || typeof outputPath !== "string") {
    throw new Error("Некорректные параметры FFmpeg для последовательности PNG.");
  }
  if (audioExpected && typeof audioPath !== "string") {
    throw new Error("Для ожидаемой звуковой дорожки не задан WAV-файл.");
  }

  const patternPath = path.join(tempDir, "frame_%06d.png");
  const args = [
    "-hide_banner", "-loglevel", "error", "-xerror", "-y",
    "-framerate", String(fps), "-start_number", "0", "-i", patternPath
  ];
  if (audioExpected) args.push("-i", audioPath);
  args.push("-map", "0:v:0");
  if (audioExpected) args.push("-map", "1:a:0");
  else args.push("-an");
  args.push(
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-r", String(fps), "-fps_mode", "cfr", "-frames:v", String(frameCount),
    "-t", duration.toFixed(6), "-movflags", "+faststart", outputPath
  );
  return args;
}

module.exports = {
  MAX_FRAME_BYTES,
  MAX_RAW_RGBA_FRAME_BYTES,
  MAX_SEQUENCE_BYTES,
  MAX_AUDIO_WAV_BYTES,
  MAX_FRAME_COUNT,
  MAX_SOURCE_MEDIA_BYTES,
  MAX_SOURCE_FRAME_INDICES,
  PNG_SIGNATURE,
  sanitizeSuggestedName,
  validateFrameSequenceSettings,
  toPngBuffer,
  toRgbaBuffer,
  toWavBuffer,
  frameFileName,
  validateSourceFrameIndices,
  mergeFrameIndicesToRanges,
  splitSourceFrameIndicesForFfmpeg,
  buildSourceFrameExtractionFfmpegArgs,
  buildPngSequenceFfmpegArgs,
  buildPngPipeFfmpegArgs,
  buildRawRgbaPipeFfmpegArgs
};
