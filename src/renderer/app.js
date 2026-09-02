'use strict';

const api = window.agenFetch;

const refs = {
  navItems: [...document.querySelectorAll('[data-view-target]')],
  views: [...document.querySelectorAll('.view')],
  pageTitle: document.querySelector('#page-title'),
  pageEyebrow: document.querySelector('#page-eyebrow'),
  pageIntro: document.querySelector('#page-intro'),
  form: document.querySelector('#download-form'),
  url: document.querySelector('#video-url'),
  urlError: document.querySelector('#url-error'),
  paste: document.querySelector('#paste-url'),
  metadataPreview: document.querySelector('#metadata-preview'),
  metadataThumbnail: document.querySelector('#metadata-thumbnail'),
  metadataDuration: document.querySelector('#metadata-duration'),
  metadataKind: document.querySelector('#metadata-kind'),
  metadataTitle: document.querySelector('#metadata-title'),
  metadataUploader: document.querySelector('#metadata-uploader'),
  quality: document.querySelector('#quality'),
  qualityGroup: document.querySelector('#quality-group'),
  container: document.querySelector('#container'),
  containerGroup: document.querySelector('#container-group'),
  performanceProfile: document.querySelector('#performance-profile'),
  subtitleMode: document.querySelector('#subtitle-mode'),
  subtitleFormat: document.querySelector('#subtitle-format'),
  includeAutoSubtitles: document.querySelector('#include-auto-subtitles'),
  youtubeSubtitleTracks: document.querySelector('#youtube-subtitle-tracks'),
  subtitleTrackSummary: document.querySelector('#subtitle-track-summary'),
  subtitlesGroup: document.querySelector('#subtitles-group'),
  outputFolder: document.querySelector('#output-folder'),
  chooseFolder: document.querySelector('#choose-folder'),
  openFolder: document.querySelector('#open-folder'),
  playlist: document.querySelector('#playlist'),
  compatibilityMode: document.querySelector('#compatibility-mode'),
  start: document.querySelector('#start-download'),
  pause: document.querySelector('#pause-download'),
  cancel: document.querySelector('#cancel-download'),
  toggleLog: document.querySelector('#toggle-log'),
  log: document.querySelector('#download-log'),
  progressTitle: document.querySelector('#progress-title'),
  progressPhase: document.querySelector('#progress-phase'),
  progressRing: document.querySelector('#progress-ring'),
  progressFill: document.querySelector('#progress-fill'),
  progressPercent: document.querySelector('#progress-percent'),
  progressSpeed: document.querySelector('#progress-speed'),
  progressEta: document.querySelector('#progress-eta'),
  progressSize: document.querySelector('#progress-size'),
  progressNetwork: document.querySelector('#progress-network'),
  activityDot: document.querySelector('#activity-dot'),
  ytDlpStatus: document.querySelector('#yt-dlp-status'),
  ffmpegStatus: document.querySelector('#ffmpeg-status'),
  jsRuntimeStatus: document.querySelector('#js-runtime-status'),
  checkSystem: document.querySelector('#check-system'),
  updateYtDlp: document.querySelector('#update-yt-dlp'),
  queueList: document.querySelector('#queue-list'),
  queueCount: document.querySelector('#queue-count'),
  clearFinishedQueue: document.querySelector('#clear-finished-queue'),
  historyList: document.querySelector('#history-list'),
  clearHistory: document.querySelector('#clear-history'),
  toast: document.querySelector('#toast'),
  consentOverlay: document.querySelector('#consent-overlay'),
  consentCheck: document.querySelector('#consent-accept-check'),
  consentAccept: document.querySelector('#consent-accept'),
  sidebarVersion: document.querySelector('#sidebar-version'),
  overallHealthDot: document.querySelector('#overall-health-dot'),
  overallHealthLabel: document.querySelector('#overall-health-label'),
  homeAddLink: document.querySelector('#home-add-link'),
  homeChooseFile: document.querySelector('#home-choose-file'),
  homeViewQueue: document.querySelector('#home-view-queue'),
  homeActivityEmpty: document.querySelector('#home-activity-empty'),
  homeActivity: document.querySelector('#home-activity'),
  homeProgressTitle: document.querySelector('#home-progress-title'),
  homeProgressPhase: document.querySelector('#home-progress-phase'),
  homeProgressBar: document.querySelector('#home-progress-bar'),
  homeProgressPercent: document.querySelector('#home-progress-percent'),
  homeProgressSpeed: document.querySelector('#home-progress-speed'),
  homeProgressEta: document.querySelector('#home-progress-eta'),
  homePhaseSteps: [...document.querySelectorAll('.phase-steps [data-phase]')],
  appVersion: document.querySelector('#app-version'),
  updateCheckedAt: document.querySelector('#update-checked-at'),
  checkAppUpdate: document.querySelector('#check-app-update'),
  updateStatusLabel: document.querySelector('#update-status-label'),
  updateStatusTitle: document.querySelector('#update-status-title'),
  updateStatusCopy: document.querySelector('#update-status-copy'),
  updateActions: document.querySelector('#update-actions'),
  downloadAppUpdate: document.querySelector('#download-app-update'),
  openUpdateWebsite: document.querySelector('#open-update-website'),
  updateProgress: document.querySelector('#update-progress'),
  updateProgressBar: document.querySelector('#update-progress-bar'),
  updateProgressPercent: document.querySelector('#update-progress-percent'),
  updateProgressMeta: document.querySelector('#update-progress-meta'),
  cancelAppUpdate: document.querySelector('#cancel-app-update'),
  installAppUpdate: document.querySelector('#install-app-update'),
  systemStatus: document.querySelector('.system-status'),
  appMenuButton: document.querySelector('#app-menu-button'),
  appMenu: document.querySelector('#app-menu'),
  extensionFolderPath: document.querySelector('#extension-folder-path'),
  openExtensionFolder: document.querySelector('#open-extension-folder'),
  subtitleEngineTitle: document.querySelector('#subtitle-engine-title'),
  subtitleEngineBanner: document.querySelector('#subtitle-engine-banner'),
  subtitleEngineCopy: document.querySelector('#subtitle-engine-copy'),
  installSubtitleEngine: document.querySelector('#install-subtitle-engine'),
  subtitleEngineProgress: document.querySelector('#subtitle-engine-progress'),
  subtitleEngineProgressBar: document.querySelector('#subtitle-engine-progress-bar'),
  subtitleEngineProgressLabel: document.querySelector('#subtitle-engine-progress-label'),
  subtitleSearchForm: document.querySelector('#subtitle-search-form'),
  subtitleMediaPath: document.querySelector('#subtitle-media-path'),
  chooseSubtitleMedia: document.querySelector('#choose-subtitle-media'),
  subtitleTitle: document.querySelector('#subtitle-title'),
  subtitleYear: document.querySelector('#subtitle-year'),
  subtitleSeason: document.querySelector('#subtitle-season'),
  subtitleEpisode: document.querySelector('#subtitle-episode'),
  externalLanguagePicker: document.querySelector('#external-language-picker'),
  externalSubtitleFormat: document.querySelector('#external-subtitle-format'),
  searchExternalSubtitles: document.querySelector('#search-external-subtitles'),
  providerCount: document.querySelector('#provider-count'),
  subdlApiKey: document.querySelector('#subdl-api-key'),
  opensubtitlesApiKey: document.querySelector('#opensubtitles-api-key'),
  subdlConfigured: document.querySelector('#subdl-configured'),
  opensubtitlesConfigured: document.querySelector('#opensubtitles-configured'),
  saveSubtitleProviders: document.querySelector('#save-subtitle-providers'),
  subtitleResultsTitle: document.querySelector('#subtitle-results-title'),
  subtitleResultCount: document.querySelector('#subtitle-result-count'),
  subtitleResults: document.querySelector('#subtitle-results'),
  jsRuntimeTitle: document.querySelector('#js-runtime-title'),
  jsRuntimeCopy: document.querySelector('#js-runtime-copy'),
  installDenoRuntime: document.querySelector('#install-deno-runtime'),
  denoRuntimeProgress: document.querySelector('#deno-runtime-progress'),
  denoRuntimeProgressBar: document.querySelector('#deno-runtime-progress-bar'),
  denoRuntimeProgressPercent: document.querySelector('#deno-runtime-progress-percent'),
  denoRuntimeProgressMeta: document.querySelector('#deno-runtime-progress-meta')
};

const state = {
  running: false,
  submitting: false,
  outputFolder: localStorage.getItem('agenfetch.outputFolder') || '',
  metadata: null,
  metadataUrl: '',
  queue: { activeId: null, items: [] },
  lastActiveId: null,
  toastTimer: null,
  previewTimer: null,
  previewRequestId: 0,
  previewingUrl: '',
  appUpdate: null,
  subtitleEngineInstalled: false,
  subtitleResults: [],
  subtitleQuery: null,
  system: null,
  lastProgress: null
};

function showToast(message, type = 'info') {
  clearTimeout(state.toastTimer);
  refs.toast.textContent = message;
  refs.toast.classList.toggle('is-error', type === 'error');
  refs.toast.classList.add('is-visible');
  state.toastTimer = setTimeout(() => refs.toast.classList.remove('is-visible'), 4200);
}

function setView(viewId) {
  refs.views.forEach((view) => view.classList.toggle('is-visible', view.id === viewId));
  refs.navItems.forEach((item) => item.classList.toggle('is-active', item.dataset.viewTarget === viewId));
  refs.pageTitle.textContent = {
    'home-view': 'Que veux-tu préparer ?',
    'download-view': 'Téléchargements',
    'history-view': 'Bibliothèque',
    'subtitles-view': 'Sous-titres',
    'about-view': 'Réglages'
  }[viewId] || 'AgenFetch';
  refs.pageEyebrow.textContent = {
    'home-view': 'Assistant média local',
    'download-view': 'Vidéo · audio · playlists',
    'history-view': 'Médias locaux',
    'subtitles-view': 'Films · séries · multilingue',
    'about-view': 'Application et composants'
  }[viewId] || 'AgenFetch';
  refs.pageIntro.textContent = {
    'home-view': 'Télécharge, sous-titre et organise tes médias sans compte ni cloud AgenStudio.',
    'download-view': 'Ajoute un lien, choisis le format et laisse AgenFetch gérer la file.',
    'history-view': 'Retrouve ce qu’AgenFetch a préparé sur cet ordinateur.',
    'subtitles-view': 'Choisis un fichier ; AgenFetch identifie le média et compare les pistes disponibles.',
    'about-view': 'Configure les outils, les fournisseurs et les mises à jour.'
  }[viewId] || '';
  if (viewId === 'history-view') renderHistory();
  if (viewId === 'subtitles-view') loadSubtitleWorkspace();
  if (viewId === 'about-view') loadProviderStatus();
}

function setStatus(element, result) {
  element.classList.remove('is-checking', 'is-ok', 'is-error');
  element.classList.add(result?.installed ? 'is-ok' : 'is-error');
  element.title = result?.installed
    ? `${result.version} • ${result.source || 'disponible'}`
    : `Introuvable • ${result?.source || 'système'}`;
}

async function checkSystem({ quiet = false } = {}) {
  [refs.ytDlpStatus, refs.ffmpegStatus, refs.jsRuntimeStatus].forEach((item) => {
    item.classList.remove('is-ok', 'is-error');
    item.classList.add('is-checking');
  });
  try {
    const result = await api.checkSystem();
    setStatus(refs.ytDlpStatus, result.ytDlp);
    setStatus(refs.ffmpegStatus, result.ffmpeg);
    setStatus(refs.jsRuntimeStatus, result.jsRuntime);
    applyJsRuntimeStatus(result);
    const ready = Boolean(result.ytDlp?.installed && result.ffmpeg?.installed && result.jsRuntime?.installed);
    refs.overallHealthDot.classList.remove('is-checking', 'is-ok', 'is-error');
    refs.overallHealthDot.classList.add(ready ? 'is-ok' : 'is-error');
    refs.overallHealthLabel.textContent = ready ? 'Tout fonctionne' : 'Action requise';
    if (!result.portable) {
      showToast('Un outil intégré manque. Réinstalle AgenFetch ou relance le diagnostic.', 'error');
    } else if (!quiet) {
      showToast(`AgenFetch est prêt : yt-dlp, FFmpeg et ${result.deno?.installed ? 'Deno' : 'QuickJS'} sont disponibles.`);
    }
    return result;
  } catch (error) {
    refs.overallHealthDot.classList.remove('is-checking', 'is-ok');
    refs.overallHealthDot.classList.add('is-error');
    refs.overallHealthLabel.textContent = 'Diagnostic indisponible';
    showToast(error.message || 'Impossible de vérifier les outils.', 'error');
    return null;
  }
}

function applyJsRuntimeStatus(result) {
  state.system = result;
  if (!refs.jsRuntimeTitle) return;
  const usesDeno = Boolean(result?.deno?.installed);
  refs.jsRuntimeTitle.textContent = usesDeno ? 'Deno actif' : 'QuickJS léger actif';
  refs.jsRuntimeCopy.textContent = usesDeno
    ? 'AgenFetch privilégie Deno pour son isolation renforcée des scripts JavaScript.'
    : 'QuickJS garde l’installation légère. Deno reste disponible comme runtime renforcé optionnel.';
  refs.installDenoRuntime.hidden = usesDeno;
}

async function updateYtDlp() {
  const previousLabel = refs.updateYtDlp.textContent;
  refs.updateYtDlp.disabled = true;
  refs.updateYtDlp.textContent = 'Mise à jour…';
  try {
    const result = await api.updateYtDlp();
    showToast(result.message || 'yt-dlp est à jour.');
    await checkSystem({ quiet: true });
  } catch (error) {
    showToast(error.message || 'La mise à jour de yt-dlp a échoué.', 'error');
  } finally {
    refs.updateYtDlp.textContent = previousLabel;
    refs.updateYtDlp.disabled = state.running;
  }
}

function currentMode() {
  return document.querySelector('input[name="mode"]:checked')?.value || 'video';
}

function syncModeUi() {
  const isAudio = currentMode() === 'audio';
  [refs.qualityGroup, refs.containerGroup, refs.subtitlesGroup].forEach((group) => {
    group.style.opacity = isAudio ? '0.45' : '1';
  });
  refs.quality.disabled = isAudio;
  refs.container.disabled = isAudio;
  refs.subtitleMode.disabled = isAudio;
  refs.subtitleFormat.disabled = isAudio;
  refs.includeAutoSubtitles.disabled = isAudio;
  refs.youtubeSubtitleTracks.querySelectorAll('input').forEach((input) => { input.disabled = isAudio; });
}

function setRunning(value) {
  state.running = value;
  refs.pause.disabled = !value;
  refs.cancel.disabled = !value;
  refs.updateYtDlp.disabled = value;
  refs.activityDot.classList.toggle('is-running', value);
}

function updateProgress(progress) {
  const value = Number(progress.percent || 0);
  const bounded = Math.max(0, Math.min(100, value));
  refs.progressFill.style.width = `${bounded}%`;
  refs.progressPercent.textContent = progress.percentLabel || `${value.toFixed(1)}%`;
  refs.progressPhase.textContent = progress.phaseLabel || 'Téléchargement du fichier';
  refs.progressSpeed.textContent = progress.speed || '—';
  refs.progressEta.textContent = progress.eta || '—';
  refs.progressSize.textContent = progress.total === '—'
    ? progress.downloaded || '—'
    : `${progress.downloaded} / ${progress.total}`;
  refs.homeProgressBar.style.width = `${bounded}%`;
  refs.homeProgressPercent.textContent = progress.percentLabel || `${value.toFixed(1)}%`;
  refs.homeProgressPhase.textContent = progress.phaseLabel || 'Téléchargement du fichier';
  refs.homeProgressSpeed.textContent = progress.speed && progress.speed !== '—' ? progress.speed : 'Vitesse —';
  refs.homeProgressEta.textContent = progress.eta && progress.eta !== '—' ? `${progress.eta} restantes` : 'Temps restant —';
  const effectivePhase = progress.phase === 'audio' || progress.phase === 'merge' ? progress.phase : 'video';
  const order = ['video', 'audio', 'merge'];
  const activeIndex = order.indexOf(effectivePhase);
  refs.homePhaseSteps.forEach((step, index) => {
    step.classList.toggle('is-active', index === activeIndex);
    step.classList.toggle('is-done', index < activeIndex);
  });
  state.lastProgress = progress;
}

function resetProgress() {
  updateProgress({ percent: 0, percentLabel: '0%', speed: '—', eta: '—', downloaded: '—', total: '—', phase: 'video', phaseLabel: 'Préparation du fichier' });
  refs.log.textContent = '';
  refs.activityDot.classList.remove('is-error');
  state.lastProgress = null;
}

function appendLog(line) {
  if (!line) return;
  const existing = refs.log.textContent.split('\n').slice(-80);
  existing.push(line);
  refs.log.textContent = existing.join('\n');
  refs.log.scrollTop = refs.log.scrollHeight;
}

function statusLabel(status) {
  return {
    waiting: 'En attente',
    running: 'En cours',
    paused: 'En pause',
    completed: 'Terminé',
    failed: 'Échec',
    cancelled: 'Annulé'
  }[status] || status;
}

function performanceLabel(profile) {
  return {
    eco: 'Éco · 2 flux',
    normal: 'Normal · 4 flux',
    turbo: 'Turbo · 8 flux'
  }[profile] || 'Normal · 4 flux';
}

function extractUrls() {
  return refs.url.value.split(/\s+/).map((value) => value.trim()).filter(Boolean);
}

function isPreviewableUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    const host = parsed.hostname.toLowerCase();
    const allowed = new Set([
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'music.youtube.com',
      'youtu.be'
    ]);
    if (parsed.protocol !== 'https:' || !allowed.has(host)) return false;
    if (host === 'youtu.be') return parsed.pathname.length > 1;
    if (parsed.pathname === '/watch') return (parsed.searchParams.get('v') || '').length >= 8;
    if (parsed.pathname.startsWith('/shorts/')) {
      return (parsed.pathname.split('/').filter(Boolean)[1] || '').length >= 8;
    }
    if (parsed.pathname.startsWith('/live/')) {
      return (parsed.pathname.split('/').filter(Boolean)[1] || '').length >= 8;
    }
    return parsed.pathname === '/playlist' && Boolean(parsed.searchParams.get('list'));
  } catch {
    return false;
  }
}

function clearMetadata() {
  state.previewRequestId += 1;
  state.previewingUrl = '';
  state.metadata = null;
  state.metadataUrl = '';
  refs.metadataPreview.hidden = true;
  refs.metadataPreview.classList.remove('is-loading');
  refs.metadataThumbnail.removeAttribute('src');
  renderYoutubeSubtitleTracks([]);
}

function selectedYoutubeSubtitleLanguages() {
  return [...refs.youtubeSubtitleTracks.querySelectorAll('input[type="checkbox"]:checked')]
    .map((input) => input.value);
}

function renderYoutubeSubtitleTracks(tracks) {
  const values = Array.isArray(tracks) ? tracks : [];
  refs.youtubeSubtitleTracks.replaceChildren();
  const items = values.length
    ? values
    : [
        { code: 'fr', name: 'Français', manual: false, automatic: false, fallback: true },
        { code: 'en', name: 'English', manual: false, automatic: false, fallback: true },
        { code: 'all', name: 'Toutes', manual: false, automatic: false, fallback: true }
      ];
  items.slice(0, 36).forEach((track) => {
    const label = document.createElement('label');
    label.className = 'language-track';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = track.code;
    input.checked = track.code === 'fr' || (track.code === 'en' && !items.some((item) => item.code === 'fr'));
    input.dataset.automaticOnly = String(Boolean(track.automatic && !track.manual));
    const code = document.createElement('b');
    code.textContent = String(track.code).toUpperCase();
    const copy = document.createElement('span');
    const availability = track.fallback
      ? 'langue souhaitée'
      : track.manual ? 'officiel' : 'automatique';
    copy.textContent = `${track.name || track.code} · ${availability}`;
    label.append(input, code, copy);
    refs.youtubeSubtitleTracks.append(label);
  });
  refs.subtitleTrackSummary.textContent = values.length
    ? `${values.length} langue${values.length > 1 ? 's' : ''} détectée${values.length > 1 ? 's' : ''}.`
    : 'Choisis une langue souhaitée ; les pistes exactes apparaîtront après analyse.';
  syncModeUi();
}

function showPreviewLoading() {
  refs.metadataTitle.textContent = 'Analyse du lien…';
  refs.metadataUploader.textContent = 'Récupération du titre, de la chaîne et de la miniature';
  refs.metadataDuration.textContent = '…';
  refs.metadataKind.textContent = 'APERÇU';
  refs.metadataThumbnail.hidden = true;
  refs.metadataThumbnail.removeAttribute('src');
  refs.metadataPreview.classList.add('is-loading');
  refs.metadataPreview.hidden = false;
}

function scheduleAutoPreview() {
  clearTimeout(state.previewTimer);
  if (!refs.consentOverlay.hidden) return;
  const urls = extractUrls();
  if (urls.length !== 1 || !isPreviewableUrl(urls[0])) {
    if (state.metadataUrl && state.metadataUrl !== urls[0]) clearMetadata();
    if (!urls.length) clearMetadata();
    return;
  }
  if (state.metadataUrl === urls[0] && state.metadata) return;
  if (state.previewingUrl === urls[0]) return;
  state.previewTimer = setTimeout(() => {
    inspectMetadata();
  }, 350);
}

async function inspectMetadata() {
  refs.urlError.textContent = '';
  if (!refs.consentOverlay.hidden) return;
  const urls = extractUrls();
  if (urls.length !== 1 || !isPreviewableUrl(urls[0])) {
    if (urls.length > 1) clearMetadata();
    return;
  }

  const url = urls[0];
  if (state.metadataUrl === url && state.metadata) return;
  if (state.previewingUrl === url) return;

  const requestId = ++state.previewRequestId;
  state.previewingUrl = url;
  showPreviewLoading();
  try {
    const metadata = await api.inspectMetadata({ url, playlist: refs.playlist.checked });
    if (requestId !== state.previewRequestId) return;
    state.metadata = metadata;
    state.metadataUrl = url;
    refs.metadataPreview.classList.remove('is-loading');
    refs.metadataTitle.textContent = metadata.title;
    refs.metadataUploader.textContent = metadata.uploader;
    refs.metadataDuration.textContent = metadata.durationLabel;
    refs.metadataKind.textContent = metadata.isPlaylist ? `PLAYLIST • ${metadata.itemCount} ÉLÉMENTS` : 'VIDÉO';
    renderYoutubeSubtitleTracks(metadata.subtitleTracks || []);
    refs.metadataThumbnail.hidden = !metadata.thumbnail;
    if (metadata.thumbnail) refs.metadataThumbnail.src = metadata.thumbnail;
    refs.metadataPreview.hidden = false;
  } catch (error) {
    if (requestId !== state.previewRequestId) return;
    clearMetadata();
    refs.urlError.textContent = error.message || 'Impossible d’obtenir l’aperçu.';
  } finally {
    if (requestId === state.previewRequestId) state.previewingUrl = '';
  }
}

function buildPayloads() {
  const urls = extractUrls();
  if (!urls.length) throw new Error('Colle au moins un lien YouTube.');
  if (urls.length > 50) throw new Error('Tu peux ajouter au maximum 50 liens à la fois.');

  const subtitleMode = refs.subtitleMode.value;
  const subtitleLanguages = selectedYoutubeSubtitleLanguages();
  if (subtitleMode !== 'none' && !subtitleLanguages.length) {
    throw new Error('Sélectionne au moins une langue de sous-titres.');
  }
  return urls.map((url) => ({
    url,
    title: urls.length === 1 && state.metadataUrl === url ? state.metadata?.title || '' : '',
    thumbnail: urls.length === 1 && state.metadataUrl === url ? state.metadata?.thumbnail || '' : '',
    mode: currentMode(),
    quality: refs.quality.value,
    container: refs.container.value,
    subtitles: 'none',
    subtitleMode,
    subtitleLanguages,
    subtitleFormat: refs.subtitleFormat.value,
    includeAutoSubtitles: refs.includeAutoSubtitles.checked,
    performanceProfile: refs.performanceProfile.value,
    outputFolder: state.outputFolder,
    playlist: refs.playlist.checked,
    compatibilityMode: refs.compatibilityMode.checked
  }));
}

function queueItemMeta(item) {
  if (item.mode === 'audio') return 'MP3';
  if (item.subtitleMode === 'only') {
    return `${String(item.subtitleFormat || 'srt').toUpperCase()} • sous-titres uniquement`;
  }
  const quality = item.quality === 'best' ? 'meilleure qualité' : `${item.quality}p`;
  const subtitle = item.subtitleMode && item.subtitleMode !== 'none' ? ' • sous-titres' : '';
  return `${String(item.container || 'mp4').toUpperCase()} • ${quality}${subtitle}`;
}

function renderQueue(snapshot) {
  state.queue = snapshot || { activeId: null, items: [] };
  const items = state.queue.items || [];
  const activeItem = items.find((item) => item.id === state.queue.activeId);
  refs.queueCount.textContent = String(items.length);
  refs.queueList.replaceChildren();

  refs.homeActivity.hidden = !activeItem;
  refs.homeActivityEmpty.hidden = Boolean(activeItem);
  if (activeItem) {
    refs.homeProgressTitle.textContent = activeItem.title || activeItem.url || 'Téléchargement en cours';
    if (!state.lastProgress) refs.homeProgressPhase.textContent = 'Préparation du fichier';
    refs.progressNetwork.textContent = performanceLabel(activeItem.performanceProfile);
  }

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'queue-empty';
    empty.textContent = 'Ajoute plusieurs liens : AgenFetch les traitera dans l’ordre.';
    refs.queueList.append(empty);
  }

  items.forEach((item, index) => {
    const row = document.createElement('article');
    row.className = 'queue-item';

    const order = document.createElement('span');
    order.className = 'queue-index';
    order.textContent = String(index + 1).padStart(2, '0');

    const copy = document.createElement('div');
    copy.className = 'queue-copy';
    const title = document.createElement('strong');
    title.textContent = item.title || item.url;
    title.title = item.url;
    const meta = document.createElement('small');
    meta.textContent = queueItemMeta(item);
    copy.append(title, meta);

    const status = document.createElement('span');
    status.className = `queue-status ${item.status}`;
    status.textContent = statusLabel(item.status);
    status.title = item.error || '';

    row.append(order, copy, status);
    if (item.status === 'waiting') {
      const remove = document.createElement('button');
      remove.className = 'icon-button queue-remove';
      remove.type = 'button';
      remove.textContent = '×';
      remove.title = 'Retirer de la file';
      remove.addEventListener('click', () => api.removeQueueItem(item.id));
      row.append(remove);
    } else if (item.status === 'paused') {
      const resume = document.createElement('button');
      resume.className = 'secondary-button compact queue-resume';
      resume.type = 'button';
      resume.textContent = 'Reprendre';
      resume.addEventListener('click', async () => {
        if (await api.resumeQueueItem(item.id)) showToast('Reprise du téléchargement…');
      });
      row.append(resume);
    }
    refs.queueList.append(row);
  });

  const nextActiveId = state.queue.activeId || null;
  if (nextActiveId && nextActiveId !== state.lastActiveId) {
    resetProgress();
    refs.progressTitle.textContent = 'Téléchargement en cours';
    refs.progressPhase.textContent = 'Préparation du fichier';
  }
  state.lastActiveId = nextActiveId;
  setRunning(Boolean(nextActiveId));
}

function youtubeThumbnailFromUrl(value) {
  try {
    const parsed = new URL(String(value || ''));
    const host = parsed.hostname.toLowerCase();
    const id = host === 'youtu.be'
      ? parsed.pathname.split('/').filter(Boolean)[0]
      : parsed.searchParams.get('v') || (parsed.pathname.match(/^\/(?:shorts|live)\/([^/]+)/)?.[1]);
    return id && /^[a-zA-Z0-9_-]{8,20}$/.test(id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
  } catch {
    return '';
  }
}

function historyArtwork(item) {
  return item.thumbnail || youtubeThumbnailFromUrl(item.url);
}

async function openHistoryMedia(item) {
  try {
    const error = await api.openMedia(item.destination);
    if (error) throw new Error(error);
  } catch (error) {
    showToast(error.message || 'Impossible d’ouvrir ce fichier.', 'error');
  }
}

async function revealHistoryMedia(item) {
  try {
    await api.showMediaInFolder(item.destination);
  } catch (error) {
    showToast(error.message || 'Impossible d’ouvrir l’emplacement du fichier.', 'error');
  }
}

async function renderHistory() {
  const items = await api.getHistory();
  refs.historyList.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<strong>Encore rien ici.</strong><span>Tes téléchargements apparaîtront dans cet historique local.</span>';
    refs.historyList.append(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'history-item';

    const artwork = document.createElement('div');
    artwork.className = `history-artwork ${item.mode || 'video'}`;
    const thumbnail = historyArtwork(item);
    if (thumbnail) {
      const image = document.createElement('img');
      image.src = thumbnail;
      image.alt = '';
      image.loading = 'lazy';
      image.addEventListener('error', () => image.remove());
      artwork.append(image);
    }
    const artworkFallback = document.createElement('span');
    artworkFallback.className = 'history-artwork-fallback';
    artworkFallback.textContent = item.mode === 'audio' ? '♪' : item.mode === 'subtitle' ? 'CC' : '▶';
    artwork.append(artworkFallback);
    const mediaKind = document.createElement('small');
    mediaKind.textContent = item.mode === 'audio' ? 'AUDIO' : item.mode === 'subtitle' ? 'SOUS-TITRE' : 'VIDÉO';
    artwork.append(mediaKind);

    const body = document.createElement('div');
    body.className = 'history-body';
    const title = document.createElement('strong');
    const destinationName = String(item.destination || '').split(/[\\/]/).filter(Boolean).pop();
    title.textContent = item.title || destinationName || item.url || 'Téléchargement';
    const meta = document.createElement('span');
    const date = item.finishedAt ? new Date(item.finishedAt).toLocaleString('fr-FR') : 'Date inconnue';
    const format = item.mode === 'audio'
      ? 'MP3'
      : item.mode === 'subtitle'
        ? `${String(item.container || 'srt').toUpperCase()} • ${String(item.subtitles || 'und').toUpperCase()}`
        : `${String(item.container || 'mp4').toUpperCase()} • ${item.quality === 'best' ? 'meilleure qualité' : `${item.quality}p`}`;
    meta.textContent = `${format} • ${date}`;
    body.append(title, meta);

    const status = document.createElement('span');
    status.className = `history-status ${item.status}`;
    status.textContent = statusLabel(item.status);
    body.append(status);

    if (item.destination && item.status === 'completed') {
      const actions = document.createElement('div');
      actions.className = 'history-actions';
      const open = document.createElement('button');
      open.className = 'primary-button compact';
      open.type = 'button';
      open.textContent = item.mode === 'subtitle' ? 'Ouvrir' : 'Lire';
      open.addEventListener('click', () => openHistoryMedia(item));
      const reveal = document.createElement('button');
      reveal.className = 'secondary-button compact';
      reveal.type = 'button';
      reveal.textContent = 'Emplacement';
      reveal.addEventListener('click', () => revealHistoryMedia(item));
      actions.append(open, reveal);
      body.append(actions);
    }

    row.append(artwork, body);
    refs.historyList.append(row);
  });
}

function configuredProviderCount(status) {
  return 1 + Object.values(status?.providers || {}).filter(Boolean).length;
}

async function loadProviderStatus() {
  try {
    const status = await api.getSubtitleProviderStatus();
    const count = configuredProviderCount(status);
    refs.providerCount.textContent = `${count} fournisseur${count > 1 ? 's' : ''}`;
    refs.subdlConfigured.textContent = status.providers?.subdl ? 'Configurée' : 'Absente';
    refs.opensubtitlesConfigured.textContent = status.providers?.opensubtitles ? 'Configurée' : 'Absente';
    refs.subdlConfigured.classList.toggle('is-configured', Boolean(status.providers?.subdl));
    refs.opensubtitlesConfigured.classList.toggle('is-configured', Boolean(status.providers?.opensubtitles));
    refs.subdlApiKey.placeholder = status.providers?.subdl ? 'Clé enregistrée' : 'Non configurée';
    refs.opensubtitlesApiKey.placeholder = status.providers?.opensubtitles ? 'Clé enregistrée' : 'Non configurée';
    if (!status.encryptionAvailable) {
      refs.saveSubtitleProviders.disabled = true;
      refs.saveSubtitleProviders.title = 'Le stockage sécurisé Windows est indisponible.';
    }
    return status;
  } catch (error) {
    showToast(error.message || 'Impossible de lire la configuration des fournisseurs.', 'error');
    return null;
  }
}

async function loadSubtitleEngineStatus() {
  try {
    const status = await api.getSubtitleEngineStatus();
    state.subtitleEngineInstalled = Boolean(status.installed);
    refs.installSubtitleEngine.hidden = status.installed;
    refs.subtitleEngineTitle.textContent = status.installed
      ? `Moteur ${status.version || ''} prêt`
      : 'Moteur de sous-titres non installé';
    refs.subtitleEngineCopy.textContent = status.installed
      ? `${(status.providers || []).length} connecteurs disponibles · ${status.source}`
      : 'Installe le composant signé par checksum lorsque tu en as besoin.';
    refs.searchExternalSubtitles.disabled = !status.installed;
    return status;
  } catch (error) {
    refs.subtitleEngineTitle.textContent = 'Diagnostic du moteur impossible';
    refs.subtitleEngineCopy.textContent = error.message || 'Réessaie dans un moment.';
    refs.searchExternalSubtitles.disabled = true;
    return null;
  }
}

async function loadSubtitleWorkspace() {
  await Promise.all([loadSubtitleEngineStatus(), loadProviderStatus()]);
}

function selectedExternalLanguages() {
  return [...refs.externalLanguagePicker.querySelectorAll('input:checked')].map((input) => input.value);
}

function externalSubtitlePayload() {
  const languages = selectedExternalLanguages();
  if (!languages.length) throw new Error('Sélectionne au moins une langue.');
  return {
    mediaPath: refs.subtitleMediaPath.value,
    title: refs.subtitleTitle.value,
    year: refs.subtitleYear.value,
    season: refs.subtitleSeason.value,
    episode: refs.subtitleEpisode.value,
    languages
  };
}

function renderSubtitleResults(response) {
  state.subtitleResults = response?.results || [];
  state.subtitleQuery = response?.query || null;
  refs.subtitleResults.replaceChildren();
  refs.subtitleResultCount.textContent = `${state.subtitleResults.length} résultat${state.subtitleResults.length > 1 ? 's' : ''}`;
  const providerErrors = response?.errors || [];
  refs.subtitleResultsTitle.textContent = providerErrors.length
    ? `${state.subtitleResults.length} pistes · ${providerErrors.length} fournisseur${providerErrors.length > 1 ? 's' : ''} indisponible${providerErrors.length > 1 ? 's' : ''}`
    : `${state.subtitleResults.length} pistes classées par compatibilité`;

  if (!state.subtitleResults.length) {
    const empty = document.createElement('div');
    empty.className = 'queue-empty';
    empty.textContent = providerErrors[0]?.message || 'Aucun sous-titre trouvé avec ces critères.';
    refs.subtitleResults.append(empty);
    return;
  }

  state.subtitleResults.forEach((result, index) => {
    const row = document.createElement('article');
    row.className = 'subtitle-result';
    const score = document.createElement('div');
    score.className = 'subtitle-score';
    const scoreValue = document.createElement('strong');
    scoreValue.textContent = String(Number(result.score || 0));
    const scoreLabel = document.createElement('span');
    scoreLabel.textContent = 'score';
    score.append(scoreValue, scoreLabel);
    const copy = document.createElement('div');
    copy.className = 'subtitle-result-copy';
    const title = document.createElement('strong');
    title.textContent = result.release || result.fileName || 'Sous-titre';
    const meta = document.createElement('span');
    meta.textContent = [
      String(result.language || 'und').toUpperCase(),
      result.providerLabel,
      result.fps ? `${result.fps} FPS` : '',
      result.hearingImpaired ? 'SME' : '',
      String(result.format || 'srt').toUpperCase()
    ].filter(Boolean).join(' · ');
    copy.append(title, meta);
    const button = document.createElement('button');
    button.className = 'secondary-button subtitle-download-button';
    button.type = 'button';
    button.textContent = 'Télécharger';
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = 'Téléchargement…';
      try {
        const downloaded = await api.downloadSubtitle({
          result: state.subtitleResults[index],
          mediaPath: refs.subtitleMediaPath.value,
          destination: state.outputFolder,
          title: state.subtitleQuery?.title || refs.subtitleTitle.value,
          format: refs.externalSubtitleFormat.value
        });
        button.textContent = 'Téléchargé';
        showToast(`Sous-titre enregistré : ${downloaded.filePath}`);
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Réessayer';
        showToast(error.message || 'Téléchargement du sous-titre impossible.', 'error');
      }
    });
    row.append(score, copy, button);
    refs.subtitleResults.append(row);
  });
}

refs.navItems.forEach((item) => item.addEventListener('click', () => setView(item.dataset.viewTarget)));
refs.homeAddLink.addEventListener('click', () => {
  setView('download-view');
  refs.url.focus();
});
refs.homeChooseFile.addEventListener('click', () => {
  setView('subtitles-view');
  refs.chooseSubtitleMedia.click();
});
refs.homeViewQueue.addEventListener('click', () => setView('download-view'));
refs.performanceProfile.addEventListener('change', () => {
  localStorage.setItem('agenfetch.performanceProfile', refs.performanceProfile.value);
  if (!state.running) refs.progressNetwork.textContent = performanceLabel(refs.performanceProfile.value);
});
document.querySelectorAll('input[name="mode"]').forEach((input) => input.addEventListener('change', syncModeUi));
refs.includeAutoSubtitles.addEventListener('change', () => {
  refs.youtubeSubtitleTracks.querySelectorAll('[data-automatic-only="true"]').forEach((input) => {
    input.disabled = !refs.includeAutoSubtitles.checked || currentMode() === 'audio';
    if (input.disabled) input.checked = false;
  });
});

refs.installSubtitleEngine.addEventListener('click', async () => {
  refs.installSubtitleEngine.disabled = true;
  refs.subtitleEngineProgress.hidden = false;
  refs.subtitleEngineTitle.textContent = 'Installation du moteur…';
  try {
    await api.installSubtitleEngine();
    refs.subtitleEngineProgress.hidden = true;
    showToast('Moteur de sous-titres installé et vérifié.');
    await loadSubtitleEngineStatus();
  } catch (error) {
    refs.installSubtitleEngine.disabled = false;
    refs.subtitleEngineProgress.hidden = true;
    refs.subtitleEngineTitle.textContent = 'Installation impossible';
    refs.subtitleEngineCopy.textContent = error.message || 'Le composant n’a pas pu être installé.';
    showToast(refs.subtitleEngineCopy.textContent, 'error');
  }
});

api.onSubtitleEngineInstallProgress((progress) => {
  const percent = Math.max(0, Math.min(100, Number(progress?.percent || 0)));
  refs.subtitleEngineProgressBar.style.width = `${percent}%`;
  refs.subtitleEngineProgressLabel.textContent = `${progress?.percentLabel || `${percent.toFixed(0)}%`} · ${progress?.receivedLabel || '—'} / ${progress?.totalLabel || '—'}`;
});

refs.installDenoRuntime.addEventListener('click', async () => {
  refs.installDenoRuntime.disabled = true;
  refs.denoRuntimeProgress.hidden = false;
  refs.jsRuntimeTitle.textContent = 'Installation de Deno…';
  try {
    const result = await api.installDenoRuntime();
    applyJsRuntimeStatus(result.system);
    refs.denoRuntimeProgress.hidden = true;
    showToast('Deno installé et vérifié. Il devient le runtime YouTube prioritaire.');
  } catch (error) {
    refs.installDenoRuntime.disabled = false;
    refs.denoRuntimeProgress.hidden = true;
    showToast(error.message || 'Installation de Deno impossible.', 'error');
  }
});

api.onDenoRuntimeInstallProgress((progress) => {
  const percent = Math.max(0, Math.min(100, Number(progress?.percent || 0)));
  refs.denoRuntimeProgressBar.style.width = `${percent}%`;
  refs.denoRuntimeProgressPercent.textContent = progress?.percentLabel || `${percent.toFixed(0)}%`;
  refs.denoRuntimeProgressMeta.textContent = `${progress?.receivedLabel || '—'} / ${progress?.totalLabel || '—'}`;
});

refs.chooseSubtitleMedia.addEventListener('click', async () => {
  const mediaPath = await api.chooseMedia();
  if (!mediaPath) return;
  refs.subtitleMediaPath.value = mediaPath;
  try {
    const detected = await api.parseSubtitleMedia(mediaPath);
    refs.subtitleTitle.value = detected.title || '';
    refs.subtitleYear.value = detected.year || '';
    refs.subtitleSeason.value = detected.season ?? '';
    refs.subtitleEpisode.value = detected.episode ?? '';
  } catch (error) {
    showToast(error.message || 'Le nom du fichier n’a pas pu être analysé.', 'error');
  }
});

refs.saveSubtitleProviders.addEventListener('click', async () => {
  const payload = {};
  if (refs.subdlApiKey.value.trim()) payload.subdl = refs.subdlApiKey.value.trim();
  if (refs.opensubtitlesApiKey.value.trim()) payload.opensubtitles = refs.opensubtitlesApiKey.value.trim();
  if (!Object.keys(payload).length) {
    showToast('Colle au moins une nouvelle clé fournisseur.', 'error');
    return;
  }
  refs.saveSubtitleProviders.disabled = true;
  try {
    await api.saveSubtitleProviders(payload);
    refs.subdlApiKey.value = '';
    refs.opensubtitlesApiKey.value = '';
    await loadProviderStatus();
    showToast('Clés chiffrées et enregistrées sur cet ordinateur.');
  } catch (error) {
    showToast(error.message || 'Impossible d’enregistrer les clés.', 'error');
  } finally {
    refs.saveSubtitleProviders.disabled = false;
  }
});

refs.subtitleSearchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.subtitleEngineInstalled) {
    showToast('Installe d’abord le moteur de sous-titres.', 'error');
    return;
  }
  refs.searchExternalSubtitles.disabled = true;
  refs.searchExternalSubtitles.querySelector('span').textContent = 'Recherche en cours…';
  refs.subtitleResultsTitle.textContent = 'Interrogation simultanée des fournisseurs…';
  try {
    renderSubtitleResults(await api.searchSubtitles(externalSubtitlePayload()));
  } catch (error) {
    renderSubtitleResults({ results: [], errors: [{ message: error.message || 'Recherche impossible.' }] });
    showToast(error.message || 'Recherche de sous-titres impossible.', 'error');
  } finally {
    refs.searchExternalSubtitles.disabled = false;
    refs.searchExternalSubtitles.querySelector('span').textContent = 'Rechercher partout';
  }
});

refs.url.addEventListener('input', () => {
  refs.urlError.textContent = '';
  if (state.metadataUrl && state.metadataUrl !== extractUrls()[0]) clearMetadata();
  scheduleAutoPreview();
});

refs.metadataThumbnail.addEventListener('error', () => {
  refs.metadataThumbnail.hidden = true;
});

refs.paste.addEventListener('click', async () => {
  try {
    refs.url.value = await api.readClipboard();
    refs.url.focus();
    refs.urlError.textContent = '';
    clearMetadata();
    scheduleAutoPreview();
  } catch {
    showToast('Le presse-papiers est indisponible. Utilise Ctrl + V.', 'error');
  }
});

refs.playlist.addEventListener('change', () => {
  const urls = extractUrls();
  if (urls.length === 1 && isPreviewableUrl(urls[0])) {
    state.metadataUrl = '';
    state.previewingUrl = '';
    inspectMetadata();
  }
});

refs.chooseFolder.addEventListener('click', async () => {
  const folder = await api.chooseFolder();
  if (!folder) return;
  state.outputFolder = folder;
  refs.outputFolder.value = folder;
  localStorage.setItem('agenfetch.outputFolder', folder);
});

refs.openFolder.addEventListener('click', async () => {
  const error = await api.openFolder(state.outputFolder || refs.outputFolder.value);
  if (error) showToast(error, 'error');
});

refs.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.submitting) return;
  if (!refs.consentOverlay.hidden) {
    showToast('Accepte d’abord les conditions d’utilisation.', 'error');
    return;
  }
  refs.urlError.textContent = '';

  try {
    const payloads = buildPayloads();
    state.submitting = true;
    refs.start.disabled = true;
    await api.enqueueDownloads(payloads);
    refs.url.value = '';
    clearMetadata();
    showToast(`${payloads.length} téléchargement${payloads.length > 1 ? 's' : ''} ajouté${payloads.length > 1 ? 's' : ''} à la file.`);
  } catch (error) {
    refs.urlError.textContent = error.message || 'Impossible d’ajouter le téléchargement.';
    showToast(refs.urlError.textContent, 'error');
  } finally {
    state.submitting = false;
    refs.start.disabled = false;
  }
});

refs.cancel.addEventListener('click', async () => {
  if (await api.cancelDownload()) {
    refs.progressTitle.textContent = 'Annulation en cours…';
  }
});

refs.pause.addEventListener('click', async () => {
  if (await api.pauseDownload()) {
    refs.pause.disabled = true;
    refs.cancel.disabled = true;
    refs.progressTitle.textContent = 'Mise en pause…';
    refs.progressPhase.textContent = 'Les données déjà reçues sont conservées';
  }
});

refs.toggleLog.addEventListener('click', () => {
  refs.log.hidden = !refs.log.hidden;
  refs.toggleLog.textContent = refs.log.hidden ? 'Journal' : 'Masquer';
});

refs.checkSystem.addEventListener('click', () => checkSystem());
refs.updateYtDlp.addEventListener('click', updateYtDlp);

refs.clearFinishedQueue.addEventListener('click', async () => {
  renderQueue(await api.clearFinishedQueue());
});

refs.clearHistory.addEventListener('click', async () => {
  await api.clearHistory();
  await renderHistory();
  showToast('Historique effacé.');
});

function syncConsentButton() {
  refs.consentAccept.disabled = !refs.consentCheck.checked;
}

function showConsentGate() {
  refs.consentOverlay.hidden = false;
  refs.consentCheck.checked = false;
  syncConsentButton();
  refs.consentCheck.focus();
}

async function acceptConsent() {
  if (!refs.consentCheck.checked) return;
  refs.consentAccept.disabled = true;
  try {
    await api.acceptConsent();
    refs.consentOverlay.hidden = true;
    scheduleAutoPreview();
  } catch (error) {
    refs.consentAccept.disabled = false;
    showToast(error.message || 'Impossible d’enregistrer le consentement.', 'error');
  }
}

refs.consentCheck.addEventListener('change', syncConsentButton);
refs.consentAccept.addEventListener('click', acceptConsent);
refs.consentOverlay.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') event.preventDefault();
});

function formatCheckedAt(value) {
  if (!value) return 'Pas encore';
  try {
    return new Date(value).toLocaleString('fr-FR');
  } catch {
    return 'À l’instant';
  }
}

function setUpdateProgress(progress) {
  const percent = Math.max(0, Math.min(100, Number(progress?.percent || 0)));
  refs.updateProgressBar.style.width = `${percent}%`;
  refs.updateProgressPercent.textContent = progress?.percentLabel || `${percent.toFixed(0)}%`;
  refs.updateProgressMeta.textContent = progress?.total
    ? `${progress.receivedLabel} / ${progress.totalLabel}`
    : (progress?.receivedLabel || 'en cours');
}

function applyUpdateCheck(result) {
  state.appUpdate = result;
  refs.updateCheckedAt.textContent = formatCheckedAt(result.checkedAt);
  refs.updateActions.hidden = !result.updateAvailable;
  refs.updateProgress.hidden = true;
  refs.installAppUpdate.hidden = true;
  if (result.updateAvailable) {
    refs.updateStatusLabel.textContent = 'Mise à jour disponible';
    refs.updateStatusTitle.textContent = `Version ${result.latestVersion}`;
    refs.updateStatusCopy.textContent = `Tu as la ${result.currentVersion}. Une version plus récente est sur GitHub. Tu peux la télécharger ici ou ouvrir le site.`;
  } else {
    refs.updateStatusLabel.textContent = 'À jour';
    refs.updateStatusTitle.textContent = `Version ${result.currentVersion}`;
    refs.updateStatusCopy.textContent = 'Tu as déjà la dernière version publiée.';
  }
}

async function loadAppInfo() {
  const info = await api.getAppInfo();
  refs.appVersion.textContent = info.version;
  if (refs.sidebarVersion) refs.sidebarVersion.textContent = `BÊTA ${info.version}`;
  try {
    const extension = await api.getExtensionInfo();
    if (refs.extensionFolderPath) {
      refs.extensionFolderPath.textContent = extension.available
        ? extension.folder
        : 'Dossier d’extension introuvable dans cette installation.';
    }
    if (refs.openExtensionFolder) refs.openExtensionFolder.disabled = !extension.available;
  } catch {
    if (refs.extensionFolderPath) refs.extensionFolderPath.textContent = 'Dossier d’extension indisponible.';
    if (refs.openExtensionFolder) refs.openExtensionFolder.disabled = true;
  }
}

async function checkAppUpdate() {
  refs.checkAppUpdate.disabled = true;
  refs.updateStatusLabel.textContent = 'Vérification';
  refs.updateStatusTitle.textContent = 'Contact de GitHub Releases…';
  refs.updateStatusCopy.textContent = 'Comparaison de ta version installée avec la dernière publication.';
  refs.updateActions.hidden = true;
  refs.updateProgress.hidden = true;
  refs.installAppUpdate.hidden = true;
  try {
    applyUpdateCheck(await api.checkAppUpdate());
  } catch (error) {
    refs.updateStatusLabel.textContent = 'Erreur';
    refs.updateStatusTitle.textContent = 'Vérification impossible';
    refs.updateStatusCopy.textContent = error.message || 'GitHub n’a pas répondu.';
    showToast(refs.updateStatusCopy.textContent, 'error');
  } finally {
    refs.checkAppUpdate.disabled = false;
  }
}

async function downloadAppUpdate() {
  refs.downloadAppUpdate.disabled = true;
  refs.checkAppUpdate.disabled = true;
  refs.updateProgress.hidden = false;
  refs.installAppUpdate.hidden = true;
  refs.updateStatusLabel.textContent = 'Téléchargement';
  refs.updateStatusTitle.textContent = 'Installateur en cours de récupération';
  refs.updateStatusCopy.textContent = 'Le fichier vient de GitHub Releases. L’empreinte SHA-256 est vérifiée s’il y en a une.';
  setUpdateProgress({ percent: 0, percentLabel: '0%', receivedLabel: '0 o', totalLabel: '—' });
  try {
    await api.downloadAppUpdate();
    refs.updateProgress.hidden = false;
    refs.installAppUpdate.hidden = false;
    refs.checkAppUpdate.disabled = false;
    refs.updateStatusLabel.textContent = 'Prêt à installer';
    refs.updateStatusTitle.textContent = 'Téléchargement terminé';
    refs.updateStatusCopy.textContent = 'Lance l’installateur. Ferme AgenFetch s’il te le demande.';
    showToast('Mise à jour téléchargée. Tu peux lancer l’installateur.');
  } catch (error) {
    refs.downloadAppUpdate.disabled = false;
    refs.checkAppUpdate.disabled = false;
    showToast(error.message || 'Téléchargement de la mise à jour impossible.', 'error');
  }
}

async function installAppUpdate() {
  refs.installAppUpdate.disabled = true;
  try {
    await api.installAppUpdate();
    showToast('Installateur lancé.');
  } catch (error) {
    refs.installAppUpdate.disabled = false;
    showToast(error.message || 'Impossible d’ouvrir l’installateur.', 'error');
  }
}

refs.checkAppUpdate.addEventListener('click', checkAppUpdate);
refs.downloadAppUpdate.addEventListener('click', downloadAppUpdate);
refs.openUpdateWebsite.addEventListener('click', async () => {
  try {
    await api.openUpdateWebsite();
  } catch (error) {
    showToast(error.message || 'Impossible d’ouvrir le site.', 'error');
  }
});
refs.cancelAppUpdate.addEventListener('click', async () => {
  await api.cancelAppUpdate();
});
refs.installAppUpdate.addEventListener('click', installAppUpdate);
refs.openExtensionFolder?.addEventListener('click', async () => {
  const error = await api.openExtensionFolder();
  if (error) showToast(error, 'error');
});
api.onUpdateProgress(setUpdateProgress);
api.onOpenAbout(() => setView('about-view'));
api.onCheckUpdates(() => {
  setView('about-view');
  checkAppUpdate();
});

function closeAppMenu() {
  if (!refs.appMenu || refs.appMenu.hidden) return;
  refs.appMenu.hidden = true;
  refs.appMenuButton?.setAttribute('aria-expanded', 'false');
}

function toggleAppMenu() {
  if (!refs.appMenu) return;
  const willOpen = refs.appMenu.hidden;
  refs.appMenu.hidden = !willOpen;
  refs.appMenuButton?.setAttribute('aria-expanded', String(willOpen));
}

refs.appMenuButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleAppMenu();
});

refs.appMenu?.addEventListener('click', async (event) => {
  event.stopPropagation();
  const action = event.target.closest('[data-menu-action]')?.dataset.menuAction;
  if (!action) return;
  closeAppMenu();
  if (action === 'about') setView('about-view');
  if (action === 'updates') {
    setView('about-view');
    checkAppUpdate();
  }
  if (action === 'quit') {
    try {
      await api.quitApp();
    } catch (error) {
      showToast(error.message || 'Impossible de quitter AgenFetch.', 'error');
    }
  }
});

document.addEventListener('click', closeAppMenu);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeAppMenu();
});

api.onDeepLink((payload) => {
  refs.url.value = payload.url;
  const modeInput = document.querySelector(`input[name="mode"][value="${payload.mode}"]`);
  if (modeInput) modeInput.checked = true;
  clearMetadata();
  syncModeUi();
  setView('download-view');
  refs.url.focus();
  inspectMetadata();
  showToast('Lien reçu depuis YouTube. Vérifie les options puis ajoute-le à la file.');
});

api.onQueueChanged(renderQueue);
api.onProgress(updateProgress);
api.onLog(({ line }) => appendLog(line));
api.onFinished((result) => {
  refs.activityDot.classList.toggle('is-error', !result.ok && !result.cancelled && !result.paused);
  if (result.paused) {
    refs.progressTitle.textContent = 'Téléchargement en pause';
    refs.progressPhase.textContent = 'Reprends-le depuis la file quand tu veux';
    showToast('Téléchargement en pause. Les données partielles sont conservées.');
  } else if (result.ok) {
    updateProgress({ percent: 100, percentLabel: '100%', speed: '—', eta: '0s', downloaded: 'Terminé', total: '—', phase: 'merge', phaseLabel: 'Terminé' });
    refs.progressTitle.textContent = 'Téléchargement terminé';
    showToast('Téléchargement terminé. Le suivant démarrera automatiquement.');
  } else if (result.cancelled) {
    refs.progressTitle.textContent = 'Téléchargement annulé';
    showToast('Téléchargement annulé.');
  } else {
    refs.progressTitle.textContent = 'Le téléchargement a échoué';
    showToast(result.error || 'Échec du téléchargement.', 'error');
  }
});

async function initialize() {
  if (!state.outputFolder) {
    state.outputFolder = await api.getDefaultFolder();
  }
  refs.outputFolder.value = state.outputFolder;
  const savedPerformanceProfile = localStorage.getItem('agenfetch.performanceProfile');
  if (['eco', 'normal', 'turbo'].includes(savedPerformanceProfile)) {
    refs.performanceProfile.value = savedPerformanceProfile;
  }
  refs.progressNetwork.textContent = performanceLabel(refs.performanceProfile.value);
  renderYoutubeSubtitleTracks([]);
  syncModeUi();
  renderQueue(await api.getQueue());
  await checkSystem({ quiet: true });
  try {
    await loadAppInfo();
  } catch {
    refs.appVersion.textContent = 'inconnue';
  }
  try {
    const consent = await api.getConsent();
    if (!consent?.accepted) showConsentGate();
  } catch {
    showConsentGate();
  }
}

initialize();
