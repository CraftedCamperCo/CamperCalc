const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('glb', 'gltf');

// Keep Metro focused on app/runtime code. Large docs/assets folders can
// dramatically slow startup and make the CLI appear unresponsive.
const EXCLUDED_DIRS = [
  'VICTRON ASSEST',
  'IMAGES',
  'INTRO',
  'docs',
  'email-templates',
  'wiring-prototype',
];

const escapeForRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sep = `\\${path.sep}`;

config.resolver.blockList = EXCLUDED_DIRS.map((dir) => {
  const absolute = path.resolve(__dirname, dir);
  return new RegExp(`^${escapeForRegex(absolute)}${sep}.*`);
});

module.exports = config;