# Montazhnaya Beta 3.6.45 — Localization Quality Audit

- Selectable variants: **36** (Russian + English + 34 preview locales)
- English reference keys: **436**
- Repeated English glossary groups checked: **2**
- Missing keys: **0**
- Empty translations: **0**
- English fallback entries: **0**
- Placeholder mismatches: **0**
- Repeated-terminology mismatches: **0**
- About-title mismatches: **0**
- Semantic catalog issues: **0**
- Semantic keys per locale: **40**

## Per-locale length and script audit

| Code | Language | Keys | >46 chars | >72 chars | Direction | Font/script fallback profile |
|---|---|---:|---:|---:|---|---|
| de | Deutsch | 436/436 | 48 | 25 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| fr | Français | 436/436 | 49 | 27 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| es | Español | 436/436 | 49 | 25 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| pt-BR | Português (Brasil) | 436/436 | 46 | 23 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| it | Italiano | 436/436 | 48 | 24 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| pl | Polski | 436/436 | 43 | 19 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| uk | Українська | 436/436 | 38 | 20 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| tr | Türkçe | 436/436 | 38 | 20 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| zh-CN | 简体中文 | 436/436 | 7 | 2 | LTR | Microsoft YaHei UI → Noto Sans CJK SC → system-ui |
| zh-TW | 繁體中文 | 436/436 | 7 | 2 | LTR | Microsoft JhengHei UI → Noto Sans CJK TC → system-ui |
| ja | 日本語 | 436/436 | 16 | 5 | LTR | Yu Gothic UI → Meiryo UI → Noto Sans CJK JP |
| ko | 한국어 | 436/436 | 17 | 6 | LTR | Malgun Gothic → Noto Sans CJK KR → system-ui |
| ar | العربية | 436/436 | 30 | 14 | RTL | Noto Sans Arabic → Segoe UI → Tahoma |
| he | עברית | 436/436 | 25 | 11 | RTL | Noto Sans Hebrew → Segoe UI → Arial |
| hi | हिन्दी | 436/436 | 36 | 19 | LTR | Noto Sans Devanagari → Mangal → Nirmala UI |
| nl | Nederlands | 436/436 | 42 | 20 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| sv | Svenska | 436/436 | 40 | 21 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| fi | Suomi | 436/436 | 41 | 19 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| cs | Čeština | 436/436 | 37 | 19 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| ro | Română | 436/436 | 44 | 22 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| el | Ελληνικά | 436/436 | 50 | 24 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| vi | Tiếng Việt | 436/436 | 39 | 22 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| id | Bahasa Indonesia | 436/436 | 39 | 19 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| th | ไทย | 436/436 | 27 | 17 | LTR | Leelawadee UI → Noto Sans Thai → Tahoma |
| kk | Қазақша | 436/436 | 37 | 20 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| uz | Oʻzbekcha | 436/436 | 41 | 20 | LTR | UzbekLatin |
| uz-Cyrl | Ўзбекча (кирилл) | 436/436 | 38 | 19 | LTR | Cyrillic |
| ka | ქართული | 436/436 | 35 | 22 | LTR | Georgian |
| hy | Հայերեն | 436/436 | 45 | 21 | LTR | Armenian |
| tk | Türkmençe | 436/436 | 38 | 19 | LTR | TurkmenLatin |
| az | Azərbaycanca | 436/436 | 36 | 20 | LTR | Segoe UI Variable Text → Segoe UI → Arial |
| ky | Кыргызча | 436/436 | 39 | 21 | LTR | Cyrillic |
| tg | Тоҷикӣ | 436/436 | 39 | 20 | LTR | Cyrillic |
| be | Беларуская | 436/436 | 36 | 17 | LTR | Cyrillic |

## Notes and limitations

- This audit validates structure, placeholders and repeated terminology; it does not certify idiomatic quality or professional translation.
- All preview translations still require native-speaker review, especially Uzbek Cyrillic, regional terminology and technical editing vocabulary.
- Font stacks list preferred system fonts and fallbacks; actual font availability and glyph rendering depend on Windows installations and are not certified here.
- Typography and wrapping rules are statically audited; no Windows screenshots or on-device visual verification were produced in this environment.
- Windows Setup and Portable packages are not built by this localization source-only pass.
