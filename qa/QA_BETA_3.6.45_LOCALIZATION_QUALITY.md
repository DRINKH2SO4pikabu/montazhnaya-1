# Montazhnaya Beta 3.6.45 — linguistic and visual localization refinement

## Scope

This source-only pass refines the 36 selectable interface variants: Russian and English plus 34 preview locales (24 international and 10 regional/script variants). The work targets consistency of editing terminology, translated dialog behavior, script-aware typography, long-label wrapping and RTL isolation.

## Changes

### Linguistic consistency

- Added a runtime audit of all 34 preview locale dictionaries against the 436-key English reference map.
- Verified all 436 keys are present in every preview pack, with zero empty values and zero English fallback entries.
- Compared placeholder tokens in all translated values against their source keys; no mismatches were found.
- Compared repeated Russian source labels sharing one English editing concept. The two duplicate glossary groups (`Audio` and `Position`) are now consistent in every locale. In Ukrainian, Czech, Kyrgyz and Belarusian the duplicate `Position` labels were explicitly harmonized.
- Added a 25-term editorial glossary and a locale-by-locale CSV matrix.
- Replaced the Russian-only native About alert with a compact in-app dialog using the current localized application title and translated common controls.

### Visual/layout hardening

- Added script-aware fallback font stacks for extended Latin, Cyrillic, Georgian, Armenian, Arabic, Hebrew, Devanagari, Thai, Simplified/Traditional Chinese, Japanese and Korean.
- Enabled wrapping and flexible height for translated menu buttons, menu items, side tabs, panel headings, property labels, modal text, toast text and export actions.
- Allowed the translated top bar to wrap instead of clipping long localized labels.
- Constrained menus and dialogs to the viewport and made property labels share width with their controls.
- Kept RTL reading surfaces right-to-left while preserving timeline/media geometry, preview coordinates, numeric fields, rulers and keyboard shortcuts left-to-right.
- Added a long-label shortlist for manual GUI review; lengths are Unicode code-point heuristics, not rendered pixel widths.
- Restored a precise export warning explaining streamed frame transport and the 512 MiB bounded source-frame LRU cache.

## Validation results

| Check | Result |
|---|---:|
| Selectable locale variants | 36 |
| Preview locale packs audited | 34 |
| English reference keys per pack | 436 |
| Missing keys | 0 |
| Empty translation values | 0 |
| English fallback entries | 0 |
| Dynamic placeholder mismatches | 0 |
| Repeated terminology mismatches | 0 |
| About-title/version mismatches | 0 |
| Full Node test suite | **281 passed, 0 failed** |
| CSS stylesheet blocks parsed | 1 |
| CSS rules/at-rules parsed | 590 |
| CSS parse errors | 0 |
| CSS declaration parse errors | 0 |
| Key JS syntax checks | Passed |

## Reproducible checks

From the project root:

```powershell
npm.cmd test
npm.cmd run qa:locales
```

`qa:locales` regenerates locale coverage, performs the structural/placeholder/terminology audit, builds the 36-variant terminology glossary and produces the long-label review shortlist.

## Important limitations

- These translations remain AI-assisted preview drafts. The automated checks measure structural completeness and consistency, not idiomatic quality or professional terminology. Native-speaker review is still required for every language; Uzbek Cyrillic remains a transliteration draft rather than an independently translated edition.
- Font-family declarations are ordered fallback preferences. Actual font availability and glyph shape depend on the installed Windows fonts and cannot be certified by static inspection.
- The CSS parser confirms syntax only. It does not measure real pixel fit or rendered layout.
- This environment did not provide a working Windows/Electron GUI renderer for screenshot-based review. No Windows screenshots or DPI-scaled visual verification are claimed.
- Windows Setup and Portable packages were not built in this pass. This is an updated source archive, not a signed installer or production release.
- A final audit of every dynamically assembled runtime message, plus native-speaker review and Windows GUI review, remains outstanding.
