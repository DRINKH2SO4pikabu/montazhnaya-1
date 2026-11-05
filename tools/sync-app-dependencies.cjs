'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  runNpm, checkRegistrySRI, readLock, runAndSaveAudit, runPlan, refreshLockfile, assertMinimumLockedPackages, assertMinimumInstalledPackages
} = require('./dependency-lock-utils.cjs');

const root = path.resolve(__dirname, '..');
const lockPath = path.join(root, 'package-lock.json');
const extractorVersion = '1.0.8';
const electronVersion = '45.2.1';
const lockedOnly = process.argv.includes('--locked');
const forceRefresh = process.argv.includes('--refresh-lock');

function validateTargetLock() {
  const lock = readLock(lockPath);
  const electron = lock.packages['node_modules/electron'];
  const extractor = lock.packages['node_modules/@electron-internal/extract-zip'];
  if (!electron || electron.version !== electronVersion) {
    throw new Error(`В lockfile ожидался Electron ${electronVersion}, найдено: ${electron?.version || 'нет записи'}`);
  }
  if (!extractor || extractor.version !== extractorVersion) {
    throw new Error(`В lockfile ожидался @electron-internal/extract-zip ${extractorVersion}, найдено: ${extractor?.version || 'нет записи'}`);
  }
  const securityVersions = assertMinimumLockedPackages(lock, { undici: '7.30.1' });
  return { lock, sri: checkRegistrySRI(lockPath), securityVersions };
}

if (process.argv.includes('--plan')) {
  runPlan('План синхронизации зависимостей приложения «Монтажная»', [
    'При отсутствующем/устаревшем lockfile: npm install --package-lock-only --ignore-scripts --no-audit --no-fund',
    'Проверить Electron 45.2.1, @electron-internal/extract-zip 1.0.8 и валидный SRI у всех registry.npmjs.org записей',
    'npm ci --ignore-scripts --no-audit --no-fund',
    'npm audit --audit-level=low --json',
    'CI использует --locked: никаких перегенераций package-lock.json'
  ]);
  process.exit(0);
}

try {
  let validation = null;
  try { if (!forceRefresh) validation = validateTargetLock(); }
  catch (error) {
    if (lockedOnly) throw new Error(`Строгий режим CI: ${error.message}. Перегенерируйте и сохраните package-lock.json через npm run deps:refresh.`);
    console.log(`Lockfile требует синхронизации: ${error.message}`);
  }

  if (!validation) {
    if (lockedOnly) throw new Error('Строгий режим CI: отсутствует пригодный package-lock.json. Выполните npm run deps:refresh онлайн и сохраните lockfile.');
    console.log('1/4 Генерирую или обновляю lockfile. Предыдущая версия будет восстановлена при ошибке резолвинга/валидации...');
    validation = refreshLockfile({
      lockPath,
      cwd: root,
      label: 'Обновление package-lock.json приложения',
      args: ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'],
      validate: validateTargetLock
    });
  } else {
    console.log('1/4 Использую уже синхронизированный lockfile без обновления версий...');
  }

  console.log('2/4 Проверяю SRI и выполняю чистую установку из lockfile...');
  runNpm(['ci', '--ignore-scripts', '--no-audit', '--no-fund'], root, 'npm ci приложения');
  const installedExtractor = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/@electron-internal/extract-zip/package.json'), 'utf8'));
  const installedElectron = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/electron/package.json'), 'utf8'));
  if (installedElectron.version !== electronVersion || installedExtractor.version !== extractorVersion) {
    throw new Error(`После npm ci установлены неожиданные версии: Electron ${installedElectron.version}, extractor ${installedExtractor.version}`);
  }
  const installedSecurityVersions = assertMinimumInstalledPackages(validation.lock, path.join(root, 'node_modules'), { undici: '7.30.1' });

  console.log('3/4 Выполняю npm audit приложения...');
  const audit = runAndSaveAudit(root, [], path.join(root, 'qa/dependency-audit-app-latest.json'), 'Аудит зависимостей приложения');
  const report = {
    checkedAt: new Date().toISOString(),
    electron: installedElectron.version,
    extractor: installedExtractor.version,
    lockfile: validation.sri,
    securityVersions: validation.securityVersions,
    installedSecurityVersions,
    auditSummary: audit?.metadata?.vulnerabilities || null,
    status: 'PASS'
  };
  fs.writeFileSync(path.join(root, 'qa/dependency-audit-app-latest.summary.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log('Зависимости приложения синхронизированы, SRI проверен, npm audit прошёл.');
} catch (error) {
  console.error(`Синхронизация зависимостей приложения остановлена: ${error.message}`);
  process.exitCode = 1;
}
