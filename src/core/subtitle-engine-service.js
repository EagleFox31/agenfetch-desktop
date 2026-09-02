'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const MAX_ENGINE_OUTPUT = 2 * 1024 * 1024;
const ALLOWED_MEDIA_EXTENSIONS = new Set(['.mkv', '.mp4', '.avi', '.mov', '.webm', '.m4v', '.wmv']);
const ALLOWED_PROVIDERS = new Set(['subliminal', 'subdl']);
const ALLOWED_SUBLIMINAL_PROVIDERS = new Set(['podnapisi', 'gestdown', 'subtis', 'opensubtitlescom']);

function sanitizeMediaPath(value) {
  const mediaPath = String(value || '').trim();
  if (!mediaPath) return '';
  const absolute = path.isAbsolute(mediaPath) || path.win32.isAbsolute(mediaPath);
  const extension = path.extname(mediaPath).toLowerCase() || path.win32.extname(mediaPath).toLowerCase();
  if (!absolute || !ALLOWED_MEDIA_EXTENSIONS.has(extension)) {
    throw new Error('Sélectionne un fichier vidéo local reconnu.');
  }
  return mediaPath;
}

function sanitizeSearchPayload(input) {
  const source = input && typeof input === 'object' ? input : {};
  const mediaPath = sanitizeMediaPath(source.mediaPath);
  const title = String(source.title || '').trim().slice(0, 180);
  if (!mediaPath && !title) throw new Error('Sélectionne un fichier ou indique un titre.');
  const languages = Array.isArray(source.languages)
    ? [...new Set(source.languages.map((value) => String(value || '').trim().toLowerCase())
      .filter((value) => /^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i.test(value)))].slice(0, 12)
    : [];
  return {
    mediaPath,
    title,
    year: String(source.year || '').trim().slice(0, 4),
    season: String(source.season ?? '').trim().slice(0, 3),
    episode: String(source.episode ?? '').trim().slice(0, 3),
    languages: languages.length ? languages : ['fr', 'en']
  };
}

function sanitizeProviderResult(input) {
  const source = input && typeof input === 'object' ? input : {};
  const provider = String(source.provider || '').trim().toLowerCase();
  if (!ALLOWED_PROVIDERS.has(provider)) throw new Error('Résultat fournisseur invalide.');
  const downloadRef = source.downloadRef && typeof source.downloadRef === 'object' ? source.downloadRef : {};
  let safeDownloadRef;
  if (provider === 'subliminal') {
    const providerName = String(downloadRef.providerName || '').trim().toLowerCase();
    const subtitleId = String(downloadRef.subtitleId || '').trim().slice(0, 500);
    if (!ALLOWED_SUBLIMINAL_PROVIDERS.has(providerName) || !subtitleId || /[\u0000-\u001f]/.test(subtitleId)) {
      throw new Error('Référence Subliminal invalide.');
    }
    safeDownloadRef = { providerName, subtitleId };
  } else if (provider === 'subdl') {
    const providerPath = String(downloadRef.path || '').trim().slice(0, 600);
    if (!providerPath.startsWith('/subtitle/')) throw new Error('Référence SubDL invalide.');
    safeDownloadRef = { path: providerPath };
  }
  return {
    provider,
    language: String(source.language || '').trim().toLowerCase().slice(0, 16),
    fileName: path.basename(String(source.fileName || '')).slice(0, 220),
    downloadRef: safeDownloadRef
  };
}

class SubtitleEngineService {
  constructor({
    resourcesPath,
    userDataPath,
    projectRoot,
    isPackaged = false,
    platform = process.platform,
    credentialsStore,
    spawnImpl = spawn,
    fsImpl = fs
  }) {
    this.resourcesPath = resourcesPath;
    this.userDataPath = userDataPath;
    this.projectRoot = projectRoot;
    this.isPackaged = isPackaged;
    this.platform = platform;
    this.credentialsStore = credentialsStore;
    this.spawnImpl = spawnImpl;
    this.fs = fsImpl;
    this.managedExecutable = path.join(userDataPath, 'components', 'subtitle-engine', 'AgenFetch-Subtitle-Engine.exe');
    this.bundledExecutable = path.join(resourcesPath, 'subtitle-engine', 'AgenFetch-Subtitle-Engine.exe');
    this.developmentScript = path.join(projectRoot, 'subtitle-engine', 'agenfetch_subtitles.py');
  }

  command() {
    const executable = [this.managedExecutable, this.bundledExecutable]
      .find((candidate) => this.fs.existsSync(candidate));
    if (executable) return { command: executable, args: [], source: 'composant AgenFetch' };
    if (!this.isPackaged && this.fs.existsSync(this.developmentScript)) {
      return {
        command: process.env.AGENFETCH_PYTHON || (this.platform === 'win32' ? 'python' : 'python3'),
        args: [this.developmentScript],
        source: 'source de développement'
      };
    }
    return null;
  }

  invoke(command, payload = {}, timeout = 70000) {
    const resolved = this.command();
    if (!resolved) {
      throw new Error('Le moteur de sous-titres n’est pas installé. Installe-le depuis AgenFetch.');
    }
    return new Promise((resolve, reject) => {
      const child = this.spawnImpl(resolved.command, resolved.args, {
        windowsHide: true,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      let stdout = '';
      let stderr = '';
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        callback(value);
      };
      const timer = setTimeout(() => {
        child.kill();
        finish(reject, new Error('Le moteur de sous-titres a dépassé le délai autorisé.'));
      }, timeout);
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString('utf8');
        if (stdout.length > MAX_ENGINE_OUTPUT) child.kill();
      });
      child.stderr.on('data', (chunk) => {
        stderr = `${stderr}${chunk.toString('utf8')}`.slice(-8000);
      });
      child.on('error', (error) => finish(reject, error));
      child.on('close', () => {
        try {
          const response = JSON.parse(stdout.trim());
          if (!response.ok) throw new Error(response.error || 'Le moteur a refusé la requête.');
          finish(resolve, response.result);
        } catch (error) {
          finish(reject, new Error(stderr.trim() || error.message || 'Réponse du moteur illisible.'));
        }
      });
      child.stdin.end(JSON.stringify({ command, payload }));
    });
  }

  async status() {
    const resolved = this.command();
    if (!resolved) return { installed: false, version: '', source: 'absent' };
    try {
      const info = await this.invoke('version', {}, 12000);
      return {
        installed: true,
        version: info.version,
        backend: info.backend,
        providers: info.providers,
        source: resolved.source
      };
    } catch (error) {
      return { installed: false, version: '', source: resolved.source, error: error.message };
    }
  }

  parse(value) {
    return this.invoke('parse', { value: String(value || '').slice(0, 1024) }, 12000);
  }

  search(input) {
    return this.invoke('search', {
      ...sanitizeSearchPayload(input),
      credentials: this.credentialsStore.getAll()
    });
  }

  download(input, defaultDestination) {
    const source = input && typeof input === 'object' ? input : {};
    const querySource = source.query && typeof source.query === 'object' ? source.query : {};
    const mediaPath = sanitizeMediaPath(source.mediaPath || querySource.mediaPath);
    const destination = String(source.destination || defaultDestination || '').trim();
    if (!path.isAbsolute(destination)) throw new Error('Dossier de destination invalide.');
    const query = sanitizeSearchPayload({
      ...querySource,
      mediaPath,
      title: source.title || querySource.title
    });
    return this.invoke('download', {
      result: sanitizeProviderResult(source.result),
      mediaPath,
      destination,
      title: query.title,
      query,
      format: source.format === 'vtt' ? 'vtt' : 'srt',
      overwrite: Boolean(source.overwrite),
      credentials: this.credentialsStore.getAll()
    });
  }
}

module.exports = {
  ALLOWED_MEDIA_EXTENSIONS,
  ALLOWED_SUBLIMINAL_PROVIDERS,
  SubtitleEngineService,
  sanitizeMediaPath,
  sanitizeProviderResult,
  sanitizeSearchPayload
};
