'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  findProtocolUrl,
  normalizeYouTubeUrl,
  parseProtocolUrl,
  sanitizeDownloadOptions
} = require('../src/core/validation');
const { DownloaderService, buildYtDlpArgs, parseProgressLine } = require('../src/core/downloader');

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
  assert.equal(safe.outputFolder, 'C:\\Downloads');
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
