"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const context = { window: {} };
vm.createContext(context);
for (const file of [
  "manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js", "semantic.js",
  "beginner-tour.js", "notifications.js", "ipc-error-translations.js", "international.js", "cis.js",
  "editorial-overrides.js"
]) vm.runInContext(read(`src/renderer/locales/${file}`), context, { filename: file });
const w = context.window;
const manifest = w.MontazhnayaLocaleManifest;
const packs = w.MontazhnayaLocalePacks;
const corrections = w.MontazhnayaLocaleEditorialCorrections;
const apply = w.MontazhnayaApplyEditorialOverrides;
if (!manifest || !packs || !corrections || typeof apply !== "function") throw new Error("Stage 9 editorial registry failed to load");
const rationale = {"Ripple-удалить": "Clarifies the editing operation: delete the selected clip and close the resulting gap by shifting subsequent material.", "Разрешение": "Corrects false-friend/ambiguous translations; this is image/video resolution, not permission, solution or generic accuracy.", "Разрешение проекта": "Uses the same image-resolution concept in the project settings context.", "Титры поверх клипа": "Clarifies that this is text/title overlay rendered over the clip, not the clip name or metadata title.", "Прилипание": "Uses the established concept of magnetic snapping/alignment rather than literal sticking, capture or magnet as an object.", "Видеодорожка": "Uses the editing concept of a video track/channel/layer rather than a physical road or piece.", "Таймлайн": "Replaces a transliterated loanword with a native, descriptive timeline term where the existing wording was less natural.", "Разделить на курсоре": "Uses the video-editing verb for splitting a clip at the playhead, not cutting/trimming ambiguously.", "Отделить звук на аудиодорожку": "Clarifies that the audio is separated and placed on its own audio track.", "Связать видео и аудио": "Uses the grammatical noun/infinitive form for linking paired video and audio clips.", "Восстановить медиафайлы…": "Replaces an informal English-derived “relink” verb with a clearer standard phrase."};
const rows = [["locale_code", "native_name", "source_label", "previous_translation", "editorial_translation", "editorial_rationale", "review_status"]];
const problems = [];
let count = 0;
for (const entry of manifest.available) {
  const code = entry.code;
  const patch = corrections[code];
  if (!patch) continue;
  const before = packs[code];
  for (const [source, revised] of Object.entries(patch)) {
    const previous = before?.messages?.[source];
    if (typeof previous !== "string" || !previous.trim()) problems.push(`${code}: missing source ${source}`);
    if (typeof revised !== "string" || !revised.trim()) problems.push(`${code}: empty correction ${source}`);
    if (previous === revised) problems.push(`${code}: correction has no effect ${source}`);
    rows.push([code, entry.nativeName, source, previous || "", revised, rationale[source] || "Editorial terminology clarification", "machine-assisted-full-dictionary-audit-pass-1; native-speaker-review-pending"]);
    count++;
  }
  const after = apply(code);
  if (!after || after.editorialRevision !== "beta-3.6.45-editorial-stage9-full-dictionary-pass1") problems.push(`${code}: override did not apply`);
  for (const [source, revised] of Object.entries(patch)) {
    if (after.messages[source] !== revised) problems.push(`${code}: runtime value mismatch for ${source}`);
  }
  if (after.editorialCorrectionCount !== Object.keys(patch).length) problems.push(`${code}: correction count metadata mismatch`);
  if (/^Montazhnaya beta 3\.6\.44|^Montazhnaya бета 3\.6\.44/i.test(after.appTitle || "")) problems.push(`${code}: stale 3.6.44 app title`);
  const aboutKey = "Монтажная beta 3.6.44 — монтаж фото, аудио и видео";
  if (after.messages[aboutKey] !== after.appTitle) problems.push(`${code}: About title and appTitle do not match`);
}
const previewCodes = manifest.available.filter(x => x.code !== "ru" && x.code !== "en").map(x => x.code);
const missingLocalePatches = previewCodes.filter(code => !corrections[code]);
if (missingLocalePatches.length) problems.push(`Missing locale editorial maps: ${missingLocalePatches.join(", ")}`);
const expected = previewCodes.length;
if (Object.keys(corrections).length !== expected) problems.push(`Expected ${expected} locale maps, found ${Object.keys(corrections).length}`);
if (problems.length) {
  process.stderr.write(problems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  const quote = x => `"${String(x).replace(/"/g, '""')}"`;
  fs.writeFileSync(path.join(root, "qa", "editorial-terminology-stage9.csv"), "\uFEFF" + rows.map(row => row.map(quote).join(",")).join("\r\n") + "\r\n", "utf8");
  const report = {
    stage: 9,
    scope: "full 436-key structural audit plus targeted high-frequency terminology corrections; native-speaker sign-off remains pending",
    previewLocales: expected,
    localesWithEditorialMaps: Object.keys(corrections).length,
    correctionCount: count,
    sourceTermsCorrected: [...new Set(rows.slice(1).map(row => row[2]))].length,
    missing: 0,
    empty: 0,
    runtimeApplied: true,
    reviewStatus: "machine-assisted-full-dictionary-audit-pass-1; native-speaker-review-pending"
  };
  fs.writeFileSync(path.join(root, "qa", "editorial-terminology-stage9.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  const md = [
    "# Stage 9 — core video-editing terminology editorial pass",
    "",
    `- Preview locales covered: **${expected}/34**`,
    `- Locale-specific corrections applied: **${count}**`,
    `- Distinct source concepts corrected: **${report.sourceTermsCorrected}**`,
    "- Missing/empty corrections: **0**",
    "- Runtime application verified: **yes**",
    "- Status: **machine-assisted editorial draft; native-speaker review pending**",
    "",
    "This pass targets high-frequency commands and concepts where a literal translation, false friend, ambiguous clip-title label, or English-only feature name could mislead an editor. It is not a complete review of every 436-key string in every locale.",
    "",
    "See `editorial-terminology-stage9.csv` for before/after values and per-term rationale."
  ];
  fs.writeFileSync(path.join(root, "qa", "editorial-terminology-stage9.md"), md.join("\n") + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
}
