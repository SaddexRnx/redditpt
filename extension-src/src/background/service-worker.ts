// Reddit Power Toolkit — background service worker.
// Kept intentionally tiny in Phase 1: only handles install-time defaults
// and forwarding of the "open options" action. Feature-specific messaging
// lands with the feature-module port in Phase 4.
import { DEFAULT_SETTINGS } from "@/lib/storage";

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const existing = await chrome.storage.local.get("rpt:settings");
    if (!existing["rpt:settings"]) {
      await chrome.storage.local.set({ "rpt:settings": DEFAULT_SETTINGS });
    }
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "rpt:openOptions") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
  }
  return true;
});

export {};