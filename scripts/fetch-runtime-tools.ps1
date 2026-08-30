param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$VendorBin = Join-Path $ProjectRoot "vendor\bin"
$VendorOptional = Join-Path $ProjectRoot "vendor\optional"
$TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("agenfetch-runtime-" + [Guid]::NewGuid().ToString("N"))

$YtDlpAsset = "yt-dlp.exe"
$DenoAsset = "deno-x86_64-pc-windows-msvc.zip"
$QuickJsAsset = "qjs-windows-x86_64.exe"
$FfmpegAsset = "ffmpeg-master-latest-win64-lgpl-shared.zip"

$YtDlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/$YtDlpAsset"
$YtDlpChecksumsUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS"
$DenoUrl = "https://github.com/denoland/deno/releases/latest/download/$DenoAsset"
$DenoChecksumsUrl = $DenoUrl + ".sha256sum"
$QuickJsReleaseApi = "https://api.github.com/repos/quickjs-ng/quickjs/releases/latest"
$FfmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/$FfmpegAsset"
$FfmpegChecksumsUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/checksums.sha256"

function Get-ExpectedHash {
    param(
        [Parameter(Mandatory = $true)][string]$ChecksumFile,
        [Parameter(Mandatory = $true)][string]$AssetName
    )

    $HashCandidates = @()
    foreach ($Line in Get-Content -LiteralPath $ChecksumFile) {
        if ($Line -match [Regex]::Escape($AssetName) -and $Line -match '(?i)\b([a-f0-9]{64})\b') {
            return $Matches[1].ToLowerInvariant()
        }
        if ($Line -match '(?i)\b([a-f0-9]{64})\b') {
            $HashCandidates += $Matches[1].ToLowerInvariant()
        }
    }
    $UniqueHashes = @($HashCandidates | Select-Object -Unique)
    if ($UniqueHashes.Count -eq 1) {
        return $UniqueHashes[0]
    }
    throw "Aucune empreinte SHA-256 trouvée pour $AssetName."
}

function Assert-FileHash {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string]$ExpectedHash
    )

    $ActualHash = (Get-FileHash -LiteralPath $FilePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($ActualHash -ne $ExpectedHash.ToLowerInvariant()) {
        throw "Empreinte invalide pour $(Split-Path -Leaf $FilePath). Attendue: $ExpectedHash, reçue: $ActualHash."
    }
}

function Invoke-VerifiedDownload {
    param(
        [Parameter(Mandatory = $true)][string]$AssetUrl,
        [Parameter(Mandatory = $true)][string]$ChecksumsUrl,
        [Parameter(Mandatory = $true)][string]$AssetName,
        [Parameter(Mandatory = $true)][string]$DestinationPath,
        [Parameter(Mandatory = $true)][string]$ChecksumPath
    )

    Write-Host "Téléchargement de $AssetName..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $AssetUrl -OutFile $DestinationPath -MaximumRedirection 10
    Invoke-WebRequest -Uri $ChecksumsUrl -OutFile $ChecksumPath -MaximumRedirection 10
    $ExpectedHash = Get-ExpectedHash -ChecksumFile $ChecksumPath -AssetName $AssetName
    Assert-FileHash -FilePath $DestinationPath -ExpectedHash $ExpectedHash
    return $ExpectedHash
}

function Invoke-VerifiedGitHubAsset {
    param(
        [Parameter(Mandatory = $true)][string]$ReleaseApiUrl,
        [Parameter(Mandatory = $true)][string]$AssetName,
        [Parameter(Mandatory = $true)][string]$DestinationPath
    )

    Write-Host "Résolution de $AssetName depuis GitHub Releases..." -ForegroundColor Cyan
    $Release = Invoke-RestMethod -Uri $ReleaseApiUrl -Headers @{ Accept = "application/vnd.github+json"; "User-Agent" = "AgenFetch-Build" }
    $Asset = $Release.assets | Where-Object { $_.name -eq $AssetName } | Select-Object -First 1
    if (-not $Asset -or -not $Asset.browser_download_url -or -not $Asset.digest) {
        throw "GitHub n’a pas fourni l’asset $AssetName avec son empreinte."
    }
    $ExpectedHash = [string]$Asset.digest -replace '^sha256:', ''
    if ($ExpectedHash -notmatch '^[a-fA-F0-9]{64}$') {
        throw "Empreinte GitHub invalide pour $AssetName."
    }
    Invoke-WebRequest -Uri $Asset.browser_download_url -OutFile $DestinationPath -MaximumRedirection 10
    Assert-FileHash -FilePath $DestinationPath -ExpectedHash $ExpectedHash
    return [ordered]@{ hash = $ExpectedHash.ToLowerInvariant(); url = [string]$Asset.browser_download_url }
}

$ExpectedFiles = @(
    (Join-Path $VendorBin "yt-dlp.exe"),
    (Join-Path $VendorBin "ffmpeg.exe"),
    (Join-Path $VendorBin "ffprobe.exe"),
    (Join-Path $VendorBin "qjs.exe"),
    (Join-Path $VendorOptional "deno.exe"),
    (Join-Path $VendorBin "TOOLS-MANIFEST.json")
)

if (-not $Force -and ($ExpectedFiles | Where-Object { -not (Test-Path -LiteralPath $_) }).Count -eq 0) {
    $ExistingDlls = @(Get-ChildItem -LiteralPath $VendorBin -Filter "*.dll" -File -ErrorAction SilentlyContinue)
    if ($ExistingDlls.Count -gt 0) {
        Write-Host "Les outils Windows partagés sont déjà prêts dans vendor\bin. Utilise -Force pour les actualiser." -ForegroundColor Green
        return
    }
}

New-Item -ItemType Directory -Path $VendorBin -Force | Out-Null
New-Item -ItemType Directory -Path $VendorOptional -Force | Out-Null
New-Item -ItemType Directory -Path $TempRoot -Force | Out-Null

try {
    $YtDlpTemp = Join-Path $TempRoot $YtDlpAsset
    $YtDlpSums = Join-Path $TempRoot "yt-dlp-SHA2-256SUMS"
    $YtDlpArchiveHash = Invoke-VerifiedDownload -AssetUrl $YtDlpUrl -ChecksumsUrl $YtDlpChecksumsUrl -AssetName $YtDlpAsset -DestinationPath $YtDlpTemp -ChecksumPath $YtDlpSums
    Copy-Item -LiteralPath $YtDlpTemp -Destination (Join-Path $VendorBin "yt-dlp.exe") -Force

    $DenoTemp = Join-Path $TempRoot $DenoAsset
    $DenoSums = Join-Path $TempRoot "$DenoAsset.sha256sum"
    $DenoArchiveHash = Invoke-VerifiedDownload -AssetUrl $DenoUrl -ChecksumsUrl $DenoChecksumsUrl -AssetName $DenoAsset -DestinationPath $DenoTemp -ChecksumPath $DenoSums
    $DenoExtract = Join-Path $TempRoot "deno"
    Expand-Archive -LiteralPath $DenoTemp -DestinationPath $DenoExtract -Force
    Copy-Item -LiteralPath (Join-Path $DenoExtract "deno.exe") -Destination (Join-Path $VendorOptional "deno.exe") -Force

    $QuickJsTemp = Join-Path $TempRoot $QuickJsAsset
    $QuickJsRelease = Invoke-VerifiedGitHubAsset -ReleaseApiUrl $QuickJsReleaseApi -AssetName $QuickJsAsset -DestinationPath $QuickJsTemp
    Copy-Item -LiteralPath $QuickJsTemp -Destination (Join-Path $VendorBin "qjs.exe") -Force

    $FfmpegTemp = Join-Path $TempRoot $FfmpegAsset
    $FfmpegSums = Join-Path $TempRoot "ffmpeg-checksums.sha256"
    $FfmpegArchiveHash = Invoke-VerifiedDownload -AssetUrl $FfmpegUrl -ChecksumsUrl $FfmpegChecksumsUrl -AssetName $FfmpegAsset -DestinationPath $FfmpegTemp -ChecksumPath $FfmpegSums
    $FfmpegExtract = Join-Path $TempRoot "ffmpeg"
    Expand-Archive -LiteralPath $FfmpegTemp -DestinationPath $FfmpegExtract -Force
    $FfmpegBinary = Get-ChildItem -LiteralPath $FfmpegExtract -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
    $FfprobeBinary = Get-ChildItem -LiteralPath $FfmpegExtract -Recurse -Filter "ffprobe.exe" | Select-Object -First 1
    $FfmpegLibraries = @(Get-ChildItem -LiteralPath $FfmpegExtract -Recurse -Filter "*.dll" -File)
    if (-not $FfmpegBinary -or -not $FfprobeBinary -or $FfmpegLibraries.Count -eq 0) {
        throw "L’archive FFmpeg partagée ne contient pas les exécutables et DLL attendus."
    }
    Get-ChildItem -LiteralPath $VendorBin -Filter "*.dll" -File -ErrorAction SilentlyContinue | Remove-Item -Force
    Copy-Item -LiteralPath $FfmpegBinary.FullName -Destination (Join-Path $VendorBin "ffmpeg.exe") -Force
    Copy-Item -LiteralPath $FfprobeBinary.FullName -Destination (Join-Path $VendorBin "ffprobe.exe") -Force
    foreach ($Library in $FfmpegLibraries) {
        Copy-Item -LiteralPath $Library.FullName -Destination (Join-Path $VendorBin $Library.Name) -Force
    }

    $Manifest = [ordered]@{
        generatedAt = (Get-Date).ToUniversalTime().ToString("o")
        platform = "win32"
        architecture = "x64"
        tools = @(
            [ordered]@{ name = "yt-dlp"; file = "yt-dlp.exe"; source = $YtDlpUrl; archiveSha256 = $YtDlpArchiveHash; fileSha256 = (Get-FileHash -LiteralPath (Join-Path $VendorBin "yt-dlp.exe") -Algorithm SHA256).Hash.ToLowerInvariant() },
            [ordered]@{ name = "FFmpeg"; file = "ffmpeg.exe"; source = $FfmpegUrl; archiveSha256 = $FfmpegArchiveHash; fileSha256 = (Get-FileHash -LiteralPath (Join-Path $VendorBin "ffmpeg.exe") -Algorithm SHA256).Hash.ToLowerInvariant() },
            [ordered]@{ name = "ffprobe"; file = "ffprobe.exe"; source = $FfmpegUrl; archiveSha256 = $FfmpegArchiveHash; fileSha256 = (Get-FileHash -LiteralPath (Join-Path $VendorBin "ffprobe.exe") -Algorithm SHA256).Hash.ToLowerInvariant() },
            [ordered]@{ name = "QuickJS-NG"; file = "qjs.exe"; source = $QuickJsRelease.url; archiveSha256 = $QuickJsRelease.hash; fileSha256 = (Get-FileHash -LiteralPath (Join-Path $VendorBin "qjs.exe") -Algorithm SHA256).Hash.ToLowerInvariant() },
            [ordered]@{ name = "Deno (optionnel)"; file = "optional/deno.exe"; source = $DenoUrl; archiveSha256 = $DenoArchiveHash; fileSha256 = (Get-FileHash -LiteralPath (Join-Path $VendorOptional "deno.exe") -Algorithm SHA256).Hash.ToLowerInvariant() }
        )
        sharedLibraries = @($FfmpegLibraries | ForEach-Object {
            [ordered]@{ file = $_.Name; fileSha256 = (Get-FileHash -LiteralPath (Join-Path $VendorBin $_.Name) -Algorithm SHA256).Hash.ToLowerInvariant() }
        })
    }
    $Manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $VendorBin "TOOLS-MANIFEST.json") -Encoding UTF8
    Write-Host "Outils Windows vérifiés et prêts dans vendor\bin." -ForegroundColor Green
}
finally {
    if (Test-Path -LiteralPath $TempRoot) {
        Remove-Item -LiteralPath $TempRoot -Recurse -Force
    }
}
