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
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  getDefaultFolder: () => ipcRenderer.invoke('folder:default'),
  chooseFolder: () => ipcRenderer.invoke('folder:choose'),
  openFolder: (folderPath) => ipcRenderer.invoke('folder:open', folderPath),
  startDownload: (payload) => ipcRenderer.invoke('download:start', payload),
  cancelDownload: () => ipcRenderer.invoke('download:cancel'),
  getHistory: () => ipcRenderer.invoke('history:list'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  onDeepLink: (callback) => subscribe('protocol:download', callback),
  onProgress: (callback) => subscribe('download:progress', callback),
  onLog: (callback) => subscribe('download:log', callback),
  onFinished: (callback) => subscribe('download:finished', callback)
});
