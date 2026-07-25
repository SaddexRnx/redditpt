// Popup entry — dispatches actions to the content script via chrome.tabs.

const $ = (s) => document.querySelector(s);

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isReddit(url = "") {
  return /^https?:\/\/([a-z]+\.)?reddit\.com\//.test(url);
}

async function runInPage(fn, args = []) {
  const tab = await activeTab();
  if (!tab?.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fn,
    args,
  });
}

const actions = {
  "open-panel": () => runInPage(() => window.RPT?.ui.togglePanel()),
  conv: () => runInPage(() => window.RPT?.features.conversation.open()),
  gallery: () => runInPage(() => window.RPT?.features.gallery.open()),
  collapse: () => runInPage(() => window.RPT?.features.folding.collapseAll()),
  expand: () => runInPage(() => window.RPT?.features.folding.expandAll()),
  layers: () =>
    runInPage(() => {
      document.body.classList.toggle("rpt-layers-on");
      if (document.body.classList.contains("rpt-layers-on"))
        window.RPT?.features.layers.apply();
      else window.RPT?.features.layers.remove();
    }),
  md: () => runInPage(() => window.RPT?.features.exporter.md()),
  json: () => runInPage(() => window.RPT?.features.exporter.json()),
  analytics: () => chrome.runtime.sendMessage({ type: "OPEN_ANALYTICS" }),
  options: () => chrome.runtime.openOptionsPage(),
};

document.addEventListener("DOMContentLoaded", async () => {
  const tab = await activeTab();
  const status = $("#status");
  if (isReddit(tab?.url)) {
    status.textContent = "Active on this Reddit tab";
    status.classList.add("ok");
  } else {
    status.textContent = "Not a Reddit page — open reddit.com to use tools";
    status.classList.add("warn");
  }
  document.querySelectorAll("[data-act]").forEach((b) => {
    b.addEventListener("click", () => {
      const fn = actions[b.dataset.act];
      if (fn) {
        fn();
        if (!["analytics", "options"].includes(b.dataset.act)) window.close();
      }
    });
  });
});