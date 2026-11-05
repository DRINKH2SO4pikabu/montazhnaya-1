# Montazhnaya beta 3.6.26

## Export-resolution-aware source frames

This beta adds bounded, export-resolution-aware source-frame preparation for the frame-accurate local export pipeline.

For a 1280×720 export, the renderer no longer needs full 3840×2160 PNG source frames for ordinary clips. FFmpeg creates an aspect-preserving working frame with oversampling headroom. The planning considers the maximum `clip.scale` used by each source and does not upscale the original media. The working dimensions are logged per source.

The original input media remains untouched. NVDEC source decoding and NVENC output encoding remain available through the existing runtime probes and fallback paths. For hardware decode, frames are still downloaded from CUDA memory before the CPU Lanczos resize and PNG output.

Full-resolution source frames remain in use when needed for 1080p/4K exports or large clip scaling. The 512 MiB actual PNG cache cap, per-frame limits, disk-space checks, and retry with smaller windows remain active.

## Validation

- 208/208 automated tests passed.
- Real FFmpeg test verifies selected-frame count and requested working PNG dimensions.
- Local 48-frame extraction benchmark on the provided 4K60 source:
  - Full resolution: 361.5 MB / 7.05 s
  - 2400×1350 working frames: 190.3 MB / 4.45 s
- Resampling comparison to 720p: SSIM 0.9982, PSNR 54.35 dB.

The local benchmark ran in the available software FFmpeg environment. It does not establish total export speed on the user's GTX 1050. A real Windows NVDEC/NVENC export is still required.
