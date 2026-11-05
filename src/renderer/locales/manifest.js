(function (root) {
  const internationalLocales = [
    { code: "de", nativeName: "Deutsch", englishName: "German" },
    { code: "fr", nativeName: "Français", englishName: "French" },
    { code: "es", nativeName: "Español", englishName: "Spanish" },
    { code: "pt-BR", nativeName: "Português (Brasil)", englishName: "Portuguese (Brazil)" },
    { code: "it", nativeName: "Italiano", englishName: "Italian" },
    { code: "pl", nativeName: "Polski", englishName: "Polish" },
    { code: "uk", nativeName: "Українська", englishName: "Ukrainian" },
    { code: "tr", nativeName: "Türkçe", englishName: "Turkish" },
    { code: "zh-CN", nativeName: "简体中文", englishName: "Chinese (Simplified)" },
    { code: "zh-TW", nativeName: "繁體中文", englishName: "Chinese (Traditional)" },
    { code: "ja", nativeName: "日本語", englishName: "Japanese" },
    { code: "ko", nativeName: "한국어", englishName: "Korean" },
    { code: "ar", nativeName: "العربية", englishName: "Arabic", direction: "rtl" },
    { code: "he", nativeName: "עברית", englishName: "Hebrew", direction: "rtl" },
    { code: "hi", nativeName: "हिन्दी", englishName: "Hindi" },
    { code: "nl", nativeName: "Nederlands", englishName: "Dutch" },
    { code: "sv", nativeName: "Svenska", englishName: "Swedish" },
    { code: "fi", nativeName: "Suomi", englishName: "Finnish" },
    { code: "cs", nativeName: "Čeština", englishName: "Czech" },
    { code: "ro", nativeName: "Română", englishName: "Romanian" },
    { code: "el", nativeName: "Ελληνικά", englishName: "Greek" },
    { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese" },
    { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian" },
    { code: "th", nativeName: "ไทย", englishName: "Thai" }
  ].map(locale => Object.freeze({
    ...locale,
    direction: locale.direction || "ltr",
    file: "./locales/international.js",
    coverage: "complete-source-map",
    translationStatus: "preview"
  }));

  const cisLocales = [
    { code: "kk", nativeName: "Қазақша", englishName: "Kazakh", coverage: "regional-workflows-436" },
    { code: "uz", nativeName: "Oʻzbekcha", englishName: "Uzbek (Latin)", fontFamily: "UzbekLatin", coverage: "regional-workflows-436" },
    { code: "uz-Cyrl", nativeName: "Ўзбекча (кирилл)", englishName: "Uzbek (Cyrillic)", fontFamily: "Cyrillic", scriptVariant: "Cyrl", coverage: "script-variant-436" },
    { code: "ka", nativeName: "ქართული", englishName: "Georgian", fontFamily: "Georgian", coverage: "regional-workflows-436" },
    { code: "hy", nativeName: "Հայերեն", englishName: "Armenian", fontFamily: "Armenian", coverage: "regional-workflows-436" },
    { code: "tk", nativeName: "Türkmençe", englishName: "Turkmen", fontFamily: "TurkmenLatin", coverage: "regional-workflows-436" },
    { code: "az", nativeName: "Azərbaycanca", englishName: "Azerbaijani", coverage: "regional-workflows-436" },
    { code: "ky", nativeName: "Кыргызча", englishName: "Kyrgyz", fontFamily: "Cyrillic", coverage: "regional-workflows-436" },
    { code: "tg", nativeName: "Тоҷикӣ", englishName: "Tajik", fontFamily: "Cyrillic", coverage: "regional-workflows-436" },
    { code: "be", nativeName: "Беларуская", englishName: "Belarusian", fontFamily: "Cyrillic", coverage: "regional-workflows-436" }
  ].map(locale => Object.freeze({
    ...locale,
    direction: "ltr",
    file: "./locales/cis.js",
    coverage: locale.coverage || "core-commands-81",
    translationStatus: "preview"
  }));

  root.MontazhnayaLocaleManifest = Object.freeze({
    available: Object.freeze([
      Object.freeze({ code: "ru", nativeName: "Русский", englishName: "Russian", direction: "ltr", file: "./locales/ru.js", coverage: "full-source" }),
      Object.freeze({ code: "en", nativeName: "English", englishName: "English", direction: "ltr", file: "./locales/en.js", coverage: "extended" }),
      ...internationalLocales,
      ...cisLocales
    ]),
    planned: Object.freeze([])
  });
})(window);
