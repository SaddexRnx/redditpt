# Reddit Power Toolkit

A local-first Chrome extension (Manifest V3) that improves the Reddit reading &
writing experience. Everything runs inside your browser — no backend, no
database, no AI, no external calls.

## Features

1. Comment Tree Navigator (sidebar with click-to-jump)
2. Comment Folding (collapse/expand all, remembered locally)
3. Conversation Mode (chat-style view of threads)
4. Comment Layers (color depth indicators)
5. Thread Cleaner (hide deleted / bots / short / low-score)
6. Comment Statistics dashboard
7. Thread Health Analyzer
8. Keyword Highlighter
9. User Color Tags (private labels)
10. Formatting Toolbar (Markdown helpers on textareas)
11. Thread Exporter (Markdown / HTML / JSON)
12. Image Gallery Mode (fullscreen with next/prev)
13. Thread Age Warning
14. Link Preview tooltips
15. Personal Analytics (local only)
16. Local Thread History

## Install (unpacked)

1. Unzip the download.
2. Visit `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and pick the unzipped folder.

Works in Chrome, Edge, Brave, Arc and other Chromium browsers.

## Privacy

All data (folded state, filters, keywords, tags, history, analytics) is stored
with `chrome.storage.local`. The extension never sends Reddit content or your
activity to any server.