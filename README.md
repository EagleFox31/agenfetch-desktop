# AgenFetch Desktop + Extension

AgenFetch est une application Windows locale qui pilote yt-dlp depuis une interface graphique. Son extension Chrome/Edge transmet la vidéo YouTube ouverte à l’application via le protocole `agenfetch://`.

> Utilise AgenFetch uniquement pour tes contenus, les contenus libres de droits ou ceux pour lesquels tu disposes d’une autorisation. Le projet ne contourne pas les DRM et ne demande ni compte, ni mot de passe, ni cookies YouTube.

## Version 0.2 — bêta installable

- Installateur Windows x64 autonome.
- yt-dlp, FFmpeg, ffprobe et Deno intégrés au paquet.
- Copie modifiable de yt-dlp dans le profil Windows pour les mises à jour.
- Vérification SHA-256 des outils pendant le build.
- File d’attente jusqu’à 50 liens.
- Aperçu du titre, de la chaîne, de la durée et de la miniature.
- Vidéo MP4 ou MKV, audio MP3 et qualité jusqu’à 4K.
- Sous-titres français, anglais ou multilingues.
- Vidéos, Shorts, lives et playlists.
- Progression, vitesse, ETA, journal, annulation et historique.
- Notifications Windows.
- Mode de dépannage pour certains HTTP 403, optionnel.
- Confirmation d’usage autorisé au premier lancement.
- Extension Chrome/Edge empaquetée séparément.

## Installer AgenFetch

Configuration minimale : Windows 10 ou 11, processeur x64.

1. Ouvre la section **Releases** du dépôt.
2. Télécharge `AgenFetch-Setup-0.2.3.exe`.
3. Lance l’installateur.
4. Ouvre AgenFetch depuis le bureau ou le menu Démarrer.

L’utilisateur final n’a pas besoin d’installer Node.js, yt-dlp, FFmpeg ou Deno. Les fichiers `.blockmap`, `.yml` et le dossier `win-unpacked` ne sont pas nécessaires.

La bêta n’est pas encore signée numériquement. Windows SmartScreen peut donc afficher « Éditeur inconnu ». Vérifie l’empreinte publiée dans `SHA256SUMS.txt` avant l’installation.

## Installer l’extension Chrome ou Edge

L’extension reste optionnelle : AgenFetch fonctionne aussi en collant directement les liens. Chrome et Edge n’installent pas d’extension hors store pour un utilisateur classique.

**Depuis l’application installée**

1. Ouvre **À propos**.
2. Clique sur **Ouvrir le dossier de l’extension**.
3. Ouvre `chrome://extensions` ou `edge://extensions`.
4. Active **Mode développeur**.
5. Clique sur **Charger l’extension non empaquetée**.
6. Sélectionne le dossier ouvert.

**Depuis la Release GitHub**

1. Télécharge `AgenFetch-Extension-0.2.3.zip`.
2. Extrais l’archive, puis suis les mêmes étapes à partir de `chrome://extensions`.

Le bouton **AgenFetch** apparaîtra sur les pages vidéo compatibles. Le navigateur demandera l’autorisation d’ouvrir l’application locale au premier clic.

## Utilisation

Au premier lancement, AgenFetch demande de confirmer un usage limité à tes contenus, aux œuvres libres de droits, ou aux contenus pour lesquels tu as une autorisation.

1. Colle un ou plusieurs liens, un par ligne.
2. L’aperçu du titre, de la chaîne et de la miniature s’affiche automatiquement.
3. Choisis vidéo ou audio, qualité, conteneur et sous-titres.
4. Sélectionne le dossier de destination.
5. Clique sur **Ajouter à la file**.

AgenFetch traite les éléments dans l’ordre. Les téléchargements terminés, échoués ou annulés restent visibles dans la file jusqu’au nettoyage.

## Mise à jour de l’application

Ouvre **À propos** dans la barre latérale, ou le menu **⋯** en haut à droite. AgenFetch compare ta version à GitHub Releases. S’il y a plus récent, tu peux télécharger l’installateur dans l’app (barre de progression) ou ouvrir le site.

## Mise à jour de yt-dlp

Clique sur **Mettre à jour** dans la barre d’état. AgenFetch met à jour la copie de yt-dlp stockée dans le profil utilisateur, sans modifier les fichiers protégés de l’installation.

## Développement

Prérequis : Node.js 22 ou ultérieur.

```powershell
npm install
```

```powershell
npm test
```

```powershell
npm start
```

En développement, AgenFetch utilise d’abord `vendor/bin`, puis les outils disponibles dans le `PATH`. Le script suivant installe les prérequis système via WinGet si nécessaire :

```powershell
.\scripts\install-prerequisites.ps1
```

## Générer l’installateur autonome

Sous Windows :

```powershell
.\scripts\build-windows.ps1
```

Le script :

1. exécute les tests ;
2. télécharge les releases officielles de yt-dlp et Deno, ainsi qu’un build FFmpeg LGPL ;
3. vérifie leurs sommes SHA-256 publiées ;
4. génère l’installateur NSIS ;
5. crée l’archive de l’extension.

Résultats :

```text
release\AgenFetch-Setup-0.2.3.exe
release\AgenFetch-Extension-0.2.3.zip
```

Un lancement manuel du workflow **Build Windows release** produit les mêmes fichiers comme artifact GitHub. La création du tag `v0.2.3` publie automatiquement une GitHub Release et `SHA256SUMS.txt`.

## Site vitrine

Le dossier `website/` contient la landing page publique (Vite + React).

```powershell
cd website
npm install
npm run dev
```

Puis ouvre l’URL affichée (souvent `http://localhost:5173`). Un `npm run build` produit le site statique dans `website/dist`.

Le site est publié sur **Cloudflare Pages** (`agenfetch-desktop.pages.dev` une fois le projet créé). Deux options :

1. **GitHub Actions** (déjà dans le dépôt) : dans le dépôt GitHub, ajoute les secrets `CLOUDFLARE_API_TOKEN` (jeton *Edit Cloudflare Workers*) et `CLOUDFLARE_ACCOUNT_ID`, puis lance le workflow **Deploy website**.
2. **Tableau Cloudflare** : Workers & Pages → Create → Pages → Import a Git repository → `EagleFox31/agenfetch-desktop`. Root directory `website`, build `npm run build`, output `dist`, variable `NODE_VERSION=22`.

## Structure

```text
agenfetch-desktop/
├── .github/workflows/  Build et publication Windows
├── assets/             Identité visuelle et icônes
├── docs/               Architecture, roadmap et licences
├── extension/          Extension Manifest V3
├── scripts/            Préparation, build et empaquetage
├── src/core/           Téléchargement, outils et file
├── src/renderer/       Interface Electron
├── test/               Tests Node.js
├── website/            Landing page Vite (déployée via Cloudflare Pages)
└── vendor/bin/         Binaires générés localement, non commités
```

## Confidentialité

AgenFetch n’envoie aucune donnée vers un serveur AgenStudio. L’historique et la file restent sur l’ordinateur. L’extension transmet uniquement l’URL YouTube ouverte à l’application installée sur la même machine.

## Licences

Le code AgenFetch est sous licence MIT. Les composants redistribués conservent leurs licences. Consulte [docs/THIRD_PARTY_NOTICES.md](docs/THIRD_PARTY_NOTICES.md).
