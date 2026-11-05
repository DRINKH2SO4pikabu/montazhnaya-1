# Настройка GitHub-репозитория Montazhnaya_1

**Актуальное состояние: 5 ноября 2026 года.**

## Идентификаторы

**Статус:** репозиторий уже создан и опубликован. Этот файл теперь служит справкой по его текущей конфигурации, а не инструкцией перед первым push.

- Repository: `montazhnaya-1`
- Product display name: `Montazhnaya_1`
- URL: https://github.com/DRINKH2SO4pikabu/montazhnaya-1
- Description: `Free, local-first Windows video editor. Built openly and improved with the community.`
- Suggested topics: `video-editor`, `electron`, `ffmpeg`, `windows`, `open-source`, `webgl2`, `nonlinear-editor`
- Default branch: `main`
- Visibility: Public

## Что уже настроено

- [x] Публичный репозиторий создан; исходный код Stage 19 / 3.6.45 опубликован.
- [x] README на английском и русском содержит актуальные ссылки на репозиторий.
- [x] `CITATION.cff` содержит `repository-code`.
- [x] Issues, issue templates и pull request template находятся в репозитории.
- [x] Dependabot version updates настроены еженедельно для корневого npm-проекта, `tools/release-toolchain` и GitHub Actions.
- [x] Dependency graph включён.
- [x] Dependabot alerts и Dependabot security updates включены.
- [x] Secret Protection и Push protection включены.
- [x] Private Vulnerability Reporting включён.
- [x] Ветка `main` защищена от force-push и удаления. Требование PR и обязательные status checks пока не включены, чтобы не блокировать текущий процесс прямых коммитов сопровождающего.
- [x] CI прошёл на `windows-latest`, `ubuntu-latest` и `macos-latest`.
- [x] Внешние GitHub Actions в workflow закреплены полными commit SHA; разрешения workflow минимизированы.

## Оставшиеся задачи по безопасности и качеству

1. Выполнить отдельный полный аудит всей Git-истории на секреты и персональные данные. Предварительный осмотр текущего дерева не обнаружил известных маркеров секретов, ключей или локальных путей.
2. Включить Malware alerts, если переключатель доступен для этого репозитория.
3. При переходе на pull request workflow настроить обязательные CI status checks, используя точные имена успешно завершённых проверок.
4. Рассмотреть включение обязательного PR после перехода на работу через feature-ветки.

## Первый бинарный релиз

Публичный исходный репозиторий не означает, что установщик уже готов. До официального Setup/Portable-релиза необходимо:

- создать и закоммитить `tools/release-toolchain/package-lock.json` для `electron-builder@26.18.1`;
- завершить сетевой `npm audit` для корневой и release-toolchain цепочек зависимостей;
- подготовить полный SBOM для release toolchain и Windows-дистрибутива;
- проверить сохранность Electron/Chromium third-party notices;
- собрать Setup и Portable на Windows x64 и проверить их на чистой Windows 10/11;
- проверить экспорт MP4/WebM и аппаратные/программные кодировщики на целевом оборудовании;
- приложить к prerelease SHA-256, SBOM, third-party notices, QA summary и список известных ограничений.

Не публиковать отдельный бинарный FFmpeg/FFprobe, пока не проверены точная сборка, её лицензия, configure flags, checksum и обязательные уведомления/исходники.
