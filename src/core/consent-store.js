'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TERMS_VERSION = 1;

class ConsentStore {
  constructor(userDataPath) {
    this.filePath = path.join(userDataPath, 'consent.json');
  }

  read() {
    try {
      const value = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  hasAccepted() {
    const value = this.read();
    return value.accepted === true && Number(value.version) === TERMS_VERSION;
  }

  status() {
    return {
      accepted: this.hasAccepted(),
      version: TERMS_VERSION
    };
  }

  accept() {
    const payload = {
      accepted: true,
      version: TERMS_VERSION,
      acceptedAt: new Date().toISOString()
    };
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), 'utf8');
    return this.status();
  }
}

module.exports = { ConsentStore, TERMS_VERSION };
