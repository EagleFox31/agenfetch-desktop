# Architecture d’AgenFetch 0.3

## Flux principal

1. L’utilisateur colle un ou plusieurs liens, ou l’extension ouvre une URL `agenfetch://download?...`.
2. Le processus principal valide chaque URL et assainit toutes les options.
3. `DownloadQueue` conserve au maximum 50 tâches et n’en exécute qu’une à la fois.
4. `DownloaderService` lance la copie gérée de yt-dlp avec `shell: false`.
5. yt-dlp utilise le FFmpeg et le Deno intégrés grâce à des chemins explicites et à un environnement local.
6. Le processus de rendu reçoit la file, la progression, les journaux et les résultats via une API IPC minimale.
7. Le résultat est ajouté à l’historique local et une notification Windows est affichée.

## Gestion des outils

`ToolManager` recherche les binaires dans cet ordre :

- yt-dlp : copie modifiable dans `userData/tools`, puis binaire embarqué, puis `PATH` ;
- FFmpeg et Deno : binaires embarqués, puis copie gérée, puis `PATH`.

Au premier lancement, le yt-dlp embarqué est copié dans le profil utilisateur. Le bouton de mise à jour exécute `yt-dlp -U` sur cette copie, ce qui évite d’écrire dans le dossier protégé de l’application.

Pendant le build Windows, `scripts/fetch-runtime-tools.ps1` télécharge et vérifie :

- `yt-dlp.exe` depuis les releases officielles yt-dlp ;
- `deno.exe` depuis les releases officielles Deno ;
- `ffmpeg.exe` et `ffprobe.exe` depuis les builds Windows LGPL de BtbN.

Les binaires ne sont pas commités. electron-builder les place dans `resources/bin` via `extraResources`.

## Composants

- `src/main.js` : fenêtre, notifications, protocole local, IPC et cycle de vie.
- `src/preload.js` : API minimale exposée à l’interface.
- `src/core/validation.js` : liste blanche YouTube et assainissement des options.
- `src/core/tool-manager.js` : découverte, diagnostic et mise à jour des outils.
- `src/core/subtitle-engine-service.js` : processus JSON isolé pour les films et séries.
- `src/core/subtitle-component-installer.js` : installation SHA-256 du sidecar optionnel.
- `src/core/provider-credentials-store.js` : clés API chiffrées avec Windows `safeStorage`.
- `src/core/downloader.js` : métadonnées, arguments yt-dlp, processus et progression.
- `src/core/download-queue.js` : ordonnancement séquentiel en mémoire.
- `src/core/history-store.js` : historique JSON local limité à 100 entrées.
- `src/core/consent-store.js` : confirmation d’usage autorisé au premier lancement.
- `src/core/app-updater.js` : version, GitHub Releases, téléchargement de l’installateur.
- `src/core/extension-path.js` : dossier de l’extension livré avec l’installateur.
- `src/renderer/` : interface HTML, CSS et JavaScript sans accès direct à Node.js.
- `extension/` : extension Manifest V3 pour Chrome et Edge.
- `subtitle-engine/` : moteur Python standard library, compilé séparément avec PyInstaller.

## Sécurité

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- Politique CSP locale ; seules les miniatures HTTPS `*.ytimg.com` sont autorisées.
- Aucun mot de passe, cookie ou jeton n’est demandé ou stocké.
- `shell: false` et tableaux d’arguments pour tous les processus.
- Domaines YouTube explicitement autorisés.
- URL de miniature limitée à `ytimg.com`.
- Binaires de build contrôlés par les SHA-256 publiés en amont.
- Un lien reçu par l’extension remplit le formulaire mais ne lance rien sans confirmation.
- Les mises à jour de l’app ne se téléchargent que depuis GitHub Releases, avec contrôle SHA-256 si `SHA256SUMS.txt` est publié.
- Le moteur de sous-titres exige toujours une empreinte SHA-256 publiée avant installation.
- Les URL de téléchargement des fournisseurs sont limitées à leurs domaines HTTPS autorisés.
- Les clés SubDL et OpenSubtitles ne sont jamais exposées au renderer ou aux journaux.

## Limites de la bêta

- File conservée uniquement pendant la session.
- Installateur non signé : SmartScreen peut afficher un avertissement.
- Windows x64 uniquement.
- Extension installée manuellement.
