@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Montazhnaya - dependency security and Windows x64 build

echo ============================================================
echo   Montazhnaya beta 3.6.45 - dependency security + Windows x64
echo ============================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.12.0 or newer is required. Install Node.js 24 LTS.
  pause
  exit /b 1
)
node -e "const v=process.versions.node.split('.').map(Number);process.exit(v[0]>22||(v[0]===22&&v[1]>=12)?0:1)"
if errorlevel 1 (
  echo Electron 45 requires Node.js 22.12.0 or newer. Install Node.js 24 LTS.
  pause
  exit /b 1
)
if not "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
  echo Windows x64 is required. Detected: %PROCESSOR_ARCHITECTURE%.
  pause
  exit /b 1
)
echo The release batch creates and audits the separate builder lockfile if it is missing.
echo It then repeats the strict locked install and runs the Windows x64 packaging gate.
call "%~dp0BUILD_WINDOWS_RELEASE.bat"
exit /b %ERRORLEVEL%
