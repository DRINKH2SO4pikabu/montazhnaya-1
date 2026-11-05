# QA — Montazhnaya beta 3.6.36 localization coverage

## Scope

The third localization wave adds locale-specific transition names/descriptions, numeric media ordering labels, sequence naming and tips states to all 24 international language packs. The implementation also fills each pack with any missing source key from the English reference dictionary as an explicit English fallback.

## Coverage

- English reference dictionary: 436 source keys.
- International locales: 24.
- Per locale: 436 / 436 source keys present.
- Per locale: 301 locale-specific dictionary mappings (includes source aliases; some standard technical terms remain unchanged).
- Per locale: 135 English fallback entries.
- Key coverage: 100% of the current English reference dictionary.
- Locale-specific mapping coverage: approximately 69%.
- Arabic and Hebrew retain RTL metadata.

The packs remain translation previews. This release does not claim full translation, fluent/native-speaker review, complete inventory of dynamically composed text, or visual RTL certification.

## Automated validation

The test suite checks:

- All 24 language packs register and expose all 436 source keys.
- Locale-mapping/fallback counts remain explicit and consistent.
- Missing translated entries are filled with the exact English reference value.
- Third-wave transition entries are locale-specific and nonempty.
- Dynamic placeholders are preserved across every mapped key.
- Locale metadata, BCP-47 resolution, persisted preference, DOM mutation translation and RTL metadata continue to work.

The complete list of 135 remaining English fallback source strings is stored in `qa/english-fallback-keys.json` for the next translation pass.

## Manual checks not performed

- No live Windows GUI screenshot pass at 1024×700 or 1600×1000.
- No native-speaker review of all 24 languages.
- No visual RTL certification for Arabic/Hebrew; timeline coordinate direction must remain unchanged.
- No Windows Setup/Portable build in this Linux runtime.
- No verification of installer, shortcut, taskbar and installed-folder icon appearance on a real Windows machine.

## Reproduction

Run `npm test` from the project root. The captured output is stored in `qa/npm-test-beta-3.6.36.log`.
