'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const GITHUB_OWNER = 'EagleFox31';
const GITHUB_REPO = 'agenfetch-desktop';
const GITHUB_API_LATEST = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const WEBSITE_URL = `https://${GITHUB_OWNER.toLowerCase()}.github.io/${GITHUB_REPO}/#download`;
const RELEASES_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const SETUP_NAME = /^AgenFetch-Setup-[\w.-]+\.exe$/i;
const USER_AGENT = 'AgenFetch-Desktop';

function normalizeVersion(value) {
  return String(value || '').trim().replace(/^v/i, '');
}

function compareVersions(left, right) {
  const a = normalizeVersion(left).split(/[.-]/).map((part) => Number.parseInt(part, 10));
  const b = normalizeVersion(right).split(/[.-]/).map((part) => Number.parseInt(part, 10));
  const length = Math.max(a.length, b.length, 3);
  for (let index = 0; index < length; index += 1) {
    const av = Number.isFinite(a[index]) ? a[index] : 0;
    const bv = Number.isFinite(b[index]) ? b[index] : 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function findSetupAsset(assets) {
  const list = Array.isArray(assets) ? assets : [];
  return list.find((asset) => SETUP_NAME.test(String(asset?.name || ''))) || null;
}

function findChecksumAsset(assets) {
  const list = Array.isArray(assets) ? assets : [];
  return list.find((asset) => String(asset?.name || '') === 'SHA256SUMS.txt') || null;
}

function parseChecksums(text) {
  const map = new Map();
  String(text || '').split(/\r?\n/).forEach((line) => {
    const match = line.trim().match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (!match) return;
    map.set(path.basename(match[2].trim()), match[1].toLowerCase());
  });
  return map;
}

function isAllowedDownloadUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'github.com'
      || host.endsWith('.githubusercontent.com')
      || host === `${GITHUB_OWNER.toLowerCase()}.github.io`;
  } catch {
    return false;
  }
}

function isAllowedWebsiteUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    const repoPath = `/${GITHUB_OWNER}/${GITHUB_REPO}`.toLowerCase();
    if (host === 'github.com') {
      return parsed.pathname.toLowerCase().startsWith(repoPath);
    }
    return host === `${GITHUB_OWNER.toLowerCase()}.github.io`
      && parsed.pathname.toLowerCase().startsWith(`/${GITHUB_REPO}`.toLowerCase());
  } catch {
    return false;
  }
}

function formatBytes(value) {
  const size = Number(value);
  if (!Number.isFinite(size) || size < 0) return '—';
  if (size < 1024) return `${Math.round(size)} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

class AppUpdater {
  constructor(options = {}) {
    this.currentVersion = normalizeVersion(options.currentVersion || '0.0.0');
    this.tempDir = options.tempDir || '';
    this.fetchImpl = options.fetchImpl || fetch;
    this.openExternal = options.openExternal || (async () => {});
    this.openPath = options.openPath || (async () => '');
    this.onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
    this.activeController = null;
    this.lastCheck = null;
    this.downloadedFile = null;
  }

  info() {
    return {
      version: this.currentVersion,
      websiteUrl: WEBSITE_URL,
      releasesUrl: RELEASES_URL
    };
  }

  async requestJson(url) {
    const response = await this.fetchImpl(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': USER_AGENT
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub a renvoyé HTTP ${response.status}. Réessaie dans un moment.`);
    }
    return response.json();
  }

  async requestText(url) {
    const response = await this.fetchImpl(url, {
      headers: { Accept: 'text/plain', 'User-Agent': USER_AGENT }
    });
    if (!response.ok) return '';
    return response.text();
  }

  async check() {
    const release = await this.requestJson(GITHUB_API_LATEST);
    const setup = findSetupAsset(release.assets);
    if (!setup?.browser_download_url) {
      throw new Error('La dernière release GitHub ne contient pas l’installateur Windows.');
    }
    if (!isAllowedDownloadUrl(setup.browser_download_url)) {
      throw new Error('L’URL de l’installateur n’est pas une adresse GitHub reconnue.');
    }

    const latestVersion = normalizeVersion(release.tag_name || release.name);
    const checksumAsset = findChecksumAsset(release.assets);
    const checksumsText = checksumAsset?.browser_download_url && isAllowedDownloadUrl(checksumAsset.browser_download_url)
      ? await this.requestText(checksumAsset.browser_download_url)
      : '';
    const expectedSha256 = parseChecksums(checksumsText).get(setup.name) || '';
    const updateAvailable = compareVersions(latestVersion, this.currentVersion) > 0;

    this.lastCheck = {
      currentVersion: this.currentVersion,
      latestVersion,
      updateAvailable,
      setupName: setup.name,
      setupUrl: setup.browser_download_url,
      setupSize: Number(setup.size) || 0,
      expectedSha256,
      websiteUrl: WEBSITE_URL,
      releasesUrl: RELEASES_URL,
      publishedAt: release.published_at || null,
      notes: String(release.body || '').trim().slice(0, 800),
      checkedAt: new Date().toISOString()
    };
    return this.lastCheck;
  }

  async download() {
    if (this.activeController) {
      throw new Error('Un téléchargement de mise à jour est déjà en cours.');
    }
    const release = this.lastCheck?.updateAvailable ? this.lastCheck : await this.check();
    if (!release.updateAvailable) {
      throw new Error('Aucune mise à jour n’est disponible.');
    }
    if (!this.tempDir) {
      throw new Error('Dossier temporaire introuvable.');
    }

    fs.mkdirSync(this.tempDir, { recursive: true });
    const destination = path.join(this.tempDir, release.setupName);
    const controller = new AbortController();
    this.activeController = controller;
    this.downloadedFile = null;

    try {
      const response = await this.fetchImpl(release.setupUrl, {
        headers: { Accept: 'application/octet-stream', 'User-Agent': USER_AGENT },
        redirect: 'follow',
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`Le téléchargement a échoué (HTTP ${response.status}).`);
      }

      const total = Number(response.headers.get('content-length')) || release.setupSize || 0;
      const reader = response.body.getReader();
      const file = fs.createWriteStream(destination);
      let received = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = Buffer.from(value);
          if (!file.write(chunk)) {
            await new Promise((resolve) => file.once('drain', resolve));
          }
          received += chunk.byteLength;
          const percent = total > 0 ? Math.min(100, (received / total) * 100) : 0;
          this.onProgress({
            percent,
            percentLabel: `${percent.toFixed(0)}%`,
            received,
            total,
            receivedLabel: formatBytes(received),
            totalLabel: total ? formatBytes(total) : '—'
          });
        }
        await new Promise((resolve, reject) => {
          file.end((error) => (error ? reject(error) : resolve()));
        });
      } catch (error) {
        file.destroy();
        try { fs.unlinkSync(destination); } catch { /* ignore */ }
        throw error;
      }

      if (release.expectedSha256) {
        const actual = await hashFile(destination);
        if (actual !== release.expectedSha256) {
          fs.unlinkSync(destination);
          throw new Error('L’empreinte SHA-256 de l’installateur ne correspond pas. Téléchargement annulé.');
        }
      }

      this.onProgress({
        percent: 100,
        percentLabel: '100%',
        received: total || received,
        total: total || received,
        receivedLabel: formatBytes(total || received),
        totalLabel: formatBytes(total || received)
      });
      this.downloadedFile = destination;
      return { filePath: destination, setupName: release.setupName };
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('Téléchargement de la mise à jour annulé.');
      }
      throw error;
    } finally {
      this.activeController = null;
    }
  }

  cancel() {
    if (!this.activeController) return false;
    this.activeController.abort();
    return true;
  }

  async install() {
    if (!this.downloadedFile || !fs.existsSync(this.downloadedFile)) {
      throw new Error('Télécharge d’abord la mise à jour.');
    }
    const result = await this.openPath(this.downloadedFile);
    if (result) {
      throw new Error(result);
    }
    return { filePath: this.downloadedFile };
  }

  async openWebsite() {
    const url = this.lastCheck?.websiteUrl || WEBSITE_URL;
    if (!isAllowedWebsiteUrl(url)) {
      throw new Error('Adresse du site non autorisée.');
    }
    await this.openExternal(url);
    return { url };
  }
}

module.exports = {
  AppUpdater,
  GITHUB_API_LATEST,
  RELEASES_URL,
  WEBSITE_URL,
  compareVersions,
  findChecksumAsset,
  findSetupAsset,
  formatBytes,
  isAllowedDownloadUrl,
  isAllowedWebsiteUrl,
  normalizeVersion,
  parseChecksums
};
