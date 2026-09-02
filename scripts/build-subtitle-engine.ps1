$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Package = Get-Content -LiteralPath (Join-Path $ProjectRoot "package.json") -Raw | ConvertFrom-Json
$Version = $Package.version
$Source = Join-Path $ProjectRoot "subtitle-engine\agenfetch_subtitles.py"
$WorkRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("agenfetch-subtitle-build-" + [Guid]::NewGuid().ToString("N"))
$DistRoot = Join-Path $WorkRoot "dist"
$Output = Join-Path $ProjectRoot ("release\AgenFetch-Subtitle-Engine-" + $Version + ".exe")

New-Item -ItemType Directory -Path (Split-Path -Parent $Output) -Force | Out-Null
New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null

try {
    python -m PyInstaller `
        --noconfirm `
        --clean `
        --onefile `
        --console `
        --collect-all "subliminal" `
        --collect-all "babelfish" `
        --collect-all "guessit" `
        --collect-all "knowit" `
        --collect-all "trakit" `
        --copy-metadata "subliminal" `
        --name "AgenFetch-Subtitle-Engine-$Version" `
        --distpath $DistRoot `
        --workpath (Join-Path $WorkRoot "work") `
        --specpath (Join-Path $WorkRoot "spec") `
        $Source
    if ($LASTEXITCODE -ne 0) {
        throw "La compilation du moteur de sous-titres a échoué."
    }
    Copy-Item -LiteralPath (Join-Path $DistRoot ("AgenFetch-Subtitle-Engine-" + $Version + ".exe")) -Destination $Output -Force
    Write-Host "Moteur de sous-titres généré : $Output" -ForegroundColor Green
}
finally {
    if (Test-Path -LiteralPath $WorkRoot) {
        Remove-Item -LiteralPath $WorkRoot -Recurse -Force
    }
}
