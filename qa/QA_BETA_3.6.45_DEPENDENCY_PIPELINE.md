# «Монтажная» Beta 3.6.45 — dependency security and Windows build completion attempt

> **Исторический журнал попытки от 3 ноября 2026 года.** В этом снимке зафиксированы сетевые ограничения и отсутствие Windows-сборки именно на дату данного запуска. Позднее release-toolchain lockfile был создан и закоммичен, оба дерева зависимостей прошли аудит, а Windows Setup/Portable были собраны, проверены и опубликованы в [релизе v3.6.45](https://github.com/DRINKH2SO4pikabu/montazhnaya-1/releases/tag/v3.6.45). Текущий итоговый статус находится в [PUBLICATION_READINESS_RU.md](../PUBLICATION_READINESS_RU.md).


**Дата:** 3 ноября 2026 года
**Тип:** source maintenance update; Setup/Portable не собраны в текущей среде.

## Что выполнено сейчас

- Повторно выполнены все тесты проекта: **307 PASS / 0 FAIL**.
- Корневой lockfile проверен программно: 13/13 npm registry entries имеют SRI корректной длины и Base64-формата; `electron@45.2.1`, `@electron-internal/extract-zip@1.0.8`, `undici@7.30.1` зафиксированы.
- `npm ci --ignore-scripts --dry-run --offline` для корневого приложения прошёл и подтвердил согласованность манифеста и lockfile.
- Обновлён `qa/dependency-license-metadata-beta-3.6.45.json`: исправлена устаревшая запись extractor `1.0.6` и неверное сообщение об отсутствии Electron SRI.
- Добавлен ручной GitHub Actions workflow `.github/workflows/dependency-security-windows.yml`. Он на `windows-latest` создаёт toolchain lockfile, устанавливает и аудирует оба дерева, повторяет строгую установку, запускает QA и тесты, затем — только при успешных gates — строит Setup и Portable x64. Аудитные артефакты и lockfiles выгружаются даже при отказе gate. Добавлен `PREPARE_DEPENDENCIES_AND_BUILD_WINDOWS_X64.bat` для первого онлайн-запуска на Windows x64.
- Добавлен `PREPARE_DEPENDENCIES_AND_BUILD_WINDOWS_X64.bat` для первого сетевого запуска непосредственно на Windows x64. Он генерирует toolchain lockfile, запускает его аудит и передаёт управление существующему строгому build batch.
- Добавлены регрессионные тесты на workflow, условия сборки, первоначальное создание lockfile и актуальность SRI-инвентаризации.

## Фактические проверки в текущем контейнере

| Проверка | Результат | Деталь |
|---|---|---|
| Regression suite | PASS | 307/307, 0 skipped |
| Root SRI | PASS | 13/13 registry package entries, missing 0, invalid 0 |
| Root npm ci dry-run offline | PASS | lockfile/manifest согласованы |
| Root `npm audit --audit-level=low` | BLOCKED | `EAI_AGAIN registry.npmjs.org`; advisory response не получен |
| Toolchain lock generation | BLOCKED | offline — `ENOTCACHED`; online — DNS `EAI_AGAIN`; отдельный lockfile не создан |
| Toolchain audit | BLOCKED | npm возвращает `ENOLOCK`, так как нет toolchain lockfile |
| Windows x64 build | BLOCKED_ON_HOST_PLATFORM | `node tools/run-windows-build.cjs` вызван на Linux x86_64 и остановлен ожидаемым `win32` guard; Setup/Portable не собраны |

## Что намеренно не заявляется

- Полный npm audit не завершён ни для одного дерева; нулевой vulnerability count не подтверждён.
- `electron-builder` не устанавливался в этом контейнере и отдельный package-lock не создан.
- NSIS Setup и Portable EXE здесь не собраны и не прошли runtime/GUI-проверки.
- Новое workflow подготовлено, но не запущено: исходники доступны в локальном архиве, подключённого GitHub repository для проекта нет.

## Завершающий путь

В сетевой среде Windows x64 с Node.js 24 запустить `PREPARE_DEPENDENCIES_AND_BUILD_WINDOWS_X64.bat` либо поместить проект в GitHub repository и вызвать вручную Actions workflow **Dependency security refresh and Windows x64 build**. Если любой npm audit возвращает advisory, workflow намеренно остановит упаковку, но выгрузит lockfiles и JSON-отчёты для разбора. После успешного первого запуска сохранить `tools/release-toolchain/package-lock.json` в системе контроля версий; дальнейшие releases остаются strict/locked.
