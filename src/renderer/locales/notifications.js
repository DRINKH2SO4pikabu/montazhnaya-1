(function (root) {
  "use strict";
  const packs = root.MontazhnayaLocalePacks || Object.create(null);
  const catalog = root.MontazhnayaSemanticCatalog || Object.create(null);
  const entries =   [
    {
      "key": "notification.marker.renamed",
      "source": "Маркер переименован",
      "en": "Marker renamed"
    },
    {
      "key": "notification.marker.deleted",
      "source": "Маркер удалён",
      "en": "Marker deleted"
    },
    {
      "key": "notification.marker.selectionRequired",
      "source": "Выберите маркер или поставьте курсор рядом с ним",
      "en": "Select a marker or move the playhead near one."
    },
    {
      "key": "notification.marker.noneInProject",
      "source": "В проекте пока нет маркеров",
      "en": "There are no markers in this project yet."
    },
    {
      "key": "notification.audio.browserPreviewUnavailable",
      "source": "Аудио импортировано, но его браузерный предпросмотр недоступен. Локальный экспорт будет использовать FFmpeg.",
      "en": "Audio was imported, but browser preview is unavailable. Local export will use FFmpeg."
    },
    {
      "key": "notification.media.webmDurationReading",
      "source": "Читаю длительность WebM через ffprobe…",
      "en": "Reading WebM duration with ffprobe…"
    },
    {
      "key": "notification.media.libraryCleared",
      "source": "Материалы очищены. Можно вернуть их через Ctrl+Z",
      "en": "Media items were cleared. You can restore them with Ctrl+Z."
    },
    {
      "key": "notification.link.selectSourcePair",
      "source": "Сначала выбери видео или его аудиоклип",
      "en": "Select a video or its audio clip first."
    },
    {
      "key": "notification.link.pairAlreadyLinked",
      "source": "Эти видео и аудио уже связаны",
      "en": "This video and audio are already linked."
    },
    {
      "key": "notification.link.pairAmbiguous",
      "source": "Не удалось однозначно найти пару. Проверь, что выбраны исходные видео и отделённый от него звук.",
      "en": "Could not identify a unique pair. Make sure the original video and its detached audio are selected."
    },
    {
      "key": "notification.link.unsupportedPair",
      "source": "Связать можно только видеоклип и звук, отделённый от этого видео",
      "en": "Only a video clip and audio detached from that video can be linked."
    },
    {
      "key": "notification.link.pairNotDetected",
      "source": "Не удалось определить связанную пару видео и аудио",
      "en": "Could not identify the linked video/audio pair."
    },
    {
      "key": "notification.link.pairNotUnique",
      "source": "Не удалось однозначно найти пару видео и аудио",
      "en": "Could not uniquely identify the video/audio pair."
    },
    {
      "key": "notification.link.pairUnlinked",
      "source": "Привязка этой пары отменена. Остальные фрагменты не затронуты.",
      "en": "The link between this pair was removed. Other clips were not affected."
    },
    {
      "key": "notification.link.selectPair",
      "source": "Выбери связанный видеоклип или аудиоклип",
      "en": "Select a linked video or audio clip."
    },
    {
      "key": "notification.media.timelinePlacementFailed",
      "source": "Не удалось разместить материал на дорожке",
      "en": "Could not place the media on the track."
    },
    {
      "key": "notification.media.videoAudioDetachFailed",
      "source": "Видео добавлено, но звук не удалось вынести на отдельную дорожку. Проверь, не заблокированы ли аудиодорожки.",
      "en": "Video was added, but its audio could not be moved to a separate track. Check whether audio tracks are locked."
    },
    {
      "key": "notification.audio.previewCodecUnavailable",
      "source": "Звук отделён, но предпрослушивание встроенного аудиокодека недоступно. Локальный MP4/WebM экспорт использует FFmpeg.",
      "en": "Audio was detached, but the built-in audio codec cannot preview it. Local MP4/WebM export uses FFmpeg."
    },
    {
      "key": "notification.media.videoHasNoAudio",
      "source": "Видео добавлено. Звуковая дорожка в исходном файле не обнаружена.",
      "en": "Video added. No audio stream was found in the source file."
    },
    {
      "key": "notification.media.videoAudioDetectionUnknown",
      "source": "Наличие звука определить не удалось; добавлен отдельный аудиоклип на всякий случай.",
      "en": "Could not determine whether the source contains audio; a separate audio clip was added as a precaution."
    },
    {
      "key": "notification.clip.videoRequired",
      "source": "Сначала выбери видеоклип",
      "en": "Select a video clip first."
    },
    {
      "key": "notification.audio.detach.selectVideoOnVideoTrack",
      "source": "Выбери видео на видеодорожке, чтобы отделить его звук",
      "en": "Select a video clip on a video track to detach its audio."
    },
    {
      "key": "notification.track.videoUnlockRequired",
      "source": "Сначала разблокируй видеодорожку",
      "en": "Unlock the video track first."
    },
    {
      "key": "notification.audio.alreadyDetached",
      "source": "Звук этого клипа уже находится на отдельной аудиодорожке",
      "en": "This clip’s audio is already on a separate audio track."
    },
    {
      "key": "notification.media.videoAudioNotFound",
      "source": "В этом видео звуковая дорожка не обнаружена",
      "en": "No audio stream was found in this video."
    },
    {
      "key": "notification.audio.clipCreateFailed",
      "source": "Не удалось создать аудиоклип. Проверь доступность аудиодорожек.",
      "en": "Could not create an audio clip. Check that an audio track is available."
    },
    {
      "key": "notification.audio.previewUnavailableExportFallback",
      "source": "Звук отделён, но его предпрослушивание недоступно. Экспорт будет обрабатывать исходный звук через FFmpeg.",
      "en": "Audio was detached, but preview is unavailable. FFmpeg will process the source audio during export."
    },
    {
      "key": "notification.media.timelineAddFailed",
      "source": "Не удалось добавить материал на таймлайн",
      "en": "Could not add media to the timeline."
    },
    {
      "key": "notification.media.numberedSequenceNotFound",
      "source": "Не найдены изображения или видео с цифрами в имени файла. Например: 001.jpg, 002.jpg, 003.jpg.",
      "en": "No images or videos with numbers in their filenames were found. For example: 001.jpg, 002.jpg, 003.jpg."
    },
    {
      "key": "notification.track.videoUnavailable",
      "source": "Нет доступной видеодорожки. Разблокируй или покажи V1, V2 либо V3.",
      "en": "No video track is available. Unlock or show V1, V2, or V3."
    },
    {
      "key": "notification.slideshow.imageDurationInvalid",
      "source": "Длительность изображения должна быть от 0,1 до 600 секунд.",
      "en": "Image duration must be between 0.1 and 600 seconds."
    },
    {
      "key": "notification.media.numberedSequenceEmpty",
      "source": "Нет доступных нумерованных изображений или видео.",
      "en": "No numbered images or videos are available."
    },
    {
      "key": "notification.track.videoVisibleUnlockedRequired",
      "source": "Выбери видимую и разблокированную видеодорожку.",
      "en": "Select a visible, unlocked video track."
    },
    {
      "key": "notification.media.sequenceCreateFailed",
      "source": "Не удалось создать клипы на выбранной дорожке.",
      "en": "Could not create clips on the selected track."
    },
    {
      "key": "notification.clip.selectionRequiredOnTimeline",
      "source": "Сначала выберите клип на таймлайне",
      "en": "Select a clip on the timeline first."
    },
    {
      "key": "notification.clip.noLongerExists",
      "source": "Выбранный клип больше не существует",
      "en": "The selected clip no longer exists."
    },
    {
      "key": "notification.track.linkedPairSecondLocked",
      "source": "Вторая дорожка связанной пары заблокирована",
      "en": "The second track in the linked pair is locked."
    },
    {
      "key": "notification.clip.linkedPairMoveConflict",
      "source": "Нельзя сдвинуть связанную пару: на новой позиции одна из дорожек занята",
      "en": "The linked pair cannot be moved because one of its tracks is occupied at the new position."
    },
    {
      "key": "notification.track.linkedPairUnlockBeforeSplit",
      "source": "Связанная дорожка заблокирована. Разблокируй её или отмени привязку перед разрезанием.",
      "en": "The linked track is locked. Unlock it or unlink the pair before splitting."
    },
    {
      "key": "notification.clip.linkedPairSplit",
      "source": "Видео и аудио разрезаны одновременно; обе пары остались связанными.",
      "en": "Video and audio were split together; both clips remain linked."
    },
    {
      "key": "notification.clip.linkedPairPartnerLocked",
      "source": "Видео и аудио связаны, но вторая дорожка заблокирована. Разблокируй её или отмени привязку правым кликом.",
      "en": "The video and audio are linked, but the second track is locked. Unlock it or unlink the pair using the right-click menu."
    },
    {
      "key": "notification.track.linkedPairUnlockBeforeTrim",
      "source": "Связанная дорожка заблокирована. Разблокируй её или отмени привязку перед обрезкой.",
      "en": "The linked track is locked. Unlock it or unlink the pair before trimming."
    },
    {
      "key": "notification.transition.videoClipRequired",
      "source": "Выбери видеоклип или перетащи переход на таймлайн",
      "en": "Select a video clip or drag a transition onto the timeline."
    },
    {
      "key": "notification.transition.videoOnly",
      "source": "Переходы применяются к видеоклипам",
      "en": "Transitions can only be applied to video clips."
    },
    {
      "key": "notification.transition.webglUnavailable",
      "source": "Для предпросмотра «Огненного вихря» нужен WebGL 2. Показан резервный вариант; перед экспортом поддержка будет проверена.",
      "en": "Fire Whirl preview requires WebGL 2. A fallback preview is shown; support will be checked before export."
    },
    {
      "key": "notification.transition.dropOnVideoTrack",
      "source": "Перетаскивай переход на видеодорожку",
      "en": "Drag the transition onto a video track."
    },
    {
      "key": "notification.transition.dropOnClipOrCut",
      "source": "Перетащи переход на клип или на стык двух соседних клипов",
      "en": "Drag a transition onto a clip or between two adjacent clips."
    },
    {
      "key": "notification.clip.selectionRequired",
      "source": "Сначала выберите клип",
      "en": "Select a clip first."
    },
    {
      "key": "notification.transition.incomingClipRequired",
      "source": "Сначала выберите входящий клип на видеодорожке",
      "en": "Select the incoming clip on a video track first."
    },
    {
      "key": "notification.transition.videoTrackOnly",
      "source": "Этот переход доступен только на видеодорожках",
      "en": "This transition is only available on video tracks."
    },
    {
      "key": "notification.transition.previousClipMissing",
      "source": "На этой дорожке нет предыдущего клипа",
      "en": "There is no previous clip on this track."
    },
    {
      "key": "notification.transition.clipsMustBeAdjacent",
      "source": "Для перехода клипы должны стоять вплотную друг к другу без промежутка",
      "en": "Clips must be adjacent with no gap to create a transition."
    },
    {
      "key": "notification.transition.clipTooShort",
      "source": "Клипы слишком короткие для перехода",
      "en": "Clips are too short for this transition."
    },
    {
      "key": "notification.transition.previousClipTooShort",
      "source": "Недостаточно длительности предыдущего клипа",
      "en": "The previous clip is not long enough."
    },
    {
      "key": "notification.transition.overlapConflict",
      "source": "Нельзя создать переход: он перекроет ещё один клип на дорожке",
      "en": "Cannot create the transition because it would overlap another clip on the track."
    },
    {
      "key": "notification.audioClip.selectionRequired",
      "source": "Сначала выбери аудиоклип",
      "en": "Select an audio clip first."
    },
    {
      "key": "notification.audioCrossfade.audioOnly",
      "source": "Аудиокроссфейд применяется только к аудиодорожкам",
      "en": "Audio crossfades can only be applied to audio tracks."
    },
    {
      "key": "notification.audioCrossfade.previousClipMissing",
      "source": "На этой аудиодорожке нет предыдущего клипа",
      "en": "There is no previous clip on this audio track."
    },
    {
      "key": "notification.audioCrossfade.clipsMustBeAdjacent",
      "source": "Для аудиокроссфейда клипы должны стоять вплотную друг к другу без промежутка",
      "en": "Audio crossfade clips must be adjacent with no gap."
    },
    {
      "key": "notification.audioCrossfade.clipTooShort",
      "source": "Клипы слишком короткие для кроссфейда",
      "en": "Clips are too short for a crossfade."
    },
    {
      "key": "notification.audioCrossfade.overlapConflict",
      "source": "Нельзя создать кроссфейд: он перекроет ещё один аудиоклип",
      "en": "Cannot create the crossfade because it would overlap another audio clip."
    },
    {
      "key": "notification.audioTransition.removed",
      "source": "Аудиопереход удалён",
      "en": "Audio transition removed."
    },
    {
      "key": "notification.timeline.positionOccupied",
      "source": "Здесь уже есть клип",
      "en": "A clip already exists at this position."
    },
    {
      "key": "notification.clip.overlapConflict",
      "source": "Клип перекроет соседний",
      "en": "The clip would overlap a neighboring clip."
    },
    {
      "key": "notification.clip.trimWouldConflict",
      "source": "Новая точка входа приведёт к конфликту с соседним клипом",
      "en": "The new in-point would conflict with a neighboring clip."
    },
    {
      "key": "notification.project.created",
      "source": "Создан новый проект",
      "en": "New project created."
    },
    {
      "key": "notification.project.jsonSavedWithoutMedia",
      "source": "JSON-проект сохранён. Исходные медиа в этот файл не входят; для переноса проекта используйте «Сохранить проект с медиафайлами».",
      "en": "JSON project saved. Source media are not included. To move the project, use “Save Project with Media”."
    },
    {
      "key": "notification.project.opened",
      "source": "Проект открыт",
      "en": "Project opened."
    },
    {
      "key": "notification.media.alreadyLinked",
      "source": "Все медиафайлы уже подключены",
      "en": "All media files are already linked."
    },
    {
      "key": "notification.media.relinkMatchFailed",
      "source": "Не удалось сопоставить выбранные файлы с отсутствующими материалами",
      "en": "Could not match the selected files to the missing media items."
    },
    {
      "key": "notification.project.autoSaveUnavailable",
      "source": "Автосохранение недоступно в этом режиме. Сохраняйте проект вручную через Ctrl+S.",
      "en": "Auto-save is unavailable in this mode. Save the project manually with Ctrl+S."
    },
    {
      "key": "notification.project.autoSaveRestored",
      "source": "Автосохранение восстановлено",
      "en": "Auto-saved project restored."
    },
    {
      "key": "notification.export.alreadyRunning",
      "source": "Экспорт уже выполняется",
      "en": "An export is already in progress."
    },
    {
      "key": "notification.export.timelineEmpty",
      "source": "Таймлайн пуст — нечего экспортировать",
      "en": "The timeline is empty. Nothing to export."
    },
    {
      "key": "notification.export.waitForLocalMp4Conversion",
      "source": "Дождитесь завершения локальной конвертации MP4.",
      "en": "Wait for the local MP4 conversion to finish."
    },
    {
      "key": "notification.export.rangeStartEndRequired",
      "source": "Заполните время начала и конца экспорта",
      "en": "Enter the export start and end times."
    },
    {
      "key": "notification.export.rangeMinimumOneFrame",
      "source": "Выберите диапазон длиной хотя бы один кадр",
      "en": "Select a range that is at least one frame long."
    },
    {
      "key": "notification.export.formatUnavailable",
      "source": "Выбранный формат недоступен в этой среде",
      "en": "The selected format is not available in this environment."
    },
    {
      "key": "notification.export.mediaRecorderUnavailable",
      "source": "MediaRecorder недоступен для выбранного браузерного формата",
      "en": "MediaRecorder is unavailable for the selected browser format."
    },
    {
      "key": "notification.export.exactFpsRequiresElectron",
      "source": "Для точного FPS требуется настольная версия Electron с FFmpeg",
      "en": "Exact FPS requires the desktop Electron version with FFmpeg."
    },
    {
      "key": "notification.export.resolutionInvalid",
      "source": "Неверное разрешение",
      "en": "Invalid resolution."
    },
    {
      "key": "notification.export.renderGapsNotSaved",
      "source": "Экспорт завершён без сохранения: обнаружены пропуски интервалов рендеринга.",
      "en": "Export finished without saving: rendering intervals were missed."
    },
    {
      "key": "notification.export.cancelled",
      "source": "Экспорт отменён",
      "en": "Export cancelled."
    },
    {
      "key": "notification.export.ffmpegCancelNoSession",
      "source": "Не удалось отправить запрос отмены FFmpeg: отсутствует активная сессия.",
      "en": "Could not send the FFmpeg cancellation request: there is no active session."
    },
    {
      "key": "notification.export.ffmpegCancelCommandFailed",
      "source": "Не удалось отправить команду отмены FFmpeg.",
      "en": "Could not send the FFmpeg cancellation command."
    },
    {
      "key": "notification.clip.clipboardEmpty",
      "source": "Буфер клипов пуст. Сначала скопируйте клип.",
      "en": "The clip clipboard is empty. Copy a clip first."
    },
    {
      "key": "notification.clip.copySourceMissing",
      "source": "Исходный материал для копии не найден",
      "en": "The source media for this copy could not be found."
    },
    {
      "key": "notification.clip.pasteTrackUnknown",
      "source": "Не удалось определить дорожку для вставки",
      "en": "Could not determine a track for the paste operation."
    },
    {
      "key": "notification.clip.copyInPointOutsideSource",
      "source": "Точка входа копии находится за пределами источника",
      "en": "The copy’s source in-point is outside the source media."
    },
    {
      "key": "notification.clip.pasteMovedToNearestFreePosition",
      "source": "Место занято: клип вставлен в ближайшее свободное место",
      "en": "The position is occupied. The clip was inserted at the nearest available position."
    },
    {
      "key": "notification.project.diagnosticsNoIssues",
      "source": "Структурная проверка не обнаружила проблем",
      "en": "The structural check found no issues."
    },
    {
      "key": "notification.slideshow.photosRequired",
      "source": "Сначала импортируй фотографии или размести их на видеодорожке.",
      "en": "Import photos or place them on a video track first."
    },
    {
      "key": "notification.slideshow.musicRequired",
      "source": "Сначала импортируй музыку или добавь аудио на таймлайн.",
      "en": "Import music or add audio to the timeline first."
    },
    {
      "key": "notification.track.noUsableVideoTrack",
      "source": "Нет доступной видеодорожки: включи отображение и разблокируй хотя бы одну.",
      "en": "No video track is available. Show and unlock at least one video track."
    },
    {
      "key": "notification.track.noAudioTrack",
      "source": "Нет доступной аудиодорожки.",
      "en": "No audio track is available."
    },
    {
      "key": "notification.export.finishOrCancelFirst",
      "source": "Сначала дождись завершения или отмени экспорт видео.",
      "en": "Wait for the video export to finish or cancel it first."
    },
    {
      "key": "notification.history.nothingToUndo",
      "source": "Нечего отменять",
      "en": "Nothing to undo."
    },
    {
      "key": "notification.history.nothingToRedo",
      "source": "Нечего повторять",
      "en": "Nothing to redo."
    },
    {
      "key": "notification.guides.thirdsEnabled",
      "source": "Направляющие третей включены",
      "en": "Thirds guides enabled."
    },
    {
      "key": "notification.guides.safeAreaEnabled",
      "source": "Безопасные поля включены",
      "en": "Safe-area guides enabled."
    },
    {
      "key": "notification.guides.allEnabled",
      "source": "Направляющие и безопасные поля включены",
      "en": "Thirds and safe-area guides enabled."
    },
    {
      "key": "notification.guides.hidden",
      "source": "Направляющие скрыты",
      "en": "Guides hidden."
    },
    {
      "key": "notification.media.importedButTrackUnavailable",
      "source": "Файлы импортированы в медиатеку, но дорожка недоступна для монтажа.",
      "en": "Files were imported into the media library, but the track is unavailable for editing."
    },
    {
      "key": "notification.media.notLinked",
      "source": "Медиафайл не подключён",
      "en": "The media file is not linked."
    },
    {
      "key": "notification.media.addFailed",
      "source": "Не удалось добавить материал",
      "en": "Could not add the media item."
    },
    {
      "key": "notification.media.importToTimelineFailed",
      "source": "Не удалось импортировать файлы на таймлайн",
      "en": "Could not import the files to the timeline."
    },
    {
      "key": "notification.marker.alreadyAtPlayhead",
      "source": "На этой позиции уже есть маркер: {name}",
      "en": "A marker already exists at this position: {name}"
    },
    {
      "key": "notification.marker.created",
      "source": "Маркер добавлен: {name} · {timecode}",
      "en": "Marker added: {name} · {timecode}"
    },
    {
      "key": "notification.marker.nextMissing",
      "source": "Следующего маркера нет",
      "en": "There is no next marker."
    },
    {
      "key": "notification.marker.previousMissing",
      "source": "Предыдущего маркера нет",
      "en": "There is no previous marker."
    },
    {
      "key": "notification.audio.importedWavPrepared",
      "source": "Аудио «{name}»: предпрослушивание подготовлено в универсальный WAV через FFmpeg.",
      "en": "Audio “{name}”: preview audio was prepared as a standard WAV file with FFmpeg."
    },
    {
      "key": "notification.media.removedWithClipCount",
      "source": "Материал удалён. Вместе с ним удалено {countLabel}.",
      "en": "Media item removed along with {countLabel}."
    },
    {
      "key": "notification.track.locked",
      "source": "Дорожка {track} заблокирована",
      "en": "Track {track} is locked."
    },
    {
      "key": "notification.media.kindCannotBePlaced",
      "source": "«{kind}» нельзя разместить на дорожке {track}",
      "en": "{kind} media cannot be placed on track {track}."
    },
    {
      "key": "notification.media.videoAudioExtracted",
      "source": "Видео добавлено; звук отделён на дорожку {track}. Их можно двигать и обрезать отдельно.",
      "en": "Video added; its audio was detached to track {track}. You can move and trim them independently."
    },
    {
      "key": "notification.audio.detachedToTrack",
      "source": "Звук отделён на дорожку {track}. Теперь видео и звук редактируются независимо.",
      "en": "Audio was detached to track {track}. Video and audio can now be edited independently."
    },
    {
      "key": "notification.track.linkedPartnerLocked",
      "source": "Связанная дорожка {track} заблокирована. Разблокируй её или отмени привязку.",
      "en": "Linked track {track} is locked. Unlock it or unlink the pair."
    },
    {
      "key": "notification.clip.splitMinimumPiece",
      "source": "Разрез слишком близко к краю. Для каждого фрагмента нужно не менее {minimum} с.",
      "en": "The split is too close to the edge. Each segment must be at least {minimum} s long."
    },
    {
      "key": "notification.transition.applied",
      "source": "{label} · {side} · {duration} с",
      "en": "{label} · {side} · {duration} s"
    },
    {
      "key": "notification.transition.appliedDuration",
      "source": "{label} · {duration} с",
      "en": "{label} · {duration} s"
    },
    {
      "key": "notification.audio.crossfade.applied",
      "source": "Аудиокроссфейд · {duration} с",
      "en": "Audio crossfade · {duration} s"
    },
    {
      "key": "notification.project.portableSaveFailed",
      "source": "Не удалось упаковать проект: {error}",
      "en": "Could not package the project: {error}"
    },
    {
      "key": "notification.project.saveFailed",
      "source": "Не удалось сохранить проект: {error}",
      "en": "Could not save the project: {error}"
    },
    {
      "key": "notification.project.openFailed",
      "source": "Не удалось открыть проект: {error}",
      "en": "Could not open the project: {error}"
    },
    {
      "key": "notification.project.autosaveRestoredMissing",
      "source": "Автосохранение восстановлено. Подключите медиафайлы: {count}.",
      "en": "Auto-saved project restored. Relink {count} media files."
    },
    {
      "key": "notification.export.warning",
      "source": "Предупреждение экспорта: {reason}",
      "en": "Export warning: {reason}"
    },
    {
      "key": "notification.export.completed",
      "source": "Экспорт завершён: {file}",
      "en": "Export completed: {file}"
    },
    {
      "key": "notification.export.failed",
      "source": "Ошибка экспорта: {error}",
      "en": "Export failed: {error}"
    },
    {
      "key": "notification.export.completedFormat",
      "source": "Экспорт {format} завершён: {file}",
      "en": "{format} export completed: {file}"
    },
    {
      "key": "notification.export.ffmpegStopFailed",
      "source": "Не удалось остановить FFmpeg: {error}",
      "en": "Could not stop FFmpeg: {error}"
    },
    {
      "key": "notification.clip.copied",
      "source": "Клип скопирован: {name}",
      "en": "Clip copied: {name}"
    },
    {
      "key": "notification.clip.insertedOnTrack",
      "source": "Клип вставлен на {track}",
      "en": "Clip pasted on {track}."
    },
    {
      "key": "notification.project.diagnosticsSummary",
      "source": "Проверка завершена: ошибок {errors}, предупреждений {warnings}.",
      "en": "Check complete: {errors} errors, {warnings} warnings."
    },
    {
      "key": "notification.frame.saved",
      "source": "Кадр сохранён: {file} · {width}×{height}",
      "en": "Frame saved: {file} · {width}×{height}"
    },
    {
      "key": "notification.frame.saveFailed",
      "source": "{error}",
      "en": "{error}"
    },
    {
      "key": "notification.media.importedButTypeUnsupportedOnTrack",
      "source": "Файлы импортированы, но на дорожку {track} нельзя поместить этот тип медиа.",
      "en": "Files were imported, but this media type cannot be placed on track {track}."
    },
    {
      "key": "notification.media.addedWithSkipped",
      "source": "На дорожку добавлено {addedLabel}; неподходящие файлы: {skippedLabel}. Все файлы оставлены в медиатеке.",
      "en": "Added {addedLabel} to the track; unsupported files: {skippedLabel}. All files remain in the media library."
    },
    {
      "key": "notification.media.addedWithAudioWarnings",
      "source": "Предупреждений при отделении звука: {warnings}.",
      "en": "Audio detachment warnings: {warnings}."
    },
    {
      "key": "notification.media.addedToTrack",
      "source": "Добавлено на дорожку {track}: {countLabel}.",
      "en": "Added {countLabel} to track {track}."
    },
    {
      "key": "notification.snapping.enabled",
      "source": "Прилипание включено",
      "en": "Snapping enabled."
    },
    {
      "key": "notification.snapping.disabled",
      "source": "Прилипание отключено",
      "en": "Snapping disabled."
    },
    {
      "key": "notification.media.audioImportDetected",
      "source": "Аудио импортировано через FFmpeg, но предпрослушивание ограничено длительностью файла. Локальный экспорт всё равно использует нормализацию FFmpeg.",
      "en": "Audio was imported with FFmpeg. Preview is limited by the file duration, but local export will still use FFmpeg normalization."
    },
    {
      "key": "notification.media.audioImportNormalized",
      "source": "Аудио импортировано и нормализовано для предпрослушивания через FFmpeg.",
      "en": "Audio was imported and normalized for preview with FFmpeg."
    },
    {
      "key": "error.slideshow.photosRequired",
      "source": "Добавьте хотя бы одну фотографию.",
      "en": "Add at least one photo."
    },
    {
      "key": "error.slideshow.photoDurationTooShort",
      "source": "Длительность одной фотографии слишком мала.",
      "en": "The duration of a photo is too short."
    },
    {
      "key": "error.slideshow.audioDurationRequired",
      "source": "Укажи длительность музыки или участка больше нуля.",
      "en": "Enter a music or segment duration greater than zero."
    },
    {
      "key": "error.slideshow.segmentTooShort",
      "source": "Выбранный отрезок слишком короткий для такого количества фотографий. Увеличь длительность или уменьши количество фото.",
      "en": "The selected segment is too short for this many photos. Increase its duration or reduce the number of photos."
    },
    {
      "key": "error.slideshow.transitionSegmentTooShort",
      "source": "Слишком короткий участок для выбранных переходов.",
      "en": "The segment is too short for the selected transitions."
    },
    {
      "key": "error.slideshow.noPhotos",
      "source": "Нет доступных фотографий.",
      "en": "No photos are available."
    },
    {
      "key": "error.slideshow.mixedSources",
      "source": "Нельзя смешивать фотографии с таймлайна и из медиатеки в одной сборке.",
      "en": "Photos from the timeline and the media library cannot be mixed in one slideshow."
    },
    {
      "key": "error.slideshow.singleVideoTrack",
      "source": "Для сборки выбери фотографии с одной видеодорожки.",
      "en": "Choose photos from a single video track to create the slideshow."
    },
    {
      "key": "error.slideshow.sourceTrackUnavailable",
      "source": "Исходная видеодорожка больше недоступна.",
      "en": "The source video track is no longer available."
    },
    {
      "key": "error.slideshow.sourceChanged",
      "source": "Состав фотографий на исходной дорожке изменился. Открой сборщик слайд-шоу заново.",
      "en": "The photos on the source track have changed. Reopen the slideshow builder."
    },
    {
      "key": "error.slideshow.musicUnavailable",
      "source": "Выбранный музыкальный файл недоступен.",
      "en": "The selected music file is unavailable."
    },
    {
      "key": "error.slideshow.trackOccupied",
      "source": "На дорожке {track} уже есть клипы в участке {range}. Выбери другую видеодорожку или освободи участок.",
      "en": "Track {track} already contains clips in the range {range}. Choose another video track or clear that range."
    },
    {
      "key": "error.slideshow.audioTrackOccupied",
      "source": "На дорожке {track} уже есть звук в этом участке. Выбери другую аудиодорожку.",
      "en": "Track {track} already contains audio in this range. Choose another audio track."
    },
    {
      "key": "error.slideshow.musicPlacementFailed",
      "source": "Не удалось разместить музыку в указанной точке таймлайна.",
      "en": "Could not place the music at the specified timeline position."
    },
    {
      "key": "error.frame.decodeFailed",
      "source": "Не удалось декодировать текущий видеокадр для сохранения.",
      "en": "Could not decode the current video frame for saving."
    },
    {
      "key": "error.frame.decodeTimeout",
      "source": "Истекло время ожидания точного кадра видео. Попробуй перейти на соседний кадр и повторить сохранение.",
      "en": "Timed out while waiting for the exact video frame. Move to a neighboring frame and try saving again."
    },
    {
      "key": "error.frame.imagePrepareFailed",
      "source": "Не удалось подготовить изображение для сохранения кадра.",
      "en": "Could not prepare the image for frame capture."
    },
    {
      "key": "error.frame.compositionImageLoadFailed",
      "source": "Одно из изображений композиции не удалось загрузить. Проверь исходный файл.",
      "en": "One of the images in the composition could not be loaded. Check the source file."
    },
    {
      "key": "error.frame.invalidPixels",
      "source": "Загруженное изображение не содержит корректных пикселей.",
      "en": "The loaded image does not contain valid pixel data."
    },
    {
      "key": "error.frame.compositionLoadFailed",
      "source": "Не удалось загрузить изображение композиции для сохранения кадра.",
      "en": "Could not load the composition image for frame capture."
    },
    {
      "key": "error.frame.imageLoadTimeout",
      "source": "Истекло время ожидания загрузки изображения. Попробуй сохранить кадр ещё раз.",
      "en": "Timed out while loading the image. Try saving the frame again."
    },
    {
      "key": "error.frame.blobCreateFailed",
      "source": "Браузер не смог сформировать изображение кадра.",
      "en": "The browser could not create the frame image."
    },
    {
      "key": "error.frame.previewNotReady",
      "source": "Окно предпросмотра ещё не готово.",
      "en": "The preview window is not ready yet."
    },
    {
      "key": "error.frame.exportInProgress",
      "source": "Нельзя сохранять кадр во время экспорта видео.",
      "en": "A frame cannot be saved while video export is in progress."
    },
    {
      "key": "error.frame.canvasCreateFailed",
      "source": "Не удалось создать холст для сохранения кадра.",
      "en": "Could not create the canvas for frame capture."
    },
    {
      "key": "error.frame.emptyImage",
      "source": "Получено пустое изображение. Попробуй сохранить кадр ещё раз.",
      "en": "The captured image is empty. Try saving the frame again."
    },
    {
      "key": "error.project.invalidJsonObject",
      "source": "Файл повреждён или не является JSON-объектом",
      "en": "The file is damaged or is not a JSON object."
    },
    {
      "key": "error.project.invalidProjectFile",
      "source": "Это не файл проекта «Монтажная»",
      "en": "This is not a Montazhnaya project file."
    },
    {
      "key": "error.project.tracksMissing",
      "source": "Отсутствует список дорожек",
      "en": "The track list is missing."
    },
    {
      "key": "error.project.mediaMissing",
      "source": "Отсутствует список медиа",
      "en": "The media list is missing."
    },
    {
      "key": "notification.link.restoredWithOffset",
      "source": "Привязка восстановлена. Текущее смещение аудио сохранено; дальше клипы будут двигаться вместе.",
      "en": "The link was restored. The current audio offset was preserved; the clips will move together from now on."
    },
    {
      "key": "notification.link.restored",
      "source": "Привязка видео и аудио восстановлена. Теперь они будут двигаться вместе.",
      "en": "The video/audio link was restored. The clips will now move together."
    },
    {
      "key": "notification.clip.linkedPairDeleted",
      "source": "Связанные видео и аудио удалены вместе",
      "en": "The linked video and audio clips were deleted together."
    },
    {
      "key": "notification.clip.speedTooHighForShortSource",
      "source": "Невозможно ускорить клип: недостаточно исходного материала.",
      "en": "Cannot speed up the clip: there is not enough source media."
    },
    {
      "key": "notification.clip.speedWouldOverlap",
      "source": "Изменение скорости создаст пересечение с другим клипом на дорожке.",
      "en": "Changing the speed would overlap another clip on the track."
    },
    {
      "key": "notification.clip.deleted",
      "source": "Клип удалён",
      "en": "Clip deleted."
    },
    {
      "key": "notification.clip.linkedPairRippleDeleted",
      "source": "Связанные видео и аудио удалены; обе дорожки сдвинуты",
      "en": "The linked video and audio clips were deleted; both tracks were rippled."
    },
    {
      "key": "notification.clip.rippleDeleted",
      "source": "Ripple-удаление выполнено",
      "en": "Ripple delete completed."
    },
    {
      "key": "error.slideshow.createFailed",
      "source": "Не удалось создать слайд-шоу.",
      "en": "Could not create the slideshow."
    },
    {
      "key": "error.frame.saveFailedFallback",
      "source": "Не удалось сохранить кадр.",
      "en": "Could not save the frame."
    },
    {
      "key": "notification.slideshow.created",
      "source": "Слайд-шоу создано. Фотографий: {count}. Длительность: {duration}.",
      "en": "Slideshow created. Photos: {count}. Duration: {duration}."
    },
    {
      "key": "notification.slideshow.existingClipsRebuilt",
      "source": "Существующие клипы перестроены без дублирования.",
      "en": "Existing clips were rearranged without creating duplicates."
    },
    {
      "key": "notification.slideshow.durationRounded",
      "source": "Длина слайд-шоу округлена по частоте кадров проекта.",
      "en": "The slideshow duration was rounded to the project frame rate."
    },
    {
      "key": "notification.slideshow.videoLongerThanMusic",
      "source": "Видеоряд длиннее музыки на {duration}.",
      "en": "The video sequence is longer than the music by {duration}."
    },
    {
      "key": "notification.slideshow.musicLongerThanVideo",
      "source": "Музыка длиннее видеоряда на {duration}.",
      "en": "The music is longer than the video sequence by {duration}."
    },
    {
      "key": "dialog.autosave.recoveryTitle",
      "source": "Найдено автосохранение",
      "en": "Autosave Found"
    },
    {
      "key": "dialog.autosave.recoveryPrompt",
      "source": "Обнаружен несохранённый проект ({savedAt}): {clipCount}, {mediaCount}. Восстановить его?",
      "en": "An unsaved project was found ({savedAt}): {clipCount}, {mediaCount}. Restore it?"
    },
    {
      "key": "dialog.autosave.restore",
      "source": "Восстановить",
      "en": "Restore"
    },
    {
      "key": "status.timeline.tracks",
      "source": "Дорожки",
      "en": "Tracks",
      "translations": {
      "de": "Spuren",
      "fr": "Pistes",
      "es": "Pistas",
      "pt-BR": "Faixas",
      "it": "Tracce",
      "pl": "Ścieżki",
      "uk": "Доріжки",
      "tr": "Parçalar",
      "zh-CN": "轨道",
      "zh-TW": "軌道",
      "ja": "トラック",
      "ko": "트랙",
      "ar": "المسارات",
      "he": "רצועות",
      "hi": "ट्रैक",
      "nl": "Sporen",
      "sv": "Spår",
      "fi": "Raidat",
      "cs": "Stopy",
      "ro": "Piste",
      "el": "Κομμάτια",
      "vi": "Rãnh",
      "id": "Trek",
      "th": "แทร็ก",
      "kk": "Жолақтар",
      "uz": "Yo‘laklar",
      "ka": "ტრეკები",
      "hy": "Տրեքեր",
      "tk": "Ýodalar",
      "az": "Treklər",
      "ky": "Тректер",
      "tg": "Роҳҳо",
      "be": "Дарожкі",
      "uz-Cyrl": "Йўлаклар"
}
    },
    {
      "key": "tooltip.timeline.marker",
      "source": "Маркер",
      "en": "Marker"
    },
    {
      "key": "status.export.ready",
      "source": "Готов к экспорту",
      "en": "Ready to export"
    },
    {
      "key": "status.export.invalidRange",
      "source": "Укажите корректные границы экспорта.",
      "en": "Enter a valid export range."
    },
    {
      "key": "status.export.rangeTooShort",
      "source": "Конец экспорта должен быть позже начала минимум на один кадр.",
      "en": "The export end must be at least one frame after the start."
    },
    {
      "key": "status.export.mediaRecorderUnavailable",
      "source": "Для выбранного браузерного формата нужен MediaRecorder. Выберите локальный FFmpeg-формат в Electron.",
      "en": "The selected browser format requires MediaRecorder. Choose a local FFmpeg format in the Electron app."
    },
    {
      "key": "status.export.frameAccurateUnavailable",
      "source": "Локальный покадровый экспорт недоступен в этой среде.",
      "en": "Frame-accurate local export is unavailable in this environment."
    },
    {
      "key": "status.export.preflightErrors",
      "source": "Исправьте ошибки проекта перед экспортом ({count}).",
      "en": "Fix the project errors before exporting ({count})."
    },
    {
      "key": "status.export.preflightCancelled",
      "source": "Экспорт отменён пользователем после проверки проекта.",
      "en": "Export was cancelled after the project check."
    },
    {
      "key": "status.export.preparing",
      "source": "Подготовка…",
      "en": "Preparing…"
    },
    {
      "key": "status.export.decodingAudio",
      "source": "Декодирование аудио…",
      "en": "Decoding audio…"
    },
    {
      "key": "status.export.preparingVideo",
      "source": "Подготовка видеоклипов…",
      "en": "Preparing video clips…"
    },
    {
      "key": "status.export.preparingOfflineAudio",
      "source": "Подготовка звука вне реального времени…",
      "en": "Preparing audio offline…"
    },
    {
      "key": "status.export.configuringAudio",
      "source": "Настройка звука…",
      "en": "Configuring audio…"
    },
    {
      "key": "status.export.positioningFirstFrame",
      "source": "Позиционирование первого кадра…",
      "en": "Positioning the first frame…"
    },
    {
      "key": "status.export.finalizing",
      "source": "Финализация…",
      "en": "Finalizing…"
    },
    {
      "key": "status.export.outputNotSaved",
      "source": "Результат не сохранён. Уменьшите разрешение или FPS и повторите экспорт.",
      "en": "The output was not saved. Reduce the resolution or frame rate and try again."
    },
    {
      "key": "status.export.cancelled",
      "source": "Отменено",
      "en": "Cancelled"
    },
    {
      "key": "status.export.failed",
      "source": "Ошибка: {error}",
      "en": "Error: {error}"
    },
    {
      "key": "status.export.registeringSource",
      "source": "Регистрация источника для оконного декодирования… {current} / {total} · кадров в плане {frames}",
      "en": "Registering source for windowed decoding… {current} / {total} · {frames} planned frames"
    },
    {
      "key": "status.export.sourcesPrepared",
      "source": "Исходные кадры подготовлены: {count} видеоисточников.",
      "en": "Source frames prepared: {count} video sources."
    },
    {
      "key": "status.export.choosePath",
      "source": "Выберите путь для {format}…",
      "en": "Choose a destination for {format}…"
    },
    {
      "key": "status.export.encodingProgress",
      "source": "Кодирование {format} через FFmpeg… {current} / {duration} s · {percent}%",
      "en": "Encoding {format} with FFmpeg… {current} / {duration} s · {percent}%"
    },
    {
      "key": "status.export.verifying",
      "source": "Кодирование завершено. Проверка готового {format}…",
      "en": "Encoding complete. Verifying the {format} output…"
    },
    {
      "key": "status.export.streamingFrames",
      "source": "Потоковая передача кадров {format} в FFmpeg… {current} / {total} · {time} s · render {renderMs} ms",
      "en": "Streaming {format} frames to FFmpeg… {current} / {total} · {time} s · render {renderMs} ms"
    },
    {
      "key": "status.export.finalizingStream",
      "source": "Завершение потока кадров и финализация {format}…",
      "en": "Finishing the frame stream and finalizing {format}…"
    },
    {
      "key": "status.export.sendingCancel",
      "source": "Отправка команды отмены FFmpeg…",
      "en": "Sending the cancellation request to FFmpeg…"
    },
    {
      "key": "status.export.stoppingFfmpeg",
      "source": "Остановка FFmpeg и очистка временных файлов…",
      "en": "Stopping FFmpeg and cleaning up temporary files…"
    },
    {
      "key": "status.export.cancelProgress",
      "source": "Отмена…",
      "en": "Cancelling…"
    },
    {
      "key": "status.export.decodingVideo",
      "source": "Декодирование видео {current} / {total}…",
      "en": "Decoding video {current} / {total}…"
    },
    {
      "key": "status.export.offlineAudioMix",
      "source": "Сведение звука без реального времени…",
      "en": "Mixing audio offline…"
    },
    {
      "key": "status.export.recordingProgress",
      "source": "Запись… кадр {current} / {total} · {time} s · render up to {renderMs} ms",
      "en": "Recording… frame {current} / {total} · {time} s · render up to {renderMs} ms"
    },
    {
      "key": "status.export.browserFpsVariable",
      "source": "FPS зависит от браузерного захвата",
      "en": "Frame rate depends on browser capture"
    },
    {
      "key": "status.export.cfrUnconfirmed",
      "source": "CFR не подтверждён",
      "en": "CFR not verified"
    },
    {
      "key": "status.export.renderStats",
      "source": "Отрисовка макс. {renderMs} мс · отклонение часов исходника макс. {driftMs} мс",
      "en": "Max render time: {renderMs} ms · max source-clock drift: {driftMs} ms"
    },
    {
      "key": "status.export.droppedFrames",
      "source": "Принято с предупреждением о пропусках: {count}",
      "en": "Accepted with a dropped-frame warning: {count}"
    },
    {
      "key": "status.export.audioEngineUnavailable",
      "source": "Аудиодвижок недоступен; в результат может не попасть звук.",
      "en": "The audio engine is unavailable; the output may not contain audio."
    },
    {
      "key": "status.export.offlineAudioFailed",
      "source": "Не удалось свести звук офлайн: {error}",
      "en": "Offline audio mixing failed: {error}"
    },
    {
      "key": "status.export.audioDecodeFailed",
      "source": "Не удалось декодировать аудио: {files}",
      "en": "Could not decode audio: {files}"
    },
    {
      "key": "profile.custom",
      "source": "Пользовательский",
      "en": "Custom"
    },
    {
      "key": "slideshow.order.timeline",
      "source": "Как расположены на дорожке",
      "en": "Timeline order"
    },
    {
      "key": "slideshow.order.mediaLibrary",
      "source": "Как загружены в медиатеку",
      "en": "Media library order"
    },
    {
      "key": "dialog.frame.save.preparing",
      "source": "Подготовка кадра…",
      "en": "Preparing frame…"
    },
    {
      "key": "dialog.frame.save.save",
      "source": "Сохранить кадр…",
      "en": "Save frame…"
    },
    {
      "key": "status.export.completeSummary",
      "source": "Готово: {file} ({size}; {frames} кадров; {fps} FPS; {duration} с; всего {elapsed} с)",
      "en": "Done: {file} ({size}; {frames} frames; {fps} FPS; {duration} s; {elapsed} s)"
    },
    {
      "key": "status.export.profileSummary",
      "source": "Профиль экспорта: цель {targetBitrate} Мбит/с, факт {actualBitrate}; кадры {transport}; кодировщик {encoder}. Этапы: план источников {sourcePlan} с; чтение/декодирование {sourceRead} с; композиция {composition} с; подготовка кадров {framePrepare} с; передача FFmpeg {pipeWrite} с; перекрытие чтения {prefetch} с; процесс FFmpeg {ffmpegProcess} с; финализация {finalize} с.",
      "en": "Export profile: target {targetBitrate} Mbps, actual {actualBitrate}; frame transport {transport}; encoder {encoder}. Phases: source planning {sourcePlan} s; read/decode {sourceRead} s; composition {composition} s; frame preparation {framePrepare} s; FFmpeg transfer {pipeWrite} s; read-ahead overlap {prefetch} s; FFmpeg process {ffmpegProcess} s; finalization {finalize} s."
    },
    {
      "key": "dialog.export.closeRunning.title",
      "source": "Экспорт ещё не завершён",
      "en": "Export Is Still Running"
    },
    {
      "key": "dialog.export.closeRunning.body",
      "source": "Текущий экспорт ещё выполняется. Прервать его?",
      "en": "The current export is still running. Cancel it?"
    },
    {
      "key": "dialog.export.closeRunning.cancel",
      "source": "Прервать экспорт",
      "en": "Cancel Export"
    },
    {
      "key": "dialog.export.preflightErrors.title",
      "source": "Экспорт остановлен",
      "en": "Export Stopped"
    },
    {
      "key": "dialog.export.preflightErrors.ok",
      "source": "Понятно",
      "en": "Got It"
    },
    {
      "key": "dialog.export.preflightWarnings.title",
      "source": "Проверка перед экспортом",
      "en": "Pre-export Check"
    },
    {
      "key": "dialog.export.preflightWarnings.heading",
      "source": "Перед экспортом обнаружены замечания:",
      "en": "The following issues were found before export:"
    },
    {
      "key": "dialog.export.preflightWarnings.more",
      "source": "…и ещё {count} замечаний.",
      "en": "…and {count} more item(s)."
    },
    {
      "key": "dialog.export.preflightWarnings.question",
      "source": "Продолжить экспорт с этими ограничениями?",
      "en": "Continue exporting with these limitations?"
    },
    {
      "key": "dialog.export.preflightWarnings.continue",
      "source": "Продолжить экспорт",
      "en": "Continue Export"
    },
    {
      "key": "dialog.export.audioFallback.title",
      "source": "Не удалось гарантировать звук",
      "en": "Audio Cannot Be Guaranteed"
    },
    {
      "key": "dialog.export.audioFallback.lead",
      "source": "Подготовка аудио выявила проблему: {reason}.",
      "en": "Audio preparation reported a problem: {reason}."
    },
    {
      "key": "dialog.export.audioFallback.risk",
      "source": "Если продолжить, итоговый файл может оказаться без части звука или вообще без аудио. Рекомендуется отменить экспорт и проверить форматы исходников.",
      "en": "If you continue, the output may be missing some or all audio. We recommend cancelling the export and checking the source formats."
    },
    {
      "key": "dialog.export.audioFallback.question",
      "source": "Продолжить экспорт с этим риском?",
      "en": "Continue exporting with this risk?"
    },
    {
      "key": "dialog.export.audioFallback.continue",
      "source": "Продолжить без гарантии звука",
      "en": "Continue Without Guaranteed Audio"
    },
    {
      "key": "dialog.export.droppedFrames.title",
      "source": "Проверка захвата обнаружила пропуски",
      "en": "Capture Check Detected Dropped Frames"
    },
    {
      "key": "dialog.export.droppedFrames.body",
      "source": "Цикл рендеринга пропустил {dropped} интервалов из {planned} ({percent}%). Максимальное время отрисовки кадра: {renderMs} мс; максимальное отклонение часов исходного видео: {driftMs} мс. Рекомендуется повторить экспорт с меньшим разрешением или 24/25 FPS. Скачать результат всё равно?",
      "en": "The render loop missed {dropped} of {planned} intervals ({percent}%). Maximum frame render time: {renderMs} ms; maximum source-video clock drift: {driftMs} ms. We recommend exporting again at a lower resolution or 24/25 FPS. Download the result anyway?"
    },
    {
      "key": "dialog.export.droppedFrames.download",
      "source": "Скачать всё равно",
      "en": "Download Anyway"
    },
    {
      "key": "dialog.export.frameSequenceWarning",
      "source": "<b>{format} через локальный FFmpeg</b> Экспорт выполняется покадрово по целочисленной временной сетке выбранного FPS. Для MP4 до 32 МиБ на кадр используется несжатый RGBA rawvideo: PNG-сжатие Chromium и PNG-декодирование FFmpeg исключены; кадры передаются через ограниченный IPC и backpressure. Для очень больших кадров и WebM сохраняется PNG image2pipe. H.264 автоматически проверяет NVENC, AMF и QSV коротким контрольным кодированием; при недоступности всех аппаратных вариантов используется libx264 на CPU. Realtime MediaRecorder не используется. Полная выходная последовательность на диск не записывается: кадры передаются потоком, а дисковый LRU-кэш ограничен 512 МиБ. Старые кадры автоматически освобождаются по мере необходимости. {codecs}. Целевой средний видеобитрейт: {bitrateMbps} Мбит/с; кратковременный VBV-пик ограничен примерно 125% цели. Цвет преобразуется из RGB/sRGB в BT.709 limited-range. Для WebM временная сетка кадров точная; временные метки контейнера имеют шаг его собственной шкалы времени.",
      "en": "<b>{format} via local FFmpeg</b> Export renders frames on the selected FPS integer time grid. For MP4 frames up to 32 MiB, uncompressed RGBA rawvideo is used, avoiding Chromium PNG compression and FFmpeg PNG decoding. Frames are sent through bounded IPC with backpressure. PNG image2pipe is retained for very large frames and WebM. H.264 checks NVENC, AMF and QSV with a short test encode; libx264 on CPU is used if no hardware option is available. Realtime MediaRecorder is not used. The full output sequence is not written to disk: frames are streamed and the disk LRU cache is limited to 512 MiB. Old frames are released automatically as needed. {codecs}. Target average video bitrate: {bitrateMbps} Mbps; short VBV peaks are limited to about 125% of the target. Color is converted from RGB/sRGB to BT.709 limited range. WebM uses an exact frame grid; container timestamps follow its own time base."
    },
    {
      "key": "dialog.export.realtimeWarning",
      "source": "<b>Браузерная запись в реальном времени</b> MediaRecorder зависит от загрузки системы и цикла отрисовки. Кадры могут пропускаться, а постоянная частота кадров не гарантируется. Для строгого покадрового экспорта выберите формат локального FFmpeg, если он доступен.",
      "en": "<b>Real-time browser recording</b> MediaRecorder depends on system load and the rendering loop. Frames may be dropped, and a constant frame rate is not guaranteed. For frame-accurate export, choose a local FFmpeg format when available."
    },
    {
      "key": "dialog.media.clearAll.title",
      "source": "Удалить все материалы?",
      "en": "Remove All Media?"
    },
    {
      "key": "dialog.media.clearAll.body",
      "source": "Все клипы на таймлайне также будут удалены. Действие можно отменить через Ctrl+Z.",
      "en": "All clips on the timeline will also be removed. You can undo this action with Ctrl+Z."
    },
    {
      "key": "dialog.media.clearAll.confirm",
      "source": "Удалить",
      "en": "Remove"
    },
    {
      "key": "dialog.timeline.clear.title",
      "source": "Очистить таймлайн?",
      "en": "Clear Timeline?"
    },
    {
      "key": "dialog.timeline.clear.body",
      "source": "Все клипы с таймлайна будут удалены. Материалы останутся в библиотеке.",
      "en": "All timeline clips will be removed. Media items will remain in the library."
    },
    {
      "key": "dialog.timeline.clear.confirm",
      "source": "Очистить",
      "en": "Clear"
    },
    {
      "key": "dialog.project.unsavedChanges.title",
      "source": "Несохранённые изменения",
      "en": "Unsaved Changes"
    },
    {
      "key": "dialog.project.unsavedChanges.body",
      "source": "В текущем проекте есть несохранённые изменения ({reason}). Продолжить и потерять их?",
      "en": "The current project has unsaved changes ({reason}). Continue and discard them?"
    },
    {
      "key": "dialog.project.diagnostics.title",
      "source": "Проверка проекта",
      "en": "Project Diagnostics"
    },
    {
      "key": "dialog.project.diagnostics.mediaCount",
      "source": "Материалов: {count}",
      "en": "Media items: {count}"
    },
    {
      "key": "dialog.project.diagnostics.clipCount",
      "source": "Клипов: {count}",
      "en": "Clips: {count}"
    },
    {
      "key": "dialog.project.diagnostics.markerCount",
      "source": "Маркеров: {count}",
      "en": "Markers: {count}"
    },
    {
      "key": "dialog.project.diagnostics.duration",
      "source": "Длительность: {duration}",
      "en": "Duration: {duration}"
    },
    {
      "key": "dialog.project.diagnostics.errors",
      "source": "Ошибки: {count}",
      "en": "Errors: {count}"
    },
    {
      "key": "dialog.project.diagnostics.warnings",
      "source": "Предупреждения: {count}",
      "en": "Warnings: {count}"
    },
    {
      "key": "dialog.project.diagnostics.truncated",
      "source": "Часть сообщений сокращена. Исправления не вносились автоматически.",
      "en": "Some messages were omitted. No fixes were applied automatically."
    },
    {
      "key": "error.ipc.untrustedRequest",
      "source": "Запрос отклонён: источник не является доверенным окном редактора.",
      "en": "The request was rejected because it did not originate from the trusted editor window."
    },
    {
      "key": "error.locale.syncFailed",
      "source": "Не удалось применить язык интерфейса в главном процессе. Перезапустите редактор и повторите попытку.",
      "en": "The main process could not apply the selected interface language. Restart the editor and try again."
    },
    {
      "key": "error.operation.failed",
      "source": "Операцию не удалось выполнить. Повторите попытку.",
      "en": "The operation could not be completed. Please try again."
    },
    {
      "key": "error.media.stageFailed",
      "source": "Не удалось подготовить или передать временный медиафайл. Повторно выберите исходный файл и попробуйте ещё раз.",
      "en": "The temporary media file could not be prepared or transferred. Select the source file again and try once more."
    },
    {
      "key": "error.media.inspectFailed",
      "source": "Не удалось проверить этот медиафайл. Убедитесь, что файл не повреждён и поддерживается редактором.",
      "en": "The media file could not be inspected. Make sure it is not damaged and is supported by the editor."
    },
    {
      "key": "error.media.invalidFile",
      "source": "Исходный файл пуст, недоступен или имеет неподдерживаемый формат. Выберите файл повторно.",
      "en": "The source file is empty, unavailable, or uses an unsupported format. Select the file again."
    },
    {
      "key": "error.media.probeFailed",
      "source": "Не удалось прочитать технические сведения о медиафайле.",
      "en": "The technical information for this media file could not be read."
    },
    {
      "key": "error.export.capabilitiesFailed",
      "source": "Не удалось определить доступные форматы и кодеки экспорта. Проверьте установку FFmpeg.",
      "en": "The available export formats and codecs could not be detected. Check the FFmpeg installation."
    },
    {
      "key": "error.export.beginFailed",
      "source": "Не удалось подготовить экспорт. Проверьте параметры проекта и свободное место на диске.",
      "en": "The export could not be prepared. Check the project settings and available disk space."
    },
    {
      "key": "error.export.writeFrameFailed",
      "source": "Не удалось записать кадр в последовательность экспорта. Повторите экспорт.",
      "en": "A frame could not be written to the export sequence. Try exporting again."
    },
    {
      "key": "error.export.startFailed",
      "source": "Не удалось запустить потоковое кодирование. Проверьте установку FFmpeg и параметры экспорта.",
      "en": "Stream encoding could not be started. Check the FFmpeg installation and export settings."
    },
    {
      "key": "error.export.prepareSourceFramesFailed",
      "source": "Не удалось подготовить исходные кадры для экспорта. Проверьте исходное видео и повторите попытку.",
      "en": "The source frames could not be prepared for export. Check the source video and try again."
    },
    {
      "key": "error.export.readSourceFrameFailed",
      "source": "Не удалось прочитать подготовленный исходный кадр. Повторите экспорт.",
      "en": "The prepared source frame could not be read. Try exporting again."
    },
    {
      "key": "error.export.finishFailed",
      "source": "Не удалось завершить экспорт или проверить готовый видеофайл.",
      "en": "The export could not be finalized or the resulting video could not be verified."
    },
    {
      "key": "error.export.cancelFailed",
      "source": "Не удалось корректно отменить экспорт. Перезапустите редактор, если процесс не остановился.",
      "en": "The export could not be cancelled cleanly. Restart the editor if the process does not stop."
    },
    {
      "key": "error.audio.extractFailed",
      "source": "Не удалось извлечь звуковую дорожку из видео. Проверьте исходный файл и наличие аудиодорожки.",
      "en": "The audio track could not be extracted from the video. Check the source file and make sure it contains an audio track."
    },
    {
      "key": "error.audio.inspectFailed",
      "source": "Не удалось проанализировать аудиофайл. Проверьте, что файл доступен и не повреждён.",
      "en": "The audio file could not be analyzed. Make sure it is available and not damaged."
    },
    {
      "key": "error.audio.prepareFailed",
      "source": "Не удалось подготовить аудио для монтажа или экспорта. Проверьте исходный файл и повторите попытку.",
      "en": "The audio could not be prepared for editing or export. Check the source file and try again."
    },
    {
      "key": "error.frame.saveFailed",
      "source": "Не удалось сохранить текущий кадр. Проверьте папку назначения и свободное место.",
      "en": "The current frame could not be saved. Check the destination folder and available disk space."
    },
    {
      "key": "error.diagnostics.failed",
      "source": "Не удалось выполнить диагностику инструментов. Проверьте установку FFmpeg и ffprobe.",
      "en": "Tool diagnostics could not be completed. Check the FFmpeg and ffprobe installation."
    },
    {
      "key": "error.storage.insufficientSpace",
      "source": "Недостаточно свободного места на диске для выполнения операции. Освободите место или уменьшите разрешение и длительность экспорта.",
      "en": "There is not enough free disk space to complete this operation. Free up space or reduce the export resolution and duration."
    },
    {
      "key": "error.tool.ffmpegMissing",
      "source": "FFmpeg не найден. Добавьте его в PATH или укажите путь в FFMPEG_PATH, затем перезапустите редактор.",
      "en": "FFmpeg was not found. Add it to PATH or set FFMPEG_PATH, then restart the editor."
    },
    {
      "key": "error.tool.ffprobeMissing",
      "source": "ffprobe не найден. Установите FFmpeg с ffprobe, добавьте его в PATH и перезапустите редактор.",
      "en": "ffprobe was not found. Install FFmpeg with ffprobe, add it to PATH, and restart the editor."
    },
    {
      "key": "error.tool.notFound",
      "source": "Не удалось найти необходимую системную программу: {tool}. Проверьте PATH и настройки редактора.",
      "en": "The required system tool could not be found: {tool}. Check PATH and the editor settings."
    },
    {
      "key": "error.process.timeout",
      "source": "Системная программа не завершила операцию за отведённое время. Попробуйте ещё раз с меньшим объёмом материала.",
      "en": "The system tool did not finish within the allowed time. Try again with a smaller workload."
    },
    {
      "key": "error.process.permissionDenied",
      "source": "Недостаточно прав для запуска системной программы или записи файла. Проверьте разрешения Windows.",
      "en": "There is not enough permission to run the system tool or write the file. Check Windows permissions."
    },
    {
      "key": "error.export.validationFailed",
      "source": "Проверка готового видео не пройдена. Проверьте кодек, разрешение, частоту кадров и параметры звука.",
      "en": "The resulting video did not pass validation. Check the codec, resolution, frame rate, and audio settings."
    },
    {
      "key": "error.export.sessionInvalid",
      "source": "Сессия экспорта недействительна или уже завершена. Запустите экспорт заново.",
      "en": "The export session is invalid or has already ended. Start the export again."
    },
    {
      "key": "error.export.busy",
      "source": "Другой экспорт уже выполняется. Дождитесь его завершения или отмените его перед запуском нового.",
      "en": "Another export is already in progress. Wait for it to finish or cancel it before starting a new one."
    },
    {
      "key": "error.audio.trackMissing",
      "source": "В исходном видео или аудиофайле не найдена звуковая дорожка.",
      "en": "No audio track was found in the source video or audio file."
    },
  ];
  const bySource = new Map();
  const compiled = [];
  const tokenPattern = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;
  function compileTemplate(entry) {
    let cursor = 0, source = "^", names = [], match;
    while ((match = tokenPattern.exec(entry.source))) {
      source += entry.source.slice(cursor, match.index).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(.+?)";
      names.push(match[1]); cursor = match.index + match[0].length;
    }
    source += entry.source.slice(cursor).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$";
    tokenPattern.lastIndex = 0;
    return { key: entry.key, names, regex: new RegExp(source, "u") };
  }
  for (const entry of entries) {
    bySource.set(entry.source, entry.key);
    if (entry.source.includes("{")) compiled.push(compileTemplate(entry));
  }
  function augmentLocale(code) {
    const target = catalog[code];
    if (!target || !target.messages) return { translated: 0, total: entries.length };
    const pack = packs[code];
    let translated = 0;
    const keyedTranslations = root.MontazhnayaIpcErrorTranslations && root.MontazhnayaIpcErrorTranslations[code];
    for (const entry of entries) {
      let value;
      if (code === "ru") value = entry.source;
      else if (code === "en") value = entry.en;
      else if (entry.translations && Object.prototype.hasOwnProperty.call(entry.translations, code)) value = entry.translations[code];
      else if (keyedTranslations && Object.prototype.hasOwnProperty.call(keyedTranslations, entry.key)) value = keyedTranslations[entry.key];
      else if (pack && pack.messages && Object.prototype.hasOwnProperty.call(pack.messages, entry.source)) value = pack.messages[entry.source];
      if (typeof value === "string" && value.trim()) {
        target.messages[entry.key] = value;
        translated++;
      }
    }
    return { translated, total: entries.length };
  }
  // Russian and English packs are already registered by index.html. Other
  // language packs are loaded lazily; i18n.js calls augmentLocale after load.
  augmentLocale("ru");
  augmentLocale("en");
  function resolve(message) {
    if (typeof message !== "string") return null;
    const exactKey = bySource.get(message);
    if (exactKey) return { key: exactKey, values: Object.create(null) };
    for (const item of compiled) {
      const match = item.regex.exec(message);
      if (!match) continue;
      const values = Object.create(null);
      item.names.forEach((name, index) => {
        let value = match[index + 1];
        if (["count", "added", "skipped", "warnings", "errors", "restored", "total", "duration", "minimum", "width", "height", "fps"].includes(name)) {
          const number = Number(String(value).replace(",", "."));
          if (Number.isFinite(number)) value = number;
        }
        if (name === "side") value = value === "вход" ? "in" : value === "выход" ? "out" : value;
        values[name] = value;
      });
      return { key: item.key, values };
    }
    return null;
  }
  function coverage(locale) {
    const messages = catalog[locale] && catalog[locale].messages || {};
    const translated = entries.filter(entry => Object.prototype.hasOwnProperty.call(messages, entry.key)).length;
    return { total: entries.length, translated, englishFallback: entries.length - translated };
  }
  root.MontazhnayaNotificationCatalog = Object.freeze({ entries: Object.freeze(entries), resolve, coverage, augmentLocale });
})(window);
