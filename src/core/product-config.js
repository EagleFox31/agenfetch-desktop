'use strict';

const metadata = require('../../package.json');

function requiredText(value, label) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`Missing AgenFetch product metadata: ${label}`);
  return text;
}

function requiredHttpsUrl(value, label) {
  const text = requiredText(value, label);
  const parsed = new URL(text);
  if (parsed.protocol !== 'https:') {
    throw new Error(`AgenFetch product metadata ${label} must use HTTPS.`);
  }
  return parsed.toString();
}

const github = metadata.agenfetch?.github || {};

const PRODUCT = Object.freeze({
  name: requiredText(metadata.build?.productName || metadata.name, 'productName'),
  version: requiredText(metadata.version, 'version'),
  websiteUrl: requiredHttpsUrl(metadata.homepage, 'homepage'),
  githubOwner: requiredText(github.owner, 'agenfetch.github.owner'),
  githubRepo: requiredText(github.repo, 'agenfetch.github.repo')
});

module.exports = { PRODUCT, requiredHttpsUrl, requiredText };
