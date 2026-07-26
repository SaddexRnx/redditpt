# Reddit Power Toolkit — Vite + React + TS + Tailwind build (Phase 1)

Isolated, minified, tree-shaken, asset-hashed MV3 build of the extension.

```bash
cd extension-src
bun install
bun run build:chrome
bun run build:firefox
bun run zip     # → ../public/reddit-power-toolkit-{chrome,firefox}.zip
```

Phase status: **1 / 5** — build system + shared foundation.
The legacy `extension/` directory remains the shipping build until Phase 4.