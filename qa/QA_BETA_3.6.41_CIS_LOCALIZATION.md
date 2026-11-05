# QA — Montazhnaya Beta 3.6.41

## Summary

Added nine regional language previews: Kazakh (`kk`), Uzbek Latin (`uz`), Georgian (`ka`), Armenian (`hy`), Turkmen (`tk`), Azerbaijani (`az`), Kyrgyz (`ky`), Tajik (`tg`) and Belarusian (`be`).

Each new pack translates the 81 core phrase set. Because the English key map maps `Audio` to two Russian source labels and the About title is also localized, each pack contains 83 source-key mappings. The reference dictionary contains 436 source keys; the remaining 353 per locale are explicitly tracked as English fallbacks. No pack is marked fully translated.

## Technical changes

- Added `src/renderer/locales/cis.js` as a separate on-demand locale file.
- Registered nine locale tags in the renderer manifest and Electron locale registry.
- Added BCP-47 language fallback checks for country-specific system locales.
- Added Georgian and Armenian Windows font fallback stacks; added script-specific selectors for Cyrillic and Latin regional scripts.
- Updated package/version labels to beta 3.6.41.
- Added QA coverage and explicit fallback-key inventory.

## Automated validation

- Full test suite: **275 passed, 0 failed**.
- Source English key count: 436.
- Existing international packs: 24 complete draft maps, 436/436 keys, zero English fallbacks.
- New regional packs: 9, each 83 translated source-key mappings and 353 English fallbacks.
- Locale registry: 35 total choices (Russian, English, 24 previous international previews, 9 new regional previews).
- Regional tag resolution verified for `kk-KZ`, `uz-UZ`, `ka-GE`, `hy-AM`, `tk-TM`, `az-AZ`, `ky-KG`, `tg-TJ` and `be-BY`.
- Translation strings are non-empty; remaining fallback keys are explicit and reference known English source keys.

## Limitations / outstanding checks

Translations are AI-assisted drafts and have not been reviewed by native speakers. The first wave covers main menus, core editing actions, basic export commands and transition categories; most advanced dialogs and long help/error messages still fall back to English. Visual checks in Windows Electron were not performed. NSIS Setup and Portable packages were not built in this environment.
