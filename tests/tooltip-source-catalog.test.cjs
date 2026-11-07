"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

function loadTooltipSource() {
  const window = {};
  const context = { window };
  vm.createContext(context);
  vm.runInContext(read("src/renderer/locales/tooltip-source.js"), context, {
    filename: "tooltip-source.js"
  });
  return window.MontazhnayaTooltipSource;
}

test("tooltip source copy is stored in a standalone locale catalogue", () => {
  const source = loadTooltipSource();
  assert.ok(source, "tooltip source catalogue must register on window");
  assert.equal(Object.keys(source.UI_HELP_ACTIONS).length, 50);
  assert.equal(Object.keys(source.UI_HELP_IDS).length, 53);
  assert.equal(Object.keys(source.BEGINNER_ACTION_HELP).length, 48);
  assert.equal(Object.keys(source.BEGINNER_ID_HELP).length, 53);
});

test("tooltip catalogue entries have complete readable source text", () => {
  const source = loadTooltipSource();
  for (const name of ["UI_HELP_ACTIONS", "UI_HELP_IDS"]) {
    for (const [key, values] of Object.entries(source[name])) {
      assert.ok(Array.isArray(values), name + "/" + key + " must be an array");
      assert.ok(values.length >= 3, name + "/" + key + " must define title, purpose and usage");
      for (const [index, value] of values.entries()) {
        assert.equal(typeof value, "string", name + "/" + key + "/" + index + " must be text");
        if (index < 3) assert.ok(value.trim(), name + "/" + key + "/" + index + " must not be empty");
      }
    }
  }
  for (const name of ["BEGINNER_ACTION_HELP", "BEGINNER_ID_HELP"]) {
    for (const [key, definition] of Object.entries(source[name])) {
      for (const field of ["title", "purpose", "usage"]) {
        assert.equal(typeof definition[field], "string", name + "/" + key + "/" + field + " must be text");
        assert.ok(definition[field].trim(), name + "/" + key + "/" + field + " must not be empty");
      }
      if (definition.tip !== undefined) {
        assert.equal(typeof definition.tip, "string", name + "/" + key + "/tip must be text");
      }
    }
  }
});

test("renderer loads the tooltip source catalogue before using its definitions", () => {
  const html = read("src/renderer/index.html");
  const sourceScript = html.indexOf('./locales/tooltip-source.js');
  const i18nScript = html.indexOf('./i18n.js');
  assert.ok(sourceScript >= 0, "tooltip source catalogue must be loaded");
  assert.ok(i18nScript > sourceScript, "tooltip catalogue must load before the i18n runtime");
  for (const name of ["UI_HELP_ACTIONS", "UI_HELP_IDS", "BEGINNER_ACTION_HELP", "BEGINNER_ID_HELP"]) {
    assert.match(html, new RegExp("const " + name + " = window\\.MontazhnayaTooltipSource\\." + name));
    assert.doesNotMatch(html, new RegExp("const " + name + " = \\{"));
  }
});
