# Montazhnaya_1

**A free, local-first video editor for Windows — built in public, improved with the community.**

[Русская версия](README_RU.md) · [GitHub repository](https://github.com/DRINKH2SO4pikabu/montazhnaya-1)

Montazhnaya_1 is an independent beta desktop video editor for assembling video, images and audio on a local Windows PC. The original application source code and project documentation are released under **GNU General Public License v3.0 or later (GPL-3.0-or-later)**.

> **Project status:** Public beta source repository, based on the `3.6.45` / Stage 19 snapshot. The automated CI matrix has passed on Windows, Ubuntu and macOS. Windows Setup/Portable binaries have not yet been published. CI success does not certify every hardware configuration, installer or codec. See `PUBLICATION_READINESS_RU.md` for the remaining release gates.

## Why this project exists

I wanted a practical video editor I could use without having to pay for another expensive subscription. Rather than pretending I could build a commercial replacement for professional editing suites overnight, I started making a local tool, learning as I went, and fixing the problems one by one. The intention is to share the result freely and let other people help improve it.

## How it is built

The project was developed through human-led iteration with AI-assisted architecture, coding, testing and documentation. The maintainer reviewed changes, tested the application on Windows and directed the product decisions. See `AI_ASSISTANCE_DISCLOSURE.md` and `COPYRIGHT_AND_AI_PROVENANCE_RU.md` for the provenance and rights notes.

## Current feature set

- Multi-track timeline for video and audio.
- Import of video, still images and audio.
- Drag-and-drop media workflow and numbered media arrangement.
- Transition library with 21 animated demo previews and posters, including the procedural WebGL2 **Fire Whirl** transition. The project maintainer generated the original transition demonstration videos with Grok; see `ASSET_CREDITS.md` and the in-app Help → About attribution.
- Clip split and video speed controls from 0.25× to 4×.
- MP4 export with H.264/AAC and WebM export with VP8/VP9 + Opus, subject to the installed FFmpeg build.
- Frame-grid export, FFprobe validation and encoder selection with runtime checks.
- 36 selectable interface language variants. Russian and English are the established reference interfaces; the other 34 language packs are machine-assisted drafts and need fluent-speaker review.

Hardware encoders (NVIDIA NVENC, AMD AMF and Intel Quick Sync) are selected only after a runtime probe. Their availability depends on the installed FFmpeg build, GPU, driver and Windows environment. Software fallback is available where supported. A passing automated test does not certify every physical GPU.

## What Montazhnaya_1 is — and is not

Montazhnaya_1 is a community project and a beta. It is not presented as a replacement for Adobe Premiere Pro, DaVinci Resolve or other mature professional editors. Export speed, supported source formats, GPU compatibility and UI behavior can vary by hardware and media. Please report reproducible issues with sample media that you have the right to share.

## Development environment

- Windows 10/11 x64 is the primary target.
- Node.js 22.12.0 or newer; Node.js 24 LTS is recommended.
- Electron is pinned in `package.json` and `package-lock.json`.
- FFmpeg and FFprobe are external tools and are **not bundled in this source repository**. Configure `FFMPEG_PATH` / `FFPROBE_PATH` or install compatible tools separately.

See `BUILDING_RU.md` for the current setup flow. The public-source preparation status and remaining legal/release gates are documented in `PUBLICATION_READINESS_RU.md` and `OPEN_SOURCE_PREPARATION_REPORT_RU.md`. The separate Windows release-toolchain lockfile and a network-backed dependency audit must be completed before a public Setup/Portable release.

## License

The original application source code and project documentation are licensed under **GPL-3.0-or-later**. The project logo, selected brand graphics, transition demonstration videos, preview clips and poster images are licensed separately under **CC BY 4.0**. See `LICENSE`, `LICENSE_SCOPE.md`, `ASSET_LICENSE.md` and `ASSET_CREDITS.md`.

Third-party packages, Electron/Chromium and FFmpeg builds retain their own licenses. Grok-generated video material is attributed as **Created with Grok**. The logo and selected brand graphics are credited as AI-generated with ChatGPT and selected/integrated by the maintainer. The code-origin review is documented in `SOURCE_CODE_ORIGIN_AUDIT_RU.md`. See `ASSET_CREDITS.md`, `ASSET_RIGHTS_REGISTER_RU.md` and `THIRD_PARTY_NOTICES.md`.

GPL permits commercial redistribution under its terms. The Montazhnaya maintainers intend to provide official downloads free of charge; GPL does not prevent third parties from charging for redistribution under its terms. Recipients retain the rights granted by GPL, including access to corresponding source when required.

## Contributing

Bug reports, test results from different GPUs, accessibility feedback, translation reviews and code contributions are welcome. Read `CONTRIBUTING.md` and sign off commits using the Developer Certificate of Origin (`DCO.txt`). Contributors retain copyright in their contributions and license them to the project under GPL-3.0-or-later.

## Security

Please do not publish exploitable security details in public issues. Use this repository's **Private vulnerability reporting** feature from the Security tab. See `SECURITY.md`.

## Project links

- Repository: https://github.com/DRINKH2SO4pikabu/montazhnaya-1
- Bug reports and feature requests: https://github.com/DRINKH2SO4pikabu/montazhnaya-1/issues
- Releases: https://github.com/DRINKH2SO4pikabu/montazhnaya-1/releases (official Windows binaries are not published yet).
- Build instructions: `BUILDING_RU.md`.

---

# «Монтажная» / Montazhnaya_1

**Бесплатный локальный видеоредактор для Windows, который мы хотим развивать вместе с сообществом.**

Проект вырос из личной практической задачи: хотелось иметь доступный инструмент для монтажа видео, фотографий и звука без обязательной дорогой подписки. Мы не заявляем, что уже догнали профессиональные монтажные комплексы. Мы открываем исходный код, показываем реальные ограничения и приглашаем людей помогать тестированием и улучшениями.

Программа остаётся бета-версией. Перед публичным выпуском необходимо завершить проверку сторонних лицензий, происхождения демонстрационных материалов, lockfile сборочного инструментария и Windows Setup/Portable. Смотри `PUBLICATION_READINESS_RU.md`.
