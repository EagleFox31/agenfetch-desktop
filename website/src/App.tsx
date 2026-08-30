import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  AudioLines,
  Check,
  CircleCheck,
  Copy,
  Database,
  Download,
  ExternalLink,
  Files,
  Film,
  Github,
  HardDrive,
  Languages,
  ListVideo,
  LockKeyhole,
  Menu,
  Minus,
  MonitorDown,
  PackageCheck,
  Play,
  Puzzle,
  Search,
  ShieldCheck,
  Subtitles,
  X,
} from 'lucide-react';

const GITHUB_REPO = 'https://github.com/EagleFox31/agenfetch-desktop';
const GITHUB_API_LATEST = 'https://api.github.com/repos/EagleFox31/agenfetch-desktop/releases/latest';
const PRODUCT_VERSION = '0.3.1';
const INSTALLER_SIZE = '181 Mo';
const FALLBACK_LINKS = {
  setupExe: `${GITHUB_REPO}/releases/download/v${PRODUCT_VERSION}/AgenFetch-Setup-${PRODUCT_VERSION}.exe`,
  setupName: `AgenFetch-Setup-${PRODUCT_VERSION}.exe`,
  extensionZip: `${GITHUB_REPO}/releases/download/v${PRODUCT_VERSION}/AgenFetch-Extension-${PRODUCT_VERSION}.zip`,
  checksums: `${GITHUB_REPO}/releases/latest/download/SHA256SUMS.txt`,
};
const asset = (file: string) => `${import.meta.env.BASE_URL}${file}`;

type ReleaseAsset = { name: string; browser_download_url: string };

function useReleaseLinks() {
  const [links, setLinks] = useState(FALLBACK_LINKS);

  useEffect(() => {
    const controller = new AbortController();
    fetch(GITHUB_API_LATEST, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { assets?: ReleaseAsset[] }) => {
        const assets = data.assets ?? [];
        const exe = assets.find((item) => /^AgenFetch-Setup-.*\.exe$/i.test(item.name));
        const zip = assets.find((item) => /^AgenFetch-Extension-.*\.zip$/i.test(item.name));
        const sums = assets.find((item) => item.name === 'SHA256SUMS.txt');
        setLinks({
          setupExe: exe?.browser_download_url ?? FALLBACK_LINKS.setupExe,
          setupName: exe?.name ?? FALLBACK_LINKS.setupName,
          extensionZip: zip?.browser_download_url ?? FALLBACK_LINKS.extensionZip,
          checksums: sums?.browser_download_url ?? FALLBACK_LINKS.checksums,
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return links;
}

function FileDownload({
  href,
  filename,
  className,
  children,
  testId,
}: {
  href: string;
  filename?: string;
  className?: string;
  children: ReactNode;
  testId: string;
}) {
  return (
    <a className={className} href={href} download={filename} rel="noreferrer" data-testid={testId}>
      {children}
    </a>
  );
}

const navItems = [
  { label: 'Comment ça marche', href: '#workflow' },
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Confiance', href: '#trust' },
  { label: 'Téléchargement', href: '#download' },
];
const headerNavItems = navItems.filter((item) => item.href !== '#download');

const capabilities = [
  { icon: MonitorDown, title: 'Vidéo, enfin local', text: 'MP4 ou MKV, de 360p à 4K — les fichiers restent sur ton PC, là où ils ont leur place.' },
  { icon: AudioLines, title: 'L’audio sans détour', text: 'MP3, M4A ou FLAC selon la source. Parfait pour écouter hors connexion.' },
  { icon: Subtitles, title: 'Sous-titres YouTube', text: 'Pistes manuelles ou automatiques, en SRT, VTT ou format original — intégrées, séparées ou téléchargées seules.' },
  { icon: Film, title: 'Films et séries', text: 'Choisis ton fichier : AgenFetch détecte le titre, l’année, la saison et l’épisode avant de chercher.' },
  { icon: Languages, title: 'Sept langues', text: 'Français, anglais, espagnol, allemand, portugais, arabe et italien dans la même recherche.' },
  { icon: Database, title: 'Plusieurs catalogues', text: 'Podnapisi, SubDL et OpenSubtitles sont interrogés ensemble puis les résultats sont classés.' },
];

function scrollToSection(href: string, closeMenu?: () => void) {
  closeMenu?.();
  const target = document.querySelector(href);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function SiteHeader({
  variant,
  setupExe,
  setupName,
}: {
  variant: 'home' | 'legal';
  setupExe: string;
  setupName: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`} data-testid={variant === 'legal' ? 'header-legal' : 'header-site'}>
      <div className="site-header-shell">
        <div className="site-header-inner">
          <a href="#top" className="site-logo" data-testid={variant === 'legal' ? 'link-legal-brand' : 'link-brand'}>
            <img src={asset('assets/agenfetch-mark.svg')} alt="" width="28" height="28" />
            <span>AgenFetch</span>
          </a>
          {variant === 'legal' ? (
            <div className="site-header-end">
              <a className="nav-link" href="#top" data-testid="link-legal-home">Accueil</a>
              <FileDownload className="button-header" href={setupExe} filename={setupName} testId="link-legal-download">Télécharger</FileDownload>
            </div>
          ) : (
            <div className="site-header-end">
              <nav className="site-nav" aria-label="Navigation principale">
                {headerNavItems.map((item) => (
                  <a key={item.href} className="nav-link" href={item.href} data-testid={`link-nav-${item.href.slice(1)}`} onClick={(event) => { event.preventDefault(); scrollToSection(item.href); }}>{item.label}</a>
                ))}
                <a className="nav-link" href={GITHUB_REPO} target="_blank" rel="noreferrer" data-testid="link-header-github">GitHub</a>
              </nav>
              <FileDownload className="button-header" href={setupExe} filename={setupName} testId="link-header-download">Télécharger</FileDownload>
              <button className="menu-button" type="button" aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileOpen} data-testid="button-mobile-menu" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
            </div>
          )}
        </div>
        {variant === 'home' && mobileOpen && (
          <nav className="site-mobile-nav" aria-label="Navigation mobile" data-testid="nav-mobile">
            {headerNavItems.map((item) => <a key={item.href} className="nav-link" href={item.href} data-testid={`link-mobile-${item.href.slice(1)}`} onClick={(event) => { event.preventDefault(); scrollToSection(item.href, closeMenu); }}>{item.label}</a>)}
            <a className="nav-link" href={GITHUB_REPO} target="_blank" rel="noreferrer" data-testid="link-mobile-github">GitHub</a>
          </nav>
        )}
      </div>
    </header>
  );
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`story-reveal ${visible ? 'story-reveal-visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function Parallax({ children, className = '', speed = 0.08 }: { children: ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = (window.innerHeight * 0.52) - node.getBoundingClientRect().top;
      node.style.transform = `translate3d(0, ${Math.max(-30, Math.min(30, distance * speed))}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [speed]);

  return <div ref={ref} className={`parallax-item ${className}`}>{children}</div>;
}

function AppWindow() {
  const [url, setUrl] = useState('https://youtube.com/watch?v=agenfetch');
  const [format, setFormat] = useState('MP4');
  const [quality, setQuality] = useState('1080p');
  const [queueCleared, setQueueCleared] = useState(false);
  const [notice, setNotice] = useState('2 éléments dans la file');
  const [view, setView] = useState<'downloads' | 'subtitles'>('subtitles');

  const addLink = () => {
    setNotice('Lien ajouté à la file');
    setQueueCleared(false);
  };

  return (
    <div className="product-window" data-testid="mockup-agenfetch-window">
      <div className="window-titlebar">
        <div className="window-dots" aria-hidden="true"><span /><span /><span /></div>
        <span className="window-title">AgenFetch Desktop — beta {PRODUCT_VERSION}</span>
        <div className="window-controls">
          <button className="window-control" type="button" aria-label="Réduire la fenêtre" data-testid="button-mockup-minimize" onClick={() => setNotice('Fenêtre réduite en aperçu')}><Minus size={11} /></button>
          <button className="window-control" type="button" aria-label="Agrandir la fenêtre" data-testid="button-mockup-maximize" onClick={() => setNotice('Aperçu plein écran activé')}><span style={{ fontSize: 11 }}>□</span></button>
          <button className="window-control" type="button" aria-label="Fermer l’aperçu" data-testid="button-mockup-close" onClick={() => setNotice('Aperçu conservé pour la démonstration')}><X size={11} /></button>
        </div>
      </div>
      <div className="window-body">
        <aside className="window-sidebar" aria-label="Navigation AgenFetch">
          <div className="app-mark"><span className="app-mark-symbol">AF</span><span>AgenFetch</span></div>
          <p className="sidebar-label">Espace local</p>
          <button className={`sidebar-item${view === 'downloads' ? ' active' : ''}`} type="button" data-testid="button-mockup-downloads" onClick={() => { setView('downloads'); setNotice('Vue Téléchargements active'); }}><Download size={13} /> Télécharger</button>
          <button className="sidebar-item" type="button" data-testid="button-mockup-history" onClick={() => setNotice('Historique local ouvert')}><Files size={13} /> Historique</button>
          <button className={`sidebar-item${view === 'subtitles' ? ' active' : ''}`} type="button" data-testid="button-mockup-subtitles" onClick={() => { setView('subtitles'); setNotice('Recherche multilingue prête'); }}><Subtitles size={13} /> Sous-titres</button>
          <button className="sidebar-item" type="button" data-testid="button-mockup-about" onClick={() => setNotice('À propos ouvert')}><HardDrive size={13} /> À propos</button>
          <div className="sidebar-bottom"><span style={{ color: '#eab14a' }}>●</span> Tout reste sur ce PC<br />yt-dlp · FFmpeg · QuickJS</div>
        </aside>
        <main className="window-content">
          <div className="window-heading">
            <div><h3>{view === 'downloads' ? 'Nouveau téléchargement' : 'Trouver des sous-titres'}</h3><p>{view === 'downloads' ? 'Colle un lien, choisis ton format.' : 'Le bon épisode. La bonne langue.'}</p></div>
            <span className="status-pill">BETA {PRODUCT_VERSION}</span>
          </div>
          {view === 'downloads' ? <>
            <div className="url-box">
              <Play size={12} color="#eab14a" fill="#eab14a" />
              <input aria-label="Lien YouTube" data-testid="input-mockup-url" value={url} onChange={(event) => setUrl(event.target.value)} />
              <button className="url-add" type="button" data-testid="button-mockup-add-link" onClick={addLink}>Ajouter</button>
            </div>
            <div className="preview-card" data-testid="status-mockup-preview">
              <div className="preview-art">APERÇU</div>
              <div className="preview-meta"><strong>Construire un outil simple, qui reste à toi</strong><span>AGENSTUDIO · 08:42 · 1080p disponible</span></div>
            </div>
            <div className="settings-row">
              <button className="mock-select" type="button" data-testid="button-mockup-format" onClick={() => setFormat(format === 'MP4' ? 'MKV' : 'MP4')}><span>FORMAT</span>{format} <span style={{ display: 'inline', float: 'right', color: '#eab14a' }}>⌄</span></button>
              <button className="mock-select" type="button" data-testid="button-mockup-quality" onClick={() => setQuality(quality === '1080p' ? '4K' : '1080p')}><span>QUALITÉ</span>{quality} <span style={{ display: 'inline', float: 'right', color: '#eab14a' }}>⌄</span></button>
            </div>
            <div className="subtitle-strip"><Subtitles size={12} /><span>Sous-titres YouTube</span><b>FR · EN · SRT</b></div>
            <div className="queue-header"><span>File séquentielle</span><button type="button" data-testid="button-mockup-clear-queue" onClick={() => { setQueueCleared(true); setNotice('File vidée'); }}>Vider</button></div>
            {!queueCleared ? (
            <>
              <div className="queue-item">
                <div className="queue-icon">01</div>
                <div className="queue-info"><strong>Construire un outil simple...</strong><small>{format} · {quality} · téléchargement</small><div className="progress-track"><div className="progress-bar" /></div></div>
                <span className="queue-state">68%</span>
              </div>
              <div className="queue-item">
                <div className="queue-icon">02</div>
                <div className="queue-info"><strong>Une minute pour comprendre</strong><small>MP3 · 256 kb/s · en attente</small></div>
                <span className="queue-state" style={{ color: '#7f8aa5' }}>à suivre</span>
              </div>
            </>
            ) : (
            <div style={{ padding: '1.2rem 0 .6rem', color: '#8e99b2', fontSize: '.65rem' }}>La file est prête pour de nouveaux liens.</div>
            )}
          </> : <div className="subtitle-mock" data-testid="mockup-subtitle-search">
            <div className="mock-file"><Film size={14} /><div><small>FICHIER LOCAL</small><strong>The Last Horizon.S02E03.1080p.mkv</strong></div><span>Choisir</span></div>
            <div className="mock-detected"><span><small>TITRE DÉTECTÉ</small><b>The Last Horizon</b></span><span><small>ÉPISODE</small><b>S02 · E03</b></span></div>
            <div className="mock-language-row"><small>LANGUES</small><div><span className="is-active">FR</span><span className="is-active">EN</span><span>ES</span><span>DE</span><span>PT</span><span>AR</span><span>IT</span></div></div>
            <button className="mock-search-button" type="button" onClick={() => setNotice('12 pistes trouvées et classées')}><Search size={12} /> Rechercher partout</button>
            <div className="mock-provider-row"><span><i /> Podnapisi</span><span><i /> SubDL</span><span><i /> OpenSubtitles</span></div>
            <div className="mock-result"><span className="mock-score">96%</span><div><strong>The Last Horizon · S02E03</strong><small>Français · SRT · Podnapisi</small></div><button type="button" onClick={() => setNotice('Sous-titre enregistré à côté de la vidéo')}>Télécharger</button></div>
            <div className="mock-result"><span className="mock-score is-second">91%</span><div><strong>The Last Horizon · S02E03</strong><small>English · SRT · OpenSubtitles</small></div><button type="button" onClick={() => setNotice('Sous-titre anglais sélectionné')}>Télécharger</button></div>
          </div>}
          <div className="queue-header window-footer-status" style={{ marginTop: '.65rem', textTransform: 'none', letterSpacing: 0 }}><span>{notice}</span><span style={{ color: '#7f8aa5' }}>100 % local</span></div>
        </main>
      </div>
    </div>
  );
}

function Home() {
  const [copied, setCopied] = useState(false);
  const { setupExe, setupName, extensionZip, checksums } = useReleaseLinks();

  useEffect(() => {
    document.title = 'AgenFetch 0.3 — vidéos et sous-titres, en local';
    const description = 'AgenFetch 0.3 est une application Windows locale pour enregistrer tes contenus autorisés et trouver des sous-titres multilingues pour tes films et séries.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'AgenFetch 0.3 — vidéos et sous-titres, en local.');
  }, []);

  const copyChecksum = async () => {
    try {
      await navigator.clipboard.writeText('SHA256SUMS.txt — vérifie le binaire avant installation');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="agen-page min-h-[100dvh]">
      <SiteHeader variant="home" setupExe={setupExe} setupName={setupName} />

      <main id="top">
        <section className="hero-grid relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[.92fr_1.08fr] lg:px-8 lg:pb-28 lg:pt-20" aria-labelledby="hero-title">
          <div className="relative z-10">
            <div className="reveal eyebrow">AgenFetch Desktop <span className="rounded-full bg-[#e9e3d6] px-2 py-1 text-[9px] tracking-[.08em] text-[#77736c]">BETA {PRODUCT_VERSION}</span></div>
            <h1 id="hero-title" className="display-font reveal reveal-delay-1 mt-5 max-w-[760px] text-[clamp(2.15rem,8.4vw,5.65rem)] font-bold leading-[.96] tracking-[-.075em] text-[#282d46]">Tes vidéos. Leurs sous-titres.<br /><span className="text-[#176d64]">Tout reste local.</span></h1>
            <p className="reveal reveal-delay-2 mt-6 max-w-[620px] text-[16px] leading-7 text-[#5f6370] sm:text-[17px]">Télécharge tes contenus autorisés, récupère leurs pistes YouTube ou trouve le bon sous-titre pour un film ou une série. Une seule app Windows, sans cloud AgenStudio et sans configuration technique.</p>
            <div className="hero-cta reveal reveal-delay-3 mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <FileDownload className="button-primary" href={setupExe} filename={setupName} testId="link-hero-download"><ArrowDownToLine size={17} /> Télécharger pour Windows</FileDownload>
              <a className="inline-flex items-center gap-2 px-1 py-3 text-[13px] font-bold text-[#282d46] underline decoration-[#eab14a] decoration-2 underline-offset-4 transition hover:text-[#176d64]" href="#workflow" data-testid="link-hero-how"><span>Voir comment ça marche</span><ArrowRight size={15} /></a>
            </div>
            <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[#7b7f87]"><span className="inline-flex items-center gap-1.5"><CircleCheck size={13} className="text-[#176d64]" /> Windows 10 / 11 x64</span><span className="inline-flex items-center gap-1.5"><CircleCheck size={13} className="text-[#176d64]" /> {INSTALLER_SIZE}</span><span className="inline-flex items-center gap-1.5"><CircleCheck size={13} className="text-[#176d64]" /> Open source MIT</span></div>
          </div>
          <div className="reveal reveal-delay-2 relative z-10 lg:pl-4">
            <div className="hero-chip hero-chip-local">Sous-titres multilingues</div>
            <Parallax speed={0.07} className="hero-float hero-float-one">
              <span className="hero-float-icon"><Download size={13} /></span>
              <span className="hero-float-copy"><strong>SRT · 7 langues</strong><small>Prêt à enregistrer</small></span>
            </Parallax>
            <Parallax speed={-0.05} className="hero-float hero-float-two">
              <span className="hero-float-icon hero-float-icon-queue"><ListVideo size={13} /></span>
              <span className="hero-float-copy"><strong>3 catalogues</strong><small>Résultats classés</small></span>
            </Parallax>
            <AppWindow />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-2 font-mono text-[9px] uppercase tracking-[.11em] text-[#89867f]"><span>Clique sur Télécharger ou Sous-titres dans la fenêtre</span><span>Electron · Windows</span></div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 pb-20 lg:px-8 lg:pb-28" aria-label="Résumé produit">
          <div className="section-rule" />
          <div className="grid gap-7 py-8 md:grid-cols-[1.1fr_1fr_1fr] md:gap-10">
            <p className="max-w-[320px] text-[15px] font-semibold leading-6 text-[#282d46]">Deux besoins. Une seule app.<br /><span className="font-normal text-[#77736c]">Télécharger et retrouver les bons sous-titres.</span></p>
            <div><p className="mono-font text-[10px] uppercase tracking-[.12em] text-[#176d64]">Côté YouTube</p><p className="mt-2 text-[13px] leading-5 text-[#6e7079]">Vidéo, audio, playlists et pistes de sous-titres disponibles.</p></div>
            <div><p className="mono-font text-[10px] uppercase tracking-[.12em] text-[#176d64]">Côté médiathèque</p><p className="mt-2 text-[13px] leading-5 text-[#6e7079]">Films et séries identifiés puis comparés sur plusieurs catalogues.</p></div>
          </div>
        </section>

        <section className="story-scene story-problem relative mx-auto max-w-[1240px] scroll-mt-8 px-5 pb-24 lg:px-8 lg:pb-32" aria-labelledby="problem-title">
          <Reveal className="story-scene-grid">
            <div className="story-copy">
              <div className="eyebrow">01 / Le point de départ</div>
              <h2 id="problem-title" className="display-font mt-5 max-w-[460px] text-4xl font-bold leading-[1.01] tracking-[-.06em] text-[#282d46] sm:text-5xl">Un lien n’est pas un fichier. Un fichier n’a pas toujours les bons sous-titres.</h2>
              <p className="mt-5 max-w-[410px] text-[15px] leading-6 text-[#6e7079]">AgenFetch relie les deux bouts : garder localement ce que tu as le droit d’enregistrer, puis retrouver une piste lisible dans la langue qui te convient.</p>
              <div className="browser-fragment mt-8" data-testid="card-browser-fragment">
                <div className="browser-fragment-bar"><span /><span /><span /><small>youtube.com</small></div>
                <div className="browser-fragment-body"><div className="browser-play"><Play size={13} fill="currentColor" /></div><div><strong>Un contenu que tu as le droit de garder</strong><small>Tes vidéos, le libre de droits, une autorisation</small></div><ArrowRight size={15} /></div>
              </div>
            </div>
            <div className="story-media-wrap">
              <Parallax speed={0.045} className="story-media-parallax">
                <div className="story-media story-media-thumbnails">
                  <img src={asset('generated/story-thumbnails.jpg')} alt="Trois ambiances vidéo abstraites affichées sur un écran" data-testid="img-story-thumbnails" />
                  <span className="media-caption">LE LIEN / LE CONTEXTE</span>
                </div>
              </Parallax>
              <Parallax speed={-0.07} className="story-note story-note-one"><span className="story-note-line" />à portée de main</Parallax>
            </div>
          </Reveal>
        </section>

        <section id="workflow" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 pb-24 lg:px-8 lg:pb-32" aria-labelledby="workflow-title">
          <div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr]">
            <div><div className="eyebrow">Le geste en trois temps</div><h2 id="workflow-title" className="display-font mt-5 max-w-[360px] text-4xl font-bold leading-[1.03] tracking-[-.06em] text-[#282d46] sm:text-5xl">De l’URL au fichier. <span className="text-[#176d64]">Sans détour.</span></h2><p className="mt-5 max-w-[340px] text-[15px] leading-6 text-[#6e7079]">Pas de terminal, pas de dépendance à chercher. Et si tu veux seulement les sous-titres YouTube, AgenFetch sait s’arrêter là.</p></div>
            <div className="grid gap-8 md:grid-cols-3">
              {[{ n: '01', title: 'Colle un lien autorisé', text: 'Une vidéo, un Short, un live ou une playlist. L’extension Chrome / Edge peut aussi transmettre le lien en un clic.' }, { n: '02', title: 'Choisis précisément', text: 'MP4, MKV ou MP3, qualité jusqu’à 4K et pistes manuelles ou automatiques dans les langues disponibles.' }, { n: '03', title: 'Récupère ce qu’il te faut', text: 'Vidéo avec sous-titres intégrés, fichiers séparés ou sous-titres uniquement en SRT, VTT ou format original.' }].map((step) => <div className="feature-tile" key={step.n} data-testid={`card-step-${step.n}`}><span className="step-number">{step.n}</span><h3 className="display-font mt-5 text-[20px] font-bold tracking-[-.04em] text-[#282d46]">{step.title}</h3><p className="mt-3 text-[13px] leading-5">{step.text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="subtitle-spotlight scroll-mt-8 py-24 lg:py-32" aria-labelledby="subtitle-spotlight-title">
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 lg:grid-cols-[.84fr_1.16fr] lg:px-8">
            <Reveal className="subtitle-spotlight-copy">
              <div className="eyebrow">Nouveau dans la v0.3</div>
              <h2 id="subtitle-spotlight-title" className="display-font mt-5 max-w-[510px] text-4xl font-bold leading-[1.01] tracking-[-.06em] text-[#282d46] sm:text-5xl">Ton épisode est déjà là. <span className="text-[#176d64]">Trouve juste la bonne voix.</span></h2>
              <p className="mt-6 max-w-[450px] text-[15px] leading-6 text-[#6e7079]">Choisis un film ou un épisode sur ton PC. AgenFetch lit son nom, détecte les informations utiles, interroge les catalogues activés et classe les pistes compatibles.</p>
              <div className="subtitle-stat-grid mt-9">
                <div><strong>3</strong><span>catalogues comparés</span></div>
                <div><strong>7</strong><span>langues proposées</span></div>
                <div><strong>2</strong><span>formats : SRT et VTT</span></div>
              </div>
              <p className="subtitle-privacy-note mt-7"><LockKeyhole size={15} /> Tes clés API sont chiffrées par Windows. AgenStudio ne reçoit ni ton fichier ni ta recherche.</p>
            </Reveal>
            <Reveal className="subtitle-product-card" delay={120}>
              <div className="subtitle-product-top"><span><Subtitles size={15} /> Recherche multilingue</span><b>LOCAL</b></div>
              <div className="subtitle-product-file"><Film size={18} /><div><small>FICHIER IDENTIFIÉ</small><strong>The Last Horizon · Saison 2 · Épisode 3</strong></div><CircleCheck size={17} /></div>
              <div className="subtitle-product-languages"><span className="active">FR</span><span className="active">EN</span><span>ES</span><span>DE</span><span>PT</span><span>AR</span><span>IT</span></div>
              <div className="subtitle-product-providers"><span><i />Podnapisi</span><span><i />SubDL</span><span><i />OpenSubtitles</span></div>
              <div className="subtitle-product-result"><span className="result-rank">01</span><div><strong>Français · SRT</strong><small>Correspondance épisode · 96 %</small></div><span className="result-ready">Prêt</span></div>
              <div className="subtitle-product-result"><span className="result-rank">02</span><div><strong>English · SRT</strong><small>Correspondance épisode · 91 %</small></div><span className="result-ready">Prêt</span></div>
            </Reveal>
          </div>
        </section>

        <section className="story-scene story-result relative bg-[#f5f5f7] py-24 lg:py-32" aria-labelledby="result-title">
          <Reveal className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-[1.08fr_.92fr] lg:px-8">
            <div className="story-media-wrap order-2 lg:order-1">
              <Parallax speed={0.055} className="story-media-parallax">
                <div className="story-media story-media-desk">
                  <img src={asset('generated/story-desk.jpg')} alt="Ordinateur portable sur un bureau lumineux, avec un lecteur vidéo abstrait" data-testid="img-story-desk" />
                  <span className="media-caption">LOCAL / WINDOWS</span>
                </div>
              </Parallax>
              <Parallax speed={-0.055} className="story-note story-note-two"><HardDrive size={14} /> enregistré sur ton PC</Parallax>
            </div>
            <div className="story-copy order-1 lg:order-2">
              <div className="eyebrow">02 / Le point d’arrivée</div>
              <h2 id="result-title" className="display-font mt-5 max-w-[460px] text-4xl font-bold leading-[1.01] tracking-[-.06em] text-[#282d46] sm:text-5xl">Quelques secondes plus tard, il est vraiment chez toi.</h2>
              <p className="mt-5 max-w-[390px] text-[15px] leading-6 text-[#6e7079]">Pas dans un cloud à retrouver. Pas dans un compte à protéger. Un fichier lisible, dans ton dossier, avec sa qualité et ses sous-titres comme tu les as choisis.</p>
              <div className="mt-8 flex flex-wrap gap-2"><span className="story-chip"><CircleCheck size={13} /> MP4 prêt</span><span className="story-chip"><CircleCheck size={13} /> FR inclus</span><span className="story-chip"><CircleCheck size={13} /> Hors connexion</span></div>
            </div>
          </Reveal>
        </section>

        <section id="features" className="scroll-mt-8 bg-[#e9e3d7] py-24 lg:py-32" aria-labelledby="features-title">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><div className="eyebrow">Ce que tu peux faire</div><h2 id="features-title" className="display-font mt-5 max-w-[650px] text-4xl font-bold leading-[1.02] tracking-[-.06em] text-[#282d46] sm:text-5xl">Plus qu’un downloader. Ton assistant média local.</h2></div><p className="max-w-[320px] text-[13px] leading-5 text-[#6e7079]">AgenFetch rassemble le téléchargement autorisé et la recherche de sous-titres dans une expérience Windows cohérente.</p></div>
            <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{capabilities.map(({ icon: Icon, title, text }, index) => <article className="feature-tile" key={title} data-testid={`card-feature-${index}`}><Icon size={22} strokeWidth={1.7} className="text-[#176d64]" /><h3 className="display-font mt-5 text-[19px] font-bold tracking-[-.04em] text-[#282d46]">{title}</h3><p className="mt-3 text-[13px] leading-5">{text}</p></article>)}</div>
            <div className="mt-16 grid overflow-hidden rounded-xl border border-[#d0c7b7] bg-[#f9f6ee] md:grid-cols-[.9fr_1.1fr]">
              <div className="p-7 sm:p-10"><div className="mono-font text-[10px] uppercase tracking-[.12em] text-[#176d64]">Une file qui ne s’emballe pas</div><h3 className="display-font mt-4 text-3xl font-bold leading-tight tracking-[-.055em] text-[#282d46]">Jusqu’à 50 liens.<br />Un par un, proprement.</h3><p className="mt-4 max-w-[400px] text-[14px] leading-6 text-[#6e7079]">La queue séquentielle évite de saturer ta connexion et rend l’avancement lisible. Tu peux fermer l’app, la relancer et retrouver ton historique local.</p><div className="mt-7 flex flex-wrap gap-2"><span className="rounded-full bg-[#e9e3d7] px-3 py-1.5 font-mono text-[10px] text-[#555a68]">50 liens max</span><span className="rounded-full bg-[#e9e3d7] px-3 py-1.5 font-mono text-[10px] text-[#555a68]">Queue locale</span><span className="rounded-full bg-[#e9e3d7] px-3 py-1.5 font-mono text-[10px] text-[#555a68]">Historique local</span></div></div>
              <div className="flex min-h-[250px] items-end justify-center bg-[#282d46] p-7"><div className="w-full max-w-[440px] border-t border-[#525b77] pt-4 font-mono text-[10px] text-[#aeb6c5]"><div className="mb-5 flex justify-between text-[#eab14a]"><span>QUEUE / LOCAL</span><span>03 / 07 terminé</span></div><div className="mb-3 flex items-center gap-3"><span className="text-[#eab14a]">01</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#464e69]"><span className="block h-full w-[93%] rounded-full bg-[#eab14a]" /></span><span>93%</span></div><div className="mb-3 flex items-center gap-3 text-[#7e89a5]"><span>02</span><span className="h-1.5 flex-1 rounded-full bg-[#464e69]" /><span>attente</span></div><div className="flex items-center gap-3 text-[#7e89a5]"><span>03</span><span className="h-1.5 flex-1 rounded-full bg-[#464e69]" /><span>attente</span></div></div></div>
            </div>
          </div>
        </section>

        <section id="trust" className="scroll-mt-8 py-24 lg:py-32" aria-labelledby="trust-title">
          <div className="mx-auto grid max-w-[1240px] gap-6 px-5 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
            <div className="trust-panel rounded-xl p-8 sm:p-12"><div className="eyebrow">La confiance, concrètement</div><h2 id="trust-title" className="display-font mt-5 max-w-[530px] text-4xl font-bold leading-[1.02] tracking-[-.06em] sm:text-5xl">Tes médias. Ton PC. <span className="text-[#eab14a]">Ton contrôle.</span></h2><p className="mt-6 max-w-[520px] text-[15px] leading-6 text-[#c1c5cf]">AgenFetch n’est pas un service en ligne déguisé. L’application reste locale ; seules les recherches films et séries vont directement vers les catalogues que tu actives.</p><ul className="trust-list mt-9 grid gap-5 text-[13px] leading-5 text-[#e2e1d9]"><li><ShieldCheck size={17} /><span><strong className="text-[#f8f3e8]">Pas de cloud AgenStudio.</strong><br />Aucun compte, aucune télémétrie et aucun média envoyé chez nous.</span></li><li><LockKeyhole size={17} /><span><strong className="text-[#f8f3e8]">Clés protégées.</strong><br />Les clés SubDL et OpenSubtitles sont chiffrées avec la protection Windows.</span></li><li><PackageCheck size={17} /><span><strong className="text-[#f8f3e8]">Composants vérifiables.</strong><br />Installateur, moteur optionnel et runtimes sont contrôlés par SHA-256.</span></li></ul><a className="mt-9 inline-flex items-center gap-2 text-[13px] font-bold text-[#eab14a] underline underline-offset-4 hover:text-[#f8f3e8]" href={GITHUB_REPO} target="_blank" rel="noreferrer" data-testid="link-trust-repository">Inspecter le code sur GitHub <ExternalLink size={14} /></a></div>
            <div className="flex flex-col justify-between rounded-xl border border-[#d5cec0] bg-[#f7f3ea] p-8 sm:p-10"><div><div className="eyebrow">Avant d’installer</div><h3 className="display-font mt-5 text-3xl font-bold leading-tight tracking-[-.05em] text-[#282d46]">Une beta transparente.</h3><p className="mt-4 text-[14px] leading-6 text-[#6e7079]">Windows SmartScreen peut signaler que l’application n’est pas encore signée. La v{PRODUCT_VERSION} est distribuée directement depuis GitHub, avec son code source et ses empreintes de vérification.</p><div className="release-facts mt-8"><span>v{PRODUCT_VERSION}</span><span>{INSTALLER_SIZE}</span><span>Windows x64</span></div></div><div className="mt-10 border-t border-[#d5cec0] pt-5"><p className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b7f87]">Usage autorisé</p><p className="mt-3 text-[13px] leading-5 text-[#555a68]">Utilise AgenFetch pour tes propres contenus, le libre de droits ou ce que tu as l’autorisation d’enregistrer.</p><a className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-[#176d64] underline underline-offset-4" href="#mentions-legales">Lire les conditions <ArrowRight size={12} /></a></div></div>
          </div>
        </section>

        <section className="story-final mx-auto max-w-[1240px] px-5 pb-24 lg:px-8 lg:pb-32" aria-labelledby="final-story-title">
          <Reveal className="story-final-card">
            <div className="story-final-image"><img src={asset('generated/story-local-result.jpg')} alt="Bureau lumineux avec un ordinateur et un disque externe local" data-testid="img-story-local-result" /></div>
            <div className="story-final-copy"><div className="eyebrow">03 / Ce qui reste</div><h2 id="final-story-title" className="display-font mt-5 max-w-[420px] text-4xl font-bold leading-[1.01] tracking-[-.06em] text-[#282d46] sm:text-5xl">Une petite app. Une vraie sensation de contrôle.</h2><p className="mt-5 max-w-[390px] text-[15px] leading-6 text-[#6e7079]">Tu sais où est le fichier, ce qui s’est passé et ce qui va suivre. C’est ça, le confort d’un outil local bien fait.</p><a className="mt-7 inline-flex items-center gap-2 text-[13px] font-bold text-[#176d64] underline decoration-[#eab14a] decoration-2 underline-offset-4 hover:text-[#282d46]" href="#download" data-testid="link-final-download">Passer à l’installation <ArrowRight size={15} /></a></div>
          </Reveal>
        </section>

        <section id="download" className="scroll-mt-8 pb-24 lg:pb-32" aria-labelledby="download-title">
          <div className="download-layout mx-5 lg:mx-auto lg:max-w-[1190px]">
            <div className="download-panel rounded-xl px-5 py-10 sm:px-12 sm:py-16">
              <div className="max-w-[670px]">
                <div className="eyebrow" style={{ color: '#282d46' }}>Téléchargement beta</div>
                <h2 id="download-title" className="display-font mt-5 text-[2rem] font-bold leading-[1.01] tracking-[-.06em] text-[#282d46] sm:text-4xl lg:text-6xl">Prêt à installer AgenFetch ?</h2>
                <p className="mt-5 max-w-[560px] text-[15px] leading-6 text-[#4c4b46]">AgenFetch Desktop {PRODUCT_VERSION} pour Windows 10 / 11 x64 · {INSTALLER_SIZE}. Téléchargements autorisés et sous-titres multilingues, dans une seule application locale.</p>
                <div className="download-actions mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <FileDownload className="button-dark" href={setupExe} filename={setupName} testId="link-download-release"><ArrowDownToLine size={17} /> Télécharger pour Windows</FileDownload>
                  <a className="button-ghost !border-[#b49345] !bg-[#f3ca72]" href={GITHUB_REPO} target="_blank" rel="noreferrer" data-testid="link-download-source"><Github size={16} /> Voir le code source</a>
                </div>
              </div>
            </div>
            <aside className="extension-panel rounded-xl border border-[#d5cec0] bg-[#f7f3ea] px-6 py-8 sm:px-8 sm:py-10" data-testid="card-extension-download">
              <p className="mono-font text-[10px] uppercase tracking-[.12em] text-[#176d64]">Optionnel · Chrome / Edge</p>
              <h3 className="display-font mt-4 text-[1.65rem] font-bold leading-[1.08] tracking-[-.05em] text-[#282d46]">Depuis YouTube, en un clic</h3>
              <p className="mt-4 text-[14px] leading-6 text-[#6e7079]">Après l’app. Pas encore sur le Chrome Web Store : tu charges un dossier, ou le ZIP de la Release.</p>
              <FileDownload className="button-dark mt-6 !px-4 !py-3 text-[13px]" href={extensionZip} filename="AgenFetch-Extension.zip" testId="link-download-extension"><Puzzle size={16} /> Télécharger l’extension</FileDownload>
              <ol className="extension-steps mt-6">
                <li>Extrais le ZIP, ou ouvre le dossier livré avec l’app (À propos).</li>
                <li>Va sur chrome://extensions ou edge://extensions, mode développeur.</li>
                <li>Charge l’extension non empaquetée et sélectionne ce dossier.</li>
              </ol>
            </aside>
          </div>
          <div className="mx-5 mt-5 flex max-w-[1190px] flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-[#665d4b] lg:mx-auto">
            <button className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-[#282d46]" type="button" data-testid="button-copy-checksum" onClick={copyChecksum}>{copied ? <Check size={11} /> : <Copy size={11} />}{copied ? 'Copié' : 'SHA-256 des fichiers'} </button>
            <a className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-[#282d46]" href={checksums} download="SHA256SUMS.txt" rel="noreferrer" data-testid="link-download-checksums">Télécharger SHA256SUMS.txt</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#3d4050] bg-[#282d46] text-[#f8f3e8]" data-testid="footer-site">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8"><div><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center overflow-hidden rounded-[8px]"><img src={asset('assets/agenfetch-mark.svg')} alt="" width="32" height="32" /></span><span className="display-font text-[15px] font-bold">AgenStudio / AgenFetch</span></div><p className="mt-5 max-w-[330px] text-[13px] leading-5 text-[#a9adba]">Tes vidéos et leurs sous-titres, près de toi — pas perdus dans un cloud.</p><p className="mt-8 font-mono text-[10px] uppercase tracking-[.12em] text-[#737a91]">Electron beta {PRODUCT_VERSION} · Windows x64</p></div><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#eab14a]">Explorer</p><div className="mt-4 flex flex-col items-start gap-3 text-[13px]">{navItems.slice(0, 3).map((item) => <a className="footer-link" key={item.href} href={item.href} data-testid={`link-footer-${item.href.slice(1)}`} onClick={(event) => { event.preventDefault(); scrollToSection(item.href); }}>{item.label}</a>)}<a className="footer-link inline-flex items-center gap-1" href={GITHUB_REPO} target="_blank" rel="noreferrer" data-testid="link-footer-github">GitHub <ExternalLink size={12} /></a></div></div><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#eab14a]">À garder en tête</p><p className="mt-4 max-w-[260px] text-[13px] leading-5 text-[#a9adba]">Enregistre uniquement tes contenus, le libre de droits, ou ce pour quoi tu as une autorisation.</p><a className="footer-link mt-4 inline-block text-[13px]" href="#mentions-legales" data-testid="link-footer-legal">Mentions légales</a></div></div>
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 border-t border-[#3d4050] px-5 py-5 font-mono text-[10px] text-[#737a91] sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© 2026 AgenStudio. Open source sous licence MIT.</span><a className="hover:text-[#f8f3e8]" href="#mentions-legales" data-testid="link-footer-legal-copy">Mentions légales · usage autorisé</a></div>
      </footer>
    </div>
  );
}

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

function LegalPage() {
  const { setupExe, setupName } = useReleaseLinks();
  useEffect(() => {
    document.title = 'Mentions légales — AgenFetch';
    window.scrollTo(0, 0);
    const description = 'Mentions légales, usage autorisé et confidentialité d’AgenFetch Desktop, application Windows locale éditée par AgenStudio.';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }, []);

  return (
    <div className="agen-page min-h-[100dvh]">
      <SiteHeader variant="legal" setupExe={setupExe} setupName={setupName} />

      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-10 lg:px-8 lg:pb-32 lg:pt-16">
        <p className="eyebrow">Informations légales</p>
        <h1 className="display-font mt-5 text-4xl font-bold leading-[1.05] tracking-[-.06em] text-[#282d46] sm:text-5xl">Mentions légales</h1>
        <p className="mt-5 text-[15px] leading-6 text-[#6e7079]">Dernière mise à jour : 30 août 2026. Ces mentions s’appliquent au site vitrine AgenFetch et à l’application de bureau associée.</p>

        <section className="legal-block mt-14" aria-labelledby="legal-publisher">
          <h2 id="legal-publisher" className="display-font text-2xl font-bold tracking-[-.04em] text-[#282d46]">Éditeur</h2>
          <p className="mt-4 text-[15px] leading-6 text-[#555a68]">Le site et le logiciel AgenFetch sont édités par <strong>AgenStudio</strong>, projet open source indépendant, sans immatriculation au RCS communiquée à cette date.</p>
          <ul className="mt-4 grid gap-2 text-[14px] leading-6 text-[#555a68]">
            <li>Nom commercial : AgenStudio / AgenFetch</li>
            <li>Dépôt source : <a className="font-semibold text-[#176d64] underline underline-offset-2" href={GITHUB_REPO} target="_blank" rel="noreferrer">github.com/EagleFox31/agenfetch-desktop</a></li>
            <li>Contact : issues du dépôt GitHub ci-dessus</li>
            <li>Directeur de la publication : le mainteneur du dépôt EagleFox31</li>
          </ul>
        </section>

        <section className="legal-block mt-12" aria-labelledby="legal-host">
          <h2 id="legal-host" className="display-font text-2xl font-bold tracking-[-.04em] text-[#282d46]">Hébergement</h2>
          <p className="mt-4 text-[15px] leading-6 text-[#555a68]">Le site vitrine est hébergé par Cloudflare Workers.</p>
          <ul className="mt-4 grid gap-2 text-[14px] leading-6 text-[#555a68]">
            <li>Cloudflare, Inc.</li>
            <li>Service d’hébergement et de diffusion du site</li>
            <li><a className="font-semibold text-[#176d64] underline underline-offset-2" href="https://www.cloudflare.com" target="_blank" rel="noreferrer">cloudflare.com</a></li>
          </ul>
        </section>

        <section className="legal-block mt-12" aria-labelledby="legal-usage">
          <h2 id="legal-usage" className="display-font text-2xl font-bold tracking-[-.04em] text-[#282d46]">Usage autorisé</h2>
          <p className="mt-4 text-[15px] leading-6 text-[#555a68]">AgenFetch est un logiciel local qui pilote yt-dlp. Il est destiné uniquement :</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[14px] leading-6 text-[#555a68]">
            <li>à tes propres contenus ;</li>
            <li>aux œuvres libres de droits ou sous licence le permettant ;</li>
            <li>aux contenus pour lesquels tu disposes d’une autorisation du titulaire.</li>
          </ul>
          <p className="mt-4 text-[15px] leading-6 text-[#555a68]">Les conditions d’utilisation de YouTube interdisent le téléchargement des contenus hors des fonctions officielles de la plateforme. L’utilisateur est seul responsable de l’usage qu’il fait du logiciel et du respect du droit d’auteur.</p>
          <p className="mt-4 text-[15px] leading-6 text-[#555a68]">AgenFetch ne contourne pas les mesures techniques de protection (DRM), ne demande aucun compte, mot de passe ou cookie YouTube, et n’héberge aucune vidéo téléchargée.</p>
        </section>

        <section className="legal-block mt-12" aria-labelledby="legal-privacy">
          <h2 id="legal-privacy" className="display-font text-2xl font-bold tracking-[-.04em] text-[#282d46]">Confidentialité</h2>
          <p className="mt-4 text-[15px] leading-6 text-[#555a68]">AgenStudio ne collecte pas de données personnelles via l’application : pas de compte, pas de télémétrie, pas de serveur AgenStudio. L’historique et la file restent sur l’ordinateur. L’extension transmet uniquement l’URL YouTube ouverte à l’application installée sur la même machine.</p>
          <p className="mt-4 text-[15px] leading-6 text-[#555a68]">Pour la recherche de sous-titres de films et séries, le titre, l’année, la saison, l’épisode et les langues sélectionnées sont envoyés directement aux fournisseurs activés. Les fichiers vidéo ne sont pas téléversés. Les éventuelles clés API sont chiffrées localement par la protection Windows.</p>
          <p className="mt-4 text-[15px] leading-6 text-[#555a68]">Le site vitrine peut interroger l’API publique GitHub pour afficher le lien de la dernière version. Cette requête est traitée par GitHub, Inc., selon sa propre politique de confidentialité.</p>
        </section>

        <section className="legal-block mt-12" aria-labelledby="legal-licences">
          <h2 id="legal-licences" className="display-font text-2xl font-bold tracking-[-.04em] text-[#282d46]">Licences</h2>
          <p className="mt-4 text-[15px] leading-6 text-[#555a68]">Le code AgenFetch est publié sous licence MIT. Les composants redistribués ou proposés séparément — yt-dlp, FFmpeg LGPL, QuickJS-NG, Deno et Electron — conservent leurs licences, détaillées dans le fichier THIRD_PARTY_NOTICES du dépôt.</p>
        </section>
      </main>

      <footer className="border-t border-[#3d4050] bg-[#282d46] text-[#f8f3e8]" data-testid="footer-legal">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-5 font-mono text-[10px] text-[#737a91] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© 2026 AgenStudio. Open source sous licence MIT.</span>
          <a className="hover:text-[#f8f3e8]" href="#top" data-testid="link-legal-footer-home">Retour à l’accueil</a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const hash = useHash();
  const page = decodeURIComponent(hash.replace(/^#/, '')).split(/[/?]/)[0];
  if (page === 'mentions-legales') return <LegalPage />;
  return <Home />;
}
