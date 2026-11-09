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

test("live contextual-help translations cover every source string in all 34 locale packs", () => {
  const window = {
    MontazhnayaContextualHelpTranslations: {
      uk: { "Таймлайн": "Часова шкала" },
      kk: { "Таймлайн": "Уақыт шкаласы" }
    }
  };
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/contextual-help-translations.js"), context, {
    filename: "contextual-help-translations.js"
  });

  const packs = window.MontazhnayaContextualHelpTranslations;
  const expectedLocales = [
    "de", "fr", "es", "pt-BR", "it", "pl", "uk", "tr",
    "nl", "sv", "fi", "cs", "ro", "el", "vi", "id", "zh-CN", "zh-TW",
    "ar", "he", "hi", "kk",
    "ja", "ko", "th", "uz", "uz-Cyrl", "ka", "hy", "tk", "az", "ky", "tg", "be"
  ];
  assert.deepEqual(
    Array.from(window.MontazhnayaContextualHelpTranslationStatus.locales),
    expectedLocales
  );
  assert.equal(window.MontazhnayaContextualHelpTranslationStatus.sourceCount, 88);

  const sourceCatalogue = window.MontazhnayaContextualHelpSourceEnglish;
  assert.equal(Object.keys(sourceCatalogue).length, 88);
  const placeholders = value => Array.from(value.matchAll(/\{[a-z]+\}/g), match => match[0]).sort();

  for (const locale of expectedLocales) {
    for (const [source, englishFallback] of Object.entries(sourceCatalogue)) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(packs[locale], source),
        locale + "/" + source + " is missing"
      );
      const translated = packs[locale][source];
      assert.equal(typeof translated, "string", locale + "/" + source);
      assert.ok(translated.trim(), locale + "/" + source + " is empty");
      assert.notEqual(translated, englishFallback, locale + "/" + source + " still uses English");
      assert.deepEqual(
        placeholders(translated),
        placeholders(source),
        locale + "/" + source + " changed a dynamic placeholder"
      );
    }
  }

  assert.equal(packs.de["Меню «Файл»"], "Menü „Datei“");
  assert.equal(packs.fr["Монитор предпросмотра"], "Moniteur d’aperçu");
  assert.equal(packs.es["Панель свойств"], "Panel de propiedades");
  assert.equal(packs["pt-BR"]["Скорость клипа"], "Velocidade do clipe");
  assert.equal(packs.it["Вкладка «Медиа»"], "Scheda Media");
  assert.equal(packs.pl["Дорожка {track}"], "Ścieżka {track}");
  assert.equal(packs.uk["Дорожка {track}"], "Доріжка {track}");
  assert.equal(packs.tr["Управление дорожкой {track}"], "Kanal {track} denetimleri");
  assert.equal(packs.nl["Меню «Файл»"], "Menu Bestand");
  assert.equal(packs["zh-CN"]["Меню «Файл»"], "文件菜单");
  assert.equal(packs["zh-TW"]["Меню «Файл»"], "檔案選單");
  assert.equal(packs.ar["Меню «Файл»"], "قائمة ملف");
  assert.equal(packs.he["Меню «Файл»"], "תפריט קובץ");
  assert.equal(packs.hi["Меню «Файл»"], "फ़ाइल मेनू");
  assert.equal(packs.kk["Меню «Файл»"], "Файл мәзірі");
  assert.equal(packs.ja["Меню «Файл»"], "ファイルメニュー");
  assert.equal(packs.ko["Меню «Файл»"], "파일 메뉴");
  assert.equal(packs.th["Меню «Файл»"], "เมนูไฟล์");
  assert.equal(packs.uz["Меню «Файл»"], "Fayl menyusi");
  assert.equal(packs["uz-Cyrl"]["Меню «Файл»"], "Файл менюси");
  assert.equal(packs.ka["Меню «Файл»"], "ფაილის მენიუ");
  assert.equal(packs.hy["Меню «Файл»"], "Ֆայլի ընտրացանկ");
  assert.equal(packs.tk["Меню «Файл»"], "Faýl menýusy");
  assert.equal(packs.az["Меню «Файл»"], "Fayl menyusu");
  assert.equal(packs.ky["Меню «Файл»"], "Файл менюсу");
  assert.equal(packs.tg["Меню «Файл»"], "Менюи Файл");
  assert.equal(packs.be["Меню «Файл»"], "Меню «Файл»");
  assert.equal(packs.uk["Таймлайн"], "Часова шкала");
  assert.equal(packs.kk["Таймлайн"], "Уақыт шкаласы");
});

test("contextual-help GUI audit distinguishes English fallback from missing Cyrillic translations", () => {
  const audit = read("qa/tooltip-gui-audit.cjs");
  assert.match(audit, /api\.translateFallback\(value\)/);
  assert.match(audit, /englishFallbackFields\.push\(field\)/);
  assert.match(audit, /english-fallback-in-contextual-help/);
  assert.match(audit, /English fallback fields in live contextual help/);
  assert.match(audit, /english_fallback_fields/);
  assert.match(audit, /knownIdentical=\(locale==='uk'\|\|locale==='be'\)&&value==='Меню «Файл»'/);
  assert.match(audit, /\.\.\.report\.localeSummaries\.map\(item =>/);

  const i18n = read("src/renderer/i18n.js");
  assert.match(i18n, /translateFallback: source =>/);
});

test("contextual-help locale module loads after editorial overrides and before tooltip source setup", () => {
  const html = read("src/renderer/index.html");
  const editorial = html.indexOf('<script src="./locales/editorial-overrides.js"></script>');
  const contextual = html.indexOf('<script src="./locales/contextual-help-translations.js"></script>');
  const tooltipSource = html.indexOf('<script src="./locales/tooltip-source.js"></script>');
  assert.ok(editorial >= 0 && contextual > editorial && tooltipSource > contextual);
});
