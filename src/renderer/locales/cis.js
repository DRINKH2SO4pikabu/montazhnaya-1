(function (root) {
  "use strict";
  const packs = root.MontazhnayaLocalePacks || (root.MontazhnayaLocalePacks = Object.create(null));
  const englishPack = packs.en;
  if (!englishPack || !englishPack.messages) throw new Error("English source pack must load before CIS locale packs");
  const english = root.MontazhnayaLocaleSourceMessages || englishPack.messages;
  const sourceByEnglish = new Map();
  for (const [source, value] of Object.entries(english)) {
    const list = sourceByEnglish.get(value) || [];
    list.push(source);
    sourceByEnglish.set(value, list);
  }
  const phrases = ["File","New Project","Open Project…","Save Project (JSON)…","Save Project with Media…","Import Media…","Create Photo & Audio Slideshow…","Relink Media Files…","Save Current Frame…","Export Video…","Remove All Media","Clear Timeline","Edit","Undo","Redo","Split at Playhead","Delete Clip","Copy Clip","Paste Clip","Duplicate Clip","Add Marker","Previous Marker","Next Marker","View","Zoom In Timeline","Zoom Out Timeline","Transitions","Open Transition Library","Help","Guided Tour","Check Project…","About","Enable Tips","Save","Media","Slideshow","Export","Split","Delete","Arrange by Number","Transition Duration","Preview","Format","Size","Properties","Timeline","Fit","Snapping","File Name","Resolution","Orientation","Match Project","Landscape","Portrait","Frame Rate","Entire Project","Ready to Export","Close","Cancel","Start Export","Video","Audio","Image","All","Basic","Dissolve","Wipes","Motion","Effects","Cross Dissolve","Wipe Left","Wipe Right","Slide Left","Slide Right","Zoom In","Zoom Out","Interface language","Choose a language","Available languages","Translation preview","Core commands are translated; other labels use English where available, otherwise Russian."];
  const localeData = {"kk":{"nativeName":"Қазақша","englishName":"Kazakh","appTitle":"Montazhnaya beta 3.6.44 — фото, дыбыс және бейне редакторы","values":["Файл","Жаңа жоба","Жобаны ашу…","Жобаны сақтау (JSON)…","Жобаны медиафайлдармен бірге сақтау…","Медиафайлдарды импорттау…","Фото мен аудиодан слайд-шоу жасау…","Медиафайлдардың байланысын қалпына келтіру…","Ағымдағы кадрды сақтау…","Бейнені экспорттау…","Барлық медианы жою","Таймлайнды тазарту","Өңдеу","Болдырмау","Қайталау","Ойнату көрсеткішінде бөлу","Клипті жою","Клипті көшіру","Клипті қою","Клиптің көшірмесін жасау","Маркер қосу","Алдыңғы маркер","Келесі маркер","Көрініс","Таймлайнды үлкейту","Таймлайнды кішірейту","Өтулер","Өтулер кітапханасын ашу","Анықтама","Қадамдық танысу","Жобаны тексеру…","Бағдарлама туралы","Кеңестерді қосу","Сақтау","Медиа","Слайд-шоу","Экспорттау","Бөлу","Жою","Нөмірі бойынша реттеу","Өту ұзақтығы","Алдын ала қарау","Пішім","Өлшем","Қасиеттер","Таймлайн","Сыйдыру","Магниттік бекіту","Файл атауы","Ажыратымдылық","Бағдар","Жоба параметріндей","Көлденең","Тік","Кадр жиілігі","Бүкіл жоба","Экспорттауға дайын","Жабу","Болдырмау","Экспортты бастау","Бейне","Аудио","Сурет","Барлығы","Негізгі","Біртіндеп ауысу","Шторкалар","Қозғалыс","Әсерлер","Айқаспалы біртіндеп ауысу","Сол жақтан ашылу","Оң жақтан ашылу","Солға жылжу","Оңға жылжу","Жақындату","Алыстату","Интерфейс тілі","Тілді таңдаңыз","Қолжетімді тілдер","Аударма нұсқасы","Негізгі пәрмендер аударылған; басқа жазулар қолжетімді болса ағылшынша, әйтпесе орысша көрсетіледі."]},"uz":{"nativeName":"Oʻzbekcha","englishName":"Uzbek","appTitle":"Montazhnaya beta 3.6.44 — foto, audio va video muharriri","values":["Fayl","Yangi loyiha","Loyihani ochish…","Loyihani saqlash (JSON)…","Loyihani media fayllari bilan saqlash…","Media fayllarni import qilish…","Foto va audiodan slayd-shou yaratish…","Media fayllar havolalarini tiklash…","Joriy kadrni saqlash…","Videoni eksport qilish…","Barcha mediani olib tashlash","Taymlaynni tozalash","Tahrirlash","Bekor qilish","Qaytarish","Ijro ko‘rsatkichida bo‘lish","Klipni o‘chirish","Klipdan nusxa olish","Klipni joylashtirish","Klipdan dublikat yaratish","Marker qo‘shish","Oldingi marker","Keyingi marker","Ko‘rinish","Taymlaynni kattalashtirish","Taymlaynni kichraytirish","O‘tishlar","O‘tishlar kutubxonasini ochish","Yordam","Bosqichma-bosqich qo‘llanma","Loyihani tekshirish…","Dastur haqida","Maslahatlarni yoqish","Saqlash","Media","Slayd-shou","Eksport","Bo‘lish","O‘chirish","Raqam bo‘yicha tartiblash","O‘tish davomiyligi","Oldindan ko‘rish","Format","O‘lcham","Xususiyatlar","Taymlayn","Moslashtirish","Magnitli yopishish","Fayl nomi","Ruxsat","Yo‘nalish","Loyiha bilan bir xil","Landshaft","Portret","Kadrlar tezligi","Butun loyiha","Eksportga tayyor","Yopish","Bekor qilish","Eksportni boshlash","Video","Audio","Rasm","Barchasi","Asosiy","Eritib o‘tish","Pardalar","Harakat","Effektlar","Kadrlararo eritish","Chapdan parda","O‘ngdan parda","Chapga siljitish","O‘ngga siljitish","Kattalashtirish","Kichraytirish","Interfeys tili","Tilni tanlang","Mavjud tillar","Tarjima ko‘rinishi","Asosiy buyruqlar tarjima qilingan; boshqa yozuvlar mavjud bo‘lsa inglizcha, aks holda ruscha ko‘rsatiladi."]},"ka":{"nativeName":"ქართული","englishName":"Georgian","appTitle":"Montazhnaya beta 3.6.44 — ფოტო, აუდიო და ვიდეო რედაქტორი","values":["ფაილი","ახალი პროექტი","პროექტის გახსნა…","პროექტის შენახვა (JSON)…","პროექტის მედია ფაილებთან ერთად შენახვა…","მედია ფაილების იმპორტი…","ფოტოებისა და აუდიოს სლაიდშოუს შექმნა…","მედია ფაილების ბმულების აღდგენა…","მიმდინარე კადრის შენახვა…","ვიდეოს ექსპორტი…","ყველა მედიის წაშლა","ტაიმლაინის გასუფთავება","რედაქტირება","გაუქმება","გამეორება","დაკვრის მაჩვენებელთან გაყოფა","კლიპის წაშლა","კლიპის კოპირება","კლიპის ჩასმა","კლიპის დუბლირება","მარკერის დამატება","წინა მარკერი","შემდეგი მარკერი","ხედი","ტაიმლაინის გადიდება","ტაიმლაინის დაპატარავება","გადასვლები","გადასვლების ბიბლიოთეკის გახსნა","დახმარება","საფეხურებრივი გაცნობა","პროექტის შემოწმება…","პროგრამის შესახებ","რჩევების ჩართვა","შენახვა","მედია","სლაიდშოუ","ექსპორტი","გაყოფა","წაშლა","ნომრის მიხედვით დალაგება","გადასვლის ხანგრძლივობა","წინასწარი ნახვა","ფორმატი","ზომა","თვისებები","ტაიმლაინი","მორგება","მიმაგრება","ფაილის სახელი","გარჩევადობა","ორიენტაცია","როგორც პროექტში","ჰორიზონტალური","ვერტიკალური","კადრების სიხშირე","მთელი პროექტი","ექსპორტისთვის მზადაა","დახურვა","გაუქმება","ექსპორტის დაწყება","ვიდეო","აუდიო","გამოსახულება","ყველა","ძირითადი","გადნობა","ფარდები","მოძრაობა","ეფექტები","ჯვარედინი გადნობა","ფარდა მარცხნიდან","ფარდა მარჯვნიდან","გადაადგილება მარცხნივ","გადაადგილება მარჯვნივ","მასშტაბის გაზრდა","მასშტაბის შემცირება","ინტერფეისის ენა","აირჩიეთ ენა","ხელმისაწვდომი ენები","თარგმანის წინასწარი ვერსია","ძირითადი ბრძანებები თარგმნილია; სხვა წარწერები ნაჩვენებია ინგლისურად, თუ ხელმისაწვდომია, წინააღმდეგ შემთხვევაში — რუსულად."]},"hy":{"nativeName":"Հայերեն","englishName":"Armenian","appTitle":"Montazhnaya beta 3.6.44 — լուսանկարների, ձայնի և տեսանյութի խմբագրիչ","values":["Ֆայլ","Նոր նախագիծ","Բացել նախագիծը…","Պահպանել նախագիծը (JSON)…","Պահպանել նախագիծը մեդիաֆայլերով…","Ներմուծել մեդիաֆայլեր…","Ստեղծել լուսանկարների և ձայնի սլայդշոու…","Վերականգնել մեդիաֆայլերի հղումները…","Պահպանել ընթացիկ կադրը…","Արտահանել տեսանյութը…","Հեռացնել բոլոր մեդիաֆայլերը","Մաքրել ժամանակագիծը","Խմբագրել","Չեղարկել","Կրկնել","Բաժանել նվագարկման ցուցիչի մոտ","Ջնջել հոլովակը","Պատճենել հոլովակը","Տեղադրել հոլովակը","Կրկնօրինակել հոլովակը","Ավելացնել նշիչ","Նախորդ նշիչը","Հաջորդ նշիչը","Տեսք","Մեծացնել ժամանակագիծը","Փոքրացնել ժամանակագիծը","Անցումներ","Բացել անցումների գրադարանը","Օգնություն","Քայլ առ քայլ ծանոթացում","Ստուգել նախագիծը…","Ծրագրի մասին","Միացնել հուշումները","Պահպանել","Մեդիա","Սլայդշոու","Արտահանում","Բաժանել","Ջնջել","Դասավորել ըստ համարի","Անցման տևողություն","Նախադիտում","Ձևաչափ","Չափ","Հատկություններ","Ժամանակագիծ","Տեղավորել","Կպչում","Ֆայլի անուն","Կետայնություն","Ուղղվածություն","Ինչպես նախագծում","Հորիզոնական","Ուղղահայաց","Կադրերի հաճախականություն","Ամբողջ նախագիծը","Պատրաստ է արտահանման","Փակել","Չեղարկել","Սկսել արտահանումը","Տեսանյութ","Աուդիո","Պատկեր","Բոլորը","Հիմնական","Տարրալուծում","Շերտավարագույրներ","Շարժում","Էֆեկտներ","Խաչաձև տարրալուծում","Շերտավարագույր ձախից","Շերտավարագույր աջից","Շարժել ձախ","Շարժել աջ","Մեծացնել","Փոքրացնել","Միջերեսի լեզու","Ընտրեք լեզուն","Հասանելի լեզուներ","Թարգմանության նախադիտում","Հիմնական հրամանները թարգմանված են, իսկ մյուս գրառումները ցուցադրվում են անգլերենով, եթե հասանելի են, հակառակ դեպքում՝ ռուսերենով։"]},"tk":{"nativeName":"Türkmençe","englishName":"Turkmen","appTitle":"Montazhnaya beta 3.6.44 — surat, ses we wideo redaktory","values":["Faýl","Täze taslama","Taslamany aç…","Taslamany sakla (JSON)…","Taslamany media faýllary bilen sakla…","Media faýllary import et…","Surat we audiodan slaýdşou döret…","Media faýllarynyň baglanyşyklaryny dikelt…","Häzirki kadrı sakla…","Wideony eksport et…","Ähli mediýany aýyr","Taýmlayny arassala","Redaktirlemek","Yza gaýtarmak","Gaýtalamak","Oýnatma görkezijisinde böl","Klipi poz","Klipi göçür","Klipi goý","Klipiň nusgasyny döret","Marker goş","Öňki marker","Indiki marker","Görnüş","Taýmlayny ulalt","Taýmlayny kiçelt","Geçişler","Geçişler kitaphanasyny aç","Kömek","Ädimme-ädim tanyşlyk","Taslamany barla…","Programma barada","Maslahatlary aç","Saklamak","Media","Slaýdşou","Eksport","Bölmek","Pozmak","Belgi boýunça tertiple","Geçişiň dowamlylygy","Öňünden görmek","Format","Ölçeg","Aýratynlyklar","Taýmlayn","Sykyşdyr","Magnitli ýapyşma","Faýlyň ady","Çözgüt","Ýöneliş","Taslamadaky ýaly","Keseligine","Dikligine","Kadr ýygylygy","Tutuş taslama","Eksporta taýýar","Ýap","Ýatyr","Eksporty başlat","Wideo","Audio","Şekil","Hemmesi","Esasy","Ýuwaş geçiş","Perdeler","Hereket","Effektler","Kesişýän ýuwaş geçiş","Çepden perde","Sagdan perde","Çepe süýşür","Saga süýşür","Ýakynlaşdyr","Uzaklaşdyr","Interfeýs dili","Dil saýlaň","Elýeterli diller","Terjimäniň deslapky görnüşi","Esasy buýruklar terjime edildi; beýleki ýazgylar elýeterli bolsa iňlisçe, bolmasa rusça görkezilýär."]},"az":{"nativeName":"Azərbaycanca","englishName":"Azerbaijani","appTitle":"Montazhnaya beta 3.6.44 — foto, audio və video redaktoru","values":["Fayl","Yeni layihə","Layihəni aç…","Layihəni saxla (JSON)…","Layihəni media faylları ilə saxla…","Media fayllarını idxal et…","Foto və audiodan slayd-şou yarat…","Media fayllarının bağlantılarını bərpa et…","Cari kadrı saxla…","Videonu ixrac et…","Bütün medianı sil","Taymlaynı təmizlə","Redaktə","Geri al","Təkrarla","Oxutma göstəricisində böl","Klipi sil","Klipi köçür","Klipi yapışdır","Klipi çoxalt","Marker əlavə et","Əvvəlki marker","Növbəti marker","Görünüş","Taymlaynı böyüt","Taymlaynı kiçilt","Keçidlər","Keçidlər kitabxanasını aç","Kömək","Addım-addım tanışlıq","Layihəni yoxla…","Proqram haqqında","Məsləhətləri aktiv et","Saxla","Media","Slayd-şou","İxrac","Böl","Sil","Nömrəyə görə sırala","Keçidin müddəti","Önizləmə","Format","Ölçü","Xüsusiyyətlər","Taymlayn","Sığdır","Maqnit yapışması","Fayl adı","Ölçü dəqiqliyi","İstiqamət","Layihədəki kimi","Üfüqi","Şaquli","Kadr tezliyi","Bütün layihə","İxrac üçün hazırdır","Bağla","Ləğv et","İxracı başlat","Video","Audio","Şəkil","Hamısı","Əsas","Ərimə","Pərdələr","Hərəkət","Effektlər","Çarpaz ərimə","Soldan pərdə","Sağdan pərdə","Sola sürüşdür","Sağa sürüşdür","Yaxınlaşdır","Uzaqlaşdır","İnterfeys dili","Dil seçin","Mövcud dillər","Tərcümə önizləməsi","Əsas əmrlər tərcümə olunub; digər yazılar mövcud olduqda ingiliscə, əks halda rusca göstərilir."]},"ky":{"nativeName":"Кыргызча","englishName":"Kyrgyz","appTitle":"Montazhnaya beta 3.6.44 — сүрөт, үн жана видео редактору","values":["Файл","Жаңы долбоор","Долбоорду ачуу…","Долбоорду сактоо (JSON)…","Долбоорду медиафайлдар менен сактоо…","Медиафайлдарды импорттоо…","Сүрөт жана аудиодон слайд-шоу түзүү…","Медиафайлдардын шилтемелерин калыбына келтирүү…","Учурдагы кадрды сактоо…","Видеону экспорттоо…","Бардык медианы өчүрүү","Таймлайнды тазалоо","Түзөтүү","Артка кайтаруу","Кайталоо","Ойнотуу көрсөткүчүндө бөлүү","Клипти өчүрүү","Клипти көчүрүү","Клипти чаптоо","Клиптин көчүрмөсүн түзүү","Маркер кошуу","Мурунку маркер","Кийинки маркер","Көрүнүш","Таймлайнды чоңойтуу","Таймлайнды кичирейтүү","Өтүүлөр","Өтүүлөр китепканасын ачуу","Жардам","Кадам-кадам таанышуу","Долбоорду текшерүү…","Программа жөнүндө","Кеңештерди күйгүзүү","Сактоо","Медиа","Слайд-шоу","Экспорт","Бөлүү","Өчүрүү","Номери боюнча иреттөө","Өтүүнүн узактыгы","Алдын ала көрүү","Формат","Өлчөм","Касиеттер","Таймлайн","Ыңгайлаштыруу","Магниттик жабышуу","Файлдын аты","Дааналык","Багыт","Долбоордогудай","Туурасынан","Тигинен","Кадр жыштыгы","Бүтүндөй долбоор","Экспорттоого даяр","Жабуу","Жокко чыгаруу","Экспортту баштоо","Видео","Аудио","Сүрөт","Баары","Негизги","Эрип өтүү","Жалюзи","Кыймыл","Эффекттер","Кайчылаш эрип өтүү","Сол жактан ачылуу","Оң жактан ачылуу","Солго жылдыруу","Оңго жылдыруу","Жакындатуу","Алыстатуу","Интерфейстин тили","Тилди тандаңыз","Жеткиликтүү тилдер","Котормонун алдын ала көрүнүшү","Негизги буйруктар которулган; башка жазуулар мүмкүн болсо англисче, болбосо орусча көрсөтүлөт."]},"tg":{"nativeName":"Тоҷикӣ","englishName":"Tajik","appTitle":"Montazhnaya beta 3.6.44 — муҳаррири акс, садо ва видео","values":["Файл","Лоиҳаи нав","Кушодани лоиҳа…","Нигоҳ доштани лоиҳа (JSON)…","Нигоҳ доштани лоиҳа бо файлҳои медиа…","Ворид кардани файлҳои медиа…","Сохтани слайд-шоу аз акс ва аудио…","Барқарор кардани пайванди файлҳои медиа…","Нигоҳ доштани кадри ҷорӣ…","Содироти видео…","Нест кардани ҳамаи маводи медиа","Тоза кардани таймлайн","Таҳрир","Бекор кардан","Такрор кардан","Ҷудо кардан дар нишондиҳандаи навозиш","Нест кардани клип","Нусхабардории клип","Гузоштани клип","Сохтани нусхаи клип","Илова кардани маркер","Маркерҳои қаблӣ","Маркерҳои навбатӣ","Намоиш","Калон кардани таймлайн","Хурд кардани таймлайн","Гузаришҳо","Кушодани китобхонаи гузаришҳо","Кӯмак","Шиносоии қадам ба қадам","Санҷидани лоиҳа…","Дар бораи барнома","Фаъол кардани маслиҳатҳо","Нигоҳ доштан","Медиа","Слайд-шоу","Содирот","Ҷудо кардан","Нест кардан","Тартиб аз рӯи рақам","Давомнокии гузариш","Пешнамоиш","Формат","Андоза","Хусусиятҳо","Таймлайн","Мутобиқ кардан","Часпиши магнитӣ","Номи файл","Қобилияти тасвир","Самт","Мисли лоиҳа","Уфуқӣ","Амудӣ","Басомади кадрҳо","Тамоми лоиҳа","Барои содирот омода аст","Пӯшидан","Бекор кардан","Оғози содирот","Видео","Аудио","Тасвир","Ҳама","Асосӣ","Ҳалшавӣ","Пардаҳо","Ҳаракат","Эффектҳо","Ҳалшавии байниҳамдигарӣ","Пардаи аз чап","Пардаи аз рост","Ҷойивазкунӣ ба чап","Ҷойивазкунӣ ба рост","Наздик кардан","Дур кардан","Забони интерфейс","Забонро интихоб кунед","Забонҳои дастрас","Пешнамоиши тарҷума","Фармонҳои асосӣ тарҷума шудаанд; навиштаҳои дигар агар дастрас бошанд ба англисӣ, вагарна ба русӣ нишон дода мешаванд."]},"be":{"nativeName":"Беларуская","englishName":"Belarusian","appTitle":"Montazhnaya beta 3.6.44 — рэдактар фота, аўдыя і відэа","values":["Файл","Новы праект","Адкрыць праект…","Захаваць праект (JSON)…","Захаваць праект разам з медыяфайламі…","Імпартаваць медыяфайлы…","Стварыць слайд-шоў з фота і аўдыя…","Аднавіць сувязі з медыяфайламі…","Захаваць бягучы кадр…","Экспартаваць відэа…","Выдаліць усе матэрыялы","Ачысціць таймлайн","Рэдагаванне","Адмяніць","Паўтарыць","Раздзяліць у пазіцыі курсора","Выдаліць кліп","Скапіяваць кліп","Уставіць кліп","Стварыць копію кліпа","Дадаць маркер","Папярэдні маркер","Наступны маркер","Выгляд","Павялічыць таймлайн","Паменшыць таймлайн","Пераходы","Адкрыць бібліятэку пераходаў","Даведка","Пакрокавае знаёмства","Праверыць праект…","Пра праграму","Уключыць падказкі","Захаваць","Медыя","Слайд-шоў","Экспарт","Раздзяліць","Выдаліць","Упарадкаваць паводле нумара","Працягласць пераходу","Папярэдні прагляд","Фармат","Памер","Уласцівасці","Таймлайн","Умясціць","Прывязка","Імя файла","Раздзяляльнасць","Арыентацыя","Як у праекце","Альбомная","Партрэтная","Частата кадраў","Увесь праект","Гатова да экспарту","Закрыць","Скасаваць","Пачаць экспарт","Відэа","Аўдыя","Выява","Усе","Асноўныя","Растварэнне","Шторкі","Рух","Эфекты","Перакрыжаванае растварэнне","Шторка злева","Шторка справа","Зрух налева","Зрух направа","Павялічыць","Паменшыць","Мова інтэрфейсу","Выберыце мову","Даступныя мовы","Папярэдні прагляд перакладу","Асноўныя каманды перакладзены; іншыя надпісы паказваюцца па-англійску, калі пераклад даступны, інакш па-руску."]}};
  const sourceMessageCount = Object.keys(english).length;
  localeData.kk.values[80] = 'Сөздік интерфейстің барлық негізгі жолдарын қамтиды; аударманы ана тілінде сөйлейтін маман тексеруі қажет.';
  localeData.uz.values[80] = 'Lug‘at interfeysdagi barcha asosiy satrlarni qamrab oladi; tarjimani ona tilida so‘zlashuvchi mutaxassis tekshirishi kerak.';
  localeData.az.values[80] = 'Lüğət interfeysin bütün əsas sətirlərini əhatə edir; tərcümə ana dili danışanı tərəfindən yoxlanmalıdır.';
  localeData.ka.values[80] = 'ლექსიკონი ინტერფეისის ყველა ძირითად სტრიქონს მოიცავს; თარგმანი მშობლიურ ენაზე მოსაუბრე სპეციალისტმა უნდა შეამოწმოს.';

  for (const [code, locale] of Object.entries(localeData)) {
    if (!Array.isArray(locale.values) || locale.values.length !== phrases.length) {
      throw new Error("Invalid CIS core translation count for " + code);
    }
    const messages = Object.create(null);
    phrases.forEach((phrase, index) => {
      const sourceKeys = sourceByEnglish.get(phrase) || [];
      for (const source of sourceKeys) messages[source] = locale.values[index];
    });
    const aboutSource = "Монтажная beta 3.6.44 — монтаж фото, аудио и видео";
    if (english[aboutSource]) messages[aboutSource] = locale.appTitle;
    const englishFallbackKeys = Object.keys(english).filter(source => !Object.prototype.hasOwnProperty.call(messages, source));
    packs[code] = Object.freeze({
      code,
      direction: "ltr",
      appTitle: locale.appTitle,
      fallback: "en",
      coverage: "core-commands-81",
      sourceMessageCount,
      localeMappedCount: Object.keys(messages).length,
      englishFallbackCount: englishFallbackKeys.length,
      englishFallbackKeys: Object.freeze(englishFallbackKeys),
      translationStatus: "preview",
      translationStage: "cis-central-asia-caucasus-core-wave-1",
      completedTranslationWave: "beta-3.6.43-cis-wave-1",
      messages: Object.freeze(messages)
    });
  }

  // Wave 2: clip properties, transform/color controls, titles/audio, media ordering and slideshow builder.
  const wave2Phrases = [
  "0.65 s",
  "Frame",
  "FPS",
  "earlier",
  "PROJECT",
  "· MISSING FILE",
  "Project",
  "Media Items",
  "Clips",
  "Duration",
  "Missing files: {count}",
  "Click Relink Files to restore the media links.",
  "Select a clip or media item to view its properties",
  "Media Item",
  "Name",
  "Type",
  "Status",
  "file is missing",
  "Settings",
  "5 s by default",
  "File Size",
  "Actions",
  "Relink File…",
  "Add to Timeline",
  "Remove from Media Library",
  "Clip",
  "Track",
  " (locked)",
  "file removed",
  "Timing",
  "Duration, s",
  "Source In, s",
  "Source Out, s",
  "Timeline End",
  "Source Duration",
  "Photos can be trimmed by dragging either edge of the clip. Their duration is not limited by source media. Enter seconds above for an exact value.",
  "Opacity, %",
  "Scale, %",
  "Center X, %",
  "Center Y, %",
  "Fit Mode",
  "Contain",
  "Cover (Crop)",
  "Camera Motion",
  "No Motion",
  "Smooth Zoom In",
  "Smooth Zoom Out",
  "Pan Left",
  "Pan Right",
  "Pan Up",
  "Pan Down",
  "Rotation, °",
  "Flip",
  "Horizontal",
  "Vertical",
  "Reset",
  "Color Correction",
  "Brightness, %",
  "Contrast, %",
  "Clip Titles",
  "Text",
  "Enter a title or caption…",
  "Font Size",
  "Text Color",
  "Position",
  "Top Center",
  "Center",
  "Bottom Center",
  "Bottom Left",
  "Bottom Right",
  "Background",
  "Note",
  "Text is rendered into the video",
  "Audio",
  "Volume, %",
  "Fade In, s",
  "Fade Out, s",
  "At Start, s",
  "Entrance Mode",
  "At End, s",
  "Exit Mode",
  "Audio Already Detached",
  "Detach Audio to Track",
  "A clip already exists here",
  "The clip would overlap a neighboring clip",
  "The new source in-point would conflict with a neighboring clip",
  "Arrange by Number",
  "Video Track",
  "Sequence Start",
  "At Playhead",
  "At End of Selected Track",
  "Image Duration, sec.",
  "Media Items in Order",
  "Arrange",
  "No numbered images or videos are available.",
  "No images or videos with numbers in their filenames were found. For example: 001.jpg, 002.jpg, 003.jpg.",
  "Select a visible and unlocked video track.",
  "Photo & Music Slideshow",
  "Get Photos From",
  "Music Track",
  "Duration Mode",
  "Fit to Music Length",
  "Same Duration per Photo",
  "Fill Timeline Range",
  "Video Track for Photos",
  "Start, sec",
  "Duration per Photo, sec",
  "Range Length, sec",
  "Transitions Between Photos",
  "No Transitions",
  "Transition Duration, sec",
  "Alternate Smooth Zoom and Pan",
  "Slow Zoom In",
  "Slow Zoom Out",
  "Photo Order",
  "As Arranged on Track",
  "By Name: A → Z",
  "By Name: Z → A",
  "Audio Track for Music",
  "Fade in the first photo and fade out the last",
  "Create Slideshow",
  "Check the settings."
];
  const wave2Data = {
  "kk": [
    "0,65 с",
    "Кадр",
    "кадр/с",
    "ертерек",
    "ЖОБА",
    "· ФАЙЛ ЖОҚ",
    "Жоба",
    "Медиа элементтері",
    "Клиптер",
    "Ұзақтығы",
    "Жетіспейтін файлдар: {count}",
    "Медиа файлдармен байланысты қалпына келтіру үшін «Файлдарды қайта байланыстыру» түймесін басыңыз.",
    "Қасиеттерін көру үшін клипті немесе медиа элементін таңдаңыз",
    "Медиа элемент",
    "Атауы",
    "Түрі",
    "Күйі",
    "файл жоқ",
    "Параметрлер",
    "әдепкі бойынша 5 с",
    "Файл өлшемі",
    "Әрекеттер",
    "Файлды қайта байланыстыру…",
    "Таймлайнға қосу",
    "Медиа кітапханасынан жою",
    "Клип",
    "Жол",
    " (құлыпталған)",
    "файл жойылған",
    "Уақыт параметрлері",
    "Ұзақтығы, с",
    "Бастапқы кіріс, с",
    "Бастапқы шығыс, с",
    "Таймлайн соңы",
    "Бастапқы ұзақтығы",
    "Фотосуреттерді клиптің сол немесе оң жақ шетін сүйреу арқылы қысқартуға болады. Олардың ұзақтығы бастапқы медиаға тәуелді емес. Нақты мән үшін жоғарыда секундпен енгізіңіз.",
    "Мөлдірлік, %",
    "Масштаб, %",
    "Орталық X, %",
    "Орталық Y, %",
    "Сыйдыру режимі",
    "Толық сыйдыру",
    "Кадрды толтыру (қиып алу)",
    "Камера қозғалысы",
    "Қозғалыссыз",
    "Бірқалыпты жақындату",
    "Бірқалыпты алыстату",
    "Солға панорама",
    "Оңға панорама",
    "Жоғары панорама",
    "Төмен панорама",
    "Бұру, °",
    "Аудару",
    "Көлденең",
    "Тік",
    "Қалпына келтіру",
    "Түсті түзету",
    "Жарықтық, %",
    "Контраст, %",
    "Клиптегі титрлер",
    "Мәтін",
    "Тақырып немесе жазба енгізіңіз…",
    "Қаріп өлшемі",
    "Мәтін түсі",
    "Орналасуы",
    "Жоғарғы ортада",
    "Ортада",
    "Төменгі ортада",
    "Төменгі сол жақта",
    "Төменгі оң жақта",
    "Фон",
    "Ескертпе",
    "Мәтін бейнеге тікелей жазылады",
    "Дыбыс",
    "Дыбыс деңгейі, %",
    "Дыбыстың біртіндеп күшеюі, с",
    "Дыбыстың біртіндеп бәсеңдеуі, с",
    "Басында, с",
    "Кіру режимі",
    "Соңында, с",
    "Шығу режимі",
    "Дыбыс әлдеқашан бөлінген",
    "Дыбысты аудио жолына бөлу",
    "Бұл жерде клип бар",
    "Клип көрші клиппен қабаттасады",
    "Жаңа бастапқы кіріс нүктесі көрші клиппен қайшылық тудырады",
    "Нөмірі бойынша орналастыру",
    "Бейне жолы",
    "Тізбектің басы",
    "Ойнату курсоры тұрған жерде",
    "Таңдалған жолдың соңында",
    "Сурет ұзақтығы, сек.",
    "Реттелген медиа элементтері",
    "Орналастыру",
    "Нөмірленген суреттер немесе бейнелер жоқ.",
    "Файл атауларында нөмірі бар суреттер немесе бейнелер табылмады. Мысалы: 001.jpg, 002.jpg, 003.jpg.",
    "Көрінетін және құлпы ашылған бейне жолын таңдаңыз.",
    "Фото және музыка слайд-шоуы",
    "Фотоларды алу көзі",
    "Музыкалық жол",
    "Ұзақтық режимі",
    "Музыка ұзақтығына сәйкестендіру",
    "Әр фотоға бірдей ұзақтық",
    "Таймлайн бөлігін толтыру",
    "Фотоларға арналған бейне жолы",
    "Басталуы, сек",
    "Әр фотоның ұзақтығы, сек",
    "Бөлік ұзақтығы, сек",
    "Фотолар арасындағы өтулер",
    "Өтусіз",
    "Өту ұзақтығы, сек",
    "Бірқалыпты жақындату мен панораманы алмастыру",
    "Баяу жақындату",
    "Баяу алыстату",
    "Фотолар реті",
    "Жолдағы ретімен",
    "Атауы бойынша: A → Z",
    "Атауы бойынша: Z → A",
    "Музыкаға арналған аудио жолы",
    "Бірінші фотосуретті біртіндеп көрсету, соңғысын біртіндеп өшіру",
    "Слайд-шоу жасау",
    "Параметрлерді тексеріңіз."
  ],
  "uz": [
    "0,65 s",
    "Kadr",
    "FPS",
    "avvalroq",
    "LOYIHA",
    "· FAYL YO‘Q",
    "Loyiha",
    "Media elementlari",
    "Kliplar",
    "Davomiyligi",
    "Yetishmayotgan fayllar: {count}",
    "Media fayllar bilan bog‘lanishni tiklash uchun “Fayllarni qayta ulash” tugmasini bosing.",
    "Xususiyatlarini ko‘rish uchun klip yoki media elementini tanlang",
    "Media elementi",
    "Nomi",
    "Turi",
    "Holati",
    "fayl topilmadi",
    "Sozlamalar",
    "sukut bo‘yicha 5 s",
    "Fayl hajmi",
    "Amallar",
    "Faylni qayta ulash…",
    "Taymlaynga qo‘shish",
    "Media kutubxonasidan olib tashlash",
    "Klip",
    "Yo‘lak",
    " (qulflangan)",
    "fayl o‘chirilgan",
    "Vaqt parametrlari",
    "Davomiyligi, s",
    "Manba kirish nuqtasi, s",
    "Manba chiqish nuqtasi, s",
    "Taymlayn oxiri",
    "Manba davomiyligi",
    "Fotolarni klipning chap yoki o‘ng chetini sudrab qisqartirish mumkin. Ularning davomiyligi manba fayl bilan cheklanmaydi. Aniq qiymat uchun yuqoriga soniyani kiriting.",
    "Shaffoflik, %",
    "Masshtab, %",
    "Markaz X, %",
    "Markaz Y, %",
    "Moslashtirish rejimi",
    "To‘liq sig‘dirish",
    "Kadrni to‘ldirish (qirqish)",
    "Kamera harakati",
    "Harakatsiz",
    "Silliq kattalashtirish",
    "Silliq kichraytirish",
    "Chapga panorama",
    "O‘ngga panorama",
    "Yuqoriga panorama",
    "Pastga panorama",
    "Aylantirish, °",
    "Akslantirish",
    "Gorizontal",
    "Vertikal",
    "Tiklash",
    "Rangni to‘g‘rilash",
    "Yorqinlik, %",
    "Kontrast, %",
    "Klip sarlavhalari",
    "Matn",
    "Sarlavha yoki izoh kiriting…",
    "Shrift o‘lchami",
    "Matn rangi",
    "Joylashuv",
    "Yuqori markaz",
    "Markaz",
    "Pastki markaz",
    "Pastki chap",
    "Pastki o‘ng",
    "Fon",
    "Izoh",
    "Matn videoga joylanadi",
    "Audio",
    "Ovoz balandligi, %",
    "Ovozning asta ko‘tarilishi, s",
    "Ovozning asta pasayishi, s",
    "Boshida, s",
    "Kirish rejimi",
    "Oxirida, s",
    "Chiqish rejimi",
    "Audio allaqachon ajratilgan",
    "Audioni audio yo‘lagiga ajratish",
    "Bu joyda klip allaqachon bor",
    "Klip qo‘shni klip bilan ustma-ust tushadi",
    "Yangi manba kirish nuqtasi qo‘shni klip bilan ziddiyatga olib keladi",
    "Raqam bo‘yicha joylashtirish",
    "Video yo‘lagi",
    "Ketma-ketlik boshi",
    "Ijro ko‘rsatkichi joylashuvi",
    "Tanlangan yo‘lak oxirida",
    "Rasm davomiyligi, sek.",
    "Tartiblangan media elementlari",
    "Joylashtirish",
    "Raqamlangan rasm yoki videolar mavjud emas.",
    "Fayl nomida raqam bo‘lgan rasm yoki videolar topilmadi. Masalan: 001.jpg, 002.jpg, 003.jpg.",
    "Ko‘rinadigan va qulfi ochilgan video yo‘lagini tanlang.",
    "Foto va musiqadan slayd-shou",
    "Fotolarni olish manbasi",
    "Musiqa yo‘lagi",
    "Davomiylik rejimi",
    "Musiqa uzunligiga moslashtirish",
    "Har bir fotoga bir xil vaqt",
    "Taymlayn oralig‘ini to‘ldirish",
    "Fotolar uchun video yo‘lagi",
    "Boshlanishi, sek",
    "Har bir foto davomiyligi, sek",
    "Oraliq uzunligi, sek",
    "Fotolar orasidagi o‘tishlar",
    "O‘tishlarsiz",
    "O‘tish davomiyligi, sek",
    "Silliq kattalashtirish va panoramani navbatlash",
    "Sekin kattalashtirish",
    "Sekin kichraytirish",
    "Fotolar tartibi",
    "Yo‘lakdagi tartib bo‘yicha",
    "Nomi bo‘yicha: A → Z",
    "Nomi bo‘yicha: Z → A",
    "Musiqa uchun audio yo‘lagi",
    "Birinchi fotoni sekin ochish va oxirgisini sekin o‘chirish",
    "Slayd-shou yaratish",
    "Sozlamalarni tekshiring."
  ],
  "az": [
    "0,65 s",
    "Kadr",
    "FPS",
    "əvvəl",
    "LAYİHƏ",
    "· FAYL YOXDUR",
    "Layihə",
    "Media elementləri",
    "Kliplər",
    "Müddət",
    "Çatışmayan fayllar: {count}",
    "Media faylları ilə bağlantıları bərpa etmək üçün «Faylları yenidən qoş» düyməsini basın.",
    "Xüsusiyyətlərini görmək üçün klipi və ya media elementini seçin",
    "Media elementi",
    "Ad",
    "Növ",
    "Vəziyyət",
    "fayl yoxdur",
    "Parametrlər",
    "standart olaraq 5 s",
    "Fayl ölçüsü",
    "Əməliyyatlar",
    "Faylı yenidən qoş…",
    "Taymlayna əlavə et",
    "Media kitabxanasından sil",
    "Klip",
    "Yol",
    " (kilidli)",
    "fayl silinib",
    "Vaxtlama",
    "Müddət, s",
    "Mənbə giriş nöqtəsi, s",
    "Mənbə çıxış nöqtəsi, s",
    "Taymlaynın sonu",
    "Mənbə müddəti",
    "Fotoları klipin sol və ya sağ kənarını dartaraq kəsmək olar. Onların müddəti mənbə faylı ilə məhdudlaşmır. Dəqiq dəyər üçün yuxarıya saniyə ilə daxil edin.",
    "Şəffaflıq, %",
    "Miqyas, %",
    "Mərkəz X, %",
    "Mərkəz Y, %",
    "Uyğunlaşdırma rejimi",
    "Tam yerləşdir",
    "Kadrı doldur (kəs)",
    "Kamera hərəkəti",
    "Hərəkətsiz",
    "Yumşaq yaxınlaşdırma",
    "Yumşaq uzaqlaşdırma",
    "Sola panorama",
    "Sağa panorama",
    "Yuxarı panorama",
    "Aşağı panorama",
    "Fırlanma, °",
    "Çevir",
    "Üfüqi",
    "Şaquli",
    "Sıfırla",
    "Rəng korreksiyası",
    "Parlaqlıq, %",
    "Kontrast, %",
    "Klip başlıqları",
    "Mətn",
    "Başlıq və ya qeyd daxil edin…",
    "Şrift ölçüsü",
    "Mətn rəngi",
    "Mövqe",
    "Yuxarı mərkəzdə",
    "Mərkəzdə",
    "Aşağı mərkəzdə",
    "Aşağı solda",
    "Aşağı sağda",
    "Fon",
    "Qeyd",
    "Mətn videoya yerləşdirilir",
    "Audio",
    "Səs səviyyəsi, %",
    "Səsin tədricən artması, s",
    "Səsin tədricən azalması, s",
    "Başlanğıcda, s",
    "Giriş rejimi",
    "Sonda, s",
    "Çıxış rejimi",
    "Səs artıq ayrılıb",
    "Səsi audio yoluna ayır",
    "Burada artıq klip var",
    "Klip qonşu kliplə üst-üstə düşəcək",
    "Yeni mənbə giriş nöqtəsi qonşu kliplə ziddiyyət yaradacaq",
    "Nömrəyə görə yerləşdir",
    "Video yolu",
    "Ardıcıllığın başlanğıcı",
    "İcra göstəricisində",
    "Seçilmiş yolun sonunda",
    "Təsvirin müddəti, san.",
    "Ardıcıllıqla media elementləri",
    "Yerləşdir",
    "Nömrələnmiş şəkil və ya video yoxdur.",
    "Fayl adında rəqəm olan şəkil və ya video tapılmadı. Məsələn: 001.jpg, 002.jpg, 003.jpg.",
    "Görünən və kilidi açılmış video yolunu seçin.",
    "Foto və musiqi slayd-şousu",
    "Fotoların mənbəyi",
    "Musiqi yolu",
    "Müddət rejimi",
    "Musiqinin uzunluğuna uyğunlaşdır",
    "Hər fotoya eyni müddət",
    "Taymlayn sahəsini doldur",
    "Fotolar üçün video yolu",
    "Başlanğıc, san.",
    "Hər fotonun müddəti, san.",
    "Sahənin uzunluğu, san.",
    "Fotolar arasındakı keçidlər",
    "Keçidsiz",
    "Keçidin müddəti, san.",
    "Yumşaq yaxınlaşdırma və panoramanı növbələşdir",
    "Yavaş yaxınlaşdırma",
    "Yavaş uzaqlaşdırma",
    "Fotoların sırası",
    "Yolda yerləşdirildiyi kimi",
    "Ada görə: A → Z",
    "Ada görə: Z → A",
    "Musiqi üçün audio yolu",
    "İlk fotonun tədricən görünməsi və sonuncunun qaralması",
    "Slayd-şou yarat",
    "Parametrləri yoxlayın."
  ],
  "ka": [
    "0,65 წმ",
    "კადრი",
    "FPS",
    "ადრე",
    "პროექტი",
    "· ფაილი არ არის",
    "პროექტი",
    "მედია ფაილები",
    "კლიპები",
    "ხანგრძლივობა",
    "დაკარგული ფაილები: {count}",
    "მედია ფაილებთან კავშირის აღსადგენად დააჭირეთ „ფაილების ხელახლა დაკავშირებას“.",
    "თვისებების სანახავად აირჩიეთ კლიპი ან მედია ფაილი",
    "მედია ფაილი",
    "სახელი",
    "ტიპი",
    "მდგომარეობა",
    "ფაილი დაკარგულია",
    "პარამეტრები",
    "ნაგულისხმევად 5 წმ",
    "ფაილის ზომა",
    "მოქმედებები",
    "ფაილის ხელახლა დაკავშირება…",
    "ტაიმლაინზე დამატება",
    "მედია ბიბლიოთეკიდან წაშლა",
    "კლიპი",
    "ტრეკი",
    " (დაბლოკილია)",
    "ფაილი წაშლილია",
    "დრო",
    "ხანგრძლივობა, წმ",
    "წყაროს შესვლის წერტილი, წმ",
    "წყაროს გამოსვლის წერტილი, წმ",
    "ტაიმლაინის დასასრული",
    "წყაროს ხანგრძლივობა",
    "ფოტოების მოჭრა შესაძლებელია კლიპის მარცხენა ან მარჯვენა კიდის გადათრევით. მათი ხანგრძლივობა საწყისი მედიის ხანგრძლივობით შეზღუდული არ არის. ზუსტი მნიშვნელობისთვის ზემოთ მიუთითეთ წამები.",
    "გამჭვირვალობა, %",
    "მასშტაბი, %",
    "ცენტრი X, %",
    "ცენტრი Y, %",
    "მორგების რეჟიმი",
    "მთლიანად ჩატევა",
    "კადრის შევსება (მოჭრა)",
    "კამერის მოძრაობა",
    "მოძრაობის გარეშე",
    "რბილი მიახლოება",
    "რბილი დაშორება",
    "პანორამა მარცხნივ",
    "პანორამა მარჯვნივ",
    "პანორამა ზემოთ",
    "პანორამა ქვემოთ",
    "ბრუნვა, °",
    "გადაბრუნება",
    "ჰორიზონტალური",
    "ვერტიკალური",
    "გადატვირთვა",
    "ფერის კორექცია",
    "სიკაშკაშე, %",
    "კონტრასტი, %",
    "კლიპის სათაურები",
    "ტექსტი",
    "შეიყვანეთ სათაური ან წარწერა…",
    "შრიფტის ზომა",
    "ტექსტის ფერი",
    "მდებარეობა",
    "ზედა ცენტრში",
    "ცენტრში",
    "ქვედა ცენტრში",
    "ქვედა მარცხნივ",
    "ქვედა მარჯვნივ",
    "ფონი",
    "შენიშვნა",
    "ტექსტი ვიდეოში ჩაიწერება",
    "აუდიო",
    "ხმის დონე, %",
    "ხმის თანდათან მომატება, წმ",
    "ხმის თანდათან ჩაწევა, წმ",
    "დასაწყისში, წმ",
    "გამოჩენის რეჟიმი",
    "დასასრულს, წმ",
    "გაქრობის რეჟიმი",
    "აუდიო უკვე გამოყოფილია",
    "აუდიოს ტრეკზე გამოყოფა",
    "ამ ადგილას კლიპი უკვე არსებობს",
    "კლიპი მეზობელ კლიპს გადაფარავს",
    "წყაროს ახალი შესვლის წერტილი მეზობელ კლიპთან კონფლიქტს შექმნის",
    "ნომრის მიხედვით დალაგება",
    "ვიდეოტრეკი",
    "მიმდევრობის დასაწყისი",
    "დაკვრის მაჩვენებლის პოზიციაზე",
    "არჩეული ტრეკის ბოლოს",
    "გამოსახულების ხანგრძლივობა, წმ",
    "მედია ელემენტები რიგის მიხედვით",
    "დალაგება",
    "ნომრიანი სურათები ან ვიდეოები ხელმისაწვდომი არ არის.",
    "ფაილის სახელში ციფრების მქონე სურათები ან ვიდეოები ვერ მოიძებნა. მაგალითად: 001.jpg, 002.jpg, 003.jpg.",
    "აირჩიეთ ხილული და განბლოკილი ვიდეოტრეკი.",
    "ფოტოებისა და მუსიკის სლაიდშოუ",
    "ფოტოები საიდან",
    "მუსიკალური ტრეკი",
    "ხანგრძლივობის რეჟიმი",
    "მუსიკის ხანგრძლივობაზე მორგება",
    "ერთნაირი ხანგრძლივობა თითო ფოტოზე",
    "ტაიმლაინის მონაკვეთის შევსება",
    "ვიდეოტრეკი ფოტოებისთვის",
    "დასაწყისი, წმ",
    "ხანგრძლივობა თითო ფოტოზე, წმ",
    "მონაკვეთის სიგრძე, წმ",
    "გადასვლები ფოტოებს შორის",
    "გადასვლების გარეშე",
    "გადასვლის ხანგრძლივობა, წმ",
    "რბილი მიახლოებისა და პანორამის მონაცვლეობა",
    "ნელი მიახლოება",
    "ნელი დაშორება",
    "ფოტოების რიგი",
    "ტრეკზე განლაგების მიხედვით",
    "სახელის მიხედვით: A → Z",
    "სახელის მიხედვით: Z → A",
    "მუსიკის აუდიოტრეკი",
    "პირველი ფოტოს გამოჩენა და ბოლო ფოტოს თანდათან ჩაქრობა",
    "სლაიდშოუს შექმნა",
    "შეამოწმეთ პარამეტრები."
  ]
};
  for (const [code, values] of Object.entries(wave2Data)) {
    const current = packs[code];
    if (!current || !Array.isArray(values) || values.length !== wave2Phrases.length) {
      throw new Error("Invalid CIS wave 2 translation data for " + code);
    }
    const messages = Object.assign(Object.create(null), current.messages);
    wave2Phrases.forEach((phrase, index) => {
      const sourceKeys = sourceByEnglish.get(phrase) || [];
      for (const source of sourceKeys) messages[source] = values[index];
    });
    const englishFallbackKeys = Object.keys(english).filter(source => !Object.prototype.hasOwnProperty.call(messages, source));
    packs[code] = Object.freeze({
      ...current,
      appTitle: current.appTitle,
      coverage: "regional-workflows-204",
      localeMappedCount: Object.keys(messages).length,
      englishFallbackCount: englishFallbackKeys.length,
      englishFallbackKeys: Object.freeze(englishFallbackKeys),
      translationStatus: "preview",
      translationStage: "cis-central-asia-wave-2",
      completedTranslationWave: "beta-3.6.43-cis-wave-2",
      messages: Object.freeze(messages)
    });
  }

  // CIS localization wave 3: complete the remaining reference strings for Kazakh,
  // Uzbek (Latin), Azerbaijani and Georgian. The values are ordered by the English
  // source-map keys still missing after wave 2; the order is checked at runtime.
  const wave3SourceKeys = Object.keys(english).filter(source =>
    !Object.prototype.hasOwnProperty.call(packs.kk.messages, source)
  );
  const wave3Data = {"kk":["Толқынды жою","Таңдалған маркерді жою","Клипті 1 кадр солға жылжыту","Клипті 1 кадр оңға жылжыту","10 кадр солға жылжыту","10 кадр оңға жылжыту","Таңдауды алып тастау","Ені бойынша сыйдыру","Үштен бір ережесінің бағыттауыштары","Қауіпсіз жиектер","Үштен бір торы және қауіпсіз жиектер","Бағыттауыштарды жасыру","Жабыстыруды ауыстыру","20 өтпе","Басында біртіндеп көріну әсерін қолдану","Соңында біртіндеп жоғалу әсерін қолдану","Алдыңғы клиппен айқаспалы еру","Сол жақтан шторканы алдыңғы клиппен қолдану","Оң жақтан шторканы алдыңғы клиппен қолдану","Клип өтпелерін алып тастау","FFmpeg және ffprobe диагностикасы…","Кеңестер ҚОСУЛЫ","Кеңестерді өшіру","Кеңестер ӨШІРУЛІ","Медианы импорттау","⇅ Нөмір бойынша орналастыру","Сандық рет: 1, 2, 3… немесе 001, 002, 003…","Анимациясын көру үшін карточкаға меңзерді апарыңыз. Оны клипке сүйреңіз: сол жақ шеті — кіру, оң жақ шеті — шығу әсері. Клиптер арасына апарсаңыз, қабаттасу жасалады. Карточканы басу таңдалған клипке кіру әсерін қолданады.","01 тізбегі","Кітапханадан медианы жолға сүйреңіз","Редактормен танысу","«Монтажнаяға» қош келдіңіз!","Негізгі әрекеттерді қарапайым қадамдармен көрсетемін. Қажетті түймені өзіңіз баспайынша жобаңызда ештеңе өзгермейді.","Өз қарқыныңызбен жүріп, танысуды кез келген уақытта жаба аласыз.","Кейінірек","Артқа","Танысуды бастау","Монтаж тізбегін экспорттау","Мақсатты орташа битрейт","2 Мбит/с (орташа)","5 Мбит/с (орташа)","10 Мбит/с (орташа)","20 Мбит/с (орташа)","40 Мбит/с (орташа)","Басы, с","Соңы, с","Басы = ойнату көрсеткіші","Соңы = ойнату көрсеткіші","Тек таңдалған аралықты экспорттауға болады. Уақыт таймлайн басынан бастап секундпен өлшенеді, ал аралық шектері таңдалған кадр жиілігіне дейін дөңгелектенеді.","Сақталмаған өзгерістер бар","Кеңестерді басқару","Толық кеңестерді қосу","Толық кеңестерді өшіру","Жобаны сақтау (Ctrl+S)","Бейне, музыка немесе фотосурет қосу","Фотосуреттерді музыкаға автоматты түрде реттеу","Бейнені экспорттау (Ctrl+E)","Суреттер мен бейнелерді файл атауларындағы сандар бойынша орналастыру","Өтпені табу…","Өтпелерді іздеу","Жобаның ағымдағы параметрлері","Басына өту (Home)","Алдыңғы кадр (←)","Ойнату / кідірту (Space)","Келесі кадр (→)","Соңына өту (End)","Тоқтату (басына қайту)","Жоба кадр жиілігі","Кадр пішімінің арақатынасы","Жоба ажыратымдылығы","Кішірейту","Масштаб","Үлкейту","Клип жиектері мен ойнату көрсеткішін жабыстыру","Қию нүктесінде","Клип жиегі","қабаттасу","кіру/шығу","Өтпелер табылмады","Қара түстен біртіндеп көріну","Ақ түстен біртіндеп көріну","Ақ жарқыл","Төменгі шторка","Жоғарғы шторка","Диагональды шторка","Жоғары жылжыту","Төмен жылжыту","Дөңгелек диафрагма","Ромб","Жұмсақ фокус","Айналдыру","Бірқалыпты көріну / жоғалу","Классикалық қараңғылау","Жұмсақ ашық өтпе","Қысқа кинематографиялық жарқыл","Екі көріністі жұмсақ араластыру","Жаңа кадр солдан оңға қарай ашылады","Жаңа кадр оңнан солға қарай ашылады","Төменнен жоғары ашылады","Жоғарыдан төмен ашылады","Диагональ бойынша ашылу","Жаңа көрініс оң жақтан сырғып кіреді","Жаңа көрініс сол жақтан сырғып кіреді","Жаңа көрініс төменнен сырғып кіреді","Жаңа көрініс жоғарыдан сырғып кіреді","Кадрға бірқалыпты жақындау","Жақын пландағы кадрдан жұмсақ ашылу","Шеңбер кадр шеттеріне дейін кеңейеді","Ортасынан геометриялық ашылу","Бұлыңғыр кадр анық болады","Жеңіл айналмалы өтпе","Интерфейс тілі…","Автоматты (жүйе тілі)","Қосымша тілдер бөлек пакеттермен қосылады.","Интерфейс тілі осы компьютерде сақталады.","Қолдану","Қолжетімді","Жақында","Аударма пакеті орнатылмаған","Montazhnaya","Қанықтық, %","Түс стилі","Стиль жоқ","Кинематографиялық","Ақ-қара","Сепия","Винтаж","Суық","Жылы","Түнгі","Түс түзетуін қалпына келтіру","Тек файл атауларында сандары бар суреттер мен бейнелер қосылады. Рет сандық болады, сондықтан 2 саны 10-нан бұрын орналасады. Клиптер қабаттаспай, тізбектей қойылады.","Ағымдағы кадрды сақтау","Таймлайнның ағымдағы орнындағы толық композиция сақталады: көрінетін бейне қабаттары, өтпелер, түс түзетуі, түрлендірулер және титрлер. Монтаж бағыттауыштары суретке кірмейді.","Сурет пішімі","PNG — шығынсыз","JPEG — файл көлемі кішірек","Ұзын қыры бойынша Full HD","Ұзын қыры бойынша 4K UHD","JPEG сапасы","Кадрды сақтау…","FFmpeg және ffprobe диагностикасы","Құралдардың жолдары PATH немесе FFMPEG_PATH / FFPROBE_PATH айнымалыларынан алынады.","Қайта тексеру","Тексеру әлі іске қосылған жоқ.","Тексерілуде…","Диагностиканы орындау мүмкін болмады","Редакторды қайта іске қосып, тексеруді қайталаңыз. Қате сақталса, орнатылымның бүтіндігін тексеріңіз.","Импортталған файлдар: {count}","Нөмір бойынша орналастырылды: {count} файл · {duration}.","{format} экспорты аяқталды: {file}","Таймлайнда · {track} · {name} ({duration})","Медиа кітапханасында · {name} ({duration})","Фотосуреттер ({count})","Сақталмаған жоба табылды ({savedAt}): клиптер — {clips}, медиа — {media}. Қалпына келтірілсін бе?","Анықтаманы көрсету","Клиптерді байланыстыру","Бейнені аудиодан ажырату","Байланысты үзу","Қосу","Өшіру","Жасыру","Көрсету","1280 × 720 · 30 FPS","Alt+←","Alt+→","Ctrl+Alt+←","Ctrl+Alt+→","Shift+Alt+←","Shift+Alt+→","КБ","МБ","ГБ","Танысуды жабу","Файлдар жоқ","Файлдарды импорттау","Болдырмау (Ctrl+Z)","Қайталау (Ctrl+Y)","Дыбысты бөлу","Бейне мен аудионы байланыстыру","Бейне мен аудио байланыстырылды","Бұл орында маркер бар","Маркер қосылды","Маркердің атауы өзгертілді","Маркер жойылды","Маркерді таңдаңыз немесе ойнату көрсеткішін оның жанына қойыңыз","Жобада әзірге маркерлер жоқ","Келесі маркер жоқ","Алдыңғы маркер жоқ","Алдымен бейнені немесе оның аудиоклипін таңдаңыз","Бұл бейне мен аудио әлдеқашан байланыстырылған","Жұпты бірмәнді анықтау мүмкін болмады. Бастапқы бейне мен одан бөлінген дыбыс таңдалғанын тексеріңіз.","Тек бейнеклип пен сол бейнеден бөлінген дыбысты байланыстыруға болады","Байланыс қалпына келтірілді. Аудионың ағымдағы ығысуы сақталды; енді клиптер бірге жылжиды.","Бейне мен аудио байланысы қалпына келтірілді. Енді олар бірге жылжиды.","Байланыстырылған бейне немесе аудиоклипті таңдаңыз","Жол құлыпталған","Материалды жолға орналастыру мүмкін болмады","Алдымен бейнеклипті таңдаңыз","Дыбысын бөлу үшін бейнежолдағы бейнені таңдаңыз","Алдымен бейнежолдың құлпын ашыңыз","Бұл клиптің дыбысы бөлек аудиожолда орналасқан","Бұл бейнеде аудио ағыны табылмады","Аудиоклип жасау мүмкін болмады. Аудиожолдардың қолжетімділігін тексеріңіз.","Байланыстырылған жұпты жылжыту мүмкін емес: жаңа орында жолдардың бірі бос емес","Клип жойылды","Ripple арқылы жою аяқталды","Клип жылжытылды","Кесу нүктесі жиекке тым жақын.","Өтпелер бейнеклиптерге қолданылады","Бейнеклипті таңдаңыз немесе өтпені таймлайнға сүйреңіз","Файлдарды осында сүйреңіз","немесе «Медианы импорттау» түймесін басыңыз","Бейне · Аудио · Суреттер","Файлдар қайта байланыстырылмады","Кейбір медиафайлдар жоқ. Оларды қайта байланыстырыңыз — монтаж автоматты түрде қалпына келтіріледі.","Сынақ кодтау және ffprobe арқылы тексеру","Орнатылған жинақтың мүмкіндіктері","Маңызды мәселелер анықталмады. Қайта тексеру үшін «Қайта тексеру» түймесін басыңыз.","Құралдардың жолдары мен нұсқалары анықталып, кодектер тексеріледі және қысқа сынақ MP4 файлы жасалады.","FFmpeg пен ffprobe, H.264/AAC және VP8/VP9/Opus кодтағыштары, PNG декодтауы және MP4/WebM контейнерлері тексеріледі. Редактор қолжетімді нұсқалар үшін қысқа сынақ файлдарын жасап, ағындар мен уақыт белгілерін ffprobe арқылы тексереді. Уақытша файлдар тексеруден кейін жойылады.","Браузерде нақты уақытта жазу","MediaRecorder жүйе жүктемесі мен көрсету цикліне тәуелді.","MP4 үшін AAC дыбысы тексерілген.","WebM үшін VP8/VP9 бейнесі және Opus дыбысы тексерілген.","Ағындар","Орын: ","кадр № ","Ағымдағы кідіртілген кадр экспортталады.","Кадрлар","сек","мин"],"uz":["Ripple bilan o‘chirish","Tanlangan markerni o‘chirish","Klipni 1 kadr chapga surish","Klipni 1 kadr o‘ngga surish","10 kadr chapga surish","10 kadr o‘ngga surish","Tanlovni bekor qilish","Eniga moslashtirish","Uchdan bir qoidasi yo‘riqchilari","Xavfsiz chegaralar","Uchdan bir to‘ri va xavfsiz chegaralar","Yo‘riqchilarni yashirish","Magnitga yopishishni almashtirish","20 ta o‘tish","Boshida sekin paydo bo‘lishni qo‘llash","Oxirida sekin yo‘qolishni qo‘llash","Oldingi klip bilan kross-erish","Oldingi klip bilan chap parda o‘tishini qo‘llash","Oldingi klip bilan o‘ng parda o‘tishini qo‘llash","Klip o‘tishlarini olib tashlash","FFmpeg va ffprobe diagnostikasi…","Maslahatlar YOQILGAN","Maslahatlarni o‘chirish","Maslahatlar O‘CHIRILGAN","Mediani import qilish","⇅ Raqam bo‘yicha joylashtirish","Raqamli tartib: 1, 2, 3… yoki 001, 002, 003…","Animatsiyani ko‘rish uchun kursorni kartaga olib boring. Uni klip ustiga sudrang: chap cheti kirish, o‘ng cheti chiqish effektini qo‘llaydi. Kliplar orasiga tashlasangiz, ustma-ust tushish hosil bo‘ladi. Kartani bosish tanlangan klipga kirish effektini qo‘llaydi.","01-ketma-ketlik","Kutubxonadagi mediani trekka sudrang","Muharrir bilan tanishuv","Montazhnaya dasturiga xush kelibsiz!","Asosiy amallarni sodda qadamlar bilan ko‘rsataman. Kerakli tugmani o‘zingiz bosmaguningizcha loyihangizda hech narsa o‘zgarmaydi.","O‘zingizga qulay tezlikda davom eting va tanishuvni istalgan payt yopishingiz mumkin.","Keyinroq","Orqaga","Tanishuvni boshlash","Montaj ketma-ketligini eksport qilish","Maqsadli o‘rtacha bitreyt","2 Mbit/s (o‘rtacha)","5 Mbit/s (o‘rtacha)","10 Mbit/s (o‘rtacha)","20 Mbit/s (o‘rtacha)","40 Mbit/s (o‘rtacha)","Boshlanishi, s","Tugashi, s","Boshlanish = ijro ko‘rsatkichi","Tugash = ijro ko‘rsatkichi","Faqat tanlangan oraliqni eksport qilish mumkin. Vaqt taymlayn boshidan boshlab soniyalarda o‘lchanadi, oraliq chegaralari esa tanlangan kadrlar tezligiga moslab yaxlitlanadi.","Saqlanmagan o‘zgarishlar bor","Maslahatlarni boshqarish","Batafsil maslahatlarni yoqish","Batafsil maslahatlarni o‘chirish","Loyihani saqlash (Ctrl+S)","Video, musiqa yoki surat qo‘shish","Fotolarni musiqaga avtomatik joylashtirish","Videoni eksport qilish (Ctrl+E)","Rasm va videolarni fayl nomidagi raqamlar bo‘yicha joylashtirish","O‘tishni topish…","O‘tishlarni qidirish","Loyihaning joriy sozlamalari","Boshiga o‘tish (Home)","Oldingi kadr (←)","Ijro / pauza (Space)","Keyingi kadr (→)","Oxiriga o‘tish (End)","To‘xtatish (boshiga qaytish)","Loyiha kadrlar tezligi","Tomonlar nisbati","Loyiha aniqligi","Kichraytirish","Masshtab","Kattalashtirish","Klip chetlari va ijro ko‘rsatkichini magnit bilan yopishtirish","Montaj birikmasida","Klip cheti","ustma-ust tushish","kirish/chiqish","O‘tishlar topilmadi","Qora rangdan asta paydo bo‘lish","Oq rangdan asta paydo bo‘lish","Oq chaqnash","Pastdan parda","Yuqoridan parda","Diagonal parda","Yuqoriga siljitish","Pastga siljitish","Doira shaklidagi diafragma","Romb","Yumshoq fokus","Aylantirish","Silliq paydo bo‘lish / yo‘qolish","Klassik qoraytirish","Yumshoq yorqin o‘tish","Qisqa kinematografik chaqnash","Ikki kadrni silliq aralashtirish","Yangi kadr chapdan o‘ngga ochiladi","Yangi kadr o‘ngdan chapga ochiladi","Pastdan yuqoriga ochiladi","Yuqoridan pastga ochiladi","Diagonal bo‘ylab ochilish","Yangi kadr o‘ngdan sirg‘alib kiradi","Yangi kadr chapdan sirg‘alib kiradi","Yangi kadr pastdan sirg‘alib kiradi","Yangi kadr yuqoridan sirg‘alib kiradi","Kadrga silliq yaqinlashish","Yaqin plandan yumshoq uzoqlashish","Doira kadr chetlarigacha kengayadi","Markazdan geometrik ochilish","Xira kadr tiniqlashadi","Yengil aylanuvchi o‘tish","Interfeys tili…","Avtomatik (tizim tili)","Qo‘shimcha tillar alohida paketlar sifatida qo‘shiladi.","Interfeys tili ushbu kompyuterda saqlanadi.","Qo‘llash","Mövcud","Tez orada","Tarjima paketi o‘rnatilmagan","Montazhnaya","To‘yinganlik, %","Rang uslubi","Uslubsiz","Kinematografik","Oq-qora","Sepiya","Vintage","Sovuq","Iliq","Tungi","Rang tuzatishni tiklash","Faqat fayl nomida raqamlar bo‘lgan rasm va videolar qo‘shiladi. Tartib sonli bo‘ladi, shuning uchun 2 soni 10 dan oldin keladi. Kliplar ustma-ust tushmasdan ketma-ket joylashtiriladi.","Joriy kadrni saqlash","Taymlaynning joriy holatidagi to‘liq kompozitsiya saqlanadi: ko‘rinadigan video qatlamlari, o‘tishlar, rang tuzatish, o‘zgartirishlar va sarlavhalar. Montaj yo‘riqchilari rasmga kiritilmaydi.","Rasm formati","PNG — yo‘qotishsiz","JPEG — kichikroq fayl","Uzun tomoni bo‘yicha Full HD","Uzun tomoni bo‘yicha 4K UHD","JPEG sifati","Kadrni saqlash…","FFmpeg va ffprobe diagnostikasi","Dasturlar yo‘llari PATH yoki FFMPEG_PATH / FFPROBE_PATH o‘zgaruvchilaridan olinadi.","Qayta tekshirish","Tekshiruv hali ishga tushirilmagan.","Tekshirilmoqda…","Diagnostikani bajarib bo‘lmadi","Muharrirni qayta ishga tushiring va tekshiruvni takrorlang. Xato saqlansa, o‘rnatish yaxlitligini tekshiring.","Import qilingan fayllar: {count}","Raqam bo‘yicha joylashtirildi: {count} fayl · {duration}.","{format} eksporti tugadi: {file}","Taymlaynda · {track} · {name} ({duration})","Media kutubxonasida · {name} ({duration})","Fotolar ({count})","Saqlanmagan loyiha topildi ({savedAt}): kliplar — {clips}, media — {media}. Tiklansinmi?","Yordamni ko‘rsatish","Kliplarni bog‘lash","Videoni audiodan ajratish","Bog‘lanishni uzish","Yoqish","O‘chirish","Yashirish","Ko‘rsatish","1280 × 720 · 30 FPS","Alt+←","Alt+→","Ctrl+Alt+←","Ctrl+Alt+→","Shift+Alt+←","Shift+Alt+→","KB","MB","GB","Tanishuvni yopish","Fayllar yo‘q","Fayllarni import qilish","Bekor qilish (Ctrl+Z)","Qaytarish (Ctrl+Y)","Audioni ajratish","Video va audioni bog‘lash","Video va audio bog‘landi","Bu joyda marker bor","Marker qo‘shildi","Marker nomi o‘zgartirildi","Marker o‘chirildi","Markerni tanlang yoki ijro ko‘rsatkichini uning yoniga olib boring","Loyihada hozircha markerlar yo‘q","Keyingi marker yo‘q","Oldingi marker yo‘q","Avval video yoki uning audio klipini tanlang","Bu video va audio allaqachon bog‘langan","Mos juftlikni aniq topib bo‘lmadi. Asl video va undan ajratilgan audio tanlanganini tekshiring.","Faqat video klip va shu videodan ajratilgan audioni bog‘lash mumkin","Bog‘lanish tiklandi. Audioning joriy siljishi saqlandi; endi kliplar birga harakatlanadi.","Video va audio bog‘lanishi tiklandi. Endi ular birga harakatlanadi.","Bog‘langan video yoki audio klipni tanlang","Trek qulflangan","Mediani trekka joylashtirib bo‘lmadi","Avval video klipni tanlang","Ovozini ajratish uchun video trekdagi videoni tanlang","Avval video trek qulfini oching","Bu klipning audiosi allaqachon alohida audio trekda","Bu videoda audio oqimi topilmadi","Audio klip yaratib bo‘lmadi. Audio treklar mavjudligini tekshiring.","Bog‘langan juftlikni siljitib bo‘lmaydi: yangi joyda treklardan biri band","Klip o‘chirildi","Ripple usulida o‘chirish tugadi","Klip surildi","Kesish nuqtasi chetga juda yaqin.","O‘tishlar video kliplarga qo‘llanadi","Video klipni tanlang yoki o‘tishni taymlaynga sudrang","Fayllarni bu yerga sudrang","yoki “Medianı import qilish” tugmasini bosing","Video · Audio · Rasmlar","Fayllar qayta ulanmagan","Ba’zi media fayllar yo‘q. Ularni qayta ulang — montaj avtomatik tiklanadi.","Sinov kodlashi va ffprobe tekshiruvi","O‘rnatilgan versiya imkoniyatlari","Muhim muammolar topilmadi. Qayta tekshirish uchun “Qayta tekshirish” tugmasini bosing.","Dasturlarning yo‘llari va versiyalari aniqlanadi, kodeklar tekshiriladi va qisqa sinov MP4 fayli yaratiladi.","FFmpeg va ffprobe, H.264/AAC hamda VP8/VP9/Opus kodlagichlari, PNG dekodlash va MP4/WebM konteynerlari tekshiriladi. Muharrir mavjud variantlar uchun qisqa sinov fayllarini yaratadi va oqimlar hamda vaqt belgilarini ffprobe orqali tekshiradi. Vaqtinchalik fayllar tekshiruvdan so‘ng o‘chiriladi.","Brauzerda real vaqt rejimida yozib olish","MediaRecorder tizim yuklanishi va chizish sikliga bog‘liq.","MP4 uchun AAC audiosi tekshirilgan.","WebM uchun VP8/VP9 videosi va Opus audiosi tekshirilgan.","Oqimlar","Joylashuv: ","kadr № ","Pauzadagi joriy kadr eksport qilinadi.","Kadrlar","son","daq"],"az":["Ripple silmə","Seçilmiş markeri sil","Klipi 1 kadr sola sürüşdür","Klipi 1 kadr sağa sürüşdür","10 kadr sola sürüşdür","10 kadr sağa sürüşdür","Seçimi ləğv et","Eninə sığdır","Üçdəbir qaydasının bələdçiləri","Təhlükəsiz sahələr","Üçdəbir toru və təhlükəsiz sahələr","Bələdçi xətlərini gizlət","Yapışdırmanı dəyiş","20 keçid","Başlanğıcda tədricən görünməni tətbiq et","Sonda tədricən yox olmanı tətbiq et","Əvvəlki kliplə çarpaz ərimə","Əvvəlki kliplə soldan pərdə keçidini tətbiq et","Əvvəlki kliplə sağdan pərdə keçidini tətbiq et","Klip keçidlərini sil","FFmpeg və ffprobe diaqnostikası…","Məsləhətlər AKTİVDİR","Məsləhətləri söndür","Məsləhətlər SÖNÜBDÜR","Medianı idxal et","⇅ Nömrəyə görə yerləşdir","Rəqəmsal sıra: 1, 2, 3… və ya 001, 002, 003…","Animasiyanı görmək üçün kursoru kartın üzərinə gətirin. Onu klipə sürükləyin: sol kənar giriş, sağ kənar çıxış effektini tətbiq edir. Kliplərin arasına buraxdıqda üst-üstə düşmə yaranır. Kartı klikləmək seçilmiş klipə giriş effekti tətbiq edir.","Ardıcıllıq 01","Kitabxanadan medianı trekə sürükləyin","Redaktorla tanışlıq","Montazhnaya proqramına xoş gəlmisiniz!","Əsas əməliyyatları sadə addımlarla göstərəcəyəm. Lazım olan düyməni özünüz basmayınca layihənizdə heç nə dəyişməyəcək.","Öz tempinizlə davam edə və tanışlığı istənilən vaxt bağlaya bilərsiniz.","Sonra","Geri","Tanışlığa başla","Montaj ardıcıllığını ixrac et","Hədəf orta bitreyt","2 Mbit/s (orta)","5 Mbit/s (orta)","10 Mbit/s (orta)","20 Mbit/s (orta)","40 Mbit/s (orta)","Başlanğıc, san.","Son, san.","Başlanğıc = oxutma göstəricisi","Son = oxutma göstəricisi","Yalnız seçilmiş aralığı ixrac etmək olar. Vaxt taymlaynın başlanğıcından saniyələrlə ölçülür, aralığın sərhədləri isə seçilmiş kadr tezliyinə yuvarlaqlaşdırılır.","Yadda saxlanmamış dəyişikliklər var","Məsləhətlərin idarəsi","Ətraflı məsləhətləri aktiv et","Ətraflı məsləhətləri söndür","Layihəni saxla (Ctrl+S)","Video, musiqi və ya foto əlavə et","Fotoları musiqiyə uyğun avtomatik düz","Videonu ixrac et (Ctrl+E)","Şəkil və videoları fayl adındakı rəqəmlərə görə düz","Keçidi tap…","Keçidləri axtar","Layihənin cari parametrləri","Başlanğıca keç (Home)","Əvvəlki kadr (←)","Oxut / fasilə (Space)","Növbəti kadr (→)","Sonuna keç (End)","Dayandır (başlanğıca qayıt)","Layihənin kadr tezliyi","Tərəflərin nisbəti","Layihənin təsvir ölçüsü","Kiçilt","Miqyas","Böyüt","Klip kənarlarını və oxutma göstəricisini yapışdır","Montaj nöqtəsində","Klipin kənarı","üst-üstə düşmə","giriş/çıxış","Keçid tapılmadı","Qaradandan tədricən görünmə","Ağdan tədricən görünmə","Ağ parıltı","Aşağıdan pərdə","Yuxarıdan pərdə","Diaqonal pərdə","Yuxarı sürüşdür","Aşağı sürüşdür","Dairəvi diafraqma","Romb","Yumşaq fokus","Fırlatma","Hamar görünmə / itmə","Klassik qaralma","Yumşaq parlaq keçid","Qısa kinematoqrafik parıltı","İki planın yumşaq qarışması","Yeni kadr soldan sağa açılır","Yeni kadr sağdan sola açılır","Aşağıdan yuxarı açılır","Yuxarıdan aşağı açılır","Diaqonal açılma","Yeni plan sağdan sürüşərək daxil olur","Yeni plan soldan sürüşərək daxil olur","Yeni plan aşağıdan sürüşərək daxil olur","Yeni plan yuxarıdan sürüşərək daxil olur","Kadrın üzərinə hamar yaxınlaşma","Yaxın plandan yumşaq uzaqlaşma","Dairə kadrın kənarlarınadək genişlənir","Mərkəzdən həndəsi açılma","Bulanıq kadr aydınlaşır","Yüngül fırlanma keçidi","İnterfeys dili…","Avtomatik (sistem dili)","Əlavə dillər ayrıca paketlər şəklində əlavə olunacaq.","İnterfeys dili bu kompüterdə saxlanacaq.","Tətbiq et","Əlçatandır","Tezliklə","Tərcümə paketi quraşdırılmayıb","Montazhnaya","Doyma, %","Rəng üslubu","Üslubsuz","Kinematoqrafik","Ağ-qara","Sepiya","Vintage","Soyuq","İsti","Gecə","Rəng korreksiyasını sıfırla","Yalnız fayl adında rəqəmlər olan şəkil və videolar əlavə ediləcək. Sıralama rəqəmsaldır, buna görə 2, 10-dan əvvəl gəlir. Kliplər üst-üstə düşmədən ardıcıl yerləşdiriləcək.","Cari kadrı saxla","Taymlaynın cari mövqeyində tam kompozisiya saxlanacaq: görünən video qatları, keçidlər, rəng korreksiyası, çevirmələr və başlıqlar. Montaj bələdçiləri təsvirə daxil edilməyəcək.","Şəkil formatı","PNG — itkisiz","JPEG — daha kiçik fayl","Uzun tərəfə görə Full HD","Uzun tərəfə görə 4K UHD","JPEG keyfiyyəti","Kadrı saxla…","FFmpeg və ffprobe diaqnostikası","Alətlərin yolları PATH və ya FFMPEG_PATH / FFPROBE_PATH dəyişənlərindən götürülür.","Yenidən yoxla","Yoxlama hələ başladılmayıb.","Yoxlanılır…","Diaqnostikanı yerinə yetirmək mümkün olmadı","Redaktoru yenidən başladın və yoxlamanı təkrarlayın. Xəta qalarsa, quraşdırmanın bütövlüyünü yoxlayın.","İdxal edilmiş fayllar: {count}","Nömrəyə görə yerləşdirildi: {count} fayl · {duration}.","{format} ixracı tamamlandı: {file}","Taymlaynda · {track} · {name} ({duration})","Media kitabxanasında · {name} ({duration})","Fotolar ({count})","Yadda saxlanmamış layihə tapıldı ({savedAt}): kliplər — {clips}, media — {media}. Bərpa edilsin?","Köməyi göstər","Klipləri əlaqələndir","Videonu audiodan ayır","Əlaqəni kəs","Aktiv et","Söndür","Gizlət","Göstər","1280 × 720 · 30 FPS","Alt+←","Alt+→","Ctrl+Alt+←","Ctrl+Alt+→","Shift+Alt+←","Shift+Alt+→","KB","MB","GB","Tanışlığı bağla","Fayllar yoxdur","Faylları idxal et","Geri al (Ctrl+Z)","Təkrarla (Ctrl+Y)","Səsi ayır","Video və audionu əlaqələndir","Video və audio əlaqələndirildi","Bu mövqedə marker artıq var","Marker əlavə edildi","Markerin adı dəyişdirildi","Marker silindi","Markeri seçin və ya oxutma göstəricisini onun yanına gətirin","Layihədə hələ marker yoxdur","Növbəti marker yoxdur","Əvvəlki marker yoxdur","Əvvəlcə videonu və ya onun audio klipini seçin","Bu video və audio artıq əlaqələndirilib","Uyğun cütü dəqiq müəyyən etmək mümkün olmadı. Orijinal video və ondan ayrılmış səsin seçildiyini yoxlayın.","Yalnız video klipi və həmin videodan ayrılmış səsi əlaqələndirmək olar","Əlaqə bərpa edildi. Audionun cari sürüşməsi saxlanıldı; bundan sonra kliplər birlikdə hərəkət edəcək.","Video və audio əlaqəsi bərpa edildi. İndi onlar birlikdə hərəkət edəcək.","Əlaqələndirilmiş video və ya audio klipi seçin","Trek kilidlənib","Medianı trekə yerləşdirmək mümkün olmadı","Əvvəlcə video klipi seçin","Səsini ayırmaq üçün video trekindəki videonu seçin","Əvvəlcə video trekini kiliddən çıxarın","Bu klipin səsi artıq ayrıca audio trekdədir","Bu videoda audio axını tapılmadı","Audio klipi yaratmaq mümkün olmadı. Audio treklərin mövcudluğunu yoxlayın.","Əlaqələndirilmiş cütü köçürmək olmur: yeni mövqedə treklərdən biri məşğuldur","Klip silindi","Ripple silmə tamamlandı","Klip köçürüldü","Kəsmə nöqtəsi kənara çox yaxındır.","Keçidlər video kliplərə tətbiq olunur","Video klip seçin və ya keçidi taymlayna sürükləyin","Faylları bura sürükləyin","yaxud “Medianı idxal et” düyməsinə klikləyin","Video · Audio · Şəkillər","Fayllar yenidən əlaqələndirilməyib","Bəzi media faylları çatışmır. Onları yenidən əlaqələndirin — montaj avtomatik bərpa olunacaq.","Sınaq kodlaşdırması və ffprobe yoxlaması","Quraşdırılmış versiyanın imkanları","Kritik problem aşkarlanmadı. Yenidən yoxlamaq üçün “Yenidən yoxla” düyməsinə basın.","Alətlərin yolları və versiyaları müəyyən edilir, kodeklər yoxlanılır və qısa sınaq MP4 faylı yaradılır.","FFmpeg və ffprobe, H.264/AAC və VP8/VP9/Opus kodlayıcıları, PNG dekodlaşdırması və MP4/WebM konteynerləri yoxlanılır. Redaktor mövcud seçimlər üçün qısa sınaq faylları yaradır və axınları, vaxt nişanlarını ffprobe ilə yoxlayır. Müvəqqəti fayllar yoxlamadan sonra silinir.","Brauzerdə real vaxt rejimində yazı","MediaRecorder sistem yükündən və render dövründən asılıdır.","MP4 üçün AAC səsi yoxlanılıb.","WebM üçün VP8/VP9 videosu və Opus səsi yoxlanılıb.","Axınlar","Mövqe: ","kadr № ","Cari pauza edilmiş kadr ixrac ediləcək.","Kadrlar","san.","dəq"],"ka":["Ripple წაშლა","არჩეული მარკერის წაშლა","კლიპის 1 კადრით მარცხნივ გადაწევა","კლიპის 1 კადრით მარჯვნივ გადაწევა","10 კადრით მარცხნივ გადაწევა","10 კადრით მარჯვნივ გადაწევა","მონიშვნის მოხსნა","სიგანეზე მორგება","მესამედების ბადის დამხმარე ხაზები","უსაფრთხო საზღვრები","მესამედების ბადე და უსაფრთხო საზღვრები","დამხმარე ხაზების დამალვა","მიმაგრების ჩართვა/გამორთვა","20 გადასვლა","დასაწყისში გამოჩენის ეფექტის გამოყენება","ბოლოში გაქრობის ეფექტის გამოყენება","წინა კლიპთან ჯვარედინი გადადნობა","წინა კლიპთან მარცხენა ფარდის გამოყენება","წინა კლიპთან მარჯვენა ფარდის გამოყენება","კლიპის გადასვლების წაშლა","FFmpeg-ისა და ffprobe-ის დიაგნოსტიკა…","რჩევები ჩართულია","რჩევების გამორთვა","რჩევები გამორთულია","მედიის იმპორტი","⇅ ნომრის მიხედვით დალაგება","რიცხვითი რიგი: 1, 2, 3… ან 001, 002, 003…","ანიმაციის სანახავად კურსორი ბარათზე მიიტანეთ. გადაათრიეთ კლიპზე: მარცხენა კიდე შემოსვლის, მარჯვენა კი გასვლის ეფექტს იყენებს. კლიპებს შორის გადატანისას იქმნება გადაფარვა. ბარათზე დაჭერა არჩეულ კლიპს შემოსვლის ეფექტს უმატებს.","მიმდევრობა 01","ბიბლიოთეკიდან მედია ტრეკზე გადაათრიეთ","რედაქტორთან გაცნობა","კეთილი იყოს თქვენი მობრძანება Montazhnaya-ში!","ძირითად მოქმედებებს მარტივი ნაბიჯებით გაჩვენებთ. თქვენს პროექტში არაფერი შეიცვლება, სანამ შესაბამის ღილაკს თავად არ დააჭერთ.","შეგიძლიათ თქვენთვის სასურველი ტემპით იმოძრაოთ და გაცნობა ნებისმიერ დროს დახუროთ.","მოგვიანებით","უკან","გაცნობის დაწყება","მონტაჟის მიმდევრობის ექსპორტი","სამიზნე საშუალო ბიტრეიტი","2 მბიტ/წმ (საშუალო)","5 მბიტ/წმ (საშუალო)","10 მბიტ/წმ (საშუალო)","20 მბიტ/წმ (საშუალო)","40 მბიტ/წმ (საშუალო)","დასაწყისი, წმ","დასასრული, წმ","დასაწყისი = დაკვრის მაჩვენებელი","დასასრული = დაკვრის მაჩვენებელი","შესაძლებელია მხოლოდ არჩეული მონაკვეთის ექსპორტი. დრო იზომება წამებში ტაიმლაინის დასაწყისიდან, ხოლო მონაკვეთის საზღვრები მრგვალდება არჩეული კადრების სიხშირის მიხედვით.","შეუნახავი ცვლილებებია","რჩევების მართვა","დეტალური რჩევების ჩართვა","დეტალური რჩევების გამორთვა","პროექტის შენახვა (Ctrl+S)","ვიდეოს, მუსიკის ან ფოტოს დამატება","ფოტოების მუსიკაზე ავტომატურად დალაგება","ვიდეოს ექსპორტი (Ctrl+E)","სურათებისა და ვიდეოების ფაილის სახელებში არსებული რიცხვებით დალაგება","გადასვლის პოვნა…","გადასვლების ძიება","პროექტის მიმდინარე პარამეტრები","დასაწყისზე გადასვლა (Home)","წინა კადრი (←)","დაკვრა / პაუზა (Space)","შემდეგი კადრი (→)","ბოლოზე გადასვლა (End)","გაჩერება (დასაწყისში დაბრუნება)","პროექტის კადრების სიხშირე","კადრის ასპექტის თანაფარდობა","პროექტის გარჩევადობა","დაპატარავება","მასშტაბი","გადიდება","კლიპის კიდეებისა და დაკვრის მაჩვენებლის მიმაგრება","მონტაჟის შეერთების წერტილში","კლიპის კიდე","გადაფარვა","შემოსვლა/გასვლა","გადასვლები ვერ მოიძებნა","შავიდან გამოჩენა","თეთრიდან გამოჩენა","თეთრი გაელვება","ქვედა ფარდა","ზედა ფარდა","დიაგონალური ფარდა","ზემოთ გადაცურება","ქვემოთ გადაცურება","წრიული დიაფრაგმა","რომბი","რბილი ფოკუსი","ბრუნვა","გლუვი გამოჩენა / გაქრობა","კლასიკური დაბნელება","რბილი ნათელი გადასვლა","მოკლე კინემატოგრაფიული გაელვება","ორი კადრის რბილი შერწყმა","ახალი კადრი მარცხნიდან მარჯვნივ იხსნება","ახალი კადრი მარჯვნიდან მარცხნივ იხსნება","ქვემოდან ზემოთ იხსნება","ზემოდან ქვემოთ იხსნება","დიაგონალურად გახსნა","ახალი კადრი მარჯვნიდან შემოდის","ახალი კადრი მარცხნიდან შემოდის","ახალი კადრი ქვემოდან შემოდის","ახალი კადრი ზემოდან შემოდის","კადრთან რბილი მიახლოება","ახლოდან რბილი დაშორება","წრე კადრის კიდეებამდე ფართოვდება","ცენტრიდან გეომეტრიული გახსნა","ბუნდოვანი კადრი მკაფიო ხდება","მსუბუქი მბრუნავი გადასვლა","ინტერფეისის ენა…","ავტომატური (სისტემის ენა)","დამატებითი ენები ცალკე პაკეტებად დაემატება.","ინტერფეისის ენა ამ კომპიუტერზე შეინახება.","გამოყენება","ხელმისაწვდომია","მალე","თარგმანის პაკეტი დაყენებული არ არის","Montazhnaya","გაჯერება, %","ფერის სტილი","სტილის გარეშე","კინემატოგრაფიული","შავ-თეთრი","სეპია","ვინტაჟი","ცივი","თბილი","ღამის","ფერის კორექციის აღდგენა","დაემატება მხოლოდ ის სურათები და ვიდეოები, რომელთა ფაილის სახელებში რიცხვებია. დალაგება რიცხვითია, ამიტომ 2 წინ იქნება 10-ზე. კლიპები გადაფარვის გარეშე მიმდევრობით განთავსდება.","მიმდინარე კადრის შენახვა","შეინახება სრული კომპოზიცია ტაიმლაინის მიმდინარე პოზიციაზე: ხილული ვიდეოფენები, გადასვლები, ფერის კორექცია, გარდაქმნები და სათაურები. მონტაჟის დამხმარე ხაზები სურათში არ მოხვდება.","გამოსახულების ფორმატი","PNG — დანაკარგის გარეშე","JPEG — უფრო მცირე ფაილი","Full HD გრძელი გვერდის მიხედვით","4K UHD გრძელი გვერდის მიხედვით","JPEG ხარისხი","კადრის შენახვა…","FFmpeg-ისა და ffprobe-ის დიაგნოსტიკა","პროგრამების ბილიკები PATH ან FFMPEG_PATH / FFPROBE_PATH ცვლადებიდან აიღება.","ხელახლა შემოწმება","შემოწმება ჯერ არ დაწყებულა.","მოწმდება…","დიაგნოსტიკის შესრულება ვერ მოხერხდა","გადატვირთეთ რედაქტორი და გაიმეორეთ შემოწმება. თუ შეცდომა შენარჩუნდა, შეამოწმეთ ინსტალაციის მთლიანობა.","იმპორტირებული ფაილები: {count}","ნომრის მიხედვით განლაგდა: {count} ფაილი · {duration}.","{format} ექსპორტი დასრულდა: {file}","ტაიმლაინზე · {track} · {name} ({duration})","მედია ბიბლიოთეკაში · {name} ({duration})","ფოტოები ({count})","აღმოჩენილია შეუნახავი პროექტი ({savedAt}): კლიპები — {clips}, მედია — {media}. აღვადგინოთ?","დახმარების ჩვენება","კლიპების დაკავშირება","ვიდეოს აუდიოსგან მიბმის მოხსნა","კავშირის გაწყვეტა","ჩართვა","გამორთვა","დამალვა","ჩვენება","1280 × 720 · 30 FPS","Alt+←","Alt+→","Ctrl+Alt+←","Ctrl+Alt+→","Shift+Alt+←","Shift+Alt+→","კბ","მბ","გბ","გაცნობის დახურვა","ფაილები არ არის","ფაილების იმპორტი","გაუქმება (Ctrl+Z)","გამეორება (Ctrl+Y)","ხმის გამოყოფა","ვიდეოსა და აუდიოს დაკავშირება","ვიდეო და აუდიო დაკავშირებულია","ამ პოზიციაზე მარკერი უკვე არსებობს","მარკერი დაემატა","მარკერს სახელი შეეცვალა","მარკერი წაიშალა","აირჩიეთ მარკერი ან დაკვრის მაჩვენებელი მის ახლოს გადაიტანეთ","პროექტში ჯერ მარკერები არ არის","შემდეგი მარკერი არ არის","წინა მარკერი არ არის","ჯერ აირჩიეთ ვიდეო ან მისი აუდიო კლიპი","ეს ვიდეო და აუდიო უკვე დაკავშირებულია","წყვილის ერთმნიშვნელოვნად პოვნა ვერ მოხერხდა. შეამოწმეთ, რომ არჩეულია საწყისი ვიდეო და მისგან გამოყოფილი აუდიო.","შესაძლებელია მხოლოდ ვიდეო კლიპისა და ამ ვიდეოდან გამოყოფილი აუდიოს დაკავშირება","კავშირი აღდგა. აუდიოს მიმდინარე წანაცვლება შენარჩუნებულია; კლიპები ერთად იმოძრავებს.","ვიდეოსა და აუდიოს კავშირი აღდგა. ახლა ისინი ერთად იმოძრავებს.","აირჩიეთ დაკავშირებული ვიდეო ან აუდიო კლიპი","ტრეკი ჩაკეტილია","მედიის ტრეკზე განთავსება ვერ მოხერხდა","ჯერ აირჩიეთ ვიდეო კლიპი","ხმის გამოსაყოფად აირჩიეთ ვიდეო ვიდეოტრეკზე","ჯერ გახსენით ვიდეოტრეკის საკეტი","ამ კლიპის აუდიო უკვე ცალკე აუდიოტრეკზეა","ამ ვიდეოში აუდიო ნაკადი ვერ მოიძებნა","აუდიო კლიპის შექმნა ვერ მოხერხდა. შეამოწმეთ აუდიოტრეკების ხელმისაწვდომობა.","დაკავშირებული წყვილის გადაადგილება შეუძლებელია: ახალ პოზიციაზე ერთ-ერთი ტრეკი დაკავებულია","კლიპი წაიშალა","Ripple წაშლა დასრულდა","კლიპი გადაადგილდა","ჭრის წერტილი კიდესთან ძალიან ახლოსაა.","გადასვლები ვიდეო კლიპებზე გამოიყენება","აირჩიეთ ვიდეო კლიპი ან გადასვლა ტაიმლაინზე გადაათრიეთ","ფაილები აქ გადმოიტანეთ","ან დააჭირეთ „მედიის იმპორტს“","ვიდეო · აუდიო · სურათები","ფაილები ხელახლა არ დაკავშირებულა","ზოგიერთი მედია ფაილი აკლია. ხელახლა დააკავშირეთ ისინი — მონტაჟი ავტომატურად აღდგება.","სატესტო კოდირება და ffprobe-ით შემოწმება","დაყენებული ვერსიის შესაძლებლობები","კრიტიკული პრობლემა არ აღმოჩენილა. ხელახლა შესამოწმებლად დააჭირეთ „ხელახლა შემოწმებას“.","განისაზღვრება პროგრამების ბილიკები და ვერსიები, მოწმდება კოდეკები და იქმნება მოკლე სატესტო MP4 ფაილი.","მოწმდება FFmpeg და ffprobe, H.264/AAC და VP8/VP9/Opus კოდერები, PNG დეკოდირება და MP4/WebM კონტეინერები. რედაქტორი ხელმისაწვდომი ვარიანტებისთვის ქმნის მოკლე სატესტო ფაილებს და ffprobe-ით ამოწმებს ნაკადებსა და დროის ნიშნულებს. დროებითი ფაილები შემოწმების შემდეგ იშლება.","ბრაუზერში რეალურ დროში ჩაწერა","MediaRecorder დამოკიდებულია სისტემის დატვირთვასა და გამოსახვის ციკლზე.","MP4-ისთვის AAC აუდიო შემოწმებულია.","WebM-ისთვის VP8/VP9 ვიდეო და Opus აუდიო შემოწმებულია.","ნაკადები","პოზიცია: ","kადრი № ","ექსპორტირდება მიმდინარე შეჩერებული კადრი.","კადრები","წმ","წთ"]};
  if (wave3SourceKeys.length !== 232) {
    throw new Error("Unexpected CIS wave 3 source-key count: " + wave3SourceKeys.length);
  }
  for (const code of ["kk", "uz", "az", "ka"]) {
    const current = packs[code];
    const values = wave3Data[code];
    const currentMissing = Object.keys(english).filter(source =>
      !Object.prototype.hasOwnProperty.call(current.messages, source)
    );
    if (currentMissing.length !== wave3SourceKeys.length ||
        currentMissing.some((source, index) => source !== wave3SourceKeys[index]) ||
        !Array.isArray(values) || values.length !== wave3SourceKeys.length) {
      throw new Error("Invalid CIS wave 3 translation data for " + code);
    }
    const messages = Object.assign(Object.create(null), current.messages);
    wave3SourceKeys.forEach((source, index) => { messages[source] = values[index]; });
    const englishFallbackKeys = Object.keys(english).filter(source =>
      !Object.prototype.hasOwnProperty.call(messages, source)
    );
    packs[code] = Object.freeze({
      ...current,
      appTitle: current.appTitle.replace(/3\.6\.42/g, "3.6.44"),
      coverage: "regional-workflows-436",
      localeMappedCount: Object.keys(messages).length,
      englishFallbackCount: englishFallbackKeys.length,
      englishFallbackKeys: Object.freeze(englishFallbackKeys),
      translationStatus: "preview",
      translationStage: "cis-central-asia-wave-3-review-pending",
      completedTranslationWave: "beta-3.6.43-cis-wave-3",
      messages: Object.freeze(messages)
    });
  }

  // Uzbek Cyrillic is a separate BCP-47 script variant. It is generated from the
  // Uzbek Latin draft with reversible, documented orthographic substitutions;
  // native-speaker review is still required before a production claim.
  function transliterateUzbekLatinToCyrillic(input) {
    if (typeof input !== "string") return input;
    const protectedValues = [];
    const protect = value => {
      const token = "\uE000" + protectedValues.length + "\uE001";
      protectedValues.push(value);
      return token;
    };
    let text = input.replace(/\{[A-Za-z][A-Za-z0-9_]*\}/g, protect);
    const protectedTerms = /Montazhnaya|FFmpeg|ffprobe|MediaRecorder|FFMPEG_PATH|FFPROBE_PATH|H\.264|VP8|VP9|WebM|MP4|PNG|JPEG|AAC|Opus|FPS|PATH|Ctrl|Alt|Shift|Home|End|Space|Ripple/gi;
    text = text.replace(protectedTerms, protect);
    const pairs = [
      [/o[ʻ‘’ʼ']/gi, m => m[0] === "O" ? "Ў" : "ў"],
      [/g[ʻ‘’ʼ']/gi, m => m[0] === "G" ? "Ғ" : "ғ"],
      [/sh/gi, m => m === "SH" ? "Ш" : m[0] === "S" ? "Ш" : "ш"],
      [/ch/gi, m => m === "CH" ? "Ч" : m[0] === "C" ? "Ч" : "ч"],
      [/ng/gi, m => m === "NG" ? "НГ" : m[0] === "N" ? "Нг" : "нг"],
      [/yo/gi, m => m === "YO" ? "Ё" : m[0] === "Y" ? "Ё" : "ё"],
      [/yu/gi, m => m === "YU" ? "Ю" : m[0] === "Y" ? "Ю" : "ю"],
      [/ya/gi, m => m === "YA" ? "Я" : m[0] === "Y" ? "Я" : "я"],
      [/ye/gi, m => m === "YE" ? "Е" : m[0] === "Y" ? "Е" : "е"]
    ];
    for (const [pattern, replacement] of pairs) text = text.replace(pattern, replacement);
    const lower = { a:"а", b:"б", d:"д", e:"е", f:"ф", g:"г", h:"ҳ", i:"и", j:"ж", k:"к", l:"л", m:"м", n:"н", o:"о", p:"п", q:"қ", r:"р", s:"с", t:"т", u:"у", v:"в", x:"х", y:"й", z:"з", c:"с", w:"в" };
    const upper = Object.fromEntries(Object.entries(lower).map(([latin, cyr]) => [latin.toUpperCase(), cyr.toUpperCase()]));
    const chars = Array.from(text);
    text = chars.map((char, index) => {
      if (char === "e" && (index === 0 || !/[A-Za-z]/.test(chars[index - 1]))) return "э";
      if (char === "E" && (index === 0 || !/[A-Za-z]/.test(chars[index - 1]))) return "Э";
      return lower[char] || upper[char] || char;
    }).join("");
    text = text.replace(/\uE000(\d+)\uE001/g, (_, index) => protectedValues[Number(index)]);
    return text;
  }

  const uzLatin = packs.uz;
  const uzCyrillicMessages = Object.create(null);
  for (const [source, translated] of Object.entries(uzLatin.messages)) {
    uzCyrillicMessages[source] = transliterateUzbekLatinToCyrillic(translated);
  }
  const uzCyrillicFallbackKeys = Object.keys(english).filter(source =>
    !Object.prototype.hasOwnProperty.call(uzCyrillicMessages, source)
  );
  packs["uz-Cyrl"] = Object.freeze({
    ...uzLatin,
    code: "uz-Cyrl",
    nativeName: "Ўзбекча (кирилл)",
    englishName: "Uzbek (Cyrillic)",
    appTitle: transliterateUzbekLatinToCyrillic(uzLatin.appTitle),
    fontFamily: "Cyrillic",
    scriptVariant: "Cyrl",
    coverage: "script-variant-436",
    localeMappedCount: Object.keys(uzCyrillicMessages).length,
    englishFallbackCount: uzCyrillicFallbackKeys.length,
    englishFallbackKeys: Object.freeze(uzCyrillicFallbackKeys),
    translationStatus: "preview",
    translationStage: "uzbek-cyrillic-transliteration-review-pending",
    translationQuality: "transliteration-draft",
    completedTranslationWave: "beta-3.6.43-uzbek-cyrillic",
    messages: Object.freeze(uzCyrillicMessages)
  });


  // Regional localization wave 4: complete Armenian, Turkmen, Kyrgyz, Tajik and Belarusian.
  // These drafts cover every English source key; native-speaker review remains outstanding.
  const regionalCompletionKeys = Object.keys(english).filter(source =>
    !Object.prototype.hasOwnProperty.call(packs.hy.messages, source)
  );
  const regionalCompletionData = {"hy":["Շղթայական ջնջում","Ջնջել ընտրված նշիչը","Կլիպը մեկ կադր ձախ տեղափոխել","Կլիպը մեկ կադր աջ տեղափոխել","Տեղափոխել 10 կադր ձախ","Տեղափոխել 10 կադր աջ","Հանել ընտրությունը","Տեղավորել լայնությամբ","Երրորդների ցանցի ուղեցույցներ","Անվտանգ սահմաններ","Երրորդների ցանց և անվտանգ սահմաններ","Թաքցնել ուղեցույցները","Միացնել կամ անջատել կպչումը","20 անցում","Կիրառել աստիճանական հայտնվելը սկզբում","Կիրառել աստիճանական մարումը վերջում","Խաչաձև անցում նախորդ հոլովակի հետ","Ձախից վարագույրային անցում նախորդի հետ","Աջից վարագույրային անցում նախորդի հետ","Հեռացնել հոլովակի անցումները","FFmpeg-ի և ffprobe-ի ախտորոշում…","Հուշումները ՄԻԱՑՎԱԾ ԵՆ","Անջատել հուշումները","Հուշումները ԱՆՋԱՏՎԱԾ ԵՆ","Ներմուծել մեդիա","⇅ Դասավորել ըստ համարի","Թվային հերթականություն՝ 1, 2, 3… կամ 001, 002, 003…","Սավառնեք քարտի վրա՝ անիմացիան տեսնելու համար։ Քաշեք այն հոլովակի վրա․ ձախ եզրը կիրառում է մուտքի, աջ եզրը՝ ելքի էֆեկտը։ Հոլովակների միջև տեղադրելիս ստեղծվում է համընկնում։ Քարտի վրա սեղմելով՝ մուտքի էֆեկտը կիրառվում է ընտրված հոլովակի վրա։","Հաջորդականություն 01","Մեդիան գրադարանից քաշեք դեպի ուղի","Ծանոթացում խմբագրիչին","Բարի գալուստ «Մոնտաժնայա»։","Կցուցադրեմ հիմնական գործողությունները պարզ քայլերով։ Նախագծում ոչինչ չի փոխվի, մինչև ինքներդ չընտրեք գործողությունը։","Աշխատեք ձեր տեմպով և ցանկացած պահի փակեք ծանոթացումը։","Ավելի ուշ","Հետ","Սկսել ծանոթացումը","Արտահանել մոնտաժի հաջորդականությունը","Թիրախային միջին բիթրեյթ","2 Մբիթ/վ (միջին)","5 Մբիթ/վ (միջին)","10 Մբիթ/վ (միջին)","20 Մբիթ/վ (միջին)","40 Մբիթ/վ (միջին)","Սկիզբ, վ","Ավարտ, վ","Սկիզբ = նվագարկման ցուցիչ","Ավարտ = նվագարկման ցուցիչ","Կարելի է արտահանել միայն ընտրված հատվածը։ Ժամանակը չափվում է վայրկյաններով՝ ժամանակագծի սկզբից, իսկ հատվածի սահմանները կլորացվում են ընտրված կադրային հաճախականությանը համապատասխան։","Կան չպահպանված փոփոխություններ","Հուշումների կառավարում","Միացնել մանրամասն հուշումները","Անջատել մանրամասն հուշումները","Պահպանել նախագիծը (Ctrl+S)","Ավելացնել տեսանյութ, երաժշտություն կամ լուսանկարներ","Լուսանկարներն ավտոմատ դասավորել երաժշտությանը համապատասխան","Արտահանել տեսանյութը (Ctrl+E)","Պատկերներն ու տեսանյութերը դասավորել ֆայլերի անունների թվերով","Գտնել անցում…","Որոնել անցումներ","Նախագծի ընթացիկ կարգավորումները","Գնալ սկիզբ (Home)","Նախորդ կադր (←)","Նվագարկել / դադար (Space)","Հաջորդ կադր (→)","Գնալ ավարտ (End)","Կանգնեցնել (վերադառնալ սկիզբ)","Նախագծի կադրային հաճախականություն","Կողմերի հարաբերակցություն","Նախագծի թույլատրություն","Փոքրացնել","Մասշտաբ","Մեծացնել","Կպչեցնել հոլովակների եզրերը և նվագարկման ցուցիչը","Մոնտաժային միացման կետում","Հոլովակի եզրին","համընկնում","մուտք/ելք","Անցումներ չեն գտնվել","Հայտնվել սևից","Հայտնվել սպիտակից","Սպիտակ փայլատակում","Վարագույր ներքևից","Վարագույր վերևից","Անկյունագծային վարագույր","Սահեցնել վերև","Սահեցնել ներքև","Շրջանաձև դիաֆրագմա","Շեղանկյուն","Մեղմ ֆոկուս","Պտույտ","Սահուն հայտնվել / մարել","Դասական մարում մինչև սև","Մեղմ լուսավոր անցում","Կարճ կինեմատոգրաֆիկ փայլատակում","Երկու կադրերի սահուն միաձուլում","Նոր կադրը բացվում է ձախից աջ","Նոր կադրը բացվում է աջից ձախ","Բացվում է ներքևից վերև","Բացվում է վերևից ներքև","Անկյունագծային բացում","Նոր կադրը սահում է աջից","Նոր կադրը սահում է ձախից","Նոր կադրը սահում է ներքևից","Նոր կադրը սահում է վերևից","Սահուն մոտեցում կադրին","Սահուն հեռացում խոշոր պլանից","Շրջանը լայնանում է մինչև կադրի եզրերը","Երկրաչափական բացում կենտրոնից","Պղտոր կադրը դառնում է հստակ","Նուրբ պտտվող անցում","Լեզվի կարգավորումներ…","Ավտոմատ (համակարգի լեզու)","Լրացուցիչ լեզուները կավելացվեն առանձին փաթեթներով։","Միջերեսի լեզվի ընտրությունը կպահպանվի այս համակարգչում։","Կիրառել","Հասանելի է","Շուտով","Թարգմանության փաթեթը տեղադրված չէ","Montazhnaya","0,65 վ","Կադր","կադր/վ","ավելի վաղ","ՆԱԽԱԳԻԾ","· ՖԱՅԼԸ ԲԱՑԱԿԱՅՈՒՄ Է","Նախագիծ","Մեդիա տարրեր","Հոլովակներ","Տևողություն","Բացակայող ֆայլեր՝ {count}","Սեղմեք «Վերամիացնել ֆայլերը»՝ մեդիայի հղումները վերականգնելու համար։","Ընտրեք հոլովակ կամ մեդիա տարր՝ դրա հատկությունները տեսնելու համար","Մեդիա տարր","Անուն","Տեսակ","Կարգավիճակ","ֆայլը բացակայում է","Կարգավորումներ","կանխադրված՝ 5 վ","Ֆայլի չափը","Գործողություններ","Վերամիացնել ֆայլը…","Ավելացնել ժամանակագծին","Հեռացնել մեդիա գրադարանից","Հոլովակ","Ուղի"," (կողպված է)","ֆայլը հեռացված է","Ժամանակավորում","Տևողություն, վ","Աղբյուրի մուտք, վ","Աղբյուրի ելք, վ","Ժամանակագծի ավարտը","Աղբյուրի տևողություն","Լուսանկարները կարելի է կտրել՝ քաշելով հոլովակի ձախ կամ աջ եզրը։ Դրանց տևողությունը սահմանափակված չէ սկզբնական մեդիայի տևողությամբ։ Ճշգրիտ արժեքի համար վերևում մուտքագրեք վայրկյանները։","Անթափանցություն, %","Մասշտաբ, %","Կենտրոն X, %","Կենտրոն Y, %","Տեղավորման ռեժիմ","Ամբողջությամբ տեղավորել","Լրացնել կադրը (կտրել)","Տեսախցիկի շարժում","Առանց շարժման","Սահուն մոտեցնել","Սահուն հեռացնել","Համայնապատկեր ձախ","Համայնապատկեր աջ","Համայնապատկեր վերև","Համայնապատկեր ներքև","Պտույտ, °","Շրջել","Հորիզոնական","Ուղղահայաց","Վերակայել","Գունային ուղղում","Պայծառություն, %","Հակադրություն, %","Հագեցվածություն, %","Գունային ոճ","Առանց ոճի","Կինեմատոգրաֆիկ","Սև ու սպիտակ","Սեպիա","Վինտաժ","Սառը","Տաք","Գիշերային","Վերակայել գունային ուղղումը","Վերնագրեր հոլովակի վրա","Տեքստ","Մուտքագրեք վերնագիր կամ մակագրություն…","Տառաչափ","Տեքստի գույն","Դիրք","Վերևում՝ կենտրոնում","Կենտրոնում","Ներքևում՝ կենտրոնում","Ներքևում՝ ձախ","Ներքևում՝ աջ","Հետնապատկեր","Նշում","Տեքստը ներառվում է տեսանյութի մեջ","Ձայնի մակարդակ, %","Աստիճանական ուժեղացում, վ","Աստիճանական թուլացում, վ","Սկզբում, վ","Մուտքի ռեժիմ","Վերջում, վ","Ելքի ռեժիմ","Ձայնն արդեն առանձնացված է","Առանձնացնել ձայնը առանձին ուղու վրա","Այս տեղում արդեն հոլովակ կա","Հոլովակը կհամընկնի հարևան հոլովակի հետ","Աղբյուրի նոր մուտքի կետը հակասություն կստեղծի հարևան հոլովակի հետ","Կավելացվեն միայն այն պատկերներն ու տեսանյութերը, որոնց ֆայլերի անուններում թվեր կան։ Դասավորումը թվային է, ուստի 2-ը կլինի 10-ից առաջ։ Հոլովակները կտեղադրվեն հաջորդաբար՝ առանց համընկնումների։","Տեսանյութի ուղի","Հաջորդականության սկիզբ","Նվագարկման ցուցիչի դիրքում","Ընտրված ուղու վերջում","Պատկերի տևողություն, վրկ.","Մեդիա տարրերը հերթականությամբ","Դասավորել","Համարակալված պատկերներ կամ տեսանյութեր չկան։","Չգտնվեցին ֆայլի անուններում թվեր ունեցող պատկերներ կամ տեսանյութեր։ Օրինակ՝ 001.jpg, 002.jpg, 003.jpg։","Ընտրեք տեսանելի և ապակողպված տեսանյութի ուղի։","Լուսանկարների և երաժշտության սլայդշոու","Լուսանկարները վերցնել այստեղից","Երաժշտական ուղի","Տևողության ռեժիմ","Հարմարեցնել երաժշտության տևողությանը","Նույն տևողությունը յուրաքանչյուր լուսանկարի համար","Լրացնել ժամանակագծի հատվածը","Լուսանկարների տեսանյութի ուղի","Սկիզբ, վրկ.","Յուրաքանչյուր լուսանկարի տևողություն, վրկ.","Հատվածի երկարություն, վրկ.","Անցումներ լուսանկարների միջև","Առանց անցումների","Անցման տևողություն, վրկ.","Հերթագայել սահուն խոշորացումն ու համայնապատկերը","Դանդաղ մոտեցում","Դանդաղ հեռացում","Լուսանկարների հերթականություն","Ինչպես դասավորված են ուղու վրա","Ըստ անվան՝ Ա → Յ","Ըստ անվան՝ Յ → Ա","Երաժշտության ձայնային ուղի","Առաջին լուսանկարը աստիճանաբար հայտնվի, վերջինը՝ մարի","Ստեղծել սլայդշոու","Ստուգեք կարգավորումները։","Պահպանել ընթացիկ կադրը","Կպահպանվի ամբողջական կոմպոզիցիան ժամանակագծի ընթացիկ դիրքում՝ տեսանելի տեսաշերտերը, անցումները, գունային ուղղումը, փոխակերպումները և վերնագրերը։ Մոնտաժային ուղեցույցները պատկերի մեջ չեն ներառվի։","Պատկերի ձևաչափ","PNG — առանց որակի կորստի","JPEG — ավելի փոքր ֆայլ","Full HD՝ ըստ երկար կողմի","4K UHD՝ ըստ երկար կողմի","JPEG որակ","Դիրք","Պահպանել կադր…","FFmpeg-ի և ffprobe-ի ախտորոշում","Գործիքների ուղիները վերցվում են PATH կամ FFMPEG_PATH / FFPROBE_PATH փոփոխականներից։","Ստուգել կրկին","Ստուգումը դեռ չի սկսվել։","Ստուգումն ընթացքի մեջ է…","Չհաջողվեց կատարել ախտորոշումը","Վերագործարկեք խմբագրիչը և կրկնեք ստուգումը։ Եթե սխալը պահպանվում է, ստուգեք տեղադրման ամբողջականությունը։","Ներմուծված ֆայլեր՝ {count}","Դասավորվել է ըստ համարի՝ {count} ֆայլ · {duration}։","{format} արտահանումն ավարտվեց՝ {file}","Ժամանակագծում · {track} · {name} ({duration})","Մեդիա գրադարանում · {name} ({duration})","Լուսանկարներ ({count})","Հայտնաբերվել է չպահպանված նախագիծ ({savedAt})․ հոլովակներ՝ {clips}, մեդիա տարրեր՝ {media}։ Վերականգնե՞լ։","Ցույց տալ օգնությունը","Կապել հոլովակները","Անջատել տեսանյութի և ձայնի կապը","Անջատել կապը","Միացնել","Անջատել","Թաքցնել","Ցույց տալ","1280 × 720 · 30 FPS","Alt+←","Alt+→","Ctrl+Alt+←","Ctrl+Alt+→","Shift+Alt+←","Shift+Alt+→","ԿԲ","ՄԲ","ԳԲ","Փակել ծանոթացումը","Բացակայում են ֆայլերը","Ներմուծել ֆայլեր","Չեղարկել (Ctrl+Z)","Կրկնել (Ctrl+Y)","Առանձնացնել ձայնը","Կապել տեսանյութն ու ձայնը","Տեսանյութն ու ձայնը կապված են","Այս դիրքում արդեն նշիչ կա","Նշիչն ավելացվեց","Նշիչը վերանվանվեց","Նշիչը ջնջվեց","Ընտրեք նշիչ կամ տեղափոխեք նվագարկման ցուցիչը դրա մոտ","Նախագծում դեռ նշիչներ չկան","Հաջորդ նշիչ չկա","Նախորդ նշիչ չկա","Նախ ընտրեք տեսանյութը կամ դրա ձայնային հոլովակը","Այս տեսանյութն ու ձայնն արդեն կապված են","Չհաջողվեց միանշանակ գտնել զույգը։ Համոզվեք, որ ընտրված են սկզբնական տեսանյութն ու դրանից առանձնացված ձայնը։","Կարելի է կապել միայն տեսանյութի հոլովակն ու հենց այդ տեսանյութից առանձնացված ձայնը","Կապը վերականգնվեց։ Ձայնի ընթացիկ շեղումը պահպանվել է․ այսուհետ հոլովակները կշարժվեն միասին։","Տեսանյութի և ձայնի կապը վերականգնվեց։ Այժմ դրանք կշարժվեն միասին։","Ընտրեք կապված տեսանյութի կամ ձայնի հոլովակը","Ուղին կողպված է","Չհաջողվեց մեդիան տեղադրել ուղու վրա","Նախ ընտրեք տեսանյութի հոլովակ","Ձայնն առանձնացնելու համար ընտրեք տեսանյութը տեսանյութի ուղու վրա","Նախ ապակողպեք տեսանյութի ուղին","Այս հոլովակի ձայնն արդեն առանձին ձայնային ուղու վրա է","Այս տեսանյութում ձայնային հոսք չի գտնվել","Չհաջողվեց ստեղծել ձայնային հոլովակ։ Ստուգեք ձայնային ուղիների հասանելիությունը։","Հնարավոր չէ տեղափոխել կապված զույգը․ նոր դիրքում ուղիներից մեկը զբաղված է","Հոլովակը ջնջվեց","Ripple-ջնջումն ավարտվեց","Հոլովակը տեղափոխվեց","Կտրման կետը չափազանց մոտ է եզրին։","Անցումները կիրառվում են տեսանյութի հոլովակների վրա","Ընտրեք տեսանյութի հոլովակ կամ անցումը քաշեք ժամանակագծի վրա","Ֆայլերը քաշեք այստեղ","կամ սեղմեք «Ներմուծել մեդիա»","Տեսանյութ · Ձայն · Պատկերներ","Ֆայլերը վերամիացված չեն","Որոշ մեդիա ֆայլեր բացակայում են։ Վերամիացրեք դրանք՝ մոնտաժն ավտոմատ վերականգնելու համար։","Փորձնական կոդավորում և ffprobe ստուգում","Տեղադրված տարբերակի հնարավորությունները","Կրիտիկական խնդիրներ չեն հայտնաբերվել։ Կրկին ստուգելու համար սեղմեք «Ստուգել կրկին»։","Որոշվում են գործիքների ուղիներն ու տարբերակները, ստուգվում են կոդեկները և ստեղծվում է կարճ փորձնական MP4։","Ստուգվում են FFmpeg-ն ու ffprobe-ը, H.264/AAC և VP8/VP9/Opus կոդավորիչները, PNG ապակոդավորումն ու MP4/WebM տարաները։ Խմբագրիչը ստեղծում է կարճ փորձնական ֆայլեր հասանելի տարբերակների համար և ffprobe-ով ստուգում հոսքերն ու ժամանակային նշումները։ Ժամանակավոր ֆայլերը ջնջվում են ստուգումից հետո։","Իրական ժամանակի բրաուզերային ձայնագրում","MediaRecorder-ը կախված է համակարգի ծանրաբեռնվածությունից և ցուցադրման ցիկլից։","MP4-ի համար ստուգվել է AAC ձայնը։","WebM-ի համար ստուգվել են VP8/VP9 տեսանյութն ու Opus ձայնը։","Հոսքեր","Դիրք՝ ","կադր № ","Կարտահանվի ընթացիկ դադարի կադրը։","Կադրեր","վրկ.","ր."],"tk":["Yzygiderli pozmak","Saýlanan markeri poz","Klipi 1 kadr çepe süýşür","Klipi 1 kadr saga süýşür","10 kadr çepe süýşür","10 kadr saga süýşür","Saýlawy aýyr","Ini boýunça ýerleşdir","Üçden bir düzgüni üçin ugrukdyryjy çyzyklar","Howpsuz çäkler","Üçden bir tor we howpsuz çäkler","Ugrukdyryjylary gizle","Magnitli ýapyşmany aç ýa-da öçür","20 geçiş","Başynda ýuwaş-ýuwaşdan peýda bolmagy ulan","Ahyrynda ýuwaş-ýuwaşdan ýitmegi ulan","Öňki klip bilen kesişýän geçiş","Öňki klip bilen çepden perde geçişi","Öňki klip bilen sagdan perde geçişi","Klipiň geçişlerini aýyr","FFmpeg we ffprobe anyklaýyş…","Maslahatlar AÇYK","Maslahatlary öçür","Maslahatlar ÖÇÜK","Media import et","⇅ San boýunça tertiple","San tertibi: 1, 2, 3… ýa-da 001, 002, 003…","Animasiýany görmek üçin kursory kartanyň üstünde saklaň. Ony klipiň üstüne süýşüriň: çep gyrasy giriş, sag gyrasy çykyş effektini ulanýar. Klipleriň arasyna goýlanda üst-üste düşme döredilýär. Karta basmak saýlanan klip üçin giriş effektini ulanýar.","Yzygiderlilik 01","Mediýany kitaphanadan traka süýşüriň","Redaktor bilen tanyşlyk","«Montazhnaya» programmasyna hoş geldiňiz!","Esasy amallary ýönekeý ädimler bilen görkezerin. Siz degişli hereketi saýlaýançaňyz taslamaňyzda hiç zat üýtgemeýär.","Öz depgiňizde öwreniň we tanyşlygy islän wagtyňyz ýapyň.","Soňrak","Yza","Tanyşlygy başlat","Montaj yzygiderliligini eksport et","Maksatlaýyn ortaça bitreýt","2 Mbit/s (ortaça)","5 Mbit/s (ortaça)","10 Mbit/s (ortaça)","20 Mbit/s (ortaça)","40 Mbit/s (ortaça)","Başlangyç, s","Soňky, s","Başlangyç = oýnatma görkezijisi","Soňky = oýnatma görkezijisi","Diňe saýlanan bölegi eksport edip bolýar. Wagt taýmlaynyň başyndan sekuntlarda ölçelýär, bölegiň araçäkleri bolsa saýlanan kadr ýygylygyna görä tegeleklenýär.","Ýatda saklanmadyk üýtgeşmeler bar","Maslahatlaryň dolandyrylyşy","Giňişleýin maslahatlary aç","Giňişleýin maslahatlary öçür","Taslamany sakla (Ctrl+S)","Wideo, saz ýa-da surat goş","Suratlary saza görä awtomatik tertiple","Wideony eksport et (Ctrl+E)","Suratlary we wideolary faýl atyndaky sanlar boýunça tertiple","Geçiş tap…","Geçişleri gözle","Taslamanyň häzirki sazlamalary","Başyna geç (Home)","Öňki kadr (←)","Oýnat / duruz (Space)","Indiki kadr (→)","Ahyryna geç (End)","Duruz (başyna dolan)","Taslamanyň kadr ýygylygy","Taraplaryň gatnaşygy","Taslamanyň çözgüdi","Kiçelt","Masştab","Ulalt","Klipleriň gyralaryny we oýnatma görkezijisini magnitli ýapyşdyr","Montaj birleşýän nokadynda","Klipiň gyrasynda","üst-üste düşme","giriş/çykyş","Geçiş tapylmady","Gara reňkden peýda bol","Ak reňkden peýda bol","Ak ýalpyldama","Aşakdan perde","Ýokardan perde","Diagonal perde","Ýokary süýşür","Aşak süýşür","Tegelek diafragma","Göwher","Ýumşak fokus","Aýlanma","Ýuwaş peýda bolmak / ýitmek","Gara reňke nusgawy öçüş","Ýumşak ýagty geçiş","Gysga kinematografik ýalpyldama","Iki görnüşiň ýumşak garyşmagy","Täze görnüş çepden saga açylýar","Täze görnüş sagdan çepe açylýar","Aşakdan ýokary açylýar","Ýokardan aşak açylýar","Diagonal açylyş","Täze görnüş sagdan süýşüp girýär","Täze görnüş çepden süýşüp girýär","Täze görnüş aşakdan süýşüp girýär","Täze görnüş ýokardan süýşüp girýär","Kadra ýuwaş ýakynlaşma","Ýakyn görnüşden ýuwaş daşlaşma","Tegelek kadr gyralaryna çenli giňelýär","Merkezden geometrik açylyş","Bulanyk şekil aýdyňlaşýar","Ýeňil aýlanýan geçiş","Interfeýs dili…","Awtomatik (ulgamyň dili)","Goşmaça diller aýratyn paketler hökmünde goşular.","Interfeýs diliniň saýlawy şu kompýuterde saklanar.","Ulanyl","Elýeterli","Ýakynda","Terjime paketi gurulmadyk","Montazhnaya","0,65 s","Kadr","FPS","ozal","TASLAMA","· FAÝL ÝOK","Taslama","Media elementleri","Klipler","Dowamlylygy","Ýok faýllar: {count}","Media baglanyşyklaryny dikeltmek üçin «Faýllary täzeden bagla» düwmesine basyň.","Aýratynlyklaryny görmek üçin klipi ýa-da media elementini saýlaň","Media elementi","Ady","Görnüşi","Ýagdaýy","faýl ýok","Sazlamalar","deslapky ýagdaýda 5 s","Faýlyň ölçegi","Hereketler","Faýly täzeden bagla…","Taýmlayna goş","Media kitaphanasyndan aýyr","Klip","Trek"," (gulplanan)","faýl aýryldy","Wagt","Dowamlylygy, s","Çeşmäniň giriş nokady, s","Çeşmäniň çykyş nokady, s","Taýmlaynyň soňy","Çeşmäniň dowamlylygy","Suratlary klipiň çep ýa-da sag gyrasyny süýşürip kesip bolýar. Olaryň dowamlylygy çeşme mediýanyň dowamlylygy bilen çäklendirilmeýär. Takyk baha üçin ýokarda sekuntlary giriziň.","Açyklyk, %","Masştab, %","Merkez X, %","Merkez Y, %","Ýerleşdiriş tertibi","Doly ýerleşdir","Kadrı doldur (kes)","Kameranyň hereketi","Hereketsiz","Ýuwaş ýakynlaşma","Ýuwaş uzaklaşma","Çepe panorama","Saga panorama","Ýokary panorama","Aşak panorama","Aýlanma, °","Ters öwür","Keseligine","Dikligine","Täzeden düz","Reňk düzedişi","Ýagtylyk, %","Kontrast, %","Reňk doýgunlygy, %","Reňk stili","Stilsiz","Kinematografik","Ak-gara","Sepiýa","Wintaj","Sowuk","Ýyly","Gijeki","Reňk düzedişini täzeden düz","Klipiň üstündäki ýazgylar","Tekst","Sözbaşy ýa-da ýazgy giriziň…","Şrift ölçegi","Tekstiň reňki","Ýerleşişi","Ýokarda merkezde","Merkezde","Aşakda merkezde","Aşakda çepde","Aşakda sagda","Fon","Bellik","Tekst wideonyň içine ýazylýar","Ses derejesi, %","Ýuwaş ses artmagy, s","Ýuwaş ses peselmegi, s","Başynda, s","Giriş tertibi","Ahyrynda, s","Çykyş tertibi","Ses eýýäm aýryldy","Sesi aýratyn audio trege böl","Bu ýerde klip eýýäm bar","Klip goňşy klipiň üstüni ýapar","Çeşmäniň täze giriş nokady goňşy klip bilen gapma-garşylyk döreder","Diňe faýl atlarynda sanlar bolan suratlar we wideolar goşular. Tertipleme san boýunça amala aşyrylýar, şonuň üçin 2 sany 10-dan öň ýerleşer. Klipler biri-biriniň üstüni ýapmazdan yzygiderli ýerleşdiriler.","Wideo treki","Yzygiderliligiň başlangyjy","Oýnatma görkezijisiniň duran ýerinde","Saýlanan trekiň soňunda","Suratyň dowamlylygy, sek.","Media elementleri tertip boýunça","Tertiple","Belgili suratlar ýa-da wideolar ýok.","Faýl atlarynda san bolan suratlar ýa-da wideolar tapylmady. Mysal üçin: 001.jpg, 002.jpg, 003.jpg.","Görünýän we gulpy açyk wideo trek saýlaň.","Surat we saz slaýd-şousy","Suratlary şu ýerden al","Saz treki","Dowamlylyk tertibi","Sazyň dowamlylygyna laýykla","Her surat üçin deň dowamlylyk","Taýmlayn aralygyny doldur","Suratlar üçin wideo treki","Başlangyç, sek.","Her suratyň dowamlylygy, sek.","Aralygyň uzynlygy, sek.","Suratlaryň arasyndaky geçişler","Geçişsiz","Geçişiň dowamlylygy, sek.","Ýuwaş ýakynlaşmany we panoramany gezekleşdir","Haýal ýakynlaşma","Haýal uzaklaşma","Suratlaryň tertibi","Trekde ýerleşişi ýaly","Ady boýunça: A → Z","Ady boýunça: Z → A","Saz üçin audio trek","Birinji suraty ýuwaş görkez, soňkusyny ýuwaş ýitirt","Slaýd-şou döret","Sazlamalary barlaň.","Häzirki kadrı sakla","Taýmlaynyň häzirki ýagdaýyndaky doly kompozisiýa saklanar: görünýän wideo gatlaklary, geçişler, reňk düzedişi, özgertmeler we ýazgylar. Montaj ugrukdyryjylary surata goşulmaz.","Suratyň formaty","PNG — ýitgisiz","JPEG — faýl kiçiräk","Uzyn tarapy boýunça Full HD","Uzyn tarapy boýunça 4K UHD","JPEG hili","Ýerleşişi","Kadrı sakla…","FFmpeg we ffprobe anyklaýyş","Gurallaryň ýollary PATH ýa-da FFMPEG_PATH / FFPROBE_PATH üýtgeýjilerinden alynýar.","Täzeden barla","Barlag entek başlamady.","Barlag geçirilýär…","Anyklamany ýerine ýetirip bolmady","Redaktory täzeden işe giriziň we barlagy gaýtalaň. Ýalňyşlyk dowam etse, gurnamanyň bitewüligini barlaň.","Import edilen faýllar: {count}","San boýunça ýerleşdirildi: {count} faýl · {duration}.","{format} eksporty tamamlandy: {file}","Taýmlaynda · {track} · {name} ({duration})","Media kitaphanasynda · {name} ({duration})","Suratlar ({count})","Saklanmadyk taslama tapyldy ({savedAt}): klipler — {clips}, media — {media}. Dikeldilsinmi?","Kömegi görkez","Klipleri bagla","Wideony audiodan aýyr","Baglanyşygy aýyr","Işlet","Öçür","Gizle","Görkez","1280 × 720 · 30 FPS","Alt+←","Alt+→","Ctrl+Alt+←","Ctrl+Alt+→","Shift+Alt+←","Shift+Alt+→","KB","MB","GB","Tanyşlygy ýap","Faýllar ýok","Faýllary import et","Yza gaýtar (Ctrl+Z)","Gaýtala (Ctrl+Y)","Sesi aýyr","Wideony we audiony bagla","Wideo we audio baglandy","Bu ýerde marker eýýäm bar","Marker goşuldy","Marker ady üýtgedildi","Marker pozuldy","Markeri saýlaň ýa-da oýnatma görkezijisini onuň golaýyna geçiriň","Taslamada häzirlikçe marker ýok","Indiki marker ýok","Öňki marker ýok","Ilki wideony ýa-da onuň audio klipini saýlaň","Bu wideo we audio eýýäm baglanan","Jübüti anyk kesgitläp bolmady. Asyl wideonyň we ondan aýrylan sesiň saýlanandygyny barlaň.","Diňe wideo klipini we şol wideodan aýrylan sesi baglap bolýar","Baglanyşyk dikeldildi. Häzirki audio süýşmesi saklandy; mundan beýläk klipler bile hereket eder.","Wideo bilen audionyň baglanyşygy dikeldildi. Indi olar bile hereket eder.","Baglanan wideo ýa-da audio klipini saýlaň","Trek gulplanan","Mediýany treke ýerleşdirip bolmady","Ilki wideo klipini saýlaň","Sesi aýyrmak üçin wideo trekdäki wideony saýlaň","Ilki wideo trekiň gulpuny açyň","Bu klipiň sesi eýýäm aýratyn audio trekde ýerleşýär","Bu wideoda audio akymy tapylmady","Audio klipini döredip bolmady. Audio treklere elýeterliligi barlaň.","Baglanan jübüti süýşürip bolmaýar: täze ýerde trekiň biri boş däl","Klip pozuldy","Ripple bilen pozmak tamamlandy","Klip süýşürildi","Kesilen nokat gyrasyna örän ýakyn.","Geçişler wideo kliplere ulanylýar","Wideo klipini saýlaň ýa-da geçişi taýmlayna süýşüriň","Faýllary şu ýere taşlaň","ýa-da «Media import et» düwmesine basyň","Wideo · Audio · Suratlar","Faýllar täzeden baglanmady","Käbir media faýllary ýok. Olary täzeden baglaň — montaj awtomatik dikeldiler.","Synag kodlamasy we ffprobe barlagy","Gurnalan wersiýanyň mümkinçilikleri","Möhüm mesele tapylmady. Täzeden barlamak üçin «Täzeden barla» düwmesine basyň.","Gurallaryň ýollary we wersiýalary kesgitlenýär, kodekler barlanýar we gysga synag MP4 döredilýär.","FFmpeg we ffprobe, H.264/AAC hem-de VP8/VP9/Opus kodlaýjylary, PNG dekodirlemesi we MP4/WebM konteýnerleri barlanýar. Redaktor elýeterli görnüşler üçin gysga synag faýllaryny döredýär we akymlary hem-de wagt belliklerini ffprobe arkaly barlaýar. Wagtlaýyn faýllar barlagdan soň pozulýar.","Brauzerde hakyky wagt ýazgysy","MediaRecorder ulgamyň ýüküne we şekillendiriş tapgyryna baglydyr.","MP4 üçin AAC sesi barlandy.","WebM üçin VP8/VP9 wideosy we Opus sesi barlandy.","Akymlar","Ýerleşişi: ","kadr № ","Häzirki duruzylan kadr eksport ediler.","Kadrlar","sek.","min."],"ky":["Ылдамдатып өчүрүү","Тандалган маркерди өчүрүү","Клипти 1 кадр солго жылдыруу","Клипти 1 кадр оңго жылдыруу","10 кадр солго жылдыруу","10 кадр оңго жылдыруу","Тандоону алып салуу","Туурасы боюнча батырүү","Үчтөн бир эрежесинин багыттоочулары","Коопсуз чектер","Үчтөн бир тору жана коопсуз чектер","Багыттоочуларды жашыруу","Жабыштырууну күйгүзүү/өчүрүү","20 өтүү","Башында акырын пайда болууну колдонуу","Аягында акырын өчүүнү колдонуу","Мурунку клип менен кайчылаш өтүү","Мурунку клип менен сол жактан көшөгө өтүүсү","Мурунку клип менен оң жактан көшөгө өтүүсү","Клиптин өтүүлөрүн алып салуу","FFmpeg жана ffprobe диагностикасы…","Кеңештер КҮЙҮК","Кеңештерди өчүрүү","Кеңештер ӨЧҮК","Медианы импорттоо","⇅ Номери боюнча жайгаштыруу","Сандык тартип: 1, 2, 3… же 001, 002, 003…","Анимациясын көрүү үчүн көрсөткүчтү карточканын үстүнө алып барыңыз. Аны клипке сүйрөңүз: сол чети кирүү, оң чети чыгуу эффектин берет. Клиптердин ортосуна таштасаңыз, кабатташуу түзүлөт. Карточканы басуу тандалган клипке кирүү эффектин колдонот.","Тизме 01","Медианы китепканадан жолго сүйрөңүз","Редактор менен таанышуу","«Монтажнаяга» кош келиңиз!","Негизги аракеттерди жөнөкөй кадамдар менен көрсөтөм. Сиз аракетти тандаганга чейин долбоордо эч нерсе өзгөрбөйт.","Өз ыргагыңызда иштеп, таанышууну каалаган убакта жапсаңыз болот.","Кийинчерээк","Артка","Таанышууну баштоо","Монтаж ыраатын экспорттоо","Максаттуу орточо бит ылдамдыгы","2 Мбит/с (орточо)","5 Мбит/с (орточо)","10 Мбит/с (орточо)","20 Мбит/с (орточо)","40 Мбит/с (орточо)","Башталышы, с","Аягы, с","Башталышы = ойнотуу көрсөткүчү","Аягы = ойнотуу көрсөткүчү","Тандалган бөлүктү гана экспорттоого болот. Убакыт таймлайндын башынан тартып секунд менен өлчөнөт, ал эми бөлүктүн чектери тандалган кадр ылдамдыгына ылайык тегеректелет.","Сакталбаган өзгөртүүлөр бар","Кеңештерди башкаруу","Толук кеңештерди күйгүзүү","Толук кеңештерди өчүрүү","Долбоорду сактоо (Ctrl+S)","Видео, музыка же сүрөт кошуу","Сүрөттөрдү музыкага жараша автоматтык жайгаштыруу","Видеону экспорттоо (Ctrl+E)","Сүрөттөрдү жана видеолорду файл аттарындагы сандар боюнча жайгаштыруу","Өтүүнү табуу…","Өтүүлөрдү издөө","Долбоордун учурдагы жөндөөлөрү","Башына өтүү (Home)","Мурунку кадр (←)","Ойнотуу / тыныгуу (Space)","Кийинки кадр (→)","Аягына өтүү (End)","Токтотуу (башына кайтуу)","Долбоордун кадр ылдамдыгы","Тараптардын катышы","Долбоордун чечилиши","Кичирейтүү","Масштаб","Чоңойтуу","Клиптердин четтерин жана ойнотуу көрсөткүчүн жабыштыруу","Монтаж түйүнүндө","Клиптин четинде","кабатташуу","кирүү/чыгуу","Өтүүлөр табылган жок","Карадан пайда болуу","Актан пайда болуу","Ак жарк этүү","Төмөндөн көшөгө","Жогорудан көшөгө","Диагоналдык көшөгө","Жогору жылдыруу","Төмөн жылдыруу","Тегерек диафрагма","Ромб","Жумшак фокус","Айлануу","Жай пайда болуу / өчүү","Карага классикалык өчүү","Жумшак жарык өтүү","Кыска кинематографиялык жарк этүү","Эки көрүнүштү жумшак аралаштыруу","Жаңы кадр солдон оңго ачылат","Жаңы кадр оңдон солго ачылат","Төмөндөн өйдө ачылат","Жогорудан төмөн ачылат","Диагоналдуу ачылуу","Жаңы көрүнүш оңдон жылып кирет","Жаңы көрүнүш солдон жылып кирет","Жаңы көрүнүш төмөндөн жылып кирет","Жаңы көрүнүш жогорудан жылып кирет","Кадрга акырын жакындоо","Жакын пландан акырын алыстоо","Тегерек кадрдын четтерине чейин чоңоёт","Ортодон геометриялык ачылуу","Бүдөмүк кадр так көрүнөт","Жеңил айланма өтүү","Интерфейс тили…","Автоматтык (системанын тили)","Кошумча тилдер өзүнчө топтомдор менен кошулат.","Интерфейс тилинин тандоосу ушул компьютерде сакталат.","Колдонуу","Жеткиликтүү","Жакында","Котормо топтому орнотула элек","Montazhnaya","0,65 с","Кадр","кадр/с","мурдараак","ДОЛБООР","· ФАЙЛ ЖОК","Долбоор","Медиа элементтери","Клиптер","Узактыгы","Жок файлдар: {count}","Медиа шилтемелерин калыбына келтирүү үчүн «Файлдарды кайра туташтыруу» баскычын басыңыз.","Касиеттерин көрүү үчүн клипти же медиа элементин тандаңыз","Медиа элементи","Аты","Түрү","Абалы","файл жок","Жөндөөлөр","демейки боюнча 5 с","Файлдын көлөмү","Аракеттер","Файлды кайра туташтыруу…","Таймлайнга кошуу","Медиа китепканасынан алып салуу","Клип","Жол"," (кулпуланган)","файл өчүрүлгөн","Убакыт","Узактыгы, с","Булактын кирүү чекити, с","Булактын чыгуу чекити, с","Таймлайндын аягы","Булактын узактыгы","Сүрөттөрдү клиптин сол же оң четин сүйрөп кыркса болот. Алардын узактыгы баштапкы медиа менен чектелбейт. Так маани үчүн жогоруда секундду киргизиңиз.","Тунуктук, %","Масштаб, %","Борбор X, %","Борбор Y, %","Батыртуу режими","Толук батырүү","Кадрды толтуруу (кыркуу)","Камеранын кыймылы","Кыймыл жок","Жай жакындатуу","Жай алыстатуу","Солго панорама","Оңго панорама","Жогору панорама","Төмөн панорама","Буруу, °","Күзгүлөө","Туурасынан","Тигинен","Калыбына келтирүү","Түстү оңдоо","Жарыктык, %","Контраст, %","Каныккандык, %","Түс стили","Стилсиз","Кинематографиялык","Ак-кара","Сепия","Винтаж","Муздак","Жылуу","Түнкү","Түстү оңдоону калыбына келтирүү","Клиптин үстүндөгү аталыштар","Текст","Аталышты же жазууну киргизиңиз…","Арип өлчөмү","Тексттин түсү","Жайгашуусу","Жогору ортодо","Ортодо","Төмөн ортодо","Төмөн сол жакта","Төмөн оң жакта","Фон","Эскертүү","Текст видеонун ичине кошулат","Үн деңгээли, %","Үндүн акырын күчөшү, с","Үндүн акырын басаңдашы, с","Башында, с","Кирүү режими","Аягында, с","Чыгуу режими","Үн буга чейин бөлүнгөн","Үндү өзүнчө аудио жолго бөлүү","Бул жерде клип мурунтан бар","Клип коңшу клипти жаап калат","Булактын жаңы кирүү чекити коңшу клип менен карама-каршылык жаратат","Файл аталышында сандары бар сүрөттөр жана видеолор гана кошулат. Иреттөө сан боюнча болот, ошондуктан 2 саны 10дон мурда жайгашат. Клиптер кабатташпай, биринин артынан бири коюлат.","Видео жолу","Тизменин башталышы","Ойнотуу көрсөткүчүнүн ордуна","Тандалган жолдун аягында","Сүрөттүн узактыгы, сек.","Медиа элементтери ирети менен","Жайгаштыруу","Номерленген сүрөттөр же видеолор жеткиликтүү эмес.","Файл атында сандар бар сүрөттөр же видеолор табылган жок. Мисалы: 001.jpg, 002.jpg, 003.jpg.","Көрүнүп турган жана кулпусу ачылган видео жолун тандаңыз.","Сүрөт жана музыка слайд-шоусу","Сүрөттөрдү бул жерден алуу","Музыка жолу","Узактык режими","Музыканын узактыгына ылайыктоо","Ар бир сүрөткө бирдей убакыт","Таймлайндын бөлүгүн толтуруу","Сүрөттөр үчүн видео жолу","Башталышы, сек.","Ар бир сүрөттүн узактыгы, сек.","Бөлүктүн узундугу, сек.","Сүрөттөрдүн ортосундагы өтүүлөр","Өтүүсүз","Өтүүнүн узактыгы, сек.","Жай жакындатуу менен панораманы кезектештирүү","Жай жакындатуу","Жай алыстатуу","Сүрөттөрдүн ирети","Жолдогу жайгашуусундай","Аты боюнча: A → Z","Аты боюнча: Z → A","Музыка үчүн аудио жолу","Биринчи сүрөттү акырын көрсөтүп, акыркысын акырын өчүрүү","Слайд-шоу түзүү","Жөндөөлөрдү текшериңиз.","Учурдагы кадрды сактоо","Таймлайндын учурдагы ордундагы толук композиция сакталат: көрүнгөн видео катмарлары, өтүүлөр, түстү оңдоо, өзгөртүүлөр жана аталыштар. Монтаж багыттоочулары сүрөткө кошулбайт.","Сүрөт форматы","PNG — сапат жоголбойт","JPEG — файл көлөмү кичирээк","Узун жагы боюнча Full HD","Узун жагы боюнча 4K UHD","JPEG сапаты","Жайгашуу","Кадрды сактоо…","FFmpeg жана ffprobe диагностикасы","Куралдардын жолдору PATH же FFMPEG_PATH / FFPROBE_PATH өзгөрмөлөрүнөн алынат.","Кайра текшерүү","Текшерүү азырынча баштала элек.","Текшерүү жүрүп жатат…","Диагностиканы аткаруу мүмкүн болгон жок","Редакторду кайра иштетип, текшерүүнү кайталаңыз. Ката сакталса, орнотуунун бүтүндүгүн текшериңиз.","Импорттолгон файлдар: {count}","Номери боюнча жайгаштырылды: {count} файл · {duration}.","{format} экспорту аяктады: {file}","Таймлайнда · {track} · {name} ({duration})","Медиа китепканасында · {name} ({duration})","Сүрөттөр ({count})","Сакталбаган долбоор табылды ({savedAt}): клиптер — {clips}, медиа — {media}. Калыбына келтирилсинби?","Жардамды көрсөтүү","Клиптерди байланыштыруу","Видеону аудиодон ажыратуу","Байланышты үзүү","Күйгүзүү","Өчүрүү","Жашыруу","Көрсөтүү","1280 × 720 · 30 FPS","Alt+←","Alt+→","Ctrl+Alt+←","Ctrl+Alt+→","Shift+Alt+←","Shift+Alt+→","КБ","МБ","ГБ","Таанышууну жабуу","Файлдар жок","Файлдарды импорттоо","Жокко чыгаруу (Ctrl+Z)","Кайталоо (Ctrl+Y)","Үндү бөлүү","Видео менен аудиону байланыштыру","Видео жана аудио байланышкан","Бул жерде маркер мурунтан бар","Маркер кошулду","Маркердин аты өзгөртүлдү","Маркер өчүрүлдү","Маркерди тандаңыз же ойнотуу көрсөткүчүн анын жанына жылдырыңыз","Долбоордо азырынча маркерлер жок","Кийинки маркер жок","Мурунку маркер жок","Алгач видеону же анын аудио клибин тандаңыз","Бул видео менен аудио мурунтан байланышкан","Жупту так аныктоо мүмкүн болгон жок. Баштапкы видео жана андан бөлүнгөн үн тандалганын текшериңиз.","Видео клипти жана ошол видеодон бөлүнгөн үндү гана байланыштырууга болот","Байланыш калыбына келтирилди. Үндүн учурдагы жылышы сакталды; эми клиптер чогуу жылат.","Видео менен аудионун байланышы калыбына келтирилди. Эми алар чогуу жылат.","Байланышкан видео же аудио клипти тандаңыз","Жол кулпуланган","Медианы жолго жайгаштыруу мүмкүн болгон жок","Алгач видео клипти тандаңыз","Үндү бөлүү үчүн видео жолдогу видеону тандаңыз","Алгач видео жолдун кулпусун ачыңыз","Бул клиптин үнү өзүнчө аудио жолдо турат","Бул видеодон аудио агымы табылган жок","Аудио клипти түзүү мүмкүн болгон жок. Аудио жолдор жеткиликтүү экенин текшериңиз.","Байланышкан жупту жылдыруу мүмкүн эмес: жаңы орунда жолдордун бири бош эмес","Клип өчүрүлдү","Ripple өчүрүү аяктады","Клип жылдырылды","Кесүү чекити четине өтө жакын.","Өтүүлөр видео клиптерге колдонулат","Видео клипти тандаңыз же өтүүнү таймлайнга сүйрөңүз","Файлдарды бул жерге таштаңыз","же «Медианы импорттоо» баскычын басыңыз","Видео · Аудио · Сүрөттөр","Файлдар кайра туташтырылган жок","Айрым медиа файлдар жок. Аларды кайра туташтырыңыз — монтаж автоматтык түрдө калыбына келет.","Сыноо коддоосу жана ffprobe текшерүүсү","Орнотулган версиянын мүмкүнчүлүктөрү","Критикалык маселе табылган жок. Кайра текшерүү үчүн «Кайра текшерүү» баскычын басыңыз.","Куралдардын жолдору жана версиялары аныкталып, кодектер текшерилет жана кыска сыноо MP4 файлы түзүлөт.","FFmpeg жана ffprobe, H.264/AAC жана VP8/VP9/Opus коддогучтары, PNG декоддоосу жана MP4/WebM контейнерлери текшерилет. Редактор жеткиликтүү варианттар үчүн кыска сыноо файлдарын түзүп, агымдарды жана убакыт белгилерин ffprobe аркылуу текшерет. Убактылуу файлдар текшерүүдөн кийин өчүрүлөт.","Браузерде реалдуу убакытта жаздыруу","MediaRecorder тутумдун жүктөмүнө жана көрсөтүү циклине көз каранды.","MP4 үчүн AAC аудиосу текшерилди.","WebM үчүн VP8/VP9 видеосу жана Opus аудиосу текшерилди.","Агымдар","Орду: ","кадр № ","Учурдагы токтотулган кадр экспорттолот.","Кадрлар","сек.","мүн."],"tg":["Несткунии пайдарпай","Нест кардани нишонаи интихобшуда","Клипро як кадр ба чап ҷобаҷо кардан","Клипро як кадр ба рост ҷобаҷо кардан","10 кадр ба чап ҷобаҷо кардан","10 кадр ба рост ҷобаҷо кардан","Бекор кардани интихоб","Ҷойгир кардан аз рӯи паҳноӣ","Роҳнамоҳои қоидаи сеяк","Ҳошияҳои бехатар","Шабакаи сеяк ва ҳошияҳои бехатар","Пинҳон кардани роҳнамоҳо","Фаъол/ғайрифаъол кардани часпондан","20 гузариш","Истифодаи пайдоиши тадриҷӣ дар оғоз","Истифодаи нопадидшавии тадриҷӣ дар анҷом","Гузариши байниҳамдигарӣ бо клипи пешина","Парда аз чап бо клипи пешина","Парда аз рост бо клипи пешина","Нест кардани гузаришҳои клип","Ташхиси FFmpeg ва ffprobe…","Маслиҳатҳо ФАЪОЛ","Хомӯш кардани маслиҳатҳо","Маслиҳатҳо ХОМӮШ","Ворид кардани медиа","⇅ Ҷобаҷогузорӣ аз рӯи рақам","Тартиби рақамӣ: 1, 2, 3… ё 001, 002, 003…","Барои дидани аниматсия нишонгарро болои корт нигоҳ доред. Онро ба клип кашед: канори чап эффекти воридшавӣ, канори рост эффекти баромадро татбиқ мекунад. Ҷойгир кардан байни клипҳо ҳампӯшӣ месозад. Пахш кардани корт эффекти воридшавиро ба клипи интихобшуда татбиқ мекунад.","Пайдарпаӣ 01","Медиа-ро аз китобхона ба роҳ кашед","Шиносоӣ бо муҳаррир","Ба «Монтажная» хуш омадед!","Амалҳои асосиро бо қадамҳои содда нишон медиҳам. То вақте ки худатон амалеро интихоб накунед, дар лоиҳа чизе тағйир намеёбад.","Бо суръати худ пеш равед ва ҳар вақт метавонед шиносоиро пӯшед.","Баъдтар","Бозгашт","Оғози шиносоӣ","Содироти пайдарпаии монтаж","Суръати миёнаи мақсадноки бит","2 Мбит/с (миёна)","5 Мбит/с (миёна)","10 Мбит/с (миёна)","20 Мбит/с (миёна)","40 Мбит/с (миёна)","Оғоз, с","Анҷом, с","Оғоз = нишонгари навозиш","Анҷом = нишонгари навозиш","Танҳо қисми интихобшударо содир кардан мумкин аст. Вақт аз оғози таймлайн бо сония чен карда мешавад ва ҳудуди қисм мувофиқи басомади кадрҳои интихобшуда гирд карда мешавад.","Тағйироти нигоҳнадошта мавҷуданд","Идоракунии маслиҳатҳо","Фаъол кардани маслиҳатҳои муфассал","Хомӯш кардани маслиҳатҳои муфассал","Нигоҳ доштани лоиҳа (Ctrl+S)","Илова кардани видео, мусиқӣ ё аксҳо","Аксҳоро ба мусиқӣ ба таври худкор мувофиқ кардан","Содироти видео (Ctrl+E)","Ҷобаҷо кардани тасвирҳо ва видеоҳо аз рӯи рақамҳои номи файл","Ёфтани гузариш…","Ҷустуҷӯи гузаришҳо","Танзимоти ҷории лоиҳа","Ба оғоз гузаштан (Home)","Кадри қаблӣ (←)","Навозиш / таваққуф (Space)","Кадри навбатӣ (→)","Ба анҷом гузаштан (End)","Истодан (баргаштан ба оғоз)","Басомади кадрҳои лоиҳа","Таносуби тарафҳо","Ҳалли лоиҳа","Хурд кардан","Масштаб","Калон кардан","Часпонидани канори клипҳо ва нишонгари навозиш","Дар нуқтаи пайвасти монтаж","Дар канори клип","ҳампӯшӣ","воридшавӣ/баромад","Гузаришҳо ёфт нашуданд","Пайдо шудан аз сиёҳӣ","Пайдо шудан аз сафедӣ","Дурахши сафед","Парда аз поён","Парда аз боло","Пардаи диагоналӣ","Ба боло лағжондан","Ба поён лағжондан","Диафрагмаи даврашакл","Алмос","Фокуси нарм","Гардиш","Пайдоиш / хомӯшшавии ҳамвор","Хомӯшшавии классикӣ то сиёҳӣ","Гузариши равшани нарм","Дурахши кӯтоҳи кинематографӣ","Омезиши нарми ду кадр","Кадри нав аз чап ба рост кушода мешавад","Кадри нав аз рост ба чап кушода мешавад","Кушодан аз поён ба боло","Кушодан аз боло ба поён","Кушодани диагоналӣ","Кадри нав аз рост ворид мешавад","Кадри нав аз чап ворид мешавад","Кадри нав аз поён ворид мешавад","Кадри нав аз боло ворид мешавад","Наздикшавии ҳамвор ба кадр","Дуршавии нарм аз нақшаи наздик","Доира то канорҳои кадр васеъ мешавад","Кушодани геометрӣ аз марказ","Кадри хира равшан мешавад","Гузариши сабуки даврзананда","Забони интерфейс…","Худкор (забони система)","Забонҳои иловагӣ ҳамчун бастаҳои алоҳида илова мешаванд.","Интихоби забони интерфейс дар ҳамин компютер нигоҳ дошта мешавад.","Истифода бурдан","Дастрас","Ба наздикӣ","Бастаи тарҷума насб нашудааст","Montazhnaya","0,65 с","Кадр","кадр/с","пештар","ЛОИҲА","· ФАЙЛ НЕСТ","Лоиҳа","Унсурҳои медиа","Клипҳо","Давомнокӣ","Файлҳои гумшуда: {count}","Барои барқарор кардани пайвандҳои медиа тугмаи «Пайваст кардани файлҳо»-ро пахш кунед.","Барои дидани хусусиятҳо клип ё унсури медиаро интихоб кунед","Унсури медиа","Ном","Навъ","Ҳолат","файл мавҷуд нест","Танзимот","бо нобаёнӣ 5 с","Андозаи файл","Амалҳо","Аз нав пайваст кардани файл…","Илова ба таймлайн","Хориҷ аз китобхонаи медиа","Клип","Роҳ"," (қулф аст)","файл нест карда шуд","Вақт","Давомнокӣ, с","Нуқтаи воридшавии манбаъ, с","Нуқтаи баромади манбаъ, с","Анҷоми таймлайн","Давомнокии манбаъ","Аксҳоро бо кашидани канори чап ё рости клип буридан мумкин аст. Давомнокии онҳо бо давомнокии медиаи манбаъ маҳдуд намешавад. Барои арзиши дақиқ сонияҳоро дар боло ворид кунед.","Шаффофият, %","Масштаб, %","Марказ X, %","Марказ Y, %","Ҳолати ҷойгиркунӣ","Пурра ҷойгир кардан","Пур кардани кадр (буридан)","Ҳаракати камера","Бе ҳаракат","Наздиккунии ҳамвор","Дуркунии ҳамвор","Панорама ба чап","Панорама ба рост","Панорама ба боло","Панорама ба поён","Гардиш, °","Оина кардан","Уфуқӣ","Амудӣ","Аз нав танзим кардан","Ислоҳи ранг","Равшанӣ, %","Контраст, %","Серӣ, %","Услуби ранг","Бе услуб","Кинематографӣ","Сиёҳу сафед","Сепия","Винтаж","Сард","Гарм","Шабона","Аз нав танзим кардани ислоҳи ранг","Унвонҳои болои клип","Матн","Сарлавҳа ё навиштаҷотро ворид кунед…","Андозаи ҳуруф","Ранги матн","Мавқеъ","Боло дар марказ","Дар марказ","Поён дар марказ","Поён аз чап","Поён аз рост","Замина","Эзоҳ","Матн ба видео сабт мешавад","Баландии овоз, %","Баландшавии тадриҷии садо, с","Пастшавии тадриҷии садо, с","Дар оғоз, с","Ҳолати воридшавӣ","Дар анҷом, с","Ҳолати баромад","Овоз аллакай ҷудо карда шудааст","Ҷудо кардани овоз ба роҳи аудио","Дар ин ҷо аллакай клип мавҷуд аст","Клип бо клипи ҳамсоя ҳампӯш мешавад","Нуқтаи нави воридшавии манбаъ бо клипи ҳамсоя ихтилоф ба вуҷуд меорад","Танҳо тасвирҳо ва видеоҳое илова мешаванд, ки дар номи файл рақам доранд. Ҷобаҷогузорӣ рақамӣ аст, бинобар ин 2 пеш аз 10 меояд. Клипҳо пайдарпай, бе ҳампӯшӣ ҷойгир карда мешаванд.","Роҳи видео","Оғози пайдарпаӣ","Дар мавқеи нишонгари навозиш","Дар охири роҳи интихобшуда","Давомнокии тасвир, сония","Унсурҳои медиа бо тартиб","Ҷобаҷо кардан","Тасвирҳо ё видеоҳои рақамдор дастрас нестанд.","Тасвир ё видеое, ки дар номи файл рақам дорад, ёфт нашуд. Масалан: 001.jpg, 002.jpg, 003.jpg.","Роҳи видеоии намоён ва кушодашударо интихоб кунед.","Слайд-шоуи аксҳо ва мусиқӣ","Аксҳоро аз куҷо гирифтан","Роҳи мусиқӣ","Ҳолати давомнокӣ","Мутобиқ кардан ба давомнокии мусиқӣ","Давомнокии якхела барои ҳар акс","Пур кардани қисми таймлайн","Роҳи видео барои аксҳо","Оғоз, сония","Давомнокии ҳар акс, сония","Дарозии қисм, сония","Гузаришҳо байни аксҳо","Бе гузариш","Давомнокии гузариш, сония","Иваз кардани зум ва панорамаи ҳамвор","Наздиккунии суст","Дуркунии суст","Тартиби аксҳо","Мувофиқи ҷойгиршавӣ дар роҳ","Аз рӯи ном: А → Я","Аз рӯи ном: Я → А","Роҳи аудио барои мусиқӣ","Пайдоиши тадриҷии акси аввал ва хомӯшшавии акси охирин","Сохтани слайд-шоу","Танзимотро санҷед.","Нигоҳ доштани кадри ҷорӣ","Композитсияи пурра дар мавқеи ҷории таймлайн нигоҳ дошта мешавад: қабатҳои намоёни видео, гузаришҳо, ислоҳи ранг, табдилдиҳӣ ва унвонҳо. Роҳнамоҳои монтаж ба тасвир дохил намешаванд.","Формати тасвир","PNG — бе талафи сифат","JPEG — файли хурдтар","Full HD аз рӯи тарафи дароз","4K UHD аз рӯи тарафи дароз","Сифати JPEG","Мавқеъ","Нигоҳ доштани кадр…","Ташхиси FFmpeg ва ffprobe","Роҳҳои асбобҳо аз PATH ё тағйирёбандаҳои FFMPEG_PATH / FFPROBE_PATH гирифта мешаванд.","Боз санҷидан","Санҷиш ҳанӯз оғоз нашудааст.","Санҷиш иҷро шуда истодааст…","Иҷрои ташхис муяссар нашуд","Муҳаррирро аз нав оғоз кунед ва санҷишро такрор намоед. Агар хато боқӣ монад, пуррагии насбро санҷед.","Файлҳои воридшуда: {count}","Аз рӯи рақам ҷойгир карда шуд: {count} файл · {duration}.","Содироти {format} анҷом ёфт: {file}","Дар таймлайн · {track} · {name} ({duration})","Дар китобхонаи медиа · {name} ({duration})","Аксҳо ({count})","Лоиҳаи нигоҳнадошта ёфт шуд ({savedAt}): клипҳо — {clips}, медиа — {media}. Барқарор карда шавад?","Намоиши кӯмак","Пайваст кардани клипҳо","Ҷудо кардани видео аз аудио","Қатъ кардани пайваст","Фаъол кардан","Ғайрифаъол кардан","Пинҳон кардан","Намоиш додан","1280 × 720 · 30 FPS","Alt+←","Alt+→","Ctrl+Alt+←","Ctrl+Alt+→","Shift+Alt+←","Shift+Alt+→","КБ","МБ","ГБ","Пӯшидани шиносоӣ","Файлҳо вуҷуд надоранд","Ворид кардани файлҳо","Бекор кардан (Ctrl+Z)","Такрор кардан (Ctrl+Y)","Ҷудо кардани садо","Пайваст кардани видео ва аудио","Видео ва аудио пайваст шуданд","Дар ин мавқеъ аллакай нишона мавҷуд аст","Нишона илова шуд","Номи нишона иваз шуд","Нишона нест карда шуд","Нишонаро интихоб кунед ё нишонгари навозишро ба наздикии он гузаронед","Дар лоиҳа ҳанӯз нишонаҳо нестанд","Нишонаи навбатӣ вуҷуд надорад","Нишонаи қаблӣ вуҷуд надорад","Аввал видео ё клипи аудиоии онро интихоб кунед","Ин видео ва аудио аллакай пайвастанд","Ҷуфтро якмаъно муайян кардан муяссар нашуд. Санҷед, ки видеои аслӣ ва садои аз он ҷудошуда интихоб шудаанд.","Танҳо клипи видеоӣ ва садои аз ҳамин видео ҷудошударо пайваст кардан мумкин аст","Пайваст барқарор шуд. Ҷойивазкунии ҷории аудио нигоҳ дошта шуд; минбаъд клипҳо якҷоя ҳаракат мекунанд.","Пайвасти видео ва аудио барқарор шуд. Акнун онҳо якҷоя ҳаракат мекунанд.","Клипи видеоӣ ё аудиоии пайвастро интихоб кунед","Роҳ қулф шудааст","Ҷойгир кардани медиа дар роҳ муяссар нашуд","Аввал клипи видеоиро интихоб кунед","Барои ҷудо кардани садо видеоеро дар роҳи видео интихоб кунед","Аввал қулфи роҳи видеоро кушоед","Садои ин клип аллакай дар роҳи алоҳидаи аудио ҷойгир аст","Дар ин видео ҷараёни аудио ёфт нашуд","Клипи аудио сохта нашуд. Дастрасии роҳҳои аудиоиро санҷед.","Ҷуфти пайвастро кӯчондан мумкин нест: дар мавқеи нав яке аз роҳҳо банд аст","Клип нест карда шуд","Несткунии Ripple анҷом ёфт","Клип кӯчонида шуд","Нуқтаи буриш ба канор хеле наздик аст.","Гузаришҳо ба клипҳои видеоӣ татбиқ мешаванд","Клипи видеоиро интихоб кунед ё гузаришро ба таймлайн кашед","Файлҳоро ба ин ҷо кашед","ё тугмаи «Ворид кардани медиа»-ро пахш кунед","Видео · Аудио · Тасвирҳо","Файлҳо аз нав пайваст нашуданд","Баъзе файлҳои медиа намерасанд. Онҳоро аз нав пайваст кунед — монтаж ба таври худкор барқарор мешавад.","Рамзгузории санҷишӣ ва санҷиши ffprobe","Имкониятҳои версияи насбшуда","Мушкили ҷиддӣ ёфт нашуд. Барои санҷиши такрорӣ тугмаи «Боз санҷидан»-ро пахш кунед.","Роҳҳо ва версияҳои асбобҳо муайян карда мешаванд, кодекҳо санҷида мешаванд ва файли кӯтоҳи санҷишии MP4 сохта мешавад.","Мавҷудияти FFmpeg ва ffprobe, рамзгузорҳои H.264/AAC ва VP8/VP9/Opus, рамзкушоии PNG ва контейнерҳои MP4/WebM санҷида мешаванд. Муҳаррир барои имконоти дастрас файлҳои кӯтоҳи санҷишӣ месозад ва ҷараёнҳо ва тамғаҳои вақтро бо ffprobe месанҷад. Файлҳои муваққатӣ баъди санҷиш нест карда мешаванд.","Сабти вақти воқеӣ дар браузер","MediaRecorder аз сарбории система ва даври тасвирсозӣ вобаста аст.","Садои AAC барои MP4 санҷида шудааст.","Видеоҳои VP8/VP9 ва садои Opus барои WebM санҷида шудаанд.","Ҷараёнҳо","Мавқеъ: ","кадр № ","Кадри ҷории таваққуфшуда содир карда мешавад.","Кадрҳо","сония","дақ."],"be":["Выдаленне са зрухам","Выдаліць выбраны маркер","Зрушыць кліп на 1 кадр улева","Зрушыць кліп на 1 кадр управа","Зрушыць на 10 кадраў улева","Зрушыць на 10 кадраў управа","Зняць вылучэнне","Змясціць па шырыні","Накіроўвальнікі правіла трацін","Бяспечныя палі","Сетка трацін і бяспечныя палі","Схаваць накіроўвальнікі","Уключыць/выключыць прывязку","20 пераходаў","Ужыць паступовае з'яўленне ў пачатку","Ужыць паступовае знікненне ў канцы","Перакрыжаванае растварэнне з папярэднім кліпам","Шторка злева з папярэднім кліпам","Шторка справа з папярэднім кліпам","Выдаліць пераходы кліпа","Дыягностыка FFmpeg і ffprobe…","Падказкі ЎКЛ","Выключыць падказкі","Падказкі ВЫКЛ","Імпартаваць медыя","⇅ Упарадкаваць паводле нумара","Лікавы парадак: 1, 2, 3… або 001, 002, 003…","Навядзіце курсор на картку, каб убачыць анімацыю. Перацягніце яе на кліп: левы край задае эфект з'яўлення, правы — знікнення. Калі адпусціць паміж кліпамі, створыцца накладанне. Націск на картку дадае эфект з'яўлення да выбранага кліпа.","Паслядоўнасць 01","Перацягніце медыя з бібліятэкі на дарожку","Знаёмства з рэдактарам","Вітаем у «Монтажнай»!","Пакажу асноўныя дзеянні простымі крокамі. У праекце нічога не зменіцца, пакуль вы самі не выбераце дзеянне.","Працуйце ў сваім тэмпе і зачыняйце знаёмства ў любы момант.","Пазней","Назад","Пачаць знаёмства","Экспарт мантажнай паслядоўнасці","Мэтавы сярэдні бітрэйт","2 Мбіт/с (сярэдні)","5 Мбіт/с (сярэдні)","10 Мбіт/с (сярэдні)","20 Мбіт/с (сярэдні)","40 Мбіт/с (сярэдні)","Пачатак, с","Канец, с","Пачатак = курсор прайгравання","Канец = курсор прайгравання","Можна экспартаваць толькі выбраны фрагмент. Час вымяраецца ў секундах ад пачатку таймлайна, а межы фрагмента акругляюцца да выбранай частаты кадраў.","Ёсць незахаваныя змены","Кіраванне падказкамі","Уключыць падрабязныя падказкі","Выключыць падрабязныя падказкі","Захаваць праект (Ctrl+S)","Дадаць відэа, музыку або фота","Аўтаматычна раскласці фатаграфіі пад музыку","Экспарт відэа (Ctrl+E)","Упарадкаваць выявы і відэа паводле лічбаў у назвах файлаў","Знайсці пераход…","Пошук пераходаў","Бягучыя параметры праекта","Да пачатку (Home)","Папярэдні кадр (←)","Прайграванне / паўза (Space)","Наступны кадр (→)","Да канца (End)","Спыніць (вярнуцца ў пачатак)","Частата кадраў праекта","Суадносіны бакоў","Раздзяляльнасць праекта","Паменшыць","Маштаб","Павялічыць","Прывязка краёў кліпаў і курсора прайгравання","У месцы мантажнай склейкі","Да краю кліпа","накладанне","ўваход/выхад","Пераходы не знойдзены","З'яўленне з чорнага","З'яўленне з белага","Белая ўспышка","Шторка знізу","Шторка зверху","Дыяганальная шторка","Зрух уверх","Зрух уніз","Кругавая дыяфрагма","Ромб","Мяккі фокус","Паварот","Плаўнае з'яўленне / згасанне","Класічнае згасанне да чорнага","Мяккі светлы пераход","Кароткая кінематаграфічная ўспышка","Плаўнае змешванне двух планаў","Новы кадр адкрываецца злева направа","Новы кадр адкрываецца справа налева","Адкрыццё знізу ўверх","Адкрыццё зверху ўніз","Дыяганальнае адкрыццё","Новы план уязджае справа","Новы план уязджае злева","Новы план уязджае знізу","Новы план уязджае зверху","Плаўнае набліжэнне да кадра","Мяккае аддаленне ад буйнога плана","Круг пашыраецца да краёў кадра","Геаметрычнае адкрыццё з цэнтра","Размыты кадр становіцца выразным","Лёгкі вярчальны пераход","Мова інтэрфейсу…","Аўтаматычна (мова сістэмы)","Дадатковыя мовы будуць дадавацца асобнымі пакетамі.","Выбар мовы інтэрфейсу будзе захаваны на гэтым камп'ютары.","Ужыць","Даступна","Хутка","Моўны пакет не ўсталяваны","Montazhnaya","0,65 с","Кадр","кадр/с","раней","ПРАЕКТ","· ФАЙЛ АДСУТНІЧАЕ","Праект","Медыяэлементы","Кліпы","Працягласць","Адсутнічаюць файлы: {count}","Націсніце «Перападключыць файлы», каб аднавіць сувязі з медыя.","Выберыце кліп або медыяэлемент, каб убачыць яго ўласцівасці","Медыяэлемент","Назва","Тып","Стан","файл адсутнічае","Налады","па змаўчанні 5 с","Памер файла","Дзеянні","Перападключыць файл…","Дадаць на таймлайн","Выдаліць з медыябібліятэкі","Кліп","Дарожка"," (заблакавана)","файл выдалены","Час","Працягласць, с","Уваходная кропка крыніцы, с","Выхадная кропка крыніцы, с","Канец на таймлайне","Працягласць крыніцы","Фатаграфіі можна абрэзаць, перацягваючы левы або правы край кліпа. Іх працягласць не абмежаваная працягласцю зыходнага медыя. Для дакладнага значэння ўвядзіце секунды вышэй.","Непразрыстасць, %","Маштаб, %","Цэнтр X, %","Цэнтр Y, %","Рэжым упісвання","Умясціць цалкам","Запоўніць кадр (абрэзаць)","Рух камеры","Без руху","Плаўнае набліжэнне","Плаўнае аддаленне","Панарама ўлева","Панарама ўправа","Панарама ўверх","Панарама ўніз","Паварот, °","Адлюстраваць","Па гарызанталі","Па вертыкалі","Скінуць","Каляровая карэкцыя","Яркасць, %","Кантраст, %","Насычанасць, %","Каляровы стыль","Без стылю","Кінематаграфічны","Чорна-белы","Сепія","Вінтаж","Халодны","Цёплы","Начны","Скінуць каляровую карэкцыю","Тытры па-над кліпам","Тэкст","Увядзіце загаловак або подпіс…","Памер шрыфту","Колер тэксту","Размяшчэнне","Зверху па цэнтры","Па цэнтры","Знізу па цэнтры","Знізу злева","Знізу справа","Фон","Заўвага","Тэкст уключаецца ў відэа","Гучнасць, %","Паступовае павелічэнне гучнасці, с","Паступовае памяншэнне гучнасці, с","У пачатку, с","Рэжым уваходу","У канцы, с","Рэжым выхаду","Гук ужо аддзелены","Аддзяліць гук на аўдыядарожку","Тут ужо ёсць кліп","Кліп накладзецца на суседні кліп","Новая кропка ўваходу ў крыніцу створыць канфлікт з суседнім кліпам","Будуць дададзены толькі выявы і відэа, у назвах файлаў якіх ёсць лічбы. Сартаванне лікавае, таму 2 будзе перад 10. Кліпы размесцяцца паслядоўна без накладанняў.","Відэадарожка","Пачатак паслядоўнасці","У пазіцыі курсора прайгравання","У канцы выбранай дарожкі","Працягласць выявы, сек.","Медыяэлементы па парадку","Упарадкаваць","Няма даступных пранумараваных выяў або відэа.","Не знойдзены выявы або відэа з лічбамі ў назвах файлаў. Напрыклад: 001.jpg, 002.jpg, 003.jpg.","Выберыце бачную і разблакаваную відэадарожку.","Слайд-шоў з фатаграфій і музыкі","Адкуль узяць фатаграфіі","Музычная дарожка","Рэжым працягласці","Падагнаць пад працягласць музыкі","Аднолькавая працягласць для кожнай фатаграфіі","Запоўніць участак таймлайна","Відэадарожка для фатаграфій","Пачатак, сек.","Працягласць кожнай фатаграфіі, сек.","Даўжыня ўчастка, сек.","Пераходы паміж фатаграфіямі","Без пераходаў","Працягласць пераходу, сек.","Чаргаваць плаўнае набліжэнне і панараму","Павольнае набліжэнне","Павольнае аддаленне","Парадак фатаграфій","Як размешчаны на дарожцы","Па назве: А → Я","Па назве: Я → А","Аўдыядарожка для музыкі","Плаўнае з'яўленне першай фатаграфіі і згасанне апошняй","Стварыць слайд-шоў","Праверце налады.","Захаваць бягучы кадр","Будзе захавана ўся кампазіцыя ў бягучай пазіцыі таймлайна: бачныя відэаслаі, пераходы, каляровая карэкцыя, трансфармацыі і тытры. Мантажныя накіроўвальнікі не трапяць у выяву.","Фармат выявы","PNG — без страт якасці","JPEG — меншы файл","Full HD па доўгім баку","4K UHD па доўгім баку","Якасць JPEG","Пазіцыя","Захаваць кадр…","Дыягностыка FFmpeg і ffprobe","Шляхі да праграм бяруцца з PATH або зменных FFMPEG_PATH / FFPROBE_PATH.","Праверыць зноў","Праверка яшчэ не запускалася.","Выконваецца праверка…","Не ўдалося выканаць дыягностыку","Перазапусціце рэдактар і паўтарыце праверку. Калі памылка захоўваецца, праверце цэласнасць усталявання.","Імпартавана файлаў: {count}","Упарадкавана паводле нумара: {count} файлаў · {duration}.","Экспарт {format} завершаны: {file}","На таймлайне · {track} · {name} ({duration})","У медыябібліятэцы · {name} ({duration})","Фатаграфіі ({count})","Знойдзены незахаваны праект ({savedAt}): кліпы — {clips}, медыя — {media}. Аднавіць?","Паказаць даведку","Звязаць кліпы","Адлучыць відэа ад аўдыя","Адлучыць","Уключыць","Выключыць","Схаваць","Паказаць","1280 × 720 · 30 FPS","Alt+←","Alt+→","Ctrl+Alt+←","Ctrl+Alt+→","Shift+Alt+←","Shift+Alt+→","КБ","МБ","ГБ","Закрыць знаёмства","Няма файлаў","Імпартаваць файлы","Адмяніць (Ctrl+Z)","Паўтарыць (Ctrl+Y)","Аддзяліць гук","Звязаць відэа і аўдыя","Відэа і аўдыя звязаны","У гэтай пазіцыі ўжо ёсць маркер","Маркер дададзены","Маркер перайменаваны","Маркер выдалены","Выберыце маркер або перамясціце курсор прайгравання да яго","У праекце пакуль няма маркераў","Няма наступнага маркера","Няма папярэдняга маркера","Спачатку выберыце відэа або яго аўдыякліп","Гэтыя відэа і аўдыя ўжо звязаны","Не ўдалося адназначна знайсці пару. Праверце, што выбраны зыходнае відэа і аддзелены ад яго гук.","Можна звязаць толькі відэакліп і гук, аддзелены ад гэтага відэа","Сувязь адноўлена. Бягучае зрушэнне аўдыя захавана; далей кліпы будуць рухацца разам.","Сувязь відэа і аўдыя адноўлена. Цяпер яны будуць рухацца разам.","Выберыце звязаны відэа- або аўдыякліп","Дарожка заблакаваная","Не ўдалося размясціць медыя на дарожцы","Спачатку выберыце відэакліп","Каб аддзяліць гук, выберыце відэа на відэадарожцы","Спачатку разблакуйце відэадарожку","Гук гэтага кліпа ўжо знаходзіцца на асобнай аўдыядарожцы","У гэтым відэа не знойдзены аўдыяпаток","Не ўдалося стварыць аўдыякліп. Праверце даступнасць аўдыядарожак.","Немагчыма перамясціць звязаную пару: на новай пазіцыі адна з дарожак занятая","Кліп выдалены","Выдаленне Ripple завершана","Кліп перамешчаны","Месца разрэзу занадта блізка да краю.","Пераходы прымяняюцца да відэакліпаў","Выберыце відэакліп або перацягніце пераход на таймлайн","Перацягніце файлы сюды","або націсніце «Імпартаваць медыя»","Відэа · Аўдыя · Выявы","Файлы не перападключаны","Некаторыя медыяфайлы адсутнічаюць. Перападключыце іх — мантаж будзе адноўлены аўтаматычна.","Тэставае кадаванне і праверка ffprobe","Магчымасці ўсталяванай версіі","Крытычных праблем не выяўлена. Для паўторнай праверкі націсніце «Праверыць зноў».","Вызначаюцца шляхі і версіі праграм, правяраюцца кодэкі і ствараецца кароткі тэставы MP4.","Правяраюцца FFmpeg і ffprobe, кодэкі H.264/AAC і VP8/VP9/Opus, дэкадаванне PNG і кантэйнеры MP4/WebM. Рэдактар стварае кароткія тэставыя файлы для даступных варыянтаў і правярае патокі ды часавыя пазнакі праз ffprobe. Часовыя файлы выдаляюцца пасля праверкі.","Запіс у браўзеры ў рэальным часе","MediaRecorder залежыць ад нагрузкі сістэмы і цыкла адлюстравання.","Для MP4 правераны гук AAC.","Для WebM правераны відэа VP8/VP9 і гук Opus.","Патокі","Пазіцыя: ","кадр № ","Будзе экспартаваны бягучы прыпынены кадр.","Кадраў","сек.","мін."]};
  for (const code of ["hy", "tk", "ky", "tg", "be"]) {
    const current = packs[code];
    const values = regionalCompletionData[code];
    const currentMissing = Object.keys(english).filter(source =>
      !Object.prototype.hasOwnProperty.call(current.messages, source)
    );
    if (!current || currentMissing.length !== regionalCompletionKeys.length ||
        currentMissing.some((source, index) => source !== regionalCompletionKeys[index]) ||
        !Array.isArray(values) || values.length !== regionalCompletionKeys.length) {
      throw new Error("Invalid regional localization wave 4 data for " + code);
    }
    const messages = Object.assign(Object.create(null), current.messages);
    regionalCompletionKeys.forEach((source, index) => { messages[source] = values[index]; });
    const englishFallbackKeys = Object.keys(english).filter(source =>
      !Object.prototype.hasOwnProperty.call(messages, source)
    );
    if (englishFallbackKeys.length !== 0 || Object.keys(messages).length !== Object.keys(english).length) {
      throw new Error("Regional localization wave 4 did not reach full source-key coverage for " + code);
    }
    packs[code] = Object.freeze({
      ...current,
      appTitle: current.appTitle.replace(/3\.6\.43/g, "3.6.44"),
      coverage: "regional-workflows-436",
      fontFamily: current.fontFamily || (code === "hy" ? "Armenian" : code === "tk" ? "TurkmenLatin" : "Cyrillic"),
      localeMappedCount: Object.keys(messages).length,
      englishFallbackCount: 0,
      englishFallbackKeys: Object.freeze([]),
      translationStatus: "preview",
      translationStage: "regional-translation-draft-complete-review-pending",
      translationQuality: "draft-needs-native-review",
      completedTranslationWave: "beta-3.6.44-cis-wave-4",
      messages: Object.freeze(messages)
    });
  }

})(window);


// beta 3.6.45 — harmonize repeated editing terminology across regional packs.
(function (root) {
  "use strict";
  const packs = root.MontazhnayaLocalePacks || Object.create(null);
  const corrections = {
    ky: { "Положение": "Жайгашуу", "Позиция": "Жайгашуу" },
    be: { "Положение": "Пазіцыя", "Позиция": "Пазіцыя" }
  };
  const codes = ["kk","uz","uz-Cyrl","ka","hy","tk","az","ky","tg","be"];
  for (const code of codes) {
    const current = packs[code];
    if (!current) continue;
    const messages = Object.assign(Object.create(null), current.messages || {});
    const aboutSource = "Монтажная beta 3.6.44 — монтаж фото, аудио и видео";
    const appTitle = String(current.appTitle || "").replace(/3\.6\.\d+/g, "3.6.45");
    if (Object.prototype.hasOwnProperty.call(messages, aboutSource)) messages[aboutSource] = appTitle;
    for (const [source, value] of Object.entries(corrections[code] || {})) {
      if (Object.prototype.hasOwnProperty.call(messages, source)) messages[source] = value;
    }
    packs[code] = Object.freeze({
      ...current,
      appTitle,
      messages: Object.freeze(messages),
      linguisticReviewStatus: "automated-terminology-consistency-checked-native-speaker-review-pending",
      visualReviewStatus: "script-aware-layout-hardening-added-windows-render-check-pending",
      terminologyRevision: "3.6.45"
    });
  }
})(window);
