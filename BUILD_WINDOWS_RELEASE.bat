@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Montazhnaya - Windows release build

echo ==============================================
echo   Montazhnaya beta 3.6.45 - Windows build
echo ==============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.12.0 or newer is required for Electron 45.
  pause
  exit /b 1
)
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd was not found. Reinstall Node.js with npm enabled.
  pause
  exit /b 1
)
node -e "const v=process.versions.node.split('.').map(Number);process.exit(v[0]>22||(v[0]===22&&v[1]>=12)?0:1)"
if errorlevel 1 (
  echo Electron 45 requires Node.js 22.12.0 or newer. Install Node.js 24 LTS.
  pause
  exit /b 1
)
node -e "process.exit(process.arch==='x64'?0:1)"
if errorlevel 1 (
  echo A 64-bit Node.js x64 runtime is required for the Windows x64 release build.
  pause
  exit /b 1
)
echo Verifying tracked app lockfile/SRI, performing npm ci and auditing the exact dependency tree...
npm.cmd run deps:ci
if errorlevel 1 (
  App lockfile is missing/stale or SRI/audit failed. On an online setup, run npm run deps:refresh once, review and preserve package-lock.json, then retry.
  pause
  exit /b 1
)
echo Downloading the checksum-verified Electron runtime...
npm.cmd run electron:install
if errorlevel 1 (
  echo Electron runtime download failed. Check your internet connection and retry.
  pause
  exit /b 1
)
echo Verifying exact Electron version...
set "ELECTRON_VERSION="
for /f "delims=" %%V in ('npm.cmd run --silent electron:version') do set "ELECTRON_VERSION=%%V"
if not "%ELECTRON_VERSION%"=="v45.2.1" (
  echo Expected Electron v45.2.1 but found "%ELECTRON_VERSION%".
  pause
  exit /b 1
)
echo Running regression tests...
npm.cmd test
if errorlevel 1 (
  echo Regression tests failed. Release build stopped.
  pause
  exit /b 1
)
echo Running localization quality audit...
npm.cmd run qa:locales
if errorlevel 1 (
  echo Localization QA failed. Release build stopped.
  pause
  exit /b 1
)
if not exist "tools\release-toolchain\package-lock.json" (
  echo No separate release-toolchain lockfile found. Creating it from the exact electron-builder manifest and auditing it first...
  npm.cmd run release-tools:install
  if errorlevel 1 (
    echo Release toolchain lock generation, installation or npm audit failed. Check registry access and qa\dependency-audit-release-toolchain-latest.json.
    pause
    exit /b 1
  )
  echo Review and commit tools\release-toolchain\package-lock.json before publishing a tag release.
  echo The generated lockfile is intentionally kept separate from the app package-lock.json.
)
echo Verifying the tracked electron-builder lockfile, installing and auditing its exact dependency tree...
npm.cmd run release-tools:ci
if errorlevel 1 (
  echo Release toolchain lockfile is missing/stale or SRI/audit failed. Run npm run release-tools:refresh online once, review and preserve its package-lock.json, then retry.
  pause
  exit /b 1
)
echo.
echo Building Windows x64 NSIS installer and portable executable with local electron-builder 26.18.1...
npm.cmd run dist:win
if errorlevel 1 (
  echo.
  echo Build failed. Review the npm output above.
  pause
  exit /b 1
)
echo.
echo Build completed. Files are in the release folder.
dir /b "release\*.exe"
pause
endlocal
