/**
 * Expo + NativeWind babel config.
 *
 * `babel-preset-expo` automatically appends `react-native-reanimated/plugin`
 * when react-native-reanimated is installed, so it is not listed explicitly
 * here (listing it as well causes a "duplicate plugin" error).
 */
module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
