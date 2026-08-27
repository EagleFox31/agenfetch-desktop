'use strict';

const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be'
]);

const ALLOWED_QUALITIES = new Set(['best', '2160', '1440', '1080', '720', '480', '360']);
const ALLOWED_MODES = new Set(['video', 'audio']);
const ALLOWED_CONTAINERS = new Set(['mp4', 'mkv']);
const ALLOWED_SUBTITLE_LANGUAGES = new Set(['none', 'fr', 'en', 'all']);

function normalizeYouTubeUrl(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('Colle un lien YouTube avant de continuer.');
  }

  let parsed;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new Error('Le lien fourni n’est pas une URL valide.');
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error('AgenFetch accepte uniquement les liens HTTPS YouTube et youtu.be.');
  }

  const isShortLink = parsed.hostname.toLowerCase() === 'youtu.be' && parsed.pathname.length > 1;
  const isWatch = parsed.pathname === '/watch' && parsed.searchParams.has('v');
  const isShort = parsed.pathname.startsWith('/shorts/') && parsed.pathname.split('/').filter(Boolean).length >= 2;
  const isLive = parsed.pathname.startsWith('/live/') && parsed.pathname.split('/').filter(Boolean).length >= 2;
  const isPlaylist = parsed.pathname === '/playlist' && parsed.searchParams.has('list');

  if (!isShortLink && !isWatch && !isShort && !isLive && !isPlaylist) {
    throw new Error('Ce lien ne pointe pas vers une vidéo, un Short, un live ou une playlist YouTube reconnue.');
  }

  parsed.hash = '';
  return parsed.toString();
}

function sanitizeDownloadOptions(input, defaultFolder) {
  const source = input && typeof input === 'object' ? input : {};
  const url = normalizeYouTubeUrl(source.url);
  const mode = ALLOWED_MODES.has(source.mode) ? source.mode : 'video';
  const quality = ALLOWED_QUALITIES.has(String(source.quality)) ? String(source.quality) : '1080';
  const container = ALLOWED_CONTAINERS.has(source.container) ? source.container : 'mp4';
  const subtitles = ALLOWED_SUBTITLE_LANGUAGES.has(source.subtitles) ? source.subtitles : 'none';
  const outputFolder = typeof source.outputFolder === 'string' && source.outputFolder.trim()
    ? source.outputFolder.trim()
    : defaultFolder;

  if (!outputFolder) {
    throw new Error('Sélectionne un dossier de destination.');
  }

  return {
    url,
    mode,
    quality,
    container,
    subtitles,
    outputFolder,
    playlist: Boolean(source.playlist),
    compatibilityMode: Boolean(source.compatibilityMode)
  };
}

function parseProtocolUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('agenfetch://')) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'agenfetch:' || parsed.hostname !== 'download') {
    return null;
  }

  try {
    return {
      url: normalizeYouTubeUrl(parsed.searchParams.get('url') || ''),
      mode: ALLOWED_MODES.has(parsed.searchParams.get('mode')) ? parsed.searchParams.get('mode') : 'video'
    };
  } catch {
    return null;
  }
}

function findProtocolUrl(argv) {
  if (!Array.isArray(argv)) return null;
  return argv.find((item) => typeof item === 'string' && item.startsWith('agenfetch://')) || null;
}

module.exports = {
  ALLOWED_CONTAINERS,
  ALLOWED_HOSTS,
  ALLOWED_MODES,
  ALLOWED_QUALITIES,
  ALLOWED_SUBTITLE_LANGUAGES,
  findProtocolUrl,
  normalizeYouTubeUrl,
  parseProtocolUrl,
  sanitizeDownloadOptions
};
