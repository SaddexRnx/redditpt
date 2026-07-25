const KEYS = {
  filters: "rpt_filters", keywords: "rpt_keywords", tags: "rpt_user_tags",
  autorun: "rpt_autorun", general: "rpt_general",
};
const F_DEF = { hideDeleted: false, hideEmpty: false, hideBots: false, hideShort: false, minLength: 15, hideLowScore: false, minScore: 1 };
const A_DEF = { cleaner: true, highlighter: true, tags: true, ageWarning: true, quickBar: true, saveButtons: true, liveNew: true };
const G_DEF = { autoOpenPanel: true, showOnboarding: true };
const get = (k) => new Promise((r) => chrome.storage.local.get(k, r));
const set = (o) => new Promise((r) => chrome.storage.local.set(o, r));

async function bindGroup(attr, storeKey, defaults) {
  const { [storeKey]: v } = await get(storeKey);
  const cur = { ...defaults, ...(v || {}) };
  document.querySelectorAll(`[data-${attr}]`).forEach((el) => {
    const k = el.dataset[attr];
    if (el.type === "checkbox") el.checked = !!cur[k]; else el.value = cur[k];
    el.addEventListener("change", async () => {
      const { [storeKey]: cf } = await get(storeKey);
      const merged = { ...defaults, ...(cf || {}) };
      merged[k] = el.type === "checkbox" ? el.checked : Number(el.value);
      await set({ [storeKey]: merged });
    });
  });
}

async function loadKeywords() {
  const { [KEYS.keywords]: kws = [] } = await get(KEYS.keywords);
  document.getElementById("kw").value = kws.join(", ");
  document.getElementById("kw-save").onclick = async () => {
    const list = document.getElementById("kw").value.split(",").map((s) => s.trim()).filter(Boolean);
    await set({ [KEYS.keywords]: list });
  };
}

async function renderTags() {
  const { [KEYS.tags]: tags = {} } = await get(KEYS.tags);
  const ul = document.getElementById("tag-list");
  ul.innerHTML = "";
  Object.entries(tags).forEach(([user, t]) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>u/${user}</strong><span class="badge" style="background:${t.color}">${t.label}</span><span class="spacer"></span><button class="remove">${window.RPT_I18N.t("remove")}</button>`;
    li.querySelector(".remove").onclick = async () => {
      const { [KEYS.tags]: cur = {} } = await get(KEYS.tags);
      delete cur[user]; await set({ [KEYS.tags]: cur }); renderTags();
    };
    ul.appendChild(li);
  });
}
async function loadTags() {
  document.getElementById("tag-save").onclick = async () => {
    const u = document.getElementById("tag-user").value.trim().replace(/^u\//, "");
    const l = document.getElementById("tag-label").value.trim();
    const c = document.getElementById("tag-color").value;
    if (!u || !l) return;
    const { [KEYS.tags]: cur = {} } = await get(KEYS.tags);
    cur[u] = { label: l, color: c };
    await set({ [KEYS.tags]: cur });
    document.getElementById("tag-user").value = "";
    document.getElementById("tag-label").value = "";
    renderTags();
  };
  renderTags();
}

async function initLangTheme() {
  const langSel = document.getElementById("lang-select");
  window.RPT_I18N.LANGS.forEach(([code, label]) => {
    const o = document.createElement("option"); o.value = code; o.textContent = label;
    if (code === window.RPT_I18N.current) o.selected = true;
    langSel.appendChild(o);
  });
  langSel.addEventListener("change", async () => {
    await window.RPT_I18N.set(langSel.value);
    window.RPT_I18N.apply(document); renderTags();
  });
  const themeSel = document.getElementById("theme-select");
  themeSel.value = window.RPT_THEME.current;
  themeSel.addEventListener("change", () => window.RPT_THEME.set(themeSel.value));
}

document.getElementById("reset").onclick = async () => {
  if (!confirm("Erase all Reddit Power Toolkit local data?")) return;
  await new Promise((r) => chrome.storage.local.clear(r));
  location.reload();
};

(async () => {
  await window.RPT_I18N.load();
  await window.RPT_THEME.load();
  window.RPT_I18N.apply(document);
  await initLangTheme();
  await bindGroup("g", KEYS.general, G_DEF);
  await bindGroup("a", KEYS.autorun, A_DEF);
  await bindGroup("f", KEYS.filters, F_DEF);
  await loadKeywords();
  await loadTags();
})();
