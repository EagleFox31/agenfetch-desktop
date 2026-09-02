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
  installDenoRuntime: () => ipcRenderer.invoke('runtime:install-deno'),
  cancelDenoRuntimeInstall: () => ipcRenderer.invoke('runtime:cancel-deno'),
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  getDefaultFolder: () => ipcRenderer.invoke('folder:default'),
  chooseFolder: () => ipcRenderer.invoke('folder:choose'),
  chooseMedia: () => ipcRenderer.invoke('media:choose'),
  openFolder: (folderPath) => ipcRenderer.invoke('folder:open', folderPath),
  getMediaStatus: (filePath) => ipcRenderer.invoke('media:status', filePath),
  openMedia: (filePath) => ipcRenderer.invoke('media:open-path', filePath),
  showMediaInFolder: (filePath) => ipcRenderer.invoke('media:show-in-folder', filePath),
  getExtensionInfo: () => ipcRenderer.invoke('extension:info'),
  openExtensionFolder: () => ipcRenderer.invoke('extension:open-folder'),
  inspectMetadata: (payload) => ipcRenderer.invoke('metadata:inspect', payload),
  startDownload: (payload) => ipcRenderer.invoke('download:start', payload),
  enqueueDownloads: (payloads) => ipcRenderer.invoke('download:enqueue', payloads),
  cancelDownload: () => ipcRenderer.invoke('download:cancel'),
  pauseDownload: () => ipcRenderer.invoke('download:pause'),
  getQueue: () => ipcRenderer.invoke('queue:list'),
  resumeQueueItem: (itemId) => ipcRenderer.invoke('queue:resume', itemId),
  removeQueueItem: (itemId) => ipcRenderer.invoke('queue:remove', itemId),
  clearFinishedQueue: () => ipcRenderer.invoke('queue:clear-finished'),
  getHistory: () => ipcRenderer.invoke('history:list'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  getSubtitleEngineStatus: () => ipcRenderer.invoke('subtitle-engine:status'),
  installSubtitleEngine: () => ipcRenderer.invoke('subtitle-engine:install'),
  cancelSubtitleEngineInstall: () => ipcRenderer.invoke('subtitle-engine:cancel-install'),
  getSubtitleProviderStatus: () => ipcRenderer.invoke('subtitle-provider:status'),
  saveSubtitleProviders: (payload) => ipcRenderer.invoke('subtitle-provider:save', payload),
  clearSubtitleProvider: (provider) => ipcRenderer.invoke('subtitle-provider:clear', provider),
  parseSubtitleMedia: (value) => ipcRenderer.invoke('subtitle:parse', value),
  searchSubtitles: (payload) => ipcRenderer.invoke('subtitle:search', payload),
  downloadSubtitle: (payload) => ipcRenderer.invoke('subtitle:download', payload),
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
  onSubtitleEngineInstallProgress: (callback) => subscribe('subtitle-engine:install-progress', callback),
  onDenoRuntimeInstallProgress: (callback) => subscribe('runtime:deno-install-progress', callback),
  onOpenAbout: (callback) => subscribe('ui:open-about', callback),
  onCheckUpdates: (callback) => subscribe('ui:check-updates', callback),
  quitApp: () => ipcRenderer.invoke('app:quit')
});
