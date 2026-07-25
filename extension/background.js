// Reddit Power Toolkit — background service worker (MV3)
// Keeps things minimal: opens the analytics dashboard in a new tab
// when requested by the content script or popup.

chrome.runtime.onInstalled.addListener(() => {
  console.log("[RPT] Reddit Power Toolkit installed");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "OPEN_ANALYTICS") {
    chrome.tabs.create({ url: chrome.runtime.getURL("analytics.html") });
    sendResponse({ ok: true });
  }
  if (msg?.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
  }
  return true;
});