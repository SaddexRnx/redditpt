const get = (k) => new Promise((r) => chrome.storage.local.get(k, r));
const setKey = (o) => new Promise((r) => chrome.storage.local.set(o, r));
const tr = (k) => window.RPT_I18N?.t(k) || k;
function dl(name, mime, content) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
function csvEsc(v) { return `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`; }
(async () => {
  await window.RPT_I18N.load(); await window.RPT_THEME.load();
  await window.RPT_A11Y?.load();
  window.RPT_I18N.apply(document);

  const { rpt_analytics: a = {}, rpt_history: h = [], rpt_collections: coll = [] } =
    await get(["rpt_analytics", "rpt_history", "rpt_collections"]);
  document.getElementById("posts").textContent = a.postsViewed || 0;
  document.getElementById("comments").textContent = a.commentsRead || 0;
  const mins = Math.round((a.readingSeconds || 0) / 60);
  document.getElementById("time").textContent = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`;
  const subs = a.subreddits || {};
  document.getElementById("subs").textContent = Object.keys(subs).length;

  const top = Object.entries(subs).sort((x, y) => y[1] - x[1]).slice(0, 10);
  document.getElementById("top-subs").innerHTML =
    top.map(([s, n]) => `<li>r/${s} <span class="meta">${n}</span></li>`).join("") || "<li>—</li>";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  document.getElementById("saved").innerHTML =
    coll.slice(0, 50).map((c) =>
      `<li><a href="${esc(c.url)}" target="_blank" rel="noopener">u/${esc(c.author)}</a>
        <span class="meta">${new Date(c.savedAt).toLocaleString()}</span>
        <p>${esc(c.body.slice(0, 220))}${c.body.length > 220 ? "…" : ""}</p></li>`).join("") || "<li>—</li>";

  document.getElementById("history").innerHTML =
    h.slice(0, 50).map((e) =>
      `<li><a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title || e.url)}</a>
        <span class="meta">${new Date(e.date).toLocaleString()} · ${e.commentCount}</span></li>`).join("") || "<li>—</li>";

  document.getElementById("exp-json").onclick = () =>
    dl("rpt-collections.json", "application/json",
       JSON.stringify({ schema: "rpt-collections/1", exportedAt: new Date().toISOString(), items: coll }, null, 2));
  document.getElementById("exp-csv").onclick = () => {
    const head = ["savedAt","author","score","title","url","body"];
    dl("rpt-collections.csv", "text/csv",
       [head.join(","), ...coll.map((x) => head.map((k) => csvEsc(x[k])).join(","))].join("\n"));
  };
  const file = document.getElementById("imp-file");
  document.getElementById("imp-btn").onclick = () => file.click();
  file.addEventListener("change", async () => {
    const f = file.files?.[0]; if (!f) return;
    const text = await f.text();
    let items = [];
    try {
      if (f.name.endsWith(".csv") || /^savedAt,/.test(text)) {
        const [hd, ...body] = text.split(/\r?\n/).filter(Boolean);
        const cols = hd.split(",");
        items = body.map((line) => {
          const cells = []; let cur = "", q = false;
          for (let i = 0; i < line.length; i++) { const ch = line[i];
            if (q) { if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
            else if (ch === '"') q = true; else if (ch === ",") { cells.push(cur); cur = ""; } else cur += ch; }
          cells.push(cur);
          const o = {}; cols.forEach((k, i) => (o[k] = cells[i])); return o;
        });
      } else {
        const parsed = JSON.parse(text);
        items = Array.isArray(parsed) ? parsed : (parsed.items || []);
      }
    } catch { alert(tr("could_not_parse_file")); file.value = ""; return; }
    const seen = new Set(coll.map((x) => x.url + "|" + x.id));
    let added = 0;
    for (const it of items) {
      if (!it?.author || !it?.body) continue;
      const key = (it.url || "") + "|" + (it.id || it.author + "-" + it.savedAt);
      if (seen.has(key)) continue; seen.add(key);
      coll.unshift({
        id: it.id || (it.author + "-" + (it.savedAt || Date.now())),
        author: it.author, body: it.body, score: Number(it.score) || 0,
        url: it.url || "", title: it.title || "", savedAt: it.savedAt || new Date().toISOString(),
      });
      added++;
    }
    await setKey({ rpt_collections: coll.slice(0, 500) });
    alert(`${tr("imported")} ${added} ${tr(added === 1 ? "new_comment" : "new_comments_plural")}.`); location.reload();
  });
})();
