"use strict";

const DEFAULT_AUDIO_SAMPLE_RATE = 48000;
const DEFAULT_AUDIO_CHANNELS = 2;
const DEFAULT_AUDIO_BITS = 16;
const DEFAULT_MAX_WAV_BYTES = 512 * 1024 * 1024;
const DEFAULT_MAX_DECODED_BYTES = 256 * 1024 * 1024;

const CHROMIUM_NATIVE_AUDIO_CODECS = new Set([
  "aac", "mp3", "opus", "vorbis", "flac",
  "pcm_u8", "pcm_s16le", "pcm_s16be", "pcm_s24le", "pcm_s24be",
  "pcm_s32le", "pcm_f32le", "pcm_f64le"
]);

function requiresAudioPreviewNormalization(audioInfo) {
  if (!audioInfo || typeof audioInfo !== "object") return true;
  const codec = String(audioInfo.codec || "").toLowerCase();
  const channels = Number(audioInfo.channels);
  const sampleRate = Number(audioInfo.sampleRate);
  // Normalize codecs that Chromium may not decode consistently. Also normalize
  // multichannel and >48 kHz media so preview uses the same stereo 48 kHz
  // representation as the offline export mixer.
  if (!CHROMIUM_NATIVE_AUDIO_CODECS.has(codec)) return true;
  if (!Number.isInteger(channels) || channels < 1 || channels > 2) return true;
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 48000) return true;
  return false;
}

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function selectAudioStream(streams) {
  const candidates = Array.isArray(streams)
    ? streams.filter((stream) => stream && String(stream.codec_type || "").toLowerCase() === "audio")
    : [];
  if (!candidates.length) return null;
  return candidates.slice().sort((a, b) => {
    const aDefault = a.disposition && Number(a.disposition.default) === 1 ? 1 : 0;
    const bDefault = b.disposition && Number(b.disposition.default) === 1 ? 1 : 0;
    if (aDefault !== bDefault) return bDefault - aDefault;
    const aIndex = Number.isInteger(Number(a.index)) ? Number(a.index) : Number.MAX_SAFE_INTEGER;
    const bIndex = Number.isInteger(Number(b.index)) ? Number(b.index) : Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  })[0];
}

function describeAudioStream(stream, formatDuration = 0) {
  if (!stream || String(stream.codec_type || "").toLowerCase() !== "audio") {
    throw new TypeError("Для аудиопрофиля требуется аудиопоток ffprobe.");
  }
  const duration = finitePositive(stream.duration) || finitePositive(formatDuration);
  return {
    streamIndex: Number.isInteger(Number(stream.index)) ? Number(stream.index) : 0,
    codec: String(stream.codec_name || "unknown"),
    profile: String(stream.profile || ""),
    sampleRate: finitePositive(stream.sample_rate),
    channels: Math.max(0, Math.floor(Number(stream.channels) || 0)),
    channelLayout: String(stream.channel_layout || ""),
    sampleFormat: String(stream.sample_fmt || ""),
    bitRate: finitePositive(stream.bit_rate),
    startTime: Number.isFinite(Number(stream.start_time)) ? Number(stream.start_time) : 0,
    duration,
    isDefault: !!(stream.disposition && Number(stream.disposition.default) === 1)
  };
}

function estimatePcmWavBytes(durationSeconds, options = {}) {
  const duration = Number(durationSeconds);
  const sampleRate = Math.floor(Number(options.sampleRate || DEFAULT_AUDIO_SAMPLE_RATE));
  const channels = Math.floor(Number(options.channels || DEFAULT_AUDIO_CHANNELS));
  const bytesPerSample = Math.floor(Number(options.bytesPerSample || DEFAULT_AUDIO_BITS / 8));
  if (!Number.isFinite(duration) || duration <= 0 ||
      !Number.isSafeInteger(sampleRate) || sampleRate < 8000 || sampleRate > 192000 ||
      !Number.isSafeInteger(channels) || channels < 1 || channels > 8 ||
      !Number.isSafeInteger(bytesPerSample) || bytesPerSample < 1 || bytesPerSample > 4) {
    throw new RangeError("Некорректные параметры оценки PCM WAV.");
  }
  const sampleFrames = Math.ceil(duration * sampleRate);
  const dataBytes = sampleFrames * channels * bytesPerSample;
  const totalBytes = 44 + dataBytes;
  if (!Number.isSafeInteger(totalBytes) || totalBytes > 0xffffffff + 8) {
    throw new RangeError("Оценка WAV превышает предел классического RIFF/WAV.");
  }
  return { sampleFrames, dataBytes, totalBytes, duration, sampleRate, channels, bytesPerSample };
}

function buildPcmWavNormalizeArgs(inputPath, outputPath, options = {}) {
  if (typeof inputPath !== "string" || !inputPath || typeof outputPath !== "string" || !outputPath) {
    throw new TypeError("Для нормализации аудио нужны входной и выходной пути.");
  }
  const streamIndex = Number(options.streamIndex);
  if (!Number.isInteger(streamIndex) || streamIndex < 0 || streamIndex > 999) {
    throw new RangeError("Некорректный индекс аудиопотока.");
  }
  const sampleRate = Math.floor(Number(options.sampleRate || DEFAULT_AUDIO_SAMPLE_RATE));
  const channels = Math.floor(Number(options.channels || DEFAULT_AUDIO_CHANNELS));
  if (![44100, 48000, 96000].includes(sampleRate) || ![1, 2].includes(channels)) {
    throw new RangeError("Неподдерживаемый профиль нормализации аудио.");
  }
  const filters = [];
  // Reset each source to a stable zero-based media clock, then resample to the
  // editor's common mix rate. FFmpeg performs channel rematrixing for 5.1/etc.
  const startOffsetSeconds = Number(options.startOffsetSeconds || 0);
  if (!Number.isFinite(startOffsetSeconds) || Math.abs(startOffsetSeconds) > 3600) {
    throw new RangeError("Некорректное смещение начала аудиопотока.");
  }
  if (startOffsetSeconds < -0.001) {
    filters.push(`atrim=start=${Math.abs(startOffsetSeconds).toFixed(6)}`);
    filters.push("asetpts=PTS-STARTPTS");
  } else {
    filters.push("asetpts=PTS-STARTPTS");
    if (startOffsetSeconds > 0.001) {
      const delayMs = Math.max(1, Math.round(startOffsetSeconds * 1000));
      filters.push(`adelay=${delayMs}|${delayMs}`);
    }
  }
  filters.push(`aresample=${sampleRate}:async=1:first_pts=0`);
  const args = [
    "-hide_banner", "-loglevel", "error", "-nostdin", "-xerror", "-y",
    "-i", inputPath,
    "-map", `0:${streamIndex}`,
    "-vn", "-sn", "-dn",
    "-af", filters.join(","),
    "-ac", String(channels),
    "-ar", String(sampleRate),
    "-c:a", "pcm_s16le",
    "-f", "wav",
    outputPath
  ];
  return args;
}

function inspectPcmWavHeader(buffer, expected = {}) {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new TypeError("Заголовок WAV должен быть Buffer или Uint8Array.");
  }
  const bytes = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (bytes.length < 44 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("FFmpeg создал некорректный WAV: сигнатура RIFF/WAVE не найдена.");
  }
  let offset = 12;
  let format = null;
  let dataSize = null;
  let dataOffset = null;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (payload + size > bytes.length) throw new Error("WAV содержит неполный блок.");
    if (id === "fmt ") {
      if (size < 16) throw new Error("WAV содержит неполный блок fmt.");
      format = {
        audioFormat: bytes.readUInt16LE(payload),
        channels: bytes.readUInt16LE(payload + 2),
        sampleRate: bytes.readUInt32LE(payload + 4),
        byteRate: bytes.readUInt32LE(payload + 8),
        blockAlign: bytes.readUInt16LE(payload + 12),
        bitsPerSample: bytes.readUInt16LE(payload + 14)
      };
    } else if (id === "data") {
      dataSize = size;
      dataOffset = payload;
      break;
    }
    offset = payload + size + (size & 1);
  }
  if (!format || dataSize == null) throw new Error("WAV не содержит обязательные блоки fmt/data.");
  if (format.audioFormat !== 1 || format.bitsPerSample !== 16) {
    throw new Error("Ожидался несжатый PCM 16-bit WAV.");
  }
  if (expected.channels && format.channels !== expected.channels) throw new Error("Количество каналов WAV не совпадает с ожидаемым профилем.");
  if (expected.sampleRate && format.sampleRate !== expected.sampleRate) throw new Error("Частота дискретизации WAV не совпадает с ожидаемым профилем.");
  if (dataSize % Math.max(1, format.blockAlign) !== 0) throw new Error("Размер PCM-блока WAV не выровнен по аудиокадру.");
  return {
    ...format,
    dataBytes: dataSize,
    dataOffset,
    frameCount: dataSize / format.blockAlign,
    duration: dataSize / Math.max(1, format.byteRate),
    fileBytes: bytes.length
  };
}

function calculateAudioBufferBytes(durationSeconds, sampleRate = DEFAULT_AUDIO_SAMPLE_RATE, channels = DEFAULT_AUDIO_CHANNELS) {
  const duration = Number(durationSeconds);
  const rate = Number(sampleRate);
  const count = Number(channels);
  if (!Number.isFinite(duration) || duration < 0 || !Number.isFinite(rate) || rate <= 0 ||
      !Number.isInteger(count) || count < 1 || count > 8) return null;
  const bytes = Math.ceil(duration * rate) * count * 4;
  return Number.isSafeInteger(bytes) ? bytes : null;
}

module.exports = {
  DEFAULT_AUDIO_SAMPLE_RATE,
  DEFAULT_AUDIO_CHANNELS,
  DEFAULT_AUDIO_BITS,
  DEFAULT_MAX_WAV_BYTES,
  DEFAULT_MAX_DECODED_BYTES,
  selectAudioStream,
  describeAudioStream,
  estimatePcmWavBytes,
  buildPcmWavNormalizeArgs,
  inspectPcmWavHeader,
  calculateAudioBufferBytes,
  CHROMIUM_NATIVE_AUDIO_CODECS,
  requiresAudioPreviewNormalization
};
