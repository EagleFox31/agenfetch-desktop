# Landing AgenFetch (source Floot)

Ces fichiers sont le code **écrit sur Floot** pour la page produit. Ils ne tournent pas tels quels hors de Floot : ils importent le kit Floot (`Button`, `Badge`, `Progress`, `themeMode`, `useScrollReveal`).

La landing publique du dépôt reste `website/` (HTML/CSS/JS statiques, GitHub Pages).

## Contenu

| Fichier | Rôle |
| --- | --- |
| `pages/_index.tsx` | Page unique : hero, 3 étapes, capacités, confidentialité, téléchargement, footer |
| `pages/_index.module.css` | Styles de la page |
| `pages/_index.pageLayout.tsx` | Layout Floot (vide — page autonome) |
| `base.css` | Tokens (Syne / Outfit, teal, burgundy) |
| `design-principles.md` | Fil esthétique |

## Export ZIP officiel

Floot ne propose pas d’export via le connecteur MCP. Pour le zip exécutable (kit + instructions de run) :

1. Ouvre le projet sur [floot.com](https://floot.com)
2. Clique le **nom du projet** dans la barre du haut
3. **Get Code** → Download as ZIP

Cette exportation complète est liée aux plans payants. Voir [Code, data, and exports](https://floot.com/docs/faqs/code-data-and-exports).

## Preview Floot

Le preview live (token requis, expire) a été créé dans le projet Floot **AgenFetch**.
