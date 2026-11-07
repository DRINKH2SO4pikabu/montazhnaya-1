'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { npmInvocation, npmAuditEnvironment, checkRegistrySRI, isValidSRI, readLock, snapshotLock, restoreLock, compareNumericVersions, assertMinimumLockedPackages, assertMinimumInstalledPackages, assertExactPackageVersions, assertExactInstalledPackageVersions } = require('../tools/dependency-lock-utils.cjs');

function withTempLock(lock, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'montazhnaya-lock-test-'));
  const file = path.join(directory, 'package-lock.json');
  try {
    fs.writeFileSync(file, JSON.stringify(lock), 'utf8');
    return callback(file);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}


test('Windows npm lifecycle invokes npm-cli.js through node instead of spawning npm.cmd', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'montazhnaya-npm-cli-'));
  try {
    const cliPath = path.join(directory, 'npm-cli.js');
    fs.writeFileSync(cliPath, '// test fixture\n', 'utf8');
    const invocation = npmInvocation(['ci', '--ignore-scripts'], { npm_execpath: cliPath }, 'win32');
    assert.equal(invocation.command, process.execPath);
    assert.deepEqual(invocation.args, [cliPath, 'ci', '--ignore-scripts']);
    assert.deepEqual(invocation.options, {});
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('Windows npm fallback enables shell for npm.cmd when not inside an npm lifecycle', () => {
  const invocation = npmInvocation(['audit', '--json'], {}, 'win32');
  assert.equal(invocation.command, 'npm.cmd');
  assert.deepEqual(invocation.args, ['audit', '--json']);
  assert.equal(invocation.options.shell, true);
});

test('non-Windows npm invocation uses the native npm executable', () => {
  const invocation = npmInvocation(['ci'], {}, 'linux');
  assert.equal(invocation.command, 'npm');
  assert.deepEqual(invocation.args, ['ci']);
  assert.deepEqual(invocation.options, {});
});

test('npm security audits override unsupported third-party mirrors without mutating caller config', () => {
  const original = {
    PATH: 'C:\\\\Windows\\\\System32',
    NPM_CONFIG_REGISTRY: 'https://registry.npmmirror.com/',
    npm_config_userconfig: 'C:\\\\Users\\\\tester\\\\.npmrc',
    npm_config_fund: 'true'
  };
  const env = npmAuditEnvironment(original);
  assert.equal(env.npm_config_registry, 'https://registry.npmjs.org/');
  assert.equal(Object.keys(env).filter(key => key.toLowerCase() === 'npm_config_registry').length, 1);
  assert.equal(env.npm_config_userconfig, original.npm_config_userconfig);
  assert.equal(env.npm_config_fund, 'false');
  assert.equal(env.npm_config_progress, 'false');
  assert.equal(original.NPM_CONFIG_REGISTRY, 'https://registry.npmmirror.com/');
  const helper = fs.readFileSync(path.join(__dirname, '..', 'tools/dependency-lock-utils.cjs'), 'utf8');
  assert.match(helper, /--registry=https:\\/\\/registry\\.npmjs\\.org\\//);
});

test('SRI parser accepts valid SHA-512, SHA-384 and SHA-256 values', () => {
  const digest = algorithm => crypto.createHash(algorithm).update('fixture').digest('base64');
  assert.equal(isValidSRI(`sha512-${digest('sha512')}`), true);
  assert.equal(isValidSRI(`sha384-${digest('sha384')} sha512-${digest('sha512')}`), true);
  assert.equal(isValidSRI(`sha256-${digest('sha256')}`), true);
});

test('SRI parser rejects empty, malformed and invalid-base64 values', () => {
  assert.equal(isValidSRI(''), false);
  assert.equal(isValidSRI('   '), false);
  assert.equal(isValidSRI('sha512-***'), false);
  assert.equal(isValidSRI('sha512-YWJjZA'), false);
  assert.equal(isValidSRI('sha512-YWJjZA=='), false, 'digest byte length must match the declared algorithm');
  assert.equal(isValidSRI('md5-YWJjZA=='), false);
});

test('registry lock integrity validation succeeds only when all registry tarballs have SRI', () => {
  const fixture = {
    name: 'fixture', version: '1.0.0', lockfileVersion: 3,
    packages: {
      '': { name: 'fixture', version: '1.0.0' },
      'node_modules/a': {
        version: '1.0.0', resolved: 'https://registry.npmjs.org/a/-/a-1.0.0.tgz',
        integrity: `sha512-${crypto.createHash('sha512').update('fixture').digest('base64')}`
      },
      'node_modules/git-dep': { version: '1.0.0', resolved: 'https://github.com/example/repo.git' }
    }
  };
  withTempLock(fixture, file => {
    const result = checkRegistrySRI(file);
    assert.equal(result.packageCount, 2);
    assert.deepEqual(result.registryPackagesWithoutSRI, []);
  });
});

test('registry lock integrity validation rejects missing and malformed SRI', () => {
  const base = {
    name: 'fixture', version: '1.0.0', lockfileVersion: 3,
    packages: {
      '': { name: 'fixture', version: '1.0.0' },
      'node_modules/a': { version: '1.0.0', resolved: 'https://registry.npmjs.org/a/-/a-1.0.0.tgz' }
    }
  };
  withTempLock(base, file => assert.throws(() => checkRegistrySRI(file), /нет SRI/));
  base.packages['node_modules/a'].integrity = 'sha512-***';
  withTempLock(base, file => assert.throws(() => checkRegistrySRI(file), /некорректный SRI/));
});

test('lock snapshots can be restored byte-for-byte and absent lockfiles remain absent', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'montazhnaya-lock-restore-'));
  const file = path.join(directory, 'package-lock.json');
  try {
    const original = Buffer.from('{"before":true}\n');
    fs.writeFileSync(file, original);
    const saved = snapshotLock(file);
    fs.writeFileSync(file, '{"after":true}\n');
    restoreLock(file, saved);
    assert.deepEqual(fs.readFileSync(file), original);
    fs.unlinkSync(file);
    restoreLock(file, null);
    assert.equal(fs.existsSync(file), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('app lockfile pins Electron 45.2.1 and extractor 1.0.8 with complete registry SRI coverage', () => {
  const root = path.join(__dirname, '..');
  const lockPath = path.join(root, 'package-lock.json');
  const lock = readLock(lockPath);
  assert.equal(lock.packages['node_modules/@electron-internal/extract-zip'].version, '1.0.8');
  assert.equal(lock.packages['node_modules/electron'].version, '45.2.1');
  const result = checkRegistrySRI(lockPath);
  assert.deepEqual(result.registryPackagesWithoutSRI, []);
  assert.deepEqual(result.registryPackagesWithInvalidSRI, []);
});


test('version comparison handles numeric patch floors without lexicographic mistakes', () => {
  assert.equal(compareNumericVersions('9.7.1', '9.7.0'), 1);
  assert.equal(compareNumericVersions('26.18.1', '26.15.0'), 1);
  assert.equal(compareNumericVersions('9.6.99', '9.7.0'), -1);
  assert.equal(compareNumericVersions('9.7.0', '9.7.0'), 0);
  assert.throws(() => compareNumericVersions('latest', '9.7.0'), /невалидные версии/);
  assert.throws(() => compareNumericVersions('9.7.0-alpha.1', '9.7.0'), /невалидные версии/);
});

test('release toolchain rejects dependency versions below known security patch levels', () => {
  const lock = { packages: {
    'node_modules/app-builder-lib': { version: '26.18.1' },
    'node_modules/builder-util-runtime': { version: '9.7.1' }
  } };
  const result = assertMinimumLockedPackages(lock, {
    'app-builder-lib': '26.15.0',
    'builder-util-runtime': '9.7.0'
  });
  assert.equal(result['builder-util-runtime'][0], '9.7.1');
  lock.packages['node_modules/builder-util-runtime'].version = '9.6.9';
  assert.throws(() => assertMinimumLockedPackages(lock, { 'builder-util-runtime': '9.7.0' }), /устаревшая версия builder-util-runtime/);
});

test('release toolchain validation checks nested dependency copies, not only the root hoist', () => {
  const lock = { packages: {
    'node_modules/builder-util-runtime': { version: '9.7.1' },
    'node_modules/app-builder-lib/node_modules/builder-util-runtime': { version: '9.6.0' }
  } };
  assert.throws(() => assertMinimumLockedPackages(lock, { 'builder-util-runtime': '9.7.0' }), /9.6.0/);
});


test('installed package versions must match every lockfile path and meet the security floor', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'montazhnaya-installed-tree-'));
  try {
    const lock = { packages: {
      'node_modules/app-builder-lib': { version: '26.18.1' },
      'node_modules/app-builder-lib/node_modules/builder-util-runtime': { version: '9.7.1' }
    } };
    const packageDirs = [
      path.join(directory, 'app-builder-lib'),
      path.join(directory, 'app-builder-lib/node_modules/builder-util-runtime')
    ];
    packageDirs.forEach((dir, index) => {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        name: index === 0 ? 'app-builder-lib' : 'builder-util-runtime',
        version: index === 0 ? '26.18.1' : '9.7.1'
      }));
    });
    const result = assertMinimumInstalledPackages(lock, directory, {
      'app-builder-lib': '26.15.0', 'builder-util-runtime': '9.7.0'
    });
    assert.deepEqual(result['builder-util-runtime'], ['9.7.1']);
    fs.writeFileSync(path.join(packageDirs[1], 'package.json'), JSON.stringify({ name: 'builder-util-runtime', version: '9.6.9' }));
    assert.throws(() => assertMinimumInstalledPackages(lock, directory, { 'builder-util-runtime': '9.7.0' }), /не совпадает с lockfile|требуется не ниже/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});


test('release toolchain requires minimatch 11.0.1 or newer in every lockfile copy', () => {
  const lock = { packages: {
    'node_modules/minimatch': { version: '11.0.1' },
    'node_modules/app-builder-lib/node_modules/minimatch': { version: '11.0.1' },
    'node_modules/@electron/universal/node_modules/minimatch': { version: '11.0.1' }
  } };
  const versions = assertMinimumLockedPackages(lock, { minimatch: '11.0.1' });
  assert.deepEqual(versions.minimatch, ['11.0.1', '11.0.1', '11.0.1']);
  lock.packages['node_modules/@electron/universal/node_modules/minimatch'].version = '9.0.9';
  assert.throws(() => assertMinimumLockedPackages(lock, { minimatch: '11.0.1' }), /устаревшая версия minimatch/);
});

test('release toolchain uses a global patched minimatch override', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools/release-toolchain/package.json'), 'utf8'));
  assert.equal(manifest.overrides?.minimatch, '11.0.1');
  assert.equal(manifest.overrides?.['app-builder-lib']?.minimatch, undefined);
  assert.equal(manifest.overrides?.['app-builder-lib']?.['@electron/get']?.['global-agent'], '4.1.3');
});

test('installed release toolchain enforces minimatch 11.0.1 for root and nested dependency copies', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'montazhnaya-minimatch-installed-'));
  try {
    const paths = [
      'minimatch',
      'app-builder-lib/node_modules/minimatch',
      '@electron/universal/node_modules/minimatch'
    ];
    for (const relative of paths) {
      const pkg = path.join(directory, relative);
      fs.mkdirSync(pkg, { recursive: true });
      fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: 'minimatch', version: '11.0.1' }));
    }
    const lock = { packages: {
      'node_modules/minimatch': { version: '11.0.1' },
      'node_modules/app-builder-lib/node_modules/minimatch': { version: '11.0.1' },
      'node_modules/@electron/universal/node_modules/minimatch': { version: '11.0.1' }
    } };
    const versions = assertMinimumInstalledPackages(lock, directory, { minimatch: '11.0.1' });
    assert.deepEqual(versions.minimatch, ['11.0.1', '11.0.1', '11.0.1']);
    fs.writeFileSync(path.join(directory, '@electron/universal/node_modules/minimatch/package.json'), JSON.stringify({ name: 'minimatch', version: '9.0.9' }));
    assert.throws(() => assertMinimumInstalledPackages(lock, directory, { minimatch: '11.0.1' }), /не совпадает с lockfile|требуется не ниже/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});


test('release toolchain requires a patched global-agent version across every lockfile copy', () => {
  const lock = { packages: {
    'node_modules/global-agent': { version: '4.1.3' },
    'node_modules/legacy/node_modules/global-agent': { version: '4.1.3' }
  } };
  assert.equal(assertExactPackageVersions(lock, 'global-agent', '4.1.3').length, 2);
  lock.packages['node_modules/legacy/node_modules/global-agent'].version = '3.0.0';
  assert.throws(() => assertExactPackageVersions(lock, 'global-agent', '4.1.3'), /точный global-agent@4.1.3/);
});

test('installed release toolchain must match the exact global-agent version from the lockfile', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'montazhnaya-global-agent-installed-'));
  try {
    const pkg = path.join(directory, 'global-agent');
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: 'global-agent', version: '4.1.3' }));
    const lock = { packages: { 'node_modules/global-agent': { version: '4.1.3' } } };
    assert.equal(assertExactInstalledPackageVersions(lock, directory, 'global-agent', '4.1.3')[0].version, '4.1.3');
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: 'global-agent', version: '3.0.0' }));
    assert.throws(() => assertExactInstalledPackageVersions(lock, directory, 'global-agent', '4.1.3'), /Ожидался установленный global-agent@4.1.3/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
