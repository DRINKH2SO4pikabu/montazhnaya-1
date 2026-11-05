"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const context = { window: {}, Intl, console };
vm.createContext(context);
for (const file of [
  "manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js", "semantic.js",
  "beginner-tour.js", "notifications.js", "ipc-error-translations.js", "international.js", "cis.js",
  "editorial-overrides.js"
]) vm.runInContext(read(`src/renderer/locales/${file}`), context, { filename: file });
const w = context.window;
const manifest = w.MontazhnayaLocaleManifest;
const packs = w.MontazhnayaLocalePacks;
const apply = w.MontazhnayaApplyEditorialOverrides;
const english = w.MontazhnayaLocaleSourceMessages;
if (!english) throw new Error("Immutable 436-key English source snapshot is unavailable");
const sourceKeys = Object.keys(english);
const preview = manifest.available.filter(x => !["ru", "en"].includes(x.code));
const problems = [];
const rows = [[
  "locale_code", "native_name", "key_index", "source_ru", "reference_en", "translation",
  "placeholder_match", "script_families", "script_check", "translation_chars", "length_ratio",
  "identical_to_english", "editorial_status"
]];
const flags = [["locale_code", "source_ru", "reference_en", "translation", "flag", "severity"]];
const tokenList = value => [...String(value).matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match => match[1]).sort();
function scriptFamily(character) {
  const cp = character.codePointAt(0);
  if ((cp >= 0x0041 && cp <= 0x024F) || (cp >= 0x1E00 && cp <= 0x1EFF)) return "Latin";
  if (cp >= 0x0400 && cp <= 0x052F) return "Cyrillic";
  if (cp >= 0x0370 && cp <= 0x03FF) return "Greek";
  if (cp >= 0x0600 && cp <= 0x06FF) return "Arabic";
  if (cp >= 0x0590 && cp <= 0x05FF) return "Hebrew";
  if (cp >= 0x0900 && cp <= 0x097F) return "Devanagari";
  if (cp >= 0x0E00 && cp <= 0x0E7F) return "Thai";
  if (cp >= 0x10A0 && cp <= 0x10FF) return "Georgian";
  if (cp >= 0x0530 && cp <= 0x058F) return "Armenian";
  if ((cp >= 0x3040 && cp <= 0x309F) || (cp >= 0x30A0 && cp <= 0x30FF)) return "JapaneseKana";
  if (cp >= 0xAC00 && cp <= 0xD7AF) return "Hangul";
  if ((cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF)) return "Han";
  return null;
}
const expectedScript = {
  de: "Latin", fr: "Latin", es: "Latin", "pt-BR": "Latin", it: "Latin", pl: "Latin", uk: "Cyrillic", tr: "Latin",
  "zh-CN": "Han", "zh-TW": "Han", ja: "JapaneseKana", ko: "Hangul", ar: "Arabic", he: "Hebrew", hi: "Devanagari",
  nl: "Latin", sv: "Latin", fi: "Latin", cs: "Latin", ro: "Latin", el: "Greek", vi: "Latin", id: "Latin", th: "Thai",
  kk: "Cyrillic", uz: "Latin", "uz-Cyrl": "Cyrillic", ka: "Georgian", hy: "Armenian", tk: "Latin", az: "Latin", ky: "Cyrillic", tg: "Cyrillic", be: "Cyrillic"
};
let placeholderChecks = 0;
let completeRows = 0;
let exactEnglish = 0;
let longTranslations = 0;
let scriptReviewCandidates = 0;
let lengthRatioOutliers = 0;
const correctionCount = {};
for (const entry of preview) {
  const code = entry.code;
  const pack = packs[code];
  const effective = apply(code) || pack;
  if (!effective || !effective.messages) {
    problems.push(`${code}: locale pack unavailable`);
    continue;
  }
  const map = effective.messages;
  correctionCount[code] = effective.editorialCorrectionCount || 0;
  for (let i = 0; i < sourceKeys.length; i++) {
    const source = sourceKeys[i];
    const reference = english[source];
    const translation = map[source];
    if (typeof translation !== "string" || !translation.trim()) {
      problems.push(`${code}: missing or empty key ${source}`);
      continue;
    }
    completeRows++;
    const placeholderMatch = JSON.stringify(tokenList(source)) === JSON.stringify(tokenList(translation));
    placeholderChecks++;
    if (!placeholderMatch) problems.push(`${code}: placeholder mismatch for ${source}`);
    const families = [...new Set([...translation].map(scriptFamily).filter(Boolean))].sort();
    const expected = expectedScript[code];
    const isBrand = source === "Монтажная" && /^Montazhnaya$/i.test(translation);
    const isShortcut = /^(?:(?:Ctrl|Alt|Shift|Meta)(?:\+(?:Ctrl|Alt|Shift|Meta))*(?:\+[A-Z0-9]+)?)(?:\+[←→]|[←→])?$/.test(translation);
    const scriptCheck = isBrand ? "approved-latin-brand" : isShortcut ? "approved-keyboard-shortcut" :
      (families.includes(expected) ||
      (expected === "JapaneseKana" && (families.includes("Han") || families.includes("JapaneseKana"))) ||
      (expected === "Hangul" && (families.includes("Hangul") || families.includes("Han")))) ? "expected-script-present" : "review-script";
    const identical = translation === reference;
    if (identical) exactEnglish++;
    const chars = [...translation].length;
    const ratio = [...reference].length ? chars / [...reference].length : 1;
    const rowFlags = [];
    if (scriptCheck === "review-script" && /\p{L}{4}/u.test(translation)) {
      rowFlags.push("expected-script-not-detected");
      scriptReviewCandidates++;
    }
    if (chars > 160) {
      rowFlags.push("long-string-visual-review");
      longTranslations++;
    }
    if (identical && /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(translation)) rowFlags.push("english-phrase-identical");
    if (ratio > 3.2 || ratio < 0.22) { rowFlags.push("length-ratio-outlier"); lengthRatioOutliers++; }
    if (rowFlags.length) {
      for (const flag of rowFlags) flags.push([code, source, reference, translation, flag, flag === "expected-script-not-detected" ? "medium" : "low"]);
    }
    rows.push([
      code, entry.nativeName, i + 1, source, reference, translation,
      placeholderMatch ? "PASS" : "FAIL", families.join("+"), scriptCheck, chars, ratio.toFixed(2),
      identical ? "yes" : "no", "machine-assisted-editorial-audit; native-speaker-review-pending"
    ]);
  }
}
if (sourceKeys.length !== 436) problems.push(`Expected 436 source keys, found ${sourceKeys.length}`);
if (preview.length !== 34) problems.push(`Expected 34 preview locales, found ${preview.length}`);
if (completeRows !== 436 * 34) problems.push(`Expected 14,824 rows, found ${completeRows}`);
for (const code of ["kk", "uz", "uz-Cyrl", "ka", "hy", "tk", "az", "ky", "tg", "be"]) {
  const pack = packs[code];
  const effective = apply(code) || pack;
  if (!/^Montazhnaya (?:(?:бета)|(?:beta)) 3\.6\.45/.test(effective.appTitle || "")) problems.push(`${code}: app title is not aligned to version 3.6.45`);
  const aboutKey = "Монтажная beta 3.6.44 — монтаж фото, аудио и видео";
  if (effective.messages[aboutKey] !== effective.appTitle) problems.push(`${code}: About and app title differ`);
}
if (problems.length) {
  process.stderr.write(problems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  const csv = values => values.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",");
  fs.writeFileSync(path.join(root, "qa", "full-dictionary-editorial-matrix-stage9.csv"), "\uFEFF" + rows.map(csv).join("\r\n") + "\r\n", "utf8");
  fs.writeFileSync(path.join(root, "qa", "full-dictionary-review-flags-stage9.csv"), "\uFEFF" + flags.map(csv).join("\r\n") + "\r\n", "utf8");
  const report = {
    stage: 9,
    sourceKeyCount: sourceKeys.length,
    previewLocaleCount: preview.length,
    reviewedTranslationCells: completeRows,
    expectedTranslationCells: 14824,
    missingOrEmptyTranslations: 0,
    placeholderChecks,
    placeholderMismatches: 0,
    exactEnglishMatches: exactEnglish,
    longTranslationsOver160Chars: longTranslations,
    distinctLongSourceMessages: new Set(rows.filter(row => row[9] > 160).map(row => row[3])).size,
    lengthRatioOutliers,
    scriptReviewCandidates,
    localeCorrectionCounts: correctionCount,
    transliterationNotice: "uz-Cyrl remains a transliteration-derived draft and requires independent native-speaker review; this audit does not certify it as a separate human translation.",
    qualityStatus: "machine-assisted full-dictionary structural and terminology audit; native-speaker linguistic sign-off pending"
  };
  fs.writeFileSync(path.join(root, "qa", "full-dictionary-editorial-audit-stage9.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  const md = [
    "# Stage 9 — full dictionary editorial audit",
    "",
    `- Reference strings: **${sourceKeys.length}**`,
    `- Preview locales: **${preview.length}**`,
    `- Translation cells inspected: **${completeRows.toLocaleString("en-US")} / 14,824**`,
    "- Missing/empty strings: **0**",
    `- Placeholder validations: **${placeholderChecks.toLocaleString("en-US")} / 14,824** (all passed)`,
    `- Exact English matches: **${exactEnglish}** (review candidates, not automatically classified as errors; technical borrowings and cognates are allowed)`,
    `- Long strings over 160 characters: **${longTranslations}** across **${report.distinctLongSourceMessages}** distinct source messages (visual review candidates)`,
    `- Length-ratio outliers: **${lengthRatioOutliers}** (many occur in concise CJK labels; reviewed as review candidates, not automatic errors)`,
    `- Unexplained script anomalies: **${scriptReviewCandidates}** (brand spelling and keyboard shortcuts are explicitly allow-listed)`,
    "",
    "## Scope and reliability",
    "",
    "The complete runtime dictionary was enumerated for every preview locale and each of its 436 source strings was checked for presence, non-empty content and placeholder parity. The matrix records every source/English-reference/target-language row, character length, script families and review status.",
    "",
    "This is a machine-assisted editorial and structural pass. It can detect missing or malformed data, terminology patterns, script anomalies and likely visual outliers, but it cannot certify idiomatic wording, regional appropriateness or specialist usage in every target language. No native-speaker attestation is claimed.",
    "",
    "## Priority human review",
    "",
    "1. Uzbek Cyrillic (`uz-Cyrl`): the current pack is transliteration-derived and must be reviewed independently rather than assumed equivalent to an Uzbek Cyrillic translation.",
    "2. Regional Central Asian languages (`kk`, `uz`, `tk`, `az`, `ky`, `tg`): confirm preferred professional video-editing vocabulary and avoid Russian/English calques where local terminology exists.",
    "3. RTL locales (`ar`, `he`): verify mixed-direction strings containing codec names, numbers, keyboard shortcuts and placeholders in the native Windows build.",
    "4. CJK locales (`zh-CN`, `zh-TW`, `ja`, `ko`): verify platform-conventional labels and line wrapping in native fonts.",
    "5. All long technical help and diagnostic descriptions: verify clarity and sentence naturalness, not just key coverage.",
    "",
    "## Targeted changes in this pass",
    "",
    "- Updated stale 3.6.44 About/app titles in all ten CIS/regional packs to 3.6.45.",
    "- Corrected Indonesian video/audio track wording and aligned frame terminology to `bingkai`.",
    "- Corrected Finnish single-frame terminology to `ruutu`, consistent with the existing previous/next-frame commands.",
    "- Clarified Wipe and Iris effect names in regional language packs so they refer to video transitions rather than household curtains/blinds or a physical camera diaphragm.",
    "- Reclassified the preserved Latin brand name and keyboard shortcuts as intentional script exceptions rather than translation defects.",
    "- Expanded the effect terminology review for Wipe/Iris transitions in high-risk regional language packs.",
    "- Added automated checks for version consistency, full 436-key coverage and placeholder preservation.",
    "",
    "## Files",
    "",
    "- `full-dictionary-editorial-matrix-stage9.csv` — all 14,824 localized strings.",
    "- `full-dictionary-review-flags-stage9.csv` — strings that merit a closer script/length review.",
    "- `full-dictionary-editorial-audit-stage9.json` — machine-readable summary.",
    ""
  ];
  fs.writeFileSync(path.join(root, "qa", "full-dictionary-editorial-audit-stage9.md"), md.join("\n"), "utf8");
  console.log(JSON.stringify(report, null, 2));
}
