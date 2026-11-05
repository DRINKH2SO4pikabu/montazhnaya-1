# QA — «Монтажная» beta 3.6.12

## Автоматическая регрессия

- Полный набор `npm test`: **136/136 passed**, 0 fail, 0 skipped.
- JavaScript-синтаксис inline Renderer проверен через `node --check` после извлечения script-блока из `src/renderer/index.html`.
- `electron/main.cjs`, `electron/preload.cjs`, `electron/audio-media.cjs` проходят `node --check`.

## Реальные FFmpeg/ffprobe проверки

- Нормализация MP3, AAC, OGG/Vorbis, FLAC и PCM WAV к PCM 16-bit, 48 кГц, stereo.
- Дополнительно проверены AC-3, E-AC-3, WMA2 и DTS, если соответствующие энкодеры присутствуют в локальной сборке FFmpeg.
- 5.1 / PCM 24-bit downmix к stereo PCM 16-bit.
- Положительное смещение встроенного звука: созданный WAV содержит 200 мс цифровой тишины в начале, затем полезный сигнал; длительность увеличена на 200 мс.
- Отрицательное смещение: сэмплы до начала видеопотока отрезаны, длительность WAV сокращена на 125 мс.
- Контейнер с двумя аудиопотоками: ffprobe и `selectAudioStream` выбирают поток с `disposition.default=1`.
- WAV parser проверяет RIFF/WAVE, формат PCM, каналы, частоту, размер data chunk и его смещение.

## Логика предпросмотра и сведения

- Проверено, что ffprobe анализирует встроенный звук до резервной проверки Chromium.
- Небраузерные кодеки, multichannel и >48 кГц направляются на preview normalization.
- Если embedded audio offset ненулевой, preview нормализуется с выравниванием по видео даже для browser-native кодека.
- Offline source collector включает audio tracks и встроенный звук video tracks; после отделения звука оригинальный video clip исключается из микса через `audioMutedBySplit`, чтобы избежать двойного звука.
- Equal-power crossfade проверен на концах и в midpoint: `sin² + cos² = 1`; realtime/offline рендереры содержат выборки кривой на протяжении fade.
- Сохранение параметров crossfade и команды применить/убрать переход проверены.

## Не проверено автоматически

- Запуск Electron GUI на Windows PowerShell 5.1.
- Длительный (>30 минут) многодорожечный музыкальный проект.
- Субъективная прослушка preview и экспортированного MP4/WebM на целевой Windows-машине.
- Двойная проверка всех сценариев split/unlink/relink на сложном проекте с несколькими клипами.

## Приёмка

Автоматический этап закрыт. Ручная Windows/Electron приёмка остаётся обязательной прежде, чем считать аудиоэтап полностью принятым для production.
