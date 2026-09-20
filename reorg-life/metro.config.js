// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite's web backend (wa-sqlite) imports a .wasm binary, which Metro
// does not treat as an asset by default. Without this the web bundle fails to
// resolve. Native builds are unaffected.
config.resolver.assetExts.push('wasm');

module.exports = config;
