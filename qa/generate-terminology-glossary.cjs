"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const context = { window: {} };
vm.createContext(context);
for (const file of ["src/renderer/locales/manifest.js", "src/renderer/locales/ru.js", "src/renderer/locales/en.js", "src/renderer/locales/international.js", "src/renderer/locales/cis.js", "src/renderer/locales/editorial-overrides.js"]) {
  vm.runInContext(read(file), context, { filename: file });
}
const { available } = context.window.MontazhnayaLocaleManifest;
for (const entry of available) context.window.MontazhnayaApplyEditorialOverrides?.(entry.code);
const packs = context.window.MontazhnayaLocalePacks;
const terms = [
  ["Таймлайн", "Рабочая область монтажа"],
  ["Видеодорожка", "Дорожка видеоклипов"],
  ["Клип", "Элемент монтажа"],
  ["Переходы", "Переходы между клипами"],
  ["Разделить на курсоре", "Разрез клипа по курсору"],
  ["Ripple-удалить", "Удаление со сдвигом"],
  ["Кадр", "Единица видеопоследовательности"],
  ["Частота кадров проекта", "FPS проекта"],
  ["Разрешение проекта", "Размер кадра проекта"],
  ["Цветокоррекция", "Цвет и тон"],
  ["Титры поверх клипа", "Текстовые наложения"],
  ["Громкость, %", "Уровень звука"],
  ["Экспорт", "Создание итогового файла"],
  ["Имя файла", "Имя выходного файла"],
  ["Разрешение", "Размер изображения"],
  ["Прилипание", "Магнитное выравнивание"],
  ["Сохранить текущий кадр", "Снимок кадра"],
  ["Отделить звук на аудиодорожку", "Извлечение звука"],
  ["Связать видео и аудио", "Связанные видео и звук"],
  ["Длительность перехода", "Время эффекта перехода"],
  ["Положение", "Position — расположение объекта"],
  ["Позиция", "Position — расположение объекта"],
  ["Слайд-шоу", "Последовательность фотографий"],
  ["Открыть проект…", "Загрузка проекта"],
  ["Восстановить медиафайлы…", "Повторное связывание исходников"]
];
for (const [source] of terms) if (!Object.hasOwn(packs.en.messages, source)) throw new Error(`Missing glossary source key: ${source}`);
const locales = available.map(entry => {
  const code = entry.code;
  const messages = code === "ru" ? null : packs[code]?.messages;
  if (code !== "ru" && !messages) throw new Error(`Missing locale messages for ${code}`);
  return {
    code,
    nativeName: entry.nativeName,
    englishName: entry.englishName,
    direction: entry.direction || packs[code]?.direction || "ltr",
    translations: Object.fromEntries(terms.map(([source]) => [source, code === "ru" ? source : code === "en" ? packs.en.messages[source] : messages[source]]))
  };
});
const payload = {
  version: "3.6.45",
  terms: terms.map(([source, note]) => ({ source, english: packs.en.messages[source], context: note })),
  locales
};
fs.writeFileSync(path.join(root, "qa", "terminology-glossary-beta-3.6.45.json"), JSON.stringify(payload, null, 2));
const csvHeader = ["locale_code", "native_name", "direction", ...terms.map(([source]) => source)];
const csvRows = [csvHeader, ...locales.map(locale => [locale.code, locale.nativeName, locale.direction, ...terms.map(([source]) => locale.translations[source])])];
const csv = "\uFEFF" + csvRows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n") + "\r\n";
fs.writeFileSync(path.join(root, "qa", "terminology-glossary-beta-3.6.45.csv"), csv);
const lines = [
  "# Montazhnaya Beta 3.6.45 — editing terminology glossary",
  "",
  "This is a working glossary extracted from the effective runtime messages of the 36 selectable locale variants, including the Stage 8 editorial correction layer. Russian is the source language; English is the reference language. The CSV contains one row per locale and one column per editing concept.",
  "",
  "| Russian source | English reference | Editorial context |",
  "|---|---|---|",
  ...terms.map(([source, context]) => `| ${source} | ${packs.en.messages[source]} | ${context} |`),
  "",
  "## Term consistency rule",
  "",
  "Where several Russian source labels map to the same English editing concept, their target-language wording must remain consistent unless the UI context requires a documented distinction. In this release, the duplicate ‘Position’ labels are unified for Ukrainian, Czech, Kyrgyz and Belarusian.",
  "",
  "The glossary includes a machine-assisted Stage 8 terminology edit, but it is an editorial aid, not a native-speaker certification. Each locale remains a preview until terminology and naturalness are reviewed by a fluent editor.",
  "",
  "Files: `terminology-glossary-beta-3.6.45.csv` (spreadsheet-friendly matrix) and `terminology-glossary-beta-3.6.45.json` (structured source).",
  ""
];
fs.writeFileSync(path.join(root, "qa", "terminology-glossary-beta-3.6.45.md"), lines.join("\n"));
console.log(JSON.stringify({ locales: locales.length, terms: terms.length, output: "qa/terminology-glossary-beta-3.6.45.*" }));
