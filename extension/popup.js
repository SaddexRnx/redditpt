const $ = (s) => document.querySelector(s);
async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
function isReddit(url = "") { return /^https?:\/\/([a-z]+\.)?reddit\.com\//.test(url); }

async function runInPage(fn) {
  const tab = await activeTab();
  if (!tab?.id) return;
  try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: fn }); } catch (e) { console.warn(e); }
}

const actions = {
  "open-panel": () => runInPage(() => window.RPT?.ui.togglePanel()),
  summary:     () => runInPage(() => window.RPT?.features.summary.open()),
  conv:        () => runInPage(() => window.RPT?.features.conversation.open()),
  gallery:     () => runInPage(() => window.RPT?.features.gallery.open()),
  collapse:    () => runInPage(() => window.RPT?.features.folding.collapseAll()),
  expand:      () => runInPage(() => window.RPT?.features.folding.expandAll()),
  layers:      () => runInPage(() => {
    document.body.classList.toggle("rpt-layers-on");
    if (document.body.classList.contains("rpt-layers-on")) window.RPT?.features.layers.apply();
    else window.RPT?.features.layers.remove();
  }),
  md:          () => runInPage(() => window.RPT?.features.exporter.md()),
  json:        () => runInPage(() => window.RPT?.features.exporter.json()),
  html:        () => runInPage(() => window.RPT?.features.exporter.html()),
  kbd:         () => runInPage(() => window.RPT?.features.shortcuts.cheatsheet()),
  cmdk:        () => runInPage(() => window.RPT?.features.cmdk.open()),
  a11y:        () => chrome.runtime.openOptionsPage(),
  analytics:   () => chrome.runtime.sendMessage({ type: "OPEN_ANALYTICS" }),
  options:     () => chrome.runtime.openOptionsPage(),
  v2:          () => runInPage(() => window.RPT?.v2?.openHub?.()),
};

/** Ping the content script to see whether RPT loaded on the current tab. */
async function pingContent(tab) {
  if (!tab?.id) return { ok: false };
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({ loaded: !!window.__RPT_LOADED__, thread: /\/(r|user)\/[^/]+\/comments\//.test(location.pathname) }),
    });
    return { ok: true, ...res.result };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

function setStatus(state, tabInfo) {
  const dot = $("#dot"); const status = $("#status"); const detail = $("#activation-detail");
  dot.className = "status-dot";
  detail.style.display = "none";
  if (state === "active") {
    dot.classList.add("ok"); status.textContent = window.RPT_I18N.t("status_active");
  } else if (state === "notReddit") {
    dot.classList.add("warn"); status.textContent = window.RPT_I18N.t("status_notReddit");
  } else if (state === "notInjected") {
    dot.classList.add("warn"); status.textContent = window.RPT_I18N.t("status_notInjected");
    detail.style.display = "block";
  } else {
    dot.classList.add("err"); status.textContent = window.RPT_I18N.t("status_injectFail");
    detail.style.display = "block";
  }
}

async function refreshActivation() {
  const tab = await activeTab();
  if (!isReddit(tab?.url)) return setStatus("notReddit");
  const res = await pingContent(tab);
  if (!res.ok) return setStatus("injectFail");
  if (res.loaded) return setStatus("active");
  return setStatus("notInjected");
}

function updateThemeIcon() {
  const isDark = window.RPT_THEME.current === "dark";
  document.getElementById("theme-icon-dark").style.display = isDark ? "" : "none";
  document.getElementById("theme-icon-light").style.display = isDark ? "none" : "";
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.RPT_I18N.load();
  await window.RPT_THEME.load();
  window.RPT_I18N.apply(document);
  updateThemeIcon();

  // Master toggle
  const master = $("#master-enable");
  chrome.storage.local.get("rpt_enabled", (v) => {
    master.checked = v?.rpt_enabled !== false;
  });
  master.addEventListener("change", () => {
    chrome.storage.local.set({ rpt_enabled: master.checked });
  });

  // language selector
  const sel = $("#lang-select");
  window.RPT_I18N.LANGS.forEach(([code, label]) => {
    const o = document.createElement("option");
    o.value = code; o.textContent = label; if (code === window.RPT_I18N.current) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener("change", async () => {
    await window.RPT_I18N.set(sel.value);
    window.RPT_I18N.apply(document);
    refreshActivation();
  });

  $("#theme-toggle").addEventListener("click", async () => {
    await window.RPT_THEME.set(window.RPT_THEME.current === "dark" ? "light" : "dark");
    updateThemeIcon();
  });

  $("#reload-btn").addEventListener("click", async () => {
    const tab = await activeTab();
    if (tab?.id) chrome.tabs.reload(tab.id);
    setTimeout(() => window.close(), 200);
  });

  document.querySelectorAll("[data-act]").forEach((b) => {
    b.addEventListener("click", () => {
      const fn = actions[b.dataset.act];
      if (fn) { fn(); if (!["analytics", "options", "a11y"].includes(b.dataset.act)) window.close(); }
    });
  });

  refreshActivation();
});
