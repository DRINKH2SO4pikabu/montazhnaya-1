"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function loadTourCatalog() {
  const window = {};
  const context = { window };
  vm.createContext(context);
  for (const file of [
    "manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js",
    "semantic.js", "beginner-tour.js", "notifications.js", "ipc-error-translations.js",
    "international.js", "cis.js", "editorial-overrides.js"
  ]) vm.runInContext(read(`src/renderer/locales/${file}`), context, { filename: file });
  for (const locale of window.MontazhnayaLocaleManifest.available) window.MontazhnayaApplyEditorialOverrides?.(locale.code);
  return window;
}

const expectedKeys = Array.from({ length: 7 }, (_, index) => {
  const step = index + 1;
  return [`tour.beginner.step${step}.title`, `tour.beginner.step${step}.body`, `tour.beginner.step${step}.tip`];
}).flat();

test("beginner tour catalog covers all seven steps in all 36 locales", () => {
  const window = loadTourCatalog();
  assert.equal(window.MontazhnayaLocaleManifest.available.length, 36);
  assert.equal(window.MontazhnayaBeginnerTourCatalog.keys.length, 21);
  assert.equal(window.MontazhnayaBeginnerTourCatalog.translationCount, 756);
  for (const locale of window.MontazhnayaLocaleManifest.available) {
    const data = window.MontazhnayaSemanticCatalog[locale.code];
    assert.ok(data, `${locale.code}: semantic data is missing`);
    assert.equal(data.beginnerTourTranslationCount, 21, `${locale.code}: translation count`);
    for (const key of expectedKeys) {
      const value = data.messages[key];
      assert.equal(typeof value, "string", `${locale.code}: ${key} must be a string`);
      assert.ok(value.trim(), `${locale.code}: ${key} must not be empty`);
      if (locale.code !== "en") assert.notEqual(value, window.MontazhnayaSemanticCatalog.en.messages[key], `${locale.code}: ${key} must not fall back to English`);
    }
  }
});

test("beginner-tour instructions use the same localized labels as the actual editor controls", () => {
  const window = loadTourCatalog();
  const checks = [
    ["Импорт медиа", 1, "body"],
    ["Разделить", 4, "body"],
    ["Разделить", 4, "tip"],
    ["Переходы", 6, "body"],
    ["Экспорт", 7, "body"]
  ];
  for (const locale of window.MontazhnayaLocaleManifest.available) {
    const code = locale.code;
    const pack = window.MontazhnayaLocalePacks[code]?.messages || {};
    const messages = window.MontazhnayaSemanticCatalog[code].messages;
    for (const [sourceLabel, step, field] of checks) {
      const label = code === "ru" ? sourceLabel : (pack[sourceLabel] || sourceLabel);
      const instructionalText = messages[`tour.beginner.step${step}.${field}`];
      assert.ok(
        instructionalText.toLocaleLowerCase().includes(label.toLocaleLowerCase()),
        `${code}: step ${step} ${field} should use the editor label “${label}”`
      );
    }
  }
});

test("beginner tour renderer uses permanent semantic IDs instead of source-language prose", () => {
  const html = read("src/renderer/index.html");
  const start = html.indexOf("const BEGINNER_TOUR_STEPS = [");
  const end = html.indexOf("\n];", start) + 3;
  assert.ok(start >= 0 && end > start);
  const stepsSource = html.slice(start, end).replace("const BEGINNER_TOUR_STEPS = ", "");
  const context = {};
  vm.runInNewContext(`this.steps = ${stepsSource};`, context);
  assert.equal(context.steps.length, 7);
  for (let index = 0; index < 7; index++) {
    assert.equal(context.steps[index].key, `tour.beginner.step${index + 1}`);
    assert.ok(context.steps[index].target);
  }
  const renderStart = html.indexOf("function beginnerTourRender()");
  const renderEnd = html.indexOf("function beginnerTourShow", renderStart);
  const render = html.slice(renderStart, renderEnd);
  assert.match(render, /uiT\(`\$\{step\.key\}\.title`\)/);
  assert.match(render, /uiT\(`\$\{step\.key\}\.body`\)/);
  assert.match(render, /uiT\(`\$\{step\.key\}\.tip`\)/);
  assert.doesNotMatch(render, /uiText\(step\.(?:title|text|tip)\)/);
});

test("beginner tour supplemental catalog loads before i18n and the seven-step copy refreshes on locale changes", () => {
  const html = read("src/renderer/index.html");
  const semantic = html.indexOf('./locales/semantic.js');
  const tour = html.indexOf('./locales/beginner-tour.js');
  const notifications = html.indexOf('./locales/notifications.js');
  const i18n = html.indexOf('./i18n.js');
  assert.ok(semantic >= 0 && tour > semantic && notifications > tour && i18n > notifications);
  assert.match(html, /montazhnaya:locale-changed/);
  assert.match(html, /if \(beginnerTourActive\) beginnerTourRender\(\)/);
});

test("tour translations retain safe technical terms and all locale entries are flagged for review", () => {
  const window = loadTourCatalog();
  const codes = window.MontazhnayaLocaleManifest.available.map(item => item.code);
  for (const code of codes) {
    const data = window.MontazhnayaSemanticCatalog[code];
    if (code === "ru") assert.equal(data.beginnerTourTranslationStatus, "source-language");
    else if (code === "en") assert.equal(data.beginnerTourTranslationStatus, "reference-translation");
    else assert.equal(data.beginnerTourTranslationStatus, "machine-assisted-draft-native-speaker-review-pending");
    assert.match(data.messages["tour.beginner.step7.tip"], /FFmpeg/);
    assert.match(data.messages["tour.beginner.step7.tip"], /H\.264\/AAC/);
    assert.match(data.messages["tour.beginner.step7.tip"], /VP8\/VP9/);
  }
});

test("i18n runtime resolves every beginner-tour key in each selected language", async () => {
  const window = { dispatchEvent() {} };
  const document = {
    documentElement: { dataset: {}, lang: "en", dir: "ltr" },
    body: null,
    title: "",
    baseURI: "file:///montazhnaya/src/renderer/index.html"
  };
  const stored = new Map();
  const context = {
    window,
    document,
    navigator: { languages: ["en"], language: "en" },
    localStorage: {
      getItem(key) { return stored.has(key) ? stored.get(key) : null; },
      setItem(key, value) { stored.set(key, String(value)); }
    },
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init?.detail; },
    Intl,
    URL,
    console,
    queueMicrotask
  };
  vm.createContext(context);
  for (const file of [
    "manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js",
    "semantic.js", "beginner-tour.js", "notifications.js", "ipc-error-translations.js",
    "international.js", "cis.js", "editorial-overrides.js"
  ]) vm.runInContext(read(`src/renderer/locales/${file}`), context, { filename: file });
  vm.runInContext(read("src/renderer/i18n.js"), context, { filename: "i18n.js" });

  const api = window.MontazhnayaI18n;
  const locales = window.MontazhnayaLocaleManifest.available;
  for (const locale of locales) {
    await api.setLocale(locale.code);
    assert.equal(api.getLocale(), locale.code, `${locale.code}: runtime did not select the requested locale`);
    for (const key of expectedKeys) {
      assert.equal(api.t(key), window.MontazhnayaSemanticCatalog[locale.code].messages[key], `${locale.code}: runtime returned the wrong value for ${key}`);
      assert.notEqual(api.t(key), key, `${locale.code}: runtime leaked a semantic key for ${key}`);
    }
  }
});


test("stage 8 editorial terms stay consistent between UI labels and beginner-tour copy", () => {
  const window = loadTourCatalog();
  const checks = {
    fr: [["tour.beginner.step3.title", "chronologie"], ["tour.beginner.step3.body", "chronologie"], ["tour.beginner.step4.tip", "chronologie"]],
    ka: [["tour.beginner.step3.title", "დროით ხაზზე"], ["tour.beginner.step3.body", "დროითი ხაზი"], ["tour.beginner.step4.tip", "დროით ხაზზე"]],
    be: [["tour.beginner.step3.title", "шкале часу"], ["tour.beginner.step3.body", "Шкала часу"], ["tour.beginner.step4.tip", "шкале часу"]],
    tr: [["tour.beginner.step3.tip", "Kanallar"]],
    hy: [["tour.beginner.step3.tip", "Շերտերը"]],
    ky: [["tour.beginner.step3.tip", "Тилкелер"]],
    uz: [["tour.beginner.step3.tip", "Yo‘laklar"]],
    "uz-Cyrl": [["tour.beginner.step3.tip", "Йўлаклар"]]
  };
  for (const [locale, entries] of Object.entries(checks)) {
    const messages = window.MontazhnayaSemanticCatalog[locale].messages;
    for (const [key, expectedTerm] of entries) {
      assert.ok(messages[key].includes(expectedTerm), `${locale}/${key} must use ${expectedTerm}`);
    }
  }
  assert.equal(window.MontazhnayaLocalePacks.ka.messages["Таймлайн"], "დროითი ხაზი");
  assert.equal(window.MontazhnayaLocalePacks["uz-Cyrl"].messages["Видеодорожка"], "Видео йўлаги");
  for (const key of expectedKeys) {
    assert.doesNotMatch(window.MontazhnayaSemanticCatalog.ka.messages[key], /[А-Яа-яЁё]/u, `Georgian ${key} must not contain accidental Cyrillic characters`);
  }
});
