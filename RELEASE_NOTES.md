# Montazhnaya 3.6.45 Beta / Stage 19

The first public Windows x64 beta release of Montazhnaya_1. The packaged application uses Electron 45.2.1.

## What is included

- Multi-track timeline for video, images and audio.
- Import and arrangement of media, including drag-and-drop workflows.
- Project preview and clip parameter controls.
- Transition library with animated previews.
- MP4 export (H.264/AAC) and WebM export, depending on the available FFmpeg build.
- Frame-grid export and FFprobe validation.
- Clip splitting and playback speed controls from 0.25× to 4×.
- 36 interface language variants. Russian and English are the reference interfaces; the other 34 language packs are machine-assisted drafts and need fluent-speaker review.

## Windows downloads

The release contains:
- **Setup** — standard Windows installer.
- **Portable** — standalone package that does not require a conventional installation.
- SHA-256 checksums for both executables and a consolidated `SHA256SUMS.txt`.
- CycloneDX SBOMs for the application dependencies and Windows release toolchain.

## System requirements and important notes

- Windows 10/11 x64.
- The Windows Setup and Portable executables are **not digitally signed**. Windows SmartScreen or security software may display a warning; verify the SHA-256 checksum and download only from this official GitHub release.
- FFmpeg and FFprobe are **not bundled**. Install a compatible build separately and configure it through PATH or the application's FFmpeg/FFprobe settings. Do not download FFmpeg from unofficial mirrors.
- Hardware encoding depends on the GPU, driver and FFmpeg build. NVIDIA, AMD and Intel hardware configurations are not universally certified.
- This is a beta release for testing and smaller editing tasks. It is not presented as a replacement for mature professional editing suites. Export speed and supported media formats can vary by system.

## Licensing

- Original application source code and project documentation: GPL-3.0-or-later.
- Project-controlled logo, selected brand graphics and transition demonstration media: CC BY 4.0, with attribution described in the repository.
- Electron/Chromium and all other third-party components retain their own licenses. The packaged application includes Electron and Chromium license notices.
- FFmpeg/FFprobe are external tools and are not redistributed in this release.

## Feedback

Please report reproducible bugs, export problems, translation issues and compatibility results through [GitHub Issues](https://github.com/DRINKH2SO4pikabu/montazhnaya-1/issues). Include Windows version, CPU/GPU, driver version, source media details and the export settings when relevant.
