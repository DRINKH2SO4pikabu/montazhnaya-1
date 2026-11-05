# 4K60 benchmark analysis — beta 3.6.23

Date of user run: 2026-11-03

## Matched source and output

The application log confirms that the export used:

- Input: `montazhnaya_20261102_1710.mp4`
- Input video: H.264 High, 3840×2160, 60 FPS, 362 frames, 6.033333 s
- Input audio: AAC LC, 48 kHz, stereo
- Output: `montazhnaya_20261103_0810.mp4`
- Output video: H.264 High, 1280×720, 30 FPS, 181 frames
- Output audio: AAC LC, 48 kHz, stereo
- Output duration: 6.033008 s
- Output average video bitrate: 5,016,682 bit/s (target 5,000,000 bit/s; approximately +0.33%)
- Output color tags: BT.709, limited range

FFprobe and a full FFmpeg decode of the provided output completed successfully. The output timestamps form a 30 FPS sequence at 181 frames.

## Hardware path

The log confirms:

- `NVENC CBR SMOKE TEST: PASS` in the preceding launcher run.
- `videoEncoder: "h264_nvenc"` for the actual output session.
- `NVDEC_PROBE_PASS` for the 4K60 H.264 source.
- Extraction windows use `-hwaccel cuda -hwaccel_output_format cuda` and `hwdownload,format=nv12`.
- No NVDEC software/window fallback markers were present.

This is an end-to-end hardware path on the user's GTX 1050: NVDEC for source decode and NVENC for H.264 encode.

## Performance result

The export timing panel showed a total of 150.1 s.

Reported timing stages:

- Source reading/decoding: 141.4 s (cumulative; part of the work overlaps).
- Frame preparation: 39.4 s.
- Transfer to FFmpeg: 7.8 s.
- Overlap of next-frame reading with current-frame processing: 47.2 s.
- FFmpeg process including frame feed: 144.0 s.
- Finalization: 0.1 s.

The preceding beta 3.6.22 run with the same 4K60 source and output settings took 151.3 s using the CPU encoder. The observed total difference is about 0.8%, which is not a meaningful overall speedup.

## Diagnosis

The hardware codecs are genuinely active, but the end-to-end pipeline is starved by source-frame preparation. The current flow decodes 4K frames, downloads them from GPU memory, encodes PNGs, reads PNGs from disk, sends them over IPC, decodes them in Chromium, composites them in Canvas, and then sends raw RGBA frames to FFmpeg.

The 4K PNG window planner had a default 48-frame target, but it estimated each PNG at the full uncompressed RGBA size. For 3840×2160 this reduced the window to about 12 frames before extraction, causing many short FFmpeg invocations. The next optimization therefore targets larger, bounded PNG windows while preserving the actual 512 MiB cap and fallback behavior.

## Limitations

- The overall timing comparison is based on two reported runs rather than multiple repeated benchmark runs.
- The metric is total export wall-clock time; it does not isolate encoder throughput.
- No claim is made that NVENC itself is only 0.8% faster than x264. The result shows that NVENC reduced total export time by only about 0.8% because the upstream pipeline dominates.
