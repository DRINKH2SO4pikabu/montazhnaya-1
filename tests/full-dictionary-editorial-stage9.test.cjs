"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const context = { window: {}, Intl, console };
vm.createContext(context);
for (const file of [
  "manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js", "semantic.js",
  "beginner-tour.js", "notifications.js", "ipc-error-translations.js", "international.js", "cis.js",
  "editorial-overrides.js"
]) {
  vm.runInContext(fs.readFileSync(path.join(root, "src/renderer/locales", file), "utf8"), context, { filename: file });
}
const w = context.window;
const placeholders = value => [...String(value).matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match => match[1]).sort();

test("Stage 9 audits all 436 reference keys across all 34 preview locales", () => {
  const manifest = w.MontazhnayaLocaleManifest;
  const packs = w.MontazhnayaLocalePacks;
  const source = w.MontazhnayaLocaleSourceMessages;
  assert.ok(manifest && packs && source);
  assert.equal(manifest.available.length, 36);
  const sourceKeys = Object.keys(source);
  assert.equal(sourceKeys.length, 436);
  const previews = manifest.available.filter(entry => !["ru", "en"].includes(entry.code));
  assert.equal(previews.length, 34);
  let inspected = 0;
  for (const locale of previews) {
    const pack = packs[locale.code];
    assert.ok(pack, `${locale.code} is registered`);
    const effective = w.MontazhnayaApplyEditorialOverrides(locale.code) || pack;
    for (const key of sourceKeys) {
      assert.equal(typeof effective.messages[key], "string", `${locale.code}/${key} exists`);
      assert.ok(effective.messages[key].trim(), `${locale.code}/${key} is not empty`);
      assert.deepEqual(placeholders(effective.messages[key]), placeholders(key), `${locale.code}/${key} preserves placeholders`);
      inspected++;
    }
    assert.equal(pack.englishFallbackKeys?.length || 0, 0, `${locale.code} has no English fallback keys`);
    assert.equal(effective.editorialReviewStatus, "machine-assisted-full-dictionary-audit-pass-1; native-speaker-review-pending");
  }
  assert.equal(inspected, 14824);
});

test("Stage 9 terminology overrides distinguish wipe and iris video transitions from literal curtains and camera apertures", () => {
  const packs = w.MontazhnayaLocalePacks;
  const apply = w.MontazhnayaApplyEditorialOverrides;
  const expected = {
    kk: { "Шторки": "Сүрту арқылы ауысулар", "Шторка снизу": "Төменнен жоғары қарай сүрту", "Круговая диафрагма": "Ирис ауысуы" },
    uz: { "Шторки": "Artib o‘tishlar", "Шторка снизу": "Pastdan yuqoriga o‘tish", "Круговая диафрагма": "Iris o‘tishi" },
    "uz-Cyrl": { "Шторки": "Артиб ўтишлар", "Шторка снизу": "Пастдан юқорига ўтиш", "Круговая диафрагма": "Ирис ўтиши" },
    ka: { "Шторки": "გადასმის ტიპის გადასვლები", "Шторка снизу": "ქვემოდან ზემოთ გადასმა", "Круговая диафрагма": "ირისის გადასვლა" },
    hy: { "Шторки": "Սահեցման անցումներ", "Шторка снизу": "Սահեցում ներքևից վերև", "Круговая диафрагма": "Իրիսի անցում" },
    tk: { "Шторки": "Süpürme geçişleri", "Шторка снизу": "Aşakdan ýokary süýşme", "Круговая диафрагма": "Iris geçişi" },
    az: { "Шторки": "Silinmə keçidləri", "Шторка снизу": "Aşağıdan yuxarı silmə", "Круговая диафрагма": "İris keçidi" },
    ky: { "Шторки": "Сүртүү өтүүлөрү", "Шторка снизу": "Төмөндөн жогору сүртүү", "Круговая диафрагма": "Ирис өтүүсү" },
    tg: { "Шторки": "Гузаришҳои поккунӣ", "Шторка снизу": "Гузариш аз поён ба боло", "Круговая диафрагма": "Гузариши ирисӣ" },
    be: { "Шторки": "Пераходы з выціраннем", "Шторка снизу": "Шторка знізу ўверх", "Круговая диафрагма": "Пераход «Ірыс»" }
  };
  for (const [code, messages] of Object.entries(expected)) {
    const effective = apply(code) || packs[code];
    for (const [key, value] of Object.entries(messages)) assert.equal(effective.messages[key], value, `${code}/${key}`);
  }
});

test("Stage 9 aligns About titles with version 3.6.45 in regional language packs", () => {
  const codes = ["kk", "uz", "uz-Cyrl", "ka", "hy", "tk", "az", "ky", "tg", "be"];
  for (const code of codes) {
    const pack = w.MontazhnayaApplyEditorialOverrides(code);
    assert.match(pack.appTitle, /^Montazhnaya (?:(?:бета)|(?:beta)) 3\.6\.45/);
    assert.equal(pack.messages["Монтажная beta 3.6.44 — монтаж фото, аудио и видео"], pack.appTitle);
  }
});
