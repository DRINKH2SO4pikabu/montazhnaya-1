# Contributing to Montazhnaya_1

Thanks for helping improve a free community video editor. Small, reproducible bug reports and hardware test results are valuable; you do not need to submit code to help.

## Before opening an issue

- Search existing issues.
- Use the current supported beta and describe the exact version/commit.
- Include Windows build, CPU, GPU and driver version.
- Include FFmpeg/FFprobe versions and output from the app diagnostics.
- Describe exact steps and the expected/actual result.
- Never attach private footage, copyrighted media, personal logs or files you do not have permission to share. Use a short synthetic sample when possible.

## Code contributions

1. Open an issue or discussion for larger changes first.
2. Keep changes focused and add regression tests.
3. Run `npm test`, `npm run qa:locales`, syntax checks and relevant FFmpeg integration tests.
4. Do not claim hardware support based only on the presence of a codec in `ffmpeg -encoders`; require a real runtime probe.
5. Do not add third-party code, images, fonts, video or audio without provenance and compatible license information.
6. Sign off every commit with `git commit -s` to accept the Developer Certificate of Origin in `DCO.txt`.

## License of contributions

Original application source code and project documentation are licensed under GPL-3.0-or-later. Contributors retain copyright in their contributions and license them under the same terms when they submit a signed-off contribution. No copyright assignment or CLA is requested by this template.

## AI-assisted contributions

AI assistance is allowed, but the human contributor must review, understand and test the contribution, disclose substantial AI assistance in the PR, and be able to confirm that the contribution does not knowingly reproduce incompatible third-party code or assets. AI output is not automatically unique or rights-cleared.
