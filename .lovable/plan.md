## Scope

Five new capabilities in the extension + a visual redesign of the install-steps section on the landing page. I'll also confirm the "four features" list you re-pasted — those already exist in v1.2 (Smart Summary, Live-new bell badge with `N`, filter chips, ★ save-to-collections). I'll verify each is wired and polish anything missing rather than re-implementing.

## 1. Accessibility page (extension)

New `extension/a11y.html` + `a11y.js` linked from Options and popup footer.

Settings stored in `rpt_a11y`:
- **Palette**: Default / Deuteranopia / Protanopia / Tritanopia / Monochrome (swaps `--rpt-accent` + `--rpt-accent-2` CSS vars in content.css + all pages)
- **High-contrast mode**: forces `--rpt-bg` pure black/white, thicker borders (2px), stronger focus rings
- **Larger text**: bumps base font 14 → 16px in panel/popup
- **Reduced motion**: disables pulse/spotlight animations (also respects `prefers-reduced-motion`)

ARIA sweep across `popup.html`, `options.html`, `analytics.html`, `content.js`-generated panel:
- `role="dialog" aria-modal="true" aria-labelledby=…` on all modals (summary, gallery, cheat sheet, palette)
- `aria-label` on every icon-only button (quick-bar, star, close, theme toggle)
- `role="tablist"/tab/tabpanel` on the panel tabs
- `aria-live="polite"` on the Live-new status + toast region
- Visible `:focus-visible` outline using accent color

## 2. Saved collections import/export

In Analytics page + panel Saved tab:
- **Export JSON** — full `rpt_collections` array with schema version
- **Export CSV** — `savedAt,author,subreddit,url,body`
- **Import** — file input; validates shape; de-dupes by URL; merges into existing collection

## 3. Adaptive Live-new polling

Rewrite `RPT.features.liveNew`:
- Base interval 45s; if user is active (mouse/scroll in last 30s) → 20s; if tab hidden or idle > 3min → 120s; back off ×2 on HTTP error up to 5min
- New status pill in the quick-bar next to the bell: dot + text ("Live · 20s", "Idle · 2m", "Paused", "Checking…", "+3 new")
- `aria-live="polite"` announces new count
- Uses `visibilitychange` + `pointermove`/`scroll` listeners

## 4. Rule builder

New Options section "Rules" and modal opener from the panel:
- Rule types: `keyword` (substring, case-insensitive) · `author` (exact u/) · `flair` (substring) · `regex` (JS regex, safe-compiled with try/catch)
- Per rule: action (`highlight` w/ color picker, or `hide`), enabled toggle, label
- **Live preview**: sample list of currently-visible comments on the page (or last-parsed tree cached in `chrome.storage.local`) shown with the rule applied in real time
- Persisted to `rpt_rules`; content.js applies on load + on rule change via `chrome.storage.onChanged`

## 5. Command palette (Ctrl/Cmd+K)

Injected on any Reddit page by `content.js`:
- Fuzzy-match list of commands: Open Panel, Smart Summary, Gallery, Conversation, Layers, Collapse/Expand All, Live-new toggle, Newest, OP-only / Mod-only / Awarded / Reset chips, Export MD/JSON/HTML, Open Rules, Open Settings, Toggle theme, Switch language →
- `role="dialog"`, arrow-key navigation, Enter to run, Esc to close
- Also opens via a new `⌘K` button in the quick-bar and a "Command palette" entry in the popup

## 6. The "four features" already-shipped check

Quick verification pass — no rebuild expected, only touch-ups:
- Smart Summary modal — confirm `RPT.features.summary.open()` renders 4 sections and click-to-jump works
- Live-new bell badge + `N` shortcut — will already be replaced by section 3
- Filter chips OP/Mod/Awarded/Reset — confirm present in panel header
- ★ Save buttons + Saved tab + Analytics "Saved" — confirm inline injection

## 7. Landing-page install section redesign

Replace the plain numbered list with a modern **3-step visual card layout** per browser tab:

```text
[  1  Download  ]──►[  2  Load unpacked  ]──►[  3  Open Reddit  ]
   ZIP icon           puzzle icon              reddit icon
   "Get the .zip"     "chrome://extensions →   "Quick-bar appears
                       Dev mode → Load"         bottom-right"
```

- Cards with lucide icons, step number in an accent circle, short French/EN copy driven by existing i18n dict
- Per-browser tab still switches copy (Chrome/Edge/Brave, Firefox `about:debugging`, Kiwi Android long-press menu)
- Copy-to-clipboard button on `chrome://extensions` / `about:debugging` strings
- Respects dark/light theme via existing CSS tokens

## Technical notes

- All new UI uses the existing `--rpt-*` CSS variables — no hardcoded colors — so palette + high-contrast swaps propagate for free.
- No new permissions needed; import uses `<input type=file>`, export uses `Blob` + `URL.createObjectURL`.
- Palette + rules are re-broadcast to open Reddit tabs via `chrome.storage.onChanged` — no page reload required.
- Manifest bumps to **1.3.0**, ZIP is repackaged at `public/reddit-power-toolkit.zip`.

## Out of scope

- No backend, no AI, no external APIs (unchanged principle).
- No changes to auth/data model on the website — it stays a static landing page.
