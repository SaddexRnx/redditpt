const get = (k) => new Promise((r) => chrome.storage.local.get(k, r));

(async () => {
  const { rpt_analytics: a = {}, rpt_history: h = [] } = await get([
    "rpt_analytics",
    "rpt_history",
  ]);
  document.getElementById("posts").textContent = a.postsViewed || 0;
  document.getElementById("comments").textContent = a.commentsRead || 0;
  const mins = Math.round((a.readingSeconds || 0) / 60);
  document.getElementById("time").textContent =
    mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  const subs = a.subreddits || {};
  document.getElementById("subs").textContent = Object.keys(subs).length;

  const top = Object.entries(subs)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 10);
  const ol = document.getElementById("top-subs");
  ol.innerHTML =
    top.map(([s, n]) => `<li>r/${s} <span class="meta">${n} visits</span></li>`).join("") ||
    "<li>No data yet — browse some subreddits!</li>";

  const ul = document.getElementById("history");
  ul.innerHTML =
    h
      .slice(0, 50)
      .map(
        (e) =>
          `<li><a href="${e.url}" target="_blank" rel="noopener">${
            e.title || e.url
          }</a><span class="meta">${new Date(e.date).toLocaleString()} · ${
            e.commentCount
          } comments</span></li>`
      )
      .join("") || "<li>No visited threads recorded yet.</li>";
})();