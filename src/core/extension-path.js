'use strict';

const fs = require('node:fs');
const path = require('node:path');

function resolveExtensionDir({ isPackaged = false, resourcesPath = '', projectRoot = '' } = {}) {
  return isPackaged
    ? path.join(resourcesPath, 'extension')
    : path.join(projectRoot, 'extension');
}

function extensionStatus(options = {}) {
  const folder = resolveExtensionDir(options);
  return {
    folder,
    available: fs.existsSync(path.join(folder, 'manifest.json'))
  };
}

module.exports = {
  resolveExtensionDir,
  extensionStatus
};
