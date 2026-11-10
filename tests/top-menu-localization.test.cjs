"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function loadLocaleRuntime() {
  const window = {};
  const context = { window, Intl };
  vm.createContext(context);
  for (const file of [
    "src/renderer/locales/manifest.js",
    "src/renderer/locales/ru.js",
    "src/renderer/locales/en.js",
    "src/renderer/locales/source-messages.js",
    "src/renderer/locales/international.js",
    "src/renderer/locales/cis.js",
    "src/renderer/locales/editorial-overrides.js"
  ]) {
    vm.runInContext(read(file), context, { filename: file });
  }
  for (const entry of window.MontazhnayaLocaleManifest.available) {
    window.MontazhnayaApplyEditorialOverrides?.(entry.code);
  }
  return window;
}

function readTopMenuSources() {
  const html = read("src/renderer/index.html");
  const navStart = html.indexOf('<nav class="menus">');
  assert.ok(navStart >= 0, "The top menu navigation must exist.");
  const navEnd = html.indexOf("</nav>", navStart);
  assert.ok(navEnd > navStart, "The top menu navigation must close.");
  const nav = html.slice(navStart, navEnd + "</nav>".length);
  const stripMarkup = value => value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
  const buttons = [];
  const shortcutTexts = [];

  for (const match of nav.matchAll(/<button\\b([^>]*)>([\\s\\S]*?)<\\/button>/g)) {
    const attributes = match[1];
    const inner = match[2];
    const className = (attributes.match(/\\bclass="([^"]*)"/) || [])[1] || "";
    const isMenuButton = /(?:^|\\s)menu-btn(?:\\s|$)/.test(className);
    const isMenuItem = /(?:^|\\s)menu-item(?:\\s|$)/.test(className);
    if (!isMenuButton && !isMenuItem) continue;

    const action = (attributes.match(/\\bdata-action="([^"]+)"/) || [])[1] || null;
    const labelHtml = inner.replace(/<span\\s+class="shortcut">[\\s\\S]*?<\\/span>/g, "");
    const label = stripMarkup(labelHtml);
    assert.ok(label, "Every top-menu button must have a visible label.");

    buttons.push({
      kind: isMenuButton ? "menu" : "item",
      label,
      action
    });

    for (const shortcutMatch of inner.matchAll(/<span\\s+class="shortcut">([\\s\\S]*?)<\\/span>/g)) {
      const value = stripMarkup(shortcutMatch[1]);
      if (!value) continue;
      const looksLikeShortcut = /^(?:(?:Ctrl|Alt|Shift|Meta)(?:\\+[A-Za-z0-9←→]+)+|Delete|Del|Home|End|Space|[A-Z])$/.test(value);
      if (looksLikeShortcut) shortcutTexts.push(value);
      else buttons.push({ kind: "badge", label: value, action: null });
    }
  }

  const menuKeys = [...nav.matchAll(/data-help-menu="([^"]+)"/g)].map(match => match[1]);
  return { buttons, shortcutTexts, menuKeys };
}

test("the five top dropdowns and language selector expose a complete translatable source catalogue", () => {
  const window = loadLocaleRuntime();
  const { buttons, shortcutTexts, menuKeys } = readTopMenuSources();
  const english = window.MontazhnayaLocalePacks.en.messages;
  const uniqueKeys = [...new Set(buttons.map(item => item.label))];

  assert.deepEqual(menuKeys, ["file", "edit", "view", "transitions", "help"]);
  assert.equal(buttons.filter(item => item.kind === "menu").length, 6);
  assert.equal(buttons.filter(item => item.kind === "item").length, 46);
  assert.equal(buttons.filter(item => item.kind === "badge").length, 1);
  assert.equal(shortcutTexts.length, 22);

  for (const source of uniqueKeys) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(english, source),
      "Visible top-menu label is missing from the canonical English dictionary: " + source
    );
    assert.ok(english[source].trim(), "English reference is empty for top-menu label: " + source);
  }

  const actionIds = buttons.filter(item => item.kind === "item" && item.action).map(item => item.action);
  assert.equal(new Set(actionIds).size, actionIds.length, "Top-menu action IDs must be unique.");
  assert.ok(buttons.some(item => item.kind === "item" && item.label === "Пошаговое знакомство"),
    "The Guided Tour entry must be included even though it is wired by its DOM ID.");
});

test("every top-menu label is translated explicitly in all 34 preview locales", () => {
  const window = loadLocaleRuntime();
  const manifest = window.MontazhnayaLocaleManifest;
  const packs = window.MontazhnayaLocalePacks;
  const { buttons } = readTopMenuSources();
  const uniqueKeys = [...new Set(buttons.map(item => item.label))];
  const previewCodes = manifest.available
    .filter(entry => entry.code !== "ru" && entry.code !== "en")
    .map(entry => entry.code);

  assert.equal(manifest.available.length, 36);
  assert.equal(previewCodes.length, 34);

  const issues = [];
  const checked = {};

  for (const code of previewCodes) {
    const pack = packs[code];
    assert.ok(pack && pack.messages, "Missing locale pack: " + code);
    const fallbackKeys = new Set(pack.englishFallbackKeys || []);
    let translated = 0;

    for (const source of uniqueKeys) {
      const value = pack.messages[source];
      if (typeof value !== "string" || !value.trim()) {
        issues.push({ locale: code, source, issue: "missing-or-empty" });
        continue;
      }
      if (fallbackKeys.has(source)) {
        issues.push({ locale: code, source, issue: "declared-english-fallback" });
      }
      if (value === source) {
        issues.push({ locale: code, source, issue: "unchanged-russian-source" });
      }
      if (value === packs.en.messages[source]) {
        issues.push({ locale: code, source, issue: "unchanged-english-reference" });
      }
      if (value !== source && value !== packs.en.messages[source] && !fallbackKeys.has(source)) translated += 1;
    }

    checked[code] = { checked: uniqueKeys.length, explicitlyTranslated: translated };
  }

  assert.deepEqual(
    issues,
    [],
    "Top-menu translation gaps were found: " + JSON.stringify(issues.slice(0, 40), null, 2)
  );
  for (const [code, result] of Object.entries(checked)) {
    assert.equal(result.explicitlyTranslated, result.checked, code + " has incomplete top-menu translations.");
  }
});

test("keyboard shortcuts in the top menus remain stable across locale changes", () => {
  const window = loadLocaleRuntime();
  const { shortcutTexts } = readTopMenuSources();
  const uniqueShortcuts = [...new Set(shortcutTexts)];
  const sourceMessages = window.MontazhnayaLocalePacks.en.messages;

  for (const shortcut of uniqueShortcuts) {
    if (Object.prototype.hasOwnProperty.call(sourceMessages, shortcut)) {
      assert.equal(sourceMessages[shortcut], shortcut, "English dictionary must not rewrite shortcut " + shortcut);
    }
  }
  assert.ok(uniqueShortcuts.includes("Ctrl+N"));
  assert.ok(uniqueShortcuts.includes("Ctrl+Shift+S"));
  assert.ok(uniqueShortcuts.includes("Ctrl+Alt+←"));
  assert.ok(uniqueShortcuts.includes("Shift+Alt+→"));
});
