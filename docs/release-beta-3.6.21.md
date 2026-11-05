# «Монтажная» beta 3.6.21 — кросс-вендорный выбор H.264

В beta 3.6.21 потоковый экспорт MP4 получил единый выбор H.264-кодировщика для NVIDIA NVENC, AMD AMF и Intel Quick Sync. Приложение проверяет доступные варианты коротким реальным кодированием и не полагается только на перечень кодеков в сборке FFmpeg. Если аппаратный путь не запускается, редактор проверяет следующий вариант и завершает цепочку на программном `libx264`.

Также добавлены unit-тесты профилей NVENC/AMF/QSV, проверка последовательности fallback, начальный CI workflow для Windows/Linux/macOS, README и дорожная карта публичного релиза.

## Ограничения этой беты

- Аппаратные варианты пока подтверждены тестами построения аргументов и runtime fallback-механизма, но не сертифицированы на физических GPU всех производителей.
- AMD/Intel/NVIDIA hardware paths need validation on actual machines and supported drivers.
- PNG transport fallback пока не использует аппаратный H.264 selection.
- CI workflow подготовлен, но ещё не запускался на GitHub.
- Installer, portable distribution, code signing, final FFmpeg licensing review and UI localization remain pending.
