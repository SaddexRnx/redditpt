# Reddit Power Toolkit

<p align="center">
  <img src="public/logo.png" alt="Reddit Power Toolkit logo" width="120" height="120">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.9.7-10b981?style=flat-square" alt="Version 1.9.7">
  <img src="https://img.shields.io/badge/manifest-v3-10b981?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/license-MIT-000?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/local--first-100%25-10b981?style=flat-square" alt="Local-first">
</p>

> **Current release: v1.9.7** — see the [Changelog](#changelog) or the [GitHub releases page](https://github.com/Saddexrnx/redditpt/releases) for full history.

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

## Install — step by step

### Chrome, Edge, Brave, Opera, Arc

1. Download this repo (`Code → Download ZIP`) and unzip it, or clone with `git clone`.
2. Open a new tab and go to `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Toggle **Developer mode** on (top-right corner).
4. Click **Load unpacked** and pick the `extension/` folder from this repo.
5. Pin **Reddit Power Toolkit** to the toolbar from the puzzle-piece menu.
6. Open any Reddit comment thread (`reddit.com/r/*/comments/*`) and click the icon — the side panel opens and the floating **RPT** button appears bottom-right.
7. If Reddit was already open before you installed, hit **Reload this tab** in the popup once.

### Firefox (128+)

1. Download or clone this repo.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…**.
4. Navigate into the `extension/` folder and pick **`manifest.json`**.
5. Open a Reddit thread — the toolkit runs immediately.
6. Temporary add-ons are removed when Firefox restarts. To keep it permanently, install a signed build from AMO (planned) or use Firefox Developer Edition / Nightly with `xpinstall.signatures.required = false`.

### Kiwi Browser (Android)

1. Download `public/reddit-power-toolkit.zip` from this repo to your phone.
2. Open Kiwi and go to `kiwi://extensions`.
3. Enable **Developer mode** (top-right).
4. Tap **+ (from .zip/.crx/.user.js)** and pick the downloaded zip.
5. Force-stop Kiwi from Android app settings, then reopen it (Kiwi needs a full restart to activate new content scripts).
6. Open a Reddit comment thread — the floating **RPT** button appears bottom-right.

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

## Permissions

Reddit Power Toolkit asks for the minimum permissions needed to run entirely on your machine. Nothing here enables tracking or remote access.

| Permission | Why it's needed |
|------------|-----------------|
| `storage` | Save your settings, custom shortcuts, saved collections, per-thread gallery position, and local history via `chrome.storage.local`. Never synced to a server. |
| `activeTab` | Let the popup act on the Reddit tab you're currently viewing (open the panel, run Summary, toggle Live-new). Access is granted only after you click the extension icon. |
| `tabs` | Detect when you navigate between Reddit threads (SPA route changes) so the panel, stats, and colors resync automatically. Only tab URLs on reddit.com are read. |
| `scripting` | Inject the content script on demand from the popup when Reddit was already open before the extension was installed or updated, so you don't have to reload the tab manually. |
| **Host permissions** — `*.reddit.com/*` | Required to read the comment DOM and render the overlay UI on Reddit pages. The extension has zero access to any other website. |
| `web_accessible_resources` — `analytics.html` | Allows the local Analytics dashboard page (bundled inside the extension) to open from a Reddit tab. No external URL is loaded. |

What the extension **never** does:

- No `<all_urls>` or non-Reddit host access
- No `cookies`, `history`, `bookmarks`, `downloads`, `webRequest`, or `nativeMessaging` permissions
- No remote code execution — every script is bundled inside the extension package

---

## FAQ & Troubleshooting

**What does the "Ready · X comments" pill mean and why does it disappear?**
The status pill lives in the panel header and the quick-bar. It shows `Parsing thread…` (blue, pulsing dot) whenever the extension is re-reading the comment tree — this happens on load, after SPA navigation, and whenever Reddit lazy-loads more comments. When parsing finishes it turns green with `Ready · N comments` for ~1.4 seconds and then fades out. If you never see it settle on green, Reddit is still streaming comments in (scroll to the bottom), or a browser extension like Vimium is mutating the DOM every second — try disabling other extensions on `reddit.com`.

**The master "Enable toolkit" toggle in the popup — what does turning it off do?**
Turning the master switch off in the popup:
- Removes the floating quick-bar, side panel, modals, and tour overlay from every Reddit tab.
- Un-hides every comment the Cleaner had filtered out (`.rpt-hidden` is neutralised via CSS).
- Stops all polling, mutation watching, and DOM parsing.
- Persists across tabs and sessions (`chrome.storage.local` key: `rpt_enabled`).
Turning it back on triggers a full re-parse of the currently open Reddit tab without a page reload. Your keywords, tags, collections and history are never deleted — the toggle is purely a runtime switch.

**The extension icon does nothing on Reddit.**
Reddit was probably already open before the extension installed or updated. Open the popup — if it shows a "Reload tab" prompt, click it. Alternatively, refresh the Reddit tab manually. This is expected Chrome behaviour and applies to every MV3 extension.

**I don't see the floating RPT button on a comment thread.**
1. Confirm the URL is a comment page (`reddit.com/r/.../comments/...`) — the toolbar hides on the front page and profile pages.
2. Open the popup and check **Activation status**. If it says "Not injected", click **Reload tab**.
3. If you're on `old.reddit.com`, make sure host permissions include it (they do by default).

**A keyboard shortcut isn't working / triggers the wrong action.**
- Open **Options → Shortcuts**. If the conflict banner is shown, click **Reset** on one of the clashing rows.
- Reddit itself binds several single-letter keys (e.g. `A`, `S`, `X`). Rebind the conflicting RPT shortcut to something like `Alt+…` or `Shift+…`.
- Some browser extensions (Vimium, Surfingkeys) intercept `J/K/F`. Disable them on `reddit.com` or rebind RPT to different keys.
- If nothing responds, ensure focus is not inside a Reddit reply textarea — shortcuts are suppressed while typing.

**"Import failed: invalid file" when restoring settings.**
- The file must be a JSON export produced by RPT (Options → **Export settings**). Files edited by hand or produced by another version may fail validation.
- Check the top-level object contains at least `version` and one of `shortcuts`, `general`, `a11y`, or `gallery`.
- Unknown accessibility or theme values are rejected on purpose; open the file, remove the bad entry, and re-import.
- If a shortcut import shows conflicts after loading, resolve them from the banner or hit **Reset to defaults**.

**Collections CSV import silently skips rows.**
CSV rows without a valid `permalink` or `id` column are ignored to protect the store. Re-export a valid file from another browser or use the JSON format, which is stricter and clearer.

**"Collapse all" only folds part of the thread.**
Reddit lazy-loads deep chains. Scroll to the bottom to force additional comments to mount, click **Refresh / Resync** in the panel header, then run **Collapse all** again. The collapsed state is remembered per URL.

**Author colors look wrong or are missing.**
Open **Options → General** and confirm **Show author colors** is enabled. Colors are deterministic per username — if a user still looks uncolored, click the panel **Resync** button.

**Live-new never shows updates.**
Live-new uses adaptive polling (slower when the tab is idle). Move the mouse over the panel to switch to active polling. If the pill stays gray, Reddit is likely rate-limiting your session — wait 60 seconds and try again.

**The extension broke after a Reddit redesign.**
Reddit changes DOM class names frequently. Update `RPT.selectors` in `extension/content.js`, reload the extension from `chrome://extensions`, and open an issue with the failing selector so a fix can ship for everyone.

**Firefox: "This add-on could not be installed because it appears to be corrupt."**
You're likely trying to load the `.zip`. In Firefox, use `about:debugging` → **Load Temporary Add-on…** and pick `extension/manifest.json` directly. Permanent installs require signing via AMO.

**Kiwi Browser: nothing happens after loading the zip.**
Kiwi occasionally needs a full app restart after enabling a new extension. Force-stop Kiwi from Android settings, reopen, then visit a Reddit thread.

---

## Development

Extension: edit files under `extension/` and reload from `chrome://extensions`.

Landing site:

```bash
bun install
bun run dev
```

---

## Verifying parsing in Firefox and Kiwi

The extension uses the exact same content script on every browser, but the way to confirm it's actually parsing differs.

**Firefox**
1. Load the temporary add-on (see install steps).
2. Open a Reddit comment thread and click the RPT icon → **Open side panel**.
3. Watch the status pill in the panel header — it must go `Parsing thread…` → `Ready · N comments`.
4. Open **`about:debugging` → This Firefox → Reddit Power Toolkit → Inspect** to open the extension's devtools. In the console run `window.RPT?.state.comments.length` on the Reddit tab — a positive number confirms parsing works.
5. If the pill never appears, ensure the site is `https://www.reddit.com/*` (host permissions do not currently cover `old.reddit.com` in strict Firefox permission mode — grant it from `about:addons → RPT → Permissions`).

**Kiwi (Android)**
1. After installing from the zip, force-stop Kiwi from Android app settings and reopen it (required — content scripts don't inject into pages open before install).
2. Open a Reddit thread. The floating **RPT** button should appear bottom-right within 1-2 seconds.
3. Long-press the RPT button → the popup shows **Activation status: Active**. If it shows **Not injected**, tap **Reload this tab**.
4. To inspect: connect the phone to a desktop Chrome via USB, visit `chrome://inspect/#devices`, click **Inspect** on the Reddit tab, then run `window.__RPT_LOADED__` and `window.RPT.state.comments.length` in the console.

---

## Cross-browser compatibility checklist

Run through this list on each browser before shipping a release. Every row must pass on Chrome, Firefox, and Kiwi.

| # | Check | How to verify | Chrome | Firefox | Kiwi |
|---|-------|---------------|:------:|:-------:|:----:|
| 1 | Extension installs cleanly | Follow install steps for that browser | ☐ | ☐ | ☐ |
| 2 | Popup opens and shows activation status | Click toolbar icon on a Reddit thread | ☐ | ☐ | ☐ |
| 3 | Master toggle switches state | Toggle in popup, panel disappears/reappears without reload | ☐ | ☐ | ☐ |
| 4 | Floating RPT quick-bar appears on `/comments/` pages | Open any comment thread | ☐ | ☐ | ☐ |
| 5 | Status pill reaches `Ready · N comments` | Watch pill after page load | ☐ | ☐ | ☐ |
| 6 | Side panel opens with `T` and via popup button | Press `T` on a Reddit thread | ☐ | ☐ | ☐ |
| 7 | Comment tree renders and jumps to comments | Click any node in the Tree tab | ☐ | ☐ | ☐ |
| 8 | Collapse all + persistence works | Press `C`, reload page, chains stay folded | ☐ | ☐ | ☐ |
| 9 | Author colors render | Enable in Options → Panel legend shows colored dots | ☐ | ☐ | ☐ |
| 10 | Gallery keyboard nav (`←`/`→`) works | Press `G`, arrow-key through images | ☐ | ☐ | ☐ |
| 11 | Command palette opens with `Ctrl+K` | Trigger on any Reddit page | ☐ | ☐ | ☐ |
| 12 | Smart summary produces top/discussed/controversial | Open from panel or `Ctrl+K` | ☐ | ☐ | ☐ |
| 13 | Live-new polling toggles and shows status | Enable Live-new, wait for a poll cycle | ☐ | ☐ | ☐ |
| 14 | Cleaner hides deleted/low-score comments | Configure in Options, reload thread | ☐ | ☐ | ☐ |
| 15 | Save-to-collection ★ works | Star a comment, check Analytics page | ☐ | ☐ | ☐ |
| 16 | Export as JSON/Markdown/HTML downloads a file | Trigger from popup or panel | ☐ | ☐ | ☐ |
| 17 | Settings export/import round-trip | Export JSON, wipe, re-import | ☐ | ☐ | ☐ |
| 18 | Language switch translates popup + panel | Change from `Language` dropdown | ☐ | ☐ | ☐ |
| 19 | Light / Dark / High-contrast themes render correctly | Toggle in popup + Options | ☐ | ☐ | ☐ |
| 20 | Storage persists across browser restart | Save a keyword, restart browser | ☐ | ☐ | ☐ |

> Kiwi note: rows 10-11 depend on a physical keyboard. On a touch-only device, use the equivalent on-screen buttons in the quick-bar and panel.

Extension: edit files under `extension/` and reload from `chrome://extensions`.

Landing site:

```bash
bun install
bun run dev
```

---

## Changelog

Full release history lives on the [GitHub releases page](https://github.com/Saddexrnx/redditpt/releases).

### v1.9.7 — current

- **Full extension redesign** — consistent spacing, aligned button labels, and a fixed-size About icon in the popup (no more oversized SVG).
- **First-run onboarding wizard** — pick your language, toggle each feature with a short note under it, and either Skip or Use defaults.
- **Sticky Comment Tree toolbar** — search, author filter and ◀/▶ match cycling stay pinned while you scroll long threads.
- **Repo migrated** — every extension, popup, options and README link now points to [github.com/Saddexrnx/redditpt](https://github.com/Saddexrnx/redditpt).
- **Version sync** — manifest, popup, Options, README, website footer and About panel now show v1.9.7.

### v1.9.5

- **Full UI translation pass** — extension popup, Options, Analytics, side panel, quick-bar, command palette, modals, cards, buttons, placeholders, tooltips, status pills and dynamic hub content now route through the shared i18n layer.
- **Dynamic text localization** — newly inserted Reddit-page UI is translated automatically with a mutation observer and reverse lookup for feature cards.
- **Flat extension colors** — remaining gradient styling was removed from extension UI.
- **Packaged ZIP refreshed** — download bundle includes the latest translated extension scripts.

### v1.9.4

- Reworked extension UI spacing, mobile sizing and button visibility for Chrome, Firefox and Kiwi.
- Standardized GitHub and Telegram links across the website and extension.
- Added the correct GitHub profile: [https://github.com/Saddexrnx](https://github.com/Saddexrnx).

### v1.9.3

- Added shareable Comment Tree Navigator deep links focused on a comment or author.
- Added next / previous match controls for keyword and author search results.
- Added reduced-motion option for comment highlight animation.
- Browser-specific download selector: Chrome, Firefox or Kiwi instructions first, then download.

### v1.9.2

- Redesigned extension UI for readable spacing, fonts and touch-friendly controls.
- Replaced site accent blues with a green palette.
- Added browser-specific install chips and Telegram paper-plane icon.

### v1.9.1

- Optimized the ⚡ hub, quick-bar and Comment Tree Navigator for small screens.
- Added quick search and author filtering inside Comment Tree Navigator.
- Added hover previews and click-to-jump highlighting for exact comments.
- Added reproducible performance stress-test documentation.

### v1.9.0

- **Performance & status panel** — see which modules are running on the current page and how long each scan took. Great for spotting lag on large threads.
- **Per-subreddit rules** — enable or disable any feature just inside a specific community; global settings stay untouched.
- **Backup & restore** — one-click JSON export/import for bookmarks, history, keyword tracking, notes and settings.
- **Lazy-loaded modules** — every advanced tool only touches the DOM the first time you use it.
- Website feature cards now collapse by default and expand on click for a cleaner overview.

### v1.8.0

- **Power features hub (36 new tools)** accessible from a ⚡ button on the quick-bar, from the popup, and from the command palette.
- **Community**: comparison tool, subreddit analyzer dashboard, activity calendar, health monitor, timeline, trend tracker, subreddit groups, content exporter.
- **Thread & comments**: mini-map, selective comment export, user analytics on hover, post analytics on hover, copy tools, follow keywords.
- **Filtering & feed**: flair tools, post quality filter, feed deduplicator, age & engagement sort, media toggle, old-gold finder, sidebar cleaner.
- **Discovery & knowledge**: advanced bookmarks (folders/tags/notes), saved-content manager, research workspace, topic tracker, random discovery, local Reddit history, achievements, wiki navigator, resource collector.
- **Utilities**: search enhancer, links manager, explain-this-link, export library, repost detector, developer mode.
- Each feature can be individually enabled/disabled from the hub. All data stored locally via `chrome.storage.local`. No AI, no backend, no external calls.

### v1.7.0

- **About panel** in the extension (quick-bar `ⓘ` button, popup, and Options) showing the current version, build date, and links to the changelog, GitHub repo, and Telegram.
- **Version badge** and current-release note added to this README.
- **Quick-bar customization**: new size toggle (compact / comfortable) and a one-click ON/OFF power button directly on the floating toolbar — no need to open the popup.
- Compact mode is remembered per browser (`chrome.storage.local → rpt_qb_size`).
- When the extension is turned off from the quick-bar, the power + size buttons stay visible so users can flip it back on without opening the popup.
- Version bumped to **1.7.0** across manifest, popup, Options, About panel, site footer, and README.
- Dynamic keyboard-help updates, full settings export/import, shortcut conflict detection, safer import validation, and a "Reset to defaults" button (rolled up from v1.7 development).

### v1.6 — website + backup portability

- Landing site redesigned with per-feature "How to use" cards.
- Keyboard-help injected into every modal, wired to `aria-describedby`.
- Shortcut preferences export/import (JSON).

### v1.5 — accessibility & shortcuts

- Focus trap and focus restoration for the command palette and modals.
- Configurable keyboard shortcuts for gallery, Collapse all, and Refresh.
- Gallery resumes at the last-viewed image per thread.
- `aria-live` region for parsing status.

### v1.4 — reliability & controls

- Gallery keyboard navigation (arrows, Home/End, Esc) with proper ARIA labels.
- Collapse-all state persisted per URL across SPA navigation.
- Options toggle + live legend for author colors.
- Visible parsing status pill and manual Resync/Refresh in the panel header.

### v1.3 — power features

- Command palette (`Ctrl/⌘ + K`).
- Adaptive live-new polling with visible status.
- Custom rule builder (keyword, author, flair, regex) with live preview.
- JSON/CSV export/import for saved collections.
- Accessibility options: color-blind palettes, high contrast, ARIA labels.

### v1.2 — onboarding, i18n & themes

- Multi-language support (EN, ES, FR, DE, PT, JA, ZH).
- First-run onboarding overlay.
- Dark / Light theme toggle for extension and website.
- Firefox compatibility via `browser_specific_settings`.

### v1.1 — quick-bar era

- Persistent floating quick-bar on Reddit threads.
- Smart summary, live-new indicator, filter chips, saved collections.
- Keyboard navigation for the comment tree (`J/K/F/T`, etc.).

### v1.0 — initial release

- Manifest V3 extension with popup, Options, and Analytics pages.
- Comment tree navigator, folding, conversation mode, gallery, cleaner, statistics, thread health, keyword highlighter, user color tags, formatting toolbar, thread exporter, thread age warning, link preview, local history.

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
- **v1.8** — 36 advanced local-first power modules
- **v1.9** — Performance panel, per-subreddit rules, backup/restore, lazy loading
- **v1.9.1–1.9.7** — Mobile UI fixes, deep links, browser downloads, full i18n cleanup and French translation repair

---

## Contributing

Issues and PRs welcome. Because Reddit changes its DOM frequently, selector updates in `extension/content.js` (`RPT.selectors`) are the most common contribution.

## License

MIT

---

## Contact

GitHub: [Saddexrnx](https://github.com/Saddexrnx)  
Telegram: [@Saddex_x](https://t.me/Saddex_x)
