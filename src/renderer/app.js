'use strict';

const api = window.agenFetch;

const refs = {
  navItems: [...document.querySelectorAll('.navbar-tabs [data-view-target]')],
  views: [...document.querySelectorAll('.view')],
  pageTitle: document.querySelector('#page-title'),
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
  subtitles: document.querySelector('#subtitles'),
  subtitlesGroup: document.querySelector('#subtitles-group'),
  outputFolder: document.querySelector('#output-folder'),
  chooseFolder: document.querySelector('#choose-folder'),
  openFolder: document.querySelector('#open-folder'),
  playlist: document.querySelector('#playlist'),
  compatibilityMode: document.querySelector('#compatibility-mode'),
  start: document.querySelector('#start-download'),
  cancel: document.querySelector('#cancel-download'),
  toggleLog: document.querySelector('#toggle-log'),
  log: document.querySelector('#download-log'),
  progressTitle: document.querySelector('#progress-title'),
  progressRing: document.querySelector('#progress-ring'),
  progressPercent: document.querySelector('#progress-percent'),
  progressSpeed: document.querySelector('#progress-speed'),
  progressEta: document.querySelector('#progress-eta'),
  progressSize: document.querySelector('#progress-size'),
  activityDot: document.querySelector('#activity-dot'),
  ytDlpStatus: document.querySelector('#yt-dlp-status'),
  ffmpegStatus: document.querySelector('#ffmpeg-status'),
  denoStatus: document.querySelector('#deno-status'),
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
  pageEyebrow: document.querySelector('#page-eyebrow'),
  sidebarVersion: document.querySelector('#sidebar-version'),
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
  openExtensionFolder: document.querySelector('#open-extension-folder')
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
  appUpdate: null
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
    'history-view': 'Ce que tu as déjà récupéré.',
    'about-view': 'Version et mises à jour.',
    'extension-view': 'Depuis YouTube, en un clic.'
  }[viewId] || 'Garde ce que tu as le droit de garder.';
  if (refs.pageEyebrow) {
    refs.pageEyebrow.textContent = {
      'history-view': 'Historique local',
      'about-view': 'Application',
      'extension-view': 'Extension Chrome / Edge'
    }[viewId] || 'Téléchargement local';
  }
  if (refs.systemStatus) refs.systemStatus.hidden = viewId === 'about-view' || viewId === 'extension-view';
  if (viewId === 'history-view') renderHistory();
}

function setStatus(element, result) {
  element.classList.remove('is-checking', 'is-ok', 'is-error');
  element.classList.add(result?.installed ? 'is-ok' : 'is-error');
  element.title = result?.installed
    ? `${result.version} • ${result.source || 'disponible'}`
    : `Introuvable • ${result?.source || 'système'}`;
}

async function checkSystem({ quiet = false } = {}) {
  [refs.ytDlpStatus, refs.ffmpegStatus, refs.denoStatus].forEach((item) => {
    item.classList.remove('is-ok', 'is-error');
    item.classList.add('is-checking');
  });
  try {
    const result = await api.checkSystem();
    setStatus(refs.ytDlpStatus, result.ytDlp);
    setStatus(refs.ffmpegStatus, result.ffmpeg);
    setStatus(refs.denoStatus, result.deno);
    if (!result.portable) {
      showToast('Un outil intégré manque. Réinstalle AgenFetch ou relance le diagnostic.', 'error');
    } else if (!quiet) {
      showToast('AgenFetch est prêt : yt-dlp, FFmpeg et Deno sont disponibles.');
    }
    return result;
  } catch (error) {
    showToast(error.message || 'Impossible de vérifier les outils.', 'error');
    return null;
  }
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
  refs.subtitles.disabled = isAudio;
}

function setRunning(value) {
  state.running = value;
  refs.cancel.disabled = !value;
  refs.updateYtDlp.disabled = value;
  refs.activityDot.classList.toggle('is-running', value);
}

function updateProgress(progress) {
  const value = Number(progress.percent || 0);
  refs.progressRing.style.setProperty('--progress', `${value * 3.6}deg`);
  refs.progressPercent.textContent = progress.percentLabel || `${value.toFixed(1)}%`;
  refs.progressSpeed.textContent = progress.speed || '—';
  refs.progressEta.textContent = progress.eta || '—';
  refs.progressSize.textContent = progress.total === '—'
    ? progress.downloaded || '—'
    : `${progress.downloaded} / ${progress.total}`;
}

function resetProgress() {
  updateProgress({ percent: 0, percentLabel: '0%', speed: '—', eta: '—', downloaded: '—', total: '—' });
  refs.log.textContent = '';
  refs.activityDot.classList.remove('is-error');
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
    completed: 'Terminé',
    failed: 'Échec',
    cancelled: 'Annulé'
  }[status] || status;
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

  return urls.map((url) => ({
    url,
    title: urls.length === 1 && state.metadataUrl === url ? state.metadata?.title || '' : '',
    mode: currentMode(),
    quality: refs.quality.value,
    container: refs.container.value,
    subtitles: refs.subtitles.value,
    outputFolder: state.outputFolder,
    playlist: refs.playlist.checked,
    compatibilityMode: refs.compatibilityMode.checked
  }));
}

function queueItemMeta(item) {
  if (item.mode === 'audio') return 'MP3';
  const quality = item.quality === 'best' ? 'meilleure qualité' : `${item.quality}p`;
  const subtitle = item.subtitles && item.subtitles !== 'none' ? ' • sous-titres' : '';
  return `${String(item.container || 'mp4').toUpperCase()} • ${quality}${subtitle}`;
}

function renderQueue(snapshot) {
  state.queue = snapshot || { activeId: null, items: [] };
  const items = state.queue.items || [];
  refs.queueCount.textContent = String(items.length);
  refs.queueList.replaceChildren();

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
    }
    refs.queueList.append(row);
  });

  const nextActiveId = state.queue.activeId || null;
  if (nextActiveId && nextActiveId !== state.lastActiveId) {
    resetProgress();
    refs.progressTitle.textContent = 'Téléchargement en cours';
  }
  state.lastActiveId = nextActiveId;
  setRunning(Boolean(nextActiveId));
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

    const icon = document.createElement('div');
    icon.className = 'history-icon';
    icon.textContent = item.mode === 'audio' ? '♪' : '▶';

    const body = document.createElement('div');
    body.className = 'history-body';
    const title = document.createElement('strong');
    title.textContent = item.title || item.destination || item.url || 'Téléchargement';
    const meta = document.createElement('span');
    const date = item.finishedAt ? new Date(item.finishedAt).toLocaleString('fr-FR') : 'Date inconnue';
    const format = item.mode === 'audio'
      ? 'MP3'
      : `${String(item.container || 'mp4').toUpperCase()} • ${item.quality === 'best' ? 'meilleure qualité' : `${item.quality}p`}`;
    meta.textContent = `${format} • ${date}`;
    body.append(title, meta);

    const status = document.createElement('span');
    status.className = `history-status ${item.status}`;
    status.textContent = statusLabel(item.status);
    row.append(icon, body, status);
    refs.historyList.append(row);
  });
}

refs.navItems.forEach((item) => item.addEventListener('click', () => setView(item.dataset.viewTarget)));
document.querySelector('.navbar-brand')?.addEventListener('click', () => setView('download-view'));
document.querySelectorAll('input[name="mode"]').forEach((input) => input.addEventListener('change', syncModeUi));

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
  if (refs.sidebarVersion) {
    refs.sidebarVersion.textContent = 'Beta';
    refs.sidebarVersion.title = `Version ${info.version}`;
  }
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
  refs.activityDot.classList.toggle('is-error', !result.ok && !result.cancelled);
  if (result.ok) {
    updateProgress({ percent: 100, percentLabel: '100%', speed: '—', eta: '0s', downloaded: 'Terminé', total: '—' });
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
