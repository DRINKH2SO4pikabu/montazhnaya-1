"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { audit } = require("../qa/audit-ipc-error-locales.cjs");

const root = path.join(__dirname, "..");

test("all 30 structured Electron errors have draft translations in all 34 preview locales", () => {
  const result = audit();
  assert.equal(result.locales, 34);
  assert.equal(result.keys, 30);
  assert.equal(result.translations, 1020);
  assert.equal(result.placeholderChecks, 1020);
  assert.equal(result.fallbackCount, 0);
  assert.match(result.reviewStatus, /native-review-pending/);
});

test("IPC error translation registry loads before locale initialization under the local CSP", () => {
  const html = fs.readFileSync(path.join(root, "src/renderer/index.html"), "utf8");
  const notificationsIndex = html.indexOf('<script src="./locales/notifications.js"></script>');
  const translationsIndex = html.indexOf('<script src="./locales/ipc-error-translations.js"></script>');
  const i18nIndex = html.indexOf('<script src="./i18n.js"></script>');
  assert.ok(notificationsIndex >= 0, "notification catalogue must be included");
  assert.ok(translationsIndex > notificationsIndex, "IPC error translations must load after notification catalogue");
  assert.ok(i18nIndex > translationsIndex, "translations must load before locale initialization");
  assert.match(html, /script-src 'self' file:/, "local scripts must remain allowed by CSP");
});
