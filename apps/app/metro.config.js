/**
 * Metro config for PANDAM.
 * - Extends the Expo default.
 * - `withNativeWind` wires up the Tailwind/global.css pipeline.
 * - Monorepo: watch the repo root and resolve from both local and root
 *   node_modules so workspace packages (@pandam/*) resolve correctly.
 */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: './src/styles/global.css' });
