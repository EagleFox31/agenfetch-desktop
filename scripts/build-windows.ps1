$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Set-Location $projectRoot

npm install

npm test

npm run dist:win

Write-Host "Installateur généré dans le dossier release." -ForegroundColor Green
