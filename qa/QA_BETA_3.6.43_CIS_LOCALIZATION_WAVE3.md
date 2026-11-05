# QA — Montazhnaya Beta 3.6.43

## Localization wave 3 — CIS / Caucasus / Central Asia

### Changes

- Completed Kazakh (`kk`), Uzbek Latin (`uz`), Azerbaijani (`az`) and Georgian (`ka`) dictionaries to 436/436 source-key mappings each, with zero English fallback entries.
- Added Uzbek Cyrillic (`uz-Cyrl`) as a distinct BCP-47 script variant. Its 436 strings are produced by deterministic transliteration of the Uzbek Latin draft, not by an independent translation pass; the pack is marked `transliteration-draft` and requires native-speaker review.
- Updated both Electron-side and renderer-side locale resolution to prefer script-specific matches before falling back to the primary language. `uz-Cyrl-UZ` resolves to `uz-Cyrl`; `uz-UZ` resolves to `uz`.
- Updated the renderer title, About/version text, launchers, package metadata and release documentation to beta 3.6.43.
- Added runtime and test coverage for source keys, dynamic placeholders, fallback accounting, Uzbek Cyrillic metadata and script-aware language selection.

### Coverage summary

- English reference dictionary: 436 source keys.
- Available preview locale variants: 34, plus Russian and English (36 selectable language choices overall).
- 24 established international preview packs: 436 mapped keys each, zero English fallback.
- Kazakh, Uzbek Latin, Azerbaijani and Georgian: 436 mapped keys each, zero English fallback.
- Uzbek Cyrillic: 436 mapped keys, zero English fallback; transliteration draft, native-speaker review pending.
- Armenian, Turkmen, Kyrgyz, Tajik and Belarusian: 83 mapped keys each, 353 English fallback keys each.

### Tests

- Focused localization tests: 18 passed, 0 failed.
- Full automated Node test suite: 276 passed, 0 failed.
- Runtime audit loaded manifest, English, international and CIS packs and confirmed all regional source-key/fallback totals.
- Placeholder integrity audit: no mismatches found in loaded language packs.
- Version and package metadata checks passed.

### Not covered by this source-only phase

- No human/native-speaker proofreading was performed.
- Uzbek Cyrillic is transliteration of Uzbek Latin draft text and may require lexical and orthographic corrections.
- Windows Electron GUI visual review was not performed in this environment.
- NSIS Setup and Portable packages were not built.
- FFmpeg/FFprobe remain external dependencies; license selection and signing remain separate release tasks.
