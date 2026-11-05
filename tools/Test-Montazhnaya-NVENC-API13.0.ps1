[CmdletBinding()]
param(
    [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-NativeCapture {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $FilePath
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true

    $quoted = foreach ($arg in $Arguments) {
        $value = [string]$arg
        if ($value -match '[\s"]') {
            '"' + $value.Replace('"', '\"') + '"'
        } else {
            $value
        }
    }
    $psi.Arguments = $quoted -join ' '

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    [void]$process.Start()
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $stdout = $stdoutTask.Result
    $stderr = $stderrTask.Result
    return [pscustomobject]@{
        ExitCode = $process.ExitCode
        StdOut = [string]$stdout
        StdErr = [string]$stderr
        Text = ([string]$stdout + [string]$stderr).Trim()
    }
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'package.json'))) {
    throw "Не найден package.json в '$ProjectRoot'. Запусти скрипт из папки проекта, где находится package.json, или передай -ProjectRoot."
}

$downloadUrl = 'https://github.com/GyanD/codexffmpeg/releases/download/8.0.1/ffmpeg-8.0.1-full_build.zip'
$expectedSha256 = '467CDE100A47ED4B03A897988AEB4A296890C1E2B2D2864204657D002BC5FB90'
$root = Join-Path $env:LOCALAPPDATA 'Montazhnaya\ffmpeg-8.0.1-nvenc-api13.0'
$archive = Join-Path $env:TEMP 'montazhnaya-ffmpeg-8.0.1-full_build.zip'
$extractDir = Join-Path $env:TEMP ('montazhnaya-ffmpeg-8.0.1-' + [guid]::NewGuid().ToString('N'))
$smokePath = Join-Path $env:TEMP 'montazhnaya-nvenc-smoke-test.mp4'
$logPath = Join-Path $ProjectRoot 'beta-3.6.25-nvenc-api13.0.log'

# Initialize before entering strict mode-sensitive control flow.
$actualSha256 = ''

# Preserve any environment overrides that were already present in the user's shell.
$previousFfmpegPath = $env:FFMPEG_PATH
$previousFfprobePath = $env:FFPROBE_PATH

Write-Host ''
Write-Host '=== Монтажная: проверка совместимого FFmpeg / NVENC ===' -ForegroundColor Cyan
Write-Host 'Существующая папка FFmpeg и системный PATH не изменяются.'
Write-Host 'Пакет будет установлен в отдельную папку LocalAppData.'
Write-Host ''

try {
    if (Test-Path -LiteralPath $archive) {
        $existingHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
        if ($existingHash -ne $expectedSha256) {
            Remove-Item -LiteralPath $archive -Force
        }
    }

    if (-not (Test-Path -LiteralPath $archive)) {
        Write-Host 'Загружаю FFmpeg 8.0.1 с официального релиза Gyan...' -ForegroundColor Yellow
        Invoke-WebRequest -Uri $downloadUrl -OutFile $archive -UseBasicParsing
    } else {
        Write-Host 'Найден ранее загруженный архив; проверяю SHA-256...' -ForegroundColor Yellow
    }

    if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) {
        throw "Архив FFmpeg не найден после загрузки: $archive"
    }

    $hashRecord = Get-FileHash -LiteralPath $archive -Algorithm SHA256 -ErrorAction Stop
    if ($null -eq $hashRecord -or [string]::IsNullOrWhiteSpace([string]$hashRecord.Hash)) {
        throw 'PowerShell не смог получить SHA-256 загруженного архива.'
    }
    $actualSha256 = [string]$hashRecord.Hash
    if (-not [string]::Equals($actualSha256, $expectedSha256, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "SHA-256 не совпал. Ожидался $expectedSha256, получен $actualSha256. Архив не будет использоваться."
    }
    Write-Host "SHA-256 совпал: $actualSha256" -ForegroundColor Green

    if (Test-Path -LiteralPath $root) {
        Remove-Item -LiteralPath $root -Recurse -Force
    }
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
    Expand-Archive -LiteralPath $archive -DestinationPath $extractDir -Force

    $ffmpegItem = Get-ChildItem -LiteralPath $extractDir -Filter 'ffmpeg.exe' -File -Recurse | Select-Object -First 1
    $ffprobeItem = Get-ChildItem -LiteralPath $extractDir -Filter 'ffprobe.exe' -File -Recurse | Select-Object -First 1
    if (-not $ffmpegItem -or -not $ffprobeItem) {
        throw 'В архиве не найдены ffmpeg.exe и ffprobe.exe.'
    }
    $sourceBin = $ffmpegItem.Directory.FullName
    Copy-Item -Path (Join-Path $sourceBin '*') -Destination $root -Recurse -Force
    $ffmpeg = Join-Path $root 'ffmpeg.exe'
    $ffprobe = Join-Path $root 'ffprobe.exe'
    if (-not (Test-Path -LiteralPath $ffmpeg) -or -not (Test-Path -LiteralPath $ffprobe)) {
        throw 'Не удалось подготовить отдельную папку FFmpeg.'
    }

    $version = Invoke-NativeCapture -FilePath $ffmpeg -Arguments @('-version')
    if ($version.ExitCode -ne 0 -or $version.Text -notmatch 'ffmpeg version 8\.0\.1') {
        throw "Неожиданная версия FFmpeg: $($version.Text)"
    }
    Write-Host ($version.StdOut -split "`r?`n" | Select-Object -First 1) -ForegroundColor Green

    $encoderHelp = Invoke-NativeCapture -FilePath $ffmpeg -Arguments @('-hide_banner', '-h', 'encoder=h264_nvenc')
    if ($encoderHelp.ExitCode -ne 0 -or $encoderHelp.Text -notmatch 'h264_nvenc') {
        throw "Эта сборка не содержит h264_nvenc. Вывод: $($encoderHelp.Text)"
    }
    if ($encoderHelp.Text -notmatch '(?m)\bcbr_padding\b' -or $encoderHelp.Text -notmatch '(?m)\bstrict_gop\b') {
        throw 'Сборка FFmpeg не предоставляет параметры cbr_padding и strict_gop, необходимые профилю NVENC beta 3.6.25. Обновление приложения отменено; системный FFmpeg не затронут.'
    }
    Write-Host 'Параметры NVENC CBR подтверждены: cbr_padding + strict_gop.' -ForegroundColor Green

    Write-Host 'Запускаю реальное аппаратное кодирование 1-секундного теста...' -ForegroundColor Yellow
    if (Test-Path -LiteralPath $smokePath) { Remove-Item -LiteralPath $smokePath -Force }
    $smoke = Invoke-NativeCapture -FilePath $ffmpeg -Arguments @(
        '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
        '-f', 'lavfi', '-i', 'color=c=black:s=128x128:r=30:d=1',
        '-frames:v', '30', '-an',
        '-c:v', 'h264_nvenc', '-preset', 'p4', '-rc', 'cbr',
        '-b:v', '1000000', '-maxrate', '1000000', '-bufsize', '2000000',
        '-strict_gop', '1', '-cbr_padding', '1',
        '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        $smokePath
    )

    if ($smoke.ExitCode -eq 0 -and (Test-Path -LiteralPath $smokePath)) {
        $probe = Invoke-NativeCapture -FilePath $ffprobe -Arguments @(
            '-v', 'error', '-select_streams', 'v:0',
            '-show_entries', 'stream=codec_name,profile,width,height,avg_frame_rate,nb_frames',
            '-of', 'default=noprint_wrappers=1', $smokePath
        )
        if ($probe.ExitCode -ne 0 -or $probe.Text -notmatch 'codec_name=h264') {
            throw "NVENC завершился, но ffprobe не подтвердил H.264. $($probe.Text)"
        }
        Write-Host 'NVENC CBR SMOKE TEST: PASS' -ForegroundColor Green
        Write-Host $probe.Text
        Remove-Item -LiteralPath $smokePath -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host 'NVENC CBR SMOKE TEST: FAIL' -ForegroundColor Red
        Write-Host $smoke.Text -ForegroundColor Red
        Remove-Item -LiteralPath $smokePath -Force -ErrorAction SilentlyContinue
        throw 'Пробное NVENC CBR-кодирование не прошло. beta 3.6.25 не будет запущена с неподтверждённым CBR-профилем.'
    }

    Write-Host ''
    Write-Host "FFMPEG_PATH = $ffmpeg" -ForegroundColor Cyan
    Write-Host "FFPROBE_PATH = $ffprobe" -ForegroundColor Cyan
    Write-Host 'Запускаю beta 3.6.25 с отдельной сборкой FFmpeg и NVENC CBR. После закрытия приложения журнал останется в папке проекта.' -ForegroundColor Yellow
    Write-Host ''

    $env:FFMPEG_PATH = $ffmpeg
    $env:FFPROBE_PATH = $ffprobe
    if (Test-Path -LiteralPath $logPath) { Remove-Item -LiteralPath $logPath -Force }
    $cmdArgs = '/d /c npm.cmd start > "' + $logPath + '" 2>&1'
    $appProcess = Start-Process -FilePath $env:ComSpec -ArgumentList $cmdArgs -WorkingDirectory $ProjectRoot -Wait -PassThru -NoNewWindow

    Write-Host ''
    Write-Host "Приложение закрыто. Журнал: $logPath" -ForegroundColor Green
    if (Test-Path -LiteralPath $logPath) {
        $markers = Select-String -LiteralPath $logPath -Pattern 'h264_nvenc|NVDEC_PROBE_PASS|NVDEC_WINDOW_FALLBACK|NVDEC_SOFTWARE_FALLBACK|videoEncoder|программный кодировщик' -CaseSensitive:$false
        if ($markers) { $markers | ForEach-Object { Write-Host $_.Line } }
    }
    Write-Host 'Пришли файл beta-3.6.25-nvenc-api13.0.log и результат тестового экспорта.' -ForegroundColor Cyan
}
catch {
    Write-Host ''
    Write-Host 'ОШИБКА ПОДГОТОВКИ NVENC-ТЕСТА:' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host 'Системный FFmpeg и драйвер NVIDIA не изменялись.' -ForegroundColor Yellow
    throw
}
finally {
    if (Test-Path -LiteralPath $extractDir) {
        Remove-Item -LiteralPath $extractDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $archive) {
        Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $smokePath) {
        Remove-Item -LiteralPath $smokePath -Force -ErrorAction SilentlyContinue
    }
    if ($null -eq $previousFfmpegPath) {
        Remove-Item Env:\FFMPEG_PATH -ErrorAction SilentlyContinue
    } else {
        $env:FFMPEG_PATH = $previousFfmpegPath
    }
    if ($null -eq $previousFfprobePath) {
        Remove-Item Env:\FFPROBE_PATH -ErrorAction SilentlyContinue
    } else {
        $env:FFPROBE_PATH = $previousFfprobePath
    }
}
