# Montazhnaya_1 — public source candidate

## 3.6.45 Beta / Stage 19

The root application dependency manifest pins Electron 45.2.1. This source candidate is based on the Stage 19 development snapshot. It includes the lower timeline Split command, clip speed controls (0.25×–4×), linked-audio speed handling, procedural WebGL2 Fire Whirl, frame-grid MP4/WebM export and FFprobe validation.

### Open-source preparation changes

- Selected GPL-3.0-or-later for original application source and project documentation.
- Added complete `LICENSE`, `LICENSE_SCOPE.md`, `THIRD_PARTY_NOTICES.md`, DCO, contribution and security guidance.
- Added a root npm dependency license inventory and partial CycloneDX SBOM.
- Removed local runtime logs, QA contact sheets and user-context screenshots.
- Restored the 21 transition demo preview MP4s and 21 poster JPGs after the maintainer clarified their Grok-generated provenance; added the required `Created with Grok` attribution to the repository and Help → About dialog.
- Restored the ChatGPT-generated Montazhnaya logo/application icon, with transparent credit that the maintainer selected and integrated the result.
- Adopted CC BY 4.0 for project-controlled logo/brand graphics and the 21 Grok-generated transition demonstrations, preview clips and posters; retained the required `Created with Grok` attribution.

### Known release blockers

- Manual engineering review of source-code origin completed; no specific third-party code fragments requiring separate licensing were found.
- Synthetic test fixtures are generated locally by the project-owned generator and are not committed.
- Generate and commit the missing `tools/release-toolchain/package-lock.json`; run network-backed `npm audit` for both dependency graphs.
- Complete the binary SBOM, verify Electron/Chromium notices in the packaged files, and build/test Windows Setup + Portable on a clean Windows x64 machine.
- Verify actual GPU encoders and exports on physical NVIDIA, AMD and Intel hardware.

This is a beta source candidate, not a signed Windows binary release. FFmpeg/FFprobe are external tools and are not bundled.
