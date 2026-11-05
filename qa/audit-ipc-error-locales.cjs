"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { ERROR_DEFINITIONS } = require("../electron/ipc-errors.cjs");

const root = path.join(__dirname, "..");
const expectedLocales = [
  "de", "fr", "es", "pt-BR", "it", "pl", "uk", "tr", "zh-CN", "zh-TW", "ja", "ko",
  "ar", "he", "hi", "nl", "sv", "fi", "cs", "ro", "el", "vi", "id", "th",
  "kk", "uz", "uz-Cyrl", "ka", "hy", "tk", "az", "ky", "tg", "be"
];

function loadLocaleRuntime() {
  const window = {};
  const context = { window, console };
  // Reproduce the application's script order, including the two lazily loaded
  // locale bundles. This verifies the actual runtime packs, not only a stub.
  const files = [
    "src/renderer/locales/manifest.js",
    "src/renderer/locales/ru.js",
    "src/renderer/locales/en.js",
    "src/renderer/locales/source-messages.js",
    "src/renderer/locales/guides-en.js",
    "src/renderer/locales/semantic.js",
    "src/renderer/locales/notifications.js",
    "src/renderer/locales/ipc-error-translations.js",
    "src/renderer/locales/international.js",
    "src/renderer/locales/cis.js"
  ];
  for (const file of files) {
    vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  }
  return window;
}

function placeholders(value) {
  return [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)]
    .map(match => match[1]).sort();
}

function audit() {
  const window = loadLocaleRuntime();
  const catalog = window.MontazhnayaNotificationCatalog;
  const registry = window.MontazhnayaIpcErrorTranslations;
  const metadata = window.MontazhnayaIpcErrorTranslationMeta;
  assert.ok(catalog, "Notification catalogue must be registered");
  assert.ok(registry, "IPC error translations must be registered");
  assert.equal(metadata.localeCount, expectedLocales.length);
  assert.equal(metadata.keyCount, Object.keys(ERROR_DEFINITIONS).length);
  assert.equal(metadata.translationCount, expectedLocales.length * Object.keys(ERROR_DEFINITIONS).length);

  const entries = new Map(catalog.entries.map(entry => [entry.key, entry]));
  const keys = Object.keys(ERROR_DEFINITIONS);
  for (const key of keys) {
    assert.ok(entries.has(key), `Missing notification source entry: ${key}`);
  }

  for (const locale of expectedLocales) {
    assert.ok(registry[locale], `Missing locale ${locale}`);
    assert.equal(Object.keys(registry[locale]).length, keys.length, `${locale}: wrong key count`);
    const applied = catalog.augmentLocale(locale);
    assert.equal(applied.translated, catalog.entries.length - catalog.entries.filter(entry =>
      !Object.hasOwn(entry.translations || {}, locale) &&
      !Object.hasOwn(registry[locale], entry.key) &&
      !Object.hasOwn(window.MontazhnayaLocalePacks[locale].messages, entry.source)
    ).length, `${locale}: augmentation count mismatch`);
    for (const key of keys) {
      const entry = entries.get(key);
      const translation = registry[locale][key];
      assert.equal(typeof translation, "string", `${locale}:${key} must be a string`);
      assert.ok(translation.trim(), `${locale}:${key} must not be empty`);
      assert.deepEqual(placeholders(translation), placeholders(entry.source), `${locale}:${key} placeholder mismatch`);
      assert.notEqual(translation, entry.en, `${locale}:${key} unexpectedly uses English fallback`);
      assert.equal(window.MontazhnayaSemanticCatalog[locale].messages[key], translation,
        `${locale}:${key} was not added to the active semantic catalogue`);
    }
  }

  const manifestLocales = Array.from(window.MontazhnayaLocaleManifest.available, locale => locale.code)
    .filter(code => code !== "ru" && code !== "en").sort();
  assert.deepEqual(manifestLocales, [...expectedLocales].sort(), "Translation locales must match the 34 advertised non-Russian/non-English locales");

  return {
    locales: expectedLocales.length,
    keys: keys.length,
    translations: expectedLocales.length * keys.length,
    placeholderChecks: expectedLocales.length * keys.length,
    fallbackCount: 0,
    reviewStatus: metadata.status
  };
}

if (require.main === module) {
  const result = audit();
  console.log("IPC error locale audit: PASS");
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { audit };
