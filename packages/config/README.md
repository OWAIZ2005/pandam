# @pandam/config

Shared configuration for the PANDAM monorepo. No runtime code.

| File                         | Use                                   |
| ---------------------------- | ------------------------------------- |
| `tsconfig.base.json`         | Strict TS defaults for every package  |
| `tsconfig.node.json`         | Worker / Node / build-script packages |
| `tsconfig.react-native.json` | The Expo app and cross-platform UI    |
| `eslint.base.cjs`            | Base ESLint 8 (legacy) config         |
| `prettier.config.cjs`        | Base Prettier config                  |

Consumers reference these by path, e.g.:

- `tsconfig.json` → `"extends": "@pandam/config/tsconfig.node.json"`
- `.eslintrc.cjs` → `extends: [require.resolve('@pandam/config/eslint.base.cjs')]`
- root `prettier.config.cjs` → `require('@pandam/config/prettier.config.cjs')`
