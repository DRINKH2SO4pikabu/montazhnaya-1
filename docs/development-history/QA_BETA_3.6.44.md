# Montazhnaya Beta 3.6.44 — QA summary

**Result:** 276/276 automated tests passed; 0 failures.

- Focused localization suite: 18/18 passed.
- English reference dictionary: 436 keys.
- Preview locales: 34, in addition to Russian and English (36 selectable options overall).
- All preview locale packs map 436/436 keys and declare zero English fallback entries.
- Nine regional base-language packs are complete draft maps: Kazakh, Uzbek Latin, Azerbaijani, Georgian, Armenian, Turkmen, Kyrgyz, Tajik and Belarusian.
- Uzbek Cyrillic is separately selectable and fully mapped, but is a deterministic transliteration draft from Uzbek Latin, not an independent translation.
- Placeholder, empty-value and locale-source syntax checks passed.

**Not verified:** native-speaker review, Windows GUI visual QA, system font availability on target PCs, DPI/long-string behavior in the packaged app, and Windows Setup/Portable packaging.

See `Montazhnaya_Beta_3.6.44_QA_Full.md` for the detailed scope and limitations.
