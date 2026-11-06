'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const releaseDir = path.join(root, 'release');
const unpackedDir = path.join(releaseDir, 'win-unpacked');
const resourcesDir = path.join(unpackedDir, 'resources');
const appAsar = path.join(resourcesDir, 'app.asar');
const asarApiPath = path.join(root, 'tools', 'release-toolchain', 'node_modules', '@electron', 'asar');
const reportPath = path.join(releaseDir, 'package-verification.json');

function fail(message) {
  console.error('Release package verification failed: ' + message);
  process.exit(1);
}

function requireFile(filePath, label) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    fail('Missing ' + label + ': ' + path.relative(root, filePath));
  }
  if (!stat.isFile() || stat.size === 0) {
    fail(label + ' is not a non-empty file: ' + path.relative(root, filePath));
  }
  return stat.size;
}

if (!fs.existsSync(appAsar)) fail('Missing packaged application archive: ' + path.relative(root, appAsar));

let asar;
try {
  asar = require(asarApiPath);
} catch (error) {
  fail('Cannot load the pinned @electron/asar package: ' + error.message);
}
if (typeof asar.listPackage !== 'function') fail('@electron/asar does not expose listPackage().');

let entries;
try {
  entries = new Set(asar.listPackage(appAsar).map((entry) => String(entry).replace(/^\/+/, '').replace(/\\/g, '/')));
} catch (error) {
  fail('Cannot read app.asar file table: ' + error.message);
}

const requiredAppFiles = [
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  'ASSET_LICENSE.md',
  'ASSET_CREDITS.md',
  'README.md'
];
const missingAppFiles = requiredAppFiles.filter((name) => !entries.has(name));
if (missingAppFiles.length) fail('app.asar is missing project license/notice files: ' + missingAppFiles.join(', '));

const runtimeNoticeFiles = [
  path.join(resourcesDir, 'ThirdPartyNotices', 'Electron-LICENSE.txt'),
  path.join(resourcesDir, 'ThirdPartyNotices', 'Chromium-LICENSES.html')
];
const runtimeNoticeSizes = runtimeNoticeFiles.map((filePath) =>
  requireFile(filePath, 'Electron/Chromium runtime license notice')
);

const executables = fs.readdirSync(releaseDir)
  .filter((name) => /\.exe$/i.test(name))
  .map((name) => path.join(releaseDir, name));
const setup = executables.filter((filePath) => /Setup-x64\.exe$/i.test(path.basename(filePath)));
const portable = executables.filter((filePath) => /Portable-x64\.exe$/i.test(path.basename(filePath)));
if (setup.length !== 1) fail('Expected exactly one Setup x64 executable; found ' + setup.length + '.');
if (portable.length !== 1) fail('Expected exactly one Portable x64 executable; found ' + portable.length + '.');

const report = {
  status: 'PASS',
  checkedAt: new Date().toISOString(),
  appArchive: path.relative(root, appAsar),
  requiredProjectNotices: requiredAppFiles,
  requiredRuntimeNotices: runtimeNoticeFiles.map((filePath, index) => ({
    path: path.relative(root, filePath),
    sizeBytes: runtimeNoticeSizes[index]
  })),
  executables: [...setup, ...portable].map((filePath) => ({
    path: path.relative(root, filePath),
    sizeBytes: fs.statSync(filePath).size
  }))
};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
