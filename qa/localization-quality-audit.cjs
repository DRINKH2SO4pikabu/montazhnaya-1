"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const context = { window: {} };
vm.createContext(context);
for (const file of [
  "src/renderer/locales/manifest.js",
  "src/renderer/locales/ru.js",
  "src/renderer/locales/en.js",
  "src/renderer/locales/international.js",
  "src/renderer/locales/cis.js",
  "src/renderer/locales/semantic.js",
  "src/renderer/locales/beginner-tour.js",
  "src/renderer/locales/editorial-overrides.js"
]) vm.runInContext(read(file), context, { filename: file });
const packs = context.window.MontazhnayaLocalePacks;
const manifest = context.window.MontazhnayaLocaleManifest;
const semanticCatalog = context.window.MontazhnayaSemanticCatalog;
for (const entry of manifest.available) context.window.MontazhnayaApplyEditorialOverrides?.(entry.code);
if (!packs || !manifest || !semanticCatalog) throw new Error("Locale runtime did not register packs, manifest and semantic catalog");
const sourceMessages = packs.en.messages;
const sourceKeys = Object.keys(sourceMessages);
const tokenList = value => [...String(value).matchAll(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g)].map(match => match[0]).sort();
const previewEntries = manifest.available.filter(item => item.code !== "ru" && item.code !== "en");
const duplicateEnglish = new Map();
for (const [source, english] of Object.entries(sourceMessages)) {
  const list = duplicateEnglish.get(english) || [];
  list.push(source);
  duplicateEnglish.set(english, list);
}
const duplicateGroups = [...duplicateEnglish.entries()].filter(([, keys]) => keys.length > 1);
const fontProfiles = {
  latin: "Segoe UI Variable Text → Segoe UI → Arial",
  cyrillic: "Segoe UI Variable Text → Segoe UI → Arial",
  georgian: "Sylfaen → Noto Sans Georgian → Segoe UI",
  armenian: "Sylfaen → Noto Sans Armenian → Segoe UI",
  arabic: "Noto Sans Arabic → Segoe UI → Tahoma",
  hebrew: "Noto Sans Hebrew → Segoe UI → Arial",
  devanagari: "Noto Sans Devanagari → Mangal → Nirmala UI",
  thai: "Leelawadee UI → Noto Sans Thai → Tahoma",
  simplifiedChinese: "Microsoft YaHei UI → Noto Sans CJK SC → system-ui",
  traditionalChinese: "Microsoft JhengHei UI → Noto Sans CJK TC → system-ui",
  japanese: "Yu Gothic UI → Meiryo UI → Noto Sans CJK JP",
  korean: "Malgun Gothic → Noto Sans CJK KR → system-ui"
};
const localeFontProfile = {
  de: "latin", fr: "latin", es: "latin", "pt-BR": "latin", it: "latin", pl: "latin", uk: "cyrillic", tr: "latin",
  "zh-CN": "simplifiedChinese", "zh-TW": "traditionalChinese", ja: "japanese", ko: "korean", ar: "arabic", he: "hebrew", hi: "devanagari",
  nl: "latin", sv: "latin", fi: "latin", cs: "latin", ro: "latin", el: "latin", vi: "latin", id: "latin", th: "thai",
  kk: "cyrillic", uz: "latin", "uz-Cyrl": "cyrillic", ka: "georgian", hy: "armenian", tk: "latin", az: "latin", ky: "cyrillic", tg: "cyrillic", be: "cyrillic"
};
const localeReports = [];
const duplicateIssues = [];
const placeholderIssues = [];
const emptyIssues = [];
const missingIssues = [];
const versionIssues = [];
const semanticIssues = [];
const semanticKeys = [
  "status.media.imported", "status.media.missing", "status.media.relinked",
  "status.project.portable.saved", "status.project.portable.opened", "status.project.portable.missing",
  "status.project.json.missing", "tour.step.progress", "export.range.progress",
  "status.media.arranged", "status.media.relink.instruction", "profile.project.summary",
  "status.export.completed", "slideshow.photos.heading", "status.clip.nudged",
  "status.media.import.failed", "dialog.frame.save.title", "dialog.frame.filter.png", "dialog.frame.filter.jpeg",
  ...Array.from({ length: 7 }, (_, index) => [
    `tour.beginner.step${index + 1}.title`,
    `tour.beginner.step${index + 1}.body`,
    `tour.beginner.step${index + 1}.tip`
  ]).flat()
];

for (const entry of previewEntries) {
  const code = entry.code;
  const semantic = semanticCatalog[code];
  if (!semantic) semanticIssues.push({ code, issue: "missing locale entry" });
  else {
    for (const key of semanticKeys) {
      if (typeof semantic.messages?.[key] !== "string" || !semantic.messages[key].trim()) semanticIssues.push({ code, issue: `missing semantic message ${key}` });
      else {
        const expected = key === "status.media.imported" ? ["{countLabel}"]
          : key === "status.media.missing" ? ["{countLabel}"]
          : key === "status.media.relinked" ? ["{restored}", "{total}"]
          : key === "status.project.portable.saved" ? ["{countLabel}", "{size}"]
          : key === "status.project.portable.opened" ? ["{countLabel}"]
          : key === "status.project.portable.missing" ? ["{countLabel}"]
          : key === "status.project.json.missing" ? ["{countLabel}"]
          : key === "tour.step.progress" ? ["{current}", "{total}"]
          : key === "export.range.progress" ? ["{start}", "{end}"]
          : key === "status.media.arranged" ? ["{countLabel}", "{duration}"]
          : key === "profile.project.summary" ? ["{width}", "{height}", "{aspect}", "{fps}"]
          : key === "status.export.completed" ? ["{file}", "{size}", "{start}", "{end}"]
          : key === "slideshow.photos.heading" ? ["{count}"]
          : key === "status.clip.nudged" ? ["{countLabel}", "{direction}"]
          : key === "status.media.import.failed" ? ["{file}", "{error}"] : [];
        const actual = tokenList(semantic.messages[key]);
        if (JSON.stringify(actual) !== JSON.stringify(expected.sort())) semanticIssues.push({ code, issue: `placeholder mismatch ${key}`, expected, actual });
      }
    }
    for (const nounKey of ["mediaFile", "clip", "frame"]) {
      const forms = semantic[nounKey];
      if (!forms || typeof forms !== "object" || !forms.other) semanticIssues.push({ code, issue: `missing noun forms ${nounKey}` });
      else {
        const categories = new Intl.PluralRules(code).resolvedOptions().pluralCategories;
        for (const category of categories) if (typeof forms[category] !== "string" || !forms[category].trim()) semanticIssues.push({ code, issue: `missing ${nounKey}.${category}` });
      }
    }
    if (!semantic.reviewStatus?.includes("native-speaker-review-pending")) semanticIssues.push({ code, issue: "missing native-speaker review status" });
  }
  const pack = packs[code];
  if (!pack || !pack.messages) throw new Error(`Missing registered locale pack: ${code}`);
  const messages = pack.messages;
  const keys = Object.keys(messages);
  const missing = sourceKeys.filter(key => !Object.prototype.hasOwnProperty.call(messages, key));
  const empty = sourceKeys.filter(key => typeof messages[key] !== "string" || !messages[key].trim());
  if (missing.length) missingIssues.push({ code, keys: missing });
  if (empty.length) emptyIssues.push({ code, keys: empty });
  for (const source of sourceKeys) {
    if (typeof messages[source] !== "string") continue;
    const sourceTokens = tokenList(source);
    const translatedTokens = tokenList(messages[source]);
    if (JSON.stringify(sourceTokens) !== JSON.stringify(translatedTokens)) {
      placeholderIssues.push({ code, source, expected: sourceTokens, actual: translatedTokens });
    }
  }
  for (const [english, keysForPhrase] of duplicateGroups) {
    const values = [...new Set(keysForPhrase.map(key => messages[key]))];
    if (values.length > 1) duplicateIssues.push({ code, english, sources: keysForPhrase, translations: values });
  }
  const fallbackKeys = Array.isArray(pack.englishFallbackKeys) ? pack.englishFallbackKeys : [];
  const mappedCount = keys.length;
  const longest = sourceKeys
    .map(source => ({ source, value: messages[source], length: Array.from(messages[source] || "").length }))
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);
  const longLabels = sourceKeys.filter(source => Array.from(messages[source] || "").length > 46).length;
  const veryLongLabels = sourceKeys.filter(source => Array.from(messages[source] || "").length > 72).length;
  const expectedDirection = entry.direction || "ltr";
  if ((pack.direction || expectedDirection) !== expectedDirection) {
    throw new Error(`${code} direction mismatch: pack=${pack.direction}, manifest=${expectedDirection}`);
  }
  if (!pack.linguisticReviewStatus || !pack.visualReviewStatus || pack.terminologyRevision !== "3.6.45") {
    throw new Error(`${code} is missing linguistic/visual quality metadata`);
  }
  const aboutKey = "Монтажная beta 3.6.44 — монтаж фото, аудио и видео";
  if (!messages[aboutKey] || messages[aboutKey] !== pack.appTitle) versionIssues.push({ code, about: messages[aboutKey], appTitle: pack.appTitle });
  localeReports.push({
    code,
    nativeName: entry.nativeName,
    englishName: entry.englishName,
    direction: pack.direction || expectedDirection,
    sourceKeyCount: sourceKeys.length,
    mappedKeyCount: mappedCount,
    missingKeyCount: missing.length,
    emptyValueCount: empty.length,
    englishFallbackCount: fallbackKeys.length,
    placeholderMismatchCount: placeholderIssues.filter(issue => issue.code === code).length,
    duplicateTerminologyIssueCount: duplicateIssues.filter(issue => issue.code === code).length,
    longLabelsOver46Chars: longLabels,
    veryLongLabelsOver72Chars: veryLongLabels,
    longestLabels: longest,
    linguisticReviewStatus: pack.linguisticReviewStatus,
    visualReviewStatus: pack.visualReviewStatus,
    translationQuality: pack.translationQuality || "draft-needs-native-review",
    scriptVariant: pack.scriptVariant || entry.scriptVariant || null,
    fontFamily: pack.fontFamily || entry.fontFamily || fontProfiles[localeFontProfile[code]] || "system fallback",
    fontProfile: localeFontProfile[code] || "system"
  });
}

if (manifest.available.length !== 36) throw new Error(`Expected 36 selectable variants, found ${manifest.available.length}`);
if (sourceKeys.length !== 436) throw new Error(`Expected 436 English reference keys, found ${sourceKeys.length}`);
if (previewEntries.length !== 34) throw new Error(`Expected 34 preview locales, found ${previewEntries.length}`);
if (missingIssues.length || emptyIssues.length || placeholderIssues.length || duplicateIssues.length || versionIssues.length || semanticIssues.length) {
  const details = { missingIssues, emptyIssues, placeholderIssues: placeholderIssues.slice(0, 30), duplicateIssues, versionIssues, semanticIssues };
  fs.writeFileSync(path.join(root, "qa", "localization-quality-errors-beta-3.6.45.json"), JSON.stringify(details, null, 2));
  throw new Error(`Localization quality audit failed: missing=${missingIssues.length}, empty=${emptyIssues.length}, placeholders=${placeholderIssues.length}, terminology=${duplicateIssues.length}, about=${versionIssues.length}`);
}
if (localeReports.some(report => report.sourceKeyCount !== 436 || report.mappedKeyCount !== 436 || report.englishFallbackCount !== 0)) {
  throw new Error("At least one locale has incomplete source-key coverage or English fallback");
}

const report = {
  version: "3.6.45",
  selectableLanguageVariants: manifest.available.length,
  previewLocales: previewEntries.length,
  englishReferenceKeyCount: sourceKeys.length,
  totals: {
    missingKeys: 0,
    emptyValues: 0,
    englishFallbackEntries: 0,
    placeholderMismatches: 0,
    duplicateTerminologyMismatches: 0,
    aboutVersionMismatches: 0,
    semanticCatalogIssues: 0
  },
  terminologyGroupsChecked: duplicateGroups.length,
  localeReports,
  limitations: [
    "This audit validates structure, placeholders and repeated terminology; it does not certify idiomatic quality or professional translation.",
    "All preview translations still require native-speaker review, especially Uzbek Cyrillic, regional terminology and technical editing vocabulary.",
    "Font stacks list preferred system fonts and fallbacks; actual font availability and glyph rendering depend on Windows installations and are not certified here.",
    "Typography and wrapping rules are statically audited; no Windows screenshots or on-device visual verification were produced in this environment.",
    "Windows Setup and Portable packages are not built by this localization source-only pass."
  ]
};
fs.writeFileSync(path.join(root, "qa", "localization-quality-audit-beta-3.6.45.json"), JSON.stringify(report, null, 2));
const lines = [
  "# Montazhnaya Beta 3.6.45 — Localization Quality Audit",
  "",
  `- Selectable variants: **${report.selectableLanguageVariants}** (Russian + English + ${report.previewLocales} preview locales)`,
  `- English reference keys: **${report.englishReferenceKeyCount}**`,
  `- Repeated English glossary groups checked: **${report.terminologyGroupsChecked}**`,
  "- Missing keys: **0**",
  "- Empty translations: **0**",
  "- English fallback entries: **0**",
  "- Placeholder mismatches: **0**",
  "- Repeated-terminology mismatches: **0**",
  "- About-title mismatches: **0**",
  "- Semantic catalog issues: **0**",
  `- Semantic keys per locale: **${semanticKeys.length}**`,
  "",
  "## Per-locale length and script audit",
  "",
  "| Code | Language | Keys | >46 chars | >72 chars | Direction | Font/script fallback profile |",
  "|---|---|---:|---:|---:|---|---|",
  ...localeReports.map(item => `| ${item.code} | ${item.nativeName} | ${item.mappedKeyCount}/436 | ${item.longLabelsOver46Chars} | ${item.veryLongLabelsOver72Chars} | ${item.direction.toUpperCase()} | ${item.fontFamily || "system fallback"} |`),
  "",
  "## Notes and limitations",
  "",
  ...report.limitations.map(item => `- ${item}`),
  ""
];
fs.writeFileSync(path.join(root, "qa", "localization-quality-audit-beta-3.6.45.md"), lines.join("\n"));
console.log(JSON.stringify({
  selectableLanguageVariants: report.selectableLanguageVariants,
  previewLocales: report.previewLocales,
  englishReferenceKeys: sourceKeys.length,
  repeatedEnglishPhraseGroups: duplicateGroups.length,
  result: "PASS",
  totals: report.totals
}, null, 2));
