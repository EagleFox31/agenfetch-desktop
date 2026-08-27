'use strict';

const message = document.querySelector('#message');

async function openCurrent(mode) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes('youtube.com')) {
    message.textContent = 'Ouvre d’abord une vidéo YouTube.';
    message.classList.add('error');
    return;
  }

  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'AGENFETCH_OPEN', mode });
    if (!result?.opened) throw new Error('unsupported');
    window.close();
  } catch {
    message.textContent = 'Recharge la page YouTube puis réessaie.';
    message.classList.add('error');
  }
}

document.querySelector('#open-video').addEventListener('click', () => openCurrent('video'));
document.querySelector('#open-audio').addEventListener('click', () => openCurrent('audio'));
