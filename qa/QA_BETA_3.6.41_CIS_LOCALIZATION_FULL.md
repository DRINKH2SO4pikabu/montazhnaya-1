# Full localization QA — Montazhnaya Beta 3.6.41

## 1. Locale inventory

Available locale count is 35: Russian (`ru`), English (`en`) and 33 international previews.

The existing 24 international packs retain their 436-key draft coverage. Nine new regional packs were added in this release:

| Locale | Language | Script | Local mappings | English fallback |
|---|---|---|---:|---:|
| kk | Kazakh | Cyrillic | 83 | 353 |
| uz | Uzbek | Latin | 83 | 353 |
| ka | Georgian | Georgian | 83 | 353 |
| hy | Armenian | Armenian | 83 | 353 |
| tk | Turkmen | Latin | 83 | 353 |
| az | Azerbaijani | Latin | 83 | 353 |
| ky | Kyrgyz | Cyrillic | 83 | 353 |
| tg | Tajik | Cyrillic | 83 | 353 |
| be | Belarusian | Cyrillic | 83 | 353 |

## 2. What is translated in the new wave

The first 81 English-reference phrases cover file/project commands, media import, slideshow/export entry points, clip editing, marker navigation, timeline zoom, transition library/categories, common project settings and interface language selection. The `Audio` reference phrase corresponds to two Russian source labels, so the 81 phrase values map to 82 source keys. The localized About title adds one more mapping, giving 83 per pack.

## 3. Fallback behavior

Every new regional package declares all 353 remaining English fallback keys. The runtime checks the selected locale first, then the English reference dictionary, then leaves text in the original Russian only when it is outside the reference dictionary. This prevents a partial regional pack from being misrepresented as a full translation.

## 4. Regional locale detection

The app resolves system locales by exact match or primary language. Country-specific tags for Kazakhstan, Uzbekistan, Georgia, Armenia, Turkmenistan, Azerbaijan, Kyrgyzstan, Tajikistan and Belarus were added to automated tests.

## 5. Typography

Georgian and Armenian received explicit Windows font fallback stacks. Kazakh, Kyrgyz, Tajik and Belarusian use a Cyrillic-capable UI fallback; Uzbek, Turkmen and Azerbaijani use Latin-capable UI fonts. Actual font availability differs by Windows version and installed language support; the CSS fallback rules have not been visually verified on multiple Windows systems.

## 6. Test results

The complete Node test suite executed successfully: 275 tests passed, zero failed. Tests include the new locale registry, language resolver, new CIS pack loading, explicit fallback metadata and current version alignment. The latest raw test log is `qa/npm-test-beta-3.6.41.log`.

## 7. Release limitations

These translations are machine-assisted drafts, not native-speaker reviewed. The new wave is deliberately partial. The advanced properties panel, slideshow builder, diagnostics, long help, recovery and error messages still use English fallback unless they are included in the 81 core phrases. There has been no real Windows Electron visual inspection, screen-size sweep, manual language-switch test or installer/portable build for beta 3.6.41.
