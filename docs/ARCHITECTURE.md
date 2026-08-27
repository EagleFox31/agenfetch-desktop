# Architecture d’AgenFetch

## Flux principal

1. Le content script ajoute le bouton **AgenFetch** à la page YouTube.
2. Un clic ouvre une URL `agenfetch://download?...`.
3. Windows remet cette URL à l’application Electron enregistrée pour ce protocole.
4. Le processus principal valide le domaine, le type de page et les options.
5. yt-dlp est exécuté avec un tableau d’arguments et `shell: false`.
6. FFmpeg fusionne ou convertit les flux lorsque nécessaire.
7. Le processus de rendu reçoit uniquement les événements de progression et les résultats via IPC.

## Composants

- `src/main.js` : fenêtre, protocole local, IPC et cycle de vie.
- `src/preload.js` : API minimale exposée à l’interface.
- `src/core/validation.js` : liste blanche YouTube et assainissement des options.
- `src/core/downloader.js` : construction des arguments, processus yt-dlp et progression.
- `src/core/history-store.js` : historique JSON local limité à 100 entrées.
- `src/renderer/` : interface HTML, CSS et JavaScript sans accès direct à Node.js.
- `extension/` : extension Manifest V3 pour Chrome et Edge.

## Décisions de sécurité

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- Politique CSP locale stricte et aucune ressource distante dans l’interface.
- Aucun mot de passe, cookie ou jeton n’est demandé ou stocké.
- Aucun appel à `shell: true` et aucune concaténation de commande.
- Seuls les domaines YouTube explicitement autorisés sont acceptés.
- Un lien reçu par l’extension remplit le formulaire mais ne déclenche pas le téléchargement sans confirmation.

## Dépendances système

AgenFetch appelle les installations locales de yt-dlp, FFmpeg et Deno. Elles ne sont pas redistribuées dans l’installateur MVP, ce qui simplifie les mises à jour et sépare leurs licences de celle du code AgenFetch.
