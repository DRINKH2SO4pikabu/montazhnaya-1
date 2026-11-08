"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function loadNotificationRuntime() {
  const window = {};
  const context = { window };
  vm.createContext(context);
  const files = [
    "manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js",
    "semantic.js", "beginner-tour.js", "notifications.js", "international.js", "cis.js", "editorial-overrides.js"
  ];
  for (const file of files) {
    vm.runInContext(read(`src/renderer/locales/${file}`), context, { filename: file });
  }
  for (const locale of window.MontazhnayaLocaleManifest.available) {
    window.MontazhnayaNotificationCatalog.augmentLocale(locale.code);
  }
  return window;
}
const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(match => match[1]).sort();

test("notification catalog loads with all 36 locale packs in the real renderer order", () => {
  const window = loadNotificationRuntime();
  assert.equal(window.MontazhnayaLocaleManifest.available.length, 36);
  assert.equal(Object.keys(window.MontazhnayaLocaleSourceMessages).length, 436);
  assert.ok(Object.keys(window.MontazhnayaLocalePacks.en.messages).length > 436, "guide copy is appended only after the canonical source snapshot");
  assert.equal(window.MontazhnayaNotificationCatalog.entries.length, 303);
});

test("every notification and error has a unique permanent key and an English fallback", () => {
  const window = loadNotificationRuntime();
  const entries = window.MontazhnayaNotificationCatalog.entries;
  const keys = entries.map(entry => entry.key);
  const sources = entries.map(entry => entry.source);
  assert.equal(new Set(keys).size, entries.length);
  assert.equal(new Set(sources).size, entries.length);
  for (const entry of entries) {
    assert.match(entry.key, /^(notification|error|dialog|status|tooltip|profile|slideshow)\.[A-Za-z0-9.]+$/);
    assert.ok(entry.source.trim(), `${entry.key}: empty Russian source`);
    assert.ok(entry.en.trim(), `${entry.key}: empty English fallback`);
    assert.deepEqual(placeholders(entry.en), placeholders(entry.source), `${entry.key}: placeholders differ`);
  }
});

test("Russian and English have full message coverage; other locales use explicit English fallback", () => {
  const window = loadNotificationRuntime();
  const total = window.MontazhnayaNotificationCatalog.entries.length;
  for (const { code } of window.MontazhnayaLocaleManifest.available) {
    const coverage = window.MontazhnayaNotificationCatalog.coverage(code);
    assert.equal(coverage.total, total, `${code}: wrong catalog total`);
    assert.equal(coverage.translated + coverage.englishFallback, total, `${code}: coverage does not add up`);
    if (code === "ru" || code === "en") assert.equal(coverage.englishFallback, 0, `${code} must be complete`);
    else assert.ok(coverage.translated > 0, `${code}: expected existing local translations`);
  }
});

test("timeline marker tooltip has an explicit translation in all 36 locale variants", () => {
  const window = loadNotificationRuntime();
  const entry = window.MontazhnayaNotificationCatalog.entries.find(item => item.key === "tooltip.timeline.marker");
  assert.ok(entry, "Timeline marker tooltip entry must exist");
  const locales = window.MontazhnayaLocaleManifest.available;
  const previewCodes = locales.filter(({ code }) => code !== "ru" && code !== "en").map(({ code }) => code).sort();
  const translationCodes = Object.keys(entry.translations);
  assert.equal(translationCodes.length, previewCodes.length, "every preview locale must have exactly one tooltip translation");
  for (const code of previewCodes) {
    assert.ok(translationCodes.includes(code), code + ": explicit marker tooltip translation is missing");
  }
  for (const code of translationCodes) {
    assert.ok(previewCodes.includes(code), code + ": unexpected marker tooltip translation locale");
  }

  for (const { code } of locales) {
    const actual = window.MontazhnayaSemanticCatalog[code]?.messages?.[entry.key];
    const expected = code === "ru" ? entry.source : code === "en" ? entry.en : entry.translations[code];
    assert.equal(actual, expected, code + ": timeline marker tooltip must not fall back to another language");
    assert.ok(typeof actual === "string" && actual.trim(), code + ": timeline marker tooltip must be non-empty");
  }
});

test("resolver maps dynamic notifications to semantic IDs and keeps interpolation values intact", () => {
  const window = loadNotificationRuntime();
  const resolve = window.MontazhnayaNotificationCatalog.resolve;
  const marker = resolve("Маркер добавлен: Сцена 1 · 00:00:03:12");
  assert.equal(marker.key, "notification.marker.created");
  assert.equal(marker.values.name, "Сцена 1");
  assert.equal(marker.values.timecode, "00:00:03:12");
  const saveError = resolve("Не удалось сохранить проект: EACCES: permission denied");
  assert.equal(saveError.key, "notification.project.saveFailed");
  assert.equal(saveError.values.error, "EACCES: permission denied");
  const transition = resolve("Растворение · вход · 0,75 с");
  assert.equal(transition.key, "notification.transition.applied");
  assert.equal(transition.values.side, "in");
  assert.equal(transition.values.duration, 0.75);
  const exportDone = resolve("Экспорт MP4 завершён: montage.mp4");
  assert.equal(exportDone.key, "notification.export.completedFormat");
  assert.equal(exportDone.values.format, "MP4");
  assert.equal(exportDone.values.file, "montage.mp4");
});

test("renderer converts literal notifications to key-based calls and resolves dynamic text before legacy matching", () => {
  const html = read("src/renderer/index.html");
  assert.match(html, /function localizedDynamicText\(message\)/);
  assert.match(html, /function toastKey\(key, values, kind\)/);
  assert.match(html, /uiT\(message\.__i18nKey, message\.values \|\| \{\}\)/);
  assert.ok((html.match(/toastKey\("(?:notification|error|dialog)\./g) || []).length >= 145);
  for (const phrase of ["Следующего маркера нет", "Предыдущего маркера нет", "Ripple-удаление выполнено"]) {
    assert.ok(html.includes(phrase) || html.includes("notification.marker.nextMissing"), `Missing migration for ${phrase}`);
  }
});

test("contextual help and the guided tour localize every generated title, label, body and button", () => {
  const html = read("src/renderer/index.html");
  const help = html.slice(html.indexOf("function buildFunctionHelpContent"), html.indexOf("function positionFunctionHelp"));
  for (const token of ["uiText(def.title", "uiText(label)", "uiText(text)", "uiText(def.tip)", "uiText('Подсказка простыми словами')"]) {
    assert.ok(help.includes(token), `Context help is missing ${token}`);
  }
  const tour = html.slice(html.indexOf("function beginnerTourRender"), html.indexOf("function beginnerTourShow"));
  for (const token of ["uiT(`${step.key}.title`)", "uiT(`${step.key}.body`)", "uiT(`${step.key}.tip`)", "uiText('Позже')", "uiText('Пропустить')", "uiText('Начать знакомство')"]) {
    assert.ok(tour.includes(token), `Guided tour is missing ${token}`);
  }
  const loader = read("src/renderer/i18n.js");
  assert.match(loader, /MontazhnayaNotificationCatalog\?\.augmentLocale\?\.\(locale\)/);
});

test("canonical English dictionary snapshot is loaded before guide additions and locale builders use it", () => {
  const html = read("src/renderer/index.html");
  assert.ok(html.indexOf("./locales/en.js") < html.indexOf("./locales/source-messages.js"));
  assert.ok(html.indexOf("./locales/source-messages.js") < html.indexOf("./locales/guides-en.js"));
  const international = read("src/renderer/locales/international.js");
  const cis = read("src/renderer/locales/cis.js");
  assert.match(international, /MontazhnayaLocaleSourceMessages/);
  assert.match(cis, /MontazhnayaLocaleSourceMessages/);
});


test("all statically referenced toast keys exist in the semantic or notification catalog", () => {
  const window = loadNotificationRuntime();
  const html = read("src/renderer/index.html");
  const semantic = window.MontazhnayaSemanticCatalog || {};
  const known = new Set(window.MontazhnayaNotificationCatalog.entries.map(entry => entry.key));
  for (const locale of Object.values(semantic)) {
    for (const key of Object.keys(locale.messages || {})) known.add(key);
  }
  const referenced = [
    ...[...html.matchAll(/toastKey\("([a-zA-Z0-9_.]+)"/g)].map(match => match[1]),
    ...[...html.matchAll(/uiT\("((?:status|tooltip|profile|slideshow|dialog)\.[a-zA-Z0-9_.]+)"/g)].map(match => match[1])
  ];
  assert.ok(referenced.length >= 185, `Expected broad stable-key coverage, found ${referenced.length}`);
  for (const key of referenced) assert.ok(known.has(key), `Unknown toast key: ${key}`);
});

test("slideshow and autosave messages use semantic IDs and locale-aware units", () => {
  const html = read("src/renderer/index.html");
  assert.match(html, /notification\.slideshow\.created/);
  assert.match(html, /notification\.slideshow\.videoLongerThanMusic/);
  assert.match(html, /dialog\.autosave\.recoveryPrompt/);
  const duration = html.slice(html.indexOf("function slideshowFormatDuration"), html.indexOf("function ", html.indexOf("function slideshowFormatDuration") + 12));
  assert.match(duration, /style: "unit"/);
  assert.match(duration, /unitDisplay: "short"/);
});

test("export progress, timeline labels, and custom-profile text use permanent keys", () => {
  const html = read("src/renderer/index.html");
  const required = [
    "status.export.ready", "status.export.invalidRange", "status.export.preparing",
    "status.export.decodingAudio", "status.export.preparingVideo", "status.export.finalizing",
    "status.export.registeringSource", "status.export.streamingFrames", "status.export.encodingProgress",
    "status.export.completeSummary", "status.export.profileSummary", "status.export.renderStats",
    "status.timeline.tracks", "tooltip.timeline.marker", "profile.custom",
    "slideshow.order.timeline", "slideshow.order.mediaLibrary", "dialog.frame.save.preparing"
  ];
  for (const key of required) assert.ok(html.includes(`uiT("${key}"`), `Missing permanent key use: ${key}`);
  const rawExportStatuses = html.split("\n").filter(line => /status\.textContent\s*(?:=|\+=).*?[А-Яа-яЁё]/u.test(line));
  assert.deepEqual(rawExportStatuses, [], `Raw Russian export status remains: ${rawExportStatuses.join(" | ")}`);
});

test("export confirmation dialogs and diagnostic report use permanent localized keys", () => {
  const html = read("src/renderer/index.html");
  const required = [
    "dialog.export.closeRunning.title", "dialog.export.preflightErrors.title",
    "dialog.export.preflightWarnings.heading", "dialog.export.audioFallback.title",
    "dialog.export.droppedFrames.body", "dialog.export.frameSequenceWarning",
    "dialog.export.realtimeWarning", "dialog.media.clearAll.title",
    "dialog.timeline.clear.title", "dialog.project.unsavedChanges.body",
    "dialog.project.diagnostics.mediaCount", "dialog.project.diagnostics.truncated"
  ];
  for (const key of required) assert.ok(html.includes(`uiT("${key}"`), `Missing localized dialog key: ${key}`);
});

test("legacy toast wrapper is not used for raw Russian literal messages", () => {
  const html = read("src/renderer/index.html");
  const calls = html.split("\n").filter(line => /\btoast\(/.test(line) && !/function toast\(/.test(line) && !/return toast\(/.test(line));
  assert.equal(calls.length, 1, `Expected one prepared semantic message with preserved filenames, found: ${calls.join(" | ")}`);
  assert.match(calls[0], /status\.media\.imported/);
});

test("contextual-help chrome labels have explicit translations in all 36 locales", () => {
  const window = loadNotificationRuntime();
  const required = [
    "Подсказка простыми словами",
    "Подсказка",
    "Что делает",
    "Что нажать",
    "Совет: ",
    "Можно нажать на клавиатуре"
  ];
  assert.equal(window.MontazhnayaLocaleManifest.available.length, 36);
  for (const { code } of window.MontazhnayaLocaleManifest.available) {
    const pack = window.MontazhnayaApplyEditorialOverrides(code);
    assert.ok(pack && pack.messages, code + ": locale pack is available");
    for (const source of required) {
      const translated = pack.tooltipUiLabels[source];
      assert.ok(typeof translated === "string" && translated.trim(), code + ": missing help label " + source);
      if (code !== "ru") assert.notEqual(translated, source, code + ": untranslated help label " + source);
      assert.equal(Object.prototype.hasOwnProperty.call(pack.messages, source), false,
        code + ": contextual-help chrome must stay outside the canonical message dictionary");
    }
    assert.equal(pack.tooltipUiLabelCount, required.length, code + ": wrong contextual-help label count");
  }
  const runtime = read("src/renderer/i18n.js");
  assert.match(runtime, /let activeTooltipUiLabels = Object\.create\(null\)/);
  assert.match(runtime, /translateWith\(source, activeTooltipUiLabels, \[\]\)/);
  assert.match(runtime, /activeTooltipUiLabels = pack\.tooltipUiLabels/);
});

test("tooltip GUI audit validates rendered translations, real document direction and numeric render totals", () => {
  const audit = read("qa/tooltip-gui-audit.cjs");
  assert.match(audit, /result\.expectedDirection !== result\.direction/);
  assert.match(audit, /String\(qa\.uiText\(value\)\|\|''\)/);
  assert.match(audit, /totalRenderedHelpSamples \+= result\.samples\.length/);
  assert.match(audit, /totalViewportChecks \+= result\.samples\.length \+ result\.renderedTooltipFragments/);
  assert.match(audit, /node\.scrollHeight>node\.clientHeight\+4/);
  assert.match(audit, /pop\.scrollHeight>pop\.clientHeight\+4/);
});
