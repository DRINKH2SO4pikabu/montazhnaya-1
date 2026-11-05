"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  MAX_STILL_FRAME_BYTES,
  MAX_STILL_FRAME_PIXELS,
  sanitizeStillFrameName,
  validateStillFrameRequest,
  validateStillFramePayload,
  resolveStillFrameOutputPath
} = require("../electron/still-frame.cjs");

const root = path.join(__dirname, "..");
const renderer = fs.readFileSync(path.join(root, "src/renderer/index.html"), "utf8");
const preload = fs.readFileSync(path.join(root, "electron/preload.cjs"), "utf8");
const main = fs.readFileSync(path.join(root, "electron/main.cjs"), "utf8");
const staged = fs.readFileSync(path.join(root, "electron/staged-file.cjs"), "utf8");

function validRequest(overrides = {}) {
  return {
    stageToken: "stage-token-123",
    suggestedName: "Montazhnaya_frame_000001_0000000033ms",
    format: "png",
    mimeType: "image/png",
    width: 1280,
    height: 720,
    timeSeconds: 1 / 30,
    frameNumber: 1,
    ...overrides
  };
}

test("still-frame request validates PNG/JPEG, dimensions, position and staged source", () => {
  assert.deepEqual(validateStillFrameRequest(validRequest()), {
    format: "png", mimeType: "image/png", extension: ".png", width: 1280,
    height: 720, timeSeconds: 1 / 30, frameNumber: 1,
    suggestedName: "Montazhnaya_frame_000001_0000000033ms"
  });
  const jpeg = validateStillFrameRequest(validRequest({ format: "jpeg", mimeType: "image/jpeg" }));
  assert.equal(jpeg.extension, ".jpg");
  assert.throws(() => validateStillFrameRequest(validRequest({ mimeType: "image/jpeg" })), /не соответствует/);
  assert.throws(() => validateStillFrameRequest(validRequest({ stageToken: "" })), /идентификатор/);
  assert.throws(() => validateStillFrameRequest(validRequest({ width: 16385 })), /Размер кадра/);
  assert.throws(() => validateStillFrameRequest(validRequest({ width: 10001, height: 10001 })), /100 мегапикселей/);
  assert.throws(() => validateStillFrameRequest(validRequest({ timeSeconds: -1 })), /позиция или номер/);
});

test("still-frame names are safe for Windows paths and have a fallback", () => {
  assert.equal(sanitizeStillFrameName('bad:name\\shot?.png'), "bad_name_shot_.png");
  assert.equal(sanitizeStillFrameName("...   "), "montazhnaya_frame");
  assert.ok(sanitizeStillFrameName("x".repeat(200)).length <= 120);
});

test("PNG and JPEG payload signatures and maximum size are verified", () => {
  const pngHead = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.deepEqual(validateStillFramePayload("png", 128, pngHead, Buffer.from([0, 0])), {
    size: 128, format: "png", mimeType: "image/png"
  });
  assert.deepEqual(validateStillFramePayload("jpeg", 128, Buffer.from([0xff, 0xd8, 0xff]), Buffer.from([0xff, 0xd9])), {
    size: 128, format: "jpeg", mimeType: "image/jpeg"
  });
  assert.throws(() => validateStillFramePayload("png", 128, Buffer.from("not png"), Buffer.alloc(2)), /PNG/);
  assert.throws(() => validateStillFramePayload("jpeg", 128, Buffer.from([0, 1, 2]), Buffer.from([0, 0])), /JPEG/);
  assert.throws(() => validateStillFramePayload("png", MAX_STILL_FRAME_BYTES + 1, pngHead, Buffer.alloc(2)), /Размер изображения/);
  assert.ok(MAX_STILL_FRAME_PIXELS >= 100_000_000);
});

test("selected frame save path always matches requested image format", () => {
  assert.equal(resolveStillFrameOutputPath("C:\\Pictures\\frame.png", "png"), "C:\\Pictures\\frame.png");
  assert.equal(resolveStillFrameOutputPath("C:\\Pictures\\frame.jpeg", "jpeg"), "C:\\Pictures\\frame.jpeg");
  assert.equal(resolveStillFrameOutputPath("C:\\Pictures\\frame.tmp", "png"), "C:\\Pictures\\frame.png");
  assert.equal(resolveStillFrameOutputPath("C:\\Pictures\\frame", "jpeg"), "C:\\Pictures\\frame.jpg");
  assert.throws(() => resolveStillFrameOutputPath("relative.png", "png"), /папка сохранения/);
});

test("File menu and preview context menu expose save-current-frame action", () => {
  assert.match(renderer, /data-action="save-current-frame"/);
  assert.match(renderer, /previewCanvas\.addEventListener\("contextmenu"/);
  assert.match(renderer, /Сохранить текущий кадр…/);
  assert.match(renderer, /case "save-current-frame": openSaveCurrentFrameDialog\(\)/);
});

test("saving a frame waits for visible image assets as well as video frames", () => {
  assert.match(renderer, /function waitForPreviewImage\(image\)/);
  assert.match(renderer, /waits\.push\(waitForPreviewImage\(Preview\.getImage\(media\)\)\)/);
  assert.match(renderer, /Истекло время ожидания загрузки изображения/);
});

test("frame export renders the shared compositor without editor-only guides", () => {
  assert.match(renderer, /renderSequenceAtTime\(timeSeconds, outputContext, outputCanvas, Preview\.clipVideoEls\)/);
  assert.match(renderer, /same project compositor draws every visible track, transition, color/);
  assert.match(renderer, /outputCanvas\.getContext\("2d", \{ alpha: false, colorSpace: "srgb" \}\)/);
  assert.match(renderer, /canvas\.toBlob\(blob =>/);
  assert.match(renderer, /getStillFrameDimensions\("uhd"|preset === "uhd"/);
  assert.match(renderer, /quality: Number\(qualityInput\.value\) \/ 100/);
  assert.match(renderer, /waitForCurrentPreviewFrame\(timeSeconds\)/);
});

test("still-frame saving uses bounded staged IPC and trusted main-process save dialog", () => {
  assert.match(preload, /saveStillFrame:[\s\S]*?withSourceFileReference\([\s\S]*?frame:save-still/);
  assert.match(preload, /blob:\s*request\s*&&\s*request\.blob|request\s*&&\s*request\.blob/);
  assert.match(main, /registerStructuredIpcHandler\(ipcMain, "frame:save-still", handleSaveStillFrame\)/);
  assert.match(main, /async function handleSaveStillFrame\(event, request\)/);
  assert.match(main, /isTrustedExportSender\(event\)/);
  assert.match(main, /stagedFileManager\.getPath\(event\.sender\.id, request\.stageToken\)/);
  assert.match(main, /dialog\.showSaveDialog\(mainWindow/);
  assert.match(main, /validateStillFramePayload\(settings\.format, stat\.size, firstBytes, lastBytes\)/);
  assert.match(main, /fs\.copyFile\(sourcePath, temporaryPath\)/);
  assert.match(main, /fs\.rename\(temporaryPath, outputPath\)/);
  assert.match(staged, /MAX_STAGED_CHUNK_BYTES = 8 \* 1024 \* 1024/);
});

test("package version is 3.6.45", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
  assert.equal(pkg.version, "3.6.45");
  assert.equal(lock.version, "3.6.45");
  assert.equal(lock.packages[""].version, "3.6.45");
  assert.match(renderer, /Монтажная<span>beta 3\.6\.45<\/span>/);
});
