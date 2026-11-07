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


for (const locale of ["pl", "uk", "tr", "nl"]) {
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


for (const locale of ["sv", "fi", "cs", "ro"]) {
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


test("tooltip source catalogue includes every short help message as well as beginner guidance", () => {
  const source = loadTooltipSource();
  assert.equal(source.textKeys.length, 364);
  assert.equal(source.quickTextKeys.length, 408);
  assert.equal(source.allTextKeys.length, 772);
  assert.equal(new Set(source.allTextKeys).size, source.allTextKeys.length);
});

test("quick tooltip translations merge with beginner translations by source message", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  const source = window.MontazhnayaTooltipSource;
  window.MontazhnayaTooltipTranslations.register("en", source.textKeys.map((_, i) => "Beginner " + i), "reference-translation");
  window.MontazhnayaTooltipTranslations.registerQuick("en", source.quickTextKeys.map((_, i) => "Quick help " + i), "reference-translation");
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.en).length, 772);
  assert.equal(window.MontazhnayaTooltipTranslations.scopes.en.beginner, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.scopes.en.quick, 408);
});


for (const locale of ["el", "vi", "id", "th"]) {
  test(locale + " tooltip translations register all 364 detailed source fragments", () => {
    const window = {};
    const context = { window };
    vm.createContext(context);
    vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
    vm.runInContext(read("src/renderer/locales/tooltips-" + locale + ".js"), context, { filename: "tooltips-" + locale + ".js" });
    assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs[locale]).length, 364);
    assert.equal(window.MontazhnayaTooltipTranslations.metadata[locale], "machine-assisted-draft-native-speaker-review-pending");
  });
}


test("English short-help translations register all 408 quick messages and merge to full coverage", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-en.js"), context, { filename: "tooltips-en.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-en-quick.js"), context, { filename: "tooltips-en-quick.js" });
  const source = window.MontazhnayaTooltipSource;
  const pack = window.MontazhnayaTooltipTranslations.packs.en;
  assert.equal(source.quickTextKeys.length, 408);
  assert.equal(source.allTextKeys.length, 772);
  assert.equal(Object.keys(pack).length, 772);
  assert.equal(window.MontazhnayaTooltipTranslations.scopes.en.beginner, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.scopes.en.quick, 408);
  assert.equal(pack[source.quickTextKeys[0]], "New project");
  assert.equal(pack[source.quickTextKeys.at(-1)], "If a file cannot be decoded in the browser, try converting it to a supported format.");
});


for (const locale of ["ja", "zh-CN"]) {
  test(locale + " detailed tooltip translations register all 364 source fragments", () => {
    const window = {};
    const context = { window };
    vm.createContext(context);
    vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
    vm.runInContext(read("src/renderer/locales/tooltips-" + locale + ".js"), context, { filename: "tooltips-" + locale + ".js" });
    assert.equal(window.MontazhnayaTooltipSource.textKeys.length, 364);
    assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs[locale]).length, 364);
    assert.equal(window.MontazhnayaTooltipTranslations.metadata[locale], "machine-assisted-draft-native-speaker-review-pending");
  });
}


test("Korean detailed tooltip translations register all 364 source fragments", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-ko.js"), context, { filename: "tooltips-ko.js" });
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.ko).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.ko, "machine-assisted-draft-native-speaker-review-pending");
});


test("Arabic detailed tooltip translations register all 364 source fragments", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-ar.js"), context, { filename: "tooltips-ar.js" });
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.ar).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.ar, "machine-assisted-draft-native-speaker-review-pending");
});


test("Hindi detailed tooltip translations register all 364 source fragments", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-hi.js"), context, { filename: "tooltips-hi.js" });
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.hi).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.hi, "machine-assisted-draft-native-speaker-review-pending");
});


test("Hebrew detailed tooltip translations register all 364 source fragments", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-he.js"), context, { filename: "tooltips-he.js" });
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.he).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.he, "machine-assisted-draft-native-speaker-review-pending");
});


test("Kazakh detailed tooltip translations register all 364 source fragments", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-kk.js"), context, { filename: "tooltips-kk.js" });
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.kk).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.kk, "machine-assisted-draft-native-speaker-review-pending");
});


test("Uzbek Latin detailed tooltip translations register all 364 source fragments", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-uz.js"), context, { filename: "tooltips-uz.js" });
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.uz).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.uz, "machine-assisted-draft-native-speaker-review-pending");
});


test("tooltip resolution keeps locale drafts and uses English instead of Russian for gaps", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-en.js"), context, { filename: "tooltips-en.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-en-quick.js"), context, { filename: "tooltips-en-quick.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-de.js"), context, { filename: "tooltips-de.js" });
  const registry = window.MontazhnayaTooltipTranslations;
  const source = window.MontazhnayaTooltipSource;
  const quickKey = source.quickTextKeys[0];
  const beginnerKey = source.textKeys[0];
  const germanBase = { [quickKey]: "Lokale Übersetzung aus dem Hauptwörterbuch" };
  const german = registry.resolveMessages("de", germanBase);
  assert.equal(german[quickKey], germanBase[quickKey]);
  assert.equal(german[beginnerKey], registry.packs.de[beginnerKey]);
  const kazakh = registry.resolveMessages("ka", {});
  assert.equal(kazakh[quickKey], registry.packs.en[quickKey]);
  assert.equal(kazakh[beginnerKey], registry.packs.en[beginnerKey]);
  const russian = registry.resolveMessages("ru", {});
  assert.equal(Object.prototype.hasOwnProperty.call(russian, quickKey), false);
  const coverage = registry.getCoverage("ka", {});
  assert.equal(coverage.total, 772);
  assert.equal(coverage.englishFallback, 772);
});

test("locale-specific Chinese Traditional and Uzbek Cyrillic tooltip variants register completely", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  for (const file of [
    "tooltip-source.js", "tooltips-en.js", "tooltips-en-quick.js",
    "tooltips-zh-CN.js", "tooltips-zh-TW.js", "tooltips-uz.js", "tooltips-uz-Cyrl.js"
  ]) {
    vm.runInContext(read("src/renderer/locales/" + file), context, { filename: file });
  }
  const packs = window.MontazhnayaTooltipTranslations.packs;
  assert.equal(Object.keys(packs["zh-TW"]).length, 364);
  assert.equal(Object.keys(packs["uz-Cyrl"]).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata["zh-TW"], "script-conversion-draft-native-speaker-review-pending");
  assert.equal(window.MontazhnayaTooltipTranslations.metadata["uz-Cyrl"], "transliteration-draft-native-speaker-review-pending");
});


test("all 36 selectable locales resolve every tooltip without Russian leakage", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  const base = "src/renderer/locales/";
  for (const file of ["manifest.js", "tooltip-source.js"]) {
    vm.runInContext(read(base + file), context, { filename: file });
  }
  const html = read("src/renderer/index.html");
  const tooltipScripts = [...html.matchAll(/<script src="\.\/locales\/(tooltips-[^"]+\.js)"><\/script>/g)]
    .map(match => match[1]);
  assert.ok(tooltipScripts.includes("tooltips-en.js"));
  assert.ok(tooltipScripts.includes("tooltips-en-quick.js"));
  for (const file of tooltipScripts) {
    assert.ok(fs.existsSync(path.join(root, base, file)), "missing loaded tooltip pack: " + file);
    vm.runInContext(read(base + file), context, { filename: file });
  }
  const manifest = window.MontazhnayaLocaleManifest;
  const registry = window.MontazhnayaTooltipTranslations;
  const source = window.MontazhnayaTooltipSource;
  assert.equal(manifest.available.length, 36);
  assert.equal(source.allTextKeys.length, 772);
  for (const locale of manifest.available) {
    if (locale.code === "ru") continue; // Russian is the source language.
    const resolved = registry.resolveMessages(locale.code, {});
    for (const key of source.allTextKeys) {
      assert.equal(typeof resolved[key], "string", locale.code + " missing tooltip: " + key);
      assert.notEqual(resolved[key], key, locale.code + " leaked Russian source text: " + key);
      assert.ok(resolved[key].trim(), locale.code + " has an empty tooltip: " + key);
    }
  }
});


test("Belarusian detailed tooltip translations register all 364 source fragments", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-be.js"), context, { filename: "tooltips-be.js" });
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.be).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.be, "machine-assisted-draft-native-speaker-review-pending");
});


test("Azerbaijani adapted tooltip draft registers all 364 source fragments", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  for (const file of ["tooltip-source.js", "tooltips-tr.js", "tooltips-az.js"]) {
    vm.runInContext(read("src/renderer/locales/" + file), context, { filename: file });
  }
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs.az).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata.az, "turkic-adaptation-draft-native-speaker-review-pending");
});

for (const locale of ["tk", "ky"]) {
  test(locale.toUpperCase() + " related-language tooltip draft registers all 364 source fragments", () => {
    const window = {};
    const context = { window };
    vm.createContext(context);
    const dependency = locale === "tk" ? "tr" : "kk";
    for (const file of ["tooltip-source.js", "tooltips-" + dependency + ".js", "tooltips-" + locale + ".js"]) {
      vm.runInContext(read("src/renderer/locales/" + file), context, { filename: file });
    }
    assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs[locale]).length, 364);
    assert.equal(window.MontazhnayaTooltipTranslations.metadata[locale], "turkic-adaptation-draft-native-speaker-review-pending".replace("turkic", locale === "ky" ? "related-language" : "turkic"));
  });
}


test("Indonesian detailed and short tooltip translations cover all 772 source messages", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  for (const file of ["tooltip-source.js", "tooltips-id.js", "tooltips-id-quick.js"]) {
    vm.runInContext(read("src/renderer/locales/" + file), context, { filename: file });
  }

  const source = window.MontazhnayaTooltipSource;
  const registry = window.MontazhnayaTooltipTranslations;
  assert.equal(source.textKeys.length, 364);
  assert.equal(source.quickTextKeys.length, 408);
  assert.equal(source.allTextKeys.length, 772);
  assert.equal(Object.keys(registry.packs.id).length, 772);
  assert.equal(registry.scopes.id.beginner, 364);
  assert.equal(registry.scopes.id.quick, 408);

  const coverage = registry.getCoverage("id", {});
  assert.equal(coverage.total, 772);
  assert.equal(coverage.translated, 772);
  assert.equal(coverage.englishFallback, 0);
  assert.equal(coverage.sourceLanguage, 0);
});


test("Spanish detailed and short tooltip translations cover all 772 source messages", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  for (const file of ["tooltip-source.js", "tooltips-es.js", "tooltips-es-quick.js"]) {
    vm.runInContext(read("src/renderer/locales/" + file), context, { filename: file });
  }

  const source = window.MontazhnayaTooltipSource;
  const registry = window.MontazhnayaTooltipTranslations;
  assert.equal(source.textKeys.length, 364);
  assert.equal(source.quickTextKeys.length, 408);
  assert.equal(source.allTextKeys.length, 772);
  assert.equal(Object.keys(registry.packs.es).length, 772);
  assert.equal(registry.scopes.es.beginner, 364);
  assert.equal(registry.scopes.es.quick, 408);

  const coverage = registry.getCoverage("es", {});
  assert.equal(coverage.total, 772);
  assert.equal(coverage.translated, 772);
  assert.equal(coverage.englishFallback, 0);
  assert.equal(coverage.sourceLanguage, 0);
});
