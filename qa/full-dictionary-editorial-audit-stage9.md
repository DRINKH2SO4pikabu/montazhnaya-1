# Stage 9 — full dictionary editorial audit

- Reference strings: **436**
- Preview locales: **34**
- Translation cells inspected: **14,824 / 14,824**
- Missing/empty strings: **0**
- Placeholder validations: **14,824 / 14,824** (all passed)
- Exact English matches: **526** (review candidates, not automatically classified as errors; technical borrowings and cognates are allowed)
- Long strings over 160 characters: **147** across **6** distinct source messages (visual review candidates)
- Length-ratio outliers: **122** (many occur in concise CJK labels; reviewed as review candidates, not automatic errors)
- Unexplained script anomalies: **0** (brand spelling and keyboard shortcuts are explicitly allow-listed)

## Scope and reliability

The complete runtime dictionary was enumerated for every preview locale and each of its 436 source strings was checked for presence, non-empty content and placeholder parity. The matrix records every source/English-reference/target-language row, character length, script families and review status.

This is a machine-assisted editorial and structural pass. It can detect missing or malformed data, terminology patterns, script anomalies and likely visual outliers, but it cannot certify idiomatic wording, regional appropriateness or specialist usage in every target language. No native-speaker attestation is claimed.

## Priority human review

1. Uzbek Cyrillic (`uz-Cyrl`): the current pack is transliteration-derived and must be reviewed independently rather than assumed equivalent to an Uzbek Cyrillic translation.
2. Regional Central Asian languages (`kk`, `uz`, `tk`, `az`, `ky`, `tg`): confirm preferred professional video-editing vocabulary and avoid Russian/English calques where local terminology exists.
3. RTL locales (`ar`, `he`): verify mixed-direction strings containing codec names, numbers, keyboard shortcuts and placeholders in the native Windows build.
4. CJK locales (`zh-CN`, `zh-TW`, `ja`, `ko`): verify platform-conventional labels and line wrapping in native fonts.
5. All long technical help and diagnostic descriptions: verify clarity and sentence naturalness, not just key coverage.

## Targeted changes in this pass

- Updated stale 3.6.44 About/app titles in all ten CIS/regional packs to 3.6.45.
- Corrected Indonesian video/audio track wording and aligned frame terminology to `bingkai`.
- Corrected Finnish single-frame terminology to `ruutu`, consistent with the existing previous/next-frame commands.
- Clarified Wipe and Iris effect names in regional language packs so they refer to video transitions rather than household curtains/blinds or a physical camera diaphragm.
- Reclassified the preserved Latin brand name and keyboard shortcuts as intentional script exceptions rather than translation defects.
- Expanded the effect terminology review for Wipe/Iris transitions in high-risk regional language packs.
- Added automated checks for version consistency, full 436-key coverage and placeholder preservation.

## Files

- `full-dictionary-editorial-matrix-stage9.csv` — all 14,824 localized strings.
- `full-dictionary-review-flags-stage9.csv` — strings that merit a closer script/length review.
- `full-dictionary-editorial-audit-stage9.json` — machine-readable summary.
