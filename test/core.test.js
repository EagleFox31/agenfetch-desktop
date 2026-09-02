'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const {
  findProtocolUrl,
  normalizeYouTubeUrl,
  parseProtocolUrl,
  sanitizeDownloadOptions
} = require('../src/core/validation');
const {
  DownloaderService,
  buildYtDlpArgs,
  parseProgressLine,
  safeThumbnailUrl,
  summarizeMetadata
} = require('../src/core/downloader');
const { DownloadQueue } = require('../src/core/download-queue');
const { mediaPathStatus } = require('../src/core/media-path');
const { ToolManager } = require('../src/core/tool-manager');
const { ConsentStore, TERMS_VERSION } = require('../src/core/consent-store');
const { ProviderCredentialsStore } = require('../src/core/provider-credentials-store');
const {
  sanitizeProviderResult,
  sanitizeSearchPayload
} = require('../src/core/subtitle-engine-service');

test('accepte les principaux liens YouTube', () => {
  const urls = [
    'https://www.youtube.com/watch?v=zw30rfxoV04',
    'https://youtu.be/zw30rfxoV04',
    'https://www.youtube.com/shorts/zw30rfxoV04',
    'https://www.youtube.com/live/zw30rfxoV04',
    'https://www.youtube.com/playlist?list=PL12345'
  ];
  urls.forEach((url) => assert.doesNotThrow(() => normalizeYouTubeUrl(url)));
});

test('rejette les liens non YouTube et les protocoles dangereux', () => {
  const urls = [
    'https://example.com/watch?v=zw30rfxoV04',
    'http://www.youtube.com/watch?v=zw30rfxoV04',
    'javascript:alert(1)',
    'https://www.youtube.com/'
  ];
  urls.forEach((url) => assert.throws(() => normalizeYouTubeUrl(url)));
});

test('analyse un lien agenfetch valide', () => {
  const videoUrl = 'https://www.youtube.com/watch?v=zw30rfxoV04';
  const protocol = `agenfetch://download?url=${encodeURIComponent(videoUrl)}&mode=audio`;
  assert.deepEqual(parseProtocolUrl(protocol), {
    url: videoUrl,
    mode: 'audio'
  });
});

test('ignore les liens agenfetch malformés', () => {
  assert.equal(parseProtocolUrl('agenfetch://settings'), null);
  assert.equal(parseProtocolUrl('agenfetch://download?url=https://example.com'), null);
  assert.equal(findProtocolUrl(['electron.exe', '--flag']), null);
});

test('conserve un chemin Windows avec espaces comme un argument unique', () => {
  const outputFolder = 'C:\\Users\\GENIUS ELECTRONICS\\Downloads\\YouTube';
  const { args } = buildYtDlpArgs({
    url: 'https://www.youtube.com/watch?v=zw30rfxoV04',
    mode: 'video',
    quality: '1080',
    outputFolder
  });
  const pathIndex = args.indexOf('-P');
  assert.equal(args[pathIndex + 1], outputFolder);
  assert.ok(args.includes('res:1080'));
  assert.ok(args.includes('--merge-output-format'));
});

test('construit les options MP3 sans options vidéo', () => {
  const { args } = buildYtDlpArgs({
    url: 'https://youtu.be/zw30rfxoV04',
    mode: 'audio',
    quality: 'best',
    outputFolder: 'C:\\Downloads'
  });
  assert.ok(args.includes('-x'));
  assert.ok(args.includes('mp3'));
  assert.ok(!args.includes('--merge-output-format'));
});

test('le mode compatibilité force web_safari et 1080p', () => {
  const { args } = buildYtDlpArgs({
    url: 'https://youtu.be/zw30rfxoV04',
    mode: 'video',
    quality: '2160',
    compatibilityMode: true,
    outputFolder: 'C:\\Downloads'
  });
  assert.ok(args.includes('youtube:player_client=web_safari'));
  assert.ok(args.includes('res:1080'));
  assert.ok(!args.includes('res:2160'));
});

test('assainit les valeurs inconnues', () => {
  const safe = sanitizeDownloadOptions({
    url: 'https://youtu.be/zw30rfxoV04',
    mode: 'archive',
    quality: '9999'
  }, 'C:\\Downloads');
  assert.equal(safe.mode, 'video');
  assert.equal(safe.quality, '1080');
  assert.equal(safe.container, 'mp4');
  assert.equal(safe.subtitles, 'none');
  assert.equal(safe.subtitleMode, 'none');
  assert.deepEqual(safe.subtitleLanguages, []);
  assert.equal(safe.performanceProfile, 'normal');
  assert.equal(safe.outputFolder, 'C:\\Downloads');
});

test('applique les profils de vitesse aux fragments yt-dlp', () => {
  const { args, options } = buildYtDlpArgs({
    url: 'https://youtu.be/zw30rfxoV04',
    mode: 'video',
    quality: '1080',
    performanceProfile: 'turbo',
    outputFolder: 'C:\\Downloads'
  });
  assert.equal(options.performanceProfile, 'turbo');
  assert.equal(args[args.indexOf('--concurrent-fragments') + 1], '8');
  assert.ok(args.includes('--continue'));
  assert.ok(args.includes('--part'));
});

test('construit une vidéo MKV avec sous-titres français', () => {
  const { args, options } = buildYtDlpArgs({
    url: 'https://youtu.be/zw30rfxoV04',
    mode: 'video',
    quality: '1440',
    container: 'mkv',
    subtitles: 'fr',
    outputFolder: 'C:\\Downloads'
  });
  assert.equal(options.container, 'mkv');
  assert.equal(args[args.indexOf('--merge-output-format') + 1], 'mkv');
  assert.ok(args.includes('--embed-subs'));
  assert.equal(args[args.indexOf('--sub-langs') + 1], 'fr.*,fr,-live_chat');
});

test('construit un téléchargement multilingue de sous-titres uniquement', () => {
  const { args, options } = buildYtDlpArgs({
    url: 'https://youtu.be/zw30rfxoV04',
    mode: 'video',
    subtitleMode: 'only',
    subtitleLanguages: ['fr', 'en', '../../danger'],
    subtitleFormat: 'srt',
    includeAutoSubtitles: false,
    outputFolder: 'C:\\Downloads'
  });
  assert.equal(options.subtitleMode, 'only');
  assert.deepEqual(options.subtitleLanguages, ['fr', 'en']);
  assert.ok(args.includes('--skip-download'));
  assert.ok(args.includes('--write-subs'));
  assert.ok(!args.includes('--write-auto-subs'));
  assert.ok(!args.includes('--embed-subs'));
  assert.equal(args[args.indexOf('--sub-langs') + 1], 'fr.*,fr,en.*,en,-live_chat');
  assert.equal(args[args.indexOf('--convert-subs') + 1], 'srt');
});

test('analyse la sortie de progression dédiée', () => {
  const value = parseProgressLine('agenfetch: 42.3%|2.14MiB/s|00:31|84.2MiB|199.0MiB|avc1.640028|none|137');
  assert.equal(value.percent, 42.3);
  assert.equal(value.speed, '2.14MiB/s');
  assert.equal(value.eta, '00:31');
  assert.equal(value.total, '199.0MiB');
  assert.equal(value.videoCodec, 'avc1.640028');
  assert.equal(value.audioCodec, 'none');
});

test('ignore les lignes yt-dlp ordinaires', () => {
  assert.equal(parseProgressLine('[youtube] Downloading webpage'), null);
});

test('résume les métadonnées sans exposer une miniature non approuvée', () => {
  const metadata = summarizeMetadata({
    id: 'demo',
    title: 'Démonstration AgenFetch',
    uploader: 'AgenStudio',
    duration: 125,
    thumbnail: 'https://i.ytimg.com/vi/demo/maxresdefault.jpg'
  });
  assert.equal(metadata.durationLabel, '02:05');
  assert.equal(metadata.thumbnail, 'https://i.ytimg.com/vi/demo/maxresdefault.jpg');
  assert.equal(safeThumbnailUrl('https://example.com/tracker.png'), '');
});

test('distingue les pistes YouTube officielles et automatiques', () => {
  const metadata = summarizeMetadata({
    id: 'demo',
    title: 'Vidéo multilingue',
    subtitles: {
      fr: [{ ext: 'vtt', name: 'Français' }]
    },
    automatic_captions: {
      en: [{ ext: 'vtt', name: 'English' }],
      live_chat: [{ ext: 'json' }]
    }
  });
  assert.equal(metadata.subtitleTrackCount, 2);
  assert.deepEqual(metadata.subtitleTracks.map((track) => track.code), ['fr', 'en']);
  assert.equal(metadata.subtitleTracks[0].manual, true);
  assert.equal(metadata.subtitleTracks[1].automatic, true);
});

test('analyse un lien avec le binaire géré et ses runtimes', async () => {
  let receivedArgs = [];
  const service = new DownloaderService('C:\\Downloads', {
    toolManager: {
      resolveCommand: () => 'C:\\AgenFetch\\yt-dlp.exe',
      getYtDlpRuntimeArgs: () => ['--js-runtimes', 'deno:C:\\AgenFetch\\deno.exe'],
      buildEnvironment: () => ({ PATH: 'C:\\AgenFetch' })
    },
    execFileImpl: async (_command, args) => {
      receivedArgs = args;
      return {
        stdout: JSON.stringify({
          id: 'demo',
          title: 'Vidéo de test',
          channel: 'AgenStudio',
          duration: 62
        }),
        stderr: ''
      };
    }
  });
  const metadata = await service.inspect({ url: 'https://youtu.be/zw30rfxoV04' });
  assert.equal(metadata.title, 'Vidéo de test');
  assert.ok(receivedArgs.includes('--no-playlist'));
  assert.ok(receivedArgs.includes('deno:C:\\AgenFetch\\deno.exe'));
});

test('prépare et résout les outils Windows embarqués', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agenfetch-tools-'));
  const resourcesPath = path.join(tempRoot, 'resources');
  const bundledBin = path.join(resourcesPath, 'bin');
  const userDataPath = path.join(tempRoot, 'user');
  fs.mkdirSync(bundledBin, { recursive: true });
  ['yt-dlp.exe', 'ffmpeg.exe', 'qjs.exe'].forEach((file) => {
    fs.writeFileSync(path.join(bundledBin, file), 'fake', 'utf8');
  });

  try {
    const manager = new ToolManager({
      resourcesPath,
      userDataPath,
      projectRoot: tempRoot,
      isPackaged: true,
      platform: 'win32',
      environment: { Path: 'C:\\Windows' },
      execFileImpl: async (command) => {
        if (command === 'deno') {
          const error = new Error('not found');
          error.code = 'ENOENT';
          throw error;
        }
        return { stdout: `${path.basename(command)} 1.0`, stderr: '' };
      }
    });
    manager.prepare();
    assert.equal(manager.resolveCommand('ytDlp'), path.join(userDataPath, 'tools', 'yt-dlp.exe'));
    assert.equal(manager.resolveCommand('ffmpeg'), path.join(bundledBin, 'ffmpeg.exe'));
    assert.ok(manager.getYtDlpRuntimeArgs().includes(`quickjs:${path.join(bundledBin, 'qjs.exe')}`));
    const status = await manager.checkAll();
    assert.equal(status.portable, true);
    assert.equal(status.quickjs.installed, true);
    assert.equal(status.deno.installed, false);
    assert.equal(status.ytDlp.source, 'géré par AgenFetch');

    fs.writeFileSync(path.join(userDataPath, 'tools', 'deno.exe'), 'fake', 'utf8');
    assert.ok(manager.getYtDlpRuntimeArgs().includes(`deno:${path.join(userDataPath, 'tools', 'deno.exe')}`));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('détecte un média local déplacé sans exposer une erreur système', () => {
  const present = mediaPathStatus('/media/video.mp4', {
    statSync: () => ({ isFile: () => true })
  });
  const missing = mediaPathStatus('/media/supprime.mp4', {
    statSync: () => { throw new Error('ENOENT'); }
  });
  assert.equal(present.exists, true);
  assert.equal(missing.exists, false);
  assert.equal(mediaPathStatus('chemin/relatif.mp4').exists, false);
});

test('traite la file dans l’ordre et permet de retirer un élément en attente', async () => {
  class FakeDownloader extends EventEmitter {
    constructor() {
      super();
      this.running = false;
      this.starts = [];
    }

    get isRunning() {
      return this.running;
    }

    start(payload) {
      this.running = true;
      this.starts.push(payload.url);
    }

    finish(result = { ok: true, cancelled: false }) {
      this.running = false;
      this.emit('finished', result);
    }

    cancel() {
      return this.running;
    }

    pause() {
      return this.running;
    }
  }

  const fake = new FakeDownloader();
  let counter = 0;
  const queue = new DownloadQueue(fake, { idFactory: () => `job-${++counter}` });
  const snapshot = queue.add([
    { url: 'https://youtu.be/first', mode: 'video', quality: '720', playlist: true },
    { url: 'https://youtu.be/second', mode: 'audio', quality: 'best' },
    { url: 'https://youtu.be/third', mode: 'video', quality: '1080' }
  ]);
  assert.equal(snapshot.activeId, 'job-1');
  assert.equal(snapshot.items[0].playlist, true);
  assert.equal(snapshot.items[1].playlist, false);
  assert.equal(snapshot.items[1].status, 'waiting');
  assert.equal(queue.remove('job-3'), true);
  fake.finish();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(fake.starts, ['https://youtu.be/first', 'https://youtu.be/second']);
  assert.equal(queue.snapshot().activeId, 'job-2');
});

test('met un téléchargement en pause puis le reprend avec la même charge', async () => {
  class FakeDownloader extends EventEmitter {
    constructor() {
      super();
      this.running = false;
      this.starts = [];
    }

    get isRunning() {
      return this.running;
    }

    start(payload) {
      this.running = true;
      this.starts.push(payload);
    }

    pause() {
      return this.running;
    }

    finish(result) {
      this.running = false;
      this.emit('finished', result);
    }
  }

  const fake = new FakeDownloader();
  const payload = {
    url: 'https://youtu.be/resumable',
    mode: 'video',
    quality: '1080',
    performanceProfile: 'turbo',
    thumbnail: 'https://i.ytimg.com/vi/resumable/hqdefault.jpg'
  };
  const queue = new DownloadQueue(fake, { idFactory: () => 'job-resume' });
  queue.add(payload);
  assert.equal(queue.pauseActive(), true);
  fake.finish({ ok: false, cancelled: false, paused: true });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(queue.snapshot().items[0].status, 'paused');
  assert.equal(queue.snapshot().activeId, null);

  assert.equal(queue.resume('job-resume'), true);
  assert.equal(queue.snapshot().items[0].status, 'running');
  assert.equal(queue.snapshot().activeId, 'job-resume');
  assert.equal(fake.starts.length, 2);
  assert.deepEqual(fake.starts[1], payload);
});

test('le service classe une interruption demandée comme une pause reprenable', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.pid = 0;
  child.kill = (signal) => {
    setImmediate(() => child.emit('close', null, signal));
    return true;
  };
  const service = new DownloaderService('C:\\Downloads', {
    spawnImpl: () => child
  });
  const finished = new Promise((resolve) => service.once('finished', resolve));
  service.start({
    url: 'https://youtu.be/zw30rfxoV04',
    mode: 'video',
    quality: '1080',
    thumbnail: 'https://i.ytimg.com/vi/zw30rfxoV04/hqdefault.jpg'
  });

  assert.equal(service.pause(), true);
  const result = await finished;
  assert.equal(result.paused, true);
  assert.equal(result.cancelled, false);
  assert.equal(result.error, undefined);
  assert.equal(result.options.thumbnail, 'https://i.ytimg.com/vi/zw30rfxoV04/hqdefault.jpg');
  assert.equal(service.isRunning, false);
});

test('le service relaie la progression et termine proprement', { skip: process.platform === 'win32' }, async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agenfetch-test-'));
  const fakeBinary = path.join(tempRoot, 'yt-dlp');
  const previousPath = process.env.PATH;
  fs.writeFileSync(fakeBinary, "#!/bin/sh\necho 'agenfetch: 50.0%|1.0MiB/s|00:02|5.0MiB|10.0MiB'\necho '[download] Destination: /tmp/demo.mp4'\nexit 0\n", 'utf8');
  fs.chmodSync(fakeBinary, 0o755);
  process.env.PATH = `${tempRoot}${path.delimiter}${previousPath}`;

  try {
    const service = new DownloaderService(tempRoot);
    const progressPromise = new Promise((resolve) => service.once('progress', resolve));
    const finishedPromise = new Promise((resolve) => service.once('finished', resolve));
    service.start({
      url: 'https://youtu.be/zw30rfxoV04',
      mode: 'video',
      quality: '720',
      outputFolder: tempRoot
    });

    const progress = await progressPromise;
    const result = await finishedPromise;
    assert.equal(progress.percent, 50);
    assert.equal(result.ok, true);
    assert.equal(result.destination, '/tmp/demo.mp4');
    assert.equal(service.isRunning, false);
  } finally {
    process.env.PATH = previousPath;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('la progression globale ne recule pas entre vidéo, audio et fusion', { skip: process.platform === 'win32' }, async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agenfetch-phases-'));
  const fakeBinary = path.join(tempRoot, 'yt-dlp');
  const previousPath = process.env.PATH;
  fs.writeFileSync(fakeBinary, [
    '#!/bin/sh',
    "echo 'agenfetch: 55.0%|3.0MiB/s|00:08|55.0MiB|100.0MiB|avc1|none|137'",
    "echo 'agenfetch: 35.0%|1.0MiB/s|00:05|3.5MiB|10.0MiB|none|mp4a|140'",
    "echo '[Merger] Merging formats into \"/tmp/demo.mp4\"'",
    "echo '[download] Destination: /tmp/demo.mp4'",
    'exit 0',
    ''
  ].join('\n'), 'utf8');
  fs.chmodSync(fakeBinary, 0o755);
  process.env.PATH = `${tempRoot}${path.delimiter}${previousPath}`;

  try {
    const service = new DownloaderService(tempRoot);
    const progresses = [];
    service.on('progress', (progress) => progresses.push(progress));
    const finishedPromise = new Promise((resolve) => service.once('finished', resolve));
    service.start({
      url: 'https://youtu.be/zw30rfxoV04',
      mode: 'video',
      quality: '1080',
      outputFolder: tempRoot
    });

    const result = await finishedPromise;
    assert.equal(result.ok, true);
    assert.deepEqual(progresses.map((progress) => progress.phase), ['video', 'audio', 'merge']);
    assert.deepEqual(progresses.map((progress) => progress.rawPercent), [55, 35, 35]);
    assert.ok(progresses.every((progress, index) => index === 0 || progress.percent >= progresses[index - 1].percent));
    assert.equal(progresses.at(-1).percent, 95);
  } finally {
    process.env.PATH = previousPath;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('enregistre le consentement et ignore une version périmée', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agenfetch-consent-'));
  try {
    const store = new ConsentStore(tempRoot);
    assert.equal(store.hasAccepted(), false);
    assert.deepEqual(store.status(), { accepted: false, version: TERMS_VERSION });

    const accepted = store.accept();
    assert.equal(accepted.accepted, true);
    assert.equal(store.hasAccepted(), true);
    assert.equal(JSON.parse(fs.readFileSync(path.join(tempRoot, 'consent.json'), 'utf8')).version, TERMS_VERSION);

    fs.writeFileSync(path.join(tempRoot, 'consent.json'), JSON.stringify({
      accepted: true,
      version: TERMS_VERSION - 1,
      acceptedAt: '2026-01-01T00:00:00.000Z'
    }), 'utf8');
    assert.equal(store.hasAccepted(), false);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

const {
  AppUpdater,
  compareVersions,
  findSetupAsset,
  formatBytes,
  isAllowedDownloadUrl,
  isAllowedWebsiteUrl,
  normalizeVersion,
  parseChecksums
} = require('../src/core/app-updater');

test('compare les versions d’AgenFetch', () => {
  assert.equal(normalizeVersion('v0.2.1'), '0.2.1');
  assert.equal(compareVersions('0.2.2', '0.2.1'), 1);
  assert.equal(compareVersions('0.2.1', '0.2.1'), 0);
  assert.equal(compareVersions('0.2.0', '0.2.1'), -1);
});

test('repère l’installateur et les checksums GitHub', () => {
  const assets = [
    { name: 'AgenFetch-Extension-0.3.0.zip', browser_download_url: 'https://github.com/EagleFox31/agenfetch-desktop/releases/download/v0.3.0/AgenFetch-Extension-0.3.0.zip' },
    { name: 'AgenFetch-Setup-0.3.0.exe', browser_download_url: 'https://github.com/EagleFox31/agenfetch-desktop/releases/download/v0.3.0/AgenFetch-Setup-0.3.0.exe', size: 80 },
    { name: 'SHA256SUMS.txt', browser_download_url: 'https://github.com/EagleFox31/agenfetch-desktop/releases/download/v0.3.0/SHA256SUMS.txt' }
  ];
  assert.equal(findSetupAsset(assets).name, 'AgenFetch-Setup-0.3.0.exe');
  assert.equal(parseChecksums('abcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabca  AgenFetch-Setup-0.3.0.exe\n').get('AgenFetch-Setup-0.3.0.exe').length, 64);
  assert.equal(isAllowedDownloadUrl(assets[1].browser_download_url), true);
  assert.equal(isAllowedDownloadUrl('https://evil.example/setup.exe'), false);
  assert.equal(isAllowedWebsiteUrl('https://eaglefox31.github.io/agenfetch-desktop/#download'), true);
  assert.equal(formatBytes(1536), '1.5 Ko');
});

test('détecte une mise à jour plus récente via GitHub Releases', async () => {
  const payload = {
    tag_name: 'v0.3.0',
    name: 'AgenFetch v0.3.0',
    body: 'Notes',
    published_at: '2026-08-28T00:00:00Z',
    assets: [
      {
        name: 'AgenFetch-Setup-0.3.0.exe',
        browser_download_url: 'https://github.com/EagleFox31/agenfetch-desktop/releases/download/v0.3.0/AgenFetch-Setup-0.3.0.exe',
        size: 42
      }
    ]
  };
  const updater = new AppUpdater({
    currentVersion: '0.2.1',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => payload,
      text: async () => '',
      headers: { get: () => null }
    })
  });
  const result = await updater.check();
  assert.equal(result.updateAvailable, true);
  assert.equal(result.latestVersion, '0.3.0');
  assert.equal(result.currentVersion, '0.2.1');
});

test('télécharge l’installateur avec une progression', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agenfetch-update-'));
  const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const percents = [];
  const updater = new AppUpdater({
    currentVersion: '0.2.1',
    tempDir: tempRoot,
    onProgress: (value) => percents.push(value.percent),
    fetchImpl: async (url) => {
      if (String(url).includes('/releases/latest')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            tag_name: 'v0.3.0',
            assets: [{
              name: 'AgenFetch-Setup-0.3.0.exe',
              browser_download_url: 'https://github.com/EagleFox31/agenfetch-desktop/releases/download/v0.3.0/AgenFetch-Setup-0.3.0.exe',
              size: payload.byteLength
            }]
          }),
          headers: { get: () => null }
        };
      }
      return {
        ok: true,
        status: 200,
        headers: { get: (name) => (name === 'content-length' ? String(payload.byteLength) : null) },
        body: {
          getReader() {
            let done = false;
            return {
              async read() {
                if (done) return { done: true, value: undefined };
                done = true;
                return { done: false, value: payload };
              }
            };
          }
        }
      };
    }
  });

  try {
    await updater.check();
    const downloaded = await updater.download();
    assert.equal(fs.readFileSync(downloaded.filePath).length, payload.byteLength);
    assert.ok(percents.includes(100));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

const { resolveExtensionDir, extensionStatus } = require('../src/core/extension-path');

test('résout le dossier de l’extension packagée et en développement', () => {
  const packaged = resolveExtensionDir({
    isPackaged: true,
    resourcesPath: 'C:\\Program Files\\AgenFetch\\resources',
    projectRoot: 'C:\\dev\\agenfetch'
  });
  const unpackaged = resolveExtensionDir({
    isPackaged: false,
    resourcesPath: 'C:\\Program Files\\AgenFetch\\resources',
    projectRoot: 'C:\\dev\\agenfetch'
  });
  assert.match(packaged.replaceAll('/', '\\'), /resources\\extension$/i);
  assert.match(unpackaged.replaceAll('/', '\\'), /agenfetch\\extension$/i);

  const status = extensionStatus({
    isPackaged: false,
    projectRoot: path.join(__dirname, '..')
  });
  assert.equal(status.available, true);
  assert.ok(status.folder.endsWith('extension'));
});

test('chiffre les clés des fournisseurs sans les exposer dans le statut', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agenfetch-providers-'));
  const store = new ProviderCredentialsStore(tempRoot, {
    encryptionAvailable: () => true,
    encryptString: (value) => Buffer.from(`encrypted:${value}`, 'utf8'),
    decryptString: (value) => value.toString('utf8').replace(/^encrypted:/, '')
  });
  try {
    const status = store.save({ subdl: 'secret-subdl' });
    assert.equal(status.providers.subdl, true);
    assert.equal(status.providers.opensubtitles, false);
    assert.deepEqual(store.getAll(), { subdl: 'secret-subdl' });
    const raw = fs.readFileSync(path.join(tempRoot, 'provider-credentials.json'), 'utf8');
    assert.equal(raw.includes('secret-subdl'), false);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('assainit une recherche locale et les références fournisseur', () => {
  const search = sanitizeSearchPayload({
    mediaPath: 'C:\\Videos\\The.Last.of.Us.S02E03.mkv',
    languages: ['fr', 'EN', '../../danger', 'fr']
  });
  assert.deepEqual(search.languages, ['fr', 'en']);
  assert.throws(() => sanitizeSearchPayload({ mediaPath: 'C:\\Videos\\payload.exe' }));
  assert.deepEqual(sanitizeProviderResult({
    provider: 'subdl',
    language: 'FR',
    fileName: '../episode.srt',
    downloadRef: { path: '/subtitle/123.zip' }
  }), {
    provider: 'subdl',
    language: 'fr',
    fileName: 'episode.srt',
    downloadRef: { path: '/subtitle/123.zip' }
  });
  assert.deepEqual(sanitizeProviderResult({
    provider: 'subliminal',
    language: 'FR',
    fileName: '../episode.srt',
    downloadRef: {
      providerName: 'PODNAPISI',
      subtitleId: 'provider-result-123',
      url: 'https://evil.example/file.srt'
    }
  }), {
    provider: 'subliminal',
    language: 'fr',
    fileName: 'episode.srt',
    downloadRef: { providerName: 'podnapisi', subtitleId: 'provider-result-123' }
  });
  assert.throws(() => sanitizeProviderResult({
    provider: 'subliminal',
    downloadRef: { providerName: 'unknown', subtitleId: '123' }
  }));
  assert.throws(() => sanitizeProviderResult({ provider: 'evil', downloadRef: {} }));
});
