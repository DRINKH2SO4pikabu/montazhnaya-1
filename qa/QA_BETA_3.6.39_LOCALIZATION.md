# Montazhnaya Beta 3.6.39 — Localization Phase 6 QA

## Scope

Completed draft translations for the final six languages in this wave: Arabic (`ar`), Hebrew (`he`), Hindi (`hi`), Dutch (`nl`), Swedish (`sv`) and Finnish (`fi`). This closes the remaining 135 source-string mappings for each of these languages.

## Localization coverage

- English source dictionary: 436 keys.
- Draft-complete locales: 18 of 24, with zero English fallback keys.
- Partial locales: Czech (`cs`), Romanian (`ro`), Greek (`el`), Vietnamese (`vi`), Indonesian (`id`) and Thai (`th`), each with 135 English fallback keys remaining.
- All 24 locale packs remain marked as translation previews.

## Technical checks

- Arabic and Hebrew retain RTL direction metadata.
- Arabic, Hebrew and Devanagari font fallback stacks have been added.
- Long labels and help paragraphs are allowed to wrap in the relevant script contexts.
- All 135 new translations in each of the six packs were checked for non-empty values.
- Dynamic placeholders such as `{count}`, `{duration}`, `{track}`, `{name}` were preserved exactly.
- The locale runtime was executed in a VM and verified to register 24 packs with 436 message keys each.
- Package and user-facing build version updated to 3.6.39.

## Automated tests

`npm test`: 274 passed, 0 failed.

`node --check src/renderer/locales/international.js`: passed.

`node --check src/renderer/i18n.js`: passed.

## Not yet verified

- Visual inspection of RTL mirroring and alignment on Windows has not been performed.
- Text clipping and line breaks have not been visually checked on multiple Windows DPI settings.
- Arabic, Hebrew and Hindi translations have not been reviewed by native speakers.
- Windows NSIS Setup and Portable installers have not been rebuilt in this phase.

The language packs are draft-complete by key coverage, not approved for a final public international release.
