[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$FfmpegPath,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$InputVideoPath,

    [string]$ReportDirectory = (Join-Path $PSScriptRoot "..\gpu-diagnostics")
)

$ErrorActionPreference = 'Stop'

$ffmpegResolved = (Resolve-Path -LiteralPath $FfmpegPath).Path
$inputResolved = (Resolve-Path -LiteralPath $InputVideoPath).Path
$ffprobePath = Join-Path (Split-Path -Parent $ffmpegResolved) 'ffprobe.exe'
if (-not (Test-Path -LiteralPath $ffprobePath -PathType Leaf)) {
    throw "Рядом с ffmpeg.exe не найден ffprobe.exe: $ffprobePath. Используйте одну сборку FFmpeg/FFprobe."
}

$null = New-Item -ItemType Directory -Force -Path $ReportDirectory
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = Join-Path (Resolve-Path -LiteralPath $ReportDirectory).Path "gpu-check-$stamp.txt"
$lines = New-Object 'System.Collections.Generic.List[string]'
$results = New-Object 'System.Collections.Generic.List[object]'

function Add-Section([string]$Title) {
    $script:lines.Add('')
    $script:lines.Add(('=' * 72))
    $script:lines.Add($Title)
    $script:lines.Add(('=' * 72))
}

function Invoke-LoggedCommand([string]$Label, [string]$Executable, [string[]]$Arguments) {
    Add-Section $Label
    $script:lines.Add(('COMMAND: ' + $Executable + ' ' + ($Arguments -join ' ')))
    $output = @(& $Executable @Arguments 2>&1 | ForEach-Object { [string]$_ })
    $exitCode = $LASTEXITCODE
    foreach ($line in $output) { $script:lines.Add($line) }
    $script:lines.Add("EXIT_CODE: $exitCode")
    $entry = [pscustomobject]@{ Name = $Label; ExitCode = $exitCode; Output = ($output -join [Environment]::NewLine) }
    $script:results.Add($entry)
    return $entry
}

$lines.Add('Montazhnaya GPU diagnostics')
$lines.Add("Date: $(Get-Date -Format o)")
$lines.Add("FFmpeg: $ffmpegResolved")
$lines.Add("FFprobe: $ffprobePath")
$lines.Add("Input: $inputResolved")

$null = Invoke-LoggedCommand 'FFmpeg version' $ffmpegResolved @('-hide_banner', '-version')
$hwaccel = Invoke-LoggedCommand 'Compiled hardware acceleration methods' $ffmpegResolved @('-hide_banner', '-hwaccels')
$encoders = Invoke-LoggedCommand 'Compiled H.264 encoders' $ffmpegResolved @('-hide_banner', '-encoders')

Add-Section 'NVIDIA driver information'
if (Get-Command 'nvidia-smi.exe' -ErrorAction SilentlyContinue) {
    $nvidiaOutput = @(& nvidia-smi.exe 2>&1 | ForEach-Object { [string]$_ })
    $nvidiaExit = $LASTEXITCODE
    foreach ($line in $nvidiaOutput) { $lines.Add($line) }
    $lines.Add("EXIT_CODE: $nvidiaExit")
} elseif (Get-Command 'nvidia-smi' -ErrorAction SilentlyContinue) {
    $nvidiaOutput = @(& nvidia-smi 2>&1 | ForEach-Object { [string]$_ })
    $nvidiaExit = $LASTEXITCODE
    foreach ($line in $nvidiaOutput) { $lines.Add($line) }
    $lines.Add("EXIT_CODE: $nvidiaExit")
} else {
    $lines.Add('nvidia-smi was not found in PATH.')
}

Add-Section 'Source video metadata'
$probeOutput = @(& $ffprobePath -v error -select_streams v:0 -show_entries 'stream=codec_name,pix_fmt,width,height,avg_frame_rate' -of json $inputResolved 2>&1 | ForEach-Object { [string]$_ })
$probeExit = $LASTEXITCODE
foreach ($line in $probeOutput) { $lines.Add($line) }
$lines.Add("EXIT_CODE: $probeExit")
if ($probeExit -ne 0) { throw 'ffprobe не смог прочитать исходное видео. Отчёт частично сохранён только после завершения скрипта.' }
$metadata = (($probeOutput -join [Environment]::NewLine) | ConvertFrom-Json)
$video = @($metadata.streams)[0]
$lines.Add("PIX_FMT: $($video.pix_fmt)")
$lines.Add("VIDEO_CODEC: $($video.codec_name)")
$lines.Add("SIZE: $($video.width)x$($video.height)")
$lines.Add("FPS: $($video.avg_frame_rate)")

$null = Invoke-LoggedCommand 'CPU software decode one frame' $ffmpegResolved @(
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-xerror',
    '-i', $inputResolved, '-map', '0:v:0', '-an', '-frames:v', '1', '-f', 'null', 'NUL'
)

$null = Invoke-LoggedCommand 'NVENC H.264 one-frame encode' $ffmpegResolved @(
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-xerror',
    '-f', 'lavfi', '-i', 'color=c=black:s=128x128:r=1:d=1',
    '-frames:v', '1', '-an', '-c:v', 'h264_nvenc', '-preset', 'p4', '-f', 'null', 'NUL'
)

$downloadFormat = switch ([string]$video.pix_fmt) {
    { $_ -in @('yuv420p', 'yuvj420p', 'nv12') } { 'nv12'; break }
    { $_ -in @('yuv420p10le', 'p010le') } { 'p010le'; break }
    default { $null }
}
if ($downloadFormat) {
    $null = Invoke-LoggedCommand "NVDEC CUDA one-frame decode ($downloadFormat)" $ffmpegResolved @(
        '-hide_banner', '-loglevel', 'error', '-nostdin', '-xerror',
        '-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda',
        '-i', $inputResolved, '-map', '0:v:0', '-an',
        '-vf', "hwdownload,format=$downloadFormat", '-frames:v', '1', '-f', 'null', 'NUL'
    )
} else {
    Add-Section 'NVDEC CUDA one-frame decode'
    $lines.Add("SKIPPED: unsupported source pixel format '$($video.pix_fmt)'. Software decode remains available.")
}

Add-Section 'Summary'
foreach ($result in $results) {
    $status = if ($result.ExitCode -eq 0) { 'PASS' } else { 'FAIL' }
    $lines.Add(('{0}: {1} (exit {2})' -f $result.Name, $status, $result.ExitCode))
}
$lines.Add('Note: listing CUDA or h264_nvenc only shows compiled support. A PASS from the corresponding one-frame runtime probe is required to confirm actual device use.')
[System.IO.File]::WriteAllLines($reportPath, $lines.ToArray(), [System.Text.UTF8Encoding]::new($true))
Write-Host "Отчёт сохранён: $reportPath"
Write-Host 'Сводка:'
foreach ($result in $results) {
    $status = if ($result.ExitCode -eq 0) { 'PASS' } else { 'FAIL' }
    Write-Host ("  {0}: {1}" -f $result.Name, $status)
}
