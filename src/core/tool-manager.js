'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const TOOL_DEFINITIONS = Object.freeze({
  ytDlp: {
    command: 'yt-dlp',
    windowsBinary: 'yt-dlp.exe',
    unixBinary: 'yt-dlp',
    versionArgs: ['--version']
  },
  ffmpeg: {
    command: 'ffmpeg',
    windowsBinary: 'ffmpeg.exe',
    unixBinary: 'ffmpeg',
    versionArgs: ['-version']
  },
  deno: {
    command: 'deno',
    windowsBinary: 'deno.exe',
    unixBinary: 'deno',
    versionArgs: ['--version']
  },
  quickjs: {
    command: 'qjs',
    windowsBinary: 'qjs.exe',
    unixBinary: 'qjs',
    versionArgs: ['--version']
  }
});

function firstOutputLine(stdout, stderr) {
  return `${stdout || ''}\n${stderr || ''}`.trim().split(/\r?\n/)[0] || 'Installé';
}

function detectPathKey(environment) {
  return Object.keys(environment).find((key) => key.toLowerCase() === 'path') || 'PATH';
}

class ToolManager {
  constructor({
    resourcesPath,
    userDataPath,
    projectRoot,
    isPackaged = false,
    platform = process.platform,
    environment = process.env,
    execFileImpl = execFileAsync,
    fsImpl = fs
  }) {
    this.resourcesPath = resourcesPath;
    this.userDataPath = userDataPath;
    this.projectRoot = projectRoot;
    this.isPackaged = isPackaged;
    this.platform = platform;
    this.environment = environment;
    this.execFileImpl = execFileImpl;
    this.fs = fsImpl;
    this.bundledBinPath = isPackaged
      ? path.join(resourcesPath, 'bin')
      : path.join(projectRoot, 'vendor', 'bin');
    this.managedBinPath = path.join(userDataPath, 'tools');
  }

  binaryName(toolKey) {
    const definition = TOOL_DEFINITIONS[toolKey];
    if (!definition) throw new Error(`Outil inconnu : ${toolKey}`);
    return this.platform === 'win32' ? definition.windowsBinary : definition.unixBinary;
  }

  bundledPath(toolKey) {
    return path.join(this.bundledBinPath, this.binaryName(toolKey));
  }

  managedPath(toolKey) {
    return path.join(this.managedBinPath, this.binaryName(toolKey));
  }

  exists(filePath) {
    try {
      return this.fs.existsSync(filePath) && this.fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }

  prepare() {
    const bundledYtDlp = this.bundledPath('ytDlp');
    const managedYtDlp = this.managedPath('ytDlp');
    if (!this.exists(bundledYtDlp) || this.exists(managedYtDlp)) return;

    try {
      this.fs.mkdirSync(this.managedBinPath, { recursive: true });
      this.fs.copyFileSync(bundledYtDlp, managedYtDlp);
    } catch {
      // Le binaire embarqué reste utilisable même si la copie modifiable échoue.
    }
  }

  resolveCommand(toolKey) {
    const definition = TOOL_DEFINITIONS[toolKey];
    if (!definition) throw new Error(`Outil inconnu : ${toolKey}`);

    const candidates = toolKey === 'ytDlp'
      ? [this.managedPath(toolKey), this.bundledPath(toolKey)]
      : [this.bundledPath(toolKey), this.managedPath(toolKey)];
    return candidates.find((candidate) => this.exists(candidate)) || definition.command;
  }

  sourceFor(command) {
    if (!path.isAbsolute(command)) return 'système';
    if (command.startsWith(this.managedBinPath)) return 'géré par AgenFetch';
    if (command.startsWith(this.bundledBinPath)) return 'intégré à AgenFetch';
    return 'local';
  }

  buildEnvironment() {
    const environment = { ...this.environment };
    const pathKey = detectPathKey(environment);
    const currentPath = environment[pathKey] || '';
    const prefixes = [this.managedBinPath, this.bundledBinPath].filter((folder) => {
      try {
        return this.fs.existsSync(folder);
      } catch {
        return false;
      }
    });
    environment[pathKey] = [...prefixes, currentPath].filter(Boolean).join(path.delimiter);
    return environment;
  }

  getYtDlpRuntimeArgs() {
    const args = [];
    const ffmpeg = this.resolveCommand('ffmpeg');
    const deno = this.resolveCommand('deno');
    const quickjs = this.resolveCommand('quickjs');
    if (path.isAbsolute(ffmpeg)) {
      args.push('--ffmpeg-location', path.dirname(ffmpeg));
    }
    if (path.isAbsolute(deno)) {
      args.push('--js-runtimes', `deno:${deno}`);
    } else if (path.isAbsolute(quickjs)) {
      args.push('--js-runtimes', `quickjs:${quickjs}`);
    }
    return args;
  }

  async checkTool(toolKey) {
    const definition = TOOL_DEFINITIONS[toolKey];
    const command = this.resolveCommand(toolKey);
    try {
      const { stdout, stderr } = await this.execFileImpl(command, definition.versionArgs, {
        windowsHide: true,
        timeout: 12000,
        maxBuffer: 1024 * 1024,
        env: this.buildEnvironment()
      });
      return {
        installed: true,
        version: firstOutputLine(stdout, stderr),
        source: this.sourceFor(command),
        command
      };
    } catch (error) {
      return {
        installed: false,
        version: '',
        source: this.sourceFor(command),
        command,
        error: error.code || error.message
      };
    }
  }

  async checkAll() {
    this.prepare();
    const [ytDlp, ffmpeg, deno, quickjs] = await Promise.all([
      this.checkTool('ytDlp'),
      this.checkTool('ffmpeg'),
      this.checkTool('deno'),
      this.checkTool('quickjs')
    ]);
    const jsRuntime = deno.installed ? deno : quickjs;
    return {
      ytDlp,
      ffmpeg,
      deno,
      quickjs,
      jsRuntime,
      portable: ytDlp.installed && ffmpeg.installed && jsRuntime.installed
    };
  }

  async updateYtDlp() {
    this.prepare();
    const command = this.resolveCommand('ytDlp');
    if (!command) throw new Error('yt-dlp est introuvable. Réinstalle AgenFetch.');

    try {
      const { stdout, stderr } = await this.execFileImpl(command, ['-U'], {
        windowsHide: true,
        timeout: 120000,
        maxBuffer: 4 * 1024 * 1024,
        env: this.buildEnvironment()
      });
      const status = await this.checkTool('ytDlp');
      return {
        ok: true,
        message: `${stdout || ''}\n${stderr || ''}`.trim() || 'yt-dlp est à jour.',
        status
      };
    } catch (error) {
      throw new Error(`La mise à jour de yt-dlp a échoué : ${error.stderr || error.message}`);
    }
  }
}

module.exports = {
  TOOL_DEFINITIONS,
  ToolManager,
  detectPathKey,
  firstOutputLine
};
