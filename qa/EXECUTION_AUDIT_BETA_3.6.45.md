# «Монтажная» Beta 3.6.45 — результаты выполнения исполнительного резюме

Дата проверки: 3 ноября 2026 года
Исходный архив: `Montazhnaya_Beta_3.6.45_Localization_Quality_Source.zip`
SHA-256 исходного архива: `7c5f3b264344a280a402483f4d4110b5dd06fda37d249fb9572a4db5c1f3414b`

## Итог

Первый проход аудита исправил два подтверждённых недочёта безопасности renderer и две проблемы CI/release-процесса. Этот документ дополняется follow-up от 3 ноября 2026 года: Electron уже обновлён до 45.2.1; актуальный результат набора тестов на 3 ноября 2026 года — **303/303, 0 ошибок**. Исторические разделы ниже следует читать с учётом follow-up в конце файла.

**Эта сборка не является готовым публичным релизом.** Первоначальный блокер Electron 37 закрыт обновлением исходников до 45.2.1. Остаются блокеры полного npm audit, получения официального SRI для пакета Electron, обновления extract-zip до актуальной версии 1.0.8, lockfile для electron-builder и Windows runtime/GUI QA.

## Проверка исходного архива

- ZIP успешно проверен (`unzip -t`), все записи читаются.
- В архиве 309 записей, общий распакованный размер около 18,3 МБ.
- Имя корневой папки архива содержало `3.6.44`, хотя package metadata и код указывают `3.6.45`. Это было несоответствие имени каталога, а не downgrade: `package.json`, `package-lock.json`, HTML title и журнал изменений содержат 3.6.45.
- В итоговом архиве корневая папка будет переименована в `Montazhnaya_Beta_3.6.45_Source`.

## Подтверждённые находки и исправления

### SEC-01 — отсутствовала Content Security Policy

**Серьёзность:** высокая.
**Подтверждение:** в `src/renderer/index.html` не было CSP meta policy. Electron рекомендует задавать ограничительную CSP даже для renderer-страниц приложения.
**Исправление:** добавлена политика, ограничивающая загрузку локальными `self/file/blob/data`-ресурсами, запрещающая `object-src`, `base-uri` и `form-action`, без `unsafe-eval`. `unsafe-inline` оставлен для script/style, так как текущий интерфейс содержит встроенный крупный скрипт и стили; это осознанный компромисс, а не полная CSP-изоляция.

### SEC-02 — не блокировались внешняя навигация и новые окна

**Серьёзность:** высокая.
**Подтверждение:** в `createWindow()` не было обработчиков `will-navigate`, `will-redirect` и `setWindowOpenHandler`.
**Исправление:** разрешена только навигация на исходный локальный HTML-документ редактора; переходы и редиректы на иные URL отменяются, создание новых окон отклоняется. В коде редактора не найдено штатной зависимости от внешних окон.

### CI-01 — release workflow не устанавливал FFmpeg перед регрессионными тестами

**Серьёзность:** высокая для выпуска.
**Подтверждение:** обычный CI устанавливал FFmpeg на Windows перед `npm test`, release workflow — нет, хотя тестовый набор содержит реальные FFmpeg/ffprobe-интеграционные сценарии.
**Исправление:** в `.github/workflows/release-windows.yml` добавлен шаг `choco install ffmpeg`; перед тестами также запускается локализационный аудит.

### CI-02 — локализационный quality audit не был подключён к CI

**Серьёзность:** средняя.
**Исправление:** `npm run qa:locales` и `npm audit --audit-level=low` добавлены в общий CI и Windows release workflow.

## Проверки после исправлений

| Проверка | Результат |
|---|---:|
| Полный Node test suite | **303 passed / 0 failed (последняя регрессия 3 ноября 2026 года)** |
| Локализационные варианты | 36 selectable |
| Полные preview-пакеты | 34 |
| Ключей в эталонном словаре | 436 |
| Отсутствующие ключи | 0 |
| Пустые значения | 0 |
| Английские fallback entries | 0 |
| Несовпадения плейсхолдеров | 0 |
| Несогласованные повторяющиеся термины | 0 |
| CSS rules/at-rules | 590 |
| CSS parse/declaration errors | 0 / 0 |
| Проверки синтаксиса CJS | 58 файлов — pass |
| Inline renderer script syntax | pass |
| ZIP integrity | pass |

Сырой протокол полного набора тестов сохранён в `qa/npm-test-beta-3.6.45.log`. Локализационный аудит сформировал обновлённые отчёты покрытия, глоссария, placeholders и длинных меток.

## Незакрытые блокеры и ограничения

### BLOCKER-01 — Electron 37.10.3 больше не поддерживается

`package.json` и `package-lock.json` закрепляют Electron 37.10.3. По официальному расписанию Electron ветка 37 достигла EOL 13 января 2026 года. На дату аудита официальное расписание показывает поддерживаемые ветки 43, 44 и 45; в официальном списке стабильных выпусков последняя версия ветки 45 — 45.2.1 от 30 октября 2026 года.

**Статус:** закрыт в follow-up от 3 ноября 2026 года — исходники закреплены на Electron 45.2.1. Сетевая регенерация lockfile и Windows runtime smoke test остаются отдельными блокерами.

### BLOCKER-02 — сканирование CVE не завершено

`npm audit` был вызван, но npm registry не ответил (`EAI_AGAIN registry.npmjs.org`). Следовательно, сканирование уязвимостей не завершено; это не означает отсутствия CVE. Повторить `npm audit` и/или OWASP Dependency-Check в среде с сетевым доступом после обновления зависимостей.

### BLOCKER-03 — Windows сборка и GUI не подтверждены

Windows Setup/Portable в этой среде не собирались; Windows GUI запуск, установка/удаление, SmartScreen/подпись, WACK и DPI 100/125/150/200% не проверялись. Статические проверки и Linux/CLI-тесты не заменяют Windows runtime QA.

### Дополнительные замечания

- Все 70 пакетов в `package-lock.json` имеют поле `license`; распределение метаданных и полный перечень сохранены в `qa/dependency-license-metadata-beta-3.6.45.json`. Это инвентаризация, а не юридическая проверка совместимости лицензий.
- `electron-builder@26.18.1` вынесен в отдельный `tools/release-toolchain/package.json` с exact pin, scoped overrides и strict lockfile/audit gates. Отдельный `tools/release-toolchain/package-lock.json` пока не создан из-за `EAI_AGAIN` npm registry; CI/release блокируют сборку без него.
- Локализации остаются preview drafts: структурная полнота не доказывает естественность перевода. Нужна вычитка носителями языка.
- CSS-аудит синтаксический; реальное отображение длинных строк, гарнитуры и RTL необходимо проверить на Windows в графическом интерфейсе.
- В проекте не выбрана лицензия самого приложения. Статус отражён в `LICENSE_STATUS.md`; распространение бинарных пакетов требует отдельной юридической проверки и third-party notices.

## Рекомендуемый порядок дальнейших действий

1. **P0:** обновить Electron до поддерживаемой ветки, зафиксировать точные версии и lockfile; проверить security advisories и сборку.
2. **P1:** прогнать npm audit / SCA scan и устранить подтверждённые CVE; добавить electron-builder в lockfile.
3. **P1:** выполнить Windows x64 Setup/Portable build; проверить install, first launch, update-over-install, uninstall, сохранность пользовательских проектов и логи.
4. **P1:** выполнить визуальную регрессию на Windows при 100%, 125%, 150%, 200%, особенно RTL, CJK, длинные немецкие/французские строки и модальные окна.
5. **P2:** привлечь носителей языка для review всех 34 preview-пакетов, отдельно отметить узбекскую кириллицу как транслитерационный черновик.
6. **P2:** после подтверждения Windows QA определить лицензию проекта, сформировать `THIRD_PARTY_NOTICES`, подготовить контрольные суммы и подписанный релиз.

## Воспроизводимость

```powershell
npm.cmd test
npm.cmd run qa:locales
```

Проверка `npm audit` требует доступа к npm registry. Windows installer/portable build и визуальная проверка должны выполняться на Windows.


## Follow-up: Electron 45 and dependency security (3 November 2026)

Electron 37.10.3 has been replaced with Electron 45.2.1. The minimum Node.js version is now 22.12.0; CI uses Node.js 24. The app install steps use `npm ci --ignore-scripts` followed by explicit `npm run electron:install`, consistent with Electron 42+ behavior. The root lock now contains 13 packages and pins Electron 45.2.1, `@electron/get` 5.1.0, `@electron-internal/extract-zip` 1.0.8 and `undici` 7.30.1. All 13 registry packages have syntactically valid SRI entries; npm registry installation/audit are still blocked by DNS from this environment.

A manual check of public advisories found that undici 7.29.0 was not sufficient: October 2026 advisories required 7.30.1 for multiple high/moderate issues. The lock was corrected before completion. Electron 45.2.1 has no known direct Electron advisories according to the public advisory databases reviewed.

The local test suite was extended for launcher version checks, stale-runtime repair, and Electron 45 API compatibility; latest result: 303/303 passed. Windows launcher and build batch now validate Node >=22.12, install exact lockfile dependencies when missing/outdated, verify Electron 45.2.1, and run npm audit/tests/locale QA before packaging.

The full `npm audit --audit-level=low` remains blocked by `EAI_AGAIN registry.npmjs.org`. Root lockfile SRI coverage is 13/13. `electron-builder@26.18.1` is now pinned in a separate release-toolchain manifest with security overrides; its full lockfile is still missing because registry resolution is blocked, so Windows release remains fail-closed. Windows runtime installation, Setup/Portable builds and GUI validation were not run in this environment. See `qa/DEPENDENCY_SECURITY_BETA_3.6.45_ELECTRON_45.md` for advisory references, exact residual risks and network-enabled completion commands.
