'use strict';

const path = require('node:path');
const os = require('node:os');
const { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, Notification, shell } = require('electron');
const { DownloaderService } = require('./core/downloader');
const { DownloadQueue } = require('./core/download-queue');
const { HistoryStore } = require('./core/history-store');
const { ConsentStore } = require('./core/consent-store');
const { AppUpdater } = require('./core/app-updater');
const { ToolManager } = require('./core/tool-manager');
const { findProtocolUrl, parseProtocolUrl, sanitizeDownloadOptions } = require('./core/validation');

let mainWindow = null;
let downloader = null;
let downloadQueue = null;
let history = null;
let consent = null;
let appUpdater = null;
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

function isDevToolsShortcut(input) {
  const key = String(input.key || '').toUpperCase();
  if (input.key === 'F12') return true;
  return Boolean(input.control && input.shift && (key === 'I' || key === 'J' || key === 'C'));
}

function isWindows11() {
  if (process.platform !== 'win32') return false;
  const parts = os.release().split('.').map(Number);
  const build = parts[2] || 0;
  return build >= 22000;
}

function createWindow() {
  const windows11 = isWindows11();
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 790,
    minWidth: 940,
    minHeight: 680,
    show: false,
    backgroundColor: windows11 ? '#00000000' : '#202020',
    autoHideMenuBar: true,
    ...(process.platform === 'win32'
      ? {
          titleBarStyle: 'hidden',
          titleBarOverlay: {
            color: windows11 ? '#00000000' : '#202020',
            symbolColor: '#f3f3f3',
            height: 32
          },
          ...(windows11 ? { backgroundMaterial: 'tabbed' } : {})
        }
      : { backgroundColor: '#08191f' }),
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => {
    if (windows11 && typeof mainWindow.setBackgroundMaterial === 'function') {
      mainWindow.setBackgroundMaterial('tabbed');
    }
    mainWindow.show();
  });
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
  if (app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (isDevToolsShortcut(input)) event.preventDefault();
    });
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createAppMenu() {
  Menu.setApplicationMenu(null);
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

function requireConsent() {
  if (!consent?.hasAccepted()) {
    throw new Error('Accepte d’abord les conditions d’utilisation d’AgenFetch.');
  }
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

  ipcMain.handle('consent:status', () => consent.status());
  ipcMain.handle('consent:accept', () => consent.accept());
  ipcMain.handle('metadata:inspect', (_event, payload) => {
    requireConsent();
    return downloader.inspect(payload);
  });
  ipcMain.handle('download:start', (_event, payload) => {
    requireConsent();
    return downloadQueue.add(sanitizeQueuePayloads(payload));
  });
  ipcMain.handle('download:enqueue', (_event, payloads) => {
    requireConsent();
    return downloadQueue.add(sanitizeQueuePayloads(payloads));
  });
  ipcMain.handle('download:cancel', () => downloadQueue.cancelActive());
  ipcMain.handle('queue:list', () => downloadQueue.snapshot());
  ipcMain.handle('queue:remove', (_event, itemId) => downloadQueue.remove(itemId));
  ipcMain.handle('queue:clear-finished', () => downloadQueue.clearFinished());
  ipcMain.handle('history:list', () => history.list());
  ipcMain.handle('history:clear', () => history.clear());
  ipcMain.handle('app:info', () => appUpdater.info());
  ipcMain.handle('update:check', () => appUpdater.check());
  ipcMain.handle('update:download', () => appUpdater.download());
  ipcMain.handle('update:cancel', () => appUpdater.cancel());
  ipcMain.handle('update:install', () => appUpdater.install());
  ipcMain.handle('update:open-website', () => appUpdater.openWebsite());
  ipcMain.handle('app:quit', () => {
    app.quit();
  });

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
  createAppMenu();
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
  consent = new ConsentStore(app.getPath('userData'));
  appUpdater = new AppUpdater({
    currentVersion: app.getVersion(),
    tempDir: path.join(app.getPath('temp'), 'agenfetch-updates'),
    openExternal: (url) => shell.openExternal(url),
    openPath: (filePath) => shell.openPath(filePath),
    onProgress: (value) => mainWindow?.webContents.send('update:progress', value)
  });
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
