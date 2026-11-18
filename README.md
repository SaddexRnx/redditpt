# Reddit Power Toolkit

A browser extension that adds reading and writing tools to Reddit. No backend, no tracking, no AI calls. Everything runs in your browser using the Chrome Storage API.

Works on Chrome, Edge, Brave, Firefox, and Kiwi on Android.

![Reddit Power Toolkit](public/logo.png)

## About

This started as a few tweaks to my own Reddit experience and slowly turned into a full toolkit. It's local-first because I don't want an extension reading my browsing and sending it somewhere. I'm Saddek, a developer in Algeria. More projects at [saddexrnx.github.io](https://saddexrnx.github.io), and I'm on [Telegram](https://t.me/Saddex_x).

## What it does

It adds a side panel and a floating quick bar to Reddit comment threads, with tools for navigating and making sense of long discussions.

- Navigate deep comment trees with a minimap, or read one branch as a conversation
- Fold comment chains, hide noise, and highlight keywords or authors with a rule builder
- See comment statistics, thread health, and a summary of the top and most discussed comments
- Save comments and threads to collections, export to JSON, Markdown, or CSV
- Browse an image gallery with keyboard navigation that resumes where you left off
- Analyze any subreddit with charts, activity by hour, and a seven day trend
- Inspect which Reddit endpoints were used, with response status and timing
- A command palette (`Ctrl+K`) for every action, with remappable shortcuts

All data, including settings, collections, and history, stays in `chrome.storage.local`. You can export it all as JSON and wipe it whenever you want.

## Install

For **Chrome, Edge, Brave, or Opera**: download `public/reddit-power-toolkit-chrome.zip`, unzip it, open `chrome://extensions`, turn on Developer mode, click "Load unpacked", and select the folder. Pin the extension from the puzzle piece menu and open any Reddit comment thread.

For **Firefox 128+**: download `public/reddit-power-toolkit-firefox.zip`, unzip it, open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and pick `manifest.json`. Temporary add-ons go away when Firefox restarts.

For **Kiwi on Android**: download the Chrome zip to your phone, open `kiwi://extensions`, enable Developer mode, tap "+ (from .zip/.crx/.user.js)", and pick the zip. Force-stop Kiwi and reopen it so the content scripts load.

If the icon does nothing, Reddit was probably open before you installed the extension. Click "Reload tab" in the popup or refresh manually.

## Shortcuts

| Key | Action |
|-----------|----------------------------|
| `Ctrl+K`  | Command palette            |
| `T`       | Toggle side panel          |
| `J` / `K` | Next / previous comment    |
| `F`       | Fold current chain         |
| `C`       | Collapse all               |
| `R`       | Refresh thread             |
| `G`       | Image gallery              |
| `Esc`     | Close modal or palette     |

All of these can be remapped in Options, with conflict detection.

## Layout

```
extension-src/     Extension source (Vite, React, TypeScript, Tailwind)
  src/manifest.ts  MV3 manifest generator for Chrome and Firefox
  src/pages/       popup, options, analytics
  src/content/     shadow DOM overlay and legacy runtime
  src/background/  MV3 service worker
  public/_locales/ translations
src/               Landing and docs site (TanStack Start)
public/            Packaged zips
```

## Permissions

The extension asks for `storage`, `activeTab`, `tabs`, `scripting`, and host access to `*.reddit.com`. It uses these to save your settings, act on the current tab, notice when you move between threads, and inject the UI on Reddit. It has no access to other sites, no cookie or history access, and no remote code.

## Develop

Edit files under `extension-src/src/` and reload from `chrome://extensions`.

For the landing site:

```sh
bun install
bun run dev
```

## Contributing

Issues and pull requests are welcome. Reddit changes its DOM often, so the most common fix is updating selectors in `extension-src/src/content/legacy/content.js` (`RPT.selectors`). If a feature breaks, open an issue with the selector that failed.

## License

MIT

## Contact

GitHub: [SaddexRnx](https://github.com/SaddexRnx). Telegram: [@Saddex_x](https://t.me/Saddex_x).
