param()

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$ffmpegRoot = Join-Path $env:LOCALAPPDATA "Montazhnaya\ffmpeg-8.0.1-nvenc-api13.0"
$ffmpeg = Join-Path $ffmpegRoot "ffmpeg.exe"
$ffprobe = Join-Path $ffmpegRoot "ffprobe.exe"
$logPath = Join-Path $projectRoot "beta-3.6.45-nvenc.log"

if (-not (Test-Path -LiteralPath $ffmpeg -PathType Leaf)) {
    throw "Не найден совместимый FFmpeg: $ffmpeg. Сначала выполните tools\Test-Montazhnaya-NVENC-API13.0.ps1."
}
if (-not (Test-Path -LiteralPath $ffprobe -PathType Leaf)) {
    throw "Не найден совместимый FFprobe: $ffprobe. Повторите установку тестовой сборки FFmpeg."
}
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "package.json") -PathType Leaf)) {
    throw "Не найден package.json. Запустите скрипт из папки tools проекта «Монтажная»."
}
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "node_modules\electron\dist\electron.exe") -PathType Leaf)) {
    throw "Зависимости Electron не установлены. В корне проекта выполните npm.cmd install."
}

$previousFfmpeg = $env:FFMPEG_PATH
$previousFfprobe = $env:FFPROBE_PATH

try {
    $env:FFMPEG_PATH = $ffmpeg
    $env:FFPROBE_PATH = $ffprobe
    Push-Location -LiteralPath $projectRoot
    Write-Host "Запуск «Монтажной» beta 3.6.45 с совместимым FFmpeg / NVENC API 13.0..."
    Write-Host "FFmpeg: $ffmpeg"
    Write-Host "FFprobe: $ffprobe"
    Write-Host "Журнал: $logPath"
    & npm.cmd start 2>&1 | Tee-Object -FilePath $logPath
}
finally {
    if ($null -eq $previousFfmpeg) {
        Remove-Item Env:FFMPEG_PATH -ErrorAction SilentlyContinue
    } else {
        $env:FFMPEG_PATH = $previousFfmpeg
    }
    if ($null -eq $previousFfprobe) {
        Remove-Item Env:FFPROBE_PATH -ErrorAction SilentlyContinue
    } else {
        $env:FFPROBE_PATH = $previousFfprobe
    }
    if ((Get-Location).Path -eq $projectRoot) {
        Pop-Location
    }
}
