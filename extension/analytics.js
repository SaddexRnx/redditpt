const get = (k) => new Promise((r) => chrome.storage.local.get(k, r));
(async () => {
  await window.RPT_I18N.load(); await window.RPT_THEME.load();
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
})();
