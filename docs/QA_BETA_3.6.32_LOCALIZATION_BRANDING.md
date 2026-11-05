# QA — Montazhnaya beta 3.6.32: Windows branding and localization foundation

## Verified in this workspace

- Package version, package-lock root version and lockfile version metadata are synchronized to `3.6.32`.
- The application/product identity is `Монтажная`; the Windows executable name is `Montazhnaya.exe`.
- The multi-size `assets/montazhnaya.ico` is configured for the Windows executable, NSIS installer and uninstaller.
- Packaged `BrowserWindow` loads `Montazhnaya.ico` from the directory beside `process.execPath`; source/development mode falls back to the asset path.
- `build.extraFiles` copies `Montazhnaya.ico` and `Montazhnaya.png` to the installed application directory root.
- NSIS shortcut name and product metadata use `Монтажная`.
- Root-level brand files and packaged source assets are byte-identical; ICO contains multiple Windows icon sizes.
- Russian and English locale packs are loaded locally/offline. System-language detection selects only an installed pack and falls back to Russian.
- The English dictionary contains 432 entries and covers the main interface, transition catalog, clip/media properties, transforms, color correction, titles, audio controls, slideshow setup, still-frame export and FFmpeg diagnostics.
- Exact-string translation, placeholder-aware dynamic messages, DOM updates, input attributes and locale-aware duration/file-size formatting are wired.
- Media names, clip labels, project profile data and textarea/user-entered content remain excluded from automatic translation.
- The language picker lists 24 future locales as disabled/planned. They are not claimed as translated in this build.
- Build/setup/PowerShell launch banners and NVENC log name refer to beta `3.6.32`.
- Both PowerShell launchers contain one UTF-8 BOM, not two.

## Automated verification

- Node test suite: **272/272 PASS**.
- `node --check`: all CommonJS tests/modules, renderer locale scripts and the inline renderer script pass syntax checks.
- ZIP integrity: **PASS**, 213 files included; branded root icon files and English locale pack are present.

## Not verified in this workspace

- A new Windows Setup/Portable executable was not built here. Run `BUILD_WINDOWS_RELEASE.bat` on Windows 10/11 x64 with Node.js 22+ and internet access, then inspect the Setup, Portable, desktop/Start Menu shortcuts, taskbar icon, and `Montazhnaya.ico`/`Montazhnaya.png` beside `Montazhnaya.exe` in the install folder.
- The full UI was not interactively exercised in Electron after the localization changes. The English pack is substantial, but uncommon dynamic notifications, some contextual-help prose and rare validation paths still fall back to Russian.
- Only Russian and English are enabled. The other 24 locale identifiers are a roadmap and require complete translation, layout tests and native-language review before being enabled.
- Electron remains pinned to 37.10.3 pending a separately tested major-version upgrade. The project license has not yet been selected.
