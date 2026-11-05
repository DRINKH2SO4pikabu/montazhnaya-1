'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

// Prefer npm's JavaScript CLI entry point. On Windows, npm.cmd is a batch
// wrapper and cannot be passed directly to spawnSync without a shell (EINVAL).
// npm exposes the exact CLI path to lifecycle scripts as npm_execpath, so we
// can invoke it with the current node.exe and avoid cmd.exe quoting entirely.
function npmInvocation(args, env = process.env, platform = process.platform) {
  const npmCliPath = env.npm_execpath;
  if (npmCliPath && fs.existsSync(npmCliPath)) {
    return { command: process.execPath, args: [npmCliPath, ...args], options: {} };
  }

  if (platform === 'win32') {
    // Fallback for direct invocation outside an npm lifecycle. `shell: true`
    // is limited to this fixed npm command; callers supply repository-owned
    // arguments, never user input.
    return { command: 'npm.cmd', args, options: { shell: true } };
  }

  return { command: 'npm', args, options: {} };
}

function runNpm(args, cwd, label, options = {}) {
  const env = { ...process.env, npm_config_fund: 'false', npm_config_progress: 'false' };
  const invocation = npmInvocation(args, env);
  const result = spawnSync(invocation.command, invocation.args, {
    ...invocation.options,
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    env,
    maxBuffer: 16 * 1024 * 1024
  });
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  if (options.logPath) {
    fs.mkdirSync(path.dirname(options.logPath), { recursive: true });
    fs.writeFileSync(options.logPath, `${stdout}${stderr ? `\n--- STDERR ---\n${stderr}` : ''}`, 'utf8');
  }
  if (result.error) throw new Error(`${label}: не удалось запустить npm: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = (stderr || stdout).trim().slice(-5000);
    throw new Error(`${label}: npm завершился с кодом ${result.status}.\n${detail}`);
  }
  return { stdout, stderr };
}

function readLock(lockPath) {
  if (!fs.existsSync(lockPath)) throw new Error(`Не найден lockfile: ${lockPath}`);
  let lock;
  try { lock = JSON.parse(fs.readFileSync(lockPath, 'utf8')); }
  catch (error) { throw new Error(`Lockfile повреждён или не является JSON (${lockPath}): ${error.message}`); }
  if (lock.lockfileVersion !== 3 || !lock.packages || typeof lock.packages !== 'object') {
    throw new Error(`Ожидался npm package-lock v3: ${lockPath}`);
  }
  return lock;
}

function isValidSRI(value) {
  if (typeof value !== 'string') return false;
  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(token => {
    const match = /^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})(\?.*)?$/.exec(token);
    if (!match) return false;
    try {
      const decoded = Buffer.from(match[2], 'base64');
      const expectedLength = { sha256: 32, sha384: 48, sha512: 64 }[match[1]];
      return decoded.length === expectedLength && decoded.toString('base64').replace(/=+$/, '') === match[2].replace(/=+$/, '');
    } catch { return false; }
  });
}

function checkRegistrySRI(lockPath) {
  const lock = readLock(lockPath);
  const missing = [];
  const invalid = [];
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (!name || !entry || entry.link || !entry.resolved) continue;
    if (entry.resolved.startsWith('https://registry.npmjs.org/')) {
      if (!entry.integrity) missing.push(name);
      else if (!isValidSRI(entry.integrity)) invalid.push(name);
    }
  }
  if (missing.length || invalid.length) {
    const details = [];
    if (missing.length) details.push(`нет SRI (${missing.length}): ${missing.join(', ')}`);
    if (invalid.length) details.push(`некорректный SRI (${invalid.length}): ${invalid.join(', ')}`);
    throw new Error(`Проверка целостности lockfile не пройдена: ${details.join('; ')}`);
  }
  return {
    lockfile: lockPath,
    lockfileVersion: lock.lockfileVersion,
    packageCount: Object.keys(lock.packages).filter(Boolean).length,
    registryPackagesWithoutSRI: [],
    registryPackagesWithInvalidSRI: []
  };
}

function compareNumericVersions(left, right) {
  const parse = value => {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(value || ''));
    return match ? match.slice(1, 4).map(Number) : null;
  };
  const a = parse(left);
  const b = parse(right);
  if (!a || !b) throw new Error(`Невозможно сравнить невалидные версии: ${left} и ${right}`);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) return 1;
    if (a[index] < b[index]) return -1;
  }
  return 0;
}

function assertMinimumLockedPackages(lock, minimums) {
  const results = {};
  for (const [packageName, minimumVersion] of Object.entries(minimums)) {
    const suffix = `/node_modules/${packageName}`;
    const matches = Object.entries(lock.packages || {})
      .filter(([packagePath, entry]) => packagePath === `node_modules/${packageName}` || packagePath.endsWith(suffix))
      .map(([packagePath, entry]) => ({ path: packagePath, version: entry?.version }));
    if (matches.length === 0) throw new Error(`Пакет ${packageName} отсутствует в lockfile.`);
    const outdated = matches.filter(item => compareNumericVersions(item.version, minimumVersion) < 0);
    if (outdated.length) {
      throw new Error(`Уязвимая/устаревшая версия ${packageName}: ${outdated.map(x => `${x.version} (${x.path})`).join(', ')}; требуется не ниже ${minimumVersion}.`);
    }
    results[packageName] = matches.map(item => item.version);
  }
  return results;
}

function assertMinimumInstalledPackages(lock, nodeModulesPath, minimums) {
  const results = {};
  for (const [packageName, minimumVersion] of Object.entries(minimums)) {
    const suffix = `/node_modules/${packageName}`;
    const matches = Object.entries(lock.packages || {})
      .filter(([packagePath]) => packagePath === `node_modules/${packageName}` || packagePath.endsWith(suffix));
    if (matches.length === 0) throw new Error(`Пакет ${packageName} отсутствует в lockfile.`);
    results[packageName] = [];
    for (const [packagePath, entry] of matches) {
      const relativePath = packagePath.slice('node_modules/'.length);
      const manifestPath = path.join(nodeModulesPath, relativePath, 'package.json');
      if (!fs.existsSync(manifestPath)) throw new Error(`Установленный пакет не найден: ${manifestPath}`);
      let installed;
      try { installed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
      catch (error) { throw new Error(`Не удалось прочитать ${manifestPath}: ${error.message}`); }
      if (installed.version !== entry.version) {
        throw new Error(`Версия ${packageName} в node_modules (${installed.version}) не совпадает с lockfile (${entry.version}) по пути ${packagePath}.`);
      }
      if (compareNumericVersions(installed.version, minimumVersion) < 0) {
        throw new Error(`Установлена уязвимая/устаревшая версия ${packageName}@${installed.version}; требуется не ниже ${minimumVersion}.`);
      }
      results[packageName].push(installed.version);
    }
  }
  return results;
}


function assertNoExactPackageVersions(lock, packageName, forbiddenVersions) {
  const forbidden = new Set(forbiddenVersions);
  const matches = Object.entries(lock.packages || {})
    .filter(([packagePath]) => packagePath === `node_modules/${packageName}` || packagePath.endsWith(`/node_modules/${packageName}`))
    .map(([packagePath, entry]) => ({ path: packagePath, version: entry?.version }))
    .filter(item => forbidden.has(item.version));
  if (matches.length) {
    throw new Error(`Обнаружена запрещённая версия ${packageName}: ${matches.map(x => `${x.version} (${x.path})`).join(', ')}.`);
  }
  return Object.entries(lock.packages || {})
    .filter(([packagePath]) => packagePath === `node_modules/${packageName}` || packagePath.endsWith(`/node_modules/${packageName}`))
    .map(([packagePath, entry]) => ({ path: packagePath, version: entry?.version }));
}


function assertNoInstalledExactPackageVersions(lock, nodeModulesPath, packageName, forbiddenVersions) {
  const forbidden = new Set(forbiddenVersions);
  const matches = Object.entries(lock.packages || {})
    .filter(([packagePath]) => packagePath === `node_modules/${packageName}` || packagePath.endsWith(`/node_modules/${packageName}`));
  const found = [];
  for (const [packagePath] of matches) {
    const relativePath = packagePath.slice('node_modules/'.length);
    const manifestPath = path.join(nodeModulesPath, relativePath, 'package.json');
    if (!fs.existsSync(manifestPath)) throw new Error(`Установленный пакет не найден: ${manifestPath}`);
    let installed;
    try { installed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
    catch (error) { throw new Error(`Не удалось прочитать ${manifestPath}: ${error.message}`); }
    if (forbidden.has(installed.version)) found.push({ path: packagePath, version: installed.version });
  }
  if (found.length) {
    throw new Error(`В установленном дереве найдена запрещённая версия ${packageName}: ${found.map(x => `${x.version} (${x.path})`).join(', ')}.`);
  }
  return matches.map(([packagePath]) => {
    const relativePath = packagePath.slice('node_modules/'.length);
    const manifestPath = path.join(nodeModulesPath, relativePath, 'package.json');
    const installed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return { path: packagePath, version: installed.version };
  });
}

function assertExactPackageVersions(lock, packageName, expectedVersion) {
  const matches = Object.entries(lock.packages || {})
    .filter(([packagePath]) => packagePath === `node_modules/${packageName}` || packagePath.endsWith(`/node_modules/${packageName}`))
    .map(([packagePath, entry]) => ({ path: packagePath, version: entry?.version }));
  if (matches.length === 0) throw new Error(`Пакет ${packageName} отсутствует в lockfile.`);
  const unexpected = matches.filter(item => item.version !== expectedVersion);
  if (unexpected.length) {
    throw new Error(`Ожидался точный ${packageName}@${expectedVersion}; найдено: ${unexpected.map(x => `${x.version} (${x.path})`).join(', ')}.`);
  }
  return matches;
}

function assertExactInstalledPackageVersions(lock, nodeModulesPath, packageName, expectedVersion) {
  const matches = assertExactPackageVersions(lock, packageName, expectedVersion);
  for (const item of matches) {
    const relativePath = item.path.slice('node_modules/'.length);
    const manifestPath = path.join(nodeModulesPath, relativePath, 'package.json');
    if (!fs.existsSync(manifestPath)) throw new Error(`Установленный пакет не найден: ${manifestPath}`);
    let installed;
    try { installed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
    catch (error) { throw new Error(`Не удалось прочитать ${manifestPath}: ${error.message}`); }
    if (installed.version !== expectedVersion) {
      throw new Error(`Ожидался установленный ${packageName}@${expectedVersion}, найден ${installed.version} (${item.path}).`);
    }
  }
  return matches;
}

function snapshotLock(lockPath) {
  return fs.existsSync(lockPath) ? fs.readFileSync(lockPath) : null;
}

function restoreLock(lockPath, snapshot) {
  if (snapshot === null) {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
    return;
  }
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, snapshot);
}

function refreshLockfile({ lockPath, cwd, label, args, validate }) {
  const before = snapshotLock(lockPath);
  try {
    runNpm(args, cwd, label);
    const validation = validate();
    return validation;
  } catch (error) {
    try { restoreLock(lockPath, before); }
    catch (restoreError) {
      throw new Error(`${error.message}\nДополнительно не удалось восстановить предыдущий lockfile: ${restoreError.message}`);
    }
    throw error;
  }
}

function runAndSaveAudit(cwd, prefixArgs, reportPath, label) {
  const auditArgs = [...prefixArgs, 'audit', '--audit-level=low', '--json'];
  const env = { ...process.env, npm_config_fund: 'false', npm_config_progress: 'false' };
  const invocation = npmInvocation(auditArgs, env);
  const result = spawnSync(invocation.command, invocation.args, {
    ...invocation.options,
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    env,
    maxBuffer: 16 * 1024 * 1024
  });
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  let parsed = null;
  try { parsed = JSON.parse(stdout); } catch { /* network errors may not return JSON */ }
  const report = {
    label,
    checkedAt: new Date().toISOString(),
    command: `npm ${[...prefixArgs, 'audit', '--audit-level=low', '--json'].join(' ')}`,
    exitCode: result.status,
    spawnError: result.error ? result.error.message : null,
    audit: parsed,
    stdout: parsed ? undefined : stdout,
    stderr
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  if (result.error || result.status !== 0) {
    const reason = result.error ? result.error.message : (stderr || stdout).trim().slice(-5000);
    throw new Error(`${label}: npm audit не прошёл или не смог связаться с registry. Отчёт: ${reportPath}\n${reason}`);
  }
  return parsed;
}

function runPlan(title, steps) {
  console.log(`${title}\n` + steps.map((step, index) => `${index + 1}. ${step}`).join('\n'));
}

module.exports = {
  npmCommand, npmInvocation, runNpm, readLock, checkRegistrySRI, isValidSRI,
  compareNumericVersions, assertMinimumLockedPackages, assertMinimumInstalledPackages, assertNoExactPackageVersions, assertNoInstalledExactPackageVersions, assertExactPackageVersions, assertExactInstalledPackageVersions, snapshotLock, restoreLock, refreshLockfile, runAndSaveAudit, runPlan
};
