(function (root) {
  "use strict";
  const catalog = {
  "ru": {
    "mediaFile": {
      "one": "медиафайл",
      "few": "медиафайла",
      "many": "медиафайлов",
      "other": "медиафайла"
    },
    "clip": {
      "one": "клип",
      "few": "клипа",
      "many": "клипов",
      "other": "клипа"
    },
    "frame": {
      "one": "кадр",
      "few": "кадра",
      "many": "кадров",
      "other": "кадра"
    },
    "genitive": {
      "mediaFile": {
        "one": "файла",
        "few": "файлов",
        "many": "файлов",
        "other": "файла"
      },
      "clip": {
        "one": "клипа",
        "few": "клипов",
        "many": "клипов",
        "other": "клипа"
      },
      "frame": {
        "one": "кадра",
        "few": "кадров",
        "many": "кадров",
        "other": "кадра"
      }
    },
    "messages": {
      "status.media.imported": "Импортировано: {countLabel}.",
      "status.media.missing": "Отсутствуют: {countLabel}.",
      "status.media.relinked": "Восстановлено файлов: {restored} из {total}.",
      "status.project.portable.saved": "Портативный проект сохранён: {countLabel}, {size}. Видео и аудио включены.",
      "status.project.portable.opened": "Портативный проект открыт. Подключено: {countLabel}.",
      "status.project.portable.missing": "Портативный проект открыт, но отсутствуют: {countLabel}.",
      "status.project.json.missing": "JSON-проект открыт. Не подключено: {countLabel}. Используйте портативный пакет или восстановите файлы.",
      "tour.step.progress": "Шаг {current} из {total}",
      "export.range.progress": "Экспорт фрагмента {start}–{end} с…",
      "status.media.arranged": "Расставлено по нумерации: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Нажмите «Подключить файлы», чтобы восстановить связи.",
      "profile.project.summary": "Проект: {width} × {height} пикселей, {aspect}, {fps} кадр/с.",
      "status.export.completed": "Готово: {file} ({size}; фрагмент {start}–{end} с).",
      "slideshow.photos.heading": "Фотографии ({count})",
      "status.clip.nudged": "Клип сдвинут на {countLabel} {direction}.",
      "status.media.import.failed": "Не удалось импортировать «{file}»: {error}",
      "dialog.frame.save.title": "Сохранить текущий кадр",
      "dialog.frame.filter.png": "Изображение PNG",
      "dialog.frame.filter.jpeg": "Изображение JPEG",
      "clip.speed.label": "Скорость",
      "clip.speed.tooltip": "Скорость воспроизведения выбранного видеоклипа"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "файла",
          "few": "файлов",
          "many": "файлов",
          "other": "файла"
        },
        "clip": {
          "one": "клипа",
          "few": "клипов",
          "many": "клипов",
          "other": "клипа"
        },
        "frame": {
          "one": "кадра",
          "few": "кадров",
          "many": "кадров",
          "other": "кадра"
        }
      }
    }
  },
  "en": {
    "mediaFile": {
      "one": "media file",
      "other": "media files"
    },
    "clip": {
      "one": "clip",
      "other": "clips"
    },
    "frame": {
      "one": "frame",
      "other": "frames"
    },
    "genitive": {
      "mediaFile": {
        "one": "media file",
        "other": "media files"
      },
      "clip": {
        "one": "clip",
        "other": "clips"
      },
      "frame": {
        "one": "frame",
        "other": "frames"
      }
    },
    "messages": {
      "status.media.imported": "Imported: {countLabel}.",
      "status.media.missing": "Missing: {countLabel}.",
      "status.media.relinked": "Media files restored: {restored} of {total}.",
      "status.project.portable.saved": "Portable project saved: {countLabel}, {size}. Video and audio are included.",
      "status.project.portable.opened": "Portable project opened. Connected: {countLabel}.",
      "status.project.portable.missing": "Portable project opened, but these files are missing: {countLabel}.",
      "status.project.json.missing": "JSON project opened. Not linked: {countLabel}. Use a portable package or relink the files.",
      "tour.step.progress": "Step {current} of {total}",
      "export.range.progress": "Exporting segment {start}–{end} s…",
      "status.media.arranged": "Arranged by filename sequence: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Select “Relink Files” to restore the media links.",
      "profile.project.summary": "Project: {width} × {height} pixels, {aspect}, {fps} fps.",
      "status.export.completed": "Done: {file} ({size}; range {start}–{end} s).",
      "slideshow.photos.heading": "Photos ({count})",
      "status.clip.nudged": "Clip moved {countLabel} {direction}.",
      "status.media.import.failed": "Could not import “{file}”: {error}",
      "dialog.frame.save.title": "Save Current Frame",
      "dialog.frame.filter.png": "PNG Image",
      "dialog.frame.filter.jpeg": "JPEG Image",
      "clip.speed.label": "Speed",
      "clip.speed.tooltip": "Playback speed of the selected video clip"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "media file",
          "other": "media files"
        },
        "clip": {
          "one": "clip",
          "other": "clips"
        },
        "frame": {
          "one": "frame",
          "other": "frames"
        }
      }
    }
  },
  "de": {
    "mediaFile": {
      "one": "Mediendatei",
      "other": "Mediendateien"
    },
    "clip": {
      "one": "Clip",
      "other": "Clips"
    },
    "frame": {
      "one": "Frame",
      "other": "Frames"
    },
    "messages": {
      "status.media.imported": "Importiert: {countLabel}.",
      "status.media.missing": "Fehlend: {countLabel}.",
      "status.media.relinked": "Wiederhergestellte Mediendateien: {restored} von {total}.",
      "status.project.portable.saved": "Portables Projekt gespeichert: {countLabel}, {size}. Video und Audio sind enthalten.",
      "status.project.portable.opened": "Portables Projekt geöffnet. Verbunden: {countLabel}.",
      "status.project.portable.missing": "Portables Projekt geöffnet, aber diese Dateien fehlen: {countLabel}.",
      "status.project.json.missing": "JSON-Projekt geöffnet. Nicht verknüpft: {countLabel}. Verwenden Sie ein portables Paket oder verknüpfen Sie die Dateien erneut.",
      "tour.step.progress": "Schritt {current} von {total}",
      "export.range.progress": "Exportiere Bereich {start}–{end} s…",
      "status.media.arranged": "Nach Dateinummerierung angeordnet: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Wähle „Dateien neu verknüpfen“, um die Medienverknüpfungen wiederherzustellen.",
      "profile.project.summary": "Projekt: {width} × {height} Pixel, {aspect}, {fps} fps.",
      "status.export.completed": "Fertig: {file} ({size}; Bereich {start}–{end} s).",
      "slideshow.photos.heading": "Fotos ({count})",
      "status.clip.nudged": "Clip um {countLabel} {direction} verschoben.",
      "status.media.import.failed": "„{file}“ konnte nicht importiert werden: {error}",
      "dialog.frame.save.title": "Aktuelles Einzelbild speichern",
      "dialog.frame.filter.png": "PNG-Bild",
      "dialog.frame.filter.jpeg": "JPEG-Bild",
      "clip.speed.label": "Geschwindigkeit",
      "clip.speed.tooltip": "Wiedergabegeschwindigkeit des ausgewählten Videoclips"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "fr": {
    "mediaFile": {
      "one": "fichier média",
      "other": "fichiers média",
      "many": "fichiers média"
    },
    "clip": {
      "one": "clip",
      "other": "clips",
      "many": "clips"
    },
    "frame": {
      "one": "image",
      "other": "images",
      "many": "images"
    },
    "messages": {
      "status.media.imported": "Importés : {countLabel}.",
      "status.media.missing": "Manquants : {countLabel}.",
      "status.media.relinked": "Fichiers média restaurés : {restored} sur {total}.",
      "status.project.portable.saved": "Projet portable enregistré : {countLabel}, {size}. La vidéo et l’audio sont inclus.",
      "status.project.portable.opened": "Projet portable ouvert. Éléments reliés : {countLabel}.",
      "status.project.portable.missing": "Projet portable ouvert, mais les fichiers suivants sont manquants : {countLabel}.",
      "status.project.json.missing": "Projet JSON ouvert. Non reliés : {countLabel}. Utilisez un paquet portable ou reliez les fichiers.",
      "tour.step.progress": "Étape {current} sur {total}",
      "export.range.progress": "Export du segment {start}–{end} s…",
      "status.media.arranged": "Éléments classés selon la numérotation : {countLabel} · {duration}.",
      "status.media.relink.instruction": "Cliquez sur « Relier les fichiers » pour rétablir les liens des médias.",
      "profile.project.summary": "Projet : {width} × {height} pixels, {aspect}, {fps} i/s.",
      "status.export.completed": "Terminé : {file} ({size} ; plage {start}–{end} s).",
      "slideshow.photos.heading": "Photos ({count})",
      "status.clip.nudged": "Clip déplacé de {countLabel} vers {direction}.",
      "status.media.import.failed": "Impossible d’importer « {file} » : {error}",
      "dialog.frame.save.title": "Enregistrer l’image actuelle",
      "dialog.frame.filter.png": "Image PNG",
      "dialog.frame.filter.jpeg": "Image JPEG",
      "clip.speed.label": "Vitesse",
      "clip.speed.tooltip": "Vitesse de lecture du clip vidéo sélectionné"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "es": {
    "mediaFile": {
      "one": "archivo multimedia",
      "other": "archivos multimedia",
      "many": "archivos multimedia"
    },
    "clip": {
      "one": "clip",
      "other": "clips",
      "many": "clips"
    },
    "frame": {
      "one": "fotograma",
      "other": "fotogramas",
      "many": "fotogramas"
    },
    "messages": {
      "status.media.imported": "Importados: {countLabel}.",
      "status.media.missing": "Faltan: {countLabel}.",
      "status.media.relinked": "Archivos multimedia restaurados: {restored} de {total}.",
      "status.project.portable.saved": "Proyecto portátil guardado: {countLabel}, {size}. Se incluyen vídeo y audio.",
      "status.project.portable.opened": "Proyecto portátil abierto. Conectados: {countLabel}.",
      "status.project.portable.missing": "Proyecto portátil abierto, pero faltan estos archivos: {countLabel}.",
      "status.project.json.missing": "Proyecto JSON abierto. Sin vincular: {countLabel}. Usa un paquete portátil o vuelve a vincular los archivos.",
      "tour.step.progress": "Paso {current} de {total}",
      "export.range.progress": "Exportando el fragmento {start}–{end} s…",
      "status.media.arranged": "Ordenados según la numeración: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Pulsa «Volver a vincular archivos» para restaurar los vínculos de los medios.",
      "profile.project.summary": "Proyecto: {width} × {height} píxeles, {aspect}, {fps} fps.",
      "status.export.completed": "Listo: {file} ({size}; intervalo {start}–{end} s).",
      "slideshow.photos.heading": "Fotos ({count})",
      "status.clip.nudged": "Clip desplazado {countLabel} hacia {direction}.",
      "status.media.import.failed": "No se pudo importar «{file}»: {error}",
      "dialog.frame.save.title": "Guardar fotograma actual",
      "dialog.frame.filter.png": "Imagen PNG",
      "dialog.frame.filter.jpeg": "Imagen JPEG",
      "clip.speed.label": "Velocidad",
      "clip.speed.tooltip": "Velocidad de reproducción del clip de vídeo seleccionado"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "pt-BR": {
    "mediaFile": {
      "one": "arquivo de mídia",
      "other": "arquivos de mídia",
      "many": "arquivos de mídia"
    },
    "clip": {
      "one": "clipe",
      "other": "clipes",
      "many": "clipes"
    },
    "frame": {
      "one": "quadro",
      "other": "quadros",
      "many": "quadros"
    },
    "messages": {
      "status.media.imported": "Importados: {countLabel}.",
      "status.media.missing": "Ausentes: {countLabel}.",
      "status.media.relinked": "Arquivos de mídia restaurados: {restored} de {total}.",
      "status.project.portable.saved": "Projeto portátil salvo: {countLabel}, {size}. Vídeo e áudio incluídos.",
      "status.project.portable.opened": "Projeto portátil aberto. Conectados: {countLabel}.",
      "status.project.portable.missing": "Projeto portátil aberto, mas estes arquivos estão ausentes: {countLabel}.",
      "status.project.json.missing": "Projeto JSON aberto. Não vinculados: {countLabel}. Use um pacote portátil ou vincule os arquivos novamente.",
      "tour.step.progress": "Etapa {current} de {total}",
      "export.range.progress": "Exportando o trecho {start}–{end} s…",
      "status.media.arranged": "Organizados pela numeração: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Clique em “Relink Files” para restaurar os vínculos das mídias.",
      "profile.project.summary": "Projeto: {width} × {height} pixels, {aspect}, {fps} fps.",
      "status.export.completed": "Concluído: {file} ({size}; trecho {start}–{end} s).",
      "slideshow.photos.heading": "Fotos ({count})",
      "status.clip.nudged": "Clipe deslocado {countLabel} para {direction}.",
      "status.media.import.failed": "Não foi possível importar “{file}”: {error}",
      "dialog.frame.save.title": "Salvar quadro atual",
      "dialog.frame.filter.png": "Imagem PNG",
      "dialog.frame.filter.jpeg": "Imagem JPEG",
      "clip.speed.label": "Velocidade",
      "clip.speed.tooltip": "Velocidade de reprodução do clipe de vídeo selecionado"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "it": {
    "mediaFile": {
      "one": "file multimediale",
      "other": "file multimediali",
      "many": "file multimediali"
    },
    "clip": {
      "one": "clip",
      "other": "clip",
      "many": "clip"
    },
    "frame": {
      "one": "fotogramma",
      "other": "fotogrammi",
      "many": "fotogrammi"
    },
    "messages": {
      "status.media.imported": "Importati: {countLabel}.",
      "status.media.missing": "Mancanti: {countLabel}.",
      "status.media.relinked": "File multimediali ripristinati: {restored} di {total}.",
      "status.project.portable.saved": "Progetto portatile salvato: {countLabel}, {size}. Video e audio inclusi.",
      "status.project.portable.opened": "Progetto portatile aperto. Collegati: {countLabel}.",
      "status.project.portable.missing": "Progetto portatile aperto, ma mancano questi file: {countLabel}.",
      "status.project.json.missing": "Progetto JSON aperto. Non collegati: {countLabel}. Usa un pacchetto portatile o ricollega i file.",
      "tour.step.progress": "Passaggio {current} di {total}",
      "export.range.progress": "Esportazione segmento {start}–{end} s…",
      "status.media.arranged": "Ordinati in base alla numerazione: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Seleziona “Ricollega file” per ripristinare i collegamenti ai file multimediali.",
      "profile.project.summary": "Progetto: {width} × {height} pixel, {aspect}, {fps} fps.",
      "status.export.completed": "Completato: {file} ({size}; intervallo {start}–{end} s).",
      "slideshow.photos.heading": "Foto ({count})",
      "status.clip.nudged": "Clip spostata di {countLabel} verso {direction}.",
      "status.media.import.failed": "Impossibile importare “{file}”: {error}",
      "dialog.frame.save.title": "Salva fotogramma corrente",
      "dialog.frame.filter.png": "Immagine PNG",
      "dialog.frame.filter.jpeg": "Immagine JPEG",
      "clip.speed.label": "Velocità",
      "clip.speed.tooltip": "Velocità di riproduzione della clip video selezionata"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "pl": {
    "mediaFile": {
      "one": "plik multimedialny",
      "few": "pliki multimedialne",
      "many": "plików multimedialnych",
      "other": "pliku multimedialnego"
    },
    "clip": {
      "one": "klip",
      "few": "klipy",
      "many": "klipów",
      "other": "klipu"
    },
    "frame": {
      "one": "klatka",
      "few": "klatki",
      "many": "klatek",
      "other": "klatki"
    },
    "messages": {
      "status.media.imported": "Zaimportowano: {countLabel}.",
      "status.media.missing": "Brakujące: {countLabel}.",
      "status.media.relinked": "Przywrócone pliki multimedialne: {restored} z {total}.",
      "status.project.portable.saved": "Zapisano projekt przenośny: {countLabel}, {size}. Wideo i audio są dołączone.",
      "status.project.portable.opened": "Otwarto projekt przenośny. Połączono: {countLabel}.",
      "status.project.portable.missing": "Otwarto projekt przenośny, ale brakuje plików: {countLabel}.",
      "status.project.json.missing": "Otwarto projekt JSON. Niepowiązane: {countLabel}. Użyj pakietu przenośnego lub ponownie połącz pliki.",
      "tour.step.progress": "Krok {current} z {total}",
      "export.range.progress": "Eksportowanie fragmentu {start}–{end} s…",
      "status.media.arranged": "Ułożono według numeracji: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Wybierz „Połącz ponownie pliki”, aby przywrócić łącza do multimediów.",
      "profile.project.summary": "Projekt: {width} × {height} pikseli, {aspect}, {fps} kl./s.",
      "status.export.completed": "Gotowe: {file} ({size}; zakres {start}–{end} s).",
      "slideshow.photos.heading": "Zdjęcia ({count})",
      "status.clip.nudged": "Klip przesunięto o {countLabel} {direction}.",
      "status.media.import.failed": "Nie udało się zaimportować „{file}”: {error}",
      "dialog.frame.save.title": "Zapisz bieżącą klatkę",
      "dialog.frame.filter.png": "Obraz PNG",
      "dialog.frame.filter.jpeg": "Obraz JPEG",
      "clip.speed.label": "Prędkość",
      "clip.speed.tooltip": "Szybkość odtwarzania wybranego klipu wideo"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "pliku",
          "few": "plików",
          "many": "plików",
          "other": "pliku"
        },
        "clip": {
          "one": "klipu",
          "few": "klipów",
          "many": "klipów",
          "other": "klipu"
        },
        "frame": {
          "one": "klatki",
          "few": "klatek",
          "many": "klatek",
          "other": "klatki"
        }
      }
    }
  },
  "uk": {
    "mediaFile": {
      "one": "медіафайл",
      "few": "медіафайли",
      "many": "медіафайлів",
      "other": "медіафайла"
    },
    "clip": {
      "one": "кліп",
      "few": "кліпи",
      "many": "кліпів",
      "other": "кліпа"
    },
    "frame": {
      "one": "кадр",
      "few": "кадри",
      "many": "кадрів",
      "other": "кадра"
    },
    "messages": {
      "status.media.imported": "Імпортовано: {countLabel}.",
      "status.media.missing": "Відсутні: {countLabel}.",
      "status.media.relinked": "Відновлено медіафайлів: {restored} із {total}.",
      "status.project.portable.saved": "Портативний проєкт збережено: {countLabel}, {size}. Відео й аудіо включено.",
      "status.project.portable.opened": "Портативний проєкт відкрито. Підключено: {countLabel}.",
      "status.project.portable.missing": "Портативний проєкт відкрито, але відсутні файли: {countLabel}.",
      "status.project.json.missing": "JSON-проєкт відкрито. Не підключено: {countLabel}. Скористайтеся портативним пакетом або відновіть зв’язки з файлами.",
      "tour.step.progress": "Крок {current} із {total}",
      "export.range.progress": "Експорт фрагмента {start}–{end} с…",
      "status.media.arranged": "Упорядковано за нумерацією: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Натисніть «Повторно підключити файли», щоб відновити зв’язки з медіафайлами.",
      "profile.project.summary": "Проєкт: {width} × {height} пікселів, {aspect}, {fps} кадр/с.",
      "status.export.completed": "Готово: {file} ({size}; фрагмент {start}–{end} с).",
      "slideshow.photos.heading": "Фотографії ({count})",
      "status.clip.nudged": "Кліп переміщено на {countLabel} {direction}.",
      "status.media.import.failed": "Не вдалося імпортувати «{file}»: {error}",
      "dialog.frame.save.title": "Зберегти поточний кадр",
      "dialog.frame.filter.png": "Зображення PNG",
      "dialog.frame.filter.jpeg": "Зображення JPEG",
      "clip.speed.label": "Швидкість",
      "clip.speed.tooltip": "Швидкість відтворення вибраного відеокліпу"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "файлу",
          "few": "файлів",
          "many": "файлів",
          "other": "файлу"
        },
        "clip": {
          "one": "кліпу",
          "few": "кліпів",
          "many": "кліпів",
          "other": "кліпу"
        },
        "frame": {
          "one": "кадру",
          "few": "кадрів",
          "many": "кадрів",
          "other": "кадру"
        }
      }
    }
  },
  "tr": {
    "mediaFile": {
      "one": "medya dosyası",
      "other": "medya dosyası"
    },
    "clip": {
      "one": "klip",
      "other": "klip"
    },
    "frame": {
      "one": "kare",
      "other": "kare"
    },
    "messages": {
      "status.media.imported": "İçe aktarıldı: {countLabel}.",
      "status.media.missing": "Eksik: {countLabel}.",
      "status.media.relinked": "Yeniden bağlanan medya dosyaları: {restored} / {total}.",
      "status.project.portable.saved": "Taşınabilir proje kaydedildi: {countLabel}, {size}. Video ve ses dâhil.",
      "status.project.portable.opened": "Taşınabilir proje açıldı. Bağlanan: {countLabel}.",
      "status.project.portable.missing": "Taşınabilir proje açıldı ancak şu dosyalar eksik: {countLabel}.",
      "status.project.json.missing": "JSON projesi açıldı. Bağlanmayan: {countLabel}. Taşınabilir paket kullanın veya dosyaları yeniden bağlayın.",
      "tour.step.progress": "Adım {current} / {total}",
      "export.range.progress": "{start}–{end} s aralığı dışa aktarılıyor…",
      "status.media.arranged": "Dosya numaralarına göre sıralandı: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Medya bağlantılarını geri yüklemek için “Dosyaları Yeniden Bağla” seçeneğini kullanın.",
      "profile.project.summary": "Proje: {width} × {height} piksel, {aspect}, {fps} fps.",
      "status.export.completed": "Tamamlandı: {file} ({size}; {start}–{end} s aralığı).",
      "slideshow.photos.heading": "Fotoğraflar ({count})",
      "status.clip.nudged": "Klip {countLabel} {direction} taşındı.",
      "status.media.import.failed": "“{file}” içe aktarılamadı: {error}",
      "dialog.frame.save.title": "Geçerli Kareyi Kaydet",
      "dialog.frame.filter.png": "PNG Görseli",
      "dialog.frame.filter.jpeg": "JPEG Görseli",
      "clip.speed.label": "Hız",
      "clip.speed.tooltip": "Seçili video klibinin oynatma hızı"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "zh-CN": {
    "mediaFile": {
      "other": "个媒体文件",
      "one": "个媒体文件"
    },
    "clip": {
      "other": "个片段",
      "one": "个片段"
    },
    "frame": {
      "other": "帧",
      "one": "帧"
    },
    "messages": {
      "status.media.imported": "已导入：{countLabel}。",
      "status.media.missing": "缺少：{countLabel}。",
      "status.media.relinked": "已恢复媒体文件：{restored}/{total}。",
      "status.project.portable.saved": "便携项目已保存：{countLabel}，{size}。已包含视频和音频。",
      "status.project.portable.opened": "便携项目已打开。已连接：{countLabel}。",
      "status.project.portable.missing": "便携项目已打开，但缺少以下文件：{countLabel}。",
      "status.project.json.missing": "JSON 项目已打开。未重新链接：{countLabel}。请使用便携包或重新链接文件。",
      "tour.step.progress": "第 {current} 步，共 {total} 步",
      "export.range.progress": "正在导出片段 {start}–{end} 秒…",
      "status.media.arranged": "已按文件编号排列：{countLabel} · {duration}。",
      "status.media.relink.instruction": "选择“重新链接文件”以恢复媒体文件链接。",
      "profile.project.summary": "项目：{width} × {height} 像素，{aspect}，{fps} fps。",
      "status.export.completed": "完成：{file}（{size}；范围 {start}–{end} 秒）。",
      "slideshow.photos.heading": "照片（{count}）",
      "status.clip.nudged": "片段已向{direction}移动 {countLabel}。",
      "status.media.import.failed": "无法导入“{file}”：{error}",
      "dialog.frame.save.title": "保存当前帧",
      "dialog.frame.filter.png": "PNG 图像",
      "dialog.frame.filter.jpeg": "JPEG 图像",
      "clip.speed.label": "速度",
      "clip.speed.tooltip": "所选视频片段的播放速度"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "zh-TW": {
    "mediaFile": {
      "other": "個媒體檔案",
      "one": "個媒體檔案"
    },
    "clip": {
      "other": "個片段",
      "one": "個片段"
    },
    "frame": {
      "other": "格",
      "one": "格"
    },
    "messages": {
      "status.media.imported": "已匯入：{countLabel}。",
      "status.media.missing": "缺少：{countLabel}。",
      "status.media.relinked": "已還原媒體檔案：{restored}/{total}。",
      "status.project.portable.saved": "可攜式專案已儲存：{countLabel}，{size}。已包含影片和音訊。",
      "status.project.portable.opened": "可攜式專案已開啟。已連結：{countLabel}。",
      "status.project.portable.missing": "可攜式專案已開啟，但缺少以下檔案：{countLabel}。",
      "status.project.json.missing": "JSON 專案已開啟。未連結：{countLabel}。請使用可攜式封裝或重新連結檔案。",
      "tour.step.progress": "第 {current} 步，共 {total} 步",
      "export.range.progress": "正在匯出片段 {start}–{end} 秒…",
      "status.media.arranged": "已依檔案編號排列：{countLabel} · {duration}。",
      "status.media.relink.instruction": "選取「重新連結檔案」以還原媒體檔案連結。",
      "profile.project.summary": "專案：{width} × {height} 像素，{aspect}，{fps} fps。",
      "status.export.completed": "完成：{file}（{size}；範圍 {start}–{end} 秒）。",
      "slideshow.photos.heading": "照片（{count}）",
      "status.clip.nudged": "片段已向{direction}移動 {countLabel}。",
      "status.media.import.failed": "無法匯入「{file}」：{error}",
      "dialog.frame.save.title": "儲存目前影格",
      "dialog.frame.filter.png": "PNG 影像",
      "dialog.frame.filter.jpeg": "JPEG 影像",
      "clip.speed.label": "速度",
      "clip.speed.tooltip": "所選影片片段的播放速度"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "ja": {
    "mediaFile": {
      "other": "個のメディアファイル",
      "one": "個のメディアファイル"
    },
    "clip": {
      "other": "個のクリップ",
      "one": "個のクリップ"
    },
    "frame": {
      "other": "フレーム",
      "one": "フレーム"
    },
    "messages": {
      "status.media.imported": "インポート済み：{countLabel}。",
      "status.media.missing": "不足：{countLabel}。",
      "status.media.relinked": "再リンクしたメディアファイル：{restored}/{total}。",
      "status.project.portable.saved": "ポータブルプロジェクトを保存しました：{countLabel}、{size}。動画と音声を含みます。",
      "status.project.portable.opened": "ポータブルプロジェクトを開きました。リンク済み：{countLabel}。",
      "status.project.portable.missing": "ポータブルプロジェクトを開きましたが、次のファイルが見つかりません：{countLabel}。",
      "status.project.json.missing": "JSON プロジェクトを開きました。未リンク：{countLabel}。ポータブルパッケージを使うか、ファイルを再リンクしてください。",
      "tour.step.progress": "ステップ {current}/{total}",
      "export.range.progress": "セグメント {start}～{end} 秒をエクスポート中…",
      "status.media.arranged": "ファイル番号順に配置しました：{countLabel} · {duration}。",
      "status.media.relink.instruction": "メディアのリンクを復元するには「ファイルを再リンク」を選択してください。",
      "profile.project.summary": "プロジェクト：{width} × {height} ピクセル、{aspect}、{fps} fps。",
      "status.export.completed": "完了：{file}（{size}、範囲 {start}～{end} 秒）。",
      "slideshow.photos.heading": "写真（{count}）",
      "status.clip.nudged": "クリップを{direction}へ {countLabel} 移動しました。",
      "status.media.import.failed": "「{file}」を読み込めませんでした：{error}",
      "dialog.frame.save.title": "現在のフレームを保存",
      "dialog.frame.filter.png": "PNG 画像",
      "dialog.frame.filter.jpeg": "JPEG 画像",
      "clip.speed.label": "速度",
      "clip.speed.tooltip": "選択したビデオクリップの再生速度"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "ko": {
    "mediaFile": {
      "other": "개 미디어 파일",
      "one": "개 미디어 파일"
    },
    "clip": {
      "other": "개 클립",
      "one": "개 클립"
    },
    "frame": {
      "other": "프레임",
      "one": "프레임"
    },
    "messages": {
      "status.media.imported": "가져옴: {countLabel}.",
      "status.media.missing": "누락됨: {countLabel}.",
      "status.media.relinked": "다시 연결된 미디어 파일: {restored}/{total}.",
      "status.project.portable.saved": "휴대용 프로젝트 저장됨: {countLabel}, {size}. 비디오와 오디오가 포함되어 있습니다.",
      "status.project.portable.opened": "휴대용 프로젝트를 열었습니다. 연결됨: {countLabel}.",
      "status.project.portable.missing": "휴대용 프로젝트를 열었지만 다음 파일이 없습니다: {countLabel}.",
      "status.project.json.missing": "JSON 프로젝트를 열었습니다. 연결되지 않음: {countLabel}. 휴대용 패키지를 사용하거나 파일을 다시 연결하세요.",
      "tour.step.progress": "{total}단계 중 {current}단계",
      "export.range.progress": "{start}–{end}초 구간 내보내는 중…",
      "status.media.arranged": "파일 번호순으로 정렬됨: {countLabel} · {duration}.",
      "status.media.relink.instruction": "미디어 연결을 복원하려면 “파일 다시 연결”을 선택하세요.",
      "profile.project.summary": "프로젝트: {width} × {height}픽셀, {aspect}, {fps} fps.",
      "status.export.completed": "완료: {file} ({size}; 범위 {start}–{end}초).",
      "slideshow.photos.heading": "사진 ({count})",
      "status.clip.nudged": "클립을 {direction}(으)로 {countLabel} 이동했습니다.",
      "status.media.import.failed": "“{file}”을(를) 가져오지 못했습니다: {error}",
      "dialog.frame.save.title": "현재 프레임 저장",
      "dialog.frame.filter.png": "PNG 이미지",
      "dialog.frame.filter.jpeg": "JPEG 이미지",
      "clip.speed.label": "속도",
      "clip.speed.tooltip": "선택한 비디오 클립의 재생 속도"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "ar": {
    "mediaFile": {
      "zero": "ملف وسائط",
      "one": "ملف وسائط",
      "two": "ملفا وسائط",
      "few": "ملفات وسائط",
      "many": "ملف وسائط",
      "other": "ملف وسائط"
    },
    "clip": {
      "zero": "مقطع",
      "one": "مقطع",
      "two": "مقطعان",
      "few": "مقاطع",
      "many": "مقطعًا",
      "other": "مقطع"
    },
    "frame": {
      "zero": "إطار",
      "one": "إطار",
      "two": "إطاران",
      "few": "إطارات",
      "many": "إطارًا",
      "other": "إطار"
    },
    "messages": {
      "status.media.imported": "تم الاستيراد: {countLabel}.",
      "status.media.missing": "مفقود: {countLabel}.",
      "status.media.relinked": "ملفات الوسائط التي تمت استعادتها: {restored} من {total}.",
      "status.project.portable.saved": "تم حفظ المشروع المحمول: {countLabel}، {size}. يتضمن الفيديو والصوت.",
      "status.project.portable.opened": "تم فتح المشروع المحمول. الملفات المرتبطة: {countLabel}.",
      "status.project.portable.missing": "تم فتح المشروع المحمول، لكن الملفات التالية مفقودة: {countLabel}.",
      "status.project.json.missing": "تم فتح مشروع JSON. الملفات غير المرتبطة: {countLabel}. استخدم حزمة محمولة أو أعد ربط الملفات.",
      "tour.step.progress": "الخطوة {current} من {total}",
      "export.range.progress": "جارٍ تصدير المقطع من {start} إلى {end} ثانية…",
      "status.media.arranged": "تم الترتيب حسب ترقيم الملفات: {countLabel} · {duration}.",
      "status.media.relink.instruction": "اختر «إعادة ربط الملفات» لاستعادة روابط الوسائط.",
      "profile.project.summary": "المشروع: ‏{width} × {height} بكسل، ‏{aspect}، ‏{fps} إطار/ث.",
      "status.export.completed": "اكتمل: {file} ({size}؛ النطاق {start}–{end} ث).",
      "slideshow.photos.heading": "الصور ({count})",
      "status.clip.nudged": "تم تحريك المقطع {countLabel} إلى {direction}.",
      "status.media.import.failed": "تعذّر استيراد «{file}»: {error}",
      "dialog.frame.save.title": "حفظ الإطار الحالي",
      "dialog.frame.filter.png": "صورة PNG",
      "dialog.frame.filter.jpeg": "صورة JPEG",
      "clip.speed.label": "السرعة",
      "clip.speed.tooltip": "سرعة تشغيل مقطع الفيديو المحدد"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "he": {
    "mediaFile": {
      "one": "קובץ מדיה",
      "two": "קובצי מדיה",
      "other": "קובצי מדיה"
    },
    "clip": {
      "one": "קליפ",
      "two": "שני קליפים",
      "other": "קליפים"
    },
    "frame": {
      "one": "פריים",
      "two": "שני פריימים",
      "other": "פריימים"
    },
    "messages": {
      "status.media.imported": "יובאו: {countLabel}.",
      "status.media.missing": "חסרים: {countLabel}.",
      "status.media.relinked": "קובצי מדיה שחוברו מחדש: {restored} מתוך {total}.",
      "status.project.portable.saved": "הפרויקט הנייד נשמר: {countLabel}, {size}. קובצי הווידאו והשמע כלולים.",
      "status.project.portable.opened": "הפרויקט הנייד נפתח. חוברו: {countLabel}.",
      "status.project.portable.missing": "הפרויקט הנייד נפתח, אך חסרים הקבצים הבאים: {countLabel}.",
      "status.project.json.missing": "פרויקט JSON נפתח. לא קושרו: {countLabel}. השתמשו בחבילה ניידת או קשרו מחדש את הקבצים.",
      "tour.step.progress": "שלב {current} מתוך {total}",
      "export.range.progress": "מייצא את הקטע {start}–{end} שנ׳…",
      "status.media.arranged": "הסידור בוצע לפי מספור הקבצים: {countLabel} · {duration}.",
      "status.media.relink.instruction": "בחרו „קישור מחדש לקבצים” כדי לשחזר את קישורי המדיה.",
      "profile.project.summary": "פרויקט: {width} × {height} פיקסלים, {aspect}, ‏{fps} fps.",
      "status.export.completed": "הסתיים: {file} ({size}; טווח {start}–{end} שנ׳).",
      "slideshow.photos.heading": "תמונות ({count})",
      "status.clip.nudged": "הקליפ הוזז {countLabel} {direction}.",
      "status.media.import.failed": "ייבוא „{file}” נכשל: {error}",
      "dialog.frame.save.title": "שמירת הפריים הנוכחי",
      "dialog.frame.filter.png": "תמונת PNG",
      "dialog.frame.filter.jpeg": "תמונת JPEG",
      "clip.speed.label": "מהירות",
      "clip.speed.tooltip": "מהירות ההפעלה של קטע הווידאו שנבחר"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "hi": {
    "mediaFile": {
      "one": "मीडिया फ़ाइल",
      "other": "मीडिया फ़ाइलें"
    },
    "clip": {
      "one": "क्लिप",
      "other": "क्लिप"
    },
    "frame": {
      "one": "फ़्रेम",
      "other": "फ़्रेम"
    },
    "messages": {
      "status.media.imported": "आयातित: {countLabel}।",
      "status.media.missing": "अनुपलब्ध: {countLabel}।",
      "status.media.relinked": "पुनः लिंक की गई मीडिया फ़ाइलें: {restored} / {total}।",
      "status.project.portable.saved": "पोर्टेबल प्रोजेक्ट सहेजा गया: {countLabel}, {size}। वीडियो और ऑडियो शामिल हैं।",
      "status.project.portable.opened": "पोर्टेबल प्रोजेक्ट खुल गया। कनेक्ट किए गए: {countLabel}।",
      "status.project.portable.missing": "पोर्टेबल प्रोजेक्ट खुल गया, लेकिन ये फ़ाइलें अनुपलब्ध हैं: {countLabel}।",
      "status.project.json.missing": "JSON प्रोजेक्ट खुल गया। लिंक नहीं किए गए: {countLabel}। पोर्टेबल पैकेज का उपयोग करें या फ़ाइलें फिर से लिंक करें।",
      "tour.step.progress": "चरण {current} / {total}",
      "export.range.progress": "{start}–{end} सेकंड का भाग निर्यात हो रहा है…",
      "status.media.arranged": "फ़ाइल क्रम के अनुसार व्यवस्थित: {countLabel} · {duration}।",
      "status.media.relink.instruction": "मीडिया लिंक बहाल करने के लिए “फ़ाइलें फिर से लिंक करें” चुनें।",
      "profile.project.summary": "प्रोजेक्ट: {width} × {height} पिक्सेल, {aspect}, {fps} fps।",
      "status.export.completed": "पूरा हुआ: {file} ({size}; अवधि {start}–{end} सेकंड)।",
      "slideshow.photos.heading": "फ़ोटो ({count})",
      "status.clip.nudged": "क्लिप {countLabel} {direction} खिसकाई गई।",
      "status.media.import.failed": "“{file}” आयात नहीं हो सका: {error}",
      "dialog.frame.save.title": "वर्तमान फ़्रेम सहेजें",
      "dialog.frame.filter.png": "PNG छवि",
      "dialog.frame.filter.jpeg": "JPEG छवि",
      "clip.speed.label": "गति",
      "clip.speed.tooltip": "चुनी गई वीडियो क्लिप की प्लेबैक गति"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "nl": {
    "mediaFile": {
      "one": "mediabestand",
      "other": "mediabestanden"
    },
    "clip": {
      "one": "clip",
      "other": "clips"
    },
    "frame": {
      "one": "frame",
      "other": "frames"
    },
    "messages": {
      "status.media.imported": "Geïmporteerd: {countLabel}.",
      "status.media.missing": "Ontbrekend: {countLabel}.",
      "status.media.relinked": "Herstelde mediabestanden: {restored} van {total}.",
      "status.project.portable.saved": "Draagbaar project opgeslagen: {countLabel}, {size}. Video en audio zijn inbegrepen.",
      "status.project.portable.opened": "Draagbaar project geopend. Gekoppeld: {countLabel}.",
      "status.project.portable.missing": "Draagbaar project geopend, maar deze bestanden ontbreken: {countLabel}.",
      "status.project.json.missing": "JSON-project geopend. Niet gekoppeld: {countLabel}. Gebruik een draagbaar pakket of koppel de bestanden opnieuw.",
      "tour.step.progress": "Stap {current} van {total}",
      "export.range.progress": "Segment {start}–{end} s exporteren…",
      "status.media.arranged": "Gerangschikt op bestandsnummer: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Kies ‘Bestanden opnieuw koppelen’ om de mediakoppelingen te herstellen.",
      "profile.project.summary": "Project: {width} × {height} pixels, {aspect}, {fps} fps.",
      "status.export.completed": "Voltooid: {file} ({size}; bereik {start}–{end} s).",
      "slideshow.photos.heading": "Foto’s ({count})",
      "status.clip.nudged": "Clip {countLabel} naar {direction} verplaatst.",
      "status.media.import.failed": "Importeren van “{file}” is mislukt: {error}",
      "dialog.frame.save.title": "Huidig frame opslaan",
      "dialog.frame.filter.png": "PNG-afbeelding",
      "dialog.frame.filter.jpeg": "JPEG-afbeelding",
      "clip.speed.label": "Snelheid",
      "clip.speed.tooltip": "Afspeelsnelheid van de geselecteerde videoclip"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "sv": {
    "mediaFile": {
      "one": "mediefil",
      "other": "mediefiler"
    },
    "clip": {
      "one": "klipp",
      "other": "klipp"
    },
    "frame": {
      "one": "bildruta",
      "other": "bildrutor"
    },
    "messages": {
      "status.media.imported": "Importerade: {countLabel}.",
      "status.media.missing": "Saknas: {countLabel}.",
      "status.media.relinked": "Återlänkade mediefiler: {restored} av {total}.",
      "status.project.portable.saved": "Portabelt projekt sparat: {countLabel}, {size}. Video och ljud ingår.",
      "status.project.portable.opened": "Portabelt projekt öppnat. Anslutna: {countLabel}.",
      "status.project.portable.missing": "Portabelt projekt öppnat, men följande filer saknas: {countLabel}.",
      "status.project.json.missing": "JSON-projekt öppnat. Ej länkade: {countLabel}. Använd ett portabelt paket eller länka filerna igen.",
      "tour.step.progress": "Steg {current} av {total}",
      "export.range.progress": "Exporterar segmentet {start}–{end} s…",
      "status.media.arranged": "Sorterade efter filnumrering: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Välj ”Återanslut filer” för att återställa medielänkarna.",
      "profile.project.summary": "Projekt: {width} × {height} pixlar, {aspect}, {fps} fps.",
      "status.export.completed": "Klart: {file} ({size}; intervall {start}–{end} s).",
      "slideshow.photos.heading": "Foton ({count})",
      "status.clip.nudged": "Klippet flyttades {countLabel} {direction}.",
      "status.media.import.failed": "Det gick inte att importera ”{file}”: {error}",
      "dialog.frame.save.title": "Spara aktuell bildruta",
      "dialog.frame.filter.png": "PNG-bild",
      "dialog.frame.filter.jpeg": "JPEG-bild",
      "clip.speed.label": "Hastighet",
      "clip.speed.tooltip": "Uppspelningshastighet för det valda videoklippet"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "fi": {
    "mediaFile": {
      "one": "mediatiedosto",
      "other": "mediatiedostoa"
    },
    "clip": {
      "one": "leike",
      "other": "leikettä"
    },
    "frame": {
      "one": "ruutu",
      "other": "ruutua"
    },
    "messages": {
      "status.media.imported": "Tuotu: {countLabel}.",
      "status.media.missing": "Puuttuu: {countLabel}.",
      "status.media.relinked": "Palautetut mediatiedostot: {restored}/{total}.",
      "status.project.portable.saved": "Siirrettävä projekti tallennettu: {countLabel}, {size}. Video ja ääni sisältyvät.",
      "status.project.portable.opened": "Siirrettävä projekti avattu. Yhdistetty: {countLabel}.",
      "status.project.portable.missing": "Siirrettävä projekti avattu, mutta seuraavat tiedostot puuttuvat: {countLabel}.",
      "status.project.json.missing": "JSON-projekti avattu. Linkittämättä: {countLabel}. Käytä siirrettävää pakettia tai linkitä tiedostot uudelleen.",
      "tour.step.progress": "Vaihe {current}/{total}",
      "export.range.progress": "Viedään osaa {start}–{end} s…",
      "status.media.arranged": "Järjestetty tiedostonumeroinnin mukaan: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Palauta mediatiedostojen linkit valitsemalla ”Linkitä tiedostot uudelleen”.",
      "profile.project.summary": "Projekti: {width} × {height} kuvapistettä, {aspect}, {fps} fps.",
      "status.export.completed": "Valmis: {file} ({size}; alue {start}–{end} s).",
      "slideshow.photos.heading": "Valokuvat ({count})",
      "status.clip.nudged": "Leikettä siirrettiin {countLabel} {direction}.",
      "status.media.import.failed": "Tiedoston ”{file}” tuonti epäonnistui: {error}",
      "dialog.frame.save.title": "Tallenna nykyinen kehys",
      "dialog.frame.filter.png": "PNG-kuva",
      "dialog.frame.filter.jpeg": "JPEG-kuva",
      "clip.speed.label": "Nopeus",
      "clip.speed.tooltip": "Valitun videoleikkeen toistonopeus"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "tiedoston",
          "other": "tiedostojen"
        },
        "clip": {
          "one": "leikkeen",
          "other": "leikkeiden"
        },
        "frame": {
          "one": "kuvan",
          "other": "kuvien"
        }
      }
    }
  },
  "cs": {
    "mediaFile": {
      "one": "mediální soubor",
      "few": "mediální soubory",
      "many": "mediálních souborů",
      "other": "mediálního souboru"
    },
    "clip": {
      "one": "klip",
      "few": "klipy",
      "many": "klipů",
      "other": "klipu"
    },
    "frame": {
      "one": "snímek",
      "few": "snímky",
      "many": "snímků",
      "other": "snímku"
    },
    "messages": {
      "status.media.imported": "Importováno: {countLabel}.",
      "status.media.missing": "Chybí: {countLabel}.",
      "status.media.relinked": "Obnovené mediální soubory: {restored} z {total}.",
      "status.project.portable.saved": "Přenosný projekt uložen: {countLabel}, {size}. Video a zvuk jsou součástí.",
      "status.project.portable.opened": "Přenosný projekt otevřen. Připojeno: {countLabel}.",
      "status.project.portable.missing": "Přenosný projekt otevřen, ale chybí tyto soubory: {countLabel}.",
      "status.project.json.missing": "Projekt JSON otevřen. Nepřipojeno: {countLabel}. Použijte přenosný balíček nebo soubory znovu připojte.",
      "tour.step.progress": "Krok {current} z {total}",
      "export.range.progress": "Exportuje se úsek {start}–{end} s…",
      "status.media.arranged": "Seřazeno podle číslování souborů: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Výběrem možnosti „Znovu propojit soubory“ obnovíte odkazy na média.",
      "profile.project.summary": "Projekt: {width} × {height} pixelů, {aspect}, {fps} sn./s.",
      "status.export.completed": "Hotovo: {file} ({size}; rozsah {start}–{end} s).",
      "slideshow.photos.heading": "Fotografie ({count})",
      "status.clip.nudged": "Klip posunut o {countLabel} {direction}.",
      "status.media.import.failed": "Soubor „{file}“ se nepodařilo importovat: {error}",
      "dialog.frame.save.title": "Uložit aktuální snímek",
      "dialog.frame.filter.png": "Obrázek PNG",
      "dialog.frame.filter.jpeg": "Obrázek JPEG",
      "clip.speed.label": "Rychlost",
      "clip.speed.tooltip": "Rychlost přehrávání vybraného videoklipu"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "souboru",
          "few": "souborů",
          "many": "souborů",
          "other": "souboru"
        },
        "clip": {
          "one": "klipu",
          "few": "klipů",
          "many": "klipů",
          "other": "klipu"
        },
        "frame": {
          "one": "snímku",
          "few": "snímků",
          "many": "snímků",
          "other": "snímku"
        }
      }
    }
  },
  "ro": {
    "mediaFile": {
      "one": "fișier media",
      "few": "fișiere media",
      "other": "de fișiere media"
    },
    "clip": {
      "one": "clip",
      "few": "clipuri",
      "other": "de clipuri"
    },
    "frame": {
      "one": "cadru",
      "few": "cadre",
      "other": "de cadre"
    },
    "messages": {
      "status.media.imported": "Importate: {countLabel}.",
      "status.media.missing": "Lipsesc: {countLabel}.",
      "status.media.relinked": "Fișiere media reconectate: {restored} din {total}.",
      "status.project.portable.saved": "Proiect portabil salvat: {countLabel}, {size}. Video și audio sunt incluse.",
      "status.project.portable.opened": "Proiect portabil deschis. Conectate: {countLabel}.",
      "status.project.portable.missing": "Proiect portabil deschis, dar lipsesc fișierele: {countLabel}.",
      "status.project.json.missing": "Proiect JSON deschis. Neconectate: {countLabel}. Folosiți un pachet portabil sau reconectați fișierele.",
      "tour.step.progress": "Pasul {current} din {total}",
      "export.range.progress": "Se exportă segmentul {start}–{end} s…",
      "status.media.arranged": "Ordonate după numerotarea fișierelor: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Selectați „Reconectează fișierele” pentru a restabili legăturile media.",
      "profile.project.summary": "Proiect: {width} × {height} pixeli, {aspect}, {fps} fps.",
      "status.export.completed": "Finalizat: {file} ({size}; intervalul {start}–{end} s).",
      "slideshow.photos.heading": "Fotografii ({count})",
      "status.clip.nudged": "Clipul a fost mutat cu {countLabel} spre {direction}.",
      "status.media.import.failed": "Nu s-a putut importa „{file}”: {error}",
      "dialog.frame.save.title": "Salvează cadrul curent",
      "dialog.frame.filter.png": "Imagine PNG",
      "dialog.frame.filter.jpeg": "Imagine JPEG",
      "clip.speed.label": "Viteză",
      "clip.speed.tooltip": "Viteza de redare a clipului video selectat"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "fișierului",
          "few": "fișierelor",
          "other": "fișierului"
        },
        "clip": {
          "one": "clipului",
          "few": "clipurilor",
          "other": "clipului"
        },
        "frame": {
          "one": "cadrului",
          "few": "cadrelor",
          "other": "cadrului"
        }
      }
    }
  },
  "el": {
    "mediaFile": {
      "one": "αρχείο πολυμέσων",
      "other": "αρχεία πολυμέσων"
    },
    "clip": {
      "one": "κλιπ",
      "other": "κλιπ"
    },
    "frame": {
      "one": "καρέ",
      "other": "καρέ"
    },
    "messages": {
      "status.media.imported": "Έγινε εισαγωγή: {countLabel}.",
      "status.media.missing": "Λείπουν: {countLabel}.",
      "status.media.relinked": "Αρχεία πολυμέσων που αποκαταστάθηκαν: {restored} από {total}.",
      "status.project.portable.saved": "Το φορητό έργο αποθηκεύτηκε: {countLabel}, {size}. Περιλαμβάνονται βίντεο και ήχος.",
      "status.project.portable.opened": "Το φορητό έργο άνοιξε. Συνδέθηκαν: {countLabel}.",
      "status.project.portable.missing": "Το φορητό έργο άνοιξε, αλλά λείπουν τα αρχεία: {countLabel}.",
      "status.project.json.missing": "Το έργο JSON άνοιξε. Δεν συνδέθηκαν: {countLabel}. Χρησιμοποιήστε φορητό πακέτο ή συνδέστε ξανά τα αρχεία.",
      "tour.step.progress": "Βήμα {current} από {total}",
      "export.range.progress": "Εξαγωγή τμήματος {start}–{end} δ…",
      "status.media.arranged": "Ταξινομήθηκαν σύμφωνα με την αρίθμηση των αρχείων: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Επιλέξτε «Επανασύνδεση αρχείων» για να αποκαταστήσετε τους συνδέσμους πολυμέσων.",
      "profile.project.summary": "Έργο: {width} × {height} pixel, {aspect}, {fps} fps.",
      "status.export.completed": "Ολοκληρώθηκε: {file} ({size}· εύρος {start}–{end} δευτ.).",
      "slideshow.photos.heading": "Φωτογραφίες ({count})",
      "status.clip.nudged": "Το κλιπ μετακινήθηκε κατά {countLabel} προς {direction}.",
      "status.media.import.failed": "Δεν ήταν δυνατή η εισαγωγή του «{file}»: {error}",
      "dialog.frame.save.title": "Αποθήκευση τρέχοντος καρέ",
      "dialog.frame.filter.png": "Εικόνα PNG",
      "dialog.frame.filter.jpeg": "Εικόνα JPEG",
      "clip.speed.label": "Ταχύτητα",
      "clip.speed.tooltip": "Ταχύτητα αναπαραγωγής του επιλεγμένου βίντεο κλιπ"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "vi": {
    "mediaFile": {
      "one": "tệp phương tiện",
      "other": "tệp phương tiện"
    },
    "clip": {
      "one": "clip",
      "other": "clip"
    },
    "frame": {
      "one": "khung hình",
      "other": "khung hình"
    },
    "messages": {
      "status.media.imported": "Đã nhập: {countLabel}.",
      "status.media.missing": "Thiếu: {countLabel}.",
      "status.media.relinked": "Tệp phương tiện đã liên kết lại: {restored}/{total}.",
      "status.project.portable.saved": "Đã lưu dự án di động: {countLabel}, {size}. Bao gồm video và âm thanh.",
      "status.project.portable.opened": "Đã mở dự án di động. Đã liên kết: {countLabel}.",
      "status.project.portable.missing": "Đã mở dự án di động nhưng thiếu các tệp sau: {countLabel}.",
      "status.project.json.missing": "Đã mở dự án JSON. Chưa liên kết: {countLabel}. Hãy dùng gói di động hoặc liên kết lại các tệp.",
      "tour.step.progress": "Bước {current}/{total}",
      "export.range.progress": "Đang xuất đoạn {start}–{end} giây…",
      "status.media.arranged": "Đã sắp xếp theo số thứ tự tệp: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Chọn “Liên kết lại tệp” để khôi phục liên kết phương tiện.",
      "profile.project.summary": "Dự án: {width} × {height} pixel, {aspect}, {fps} fps.",
      "status.export.completed": "Hoàn tất: {file} ({size}; đoạn {start}–{end} giây).",
      "slideshow.photos.heading": "Ảnh ({count})",
      "status.clip.nudged": "Đã di chuyển clip {countLabel} về phía {direction}.",
      "status.media.import.failed": "Không thể nhập “{file}”: {error}",
      "dialog.frame.save.title": "Lưu khung hình hiện tại",
      "dialog.frame.filter.png": "Ảnh PNG",
      "dialog.frame.filter.jpeg": "Ảnh JPEG",
      "clip.speed.label": "Tốc độ",
      "clip.speed.tooltip": "Tốc độ phát của đoạn video đã chọn"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "id": {
    "mediaFile": {
      "one": "file media",
      "other": "file media"
    },
    "clip": {
      "one": "klip",
      "other": "klip"
    },
    "frame": {
      "one": "bingkai",
      "other": "bingkai"
    },
    "messages": {
      "status.media.imported": "Diimpor: {countLabel}.",
      "status.media.missing": "Tidak ditemukan: {countLabel}.",
      "status.media.relinked": "File media yang dipulihkan: {restored} dari {total}.",
      "status.project.portable.saved": "Proyek portabel disimpan: {countLabel}, {size}. Video dan audio disertakan.",
      "status.project.portable.opened": "Proyek portabel dibuka. Terhubung: {countLabel}.",
      "status.project.portable.missing": "Proyek portabel dibuka, tetapi file berikut tidak ditemukan: {countLabel}.",
      "status.project.json.missing": "Proyek JSON dibuka. Belum ditautkan: {countLabel}. Gunakan paket portabel atau tautkan ulang file.",
      "tour.step.progress": "Langkah {current} dari {total}",
      "export.range.progress": "Mengekspor segmen {start}–{end} d…",
      "status.media.arranged": "Diurutkan berdasarkan nomor berkas: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Pilih “Tautkan Ulang Berkas” untuk memulihkan tautan media.",
      "profile.project.summary": "Proyek: {width} × {height} piksel, {aspect}, {fps} fps.",
      "status.export.completed": "Selesai: {file} ({size}; rentang {start}–{end} dtk).",
      "slideshow.photos.heading": "Foto ({count})",
      "status.clip.nudged": "Klip digeser {countLabel} ke {direction}.",
      "status.media.import.failed": "Tidak dapat mengimpor “{file}”: {error}",
      "dialog.frame.save.title": "Simpan bingkai saat ini",
      "dialog.frame.filter.png": "Gambar PNG",
      "dialog.frame.filter.jpeg": "Gambar JPEG",
      "clip.speed.label": "Kecepatan",
      "clip.speed.tooltip": "Kecepatan pemutaran klip video yang dipilih"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "th": {
    "mediaFile": {
      "other": "ไฟล์สื่อ",
      "one": "ไฟล์สื่อ"
    },
    "clip": {
      "other": "คลิป",
      "one": "คลิป"
    },
    "frame": {
      "other": "เฟรม",
      "one": "เฟรม"
    },
    "messages": {
      "status.media.imported": "นำเข้าแล้ว: {countLabel}.",
      "status.media.missing": "ไฟล์ที่ขาดหาย: {countLabel}.",
      "status.media.relinked": "ไฟล์สื่อที่เชื่อมโยงใหม่: {restored} จาก {total}.",
      "status.project.portable.saved": "บันทึกโปรเจกต์แบบพกพาแล้ว: {countLabel}, {size} รวมวิดีโอและเสียง",
      "status.project.portable.opened": "เปิดโปรเจกต์แบบพกพาแล้ว เชื่อมโยงแล้ว: {countLabel}.",
      "status.project.portable.missing": "เปิดโปรเจกต์แบบพกพาแล้ว แต่ขาดไฟล์ต่อไปนี้: {countLabel}.",
      "status.project.json.missing": "เปิดโปรเจกต์ JSON แล้ว ยังไม่ได้เชื่อมโยง: {countLabel} ใช้แพ็กเกจแบบพกพาหรือเชื่อมโยงไฟล์อีกครั้ง",
      "tour.step.progress": "ขั้นตอนที่ {current} จาก {total}",
      "export.range.progress": "กำลังส่งออกช่วง {start}–{end} วินาที…",
      "status.media.arranged": "จัดเรียงตามหมายเลขไฟล์แล้ว: {countLabel} · {duration}",
      "status.media.relink.instruction": "เลือก “เชื่อมโยงไฟล์อีกครั้ง” เพื่อกู้คืนลิงก์สื่อ",
      "profile.project.summary": "โปรเจกต์: {width} × {height} พิกเซล, {aspect}, {fps} fps",
      "status.export.completed": "เสร็จแล้ว: {file} ({size}; ช่วง {start}–{end} วินาที)",
      "slideshow.photos.heading": "รูปภาพ ({count})",
      "status.clip.nudged": "เลื่อนคลิป {countLabel} ไปทาง{direction}แล้ว",
      "status.media.import.failed": "นำเข้า “{file}” ไม่สำเร็จ: {error}",
      "dialog.frame.save.title": "บันทึกเฟรมปัจจุบัน",
      "dialog.frame.filter.png": "รูปภาพ PNG",
      "dialog.frame.filter.jpeg": "รูปภาพ JPEG",
      "clip.speed.label": "ความเร็ว",
      "clip.speed.tooltip": "ความเร็วในการเล่นคลิปวิดีโอที่เลือก"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {}
    }
  },
  "kk": {
    "mediaFile": {
      "one": "медиафайл",
      "other": "медиафайл"
    },
    "clip": {
      "one": "клип",
      "other": "клип"
    },
    "frame": {
      "one": "кадр",
      "other": "кадр"
    },
    "messages": {
      "status.media.imported": "Импортталды: {countLabel}.",
      "status.media.missing": "Жетіспейді: {countLabel}.",
      "status.media.relinked": "Қайта байланыстырылған медиафайлдар: {restored}/{total}.",
      "status.project.portable.saved": "Тасымалды жоба сақталды: {countLabel}, {size}. Бейне мен аудио қамтылған.",
      "status.project.portable.opened": "Тасымалды жоба ашылды. Байланыстырылды: {countLabel}.",
      "status.project.portable.missing": "Тасымалды жоба ашылды, бірақ мына файлдар жоқ: {countLabel}.",
      "status.project.json.missing": "JSON жобасы ашылды. Байланыстырылмаған: {countLabel}. Тасымалды буманы пайдаланыңыз немесе файлдарды қайта байланыстырыңыз.",
      "tour.step.progress": "{total} ішіндегі {current}-қадам",
      "export.range.progress": "{start}–{end} с аралығы экспортталуда…",
      "status.media.arranged": "Файл нөмірлері бойынша реттелді: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Медиа сілтемелерін қалпына келтіру үшін «Файлдарды қайта байланыстыру» пәрменін таңдаңыз.",
      "profile.project.summary": "Жоба: {width} × {height} пиксель, {aspect}, {fps} кадр/с.",
      "status.export.completed": "Дайын: {file} ({size}; {start}–{end} с аралығы).",
      "slideshow.photos.heading": "Фотосуреттер ({count})",
      "status.clip.nudged": "Клип {countLabel} {direction} жылжытылды.",
      "status.media.import.failed": "«{file}» файлын импорттау мүмкін болмады: {error}",
      "dialog.frame.save.title": "Ағымдағы кадрды сақтау",
      "dialog.frame.filter.png": "PNG кескіні",
      "dialog.frame.filter.jpeg": "JPEG кескіні",
      "clip.speed.label": "Жылдамдық",
      "clip.speed.tooltip": "Таңдалған бейне клиптің ойнату жылдамдығы"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "файлдың",
          "other": "файлдардың"
        },
        "clip": {
          "one": "клиптің",
          "other": "клиптердің"
        },
        "frame": {
          "one": "кадрдың",
          "other": "кадрлардың"
        }
      }
    }
  },
  "uz": {
    "mediaFile": {
      "one": "mediafayl",
      "other": "mediafayl"
    },
    "clip": {
      "one": "klip",
      "other": "klip"
    },
    "frame": {
      "one": "kadr",
      "other": "kadr"
    },
    "messages": {
      "status.media.imported": "Import qilindi: {countLabel}.",
      "status.media.missing": "Topilmadi: {countLabel}.",
      "status.media.relinked": "Qayta bog‘langan mediafayllar: {restored}/{total}.",
      "status.project.portable.saved": "Portativ loyiha saqlandi: {countLabel}, {size}. Video va audio ham qo‘shilgan.",
      "status.project.portable.opened": "Portativ loyiha ochildi. Ulangan: {countLabel}.",
      "status.project.portable.missing": "Portativ loyiha ochildi, ammo quyidagi fayllar topilmadi: {countLabel}.",
      "status.project.json.missing": "JSON loyiha ochildi. Ulanmagan: {countLabel}. Portativ paketdan foydalaning yoki fayllarni qayta ulang.",
      "tour.step.progress": "{total} tadan {current}-qadam",
      "export.range.progress": "{start}–{end} soniya oralig‘i eksport qilinmoqda…",
      "status.media.arranged": "Fayl raqamlari bo‘yicha tartiblandi: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Media havolalarini tiklash uchun “Fayllarni qayta ulash”ni tanlang.",
      "profile.project.summary": "Loyiha: {width} × {height} piksel, {aspect}, {fps} fps.",
      "status.export.completed": "Tayyor: {file} ({size}; {start}–{end} s oralig‘i).",
      "slideshow.photos.heading": "Suratlar ({count})",
      "status.clip.nudged": "Klip {countLabel} {direction} surildi.",
      "status.media.import.failed": "“{file}” faylini import qilib bo‘lmadi: {error}",
      "dialog.frame.save.title": "Joriy kadrni saqlash",
      "dialog.frame.filter.png": "PNG tasvir",
      "dialog.frame.filter.jpeg": "JPEG tasvir",
      "clip.speed.label": "Tezlik",
      "clip.speed.tooltip": "Tanlangan video klipining ijro tezligi"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "faylning",
          "other": "fayllarning"
        },
        "clip": {
          "one": "klipning",
          "other": "kliplarning"
        },
        "frame": {
          "one": "kadrning",
          "other": "kadrlarning"
        }
      }
    }
  },
  "uz-Cyrl": {
    "mediaFile": {
      "one": "медиафайл",
      "other": "медиафайл"
    },
    "clip": {
      "one": "клип",
      "other": "клип"
    },
    "frame": {
      "one": "кадр",
      "other": "кадр"
    },
    "messages": {
      "status.media.imported": "Импорт қилинди: {countLabel}.",
      "status.media.missing": "Топилмади: {countLabel}.",
      "status.media.relinked": "Қайта боғланган медиафайллар: {restored}/{total}.",
      "status.project.portable.saved": "Портатив лойиҳа сақланди: {countLabel}, {size}. Видео ва аудио ҳам киритилган.",
      "status.project.portable.opened": "Портатив лойиҳа очилди. Уланган: {countLabel}.",
      "status.project.portable.missing": "Портатив лойиҳа очилди, аммо қуйидаги файллар топилмади: {countLabel}.",
      "status.project.json.missing": "JSON лойиҳа очилди. Уланмаган: {countLabel}. Портатив пакетдан фойдаланинг ёки файлларни қайта уланг.",
      "tour.step.progress": "{total} тадан {current}-қадам",
      "export.range.progress": "{start}–{end} сония оралиғи экспорт қилинмоқда…",
      "status.media.arranged": "Файл рақамлари бўйича тартибланди: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Медиа ҳаволаларини тиклаш учун «Файлларни қайта улаш»ни танланг.",
      "profile.project.summary": "Лойиҳа: {width} × {height} пиксел, {aspect}, {fps} fps.",
      "status.export.completed": "Тайёр: {file} ({size}; {start}–{end} с оралиғи).",
      "slideshow.photos.heading": "Суратлар ({count})",
      "status.clip.nudged": "Клип {countLabel} {direction} сурилди.",
      "status.media.import.failed": "«{file}» файлини импорт қилиб бўлмади: {error}",
      "dialog.frame.save.title": "Жорий кадрни сақлаш",
      "dialog.frame.filter.png": "PNG тасвир",
      "dialog.frame.filter.jpeg": "JPEG тасвир",
      "clip.speed.label": "Тезлик",
      "clip.speed.tooltip": "Танланган видео клипининг ижро тезлиги"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "файлнинг",
          "other": "файлларнинг"
        },
        "clip": {
          "one": "клипнинг",
          "other": "клипларнинг"
        },
        "frame": {
          "one": "кадрнинг",
          "other": "кадрларнинг"
        }
      }
    }
  },
  "ka": {
    "mediaFile": {
      "one": "მედია ფაილი",
      "other": "მედია ფაილი"
    },
    "clip": {
      "one": "კლიპი",
      "other": "კლიპი"
    },
    "frame": {
      "one": "კადრი",
      "other": "კადრი"
    },
    "messages": {
      "status.media.imported": "იმპორტირებულია: {countLabel}.",
      "status.media.missing": "აკლია: {countLabel}.",
      "status.media.relinked": "აღდგენილი მედია ფაილები: {restored}/{total}.",
      "status.project.portable.saved": "პორტატიული პროექტი შენახულია: {countLabel}, {size}. ვიდეო და აუდიო შეტანილია.",
      "status.project.portable.opened": "პორტატიული პროექტი გაიხსნა. დაკავშირებულია: {countLabel}.",
      "status.project.portable.missing": "პორტატიული პროექტი გაიხსნა, თუმცა აკლია ფაილები: {countLabel}.",
      "status.project.json.missing": "JSON პროექტი გაიხსნა. დაუკავშირებელია: {countLabel}. გამოიყენეთ პორტატიული პაკეტი ან ხელახლა დააკავშირეთ ფაილები.",
      "tour.step.progress": "ნაბიჯი {current} / {total}",
      "export.range.progress": "მონაკვეთის {start}–{end} წმ. ექსპორტი…",
      "status.media.arranged": "ფაილების ნომრების მიხედვით დალაგდა: {countLabel} · {duration}.",
      "status.media.relink.instruction": "მედია-ბმულების აღსადგენად აირჩიეთ „ფაილების ხელახლა მიბმა“.",
      "profile.project.summary": "პროექტი: {width} × {height} პიქსელი, {aspect}, {fps} fps.",
      "status.export.completed": "დასრულდა: {file} ({size}; მონაკვეთი {start}–{end} წმ).",
      "slideshow.photos.heading": "ფოტოები ({count})",
      "status.clip.nudged": "კლიპი {countLabel}-ით {direction}-ით გადაიწია.",
      "status.media.import.failed": "„{file}“-ის იმპორტი ვერ მოხერხდა: {error}",
      "dialog.frame.save.title": "მიმდინარე კადრის შენახვა",
      "dialog.frame.filter.png": "PNG სურათი",
      "dialog.frame.filter.jpeg": "JPEG სურათი",
      "clip.speed.label": "სიჩქარე",
      "clip.speed.tooltip": "არჩეული ვიდეოკლიპის დაკვრის სიჩქარე"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "ფაილის",
          "other": "ფაილების"
        },
        "clip": {
          "one": "კლიპის",
          "other": "კლიპების"
        },
        "frame": {
          "one": "კადრის",
          "other": "კადრების"
        }
      }
    }
  },
  "hy": {
    "mediaFile": {
      "one": "մեդիաֆայլ",
      "other": "մեդիաֆայլ"
    },
    "clip": {
      "one": "հոլովակ",
      "other": "հոլովակ"
    },
    "frame": {
      "one": "կադր",
      "other": "կադր"
    },
    "messages": {
      "status.media.imported": "Ներմուծվել է՝ {countLabel}:",
      "status.media.missing": "Բացակայում է՝ {countLabel}:",
      "status.media.relinked": "Վերականգնված մեդիաֆայլեր՝ {restored}/{total}:",
      "status.project.portable.saved": "Դյուրակիր նախագիծը պահպանվել է՝ {countLabel}, {size}: Ներառված են տեսանյութն ու ձայնը:",
      "status.project.portable.opened": "Դյուրակիր նախագիծը բացվել է: Կապակցված է՝ {countLabel}:",
      "status.project.portable.missing": "Դյուրակիր նախագիծը բացվել է, սակայն բացակայում են ֆայլերը՝ {countLabel}:",
      "status.project.json.missing": "JSON նախագիծը բացվել է: Չկապակցված է՝ {countLabel}: Օգտագործեք դյուրակիր փաթեթ կամ վերականգնեք ֆայլերի կապերը:",
      "tour.step.progress": "Քայլ {current} / {total}",
      "export.range.progress": "Արտահանվում է {start}–{end} վրկ հատվածը…",
      "status.media.arranged": "Դասավորվել է ըստ ֆայլերի համարների՝ {countLabel} · {duration}։",
      "status.media.relink.instruction": "Մեդիաֆայլերի հղումները վերականգնելու համար ընտրեք «Կրկին կապել ֆայլերը»։",
      "profile.project.summary": "Նախագիծ՝ {width} × {height} պիքսել, {aspect}, {fps} կադր/վրկ։",
      "status.export.completed": "Ավարտված է՝ {file} ({size}, հատված՝ {start}–{end} վրկ)։",
      "slideshow.photos.heading": "Լուսանկարներ ({count})",
      "status.clip.nudged": "Հոլովակը տեղափոխվել է {countLabel} դեպի {direction}։",
      "status.media.import.failed": "Չհաջողվեց ներմուծել «{file}»՝ {error}",
      "dialog.frame.save.title": "Պահպանել ընթացիկ կադրը",
      "dialog.frame.filter.png": "PNG պատկեր",
      "dialog.frame.filter.jpeg": "JPEG պատկեր",
      "clip.speed.label": "Արագություն",
      "clip.speed.tooltip": "Ընտրված տեսահոլովակի նվագարկման արագությունը"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "ֆայլի",
          "other": "ֆայլերի"
        },
        "clip": {
          "one": "հոլովակի",
          "other": "հոլովակների"
        },
        "frame": {
          "one": "կադրի",
          "other": "կադրերի"
        }
      }
    }
  },
  "tk": {
    "mediaFile": {
      "one": "media faýly",
      "other": "media faýly"
    },
    "clip": {
      "one": "klip",
      "other": "klip"
    },
    "frame": {
      "one": "kadr",
      "other": "kadr"
    },
    "messages": {
      "status.media.imported": "Import edildi: {countLabel}.",
      "status.media.missing": "Ýok: {countLabel}.",
      "status.media.relinked": "Täzeden baglanan media faýllary: {restored}/{total}.",
      "status.project.portable.saved": "Göçme taslama saklandy: {countLabel}, {size}. Wideo we audio goşuldy.",
      "status.project.portable.opened": "Göçme taslama açyldy. Baglanan: {countLabel}.",
      "status.project.portable.missing": "Göçme taslama açyldy, emma şu faýllar ýok: {countLabel}.",
      "status.project.json.missing": "JSON taslama açyldy. Baglanmadyk: {countLabel}. Göçme bukjany ulanyň ýa-da faýllary täzeden baglaň.",
      "tour.step.progress": "{total} sanynyň {current}-nji ädimi",
      "export.range.progress": "{start}–{end} s aralygy eksport edilýär…",
      "status.media.arranged": "Faýl belgilerine görä tertiplendi: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Media baglanyşyklaryny dikeltmek üçin “Faýllary täzeden bagla” saýlaň.",
      "profile.project.summary": "Taslama: {width} × {height} piksel, {aspect}, {fps} fps.",
      "status.export.completed": "Taýýar: {file} ({size}; {start}–{end} s aralygy).",
      "slideshow.photos.heading": "Suratlar ({count})",
      "status.clip.nudged": "Klip {countLabel} {direction} süýşürildi.",
      "status.media.import.failed": "“{file}” faýly import edilmedi: {error}",
      "dialog.frame.save.title": "Häzirki kadry sakla",
      "dialog.frame.filter.png": "PNG şekili",
      "dialog.frame.filter.jpeg": "JPEG şekili",
      "clip.speed.label": "Tizlik",
      "clip.speed.tooltip": "Saýlanan wideo klipiň görkeziliş tizligi"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "faýlyň",
          "other": "faýllaryň"
        },
        "clip": {
          "one": "klipiň",
          "other": "klipleriň"
        },
        "frame": {
          "one": "kadryň",
          "other": "kadrlaryň"
        }
      }
    }
  },
  "az": {
    "mediaFile": {
      "one": "media faylı",
      "other": "media faylı"
    },
    "clip": {
      "one": "klip",
      "other": "klip"
    },
    "frame": {
      "one": "kadr",
      "other": "kadr"
    },
    "messages": {
      "status.media.imported": "İdxal edildi: {countLabel}.",
      "status.media.missing": "Çatışmır: {countLabel}.",
      "status.media.relinked": "Yenidən əlaqələndirilən media faylları: {restored}/{total}.",
      "status.project.portable.saved": "Portativ layihə saxlanıldı: {countLabel}, {size}. Video və audio daxildir.",
      "status.project.portable.opened": "Portativ layihə açıldı. Əlaqələndirildi: {countLabel}.",
      "status.project.portable.missing": "Portativ layihə açıldı, lakin bu fayllar çatışmır: {countLabel}.",
      "status.project.json.missing": "JSON layihəsi açıldı. Əlaqələndirilməyib: {countLabel}. Portativ paketdən istifadə edin və ya faylları yenidən əlaqələndirin.",
      "tour.step.progress": "{total} addımdan {current}-ci addım",
      "export.range.progress": "{start}–{end} s aralığı ixrac edilir…",
      "status.media.arranged": "Fayl nömrələnməsinə görə sıralandı: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Media bağlantılarını bərpa etmək üçün “Faylları yenidən bağla” seçin.",
      "profile.project.summary": "Layihə: {width} × {height} piksel, {aspect}, {fps} fps.",
      "status.export.completed": "Tamamlandı: {file} ({size}; {start}–{end} s aralığı).",
      "slideshow.photos.heading": "Fotolar ({count})",
      "status.clip.nudged": "Klip {countLabel} {direction} köçürüldü.",
      "status.media.import.failed": "“{file}” faylını idxal etmək mümkün olmadı: {error}",
      "dialog.frame.save.title": "Cari kadrı saxla",
      "dialog.frame.filter.png": "PNG şəkli",
      "dialog.frame.filter.jpeg": "JPEG şəkli",
      "clip.speed.label": "Sürət",
      "clip.speed.tooltip": "Seçilmiş video klipinin oynatma sürəti"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "faylın",
          "other": "faylların"
        },
        "clip": {
          "one": "klipin",
          "other": "kliplərin"
        },
        "frame": {
          "one": "kadrın",
          "other": "kadrların"
        }
      }
    }
  },
  "ky": {
    "mediaFile": {
      "one": "медиафайл",
      "other": "медиафайл"
    },
    "clip": {
      "one": "клип",
      "other": "клип"
    },
    "frame": {
      "one": "кадр",
      "other": "кадр"
    },
    "messages": {
      "status.media.imported": "Импорттолду: {countLabel}.",
      "status.media.missing": "Жок: {countLabel}.",
      "status.media.relinked": "Кайра туташтырылган медиафайлдар: {restored}/{total}.",
      "status.project.portable.saved": "Көчмө долбоор сакталды: {countLabel}, {size}. Видео жана аудио кошулган.",
      "status.project.portable.opened": "Көчмө долбоор ачылды. Туташтырылды: {countLabel}.",
      "status.project.portable.missing": "Көчмө долбоор ачылды, бирок төмөнкү файлдар жок: {countLabel}.",
      "status.project.json.missing": "JSON долбоору ачылды. Туташтырылбаган: {countLabel}. Көчмө топтомду колдонуңуз же файлдарды кайра туташтырыңыз.",
      "tour.step.progress": "{total} ичинен {current}-кадам",
      "export.range.progress": "{start}–{end} с аралыгы экспорттолууда…",
      "status.media.arranged": "Файл номерлери боюнча иреттелди: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Медиа шилтемелерин калыбына келтирүү үчүн «Файлдарды кайра байланыштыруу» баскычын тандаңыз.",
      "profile.project.summary": "Долбоор: {width} × {height} пиксель, {aspect}, {fps} кадр/с.",
      "status.export.completed": "Даяр: {file} ({size}; {start}–{end} с аралыгы).",
      "slideshow.photos.heading": "Сүрөттөр ({count})",
      "status.clip.nudged": "Клип {countLabel} {direction} жылдырылды.",
      "status.media.import.failed": "«{file}» файлын импорттоо мүмкүн болгон жок: {error}",
      "dialog.frame.save.title": "Учурдагы кадрды сактоо",
      "dialog.frame.filter.png": "PNG сүрөтү",
      "dialog.frame.filter.jpeg": "JPEG сүрөтү",
      "clip.speed.label": "Ылдамдык",
      "clip.speed.tooltip": "Тандалган видео клиптин ойнотуу ылдамдыгы"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "файлдын",
          "other": "файлдардын"
        },
        "clip": {
          "one": "клиптин",
          "other": "клиптердин"
        },
        "frame": {
          "one": "кадрдын",
          "other": "кадрлардын"
        }
      }
    }
  },
  "tg": {
    "mediaFile": {
      "one": "файли медиа",
      "other": "файли медиа"
    },
    "clip": {
      "one": "клип",
      "other": "клип"
    },
    "frame": {
      "one": "кадр",
      "other": "кадр"
    },
    "messages": {
      "status.media.imported": "Ворид шуд: {countLabel}.",
      "status.media.missing": "Намерасад: {countLabel}.",
      "status.media.relinked": "Файлҳои медиаи барқароршуда: {restored} аз {total}.",
      "status.project.portable.saved": "Лоиҳаи сайёр нигоҳ дошта шуд: {countLabel}, {size}. Видео ва аудио дохиланд.",
      "status.project.portable.opened": "Лоиҳаи сайёр кушода шуд. Пайваст шуд: {countLabel}.",
      "status.project.portable.missing": "Лоиҳаи сайёр кушода шуд, аммо ин файлҳо намерасанд: {countLabel}.",
      "status.project.json.missing": "Лоиҳаи JSON кушода шуд. Пайваст нашудааст: {countLabel}. Бастаи сайёрро истифода баред ё файлҳоро аз нав пайваст кунед.",
      "tour.step.progress": "Қадами {current} аз {total}",
      "export.range.progress": "Содироти қисми {start}–{end} сония…",
      "status.media.arranged": "Аз рӯи рақамгузории файлҳо ҷойгир карда шуд: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Барои барқарор кардани пайвандҳои медиа «Аз нав пайваст кардани файлҳо»-ро интихоб кунед.",
      "profile.project.summary": "Лоиҳа: {width} × {height} пиксел, {aspect}, {fps} fps.",
      "status.export.completed": "Тайёр: {file} ({size}; фосилаи {start}–{end} с).",
      "slideshow.photos.heading": "Аксҳо ({count})",
      "status.clip.nudged": "Клип ба {countLabel} ба самти {direction} кӯчонида шуд.",
      "status.media.import.failed": "Ворид кардани «{file}» муяссар нашуд: {error}",
      "dialog.frame.save.title": "Захира кардани кадри ҷорӣ",
      "dialog.frame.filter.png": "Тасвири PNG",
      "dialog.frame.filter.jpeg": "Тасвири JPEG",
      "clip.speed.label": "Суръат",
      "clip.speed.tooltip": "Суръати пахши клипи видеоии интихобшуда"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "файли",
          "other": "файлҳои"
        },
        "clip": {
          "one": "клипи",
          "other": "клипҳои"
        },
        "frame": {
          "one": "кадри",
          "other": "кадрҳои"
        }
      }
    }
  },
  "be": {
    "mediaFile": {
      "one": "медыяфайл",
      "few": "медыяфайлы",
      "many": "медыяфайлаў",
      "other": "медыяфайла"
    },
    "clip": {
      "one": "кліп",
      "few": "кліпы",
      "many": "кліпаў",
      "other": "кліпа"
    },
    "frame": {
      "one": "кадр",
      "few": "кадры",
      "many": "кадраў",
      "other": "кадра"
    },
    "messages": {
      "status.media.imported": "Імпартавана: {countLabel}.",
      "status.media.missing": "Адсутнічаюць: {countLabel}.",
      "status.media.relinked": "Аднаўлена медыяфайлаў: {restored} з {total}.",
      "status.project.portable.saved": "Партатыўны праект захаваны: {countLabel}, {size}. Відэа і аўдыя ўключаны.",
      "status.project.portable.opened": "Партатыўны праект адкрыты. Падключана: {countLabel}.",
      "status.project.portable.missing": "Партатыўны праект адкрыты, але адсутнічаюць файлы: {countLabel}.",
      "status.project.json.missing": "JSON-праект адкрыты. Не падключана: {countLabel}. Выкарыстайце партатыўны пакет або аднавіце сувязі з файламі.",
      "tour.step.progress": "Крок {current} з {total}",
      "export.range.progress": "Экспарт фрагмента {start}–{end} с…",
      "status.media.arranged": "Расстаўлена паводле нумарацыі: {countLabel} · {duration}.",
      "status.media.relink.instruction": "Націсніце «Падключыць файлы», каб аднавіць сувязі з медыяфайламі.",
      "profile.project.summary": "Праект: {width} × {height} пікселяў, {aspect}, {fps} кадр/с.",
      "status.export.completed": "Гатова: {file} ({size}; фрагмент {start}–{end} с).",
      "slideshow.photos.heading": "Фатаграфіі ({count})",
      "status.clip.nudged": "Кліп зрушаны на {countLabel} {direction}.",
      "status.media.import.failed": "Не ўдалося імпартаваць «{file}»: {error}",
      "dialog.frame.save.title": "Захаваць бягучы кадр",
      "dialog.frame.filter.png": "Выява PNG",
      "dialog.frame.filter.jpeg": "Выява JPEG",
      "clip.speed.label": "Хуткасць",
      "clip.speed.tooltip": "Хуткасць прайгравання выбранага відэакліпа"
    },
    "reviewStatus": "machine-assisted-draft-native-speaker-review-pending",
    "cases": {
      "genitive": {
        "mediaFile": {
          "one": "файла",
          "few": "файлаў",
          "many": "файлаў",
          "other": "файла"
        },
        "clip": {
          "one": "кліпа",
          "few": "кліпаў",
          "many": "кліпаў",
          "other": "кліпа"
        },
        "frame": {
          "one": "кадра",
          "few": "кадраў",
          "many": "кадраў",
          "other": "кадра"
        }
      }
    }
  }
};
  root.MontazhnayaSemanticCatalog = Object.freeze(catalog);
})(window);
