# AgenFetch Desktop + Extension

AgenFetch est un MVP Windows qui donne une interface graphique locale à yt-dlp. Son extension Chrome/Edge ajoute un bouton sous les vidéos YouTube et transmet le lien à l’application via le protocole `agenfetch://`.

> Utilise AgenFetch uniquement pour tes contenus, les contenus libres de droits ou ceux pour lesquels tu disposes d’une autorisation. Le projet ne contourne pas les DRM et ne fournit pas de mécanisme de piratage de compte.

## Ce qui fonctionne

- MP4 et MP3.
- Qualités 360p à 4K, selon la vidéo.
- Vidéos, Shorts, lives et playlists.
- Progression, vitesse, ETA, annulation et historique.
- Diagnostic des outils locaux.
- Mode de compatibilité 403 limité à 1080p.
- Bouton intégré aux pages YouTube.

## 1. Installer les prérequis

Ouvre PowerShell dans le dossier du projet :

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

```powershell
.\scripts\install-prerequisites.ps1
```

Ferme puis rouvre PowerShell.

## 2. Lancer en développement

```powershell
.\scripts\setup-development.ps1
```

```powershell
npm start
```

Au premier lancement, AgenFetch enregistre le protocole local `agenfetch://` dans Windows.

## 3. Installer l’extension Chrome ou Edge

1. Ouvre `chrome://extensions` dans Chrome ou `edge://extensions` dans Edge.
2. Active **Mode développeur**.
3. Clique sur **Charger l’extension non empaquetée**.
4. Sélectionne le dossier `extension` de ce projet.
5. Recharge une vidéo YouTube.

Le bouton **AgenFetch** apparaîtra dans la zone d’actions. Au premier clic, le navigateur demandera l’autorisation d’ouvrir l’application. Coche l’option permettant de toujours autoriser AgenFetch si elle est proposée.

## 4. Générer l’installateur Windows

La compilation doit être lancée sous Windows :

```powershell
.\scripts\build-windows.ps1
```

Le résultat sera créé dans :

```text
release\AgenFetch-Setup-0.1.0.exe
```

## En cas de HTTP 403

Commence par mettre yt-dlp à jour :

```powershell
yt-dlp -U
```

Si l’erreur persiste, coche **Mode compatibilité 403** dans AgenFetch. Ce mode utilise un client YouTube alternatif et limite la vidéo à 1080p.

## Tests

```powershell
npm test
```

Les tests vérifient notamment la liste blanche d’URL, le protocole local, la construction sûre des arguments et l’analyse de la progression.

## Structure

```text
agenfetch-desktop/
├── assets/          Identité visuelle et icônes
├── docs/            Architecture et roadmap
├── extension/       Extension Manifest V3
├── scripts/         Installation et build Windows
├── src/             Application Electron
└── test/            Tests Node.js
```

## Confidentialité

AgenFetch n’envoie aucune donnée vers un serveur AgenStudio. L’historique reste dans le dossier de données local de l’application. L’extension transmet uniquement l’URL YouTube ouverte à l’application installée sur la même machine.

## Licence

Le code AgenFetch est sous licence MIT. yt-dlp, FFmpeg, Deno et Electron conservent leurs propres licences. Ces outils ne sont pas inclus dans le dépôt ni dans le paquet source.
