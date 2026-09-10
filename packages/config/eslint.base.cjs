/**
 * Shared ESLint config for the PANDAM monorepo (ESLint 8, legacy config).
 * Package-level .eslintrc.cjs files extend this and add environment specifics
 * (e.g. eslint-config-expo for the app).
 */
module.exports = {
  root: false,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    es2022: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.expo/',
    '.turbo/',
    '.wrangler/',
    'coverage/',
    '*.config.cjs',
    '*.config.js',
  ],
};
