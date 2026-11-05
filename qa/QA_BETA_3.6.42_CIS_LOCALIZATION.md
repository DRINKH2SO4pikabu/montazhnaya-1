# QA — Montazhnaya Beta 3.6.42

## Localization wave 2

- Expanded Kazakh (`kk`), Uzbek Latin (`uz`), Azerbaijani (`az`) and Georgian (`ka`) with 122 additional workflow phrase translations per locale.
- Each priority locale now maps 204 Russian source strings out of 436; 232 untranslated source strings remain explicitly marked as English fallback.
- Armenian (`hy`), Turkmen (`tk`), Kyrgyz (`ky`), Tajik (`tg`) and Belarusian (`be`) remain at 83 mapped strings and 353 English fallback strings each.
- Added vocabulary for media properties, clip timing, transform/fit modes, camera motion, color correction, titles, audio fade settings, clip overlap validation, numeric media placement and slideshow setup.
- Preserved dynamic placeholders in all mapped strings. Independent audit: zero placeholder mismatches across the four expanded packs.
- Updated app version and About labels to 3.6.42.

## Automated verification

- `npm test`: **275 passed, 0 failed**.
- All 33 international preview locales register.
- Four expanded regional packs: 204 mapped / 232 explicit English fallback keys each.
- Five other regional packs: 83 mapped / 353 fallback keys each.
- Existing 24 international packs: 436 mapped / 0 fallback keys each.

## Limitations

Translations are AI-assisted drafts and have not been reviewed by fluent native speakers. Uzbek Cyrillic is not yet a separate locale; Uzbek is currently Latin-script only. Dynamic UI strings outside the 436-entry source dictionary may still appear untranslated. No real Windows Electron GUI visual inspection, NSIS Setup build or Portable build was performed in this phase.
