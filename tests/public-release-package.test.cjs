'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const utf8Bom = Buffer.from([0xef, 0xbb, 0xbf]);

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('generic PowerShell launcher is UTF-8 BOM encoded with param() as first token', () => {
  const bytes = fs.readFileSync(path.join(root, 'tools', 'Start-Montazhnaya.ps1'));
  assert.ok(bytes.subarray(0, 3).equals(utf8Bom));
  assert.ok(bytes.subarray(3, 10).equals(Buffer.from('param()')));
  let bomCount = 0;
  for (let index = 0; index <= bytes.length - 3; index += 1) {
    if (bytes.subarray(index, index + 3).equals(utf8Bom)) bomCount += 1;
  }
  assert.equal(bomCount, 1);
});

test('generic launcher supports configured, managed and PATH-based FFmpeg resolution', () => {
  const script = readText('tools/Start-Montazhnaya.ps1');
  assert.match(script, /FFMPEG_PATH/);
  assert.match(script, /FFPROBE_PATH/);
  assert.match(script, /Get-Command\s+\$ExecutableName/);
  assert.match(script, /ffmpeg-8\.0\.1-nvenc-api13\.0/);
  assert.match(script, /chcp\.com"\s+65001/);
});

test('Windows first-run and later-run launchers target the project root correctly', () => {
  const install = readText('INSTALL_AND_RUN.bat');
  const run = readText('START_Montazhnaya.bat');
  assert.match(install, /npm\.cmd run deps:install/);
  assert.match(install, /tools\\Start-Montazhnaya\.ps1/);
  assert.match(run, /tools\\Start-Montazhnaya\.ps1/);
});


test('Electron 45 binary bootstrap is explicit and dependency scripts stay disabled', () => {
  const pkg = JSON.parse(readText('package.json'));
  assert.equal(pkg.devDependencies.electron, '45.2.1');
  assert.equal(pkg.engines.node, '>=22.12.0');
  assert.equal(pkg.scripts['electron:install'], 'install-electron');
  assert.equal(pkg.scripts['electron:version'], 'electron --version');
  assert.equal(Object.hasOwn(pkg, 'allowScripts'), false);
  assert.match(readText('INSTALL_AND_RUN.bat'), /npm\.cmd run deps:install/);
  assert.match(readText('INSTALL_AND_RUN.bat'), /npm\.cmd run electron:install/);
  assert.match(readText('.github/workflows/ci.yml'), /node-version: 24/);
  assert.match(readText('.github/workflows/ci.yml'), /npm run electron:version/);
  assert.match(readText('tools/Start-Montazhnaya.ps1'), /npm\.cmd run electron:install/);
  const lock = JSON.parse(readText('package-lock.json'));
  assert.equal(lock.packages['node_modules/electron'].version, '45.2.1');
  assert.equal(lock.packages['node_modules/electron'].engines.node, '>= 22.12.0');
  assert.equal(lock.packages['node_modules/electron'].dependencies['@electron/get'], '^5.0.0');
  assert.equal(lock.packages['node_modules/electron'].dependencies['@electron-internal/extract-zip'], '^1.0.1');
  assert.equal(lock.packages['node_modules/electron'].dependencies['@types/node'], '^24.9.0');
  assert.equal(lock.packages['node_modules/@electron-internal/extract-zip'].version, '1.0.8');
  assert.equal(pkg.overrides.electron['@electron-internal/extract-zip'], '1.0.8');
  assert.match(readText('tools/sync-app-dependencies.cjs'), /--package-lock-only/);
  assert.match(readText('tools/sync-app-dependencies.cjs'), /--locked/);
  assert.match(readText('tools/sync-app-dependencies.cjs'), /--refresh-lock/);
  assert.match(readText('tools/sync-app-dependencies.cjs'), /registrySRI|checkRegistrySRI/);
  assert.match(readText('tools/sync-app-dependencies.cjs'), /npm audit/);
  assert.match(readText('tools/sync-app-dependencies.cjs'), /1\.0\.8/);
  assert.equal(lock.packages['node_modules/undici'].version, '7.30.1');
  assert.ok(Object.entries(lock.packages).every(([name, entry]) => !name || Boolean(entry.integrity)), 'every registry tarball, including Electron, must have SRI');
  assert.equal(Object.hasOwn(lock.packages['node_modules/electron'], 'hasInstallScript'), false);
});

test('public package lock uses the canonical npm registry', () => {
  const lock = JSON.parse(readText('package-lock.json'));
  const resolved = Object.values(lock.packages)
    .map(entry => entry && entry.resolved)
    .filter(Boolean);
  assert.ok(resolved.length > 0);
  assert.ok(resolved.every(url => !url.includes('registry.npmmirror.com')));
  assert.ok(resolved.every(url => !url.startsWith('https://registry.npmjs.org/') || url.endsWith('.tgz')));
});

test('release metadata explicitly discloses beta and licensing/runtime limitations', () => {
  assert.match(readText('RELEASE_NOTES.md'), /3\.6\.45 Beta \/ Stage 19/i);
  assert.match(readText('RELEASE_NOTES.md'), /Electron 45\.2\.1/);
  assert.match(readText('LICENSE_SCOPE.md'), /GPL-3.0-or-later/);
  assert.match(readText('THIRD_PARTY_NOTICES.md'), /13 packages|13 packages/i);
  assert.equal(fs.existsSync(path.join(root, 'LICENSE')), true);
  assert.match(readText('LICENSE'), /GNU GENERAL PUBLIC LICENSE/);
});

test('Windows packaging defines x64 NSIS installer and portable targets', () => {
  const pkg = JSON.parse(readText('package.json'));
  assert.equal(pkg.productName, 'Монтажная');
  assert.equal(pkg.build.appId, 'ru.montazhnaya.desktop');
  assert.equal(pkg.build.asar, true);
  assert.deepEqual(pkg.build.win.target, [
    { target: 'nsis', arch: ['x64'] },
    { target: 'portable', arch: ['x64'] }
  ]);
  assert.equal(pkg.build.nsis.oneClick, false);
  assert.equal(pkg.build.nsis.allowToChangeInstallationDirectory, true);
  assert.equal(pkg.build.nsis.deleteAppDataOnUninstall, false);
  assert.equal(pkg.scripts['dist:win'], 'node tools/run-windows-build.cjs');
  const releaseTools = JSON.parse(readText('tools/release-toolchain/package.json'));
  assert.equal(releaseTools.devDependencies['electron-builder'], '26.18.1');
  assert.match(readText('tools/sync-release-toolchain.cjs'), /--package-lock-only/);
  assert.match(readText('tools/sync-release-toolchain.cjs'), /--locked/);
  assert.match(readText('tools/sync-release-toolchain.cjs'), /--refresh-lock/);
  assert.match(readText('tools/sync-release-toolchain.cjs'), /checkRegistrySRI/);
  assert.match(readText('tools/sync-release-toolchain.cjs'), /npm audit/);
  assert.match(readText('tools/run-windows-build.cjs'), /26\.18\.1/);
  assert.match(readText('tools/run-windows-build.cjs'), /assertMinimumLockedPackages/);
  assert.match(readText('tools/run-windows-build.cjs'), /22\.12\.0/);
  assert.doesNotMatch(pkg.scripts['dist:win'], /npm exec/);
});

test('packaged application includes Electron main, preload and renderer entry points', () => {
  const pkg = JSON.parse(readText('package.json'));
  const files = pkg.build.files;
  assert.ok(files.includes('assets/**/*'));
  assert.ok(files.includes('electron/**/*'));
  assert.ok(files.includes('src/**/*'));
  assert.ok(files.includes('package.json'));
  assert.ok(fs.existsSync(path.join(root, 'assets', 'montazhnaya.ico')));
  assert.ok(fs.existsSync(path.join(root, 'Montazhnaya.ico')));
  assert.ok(fs.existsSync(path.join(root, 'Montazhnaya.png')));
  assert.ok(fs.existsSync(path.join(root, 'assets', 'montazhnaya-icon-256.png')));
  assert.ok(fs.existsSync(path.join(root, 'electron', 'main.cjs')));
  assert.ok(fs.existsSync(path.join(root, 'electron', 'preload.cjs')));
  assert.ok(fs.existsSync(path.join(root, 'src', 'renderer', 'index.html')));
});

test('local Windows distribution builder checks prerequisites and creates both targets', () => {
  const script = readText('BUILD_WINDOWS_RELEASE.bat');
  assert.match(script, /npm\.cmd run deps:ci/);
  assert.match(script, /npm\.cmd run release-tools:ci/);
  assert.match(script, /npm\.cmd run --silent electron:version/);
  assert.match(script, /npm\.cmd run deps:ci/i);
  assert.match(script, /npm\.cmd run dist:win/i);
  assert.match(script, /release\\\*\.exe/i);
});

test('GitHub Windows release workflow audits, verifies, smoke-tests and publishes the Beta release', () => {
  const workflow = readText('.github/workflows/release-windows.yml');
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /tags:\s*\n\s*- "v\*"/);
  assert.match(workflow, /npm run deps:ci/);
  assert.match(workflow, /npm run release-tools:install/);
  assert.match(workflow, /npm run release-tools:ci/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run dist:win/);
  assert.match(workflow, /tools\/verify-release-package\\.cjs/);
  assert.match(workflow, /Smoke-test Setup installation and Portable startup/);
  assert.match(workflow, /npm sbom.*cyclonedx/);
  assert.match(workflow, /Get-FileHash -Algorithm SHA256/);
  assert.match(workflow, /draft: false/);
  assert.match(workflow, /prerelease: true/);
});


test('release notes disclose external media tools and unsigned Windows packages', () => {
  const notes = readText('RELEASE_NOTES.md');
  assert.match(notes, /FFmpeg\/FFprobe/);
  assert.match(notes, /not digitally signed|unsigned/i);
  assert.match(readText('README.md'), /Node\.js 22\.12\.0 or newer/);
});


test('Windows app, installer and in-app brand use the custom Montazhnaya icon', () => {
  const pkg = JSON.parse(readText('package.json'));
  assert.equal(pkg.version, '3.6.45');
  assert.equal(pkg.build.win.icon, 'assets/montazhnaya.ico');
  assert.equal(pkg.build.nsis.installerIcon, 'assets/montazhnaya.ico');
  assert.equal(pkg.build.nsis.uninstallerIcon, 'assets/montazhnaya.ico');
  assert.equal(pkg.build.nsis.shortcutName, 'Монтажная');
  assert.equal(pkg.build.productName, 'Монтажная');
  assert.equal(pkg.build.executableName, 'Montazhnaya');
  assert.deepEqual(pkg.build.extraFiles, [
    { from: 'assets/montazhnaya.ico', to: 'Montazhnaya.ico' },
    { from: 'assets/montazhnaya-icon.png', to: 'Montazhnaya.png' }
  ]);
  assert.deepEqual(pkg.build.extraResources, [
    { from: 'node_modules/electron/dist/LICENSE', to: 'ThirdPartyNotices/Electron-LICENSE.txt' },
    { from: 'node_modules/electron/dist/LICENSES.chromium.html', to: 'ThirdPartyNotices/Chromium-LICENSES.html' }
  ]);
  assert.match(readText('tools/verify-release-package.cjs'), /THIRD_PARTY_NOTICES\.md/);
  assert.match(readText('tools/verify-release-package.cjs'), /Chromium-LICENSES\.html/);
  assert.match(readText('electron/main.cjs'), /montazhnaya\.ico/);
  assert.match(readText('electron/main.cjs'), /setAppUserModelId\(\"ru\.montazhnaya\.desktop\"\)/);
  assert.match(readText('src/renderer/index.html'), /montazhnaya-icon-256\.png/);
  assert.match(readText('src/renderer/index.html'), /class=\"beginner-tour-logo\" src=\"\.\.\/\.\.\/assets\/montazhnaya-icon-256\.png\"/);
});

test('renderer beforeunload performs cleanup without blocking Electron close', () => {
  const html = readText('src/renderer/index.html');
  const start = html.indexOf('window.addEventListener("beforeunload"');
  assert.notEqual(start, -1);
  const end = html.indexOf('});', start);
  assert.notEqual(end, -1);
  const handler = html.slice(start, end);
  assert.doesNotMatch(handler, /preventDefault|returnValue/);
  assert.match(readText('electron/main.cjs'), /installWindowCloseGuard/);
});

test('PowerShell launcher bootstraps missing dependencies and verifies exact Node and Electron versions', () => {
  const launcher = readText('tools/Start-Montazhnaya.ps1');
  assert.match(launcher, /22\.12\.0/);
  assert.match(launcher, /npm\.cmd run deps:install/);
  assert.match(launcher, /installedExtractorVersion -ne \"1\.0\.8\"/);
  assert.match(launcher, /npm\.cmd run electron:install/);
  assert.match(launcher, /installedElectronVersion -ne \"45\.2\.1\"/);
  assert.match(launcher, /npm\.cmd run --silent electron:version/);
  assert.match(launcher, /45\\\.2\\\.1/);
});

test('Windows release batch always installs the locked tree and runs audit, tests and localization QA', () => {
  const script = readText('BUILD_WINDOWS_RELEASE.bat');
  const cleanInstall = script.indexOf('npm.cmd run deps:ci');
  const audit = script.indexOf('npm.cmd run release-tools:ci');
  const tests = script.indexOf('npm.cmd test');
  const localeQa = script.indexOf('npm.cmd run qa:locales');
  const build = script.indexOf('npm.cmd run dist:win');
  assert.ok(cleanInstall >= 0 && cleanInstall < audit);
  assert.ok(cleanInstall < tests && tests < localeQa && localeQa < audit && audit < build);
  assert.match(script, /npm\.cmd run --silent electron:version/);
  assert.match(script, /ELECTRON_VERSION/);
  assert.match(script, /v45\.2\.1/);
  assert.match(script, /Node\.js 22\.12\.0/);
});

test('Electron 45 renderer compatibility uses webUtils and does not depend on removed clipboard module', () => {
  const preload = readText('electron/preload.cjs');
  const renderer = readText('src/renderer/index.html');
  assert.match(preload, /webUtils\.getPathForFile/);
  assert.doesNotMatch(preload, /\bfile\.path\b/);
  assert.doesNotMatch(renderer, /electron\.clipboard|require\(['"]electron['"]\)/);
  assert.match(readText('electron/main.cjs'), /defaultPath:/);
  assert.match(readText('electron/main.cjs'), /contextIsolation:\s*true/);
  assert.match(readText('electron/main.cjs'), /nodeIntegration:\s*false/);
  assert.match(readText('electron/main.cjs'), /sandbox:\s*true/);
});


test('dependency maintenance uses lockfiles and audits the app and isolated release toolchain', () => {
  const appSync = readText('tools/sync-app-dependencies.cjs');
  const toolSync = readText('tools/sync-release-toolchain.cjs');
  const helper = readText('tools/dependency-lock-utils.cjs');
  assert.match(appSync, /npm install.*--package-lock-only/s);
  assert.match(appSync, /lockedOnly/);
  assert.match(appSync, /refreshLockfile/);
  assert.match(appSync, /npm ci/);
  assert.match(appSync, /npm audit/);
  assert.match(appSync, /45\.2\.1/);
  assert.match(appSync, /1\.0\.8/);
  assert.match(appSync, /undici: '7\.30\.1'/);
  assert.match(toolSync, /26\.18\.1/);
  assert.match(toolSync, /app-builder-lib/);
  assert.match(toolSync, /builder-util-runtime/);
  assert.match(toolSync, /lockedOnly/);
  assert.match(toolSync, /refreshLockfile/);
  assert.match(toolSync, /npm ci/);
  assert.match(toolSync, /npm audit/);
  assert.match(helper, /integrity/);
  assert.match(helper, /registry\.npmjs\.org/);
});


test('strict release toolchain mode never creates or refreshes a missing lockfile', () => {
  const toolSync = readText('tools/sync-release-toolchain.cjs');
  assert.match(toolSync, /if \(lockedOnly\) throw new Error\(`Строгий режим CI/);
  assert.match(toolSync, /отсутствует пригодный .*package-lock\.json/);
  assert.match(toolSync, /--package-lock-only/);
  assert.match(toolSync, /CI использует --locked и не меняет release-toolchain\/package-lock\.json/);
});
