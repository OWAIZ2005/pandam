/** Expo app ESLint config. Uses eslint-config-expo, plus shared PANDAM rules. */
module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  ignorePatterns: ['dist/', '.expo/', 'web-build/', 'node_modules/', 'expo-env.d.ts'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
