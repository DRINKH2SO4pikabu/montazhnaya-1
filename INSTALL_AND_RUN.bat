@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo   Montazhnaya beta 3.6.45 - first-time setup
echo ==============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.12.0 or newer is required for Electron 45. Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd was not found. Reinstall Node.js with the npm feature enabled.
  pause
  exit /b 1
)
node -e "const v=process.versions.node.split('.').map(Number);process.exit(v[0]>22||(v[0]===22&&v[1]>=12)?0:1)"
if errorlevel 1 (
  echo Electron 45 requires Node.js 22.12.0 or newer. Install Node.js 24 LTS.
  pause
  exit /b 1
)
echo Synchronizing the pinned app dependency lock, checking SRI and installing the audited tree...
npm.cmd run deps:install
if errorlevel 1 (
  echo Dependency lock refresh, SRI validation, installation or npm audit failed. Check npm registry access and the report in qa.
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
echo.
echo Setup complete. Starting Montazhnaya...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Start-Montazhnaya.ps1"
if errorlevel 1 pause
endlocal
