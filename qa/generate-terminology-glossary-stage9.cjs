"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const context = { window: {}, Intl, console };
vm.createContext(context);
for (const file of ["manifest.js", "ru.js", "en.js", "source-messages.js", "guides-en.js", "semantic.js", "beginner-tour.js", "notifications.js", "ipc-error-translations.js", "international.js", "cis.js", "editorial-overrides.js"]) {
  vm.runInContext(read(`src/renderer/locales/${file}`), context, { filename: file });
}
const w = context.window;
const available = w.MontazhnayaLocaleManifest.available;
const packs = w.MontazhnayaLocalePacks;
const apply = w.MontazhnayaApplyEditorialOverrides;
const terms = [
  ["Файл", "File", "Top-level menu and file operations"],
  ["Новый проект", "New Project", "Create a new editing project"],
  ["Открыть проект…", "Open Project…", "Open an existing project"],
  ["Сохранить проект с медиафайлами…", "Save Project with Media…", "Package project and referenced media"],
  ["Импорт медиа…", "Import Media…", "Import video, audio and image assets"],
  ["Восстановить медиафайлы…", "Relink Media Files…", "Reconnect missing source files"],
  ["Экспорт видео…", "Export Video…", "Render the final video file"],
  ["Отменить", "Undo", "Undo the last editing operation"],
  ["Повторить", "Redo", "Redo an undone operation"],
  ["Разделить на курсоре", "Split at Playhead", "Split a clip at the current playhead position"],
  ["Удалить клип", "Delete Clip", "Remove a selected clip"],
  ["Ripple-удалить", "Ripple Delete", "Delete a clip and close the resulting gap"],
  ["Копировать клип", "Copy Clip", "Copy a selected timeline clip"],
  ["Вставить клип", "Paste Clip", "Paste a copied timeline clip"],
  ["Дублировать клип", "Duplicate Clip", "Create a copy of a timeline clip"],
  ["Добавить маркер", "Add Marker", "Add a timeline marker"],
  ["Предыдущий маркер", "Previous Marker", "Navigate to the previous marker"],
  ["Следующий маркер", "Next Marker", "Navigate to the next marker"],
  ["Приблизить таймлайн", "Zoom In Timeline", "Increase timeline zoom"],
  ["Отдалить таймлайн", "Zoom Out Timeline", "Decrease timeline zoom"],
  ["Переключить прилипание", "Toggle Snapping", "Toggle magnetic snapping behavior"],
  ["Переходы", "Transitions", "Transitions between timeline clips"],
  ["Открыть библиотеку переходов", "Open Transition Library", "Open the transition browser"],
  ["Длительность перехода", "Transition Duration", "Length of a transition effect"],
  ["Предпросмотр", "Preview", "Preview monitor or visual preview"],
  ["Формат", "Format", "Output or media format"],
  ["Размер", "Size", "File or image size in context"],
  ["Свойства", "Properties", "Properties panel"],
  ["Таймлайн", "Timeline", "Main editing timeline"],
  ["Дорожка", "Track", "A timeline track"],
  ["Видеодорожка", "Video Track", "A track that contains video clips or images"],
  ["Кадр", "Frame", "A single frame in a video sequence"],
  ["Клип", "Clip", "An editable item on the timeline"],
  ["Разрешение", "Resolution", "Pixel dimensions of an image or video"],
  ["Разрешение проекта", "Project resolution", "Pixel dimensions of the project canvas"],
  ["Ориентация", "Orientation", "Landscape or portrait layout"],
  ["Как в проекте", "Match Project", "Use the current project setting"],
  ["Альбомная", "Landscape", "Horizontal image or video orientation"],
  ["Портретная", "Portrait", "Vertical image or video orientation"],
  ["Частота кадров", "Frame Rate", "Frames per second for media or export"],
  ["Частота кадров проекта", "Project frame rate", "Project frames-per-second setting"],
  ["Целевой средний битрейт", "Target Average Bitrate", "Target average encoded bitrate"],
  ["Соотношение сторон", "Aspect ratio", "Width-to-height ratio"],
  ["Масштаб", "Zoom", "Zoom level"],
  ["Прилипание", "Snapping", "Magnetic alignment to timeline positions"],
  ["Прилипание краёв клипов и курсора", "Snap clip edges and playhead", "Snap clip edges and playhead to editing points"],
  ["Видео", "Video", "Video media type"],
  ["Аудио", "Audio", "Audio media type"],
  ["Изображение", "Image", "Still image media type"],
  ["Растворение", "Dissolve", "Transition category"],
  ["Шторки", "Wipes", "Wipe transition category"],
  ["Движение", "Motion", "Motion transition category"],
  ["Эффекты", "Effects", "Effects category"],
  ["Цветокоррекция", "Color Correction", "Adjusting image color and tone"],
  ["Титры поверх клипа", "Clip Titles", "Text or title overlays rendered over a clip"],
  ["Громкость, %", "Volume, %", "Audio level control"],
  ["Отделить звук на аудиодорожку", "Detach Audio to Track", "Extract a video's audio to a separate track"],
  ["Связать видео и аудио", "Link Video and Audio", "Link paired video and audio clips"],
  ["Положение", "Position", "Position of an object or image"],
  ["Позиция", "Position", "Position in a timeline or property context"],
  ["Слайд-шоу", "Slideshow", "A sequence of still images"],
  ["Музыкальный трек", "Music Track", "Audio source used for a slideshow"],
  ["Режим длительности", "Duration Mode", "How slideshow duration is determined"],
  ["Переходы между фото", "Transitions Between Photos", "Transitions between slideshow images"],
  ["Аудиодорожка для добавления музыки", "Audio Track for Music", "Timeline track used for slideshow music"],
  ["Сохранить текущий кадр", "Save Current Frame", "Save the current composited timeline frame as an image"],
  ["Формат изображения", "Image Format", "PNG or JPEG output format"],
  ["Качество JPEG", "JPEG Quality", "JPEG compression quality"],
  ["Диагностика FFmpeg и ffprobe", "FFmpeg & ffprobe Diagnostics", "Check installed media tools and codecs"],
  ["Дорожка заблокирована", "Track is locked", "Track editing is locked"],
  ["Перетащите файлы сюда", "Drop files here", "Media-library drop zone"],
  ["Отсутствуют файлы", "Missing Files", "Missing source media files"],
  ["Подключить файл…", "Relink File…", "Reconnect a single missing file"],
  ["Добавить на таймлайн", "Add to Timeline", "Place media on a timeline track"],
  ["Прозрачность, %", "Opacity, %", "Visual opacity control"],
  ["Яркость, %", "Brightness, %", "Image brightness control"],
  ["Контраст, %", "Contrast, %", "Image contrast control"],
  ["Насыщенность, %", "Saturation, %", "Image saturation control"],
  ["Длительность", "Duration", "Length of a clip, transition or media item"],
  ["Размер файла", "File Size", "Size of a media file"],
  ["Готов к экспорту", "Ready to Export", "Export readiness status"],
  ["Начать экспорт", "Start Export", "Start rendering the output file"]
];
for (const [source] of terms) if (!Object.hasOwn(packs.en.messages, source)) throw new Error(`Missing source key: ${source}`);
const locales = available.map(entry => {
  const code = entry.code;
  const pack = packs[code];
  if (!pack || !pack.messages) throw new Error(`Missing locale pack ${code}`);
  const effective = code === "ru" ? pack : apply(code) || pack;
  return {
    code,
    nativeName: entry.nativeName,
    englishName: entry.englishName,
    direction: entry.direction || effective.direction || "ltr",
    translations: Object.fromEntries(terms.map(([source]) => [source, code === "ru" ? source : effective.messages[source]]))
  };
});
const payload = {
  stage: 9,
  version: "3.6.45",
  editorialStatus: "machine-assisted terminology review; native-speaker review pending",
  terms: terms.map(([source, context]) => ({ source, english: packs.en.messages[source], context })),
  locales
};
const csv = rows => rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n") + "\r\n";
const output = path.join(root, "qa");
fs.writeFileSync(path.join(output, "expanded-terminology-glossary-stage9.json"), JSON.stringify(payload, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(output, "expanded-terminology-glossary-stage9.csv"), "\uFEFF" + csv([
  ["locale_code", "native_name", "direction", ...terms.map(([source]) => source)],
  ...locales.map(locale => [locale.code, locale.nativeName, locale.direction, ...terms.map(([source]) => locale.translations[source])])
]), "utf8");
const md = [
  "# Expanded video-editing terminology glossary — Stage 9",
  "",
  `- Concepts: **${terms.length}**`,
  `- Language variants: **${locales.length}** (including Russian and English references)`,
  `- Preview locales: **${locales.length - 2}**`,
  "- Status: machine-assisted glossary; native-speaker review pending.",
  "",
  "| Russian source | English reference | Context |",
  "|---|---|---|",
  ...terms.map(([source, context]) => `| ${source} | ${packs.en.messages[source]} | ${context} |`),
  "",
  "The CSV contains one row per locale and a column for each term. Keep UI labels and tutorial wording aligned with these concepts, while allowing grammatical inflection in full sentences.",
  ""
];
fs.writeFileSync(path.join(output, "expanded-terminology-glossary-stage9.md"), md.join("\n"), "utf8");
console.log(JSON.stringify({ terms: terms.length, locales: locales.length, output: "qa/expanded-terminology-glossary-stage9.*" }));
