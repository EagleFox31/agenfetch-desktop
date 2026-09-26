export const agenFetchRelease = {
  product: "AgenFetch",
  version: "0.3.1",
  releaseTitle: "Sous-titres multilingues",
  platform: "Windows 10/11 · x64",
  headline: "La vidéo reste locale. Les sous-titres vont plus loin.",
  subheadline: "AgenFetch 0.3.1 ajoute la recherche multilingue de sous-titres pour YouTube, les films et les séries.",
  repo: "github.com/EagleFox31/agenfetch-desktop",
  site: "agenfetch-desktop.lawrynnjennifer.workers.dev",
  languages: ["FR", "EN", "ES", "DE", "PT", "AR", "IT"],
  providers: ["Podnapisi", "SubDL", "OpenSubtitles"],
  highlights: [
    {
      value: "7 langues",
      label: "dans une même recherche"
    },
    {
      value: "3 catalogues",
      label: "interrogés puis classés"
    },
    {
      value: "Local-first",
      label: "historique et file restent sur le PC"
    }
  ]
} as const;
