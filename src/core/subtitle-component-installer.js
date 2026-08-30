'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { formatBytes, isAllowedDownloadUrl, normalizeVersion, parseChecksums } = require('./app-updater');

const USER_AGENT = 'AgenFetch-Desktop';
const MAX_COMPONENT_SIZE = 100 * 1024 * 1024;

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

class SubtitleComponentInstaller {
  constructor({ currentVersion, destination, fetchImpl = fetch, onProgress = () => {} }) {
    this.currentVersion = normalizeVersion(currentVersion);
    this.destination = destination;
    this.fetchImpl = fetchImpl;
    this.onProgress = onProgress;
    this.activeController = null;
  }

  async request(url, accept) {
    const response = await this.fetchImpl(url, {
      headers: { Accept: accept, 'User-Agent': USER_AGENT },
      redirect: 'follow'
    });
    if (!response.ok) throw new Error(`GitHub a renvoyé HTTP ${response.status}.`);
    return response;
  }

  async resolveAsset() {
    const tag = `v${this.currentVersion}`;
    const releaseUrl = `https://api.github.com/repos/EagleFox31/agenfetch-desktop/releases/tags/${encodeURIComponent(tag)}`;
    const release = await (await this.request(releaseUrl, 'application/vnd.github+json')).json();
    const expectedName = `AgenFetch-Subtitle-Engine-${this.currentVersion}.exe`;
    const asset = (release.assets || []).find((item) => item?.name === expectedName);
    const checksumAsset = (release.assets || []).find((item) => item?.name === 'SHA256SUMS.txt');
    if (!asset?.browser_download_url || !checksumAsset?.browser_download_url) {
      throw new Error('Cette release ne contient pas encore le moteur de sous-titres et ses checksums.');
    }
    if (!isAllowedDownloadUrl(asset.browser_download_url) || !isAllowedDownloadUrl(checksumAsset.browser_download_url)) {
      throw new Error('Adresse de composant GitHub refusée.');
    }
    const checksums = parseChecksums(await (await this.request(checksumAsset.browser_download_url, 'text/plain')).text());
    const expectedSha256 = checksums.get(expectedName);
    if (!expectedSha256) throw new Error('Checksum SHA-256 du moteur absent. Installation refusée.');
    return { name: expectedName, url: asset.browser_download_url, size: Number(asset.size) || 0, expectedSha256 };
  }

  async install() {
    if (this.activeController) throw new Error('Installation du moteur déjà en cours.');
    const asset = await this.resolveAsset();
    const controller = new AbortController();
    this.activeController = controller;
    fs.mkdirSync(path.dirname(this.destination), { recursive: true });
    const temporary = `${this.destination}.download`;
    try {
      const response = await this.fetchImpl(asset.url, {
        headers: { Accept: 'application/octet-stream', 'User-Agent': USER_AGENT },
        redirect: 'follow',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Téléchargement impossible (HTTP ${response.status}).`);
      if (!response.body?.getReader) throw new Error('GitHub a renvoyé un téléchargement illisible.');
      const total = Number(response.headers.get('content-length')) || asset.size || 0;
      if (total > MAX_COMPONENT_SIZE) throw new Error('Le composant dépasse la taille maximale autorisée.');
      const reader = response.body.getReader();
      const file = fs.createWriteStream(temporary, { mode: 0o700 });
      const streamError = new Promise((_, reject) => file.once('error', reject));
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = Buffer.from(value);
        received += chunk.byteLength;
        if (received > MAX_COMPONENT_SIZE) {
          file.destroy();
          throw new Error('Le composant dépasse la taille maximale autorisée.');
        }
        if (!file.write(chunk)) await Promise.race([new Promise((resolve) => file.once('drain', resolve)), streamError]);
        const percent = total > 0 ? Math.min(100, received / total * 100) : 0;
        this.onProgress({
          percent,
          percentLabel: `${percent.toFixed(0)}%`,
          receivedLabel: formatBytes(received),
          totalLabel: total ? formatBytes(total) : '—'
        });
      }
      await new Promise((resolve, reject) => file.end((error) => error ? reject(error) : resolve()));
      const actualSha256 = await hashFile(temporary);
      if (actualSha256 !== asset.expectedSha256) {
        throw new Error('L’empreinte SHA-256 du moteur ne correspond pas. Installation annulée.');
      }
      fs.copyFileSync(temporary, this.destination);
      fs.unlinkSync(temporary);
      this.onProgress({ percent: 100, percentLabel: '100%', receivedLabel: formatBytes(received), totalLabel: formatBytes(received) });
      return { installed: true, filePath: this.destination, version: this.currentVersion };
    } catch (error) {
      try { fs.unlinkSync(temporary); } catch { /* ignore */ }
      if (controller.signal.aborted) throw new Error('Installation du moteur annulée.');
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
}

module.exports = { MAX_COMPONENT_SIZE, SubtitleComponentInstaller, hashFile };
