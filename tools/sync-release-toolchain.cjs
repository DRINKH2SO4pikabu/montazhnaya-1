'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  runNpm, checkRegistrySRI, readLock, runAndSaveAudit, runPlan, refreshLockfile, assertMinimumLockedPackages, assertNoExactPackageVersions, assertExactPackageVersions, assertExactInstalledPackageVersions
} = require('./dependency-lock-utils.cjs');

const root = path.resolve(__dirname, '..');
const toolRoot = path.join(root, 'tools/release-toolchain');
const lockPath = path.join(toolRoot, 'package-lock.json');
const expectedVersion = '26.18.1';
const lockedOnly = process.argv.includes('--locked');
const forceRefresh = process.argv.includes('--refresh-lock');

function validateTargetLock() {
  const lock = readLock(lockPath);
  const builder = lock.packages['node_modules/electron-builder'];
  if (!builder || builder.version !== expectedVersion) {
    throw new Error(`В release-toolchain lockfile ожидался electron-builder ${expectedVersion}, найдено: ${builder?.version || 'нет записи'}`);
  }
  const securityVersions = assertMinimumLockedPackages(lock, {
    'app-builder-lib': '26.15.0',
    'builder-util-runtime': '9.7.0'
  });
  const globalAgentVersions = assertExactPackageVersions(lock, 'global-agent', '4.1.3');
  const minimatchVersions = assertNoExactPackageVersions(lock, 'minimatch', ['10.2.6']);
  const builderScopedMinimatch = minimatchVersions.filter(item => item.path.includes('app-builder-lib') || item.path === 'node_modules/minimatch');
  if (builderScopedMinimatch.length === 0 || builderScopedMinimatch.some(item => item.version !== '10.2.5' && item.version.startsWith('10.'))) {
    throw new Error(`Ожидался upstream-pinned minimatch@10.2.5 внутри app-builder-lib; найдено: ${builderScopedMinimatch.map(x => `${x.version} (${x.path})`).join(', ') || 'нет записи'}`);
  }
  return { lock, sri: checkRegistrySRI(lockPath), securityVersions, minimatchVersions, globalAgentVersions };
}

if (process.argv.includes('--plan')) {
  runPlan('План синхронизации Windows release toolchain', [
    'При отсутствии lockfile: npm install --package-lock-only --ignore-scripts --no-audit --no-fund (cwd: tools/release-toolchain)',
    'Проверить electron-builder 26.18.1, app-builder-lib >=26.15.0, builder-util-runtime >=9.7.0, minimatch@10.2.5, global-agent@4.1.3 и валидный SRI',
    'npm ci --ignore-scripts --no-audit --no-fund (cwd: tools/release-toolchain)',
    'npm audit --prefix tools/release-toolchain --audit-level=low --json',
    'CI использует --locked и не меняет release-toolchain/package-lock.json'
  ]);
  process.exit(0);
}

try {
  let validation = null;
  try { if (!forceRefresh) validation = validateTargetLock(); }
  catch (error) {
    if (lockedOnly) throw new Error(`Строгий режим CI: ${error.message}. Выполните npm run release-tools:refresh онлайн и сохраните release-toolchain/package-lock.json.`);
    console.log(`Release toolchain lockfile требует синхронизации: ${error.message}`);
  }

  if (!validation) {
    if (lockedOnly) throw new Error('Строгий режим CI: отсутствует пригодный release-toolchain/package-lock.json. Сначала выполните npm run release-tools:refresh онлайн.');
    console.log('1/4 Генерирую или обновляю отдельный lockfile electron-builder...');
    validation = refreshLockfile({
      lockPath,
      cwd: toolRoot,
      label: 'Обновление release-toolchain lockfile',
      args: ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'],
      validate: validateTargetLock
    });
  } else {
    console.log('1/4 Использую зафиксированный release-toolchain lockfile без обновления версий...');
  }

  console.log('2/4 Проверяю SRI и устанавливаю release toolchain из lockfile...');
  runNpm(['ci', '--ignore-scripts', '--no-audit', '--no-fund'], toolRoot, 'npm ci release toolchain');
  const installedBuilder = JSON.parse(fs.readFileSync(path.join(toolRoot, 'node_modules/electron-builder/package.json'), 'utf8'));
  const installedGlobalAgent = assertExactInstalledPackageVersions(validation.lock, path.join(toolRoot, 'node_modules'), 'global-agent', '4.1.3');
  const installedMinimatch = assertNoInstalledExactPackageVersions(validation.lock, path.join(toolRoot, 'node_modules'), 'minimatch', ['10.2.6']);
  const installedBuilderMinimatch = installedMinimatch.filter(item => item.path.includes('app-builder-lib') || item.path === 'node_modules/minimatch');
  if (installedBuilderMinimatch.length === 0 || installedBuilderMinimatch.some(item => item.version !== '10.2.5' && item.version.startsWith('10.'))) {
    throw new Error(`Установлен неожиданный minimatch в дереве app-builder-lib: ${installedBuilderMinimatch.map(x => `${x.version} (${x.path})`).join(', ') || 'нет записи'}`);
  }
  if (installedBuilder.version !== expectedVersion) {
    throw new Error(`Установлен electron-builder ${installedBuilder.version}; ожидался ${expectedVersion}`);
  }

  console.log('3/4 Выполняю аудит транзитивных зависимостей electron-builder...');
  const audit = runAndSaveAudit(root, ['--prefix', 'tools/release-toolchain'], path.join(root, 'qa/dependency-audit-release-toolchain-latest.json'), 'Аудит Windows release toolchain');
  const report = {
    checkedAt: new Date().toISOString(),
    electronBuilder: installedBuilder.version,
    lockfile: validation.sri,
    securityVersions: validation.securityVersions,
    minimatchVersions: validation.minimatchVersions,
    globalAgentVersions: validation.globalAgentVersions,
    installedGlobalAgent,
    installedMinimatchVersions: installedBuilderMinimatch,
    auditSummary: audit?.metadata?.vulnerabilities || null,
    status: 'PASS'
  };
  fs.writeFileSync(path.join(root, 'qa/dependency-audit-release-toolchain-latest.summary.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log('Release toolchain синхронизирован, SRI проверен, npm audit прошёл.');
} catch (error) {
  console.error(`Синхронизация release toolchain остановлена: ${error.message}`);
  process.exitCode = 1;
}
