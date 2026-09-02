'use strict';

const fs = require('node:fs');
const path = require('node:path');

function mediaPathStatus(value, { statSync = fs.statSync } = {}) {
  if (typeof value !== 'string' || !value.trim()) return { exists: false, filePath: '' };
  const filePath = path.normalize(value.trim());
  if (!path.isAbsolute(filePath)) return { exists: false, filePath: '' };
  try {
    return { exists: statSync(filePath).isFile(), filePath };
  } catch {
    return { exists: false, filePath };
  }
}

module.exports = { mediaPathStatus };
