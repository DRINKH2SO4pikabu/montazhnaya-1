'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('Electron BrowserWindow keeps isolation, sandbox and Node integration protections enabled', () => {
  const main = read('electron/main.cjs');
  assert.match(main, /contextIsolation:\s*true/);
  assert.match(main, /nodeIntegration:\s*false/);
  assert.match(main, /sandbox:\s*true/);
});

test('preload exposes a narrow bridge instead of raw ipcRenderer or filesystem APIs', () => {
  const preload = read('electron/preload.cjs');
  assert.match(preload, /contextBridge\.exposeInMainWorld\("montazhnaya"/);
  assert.doesNotMatch(preload, /exposeInMainWorld\([^\n]*(ipcRenderer|require|fs)/);
  assert.doesNotMatch(preload, /exposeInMainWorld\("(?:ipcRenderer|require|fs)"/);
});

test('renderer has no remote script or stylesheet dependencies', () => {
  const html = read('src/renderer/index.html');
  const scriptSources = Array.from(html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi), match => match[1]);
  assert.ok(scriptSources.every(source => (source.startsWith("./locales/") || source.startsWith("./effects/") || source === "./i18n.js")), "only packaged local locale and effect scripts may be loaded");
  assert.doesNotMatch(html, /<link\b[^>]*\bhref\s*=\s*["']https?:/i);
});


test('renderer blocks unexpected navigation, redirects and pop-up windows', () => {
  const main = read('electron/main.cjs');
  assert.match(main, /if \(navigationUrl !== editorUrl\) \{\s*event\.preventDefault\(\)/);
  assert.match(main, /webContents\.on\("will-navigate",\s*blockUnexpectedNavigation\)/);
  assert.match(main, /webContents\.on\("will-redirect",\s*blockUnexpectedNavigation\)/);
  assert.match(main, /webContents\.setWindowOpenHandler\(\(\{\s*url\s*\}\)\s*=>\s*\{/);
  assert.match(main, /return\s*\{\s*action:\s*"deny"\s*\}/);
});

test('renderer declares a restrictive local-content CSP without eval or remote origins', () => {
  const html = read('src/renderer/index.html');
  const match = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
  assert.ok(match, 'Content-Security-Policy meta tag must be present');
  const policy = match[1];
  for (const directive of [
    "default-src 'self'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ]) assert.ok(policy.includes(directive), `missing CSP directive: ${directive}`);
  assert.doesNotMatch(policy, /https?:\/\//i);

  const scriptDirective = policy.match(/(?:^|;)\s*script-src\s+([^;]+)/i);
  assert.ok(scriptDirective, 'script-src directive must be present');
  assert.doesNotMatch(scriptDirective[1], /unsafe-inline|unsafe-eval/i);
  const inlineScripts = Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))
    .filter(match => !/\bsrc\s*=/i.test(match[1]));
  assert.equal(inlineScripts.length, 1, 'inline script CSP hash must cover the only inline script');
  const digest = createHash('sha256').update(inlineScripts[0][2], 'utf8').digest('base64');
  assert.ok(scriptDirective[1].includes(`'sha256-${digest}'`), 'script-src hash must match the current inline renderer script');
});
