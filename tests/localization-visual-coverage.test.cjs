"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.join(__dirname, "..");
const rendererHtml = fs.readFileSync(path.join(projectRoot, "src/renderer/index.html"), "utf8");
const localeDir = path.join(projectRoot, "src/renderer/locales");

function loadLocalePacks() {
  const sandbox = { console, Intl, Map, Set };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const files = [
    "manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js",
    "semantic.js", "beginner-tour.js", "notifications.js", "ipc-error-translations.js", "international.js", "cis.js"
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(localeDir, file), "utf8");
    vm.runInContext(source, sandbox, { filename: file, timeout: 20_000 });
  }
  for (const code of Object.keys(sandbox.MontazhnayaLocalePacks)) {
    sandbox.MontazhnayaNotificationCatalog?.augmentLocale?.(code);
  }
  return { packs: sandbox.MontazhnayaLocalePacks, semantic: sandbox.MontazhnayaSemanticCatalog };
}

const { packs, semantic } = loadLocalePacks();
const welcomeStrings = [
  "Добро пожаловать в «Монтажную»!",
  "Покажу основные действия простыми шагами. Ничего не изменится, пока ты сам не нажмёшь нужную кнопку.",
  "Можно идти в своём темпе и в любой момент закрыть знакомство.",
  "Знакомство с редактором",
  "Позже",
  "Начать знакомство"
];
const emptyTimelineHint = "Перетащите материал из библиотеки на дорожку";

test("welcome tour uses canonical strings translated in all 36 locale packs", () => {
  assert.equal(Object.keys(packs).length, 36);
  for (const [code, pack] of Object.entries(packs)) {
    for (const phrase of welcomeStrings) {
      if (code === "ru") continue; // Russian is the source language; source text is the correct rendering.
      assert.equal(typeof pack.messages[phrase], "string", `${code} is missing tour translation: ${phrase}`);
      assert.ok(pack.messages[phrase].trim(), `${code} has an empty tour translation: ${phrase}`);
    }
  }
  assert.match(rendererHtml, /text\.textContent=uiText\('Покажу основные действия простыми шагами\./);
  assert.match(rendererHtml, /tip\.textContent=uiText\('Можно идти в своём темпе/);
  assert.match(rendererHtml, /count\.textContent=uiText\('Знакомство с редактором'\)/);
  assert.doesNotMatch(rendererHtml, /Покажу, как собрать простой ролик: добавить файлы/);
});

test("empty-timeline instruction is localized and populated-timeline summary uses plural and number formatters", () => {
  for (const [code, pack] of Object.entries(packs)) {
    if (code === "ru") continue;
    assert.equal(typeof pack.messages[emptyTimelineHint], "string", `${code} is missing the timeline hint`);
    assert.ok(pack.messages[emptyTimelineHint].trim(), `${code} has an empty timeline hint`);
  }
  const updateBlock = rendererHtml.match(/function updateTimelineHint\(\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(updateBlock, "updateTimelineHint function exists");
  assert.match(updateBlock, /uiCount\("clip",\s*countClips\(\)\)/);
  assert.match(updateBlock, /uiText\("Переходы"\)/);
  assert.match(updateBlock, /uiNumber\(countAppliedTransitions\(\)\)/);
  assert.match(updateBlock, /uiText\("Перетащите материал из библиотеки на дорожку"\)/);
  assert.doesNotMatch(updateBlock, /Медиа: перетащите на дорожку/);
  const i18nSource = fs.readFileSync(path.join(projectRoot, "src/renderer/i18n.js"), "utf8");
  assert.doesNotMatch(i18nSource, /"#mediaList"/, "do not exclude the whole media list; its empty-state UI must be translated");
  assert.match(i18nSource, /"\.media-item"/, "individual media cards remain protected from translating user filenames");
});


test("timeline track heading has a locale-specific semantic translation in all 36 languages", () => {
  assert.equal(Object.keys(packs).length, 36);
  for (const [code, data] of Object.entries(semantic)) {
    const value = data.messages?.["status.timeline.tracks"];
    assert.equal(typeof value, "string", `${code} is missing status.timeline.tracks`);
    assert.ok(value.trim(), `${code} has an empty track-heading translation`);
    if (code !== "ru" && code !== "en") assert.notEqual(value, "Tracks", `${code} incorrectly falls back to English`);
  }
  const renderer = fs.readFileSync(path.join(projectRoot, "src/renderer/index.html"), "utf8");
  assert.match(renderer, /corner\.className = "tl-corner"; corner\.textContent = uiT\("status\.timeline\.tracks"\)/);
  assert.match(renderer, /montazhnaya:locale-changed[\s\S]{0,180}tl-corner[\s\S]{0,120}uiT\("status\.timeline\.tracks"\)/, "timeline heading must refresh after locale changes");
});
