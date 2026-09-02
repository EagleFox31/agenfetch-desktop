'use strict';

const { EventEmitter } = require('node:events');

class DownloadQueue extends EventEmitter {
  constructor(downloader, { idFactory } = {}) {
    super();
    this.downloader = downloader;
    this.items = [];
    this.activeId = null;
    this.idFactory = idFactory || (() => `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    this.downloader.on('finished', (result) => this.handleFinished(result));
  }

  snapshot() {
    return {
      activeId: this.activeId,
      items: this.items.map((item) => ({
        id: item.id,
        url: item.payload.url,
        mode: item.payload.mode,
        quality: item.payload.quality,
        container: item.payload.container,
        subtitles: item.payload.subtitles,
        subtitleMode: item.payload.subtitleMode,
        subtitleFormat: item.payload.subtitleFormat,
        performanceProfile: item.payload.performanceProfile,
        thumbnail: item.payload.thumbnail || '',
        title: item.payload.title || '',
        status: item.status,
        createdAt: item.createdAt,
        error: item.error || ''
      }))
    };
  }

  notify() {
    this.emit('changed', this.snapshot());
  }

  add(payloads) {
    const list = Array.isArray(payloads) ? payloads : [payloads];
    if (!list.length) throw new Error('Ajoute au moins un lien à la file.');

    const waitingCount = this.items.filter((item) => ['waiting', 'running', 'paused'].includes(item.status)).length;
    if (waitingCount + list.length > 50) {
      throw new Error('La file est limitée à 50 téléchargements simultanément planifiés.');
    }

    const created = list.map((payload) => ({
      id: this.idFactory(),
      payload,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      error: ''
    }));
    this.items.push(...created);
    this.notify();
    this.runNext();
    return this.snapshot();
  }

  runNext() {
    if (this.activeId || this.downloader.isRunning) return;
    const next = this.items.find((item) => item.status === 'waiting');
    if (!next) return;

    next.status = 'running';
    this.activeId = next.id;
    this.notify();
    try {
      this.downloader.start(next.payload);
    } catch (error) {
      next.status = 'failed';
      next.error = error.message;
      this.activeId = null;
      this.notify();
      setImmediate(() => this.runNext());
    }
  }

  handleFinished(result) {
    const active = this.items.find((item) => item.id === this.activeId);
    if (active) {
      active.status = result.paused ? 'paused' : result.cancelled ? 'cancelled' : result.ok ? 'completed' : 'failed';
      active.error = result.error || '';
    }
    this.activeId = null;
    this.notify();
    setImmediate(() => this.runNext());
  }

  cancelActive() {
    return this.downloader.cancel();
  }

  pauseActive() {
    return this.downloader.pause();
  }

  resume(itemId) {
    const item = this.items.find((candidate) => candidate.id === itemId && candidate.status === 'paused');
    if (!item) return false;
    item.status = 'waiting';
    item.error = '';
    this.notify();
    this.runNext();
    return true;
  }

  remove(itemId) {
    const index = this.items.findIndex((item) => item.id === itemId && item.status === 'waiting');
    if (index === -1) return false;
    this.items.splice(index, 1);
    this.notify();
    return true;
  }

  clearFinished() {
    this.items = this.items.filter((item) => ['waiting', 'running', 'paused'].includes(item.status));
    this.notify();
    return this.snapshot();
  }
}

module.exports = { DownloadQueue };
