# Changelog

## Stage 19 — timeline tools and clip speed

## Localization Stage 12 — contextual-help chrome and real GUI audit corrections

- Added six separately scoped contextual-help UI labels (plain-language heading, help title, section headings, tip prefix and keyboard-shortcut label) for all 36 selectable locale variants.
- Kept these labels in a dedicated locale metadata dictionary; the canonical English source dictionary remains exactly 436 keys and translation coverage totals are unchanged.
- Corrected the GUI audit direction comparison to check the actual renderer value, and made detailed-fragment checks compare the text after the same translation step used by the renderer.
- Corrected audit counters that previously added sample arrays instead of their lengths.
- Increased only the vertical subpixel measurement tolerance for tooltip text boxes and cards to avoid false Arabic clipping warnings while preserving horizontal overflow checks.
- Added regression tests for all six labels in all 36 locales and included the checks in the independent Node-only localization CI job.
- The Windows Electron GUI audit still needs a fresh user-side run to confirm the rendered result and inspect the new screenshots.

## Localization Stage 11 — tooltip and UI command-label consistency

- Added a six-command consistency audit covering Save Project with Media, Ripple Delete, Copy Clip, Paste Clip, Duplicate Clip and Add Marker across all 34 preview locales.
- Harmonized 46 detailed-tooltip title strings in 25 locale packs to the existing localized UI labels; tooltip explanations and instructions were not changed.
- Added regression coverage for all 204 locale/command pairs. The audit reports zero remaining title mismatches.
- Separated the Node-only locale and tooltip QA job from Electron runtime downloads so translation checks remain independently verifiable during external release-asset outages.

## Localization Stage 10 — tooltip command terminology and GUI audit bridge

- Expanded detailed-tooltip QA to check all 12,376 preview translation cells for exact English and Russian source remnants; both counts are zero.
- Added script-mixing review for Cyrillic characters in locales that do not use Cyrillic; no candidates were found.
- Restricted immutable technical-token checks to identifiers that should remain stable. Localized keyboard direction names, key labels and units such as FPS/Mbps are no longer reported as missing technical tokens.

- Harmonized the detailed-tooltip Ripple Delete title and instruction with the existing editorial UI glossary in 30 locale packs; the four CJK packs retain their native localized command names.
- Added qa/audit-tooltip-ripple-terminology.cjs to npm run qa:locales, with a report covering all 34 preview locales.
- Added regression coverage that requires the tooltip title and instruction to match the editorial command label and rejects English/mixed Ripple Delete wording.
- Added a query-gated window.MontazhnayaTooltipQA bridge so the DevTools GUI audit can invoke renderer functions that are intentionally private inside the editor IIFE. Normal app launches do not expose the bridge.
- Updated the PowerShell audit runner to request this explicit QA mode and restore the caller's environment after launching Electron.


- Moved the Split button from the top action toolbar to the bottom timeline toolbar, beside the new clip-speed control. The Edit menu command and `S` shortcut remain available.
- Added video clip speed selection from 0.25× to 4×. Changing speed preserves the selected source in/out range and recalculates the clip's timeline duration.
- Linked detached audio follows its video partner's speed. Embedded video audio, audio preview, offline audio mixing and frame-accurate MP4/WebM export use the same playback-rate mapping.
- Speed changes are undoable. A speed change that would overlap another clip on the same track is rejected instead of damaging the edit.
- Speed is persisted in project files; legacy projects without a speed field default to 1×.
- Updated source-range validation and Fire Whirl pre-roll source mapping for variable-speed clips.

## Fire Whirl Stage 18 — animated transition-card preview

- Replaced the Fire Whirl poster-only card with a real silent H.264 preview clip derived from the user's exported MP4 (`montazhnaya_20261105_1358(2).mp4`).
- Added `assets/transition-previews/fire-whirl.mp4`: 3 seconds, 640×360, 20 fps, 60 frames, no audio; the visible section includes the lead-in, fire transition and incoming shot.
- Replaced the poster with a representative frame from the same MP4, so the still state matches the animated preview.
- Fire Whirl now uses the same hover/focus playback, lazy loading, one-video-at-a-time decode policy, muted playback, pointer-leave reset and reduced-motion behavior as the other transition cards.
- Kept the compact SVG icon only for the transition marker on the timeline. The actual transition renderer, sequence duration and export pipeline are unchanged.
- Updated transition-preview regression tests to cover all 21 animated preview videos and the Fire Whirl source-to-preview mapping.

---


## Fire Whirl Stage 17 — transition library thumbnail

- Replaced the improvised two-color SVG tile in the Fire Whirl library card with a dedicated cinematic 16:9 poster thumbnail.
- Added a poster-only preview path for effects rendered by the compositor without a separate demo video.
- Kept the compact SVG glyph for the actual transition marker on the timeline.
- Added regression coverage for the packaged poster, markup path, lazy image loading, and thumbnail dimensions.

# Changelog — Fire Whirl Stage 15: transition does not shorten video

- Replaced physical clip overlap trimming for new sequence transitions with a pre-roll compositor window. The incoming clip keeps its original `timelineStart`, duration and source range; the transition plays over the outgoing clip's tail and completes exactly at the edit point.
- Unified Preview and frame-accurate FFmpeg Export source-time mapping for incoming pre-roll frames; embedded video audio stays aligned to the real edit point and is not started early.
- Added a conservative migration for legacy terminal overlap projects when the shortened video tail matches the saved transition duration and the audio end; no last-frame hold/freeze is introduced.
- Transition duration edits no longer move incoming clips. Timeline marker is displayed over the outgoing clip's final transition interval.
- Added regression tests for exact edit timing, preserved clip end/duration, audio alignment, legacy migration and absence of synthetic held frames.
- Validation: **420/420 tests PASS**, `npm run qa:locales` PASS, CSP SHA-256 PASS. Windows GUI/MP4 acceptance after migration remains pending.

---

# Changelog — Fire Whirl Stage 13 (Stage 3: polish and optimization)

- Progress is now calculated strictly from the actual transition overlap duration, avoiding incomplete short transitions at low project FPS.
- Added WebGL adapter diagnostics, optional unmasked vendor/renderer reporting, configurable power preference hints, texture/viewport dimension guards and a base working-set memory estimate.
- Added the Fire Whirl benchmark page for 1080p/4K at 24/30/60 FPS, plus Windows instructions for NVIDIA/AMD/Intel adapter checks and actual VRAM monitoring.
- Added nine Stage 3 regression checks (including timeline parity math, size limits, memory estimate, adapter selection and benchmark coverage).
- Set `npm test` to four concurrent test workers to avoid resource contention between FFmpeg integration tests.
- Validation: **407/407 tests PASS**, `npm run qa:locales` PASS, syntax checks PASS, CSP SHA-256 PASS.
- Physical WebGL/GPU tests and real Preview-vs-Export image comparison remain NOT RUN in this container; Windows hardware acceptance is still required.

---

# Changelog — Usability Stage 10

- Исправлены независимые снимки Undo/Redo: `transIn` и `transOut` теперь копируются отдельно при записи и восстановлении истории.
- Добавлены четыре регрессионных теста на Undo, Redo, изоляцию вложенных объектов и отсутствие переходов.
- Обновлён CSP hash встроенного renderer-скрипта.
- Проверки: 374/374 тестов, `npm run qa:locales` PASS, JS/CJS syntax PASS.
- Windows GUI и ручной smoke-test пока не выполнялись.

---

## 3.6.45 — Localization Stage 9: full dictionary audit and editorial pass (2026-11-04)

- Audited the immutable 436-key source dictionary against all 34 preview locales: **14,824 translation cells** inspected, with 0 missing/empty strings and 0 placeholder mismatches.
- Added 56 locale-specific editorial corrections in this stage; the cumulative editorial override catalogue now contains **191 corrections** across 34 locales and 34 source concepts.
- Clarified Wipe and Iris transition labels in regional language packs, including upward wipe direction; aligned Finnish frame wording and Indonesian video/audio track vocabulary; corrected Turkish/Turkmen edit-menu labels and Belarusian Fade In wording.
- Corrected stale 3.6.44 About/app titles in regional packs to 3.6.45; added automated assertions for title parity.
- Expanded the multilingual editing glossary to 82 concepts across all 36 selectable variants. Generated a complete 14,824-row translation matrix and a separate visual/script/length review-flag queue.
- Added Stage 9 regression coverage for source-key completeness, placeholders, runtime overrides, transition terminology and regional About titles. Full test suite: **370 passed, 0 failed**. `npm run qa:locales`: **PASS**.
- Limitations: this is a machine-assisted full-dictionary structural/terminology pass, not native-speaker certification. 147 long-string rows and 122 length-ratio outliers remain review candidates; 526 exact English matches require contextual assessment. Uzbek Cyrillic remains transliteration-derived. Native Windows and native-speaker checks remain pending.

## 3.6.45 — Localization Stage 7: complete beginner-tour translations (2026-11-04)

- Replaced all seven detailed beginner-tour step literals with stable semantic keys (`tour.beginner.stepN.title/body/tip`); renderer copy now resolves through `MontazhnayaI18n.t()` and refreshes when the user changes locale.
- Added a dedicated `beginner-tour.js` catalogue with 21 fields for each of the 36 selectable locales: 756 translations in total, including 714 new translations across the 34 preview locales.
- Aligned command references in the tutorial with actual localized editor labels, including Import Media, Split, Transitions and Export; added automated terminology-consistency checks.
- Added locale registration, runtime-switching, semantic-key, content completeness, no-English-fallback and review-status tests. The locale QA pipeline now includes `audit-beginner-tour-locales.cjs` and exports a 756-row CSV.
- Recalculated the strict renderer CSP hash after the inline tour renderer change.
- Full test suite: **364 passed, 0 failed**. `npm run qa:locales`: **PASS**; 36 locales × 21 fields, 0 missing, 0 empty, 0 English fallback.
- Limitation: translations for the 34 preview locales are machine-assisted drafts pending native-speaker review. Windows GUI/DPI testing and a fresh screenshot pass were not performed in this environment.

## 3.6.45 — Localization Stage 6: visual runtime QA (2026-11-04)

- Reworked the narrow-window top bar so menu labels no longer collapse or wrap character-by-character at the minimum supported 1024 px width; action controls move to a second row.
- Made transport controls wrap at narrow widths and compacted the timecode; verified no horizontal overflow at 1024×700, 1366×768 and 1920×1080.
- Removed the whole `#mediaList` exclusion from the DOM translator while retaining per-media-item and filename exclusions, so empty-library instructions are translated without modifying user content.
- Localized the empty-timeline hint and refreshed the semantic timeline track heading on locale changes; added translations for the heading in all 34 preview locales.
- Replaced English-only welcome-tour intro text with strings translated in all 36 packs and refreshes an open welcome card after a locale switch.
- Executed the renderer in headless Chromium for all 36 locales across three viewport sizes: 0 page errors and 0 measured layout failures.
- Added visual evidence, a 36-locale runtime matrix and new regression tests. Full test suite: **358 passed, 0 failed**; `npm run qa:locales`: **PASS**.
- Limitation: the 21 detailed strings for the seven-step beginner tour still use English fallback in 34 non-Russian/non-English locales (714 translations remain). Native Windows GUI/DPI checks and native-speaker review are still pending.

## 3.6.45 — Localization Stage 4: structured Electron IPC errors (2026-11-04)

- Added a single structured IPC boundary for all 19 `ipcMain.handle` channels. Main-process failures now return `{ status: "error", error: { code, key, params, retryable } }`; raw localized `message` text is removed before data crosses IPC.
- Added 30 stable error IDs and unique machine-readable codes for untrusted requests, locale synchronization, disk space, missing tools, process failures, media inspection/staging, audio operations, export sessions/validation and still-frame saving.
- Normalized both legacy `{ status: "error", message }` return values and thrown handler exceptions without changing success/cancelled response shapes or feature-specific metadata.
- Added a preload compatibility adapter that resolves the error key against the selected locale and English fallback, preserving existing renderer call sites while keeping the main-process API free of display text.
- Added bounded interpolation-parameter sanitization and tests for classification, fallback keys, no raw-message leakage, all-channel registration, and runtime Russian/English fallback behavior.
- Added 30 Russian/English error-catalogue entries. Other 34 preview locales use the explicit English fallback for these new messages until the next translation pass.
- Full project tests: **351 passed, 0 failed**. `npm run qa:locales`: **PASS**. CSP inline-script hash unchanged.
- Windows GUI verification and Setup/Portable packaging were not performed in this Linux source-editing environment.

## 3.6.45 — localization Stage 3: dynamic messages and stable IDs (2026-11-04)

- Expanded the permanent semantic message catalog from 188 to 270 entries, adding 82 keys for export progress, export warnings, dialogs, diagnostics, timeline labels, slideshow order and frame-save UI.
- Migrated renderer export status text and confirmation/report dialogs to permanent IDs with variable interpolation; retained original user filenames and project text.
- Replaced hardcoded export-warning HTML with localizable catalogue messages; localized warning lists use `Intl.ListFormat`.
- Added validation for every direct semantic-key reference, key uniqueness, source/English placeholder parity, locale fallback coverage and CSP inline-script hash.
- Full test suite: **340 passed, 0 failed**. Locale QA: **PASS**.
- Russian and English dynamic catalogues are complete (270/270). The remaining 34 locales currently have 36 local entries each and use English fallback for 234 entries; native-speaker review and translation are still required.
- Electron main-process error normalization and Windows visual/RTL/DPI verification remain follow-up work; see `LOCALIZATION_STAGE3_REPORT_RU.md`.

## 3.6.45 — language selection and English default

- Added a dedicated top-level **Interface language…** control to the editor menu bar.
- English is now the first-run default regardless of the Windows display language.
- Manual language choices are saved locally and restored on next launch; the explicit system-language option remains available.
- First launch defaults to English; previously saved language choices, including an explicitly selected system-language mode, are preserved.
- Translation matching now ignores surrounding HTML layout whitespace, preventing tab labels from unexpectedly remaining in Russian.
- The generated project-profile badge now follows the selected language (English by default, Russian when Russian is selected).

## 3.6.45 — audit hardening follow-up (source rebuild)

- Added a restrictive renderer Content Security Policy for local resources; blocked unexpected navigation/redirects and additional windows.
- Added regression tests for the CSP and navigation restrictions.
- Added FFmpeg installation to the Windows release workflow before integration tests.
- Added the reproducible localization quality audit to regular CI and Windows release CI.
- Re-ran the full suite after dependency-pipeline and security-gate changes: 303 passed, 0 failed.
- Electron is upgraded to 45.2.1; launch scripts validate Node >=22.12.0, repair missing/outdated runtime installs and require the exact Electron version. The Windows build always starts from `npm ci --ignore-scripts` and gates packaging on npm audit, tests and localization QA. `@electron/get` is 5.1.0, `@electron-internal/extract-zip` is 1.0.8, and `undici` is 7.30.1. The root lockfile now has 13/13 valid SRI entries. A separate electron-builder release-toolchain lockfile, registry-backed npm audits, full installation, and Windows packaging/runtime QA remain release gates.

## 3.6.45 — localization linguistic consistency and visual-layout hardening

- Harmonized repeated editing terminology across locale dictionaries and added automated checks for duplicate concepts and dynamic placeholders.
- Added script-aware font stacks, text wrapping and modal/menu sizing safeguards, including RTL isolation that preserves timeline geometry.
- Replaced the untranslated About alert with a localized in-app dialog.
- Native-speaker review and Windows visual verification remain pending; this source-only quality pass does not build Setup/Portable.

## 3.6.44 — CIS regional localization wave 4

- Completed the 436-key source-map draft for Armenian (hy), Turkmen (tk), Kyrgyz (ky), Tajik (tg) and Belarusian (be).
- Preserved dynamic placeholders, codec/format tokens and keyboard shortcuts in all five packs.
- Added regional font-family metadata for Armenian, Turkmen Latin and Cyrillic-based packs.
- All five packs remain preview drafts and require native-speaker linguistic review; full key coverage is not a claim of professional proofreading.
- Full automated project test suite: see the 3.6.44 QA report.

## 3.6.43 — CIS localization wave 3 and Uzbek Cyrillic

- Completed the remaining 232 source-key mappings for Kazakh, Uzbek (Latin), Azerbaijani and Georgian; each now covers 436/436 source strings with zero English fallback.
- Added Uzbek (Cyrillic) as a separate `uz-Cyrl` locale with automatic script-subtag resolution. Its text is a transliteration draft from the Uzbek Latin pack and requires native-speaker review.
- Expanded regression coverage for all regional strings, dynamic placeholders, locale resolution, and transliteration metadata.
- Full automated suite: **276 passed, 0 failed**; focused localization suite: **18 passed, 0 failed**.
- Windows Setup/Portable and visual GUI QA are not part of this source-only wave.

## 3.6.42 — CIS language localization wave 2

- Expanded Kazakh, Uzbek (Latin), Azerbaijani and Georgian from 83 to 204 localized source-key mappings each.
- Added 122 workflow phrases covering media properties, clip timing, transforms, color correction, titles, audio controls, numbered media placement and slideshow setup.
- Preserved all dynamic placeholders and explicit English fallback metadata; each of the four locale packs now has 232 remaining fallback keys.
- Updated localized About/version labels and added coverage assertions for the new regional workflows.
- Automated test suite: **275 passed, 0 failed**.

## 3.6.42 — CIS, Caucasus and Central Asia localization wave 1

- Added Kazakh, Uzbek, Georgian, Armenian, Turkmen, Azerbaijani, Kyrgyz, Tajik and Belarusian language packs.
- Translated 81 core interface phrases (82 source mappings, plus the localized About title) in each new language.
- Remaining 353 source strings per new locale deliberately use the English reference fallback until subsequent translation waves.
- Added Georgian and Armenian Windows font fallbacks; registered BCP-47 locale resolution for country-specific system languages.
- Added localization coverage and fallback validation tests.


## 3.6.40 — International Localization Phase 7

- Completed draft translations for Czech, Romanian, Greek, Vietnamese, Indonesian and Thai.
- All 24 international preview packs now cover all 436 English source keys with zero English fallback entries.
- Added Thai and Vietnamese font stacks and improved wrapping/line-height rules for Thai, Vietnamese, Czech, Romanian and Greek UI.
- Preserved all dynamic placeholders, keyboard shortcuts and technical identifiers.
- Updated the About/version label across all international packs.
- Full automated suite: 274 tests passed.
- Translation status remains preview pending native-speaker review and visual QA on Windows.

# Montazhnaya beta 3.6.40

## Beta 3.6.40 — fifth localization wave

- Completed draft translations for Ukrainian, Turkish, Simplified and Traditional Chinese, Japanese and Korean (436/436 source keys in each pack).
- Added CJK font fallbacks and wrapping rules for longer translated UI text.
- Added placeholder-integrity and localization coverage checks.
- Translation status remains preview pending native-speaker review; no Windows installer was built in this environment.



## Beta 3.6.40 — fourth localization wave

- Translated the remaining 135 English fallback entries into German, French, Spanish, Brazilian Portuguese, Italian and Polish.
- These six locale drafts now map all 436 English reference keys locally; no English fallback remains in those six packs.
- Preserved dynamic placeholders and keyboard shortcuts; technical units and codec names use locale-appropriate conventions.
- The other 18 locale previews retain their explicit English fallback list.
- All six expanded packs remain marked as preview pending fluent-speaker and Windows UI review.
- No Setup/Portable installer was built in this phase.


## Third-wave international localization and complete source-key mapping

All 24 international language packs now contain all 436 source keys from the English reference dictionary. To avoid overstating translation completeness, the packs separately report 301 locale-specific entries and 135 English fallback entries per locale; all 24 remain explicitly marked as translation previews.

The third wave adds locale-specific translations for the transition library (names and descriptive labels for fade, flash, wipe, slide, iris, diamond, soft-focus and spin transitions), numeric media ordering labels, sequence naming and tips states. Missing dictionary entries are filled from the English reference pack, preventing those known source keys from falling through to Russian. This is 100% key coverage of the current 436-entry reference dictionary, but approximately 69% locale-specific mapping coverage. Additional dynamically composed strings outside the dictionary, fluent review, plural/date formatting and long-string/RTL visual QA remain outstanding.

## Validation

- Full source map: 436 / 436 keys in every international locale.
- Locale-specific translations: 301 entries per locale (including aliases).
- Explicit English fallback: 135 entries per locale.
- All dynamic placeholders remain present and unchanged.
- Arabic and Hebrew retain RTL metadata; visual RTL certification is not claimed.
- Windows Setup/Portable and on-machine UI/icon verification were not performed in this Linux environment.

## 3.6.35 — second-wave international localization

- Expanded all 24 international preview packs from 130 to 260 translated phrase slots each (261 mapped source-string entries including aliases).
- Added editing commands, ripple deletion, marker/frame navigation, timeline guides and snapping, transition operations, editor tour and export range/bitrate controls.
- Added project/media panel terminology, clip timing and source in/out points, image transforms, audio detachment, clip-overlap validation, project recovery prompts and marker navigation.
- Preserved dynamic placeholders (`{count}`, `{savedAt}`, `{clips}`, `{media}`) and the selected-locale → English → Russian fallback.
- Kept the 24 international packs explicitly marked as translation previews; rare runtime errors, some help text, full visual QA and native-speaker review remain outstanding.
- Full automated suite passed: 274 tests, 0 failures. Windows Setup/Portable was not built in this Linux environment.

## 3.6.34 — localization expansion

- Extended all 24 international preview dictionaries to 131 mapped source strings each.
- Added clip properties, color correction, titles, audio controls, slideshow and still-frame export settings, diagnostics, frequent error states and long export explanations.
- Preserved parameter placeholders and the English/Russian fallback for untranslated strings.
- No full-localization claim: further screens, tooltips, rare errors, fluent review and RTL UI checks remain planned.

# Changelog

## 3.6.45 — Fire Whirl Stage 14: sandboxed preload bridge hotfix (2026-11-05)

- Fixed the Electron 45 sandboxed-preload startup failure: `electron/preload.cjs` no longer requires the local `i18n-core.cjs` module, which is unavailable through the restricted `require()` in a sandboxed preload.
- Kept `sandbox: true`, `contextIsolation: true` and `nodeIntegration: false`; no renderer security setting was weakened.
- Embedded the small, defensive semantic-message sanitizer/formatter required by preload IPC error localization.
- Restored `window.montazhnaya` exposure, including FFmpeg diagnostics and FFmpeg export capability discovery.
- Added `tests/preload-sandbox-compatibility.test.cjs`, which evaluates preload with an Electron-only sandboxed `require`, checks the exposed bridge, and validates IPC diagnostics and localized errors.
- Validation: **408/408 tests passed**; `npm run qa:locales` passed. Windows Electron GUI and real MP4 export still require user-side confirmation after applying the patch.

## 3.6.45 — second localization engineering pass

- Added a semantic localization catalog with 19 stable message IDs across all 36 selectable locale variants.
- Added CLDR cardinal plural forms for media files, clips and frames, plus case-aware noun data and safe grammatical fallback.
- Unified renderer/Electron semantic message formatting, locale-aware number/date/time/unit/relative-time formatting, IEC file-size labels and duration rounding.
- Migrated high-visibility dynamic messages for media import/relinking, portable projects, export, clip nudging, slideshow count, project profile and still-frame save dialogs to stable IDs.
- Kept legacy phrase-key dictionaries compatible while the remaining dynamic messages are migrated in subsequent passes.
- Added semantic localization regression tests; full suite passed 328/328 and `npm run qa:locales` passed for all 36 variants.
- International preview translations remain machine-assisted drafts pending native-speaker review; full Windows visual and Setup/Portable verification remains outstanding.


## 3.6.33 — initial international localization preview

- Added 24 international language choices: German, French, Spanish, Brazilian Portuguese, Italian, Polish, Ukrainian, Turkish, Simplified/Traditional Chinese, Japanese, Korean, Arabic, Hebrew, Hindi, Dutch, Swedish, Finnish, Czech, Romanian, Greek, Vietnamese, Indonesian and Thai.
- Added an initial set of 81 translated core phrase slots per locale, covering top-level menus, common project/media actions, timeline controls, export labels and transition categories.
- International packs are explicitly labelled as previews. Untranslated strings fall back to the existing English pack where available, then to the original Russian text.
- Added system-locale matching for regional tags and the two right-to-left locale metadata profiles (Arabic and Hebrew); full RTL layout validation remains outstanding.
- Added tests for locale registration, translation coverage thresholds, fallback metadata and version consistency.
- Kept the existing Windows product/installer/shortcut identity and installed-folder ICO/PNG copy configuration. A new Setup/Portable build still needs verification on Windows.

## 3.6.32 — brand distribution and localization foundation

- Set the Windows product identity and NSIS display name to «Монтажная»; kept the executable filename filesystem-safe as `Montazhnaya.exe`.
- Added root-level `Montazhnaya.ico` and `Montazhnaya.png` to the installed program directory through `extraFiles`.
- Added a local, offline language-pack runtime with system-language detection, persistent preference, live switching and BCP-47 locale handling.
- Added Russian and English packs, a language picker under Help, translation of static UI labels and transition catalog labels, and a safe Russian fallback for untranslated strings.
- Added `ltr`/`rtl` direction support and a documented pack/QA contract for additional languages.
- Expanded the English pack to 432 entries, including property panels, transforms, color correction, titles, audio, slideshow, still-frame export, FFmpeg diagnostics and common notifications.
- Added placeholder-aware message translation so dynamic counts and timestamps remain intact.
- Updated setup/build/PowerShell launch banners and log names to beta 3.6.32.
- Added tests for locale resolution, direction, fallback, dynamic UI wiring and Windows branding configuration.


## 3.6.31 — user-video transition previews and transition audit

- Replaced synthetic animated transition-card drawings with actual preview videos derived from all 20 user-supplied demonstration clips (the previous nine plus the new eleven).
- Added silent, lightweight H.264 preview clips and matching posters; the library lazily loads only the hovered/focused card and keeps at most one video decoder active.
- Added mute, single-play, reset-on-leave, release-on-tab-hide, focus support and `prefers-reduced-motion` handling.
- Kept static SVG icons for timeline markers so the timeline does not create background video decoders.
- Fixed the transition renderer so simultaneous entrance and exit masks on a short clip are accumulated as intersections instead of overwriting one another.
- Expanded transition coverage to all 20 modes and start/mid/end states.
- Added direction-specific endpoint assertions for all four slides, plus zoom, spin, blur and flash curves.
- Fixed simultaneous black/white sequence overlays so both channels are composited instead of dropping the weaker one.

## 3.6.30 — transition preview and playback performance

See previous release notes for the initial transition preview and render-cadence changes.

## 3.6.29 — close-flow and branding maintenance update

See previous release notes for the Windows close-flow and custom application icon changes.
## 3.6.45 — Localization Stage 5: Electron IPC errors in 34 preview locales (2026-11-04)

- Added a dedicated keyed translation registry for all 30 structured Electron IPC error messages in the 34 non-Russian/non-English preview locales (1,020 localized strings).
- Wired the registry into the notification/semantic catalogue so language packs receive these translations after lazy loading and before the active locale is initialized.
- Preserved the stable error IDs, `{tool}` interpolation parameter, Russian source strings, English reference strings, and the preload compatibility adapter.
- Added a reproducible IPC-error locale audit to `npm run qa:locales`; it verifies the advertised 34 locales, all 30 keys, non-empty translations, exact placeholder parity and runtime catalogue augmentation.
- Added two regression tests for the 1,020 translations and script load order under the renderer CSP.
- Translation strings are machine-assisted drafts and still require native-speaker review; Windows GUI verification and packaged Setup/Portable testing were not performed in this source-editing environment.


## Beta 3.6.45 — Localization Stage 8 (editorial terminology pass 1)

- Added a runtime-applied editorial override layer for all 34 preview locales.
- Corrected ambiguous/false-friend terms for project/image resolution, ripple delete, clip text overlays and snapping; refined selected track, audio separation, timeline and media relinking labels.
- Added a terminology-consistency pass between corrected UI labels and beginner-tour instructions for French, Georgian, Belarusian, Turkish, Armenian, Kyrgyz, Uzbek Latin and Uzbek Cyrillic.
- Corrected accidental mixed-script text in Georgian and added regression checks for guide/UI terminology alignment.
- Added before/after CSV, per-term rationale, machine-readable QA summary and a regression test for immutable/idempotent overrides.
- Regenerated beginner-tour QA artifacts with Stage 8 filenames.
- The complete suite passes **367/367**; `npm run qa:locales` passes with 36 language variants, 756 beginner-tour strings and 1,020 IPC error translations validated.
- Translation status remains preview; native-speaker review is still required for all locale packs. Native Windows GUI/DPI verification and packaged Setup/Portable testing remain outstanding.

## Fire Whirl Stage 12 — Integration
- Integrated Fire Whirl into the transition library and shared preview/export compositor.
- Added strict export source-frame checks and WebGL2 preflight.
- Added Fire Whirl integration and sequence regression tests.
- Validation: 394/394 tests; locale QA PASS.

## Fire Whirl icon polish

- Replaced the minimal flame mark with a dedicated two-source transition glyph: paired image panels, a glowing spiral flame, and small sparks.
- The same inline SVG is used by the transition library card and the timeline transition marker; no preview-video asset or extra decoder is required.
- Added regression coverage for the icon markup and both UI insertion points.
