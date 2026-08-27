# Composants tiers distribués avec AgenFetch

L’installateur Windows AgenFetch 0.2 télécharge ces composants pendant le build, vérifie les sommes SHA-256 publiées par leurs projets, puis les place dans le paquet final. Ils conservent leurs licences respectives.

## yt-dlp

- Projet : https://github.com/yt-dlp/yt-dlp
- Licence : Unlicense
- Binaire distribué : `yt-dlp.exe`

## FFmpeg

- Projet : https://ffmpeg.org/
- Build Windows : https://github.com/BtbN/FFmpeg-Builds
- Variante distribuée : build statique LGPL pour Windows x64
- Licence : LGPL 2.1 ou ultérieure, selon les options du build amont
- Binaires distribués : `ffmpeg.exe` et `ffprobe.exe`
- Sources FFmpeg : https://ffmpeg.org/download.html#get-sources

## Deno

- Projet : https://github.com/denoland/deno
- Licence : MIT
- Binaire distribué : `deno.exe`

## Electron

- Projet : https://github.com/electron/electron
- Licence : MIT

Les informations de provenance et les empreintes exactes du build sont intégrées dans `resources/bin/TOOLS-MANIFEST.json`.
