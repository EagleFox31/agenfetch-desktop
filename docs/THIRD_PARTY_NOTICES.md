# Composants tiers distribués avec AgenFetch

Le build Windows AgenFetch 0.3 télécharge ces composants, vérifie leurs sommes SHA-256 publiées, puis les place dans l’installateur ou dans les composants optionnels de la Release. Ils conservent leurs licences respectives.

## yt-dlp

- Projet : https://github.com/yt-dlp/yt-dlp
- Licence : Unlicense
- Binaire distribué : `yt-dlp.exe`

## FFmpeg

- Projet : https://ffmpeg.org/
- Build Windows : https://github.com/BtbN/FFmpeg-Builds
- Variante distribuée : build partagé LGPL pour Windows x64
- Licence : LGPL 2.1 ou ultérieure, selon les options du build amont
- Binaires distribués : `ffmpeg.exe`, `ffprobe.exe` et leurs DLL communes
- Sources FFmpeg : https://ffmpeg.org/download.html#get-sources

## QuickJS-NG

- Projet : https://github.com/quickjs-ng/quickjs
- Licence : MIT
- Binaire intégré : `qjs.exe`

## Deno — composant optionnel

- Projet : https://github.com/denoland/deno
- Licence : MIT
- Binaire publié séparément : `AgenFetch-Deno-Runtime-<version>.exe`

## Electron

- Projet : https://github.com/electron/electron
- Licence : MIT

Les informations de provenance et les empreintes exactes du build sont intégrées dans `resources/bin/TOOLS-MANIFEST.json`.
