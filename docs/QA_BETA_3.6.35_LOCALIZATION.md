# QA — Montazhnaya beta 3.6.35 localization expansion

## Scope

This release is the second expansion of the 24 international preview packs. Each pack now contains 260 translated phrase slots and 261 mapped Russian source-string keys. The additional wave covers editor commands, ripple delete, marker/frame navigation, timeline guides and snapping, transition operations, the editor tour, export range and bitrate controls, transport shortcuts, project/media panels, clip timing and source in/out points, image transforms, audio detachment, clip-overlap validation and project recovery prompts.

The 436-entry English dictionary remains the reference/fallback pack. International previews are therefore still partial; the UI keeps the explicit **Translation preview** marker. Some uncommon help text, rare dynamic diagnostics and other user-facing strings still use English or the Russian source wording.

## Automated validation

- `npm test`: **274 passed, 0 failed**.
- All 24 locale packs register and expose exactly 261 mapped source keys.
- Each pack contains the full 260-slot phrase expansion; the additional source-key count includes one source alias.
- Dynamic placeholders are checked for parity across all mapped strings, including `{count}`, `{savedAt}`, `{clips}`, `{media}`, `{format}` and `{file}`.
- No empty translated values are allowed by the localization test.
- Locale metadata verifies BCP-47 language identifiers, English fallback, preview coverage status, and RTL metadata for Arabic and Hebrew.
- Runtime tests continue to cover language preference persistence, regional locale matching, dynamic DOM updates and exclusion of user-authored/media names from translation.
- JavaScript syntax checks passed for `international.js`, `i18n.js` and `manifest.js`.

## Not performed / known limitations

- No Windows Setup/Portable installer was built in this Linux environment. The configured Windows product name, executable/installer icons, shortcuts and installed-folder logo assets therefore still require a real Windows build and visual verification.
- No live UI screenshot pass was performed at 1024×700 or 1600×1000; long-label clipping and modal layout need visual review.
- Arabic/Hebrew RTL is configured at document level, but the full editor layout and timeline coordinate semantics have not been visually certified.
- Native/fluent review for all 24 target languages has not been performed.
- This release does **not** claim complete interface localization. It expands the preview packs and keeps a clear English/Russian fallback for untranslated text.

## Reproduction

Run `npm test` from the project root. The full output is stored at `qa/npm-test-beta-3.6.35.log`.
