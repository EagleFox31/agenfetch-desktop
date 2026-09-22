import fs from 'node:fs';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`Product consistency error: ${message}`);
  process.exitCode = 1;
}

const root = readJson('package.json');
const extension = readJson('extension/manifest.json');
const website = readJson('website/package.json');
const websiteLock = readJson('website/package-lock.json');

const version = String(root.version || '').trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`root version "${version}" must use X.Y.Z format`);
}

for (const [surface, value] of [
  ['extension/manifest.json', extension.version],
  ['website/package.json', website.version],
  ['website/package-lock.json', websiteLock.version],
  ['website/package-lock.json packages[""]', websiteLock.packages?.['']?.version]
]) {
  if (value !== version) {
    fail(`${surface} version ${value || '<missing>'} does not match canonical version ${version}`);
  }
}

try {
  const homepage = new URL(root.homepage);
  if (homepage.protocol !== 'https:') fail('homepage must use HTTPS');
} catch {
  fail('homepage must be a valid absolute URL');
}

if (!root.agenfetch?.github?.owner || !root.agenfetch?.github?.repo) {
  fail('agenfetch.github owner/repo metadata is required');
}

if (!process.exitCode) {
  console.log(`AgenFetch product metadata is consistent at v${version}.`);
}
