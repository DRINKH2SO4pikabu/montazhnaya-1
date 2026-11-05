# Montazhnaya Beta 3.6.45 — Fire Whirl Stage 14
## Hotfix: восстановление Electron preload bridge и MP4

**Дата:** 5 ноября 2026 г.
**Основа:** Fire Whirl Stage 13
**Тип изменения:** точечное исправление Electron 45 sandbox preload

## 1. Симптом пользователя

На Windows в редакторе открывалась диагностика FFmpeg, но вместо результата отображалось: «Диагностика доступна только в настольной версии Electron». При этом окно было запущено как Electron-приложение. Список экспорта не показывал MP4.

## 2. Подтверждённая причина

`electron/main.cjs` создаёт окно с `sandbox: true`, `contextIsolation: true` и `nodeIntegration: false`. Это корректные защитные настройки. Однако `electron/preload.cjs` до вызова `contextBridge.exposeInMainWorld()` выполнял `require("./i18n-core.cjs")`. В sandboxed preload Electron 45 функция `require()` ограничена модулями Electron и не может загружать локальные CommonJS-файлы. Из-за исключения preload прекращал выполнение; поэтому `window.montazhnaya` не появлялся в renderer.

Официальная документация Electron прямо описывает это ограничение: sandboxed preload может загружать через `require()` только `electron`, `electron/renderer` и `electron/common`; для других модулей нужен bundling либо self-contained preload. Источник: https://www.electronjs.org/docs/latest/tutorial/sandbox

Симптом MP4 связан с этим мостом: renderer получает возможности FFmpeg через `window.montazhnaya.getFrameSequenceExportCapabilities()`. Если bridge отсутствует, список локальных FFmpeg-форматов не наполняется, поэтому MP4 пропадает. Наличие кодеков на машине пользователя до восстановления моста пока не было проверено.

## 3. Исправление

- Удалён локальный `require("./i18n-core.cjs")` из preload.
- В preload встроены компактные реализации `sanitizeSemanticLocaleData()` и `formatSemanticMessage()` с ограничением типов и длины входных данных.
- Оставлен единственный `require("electron")`.
- `contextBridge.exposeInMainWorld("montazhnaya", ...)` теперь может выполниться в sandboxed preload.
- IPC-каналы, их аргументы и валидация доверенного отправителя в main process не менялись.
- Настройки `sandbox`, `contextIsolation` и `nodeIntegration` не ослаблялись.
- CSP renderer не менялась: изменён только внешний файл preload, а не inline-скрипт HTML.

## 4. Регрессионные проверки

Добавлен тест `tests/preload-sandbox-compatibility.test.cjs`. Он:

1. Проверяет, что `preload.cjs` требует только модуль `electron`.
2. Подтверждает, что main process по-прежнему включает `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`.
3. Выполняет preload в VM с mock `require()`, разрешающим только `electron`.
4. Проверяет появление `window.montazhnaya` и вызов `system:tool-diagnostics`.
5. Проверяет форматирование структурированной IPC-ошибки после передачи локали.

Результаты:

- `node --test --test-concurrency=4 tests/*.test.cjs`: **408/408 PASS**.
- `npm run qa:locales`: **PASS** (36 языковых вариантов; структурные проверки словарей, терминов, плейсхолдеров и обучения без ошибок).
- `node --check electron/preload.cjs`: PASS.
- `node --check tests/preload-sandbox-compatibility.test.cjs`: PASS.

## 5. Что проверить после установки

1. Закрыть Montazhnaya полностью.
2. Сделать резервную копию `electron/preload.cjs` в распакованной папке Stage 13.
3. Распаковать `Montazhnaya_Beta_3.6.45_FireWhirl_Stage14_Hotfix.zip` прямо в корневую папку Stage 13, сохранив структуру `electron\preload.cjs`, и согласиться на замену файла.
4. Запустить `START_Montazhnaya.bat`. Повторно устанавливать зависимости не требуется.
5. Открыть «Справка → Диагностика FFmpeg и ffprobe…» и нажать «Проверить снова».
6. Проверить, что диагностика вернула найденные пути/версии и smoke-test результаты.
7. Открыть экспорт и проверить наличие `MP4 (H.264 + AAC, точный FPS)`.
8. Выполнить короткий MP4-экспорт и проверить файл через ffprobe/обычный видеоплеер.

Если диагностика восстановится, но MP4 останется недоступен, это уже отдельная проблема установки FFmpeg/наборов кодеков: отчёт диагностики покажет, отсутствует ли `libx264`, `aac` или `mp4 muxer`.

## 6. Ограничения

Исправление проверено автоматическими тестами и моделью sandboxed preload, но в этой среде нельзя запустить GUI Electron на Windows. Поэтому окончательное подтверждение появления MP4 и реального экспорта выполняется на пользовательском Windows-компьютере после применения hotfix.
