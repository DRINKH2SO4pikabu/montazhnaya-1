# Detailed QA — Montazhnaya Beta 3.6.43

## Scope

This phase continues the regional localization work from beta 3.6.42. The English reference dictionary is unchanged at 436 source strings. The application exposes 36 selectable choices: Russian, English and 34 preview locale variants.

## Regional translation work

### Completed dictionaries

| Locale | Language | Mapped source keys | English fallback | Status |
|---|---|---:|---:|---|
| `kk` | Kazakh | 436/436 | 0 | Draft; native review pending |
| `uz` | Uzbek (Latin) | 436/436 | 0 | Draft; native review pending |
| `az` | Azerbaijani | 436/436 | 0 | Draft; native review pending |
| `ka` | Georgian | 436/436 | 0 | Draft; native review pending |
| `uz-Cyrl` | Uzbek (Cyrillic) | 436/436 | 0 | Transliteration draft; native review pending |
| `hy` | Armenian | 83/436 | 353 | Core commands only |
| `tk` | Turkmen | 83/436 | 353 | Core commands only |
| `ky` | Kyrgyz | 83/436 | 353 | Core commands only |
| `tg` | Tajik | 83/436 | 353 | Core commands only |
| `be` | Belarusian | 83/436 | 353 | Core commands only |

The four priority language dictionaries received the remaining 232 source-key translations, including advanced editing operations, export and codec diagnostics, errors and warnings, recovery prompts, long-form help text, and project/media workflows. Placeholder fields such as `{count}`, `{duration}`, `{format}`, `{file}`, `{savedAt}`, `{clips}` and `{media}` were preserved.

Uzbek Cyrillic was added as a separate `uz-Cyrl` BCP-47 option. The Latin draft is transliterated with protected technical identifiers, file formats, keyboard shortcuts and dynamic placeholders. This provides script coverage, but it must not be described as an independently translated Uzbek Cyrillic dictionary. The pack metadata explicitly records `translationQuality: "transliteration-draft"` and `translationStage: "uzbek-cyrillic-transliteration-review-pending"`.

## Locale resolution

Both the Electron locale resolver and the renderer locale resolver now examine script subtags before falling back to the primary language. Verification cases:

- `uz-Cyrl-UZ` → `uz-Cyrl`
- `uz-Cyrl` → `uz-Cyrl`
- `uz-UZ` → `uz`

The new test exercises the renderer-side resolver with a simulated system locale, rather than only inspecting the language manifest.

## Automated validation

- `node --test tests/localization-core.test.cjs tests/localization-wiring.test.cjs`: 18/18 passed.
- `node --test tests/*.test.cjs`: 276/276 passed.
- All translation values are non-empty strings.
- Dynamic placeholders in each mapped source/value pair match exactly.
- Runtime loading validates regional pack registration, mapping totals and explicit English fallback keys.
- Package, lockfile, renderer title, About/version label and Windows launcher version references were checked.
- Localization coverage and English fallback manifests were regenerated from the runtime-loaded packs.

## Limitations and next work

1. Five regional packs (`hy`, `tk`, `ky`, `tg`, `be`) still have 353 English fallback strings each.
2. Uzbek Cyrillic needs review by a native Uzbek speaker and may need lexical rewrites rather than transliteration for natural phrasing.
3. All new regional translations are drafts. No native-speaker or professional terminology review is claimed.
4. Strings composed dynamically outside the 436-key dictionary may still bypass localization.
5. GUI appearance, truncation, font fallback and scaling must be checked in the actual Windows Electron application.
6. Arabic/Hebrew RTL interaction, timeline direction preservation and mixed-script text need continued visual QA.
7. NSIS Setup and Portable output were not built for this source-only phase. FFmpeg/FFprobe are external dependencies. Project licensing and code signing remain separate release tasks.
