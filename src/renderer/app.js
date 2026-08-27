'use strict';

const api = window.agenFetch;

const refs = {
  navItems: [...document.querySelectorAll('[data-view-target]')],
  views: [...document.querySelectorAll('.view')],
  pageTitle: document.querySelector('#page-title'),
  form: document.querySelector('#download-form'),
  url: document.querySelector('#video-url'),
  urlError: document.querySelector('#url-error'),
  paste: document.querySelector('#paste-url'),
  quality: document.querySelector('#quality'),
  qualityGroup: document.querySelector('#quality-group'),
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
  historyList: document.querySelector('#history-list'),
  clearHistory: document.querySelector('#clear-history'),
  toast: document.querySelector('#toast')
};

const state = {
  running: false,
  outputFolder: localStorage.getItem('agenfetch.outputFolder') || '',
  toastTimer: null
};

function showToast(message, type = 'info') {
  clearTimeout(state.toastTimer);
  refs.toast.textContent = message;
  refs.toast.classList.toggle('is-error', type === 'error');
  refs.toast.classList.add('is-visible');
  state.toastTimer = setTimeout(() => refs.toast.classList.remove('is-visible'), 3800);
}

function setView(viewId) {
  refs.views.forEach((view) => view.classList.toggle('is-visible', view.id === viewId));
  refs.navItems.forEach((item) => item.classList.toggle('is-active', item.dataset.viewTarget === viewId));
  refs.pageTitle.textContent = viewId === 'history-view' ? 'Ce que tu as déjà récupéré.' : 'Récupère ce qui compte.';
  if (viewId === 'history-view') renderHistory();
}

function setStatus(element, result) {
  element.classList.remove('is-checking', 'is-ok', 'is-error');
  element.classList.add(result?.installed ? 'is-ok' : 'is-error');
  element.title = result?.installed ? result.version : 'Introuvable';
}

async function checkSystem() {
  [refs.ytDlpStatus, refs.ffmpegStatus, refs.denoStatus].forEach((item) => {
    item.classList.remove('is-ok', 'is-error');
    item.classList.add('is-checking');
  });
  try {
    const result = await api.checkSystem();
    setStatus(refs.ytDlpStatus, result.ytDlp);
    setStatus(refs.ffmpegStatus, result.ffmpeg);
    setStatus(refs.denoStatus, result.deno);
    if (![result.ytDlp, result.ffmpeg, result.deno].every((item) => item.installed)) {
      showToast('Un prérequis manque. Lance scripts/install-prerequisites.ps1.', 'error');
    }
  } catch (error) {
    showToast(error.message || 'Impossible de vérifier les outils.', 'error');
  }
}

function currentMode() {
  return document.querySelector('input[name="mode"]:checked')?.value || 'video';
}

function syncModeUi() {
  refs.qualityGroup.style.opacity = currentMode() === 'audio' ? '0.45' : '1';
  refs.quality.disabled = currentMode() === 'audio';
}

function setRunning(value) {
  state.running = value;
  refs.start.disabled = value;
  refs.cancel.disabled = !value;
  refs.activityDot.classList.toggle('is-running', value);
  if (value) {
    refs.progressTitle.textContent = 'Téléchargement en cours';
    refs.log.textContent = '';
  }
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

function appendLog(line) {
  if (!line) return;
  const existing = refs.log.textContent.split('\n').slice(-80);
  existing.push(line);
  refs.log.textContent = existing.join('\n');
  refs.log.scrollTop = refs.log.scrollHeight;
}

function statusLabel(status) {
  return {
    completed: 'Terminé',
    failed: 'Échec',
    cancelled: 'Annulé'
  }[status] || status;
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
    title.textContent = item.destination || item.url || 'Téléchargement';
    const meta = document.createElement('span');
    const date = item.finishedAt ? new Date(item.finishedAt).toLocaleString('fr-FR') : 'Date inconnue';
    meta.textContent = `${item.mode === 'audio' ? 'MP3' : item.quality === 'best' ? 'MP4 • meilleure qualité' : `MP4 • ${item.quality}p`} • ${date}`;
    body.append(title, meta);

    const status = document.createElement('span');
    status.className = `history-status ${item.status}`;
    status.textContent = statusLabel(item.status);
    row.append(icon, body, status);
    refs.historyList.append(row);
  });
}

refs.navItems.forEach((item) => item.addEventListener('click', () => setView(item.dataset.viewTarget)));
document.querySelectorAll('input[name="mode"]').forEach((input) => input.addEventListener('change', syncModeUi));

refs.paste.addEventListener('click', async () => {
  try {
    refs.url.value = await api.readClipboard();
    refs.url.focus();
    refs.urlError.textContent = '';
  } catch {
    showToast('Le presse-papiers est indisponible. Utilise Ctrl + V.', 'error');
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
  refs.urlError.textContent = '';

  const payload = {
    url: refs.url.value,
    mode: currentMode(),
    quality: refs.quality.value,
    outputFolder: state.outputFolder,
    playlist: refs.playlist.checked,
    compatibilityMode: refs.compatibilityMode.checked
  };

  try {
    setRunning(true);
    updateProgress({ percent: 0, percentLabel: '0%', speed: '—', eta: '—', downloaded: '—', total: '—' });
    await api.startDownload(payload);
  } catch (error) {
    setRunning(false);
    refs.urlError.textContent = error.message || 'Impossible de démarrer le téléchargement.';
    showToast(refs.urlError.textContent, 'error');
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

refs.checkSystem.addEventListener('click', checkSystem);

refs.clearHistory.addEventListener('click', async () => {
  await api.clearHistory();
  await renderHistory();
  showToast('Historique effacé.');
});

api.onDeepLink((payload) => {
  refs.url.value = payload.url;
  const modeInput = document.querySelector(`input[name="mode"][value="${payload.mode}"]`);
  if (modeInput) modeInput.checked = true;
  syncModeUi();
  setView('download-view');
  refs.url.focus();
  showToast('Lien reçu depuis YouTube. Vérifie le format puis lance le téléchargement.');
});

api.onProgress(updateProgress);
api.onLog(({ line }) => appendLog(line));
api.onFinished((result) => {
  setRunning(false);
  refs.activityDot.classList.toggle('is-error', !result.ok && !result.cancelled);
  if (result.ok) {
    updateProgress({ percent: 100, percentLabel: '100%', speed: '—', eta: '0s', downloaded: 'Terminé', total: '—' });
    refs.progressTitle.textContent = 'Téléchargement terminé';
    showToast('C’est terminé. Le fichier est dans ton dossier de destination.');
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
  await checkSystem();
}

initialize();
