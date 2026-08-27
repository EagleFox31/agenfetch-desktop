'use strict';

const fs = require('node:fs');
const path = require('node:path');

class HistoryStore {
  constructor(userDataPath) {
    this.filePath = path.join(userDataPath, 'history.json');
  }

  list(limit = 20) {
    try {
      const value = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      return Array.isArray(value) ? value.slice(0, limit) : [];
    } catch {
      return [];
    }
  }

  add(entry) {
    const history = this.list(99);
    const next = [{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...entry }, ...history].slice(0, 100);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(next, null, 2), 'utf8');
    return next[0];
  }

  clear() {
    try {
      fs.unlinkSync(this.filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return true;
  }
}

module.exports = { HistoryStore };
