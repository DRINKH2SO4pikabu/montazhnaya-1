"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

test("sandboxed preload only requires Electron and exposes the desktop bridge", async () => {
  const preloadSource = await fs.readFile(path.join(root, "electron", "preload.cjs"), "utf8");
  const mainSource = await fs.readFile(path.join(root, "electron", "main.cjs"), "utf8");
  const requiredModules = [...preloadSource.matchAll(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g)].map(match => match[1]);

  assert.deepEqual(requiredModules, ["electron"], "sandboxed preload must not require local or Node.js modules");
  assert.match(mainSource, /preload:\s*path\.join\(__dirname,\s*"preload\.cjs"\)/);
  assert.match(mainSource, /contextIsolation:\s*true/);
  assert.match(mainSource, /nodeIntegration:\s*false/);
  assert.match(mainSource, /sandbox:\s*true/);

  const exposed = Object.create(null);
  const invoked = [];
  let diagnosticError = false;
  const ipcRenderer = {
    invoke: async (channel, request) => {
      invoked.push({ channel, request });
      if (channel === "system:tool-diagnostics" && diagnosticError) {
        return { status: "error", error: { key: "error.sample", params: { count: 2 } } };
      }
      return { status: "success", channel };
    },
    on() {},
    removeListener() {}
  };
  const electron = {
    contextBridge: {
      exposeInMainWorld: (name, api) => { exposed[name] = api; }
    },
    ipcRenderer,
    webUtils: { getPathForFile: () => "" }
  };
  const sandbox = {
    require: name => {
      assert.equal(name, "electron", "sandboxed preload can load Electron only");
      return electron;
    }
  };

  vm.runInNewContext(preloadSource, sandbox, { filename: "preload.cjs" });
  assert.ok(exposed.montazhnaya, "preload must expose window.montazhnaya");
  assert.equal(typeof exposed.montazhnaya.runToolDiagnostics, "function");
  assert.equal(typeof exposed.montazhnaya.beginFrameSequenceExport, "function");
  assert.deepEqual(await exposed.montazhnaya.runToolDiagnostics(), {
    status: "success", channel: "system:tool-diagnostics"
  });
  assert.equal(invoked[0].channel, "system:tool-diagnostics");

  await exposed.montazhnaya.setUiLocale({
    locale: "ru",
    semantic: { messages: { "error.sample": "Ошибка: {count}" } },
    semanticFallback: { messages: {} }
  });
  assert.equal(invoked[1].channel, "ui:set-locale");
  diagnosticError = true;
  const localizedError = await exposed.montazhnaya.runToolDiagnostics();
  assert.equal(localizedError.message, "Ошибка: 2");
});
