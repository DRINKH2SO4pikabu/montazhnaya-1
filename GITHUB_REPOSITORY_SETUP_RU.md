# Настройка GitHub-репозитория Montazhnaya_1

## Идентификаторы

- Repository: `montazhnaya-1`
- Product display name: `Montazhnaya_1`
- Description: `Free, local-first Windows video editor. Built openly and improved with the community.`
- Suggested topics: `video-editor`, `electron`, `ffmpeg`, `windows`, `open-source`, `webgl2`, `nonlinear-editor`
- Default branch: `main`
- Visibility: Public. The source candidate has completed the licensing and asset-provenance review; perform the final local secret scan before the first push.

Перед первым push см. пошаговую инструкцию `PUSH_TO_GITHUB_RU.md`.

## Первые настройки

1. Add root `LICENSE` (GPL-3.0-or-later) and `THIRD_PARTY_NOTICES.md`.
2. Replace README and CHANGELOG with current Stage 19 status and known limitations.
3. Enable Issues and Discussions; disable Wiki until documentation is maintained.
4. Enable Dependabot alerts and weekly updates for both `/` and `/tools/release-toolchain`.
5. Enable Secret Scanning and Push Protection where available.
6. Enable Private Vulnerability Reporting.
7. Protect `main`: require pull requests, block force pushes and branch deletion. Do not require approving reviews while the maintainer is working alone. Add required CI status checks only after the first successful Actions run.
8. Keep workflow default permissions read-only; `contents: write` is scoped to the Windows release job that creates draft releases.
9. The bundled workflows pin `actions/checkout`, `actions/setup-node`, `actions/upload-artifact` and `softprops/action-gh-release` to full commit SHAs. Recheck upstream action commits when deliberately updating them.
10. Add CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, issue forms and PR template.
11. Create a beta prerelease only after dependency, license, asset and Windows build gates pass.

## First release

Use a prerelease tag such as `v3.6.45-beta.1` only after deciding whether the public product version continues the existing `3.6.45` sequence. Attach:

- Windows x64 Setup;
- Windows x64 Portable;
- SHA-256 file;
- SBOM;
- third-party notices and exact FFmpeg acquisition guidance;
- corresponding source archive/commit;
- QA summary and known limitations.

Do not upload a standalone FFmpeg binary unless the exact binary's license/source obligations have been fulfilled.
