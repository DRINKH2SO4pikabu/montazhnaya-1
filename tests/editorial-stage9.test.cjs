"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
for (const file of ["manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js", "semantic.js", "beginner-tour.js", "notifications.js", "ipc-error-translations.js", "international.js", "cis.js", "editorial-overrides.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "src/renderer/locales", file), "utf8"), context, { filename: file });
}
test("Stage 9 editorial overrides cover all 34 preview locales and apply immutably", () => {
  const w = context.window;
  const previews = w.MontazhnayaLocaleManifest.available.filter(x => x.code !== "ru" && x.code !== "en");
  assert.equal(previews.length, 34);
  assert.equal(Object.keys(w.MontazhnayaLocaleEditorialCorrections).length, 34);
  for (const locale of previews) {
    const before = w.MontazhnayaLocalePacks[locale.code];
    const beforeMessages = before.messages;
    const patch = w.MontazhnayaLocaleEditorialCorrections[locale.code];
    const after = w.MontazhnayaApplyEditorialOverrides(locale.code);
    assert.ok(Object.keys(patch).length >= 1, `${locale.code} has no corrections`);
    assert.notEqual(after, before, `${locale.code} pack was not replaced`);
    assert.notEqual(after.messages, beforeMessages, `${locale.code} message map was not cloned`);
    assert.equal(after.editorialRevision, "beta-3.6.45-editorial-stage9-full-dictionary-pass1");
    for (const [source, revised] of Object.entries(patch)) assert.equal(after.messages[source], revised, `${locale.code}/${source}`);
    assert.equal(w.MontazhnayaApplyEditorialOverrides(locale.code), after, "override must be idempotent");
  }
  assert.equal(w.MontazhnayaLocalePacks.ru.messages["Разрешение"], undefined, "Russian source pack must stay untouched");
  assert.equal(w.MontazhnayaLocalePacks.en.messages["Разрешение"], "Resolution", "English reference pack must stay untouched");
});


test("i18n applies editorial corrections before returning both cached and newly loaded packs", () => {
  const i18n = fs.readFileSync(path.join(root, "src/renderer/i18n.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "src/renderer/index.html"), "utf8");
  assert.ok(i18n.includes("root.MontazhnayaApplyEditorialOverrides?.(locale)"));
  assert.ok(i18n.includes("const editorialPack = root.MontazhnayaApplyEditorialOverrides?.(locale) || packs[locale]"));
  assert.ok(html.indexOf("./locales/editorial-overrides.js") < html.indexOf("./i18n.js"), "override helper must load before i18n runtime");
});
