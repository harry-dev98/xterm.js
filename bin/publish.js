/**
 * Copyright (c) 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 */

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

// Setup auth
fs.writeFileSync(`${process.env['HOME']}/.npmrc`, `//registry.npmjs.org/:_authToken=${process.env['NPM_AUTH_TOKEN']}`);

// Get the version
const tag = 'beta'
const nextVersion = getNextVersion(tag);
console.log(`Publishing version: ${nextVersion}`);

// Set the version in package.json
const packageJsonFile = path.resolve(__dirname, '..', 'package.json');
packageJson.version = nextVersion;
fs.writeFileSync(packageJsonFile, JSON.stringify(packageJson, null, 2));

// Publish
const result = cp.spawn('npm', ['publish', '--tag', tag], {
  stdio: 'inherit'
});
result.on('exit', code => process.exit(code));

function getNextVersion(tag) {
  if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.exec(packageJson.version)) {
    console.error('The package.json version must be of the form x.y.z');
    process.exit(1);
  }
  const stableVersion = packageJson.version.split('.');
  const nextStableVersion = `${stableVersion[0]}.${parseInt(stableVersion[1]) + 1}.${stableVersion[2]}`;
  const publishedVersions = getPublishedVersions(nextStableVersion, tag);
  if (publishedVersions.length === 0) {
    return `${packageJson.version}-${tag}1`;
  }
  const latestPublishedVersion = publishedVersions.sort((a, b) => b.localeCompare(a))[0];
  const latestTagVersion = parseInt(latestPublishedVersion.substr(latestPublishedVersion.search(/[0-9]+$/)), 10);
  return `${nextStableVersion}-${tag}${latestTagVersion + 1}`;
}

function getPublishedVersions(version, tag) {
  const versionsProcess = cp.spawnSync('npm', ['view', 'xterm', 'versions', '--json']);
  const versionsJson = JSON.parse(versionsProcess.stdout);
  return versionsJson.filter(v => !v.search(new RegExp(`${version}-${tag}[0-9]+`)));
}