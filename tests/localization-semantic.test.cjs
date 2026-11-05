"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const core = require("../electron/i18n-core.cjs");
const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function loadSemanticCatalog() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/manifest.js"), context);
  vm.runInContext(read("src/renderer/locales/semantic.js"), context);
  return { manifest: context.window.MontazhnayaLocaleManifest, catalog: context.window.MontazhnayaSemanticCatalog };
}
const tokens = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(match => `{${match[1]}}`).sort();

test("semantic catalog contains exactly the 36 selectable locale variants", () => {
  const { manifest, catalog } = loadSemanticCatalog();
  const expected = Array.from(manifest.available, item => item.code).sort();
  assert.deepEqual(Object.keys(catalog).sort(), expected);
  assert.equal(expected.length, 36);
});

test("all semantic messages exist in every locale and preserve interpolation variables", () => {
  const { manifest, catalog } = loadSemanticCatalog();
  const reference = catalog.en.messages;
  const keys = Object.keys(reference).sort();
  assert.ok(keys.length >= 19);
  for (const locale of manifest.available.map(item => item.code)) {
    const data = catalog[locale];
    for (const key of keys) {
      assert.equal(typeof data.messages[key], "string", `${locale}: ${key} missing`);
      assert.ok(data.messages[key].trim(), `${locale}: ${key} empty`);
      assert.deepEqual(tokens(data.messages[key]), tokens(reference[key]), `${locale}: ${key} placeholders differ`);
    }
  }
});

test("noun forms cover every CLDR cardinal category for all 36 locales", () => {
  const { manifest, catalog } = loadSemanticCatalog();
  for (const locale of manifest.available.map(item => item.code)) {
    const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
    for (const noun of ["mediaFile", "clip", "frame"]) {
      const forms = catalog[locale][noun];
      assert.ok(forms && typeof forms.other === "string" && forms.other.trim(), `${locale}.${noun}.other`);
      for (const category of categories) {
        assert.ok(typeof forms[category] === "string" && forms[category].trim(), `${locale}.${noun}.${category}`);
      }
    }
  }
});

test("CLDR plural selection handles Russian, Polish, Arabic, Hebrew and invariant-count languages", () => {
  const cases = [
    ["ru", 1, "one"], ["ru", 2, "few"], ["ru", 5, "many"],
    ["pl", 1, "one"], ["pl", 2, "few"], ["pl", 5, "many"],
    ["ar", 0, "zero"], ["ar", 1, "one"], ["ar", 2, "two"], ["ar", 3, "few"], ["ar", 11, "many"], ["ar", 100, "other"],
    ["he", 1, "one"], ["he", 2, "two"], ["he", 5, "other"],
    ["zh-CN", 1, "other"], ["ja", 7, "other"]
  ];
  for (const [locale, value, expected] of cases) assert.equal(core.pluralCategory(locale, value), expected, `${locale} ${value}`);
});

test("semantic sanitizer retains grammatical cases and rejects unbounded or invalid entries", () => {
  const clean = core.sanitizeSemanticLocaleData({
    frame: { one: "frame", other: "frames", invalid: 4 },
    cases: { genitive: { frame: { one: "of a frame", other: "of frames", invalid: "bad" } } },
    messages: { "status.ok": "Done: {count}", invalid: 5 },
    reviewStatus: "draft"
  });
  assert.equal(clean.nouns.frame.one, "frame");
  assert.equal(clean.cases.genitive.frame.other, "of frames");
  assert.equal(clean.messages["status.ok"], "Done: {count}");
  assert.equal(Object.hasOwn(clean.messages, "invalid"), false);
});

test("count noun formatting selects locale-specific plural and case forms", () => {
  const { catalog } = loadSemanticCatalog();
  const ru = core.sanitizeSemanticLocaleData(catalog.ru);
  const en = core.sanitizeSemanticLocaleData(catalog.en);
  assert.equal(core.formatCountNoun(ru, "ru", "frame", 1), "1 кадр");
  assert.equal(core.formatCountNoun(ru, "ru", "frame", 2), "2 кадра");
  assert.equal(core.formatCountNoun(ru, "ru", "frame", 5), "5 кадров");
  assert.equal(core.formatCountNoun(ru, "ru", "frame", 2, "genitive"), "2 кадров");
  assert.equal(catalog.ru.cases.genitive.clip.one, "клипа");
  assert.equal(catalog.tk.cases.genitive.frame.one, "kadryň");
  assert.equal(core.formatCountNoun(en, "en", "frame", 1), "1 frame");
  assert.equal(core.formatCountNoun(en, "en", "frame", 2), "2 frames");
});

test("semantic messages format dynamic numeric values using the selected locale", () => {
  const { catalog } = loadSemanticCatalog();
  const de = core.sanitizeSemanticLocaleData(catalog.de);
  const formatted = core.formatSemanticMessage(de, "de", "profile.project.summary", {
    width: 1920, height: 1080, aspect: "16:9", fps: 29.97
  });
  assert.match(formatted, /1\.920 × 1\.080/);
  assert.match(formatted, /29,97/);
  const missing = core.formatSemanticMessage(de, "de", "no.such.key", {});
  assert.equal(missing, "no.such.key");
});

test("formatters use locale conventions and preserve technical IEC units", () => {
  assert.equal(core.formatNumber(1234.5, "de"), new Intl.NumberFormat("de").format(1234.5));
  assert.equal(core.formatNumber(1234.5, "fr"), new Intl.NumberFormat("fr").format(1234.5));
  assert.equal(core.formatByteSize(1024, "de"), "1 KiB");
  assert.equal(core.formatByteSize(1024 * 1024, "fr"), "1 MiB");
  assert.equal(core.formatByteSize(0, "ar"), `${new Intl.NumberFormat("ar").format(0)} B`);
  assert.equal(core.formatDuration(59.96, "en", { fractionDigits: 1 }), "01:00.0");
  assert.equal(core.formatDuration(3661, "en", { fractionDigits: 0 }), "61:01");
  assert.equal(core.formatRelativeTime(-1, "day", "en", { numeric: "auto" }), "yesterday");
  assert.equal(core.formatUnit(2, "second", "en"), new Intl.NumberFormat("en", { style: "unit", unit: "second", unitDisplay: "short" }).format(2));
  assert.equal(core.formatUnit(0.5, "percent", "de"), new Intl.NumberFormat("de", { style: "unit", unit: "percent", unitDisplay: "short" }).format(0.5));
  assert.equal(core.formatUnit(2, "pixel", "en"), "2");
  assert.equal(core.formatDate("2026-11-04T12:00:00Z", "de", { year: "numeric", month: "2-digit", day: "2-digit" }), new Intl.DateTimeFormat("de", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date("2026-11-04T12:00:00Z")));
});

test("renderer and Electron use semantic IDs with English fallback and localized generated labels", () => {
  const runtime = read("src/renderer/i18n.js");
  const main = read("electron/main.cjs");
  const html = read("src/renderer/index.html");
  assert.match(runtime, /semanticFallback: fallbackSemanticData/);
  assert.match(runtime, /function t\(key, values\)/);
  assert.match(runtime, /function pluralNoun\(nounKey, count, caseName\)/);
  assert.match(runtime, /function formatUnit\(value, unit, options\)/);
  assert.match(main, /function uiTextKey\(key, values = \{\}\)/);
  assert.match(main, /fallbackUiSemantic/);
  assert.match(html, /toastKey\("status\.clip\.nudged"/);
  assert.match(html, /toastKey\("status\.media\.import\.failed"/);
  assert.match(html, /uiT\("slideshow\.photos\.heading"/);
  assert.match(html, /i18n\.t\("profile\.project\.summary"/);
  assert.match(main, /uiTextKey\("dialog\.frame\.save\.title"\)/);
});
