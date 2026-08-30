$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReleaseRoot = Join-Path $ProjectRoot "release"
$UnpackedRoot = Join-Path $ReleaseRoot "win-unpacked"

function Get-PathSize {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return 0 }
    $Item = Get-Item -LiteralPath $Path
    if (-not $Item.PSIsContainer) { return [long]$Item.Length }
    return [long](Get-ChildItem -LiteralPath $Path -Recurse -File | Measure-Object -Property Length -Sum).Sum
}

function New-SizeEntry {
    param([string]$Name, [string]$Path)
    $Bytes = Get-PathSize -Path $Path
    return [ordered]@{
        name = $Name
        path = $Path.Replace($ProjectRoot, ".")
        bytes = $Bytes
        mebibytes = [Math]::Round($Bytes / 1MB, 2)
    }
}

function New-PatternSizeEntry {
    param([string]$Name, [string]$Path, [string]$Filter)
    $Bytes = if (Test-Path -LiteralPath $Path) {
        [long](Get-ChildItem -LiteralPath $Path -Filter $Filter -File | Measure-Object -Property Length -Sum).Sum
    } else { 0 }
    return [ordered]@{
        name = $Name
        path = ($Path.Replace($ProjectRoot, ".") + "\" + $Filter)
        bytes = $Bytes
        mebibytes = [Math]::Round($Bytes / 1MB, 2)
    }
}

$Installer = Get-ChildItem -LiteralPath $ReleaseRoot -Filter "AgenFetch-Setup-*.exe" -File | Select-Object -First 1
$Resources = Join-Path $UnpackedRoot "resources"
$BinRoot = Join-Path $Resources "bin"
$Entries = @(
    (New-SizeEntry -Name "installer" -Path $Installer.FullName),
    (New-SizeEntry -Name "unpacked-application" -Path $UnpackedRoot),
    (New-SizeEntry -Name "electron-and-runtime" -Path (Join-Path $UnpackedRoot "AgenFetch.exe")),
    (New-SizeEntry -Name "app-asar" -Path (Join-Path $Resources "app.asar")),
    (New-SizeEntry -Name "runtime-tools" -Path $BinRoot),
    (New-SizeEntry -Name "yt-dlp" -Path (Join-Path $BinRoot "yt-dlp.exe")),
    (New-SizeEntry -Name "quickjs-runtime" -Path (Join-Path $BinRoot "qjs.exe")),
    (New-SizeEntry -Name "deno-optional-component" -Path ((Get-ChildItem -LiteralPath $ReleaseRoot -Filter "AgenFetch-Deno-Runtime-*.exe" -File | Select-Object -First 1).FullName)),
    (New-SizeEntry -Name "ffmpeg" -Path (Join-Path $BinRoot "ffmpeg.exe")),
    (New-SizeEntry -Name "ffprobe" -Path (Join-Path $BinRoot "ffprobe.exe")),
    (New-PatternSizeEntry -Name "ffmpeg-shared-libraries" -Path $BinRoot -Filter "*.dll")
)

$Report = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    entries = $Entries
}
$Output = Join-Path $ReleaseRoot "SIZE-REPORT.json"
$Report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Output -Encoding UTF8
Write-Host "Rapport de taille généré : $Output" -ForegroundColor Green
