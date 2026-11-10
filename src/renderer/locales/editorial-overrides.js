(function (root) {
  "use strict";

  // Stage 8 editorial pass 1. These are targeted terminology corrections,
  // not a claim of native-speaker certification for the complete locale pack.
  const corrections = {
  "de": {
    "Ripple-удалить": "Löschen und Lücke schließen",
    "Титры поверх клипа": "Texteinblendungen",
    "Отделить звук на аудиодорожку": "Audio auf eine separate Spur legen"
  },
  "fr": {
    "Таймлайн": "Chronologie",
    "Ripple-удалить": "Supprimer en refermant l’espace",
    "Титры поверх клипа": "Titres superposés au clip"
  },
  "es": {
    "Ripple-удалить": "Eliminar y cerrar el hueco",
    "Титры поверх клипа": "Títulos superpuestos al clip"
  },
  "pt-BR": {
    "Ripple-удалить": "Excluir e fechar o espaço",
    "Прилипание": "Ajuste magnético",
    "Титры поверх клипа": "Textos sobrepostos ao clipe",
    "Восстановить медиафайлы…": "Vincular arquivos de mídia novamente…"
  },
  "it": {
    "Ripple-удалить": "Elimina e chiudi lo spazio",
    "Титры поверх клипа": "Titoli sovrapposti alla clip"
  },
  "pl": {
    "Ripple-удалить": "Usuń, zamykając lukę",
    "Титры поверх клипа": "Teksty na klipie"
  },
  "uk": {
    "Ripple-удалить": "Видалити із закриттям проміжку",
    "Титры поверх клипа": "Титри поверх кліпу"
  },
  "tr": {
    "Видеодорожка": "Video kanalı",
    "Ripple-удалить": "Boşluğu kapatarak sil",
    "Прилипание": "Mıknatıslama",
    "Титры поверх клипа": "Klip üzerine metin",
    "Отделить звук на аудиодорожку": "Sesi ayrı bir ses kanalına ayır"
  },
  "zh-CN": {
    "Титры поверх клипа": "片段文字叠加"
  },
  "zh-TW": {
    "Титры поверх клипа": "片段文字疊加"
  },
  "ja": {
    "Титры поверх клипа": "クリップ上のテキスト"
  },
  "ko": {
    "Титры поверх клипа": "클립 위 텍스트"
  },
  "ar": {
    "Ripple-удалить": "حذف مع إغلاق الفجوة",
    "Прилипание": "محاذاة مغناطيسية",
    "Титры поверх клипа": "نصوص فوق المقطع"
  },
  "he": {
    "Ripple-удалить": "מחיקה תוך סגירת הרווח",
    "Титры поверх клипа": "טקסט על גבי הקליפ"
  },
  "hi": {
    "Ripple-удалить": "खाली जगह बंद करके हटाएँ",
    "Прилипание": "चुंबकीय संरेखण",
    "Титры поверх клипа": "क्लिप पर टेक्स्ट"
  },
  "nl": {
    "Ripple-удалить": "Verwijderen en de ruimte sluiten",
    "Титры поверх клипа": "Tekst op de clip"
  },
  "sv": {
    "Ripple-удалить": "Ta bort och stäng mellanrummet",
    "Прилипание": "Magnetisk justering",
    "Титры поверх клипа": "Text ovanpå klippet"
  },
  "fi": {
    "Ripple-удалить": "Poista ja sulje aukko",
    "Разрешение проекта": "Projektin resoluutio",
    "Разрешение": "Resoluutio",
    "Прилипание": "Magneettinen kohdistus",
    "Титры поверх клипа": "Teksti leikkeen päällä"
  },
  "cs": {
    "Видеодорожка": "Video stopa",
    "Ripple-удалить": "Smazat a uzavřít mezeru",
    "Титры поверх клипа": "Text přes klip"
  },
  "ro": {
    "Ripple-удалить": "Șterge și închide spațiul",
    "Разделить на курсоре": "Divizează la cursorul de redare",
    "Титры поверх клипа": "Text suprapus peste clip"
  },
  "el": {
    "Ripple-удалить": "Διαγραφή με κλείσιμο του κενού",
    "Титры поверх клипа": "Κείμενο πάνω στο κλιπ"
  },
  "vi": {
    "Ripple-удалить": "Xóa và khép khoảng trống",
    "Прилипание": "Căn chỉnh từ tính",
    "Титры поверх клипа": "Văn bản phủ lên clip"
  },
  "id": {
    "Ripple-удалить": "Hapus sambil menutup celah",
    "Прилипание": "Penyelarasan magnetis",
    "Титры поверх клипа": "Teks di atas klip"
  },
  "th": {
    "Ripple-удалить": "ลบพร้อมปิดช่องว่าง",
    "Прилипание": "จัดแนวแบบแม่เหล็ก",
    "Титры поверх клипа": "ข้อความซ้อนทับบนคลิป"
  },
  "kk": {
    "Ripple-удалить": "Аралықты жауып жою",
    "Титры поверх клипа": "Клип үстіндегі мәтін"
  },
  "uz": {
    "Ripple-удалить": "Bo‘shliqni yopib o‘chirish",
    "Разрешение проекта": "Loyiha tasvir o‘lchami",
    "Разрешение": "Tasvir o‘lchami",
    "Прилипание": "Magnitli tekislash",
    "Титры поверх клипа": "Klip ustidagi matn",
    "Отделить звук на аудиодорожку": "Audioni alohida audio trekka ajratish",
    "Таймлайн": "Vaqt chizig‘i"
  },
  "uz-Cyrl": {
    "Ripple-удалить": "Бўшлиқни ёпиб ўчириш",
    "Разрешение проекта": "Лойиҳа тасвир ўлчами",
    "Разрешение": "Тасвир ўлчами",
    "Прилипание": "Магнитли текислаш",
    "Титры поверх клипа": "Клип устидаги матн",
    "Отделить звук на аудиодорожку": "Аудиони алоҳида аудио трекка ажратиш",
    "Таймлайн": "Вақт чизиғи"
  },
  "ka": {
    "Таймлайн": "დროითი ხაზი",
    "Ripple-удалить": "წაშლა სიცარიელის დახურვით",
    "Прилипание": "მაგნიტური გასწორება",
    "Титры поверх клипа": "კლიპზე დასატანი ტექსტი"
  },
  "hy": {
    "Видеодорожка": "Տեսանյութի շերտ",
    "Ripple-удалить": "Ջնջել՝ փակելով բացը",
    "Разрешение проекта": "Նախագծի լուծաչափ",
    "Разрешение": "Լուծաչափ",
    "Прилипание": "Մագնիսական հավասարեցում",
    "Титры поверх клипа": "Տեքստ հոլովակի վրա"
  },
  "tk": {
    "Ripple-удалить": "Aralygy ýapyp pozmak",
    "Разрешение проекта": "Taslamanyň şekil ölçegi",
    "Разрешение": "Şekil ölçegi",
    "Титры поверх клипа": "Klipiň üstündäki tekst"
  },
  "az": {
    "Видеодорожка": "Video treki",
    "Ripple-удалить": "Boşluğu bağlayaraq sil",
    "Разрешение": "Təsvir ölçüsü",
    "Прилипание": "Maqnitlə düzləndirmə",
    "Титры поверх клипа": "Klip üzərində mətn",
    "Отделить звук на аудиодорожку": "Səsi ayrıca audio trekinə ayır"
  },
  "ky": {
    "Таймлайн": "Убакыт тилкеси",
    "Видеодорожка": "Видео тилкеси",
    "Ripple-удалить": "Боштукту жаап өчүрүү",
    "Разрешение проекта": "Долбоордун сүрөт чечилиши",
    "Разрешение": "Сүрөттүн чечилиши",
    "Прилипание": "Магниттик тегиздөө",
    "Титры поверх клипа": "Клип үстүндөгү текст",
    "Связать видео и аудио": "Видео менен аудиону байланыштыруу"
  },
  "tg": {
    "Таймлайн": "Ҷадвали вақт",
    "Видеодорожка": "Роҳи видеоӣ",
    "Ripple-удалить": "Нест кардан бо бастани фосила",
    "Разрешение проекта": "Ҳалнокии тасвири лоиҳа",
    "Разрешение": "Ҳалнокии тасвир",
    "Прилипание": "Ҳамворкунии магнитӣ",
    "Титры поверх клипа": "Матн дар болои клип"
  },
  "be": {
    "Таймлайн": "Шкала часу",
    "Ripple-удалить": "Выдаліць, закрыўшы прамежак",
    "Титры поверх клипа": "Тэкст па-над кліпам"
  }
};

  const stage9Corrections = {
    "fi": {
      "Кадр": "Ruutu",
      "Кадров": "Ruutua",
      "кадр № ": "Ruudun nro "
    },
    "id": {
      "Видеодорожка": "Jalur video",
      "Дорожка": "Jalur",
      "Дорожка заблокирована": "Jalur terkunci",
      "Видеодорожка для фото": "Jalur video untuk foto",
      "Аудиодорожка для добавления музыки": "Jalur audio untuk menambahkan musik",
      "Выбери видео на видеодорожке, чтобы отделить его звук": "Pilih video pada jalur video untuk memisahkan audionya.",
      "Сначала разблокируй видеодорожку": "Buka kunci jalur video terlebih dahulu.",
      "Звук этого клипа уже находится на отдельной аудиодорожке": "Audio klip ini sudah berada pada jalur audio terpisah.",
      "Не удалось создать аудиоклип. Проверь доступность аудиодорожек.": "Klip audio gagal dibuat. Periksa ketersediaan jalur audio.",
      "Сдвинуть клип на кадр влево": "Geser klip 1 bingkai ke kiri",
      "Сдвинуть клип на кадр вправо": "Geser klip 1 bingkai ke kanan",
      "Сдвинуть на 10 кадров влево": "Geser 10 bingkai ke kiri",
      "Сдвинуть на 10 кадров вправо": "Geser 10 bingkai ke kanan",
      "Предыдущий кадр (←)": "Bingkai sebelumnya (←)",
      "Следующий кадр (→)": "Bingkai berikutnya (→)",
      "Частота кадров проекта": "Laju bingkai proyek"
    },
    "es": {
      "Шторки": "Barridos",
      "Круговая диафрагма": "Transición de iris"
    },
    "fr": {
      "Шторки": "Balayages",
      "Круговая диафрагма": "Transition en iris"
    },
    "pt-BR": {
      "Шторки": "Varreduras",
      "Круговая диафрагма": "Transição íris"
    },
    "it": {
      "Шторки": "Transizioni a tendina",
      "Круговая диафрагма": "Transizione a iride"
    },
    "pl": {
      "Шторки": "Przejścia typu wipe",
      "Круговая диафрагма": "Przejście irysowe"
    },
    "tr": {
      "Правка": "Düzenleme",
      "Шторки": "Silme geçişleri",
      "Круговая диафрагма": "İris geçişi",
      "Шторка снизу": "Alttan yukarı silme"
    },
    "ro": {
      "Шторки": "Tranziții prin ștergere",
      "Круговая диафрагма": "Tranziție iris"
    },
    "vi": {
      "Шторки": "Chuyển cảnh quét",
      "Круговая диафрагма": "Chuyển cảnh Iris"
    },
    "he": {
      "Шторки": "מעברי חשיפה",
      "Круговая диафрагма": "מעבר איריס"
    },
    "th": {
      "Шторки": "การเปลี่ยนภาพแบบปาด",
      "Круговая диафрагма": "ทรานซิชันไอริส"
    },
    "kk": {
      "Шторки": "Сүрту арқылы ауысулар",
      "Шторка снизу": "Төменнен жоғары қарай сүрту",
      "Круговая диафрагма": "Ирис ауысуы"
    },
    "uz": {
      "Шторки": "Artib o‘tishlar",
      "Шторка снизу": "Pastdan yuqoriga o‘tish",
      "Круговая диафрагма": "Iris o‘tishi"
    },
    "uz-Cyrl": {
      "Шторки": "Артиб ўтишлар",
      "Шторка снизу": "Пастдан юқорига ўтиш",
      "Круговая диафрагма": "Ирис ўтиши"
    },
    "ka": {
      "Шторки": "გადასმის ტიპის გადასვლები",
      "Шторка снизу": "ქვემოდან ზემოთ გადასმა",
      "Круговая диафрагма": "ირისის გადასვლა"
    },
    "hy": {
      "Шторки": "Սահեցման անցումներ",
      "Шторка снизу": "Սահեցում ներքևից վերև",
      "Круговая диафрагма": "Իրիսի անցում"
    },
    "tk": {
      "Правка": "Redaktirleme",
      "Шторки": "Süpürme geçişleri",
      "Шторка снизу": "Aşakdan ýokary süýşme",
      "Круговая диафрагма": "Iris geçişi"
    },
    "az": {
      "Шторки": "Silinmə keçidləri",
      "Шторка снизу": "Aşağıdan yuxarı silmə",
      "Круговая диафрагма": "İris keçidi"
    },
    "ky": {
      "Шторки": "Сүртүү өтүүлөрү",
      "Шторка снизу": "Төмөндөн жогору сүртүү",
      "Круговая диафрагма": "Ирис өтүүсү"
    },
    "tg": {
      "Шторки": "Гузаришҳои поккунӣ",
      "Шторка снизу": "Гузариш аз поён ба боло",
      "Круговая диафрагма": "Гузариши ирисӣ"
    },
    "be": {
      "Шторки": "Пераходы з выціраннем",
      "Шторка снизу": "Шторка знізу ўверх",
      "Круговая диафрагма": "Пераход «Ірыс»",
      "Fade In, с": "Паступовае нарастанне гучнасці, с"
    },
    "zh-CN": {
      "Круговая диафрагма": "圆形光圈转场"
    },
    "zh-TW": {
      "Круговая диафрагма": "圓形光圈轉場"
    }
  };
  for (const [locale, patch] of Object.entries(stage9Corrections)) {
    corrections[locale] = Object.assign({}, corrections[locale] || {}, patch);
  }

  const appTitleCorrections = {
    "kk": "Montazhnaya beta 3.6.45 — фото, дыбыс және бейне редакторы",
    "uz": "Montazhnaya beta 3.6.45 — foto, audio va video muharriri",
    "uz-Cyrl": "Montazhnaya бета 3.6.45 — фото, аудио ва видео муҳаррири",
    "ka": "Montazhnaya beta 3.6.45 — ფოტო, აუდიო და ვიდეო რედაქტორი",
    "hy": "Montazhnaya beta 3.6.45 — լուսանկարների, ձայնի և տեսանյութի խմբագրիչ",
    "tk": "Montazhnaya beta 3.6.45 — surat, ses we wideo redaktory",
    "az": "Montazhnaya beta 3.6.45 — foto, audio və video redaktoru",
    "ky": "Montazhnaya beta 3.6.45 — сүрөт, үн жана видео редактору",
    "tg": "Montazhnaya beta 3.6.45 — муҳаррири акс, садо ва видео",
    "be": "Montazhnaya beta 3.6.45 — рэдактар фота, аўдыя і відэа"
  };
  // Stage 12: translate the shared chrome around every contextual-help card.
  // The six source labels are intentionally added after locale packs are built:
  // they are renderer UI strings, not part of the 436-key source dictionary snapshot.
  const tooltipUiLabelKeys = Object.freeze([
    "Подсказка простыми словами",
    "Подсказка",
    "Что делает",
    "Что нажать",
    "Совет: ",
    "Можно нажать на клавиатуре"
  ]);
  const tooltipUiLabelCatalog = Object.freeze({
    "ru": ["Подсказка простыми словами", "Подсказка", "Что делает", "Что нажать", "Совет: ", "Можно нажать на клавиатуре"],
    "en": ["Plain-language help", "Help", "What it does", "What to do", "Tip: ", "Keyboard shortcut"],
    "de": ["Hilfe in einfacher Sprache", "Hinweis", "Was es macht", "Was zu tun ist", "Tipp: ", "Tastenkürzel"],
    "fr": ["Aide en langage simple", "Aide", "À quoi ça sert", "Que faire", "Conseil : ", "Raccourci clavier"],
    "es": ["Ayuda en lenguaje sencillo", "Ayuda", "Qué hace", "Qué hacer", "Consejo: ", "Atajo de teclado"],
    "pt-BR": ["Ajuda em linguagem simples", "Ajuda", "O que faz", "O que fazer", "Dica: ", "Atalho de teclado"],
    "it": ["Guida in parole semplici", "Aiuto", "Cosa fa", "Cosa fare", "Consiglio: ", "Scorciatoia da tastiera"],
    "pl": ["Pomoc prostym językiem", "Pomoc", "Co robi", "Co zrobić", "Wskazówka: ", "Skrót klawiszowy"],
    "uk": ["Пояснення простою мовою", "Підказка", "Що робить", "Що натиснути", "Порада: ", "Сполучення клавіш"],
    "tr": ["Sade dille yardım", "Yardım", "Ne işe yarar", "Ne yapmalı", "İpucu: ", "Klavye kısayolu"],
    "zh-CN": ["通俗易懂的帮助", "帮助", "功能说明", "操作方法", "提示：", "键盘快捷键"],
    "zh-TW": ["淺顯易懂的說明", "說明", "功能說明", "操作方式", "提示：", "鍵盤快捷鍵"],
    "ja": ["やさしい言葉での説明", "ヘルプ", "機能", "操作方法", "ヒント：", "キーボードショートカット"],
    "ko": ["쉬운 설명", "도움말", "기능", "사용 방법", "팁: ", "키보드 단축키"],
    "ar": ["مساعدة بلغة مبسطة", "مساعدة", "ما الذي يفعله", "ما الذي يجب فعله", "نصيحة: ", "اختصار لوحة المفاتيح"],
    "he": ["עזרה בשפה פשוטה", "עזרה", "מה הפעולה עושה", "מה לעשות", "טיפ: ", "קיצור מקשים"],
    "hi": ["सरल भाषा में सहायता", "सहायता", "यह क्या करता है", "क्या करना है", "सुझाव: ", "कीबोर्ड शॉर्टकट"],
    "nl": ["Hulp in eenvoudige taal", "Hulp", "Wat het doet", "Wat je moet doen", "Tip: ", "Sneltoets"],
    "sv": ["Hjälp på enkelt språk", "Hjälp", "Vad det gör", "Vad du ska göra", "Tips: ", "Kortkommando"],
    "fi": ["Ohje selkeällä kielellä", "Ohje", "Mitä se tekee", "Mitä tehdä", "Vinkki: ", "Pikanäppäin"],
    "cs": ["Nápověda jednoduchým jazykem", "Nápověda", "Co dělá", "Co udělat", "Tip: ", "Klávesová zkratka"],
    "ro": ["Ajutor pe înțelesul tuturor", "Ajutor", "Ce face", "Ce trebuie făcut", "Sfat: ", "Scurtătură de la tastatură"],
    "el": ["Βοήθεια με απλά λόγια", "Βοήθεια", "Τι κάνει", "Τι να κάνεις", "Συμβουλή: ", "Συντόμευση πληκτρολογίου"],
    "vi": ["Trợ giúp bằng ngôn ngữ đơn giản", "Trợ giúp", "Chức năng", "Cách thực hiện", "Mẹo: ", "Phím tắt"],
    "id": ["Bantuan dengan bahasa sederhana", "Bantuan", "Fungsinya", "Yang perlu dilakukan", "Tips: ", "Pintasan keyboard"],
    "th": ["คำอธิบายที่เข้าใจง่าย", "ความช่วยเหลือ", "ทำอะไร", "วิธีใช้งาน", "เคล็ดลับ: ", "แป้นพิมพ์ลัด"],
    "kk": ["Қарапайым тілдегі көмек", "Көмек", "Не істейді", "Не істеу керек", "Кеңес: ", "Пернетақта тіркесімі"],
    "uz": ["Sodda tildagi yordam", "Yordam", "Nima qiladi", "Nima qilish kerak", "Maslahat: ", "Klaviatura yorlig‘i"],
    "uz-Cyrl": ["Содда тилдаги ёрдам", "Ёрдам", "Нима қилади", "Нима қилиш керак", "Маслаҳат: ", "Клавиатура ёрлиғи"],
    "ka": ["მარტივი ენით დახმარება", "დახმარება", "რას აკეთებს", "რა უნდა გააკეთოთ", "რჩევა: ", "კლავიატურის მალსახმობი"],
    "hy": ["Օգնություն պարզ լեզվով", "Օգնություն", "Ինչ է անում", "Ինչ անել", "Խորհուրդ․ ", "Ստեղնաշարի դյուրանցում"],
    "tk": ["Ýönekeý dilde kömek", "Kömek", "Näme edýär", "Näme etmeli", "Maslahat: ", "Klawiatura gysga ýoly"],
    "az": ["Sadə dildə kömək", "Kömək", "Nə edir", "Nə etmək lazımdır", "Məsləhət: ", "Klaviatura qısayolu"],
    "ky": ["Жөнөкөй тилдеги жардам", "Жардам", "Эмне кылат", "Эмне кылуу керек", "Кеңеш: ", "Баскычтоп жарлыгы"],
    "tg": ["Кӯмак бо забони сода", "Кӯмак", "Чӣ мекунад", "Чӣ бояд кард", "Маслиҳат: ", "Миёнабури клавиатура"],
    "be": ["Дапамога простай мовай", "Дапамога", "Што робіць", "Што зрабіць", "Парада: ", "Спалучэнне клавіш"]
  });
  if (Object.keys(tooltipUiLabelCatalog).length !== 36 ||
      Object.values(tooltipUiLabelCatalog).some(values => !Array.isArray(values) || values.length !== tooltipUiLabelKeys.length)) {
    throw new Error("Tooltip UI label catalog must contain six labels for all 36 locales.");
  }

  const revision = "beta-3.6.45-editorial-stage9-full-dictionary-pass1";

  function apply(locale) {
    const packs = root.MontazhnayaLocalePacks || Object.create(null);
    const current = packs[locale];
    const patch = corrections[locale] || null;
    const tooltipLabels = tooltipUiLabelCatalog[locale] || null;
    if (!current) return null;
    if (!patch && !tooltipLabels) return current;
    if (current.editorialRevision === revision) return current;
    const messages = Object.assign(Object.create(null), current.messages || {});
    for (const [source, value] of Object.entries(patch || {})) {
      if (typeof value !== "string" || !value.trim()) throw new Error("Invalid editorial translation: " + locale + "/" + source);
      if (!Object.prototype.hasOwnProperty.call(messages, source)) throw new Error("Unknown editorial source label: " + locale + "/" + source);
      messages[source] = value;
    }
    const translatedTooltipUiLabels = Object.create(null);
    if (tooltipLabels) {
      tooltipUiLabelKeys.forEach((source, index) => {
        const value = tooltipLabels[index];
        if (typeof value !== "string" || !value.trim()) throw new Error("Invalid tooltip UI translation: " + locale + "/" + source);
        translatedTooltipUiLabels[source] = value;
      });
    }
    const next = Object.freeze({
      ...current,
      appTitle: appTitleCorrections[locale] || current.appTitle,
      messages: Object.freeze(messages),
      tooltipUiLabels: Object.freeze(translatedTooltipUiLabels),
      editorialRevision: revision,
      editorialCorrectionCount: Object.keys(patch || {}).length,
      tooltipUiLabelCount: tooltipLabels ? tooltipLabels.length : 0,
      tooltipUiLabelRevision: "beta-3.6.46-tooltip-ui-labels-stage12",
      editorialReviewStatus: "machine-assisted-full-dictionary-audit-pass-1; native-speaker-review-pending"
    });
    packs[locale] = next;
    return next;
  }

  // Contextual-help terminology that is valid only in selected locales.
  // Keep it separate from the main UI catalogue so Russian source copy stays intact.
  root.MontazhnayaContextualHelpTranslations = Object.freeze({
    uk: Object.freeze({ "Таймлайн": "Часова шкала" }),
    kk: Object.freeze({ "Таймлайн": "Уақыт шкаласы" })
  });

  root.MontazhnayaLocaleEditorialCorrections = Object.freeze(corrections);
  root.MontazhnayaApplyEditorialOverrides = apply;
})(window);
