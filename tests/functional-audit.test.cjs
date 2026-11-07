const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const rendererHtml = fs.readFileSync(path.join(root, 'src/renderer/index.html'), 'utf8');
const mainSource = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const preloadSource = fs.readFileSync(path.join(root, 'electron/preload.cjs'), 'utf8');
const tooltipSource = fs.readFileSync(path.join(root, 'src/renderer/locales/tooltip-source.js'), 'utf8');

test('the editor markup contains no duplicate element IDs', () => {
  const ids = [...rendererHtml.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], [], 'duplicate IDs make labels, controls and event lookups ambiguous');
});

test('every data-action has one dispatcher case and no orphan dispatcher cases remain', () => {
  const actions = new Set([...rendererHtml.matchAll(/data-action=["']([^"']+)["']/g)].map(match => match[1]));
  const dispatcherStart = rendererHtml.indexOf('function handleAction');
  assert.notEqual(dispatcherStart, -1, 'central action dispatcher should exist');
  const nextFunction = rendererHtml.indexOf('\nfunction ', dispatcherStart + 10);
  const dispatcher = rendererHtml.slice(dispatcherStart, nextFunction === -1 ? undefined : nextFunction);
  const cases = new Set([...dispatcher.matchAll(/case\s+["']([^"']+)["']/g)].map(match => match[1]));
  assert.deepEqual([...actions].filter(action => !cases.has(action)), [], 'visible controls must resolve to a handler');
  assert.deepEqual([...cases].filter(action => !actions.has(action)), [], 'dispatcher must not retain dead command aliases');
});

test('retired export UI and unreachable legacy conversion paths stay removed', () => {
  const combined = rendererHtml + '\n' + mainSource + '\n' + preloadSource;
  for (const symbol of [
    'findClipAt',
    'ffmpegLocalPanel',
    'acceptLocalFFmpegFiles',
    'convertToMp4',
    'startSequentialFrameLoop',
    'convertWebmToMp4',
    'prepareVideoForExport',
    'localMp4ExportActive',
    'captureDiagnostics'
  ]) {
    assert.equal(combined.includes(symbol), false, `${symbol} is retired and must not silently return`);
  }
});

test('transition catalog and visible fallback counter agree', () => {
  const catalogStart = rendererHtml.indexOf('const TRANSITION_CATALOG = [');
  const catalogEnd = rendererHtml.indexOf('\n];', catalogStart);
  assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, 'transition catalog should be declared');
  const catalog = rendererHtml.slice(catalogStart, catalogEnd);
  const count = [...catalog.matchAll(/\{\s*mode:\s*["'][^"']+["']/g)].length;
  assert.equal(count, 21);
  assert.match(rendererHtml, /id="transitionCount">21</, 'initial UI count must match the registry');
});

test('local MP4 and WebM use deterministic FFmpeg routes without MediaRecorder gating', () => {
  const exporterStart = rendererHtml.indexOf('const Exporter =');
  const detectStart = rendererHtml.indexOf('  detectFormats() {', exporterStart);
  const openStart = rendererHtml.indexOf('  async open() {', detectStart);
  const openEnd = rendererHtml.indexOf('  updateWarning() {', openStart);
  const startStart = rendererHtml.indexOf('  async start() {', openEnd);
  assert.ok(exporterStart >= 0 && detectStart > exporterStart && openStart > detectStart && openEnd > openStart && startStart > openEnd);
  const openMethod = rendererHtml.slice(openStart, openEnd);
  const detectMethod = rendererHtml.slice(detectStart, openStart);
  const startMethod = rendererHtml.slice(startStart, rendererHtml.indexOf('  async sourceFrameIndexForTime', startStart));
  assert.doesNotMatch(openMethod, /typeof MediaRecorder/, 'opening the dialog must not block local FFmpeg routes');
  assert.match(detectMethod, /mp4-ffmpeg/);
  assert.match(detectMethod, /webm-ffmpeg-vp8/);
  assert.match(detectMethod, /webm-ffmpeg-vp9/);
  assert.match(detectMethod, /getFrameSequenceExportCapabilities/);
  assert.match(startMethod, /const selectedFrameSequenceFormat = this\.isFrameSequenceFormat\(fmtValue\)/);
  assert.match(startMethod, /if \(!selectedFrameSequenceFormat && typeof MediaRecorder === "undefined"\)/,
    'MediaRecorder must only be required for realtime browser formats');
  assert.match(startMethod, /this\.exportPngSequenceToMp4\(filename, fmt, bitrate\)/,
    'local MP4 and WebM variants must use the deterministic FFmpeg frame pipeline');
  assert.match(detectMethod, /FPS не гарантирован/,
    'browser fallbacks must be explicitly labeled as realtime and not CFR-guaranteed');
});

test('realtime dropped-frame confirmation is shown once, not repeated after download', () => {
  const startStart = rendererHtml.indexOf('  async start() {', rendererHtml.indexOf('const Exporter ='));
  const methodEnd = rendererHtml.indexOf('  async sourceFrameIndexForTime', startStart);
  const startMethod = rendererHtml.slice(startStart, methodEnd);
  assert.equal((startMethod.match(/dialog\.export\.droppedFrames\.title/g) || []).length, 1);
  assert.doesNotMatch(startMethod, /toast\("ВНИМАНИЕ: цикл рендеринга пропустил/,
    'the accepted export must not repeat the same warning in a second toast');
});

test('every registered transition mode has a renderer branch', () => {
  const catalogStart = rendererHtml.indexOf('const TRANSITION_CATALOG = [');
  const catalogEnd = rendererHtml.indexOf('\n];', catalogStart);
  const catalog = rendererHtml.slice(catalogStart, catalogEnd);
  const modes = [...catalog.matchAll(/\{\s*mode:\s*["']([^"']+)["']/g)].map(match => match[1]);
  const applyStart = rendererHtml.indexOf('const applyTransition = (transition, progress, incoming) => {', catalogEnd);
  const applyEnd = rendererHtml.indexOf('\n  const fadeIn =', applyStart);
  const renderLogic = rendererHtml.slice(applyStart, applyEnd);
  assert.equal(modes.length, 21);
  for (const mode of modes) {
    if (mode.startsWith('wipe-')) {
      assert.match(renderLogic, /mode\.startsWith\("wipe-"\)/, `${mode} must have a wipe renderer`);
    } else if (mode.startsWith('slide-')) {
      assert.match(renderLogic, /mode\.startsWith\("slide-"\)/, `${mode} must have a slide renderer`);
    } else if (mode === 'fire-whirl') {
      assert.match(rendererHtml, /function renderFireWhirlPair\(/, 'Fire Whirl must use the shared WebGL sequence compositor');
      assert.match(rendererHtml, /function findActiveFireWhirlPairs\(/, 'Fire Whirl must be paired across two clips');
    } else {
      assert.ok(renderLogic.includes(`mode === "${mode}"`), `${mode} must have an explicit renderer branch`);
    }
  }
});


test('tool diagnostics UI reports MP4 and both local WebM codec smoke tests', () => {
  assert.match(rendererHtml, /smokeCard\("WebM VP8 \+ Opus", smoke\.webmVp8\)/);
  assert.match(rendererHtml, /smokeCard\("WebM VP9 \+ Opus", smoke\.webmVp9\)/);
  assert.match(rendererHtml, /VP8\/VP9\/Opus/);
  assert.match(rendererHtml, /Проверяется наличие FFmpeg и ffprobe/);
});

test('export help and long-project warnings describe local CFR MP4/WebM separately from realtime fallback', () => {
  assert.match(tooltipSource, /WebM VP8 \+ Opus и WebM VP9 \+ Opus кодируются FFmpeg по покадровой временной сетке/,
    'main help must describe deterministic local WebM variants');
  assert.match(tooltipSource, /Браузерный вариант используется только как fallback и помечается «FPS не гарантирован»/,
    'help must disclose the realtime fallback limitation');
  assert.doesNotMatch(rendererHtml, /WebM и встроенный MP4 записываются MediaRecorder в реальном времени/,
    'retired blanket MediaRecorder description must not return');
  const preflightStart = rendererHtml.indexOf('function collectExportPreflight(');
  const preflightEnd = rendererHtml.indexOf('\nfunction toolDiagStatusClass', preflightStart);
  const preflight = rendererHtml.slice(preflightStart, preflightEnd);
  assert.match(preflight, /isRealtimeBrowserFormat/);
  assert.match(preflight, /isLocalFrameSequence/);
  assert.match(preflight, /локальный FFmpeg обрабатывает кадры офлайн/,
    'long offline exports must not be described as browser realtime recording');
});


test('audio import and embedded video probing use FFprobe before Chromium fallback', () => {
  const detectStart = rendererHtml.indexOf('async function detectEmbeddedAudio(media)');
  const detectEnd = rendererHtml.indexOf('\nfunction trackHasIntervalOverlap', detectStart);
  const detectMethod = rendererHtml.slice(detectStart, detectEnd);
  assert.match(mainSource, /hasAudio: false/);
  assert.match(mainSource, /requiresPreviewNormalization: requiresAudioPreviewNormalization/);
  assert.match(mainSource, /audioDuration = wavInfo\.duration/);
  assert.match(detectMethod, /api\.inspectAudioMedia/);
  assert.match(detectMethod, /await ensureEmbeddedAudioPreview\(media\)/);
  assert.match(detectMethod, /Math\.abs\(media\.audioOffsetSeconds\) > 0\.001/);
  assert.match(rendererHtml, /function prepareAudioPreviewFallback\(/);
  assert.match(rendererHtml, /embeddedAudioPreviewUnavailable/);
  assert.match(preloadSource, /inspectAudioMedia:[\s\S]*media:inspect-audio/);
  assert.match(preloadSource, /prepareAudioForExport:[\s\S]*alignToVideo/);
});

test('embedded audio extraction shares the normalized offset-aware WAV pipeline and returns normalized duration', () => {
  const extractStart = mainSource.indexOf('async function handleExtractVideoAudioForExport');
  const extractEnd = mainSource.indexOf('async function handleInspectAudioMedia', extractStart);
  const extract = mainSource.slice(extractStart, extractEnd);
  assert.match(extract, /buildPcmWavNormalizeArgs\(filePath, outputPath/);
  assert.match(extract, /startOffsetSeconds: offset/);
  assert.match(extract, /const audioDuration = wavInfo\.duration/);
  assert.match(extract, /sourceAudioDuration:/);
  const collectStart = rendererHtml.indexOf('  async collectOfflineAudioSources()');
  const collectEnd = rendererHtml.indexOf('  async prepareVideoElements()', collectStart);
  const collect = rendererHtml.slice(collectStart, collectEnd);
  assert.match(collect, /!clip\.audioMutedBySplit/);
  assert.match(collect, /audioOnlyFromVideo/);
  assert.match(collect, /sources\.push\(\{ track, clip, media \}\)/);
});

test('audio crossfades use equal-power gains and are sampled in realtime and offline renderers', () => {
  assert.match(rendererHtml, /function isIntentionalAudioCrossfadeOverlap\(/);
  assert.match(rendererHtml, /function audioCrossfadeFactorForClip\(/);
  assert.match(rendererHtml, /Math\.sin\(progress \* Math\.PI \/ 2\)/);
  assert.match(rendererHtml, /Math\.cos\(progress \* Math\.PI \/ 2\)/);
  const playbackStart = rendererHtml.indexOf('  startAudioPlayback() {');
  const playbackEnd = rendererHtml.indexOf('  async renderOfflineAudioMix()', playbackStart);
  const playback = rendererHtml.slice(playbackStart, playbackEnd);
  assert.match(playback, /audioCrossfadeInEnd/);
  assert.match(playback, /audioCrossfadeOutStart/);
  const offlineStart = rendererHtml.indexOf('  async renderOfflineAudioMix()');
  const offlineEnd = rendererHtml.indexOf('  async ', offlineStart + 10);
  const offline = rendererHtml.slice(offlineStart, offlineEnd);
  assert.match(offline, /audioCrossfadeFactorForClip/);
  assert.match(offline, /audioCrossfadeInEnd/);
  assert.match(offline, /audioCrossfadeOutStart/);
  assert.match(rendererHtml, /Перекрёстное затухание с предыдущим/);
  assert.match(rendererHtml, /audioCrossfadeIn: Number\(c\.audioCrossfadeIn\)/);
});


test('contextual tooltip popovers respect RTL reading direction and isolate keyboard shortcuts', () => {
  assert.match(rendererHtml, /const isRtl\s*=\s*document\.documentElement\.dir\s*===\s*'rtl'/);
  assert.match(rendererHtml, /html\[dir="rtl"\]\s+#functionHelpPopover\s*\{[^}]*transform-origin:top right;/s);
  assert.match(rendererHtml, /html\[dir="rtl"\]\s+\.fhelp-tip\s*\{[^}]*border-right:2px solid #68aaff;/s);
  assert.match(rendererHtml, /\.fhelp-key\s*\{[^}]*direction:ltr;[^}]*unicode-bidi:isolate;/s);
  assert.match(rendererHtml, /\.sequence-marker \.marker-tooltip\s*\{[^}]*white-space:normal;[^}]*overflow-wrap:anywhere;/s);
});


test('marker tooltips are rendered outside the clipped ruler and remain viewport-positioned', () => {
  assert.match(rendererHtml, /sequenceMarkerTooltipPortal/);
  assert.match(rendererHtml, /document\.body\.appendChild\(pop\)/);
  assert.match(rendererHtml, /\.sequence-marker-tooltip-portal\s*\{[^}]*position:fixed;[^}]*overflow:auto;/s);
  assert.doesNotMatch(rendererHtml, /button\.appendChild\(tooltip\)/);
  assert.match(rendererHtml, /document\.addEventListener\("scroll",[\s\S]*?positionSequenceMarkerTooltip/);
});
