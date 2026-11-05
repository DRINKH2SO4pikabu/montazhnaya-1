# QA — Montazhnaya beta 3.6.37 localization wave 4

## Scope

Translated the 135 remaining English fallback source strings into six locale drafts: German, French, Spanish, Brazilian Portuguese, Italian and Polish. The source strings include language-picker labels, media ordering and slideshow settings, clip/linking messages, markers, export controls, diagnostic status and long-form FFmpeg/ffprobe help. Keyboard shortcuts, numbers, codec names and format identifiers are retained where appropriate.

## Translation accounting

- English reference dictionary: 436 source keys.
- International locale previews: 24.
- German, French, Spanish, Brazilian Portuguese, Italian and Polish: 436 local mappings, 0 English fallbacks each.
- Remaining 18 locale previews: 301 local mappings and 135 explicit English fallbacks each.
- All 24 packs still expose all 436 source keys.
- All 24 remain marked as preview until fluent-speaker and UI review is complete.

## Validation

- Full project test suite: **274 passed, 0 failed** (`npm test`).

- Runtime locale pack registration and fallback metadata.
- All translation arrays match the 135 source-key fallback inventory.
- Dynamic placeholders are preserved in every mapped string.
- Long diagnostic descriptions and linked-audio error messages are present in the six expanded locales.
- RTL metadata for Arabic and Hebrew remains unchanged.
- The full automated project suite is run from the project root; see the external QA log for the captured result.

## Not performed

- Native-speaker proofreading.
- Visual Windows GUI checks at 1024×700 and 1600×1000.
- RTL screenshot and interaction certification.
- Windows Setup/Portable build and installation test.
