# QA — подготовка публичного тестового пакета beta 3.6.28

Дата: 3 ноября 2026 года.

## Проверки, подтверждённые в этой среде

- `npm test`: 232/232 PASS (includes new Windows distribution configuration/workflow tests).
- `node --check` для всех файлов `electron/*.cjs` и `tests/*.cjs`: PASS.
- JSON package-lock читается; все npm registry tarball URL используют `registry.npmjs.org`, целостность package metadata сохранена.
- Лаунчер PowerShell имеет один UTF-8 BOM и `param()` как первый токен.
- Проверены BAT-маркеры первого, повторного запуска и локальной сборки Windows-дистрибутива.
- Проверена конфигурация `electron-builder`: Windows x64 NSIS Setup + Portable, ASAR, пути Electron main/preload/renderer.
- GitHub Actions YAML успешно разобран YAML-парсером; добавлен контроль наличия обоих EXE и SHA-256 checksums.
- ZIP после упаковки проверен через `ZipFile.testzip()` — ошибок целостности нет; внутренние служебные инструкции исключены.

## Что пока не запускалось на Windows в этой сессии

- Новый универсальный `tools/Start-Montazhnaya.ps1` и BAT-обёртки `INSTALL_AND_RUN.bat` / `START_Montazhnaya.bat` прошли структурные проверки и тесты, но не были отдельно исполнены на Windows 10 в этой среде. На компьютере владельца ранее вручную проверен специализированный `tools/Start-Montazhnaya-NVENC.ps1`.

## Ручная приёмка владельцем проекта

Владелец проекта подтвердил в Windows 10:
- исправленный PowerShell-лаунчер запускает Electron;
- видеоматериал импортируется и отображается на медиаполке;
- перетаскивание видеокарточки на видеодорожку создаёт именно видеоклип;
- изображение можно добавить отдельным клипом;
- редактор открывает предоставленный 4K60 H.264/AAC-исходник; FFprobe определяет 3840×2160, 60 FPS, H.264 High, 362 кадра, AAC 48 кГц stereo.

Ручное тестирование выполнялось на компьютере владельца проекта. Это не доказательство работы на любой конфигурации Windows/GPU.

## Не выполнено и блокирует общий стабильный публичный выпуск

1. Обновление Electron 37.10.3 до поддерживаемой ветки, затем полная повторная приёмка Windows.
2. Выбор и добавление лицензии проекта, проверка прав на исходные компоненты и third-party notices.
3. Запуск Windows release workflow на реальном Windows runner, проверка запуска собранного Setup/Portable; подпись кода пока отсутствует.
4. Hardware matrix для AMD AMF / Intel QSV и длинных 4K60 проектов.
5. Проверка GitHub Actions на настоящем удалённом workflow run; локальный YAML parse и unit tests не заменяют её.

## Безопасный запуск тестового пакета

Распаковать в отдельный каталог. Для первой установки выполнить `INSTALL_AND_RUN.bat`; далее использовать `START_Montazhnaya.bat`. Исходная beta 3.6.28 и предыдущие распакованные версии не перезаписывать.


## Дополнение: упаковка Windows beta

Подготовлена конфигурация `electron-builder` 26.18.1: x64 NSIS installer и portable executable. Добавлены локальный `BUILD_WINDOWS_RELEASE.bat` и `.github/workflows/release-windows.yml`; workflow запускает `npm ci`, 232 регрессионных теста, сборку, проверяет наличие Setup/Portable файлов и считает SHA-256. Для тегов `v*` создаётся только draft prerelease.

В этой среде не удалось выполнить сам Windows packaging: `electron-builder` отсутствует локально, а npm registry недоступен по времени ожидания. Следовательно, EXE не были собраны и не проверены запуском здесь. Сборка должна быть выполнена на Windows локальным BAT или удалённым GitHub Actions runner. Не выдавать этот source archive за готовый installer.
