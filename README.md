# Reddit Power Toolkit

A local-first, open-source browser extension that supercharges the Reddit reading and writing experience. No backend, no tracking, no AI calls — everything runs inside your browser using the Chrome Storage API.

Works on Chrome, Edge, Brave, Firefox, and Kiwi Browser (Android).

---

## Highlights

- 100% client-side — Reddit content never leaves your browser
- Modern "Midnight Reddit" UI with light / dark / high-contrast themes
- Multi-language (EN, ES, FR, DE, PT, JA, ZH)
- Full keyboard-first workflow with a `Ctrl+K` command palette
- Accessibility-first: color-blind palettes, ARIA live regions, focus trapping
- Export / import your entire configuration as JSON

---

## Features

1. **Comment Tree Navigator** — jump around deep threads with a mini map
2. **Comment Folding System** — collapse chains, persisted per URL
3. **Conversation Mode** — read a single branch like a chat
4. **Comment Layers Visualization** — colored depth stripes
5. **Thread Cleaner** — hide noise, ads, and low-effort replies
6. **Comment Statistics Dashboard** — clickable stat chips that jump to comments
7. **Thread Health Analyzer** — controversy, activity, and freshness score
8. **Keyword Highlighter + Rule Builder** — keywords, authors, flairs, regex with live preview
9. **User Color Tags** — deterministic per-author colors + custom tags
10. **Formatting Toolbar** — quick markdown helpers in the reply box
11. **Thread Exporter** — JSON / Markdown / plain text
12. **Image Gallery Mode** — keyboard nav, resumes where you left off per thread
13. **Thread Age Warning** — heads-up on necro-posts
14. **Link Preview** — inline preview on hover
15. **Personal Analytics** — local-only usage stats
16. **Local Thread History** — recently visited threads
17. **Smart Summary** — top / discussed / controversial extraction
18. **Live-New Indicator** — adaptive polling with visible status
19. **Filter Chips** — OP / mods / awarded
20. **Collections** — save & star comments, JSON/CSV export & import
21. **Command Palette** — `Ctrl+K` for every action
22. **Configurable Shortcuts** — remap keys, conflict detection, reset to defaults

---

## Tech Stack

- Chrome Extension **Manifest V3**
- Vanilla **TypeScript / JavaScript** (zero build required for the extension itself)
- **Chrome Storage API** for local persistence
- Modular `RPT.*` namespace, resilient to Reddit DOM changes
- Landing page: **React 19 + TanStack Start + Vite 7 + Tailwind CSS v4**

---

## Project Structure

```
extension/            # The browser extension (load this folder unpacked)
├── manifest.json
├── background.js
├── content.js        # Modular RPT.* runtime
├── content.css
├── popup.{html,js,css}
├── options.{html,js,css}
├── analytics.{html,js,css}
├── shared.js         # i18n + shared helpers
├── _locales/         # EN, ES, FR, DE, PT, JA, ZH
└── icons/

src/                  # Marketing / documentation site
public/reddit-power-toolkit.zip  # Prebuilt release bundle
```

---

## Install (Chrome / Edge / Brave / Kiwi)

1. Download or clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `extension/` folder
5. Pin the icon, open a Reddit thread, click the icon or press `Ctrl+K`

> On Kiwi Browser (Android): open `kiwi://extensions`, enable Developer mode, then use **+ (from .zip/.crx/.user.js)** with `public/reddit-power-toolkit.zip`.

## Install (Firefox)

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `extension/manifest.json`

---

## Keyboard Shortcuts (defaults)

| Key       | Action                     |
|-----------|----------------------------|
| `Ctrl+K`  | Command palette            |
| `T`       | Toggle side panel          |
| `J` / `K` | Next / previous comment    |
| `F`       | Fold current chain         |
| `C`       | Collapse all               |
| `R`       | Refresh / resync thread    |
| `G`       | Open image gallery         |
| `←` / `→` | Gallery prev / next        |
| `Esc`     | Close modal / palette      |

All shortcuts are remappable in **Options → Shortcuts** with conflict detection and reset-to-defaults.

---

## Privacy

- No network requests to third-party servers
- No analytics, telemetry, or tracking
- No AI API calls
- All data (settings, collections, history, gallery position) is stored via `chrome.storage.local`

You can export everything to JSON and wipe local storage at any time from **Options**.

---

## Development

Extension: edit files under `extension/` and reload from `chrome://extensions`.

Landing site:

```bash
bun install
bun run dev
```

---

## Roadmap Highlights (see the What's New section on the site)

- **v1.0** — Core toolkit (16 features)
- **v1.1** — Redesign + quick-bar, summary, live-new, collections
- **v1.2** — i18n, onboarding, light/dark mode, Firefox support
- **v1.3** — Accessibility, command palette, rule builder, adaptive polling
- **v1.4** — Gallery keyboard nav, persistent folding, author-color legend, resync
- **v1.5** — Focus trapping, configurable shortcuts, gallery memory, ARIA live
- **v1.6** — Keyboard help via `aria-describedby`, shortcut export/import
- **v1.7** — Full settings backup, conflict detection, safer import, reset to defaults

---

## Contributing

Issues and PRs welcome. Because Reddit changes its DOM frequently, selector updates in `extension/content.js` (`RPT.selectors`) are the most common contribution.

## License

MIT
