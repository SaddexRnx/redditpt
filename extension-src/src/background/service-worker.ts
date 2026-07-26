// Background service worker — seeds sensible defaults on install and
// routes runtime messages the popup/options pages send.
import {
  KEYS, DEFAULT_GENERAL, DEFAULT_AUTORUN, DEFAULT_FILTERS,
  DEFAULT_A11Y, DEFAULT_SHORTCUTS,
} from "@/lib/storage";

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install") return;
  const existing = await chrome.storage.local.get([
    KEYS.general, KEYS.autorun, KEYS.filters, KEYS.a11y, KEYS.shortcuts, KEYS.enabled,
  ]);
  const seed: Record<string, unknown> = {};
  if (!existing[KEYS.general])   seed[KEYS.general]   = DEFAULT_GENERAL;
  if (!existing[KEYS.autorun])   seed[KEYS.autorun]   = DEFAULT_AUTORUN;
  if (!existing[KEYS.filters])   seed[KEYS.filters]   = DEFAULT_FILTERS;
  if (!existing[KEYS.a11y])      seed[KEYS.a11y]      = DEFAULT_A11Y;
  if (!existing[KEYS.shortcuts]) seed[KEYS.shortcuts] = DEFAULT_SHORTCUTS;
  if (existing[KEYS.enabled] === undefined) seed[KEYS.enabled] = true;
  if (Object.keys(seed).length) await chrome.storage.local.set(seed);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "rpt:openOptions") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
  } else if (msg?.type === "OPEN_ANALYTICS") {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/pages/analytics/index.html") });
    sendResponse({ ok: true });
  }
  return true;
});

export {};
