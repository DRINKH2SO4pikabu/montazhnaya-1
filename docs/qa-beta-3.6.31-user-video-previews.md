# QA — Montazhnaya beta 3.6.31: user-provided transition previews and render-state audit

## Scope

This update uses all 20 user-provided demonstration videos as the actual animated content for the transition/effects library. It also audits the matching render-state logic and fixes two composition edge cases. The source project remains beta 3.6.31.

## Exact source-to-catalog mapping

| Catalog mode | User-provided source clip | Library preview |
|---|---|---|
| `opacity` | `Растворение.mp4` | `opacity.mp4` |
| `black` | `Из чёрного.mp4` | `black.mp4` |
| `white` | `Из белого.mp4` | `white.mp4` |
| `flash-white` | `Белая вспышка.mp4` | `flash-white.mp4` |
| `crossfade` | `Перекрёстное растворение.mp4` | `crossfade.mp4` |
| `wipe-left` | `Шторка слева.mp4` | `wipe-left.mp4` |
| `wipe-right` | `Шторка справа.mp4` | `wipe-right.mp4` |
| `wipe-up` | `Шторка снизу.mp4` | `wipe-up.mp4` |
| `wipe-down` | `Шторка сверху.mp4` | `wipe-down.mp4` |
| `wipe-diagonal` | `Диагональная шторка.mp4` | `wipe-diagonal.mp4` |
| `slide-left` | `Сдвиг влево.mp4` | `slide-left.mp4` |
| `slide-right` | `Сдвиг вправо.mp4` | `slide-right.mp4` |
| `slide-up` | `Сдвиг вверх.mp4` | `slide-up.mp4` |
| `slide-down` | `Сдвиг вниз.mp4` | `slide-down.mp4` |
| `zoom-in` | `Наезд.mp4` | `zoom-in.mp4` |
| `zoom-out` | `Отъезд.mp4` | `zoom-out.mp4` |
| `iris` | `Круговая диафрагма.mp4` | `iris.mp4` |
| `diamond` | `Ромб.mp4` | `diamond.mp4` |
| `blur` | `Мягкий фокус.mp4` | `blur.mp4` |
| `spin` | `Поворот.mp4` | `spin.mp4` |

The preview clips are derivatives of the supplied videos, not synthetic CSS approximations: a central active section is retained, resized to 640×360, resampled to 20 FPS, converted to silent H.264 Baseline MP4, and paired with a poster image. The original uploaded source files are not modified. The package contains 20 preview MP4s (about 5.3 MB total) and 20 posters. Each preview is 3.000 seconds, 60 frames, H.264 Constrained Baseline, 640×360, 20 FPS, with no audio stream.

## Media validation

- All 20 original user-provided videos were fully decoded with FFmpeg: exit code 0, no decode errors.
- All 20 generated library preview MP4 files were fully decoded with FFmpeg: exit code 0, no decode errors.
- Original source formats: H.264, 1280×720, 30 FPS. The first four examples are 181 frames / 6.033333 seconds; the remaining sixteen are 161 frames / 5.366667 seconds.
- Each catalog entry has a unique preview MP4 and a matching poster. Unit tests verify that every catalog mode maps to the exact user-provided source filename in `assets/transition-previews/README.md`.
- `assets/transition-previews/README.md` is the maintained source-of-truth mapping.

## Preview playback/resource behavior

- Video previews are inserted for all 20 transition/effect cards.
- `preload="none"`; `src` is assigned only on hover or keyboard focus.
- Previews are muted, inline, play once, reset when leaving the card, and respect `prefers-reduced-motion`.
- Changing cards releases the previous video source. At most one preview is loaded/decoded by the library at a time.
- Hiding the app or leaving the transition library releases the active source.
- Timeline glyphs remain static SVGs to avoid creating video decoders on every timeline marker.

## Render-state audit and corrections

All 20 catalog modes were reviewed at incoming and outgoing boundaries, midpoint and settled states. The shared render-state path remains the source for both realtime preview and local frame export.

- Directional wipe masks are checked against their named edges for left, right, up and down, including the outgoing side.
- Diagonal, circular iris and diamond masks use Canvas clip paths. Simultaneous entrance and exit masks on a short clip are retained as cumulative intersections rather than allowing the later mask to overwrite the earlier one.
- Slide-left/right/up/down endpoint and midpoint offsets are asserted with direction-specific expectations.
- Zoom-in/out endpoints, spin rotation endpoints and blur/focus endpoints are asserted.
- White flash peaks in the middle and clears at both boundaries.
- Black and white sequence-level overlays are now composed independently in deterministic order. Previously, when both were active, only the stronger one was drawn; the weaker simultaneous overlay was silently discarded.
- The library demonstration videos remain UI previews only. They do not replace source media in the timeline or enter the rendered output as footage.

## Automated validation results

- Node test suite: **255 / 255 PASS**.
- CommonJS syntax: 49 files checked with `node --check`, all passed.
- Inline renderer JavaScript: 1 script block (585,606 characters) checked with `node --check`, passed.
- User source demo videos: 20 / 20 full FFmpeg decode PASS.
- Generated preview videos: 20 / 20 full FFmpeg decode PASS.
- Poster files: all 20 catalog posters present.
- Package version, package-lock version and root lock version: 3.6.31.

Evidence logs are stored in `docs/qa-assets/`.

## Remaining target-PC validation

This container run does not certify Electron's native video playback smoothness or physical GPU behavior on the user's Windows PC. Rebuild the Windows Setup/Portable artifacts from this source package and check hover playback across all 20 cards, timeline transition preview, frame-by-frame scrubbing across the edit point, and one short MP4 export per transition family. In particular, verify the preview remains responsive while the timeline is playing on the target i5 / GTX 1050 system.
