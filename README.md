# Reddit Power Toolkit

<p align="center">
  <img src="public/logo.png" alt="Reddit Power Toolkit logo" width="120" height="120">
</p>

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

---

## Contact

Telegram: [@Saddex_x](https://t.me/Saddex_x)
