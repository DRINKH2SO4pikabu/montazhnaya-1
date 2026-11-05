"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../electron/i18n-core.cjs");

test("locale resolver canonicalizes regional tags and falls back safely", () => {
  assert.equal(core.resolveLocale("en-US", "ru-RU"), "en");
  assert.equal(core.resolveLocale("ru_RU", "en-US"), "ru");
  assert.equal(core.resolveLocale("fr-CA", "en-US"), "fr");
  assert.equal(core.resolveLocale("pt-PT", "en-US"), "pt-BR");
  assert.equal(core.resolveLocale("auto", "en-GB"), "en");
  assert.equal(core.resolveLocale("auto", "fi-FI"), "fi");
  assert.equal(core.resolveLocale("auto", "uz-Cyrl-UZ"), "uz-Cyrl");
  assert.equal(core.resolveLocale("uz-Cyrl", "en-US"), "uz-Cyrl");
  assert.equal(core.resolveLocale("auto", "uz-UZ"), "uz");
});

test("locale direction recognizes right-to-left language families", () => {
  assert.equal(core.directionForLocale("ar-SA"), "rtl");
  assert.equal(core.directionForLocale("he-IL"), "rtl");
  assert.equal(core.directionForLocale("ur-PK"), "rtl");
  assert.equal(core.directionForLocale("en-US"), "ltr");
  assert.equal(core.directionForLocale("ru-RU"), "ltr");
});

test("language pack sanitization accepts only bounded string translations", () => {
  const clean = core.sanitizeMessages({ Save: "Save", Invalid: 4, Nested: {}, Huge: "x".repeat(4001) });
  assert.equal(clean.Save, "Save");
  assert.equal(Object.hasOwn(clean, "Invalid"), false);
  assert.equal(Object.hasOwn(clean, "Nested"), false);
  assert.equal(Object.hasOwn(clean, "Huge"), false);
});

test("translation lookup returns the source text when a key is missing", () => {
  const messages = core.sanitizeMessages({ "Сохранить": "Save" });
  assert.equal(core.translate("Сохранить", messages), "Save");
  assert.equal(core.translate("Неизвестная строка", messages), "Неизвестная строка");
});

test("manifest exposes only installed language packs as available", () => {
  assert.equal(core.AVAILABLE_LOCALES.length, 36);
  assert.deepEqual(core.AVAILABLE_LOCALES.slice(0, 2).map(item => item.code), ["ru", "en"]);
  assert.ok(core.AVAILABLE_LOCALES.some(item => item.code === "de" && item.status === "preview"));
  assert.ok(core.AVAILABLE_LOCALES.some(item => item.code === "ar" && item.direction === "rtl"));
  for (const [code, tag] of [["kk", "kk-KZ"], ["uz", "uz-UZ"], ["ka", "ka-GE"], ["hy", "hy-AM"], ["tk", "tk-TM"], ["az", "az-AZ"], ["ky", "ky-KG"], ["tg", "tg-TJ"], ["be", "be-BY"]]) {
    assert.ok(core.AVAILABLE_LOCALES.some(item => item.code === code), `Missing locale ${code}`);
    assert.equal(core.resolveLocale("auto", tag), code, `System locale ${tag} should resolve to ${code}`);
  }
  assert.deepEqual(core.PLANNED_LOCALES, []);
});


test("parameterized UI messages translate dynamic counts without losing values", () => {
  const messages = core.sanitizeMessages({
    "Отсутствуют файлы: {count}": "Missing files: {count}",
    "Обнаружен несохранённый проект ({savedAt}): клипов {clips}, материалов {media}. Восстановить его?": "An unsaved project was found ({savedAt}): {clips} clips, {media} media items. Restore it?"
  });
  const patterns = core.compileMessagePatterns(messages);
  assert.equal(core.translate("Отсутствуют файлы: 3", messages, patterns), "Missing files: 3");
  assert.equal(core.translate("Обнаружен несохранённый проект (13:45): клипов 2, материалов 4. Восстановить его?", messages, patterns), "An unsaved project was found (13:45): 2 clips, 4 media items. Restore it?");
  assert.equal(core.translate("Совсем другая строка", messages, patterns), "Совсем другая строка");
});


test("unknown saved locale preferences normalize to automatic system detection", () => {
  assert.equal(core.resolveLocale("de-DE", "en-US"), "de");
  assert.equal(core.resolveLocale("auto", "en-US"), "en");
});
