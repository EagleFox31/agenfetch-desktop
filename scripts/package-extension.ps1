$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReleasePath = Join-Path $ProjectRoot "release"
$ExtensionPath = Join-Path $ProjectRoot "extension"
$Package = Get-Content -LiteralPath (Join-Path $ProjectRoot "package.json") -Raw | ConvertFrom-Json
$ArchivePath = Join-Path $ReleasePath ("AgenFetch-Extension-{0}.zip" -f $Package.version)

New-Item -ItemType Directory -Path $ReleasePath -Force | Out-Null
if (Test-Path -LiteralPath $ArchivePath) {
    Remove-Item -LiteralPath $ArchivePath -Force
}

Compress-Archive -Path (Join-Path $ExtensionPath "*") -DestinationPath $ArchivePath -CompressionLevel Optimal
Write-Host "Extension empaquetée : $ArchivePath" -ForegroundColor Green
