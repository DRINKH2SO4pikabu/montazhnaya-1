"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawnSync, execFileSync } = require("node:child_process");
const {
  validateSourceFrameIndices,
  mergeFrameIndicesToRanges,
  splitSourceFrameIndicesForFfmpeg,
  buildSourceFrameExtractionFfmpegArgs
} = require("../electron/frame-sequence.cjs");

const root = path.join(__dirname, "..");
const rendererPath = path.join(root, "src", "renderer", "index.html");
const mainPath = path.join(root, "electron", "main.cjs");
const preloadPath = path.join(root, "electron", "preload.cjs");
const encoderProbe = spawnSync("ffmpeg", ["-hide_banner", "-encoders"], { encoding: "utf8", windowsHide: true });
const hasSyntheticFixtureSupport = !encoderProbe.error && encoderProbe.status === 0 &&
  /\blibx264\b/.test(String(encoderProbe.stdout || "") + String(encoderProbe.stderr || ""));
let fixtureDirectory = null;
let fixture = null;

before(async () => {
  if (!hasSyntheticFixtureSupport) return;
  fixtureDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-synthetic-fixtures-"));
  execFileSync(process.execPath, [path.join(root, "tools", "generate-synthetic-fixtures.cjs"), "--output-dir", fixtureDirectory], {
    windowsHide: true, timeout: 120000, stdio: "pipe"
  });
  fixture = path.join(fixtureDirectory, "synthetic-30fps-audiomarkers.mp4");
});

after(async () => {
  if (fixtureDirectory) await fs.rm(fixtureDirectory, { recursive: true, force: true });
});

function sha256(filePath) {
  return crypto.createHash("sha256").update(require("node:fs").readFileSync(filePath)).digest("hex");
}

test("source frame indices must be ordered, unique and bounded", () => {
  assert.deepEqual(validateSourceFrameIndices([0, 1, 3, 239]), [0, 1, 3, 239]);
  assert.throws(() => validateSourceFrameIndices([0, 2, 1]), /уникальными, возрастающими/);
  assert.throws(() => validateSourceFrameIndices([0, 1, 1]), /уникальными, возрастающими/);
  assert.throws(() => validateSourceFrameIndices([-1]), /уникальными, возрастающими/);
  assert.throws(() => validateSourceFrameIndices([]), /от 1 до/);
});

test("source frame ranges merge only adjacent frame indices", () => {
  assert.deepEqual(mergeFrameIndicesToRanges([0, 1, 2, 7, 9, 10]), [[0, 2], [7, 7], [9, 10]]);
});

test("source frame selection is chunked below Windows command-line filter limits", () => {
  const indices = Array.from({ length: 600 }, (_, i) => i * 2);
  const batches = splitSourceFrameIndicesForFfmpeg(indices, 1024);
  assert.ok(batches.length > 1);
  assert.deepEqual(batches.flat(), indices);
  for (const batch of batches) {
    const args = buildSourceFrameExtractionFfmpegArgs({
      inputPath: "C:\\Temp\\source.mp4",
      outputPattern: "C:\\Temp\\source_frames\\batch_%06d.png",
      fps: 24,
      frameIndices: batch
    });
    assert.ok(args[args.indexOf("-vf") + 1].length <= 1024 + 64);
  }
});

test("FFmpeg source extraction uses a CFR time grid then selects decoded frame indices", () => {
  const args = buildSourceFrameExtractionFfmpegArgs({
    inputPath: "C:\\Temp\\source.mp4",
    outputPattern: "C:\\Temp\\frames\\frame_%06d.png",
    fps: 24,
    frameIndices: [0, 1, 3, 238, 239]
  });
  const filter = args[args.indexOf("-vf") + 1];
  assert.match(filter, /setpts=PTS-STARTPTS/);
  assert.match(filter, /fps=fps=24:start_time=0:round=near/);
  assert.match(filter, /select=/);
  assert.ok(args.includes("-fps_mode") && args[args.indexOf("-fps_mode") + 1] === "passthrough");
  assert.ok(args.includes("-frames:v") && args[args.indexOf("-frames:v") + 1] === "5");
  assert.equal(args[args.indexOf("-i") + 1], "C:\\Temp\\source.mp4");
});

test("source frame extraction downsizes only selected output-clock frames for the export working canvas", () => {
  const args = buildSourceFrameExtractionFfmpegArgs({
    inputPath: "C:\\Temp\\source.mp4",
    outputPattern: "C:\\Temp\\frames\\frame_%06d.png",
    fps: 30,
    frameIndices: [0, 1, 3],
    renderWidth: 2400,
    renderHeight: 1350
  });
  const filter = args[args.indexOf("-vf") + 1];
  assert.match(filter, /select=.*scale=2400:1350:flags=lanczos/);
  assert.ok(filter.indexOf("select=") < filter.indexOf("scale="),
    "only frames selected on the target CFR clock should be resized");
  assert.throws(() => buildSourceFrameExtractionFfmpegArgs({
    inputPath: "source.mp4", outputPattern: "frame_%06d.png", fps: 30,
    frameIndices: [0], renderWidth: 2400
  }), /размеры рабочих кадров/);
  const cudaArgs = buildSourceFrameExtractionFfmpegArgs({
    inputPath: "source.mp4", outputPattern: "frame_%06d.png", fps: 30,
    frameIndices: [0], hardwareDecode: true, renderWidth: 2400, renderHeight: 1350
  });
  const cudaFilter = cudaArgs[cudaArgs.indexOf("-vf") + 1];
  assert.match(cudaFilter, /^hwdownload,format=nv12,/);
  assert.match(cudaFilter, /select=.*scale=2400:1350:flags=lanczos/);
  assert.ok(cudaArgs.includes("-hwaccel") && cudaArgs[cudaArgs.indexOf("-hwaccel") + 1] === "cuda");
});

test("FFmpeg can write downscaled source PNGs without changing frame selection or timestamps", { skip: !hasSyntheticFixtureSupport }, async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-source-proxy-test-"));
  const outputDir = path.join(tmp, "selected");
  const referenceDir = path.join(tmp, "reference");
  await fs.mkdir(outputDir);
  await fs.mkdir(referenceDir);
  try {
    const args = buildSourceFrameExtractionFfmpegArgs({
      inputPath: fixture,
      outputPattern: path.join(outputDir, "frame_%06d.png"),
      fps: 30,
      frameIndices: [0, 1, 2, 3, 4],
      renderWidth: 320,
      renderHeight: 180
    });
    execFileSync("ffmpeg", args, { windowsHide: true, timeout: 120000, stdio: "pipe" });
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-xerror", "-y", "-i", fixture,
      "-map", "0:v:0",
      "-vf", "setpts=PTS-STARTPTS,fps=fps=30:start_time=0:round=near,scale=320:180:flags=lanczos",
      "-fps_mode", "passthrough", "-start_number", "0", "-f", "image2",
      path.join(referenceDir, "frame_%06d.png")
    ], { windowsHide: true, timeout: 120000, stdio: "pipe" });
    const files = (await fs.readdir(outputDir)).filter(name => name.endsWith(".png")).sort();
    assert.equal(files.length, 5);
    for (let index = 0; index < files.length; index++) {
      const filePath = path.join(outputDir, files[index]);
      const probe = execFileSync("ffprobe", [
        "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
        "-of", "csv=p=0", filePath
      ], { encoding: "utf8", windowsHide: true }).trim();
      assert.equal(probe, "320,180");
      assert.equal(
        sha256(filePath),
        sha256(path.join(referenceDir, `frame_${String(index).padStart(6, "0")}.png`)),
        `downscaled selected frame ${index} must match the same full-CFR source frame`
      );
    }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("windowed source-frame extraction seeks to the window and selects relative CFR indices", () => {
  const args = buildSourceFrameExtractionFfmpegArgs({
    inputPath: "C:\\Temp\\source.mp4",
    outputPattern: "C:\\Temp\\frames\\frame_%06d.png",
    fps: 30,
    frameIndices: [56, 57, 60, 79],
    seekStartIndex: 56,
    sourceStartTime: 0
  });
  assert.equal(args[args.indexOf("-ss") + 1], "1.866666667");
  assert.ok(args.indexOf("-ss") < args.indexOf("-i"), "input seeking must happen before opening the source");
  const filter = args[args.indexOf("-vf") + 1];
  assert.match(filter, /between\(n,0,1\)/);
  assert.match(filter, /eq\(n,4\)/);
  assert.doesNotMatch(filter, /eq\(n,56\)/);
  assert.throws(() => buildSourceFrameExtractionFfmpegArgs({
    inputPath: "source.mp4", outputPattern: "frame_%06d.png", fps: 30,
    frameIndices: [56, 57], seekStartIndex: 58, sourceStartTime: 0
  }), /начальная точка/);
});

test("MP4 export uses FFmpeg-decoded source frames instead of seeking HTMLVideoElement", () => {
  const renderer = require("node:fs").readFileSync(rendererPath, "utf8");
  const main = require("node:fs").readFileSync(mainPath, "utf8");
  const preload = require("node:fs").readFileSync(preloadPath, "utf8");
  const exportStart = renderer.indexOf("async exportPngSequenceToMp4(filename, format = {}, videoBitrate");
  const exportEnd = renderer.indexOf("  cancel() {", exportStart);
  assert.ok(exportStart >= 0 && exportEnd > exportStart);
  const method = renderer.slice(exportStart, exportEnd);
  assert.match(method, /await this\.prepareFrameAccurateVideoSources\(sessionId\)/);
  assert.match(method, /this\.frameAccurateSourcesAtTime\(timelineTime, sessionId\)\.then/);
  assert.match(method, /startSourceReadTask/);
  assert.match(method, /renderSequenceAtTime\(timelineTime, this\.state\.ctx, this\.state\.canvas, frameSources\)/);
  assert.doesNotMatch(method, /seekVideoElementsAtTime\(/);
  const start = renderer.indexOf("async start() {");
  const end = renderer.indexOf("  sourceFrameIndexForTime(media, sourceTime, fps)", start);
  assert.ok(start >= 0 && end > start);
  const startMethod = renderer.slice(start, end);
  assert.match(startMethod, /if \(!this\.state\.frameSequenceMode\) \{[\s\S]*?await this\.prepareVideoElements\(\);/,
    "the frame-accurate MP4 route must not prime browser video elements before export");
  assert.match(renderer, /typeof overriddenSource\.naturalWidth === "number"/,
    "the existing Canvas compositor must accept FFmpeg-decoded Image sources");
  assert.match(preload, /prepareFrameSequenceSourceFrames:[\s\S]*export:prepare-source-frames/);
  assert.match(preload, /webUtils\.getPathForFile\(file\)/);
  assert.match(preload, /SOURCE_CHUNK_BYTES/);
  assert.match(preload, /media:stage-file-write/);
  assert.match(preload, /readFrameSequenceSourceFrame:[\s\S]*export:read-source-frame/);
  assert.match(main, /resolveIncomingMediaPath\(event, request, 12\)/);
  assert.match(main, /retainSourceStage:\s*!!source\.stageToken/);
  assert.match(main, /cleanupFrameSequenceSourceStages\(session\)/);
  assert.match(preload, /retainedByExportSession/);
  assert.doesNotMatch(main, /MAX_SOURCE_MEDIA_BYTES/);
  assert.doesNotMatch(method, /media\.file\.arrayBuffer\(\)/);
  assert.match(main, /handleExtractVideoAudioForExport/);
  assert.match(renderer, /extractVideoAudioForExport/);
  assert.match(main, /const source = session\.sourceFrames\.get\(request\.mediaId\)/);
  assert.match(main, /decodeSourceFrameWindow\(session, source, request\.sourceFrameIndex\)/);
  assert.match(main, /calculateSourceFrameRenderSize\(/);
  assert.match(main, /renderWidth:\s*source\.renderWidth/);
  assert.match(renderer, /maxClipScale:\s*item\.maxClipScale/);
  assert.match(main, /selectSourceFrameWindow\(source\.frameIndices, requestedIndex, windowSize\)/);
  assert.match(main, /MAX_SOURCE_FRAME_CACHE_BYTES/);
  assert.match(main, /source\.frameFiles\.get\(requestedIndex\)/);
  assert.match(main, /cleanupFrameSequenceSourceStages\(session\)/);
  assert.match(main, /isTrustedExportSender\(event\)/);
});

test("source-window planning diagnostics reference the active window size", () => {
  const main = require("node:fs").readFileSync(mainPath, "utf8");
  const marker = 'console.info("[Оконный кэш исходных кадров] План окна:"';
  const start = main.indexOf(marker);
  assert.ok(start >= 0, "source-window planning diagnostic must exist");
  const end = main.indexOf("      }));", start);
  assert.ok(end > start, "source-window planning diagnostic object must be closed");
  const block = main.slice(start, end);
  assert.match(block, /windowFrames:\s*windowSize/,
    "the log must report the declared windowSize local, not an undefined shorthand identifier");
  assert.doesNotMatch(block, /^\s*windowFrames\s*,/m);
});

test("FFmpeg-selected source PNGs match the same indices from a full CFR decode", { skip: !hasSyntheticFixtureSupport }, async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-source-frame-test-"));
  const fullDir = path.join(tmp, "full");
  const selectedDir = path.join(tmp, "selected");
  await fs.mkdir(fullDir);
  await fs.mkdir(selectedDir);
  const indices = [0, 1, 2, 5, 19, 57, 100, 209];
  try {
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-xerror", "-y", "-i", fixture,
      "-map", "0:v:0", "-vf", "setpts=PTS-STARTPTS,fps=fps=30:start_time=0:round=near",
      "-fps_mode", "passthrough", "-start_number", "0", "-f", "image2", path.join(fullDir, "frame_%06d.png")
    ], { windowsHide: true, timeout: 120000, stdio: "pipe" });

    const args = buildSourceFrameExtractionFfmpegArgs({
      inputPath: fixture,
      outputPattern: path.join(selectedDir, "frame_%06d.png"),
      fps: 30,
      frameIndices: indices
    });
    execFileSync("ffmpeg", args, { windowsHide: true, timeout: 120000, stdio: "pipe" });
    const selectedNames = (await fs.readdir(selectedDir)).filter(name => name.endsWith(".png")).sort();
    assert.equal(selectedNames.length, indices.length);
    for (let slot = 0; slot < indices.length; slot++) {
      assert.equal(sha256(path.join(selectedDir, selectedNames[slot])), sha256(path.join(fullDir, `frame_${String(indices[slot]).padStart(6, "0")}.png`)),
        `selected PNG slot ${slot} must contain exact CFR source index ${indices[slot]}`);
    }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});


test("lazy seeking preserves the exact source-frame clock at 24, 25, 30 and 60 FPS", { skip: !hasSyntheticFixtureSupport }, async () => {
  const { selectSourceFrameWindow } = require("../electron/source-frame-cache.cjs");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-source-window-fps-test-"));
  try {
    for (const fps of [24, 25, 30, 60]) {
      const count = 7 * fps;
      const fullDir = path.join(tmp, `full_${fps}`);
      const windowDir = path.join(tmp, `window_${fps}`);
      await fs.mkdir(fullDir);
      await fs.mkdir(windowDir);
      execFileSync("ffmpeg", [
        "-hide_banner", "-loglevel", "error", "-xerror", "-y", "-i", fixture,
        "-map", "0:v:0", "-vf", `setpts=PTS-STARTPTS,fps=fps=${fps}:start_time=0:round=near`,
        "-fps_mode", "passthrough", "-start_number", "0", "-f", "image2", path.join(fullDir, "frame_%06d.png")
      ], { windowsHide: true, timeout: 120000, stdio: "pipe" });
      const allIndices = Array.from({ length: count }, (_, index) => index);
      const targetIndices = [Math.min(count - 1, Math.round(1.9 * fps)), Math.min(count - 1, Math.round(5.8 * fps))];
      for (let i = 0; i < targetIndices.length; i++) {
        const targetIndex = targetIndices[i];
        const window = selectSourceFrameWindow(allIndices, targetIndex, 24, 2);
        const out = path.join(windowDir, `window_${i}`);
        await fs.mkdir(out);
        const args = buildSourceFrameExtractionFfmpegArgs({
          inputPath: fixture,
          outputPattern: path.join(out, "frame_%06d.png"),
          fps,
          frameIndices: window,
          seekStartIndex: window[0],
          sourceStartTime: 0
        });
        execFileSync("ffmpeg", args, { windowsHide: true, timeout: 120000, stdio: "pipe" });
        const outNames = (await fs.readdir(out)).filter(name => name.endsWith(".png")).sort();
        assert.equal(outNames.length, window.length, `FPS ${fps}: window frame count`);
        const slot = window.indexOf(targetIndex);
        assert.equal(
          sha256(path.join(out, outNames[slot])),
          sha256(path.join(fullDir, `frame_${String(targetIndex).padStart(6, "0")}.png`)),
          `FPS ${fps}: seeked window must match full-decode source frame ${targetIndex}`
        );
      }
    }

    // Also verify sources whose first video PTS is not zero. FFmpeg input -ss
    // is relative to the stream start_time, while copyts preserves absolute PTS.
    const shiftedPath = path.join(tmp, "shifted-start.mkv");
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-xerror", "-y",
      "-itsoffset", "0.5", "-i", fixture, "-map", "0:v:0", "-c:v", "copy",
      "-avoid_negative_ts", "disabled", shiftedPath
    ], { windowsHide: true, timeout: 120000, stdio: "pipe" });
    const shiftedProbe = execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=start_time",
      "-of", "default=noprint_wrappers=1:nokey=1", shiftedPath
    ], { encoding: "utf8", windowsHide: true });
    const shiftedStartTime = Number(shiftedProbe.trim());
    assert.ok(shiftedStartTime > 0.49 && shiftedStartTime < 0.51, `expected nonzero source start_time, got ${shiftedStartTime}`);
    const shiftedFullDir = path.join(tmp, "shifted_full");
    const shiftedWindowDir = path.join(tmp, "shifted_window");
    await fs.mkdir(shiftedFullDir);
    await fs.mkdir(shiftedWindowDir);
    const shiftedFps = 24;
    const shiftedTarget = 139;
    const shiftedWindow = selectSourceFrameWindow(Array.from({ length: 7 * shiftedFps }, (_, index) => index), shiftedTarget, 24, 2);
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-xerror", "-y", "-i", shiftedPath,
      "-map", "0:v:0", "-vf", `setpts=PTS-STARTPTS,fps=fps=${shiftedFps}:start_time=0:round=near`,
      "-fps_mode", "passthrough", "-start_number", "0", "-f", "image2", path.join(shiftedFullDir, "frame_%06d.png")
    ], { windowsHide: true, timeout: 120000, stdio: "pipe" });
    const shiftedArgs = buildSourceFrameExtractionFfmpegArgs({
      inputPath: shiftedPath,
      outputPattern: path.join(shiftedWindowDir, "frame_%06d.png"),
      fps: shiftedFps,
      frameIndices: shiftedWindow,
      seekStartIndex: shiftedWindow[0],
      sourceStartTime: shiftedStartTime
    });
    execFileSync("ffmpeg", shiftedArgs, { windowsHide: true, timeout: 120000, stdio: "pipe" });
    const shiftedNames = (await fs.readdir(shiftedWindowDir)).filter(name => name.endsWith(".png")).sort();
    const shiftedSlot = shiftedWindow.indexOf(shiftedTarget);
    assert.equal(sha256(path.join(shiftedWindowDir, shiftedNames[shiftedSlot])),
      sha256(path.join(shiftedFullDir, `frame_${String(shiftedTarget).padStart(6, "0")}.png`)),
      "nonzero source start_time must preserve the exact CFR frame after a lazy seek");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("disk-backed source videos larger than 128 MiB are decoded by path without buffering the source in renderer", { skip: !hasSyntheticFixtureSupport }, async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-large-source-test-"));
  const sourcePath = path.join(tmp, "source-over-128m.mp4");
  const outputPath = path.join(tmp, "selected", "frame_%06d.png");
  await fs.mkdir(path.dirname(outputPath));
  try {
    await fs.copyFile(fixture, sourcePath);
    const handle = await fs.open(sourcePath, "r+");
    try { await handle.truncate(136314880); } finally { await handle.close(); }
    const stat = await fs.stat(sourcePath);
    assert.ok(stat.size > 128 * 1024 * 1024);
    const info = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height", "-of", "json", sourcePath], { encoding: "utf8", windowsHide: true });
    assert.match(info, /video/);
    const args = buildSourceFrameExtractionFfmpegArgs({ inputPath: sourcePath, outputPattern: outputPath, fps: 30, frameIndices: [0] });
    execFileSync("ffmpeg", args, { windowsHide: true, timeout: 120000, stdio: "pipe" });
    const outputs = await fs.readdir(path.dirname(outputPath));
    assert.deepEqual(outputs, ["frame_000000.png"]);
    const pngStat = await fs.stat(path.join(path.dirname(outputPath), outputs[0]));
    assert.ok(pngStat.size > 8);

    // Embedded audio from the same >128 MiB source is extracted by FFmpeg path,
    // not by reading the entire source file into renderer memory.
    const audioPath = path.join(tmp, "embedded-audio.wav");
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-xerror", "-y",
      "-i", sourcePath, "-map", "0:a:0", "-vn", "-ac", "2", "-ar", "48000",
      "-c:a", "pcm_s16le", "-f", "wav", audioPath
    ], { windowsHide: true, timeout: 120000, stdio: "pipe" });
    const audioStat = await fs.stat(audioPath);
    assert.ok(audioStat.size > 44);
    const audioProbe = execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name,sample_rate,channels,duration",
      "-of", "default=noprint_wrappers=1", audioPath
    ], { encoding: "utf8", windowsHide: true });
    assert.match(audioProbe, /codec_name=pcm_s16le/);
    assert.match(audioProbe, /sample_rate=48000/);
    assert.match(audioProbe, /channels=2/);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});


test("lazy source-frame windows decode exact CFR source indices without preparing the whole source at once", { skip: !hasSyntheticFixtureSupport }, async () => {
  const { selectSourceFrameWindow } = require("../electron/source-frame-cache.cjs");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "montazhnaya-source-window-test-"));
  const fullDir = path.join(tmp, "full");
  const windowDir = path.join(tmp, "windows");
  await fs.mkdir(fullDir);
  await fs.mkdir(windowDir);
  const frameIndices = Array.from({ length: 210 }, (_, index) => index);
  const requested = [0, 61, 137, 209];
  try {
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-xerror", "-y", "-i", fixture,
      "-map", "0:v:0", "-vf", "setpts=PTS-STARTPTS,fps=fps=30:start_time=0:round=near",
      "-fps_mode", "passthrough", "-start_number", "0", "-f", "image2", path.join(fullDir, "frame_%06d.png")
    ], { windowsHide: true, timeout: 120000, stdio: "pipe" });

    for (let windowIndex = 0; windowIndex < requested.length; windowIndex++) {
      const targetIndex = requested[windowIndex];
      const window = selectSourceFrameWindow(frameIndices, targetIndex, 24, 2);
      assert.ok(window.includes(targetIndex));
      assert.ok(window.length <= 24);
      const outputDir = path.join(windowDir, `window_${windowIndex}`);
      await fs.mkdir(outputDir);
      const args = buildSourceFrameExtractionFfmpegArgs({
        inputPath: fixture,
        outputPattern: path.join(outputDir, "frame_%06d.png"),
        fps: 30,
        frameIndices: window,
        seekStartIndex: window[0],
        sourceStartTime: 0
      });
      execFileSync("ffmpeg", args, { windowsHide: true, timeout: 120000, stdio: "pipe" });
      const outputNames = (await fs.readdir(outputDir)).filter(name => name.endsWith(".png")).sort();
      assert.equal(outputNames.length, window.length);
      const slot = window.indexOf(targetIndex);
      assert.equal(
        sha256(path.join(outputDir, outputNames[slot])),
        sha256(path.join(fullDir, `frame_${String(targetIndex).padStart(6, "0")}.png`)),
        `lazy window must return exact source CFR frame ${targetIndex}`
      );
    }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
