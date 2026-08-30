'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PROVIDERS = Object.freeze(['subdl', 'opensubtitles']);

class ProviderCredentialsStore {
  constructor(userDataPath, {
    encryptionAvailable = () => false,
    encryptString = () => { throw new Error('Chiffrement Windows indisponible.'); },
    decryptString = () => { throw new Error('Déchiffrement Windows indisponible.'); },
    fsImpl = fs
  } = {}) {
    this.filePath = path.join(userDataPath, 'provider-credentials.json');
    this.encryptionAvailable = encryptionAvailable;
    this.encryptString = encryptString;
    this.decryptString = decryptString;
    this.fs = fsImpl;
  }

  readRaw() {
    try {
      const value = JSON.parse(this.fs.readFileSync(this.filePath, 'utf8'));
      return value && typeof value === 'object' ? value : { version: 1, providers: {} };
    } catch {
      return { version: 1, providers: {} };
    }
  }

  status() {
    const providers = this.readRaw().providers || {};
    return {
      encryptionAvailable: Boolean(this.encryptionAvailable()),
      providers: Object.fromEntries(PROVIDERS.map((provider) => [provider, Boolean(providers[provider])]))
    };
  }

  getAll() {
    const raw = this.readRaw().providers || {};
    const result = {};
    PROVIDERS.forEach((provider) => {
      if (!raw[provider]) return;
      try {
        const encrypted = Buffer.from(String(raw[provider]), 'base64');
        result[provider] = String(this.decryptString(encrypted) || '');
      } catch {
        result[provider] = '';
      }
    });
    return result;
  }

  save(input) {
    if (!this.encryptionAvailable()) {
      throw new Error('Le stockage sécurisé Windows est indisponible sur cet appareil.');
    }
    const payload = input && typeof input === 'object' ? input : {};
    const document = this.readRaw();
    document.version = 1;
    document.providers = document.providers || {};
    PROVIDERS.forEach((provider) => {
      if (!Object.hasOwn(payload, provider)) return;
      const value = String(payload[provider] || '').trim();
      if (!value) return;
      document.providers[provider] = this.encryptString(value).toString('base64');
    });
    this.fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.fs.writeFileSync(this.filePath, JSON.stringify(document, null, 2), { encoding: 'utf8', mode: 0o600 });
    return this.status();
  }

  clear(provider) {
    if (!PROVIDERS.includes(provider)) throw new Error('Fournisseur inconnu.');
    const document = this.readRaw();
    document.providers = document.providers || {};
    delete document.providers[provider];
    this.fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.fs.writeFileSync(this.filePath, JSON.stringify(document, null, 2), { encoding: 'utf8', mode: 0o600 });
    return this.status();
  }
}

module.exports = { PROVIDERS, ProviderCredentialsStore };
