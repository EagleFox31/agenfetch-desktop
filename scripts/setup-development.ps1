$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Set-Location $projectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js est introuvable. Exécute d'abord scripts/install-prerequisites.ps1."
}

npm install

npm test

Write-Host "Le projet est prêt. Lance 'npm start'." -ForegroundColor Green
