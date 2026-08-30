# AgenFetch Subtitle Engine

Processus Python isolé utilisé par AgenFetch 0.3 pour rechercher des sous-titres
de films et séries. Il communique exclusivement en JSON via stdin/stdout.

## Développement

```powershell
'{"command":"parse","payload":{"value":"The.Last.of.Us.S02E03.1080p.WEB-DL.mkv"}}' |
  python .\subtitle-engine\agenfetch_subtitles.py
```

Les recherches distantes utilisent les API officielles configurées par
l’utilisateur : SubDL et OpenSubtitles. Aucune clé n’est inscrite dans le dépôt.
