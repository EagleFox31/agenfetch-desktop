'use strict';

const { EventEmitter } = require('node:events');
const { spawn, execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { sanitizeDownloadOptions } = require('./validation');

const execFileAsync = promisify(execFile);

function cleanMetric(value, fallback = '—') {
  const text = String(value || '').replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').trim();
  return !text || text === 'NA' ? fallback : text;
}

function parseProgressLine(line) {
  const clean = String(line || '').trim();
  if (!clean.startsWith('agenfetch:')) return null;

  const payload = clean.slice('agenfetch:'.length).trim();
  const [percent = '0%', speed = '—', eta = '—', downloaded = '—', total = '—'] = payload.split('|');
  const numericPercent = Number.parseFloat(percent.replace('%', '').trim());

  return {
    percent: Number.isFinite(numericPercent) ? Math.min(100, Math.max(0, numericPercent)) : 0,
    percentLabel: cleanMetric(percent, '0%'),
    speed: cleanMetric(speed),
    eta: cleanMetric(eta),
    downloaded: cleanMetric(downloaded),
    total: cleanMetric(total)
  };
}

function buildYtDlpArgs(options, defaultFolder) {
  const safe = sanitizeDownloadOptions(options, defaultFolder);
  const args = [
    '--newline',
    '--no-colors',
    '--progress-delta',
    '0.25',
    '--progress-template',
    'download:agenfetch:%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._downloaded_bytes_str)s|%(progress._total_bytes_str)s',
    '-P',
    safe.outputFolder,
    '-o',
    '%(title)s [%(id)s].%(ext)s'
  ];

  if (!safe.playlist) {
    args.push('--no-playlist');
  }

  if (safe.compatibilityMode) {
    args.push('--extractor-args', 'youtube:player_client=web_safari');
  }

  if (safe.mode === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    args.push(
      '-f',
      'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b',
      '--merge-output-format',
      'mp4'
    );

    const effectiveQuality = safe.compatibilityMode ? '1080' : safe.quality;
    if (effectiveQuality !== 'best') {
      args.push('-S', `res:${effectiveQuality}`);
    }
  }

  args.push(safe.url);
  return { args, options: safe };
}

function splitLines(buffer, onLine) {
  let pending = '';
  return (chunk, flush = false) => {
    pending += chunk ? chunk.toString('utf8') : '';
    const lines = pending.split(/\r?\n/);
    pending = flush ? '' : lines.pop() || '';
    for (const line of lines) onLine(line);
    if (flush && pending) onLine(pending);
  };
}

async function commandVersion(command, args = ['--version']) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      windowsHide: true,
      timeout: 12000,
      maxBuffer: 1024 * 1024
    });
    const raw = `${stdout || ''}\n${stderr || ''}`.trim();
    return { installed: true, version: raw.split(/\r?\n/)[0] || 'Installé' };
  } catch (error) {
    return { installed: false, version: '', error: error.code || error.message };
  }
}

async function checkPrerequisites() {
  const [ytDlp, ffmpeg, deno] = await Promise.all([
    commandVersion('yt-dlp'),
    commandVersion('ffmpeg', ['-version']),
    commandVersion('deno')
  ]);

  return { ytDlp, ffmpeg, deno };
}

class DownloaderService extends EventEmitter {
  constructor(defaultFolder) {
    super();
    this.defaultFolder = defaultFolder;
    this.child = null;
    this.active = null;
    this.lastDestination = null;
    this.cancelRequested = false;
  }

  get isRunning() {
    return Boolean(this.child);
  }

  start(input) {
    if (this.child) {
      throw new Error('Un téléchargement est déjà en cours.');
    }

    const { args, options } = buildYtDlpArgs(input, this.defaultFolder);
    const startedAt = new Date().toISOString();
    this.active = { ...options, startedAt };
    this.lastDestination = null;
    this.cancelRequested = false;

    const child = spawn('yt-dlp', args, {
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    this.child = child;
    let settled = false;

    const finalize = (result) => {
      if (settled) return;
      settled = true;
      this.child = null;
      this.active = null;
      this.cancelRequested = false;
      this.emit('finished', result);
    };

    const handleLine = (line) => {
      if (!line) return;
      const progress = parseProgressLine(line);
      if (progress) {
        this.emit('progress', progress);
        return;
      }

      const destinationMatch = line.match(/(?:Destination:|Merging formats into\s+")(.+?)(?:"$|$)/i);
      if (destinationMatch) this.lastDestination = destinationMatch[1].trim();

      this.emit('log', { line });
    };

    const stdout = splitLines('', handleLine);
    const stderr = splitLines('', handleLine);
    child.stdout.on('data', (chunk) => stdout(chunk));
    child.stderr.on('data', (chunk) => stderr(chunk));

    child.on('error', (error) => {
      finalize({
        ok: false,
        cancelled: false,
        error: error.code === 'ENOENT'
          ? 'yt-dlp est introuvable. Lance le diagnostic puis installe les prérequis.'
          : error.message,
        options: this.active,
        finishedAt: new Date().toISOString()
      });
    });

    child.on('close', (code, signal) => {
      stdout('', true);
      stderr('', true);
      const wasCancelled = this.cancelRequested || signal === 'SIGTERM' || signal === 'SIGKILL' || code === null;
      const result = {
        ok: code === 0,
        cancelled: wasCancelled,
        code,
        destination: this.lastDestination,
        options: this.active,
        finishedAt: new Date().toISOString()
      };

      if (code !== 0 && !wasCancelled) {
        result.error = 'Le téléchargement a échoué. Consulte le journal ou active le mode compatibilité 403.';
      }

      finalize(result);
    });

    return { accepted: true, options, startedAt };
  }

  cancel() {
    if (!this.child) return false;
    const child = this.child;
    this.cancelRequested = true;

    if (process.platform === 'win32' && child.pid) {
      execFile('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true }, () => {});
    } else {
      child.kill('SIGTERM');
    }
    return true;
  }
}

module.exports = {
  DownloaderService,
  buildYtDlpArgs,
  checkPrerequisites,
  parseProgressLine
};
