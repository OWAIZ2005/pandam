/**
 * Root ESLint config. Each workspace package has its own .eslintrc.cjs that
 * extends `@pandam/config/eslint`; this root config only covers loose files at
 * the repository root (scripts, config files).
 */
module.exports = {
  root: true,
  extends: [require.resolve('@pandam/config/eslint.base.cjs')],
  parserOptions: {
    project: false,
  },
  ignorePatterns: [
    'apps/**',
    'packages/**',
    'node_modules/',
    'dist/',
    'build/',
    '.turbo/',
    '.expo/',
    '.wrangler/',
    'coverage/',
  ],
};
