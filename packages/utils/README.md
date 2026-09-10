# @pandam/utils

Framework-agnostic helpers shared across packages. No React, no Cloudflare, no
Node-only APIs unless guarded.

Current contents:

- `Result` / `ok` / `err` — discriminated-union result type for expected failures
- `nowIso` / `elapsedMs` — time helpers with an injectable clock

Add a function here only when it is used in more than one package.
