# Roadmap produit

## MVP 0.1 — livré

- MP4 et MP3, qualité jusqu’à 4K.
- Vidéos, Shorts, lives et playlists.
- Progression, historique et annulation.
- Diagnostic des prérequis.
- Mode de dépannage 403.
- Extension Chrome/Edge et protocole `agenfetch://`.
- Installateur NSIS dépendant des outils système.

## Bêta 0.2 — livrée

- Installateur Windows x64 autonome.
- yt-dlp, FFmpeg, ffprobe et Deno intégrés.
- Vérification SHA-256 de la chaîne de build.
- Mise à jour de yt-dlp depuis l’application.
- File d’attente de plusieurs liens.
- Métadonnées et miniature avant confirmation.
- MP4/MKV et sous-titres multilingues.
- Notifications Windows.
- Extension ZIP versionnée.
- GitHub Actions et Releases automatisées.

## Version 0.3 — distribution

- Persistance de la file après redémarrage.
- Reprise améliorée et nouveaux essais automatiques contrôlés.
- Version portable.
- Site vitrine avec téléchargement et documentation. *(landing FR initiale dans `website/`)*
- Français et anglais.
- Publication Chrome Web Store / Edge Add-ons.

## Version 1.0 — stable

- Signature du binaire Windows.
- Mises à jour automatiques signées de l’application.
- Télémétrie facultative et respectueuse de la vie privée pour les erreurs.
- Audit de sécurité et de licences.
- Migration éventuelle vers Tauri après mesure de la consommation réelle.
