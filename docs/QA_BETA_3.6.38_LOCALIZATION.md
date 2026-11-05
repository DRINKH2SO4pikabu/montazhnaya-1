# QA — Montazhnaya beta 3.6.38 localization wave 5

## Delivered

Draft localization wave 5 adds full source-dictionary translations for Ukrainian (`uk`), Turkish (`tr`), Simplified Chinese (`zh-CN`), Traditional Chinese (`zh-TW`), Japanese (`ja`) and Korean (`ko`). Each pack now maps 436 of 436 source keys with zero English fallback entries.

## Existing completed locales

Wave 4 retains full draft mappings for German, French, Spanish, Brazilian Portuguese, Italian and Polish. The other 12 locale previews (Arabic, Hebrew, Hindi, Dutch, Swedish, Finnish, Czech, Romanian, Greek, Vietnamese, Indonesian and Thai) currently have 301 local mappings and 135 English fallback entries each.

## Technical safeguards

- Dynamic placeholders are preserved and tested against their source strings.
- Keyboard shortcuts, codec identifiers, environment variable names, file extensions, frame dimensions and standard units are retained where they are conventions rather than prose.
- CJK font fallbacks are specified for Microsoft YaHei/JhengHei, Yu Gothic/Meiryo and Malgun Gothic, with Noto CJK/system fallbacks.
- Longer modal and help text uses robust wrapping and CJK-sensitive line breaking.
- Translation status remains `preview`; draft-complete means dictionary coverage, not professional linguistic approval.

## Automated verification

`npm test`: 274 passed, 0 failed. Tests cover localization wiring, per-locale fallback counts, placeholder parity, CJK font declarations, release version synchronization, branding, export, audio and timeline behavior.

## Not performed

No Windows NSIS/Portable build was produced. No actual Windows GUI visual review or native-speaker proofreading was performed. Dynamic strings outside the 436-key dictionary still require a separate inventory and localization pass.
