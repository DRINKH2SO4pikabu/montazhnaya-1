"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
function loadPacks() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ["src/renderer/locales/manifest.js", "src/renderer/locales/ru.js", "src/renderer/locales/en.js", "src/renderer/locales/international.js", "src/renderer/locales/cis.js"]) {
    vm.runInContext(read(file), context, { filename: file });
  }
  return { packs: context.window.MontazhnayaLocalePacks, manifest: context.window.MontazhnayaLocaleManifest };
}
const tokens = value => [...String(value).matchAll(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g)].map(match => match[0]).sort();

test("all 34 preview locales map all 436 reference keys without empty values or English fallback", () => {
  const { packs, manifest } = loadPacks();
  assert.equal(manifest.available.length, 36);
  assert.equal(Object.keys(packs.en.messages).length, 436);
  const preview = manifest.available.filter(item => item.code !== "ru" && item.code !== "en");
  assert.equal(preview.length, 34);
  for (const entry of preview) {
    const pack = packs[entry.code];
    assert.ok(pack, `missing ${entry.code}`);
    assert.equal(Object.keys(pack.messages).length, 436, `${entry.code} key count`);
    assert.equal(pack.localeMappedCount, 436, `${entry.code} mapped count`);
    assert.equal(pack.englishFallbackCount, 0, `${entry.code} fallback count`);
    assert.deepEqual(Array.from(pack.englishFallbackKeys), [], `${entry.code} fallback list`);
    for (const key of Object.keys(packs.en.messages)) {
      assert.equal(typeof pack.messages[key], "string", `${entry.code} missing ${key}`);
      assert.ok(pack.messages[key].trim(), `${entry.code} empty ${key}`);
      assert.deepEqual(tokens(pack.messages[key]), tokens(key), `${entry.code} placeholders in ${key}`);
    }
    assert.ok(pack.linguisticReviewStatus.includes("native-speaker-review-pending"));
    assert.ok(pack.visualReviewStatus.includes("windows-render-check-pending"));
  }
});

test("repeated editing concepts use consistent translations within every locale", () => {
  const { packs } = loadPacks();
  const groups = new Map();
  for (const [source, english] of Object.entries(packs.en.messages)) {
    const group = groups.get(english) || [];
    group.push(source);
    groups.set(english, group);
  }
  const repeated = [...groups.values()].filter(keys => keys.length > 1);
  assert.ok(repeated.length > 0);
  for (const [code, pack] of Object.entries(packs)) {
    if (code === "ru" || code === "en") continue;
    for (const keys of repeated) {
      assert.equal(new Set(keys.map(key => pack.messages[key])).size, 1, `${code}: inconsistent translations for ${keys.join(" / ")}`);
    }
  }
  for (const code of ["uk", "cs", "ky", "be"]) {
    assert.equal(packs[code].messages["Положение"], packs[code].messages["Позиция"]);
  }
});

test("localized layout contains font profiles, wrapping safeguards and stable RTL editing geometry", () => {
  const html = read("src/renderer/index.html");
  for (const selector of ['html[lang^="ka"] body', 'html[lang^="hy"] body', 'html[lang^="ar"] body', 'html[lang^="he"] body', 'html[lang^="hi"] body', 'html[lang^="th"] body', 'html[lang^="zh"] body', 'html[lang^="ja"] body', 'html[lang^="ko"] body']) {
    assert.ok(html.includes(selector), `missing script selector ${selector}`);
  }
  assert.match(html, /overflow-wrap:\s*anywhere/);
  assert.match(html, /text-wrap:\s*pretty/);
  assert.match(html, /@media\s*\(max-width:\s*1180px\)[\s\S]*?#topbar\s*\{[^}]*flex-wrap:\s*wrap/s, "top bar wraps for every locale at narrow widths");
  assert.match(html, /html\[dir="rtl"\]\s+#app\s*\{\s*direction:\s*ltr/s);
  assert.ok(html.includes('html[dir="rtl"] #timeline,'), "RTL must keep timeline coordinates LTR");
  assert.match(html, /font-family:\s*"Noto Sans Arabic"/);
  assert.match(html, /font-family:\s*"Noto Sans Hebrew"/);
  assert.match(html, /font-family:\s*"Noto Sans Devanagari"/);
  assert.match(html, /font-family:\s*"Leelawadee UI"/);
});

test("About dialog is localized through the application i18n layer rather than a Russian native alert", () => {
  const html = read("src/renderer/index.html");
  assert.match(html, /function openAboutDialog\(\)/);
  assert.match(html, /overlay\.querySelector\("\.about-modal-product"\)\.textContent\s*=\s*document\.title/);
  assert.match(html, /case "about":\s*openAboutDialog\(\)/);
  assert.doesNotMatch(html, /case "about":\s*alert\(/);
  assert.match(html, /data-about-close/);
});

test("package, lockfile, release notes and localization metadata share the same version", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  assert.equal(pkg.version, "3.6.45");
  assert.equal(lock.version, "3.6.45");
  assert.equal(lock.packages[""].version, "3.6.45");
  assert.match(read("RELEASE_NOTES.md"), /^# Montazhnaya 3\.6\.45 Beta/m);
  assert.match(read("README.md"), /beta[^\n]*3\.6\.45/i);
});
