"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");

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


for (const locale of ["pl", "uk", "tr", "nl", "zh-CN", "zh-TW", "ja", "ko", "ar", "he", "hi", "sv", "fi", "cs", "ro", "el", "vi", "id", "th", "kk", "uz", "ka", "hy", "tk", "az", "ky", "tg", "be"]) {
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


test("Arabic and Hebrew locale metadata retain right-to-left direction", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/manifest.js"), context, { filename: "manifest.js" });
  const locales = window.MontazhnayaLocaleManifest.available;
  assert.equal(locales.find(locale => locale.code === "ar")?.direction, "rtl");
  assert.equal(locales.find(locale => locale.code === "he")?.direction, "rtl");
  assert.equal(locales.find(locale => locale.code === "hi")?.direction, "ltr");
});


test("Tajik detailed tooltip text keeps the object suffix attached", () => {
  const source = read("src/renderer/locales/tooltips-tg.js");
  assert.match(source, /видеоро кушоед/);
  assert.doesNotMatch(source, /видео ро кушоед/);
});

test("Uzbek Cyrillic detailed tooltips are marked as a transliteration draft", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, { filename: "tooltip-source.js" });
  vm.runInContext(read("src/renderer/locales/tooltips-uz-Cyrl.js"), context, { filename: "tooltips-uz-Cyrl.js" });
  assert.equal(Object.keys(window.MontazhnayaTooltipTranslations.packs["uz-Cyrl"]).length, 364);
  assert.equal(window.MontazhnayaTooltipTranslations.metadata["uz-Cyrl"], "transliteration-draft-native-speaker-review-pending");
});


test("Uzbek Cyrillic tooltip transliteration preserves technical identifiers", () => {
  const source = read("src/renderer/locales/tooltips-uz-Cyrl.js");
  for (const token of [".json", "Electron", "FFmpeg", "ffprobe", "WAV", "NVENC", "CBR", "VBR", "Full HD", "Mbps", "4K", "Ctrl+C", "Ctrl+V", "Ctrl+D", "Ripple Delete"]) {
    assert.ok(source.includes(token), "Missing preserved identifier: " + token);
  }
  assert.doesNotMatch(source, /\.жсон|Элестрон|рendэр|\bendи\b|ВАВ|Ripple Делете|Ctrl\+[СВД]|НВЕНС|СБР|ВБР|Фулл ҲД|Мбпс|4К|ма’лумот/);
});


test("every manifest locale loads a detailed tooltip pack", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/manifest.js"), context, { filename: "manifest.js" });
  const locales = window.MontazhnayaLocaleManifest.available;
  const html = read("src/renderer/index.html");
  assert.equal(locales.length, 36);
  for (const locale of locales) {
    if (locale.code === "ru") {
      assert.equal(locale.file, "./locales/ru.js", "Russian uses its canonical source locale");
      continue;
    }
    const scriptPath = "./locales/tooltips-" + locale.code + ".js";
    assert.ok(html.includes(scriptPath), locale.code + " tooltip script must be loaded by the renderer");
    const filePath = "src/renderer/locales/tooltips-" + locale.code + ".js";
    assert.ok(fs.existsSync(path.join(root, filePath)), locale.code + " tooltip file must exist");
    const source = read(filePath);
    assert.ok(source.includes('register("' + locale.code + '"'), locale.code + " tooltip file must register its locale");
  }
});


test("detailed tooltip quality audit covers all preview locales and produces a report", () => {
  const result = spawnSync(process.execPath, [
    path.join(root, "qa/audit-detailed-tooltip-locales.cjs")
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });

  assert.equal(result.status, 0, result.stderr || result.stdout || "tooltip quality audit failed");
  const report = JSON.parse(read("qa/detailed-tooltip-quality-audit.json"));
  assert.equal(report.sourceKeyCount, 364);
  assert.equal(report.previewLocaleCount, 34);
  assert.equal(report.inspectedTranslationCells, 34 * 364);
  assert.equal(report.placeholderChecks, 34 * 364);
  assert.equal(report.placeholderMismatches, 0);
  assert.equal(report.localeSummaries.length, 34);
  assert.ok(report.localeSummaries.every(locale => locale.entries === 364));
});


test("Electron tooltip GUI audit script has valid Node.js syntax", () => {
  const auditPath = path.join(root, "qa/tooltip-gui-audit.cjs");
  const result = spawnSync(process.execPath, ["--check", auditPath], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || "tooltip GUI audit script has invalid syntax");

  const audit = read("qa/tooltip-gui-audit.cjs");
  assert.match(audit, /for\(let i=0;i<keys\.length;i\+\+\)/);
  assert.match(audit, /buildFunctionHelpContent\(def\)/);
  assert.match(audit, /Emulation\.setDeviceMetricsOverride/);
  assert.match(audit, /renderedTooltipFragments:fragmentSamples\.length/);
  assert.match(audit, /fragmentDisplayFailures/);
});


test("PowerShell tooltip GUI runner downloads a temporary source copy and writes visual audit artifacts", () => {
  const script = read("tools/Test-Montazhnaya-Tooltips.ps1");
  assert.match(script, /codeload\.github\.com\/\$repository/);
  assert.match(script, /DRINKH2SO4pikabu\/montazhnaya-1/);
  assert.match(script, /remote-debugging-address=127\.0\.0\.1/);
  assert.match(script, /remote-debugging-port=/);
  assert.match(script, /qa\\tooltip-gui-audit\.cjs/);
  assert.match(script, /tooltip-gui-audit-summary\.md/);
  assert.match(script, /tooltip-gui-audit\.json/);
  assert.match(script, /tooltip-gui-audit-details\.csv/);
  assert.match(script, /Compress-Archive/);
  assert.match(script, /Remove-Item -LiteralPath \$workRoot -Recurse -Force/);
  assert.match(script, /\$electronArguments = @\(/);
  assert.doesNotMatch(script, /--user-data-dir=""\$profilePath""/);
  assert.match(script, /\$taskkillPath = Join-Path -Path \$env:SystemRoot/);
  assert.match(script, /Get-Process -Id \$appProcess\.Id/);
  assert.doesNotMatch(script, /try\s*\{[^\n]*\}\s*catch\s*\{/m);
  assert.doesNotMatch(script, /try\s*\{[^\n]*\}\s*finally\s*\{/m);
  assert.doesNotMatch(script, /try \{ Stop-Process/);
});


test("PowerShell tooltip GUI runner parses on Windows", () => {
  if (process.platform !== "win32") return;

  const scriptPath = path.join(root, "tools/Test-Montazhnaya-Tooltips.ps1");
  const escapedPath = scriptPath.replace(/'/g, "''");
  const command = "$tokens=$null; $errors=$null; " +
    "[System.Management.Automation.Language.Parser]::ParseFile('" + escapedPath +
    "', [ref]$tokens, [ref]$errors) | Out-Null; " +
    "if ($errors.Count -gt 0) { $errors | ForEach-Object { Write-Error $_.Message }; exit 1 }";

  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", command], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || "PowerShell tooltip GUI runner has invalid syntax");
});
