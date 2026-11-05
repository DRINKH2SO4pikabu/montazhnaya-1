# Release toolchain

This folder contains the separately pinned Windows packaging tool. `electron-builder` is fixed to `26.18.1`; it is isolated from editor runtime dependencies and has its own npm lockfile. `app-builder-lib` resolves its `minimatch` dependency to `10.2.5`, matching the upstream v26.18.1 pnpm lock. The nested `@electron/get` downloader resolves `global-agent` to `4.1.3`, removing the older optional `global-agent@3` → `roarr` → `sprintf-js` chain. GHSA-hp3w-g68c-fv3c was withdrawn on 22 October 2026; this override is dependency-tree hygiene, not a claim to fix an active advisory. Both exact overrides are enforced by lockfile and installed-tree gates. This avoids the exact `10.2.6` release named by the maintainer's GHSA-g3hv-75wg-m249 advisory. The public GitHub Advisory Database currently shows a broader `<11.0.1` range; the maintainer's advisory text identifies `10.2.6` specifically, and an open advisory-database issue requests clarification of the broad range. Do not silently treat this as a universal clean bill: review future advisory updates and the actual audit output before release.

## First online setup

Run `npm run release-tools:install`. If the lockfile is missing, the helper creates it from this exact manifest. It then validates every npm registry SRI entry, installs with `npm ci --ignore-scripts`, checks the installed builder version, verifies `app-builder-lib` and `builder-util-runtime` patch floors plus exact `minimatch@10.2.5` and `global-agent@4.1.3`, and runs `npm audit --audit-level=low` (fail-closed: no vulnerability severity is silently ignored). Keep the generated `package-lock.json` under version control after the first successful online setup.

## Reproducible CI/release setup

CI and release workflows must use `npm run release-tools:ci`. This is a strict, non-mutating mode: it requires the committed lockfile, checks its SRI coverage, installs exactly the locked graph, then audits the full graph. If the lockfile needs refreshing, run `npm run release-tools:refresh` deliberately, review the diff, and commit the updated lockfile.

Do not use `npm exec --package=...` for release builds: that creates a transient dependency graph outside the tracked lockfile.
