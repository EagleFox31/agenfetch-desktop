'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, callback) {
  if (typeof callback !== 'function') return () => {};
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('agenFetch', {
  checkSystem: () => ipcRenderer.invoke('system:check'),
  updateYtDlp: () => ipcRenderer.invoke('tools:update-ytdlp'),
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  getDefaultFolder: () => ipcRenderer.invoke('folder:default'),
  chooseFolder: () => ipcRenderer.invoke('folder:choose'),
  openFolder: (folderPath) => ipcRenderer.invoke('folder:open', folderPath),
  inspectMetadata: (payload) => ipcRenderer.invoke('metadata:inspect', payload),
  startDownload: (payload) => ipcRenderer.invoke('download:start', payload),
  enqueueDownloads: (payloads) => ipcRenderer.invoke('download:enqueue', payloads),
  cancelDownload: () => ipcRenderer.invoke('download:cancel'),
  getQueue: () => ipcRenderer.invoke('queue:list'),
  removeQueueItem: (itemId) => ipcRenderer.invoke('queue:remove', itemId),
  clearFinishedQueue: () => ipcRenderer.invoke('queue:clear-finished'),
  getHistory: () => ipcRenderer.invoke('history:list'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  getConsent: () => ipcRenderer.invoke('consent:status'),
  acceptConsent: () => ipcRenderer.invoke('consent:accept'),
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  checkAppUpdate: () => ipcRenderer.invoke('update:check'),
  downloadAppUpdate: () => ipcRenderer.invoke('update:download'),
  cancelAppUpdate: () => ipcRenderer.invoke('update:cancel'),
  installAppUpdate: () => ipcRenderer.invoke('update:install'),
  openUpdateWebsite: () => ipcRenderer.invoke('update:open-website'),
  onDeepLink: (callback) => subscribe('protocol:download', callback),
  onQueueChanged: (callback) => subscribe('queue:changed', callback),
  onProgress: (callback) => subscribe('download:progress', callback),
  onLog: (callback) => subscribe('download:log', callback),
  onFinished: (callback) => subscribe('download:finished', callback),
  onUpdateProgress: (callback) => subscribe('update:progress', callback),
  onOpenAbout: (callback) => subscribe('ui:open-about', callback),
  onCheckUpdates: (callback) => subscribe('ui:check-updates', callback),
  quitApp: () => ipcRenderer.invoke('app:quit')
});
