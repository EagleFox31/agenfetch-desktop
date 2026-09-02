# AgenFetch Subtitle Engine

Processus Python isolé utilisé par AgenFetch 0.3 pour rechercher des sous-titres
de films et séries. Il communique exclusivement en JSON UTF-8 via stdin/stdout.
Le moteur de recherche, de correspondance et de conversion repose sur
Subliminal 2.7.0 (MIT). Le connecteur SubDL reste un adaptateur AgenFetch séparé.

## Développement

```powershell
python -m pip install -r .\subtitle-engine\requirements.txt

'{"command":"parse","payload":{"value":"The.Last.of.Us.S02E03.1080p.WEB-DL.mkv"}}' |
  python .\subtitle-engine\agenfetch_subtitles.py
```

Les fournisseurs sans clé activés par défaut sont Podnapisi, Gestdown et Subtis.
Les recherches OpenSubtitles et SubDL utilisent les clés configurées par
l’utilisateur. Aucune clé n’est inscrite dans le dépôt.

Chaque fournisseur est interrogé de manière isolée avec un délai borné. Un
échec fournisseur est retourné comme diagnostic structuré sans interrompre les
résultats des autres catalogues.
