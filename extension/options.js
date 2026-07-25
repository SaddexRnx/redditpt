// Settings page — reads/writes chrome.storage.local. No network calls.

const KEYS = {
  filters: "rpt_filters",
  keywords: "rpt_keywords",
  tags: "rpt_user_tags",
  folded: "rpt_folded",
  history: "rpt_history",
  analytics: "rpt_analytics",
};
const DEFAULTS = {
  hideDeleted: false,
  hideEmpty: false,
  hideBots: false,
  hideShort: false,
  minLength: 15,
  hideLowScore: false,
  minScore: 1,
};
const get = (k) => new Promise((r) => chrome.storage.local.get(k, r));
const set = (o) => new Promise((r) => chrome.storage.local.set(o, r));

async function loadFilters() {
  const { [KEYS.filters]: f } = await get(KEYS.filters);
  const cur = { ...DEFAULTS, ...(f || {}) };
  document.querySelectorAll("[data-f]").forEach((el) => {
    const k = el.dataset.f;
    if (el.type === "checkbox") el.checked = !!cur[k];
    else el.value = cur[k];
    el.addEventListener("change", async () => {
      const { [KEYS.filters]: cf } = await get(KEYS.filters);
      const merged = { ...DEFAULTS, ...(cf || {}) };
      merged[k] = el.type === "checkbox" ? el.checked : Number(el.value);
      await set({ [KEYS.filters]: merged });
    });
  });
}

async function loadKeywords() {
  const { [KEYS.keywords]: kws = [] } = await get(KEYS.keywords);
  document.getElementById("kw").value = kws.join(", ");
  document.getElementById("kw-save").onclick = async () => {
    const list = document
      .getElementById("kw")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await set({ [KEYS.keywords]: list });
    alert("Keywords saved.");
  };
}

async function renderTags() {
  const { [KEYS.tags]: tags = {} } = await get(KEYS.tags);
  const ul = document.getElementById("tag-list");
  ul.innerHTML = "";
  Object.entries(tags).forEach(([user, t]) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>u/${user}</strong>
      <span class="badge" style="background:${t.color}">${t.label}</span>
      <span class="spacer"></span>
      <button class="remove">Remove</button>`;
    li.querySelector(".remove").onclick = async () => {
      const { [KEYS.tags]: cur = {} } = await get(KEYS.tags);
      delete cur[user];
      await set({ [KEYS.tags]: cur });
      renderTags();
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

document.getElementById("reset").onclick = async () => {
  if (!confirm("Erase all Reddit Power Toolkit local data?")) return;
  await new Promise((r) => chrome.storage.local.clear(r));
  alert("Local data cleared.");
  location.reload();
};

loadFilters();
loadKeywords();
loadTags();