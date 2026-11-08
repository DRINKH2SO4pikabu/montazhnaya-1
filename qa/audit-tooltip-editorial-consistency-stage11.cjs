"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const context = { window: {}, Intl, console };
vm.createContext(context);

for (const file of [
  "manifest.js",
  "ru.js",
  "en.js",
  "source-messages.js",
  "guides-en.js",
  "semantic.js",
  "beginner-tour.js",
  "notifications.js",
  "ipc-error-translations.js",
  "international.js",
  "cis.js",
  "editorial-overrides.js",
  "tooltip-source.js",
  "tooltips-en.js"
]) {
  const relative = "src/renderer/locales/" + file;
  vm.runInContext(read(relative), context, { filename: relative });
}

const w = context.window;
const manifest = w.MontazhnayaLocaleManifest;
const localePacks = w.MontazhnayaLocalePacks;
const applyEditorial = w.MontazhnayaApplyEditorialOverrides;
const tooltipSource = w.MontazhnayaTooltipSource;
const tooltipRegistry = w.MontazhnayaTooltipTranslations;

if (!manifest || !localePacks || typeof applyEditorial !== "function" ||
    !tooltipSource || !tooltipRegistry) {
  throw new Error("Tooltip editorial consistency registries failed to load");
}

const terms = [
  { source: "Сохранить проект с медиафайлами…", englishTitle: "Save project with media" },
  { source: "Ripple-удалить", englishTitle: "Ripple delete" },
  { source: "Копировать клип", englishTitle: "Copy clip" },
  { source: "Вставить клип", englishTitle: "Paste clip" },
  { source: "Дублировать клип", englishTitle: "Duplicate clip" },
  { source: "Добавить маркер", englishTitle: "Add marker" }
];

const normalize = value => String(value || "")
  .normalize("NFC")
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "");

const previewLocales = manifest.available.filter(item => item.code !== "ru" && item.code !== "en");
const problems = [];
const rows = [];
const englishTooltipPack = tooltipRegistry.packs.en;
const titleKeys = new Map();

for (const term of terms) {
  const matches = tooltipSource.textKeys.filter(key =>
    normalize(englishTooltipPack[key]) === normalize(term.englishTitle)
  );
  if (matches.length !== 1) {
    problems.push(term.englishTitle + ": expected one English detailed-tooltip title, found " + matches.length);
    continue;
  }
  titleKeys.set(term.source, matches[0]);

  const englishUiLabel = localePacks.en?.messages?.[term.source];
  if (!englishUiLabel || normalize(englishUiLabel) !== normalize(term.englishTitle)) {
    problems.push(term.source + ": English UI label does not match the configured detailed-tooltip title");
  }
}

if (manifest.available.length !== 36 || previewLocales.length !== 34) {
  problems.push("Expected 36 selectable locales and 34 preview locales");
}

for (const locale of previewLocales) {
  const code = locale.code;
  const relative = "src/renderer/locales/tooltips-" + code + ".js";
  if (!fs.existsSync(path.join(root, relative))) {
    problems.push(code + ": detailed-tooltip pack file is missing");
    continue;
  }

  try {
    vm.runInContext(read(relative), context, { filename: relative });
  } catch (error) {
    problems.push(code + ": detailed-tooltip pack failed to load: " + error.message);
    continue;
  }

  const effectivePack = applyEditorial(code) || localePacks[code];
  const tooltipPack = tooltipRegistry.packs[code];
  if (!effectivePack?.messages || !tooltipPack) {
    problems.push(code + ": UI or detailed-tooltip translations did not register");
    continue;
  }

  for (const term of terms) {
    const titleKey = titleKeys.get(term.source);
    if (!titleKey) continue;

    const expectedUiLabel = effectivePack.messages[term.source];
    const actualTooltipTitle = tooltipPack[titleKey];

    if (typeof expectedUiLabel !== "string" || !expectedUiLabel.trim()) {
      problems.push(code + "/" + term.source + ": localized UI label is missing");
      continue;
    }
    if (typeof actualTooltipTitle !== "string" || !actualTooltipTitle.trim()) {
      problems.push(code + "/" + term.source + ": detailed-tooltip title is empty");
      continue;
    }

    const matches = normalize(expectedUiLabel) === normalize(actualTooltipTitle);
    rows.push({
      locale: code,
      nativeName: locale.nativeName,
      source: term.source,
      englishTitle: term.englishTitle,
      uiLabel: expectedUiLabel,
      tooltipTitle: actualTooltipTitle,
      matches
    });

    if (!matches) {
      problems.push(code + "/" + term.source + ": UI label differs from detailed-tooltip title (" +
        expectedUiLabel + " ≠ " + actualTooltipTitle + ")");
    }
  }
}

const markdown = [
  "# Montazhnaya — detailed-tooltip and UI terminology consistency",
  "",
  "- Preview locales: **" + previewLocales.length + "**",
  "- Editing commands checked: **" + terms.length + "**",
  "- UI / tooltip title pairs checked: **" + rows.length + " / " + (previewLocales.length * terms.length) + "**",
  "- Mismatches: **" + rows.filter(item => !item.matches).length + "**",
  "",
  "## Results",
  "",
  "| Locale | Source command | UI label | Detailed-tooltip title |",
  "|---|---|---|---|",
  ...rows.map(item => "| " + item.locale + " | " + item.source + " | " +
    item.uiLabel.replace(/\|/g, "\\|") + " | " + item.tooltipTitle.replace(/\|/g, "\\|") + " |"),
  "",
  "## Findings",
  "",
  ...(problems.length ? problems.map(item => "- " + item) : ["All checked command titles match the localized UI glossary."]),
  "",
  "## Review boundary",
  "",
  "This checks terminology consistency for six high-frequency editing commands. Matching labels does not certify the full linguistic quality of each tooltip; the 34 preview packs remain machine-assisted drafts pending native-speaker review.",
  ""
].join("\n");

fs.writeFileSync(path.join(root, "qa", "tooltip-editorial-consistency-stage11.md"), markdown, "utf8");

if (problems.length || rows.length !== previewLocales.length * terms.length) {
  if (!problems.length) problems.push("Expected " + (previewLocales.length * terms.length) + " pairs; found " + rows.length);
  process.stderr.write(problems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    selectableLocales: manifest.available.length,
    previewLocales: previewLocales.length,
    commands: terms.length,
    checkedPairs: rows.length,
    mismatches: 0,
    report: "qa/tooltip-editorial-consistency-stage11.md"
  }, null, 2));
}
