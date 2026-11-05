'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const launcherPath = path.join(__dirname, '..', 'tools', 'Start-Montazhnaya-NVENC.ps1');
const utf8Bom = Buffer.from([0xef, 0xbb, 0xbf]);

test('NVENC PowerShell launcher has exactly one UTF-8 BOM before param()', () => {
  const bytes = fs.readFileSync(launcherPath);
  assert.ok(bytes.subarray(0, 3).equals(utf8Bom), 'PowerShell 5.1 launcher must be UTF-8 with BOM');
  assert.ok(bytes.subarray(3, 10).equals(Buffer.from('param()')), 'param() must be the first script token');
  let bomCount = 0;
  for (let i = 0; i <= bytes.length - 3; i += 1) {
    if (bytes.subarray(i, i + 3).equals(utf8Bom)) bomCount += 1;
  }
  assert.equal(bomCount, 1, 'launcher must not contain a duplicated BOM');
});
