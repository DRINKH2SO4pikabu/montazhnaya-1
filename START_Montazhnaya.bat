@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Start-Montazhnaya.ps1"
if errorlevel 1 (
  echo.
  echo Launch failed. See the message above.
  pause
)
endlocal
