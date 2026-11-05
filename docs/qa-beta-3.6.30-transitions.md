# QA report — Montazhnaya beta 3.6.30 transitions

**Date:** 2026-11-03
**Scope:** user-supplied transition examples, transition rendering math, preview scheduling, source-package regression.

## Source clips inspected

All nine supplied MP4 files were inspected with `ffprobe` and fully decoded with FFmpeg (`-map 0:v:0 -map 0:a? -f null -`). All nine completed with `FULL_DECODE_PASS`; FFmpeg reported no decode errors.

| Example | Video | Frames | Duration | Result |
|---|---:|---:|---:|---|
| Растворение | H.264, 1280×720, 30 FPS | 181 | 6.033333 s | PASS |
| Из чёрного | H.264, 1280×720, 30 FPS | 181 | 6.033333 s | PASS |
| Из белого | H.264, 1280×720, 30 FPS | 181 | 6.033333 s | PASS |
| Белая вспышка | H.264, 1280×720, 30 FPS | 181 | 6.033333 s | PASS |
| Перекрёстное растворение | H.264, 1280×720, 30 FPS | 161 | 5.366667 s | PASS |
| Шторка слева | H.264, 1280×720, 30 FPS | 161 | 5.366667 s | PASS |
| Шторка справа | H.264, 1280×720, 30 FPS | 161 | 5.366667 s | PASS |
| Шторка снизу | H.264, 1280×720, 30 FPS | 161 | 5.366667 s | PASS |
| Шторка сверху | H.264, 1280×720, 30 FPS | 161 | 5.366667 s | PASS |

## Changes made

- Added lightweight animated SVG/CSS mini-previews for the nine represented transition modes. Animation starts on hover or keyboard focus, does not loop continuously while idle, and is disabled for `prefers-reduced-motion`.
- Kept the timeline transition markers static and compact; only library cards use the larger animated previews.
- Corrected the white-flash envelope to peak in the middle of the transition and return to zero at both ends.
- Corrected outgoing wipe rectangles so that the incoming and outgoing layers travel from the same named edge (left, right, top, or bottom).
- Incoming video clips are now synchronized/started even when the first frame has zero opacity. Previously the fully transparent start of a crossfade could defer decoder startup until the next visible frame.
- The preview computes each clip render state once and reuses it for both media synchronization and Canvas composition.
- Decoder `seeked` / `loadeddata` events no longer schedule an extra Canvas paint during active playback; the transport loop owns playback composition.
- Preview composition is paced at the project FPS while playback time remains wall-clock based. This avoids redundant paints on high-refresh monitors without accumulating time from rounded frame positions.
- Neutral Canvas color filters are skipped when all image adjustments are at their defaults.
- Preview and export continue to call the same `renderSequenceAtTime` compositor; no separate transition algorithm was introduced for export.

## Automated validation

- Node test suite: **249 passed, 0 failed, 0 skipped**.
- CommonJS syntax: **49 files checked, 0 errors** (`node --check`).
- Renderer inline JavaScript: **1 script checked, 0 errors** (`node --check`).
- User-provided MP4 references: **9/9 full decode passed**.
- ZIP archive integrity and SHA-256 are checked during package creation.

## Regression coverage added

The new `tests/transition-preview-performance.test.cjs` verifies animated SVG generation for all nine modes, hover/focus-only activation, reduced-motion support, white-flash peak timing, all four wipe directions, reuse of precomputed render states, project-FPS frame pacing, neutral Canvas filter bypass, suppression of redundant decode-event paints during playback, decoder start for transparent incoming clips, and outgoing wipe direction.

## Not claimed as verified here

This environment does not run the Windows Electron GUI on the user's GTX 1050. Therefore the following still require manual confirmation after rebuilding the Windows Setup/Portable packages: perceived smoothness during real-time playback, exact visual appearance of each applied transition at the cut, audio continuity through overlap transitions, and visual parity of the final MP4 export. Automated tests validate the transition calculations and rendering integration, but they are not a substitute for a physical Windows playback test. No FPS benchmark or measured percentage speedup is claimed.

## Windows verification checklist

1. Rebuild with `BUILD_WINDOWS_RELEASE.bat` from this source package.
2. In the Transitions library, hover/focus each of the nine cards and confirm its mini-preview animates; move away and confirm it stops.
3. Apply each transition to a two-clip cut and check both directions: incoming and outgoing.
4. Scrub frame-by-frame across each cut and play it at normal speed. Watch the first visible frame of cross dissolve for a decoder-start hitch.
5. Check audio continuity and confirm no unexpected mute/drop at overlap boundaries.
6. Export a short MP4 containing at least cross dissolve, white flash and two directional wipes; compare the exported file with the preview.
7. Repeat the real-time playback check with `prefers-reduced-motion` enabled if the Windows accessibility setting is available.
