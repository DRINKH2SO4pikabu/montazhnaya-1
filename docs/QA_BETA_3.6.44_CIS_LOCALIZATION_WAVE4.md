# QA — Montazhnaya Beta 3.6.44, CIS localization wave 4

## Scope

Completed the regional draft dictionaries for Armenian (`hy`), Turkmen (`tk`), Kyrgyz (`ky`), Tajik (`tg`) and Belarusian (`be`). Each pack now maps all 436 keys from the English reference dictionary and declares zero English fallback entries.

The wave preserves the prior complete regional packs: Kazakh (`kk`), Uzbek Latin (`uz`), Azerbaijani (`az`) and Georgian (`ka`). The separate Uzbek Cyrillic variant (`uz-Cyrl`) remains a deterministic transliteration draft from Uzbek Latin, not an independently translated pack.

## Validation

- Full automated test suite: **276/276 passed, 0 failed**.
- Focused localization tests: **18/18 passed, 0 failed**.
- Runtime load: all 34 preview locales registered; 436/436 source keys mapped and zero English fallbacks in each preview locale.
- Regional runtime audit: `kk`, `uz`, `uz-Cyrl`, `az`, `ka`, `hy`, `tk`, `ky`, `tg`, `be` each have 436 mappings and zero fallback entries.
- Empty-value check: zero empty regional messages.
- Placeholder check: zero mismatches across all regional pack messages.
- Syntax checks: Electron main/preload and all locale source files passed `node --check`.
- BCP-47 resolution: regional tags including `hy-AM`, `tk-TM`, `ky-KG`, `tg-TJ`, `be-BY`, `uz-UZ` and `uz-Cyrl-UZ` are covered by the locale resolver tests.

## Translation quality and limitations

The new regional strings are AI-assisted draft translations, not professionally reviewed text. Native-speaker review is required, especially for editing terminology, diagnostics and long instructions. Uzbek Cyrillic is a transliteration draft and must not be represented as an independent translation.

This is source-code and automated-test validation. The Electron application was not visually exercised on Windows during this pass. Font availability, shaping, long-label layout, DPI scaling, live language switching in the packaged app, RTL behavior, NSIS Setup and Portable builds remain unverified.
