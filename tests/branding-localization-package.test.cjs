"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

test("product identity is Montazhnaya across package, executable and installer", () => {
  assert.equal(pkg.productName, "Монтажная");
  assert.equal(pkg.build.productName, "Монтажная");
  assert.equal(pkg.build.executableName, "Montazhnaya");
  assert.equal(pkg.build.win.icon, "assets/montazhnaya.ico");
  assert.equal(pkg.build.nsis.installerIcon, "assets/montazhnaya.ico");
  assert.equal(pkg.build.nsis.uninstallerIcon, "assets/montazhnaya.ico");
  assert.equal(pkg.build.nsis.shortcutName, "Монтажная");
});

test("brand icon files are copied into the Windows application directory root", () => {
  assert.deepEqual(pkg.build.extraFiles, [
    { from: "assets/montazhnaya.ico", to: "Montazhnaya.ico" },
    { from: "assets/montazhnaya-icon.png", to: "Montazhnaya.png" }
  ]);
  assert.ok(fs.statSync(path.join(root, "Montazhnaya.ico")).size > 1000);
  assert.ok(fs.statSync(path.join(root, "Montazhnaya.png")).size > 1000);
});

test("Electron app identity and runtime window icon are explicitly branded", () => {
  const main = fs.readFileSync(path.join(root, "electron/main.cjs"), "utf8");
  assert.match(main, /app\.setName\("Монтажная"\)/);
  assert.match(main, /setAppUserModelId\("ru\.montazhnaya\.desktop"\)/);
  assert.match(main, /path\.dirname\(process\.execPath\), "Montazhnaya\.ico"/);
  assert.match(main, /assets", "montazhnaya\.ico"/);
  assert.match(main, /icon:\s*appIcon/);
});
