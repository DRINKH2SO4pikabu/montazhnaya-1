# QA beta 3.6.21 — поддержка выбора NVENC / AMF / QSV

## Изменения

- Вынесены H.264 параметры кодирования в `electron/h264-encoder.cjs`.
- Raw RGBA MP4 pipeline принимает `libx264`, `h264_nvenc`, `h264_amf` и `h264_qsv`.
- Main process определяет, какие аппаратные кодировщики собраны в FFmpeg, и выполняет короткую runtime-пробу каждого доступного варианта.
- Порядок автоматической проверки: NVENC → AMF → QSV → программный libx264.
- Ошибка драйвера или устройства не останавливает выбор: проверяется следующий вариант, затем применяется libx264.
- Добавлен начальный GitHub Actions workflow для Windows, Linux и macOS.

## Проверки, выполненные локально в среде разработки

- Node.js: `v22.16.0`.
- FFmpeg/FFprobe: `7.1.5`.
- `node --check electron/main.cjs` — PASS.
- `node --check electron/frame-sequence.cjs` — PASS.
- `node --check electron/h264-encoder.cjs` — PASS.
- `npm test` — **188/188 PASS**.
- Runtime probe в доступной Linux-среде: FFmpeg содержит `h264_nvenc` и `h264_qsv`, но обе аппаратные пробы завершились ошибкой из-за отсутствия пригодного GPU-доступа; `h264_amf` не включён в эту сборку. Ожидаемое поведение — перейти к следующему варианту и в итоге на libx264.

## Что не проверено

- Запуск приложения в Windows Electron GUI.
- Реальный NVENC на пользовательской NVIDIA GTX 1050 и драйвере.
- AMD AMF и Intel QSV на физических устройствах.
- Аппаратный кодировщик для PNG transport path.
- Сравнение SSIM/PSNR и benchmark на физическом железе.
- Удалённый запуск GitHub Actions workflow.

## Ручная проверка на Windows

1. Запустить редактор из beta 3.6.21.
2. Открыть диагностику FFmpeg и убедиться, что локальные FFmpeg/FFprobe найдены.
3. Экспортировать короткий MP4 и сохранить журнал приложения/FFmpeg.
4. В журнале найти строку `[H.264] Для этой сессии выбран ...`.
5. Проверить файл FFprobe: H.264, размер, FPS, число кадров, длительность, AAC при наличии звука, BT.709.
6. При отсутствии/сбое аппаратного кодировщика должен выбираться `libx264`, экспорт не должен аварийно завершаться.

## Откат

Вернуть файлы из `backups/phase-3.6.21-pre/` для `electron/main.cjs`, `electron/frame-sequence.cjs` и `tests/png-sequence-export.test.cjs`; удалить новый `electron/h264-encoder.cjs`, `tests/h264-encoder.test.cjs`, `.github/workflows/ci.yml`, `README.md`, `docs/DEVELOPMENT_ROADMAP_9_PHASES.md` и `docs/qa-beta-3.6.21.md`; вернуть версии `package.json`, `package-lock.json` и двух version assertions в тестах на 3.6.20.
