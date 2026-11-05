param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $projectRoot "montazhnaya-launch.log"
$previousFfmpeg = $env:FFMPEG_PATH
$previousFfprobe = $env:FFPROBE_PATH
$previousOutputEncoding = $OutputEncoding
$previousConsoleEncoding = [Console]::OutputEncoding
$exitCode = 0

function Resolve-MontazhnayaTool {
    param(
        [Parameter(Mandatory = $true)][string]$EnvironmentName,
        [Parameter(Mandatory = $true)][string]$ExecutableName
    )

    $configuredPath = [Environment]::GetEnvironmentVariable($EnvironmentName)
    if (-not [string]::IsNullOrWhiteSpace($configuredPath) -and (Test-Path -LiteralPath $configuredPath -PathType Leaf)) {
        return (Resolve-Path -LiteralPath $configuredPath).Path
    }

    $managedPath = Join-Path $env:LOCALAPPDATA ("Montazhnaya\ffmpeg-8.0.1-nvenc-api13.0\" + $ExecutableName)
    if (Test-Path -LiteralPath $managedPath -PathType Leaf) {
        return (Resolve-Path -LiteralPath $managedPath).Path
    }

    $command = Get-Command $ExecutableName -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command -and $command.Source -and (Test-Path -LiteralPath $command.Source -PathType Leaf)) {
        return $command.Source
    }

    return $null
}

try {
    # Keep Russian diagnostics readable in Windows PowerShell 5.1 / console hosts.
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [Console]::OutputEncoding = $utf8
    $OutputEncoding = $utf8
    try { & "$env:SystemRoot\System32\chcp.com" 65001 *> $null } catch { }

    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "package.json") -PathType Leaf)) {
        throw "Не найден package.json. Запустите файл из распакованной папки «Монтажной»."
    }
    $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $nodeCommand) { throw "Node.js 22.12.0 или новее не найден. Установите Node.js 24 LTS и повторите запуск." }
    $nodeVersionText = (& $nodeCommand.Source -p "process.versions.node" 2>$null | Out-String).Trim()
    try { $nodeVersion = [version]$nodeVersionText } catch { throw "Не удалось определить версию Node.js: '$nodeVersionText'." }
    if ($nodeVersion -lt [version]"22.12.0") {
        throw "Для Electron 45 требуется Node.js 22.12.0 или новее. Сейчас установлена версия $nodeVersionText."
    }
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $npmCommand) { throw "npm.cmd не найден. Переустановите Node.js с компонентом npm." }

    $electronPackage = Join-Path $projectRoot "node_modules\electron\package.json"
    $extractorPackage = Join-Path $projectRoot "node_modules\@electron-internal\extract-zip\package.json"
    $electronExecutable = Join-Path $projectRoot "node_modules\electron\dist\electron.exe"
    $installedElectronVersion = $null
    $installedExtractorVersion = $null
    if (Test-Path -LiteralPath $electronPackage -PathType Leaf) {
        try { $installedElectronVersion = (Get-Content -LiteralPath $electronPackage -Raw | ConvertFrom-Json).version } catch { $installedElectronVersion = $null }
    }
    if (Test-Path -LiteralPath $extractorPackage -PathType Leaf) {
        try { $installedExtractorVersion = (Get-Content -LiteralPath $extractorPackage -Raw | ConvertFrom-Json).version } catch { $installedExtractorVersion = $null }
    }
    Push-Location -LiteralPath $projectRoot
    try {
        if ($installedElectronVersion -ne "45.2.1" -or $installedExtractorVersion -ne "1.0.8") {
            Write-Host "Первый запуск или обнаружена старая зависимость: синхронизируем lockfile, проверяем SRI и устанавливаем зависимости..."
            & npm.cmd run deps:install
            if ($LASTEXITCODE -ne 0) {
                throw "Не удалось обновить lockfile, установить или проверить зависимости. Проверьте доступ к npm registry и отчёт в папке qa."
            }
        }
        if (-not (Test-Path -LiteralPath $electronExecutable -PathType Leaf)) {
            Write-Host "Первый запуск: загружаем checksum-проверенный runtime Electron 45.2.1..."
            & npm.cmd run electron:install
            if ($LASTEXITCODE -ne 0) {
                throw "Не удалось загрузить Electron runtime. Проверьте подключение к интернету и повторите запуск."
            }
        }
        if (-not (Test-Path -LiteralPath $electronExecutable -PathType Leaf)) {
            throw "Electron runtime не появился после загрузки. Повторите npm.cmd run electron:install."
        }
        $runtimeVersion = (& npm.cmd run --silent electron:version 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or $runtimeVersion -notmatch '^v?45\.2\.1$') {
            throw "Обнаружен неожиданный Electron runtime ('$runtimeVersion'); для этой версии программы требуется 45.2.1."
        }
    } finally {
        Pop-Location
    }

    $ffmpeg = Resolve-MontazhnayaTool -EnvironmentName "FFMPEG_PATH" -ExecutableName "ffmpeg.exe"
    $ffprobe = Resolve-MontazhnayaTool -EnvironmentName "FFPROBE_PATH" -ExecutableName "ffprobe.exe"

    if ($ffmpeg) {
        $env:FFMPEG_PATH = $ffmpeg
        Write-Host "FFmpeg: $ffmpeg"
    } else {
        Write-Warning "FFmpeg не найден. Редактор запустится, но экспорт потребует FFmpeg.exe. Установите FFmpeg и добавьте его в PATH либо задайте FFMPEG_PATH."
    }

    if ($ffprobe) {
        $env:FFPROBE_PATH = $ffprobe
        Write-Host "FFprobe: $ffprobe"
    } else {
        Write-Warning "FFprobe не найден. Диагностика медиа и проверка результата экспорта будут ограничены. Установите ffprobe.exe и задайте PATH или FFPROBE_PATH."
    }

    Write-Host "Запуск «Монтажной» beta 3.6.45..."
    Write-Host "Журнал: $logPath"
    Push-Location -LiteralPath $projectRoot
    try {
        & npm.cmd start 2>&1 | Tee-Object -FilePath $logPath
        $exitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
} catch {
    Write-Error $_
    $exitCode = 1
} finally {
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
    $OutputEncoding = $previousOutputEncoding
    [Console]::OutputEncoding = $previousConsoleEncoding
}

if ($exitCode -ne 0) {
    exit $exitCode
}
