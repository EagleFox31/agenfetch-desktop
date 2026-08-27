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
const { ToolManager } = require('../src/core/tool-manager');

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
  assert.equal(safe.outputFolder, 'C:\\Downloads');
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

test('analyse la sortie de progression dédiée', () => {
  const value = parseProgressLine('agenfetch: 42.3%|2.14MiB/s|00:31|84.2MiB|199.0MiB');
  assert.equal(value.percent, 42.3);
  assert.equal(value.speed, '2.14MiB/s');
  assert.equal(value.eta, '00:31');
  assert.equal(value.total, '199.0MiB');
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
  ['yt-dlp.exe', 'ffmpeg.exe', 'deno.exe'].forEach((file) => {
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
      execFileImpl: async (command) => ({ stdout: `${path.basename(command)} 1.0`, stderr: '' })
    });
    manager.prepare();
    assert.equal(manager.resolveCommand('ytDlp'), path.join(userDataPath, 'tools', 'yt-dlp.exe'));
    assert.equal(manager.resolveCommand('ffmpeg'), path.join(bundledBin, 'ffmpeg.exe'));
    assert.ok(manager.getYtDlpRuntimeArgs().includes(`deno:${path.join(bundledBin, 'deno.exe')}`));
    const status = await manager.checkAll();
    assert.equal(status.portable, true);
    assert.equal(status.ytDlp.source, 'géré par AgenFetch');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
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
  }

  const fake = new FakeDownloader();
  let counter = 0;
  const queue = new DownloadQueue(fake, { idFactory: () => `job-${++counter}` });
  const snapshot = queue.add([
    { url: 'https://youtu.be/first', mode: 'video', quality: '720' },
    { url: 'https://youtu.be/second', mode: 'audio', quality: 'best' },
    { url: 'https://youtu.be/third', mode: 'video', quality: '1080' }
  ]);
  assert.equal(snapshot.activeId, 'job-1');
  assert.equal(snapshot.items[1].status, 'waiting');
  assert.equal(queue.remove('job-3'), true);
  fake.finish();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(fake.starts, ['https://youtu.be/first', 'https://youtu.be/second']);
  assert.equal(queue.snapshot().activeId, 'job-2');
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
