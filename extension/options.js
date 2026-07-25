const KEYS = {
  filters: "rpt_filters", keywords: "rpt_keywords", tags: "rpt_user_tags",
  autorun: "rpt_autorun", general: "rpt_general",
  a11y: "rpt_a11y", rules: "rpt_rules", collections: "rpt_collections",
  shortcuts: "rpt_shortcuts",
};
const F_DEF = { hideDeleted: false, hideEmpty: false, hideBots: false, hideShort: false, minLength: 15, hideLowScore: false, minScore: 1 };
const A_DEF = { cleaner: true, highlighter: true, tags: true, ageWarning: true, quickBar: true, saveButtons: true, liveNew: true };
const G_DEF = { autoOpenPanel: true, showOnboarding: true, showAuthorColors: true };
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

/* -------- Author color legend (deterministic HSL per username) -------- */
function authorColor(name) {
  const s = String(name || "unknown");
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 60%)`;
}
function renderAuthorLegend() {
  const host = document.getElementById("author-color-swatches");
  if (!host) return;
  const sample = ["spez", "AutoModerator", "gallowboob", "shitty_watercolour", "poem_for_your_sprog", "unidan", "you"];
  host.innerHTML = sample.map((u) => {
    const c = authorColor(u);
    return `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:var(--bg-2);border:1px solid var(--border);font-size:12px">
      <span style="width:10px;height:10px;border-radius:999px;background:${c}"></span>
      <span style="color:${c};font-weight:600">u/${u}</span>
    </span>`;
  }).join("");
}

/* -------- Accessibility -------- */
async function initA11y() {
  const { [KEYS.a11y]: cur = {} } = await get(KEYS.a11y);
  const merged = { palette: "default", contrast: "normal", text: "normal", motion: "auto", ...cur };
  const bind = (id, key) => {
    const el = document.getElementById(id);
    el.value = merged[key];
    el.addEventListener("change", async () => {
      const { [KEYS.a11y]: c = {} } = await get(KEYS.a11y);
      const next = { ...merged, ...c, [key]: el.value };
      await set({ [KEYS.a11y]: next });
      window.RPT_A11Y?.set(next);
    });
  };
  bind("a11y-palette", "palette");
  bind("a11y-contrast", "contrast");
  bind("a11y-text", "text");
  bind("a11y-motion", "motion");
}

/* -------- Rules builder -------- */
const RULE_DEF = { enabled: true, type: "keyword", pattern: "", action: "highlight", color: "#f59e0b", label: "" };
function compileRule(rule) {
  try {
    if (rule.type === "regex")   return new RegExp(rule.pattern, "i");
    if (rule.type === "keyword") return new RegExp(rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  } catch { return null; }
  return null;
}
async function renderRules() {
  const { [KEYS.rules]: rules = [] } = await get(KEYS.rules);
  const ul = document.getElementById("rule-list");
  ul.innerHTML = rules.map((r, i) => `
    <li style="display:flex;gap:8px;align-items:center;padding:8px 10px;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;font-size:13px">
      <input type="checkbox" data-i="${i}" data-k="enabled" ${r.enabled ? "checked" : ""} aria-label="Enable rule">
      <span style="min-width:64px;color:var(--muted);text-transform:uppercase;font-size:11px">${r.type}</span>
      <code style="flex:1;color:var(--text)">${r.pattern.replace(/</g, "&lt;")}</code>
      <span style="padding:2px 8px;border-radius:999px;background:${r.action === "hide" ? "var(--red)" : (r.color || "#f59e0b")};color:#fff;font-size:11px">${r.action}</span>
      <button class="remove" data-i="${i}" data-remove="1">Remove</button>
    </li>`).join("") || `<li class="muted" style="list-style:none">No rules yet.</li>`;
  ul.querySelectorAll("[data-k]").forEach((cb) => cb.addEventListener("change", async () => {
    const { [KEYS.rules]: cur = [] } = await get(KEYS.rules);
    cur[Number(cb.dataset.i)][cb.dataset.k] = cb.checked;
    await set({ [KEYS.rules]: cur }); renderRules();
  }));
  ul.querySelectorAll("[data-remove]").forEach((btn) => btn.addEventListener("click", async () => {
    const { [KEYS.rules]: cur = [] } = await get(KEYS.rules);
    cur.splice(Number(btn.dataset.i), 1);
    await set({ [KEYS.rules]: cur }); renderRules();
  }));
}
function updatePreview() {
  const rule = {
    type: document.getElementById("rule-type").value,
    pattern: document.getElementById("rule-pattern").value.trim(),
    action: document.getElementById("rule-action").value,
  };
  const p = document.getElementById("rule-preview");
  if (!rule.pattern) { p.textContent = "Type a pattern to preview matches."; return; }
  if (rule.type === "regex" || rule.type === "keyword") {
    const rx = compileRule(rule);
    if (!rx) { p.style.color = "var(--red)"; p.textContent = "Invalid regex."; return; }
  }
  p.style.color = ""; p.textContent = `Rule ready: ${rule.type} → ${rule.action}. Save to apply on the next Reddit page.`;
}
async function initRules() {
  ["rule-type", "rule-pattern", "rule-action"].forEach((id) =>
    document.getElementById(id).addEventListener("input", updatePreview));
  document.getElementById("rule-add").onclick = async () => {
    const pattern = document.getElementById("rule-pattern").value.trim();
    if (!pattern) return;
    const rule = {
      ...RULE_DEF,
      type: document.getElementById("rule-type").value,
      pattern,
      action: document.getElementById("rule-action").value,
      color: document.getElementById("rule-color").value,
    };
    if ((rule.type === "keyword" || rule.type === "regex") && !compileRule(rule)) { alert("Invalid pattern."); return; }
    const { [KEYS.rules]: cur = [] } = await get(KEYS.rules);
    cur.push(rule); await set({ [KEYS.rules]: cur });
    document.getElementById("rule-pattern").value = "";
    renderRules(); updatePreview();
  };
  renderRules(); updatePreview();
}

/* -------- Collections export / import -------- */
function download(name, mime, content) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
function csvEscape(v) { return `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`; }
async function initCollections() {
  const refreshCount = async () => {
    const { [KEYS.collections]: c = [] } = await get(KEYS.collections);
    document.getElementById("coll-count").textContent = `${c.length} saved`;
  };
  refreshCount();
  document.getElementById("coll-export-json").onclick = async () => {
    const { [KEYS.collections]: c = [] } = await get(KEYS.collections);
    download("rpt-collections.json", "application/json",
      JSON.stringify({ schema: "rpt-collections/1", exportedAt: new Date().toISOString(), items: c }, null, 2));
  };
  document.getElementById("coll-export-csv").onclick = async () => {
    const { [KEYS.collections]: c = [] } = await get(KEYS.collections);
    const header = ["savedAt", "author", "score", "title", "url", "body"];
    const rows = [header.join(","), ...c.map((x) => header.map((k) => csvEscape(x[k])).join(","))];
    download("rpt-collections.csv", "text/csv", rows.join("\n"));
  };
  const file = document.getElementById("coll-import-file");
  document.getElementById("coll-import-btn").onclick = () => file.click();
  file.addEventListener("change", async () => {
    const f = file.files?.[0]; if (!f) return;
    const text = await f.text();
    let items = [];
    try {
      if (f.name.endsWith(".csv") || /^savedAt,/.test(text)) {
        const [head, ...body] = text.split(/\r?\n/).filter(Boolean);
        const cols = head.split(",");
        items = body.map((line) => {
          const cells = []; let cur = "", q = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
            else if (ch === '"') q = true; else if (ch === ",") { cells.push(cur); cur = ""; } else cur += ch;
          }
          cells.push(cur);
          const obj = {}; cols.forEach((k, i) => (obj[k] = cells[i]));
          return obj;
        });
      } else {
        const parsed = JSON.parse(text);
        items = Array.isArray(parsed) ? parsed : (parsed.items || []);
      }
    } catch { alert("Could not parse the file."); file.value = ""; return; }
    const { [KEYS.collections]: cur = [] } = await get(KEYS.collections);
    const seen = new Set(cur.map((x) => x.url + "|" + x.id));
    let added = 0;
    for (const it of items) {
      if (!it?.author || !it?.body) continue;
      const key = (it.url || "") + "|" + (it.id || it.author + "-" + it.savedAt);
      if (seen.has(key)) continue;
      seen.add(key);
      cur.unshift({
        id: it.id || (it.author + "-" + (it.savedAt || Date.now())),
        author: it.author, body: it.body, score: Number(it.score) || 0,
        url: it.url || "", title: it.title || "", savedAt: it.savedAt || new Date().toISOString(),
      });
      added++;
    }
    await set({ [KEYS.collections]: cur.slice(0, 500) });
    alert(`Imported ${added} new comment${added === 1 ? "" : "s"}.`);
    file.value = ""; refreshCount();
  });
}

(async () => {
  await window.RPT_I18N.load();
  await window.RPT_THEME.load();
  await window.RPT_A11Y?.load();
  window.RPT_I18N.apply(document);
  await initLangTheme();
  await bindGroup("g", KEYS.general, G_DEF);
  renderAuthorLegend();
  await bindGroup("a", KEYS.autorun, A_DEF);
  await bindGroup("f", KEYS.filters, F_DEF);
  await loadKeywords();
  await loadTags();
  await initA11y();
  await initRules();
  await initCollections();
  await initShortcuts();
})();

/* -------- Custom keyboard shortcuts (gallery prev/next, collapse all, refresh) -------- */
const SHORTCUT_DEF = { galleryPrev: "ArrowLeft", galleryNext: "ArrowRight", collapseAll: "Shift+C", refresh: "R" };
function shortcutEventToStr(e) {
  if (["Shift","Control","Alt","Meta","OS"].includes(e.key)) return "";
  const parts = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.metaKey) parts.push("Meta");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey && e.key.length > 1) parts.push("Shift");
  let k = e.key;
  if (k === " ") k = "Space";
  if (k.length === 1) k = e.shiftKey ? k.toUpperCase() : k.toLowerCase();
  parts.push(k);
  return parts.join("+");
}
async function initShortcuts() {
  const load = async () => {
    const { [KEYS.shortcuts]: v = {} } = await get(KEYS.shortcuts);
    return { ...SHORTCUT_DEF, ...v };
  };
  const render = async () => {
    const cur = await load();
    document.querySelectorAll(".rpt-shortcut-btn").forEach((b) => {
      b.textContent = cur[b.dataset.s] || "—";
      b.setAttribute("aria-label", `${b.previousElementSibling?.textContent || b.dataset.s}: ${cur[b.dataset.s]}. Click to change.`);
    });
  };
  document.querySelectorAll(".rpt-shortcut-btn").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.classList.contains("capturing")) return;
      const orig = b.textContent;
      b.textContent = "Press a key…"; b.classList.add("capturing");
      const done = () => { b.classList.remove("capturing"); document.removeEventListener("keydown", onKey, true); };
      const onKey = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (["Shift","Control","Alt","Meta","OS"].includes(e.key)) return;
        if (e.key === "Escape") { done(); b.textContent = orig; return; }
        const s = shortcutEventToStr(e);
        if (!s) { done(); b.textContent = orig; return; }
        const cur = await load(); cur[b.dataset.s] = s;
        await set({ [KEYS.shortcuts]: cur });
        done(); render();
      };
      document.addEventListener("keydown", onKey, true);
    });
  });
  document.getElementById("shortcuts-reset").addEventListener("click", async () => {
    await set({ [KEYS.shortcuts]: { ...SHORTCUT_DEF } });
    render();
  });
  /* Export / import so users can back up or move keybindings across browsers. */
  const status = document.getElementById("shortcuts-status");
  const flash = (msg, isErr) => {
    status.textContent = msg;
    status.style.color = isErr ? "var(--red)" : "var(--green)";
    setTimeout(() => { status.textContent = ""; status.style.color = ""; }, 3000);
  };
  document.getElementById("shortcuts-export").addEventListener("click", async () => {
    const cur = await load();
    download(
      "rpt-shortcuts.json",
      "application/json",
      JSON.stringify({ schema: "rpt-shortcuts/1", exportedAt: new Date().toISOString(), shortcuts: cur }, null, 2),
    );
    flash("Exported.");
  });
  const file = document.getElementById("shortcuts-import-file");
  document.getElementById("shortcuts-import-btn").addEventListener("click", () => file.click());
  file.addEventListener("change", async () => {
    const f = file.files?.[0]; if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      const src = parsed?.shortcuts || parsed;
      if (!src || typeof src !== "object") throw new Error("bad shape");
      const next = { ...SHORTCUT_DEF };
      let n = 0;
      for (const k of Object.keys(SHORTCUT_DEF)) {
        if (typeof src[k] === "string" && src[k].length && src[k].length < 40) { next[k] = src[k]; n++; }
      }
      if (!n) throw new Error("no valid entries");
      await set({ [KEYS.shortcuts]: next });
      render();
      flash(`Imported ${n} shortcut${n === 1 ? "" : "s"}.`);
    } catch {
      flash("Could not import — invalid file.", true);
    }
    file.value = "";
  });
  render();
}
