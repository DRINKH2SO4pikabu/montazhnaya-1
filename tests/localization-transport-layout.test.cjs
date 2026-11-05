"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "src/renderer/index.html"), "utf8");

test("transport controls wrap instead of hiding project settings behind horizontal scrolling", () => {
  assert.match(html, /\.transport\s*\{[^}]*height:\s*auto;[^}]*flex-wrap:\s*wrap;[^}]*overflow:\s*visible;[^}]*align-content:\s*center;[^}]*row-gap:\s*5px;/s);
  assert.match(html, /\.transport\s+\.time-display\s*\{\s*margin-inline-start:\s*auto;\s*\}/);
  assert.match(html, /@media\s*\(max-width:\s*1100px\)\s*\{\s*\.transport\s+\.time-display\s*\{[^}]*font-size:\s*11px;[^}]*padding:\s*5px\s+7px;/s);
});

test("transport keeps timecode compact at the minimum supported 1024px window width", () => {
  const { minWidth, minHeight } = (() => {
    const main = fs.readFileSync(path.join(__dirname, "..", "electron/main.cjs"), "utf8");
    const match = main.match(/new BrowserWindow\(\{([\s\S]*?)\}\);/);
    assert.ok(match, "BrowserWindow configuration exists");
    const width = Number(match[1].match(/minWidth:\s*(\d+)/)?.[1]);
    const height = Number(match[1].match(/minHeight:\s*(\d+)/)?.[1]);
    return { minWidth: width, minHeight: height };
  })();
  assert.equal(minWidth, 1024);
  assert.equal(minHeight, 700);
  assert.match(html, /@media\s*\(max-width:\s*1100px\)[\s\S]*?\.transport\s+\.time-display[\s\S]*?font-size:\s*11px/);
});
