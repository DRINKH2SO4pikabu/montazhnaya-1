"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

test("About dialog visibly credits Grok transition media and ChatGPT-generated branding", () => {
  const html = read("src/renderer/index.html");
  assert.match(html, /class="about-modal-credits"/);
  assert.match(html, /Created with Grok/);
  assert.match(html, /с помощью ChatGPT/);
  assert.match(html, /отобраны и интегрированы сопровождающим проекта/);
});

test("AI-generated brand assets and their derivatives are present and inventoried", () => {
  for (const relative of [
    "Montazhnaya.png", "Montazhnaya.ico", "assets/montazhnaya-icon.png",
    "assets/montazhnaya-icon-256.png", "assets/montazhnaya.ico", "assets/BRANDING_NOTICE.md"
  ]) {
    assert.ok(fs.existsSync(path.join(root, relative)), `missing asset: ${relative}`);
  }
  for (const relative of [
    "Montazhnaya.png", "Montazhnaya.ico", "assets/montazhnaya-icon.png",
    "assets/montazhnaya-icon-256.png", "assets/montazhnaya.ico"
  ]) {
    assert.ok(fs.statSync(path.join(root, relative)).size > 1000, `empty binary asset: ${relative}`);
  }
  assert.match(read("assets/BRANDING_NOTICE.md"), /generated with ChatGPT/i);
  assert.match(read("ASSET_CREDITS.md"), /selected and integrated by the project maintainer/i);
});

test("media assets are separately licensed under final CC BY 4.0 terms", () => {
  assert.match(read("LICENSE_SCOPE.md"), /CC BY 4\.0/i);
  assert.match(read("ASSET_LICENSE.md"), /\*\*License:\*\* Creative Commons Attribution 4\.0 International/i);
  assert.match(read("ASSET_CREDITS.md"), /CC BY 4\.0/i);
  assert.match(read("THIRD_PARTY_NOTICES.md"), /project-controlled logo\/brand graphics.*CC BY 4\.0/i);
  assert.match(read("src/renderer/index.html"), /распространяются по CC BY 4\.0/i);
});

test("source-code origin audit is included in the publication package", () => {
  assert.match(read("SOURCE_CODE_ORIGIN_AUDIT_RU.md"), /не выявлены конкретные сторонние фрагменты кода/i);
  assert.match(read("PUBLICATION_READINESS_RU.md"), /Ручная инженерная проверка исходного кода завершена/i);
});
