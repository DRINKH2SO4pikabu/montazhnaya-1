"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function loadHelpFallback() {
  const window = {
    MontazhnayaLocalePacks: {
      en: {
        direction: "ltr",
        appTitle: "Montazhnaya",
        messages: Object.create(null)
      }
    }
  };
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/guides-en.js"), context, {
    filename: "guides-en.js"
  });
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, {
    filename: "tooltip-source.js"
  });
  return window;
}

test("every canonical action and control help string has an English fallback", () => {
  const window = loadHelpFallback();
  const source = window.MontazhnayaTooltipSource;
  const messages = window.MontazhnayaLocalePacks.en.messages;

  for (const name of ["UI_HELP_ACTIONS", "UI_HELP_IDS"]) {
    for (const [key, values] of Object.entries(source[name])) {
      for (const [index, value] of values.entries()) {
        if (!/[А-Яа-яЁё]/u.test(value)) continue;
        assert.ok(
          Object.prototype.hasOwnProperty.call(messages, value),
          name + "/" + key + "/" + index + " is missing from the English fallback: " + value
        );
      }
    }
  }
});

test("dynamic timeline help uses translatable templates for user values", () => {
  const window = loadHelpFallback();
  const messages = window.MontazhnayaLocalePacks.en.messages;
  const requiredTemplates = [
    "Дорожка {track}",
    "Управление дорожкой {track}",
    "Клип: {name}",
    "Клип на таймлайне",
    "Исходник: {name}",
    "Маркер: {name}",
    "Тип: {kind}. Начало: {start}, длительность: {duration}. Нажми Ctrl+Z, если результат случайный.",
    "{meta}. Перемещение исходника на таймлайн не меняет оригинальный файл.",
    "{tip} Установленная длительность: {duration} с."
  ];

  for (const key of requiredTemplates) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(messages, key),
      "Dynamic contextual-help template is missing: " + key
    );
  }
});

test("the renderer identifies menus and nested controls without relying on translated labels", () => {
  const html = read("src/renderer/index.html");
  for (const menu of ["file", "edit", "view", "transitions", "help"]) {
    assert.ok(html.includes('data-help-menu="' + menu + '"'), "Missing stable menu marker: " + menu);
  }

  assert.match(html, /const nestedControl = el\?\.matches\?\.\('input,select,textarea'\) \? el : el\?\.querySelector\?\.\('input,select,textarea'\)/);
  assert.match(html, /const id = el\?\.id \|\| nestedControl\?\.id/);
  assert.match(html, /key\.textContent=uiText\(def\.shortcut\)/);
  assert.match(html, /if \(\(window\.MontazhnayaI18n\?\.getLocale\?\.\(\) \|\| 'ru'\) !== 'ru'\) return def/);
});

test("dynamic tooltips have explicit definitions for editor menus and current controls", () => {
  const html = read("src/renderer/index.html");
  for (const token of [
    "data-help-menu",
    "tool-diagnostics",
    "clipSpeedSelect",
    "side-panel-head",
    "preview-panel-head",
    "beginnerTourNext",
    "tl-title",
    "tl-corner",
    "title:track?.label ? 'Дорожка ' + track.label",
    "title:track?.label ? 'Управление дорожкой ' + track.label"
  ]) {
    assert.ok(html.includes(token), "Contextual-help definition is missing " + token);
  }
});

test("Arabic contextual-help typography reserves additional line height", () => {
  const html = read("src/renderer/index.html");
  assert.match(html, /html\[dir="rtl"\] \.fhelp-title\{line-height:1\.75/);
  assert.match(html, /html\[dir="rtl"\] \.fhelp-text\{line-height:1\.85/);
  assert.match(html, /html\[dir="rtl"\] \.fhelp-tip\{line-height:1\.8/);
});

test("Ukrainian and Kazakh contextual timeline labels are localized without changing Russian source copy", () => {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/editorial-overrides.js"), context, {
    filename: "editorial-overrides.js"
  });
  assert.equal(
    window.MontazhnayaContextualHelpTranslations.uk["Таймлайн"],
    "Часова шкала"
  );
  assert.equal(
    window.MontazhnayaContextualHelpTranslations.kk["Таймлайн"],
    "Уақыт шкаласы"
  );

  const i18n = read("src/renderer/i18n.js");
  assert.match(i18n, /const contextualHelp = root\.MontazhnayaContextualHelpTranslations\?\.\[locale\]/);
  assert.match(i18n, /contextualHelp \|\| \{\}/);
});
