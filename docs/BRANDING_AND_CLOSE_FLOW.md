# Фирменный значок и закрытие приложения

## Assets
- `assets/montazhnaya.ico` — multi-size Windows icon for the executable, installer/uninstaller and BrowserWindow.
- `assets/montazhnaya-icon.png` — 512×512 master icon.
- `assets/montazhnaya-icon-256.png` — renderer brand mark and favicon.

## Close behavior
The main process intercepts BrowserWindow close requests and queries the renderer's top-level `AppState.dirty` lexical binding. A clean project closes immediately. A dirty project displays a native warning with «Выйти без сохранения» and «Отмена». The renderer `beforeunload` listener performs resource cleanup only and no longer prevents navigation.

## Build
Rebuild Windows NSIS and portable targets after `npm ci` using `BUILD_WINDOWS_RELEASE.bat`. Validate app icon on title bar, taskbar, EXE, installer, uninstaller and shortcuts. Test clean close, dirty close, cancel, and discard on Windows 10/11.
