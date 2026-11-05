"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const window = {};
const context = { window };
vm.createContext(context);
const files = [
  "manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js",
  "semantic.js", "beginner-tour.js", "notifications.js", "ipc-error-translations.js",
  "international.js", "cis.js", "editorial-overrides.js"
];
for (const file of files) vm.runInContext(read(`src/renderer/locales/${file}`), context, { filename: file });
const manifest = window.MontazhnayaLocaleManifest;
const catalog = window.MontazhnayaSemanticCatalog;
const packs = window.MontazhnayaLocalePacks;
const definition = window.MontazhnayaBeginnerTourCatalog;
if (!manifest || !catalog || !definition) throw new Error("Beginner tour locale catalog failed to register");
const expectedKeys = Array.from({ length: 7 }, (_, index) => {
  const step = index + 1;
  return [`tour.beginner.step${step}.title`, `tour.beginner.step${step}.body`, `tour.beginner.step${step}.tip`];
}).flat();
if (JSON.stringify(definition.keys) !== JSON.stringify(expectedKeys)) throw new Error("Beginner tour key order or coverage changed");
if (manifest.available.length !== 36) throw new Error(`Expected 36 locales, found ${manifest.available.length}`);
const english = catalog.en.messages;
const csv = [["locale", "nativeName", "step", "field", "key", "translation", "reviewStatus"]];
const lengthCsv = [["locale", "nativeName", "maxCharacters", "longestKey", "layoutNote"]];
const problems = [];
for (const locale of manifest.available) {
  if (typeof window.MontazhnayaApplyEditorialOverrides === "function") window.MontazhnayaApplyEditorialOverrides(locale.code);
  const packMessages = packs[locale.code]?.messages || {};
  const data = catalog[locale.code];
  if (!data || !data.messages) { problems.push(`${locale.code}: semantic locale missing`); continue; }
  if (data.beginnerTourTranslationCount !== expectedKeys.length) problems.push(`${locale.code}: incorrect translation count`);
  let longest = { characters: 0, key: "" };
  for (let i = 0; i < expectedKeys.length; i++) {
    const key = expectedKeys[i];
    const value = data.messages[key];
    if (typeof value !== "string" || !value.trim()) {
      problems.push(`${locale.code}: ${key} is empty or missing`);
      continue;
    }
    if (locale.code !== "en" && value === english[key]) problems.push(`${locale.code}: ${key} still uses English fallback`);
    if (locale.code !== "ru" && /Шаг [1-7]\./u.test(value)) problems.push(`${locale.code}: ${key} contains an untranslated Russian step marker`);
    if (locale.code === "ka" && /[А-Яа-яЁё]/u.test(value)) problems.push(`ka: ${key} contains accidental Cyrillic characters`);
    const field = key.endsWith(".title") ? "title" : key.endsWith(".body") ? "body" : "tip";
    const step = Number(key.match(/step(\d+)/)[1]);
    const characters = [...value].length;
    if (characters > longest.characters) longest = { characters, key };
    csv.push([locale.code, locale.nativeName, step, field, key, value, data.beginnerTourTranslationStatus || "unspecified"]);
  }
  const commandLabels = [
    ["Импорт медиа", "tour.beginner.step1.body"],
    ["Разделить", "tour.beginner.step4.body"],
    ["Разделить", "tour.beginner.step4.tip"],
    ["Переходы", "tour.beginner.step6.body"],
    ["Экспорт", "tour.beginner.step7.body"]
  ];
  for (const [sourceLabel, key] of commandLabels) {
    const label = locale.code === "ru" ? sourceLabel : (packs[locale.code]?.messages?.[sourceLabel] || sourceLabel);
    if (!data.messages[key].toLocaleLowerCase().includes(label.toLocaleLowerCase())) {
      problems.push(`${locale.code}: ${key} does not use the current UI label “${label}”`);
    }
  }
  const terminologyConsistency = {
    fr: [
      ["tour.beginner.step3.title", "chronologie"],
      ["tour.beginner.step3.body", "chronologie"],
      ["tour.beginner.step4.tip", "chronologie"]
    ],
    ka: [
      ["tour.beginner.step3.title", "დროით ხაზზე"],
      ["tour.beginner.step3.body", "დროითი ხაზი"],
      ["tour.beginner.step4.tip", "დროით ხაზზე"]
    ],
    be: [
      ["tour.beginner.step3.title", "шкале часу"],
      ["tour.beginner.step3.body", "Шкала часу"],
      ["tour.beginner.step4.tip", "шкале часу"]
    ],
    tr: [["tour.beginner.step3.tip", "Kanallar"]],
    hy: [["tour.beginner.step3.tip", "Շերտերը"]],
    ky: [["tour.beginner.step3.tip", "Тилкелер"]],
    uz: [["tour.beginner.step3.tip", "Yo‘laklar"]],
    "uz-Cyrl": [["tour.beginner.step3.tip", "Йўлаклар"]]
  }[locale.code] || [];
  for (const [key, expectedTerm] of terminologyConsistency) {
    if (!data.messages[key].includes(expectedTerm)) {
      problems.push(`${locale.code}: ${key} is inconsistent with the approved UI term “${expectedTerm}”`);
    }
  }
  if (locale.code === "ka" && /[А-Яа-яЁё]/u.test(packMessages["Таймлайн"] || "")) {
    problems.push("ka: timeline UI term contains Cyrillic characters");
  }
  if (locale.code === "uz-Cyrl" && !String(packMessages["Видеодорожка"] || "").includes("Видео йўлаги")) {
    problems.push("uz-Cyrl: video-track label is not aligned with the guide terminology");
  }
  lengthCsv.push([locale.code, locale.nativeName, longest.characters, longest.key, "Tour card is height-limited and internally scrollable; verify on native Windows"]);
}
if (problems.length) {
  process.stderr.write(problems.join("\n") + "\n");
  process.exitCode = 1;
} else {
  const quote = value => `"${String(value).replace(/"/g, '""')}"`;
  fs.writeFileSync(path.join(root, "qa", "beginner-tour-translations-stage8.csv"), csv.map(row => row.map(quote).join(",")).join("\r\n") + "\r\n", "utf8");
  fs.writeFileSync(path.join(root, "qa", "beginner-tour-length-review-stage8.csv"), lengthCsv.map(row => row.map(quote).join(",")).join("\r\n") + "\r\n", "utf8");
  const maxLength = lengthCsv.slice(1).reduce((max, row) => Number(row[2]) > max.characters ? { characters: Number(row[2]), locale: row[0], key: row[3] } : max, { characters: 0, locale: "", key: "" });
  const result = {
    locales: manifest.available.length,
    keysPerLocale: expectedKeys.length,
    translations: manifest.available.length * expectedKeys.length,
    missing: 0,
    empty: 0,
    englishFallback: 0,
    longestString: maxLength,
    status: "PASS",
    review: "machine-assisted draft; native-speaker review pending for 34 preview locales"
  };
  fs.writeFileSync(path.join(root, "qa", "beginner-tour-qa-stage8.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
  process.stdout.write(`Beginner tour locale QA: PASS — ${result.locales} locales × ${result.keysPerLocale} keys = ${result.translations} translations; 0 missing, 0 empty, 0 English fallback.\n`);
}
