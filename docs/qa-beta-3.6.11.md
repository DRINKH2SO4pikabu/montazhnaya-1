# QA — «Монтажная» beta 3.6.11

## База

- Исходная версия: beta 3.6.10.
- Рабочая копия содержит полный набор тестов предыдущей версии; до изменений он проходил 113/113.
- Обновление зависимостей npm не потребовалось; package version и lock root version согласованы на 3.6.11.

## Итог

- **119 тестов, 119 passed, 0 failed, 0 skipped**.
- Node.js test runner: `node --test tests/*.test.cjs`.
- Синтаксис `electron/main.cjs`, `electron/preload.cjs`, `electron/frame-sequence.cjs`, `electron/tool-diagnostics.cjs` проверен `node --check`.
- Встроенный JS Renderer извлечён из HTML и успешно проверен через `new Function(...)`.

## Интеграционные проверки реального FFmpeg/ffprobe

1. Локальный MP4 H.264/AAC: прежняя бинарная передача image2pipe, CFR, аудио и отмена остаются рабочими.
2. WebM VP8 + Opus при 25 FPS: ffprobe подтвердил контейнер `matroska,webm`, VP8, `yuv420p`, 25 кадров, `avg_frame_rate=25/1`, Opus и временной охват аудиопакетов около 1 секунды.
3. WebM VP9 + Opus при 60 FPS: ffprobe подтвердил контейнер `matroska,webm`, VP9, `yuv420p`, 60 кадров, `avg_frame_rate=60/1`, Opus и временной охват аудиопакетов около 1 секунды.
4. На WebM проверена полнота и монотонность PTS всех кадров. Для 60 FPS допуска учитывает 1 мс time_base; кадры с повторяющимися PTS, большими разрывами или отсутствующими временными метками не принимаются.
5. Диагностика FFmpeg создала и проверила все доступные тестовые контейнеры/кодеки: MP4 без аудио, MP4 с AAC, WebM VP8+Opus, WebM VP9+Opus.
6. Проверена обработка Opus pre-skip: отрицательное начальное время около −7 мс не считается рассинхронизацией; когда stream duration отсутствует, аудио-покрытие вычисляется по PTS и длительности пакетов.

## Проверки UI и контракта

- В Electron-режиме доступны локальные MP4, WebM VP8 и WebM VP9 только по результату capability lookup.
- Локальный MP4 не дублируется realtime MediaRecorder MP4, когда локальный кодек доступен.
- Каждый локальный формат использует `exportPngSequenceToMp4(filename, format)` и один бинарный FFmpeg pipeline.
- MediaRecorder проверяется только для realtime/browser fallback.
- Вне Electron browser formats остаются явно realtime и не обещают CFR.
- Диагностическая панель отображает отдельные результаты WebM VP8/VP9 smoke test.
- Справка по экспорту и длительные предупреждения различают локальные offline MP4/WebM и браузерный realtime fallback; устаревшее описание WebM/MP4 как общего MediaRecorder-пути удалено.

## Ещё требуется ручная проверка

- Запуск установщика Windows PowerShell 5.1 и `npm.cmd test` на пользовательском компьютере.
- Экспорт реального проекта с многослойным видео и несколькими аудиодорожками в MP4, WebM VP8 и WebM VP9.
- Проверка воспроизведения WebM в целевых плеерах и Chromium/Electron на Windows.
- Визуальное сравнение предпросмотра с выходными файлами для переходов, титров, масок, цветокоррекции и трансформаций.
