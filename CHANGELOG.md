# Changelog

## 0.2.1 — bêta

### Ajouté

- Nouvelle landing Vite, avec téléchargement direct de l’installateur Windows.
- Aperçu automatique dès qu’un lien YouTube complet est collé ou saisi.

### Modifié

- Site vitrine responsive, prêt pour GitHub Pages.
- Boutons de téléchargement branchés sur la dernière release GitHub.

### Sécurité

- Menu et raccourcis DevTools désactivés dans l’application packagée.

## 0.2.0 — bêta

### Ajouté

- Installateur autonome avec yt-dlp, FFmpeg, ffprobe et Deno.
- Gestionnaire de chemins et copie utilisateur actualisable de yt-dlp.
- File d’attente séquentielle jusqu’à 50 éléments.
- Aperçu vidéo ou playlist.
- Conteneur MKV et sous-titres intégrés.
- Notifications Windows.
- Workflow GitHub de build et de Release.
- Archive versionnée de l’extension.
- Vérification SHA-256 des outils tiers.

### Modifié

- Interface adaptée aux liens multiples.
- Historique enrichi avec titre, conteneur et sous-titres.
- Extension et application passées en version 0.2.0.

### Sécurité

- Miniatures limitées aux hôtes HTTPS `ytimg.com`.
- Runtimes passés à yt-dlp par chemins explicites.
- Aucun binaire tiers stocké dans Git.
