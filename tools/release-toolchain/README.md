# Release toolchain

This folder contains the separately pinned Windows packaging tool. `electron-builder` is fixed to `26.18.1`; it is isolated from editor runtime dependencies and has its own npm lockfile.

## Security overrides

- `minimatch` is globally overridden to `11.0.1` or newer. GitHub Advisory Database advisory GHSA-g3hv-75wg-m249 / CVE-2026-118764 marks versions below 11.0.1 as affected. The former 10.2.5 pin is not a safe version for this advisory.
- The override is global because the resolved graph includes both `app-builder-lib` and `@electron/universal`; validating only the root copy is insufficient.
- `app-builder-lib -> @electron/get -> global-agent` remains pinned to `4.1.3` to avoid the older optional `global-agent@3` -> `roarr` -> `sprintf-js` chain.

The global minimatch override intentionally supersedes the dependency ranges currently declared by electron-builder 26.18.1 and @electron/universal 2.0.3. The code paths inspected use the named `minimatch()` function and `Minimatch` class / `match()` API; minimatch 11 changes internal matcher representations and removes some older internals. Do not treat the override as compatibility-certified until the locked install, npm audit, Windows NSIS/Portable build and resulting package smoke checks all pass.

## First online setup

Run `npm run release-tools:install`. If the lockfile is missing, the helper creates it from this exact manifest. It then validates every npm registry SRI entry, installs with `npm ci --ignore-scripts`, checks the installed builder version, verifies `app-builder-lib`, `builder-util-runtime` and every nested `minimatch` copy against their security floors, verifies exact `global-agent@4.1.3`, and runs `npm audit --audit-level=low`. The audit is fail-closed: no vulnerability severity is silently ignored. Keep the generated `package-lock.json` under version control after the first successful online setup.

## Reproducible CI/release setup

CI and release workflows must use `npm run release-tools:ci`. This is a strict, non-mutating mode: it requires the committed lockfile, checks its SRI coverage, installs exactly the locked graph, then audits the full graph. If the lockfile needs refreshing, run `npm run release-tools:refresh` deliberately, review the diff, and commit the updated lockfile.

Do not use `npm exec --package=...` for release builds: that creates a transient dependency graph outside the tracked lockfile.
