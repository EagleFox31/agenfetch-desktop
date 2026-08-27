$ErrorActionPreference = "Stop"

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "WinGet est introuvable. Installe ou mets à jour 'App Installer' depuis le Microsoft Store."
}

Write-Host "Installation de yt-dlp..." -ForegroundColor Cyan
winget install --exact --id yt-dlp.yt-dlp --accept-package-agreements --accept-source-agreements

Write-Host "Installation de FFmpeg..." -ForegroundColor Cyan
winget install --exact --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements

Write-Host "Installation de Deno..." -ForegroundColor Cyan
winget install --exact --id DenoLand.Deno --accept-package-agreements --accept-source-agreements

Write-Host "Installation de Node.js LTS si nécessaire..." -ForegroundColor Cyan
winget install --exact --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements

Write-Host "Terminé. Ferme puis rouvre PowerShell avant de poursuivre." -ForegroundColor Green
