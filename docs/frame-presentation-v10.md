# Frame presentation synchronization — v10

## Why v9 was insufficient

The user's export completed and had the expected container metadata (H.264/AAC, 1280x720, 24 FPS, 240 frames, 10 seconds), but image-to-source matching found only 160 distinct source frames. The repeated mapping began `0, 0, 1, 3, 3, 4, 6, 6, 7…`.

In v9, the sequential renderer accepted `seeked + readyState + currentTime` as proof that the requested source image was ready. Those signals prove that a seek operation completed and decoded data exists; they do not, by themselves, prove which frame Chromium actually presented to the compositor and which `drawImage(video)` then used.

## v10 change

- During video preparation, briefly observes `requestVideoFrameCallback` metadata to measure each video element's actual source-frame interval.
- For a target time, starts one measured source-frame interval earlier, registers `requestVideoFrameCallback` before briefly playing, and waits for presentation metadata that falls within half a measured source-frame interval of the target.
- Pauses immediately after accepting the presented frame. A callback that belongs to the preceding frame is ignored; a callback outside the target window is rejected.
- Reuses a cached image time only if that source frame was previously confirmed by presentation metadata.
- Adds automated tests for stale callbacks, matching target frames, nearest-frame tolerance for 24-to-30 FPS conversion, and rejection when the decoder jumps past the target.

## Validation status

Automated checks in the build environment: 17/17 tests passed. Inline renderer JavaScript plus `electron/main.cjs`, `electron/preload.cjs`, and `electron/media-timing.cjs` passed `node --check`.

This does **not** replace a real Electron/Windows export test. The v10 archive is a verification candidate until the resulting MP4 is compared frame-by-frame with the original.

## Windows acceptance test

1. Open a clean copy of the project and run `npm.cmd test`.
2. Run `npm.cmd start`.
3. Import the original 10-second `video (3).mp4`, use a 24 FPS sequence and 24 FPS MP4 export, and export the full 10 seconds.
4. Compare all output images against the original. Expected for this same-FPS test: 240 output frames, no repeated/omitted source images caused by seeking, and audio starting at zero. Frame count and PTS alone are not sufficient.
