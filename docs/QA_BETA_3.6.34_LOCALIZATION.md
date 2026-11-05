# QA — Montazhnaya beta 3.6.34 localization preview

## Implemented

- 24 international locale codes are registered in the renderer and Electron locale manifest.
- Each preview locale has 130 translated phrase slots (81 core + 49 extended) and 131 mapped source-string entries; source aliases may make the generated message map larger than the phrase-slot count.
- The English fallback dictionary contains 436 source-string entries.
- Lookup order is selected locale, English, then original Russian.
- System and regional locale matching is tested, including `de-DE` → `de`, `fr-CA` → `fr`, and `pt-PT` → `pt-BR`.
- Arabic and Hebrew locale packs declare right-to-left document direction.
- The picker labels these packs as previews and explains the fallback behavior.
- Product/installer/shortcut identity remains «Монтажная», and the package configuration retains the ICO/PNG copy into the installed application directory.

## Automated verification

- `npm test`: **274 passed, 0 failed** (full test suite, including the media/export integration tests).
- JavaScript syntax checks: `electron/i18n-core.cjs`, `src/renderer/i18n.js`, `src/renderer/locales/manifest.js`, `src/renderer/locales/en.js`, `src/renderer/locales/international.js` — passed.
- Static branding checks confirm the product name, executable filename, NSIS icons, shortcut name, runtime icon lookup and `extraFiles` copy configuration.
- Test output is retained in `qa/npm-test-beta-3.6.34.log`.

## Not verified in this environment

- The Windows Setup and Portable executables have not been rebuilt or opened on a Windows machine in this increment.
- Actual installer, uninstaller, desktop/Start Menu shortcut and taskbar icon artwork still need visual inspection on Windows.
- The complete UI has not been visually reviewed in every one of the 26 locales.
- Native-speaker review and translation of the remaining specialized terminology are still required.
- RTL UI layout certification has not been completed; only locale metadata and document direction are configured. Timeline axis and clip coordinate behavior must be confirmed visually.

## Manual smoke test on Windows

1. Extract the source, run `npm.cmd ci`, then `npm.cmd test`.
2. Start the app and open Help → Interface language.
3. Choose German, French, Arabic and Hebrew; confirm the preference persists after restarting.
4. Verify that media filenames, clip names and project content are not translated.
5. Build Setup and Portable, then verify the EXE, installer/uninstaller, shortcuts, taskbar and `Montazhnaya.ico` / `Montazhnaya.png` in the installed folder.

## Rollback

Keep the previous beta 3.6.32 archive unchanged. To roll back, close the application and restore the previous source folder or install the previous tested package. Do not overwrite the original `legacy` HTML or backup files.
