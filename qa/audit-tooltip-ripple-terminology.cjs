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
  "tooltip-source.js",
  "tooltips-en.js",
  "editorial-overrides.js"
]) {
  const relative = "src/renderer/locales/" + file;
  vm.runInContext(read(relative), context, { filename: relative });
}

const window = context.window;
const manifest = window.MontazhnayaLocaleManifest;
const source = window.MontazhnayaTooltipSource;
const registry = window.MontazhnayaTooltipTranslations;
const corrections = window.MontazhnayaLocaleEditorialCorrections;

if (!manifest || !source || !registry || !corrections) {
  throw new Error("Tooltip terminology audit registries failed to load");
}
if (manifest.available.length !== 36) {
  throw new Error("Expected 36 selectable locales; found " + manifest.available.length);
}
if (source.textKeys.length !== 364) {
  throw new Error("Expected 364 detailed tooltip source fragments; found " + source.textKeys.length);
}

const english = registry.packs.en;
const titleKey = source.textKeys.find(key => english[key] === "Ripple delete");
const instructionKey = source.textKeys.find(key =>
  english[key] === "The gap will remain. To move the following clips forward, use Ripple Delete."
);
if (!titleKey || !instructionKey) {
  throw new Error("Canonical Ripple Delete title or instruction is missing from the English reference pack");
}

const previewLocales = manifest.available.filter(locale => locale.code !== "ru" && locale.code !== "en");
const untranslatedTerm = /Ripple Delete|Ripple Silme|Ripple silme|रिपल डिलीट/i;
const problems = [];
const results = [];

for (const locale of previewLocales) {
  const code = locale.code;
  const relative = "src/renderer/locales/tooltips-" + code + ".js";
  if (!fs.existsSync(path.join(root, relative))) {
    problems.push(code + ": tooltip pack file is missing");
    continue;
  }

  try {
    vm.runInContext(read(relative), context, { filename: relative });
  } catch (error) {
    problems.push(code + ": tooltip pack failed to load: " + error.message);
    continue;
  }

  const pack = registry.packs[code];
  if (!pack || Object.keys(pack).length !== 364) {
    problems.push(code + ": expected 364 registered tooltip fragments");
    continue;
  }
  const title = pack[titleKey];
  const instruction = pack[instructionKey];
  if (typeof title !== "string" || !title.trim()) {
    problems.push(code + ": Ripple Delete title is empty");
    continue;
  }
  if (typeof instruction !== "string" || !instruction.trim()) {
    problems.push(code + ": Ripple Delete instruction is empty");
    continue;
  }

  const expected = corrections[code] && corrections[code]["Ripple-удалить"];
  if (expected) {
    if (title !== expected) {
      problems.push(code + ": title differs from the editorial UI term");
    }
    if (!instruction.includes(expected)) {
      problems.push(code + ": instruction does not use the editorial UI term");
    }
  } else if (!instruction.includes(title)) {
    problems.push(code + ": instruction does not repeat its localized command title");
  }

  if (untranslatedTerm.test(title)) {
    problems.push(code + ": title retains an English or mixed-script command name");
  }
  if (untranslatedTerm.test(instruction)) {
    problems.push(code + ": instruction retains an English or mixed-script command name");
  }

  results.push({
    code,
    nativeName: locale.nativeName,
    title,
    editorialTerm: expected || "locale-specific CJK term",
    status: expected ? "aligned-with-editorial-glossary" : "localized-CJK-term-consistent"
  });
}

if (results.length !== 34) {
  problems.push("Expected 34 preview locale results; found " + results.length);
}

const markdown = [
  "# Montazhnaya — Ripple Delete tooltip terminology audit",
  "",
  "- Selectable locales: **" + manifest.available.length + "**",
  "- Preview locales checked: **" + results.length + " / 34**",
  "- Detailed tooltip fragments per locale: **364**",
  "- Editorially harmonized locale packs: **" + results.filter(item => item.status === "aligned-with-editorial-glossary").length + "**",
  "- Locale-specific CJK term packs: **" + results.filter(item => item.status === "localized-CJK-term-consistent").length + "**",
  "- Problems: **" + problems.length + "**",
  "",
  "## Locale results",
  "",
  "| Locale | Title shown in detailed tooltip | Status |",
  "|---|---|---|",
  ...results.map(item => "| " + item.code + " | " + item.title.replace(/\|/g, "\\|") + " | " + item.status + " |"),
  "",
  "## Findings",
  "",
  ...(problems.length ? problems.map(item => "- " + item) : ["No terminology inconsistencies detected."]),
  "",
  "## Review status",
  "",
  "This pass aligns the detailed-tooltip command label and its instruction with the existing editorial UI glossary for 30 locales. Simplified/Traditional Chinese, Japanese and Korean retain their locale-specific native terms, with the instruction checked against the matching title. The audit verifies consistency and non-empty content; it does not certify native-speaker linguistic quality. All preview translations remain drafts pending fluent-speaker review.",
  ""
].join("\n");

const reportPath = path.join(root, "qa", "ripple-delete-tooltip-terminology-stage10.md");
fs.writeFileSync(reportPath, markdown, "utf8");

if (problems.length) {
  process.stderr.write(problems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    selectableLocales: manifest.available.length,
    previewLocalesChecked: results.length,
    editoriallyHarmonizedLocales: results.filter(item => item.status === "aligned-with-editorial-glossary").length,
    cjkLocalesChecked: results.filter(item => item.status === "localized-CJK-term-consistent").length,
    problems: 0,
    report: "qa/ripple-delete-tooltip-terminology-stage10.md"
  }, null, 2));
}
