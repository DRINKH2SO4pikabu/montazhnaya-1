# Следующий приоритет — dependency pipeline (Beta 3.6.45)

## Обновлённая схема

- `npm run deps:install`: первый запуск или восстановление устаревшего lockfile; затем SRI check, `npm ci --ignore-scripts`, version verification и `npm audit --audit-level=low`.
- `npm run deps:refresh`: осознанно обновить lockfile приложения; просмотреть и сохранить diff.
- `npm run deps:ci`: строгий, не мутирующий lockfile режим для CI. Проверяет Electron 45.2.1, extractor 1.0.8 и SRI до установки.
- `npm run release-tools:install`: создать отдельный lockfile `electron-builder@26.18.1` при первом онлайновом запуске, затем чистая установка и полный аудит дерева.
- `npm run release-tools:refresh`: явное обновление отдельного release-toolchain lockfile.
- `npm run release-tools:ci`: строгий locked install и аудит, без генерации новых версий.
- `npm run dist:win`: только локальный `electron-builder` из зафиксированного отдельного toolchain; перед запуском проверяет минимальные исправленные версии `app-builder-lib` и `builder-util-runtime`.

## Известные security floors

| Package | Minimum accepted | Reason |
|---|---:|---|
| `app-builder-lib` | `26.15.0` | GHSA-7g7r-gx96-252g fixed threshold |
| `builder-util-runtime` | `9.7.0` | GHSA-p2f4-r6v6-j797 / CVE-2026-54673 fixed threshold |
| `electron-builder` | `26.18.1` | Exact project packaging toolchain pin |
| `undici` | `7.30.1` | Minimum version with fixes for the reviewed October 2026 advisories |
| `minimatch` in builder tree | `10.2.5` exact | Pin to the version resolved by upstream electron-builder 26.18.1; exclude maintainer-identified affected 10.2.6 pending GHSA range clarification |

## First online setup

```powershell
npm run deps:refresh
npm run deps:install
npm run release-tools:refresh
npm run release-tools:install
npm test
npm run qa:locales
npm run electron:install
npm run electron:version
```

Сохранить/закоммитить оба lockfile после review: `package-lock.json` и `tools/release-toolchain/package-lock.json`. Дальнейшие проверки делать strict commands `npm run deps:ci` и `npm run release-tools:ci`.

## Ограничения текущей среды

Npm registry не разрешается через DNS (`EAI_AGAIN registry.npmjs.org`). Из-за этого нельзя создать валидные SRI для Electron 45.2.1 / extractor 1.0.8 и получить весь lock graph `electron-builder@26.18.1`. Включённые strict CI gates намеренно блокируют build до создания и сохранения реальных lockfile. Никакие SRI-значения вручную не подделываются. Windows Setup/Portable build требует Windows x64.

## Дополнительная проверка GHSA-g3hv-75wg-m249 (CVE-2026-118764)

В advisories проекта `isaacs/minimatch` в affected versions указан конкретно `10.2.6`; описанная ошибка — amplification в `firstPhasePreProcess()` при `optimizationLevel >= 2`. `electron-builder@26.18.1` использует `minimatch@10.2.5` в upstream pnpm lock и объявляет зависимость `^10.2.5`. Чтобы резолвинг npm не поднял пакет на `10.2.6`, отдельный release-toolchain manifest переопределяет `app-builder-lib -> minimatch` строго на `10.2.5`, а lock validator блокирует точную `10.2.6`. GitHub Advisory Database пока показывает широкий диапазон `<11.0.1`; issue #10811 просит уточнить применимость к старым версиям. Поэтому `npm audit` должен быть выполнен после registry доступности, его результат зафиксирован, а возможное moderate сообщение по широкому диапазону требует ручного triage, а не игнорирования. Источники: https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249, https://github.com/github/advisory-database/issues/10811, upstream electron-builder@26.18.1 pnpm-lock.yaml.


Дополнительно для release-toolchain закреплён `global-agent@4.1.3` в scope `app-builder-lib -> @electron/get`; это удаляет устаревшую optional ветку через `roarr`/`sprintf-js`. GHSA-hp3w-g68c-fv3c была отозвана 22 октября 2026 года, поэтому это не считается исправлением действующего advisory. После генерации toolchain lockfile проверяются точные версии global-agent как в lockfile, так и в установленном дереве.


## Дополнение 3 ноября 2026: первый сетевой запуск и Windows runner

В проект добавлены `.github/workflows/dependency-security-windows.yml` (ручной hosted Windows x64 run) и `PREPARE_DEPENDENCIES_AND_BUILD_WINDOWS_X64.bat` (первый локальный онлайн-запуск на Windows). Они генерируют отдельный toolchain lockfile, запускают оба аудита, strict replay, тесты и создают Setup/Portable только при полном успехе. `npm run dist:win` был вызван на Linux и предсказуемо остановлен platform guard; реальная Windows-сборка не выполнялась. В текущей среде повторный `npm audit` блокирован `EAI_AGAIN registry.npmjs.org`; toolchain lock generation — `ENOTCACHED`/`EAI_AGAIN`. См. `QA_BETA_3.6.45_DEPENDENCY_PIPELINE.md` и `dependency-pipeline-execution-current.json`.
