# Montazhnaya Beta 3.6.40 — International Localization Phase 7 QA

## Summary

The final six translation drafts have been added: Czech (`cs`), Romanian (`ro`), Greek (`el`), Vietnamese (`vi`), Indonesian (`id`) and Thai (`th`). All 24 international preview packs now contain values for all 436 English source keys, and the explicit English fallback list is empty for every pack.

## Localization validation

- International locale packs: 24
- English reference source keys: 436
- Mapped keys per international pack: 436
- English fallback keys per international pack: 0
- Translation stage: draft complete; native-speaker review pending
- RTL metadata: Arabic (`ar`) and Hebrew (`he`)
- Font/typography adjustments: Thai and Vietnamese font stacks; Thai/Vietnamese/Czech/Romanian/Greek long-text wrapping rules
- Dynamic placeholders: verified against source templates
- About/version labels: synchronized to beta 3.6.40 in all 24 international packs

## Automated test results

Command: `node --test tests/*.test.cjs`

- Tests: 274
- Passed: 274
- Failed: 0
- Skipped: 0

## Important limitations

This confirms key coverage, non-empty strings, placeholder parity, language registration and static typography rules. It does not certify professional translation quality or native-speaker terminology review. Full visual QA on Windows has not yet been performed. Windows Setup and Portable installers have not been built in this phase.
