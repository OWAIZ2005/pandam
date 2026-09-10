#!/usr/bin/env bash
# Full local quality gate — mirrors CI.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> format:check"
pnpm format:check
echo "==> lint"
pnpm lint
echo "==> typecheck"
pnpm typecheck
echo "==> test"
pnpm test
echo "==> build"
pnpm build
echo "All checks passed."
