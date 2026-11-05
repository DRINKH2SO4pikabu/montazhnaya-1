'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function extractBalanced(source, marker, open = '{', close = '}') {
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `Missing source marker: ${marker}`);
  const expressionStart = start + marker.length;
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = expressionStart; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === open) depth++;
    else if (character === close) {
      depth--;
      if (depth === 0) return source.slice(expressionStart, index + 1);
    }
  }
  throw new Error(`Unbalanced expression after ${marker}`);
}

function loadEnglishReferencePack() {
  const context = { window: {} };
  vm.runInNewContext(read('src/renderer/locales/en.js'), context);
  vm.runInNewContext(read('src/renderer/locales/guides-en.js'), context);
  return context.window.MontazhnayaLocalePacks.en.messages;
}

test('renderer registers the supplemental guide pack before starting the i18n runtime', () => {
  const html = read('src/renderer/index.html');
  const en = html.indexOf('./locales/en.js');
  const guides = html.indexOf('./locales/guides-en.js');
  const runtime = html.indexOf('./i18n.js');
  assert.ok(en >= 0 && guides > en && runtime > guides);
});

test('English reference pack covers all instructional help and beginner-tour copy', () => {
  const html = read('src/renderer/index.html');
  const actionsText = extractBalanced(html, 'const UI_HELP_ACTIONS = ');
  const actions = JSON.parse(actionsText);
  const tourText = extractBalanced(html, 'const BEGINNER_TOUR_STEPS = ', '[', ']');
  const context = {};
  vm.runInNewContext(`const BEGINNER_TOUR_STEPS = ${tourText}; this.steps = BEGINNER_TOUR_STEPS;`, context);
  const catalogContext = { window: {} };
  for (const file of ['manifest.js', 'ru.js', 'en.js', 'source-messages.js', 'guides-en.js', 'semantic.js', 'beginner-tour.js']) {
    vm.runInNewContext(read(`src/renderer/locales/${file}`), catalogContext, { filename: file });
  }

  const messages = loadEnglishReferencePack();
  const keyOnlyShortcuts = new Set([
    'Ctrl+O', 'Ctrl+S', 'Ctrl+Shift+S', 'Ctrl+I', 'Ctrl+E', 'Ctrl+Z', 'Ctrl+Y',
    'S', 'Delete', 'Shift+Delete', 'Ctrl+C', 'Ctrl+V', 'Ctrl+D', 'M',
    'Home', '←', 'Space', '→', 'End'
  ]);
  const helpStrings = [...new Set(Object.values(actions).flat())].filter(value => !keyOnlyShortcuts.has(value));
  const missingHelp = helpStrings.filter(value => !Object.prototype.hasOwnProperty.call(messages, value));
  assert.deepEqual(missingHelp, [], `Untranslated help strings: ${missingHelp.join(' | ')}`);

  const idsText = extractBalanced(html, 'const UI_HELP_IDS = ');
  const ids = JSON.parse(idsText);
  const helpIdStrings = [...new Set(Object.values(ids).flat())].filter(value => value !== '');
  const missingHelpIds = helpIdStrings.filter(value => !Object.prototype.hasOwnProperty.call(messages, value));
  assert.deepEqual(missingHelpIds, [], `Untranslated property/control help strings: ${missingHelpIds.join(' | ')}`);

  assert.equal(context.steps.length, 7);
  const englishSemantic = catalogContext.window.MontazhnayaSemanticCatalog.en.messages;
  const tourKeys = context.steps.flatMap(step => [`${step.key}.title`, `${step.key}.body`, `${step.key}.tip`]);
  const missingTour = tourKeys.filter(key => !Object.prototype.hasOwnProperty.call(englishSemantic, key) || !englishSemantic[key]);
  assert.equal(missingTour.length, 0, `Missing permanent beginner-tour keys: ${missingTour.join(' | ')}`);
});

test('native browser prompt, alert and confirm dialogs are removed from the renderer', () => {
  const html = read('src/renderer/index.html');
  assert.doesNotMatch(html, /\bwindow\s*\.\s*(?:prompt|alert|confirm)\s*\(/);
  assert.doesNotMatch(html, /\b(?:prompt|alert|confirm)\s*\(/);
  assert.match(html, /function messageDialog\(/);
  assert.match(html, /function textPromptDialog\(/);
  assert.match(html, /function confirmDialog\(/);
});

test('renderer sends the selected locale and translated host messages to the trusted Electron bridge', () => {
  const runtime = read('src/renderer/i18n.js');
  const preload = read('electron/preload.cjs');
  const main = read('electron/main.cjs');
  assert.match(runtime, /function getHostMessages\(/);
  assert.match(runtime, /function syncHostLocale\(/);
  assert.match(runtime, /setUiLocale\(\{ locale: currentLocale, messages, semantic, semanticFallback: fallbackSemanticData \}\)/);
  assert.match(runtime, /currentLocale !== "en" && currentLocale !== "ru"/);
  assert.match(preload, /setUiLocale:\s*\(request\)\s*=>\s*\{/);
  assert.match(preload, /return invokeIpc\("ui:set-locale", request\)/);
  assert.match(preload, /formatSemanticMessage\(activeUiSemantic, activeUiLocale, key, params\)/);
  assert.match(main, /registerStructuredIpcHandler\(ipcMain, "ui:set-locale"/);
  assert.match(main, /if \(!isTrustedExportSender\(event\)\)/);
  assert.match(main, /activeUiLocale = resolveLocale\(/);
  assert.match(main, /activeUiMessages = sanitizeMessages\(/);
});

test('Electron-owned save, warning and close dialogs use locale-aware messages including detail text', () => {
  const main = read('electron/main.cjs');
  assert.match(main, /title:\s*uiText\("Сохранить покадровый \{format\}"/);
  assert.match(main, /title:\s*uiTextKey\("dialog\.frame\.save\.title"\)/);
  assert.match(main, /title:\s*uiText\("Недостаточно места для экспорта"\)/);
  assert.match(main, /detail:\s*uiText\(preflightDetails\)/);
  assert.match(main, /title:\s*uiText\("Закрыть «Монтажную»\?"\)/);
});

test('Electron error and disk-space messages have English reference translations with dynamic placeholders', () => {
  const messages = loadEnglishReferencePack();
  const core = require('../electron/i18n-core.cjs');
  const cases = [
    [
      'Недостаточно места для записи готового видео: свободно {free}, требуется {required} с учётом резерва.',
      'Недостаточно места для записи готового видео: свободно 500 MiB, требуется 2 GiB с учётом резерва.',
      'There is not enough space to write the final video: 500 MiB is free, while 2 GiB is required including the safety reserve.'
    ],
    [
      'Во время экспорта заканчивается место на диске временных файлов: свободно {free}, требуется ещё примерно {required} с учётом оставшихся кадров и резерва. Экспорт остановлен до заполнения диска.',
      'Во время экспорта заканчивается место на диске временных файлов: свободно 1 GiB, требуется ещё примерно 3 GiB с учётом оставшихся кадров и резерва. Экспорт остановлен до заполнения диска.',
      'The temporary disk is running out of space during export: 1 GiB is free, but approximately 3 GiB more is required for the remaining frames and safety reserve. Export stopped before the disk could fill up.'
    ]
  ];
  for (const [pattern, source, expected] of cases) {
    assert.equal(messages[pattern] !== undefined, true, `Missing dynamic message pattern ${pattern}`);
    assert.equal(core.translate(source, messages), expected);
  }
});
