/**
 * Metro config for PANDAM.
 * - Extends the Expo default (never replaces its arrays).
 * - `withNativeWind` wires up the Tailwind/global.css pipeline.
 * - Monorepo: also watch the repo root and resolve from the root
 *   node_modules so workspace packages (@pandam/*) resolve correctly.
 */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), workspaceRoot]));
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    ...(config.resolver.nodeModulesPaths ?? []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ]),
);

module.exports = withNativeWind(config, { input: './src/styles/global.css' });
