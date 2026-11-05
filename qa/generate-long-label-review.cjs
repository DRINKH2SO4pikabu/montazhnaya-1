"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
for (const file of ["src/renderer/locales/manifest.js", "src/renderer/locales/en.js", "src/renderer/locales/international.js", "src/renderer/locales/cis.js", "src/renderer/locales/editorial-overrides.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}
const { available } = context.window.MontazhnayaLocaleManifest;
for (const entry of available) context.window.MontazhnayaApplyEditorialOverrides?.(entry.code);
const packs = context.window.MontazhnayaLocalePacks;
const sourceKeys = Object.keys(packs.en.messages);
const lines = [
  "# Montazhnaya Beta 3.6.45 — long-label visual review shortlist",
  "",
  "The lists below are the three longest translated source-map strings per locale, based on Unicode code-point count. This is a triage heuristic, not a pixel-width measurement: actual fit depends on Windows fonts, DPI scaling, container width and neighboring controls.",
  "",
  "Use the list during the Windows GUI pass to inspect menu items, dialog buttons, panel headings, property labels and help text. Russian and English are established baseline languages and are not included in this preview-only shortlist.",
  ""
];
for (const entry of available.filter(item => item.code !== "ru" && item.code !== "en")) {
  const pack = packs[entry.code];
  const top = sourceKeys.map(source => ({
    source,
    english: packs.en.messages[source],
    translated: pack.messages[source],
    codePoints: Array.from(pack.messages[source] || "").length
  })).sort((a,b) => b.codePoints - a.codePoints).slice(0,3);
  lines.push(`## ${entry.code} — ${entry.nativeName} (${entry.direction || "ltr"})`, "");
  lines.push("| Length (code points) | Russian source | English reference | Current translation |", "|---:|---|---|---|");
  for (const row of top) {
    const cells = [row.source, row.english, row.translated].map(value => String(value).replace(/\|/g, "\\|").replace(/\n/g, " "));
    lines.push(`| ${row.codePoints} | ${cells[0]} | ${cells[1]} | ${cells[2]} |`);
  }
  lines.push("");
}
lines.push("## Visual review checklist", "", "- Inspect at 100%, 125%, 150% and 200% Windows display scaling.", "- Check whether top-bar menus wrap without overlapping the toolbar.", "- Check property labels and number inputs side by side; labels must not push controls off-screen.", "- Check modals and menu popovers at the minimum supported window size.", "- For Arabic/Hebrew, confirm reading order while the timeline ruler and clip geometry remain left-to-right.", "- Check glyph coverage and font fallback for Georgian, Armenian, Devanagari, Thai, CJK and Uzbek Cyrillic.", "- Confirm keyboard shortcuts, numbers, file paths and codec names remain readable and unmirrored.", "");
fs.writeFileSync(path.join(root, "qa", "long-label-review-beta-3.6.45.md"), lines.join("\n"));
console.log(JSON.stringify({ locales: available.length - 2, output: "qa/long-label-review-beta-3.6.45.md" }));
