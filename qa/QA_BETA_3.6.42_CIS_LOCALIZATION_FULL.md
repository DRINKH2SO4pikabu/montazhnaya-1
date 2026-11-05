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

## Detailed notes

The runtime packs are loaded from `src/renderer/locales/cis.js` via the locale manifest. The second wave maps English reference phrases back to all matching Russian source keys. The English reference contains duplicate English labels (for example, Audio); mapping counts therefore count Russian source keys, not unique phrase strings. The app retains the selected-locale → English reference → original source fallback chain.

The four expanded regional packs remain marked `translationStatus: preview` and `translationStage: cis-central-asia-wave-2`. The new strings preserve file extensions, units, FPS and dynamic `{count}` placeholders. Technical controls and long-form copy were translated as draft UI strings, but terminology may need adjustment by native editors.

Uzbek Cyrillic (`uz-Cyrl`) is intentionally not enabled in this wave; a dedicated Cyrillic pack should be reviewed separately rather than produced through blind transliteration.

Visual verification remains outstanding for all scripts and UI sizes. Windows package build, shortcut/installer branding checks and manual language-switch persistence checks were not run here.
