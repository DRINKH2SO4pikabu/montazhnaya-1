# Windows branding package — beta 3.6.32

The product identity is set to **Монтажная**. The Windows executable retains the filesystem-safe name `Montazhnaya.exe`.

The multi-size ICO is used by electron-builder for the Windows executable, NSIS setup and uninstaller. In a packaged run the Electron `BrowserWindow` reads the plain `Montazhnaya.ico` file from the directory beside `Montazhnaya.exe`; in source development it falls back to `assets/montazhnaya.ico`. `app.setName("Монтажная")`, `productName`, NSIS `shortcutName`, and the Windows AppUserModelID keep the application identity consistent. The renderer uses the branded PNG for its favicon and in-app mark. The Windows app user model ID remains `ru.montazhnaya.desktop` so taskbar grouping is stable.

`build.extraFiles` copies `assets/montazhnaya.ico` to `Montazhnaya.ico` and `assets/montazhnaya-icon.png` to `Montazhnaya.png` at the installed application directory root, alongside the executable. This makes the brand assets visibly available in the program folder next to the executable, not only buried in `app.asar` or `resources`.

A source-development run still runs inside the Electron executable and Windows may display the Electron binary's icon in some development contexts. The installed Setup/Portable artifacts must be rebuilt on Windows to verify the actual PE icon resource, taskbar icon and shortcuts. The build config cannot retroactively alter binaries already built from beta 3.6.31.
