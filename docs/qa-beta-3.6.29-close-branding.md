# QA — beta 3.6.29 close flow and application branding

## Changes
- Electron main-process close guard reads `AppState.dirty` from the renderer.
- Clean projects close without a prompt. Dirty projects get a native «Выйти без сохранения / Отмена» dialog.
- Duplicate X/Alt+F4 close requests are coalesced while the prompt is open. If renderer state cannot be queried (for example during startup), the close guard falls back to an explicit discard confirmation instead of silently blocking.
- Renderer `beforeunload` remains cleanup-only; it no longer blocks unload.
- Custom ICO/PNG assets are used for BrowserWindow, Windows executable and NSIS setup/uninstaller. The in-app brand mark uses the same PNG artwork.

## Verification
Full automated suite: **239/239 PASS**. All 46 CommonJS files pass `node --check`. Automated lifecycle tests cover clean close, discard, cancel, repeated close clicks, and failure to query renderer state. Full automated suite must pass before distribution.

## Windows validation still required
The actual NSIS and portable EXE must be rebuilt on Windows and checked for: title-bar icon, taskbar icon, shortcut icon, clean close, unsaved-changes prompt, cancel behavior, and export after launch.

## Sample MP4 validation
Two user-provided export samples (`montazhnaya_20261103_1257.mp4` and `montazhnaya_20261103_1304.mp4`) were inspected and fully decoded with FFmpeg without reported decode errors. Both contain H.264 video at 1280×720, 30 FPS, 181 decoded frames, duration 6.033333 s, plus AAC stereo audio at 48 kHz. This validates the uploaded export files, not the new 3.6.29 Windows GUI build.
