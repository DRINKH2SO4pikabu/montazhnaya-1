"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { analyzeFrameTimestamps } = require("../electron/media-timing.cjs");

function usage() {
  console.log(`Проверка готового MP4 средствами FFmpeg/ffprobe.

Использование:
  node tests/inspect-export.cjs <файл.mp4> --fps 30 --frames 210 --duration 7 [параметры]

Параметры:
  --fps N             Ожидаемый FPS, например 24 или 30 (обязательно)
  --frames N          Ожидаемое число кадров (обязательно)
  --duration N        Длительность в секундах (обязательно)
  --no-audio          Проверять, что аудиодорожка отсутствует
  --audio-markers     Проверять звуковые импульсы в тестовом ролике: 0.20, 3.50, 6.80 с
  --require-motion    Проверять, что соседние декодированные кадры не совпадают побайтно
  --help              Показать эту справку

Все PTS видеокадров проверяются, а не только первые 300.`);
}

function parseArgs(argv) {
  const result = { file: null, fps: NaN, frames: NaN, duration: NaN, noAudio: false, audioMarkers: false, requireMotion: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      return result;
    }
    if (arg === "--no-audio") result.noAudio = true;
    else if (arg === "--audio-markers") result.audioMarkers = true;
    else if (arg === "--require-motion") result.requireMotion = true;
    else if (["--fps", "--frames", "--duration"].includes(arg)) {
      if (i + 1 >= argv.length) throw new Error(`После ${arg} нужно указать значение.`);
      const value = Number(argv[++i]);
      if (arg === "--fps") result.fps = value;
      else if (arg === "--frames") result.frames = value;
      else result.duration = value;
    } else if (arg.startsWith("--")) {
      throw new Error(`Неизвестный параметр: ${arg}`);
    } else if (!result.file) result.file = arg;
    else throw new Error(`Лишний аргумент: ${arg}`);
  }
  if (!result.file) throw new Error("Не указан проверяемый MP4-файл.");
  if (!Number.isFinite(result.fps) || result.fps < 1 || result.fps > 120) throw new Error("Укажите --fps от 1 до 120.");
  if (!Number.isInteger(result.frames) || result.frames < 1) throw new Error("Укажите --frames как положительное целое число.");
  if (!Number.isFinite(result.duration) || result.duration <= 0) throw new Error("Укажите положительную длительность через --duration.");
  return result;
}

function run(executable, args, options = {}) {
  try {
    return execFileSync(executable, args, {
      encoding: options.encoding === undefined ? "utf8" : options.encoding,
      maxBuffer: options.maxBuffer || 64 * 1024 * 1024,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    const details = String(error.stderr || error.message || error).trim();
    throw new Error(`${executable} завершился с ошибкой: ${details.slice(-2500)}`);
  }
}

function parseRate(value) {
  if (typeof value !== "string") return NaN;
  const [numerator, denominator = "1"] = value.split("/");
  const n = Number(numerator);
  const d = Number(denominator);
  return d > 0 ? n / d : NaN;
}

function check(checks, name, passed, details) {
  checks.push({ name, passed: Boolean(passed), details });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${details ? ` — ${details}` : ""}`);
}

function detectAudioMarkers(filePath) {
  const pcm = run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-i", filePath,
    "-vn", "-ac", "1", "-ar", "8000", "-acodec", "pcm_s16le", "-f", "s16le", "-"
  ], { encoding: null, maxBuffer: 16 * 1024 * 1024 });
  if (!Buffer.isBuffer(pcm) || pcm.length < 8000 || pcm.length % 2 !== 0) {
    throw new Error("Не удалось декодировать аудио в PCM для проверки маркеров.");
  }
  const sampleCount = pcm.length / 2;
  const windowSamples = 80; // 10 ms at 8 kHz
  const rms = [];
  let maximumRms = 0;
  for (let start = 0; start + windowSamples <= sampleCount; start += windowSamples) {
    let sumSquares = 0;
    for (let i = 0; i < windowSamples; i++) {
      const sample = pcm.readInt16LE((start + i) * 2) / 32768;
      sumSquares += sample * sample;
    }
    const value = Math.sqrt(sumSquares / windowSamples);
    rms.push(value);
    maximumRms = Math.max(maximumRms, value);
  }
  if (!(maximumRms > 0)) throw new Error("В аудиодорожке нет измеримого сигнала.");

  const threshold = maximumRms * 0.16;
  const windowDuration = windowSamples / 8000;
  const expectedStarts = [0.20, 3.50, 6.80];
  return expectedStarts.map((expected) => {
    const from = Math.max(0, Math.floor((expected - 0.15) / windowDuration));
    const to = Math.min(rms.length - 3, Math.ceil((expected + 0.20) / windowDuration));
    let detected = null;
    for (let i = from; i <= to; i++) {
      if (rms[i] > threshold && rms[i + 1] > threshold && rms[i + 2] > threshold) {
        detected = i * windowDuration;
        break;
      }
    }
    return { expected, detected, errorSeconds: detected == null ? null : detected - expected };
  });
}

function countAdjacentDuplicateFrames(filePath) {
  const text = run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-i", filePath,
    "-map", "0:v:0", "-an", "-f", "framemd5", "-"
  ]);
  let previous = null;
  let frames = 0;
  let duplicates = 0;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const fields = trimmed.split(",");
    const hash = fields[fields.length - 1].trim();
    if (!hash) continue;
    frames++;
    if (hash === previous) duplicates++;
    previous = hash;
  }
  return { frames, duplicates };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();
  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) throw new Error(`Файл не найден: ${filePath}`);

  const meta = JSON.parse(run("ffprobe", [
    "-v", "error", "-count_frames",
    "-show_entries", "stream=codec_type,codec_name,width,height,pix_fmt,avg_frame_rate,nb_read_frames,start_time,duration:format=format_name,duration",
    "-of", "json", filePath
  ]));
  const streams = Array.isArray(meta.streams) ? meta.streams : [];
  const video = streams.find((stream) => stream.codec_type === "video");
  const audio = streams.find((stream) => stream.codec_type === "audio");
  if (!video) throw new Error("В файле не найдена видеодорожка.");

  const formatNames = String(meta.format && meta.format.format_name || "").split(",");
  const duration = Number(video.duration || (meta.format && meta.format.duration));
  const averageFps = parseRate(video.avg_frame_rate);
  const frameCount = Number(video.nb_read_frames);
  const checks = [];
  const expectedTolerance = Math.max(0.1, 2 / args.fps);

  console.log(`\nФайл: ${filePath}`);
  console.log(`Видео: ${video.codec_name || "?"}, ${video.width || "?"}×${video.height || "?"}, ${video.pix_fmt || "?"}`);
  console.log(`Кадры: ${frameCount}; FPS: ${averageFps}; длительность: ${duration} с`);

  check(checks, "Контейнер MP4", formatNames.includes("mp4"), formatNames.join(", "));
  check(checks, "Кодек H.264 и yuv420p", video.codec_name === "h264" && video.pix_fmt === "yuv420p", `${video.codec_name || "?"}/${video.pix_fmt || "?"}`);
  check(checks, "Количество кадров", frameCount === args.frames, `${frameCount} / ${args.frames}`);
  check(checks, "Средний FPS", Number.isFinite(averageFps) && Math.abs(averageFps - args.fps) <= Math.max(0.1, args.fps * 0.005), `${averageFps} / ${args.fps}`);
  check(checks, "Длительность", Number.isFinite(duration) && Math.abs(duration - args.duration) <= expectedTolerance, `${duration} с / ${args.duration} с`);
  check(checks, "Начало видео около 0 с", Number.isFinite(Number(video.start_time)) && Math.abs(Number(video.start_time)) <= 0.05, `${video.start_time} с`);

  const ptsText = run("ffprobe", [
    "-v", "error", "-select_streams", "v:0", "-show_frames",
    "-show_entries", "frame=best_effort_timestamp_time", "-of", "csv=p=0", filePath
  ]);
  const timing = analyzeFrameTimestamps(ptsText, args.fps, frameCount, true);
  check(checks, "PTS получены для каждого кадра", timing.timestampsComplete && timing.timestampCount === args.frames,
    `${timing.timestampCount}/${args.frames}; отсутствуют: ${timing.missingTimestampCount}`);
  check(checks, "PTS возрастают без повторов", timing.nonMonotonicCount === 0, `нарушений: ${timing.nonMonotonicCount}`);
  check(checks, "Равномерная CFR-временная сетка", timing.intervalDeviationCount === 0,
    `отклонений: ${timing.intervalDeviationCount}; допуск: ${timing.intervalTolerance.toFixed(6)} с`);
  check(checks, "Нет больших разрывов PTS", timing.longGapCount === 0, `разрывов: ${timing.longGapCount}; макс. интервал: ${timing.maxInterval}`);

  check(checks, "Аудиодорожка соответствует ожиданию", args.noAudio ? !audio : Boolean(audio), audio ? `${audio.codec_name}, ${audio.start_time}–${audio.duration} с` : "аудио отсутствует");
  if (audio && !args.noAudio) {
    check(checks, "Кодек AAC", audio.codec_name === "aac", audio.codec_name || "неизвестно");
    check(checks, "Аудио начинается около 0 с", Number.isFinite(Number(audio.start_time)) && Math.abs(Number(audio.start_time)) <= 0.05, `${audio.start_time} с`);
    const audioDuration = Number(audio.duration);
    check(checks, "Длительность звука согласована с видео", Number.isFinite(audioDuration) && Math.abs(audioDuration - args.duration) <= expectedTolerance,
      `${audioDuration} с / ${args.duration} с`);
  }

  const nullTarget = process.platform === "win32" ? "NUL" : "/dev/null";
  run("ffmpeg", ["-hide_banner", "-v", "error", "-xerror", "-i", filePath, "-f", "null", nullTarget]);
  check(checks, "Полное декодирование FFmpeg", true, "ошибок декодирования нет");

  if (args.audioMarkers) {
    if (!audio) throw new Error("Для проверки звуковых маркеров требуется аудиодорожка.");
    const markers = detectAudioMarkers(filePath);
    for (const marker of markers) {
      const passed = marker.detected != null && Math.abs(marker.errorSeconds) <= 0.10;
      check(checks, `Звуковой маркер ${marker.expected.toFixed(2)} с`, passed,
        marker.detected == null ? "сигнал не найден рядом с ожидаемой позицией" :
          `обнаружен ${marker.detected.toFixed(3)} с; сдвиг ${marker.errorSeconds >= 0 ? "+" : ""}${marker.errorSeconds.toFixed(3)} с`);
    }
  }

  if (args.requireMotion) {
    const motion = countAdjacentDuplicateFrames(filePath);
    check(checks, "Каждый соседний кадр визуально изменяется", motion.frames === args.frames && motion.duplicates === 0,
      `${motion.frames} кадров; одинаковых соседних пар: ${motion.duplicates}`);
  }

  const failures = checks.filter((item) => !item.passed);
  console.log(`\nИтог: ${failures.length === 0 ? "PASS" : "FAIL"} — ${checks.length - failures.length}/${checks.length} проверок пройдены.`);
  if (failures.length) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(`ОШИБКА: ${error.message || error}`);
  console.error("Используйте --help для просмотра параметров.");
  process.exitCode = 1;
}
