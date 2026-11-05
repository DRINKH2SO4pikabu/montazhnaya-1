# Публичный релиз Montazhnaya_1 — контрольный список

## Лицензия и происхождение
- [x] GPL-3.0-or-later выбрана для оригинального кода и проектной документации.
- [x] Полный текст GPL добавлен в корень.
- [x] CC BY 4.0 принята для перечисленных проектных медиаактивов.
- [x] Разделены LICENSE_SCOPE, asset credits и third-party notices.
- [x] Ручная инженерная ревизия исходного кода выполнена; отчёт `SOURCE_CODE_ORIGIN_AUDIT_RU.md`.
- [x] DCO и правила CONTRIBUTING добавлены.

## Медиа и бренд
- [x] Включены 21 MP4-превью переходов и 21 соответствующий постер.
- [x] Сохранена атрибуция `Created with Grok` в README, реестре и окне «О программе».
- [x] Логотип и выбранная фирменная графика указаны как созданные с ChatGPT и отобранные/интегрированные сопровождающим.
- [x] QA contact sheets, пользовательские скриншоты и локальные логи исключены.
- [x] Синтетические тестовые MP4/WAV генерируются локально и не коммитятся.

## Сторонние компоненты
- [x] Root npm license inventory по `package-lock.json` (13 пакетов).
- [x] CycloneDX SBOM корневой npm dependency graph.
- [x] FFmpeg/FFprobe binaries не включены в исходный архив.
- [ ] Создан `tools/release-toolchain/package-lock.json`.
- [ ] Выполнен сетевой `npm audit` для обеих цепочек.
- [ ] Полный SBOM для release toolchain и Windows-дистрибутива.
- [ ] Electron/Chromium notices проверены в Setup/Portable.

## Репозиторий и безопасность
- [ ] Создан публичный GitHub repo `montazhnaya-1` под аккаунтом сопровождающего.
- [ ] Owner/URL внесены в `CITATION.cff`.
- [ ] Включены Dependabot, secret scanning, push protection и private vulnerability reporting.
- [x] Внешние GitHub Actions закреплены полными commit SHAs; workflow permissions минимизированы.
- [ ] Проверен первый запуск Actions после публикации и выбраны реальные обязательные status checks.
- [ ] Финальная secret scan публичного архива.

## Тесты и бинарный выпуск
- [ ] `npm run deps:ci` PASS на чистой сетевой машине.
- [ ] `npm run electron:version` PASS.
- [ ] `npm run qa:locales` PASS из чистой установки.
- [ ] `npm test` PASS из чистой установки.
- [ ] `npm run release-tools:ci` PASS.
- [ ] Windows Setup/Portable собраны на Windows x64.
- [ ] Чистая установка Windows 10/11 x64 проверена.
- [ ] MP4/WebM export и FFprobe проверены на реальном проекте.
- [ ] NVIDIA/AMD/Intel и CPU fallback проверены на физическом оборудовании.
- [ ] SHA-256, SBOM и third-party notices приложены к draft prerelease.
