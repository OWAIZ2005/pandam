module.exports = {
  root: true,
  extends: [require.resolve('@pandam/config/eslint.base.cjs')],
  overrides: [
    {
      files: ['test/**/*.ts'],
      env: { node: true },
    },
  ],
};
