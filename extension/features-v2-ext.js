/*
 * Reddit Power Toolkit — v1.9.0 System modules.
 * Adds four operator-focused features on top of features-v2.js:
 *   1. Performance / status panel (which modules are active, last scan ms)
 *   2. Per-subreddit enable/disable overrides
 *   3. Local backup export/import (bookmarks, history, keywords, notes, all rpt_* keys)
 *   4. Lazy-loading wrapper — every V.modules[id].run() records timing and
 *      skips passive init on subreddits where the user disabled the module.
 *
 * Local-first. No network. No AI. No paid APIs.
 */
(function () {
  "use strict";
  if (!window.RPT || !window.RPT.v2) return;
  const RPT = window.RPT;
  const V = RPT.v2;
  const S = V._storage;
  const modal = V._modal;
  const esc = (s) => RPT.utils.escapeHtml(String(s ?? ""));

  const currentSub = () => {
    const m = location.pathname.match(/\/r\/([^\/]+)/i);
    return m ? m[1].toLowerCase() : null;
  };

  const toast = (msg) => {
    const t = document.createElement("div");
    t.className = "rpt-v2-toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  /* =============================================================
   * 1. LAZY-LOADING WRAPPER + telemetry
   * Wrap every module.run so:
   *   - We record last-run timestamp + duration into V._perf
   *   - We skip execution if a per-subreddit override disables it
   * ============================================================= */
  V._perf = { runs: {}, mounted: Date.now() };

  V.perSubKey = "rpt_v2_per_sub";
  V.getPerSub = () => S.get(V.perSubKey, {});
  V.setPerSub = (v) => S.set(V.perSubKey, v);

  V.isEnabledHere = async (id) => {
    const sub = currentSub();
    if (!sub) return true;
    const perSub = await V.getPerSub();
    const rules = perSub[sub];
    if (!rules) return true;
    // rules[id] = false means force off in this sub
    return rules[id] !== false;
  };

  Object.keys(V.modules).forEach((id) => {
    const mod = V.modules[id];
    const orig = mod.run;
    if (typeof orig !== "function" || mod._wrapped) return;
    mod._wrapped = true;
    mod.run = async function (...args) {
      const okHere = await V.isEnabledHere(id);
      if (!okHere) { toast(`"${mod.name}" is disabled in r/${currentSub()}`); return; }
      const t0 = performance.now();
      try {
        // Lazy: only touch DOM/storage the first time this module actually runs.
        const r = await orig.apply(this, args);
        const dt = Math.round(performance.now() - t0);
        V._perf.runs[id] = { at: Date.now(), ms: dt, ok: true };
        return r;
      } catch (e) {
        V._perf.runs[id] = { at: Date.now(), ms: Math.round(performance.now() - t0), ok: false, err: String(e?.message || e) };
        throw e;
      }
    };
  });

  /* =============================================================
   * 2. PERFORMANCE / STATUS PANEL
   * ============================================================= */
  V.modules.perfStatus = {
    id: "perfStatus", name: "Performance & status",
    desc: "Which modules are active, when they last ran, and how long they took.",
    async open() {
      const en = await V.getEnabled();
      const perSub = await V.getPerSub();
      const sub = currentSub();
      const subRules = (sub && perSub[sub]) || {};
      const rows = Object.values(V.modules)
        .filter((m) => m.id !== "perfStatus")
        .map((m) => {
          const p = V._perf.runs[m.id];
          const globalOn = en[m.id] !== false;
          const localOn = subRules[m.id] !== false;
          const active = globalOn && localOn;
          const last = p ? new Date(p.at).toLocaleTimeString() : "—";
          const ms = p ? `${p.ms} ms` : "—";
          const okDot = !p ? "○" : p.ok ? "●" : "✕";
          return `<tr>
            <td>${okDot}</td>
            <td><strong>${esc(m.name)}</strong><br><span class="rpt-muted">${esc(m.desc)}</span></td>
            <td>${active ? "<span class='rpt-badge-on'>on</span>" : "<span class='rpt-badge-off'>off</span>"}</td>
            <td>${last}</td>
            <td>${ms}</td>
          </tr>`;
        }).join("");
      const uptime = Math.round((Date.now() - V._perf.mounted) / 1000);
      const body = `
        <p class="rpt-muted">Uptime on this page: <strong>${uptime}s</strong>${sub ? ` · community: <strong>r/${esc(sub)}</strong>` : ""}</p>
        <div style="max-height:60vh;overflow:auto;border:1px solid var(--border);border-radius:8px">
          <table class="rpt-perf-table" style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr>
              <th></th><th style="text-align:left">Module</th><th>Status</th><th>Last run</th><th>Duration</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p class="rpt-muted" style="margin-top:10px">
          Legend: ● ran successfully, ✕ threw an error, ○ never ran in this tab.
          Use this panel to spot lag: a big number in <em>Duration</em> means that module is heavy.
        </p>`;
      modal("Performance & status", body, { wide: true });
    },
    run() { this.open(); },
  };

  /* =============================================================
   * 3. PER-SUBREDDIT OVERRIDES
   * ============================================================= */
  V.modules.perSubreddit = {
    id: "perSubreddit", name: "Per-subreddit rules",
    desc: "Turn features on/off differently in each community.",
    async open() {
      const sub = currentSub();
      const perSub = await V.getPerSub();
      const subs = Object.keys(perSub).sort();
      const target = sub || subs[0] || "";
      const rules = perSub[target] || {};
      const rowsHTML = Object.values(V.modules)
        .filter((m) => !["perSubreddit","perfStatus","backup"].includes(m.id))
        .map((m) => `<label class="rpt-persub-row">
          <input type="checkbox" data-id="${esc(m.id)}" ${rules[m.id] === false ? "" : "checked"}>
          <span><strong>${esc(m.name)}</strong> — <span class="rpt-muted">${esc(m.desc)}</span></span>
        </label>`).join("");
      const body = `
        <p class="rpt-muted">Rules apply <strong>only inside</strong> the chosen community.
          Uncheck a feature to disable it just there — global settings stay unchanged.</p>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input id="rpt-persub-name" placeholder="subreddit name (no r/)" value="${esc(target)}"
            style="flex:1;padding:8px;background:var(--bg-2);border:1px solid var(--border);border-radius:6px;color:var(--fg)">
          <button class="rpt-v2-primary" id="rpt-persub-save">Save rules</button>
          <button class="rpt-v2-secondary" id="rpt-persub-clear">Clear for sub</button>
        </div>
        ${subs.length ? `<p class="rpt-muted">Existing overrides: ${subs.map((s)=>`<code>r/${esc(s)}</code>`).join(", ")}</p>` : ""}
        <div style="max-height:50vh;overflow:auto;border:1px solid var(--border);border-radius:8px;padding:10px">${rowsHTML}</div>`;
      const m = modal("Per-subreddit rules", body, { wide: true });
      m.querySelector("#rpt-persub-save").onclick = async () => {
        const name = m.querySelector("#rpt-persub-name").value.trim().toLowerCase().replace(/^r\//, "");
        if (!name) return toast("Enter a subreddit name");
        const next = { ...(await V.getPerSub()) };
        const r = { ...(next[name] || {}) };
        m.querySelectorAll("[data-id]").forEach((cb) => { r[cb.dataset.id] = cb.checked; });
        next[name] = r;
        await V.setPerSub(next);
        toast(`Rules saved for r/${name}`); m.remove();
      };
      m.querySelector("#rpt-persub-clear").onclick = async () => {
        const name = m.querySelector("#rpt-persub-name").value.trim().toLowerCase().replace(/^r\//, "");
        const next = { ...(await V.getPerSub()) }; delete next[name];
        await V.setPerSub(next); toast(`Cleared r/${name}`); m.remove();
      };
    },
    run() { this.open(); },
  };

  /* =============================================================
   * 4. LOCAL BACKUP (export / import all local RPT data)
   * ============================================================= */
  V.modules.backup = {
    id: "backup", name: "Backup & restore",
    desc: "Export or import bookmarks, history, keyword tracking, notes and settings.",
    async exportAll() {
      const all = await new Promise((r) => chrome.storage.local.get(null, r));
      const payload = { app: "reddit-power-toolkit", version: "1.9.0", exportedAt: new Date().toISOString(), data: all };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `rpt-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(a.href);
      toast("Backup downloaded");
    },
    async importFile(file, opts = { merge: true }) {
      const text = await file.text();
      let json;
      try { json = JSON.parse(text); } catch { throw new Error("Invalid JSON"); }
      if (!json || json.app !== "reddit-power-toolkit" || !json.data || typeof json.data !== "object") {
        throw new Error("Not a Reddit Power Toolkit backup");
      }
      const current = opts.merge ? await new Promise((r) => chrome.storage.local.get(null, r)) : {};
      const next = { ...current, ...json.data };
      await new Promise((r) => chrome.storage.local.set(next, r));
      toast(`Restored ${Object.keys(json.data).length} keys`);
    },
    async open() {
      const all = await new Promise((r) => chrome.storage.local.get(null, r));
      const keys = Object.keys(all).filter((k) => k.startsWith("rpt")).sort();
      const size = new Blob([JSON.stringify(all)]).size;
      const body = `
        <p class="rpt-muted">Everything is stored inside your browser. Export a JSON snapshot to move it
          to another device, or restore it after reinstalling.</p>
        <div class="rpt-btnrow">
          <button class="rpt-v2-primary" id="rpt-bk-export">Export backup (.json)</button>
          <label class="rpt-v2-secondary" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            Import backup…
            <input type="file" id="rpt-bk-import" accept="application/json" style="display:none">
          </label>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px">
            <input type="checkbox" id="rpt-bk-merge" checked> merge with current data
          </label>
        </div>
        <p class="rpt-muted" style="margin-top:14px">${keys.length} local keys · ${(size/1024).toFixed(1)} KB total</p>
        <details style="margin-top:6px"><summary>Contents</summary>
          <ul style="max-height:30vh;overflow:auto;font-size:12px">${keys.map((k)=>`<li><code>${esc(k)}</code></li>`).join("")}</ul>
        </details>`;
      const m = modal("Backup & restore", body, { wide: false });
      m.querySelector("#rpt-bk-export").onclick = () => this.exportAll();
      m.querySelector("#rpt-bk-import").onchange = async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const merge = m.querySelector("#rpt-bk-merge").checked;
        try { await this.importFile(f, { merge }); m.remove(); }
        catch (err) { toast("Import failed: " + err.message); }
      };
    },
    run() { this.open(); },
  };

  /* =============================================================
   * Register the new modules into the hub
   * ============================================================= */
  try {
    const origHub = V.openHub;
    // Inject a fifth "System" category by monkey-patching openHub once.
    V.openHub = async function () {
      // Rebuild HTML manually to include the new group.
      const enabled = await V.getEnabled();
      const CATS = [
        ["Community", ["communityCompare","subAnalyzer","calendar","subHealth","timeline","trendTracker","subGroups","contentExporter"]],
        ["Thread & comments", ["miniMap","commentExport","userAnalytics","postAnalytics","copyTools","followKeywords"]],
        ["Filtering & feed", ["flairTools","qualityFilter","feedDedup","ageSort","mediaToggle","oldGold","sidebarCleaner"]],
        ["Discovery & knowledge", ["bookmarks","savedManager","research","topicTracker","random","history","achievements","wikiNav","resourceCollector"]],
        ["Utilities", ["searchEnhancer","linksManager","explainLink","exportLibrary","repostDetector","devMode"]],
        ["System (v1.9)", ["perfStatus","perSubreddit","backup"]],
      ];
      const body = `
        <p class="rpt-muted">Local-first tools. Click to launch, or toggle to disable individually.</p>
        <input id="rpt-hub-q" placeholder="Search features…" style="width:100%;padding:10px;margin-bottom:10px;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;color:var(--fg)">
        ${CATS.map(([cat, ids]) => `
          <h3 class="rpt-hub-cat">${esc(cat)}</h3>
          <div class="rpt-hub-grid">
            ${ids.map((id) => {
              const mod = V.modules[id]; if (!mod) return "";
              const on = enabled[id] !== false;
              return `<div class="rpt-hub-card ${on ? "" : "rpt-hub-off"}" data-id="${id}">
                <button class="rpt-hub-run" data-run="${id}">
                  <strong>${esc(mod.name)}</strong>
                  <span>${esc(mod.desc)}</span>
                </button>
                <label class="rpt-hub-toggle" title="Enable/disable">
                  <input type="checkbox" data-tog="${id}" ${on ? "checked" : ""}>
                </label>
              </div>`;
            }).join("")}
          </div>`).join("")}`;
      const m = modal("⚡ Power features", body, { wide: true });
      m.querySelectorAll("[data-run]").forEach((b) => b.onclick = async () => {
        const id = b.dataset.run;
        const en = await V.getEnabled();
        if (en[id] === false) return toast("Feature is disabled — turn it on first");
        try { m.remove(); await V.modules[id].run?.(); }
        catch (e) { console.error(e); toast("Feature error: " + e.message); }
      });
      m.querySelectorAll("[data-tog]").forEach((cb) => cb.onclick = async (e) => {
        e.stopPropagation();
        await S.patch(V.HUB_KEY, {}, (c) => { c[cb.dataset.tog] = cb.checked; return c; });
        cb.closest(".rpt-hub-card").classList.toggle("rpt-hub-off", !cb.checked);
      });
      m.querySelector("#rpt-hub-q").oninput = (e) => {
        const q = e.target.value.toLowerCase();
        m.querySelectorAll(".rpt-hub-card").forEach((c) => {
          c.style.display = c.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      };
    };
    V.open = V.openHub;
  } catch (e) { console.warn("RPT v1.9 hub patch failed", e); }

  /* Add commands to command palette if it exists. */
  try {
    const cmdk = RPT.features?.cmdk;
    if (cmdk && typeof cmdk.commands === "function") {
      const prev = cmdk.commands;
      cmdk.commands = function () {
        return prev.call(this).concat(
          { id: "sys-perf", label: "⚡ Performance & status", run: () => V.modules.perfStatus.run() },
          { id: "sys-persub", label: "⚡ Per-subreddit rules", run: () => V.modules.perSubreddit.run() },
          { id: "sys-backup", label: "⚡ Backup & restore",  run: () => V.modules.backup.run() },
        );
      };
    }
  } catch {}
})();
