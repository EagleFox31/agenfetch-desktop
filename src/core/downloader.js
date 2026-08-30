'use strict';

const { EventEmitter } = require('node:events');
const { spawn, execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { normalizeYouTubeUrl, sanitizeDownloadOptions } = require('./validation');

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

function formatDuration(totalSeconds) {
  const value = Number(totalSeconds);
  if (!Number.isFinite(value) || value < 0) return 'Durée inconnue';
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = Math.floor(value % 60);
  return hours > 0
    ? [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
    : [minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function safeThumbnailUrl(value) {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    if (parsed.protocol !== 'https:' || !(hostname === 'i.ytimg.com' || hostname.endsWith('.ytimg.com'))) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

function summarizeSubtitleTracks(metadata) {
  const representative = Array.isArray(metadata?.entries)
    ? metadata.entries.find(Boolean) || metadata
    : metadata;
  const manual = representative?.subtitles || metadata?.subtitles || {};
  const automatic = representative?.automatic_captions || metadata?.automatic_captions || {};
  const languageCodes = new Set([...Object.keys(manual), ...Object.keys(automatic)]);

  return [...languageCodes]
    .filter((code) => code && code !== 'live_chat')
    .map((code) => {
      const manualFormats = Array.isArray(manual[code]) ? manual[code] : [];
      const automaticFormats = Array.isArray(automatic[code]) ? automatic[code] : [];
      const formats = [...new Set([...manualFormats, ...automaticFormats]
        .map((item) => String(item?.ext || '').toLowerCase())
        .filter(Boolean))];
      const namedTrack = [...manualFormats, ...automaticFormats].find((item) => item?.name);
      return {
        code,
        name: String(namedTrack?.name || code),
        manual: manualFormats.length > 0,
        automatic: automaticFormats.length > 0,
        formats
      };
    })
    .sort((left, right) => {
      if (left.manual !== right.manual) return left.manual ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
}

function summarizeMetadata(metadata) {
  const entries = Array.isArray(metadata?.entries) ? metadata.entries.filter(Boolean) : [];
  const representative = entries[0] || metadata || {};
  const thumbnail = representative.thumbnail
    || [...(representative.thumbnails || [])].reverse().find((item) => item?.url)?.url
    || metadata?.thumbnail
    || '';
  const duration = representative.duration ?? metadata?.duration;

  const subtitleTracks = summarizeSubtitleTracks(representative);
  return {
    id: String(representative.id || metadata?.id || ''),
    title: String(metadata?.title || representative.title || 'Vidéo YouTube'),
    uploader: String(representative.uploader || representative.channel || metadata?.uploader || 'YouTube'),
    duration: Number.isFinite(Number(duration)) ? Number(duration) : null,
    durationLabel: formatDuration(duration),
    thumbnail: safeThumbnailUrl(thumbnail),
    isPlaylist: entries.length > 0 || metadata?._type === 'playlist',
    itemCount: entries.length || Number(metadata?.playlist_count) || 1,
    webpageUrl: String(representative.webpage_url || metadata?.webpage_url || ''),
    subtitleTracks,
    subtitleTrackCount: subtitleTracks.length
  };
}

function buildSubtitleLanguageExpression(languages) {
  const values = Array.isArray(languages) ? languages : [];
  if (values.includes('all')) return 'all,-live_chat';
  const expressions = values.flatMap((language) => [`${language}.*`, language]);
  return [...new Set([...expressions, '-live_chat'])].join(',');
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

  if (safe.subtitleMode === 'only') {
    args.push('--skip-download');
  } else if (safe.mode === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    const format = safe.container === 'mp4'
      ? 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b'
      : 'bv*+ba/b';
    args.push(
      '-f',
      format,
      '--merge-output-format',
      safe.container
    );

    const effectiveQuality = safe.compatibilityMode ? '1080' : safe.quality;
    if (effectiveQuality !== 'best') {
      args.push('-S', `res:${effectiveQuality}`);
    }

    if (safe.subtitleMode !== 'none') {
      const subtitleLanguages = buildSubtitleLanguageExpression(safe.subtitleLanguages);
      args.push(
        '--write-subs',
        '--sub-langs',
        subtitleLanguages,
        '--sub-format',
        safe.subtitleFormat === 'best' ? 'best' : `${safe.subtitleFormat}/best`
      );
      if (safe.includeAutoSubtitles) args.push('--write-auto-subs');
      if (safe.subtitleFormat !== 'best') args.push('--convert-subs', safe.subtitleFormat);
      if (safe.subtitleMode === 'embed') args.push('--embed-subs');
    }
  }

  if (safe.subtitleMode === 'only') {
    const subtitleLanguages = buildSubtitleLanguageExpression(safe.subtitleLanguages);
    args.push(
      '--write-subs',
      '--sub-langs',
      subtitleLanguages,
      '--sub-format',
      safe.subtitleFormat === 'best' ? 'best' : `${safe.subtitleFormat}/best`
    );
    if (safe.includeAutoSubtitles) args.push('--write-auto-subs');
    if (safe.subtitleFormat !== 'best') args.push('--convert-subs', safe.subtitleFormat);
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

async function checkPrerequisites(toolManager = null) {
  if (toolManager?.checkAll) return toolManager.checkAll();
  const [ytDlp, ffmpeg, deno] = await Promise.all([
    commandVersion('yt-dlp'),
    commandVersion('ffmpeg', ['-version']),
    commandVersion('deno')
  ]);

  return { ytDlp, ffmpeg, deno };
}

class DownloaderService extends EventEmitter {
  constructor(defaultFolder, {
    toolManager = null,
    spawnImpl = spawn,
    execFileImpl = execFileAsync
  } = {}) {
    super();
    this.defaultFolder = defaultFolder;
    this.toolManager = toolManager;
    this.spawnImpl = spawnImpl;
    this.execFileImpl = execFileImpl;
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
    const runtimeArgs = this.toolManager?.getYtDlpRuntimeArgs?.() || [];
    const commandArgs = [...args.slice(0, -1), ...runtimeArgs, args.at(-1)];
    const startedAt = new Date().toISOString();
    const title = typeof input?.title === 'string' ? input.title.trim().slice(0, 200) : '';
    this.active = { ...options, title, startedAt };
    this.lastDestination = null;
    this.cancelRequested = false;

    const child = this.spawnImpl(this.toolManager?.resolveCommand?.('ytDlp') || 'yt-dlp', commandArgs, {
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: this.toolManager?.buildEnvironment?.() || process.env
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
          ? 'yt-dlp est introuvable. Réinstalle AgenFetch ou relance le diagnostic.'
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
        result.error = 'Le téléchargement a échoué. Consulte le journal ou active le mode dépannage 403.';
      }

      finalize(result);
    });

    return { accepted: true, options, startedAt };
  }

  async inspect(input) {
    const source = input && typeof input === 'object' ? input : { url: input };
    const url = normalizeYouTubeUrl(source.url);
    const args = [
      '--dump-single-json',
      '--skip-download',
      '--no-warnings',
      '--no-colors'
    ];
    if (!source.playlist) args.push('--no-playlist');
    args.push(...(this.toolManager?.getYtDlpRuntimeArgs?.() || []), url);

    try {
      const { stdout } = await this.execFileImpl(
        this.toolManager?.resolveCommand?.('ytDlp') || 'yt-dlp',
        args,
        {
          windowsHide: true,
          timeout: 60000,
          maxBuffer: 12 * 1024 * 1024,
          env: this.toolManager?.buildEnvironment?.() || process.env
        }
      );
      return summarizeMetadata(JSON.parse(String(stdout || '').trim()));
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('yt-dlp est introuvable. Réinstalle AgenFetch ou relance le diagnostic.');
      }
      if (error instanceof SyntaxError) {
        throw new Error('YouTube a renvoyé des métadonnées illisibles. Mets yt-dlp à jour puis réessaie.');
      }
      throw new Error(`Impossible d’analyser ce lien : ${error.stderr || error.message}`);
    }
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
  buildSubtitleLanguageExpression,
  buildYtDlpArgs,
  checkPrerequisites,
  formatDuration,
  safeThumbnailUrl,
  summarizeMetadata,
  summarizeSubtitleTracks,
  parseProgressLine
};
