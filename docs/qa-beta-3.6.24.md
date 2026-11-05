# QA report — Montazhnaya beta 3.6.24

Date: 2026-11-03

## Scope

This update changes only the planning size of source-frame PNG windows. The decoder selection (NVDEC with software fallback), CFR clock, requested source-frame indices, PNG representation, renderer compositor, RGBA output transport, and H.264 encoder profiles are unchanged.

## Changes under test

- The default source-frame window remains 48 frames.
- The cache planner estimates compressed PNG batches at 25% of raw RGBA surface size.
- The default raw-RGBA estimator remains available for conservative disk-space requirements.
- The actual sum of extracted PNG sizes remains the hard 512 MiB cache limit.
- If the actual PNG batch exceeds 512 MiB, temporary files are deleted, the window is halved, and extraction is retried.
- If the temporary-volume preflight fails, a `TEMP_DISK_SPACE_LOW` error allows the window to be halved and the check retried.
- The application logs planned window size, estimated bytes, actual bytes, and any reduction.

## Automated validation

| Check | Result |
|---|---:|
| `npm test` | 201/201 PASS |
| CommonJS syntax checks | 42/42 PASS |
| 4K PNG estimate for a 48-frame window at 25% | Below 512 MiB |
| Raw RGBA upper-bound estimate for a 48-frame 4K window | Above 512 MiB |
| Window reduction helper (48→24→12→6→3→1) | PASS |

## FFmpeg extraction validation

Using the user-provided 3840×2160, 60 FPS H.264 source in the development environment's software FFmpeg:

- 48 consecutive 30 FPS output frames were extracted into one PNG window.
- Frame count: 48.
- Actual PNG batch: 344.8 MiB.
- Elapsed time: 6.20 s.
- A following seeked window extracted 46 frames successfully in 5.79 s.

This validates the larger batch size and the seek-window command path. It is not a measurement of NVDEC on the user's Windows machine.

## Hardware validation status

The user-provided beta 3.6.23 run on the GTX 1050 already confirmed:

- NVENC CBR smoke test passed.
- The actual MP4 session selected `h264_nvenc`.
- `NVDEC_PROBE_PASS` was present.
- All observed source windows were extracted with CUDA/NVDEC.
- No `NVDEC_WINDOW_FALLBACK` or `NVDEC_SOFTWARE_FALLBACK` appeared.
- The output MP4 was valid and decoded completely.

That run exported the original 4K60 source to 1280×720, 30 FPS, 5 Mbit/s in 150.1 s. The previous CPU-encoder run took 151.3 s, so the overall difference is only about 0.8%. This indicates that the CPU-side source-frame preparation and transfer path, not only H.264 encoding, dominates the total elapsed time.

## Not yet verified

- End-to-end export speed of beta 3.6.24 on the user's GTX 1050.
- Whether larger source windows materially reduce the 141.4 s source-reading/decoding stage seen in the beta 3.6.23 timing panel.
- Behavior on noisy/high-detail 4K sources whose PNG output may approach the 512 MiB batch limit.
- Physical NVDEC/NVENC behavior on AMD and Intel systems.
- The new `tools/Start-Montazhnaya-NVENC.ps1` convenience launcher was not executed under Windows PowerShell 5.1 in this development environment; it should be checked during the user's next Windows run.

## Manual test for beta 3.6.24

Use the same original 4K60 source file:

`montazhnaya_20261102_1710.mp4`

Use the same export settings:

- MP4 H.264 + AAC
- 1280×720
- 30 FPS
- target average bitrate 5 Mbit/s
- duration 6.033 s

Expected diagnostics:

- `NVDEC_PROBE_PASS`
- `videoEncoder: "h264_nvenc"`
- `[Оконный кэш исходных кадров] План окна` should initially show up to 48 frames for the 4K source (unless cache or disk checks reduce it).
- `[Оконный кэш исходных кадров] Декодировано` should report larger batches.
- No fallback markers unless the driver or decoder actually fails.
- The MP4 should remain at 181 frames, 30 FPS, 6.033 s and approximately 5 Mbit/s.

Compare the total time and stage timings with beta 3.6.23. Do not claim a speedup unless repeatable runs on the same hardware and same source show it.

## Rollback

The pre-change versions of `electron/main.cjs`, `electron/source-frame-cache.cjs`, and `tests/source-frame-cache.test.cjs` are preserved under:

`backups/source-frame-window-estimator-3.6.23-pre-20261103/`
