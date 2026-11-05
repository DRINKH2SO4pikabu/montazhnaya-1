# Сборка и запуск Montazhnaya_1 на Windows

## Требования

- Windows 10/11 x64.
- Node.js 22.12.0 или новее; рекомендуется Node.js 24 LTS.
- Доступ к npm registry при первоначальной установке.
- FFmpeg и FFprobe устанавливаются отдельно; в исходный архив они не включены.

## Первый запуск исходников

1. Клонировать репозиторий и открыть PowerShell в его корне.
2. Запустить `INSTALL_AND_RUN.bat` либо выполнить строго описанные в актуальном README команды.
3. Проверить синхронизацию lockfile, SRI и `npm audit`. Не обходить строгие проверки и не подменять lockfile частично сгенерированным файлом.
4. Скачать/проверить Electron runtime по официальной процедуре проекта.
5. Запустить `npm test` и `npm run qa:locales`.
6. Настроить FFmpeg/FFprobe через PATH или переменные `FFMPEG_PATH` и `FFPROBE_PATH`.

Для последующих запусков используется `START_Montazhnaya.bat`.

## Сборка Setup и Portable

Проект использует отдельный `tools/release-toolchain` для `electron-builder`. В переданном архиве `tools/release-toolchain/package-lock.json` отсутствует. До его создания, коммита и прохождения сетевого `npm audit` релизная сборка должна оставаться заблокированной.

После закрытия этого блокера:

1. Подготовить release toolchain на Windows x64 с точной закреплённой версией `electron-builder`.
2. Сохранить сгенерированный `tools/release-toolchain/package-lock.json` в Git.
3. Пройти `npm run release-tools:ci` и `npm audit` для обеих цепочек зависимостей.
4. Запустить `BUILD_WINDOWS_RELEASE.bat`.
5. Установить Setup на чистую Windows VM и отдельно проверить Portable.
6. Проверить запуск, импорт, таймлайн, переходы, speed, Undo/Redo и экспорт MP4/WebM.
7. Получить `SHA-256` для обоих файлов, создать GitHub Release и приложить соответствующий исходный код/SBOM/notices.

## Обязательные проверки перед тегом

```powershell
npm run deps:ci
npm run electron:version
npm run qa:locales
npm test
npm run release-tools:ci
```

Все команды должны завершиться с кодом 0. Отсутствие доступа к npm registry означает **BLOCKED**, а не «уязвимостей нет».

## Аппаратная приёмка

Автотесты не сертифицируют физические GPU. Отдельно проверить NVENC на NVIDIA, AMF на AMD и Quick Sync на Intel с реальными драйверами, а также программный `libx264` fallback. Проверить 1080p/4K и 24/30/60 FPS, синхронизацию звука, длительность последнего кадра и реальный MP4 через FFprobe.
