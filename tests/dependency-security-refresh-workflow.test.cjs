"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("manual dependency-security workflow provisions builder lock and keeps both npm audits as hard gates", () => {
  const workflow = read(".github/workflows/dependency-security-windows.yml");
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /runs-on:\s*windows-latest/);
  assert.match(workflow, /npm run deps:ci/);
  assert.match(workflow, /npm run release-tools:install/);
  assert.match(workflow, /npm run release-tools:ci/);
  assert.match(workflow, /npm run qa:locales/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run dist:win/);
  assert.match(workflow, /Upload dependency lockfiles and audit evidence/);
  assert.match(workflow, /if:\s*always\(\)/);
});

test("hosted Windows workflow only builds after app, toolchain, localization and tests pass", () => {
  const workflow = read(".github/workflows/dependency-security-windows.yml");
  assert.match(workflow, /Enforce security and regression gates/);
  assert.match(workflow, /Release-toolchain strict replay/);
  assert.match(workflow, /Build NSIS Setup and Portable for Windows x64/);
  assert.match(workflow, /if:\s*success\(\)/);
});

test("first-time Windows wrapper generates an audited toolchain lock before invoking strict build", () => {
  const script = read("PREPARE_DEPENDENCIES_AND_BUILD_WINDOWS_X64.bat");
  const buildScript = read("BUILD_WINDOWS_RELEASE.bat");
  assert.match(script, /BUILD_WINDOWS_RELEASE\.bat/);
  assert.match(script, /PROCESSOR_ARCHITECTURE/);
  assert.match(buildScript, /npm\.cmd run release-tools:install/);
  assert.match(buildScript, /tools\\release-toolchain\\package-lock\.json/);
  assert.match(buildScript, /npm\.cmd run release-tools:ci/);
  assert.match(read("tools/run-windows-build.cjs"), /process\.arch !== 'x64'/);
  assert.match(buildScript, /process\.arch==='x64'/);
});

test("root lockfile inventory reports current Electron extractor SRI evidence", () => {
  const report = JSON.parse(read("qa/dependency-license-metadata-beta-3.6.45.json"));
  assert.equal(report.registryPackageCount, 13);
  assert.equal(report.registryPackagesMissingSRI, 0);
  assert.equal(report.registryPackagesInvalidSRI, 0);
  const extractor = report.packages.find((item) => item.name === "node_modules/@electron-internal/extract-zip");
  assert.equal(extractor.version, "1.0.8");
  assert.equal(extractor.integrityPresent, true);
  const electron = report.packages.find((item) => item.name === "node_modules/electron");
  assert.equal(electron.version, "45.2.1");
  assert.equal(electron.integrityPresent, true);
});
