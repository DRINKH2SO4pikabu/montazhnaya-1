# MP4 export by numbered PNG frames — v11

## What changed

The local MP4 path no longer goes through `canvas.captureStream(0)` + `MediaRecorder` and then CFR-normalizes the resulting WebM. That realtime capture path was producing a file with the planned 240 frames and uniform 24 FPS timestamps, while image matching showed repeated and omitted source pictures (`0, 0, 1, 3, 3, 4, ...`). Counting frames and inspecting PTS could not detect this visual loss.

For local MP4, the renderer now:

1. Builds the existing integer frame plan (`frameIndex / fps`).
2. Waits for the requested source frame and draws the timeline frame on the export canvas.
3. Snapshots the canvas bitmap directly with `canvas.toBlob("image/png")`.
4. Sends each PNG to the Electron main process with a strictly increasing index.
5. The main process validates the IPC sender, session, sequence index, PNG signature and temporary-storage limit, and writes numbered frames into a private OS temp folder.
6. FFmpeg reads `frame_%06d.png` with `-framerate <fps>` and encodes H.264 at exact CFR. If present, the offline-mixed WAV is encoded as AAC and muxed from time zero.
7. The resulting MP4 is checked by ffprobe for codec, frame count, all frame timestamps, CFR intervals, duration, audio presence and audio alignment; FFmpeg performs a full decode before the file is copied to the selected destination.

The older MediaRecorder path remains for WebM formats. If the PNG IPC path is unavailable, local MP4 export fails explicitly rather than silently falling back to the known realtime sampling behavior.

## Security and cleanup

- Renderer has no direct filesystem or shell access; only narrow functions are exposed through `contextBridge`.
- Main process accepts requests only from the trusted editor window.
- Frame indices must arrive in order; paths are generated in main from validated integer indexes, never supplied by renderer.
- Per-frame PNG size is limited to 64 MiB; total temporary PNG sequence is limited to 2 GiB; WAV is limited to 512 MiB.
- Temporary files are removed after finish or renderer cancellation.

## Validation performed in build environment

- `npm test`: 23/23 tests passed.
- `node --check` on main, preload, media-timing and extracted inline renderer JavaScript.
- FFmpeg smoke test: 240 numbered PNG frames plus WAV produced a 10-second H.264/AAC MP4 at 24 FPS. Full decoding passed, ffprobe confirmed 240 frames and 10 seconds, and frame matching mapped all 240 output pictures sequentially to original pictures with zero adjacent duplicates.

The FFmpeg smoke test validates the PNG-sequence encoding path. It is not a substitute for an export through Electron on the user's Windows machine; the renderer's actual canvas snapshots still require that final end-to-end check.
