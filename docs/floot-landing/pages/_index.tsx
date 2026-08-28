import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Download, Github, ShieldCheck, HardDrive, Puzzle, Layers } from "lucide-react";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Progress } from "../components/Progress";
import { switchToDarkMode } from "../helpers/themeMode";
import { useScrollReveal } from "../helpers/useScrollReveal";
import styles from "./_index.module.css";

const MARK =
  "/_cdn/static/30cc566a-3958-41e9-b54e-36f3ef41143d-agenfetch-mark.svg";
const REPO = "https://github.com/EagleFox31/agenfetch-desktop";
const SETUP =
  "https://github.com/EagleFox31/agenfetch-desktop/releases/download/v0.2.0/AgenFetch-Setup-0.2.0.exe";
const EXTENSION =
  "https://github.com/EagleFox31/agenfetch-desktop/releases/download/v0.2.0/AgenFetch-Extension-0.2.0.zip";
const SUMS =
  "https://github.com/EagleFox31/agenfetch-desktop/releases/download/v0.2.0/SHA256SUMS.txt";
const LICENSE =
  "https://github.com/EagleFox31/agenfetch-desktop/blob/main/LICENSE";
const NOTICES =
  "https://github.com/EagleFox31/agenfetch-desktop/blob/main/docs/THIRD_PARTY_NOTICES.md";

function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const observe = useScrollReveal();
  return (
    <Tag ref={observe} className={`${styles.reveal} ${className || ""}`}>
      {children}
    </Tag>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    switchToDarkMode();
  }, []);

  return (
    <div className={styles.page}>
      <Helmet>
        <html lang="fr" />
        <title>AgenFetch — Téléchargement YouTube local</title>
        <meta
          name="description"
          content="AgenFetch — télécharge YouTube en local depuis une interface Windows premium. yt-dlp, FFmpeg et Deno intégrés. Sans compte, sans cookies."
        />
        <meta name="theme-color" content="#07161c" />
        <link rel="icon" href={MARK} type="image/svg+xml" />
      </Helmet>

      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.orbA} />
        <div className={styles.orbB} />
      </div>

      <header className={styles.header}>
        <a className={styles.logo} href="#top" aria-label="AgenFetch — accueil">
          <img src={MARK} width={36} height={36} alt="" />
          <span>AgenFetch</span>
        </a>
        <nav className={styles.nav} aria-label="Navigation principale">
          <a href="#fonctionnement">Fonctionnement</a>
          <a href="#capacites">Capacités</a>
          <a href="#local">Confidentialité</a>
          <a className={styles.navCta} href="#telecharger">
            Télécharger
          </a>
        </nav>
        <Button
          variant="outline"
          size="icon"
          className={styles.menuToggle}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={styles.menuBars} />
        </Button>
      </header>

      {menuOpen ? (
        <nav id="mobile-nav" className={styles.mobileNav} aria-label="Menu mobile">
          <a href="#fonctionnement" onClick={() => setMenuOpen(false)}>
            Fonctionnement
          </a>
          <a href="#capacites" onClick={() => setMenuOpen(false)}>
            Capacités
          </a>
          <a href="#local" onClick={() => setMenuOpen(false)}>
            Confidentialité
          </a>
          <a href="#telecharger" onClick={() => setMenuOpen(false)}>
            Télécharger
          </a>
        </nav>
      ) : null}

      <main id="top">
        <section className={styles.hero} aria-labelledby="headline">
          <div className={styles.heroCopy}>
            <p className={styles.brandMark}>AgenFetch</p>
            <h1 id="headline">
              YouTube arrive chez toi.
              <br />
              Sans cloud, sans compte.
            </h1>
            <p className={styles.lede}>
              Application Windows locale qui pilote yt-dlp : vidéos, Shorts,
              lives et playlists, directement dans ton dossier. FFmpeg, ffprobe et
              Deno sont déjà dedans.
            </p>
            <div className={styles.ctaRow}>
              <Button asChild size="lg">
                <a href={SETUP} target="_blank" rel="noopener noreferrer">
                  <Download size={18} />
                  Télécharger pour Windows
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={REPO} target="_blank" rel="noopener noreferrer">
                  <Github size={18} />
                  Voir le dépôt
                </a>
              </Button>
            </div>
          </div>

          <div className={styles.mock} aria-hidden="true">
            <aside className={styles.mockSide}>
              <div className={styles.mockBrand}>
                <img src={MARK} alt="" width={28} height={28} />
                <strong>AgenFetch</strong>
              </div>
              <div className={styles.mockNav}>
                <span className={styles.mockNavActive}>↓ Télécharger</span>
                <span>↺ Historique</span>
              </div>
              <p className={styles.mockNote}>100 % local</p>
            </aside>
            <div className={styles.mockMain}>
              <p className={styles.mockEyebrow}>Téléchargement intelligent</p>
              <p className={styles.mockTitle}>Récupère ce qui compte.</p>
              <div className={styles.mockField}>
                https://www.youtube.com/watch?v=…
              </div>
              <div className={styles.mockPills}>
                <span className={styles.mockOn}>Vidéo</span>
                <span>1080p</span>
                <span>MP4</span>
                <span>FR</span>
              </div>
              <Progress value={62} className={styles.mockProgress} />
              <div className={styles.mockMeta}>
                <span>62 %</span>
                <span>4,8 Mo/s</span>
                <span>ETA 0:42</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className={styles.section}
          id="fonctionnement"
          aria-labelledby="flow-title"
        >
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Fonctionnement</p>
            <h2 id="flow-title">Trois gestes. Un fichier sur ton disque.</h2>
            <p>Colle un lien, confirme, retrouve la vidéo là où tu l’as choisie.</p>
          </div>
          <ol className={styles.flow}>
            <Reveal as="li">
              <span className={styles.stepIndex}>01</span>
              <h3>Ouvre ou colle</h3>
              <p>
                Depuis l’extension Chrome/Edge, ou en collant un ou plusieurs
                liens YouTube.
              </p>
            </Reveal>
            <Reveal as="li">
              <span className={styles.stepIndex}>02</span>
              <h3>Aperçu &amp; file</h3>
              <p>
                Vérifie le titre, la chaîne et la miniature, puis ajoute jusqu’à
                50 liens.
              </p>
            </Reveal>
            <Reveal as="li">
              <span className={styles.stepIndex}>03</span>
              <h3>Télécharge en local</h3>
              <p>
                yt-dlp, FFmpeg et Deno sont intégrés. Progression, annulation,
                notifications.
              </p>
            </Reveal>
          </ol>
        </section>

        <section
          className={styles.section}
          id="capacites"
          aria-labelledby="cap-title"
        >
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Capacités</p>
            <h2 id="cap-title">Tout ce qu’il faut pour récupérer proprement.</h2>
            <p>
              Qualité jusqu’à 4K, audio MP3, sous-titres, file d’attente et
              outils toujours à jour.
            </p>
          </div>
          <div className={styles.capGrid}>
            <Reveal as="article" className={styles.cap}>
              <Layers size={22} />
              <h3>Formats &amp; qualité</h3>
              <p>
                Vidéo MP4 ou MKV, audio MP3, résolution jusqu’à 4K. Sous-titres
                français, anglais ou multilingues.
              </p>
            </Reveal>
            <Reveal as="article" className={styles.cap}>
              <HardDrive size={22} />
              <h3>File intelligente</h3>
              <p>
                Jusqu’à 50 liens traités dans l’ordre. Journal, vitesse, ETA et
                historique local.
              </p>
            </Reveal>
            <Reveal as="article" className={styles.cap}>
              <Download size={22} />
              <h3>Installateur autonome</h3>
              <p>
                Windows 10/11 x64. Pas besoin d’installer Node, yt-dlp ou
                FFmpeg toi-même.
              </p>
            </Reveal>
            <Reveal as="article" className={styles.cap}>
              <Puzzle size={22} />
              <h3>Extension optionnelle</h3>
              <p>
                Un bouton AgenFetch sur YouTube ouvre l’app via{" "}
                <code>agenfetch://</code> — rien ne part sans toi.
              </p>
            </Reveal>
          </div>
        </section>

        <section className={styles.section} id="local" aria-labelledby="local-title">
          <Reveal className={styles.panel}>
            <div>
              <p className={styles.eyebrow}>Confidentialité</p>
              <h2 id="local-title">Rien ne quitte ta machine.</h2>
              <p>
                AgenFetch n’envoie aucune donnée vers un serveur AgenStudio. Pas de
                compte YouTube, pas de cookies, pas de DRM contourné. L’historique
                et la file restent sur ton ordinateur.
              </p>
            </div>
            <ul className={styles.trust}>
              <li>
                <ShieldCheck size={16} /> Traitement 100 % local
              </li>
              <li>Domaines YouTube uniquement</li>
              <li>Code open source MIT</li>
              <li>Binaires vérifiés SHA-256 au build</li>
            </ul>
          </Reveal>
        </section>

        <section
          className={styles.section}
          id="telecharger"
          aria-labelledby="dl-title"
        >
          <Reveal className={`${styles.panel} ${styles.downloadPanel}`}>
            <Badge variant="success">Bêta 0.2</Badge>
            <h2 id="dl-title">Installe AgenFetch sur Windows.</h2>
            <p>
              Télécharge l’installateur. Windows SmartScreen peut afficher « Éditeur
              inconnu » — la bêta n’est pas encore signée. Vérifie l’empreinte dans{" "}
              <a href={SUMS} target="_blank" rel="noopener noreferrer">
                SHA256SUMS.txt
              </a>
              .
            </p>
            <div className={styles.ctaRow}>
              <Button asChild size="lg">
                <a href={SETUP} target="_blank" rel="noopener noreferrer">
                  AgenFetch-Setup-0.2.0.exe
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={EXTENSION} target="_blank" rel="noopener noreferrer">
                  Extension Chrome / Edge
                </a>
              </Button>
            </div>
            <p className={styles.fineprint}>
              Windows 10 ou 11 · x64 · MIT License · by AgenStudio
            </p>
          </Reveal>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <img src={MARK} width={28} height={28} alt="" />
          <div>
            <strong>AgenFetch</strong>
            <span>by AgenStudio</span>
          </div>
        </div>
        <p>
          Utilise AgenFetch uniquement pour tes contenus, les contenus libres de
          droits ou ceux pour lesquels tu disposes d’une autorisation.
        </p>
        <div className={styles.footerLinks}>
          <a href={REPO} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href={LICENSE} target="_blank" rel="noopener noreferrer">
            Licence
          </a>
          <a href={NOTICES} target="_blank" rel="noopener noreferrer">
            Mentions tierces
          </a>
        </div>
      </footer>
    </div>
  );
}
