param(
    [string]$OutputDirectory = "",
    [int]$DevToolsPort = 9337,
    [switch]$KeepWorkingCopy
)

$ErrorActionPreference = "Stop"

$repository = "DRINKH2SO4pikabu/montazhnaya-1"
$workRoot = Join-Path $env:TEMP ("Montazhnaya-Tooltip-Audit-" + [guid]::NewGuid().ToString("N"))
$sourceZip = Join-Path $workRoot "montazhnaya-main.zip"
$sourceExtract = Join-Path $workRoot "source"
$profilePath = Join-Path $workRoot "electron-profile"
$appProcess = $null
$exitCode = 0

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $desktop = [Environment]::GetFolderPath([Environment+SpecialFolder]::DesktopDirectory)
    if ([string]::IsNullOrWhiteSpace($desktop) -or -not (Test-Path -LiteralPath $desktop)) {
        $desktop = Join-Path $env:USERPROFILE "Documents"
    }
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $OutputDirectory = Join-Path $desktop ("Montazhnaya-Tooltip-Audit-" + $stamp)
}

New-Item -ItemType Directory -Force -Path $workRoot | Out-Null
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

function Invoke-NpmChecked {
    param([Parameter(Mandatory = $true)][string[]]$NpmArguments)

    Write-Host ""
    Write-Host ("> npm " + ($NpmArguments -join " ")) -ForegroundColor Cyan
    & $script:npmCommand.Source @NpmArguments
    if ($LASTEXITCODE -ne 0) {
        throw ("npm " + ($NpmArguments -join " ") + " завершился с кодом " + $LASTEXITCODE)
    }
}

try {
    Write-Host ""
    Write-Host "Montazhnaya — визуальная проверка переводов подсказок" -ForegroundColor Cyan
    Write-Host "Проверка выполняется в отдельной временной папке. Установщик Windows не используется." -ForegroundColor Gray

    $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $nodeCommand) {
        throw "Node.js не найден. Для временного запуска исходного Electron-проекта нужен Node.js 22.12.0 или новее."
    }

    $nodeVersionText = (& $nodeCommand.Source -p "process.versions.node" 2>$null | Out-String).Trim()
    try { $nodeVersion = [version]$nodeVersionText } catch {
        throw "Не удалось определить версию Node.js: $nodeVersionText"
    }
    if ($nodeVersion -lt [version]"22.12.0") {
        throw "Нужен Node.js 22.12.0 или новее. Сейчас установлена версия $nodeVersionText."
    }

    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $npmCommand) {
        throw "npm.cmd не найден. Он устанавливается вместе с Node.js."
    }

    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        $portUse = Get-NetTCPConnection -LocalPort $DevToolsPort -State Listen -ErrorAction SilentlyContinue
        if ($portUse) {
            throw "Порт $DevToolsPort уже занят. Закрой программу, которая его использует, или укажи другой DevToolsPort."
        }
    }

    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

    Write-Host ""
    Write-Host "Загружаем актуальный исходный код из GitHub main..." -ForegroundColor Cyan
    $archiveUrl = "https://codeload.github.com/$repository/zip/refs/heads/main"
    Invoke-WebRequest -Uri $archiveUrl -OutFile $sourceZip -UseBasicParsing

    New-Item -ItemType Directory -Force -Path $sourceExtract | Out-Null
    Expand-Archive -LiteralPath $sourceZip -DestinationPath $sourceExtract -Force

    $projectRoot = Join-Path $sourceExtract "montazhnaya-1-main"
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "package.json"))) {
        throw "В архиве GitHub не найдена корневая папка проекта с package.json."
    }

    $auditScript = Join-Path $projectRoot "qa\tooltip-gui-audit.cjs"
    if (-not (Test-Path -LiteralPath $auditScript)) {
        throw "В исходном коде пока нет GUI-аудита подсказок. Проверь, что загружена актуальная ветка main."
    }

    Push-Location -LiteralPath $projectRoot
    try {
        Invoke-NpmChecked -NpmArguments @("run", "deps:install")
        Invoke-NpmChecked -NpmArguments @("run", "electron:install")
    }
    finally {
        Pop-Location
    }

    $electronExe = Join-Path $projectRoot "node_modules\electron\dist\electron.exe"
    if (-not (Test-Path -LiteralPath $electronExe -PathType Leaf)) {
        throw "Electron runtime не найден после загрузки: $electronExe"
    }

    Write-Host ""
    Write-Host "Запускаем окно редактора с локальным каналом автоматической проверки..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $profilePath | Out-Null

    $electronArguments = "--remote-debugging-port=$DevToolsPort --remote-allow-origins=* --user-data-dir=""$profilePath"" --no-first-run --no-default-browser-check ."
    $appProcess = Start-Process -FilePath $electronExe -ArgumentList $electronArguments -WorkingDirectory $projectRoot -PassThru

    Write-Host "Окно Montazhnaya должно появиться на рабочем столе." -ForegroundColor Green
    Write-Host "Тест проверит 36 языков и реальные подсказки в трёх размерах окна." -ForegroundColor Gray

    Push-Location -LiteralPath $projectRoot
    try {
        & $nodeCommand.Source $auditScript --port $DevToolsPort --output $OutputDirectory
        $auditExitCode = $LASTEXITCODE
        if ($auditExitCode -ne 0) {
            $exitCode = $auditExitCode
            Write-Warning "Аудит завершился с замечаниями или критическими ошибками. Отчёты сохранены в $OutputDirectory"
        }
    }
    finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "Готово. Отчёты и снимки экрана:" -ForegroundColor Green
    Write-Host $OutputDirectory -ForegroundColor Yellow
    Write-Host "Основной отчёт: tooltip-gui-audit-summary.md"
    Write-Host "Подробный отчёт: tooltip-gui-audit.json"
    Write-Host "Таблица проверок: tooltip-gui-audit-details.csv"
    Write-Host "Скриншоты: tooltip-<код языка>.png"

    $bundlePath = $OutputDirectory + ".zip"
    if (Test-Path -LiteralPath $bundlePath) {
        Remove-Item -LiteralPath $bundlePath -Force
    }
    Compress-Archive -Path (Join-Path $OutputDirectory "*") -DestinationPath $bundlePath -CompressionLevel Optimal
    Write-Host "Архив для отправки: $bundlePath" -ForegroundColor Yellow
}
catch {
    $exitCode = 1
    Write-Error $_
}
finally {
    if ($appProcess) {
        try {
            & "$env:SystemRoot\System32\taskkill.exe" /PID $appProcess.Id /T /F *> $null
        } catch {
            try { Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue } catch { }
        }
    }

    if (-not $KeepWorkingCopy) {
        Remove-Item -LiteralPath $workRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

if ($exitCode -ne 0) {
    exit $exitCode
}
