"use strict";

const MAX_SAMPLE_TIMESTAMPS = 300;

/**
 * Analyze ffprobe CSV output containing one best-effort presentation timestamp
 * per decoded video frame. In full-inspection mode, every frame is evaluated;
 * only the first 300 timestamps are retained for logs and source comparisons.
 */
function analyzeFrameTimestamps(stdout, expectedFps, expectedFrameCount, inspectAllFrames = false, timestampToleranceSeconds = null) {
  if (typeof stdout !== "string") {
    throw new TypeError("Вывод ffprobe с временными метками должен быть строкой.");
  }
  if (!Number.isFinite(expectedFps) || expectedFps <= 0) {
    throw new RangeError("Ожидаемая частота кадров должна быть положительным числом.");
  }
  if (!Number.isInteger(expectedFrameCount) || expectedFrameCount < 1) {
    throw new RangeError("Ожидаемое число кадров должно быть положительным целым числом.");
  }

  const expectedInterval = 1 / expectedFps;
  const intervalTolerance = Math.max(0.0005, expectedInterval * 0.02,
    Number.isFinite(timestampToleranceSeconds) && timestampToleranceSeconds > 0 ? timestampToleranceSeconds : 0);
  const intervalHistogram = {};
  const sampledTimestamps = [];
  let timestampCount = 0;
  let missingTimestampCount = 0;
  let nonMonotonicCount = 0;
  let longGapCount = 0;
  let intervalDeviationCount = 0;
  let minInterval = null;
  let maxInterval = null;
  let firstTimestamp = null;
  let lastTimestamp = null;
  let previousTimestamp = null;

  // Iterating with a global regular expression avoids allocating a second large
  // array of lines for long recordings.
  const lines = /[^\r\n]+/g;
  let match;
  while ((match = lines.exec(stdout)) !== null) {
    const line = match[0].trim();
    if (!line) continue;
    // CSV may append codec side-data text after the timestamp on a frame line.
    // Only the first field is the requested best_effort_timestamp_time value.
    const timestamp = Number(line.split(",", 1)[0].trim());
    if (!Number.isFinite(timestamp)) {
      missingTimestampCount++;
      continue;
    }

    if (sampledTimestamps.length < MAX_SAMPLE_TIMESTAMPS) {
      sampledTimestamps.push(timestamp);
    }

    if (previousTimestamp !== null) {
      const interval = timestamp - previousTimestamp;
      const histogramKey = interval.toFixed(4);
      intervalHistogram[histogramKey] = (intervalHistogram[histogramKey] || 0) + 1;
      if (minInterval === null || interval < minInterval) minInterval = interval;
      if (maxInterval === null || interval > maxInterval) maxInterval = interval;
      if (interval <= 0) nonMonotonicCount++;
      if (interval > expectedInterval * 1.5) longGapCount++;
      if (Math.abs(interval - expectedInterval) > intervalTolerance) intervalDeviationCount++;
    }

    if (timestampCount === 0) firstTimestamp = timestamp;
    lastTimestamp = timestamp;
    previousTimestamp = timestamp;
    timestampCount++;
  }

  const timestampsComplete = Boolean(inspectAllFrames) &&
    missingTimestampCount === 0 && timestampCount === expectedFrameCount;
  const elapsed = firstTimestamp !== null && lastTimestamp !== null
    ? lastTimestamp - firstTimestamp
    : NaN;

  return {
    allFramesInspected: Boolean(inspectAllFrames),
    timestampsComplete,
    timestampCount,
    missingTimestampCount,
    sampledFrameCount: sampledTimestamps.length,
    sampledTimestamps,
    ptsMeasuredFps: timestampCount > 1 && Number.isFinite(elapsed) && elapsed > 0
      ? (timestampCount - 1) / elapsed
      : null,
    intervalHistogram,
    intervalTolerance,
    intervalDeviationCount,
    nonMonotonicCount,
    longGapCount,
    minInterval,
    maxInterval
  };
}

module.exports = { analyzeFrameTimestamps, MAX_SAMPLE_TIMESTAMPS };
