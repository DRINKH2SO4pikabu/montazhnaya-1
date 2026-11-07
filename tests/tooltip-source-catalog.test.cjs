"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function loadTooltipSource() {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, {
    filename: "tooltip-source.js"
  });
  return window.MontazhnayaTooltipSource;
}

test("tooltip source copy is stored in a standalone locale catalogue", () => {
  const source = loadTooltipSource();
  assert.ok(source, "tooltip source catalogue must register on window");
  assert.equal(Object.keys(source.UI_HELP_ACTIONS).length, 50);
  assert.equal(Object.keys(source.UI_HELP_IDS).length, 53);
  assert.equal(Object.keys(source.BEGINNER_ACTION_HELP).length, 48);
  assert.equal(Object.keys(source.BEGINNER_ID_HELP).length, 53);
});

test("tooltip catalogue entries have complete readable source text", () => {
  const source = loadTooltipSource();
  for (const name of ["UI_HELP_ACTIONS", "UI_HELP_IDS"]) {
    for (const [key, values] of Object.entries(source[name])) {
      assert.ok(Array.isArray(values), name + "/" + key + " must be an array");
      assert.ok(values.length >= 3, name + "/" + key + " must define title, purpose and usage");
      for (const [index, value] of values.entries()) {
        assert.equal(typeof value, "string", name + "/" + key + "/" + index + " must be text");
        if (index < 3) assert.ok(value.trim(), name + "/" + key + "/" + index + " must not be empty");
      }
    }
  }
  for (const name of ["BEGINNER_ACTION_HELP", "BEGINNER_ID_HELP"]) {
    for (const [key, definition] of Object.entries(source[name])) {
      for (const field of ["title", "purpose", "usage"]) {
        assert.equal(typeof definition[field], "string", name + "/" + key + "/" + field + " must be text");
        assert.ok(definition[field].trim(), name + "/" + key + "/" + field + " must not be empty");
      }
      if (definition.tip !== undefined) {
        assert.equal(typeof definition.tip, "string", name + "/" + key + "/tip must be text");
      }
    }
  }
});

test("renderer loads the tooltip source catalogue before using its definitions", () => {
  const html = read("src/renderer/index.html");
  const sourceScript = html.indexOf('./locales/tooltip-source.js');
  const i18nScript = html.indexOf('./i18n.js');
  assert.ok(sourceScript >= 0, "tooltip source catalogue must be loaded");
  assert.ok(i18nScript > sourceScript, "tooltip catalogue must load before the i18n runtime");
  for (const name of ["UI_HELP_ACTIONS", "UI_HELP_IDS", "BEGINNER_ACTION_HELP", "BEGINNER_ID_HELP"]) {
    assert.match(html, new RegExp("const " + name + " = window\\.MontazhnayaTooltipSource\\." + name));
    assert.doesNotMatch(html, new RegExp("const " + name + " = \\{"));
  }
});


test("the canonical tooltip source key list is complete and unique", () => {
  const source = loadTooltipSource();
  assert.equal(source.textKeys.length, 364);
  assert.equal(new Set(source.textKeys).size, source.textKeys.length);
  assert.ok(source.textKeys.every(value => typeof value === "string" && value.trim()));
});

test("tooltip translations register by locale and override the selected i18n message layer", async () => {
  const window = { dispatchEvent() {} };
  const context = {
    window,
    document: {
      body: {
        nodeType: 1,
        childNodes: [],
        closest() { return null; },
        hasAttribute() { return false; },
        getAttribute() { return null; },
        setAttribute() {}
      },
      documentElement: { dataset: {}, lang: "en", dir: "ltr" },
      title: ""
    },
    navigator: { languages: ["en"], language: "en" },
    localStorage: { getItem() { return null; }, setItem() {} },
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init?.detail; },
    Intl,
    console,
    queueMicrotask
  };
  window.MontazhnayaLocaleManifest = {
    available: [
      { code: "en", direction: "ltr", file: "./locales/en.js" },
      { code: "de", direction: "ltr", file: "./locales/international.js" }
    ],
    planned: []
  };
  window.MontazhnayaLocalePacks = {
    en: { direction: "ltr", messages: {} },
    de: { direction: "ltr", messages: {} }
  };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context);
  const keys = window.MontazhnayaTooltipSource.textKeys;
  const english = keys.map((_, index) => "English tooltip " + index);
  const german = keys.map((_, index) => "Deutscher Hinweis " + index);
  window.MontazhnayaTooltipTranslations.register("en", english, "reference-translation");
  window.MontazhnayaTooltipTranslations.register("de", german, "machine-assisted-draft-native-speaker-review-pending");
  vm.runInContext(read("src/renderer/i18n.js"), context, { filename: "i18n.js" });
  await window.MontazhnayaI18n.setLocale("de");
  assert.equal(window.MontazhnayaI18n.translate(keys[0]), german[0]);
  assert.equal(window.MontazhnayaI18n.translate(keys.at(-1)), german.at(-1));
});


test("English reference tooltips register a complete 364-string translation pack", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-en.js"), context, { filename: "tooltips-en.js" });
  assert.equal(window.MontazhnayaTooltipSource.textKeys.length, 364);
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.en).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.en, "reference-translation");
});


test("German tooltip translations register all 364 source fragments", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-de.js"), context, { filename: "tooltips-de.js" });
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.de).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.de, "machine-assisted-draft-native-speaker-review-pending");
  assert.equal(window.MontazhnayaTooltipTranslations.packs.de["Neues Projekt starten"], undefined);
  assert.equal(window.MontazhnayaTooltipTranslations.packs.de["Начать новый проект"], "Neues Projekt starten");
});


for (const locale of ["fr", "es"]) {
  test(locale.toUpperCase() + " tooltip translations register all 364 source fragments", () => {
    const window = {};
    const context = { window };
    vm.createContext(context);
    vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
    vm.runInContext(read("src/renderer/locales/tooltips-" + locale + ".js"), context, { filename: "tooltips-" + locale + ".js" });
    assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs[locale]).length, 364);
    assert.equal(window.MontazhnayaTooltipTranslations.metadata[locale], "machine-assisted-draft-native-speaker-review-pending");
  });
}


for (const locale of ["pt-BR", "it"]) {
  test(locale + " tooltip translations register all 364 source fragments", () => {
    const window = {};
    const context = { window };
    vm.createContext(context);
    vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
    vm.runInContext(read("src/renderer/locales/tooltips-" + locale + ".js"), context, { filename: "tooltips-" + locale + ".js" });
    assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs[locale]).length, 364);
    assert.equal(window.MontazhnayaTooltipTranslations.metadata[locale], "machine-assisted-draft-native-speaker-review-pending");
  });
}
