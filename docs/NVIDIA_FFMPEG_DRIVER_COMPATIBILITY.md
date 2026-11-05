# NVIDIA FFmpeg compatibility note — GTX 1050 / driver 582.66

## Фактическая ошибка пользователя

Экспортный лог beta 3.6.21 содержит:

```text
Driver does not support the required nvenc API version. Required: 13.1 Found: 13.0
The minimum required Nvidia driver for nvenc is 610.00 or newer
```

Это несовместимость версии API в используемом FFmpeg binary с установленным драйвером, а не доказательство отсутствия NVENC в GTX 1050. Не следует обновлять драйвер только ради этой сборки без отдельной проверки поддержки ОС и устройства.

## Требуемая конфигурация для контрольного теста

- Сохранить текущий NVIDIA driver 582.66 на время эксперимента.
- Использовать FFmpeg, скомпилированный с `nv-codec-headers` `n13.0.19.1` (или более ранними совместимыми заголовками), а не `n13.1.15.0`.
- Сборка должна содержать NVENC, NVDEC/CUDA, FFmpeg hwaccels и H.264/AAC/MP4.
- Проверить `ffmpeg -hide_banner -hwaccels`, `ffmpeg -hide_banner -encoders` и фактический одно-кадровый encode/decode, а не только наличие строк `h264_nvenc`/`cuda`.
- Всегда использовать `ffmpeg.exe` и `ffprobe.exe` из одной и той же сборки.

Согласно официальной документации NVIDIA Video Codec SDK 13.0, SDK 13.0 рассчитан на Windows-драйверы 570 и новее. Это согласуется с драйвером 582.66. Документация SDK 13.1 и заголовков NVENC 13.1 указывает более высокий минимум 610.0.

Официальные источники:

- NVIDIA Video Codec SDK 13.0 Read Me: https://docs.nvidia.com/video-technologies/video-codec-sdk/13.0/read-me/index.html
- FFmpeg nv-codec-headers releases: https://github.com/FFmpeg/nv-codec-headers/releases
- FFmpeg NVENC/NVDEC documentation: https://ffmpeg.org/ffmpeg-codecs.html
- NVIDIA FFmpeg integration guide: https://developer.nvidia.com/ffmpeg

## Фактический результат последующей проверки на GTX 1050

После первоначальной ошибки была отдельно загружена и проверена Gyan FFmpeg 8.0.1 с NVENC API 13.0. Пользователь подтвердил, что короткий реальный H.264 encode через `h264_nvenc` завершился успешно, SHA-256 архива совпал с ожидаемым значением, а системный FFmpeg и драйвер не менялись.

Затем beta 3.6.22 на этой сборке выдала `NVDEC_PROBE_PASS`; оконное декодирование 4K60 H.264 шло через `-hwaccel cuda -hwaccel_output_format cuda`, без сообщений об оконном или программном fallback. Отдельный экспорт также выбрал `h264_nvenc`. Однако этот экспорт использовал источник 1280×720, поэтому его 42,4 секунды не сравнимы с прежним 4K60 → 720p30 CPU-прогоном (151,3 секунды).

В beta 3.6.23 NVENC-профиль изменён с VBR на CBR: `-b:v` равен `-maxrate`, включены `-strict_gop 1` и `-cbr_padding 1`. Реальный CBR-экспорт на GTX 1050 и точность среднего битрейта ещё должны быть проверены с исходником `montazhnaya_20261102_1710.mp4` (3840×2160, 60 FPS). См. `docs/benchmark-protocol-3.6.23.md`.
