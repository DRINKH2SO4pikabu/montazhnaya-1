# Montazhnaya Beta 3.6.40 — Detailed Localization QA

## Release scope

Phase 7 completes the source-key mapping for the final six international languages: Czech, Romanian, Greek, Vietnamese, Indonesian and Thai.

## Locale coverage

The 24 international preview locales are:

`de`, `fr`, `es`, `pt-BR`, `it`, `pl`, `uk`, `tr`, `zh-CN`, `zh-TW`, `ja`, `ko`, `ar`, `he`, `hi`, `nl`, `sv`, `fi`, `cs`, `ro`, `el`, `vi`, `id`, `th`.

Each locale maps the complete 436-key English source dictionary. Every pack reports `localeMappedCount: 436`, `englishFallbackCount: 0`, `sourceMessageCount: 436`, and `translationStage: translation-draft-complete-review-pending`.

## Checks performed

1. Loaded the actual English and international locale scripts in a Node VM context.
2. Verified registration of all 24 locale packs.
3. Verified exact dictionary size and zero English fallback keys for every pack.
4. Verified that all translated values are non-empty strings.
5. Compared dynamic placeholders in source keys and translated values across all packs.
6. Verified Arabic and Hebrew direction metadata remains RTL.
7. Verified CSS font stack and long-text handling rules for Thai and Vietnamese, plus wrapping rules for Czech, Romanian and Greek.
8. Verified the displayed About/version label reports beta 3.6.40 in every international pack.
9. Ran the complete project test suite: 274 passed, 0 failed.
10. Confirmed the source archive can be checked with ZIP integrity testing and SHA-256.

## Translation quality status

All strings are draft translations generated for the project. A zero fallback count indicates every source key has a locale-specific value; it is not a certification of native fluency. Professional/native-speaker review, terminology harmonization and screenshot-based UI review remain required before a public international release.

## Platform QA status

The automated suite ran in the current development environment. Visual validation against the target Windows desktop configuration is still pending. Windows Setup and Portable outputs were not generated as part of this localization-only source update.
