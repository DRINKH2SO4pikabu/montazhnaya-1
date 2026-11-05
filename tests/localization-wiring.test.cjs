"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("renderer loads locale manifest and language packs before app bootstrap", () => {
  const html = read("src/renderer/index.html");
  const manifest = html.indexOf("./locales/manifest.js");
  const ru = html.indexOf("./locales/ru.js");
  const en = html.indexOf("./locales/en.js");
  const semantic = html.indexOf("./locales/semantic.js");
  const beginnerTour = html.indexOf("./locales/beginner-tour.js");
  const notifications = html.indexOf("./locales/notifications.js");
  const runtime = html.indexOf("./i18n.js");
  assert.ok(manifest >= 0 && ru > manifest && en > ru && semantic > en && beginnerTour > semantic && notifications > beginnerTour && runtime > notifications);
  assert.match(html, /<div class="menu menu-language" data-menu>\s*<button class="menu-btn" id="languageMenuBtn"[^>]*>Язык интерфейса…<\/button>\s*<\/div>/);
  const helpMenuStart = html.indexOf('<button class="menu-btn" type="button">Справка</button>');
  const languageMenuPosition = html.indexOf('id="languageMenuBtn"');
  assert.ok(languageMenuPosition > helpMenuStart, "language picker is a separate top-level menu item after Help");
  assert.doesNotMatch(html.slice(helpMenuStart, languageMenuPosition), /id="languageMenuBtn"/);
  assert.match(html, /MontazhnayaI18n\.init\(\)/);
  assert.match(html, /function openAboutDialog\(\)/);
  assert.doesNotMatch(html, /case "about":\s*alert\(/);
  assert.match(html, /transitionDurationValue/);
});

test("locale packs provide the required common screen labels in English", () => {
  const pack = read("src/renderer/locales/en.js");
  for (const phrase of ["Файл", "Правка", "Вид", "Переходы", "Справка", "Сохранить", "Импорт медиа", "Экспорт", "Свойства", "Таймлайн", "Предпросмотр"]) {
    assert.match(pack, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(pack, /Welcome to Montazhnaya/);
});

test("renderer locale resolver preserves script subtags for Uzbek Cyrillic", () => {
  const vm = require("node:vm");
  const context = {
    window: { MontazhnayaLocaleManifest: { available: [
      { code: "ru" }, { code: "en" }, { code: "uz" }, { code: "uz-Cyrl" }
    ], planned: [] } },
    navigator: { languages: ["uz-Cyrl-UZ"], language: "uz-Cyrl-UZ" }
  };
  vm.runInNewContext(read("src/renderer/i18n.js"), context);
  const api = context.window.MontazhnayaI18n;
  assert.equal(api.resolveLocale("uz-Cyrl-UZ"), "uz-Cyrl");
  assert.equal(api.resolveLocale("uz-UZ"), "uz");
  assert.equal(api.resolveLocale("auto"), "uz-Cyrl");
  assert.equal(api.detectSystemLocale(), "uz-Cyrl");
});

test("locale runtime preserves user media names and supports dynamic DOM updates", () => {
  const runtime = read("src/renderer/i18n.js");
  assert.match(runtime, /MutationObserver/);
  assert.match(runtime, /childList:\s*true, characterData:\s*true, attributes:\s*true/);
  assert.match(runtime, /attributeFilter: TRANSLATABLE_ATTRIBUTES/);
  assert.match(runtime, /textarea, \[contenteditable=/);
  assert.doesNotMatch(runtime, /"#mediaList"/, "the whole media library must remain translatable");
  assert.match(runtime, /"\.media-item"/, "individual media cards remain excluded so filenames are preserved");
  assert.match(runtime, /\.clip-name/);
  assert.match(runtime, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(runtime, /document\.documentElement\.lang/);
  assert.match(runtime, /document\.documentElement\.dir/);
});

test("English is the first-run language and explicit legacy choices are preserved", () => {
  const runtime = read("src/renderer/i18n.js");
  assert.match(runtime, /montazhnaya_locale_preference_v2/);
  assert.match(runtime, /LEGACY_STORAGE_KEY = "montazhnaya_locale_preference_v1"/);
  assert.match(runtime, /let currentLocale = "en"/);
  assert.match(runtime, /let currentPreference = "en"/);
  assert.match(runtime, /let preference = "en"/);
  assert.match(runtime, /preference = legacyPreference \|\| "en"/);
  assert.match(runtime, /using English/);
});

test("first launch is English on a Russian Windows locale and manual choice persists", async () => {
  const vm = require("node:vm");
  const window = { dispatchEvent() {} };
  const packContext = { window };
  vm.runInNewContext(read("src/renderer/locales/ru.js"), packContext);
  vm.runInNewContext(read("src/renderer/locales/en.js"), packContext);

  const storage = new Map();
  const body = {
    nodeType: 1,
    childNodes: [],
    closest() { return null; },
    hasAttribute() { return false; },
    getAttribute() { return null; },
    setAttribute() {}
  };
  const labelNode = { nodeType: 3, nodeValue: "Медиа ", parentElement: body };
  body.childNodes.push(labelNode);
  const documentElement = { dataset: {}, lang: "ru", dir: "ltr" };
  const document = {
    body,
    documentElement,
    title: "",
    getElementById() { return null; }
  };
  const context = {
    window,
    document,
    navigator: { languages: ["ru-RU"], language: "ru-RU" },
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); }
    },
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init.detail; }
  };
  vm.runInNewContext(read("src/renderer/i18n.js"), context);
  const api = window.MontazhnayaI18n;

  await api.init();
  assert.equal(documentElement.lang, "en", "first launch must not inherit the Russian OS locale");
  assert.equal(api.getPreference(), "en");
  assert.equal(storage.get("montazhnaya_locale_preference_v2"), "en");
  assert.equal(labelNode.nodeValue, "Media ", "inline counter spacing is preserved while translating the label");
  assert.equal(api.translate("Переходы "), "Transitions ");
  assert.equal(api.translate("Медиа "), "Media ");
  assert.equal(api.translate("Разрешение"), "Resolution");
  assert.equal(api.translate("ПРОЕКТ"), "PROJECT");

  await api.setLocale("ru");
  assert.equal(documentElement.lang, "ru");
  assert.equal(storage.get("montazhnaya_locale_preference_v2"), "ru");

  await api.setLocale("auto");
  assert.equal(documentElement.lang, "ru", "explicit system-language selection still uses the OS language");
  assert.equal(storage.get("montazhnaya_locale_preference_v2"), "auto");
});

test("renderer translation matches inline labels with surrounding HTML whitespace", () => {
  const runtime = read("src/renderer/i18n.js");
  assert.match(runtime, /const normalizedSource = source\.trim\(\)/);
  assert.match(runtime, /leadingWhitespace \+ messages\[normalizedSource\] \+ trailingWhitespace/);
  const html = read("src/renderer/index.html");
  assert.match(html, /content:"PROJECT"/);
  assert.match(html, /html\[lang="ru"\] body\.theme-dark-premium \.project-profile::before\{content:"ПРОЕКТ";/);
});

test("locale manifest contains BCP-47-ready packs and future language identifiers", () => {
  const manifest = read("src/renderer/locales/manifest.js");
  assert.match(manifest, /pt-BR/);
  assert.match(manifest, /zh-CN/);
  assert.match(manifest, /ar/);
  assert.match(manifest, /direction:\s*"rtl"/);
  assert.match(manifest, /file:\s*"\.\/locales\/international\.js"/);
  assert.match(manifest, /coverage:\s*"complete-source-map"/);
  assert.match(manifest, /translationStatus:\s*"preview"/);
  assert.match(read("src/renderer/i18n.js"), /item\.translationStatus === "preview"/);
});


test("English pack covers core clip/media properties and advanced editor dialogs", () => {
  const pack = read("src/renderer/locales/en.js");
  for (const phrase of ["Цветокоррекция", "Титры поверх клипа", "Громкость, %", "Режим входа", "Движение камеры", "Слайд-шоу из фотографий и музыки", "Диагностика FFmpeg и ffprobe", "Сохранить текущий кадр"]) {
    assert.ok(pack.includes(`\"${phrase}\"`), `Missing English mapping for ${phrase}`);
  }
  assert.match(pack, /Обнаружен несохранённый проект \({savedAt}\)/);
  assert.match(pack, /Отсутствуют файлы: \{count\}/);
  assert.match(read("src/renderer/i18n.js"), /compilePatterns/);
  assert.match(read("src/renderer/i18n.js"), /normalizePreference/);
});

test("release launchers and build batch files display the current package version", () => {
  for (const file of ["BUILD_WINDOWS_RELEASE.bat", "INSTALL_AND_RUN.bat", "tools/Start-Montazhnaya.ps1", "tools/Start-Montazhnaya-NVENC.ps1"]) {
    const source = read(file);
    assert.match(source, /3\.6\.45/, `${file} has stale version text`);
    assert.doesNotMatch(source, /3\.6\.29/);
  }
});


test("all 24 international preview packs register translations and RTL metadata", () => {
  const vm = require("node:vm");
  const context = { window: {} };
  vm.runInNewContext(read("src/renderer/locales/en.js"), context);
  vm.runInNewContext(read("src/renderer/locales/international.js"), context);
  const packs = context.window.MontazhnayaLocalePacks;
  const expected = ["de", "fr", "es", "pt-BR", "it", "pl", "uk", "tr", "zh-CN", "zh-TW", "ja", "ko", "ar", "he", "hi", "nl", "sv", "fi", "cs", "ro", "el", "vi", "id", "th"];
  for (const code of expected) {
    assert.ok(packs[code], `Missing ${code} pack`);
    assert.equal(packs[code].fallback, "en");
    assert.equal(packs[code].coverage, "complete-source-map");
    assert.equal(packs[code].translationStatus, "preview");
    assert.equal(Object.keys(packs[code].messages).length, 436, `${code} does not cover the full English source-key map`);
    const completedDraftLocales = new Set(["de", "fr", "es", "pt-BR", "it", "pl", "uk", "tr", "zh-CN", "zh-TW", "ja", "ko", "ar", "he", "hi", "nl", "sv", "fi", "cs", "ro", "el", "vi", "id", "th"]);
    const expectedFallbacks = completedDraftLocales.has(code) ? 0 : 135;
    const expectedLocaleMappings = 436 - expectedFallbacks;
    assert.equal(packs[code].localeMappedCount, expectedLocaleMappings, `${code} locale mapping count changed unexpectedly`);
    assert.equal(packs[code].englishFallbackCount, expectedFallbacks, `${code} English fallback count changed unexpectedly`);
    assert.equal(packs[code].englishFallbackKeys.length, expectedFallbacks);
    if (completedDraftLocales.has(code)) {
      assert.equal(packs[code].translationStage, "translation-draft-complete-review-pending");
      assert.equal(packs[code].englishFallbackKeys.length, 0);
    }
    assert.equal(packs[code].sourceMessageCount, 436);
    for (const key of ["Ripple-удалить", "Уместить по ширине", "Время", "sourceIn, с", "Звук уже отделён", "Обнаружен несохранённый проект ({savedAt}): клипов {clips}, материалов {media}. Восстановить его?"]) {
      assert.ok(packs[code].messages[key], `${code} is missing second-wave translation for ${key}`);
    }
    assert.ok(packs[code].messages["Длительность источника"], `${code} is missing clip-property translations`);
    assert.ok(packs[code].messages["Диагностика FFmpeg и ffprobe"], `${code} is missing diagnostics translations`);
    assert.ok(packs[code].messages["Импортировано файлов: {count}"].includes("{count}"), `${code} lost a dynamic count placeholder`);
    assert.ok(packs[code].messages["Экспорт {format} завершён: {file}"].includes("{format}") && packs[code].messages["Экспорт {format} завершён: {file}"].includes("{file}"), `${code} lost export placeholders`);
  }
  for (const code of ["uk", "tr", "zh-CN", "zh-TW", "ja", "ko", "ar", "he", "hi", "nl", "sv", "fi"]) {
    for (const [source, translated] of Object.entries(packs[code].messages)) {
      const sourceTokens = (source.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) || []).sort();
      const translatedTokens = (translated.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) || []).sort();
      assert.deepEqual(translatedTokens, sourceTokens, `${code} changed placeholders for ${source}`);
    }
  }
  const renderer = read("src/renderer/index.html");
  assert.match(renderer, /html\[lang\^="zh"\] body/);
  assert.match(renderer, /html\[lang\^="ja"\] body/);
  assert.match(renderer, /html\[lang\^="ko"\] body/);
  assert.match(renderer, /html\[lang\^="ar"\] body/);
  assert.match(renderer, /html\[lang\^="he"\] body/);
  assert.match(renderer, /html\[lang\^="hi"\] body/);
  assert.match(renderer, /html\[lang\^="th"\] body/);
  assert.match(renderer, /html\[lang\^="vi"\] body/);
  assert.match(renderer, /Leelawadee UI/);
  assert.match(renderer, /overflow-wrap:anywhere/);
  assert.match(renderer, /word-break:normal/);
  assert.equal(packs.ar.direction, "rtl");
  assert.equal(packs.he.direction, "rtl");
  for (const code of expected) {
    const messages = packs[code].messages;
    for (const [source] of Object.entries(packs.en.messages)) {
      assert.ok(Object.hasOwn(messages, source), `${code} is missing source key ${source}`);
    }
    for (const source of packs[code].englishFallbackKeys) {
      assert.equal(messages[source], packs.en.messages[source], `${code} English fallback mismatch for ${source}`);
    }
    for (const source of ["Из чёрного", "Круговая диафрагма", "Мягкий фокус", "Новый кадр раскрывается слева направо", "Лёгкий вращательный переход"]) {
      assert.ok(Object.hasOwn(messages, source) && typeof messages[source] === "string" && messages[source].trim(), `${code} is missing third-wave transition localization for ${source}`);
    }
  }
  assert.ok(packs.de.messages["Можно экспортировать только фрагмент. Время указывается в секундах относительно начала таймлайна, а точность границ округляется к выбранной частоте кадров."]);
  assert.ok(packs.fr.messages["Сохранится вся композиция на текущей позиции таймлайна: видимые видеослои, переходы, цветокоррекция, трансформации и титры. Монтажные направляющие в изображение не попадут."]);
  for (const code of ["de", "fr", "es", "pt-BR", "it", "pl"]) {
    assert.equal(packs[code].englishFallbackCount, 0, `${code} should have no English fallback entries in this draft wave`);
    assert.ok(packs[code].messages["Не удалось однозначно найти пару. Проверь, что выбраны исходные видео и отделённый от него звук."], `${code} is missing the linked-media diagnostic`);
    assert.ok(packs[code].messages["Проверяется наличие FFmpeg и ffprobe, а также кодировщики H.264/AAC и VP8/VP9/Opus, PNG-декодер и контейнеры MP4/WebM. Редактор создаёт короткие тестовые файлы каждого доступного варианта и проверяет потоки и временные метки через ffprobe. Временные файлы удаляются после проверки."], `${code} is missing long-form diagnostics help`);
  }
  for (const code of expected) {
    assert.equal(packs[code].englishFallbackCount, 0, `${code} should have no English fallback entries in this draft wave`);
    assert.equal(packs[code].localeMappedCount, 436);
    assert.equal(packs[code].translationStage, "translation-draft-complete-review-pending");
    if (["cs", "ro", "el", "vi", "id", "th"].includes(code)) {
      assert.equal(packs[code].completedTranslationWave, "beta-3.6.40-phase-7");
    }
  }
  for (const code of ["ar", "he", "hi", "nl", "sv", "fi", "cs", "ro", "el", "vi", "id", "th"]) {
    assert.equal(packs[code].englishFallbackCount, 0, `${code} should have no English fallback entries in this draft wave`);
    assert.equal(packs[code].translationStage, "translation-draft-complete-review-pending");
  }
  const aboutKey = "Монтажная beta 3.6.44 — монтаж фото, аудио и видео";
  for (const code of expected) {
    assert.equal(packs[code].messages[aboutKey], packs[code].appTitle, `${code} About dialog should use its localized app title`);
    assert.doesNotMatch(packs[code].messages[aboutKey], /3\.6\.44/, `${code} has a stale About version label`);
  }
  assert.equal(Object.keys(packs.en.messages).length, 436);
});

test("English language pack has a substantial reviewed dictionary rather than only menu placeholders", () => {
  const vm = require("node:vm");
  const context = { window: {} };
  vm.runInNewContext(read("src/renderer/locales/en.js"), context);
  const messages = context.window.MontazhnayaLocalePacks.en.messages;
  assert.ok(Object.keys(messages).length >= 400);
  assert.equal(messages["Цветокоррекция"], "Color Correction");
  assert.equal(messages["Мягкий фокус"], "Soft Focus");
  assert.equal(messages["Диагностика FFmpeg и ffprobe"], "FFmpeg & ffprobe Diagnostics");
});


test("expanded locale packs preserve all dynamic placeholders and include long-form export help", () => {
  const vm = require("node:vm");
  const context = { window: {} };
  vm.runInNewContext(read("src/renderer/locales/en.js"), context);
  vm.runInNewContext(read("src/renderer/locales/international.js"), context);
  const packs = context.window.MontazhnayaLocalePacks;
  const getTokens = value => [...String(value).matchAll(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g)].map(match => match[0]).sort();
  for (const code of ["de", "fr", "es", "pt-BR", "it", "pl", "uk", "tr", "zh-CN", "zh-TW", "ja", "ko", "ar", "he", "hi", "nl", "sv", "fi", "cs", "ro", "el", "vi", "id", "th"]) {
    const messages = packs[code].messages;
    for (const [source, translated] of Object.entries(messages)) {
      assert.ok(typeof translated === "string" && translated.trim().length > 0, `${code} has an empty translation for ${source}`);
      assert.deepEqual(getTokens(translated), getTokens(source), `${code} changed a placeholder in ${source}`);
    }
    assert.ok(messages["Можно экспортировать только фрагмент. Время указывается в секундах относительно начала таймлайна, а точность границ округляется к выбранной частоте кадров."]);
    assert.ok(messages["Сохранится вся композиция на текущей позиции таймлайна: видимые видеослои, переходы, цветокоррекция, трансформации и титры. Монтажные направляющие в изображение не попадут."]);
  }
});


test("CIS and Caucasus language packs register regional workflow translations and Uzbek Cyrillic", () => {
  const vm = require("node:vm");
  const context = { window: {} };
  vm.runInNewContext(read("src/renderer/locales/en.js"), context);
  vm.runInNewContext(read("src/renderer/locales/cis.js"), context);
  const packs = context.window.MontazhnayaLocalePacks;
  const expected = ["kk", "uz", "ka", "hy", "tk", "az", "ky", "tg", "be"];
  const requiredSource = ["Файл", "Новый проект", "Открыть проект…", "Экспорт видео…", "Переходы", "Таймлайн", "Справка"];
  const sourceMessages = packs.en.messages;
  for (const code of expected) {
    const pack = packs[code];
    assert.ok(pack, `Missing CIS/Caucasus locale ${code}`);
    assert.equal(pack.translationStatus, "preview");
    assert.equal(pack.sourceMessageCount, 436);
    const wave3 = ["kk", "uz", "ka", "az"].includes(code);
    const wave4 = ["hy", "tk", "ky", "tg", "be"].includes(code);
    assert.equal(pack.coverage, (wave3 || wave4) ? "regional-workflows-436" : "core-commands-81");
    assert.equal(pack.englishFallbackCount, (wave3 || wave4) ? 0 : 353);
    assert.equal(pack.englishFallbackKeys.length, (wave3 || wave4) ? 0 : 353);
    assert.equal(pack.localeMappedCount, (wave3 || wave4) ? 436 : 83);
    assert.equal(pack.localeMappedCount + pack.englishFallbackCount, 436);
    for (const source of requiredSource) {
      assert.ok(typeof pack.messages[source] === "string" && pack.messages[source].trim(), `${code} missing ${source}`);
      assert.notEqual(pack.messages[source], sourceMessages[source], `${code} untranslated core command ${source}`);
    }
    for (const source of pack.englishFallbackKeys) {
      assert.equal(pack.messages[source], undefined, `${code} fallback key should not be marked as translated`);
      assert.ok(sourceMessages[source], `${code} references an unknown fallback key`);
    }
    const aboutKey = "Монтажная beta 3.6.44 — монтаж фото, аудио и видео";
    assert.ok(pack.messages[aboutKey].includes("Montazhnaya"));
    assert.ok(pack.messages[aboutKey].includes("3.6.45"));
    if (wave3 || wave4) {
      for (const source of ["Длительность источника", "Цветокоррекция", "Титры поверх клипа", "Звук уже отделён", "Создать слайд-шоу", "Диагностика FFmpeg и ffprobe", "Не удалось однозначно найти пару. Проверь, что выбраны исходные видео и отделённый от него звук."]) {
        assert.ok(typeof pack.messages[source] === "string" && pack.messages[source].trim(), `${code} missing regional workflow translation for ${source}`);
        assert.notEqual(pack.messages[source], sourceMessages[source], `${code} fallback for ${source}`);
      }
      if (wave3) {
        assert.equal(pack.translationStage, "cis-central-asia-wave-3-review-pending");
        assert.equal(pack.completedTranslationWave, "beta-3.6.43-cis-wave-3");
      }
      if (wave4) {
        assert.equal(pack.translationStage, "regional-translation-draft-complete-review-pending");
        assert.equal(pack.completedTranslationWave, "beta-3.6.44-cis-wave-4");
        assert.equal(pack.translationQuality, "draft-needs-native-review");
        assert.equal(pack.fontFamily, code === "hy" ? "Armenian" : code === "tk" ? "TurkmenLatin" : "Cyrillic");
      }
      for (const [source, translated] of Object.entries(pack.messages)) {
        const sourceTokens = (source.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) || []).sort();
        const translatedTokens = (translated.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) || []).sort();
        assert.deepEqual(translatedTokens, sourceTokens, `${code} changed dynamic placeholders for ${source}`);
      }
    }
  }

  const uzCyrl = packs["uz-Cyrl"];
  assert.ok(uzCyrl, "Missing Uzbek Cyrillic script variant");
  assert.equal(uzCyrl.code, "uz-Cyrl");
  assert.equal(uzCyrl.localeMappedCount, 436);
  assert.equal(uzCyrl.englishFallbackCount, 0);
  assert.equal(uzCyrl.translationQuality, "transliteration-draft");
  assert.equal(uzCyrl.translationStage, "uzbek-cyrillic-transliteration-review-pending");
  assert.equal(uzCyrl.completedTranslationWave, "beta-3.6.43-uzbek-cyrillic");
  assert.equal(uzCyrl.messages["Новый проект"], "Янги лойиҳа");
  assert.ok(uzCyrl.messages["Монтажная beta 3.6.44 — монтаж фото, аудио и видео"].includes("3.6.45"));
  for (const [source, translated] of Object.entries(uzCyrl.messages)) {
    const sourceTokens = (source.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) || []).sort();
    const translatedTokens = (translated.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) || []).sort();
    assert.deepEqual(translatedTokens, sourceTokens, `uz-Cyrl changed dynamic placeholders for ${source}`);
  }

  const manifest = read("src/renderer/locales/manifest.js");
  for (const code of [...expected, "uz-Cyrl"]) assert.match(manifest, new RegExp(`code: "${code}"`));
  for (const code of ["hy", "tk", "ky", "tg", "be"]) assert.match(manifest, new RegExp(`code: "${code}"[^\n]*coverage: "regional-workflows-436"`));
  assert.match(manifest, /englishName: "Uzbek \(Cyrillic\)"/);
  assert.ok(manifest.includes('file: "./locales/cis.js"'));
  const renderer = read("src/renderer/index.html");
  assert.match(renderer, /html\[lang\^="ka"\] body/);
  assert.match(renderer, /html\[lang\^="hy"\] body/);
  assert.match(renderer, /html\[lang\^="tk"\] body/);
  assert.match(renderer, /html\[lang\^="ky"\] body/);
  assert.match(renderer, /html\[lang\^="tg"\] body/);
  assert.match(renderer, /html\[lang\^="be"\] body/);
  assert.match(read("electron/i18n-core.cjs"), /uz-Cyrl/);
});
