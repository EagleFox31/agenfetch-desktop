$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Set-Location $projectRoot

npm install

npm test

npm run dist:win

& (Join-Path $PSScriptRoot "package-extension.ps1")

Write-Host "Installateur autonome et extension générés dans le dossier release." -ForegroundColor Green
