'use strict';

const path = require('node:path');
const { app, BrowserWindow, clipboard, dialog, ipcMain, Notification, shell } = require('electron');
const { DownloaderService } = require('./core/downloader');
const { DownloadQueue } = require('./core/download-queue');
const { HistoryStore } = require('./core/history-store');
const { ToolManager } = require('./core/tool-manager');
const { findProtocolUrl, parseProtocolUrl, sanitizeDownloadOptions } = require('./core/validation');

let mainWindow = null;
let downloader = null;
let downloadQueue = null;
let history = null;
let toolManager = null;
let pendingDeepLink = null;

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

function registerProtocol() {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('agenfetch', process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient('agenfetch');
  }
}

function focusWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function forwardDeepLink(value) {
  const parsed = parseProtocolUrl(value);
  if (!parsed) return false;
  pendingDeepLink = parsed;
  focusWindow();
  if (mainWindow && !mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send('protocol:download', parsed);
    pendingDeepLink = null;
  }
  return true;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 790,
    minWidth: 940,
    minHeight: 680,
    show: false,
    backgroundColor: '#08191f',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    if (!targetUrl.startsWith('file://')) event.preventDefault();
  });
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingDeepLink) {
      mainWindow.webContents.send('protocol:download', pendingDeepLink);
      pendingDeepLink = null;
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showDownloadNotification(result) {
  if (!Notification.isSupported() || result.cancelled) return;
  const notification = new Notification({
    title: result.ok ? 'Téléchargement terminé' : 'Téléchargement échoué',
    body: result.ok
      ? 'Le fichier est disponible dans ton dossier de destination.'
      : result.error || 'Consulte le journal AgenFetch pour plus de détails.',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    silent: false
  });
  notification.on('click', focusWindow);
  notification.show();
}

function sanitizeQueuePayloads(payloads) {
  const list = Array.isArray(payloads) ? payloads : [payloads];
  return list.map((payload) => ({
    ...sanitizeDownloadOptions(payload, downloader.defaultFolder),
    title: typeof payload?.title === 'string' ? payload.title.trim().slice(0, 200) : ''
  }));
}

function wireIpc() {
  ipcMain.handle('system:check', () => toolManager.checkAll());
  ipcMain.handle('tools:update-ytdlp', () => {
    if (downloader.isRunning) throw new Error('Attends la fin du téléchargement avant de mettre yt-dlp à jour.');
    return toolManager.updateYtDlp();
  });
  ipcMain.handle('clipboard:read', () => clipboard.readText());

  ipcMain.handle('folder:choose', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choisir le dossier de téléchargement',
      defaultPath: app.getPath('downloads'),
      properties: ['openDirectory', 'createDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('folder:default', () => app.getPath('downloads'));

  ipcMain.handle('folder:open', async (_event, folderPath) => {
    if (typeof folderPath !== 'string' || !folderPath.trim()) return 'Dossier invalide';
    return shell.openPath(folderPath);
  });

  ipcMain.handle('metadata:inspect', (_event, payload) => downloader.inspect(payload));
  ipcMain.handle('download:start', (_event, payload) => downloadQueue.add(sanitizeQueuePayloads(payload)));
  ipcMain.handle('download:enqueue', (_event, payloads) => downloadQueue.add(sanitizeQueuePayloads(payloads)));
  ipcMain.handle('download:cancel', () => downloadQueue.cancelActive());
  ipcMain.handle('queue:list', () => downloadQueue.snapshot());
  ipcMain.handle('queue:remove', (_event, itemId) => downloadQueue.remove(itemId));
  ipcMain.handle('queue:clear-finished', () => downloadQueue.clearFinished());
  ipcMain.handle('history:list', () => history.list());
  ipcMain.handle('history:clear', () => history.clear());

  downloader.on('progress', (value) => mainWindow?.webContents.send('download:progress', value));
  downloader.on('log', (value) => mainWindow?.webContents.send('download:log', value));
  downloadQueue.on('changed', (value) => mainWindow?.webContents.send('queue:changed', value));
  downloader.on('finished', (value) => {
    const historyEntry = history.add({
      url: value.options?.url || '',
      title: value.options?.title || '',
      mode: value.options?.mode || 'video',
      quality: value.options?.quality || '—',
      container: value.options?.container || 'mp4',
      subtitles: value.options?.subtitles || 'none',
      status: value.cancelled ? 'cancelled' : value.ok ? 'completed' : 'failed',
      destination: value.destination || '',
      startedAt: value.options?.startedAt || null,
      finishedAt: value.finishedAt
    });
    mainWindow?.webContents.send('download:finished', { ...value, historyEntry });
    showDownloadNotification(value);
  });
}

app.on('second-instance', (_event, argv) => {
  const protocolUrl = findProtocolUrl(argv);
  if (protocolUrl) forwardDeepLink(protocolUrl);
  focusWindow();
});

app.on('open-url', (event, value) => {
  event.preventDefault();
  forwardDeepLink(value);
});

app.whenReady().then(() => {
  registerProtocol();
  toolManager = new ToolManager({
    resourcesPath: process.resourcesPath,
    userDataPath: app.getPath('userData'),
    projectRoot: path.join(__dirname, '..'),
    isPackaged: app.isPackaged
  });
  toolManager.prepare();
  downloader = new DownloaderService(app.getPath('downloads'), { toolManager });
  downloadQueue = new DownloadQueue(downloader);
  history = new HistoryStore(app.getPath('userData'));
  wireIpc();
  createWindow();

  const initialUrl = findProtocolUrl(process.argv);
  if (initialUrl) forwardDeepLink(initialUrl);
}).catch((error) => {
  dialog.showErrorBox(
    'AgenFetch n’a pas pu démarrer',
    error?.message || 'Une erreur inattendue est survenue pendant l’initialisation.'
  );
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
