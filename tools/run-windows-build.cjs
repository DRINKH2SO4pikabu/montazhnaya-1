'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { checkRegistrySRI, readLock, assertMinimumLockedPackages, assertMinimumInstalledPackages, assertNoExactPackageVersions, assertNoInstalledExactPackageVersions, assertExactPackageVersions, assertExactInstalledPackageVersions } = require('./dependency-lock-utils.cjs');

const root = path.resolve(__dirname, '..');
const toolRoot = path.join(root, 'tools/release-toolchain');
const expectedVersion = '26.18.1';

try {
  const nodeVersion = process.versions.node.split('.').map(Number);
  if (nodeVersion[0] < 22 || (nodeVersion[0] === 22 && nodeVersion[1] < 12)) {
    throw new Error(`Для сборки требуется Node.js 22.12.0 или новее; обнаружен ${process.versions.node}.`);
  }
  if (process.platform !== 'win32') {
    throw new Error('Сборка NSIS Setup + Portable в этом проекте должна выполняться на Windows x64.');
  }
  if (process.arch !== 'x64') {
    throw new Error(`Для Windows x64 сборки требуется 64-битный Node.js (process.arch=x64); обнаружен ${process.arch}.`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(toolRoot, 'package.json'), 'utf8'));
  if (manifest.devDependencies?.['electron-builder'] !== expectedVersion) {
    throw new Error(`В release-toolchain/package.json должна быть закреплена electron-builder ${expectedVersion}.`);
  }
  const lockPath = path.join(toolRoot, 'package-lock.json');
  const lock = readLock(lockPath);
  checkRegistrySRI(lockPath);
  if (lock.packages['node_modules/electron-builder']?.version !== expectedVersion) {
    throw new Error(`Lockfile не содержит electron-builder ${expectedVersion}. Сначала выполните npm run release-tools:refresh и сохраните lockfile.`);
  }
  const securityFloors = { 'app-builder-lib': '26.15.0', 'builder-util-runtime': '9.7.0' };
  assertMinimumLockedPackages(lock, securityFloors);
  assertExactPackageVersions(lock, 'global-agent', '4.1.3');
  const minimatchVersions = assertNoExactPackageVersions(lock, 'minimatch', ['10.2.6']);
  const builderScopedMinimatch = minimatchVersions.filter(item => item.path.includes('app-builder-lib') || item.path === 'node_modules/minimatch');
  if (builderScopedMinimatch.length === 0 || builderScopedMinimatch.some(item => item.version !== '10.2.5' && item.version.startsWith('10.'))) {
    throw new Error(`Ожидался minimatch@10.2.5 в дереве app-builder-lib; найдено: ${builderScopedMinimatch.map(x => `${x.version} (${x.path})`).join(', ') || 'нет записи'}`);
  }
  assertMinimumInstalledPackages(lock, path.join(toolRoot, 'node_modules'), securityFloors);
  assertExactInstalledPackageVersions(lock, path.join(toolRoot, 'node_modules'), 'global-agent', '4.1.3');
  const installedMinimatch = assertNoInstalledExactPackageVersions(lock, path.join(toolRoot, 'node_modules'), 'minimatch', ['10.2.6']);
  const installedBuilderMinimatch = installedMinimatch.filter(item => item.path.includes('app-builder-lib') || item.path === 'node_modules/minimatch');
  if (installedBuilderMinimatch.length === 0 || installedBuilderMinimatch.some(item => item.version !== '10.2.5' && item.version.startsWith('10.'))) {
    throw new Error(`Установлен неожиданный minimatch в дереве app-builder-lib: ${installedBuilderMinimatch.map(x => `${x.version} (${x.path})`).join(', ') || 'нет записи'}`);
  }
  const installedPath = path.join(toolRoot, 'node_modules/electron-builder/package.json');
  if (!fs.existsSync(installedPath)) {
    throw new Error('electron-builder не установлен. Сначала выполните npm run release-tools:install.');
  }
  const installed = JSON.parse(fs.readFileSync(installedPath, 'utf8'));
  if (installed.version !== expectedVersion) {
    throw new Error(`Установлена electron-builder ${installed.version}, ожидалась ${expectedVersion}.`);
  }
  const cliPath = path.join(toolRoot, 'node_modules/electron-builder/cli.js');
  if (!fs.existsSync(cliPath)) throw new Error(`Не найден локальный CLI electron-builder: ${cliPath}`);
  const result = spawnSync(process.execPath, [cliPath, '--win', '--x64'], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: false,
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
} catch (error) {
  console.error(`Windows build остановлен: ${error.message}`);
  process.exitCode = 1;
}
