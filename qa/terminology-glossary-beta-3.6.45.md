# Montazhnaya Beta 3.6.45 — editing terminology glossary

This is a working glossary extracted from the effective runtime messages of the 36 selectable locale variants, including the Stage 8 editorial correction layer. Russian is the source language; English is the reference language. The CSV contains one row per locale and one column per editing concept.

| Russian source | English reference | Editorial context |
|---|---|---|
| Таймлайн | Timeline | Рабочая область монтажа |
| Видеодорожка | Video Track | Дорожка видеоклипов |
| Клип | Clip | Элемент монтажа |
| Переходы | Transitions | Переходы между клипами |
| Разделить на курсоре | Split at Playhead | Разрез клипа по курсору |
| Ripple-удалить | Ripple Delete | Удаление со сдвигом |
| Кадр | Frame | Единица видеопоследовательности |
| Частота кадров проекта | Project frame rate | FPS проекта |
| Разрешение проекта | Project resolution | Размер кадра проекта |
| Цветокоррекция | Color Correction | Цвет и тон |
| Титры поверх клипа | Clip Titles | Текстовые наложения |
| Громкость, % | Volume, % | Уровень звука |
| Экспорт | Export | Создание итогового файла |
| Имя файла | File Name | Имя выходного файла |
| Разрешение | Resolution | Размер изображения |
| Прилипание | Snapping | Магнитное выравнивание |
| Сохранить текущий кадр | Save Current Frame | Снимок кадра |
| Отделить звук на аудиодорожку | Detach Audio to Track | Извлечение звука |
| Связать видео и аудио | Link Video and Audio | Связанные видео и звук |
| Длительность перехода | Transition Duration | Время эффекта перехода |
| Положение | Position | Position — расположение объекта |
| Позиция | Position | Position — расположение объекта |
| Слайд-шоу | Slideshow | Последовательность фотографий |
| Открыть проект… | Open Project… | Загрузка проекта |
| Восстановить медиафайлы… | Relink Media Files… | Повторное связывание исходников |

## Term consistency rule

Where several Russian source labels map to the same English editing concept, their target-language wording must remain consistent unless the UI context requires a documented distinction. In this release, the duplicate ‘Position’ labels are unified for Ukrainian, Czech, Kyrgyz and Belarusian.

The glossary includes a machine-assisted Stage 8 terminology edit, but it is an editorial aid, not a native-speaker certification. Each locale remains a preview until terminology and naturalness are reviewed by a fluent editor.

Files: `terminology-glossary-beta-3.6.45.csv` (spreadsheet-friendly matrix) and `terminology-glossary-beta-3.6.45.json` (structured source).
