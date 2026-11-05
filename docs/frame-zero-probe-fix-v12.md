# v12 — Fix initial-frame pre-roll during source cadence measurement

## Symptom

Export setup failed before the PNG frame-sequence loop began. At timeline/source time 0, Chromium's `requestVideoFrameCallback` reported 0.041667 seconds after source cadence measurement had played the same video element forward. The renderer then treated that as a missed target frame.

## Change

`src/renderer/index.html` now measures source frame cadence using a short-lived, independent muted `<video>` probe. The actual export video element is not played while cadence is being measured. After the probe is cleaned up, the source frame interval is associated with the actual render element and the latter is aligned to `clip.sourceIn`.

This preserves the initial decoded frame for the frame-zero path and avoids registering for a callback after that frame has already passed through the compositor.

## Verification

- `npm.cmd test`: 23/23 tests pass.
- Main/preload JavaScript syntax checks pass.
- Inline renderer script syntax check passes.
- Archive integrity check passes.

This fixes the preparation failure shown in the user's screenshot. A real export in Windows Electron still needs to be run to confirm that end-to-end output frames are correct.
