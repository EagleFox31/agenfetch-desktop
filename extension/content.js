'use strict';

const BUTTON_ID = 'agenfetch-youtube-button';
const VALID_PATHS = ['/watch', '/playlist'];
let scheduled = false;

function isSupportedPage() {
  return VALID_PATHS.includes(location.pathname)
    || location.pathname.startsWith('/shorts/')
    || location.pathname.startsWith('/live/');
}

function openAgenFetch(mode = 'video') {
  if (!isSupportedPage()) return false;
  const deepLink = `agenfetch://download?url=${encodeURIComponent(location.href)}&mode=${encodeURIComponent(mode)}`;
  const launcher = document.createElement('a');
  launcher.href = deepLink;
  launcher.hidden = true;
  document.documentElement.appendChild(launcher);
  launcher.click();
  launcher.remove();
  return true;
}

function buildButton() {
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.className = 'agenfetch-youtube-button';
  button.type = 'button';
  button.title = 'Envoyer cette vidéo vers AgenFetch';
  button.setAttribute('aria-label', 'Télécharger avec AgenFetch');

  const mark = document.createElement('span');
  mark.className = 'agenfetch-button-mark';
  mark.textContent = '↓';

  const label = document.createElement('span');
  label.textContent = 'AgenFetch';
  button.append(mark, label);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openAgenFetch('video');
  });
  return button;
}

function findActionHost() {
  const selectors = [
    'ytd-watch-metadata #top-level-buttons-computed',
    '#actions-inner #top-level-buttons-computed',
    'ytd-menu-renderer #top-level-buttons-computed'
  ];
  return selectors.map((selector) => document.querySelector(selector)).find(Boolean) || null;
}

function syncButton() {
  scheduled = false;
  const existing = document.getElementById(BUTTON_ID);
  if (!isSupportedPage()) {
    existing?.remove();
    return;
  }

  const host = findActionHost();
  if (!host) return;
  if (existing && existing.parentElement === host) return;
  existing?.remove();
  host.appendChild(buildButton());
}

function scheduleSync() {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(syncButton, 180);
}

document.addEventListener('yt-navigate-finish', scheduleSync, true);
new MutationObserver(scheduleSync).observe(document.documentElement, { childList: true, subtree: true });
scheduleSync();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'AGENFETCH_OPEN') return false;
  sendResponse({ opened: openAgenFetch(message.mode === 'audio' ? 'audio' : 'video') });
  return false;
});
