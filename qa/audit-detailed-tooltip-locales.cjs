"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const context = { window: {}, Intl, console };
vm.createContext(context);

for (const file of ["manifest.js", "tooltip-source.js", "tooltips-en.js"]) {
  const fullPath = "src/renderer/locales/" + file;
  vm.runInContext(read(fullPath), context, { filename: file });
}

const window = context.window;
const manifest = window.MontazhnayaLocaleManifest;
const source = window.MontazhnayaTooltipSource;
const registry = window.MontazhnayaTooltipTranslations;

if (!manifest || !source || !registry) {
  throw new Error("Tooltip locale runtime did not register its manifest, source catalogue and translation registry");
}

const sourceKeys = source.textKeys;
const english = registry.packs.en;
if (!Array.isArray(sourceKeys) || sourceKeys.length !== 364) {
  throw new Error("Expected 364 canonical detailed-tooltip keys");
}
if (!english || Object.keys(english).length !== sourceKeys.length) {
  throw new Error("English reference tooltip pack is incomplete");
}

const previewLocales = manifest.available.filter(locale => locale.code !== "ru" && locale.code !== "en");
const expectedLocaleCount = 34;
const structuralProblems = [];
const placeholderProblems = [];
const technicalFlags = [];
const localeSummaries = [];

const placeholderTokens = value => [...String(value).matchAll(/\{[A-Za-z][A-Za-z0-9_]*\}|%s|%\d+\$s|\$\{[^}]+\}/g)]
  .map(match => match[0])
  .sort();

const technicalRules = [
  {
    kind: "file-extension",
    pattern: /\.(?:json|montazhnaya|mp4|webm|wav|mp3|png|jpe?g|gif|mov|avi)\b/gi
  },
  {
    kind: "codec-platform-format",
    pattern: /\b(?:Electron|FFmpeg|ffprobe|MP4|H\.264|AAC|WebM|VP8|VP9|Opus|FPS|WAV|NVENC|CBR|VBR|Full HD|Mbps|4K|1080p|1920×1080)\b/g
  },
  {
    kind: "keyboard-shortcut",
    pattern: /\b(?:(?:Ctrl|Alt|Shift|Meta)\+)+(?:[A-Z0-9]+|Left Arrow|Right Arrow|Up Arrow|Down Arrow)\b/g
  },
  {
    kind: "editor-command",
    pattern: /\bRipple Delete\b/g
  }
];

function protectedTokens(value) {
  const found = [];
  for (const rule of technicalRules) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const match of String(value).matchAll(pattern)) {
      found.push({ kind: rule.kind, token: match[0] });
    }
  }
  return found;
}

function sameArray(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

if (manifest.available.length !== 36) {
  structuralProblems.push("Expected 36 selectable locales, found " + manifest.available.length);
}
if (previewLocales.length !== expectedLocaleCount) {
  structuralProblems.push("Expected 34 preview locales, found " + previewLocales.length);
}

let inspectedCells = 0;
let missingOrEmptyTranslations = 0;
let placeholderChecks = 0;
let exactEnglishMatches = 0;
let technicalTokensChecked = 0;
let missingTechnicalTokens = 0;

for (const locale of previewLocales) {
  const code = locale.code;
  const relativePath = "src/renderer/locales/tooltips-" + code + ".js";
  if (!fs.existsSync(path.join(root, relativePath))) {
    structuralProblems.push(code + ": tooltip file is missing");
    missingOrEmptyTranslations += sourceKeys.length;
    continue;
  }

  try {
    vm.runInContext(read(relativePath), context, { filename: relativePath });
  } catch (error) {
    structuralProblems.push(code + ": tooltip file failed to load: " + error.message);
    missingOrEmptyTranslations += sourceKeys.length;
    continue;
  }

  const pack = registry.packs[code];
  if (!pack || typeof pack !== "object") {
    structuralProblems.push(code + ": translation pack did not register");
    missingOrEmptyTranslations += sourceKeys.length;
    continue;
  }

  const packKeys = Object.keys(pack);
  const missingKeys = sourceKeys.filter(key => !Object.prototype.hasOwnProperty.call(pack, key));
  const extraKeys = packKeys.filter(key => !sourceKeys.includes(key));
  if (missingKeys.length) {
    structuralProblems.push(code + ": " + missingKeys.length + " missing tooltip keys");
    missingOrEmptyTranslations += missingKeys.length;
  }
  if (extraKeys.length) {
    structuralProblems.push(code + ": " + extraKeys.length + " unexpected tooltip keys");
  }

  let localePlaceholders = 0;
  let localeExactEnglish = 0;
  let localeTechnicalChecked = 0;
  let localeTechnicalMissing = 0;

  for (const key of sourceKeys) {
    const reference = english[key];
    const translation = pack[key];
    if (typeof translation !== "string" || !translation.trim()) {
      structuralProblems.push(code + ": empty or non-string translation for key: " + key);
      missingOrEmptyTranslations++;
      continue;
    }

    inspectedCells++;
    const expectedPlaceholders = placeholderTokens(reference);
    const actualPlaceholders = placeholderTokens(translation);
    placeholderChecks++;
    localePlaceholders++;
    if (!sameArray(expectedPlaceholders, actualPlaceholders)) {
      placeholderProblems.push({
        locale: code,
        key,
        expected: expectedPlaceholders,
        actual: actualPlaceholders
      });
    }

    if (translation === reference) {
      exactEnglishMatches++;
      localeExactEnglish++;
    }

    for (const item of protectedTokens(reference)) {
      technicalTokensChecked++;
      localeTechnicalChecked++;
      if (!translation.includes(item.token)) {
        missingTechnicalTokens++;
        localeTechnicalMissing++;
        technicalFlags.push({
          locale: code,
          key,
          kind: item.kind,
          token: item.token,
          translation
        });
      }
    }
  }

  const metadata = registry.metadata[code] || "missing";
  if (metadata === "missing") {
    structuralProblems.push(code + ": tooltip translation metadata is missing");
  }
  localeSummaries.push({
    code,
    nativeName: locale.nativeName,
    entries: packKeys.length,
    placeholderChecks: localePlaceholders,
    exactEnglishMatches: localeExactEnglish,
    technicalTokensChecked: localeTechnicalChecked,
    missingTechnicalTokens: localeTechnicalMissing,
    metadata
  });
}

if (inspectedCells !== expectedLocaleCount * sourceKeys.length) {
  structuralProblems.push("Expected " + (expectedLocaleCount * sourceKeys.length) +
    " inspected translations, found " + inspectedCells);
}
if (placeholderProblems.length) {
  structuralProblems.push(placeholderProblems.length + " placeholder mismatches found");
}

const report = {
  audit: "detailed-tooltip-locales",
  sourceKeyCount: sourceKeys.length,
  selectableLocaleCount: manifest.available.length,
  previewLocaleCount: previewLocales.length,
  inspectedTranslationCells: inspectedCells,
  expectedTranslationCells: expectedLocaleCount * sourceKeys.length,
  missingOrEmptyTranslations,
  placeholderChecks,
  placeholderMismatches: placeholderProblems.length,
  exactEnglishMatches,
  technicalTokensChecked,
  missingTechnicalTokens,
  technicalReviewStatus: missingTechnicalTokens === 0 ? "no missing protected tokens detected" : "review candidates found; see details",
  linguisticStatus: "machine-assisted drafts; native-speaker review pending",
  localeSummaries,
  structuralProblems,
  placeholderProblems,
  technicalFlags
};

const reportPath = path.join(root, "qa", "detailed-tooltip-quality-audit.json");
const markdownPath = path.join(root, "qa", "detailed-tooltip-quality-audit.md");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

const markdown = [
  "# Detailed tooltip translation quality audit",
  "",
  "- Canonical English reference fragments: **" + sourceKeys.length + "**",
  "- Preview locales: **" + previewLocales.length + "**",
  "- Translation cells inspected: **" + inspectedCells.toLocaleString("en-US") + " / " + (expectedLocaleCount * sourceKeys.length).toLocaleString("en-US") + "**",
  "- Missing or empty translations: **" + report.missingOrEmptyTranslations + "**",
  "- Placeholder checks: **" + placeholderChecks.toLocaleString("en-US") + "**",
  "- Placeholder mismatches: **" + placeholderProblems.length + "**",
  "- Protected technical tokens checked: **" + technicalTokensChecked.toLocaleString("en-US") + "**",
  "- Missing protected-token occurrences: **" + missingTechnicalTokens + "**",
  "- Exact English matches: **" + exactEnglishMatches + "** (review candidates, not automatically classified as errors)",
  "",
  "## Locale coverage",
  "",
  "| Locale | Entries | Placeholder checks | Missing technical tokens | Registry status |",
  "|---|---:|---:|---:|---|",
  ...localeSummaries.map(item => "| " + item.code + " | " + item.entries + " | " + item.placeholderChecks +
    " | " + item.missingTechnicalTokens + " | " + item.metadata + " |"),
  "",
  "## Review candidates",
  "",
  "Protected-token mismatches are reported for human review rather than treated as automatic translation failures. Some terms may be legitimately localized in a target language; file extensions, codec identifiers and keyboard shortcuts should normally remain unchanged.",
  "",
  ...technicalFlags.slice(0, 100).map(item => "- " + item.locale + " / " + item.kind + " / " +
    item.token + " — key " + item.key),
  technicalFlags.length > 100 ? "- ... " + (technicalFlags.length - 100) + " additional protected-token candidates are listed in the JSON report." : "",
  "",
  "## Quality boundary",
  "",
  "This audit validates catalogue registration, source-key completeness, non-empty strings, interpolation placeholders and preservation of selected technical identifiers. It does not judge grammar, naturalness, regional terminology, accessibility or cultural fit. All 34 preview packs remain machine-assisted drafts pending fluent native-speaker review. Uzbek Cyrillic (uz-Cyrl) is a transliteration-derived draft and requires independent review.",
  ""
].filter(Boolean).join("\n");

fs.writeFileSync(markdownPath, markdown, "utf8");

if (structuralProblems.length) {
  process.stderr.write(structuralProblems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    inspectedTranslationCells: inspectedCells,
    placeholderChecks,
    placeholderMismatches: placeholderProblems.length,
    technicalTokensChecked,
    missingTechnicalTokens,
    report: "qa/detailed-tooltip-quality-audit.md"
  }, null, 2));
}
