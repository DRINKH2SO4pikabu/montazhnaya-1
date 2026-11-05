# Montazhnaya beta 3.6.45 — language menu and English default QA

## Delivered behavior

- The editor has a separate top-level **Language…** control immediately after Help. It opens the language picker directly.
- Fresh profiles start in English regardless of the Windows/system language.
- A manually selected locale is persisted and restored. The explicit **Automatic (system language)** option continues to work.
- Previous saved manual choices are migrated from the v1 preference key to v2; no user action is needed.
- Text translation now tolerates HTML layout whitespace around labels, preserving that whitespace after translation. This addresses tab labels adjacent to inline counters (for example Media 0 and Transitions 20).
- The CSS-generated project-profile badge uses PROJECT in English and ПРОЕКТ in Russian.
- The previous Windows npm EINVAL hotfix remains in the source archive.

## Validation

- Full automated test suite: **313 passed, 0 failed, 0 skipped**.
- Focused localization runtime integration checks include a Russian system locale, English first-run default, translated whitespace-bearing labels, switching to Russian, and the explicit system-language mode.
- Locale QA: **PASS** — 36 selectable variants, 34 preview locales, 436 English reference keys, zero missing/empty translations, zero English fallback entries, zero placeholder mismatches, zero repeated-terminology mismatches, zero About-title mismatches.
- JavaScript/CJS syntax: 71 files passed.
- JSON parse: 33 files passed.

## Not covered in this environment

- No native Windows/Electron screenshot or Windows Setup/Portable build was produced. The menu, persisted setting and text-normalization logic are covered by automated runtime tests; final visual confirmation should be done on the user's Windows machine.
