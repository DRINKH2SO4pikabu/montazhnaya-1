"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const zlib = require("node:zlib");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const execFileAsync = promisify(execFile);

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let value = n;
    for (let k = 0; k < 8; k++) value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createDiagnosticPng(width = 64, height = 64) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const offset = 1 + x * 4;
      row[offset] = 16;
      row[offset + 1] = 16;
      row[offset + 2] = 16;
      row[offset + 3] = 255;
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function createDiagnosticWav(durationSeconds = 1, sampleRate = 48000, channels = 2) {
  const bitsPerSample = 16;
  const dataBytes = Math.floor(durationSeconds * sampleRate) * channels * (bitsPerSample / 8);
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write("RIFF", 0, 4, "ascii");
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write("WAVE", 8, 4, "ascii");
  wav.write("fmt ", 12, 4, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  wav.writeUInt16LE(channels * bitsPerSample / 8, 32);
  wav.writeUInt16LE(bitsPerSample, 34);
  wav.write("data", 36, 4, "ascii");
  wav.writeUInt32LE(dataBytes, 40);
  return wav;
}

function getEnvValue(env, key) {
  const wanted = key.toLowerCase();
  const found = Object.keys(env || {}).find((item) => item.toLowerCase() === wanted);
  return found ? env[found] : undefined;
}

function executableCandidates(command, platform) {
  if (path.isAbsolute(command) || command.includes("/") || command.includes("\\") || path.extname(command)) {
    return [command];
  }
  return platform === "win32" ? [`${command}.exe`, `${command}.com`] : [command];
}

async function isExecutableFile(filePath, platform) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return false;
    if (platform !== "win32") await fs.access(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveExecutable(command, options = {}) {
  const platform = options.platform || process.platform;
  const env = options.env || process.env;
  const pathValue = getEnvValue(env, "PATH") || "";
  const overrideKey = command === "ffmpeg" ? "FFMPEG_PATH" : command === "ffprobe" ? "FFPROBE_PATH" : "";
  const override = overrideKey ? getEnvValue(env, overrideKey) : "";
  const candidates = [];
  if (override && String(override).trim()) candidates.push(...executableCandidates(String(override).trim().replace(/^"|"$/g, ""), platform));

  const pathSeparator = platform === "win32" ? ";" : ":";
  const directories = String(pathValue).split(pathSeparator).map((part) => part.trim().replace(/^"|"$/g, "")).filter(Boolean);
  for (const directory of directories) {
    for (const name of executableCandidates(command, platform)) candidates.push(path.join(directory, name));
  }

  const seen = new Set();
  for (const candidate of candidates) {
    const normalized = path.resolve(candidate);
    const key = platform === "win32" ? normalized.toLowerCase() : normalized;
    if (seen.has(key)) continue;
    seen.add(key);
    if (await isExecutableFile(normalized, platform)) return normalized;
  }
  return null;
}

async function runCommand(file, args, options = {}) {
  const timeout = Number.isFinite(options.timeout) ? options.timeout : DEFAULT_TIMEOUT_MS;
  const result = await execFileAsync(file, args, {
    shell: false,
    windowsHide: true,
    timeout,
    maxBuffer: Number.isFinite(options.maxBuffer) ? options.maxBuffer : MAX_OUTPUT_BYTES,
    encoding: "utf8"
  });
  return { stdout: String(result.stdout || ""), stderr: String(result.stderr || "") };
}

function firstUsefulLine(text) {
  return String(text || "").split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
}

function parseVersion(output, toolName) {
  const line = firstUsefulLine(output);
  const match = line.match(new RegExp(`${toolName} version\\s+([^\\s]+)`, "i"));
  return { line, version: match ? match[1] : (line || null) };
}

function parseEncoderSupport(output) {
  const names = new Set();
  for (const line of String(output || "").split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length >= 2 && /^[VAS\.][A-Z\.]{5}$/.test(fields[0])) names.add(fields[1]);
  }
  return names;
}

function parseDecoderSupport(output) {
  const names = new Set();
  for (const line of String(output || "").split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length >= 2 && /^[VAS\.][A-Z\.]{5}$/.test(fields[0])) names.add(fields[1]);
  }
  return names;
}

function parseMuxerSupport(output) {
  const names = new Set();
  for (const line of String(output || "").split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length >= 2 && /^[DE]{1,2}$/.test(fields[0])) names.add(fields[1]);
  }
  return names;
}

function parseHardwareAccelerationSupport(output) {
  const methods = new Set();
  for (const line of String(output || "").split(/\r?\n/)) {
    const value = line.trim().toLowerCase();
    if (/^[a-z0-9_]+$/.test(value) && value !== "hardware acceleration methods:") methods.add(value);
  }
  return methods;
}

function errorMessage(error) {
  if (!error) return "Неизвестная ошибка.";
  if (error.code === "ENOENT") return "Не удалось запустить программу: исполняемый файл не найден.";
  if (error.code === "ETIMEDOUT") return "Проверка превысила отведённое время.";
  if (error.code === "EACCES") return "Недостаточно прав для запуска программы.";
  const detail = String(error.stderr || error.message || "").trim();
  return detail.slice(-1200) || `Процесс завершился с кодом ${error.code ?? "неизвестно"}.`;
}

async function inspectTool(name, options) {
  const executablePath = await resolveExecutable(name, options);
  if (!executablePath) {
    return { status: "missing", path: null, version: null, versionLine: null, message: `${name} не найден. Проверьте переменную PATH или задайте ${name.toUpperCase()}_PATH.` };
  }
  try {
    const result = await options.runCommand(executablePath, ["-version"], { timeout: 10000, maxBuffer: 1024 * 1024 });
    const parsed = parseVersion(result.stdout || result.stderr, name);
    if (!parsed.line) throw new Error("Программа запустилась, но не вернула сведения о версии.");
    return { status: "ok", path: executablePath, version: parsed.version, versionLine: parsed.line, message: "Программа доступна." };
  } catch (error) {
    return { status: "error", path: executablePath, version: null, versionLine: null, message: errorMessage(error) };
  }
}

async function runSmokeEncode(ffmpegPath, ffprobePath, options = {}) {
  const tempRoot = options.tempRoot || os.tmpdir();
  const includeAudio = options.includeAudio !== false;
  const workDir = await fs.mkdtemp(path.join(tempRoot, "montazhnaya-tool-check-"));
  const outputPath = path.join(workDir, includeAudio ? "diagnostic-test-av.mp4" : "diagnostic-test-video.mp4");
  try {
    const png = createDiagnosticPng();
    await Promise.all([
      fs.writeFile(path.join(workDir, "frame_0000.png"), png),
      fs.writeFile(path.join(workDir, "frame_0001.png"), png)
    ]);
    const args = [
      "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
      "-framerate", "2", "-start_number", "0", "-i", path.join(workDir, "frame_%04d.png")
    ];
    if (includeAudio) {
      const wavPath = path.join(workDir, "diagnostic-silence.wav");
      await fs.writeFile(wavPath, createDiagnosticWav(1, 48000, 2));
      args.push("-i", wavPath);
    }
    args.push("-map", "0:v:0");
    if (includeAudio) args.push("-map", "1:a:0");
    args.push("-frames:v", "2", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p");
    if (includeAudio) args.push("-c:a", "aac", "-b:a", "64k", "-shortest");
    else args.push("-an");
    args.push(outputPath);
    await options.runCommand(ffmpegPath, args, { timeout: 20000, maxBuffer: 2 * 1024 * 1024 });

    const stat = await fs.stat(outputPath);
    if (!stat.isFile() || stat.size < 128) throw new Error("Пробное MP4 создано, но файл пустой или слишком мал.");
    if (!ffprobePath) return { status: "encoded", fileBytes: stat.size, streams: [], message: "FFmpeg создал тестовый MP4; ffprobe отсутствует, поэтому структура не подтверждена." };

    const probed = await options.runCommand(ffprobePath, [
      "-v", "error", "-show_entries", "stream=codec_type,codec_name", "-of", "json", outputPath
    ], { timeout: 10000, maxBuffer: 1024 * 1024 });
    const data = JSON.parse(probed.stdout || "{}");
    const streams = Array.isArray(data.streams) ? data.streams : [];
    const videoOk = streams.some((stream) => stream.codec_type === "video" && stream.codec_name === "h264");
    const audioOk = streams.some((stream) => stream.codec_type === "audio" && stream.codec_name === "aac");
    if (!videoOk || (includeAudio && !audioOk) || (!includeAudio && audioOk)) {
      throw new Error(`Проверка MP4 не подтвердила ожидаемые потоки: H.264 ${videoOk ? "есть" : "нет"}, AAC ${audioOk ? "есть" : "нет"}.`);
    }
    return { status: "passed", fileBytes: stat.size, streams: streams.map((stream) => ({ type: stream.codec_type, codec: stream.codec_name })), message: includeAudio ? "Пробный MP4 на основе PNG + WAV с H.264 и AAC успешно создан и проверен через ffprobe." : "Пробный MP4 на основе PNG без аудио успешно создан и проверен через ffprobe." };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function runSmokeWebmEncode(ffmpegPath, ffprobePath, options = {}) {
  const tempRoot = options.tempRoot || os.tmpdir();
  const videoCodec = options.videoCodec === "vp9" ? "vp9" : "vp8";
  const encoder = videoCodec === "vp9" ? "libvpx-vp9" : "libvpx";
  const crf = videoCodec === "vp9" ? "33" : "30";
  const workDir = await fs.mkdtemp(path.join(tempRoot, "montazhnaya-webm-check-"));
  const outputPath = path.join(workDir, `diagnostic-${videoCodec}.webm`);
  try {
    const png = createDiagnosticPng();
    const wavPath = path.join(workDir, "diagnostic-silence.wav");
    await Promise.all([
      fs.writeFile(path.join(workDir, "frame_0000.png"), png),
      fs.writeFile(path.join(workDir, "frame_0001.png"), png),
      fs.writeFile(wavPath, createDiagnosticWav(1, 48000, 2))
    ]);
    const args = [
      "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
      "-framerate", "2", "-start_number", "0", "-i", path.join(workDir, "frame_%04d.png"),
      "-i", wavPath, "-map", "0:v:0", "-map", "1:a:0", "-frames:v", "2",
      "-c:v", encoder, "-deadline", "good", "-cpu-used", "4", "-threads", "2",
      "-b:v", "0", "-crf", crf, "-pix_fmt", "yuv420p", "-r", "2", "-fps_mode", "cfr"
    ];
    if (videoCodec === "vp9") args.push("-row-mt", "1");
    args.push("-c:a", "libopus", "-b:a", "64k", "-ar", "48000", "-ac", "2", "-t", "1", "-f", "webm", outputPath);
    await options.runCommand(ffmpegPath, args, { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
    const stat = await fs.stat(outputPath);
    if (!stat.isFile() || stat.size < 128) throw new Error("Пробный WebM создан, но файл пустой или слишком мал.");
    const probed = await options.runCommand(ffprobePath, [
      "-v", "error", "-count_frames", "-show_entries",
      "format=format_name:stream=codec_type,codec_name,nb_read_frames,avg_frame_rate",
      "-of", "json", outputPath
    ], { timeout: 15000, maxBuffer: 1024 * 1024 });
    const data = JSON.parse(probed.stdout || "{}");
    const streams = Array.isArray(data.streams) ? data.streams : [];
    const videoOk = streams.some(stream => stream.codec_type === "video" && stream.codec_name === videoCodec && Number(stream.nb_read_frames) === 2 && stream.avg_frame_rate === "2/1");
    const audioOk = streams.some(stream => stream.codec_type === "audio" && stream.codec_name === "opus");
    const webmOk = String(data.format && data.format.format_name || "").split(",").includes("webm");
    if (!videoOk || !audioOk || !webmOk) {
      throw new Error(`Проверка WebM не подтвердила ожидаемые потоки: ${videoCodec.toUpperCase()} ${videoOk ? "есть" : "нет"}, Opus ${audioOk ? "есть" : "нет"}, контейнер ${webmOk ? "есть" : "нет"}.`);
    }
    return { status: "passed", fileBytes: stat.size, streams: streams.map(stream => ({ type: stream.codec_type, codec: stream.codec_name })), message: `Пробный WebM ${videoCodec.toUpperCase()} + Opus успешно создан и проверен через ffprobe.` };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function collectToolDiagnostics(options = {}) {
  const baseOptions = {
    platform: options.platform || process.platform,
    env: options.env || process.env,
    runCommand: options.runCommand || runCommand,
    tempRoot: options.tempRoot || os.tmpdir()
  };
  const [ffmpeg, ffprobe] = await Promise.all([
    inspectTool("ffmpeg", baseOptions),
    inspectTool("ffprobe", baseOptions)
  ]);

  const capabilities = {
    h264Encoder: { available: false, required: true, label: "Кодировщик H.264 (libx264)" },
    aacEncoder: { available: false, requiredForAudio: true, label: "Кодировщик AAC (для проектов со звуком)" },
    mp4Muxer: { available: false, required: true, label: "Контейнер MP4" },
    pngDecoder: { available: false, required: true, label: "Декодер PNG для последовательности кадров" },
    vp8Encoder: { available: false, requiredForWebm: false, label: "Кодировщик VP8 (libvpx)" },
    vp9Encoder: { available: false, requiredForWebm: false, label: "Кодировщик VP9 (libvpx-vp9)" },
    opusEncoder: { available: false, requiredForWebm: false, label: "Кодировщик Opus (libopus)" },
    webmMuxer: { available: false, requiredForWebm: false, label: "Контейнер WebM" },
    cudaHwaccel: { available: false, requiredForHardwareDecode: false, label: "CUDA/NVDEC для аппаратного декодирования исходного видео" }
  };
  const smokeTest = {
    videoOnly: { status: "skipped", message: "Проверка не выполнялась." },
    withAudio: { status: "skipped", message: "Проверка не выполнялась." },
    webmVp8: { status: "skipped", message: "Проверка WebM VP8 не выполнялась." },
    webmVp9: { status: "skipped", message: "Проверка WebM VP9 не выполнялась." }
  };
  let capabilityError = null;

  if (ffmpeg.status === "ok") {
    try {
      const [encoderResult, decoderResult, muxerResult, hwaccelResult] = await Promise.all([
        baseOptions.runCommand(ffmpeg.path, ["-hide_banner", "-encoders"], { timeout: 15000 }),
        baseOptions.runCommand(ffmpeg.path, ["-hide_banner", "-decoders"], { timeout: 15000 }),
        baseOptions.runCommand(ffmpeg.path, ["-hide_banner", "-muxers"], { timeout: 15000 }),
        baseOptions.runCommand(ffmpeg.path, ["-hide_banner", "-hwaccels"], { timeout: 15000 })
      ]);
      const encoders = parseEncoderSupport(encoderResult.stdout + "\n" + encoderResult.stderr);
      const decoders = parseDecoderSupport(decoderResult.stdout + "\n" + decoderResult.stderr);
      const muxers = parseMuxerSupport(muxerResult.stdout + "\n" + muxerResult.stderr);
      const hwaccels = parseHardwareAccelerationSupport(hwaccelResult.stdout + "\n" + hwaccelResult.stderr);
      capabilities.cudaHwaccel.available = hwaccels.has("cuda");
      capabilities.h264Encoder.available = encoders.has("libx264");
      capabilities.aacEncoder.available = encoders.has("aac");
      capabilities.mp4Muxer.available = muxers.has("mp4");
      capabilities.pngDecoder.available = decoders.has("png");
      capabilities.vp8Encoder.available = encoders.has("libvpx");
      capabilities.vp9Encoder.available = encoders.has("libvpx-vp9");
      capabilities.opusEncoder.available = encoders.has("libopus");
      capabilities.webmMuxer.available = muxers.has("webm");
    } catch (error) {
      capabilityError = errorMessage(error);
    }

    const videoPrerequisitesAvailable = capabilities.h264Encoder.available &&
      capabilities.mp4Muxer.available && capabilities.pngDecoder.available;
    if (videoPrerequisitesAvailable && ffprobe.status === "ok") {
      try {
        smokeTest.videoOnly = await runSmokeEncode(ffmpeg.path, ffprobe.path, { ...baseOptions, includeAudio: false });
      } catch (error) {
        smokeTest.videoOnly = { status: "failed", message: errorMessage(error) };
      }
    }
    if (smokeTest.videoOnly.status === "passed" && capabilities.aacEncoder.available && ffprobe.status === "ok") {
      try {
        smokeTest.withAudio = await runSmokeEncode(ffmpeg.path, ffprobe.path, { ...baseOptions, includeAudio: true });
      } catch (error) {
        smokeTest.withAudio = { status: "failed", message: errorMessage(error) };
      }
    } else if (smokeTest.videoOnly.status === "passed" && !capabilities.aacEncoder.available) {
      smokeTest.withAudio = { status: "skipped", message: "AAC-кодировщик отсутствует; проверка экспорта со звуком пропущена." };
    } else if (!videoPrerequisitesAvailable || ffprobe.status !== "ok") {
      smokeTest.videoOnly = {
        status: "skipped",
        message: capabilityError || "Для пробного MP4 нужны FFmpeg, ffprobe, libx264, MP4 muxer и PNG-декодер."
      };
    }

    if (ffprobe.status === "ok" && capabilities.webmMuxer.available && capabilities.opusEncoder.available && capabilities.pngDecoder.available) {
      if (capabilities.vp8Encoder.available) {
        try { smokeTest.webmVp8 = await runSmokeWebmEncode(ffmpeg.path, ffprobe.path, { ...baseOptions, videoCodec: "vp8" }); }
        catch (error) { smokeTest.webmVp8 = { status: "failed", message: errorMessage(error) }; }
      } else smokeTest.webmVp8 = { status: "skipped", message: "Кодировщик libvpx (VP8) отсутствует." };
      if (capabilities.vp9Encoder.available) {
        try { smokeTest.webmVp9 = await runSmokeWebmEncode(ffmpeg.path, ffprobe.path, { ...baseOptions, videoCodec: "vp9" }); }
        catch (error) { smokeTest.webmVp9 = { status: "failed", message: errorMessage(error) }; }
      } else smokeTest.webmVp9 = { status: "skipped", message: "Кодировщик libvpx-vp9 отсутствует." };
    }
  }

  const ffmpegAvailable = ffmpeg.status === "ok";
  const ffprobeAvailable = ffprobe.status === "ok";
  const videoCapabilitiesOk = capabilities.h264Encoder.available && capabilities.mp4Muxer.available && capabilities.pngDecoder.available;
  const exportReady = ffmpegAvailable && ffprobeAvailable && videoCapabilitiesOk && smokeTest.videoOnly.status === "passed";
  const audioReady = exportReady && capabilities.aacEncoder.available && smokeTest.withAudio.status === "passed";
  const webmVp8Ready = ffmpegAvailable && ffprobeAvailable && capabilities.webmMuxer.available && capabilities.pngDecoder.available && capabilities.vp8Encoder.available && capabilities.opusEncoder.available && smokeTest.webmVp8.status === "passed";
  const webmVp9Ready = ffmpegAvailable && ffprobeAvailable && capabilities.webmMuxer.available && capabilities.pngDecoder.available && capabilities.vp9Encoder.available && capabilities.opusEncoder.available && smokeTest.webmVp9.status === "passed";
  const warnings = [];
  if (!ffmpegAvailable) warnings.push("Установите FFmpeg и добавьте папку bin в PATH, затем полностью перезапустите редактор.");
  if (!ffprobeAvailable) warnings.push("Установите ffprobe. Обычно он поставляется вместе с FFmpeg в той же папке bin.");
  for (const capability of Object.values(capabilities)) {
    if (capability.required && !capability.available) warnings.push(`В установленной сборке FFmpeg отсутствует: ${capability.label}.`);
  }
  if (!capabilities.aacEncoder.available && ffmpegAvailable) warnings.push("AAC-кодировщик не найден: экспорт проектов со звуком может быть недоступен; видео без аудио может работать.");
  if (smokeTest.videoOnly.status === "failed") warnings.push(`Пробное кодирование видео не прошло: ${smokeTest.videoOnly.message}`);
  if (smokeTest.withAudio.status === "failed") warnings.push(`Пробное кодирование со звуком не прошло: ${smokeTest.withAudio.message}`);
  if (smokeTest.webmVp8.status === "failed") warnings.push(`Пробное кодирование WebM VP8 не прошло: ${smokeTest.webmVp8.message}`);
  if (smokeTest.webmVp9.status === "failed") warnings.push(`Пробное кодирование WebM VP9 не прошло: ${smokeTest.webmVp9.message}`);
  if (capabilityError) warnings.push(`Не удалось получить список возможностей FFmpeg: ${capabilityError}`);

  const readyFormats = [];
  if (exportReady) readyFormats.push(audioReady ? "MP4 H.264 + AAC" : "MP4 H.264 без подтверждённого AAC");
  if (webmVp8Ready) readyFormats.push("WebM VP8 + Opus");
  if (webmVp9Ready) readyFormats.push("WebM VP9 + Opus");
  const summary = readyFormats.length
    ? `Локальные форматы, прошедшие пробное кодирование и проверку ffprobe: ${readyFormats.join("; ")}.`
    : "Ни один локальный формат не прошёл полную проверку. Смотрите причины ниже.";

  return {
    checkedAt: new Date().toISOString(),
    platform: baseOptions.platform,
    tools: { ffmpeg, ffprobe },
    capabilities,
    smokeTest,
    exportReady,
    audioReady,
    webmVp8Ready,
    webmVp9Ready,
    warnings,
    summary
  };
}

module.exports = {
  resolveExecutable,
  parseEncoderSupport,
  parseDecoderSupport,
  parseMuxerSupport,
  parseHardwareAccelerationSupport,
  collectToolDiagnostics,
  runSmokeEncode,
  runSmokeWebmEncode
};
