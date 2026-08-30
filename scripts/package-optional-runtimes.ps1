$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Package = Get-Content -LiteralPath (Join-Path $ProjectRoot "package.json") -Raw | ConvertFrom-Json
$Source = Join-Path $ProjectRoot "vendor\optional\deno.exe"
$Destination = Join-Path $ProjectRoot ("release\AgenFetch-Deno-Runtime-" + $Package.version + ".exe")

if (-not (Test-Path -LiteralPath $Source)) {
    throw "Le runtime Deno optionnel n’a pas été préparé."
}
Copy-Item -LiteralPath $Source -Destination $Destination -Force
Write-Host "Runtime Deno optionnel généré : $Destination" -ForegroundColor Green
