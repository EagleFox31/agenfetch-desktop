$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Set-Location $projectRoot

npm install
if ($LASTEXITCODE -ne 0) {
    throw "L’installation des dépendances npm a échoué."
}

npm test
if ($LASTEXITCODE -ne 0) {
    throw "Les tests ont échoué."
}

npm run dist:win
if ($LASTEXITCODE -ne 0) {
    throw "La génération de l’installateur Windows a échoué."
}

& (Join-Path $PSScriptRoot "package-extension.ps1")
& (Join-Path $PSScriptRoot "package-optional-runtimes.ps1")

Write-Host "Installateur, extension et runtime optionnel générés dans le dossier release." -ForegroundColor Green
