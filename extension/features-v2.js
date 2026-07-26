/*
 * Reddit Power Toolkit — features v2 (36 advanced modules).
 * All modules are local-first, no backend, no AI, no paid APIs.
 * They live under RPT.v2.* and are opened from the "⚡ Power features"
 * hub button on the floating quick-bar. Data persists via chrome.storage.local.
 *
 * Modules are intentionally small and use utilities already provided by
 * content.js (RPT.selectors, RPT.utils, RPT.a11y). Each has a stable
 * `run(opts)` entry point so the hub, popup, or command palette can call it.
 */
(function () {
  "use strict";
  if (!window.RPT) return;
  const RPT = window.RPT;
  const V = (RPT.v2 = { modules: {} });
  const tr = (key) => window.RPT_I18N?.t(key) || key;
  const tx = (value) => window.RPT_I18N?.text(value) || value;

  /* ---------------- shared storage helpers ---------------- */
  const S = {
    get(k, fb) { return new Promise((r) => chrome.storage.local.get({ [k]: fb }, (v) => r(v[k]))); },
    set(k, v) { return new Promise((r) => chrome.storage.local.set({ [k]: v }, r)); },
    async patch(k, fb, updater) {
      const cur = await this.get(k, fb);
      const next = updater({ ...cur });
      await this.set(k, next);
      return next;
    },
  };
  V._storage = S;

  /* ---------------- shared UI helpers ---------------- */
  const esc = (s) => RPT.utils.escapeHtml(s);
  const uid = () => Math.random().toString(36).slice(2, 10);

  function modal(title, bodyHTML, opts = {}) {
    document.querySelectorAll(".rpt-v2-modal").forEach((m) => m.remove());
    const o = document.createElement("div");
    o.className = "rpt-overlay rpt-v2-modal";
    o.setAttribute("role", "dialog");
    o.setAttribute("aria-modal", "true");
    o.setAttribute("aria-label", tx(title));
    o.innerHTML = `
      <div class="rpt-overlay-panel rpt-v2-panel" style="max-width:${opts.wide ? 960 : 720}px">
        <div class="rpt-overlay-head">
          <h2 style="display:flex;align-items:center;gap:10px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span>${esc(tx(title))}</span>
          </h2>
          <button class="rpt-close" aria-label="${tr("close")}">${RPT.ICON.close}</button>
        </div>
        <div class="rpt-v2-body">${bodyHTML}</div>
      </div>`;
    o.querySelector(".rpt-close").onclick = () => o.remove();
    o.addEventListener("click", (e) => { if (e.target === o) o.remove(); });
    document.body.appendChild(o);
    RPT.a11y.trapModal(o);
    return o;
  }
  V._modal = modal;

  function download(name, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  V._download = download;

  function toast(msg) {
    let t = document.querySelector(".rpt-toast");
    if (!t) { t = document.createElement("div"); t.className = "rpt-toast"; document.body.appendChild(t); }
    t.textContent = tx(msg);
    t.classList.add("show");
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 1800);
  }
  V._toast = toast;

  /* Collect posts visible on a listing page (front page / subreddit).
   * Falls back gracefully across Reddit's DOM revisions. */
  function collectPosts() {
    const nodes = document.querySelectorAll(
      'shreddit-post, article[data-testid="post-container"], .thing.link, [data-ks-item]'
    );
    const out = [];
    nodes.forEach((n) => {
      const title = n.getAttribute?.("post-title") ||
        n.querySelector?.('a[slot="full-post-link"], a[data-click-id="body"], a.title')?.textContent?.trim() ||
        n.querySelector?.("h1, h2, h3")?.textContent?.trim() || "";
      const author = n.getAttribute?.("author") ||
        n.querySelector?.('a[href*="/user/"]')?.textContent?.trim() || "";
      const score = parseInt(n.getAttribute?.("score") || n.querySelector?.("[data-testid=\"post-score\"]")?.textContent || "0", 10) || 0;
      const comments = parseInt(n.getAttribute?.("comment-count") || n.querySelector?.('a[data-click-id="comments"]')?.textContent || "0", 10) || 0;
      const permalink = n.getAttribute?.("permalink") ||
        n.querySelector?.('a[slot="full-post-link"], a[data-click-id="body"], a.title')?.getAttribute("href") || "";
      const domain = n.getAttribute?.("domain") ||
        n.querySelector?.('.domain a')?.textContent?.trim() || "";
      const flair = n.querySelector?.('[slot="post-flair"], .linkflairlabel')?.textContent?.trim() || "";
      const type = n.getAttribute?.("post-type") ||
        (n.querySelector?.('img, video') ? (n.querySelector('video') ? "video" : "image") : (domain ? "link" : "text"));
      const created = n.getAttribute?.("created-timestamp") || "";
      const nsfw = n.getAttribute?.("nsfw") === "true" || n.classList?.contains("over18") || !!n.querySelector?.('[data-testid="nsfw-tag"]');
      const spoiler = n.getAttribute?.("spoiler") === "true" || !!n.querySelector?.('[data-testid="spoiler-tag"]');
      out.push({ title, author, score, comments, permalink, domain, flair, type, created, nsfw, spoiler, el: n });
    });
    return out;
  }
  V._collectPosts = collectPosts;

  function currentSubreddit() {
    const m = location.pathname.match(/\/r\/([^/]+)/);
    return m ? m[1] : "";
  }
  V._sub = currentSubreddit;

  /* ============ 1. COMMUNITY COMPARISON TOOL ============ */
  V.modules.communityCompare = {
    id: "communityCompare", name: "Community comparison",
    desc: "Snapshot the current subreddit and compare with saved snapshots.",
    KEY: "rpt_v2_communities",
    snapshot() {
      const sub = currentSubreddit();
      if (!sub) { toast("Open a subreddit to snapshot"); return null; }
      const posts = collectPosts();
      const wordFreq = {};
      posts.forEach((p) => {
        (p.title.toLowerCase().match(/[a-z]{4,}/g) || []).forEach((w) => wordFreq[w] = (wordFreq[w] || 0) + 1);
      });
      const topKeywords = Object.entries(wordFreq).sort((a,b)=>b[1]-a[1]).slice(0, 12).map(([w,c])=>({w,c}));
      const flairs = {}, domains = {}, types = { text: 0, image: 0, video: 0, link: 0 };
      posts.forEach((p) => {
        if (p.flair) flairs[p.flair] = (flairs[p.flair] || 0) + 1;
        if (p.domain) domains[p.domain] = (domains[p.domain] || 0) + 1;
        if (types[p.type] != null) types[p.type]++;
      });
      const authors = {};
      posts.forEach((p) => { if (p.author) authors[p.author] = (authors[p.author] || 0) + 1; });
      const desc = document.querySelector('shreddit-subreddit-header, .titlebox .md')?.innerText?.slice(0, 400) || "";
      const members = document.querySelector('[data-testid="subreddit-subscribers"], .subscribers .number')?.textContent?.trim() || "";
      const created = document.querySelector('shreddit-subreddit-header [name="created"], .titlebox .age time')?.getAttribute?.("datetime") || "";
      const snap = {
        sub, sampledAt: new Date().toISOString(),
        posts: posts.length,
        avgComments: posts.length ? Math.round(posts.reduce((s,p)=>s+p.comments,0)/posts.length) : 0,
        avgScore: posts.length ? Math.round(posts.reduce((s,p)=>s+p.score,0)/posts.length) : 0,
        types, flairs, domains, topKeywords,
        topAuthors: Object.entries(authors).sort((a,b)=>b[1]-a[1]).slice(0,10),
        description: desc, members, created,
      };
      return snap;
    },
    async open() {
      const stored = await S.get(this.KEY, {});
      const snapNow = this.snapshot();
      const list = Object.values(stored);
      const rows = list.map((s) => `
        <tr>
          <td><input type="checkbox" data-cmp="${esc(s.sub)}"></td>
          <td><strong>r/${esc(s.sub)}</strong><div class="rpt-muted" style="font-size:11px">${new Date(s.sampledAt).toLocaleString()}</div></td>
          <td>${s.posts}</td>
          <td>${s.avgScore}</td>
          <td>${s.avgComments}</td>
          <td>${s.types.image}/${s.types.video}/${s.types.link}/${s.types.text}</td>
          <td><button data-del="${esc(s.sub)}" class="rpt-mini">🗑</button></td>
        </tr>`).join("");
      const body = `
        <div class="rpt-v2-section">
          ${snapNow ? `<button class="rpt-v2-primary" data-act="save">📸 Snapshot r/${esc(snapNow.sub)} (${snapNow.posts} posts)</button>`
                    : `<p class="rpt-muted">Open a subreddit page (/r/…) to capture a snapshot.</p>`}
        </div>
        <div class="rpt-v2-section">
          <h3>Saved snapshots</h3>
          ${list.length ? `<table class="rpt-v2-table"><thead><tr><th></th><th>Subreddit</th><th>Posts</th><th>Avg score</th><th>Avg comm.</th><th>img/vid/link/txt</th><th></th></tr></thead><tbody>${rows}</tbody></table>
          <button class="rpt-v2-primary" data-act="compare">Compare selected</button>` : `<p class="rpt-muted">No snapshots yet.</p>`}
        </div>
        <div class="rpt-v2-section" id="rpt-cmp-result"></div>`;
      const m = modal("Community comparison", body, { wide: true });
      m.querySelector('[data-act="save"]')?.addEventListener("click", async () => {
        await S.patch(this.KEY, {}, (cur) => { cur[snapNow.sub] = snapNow; return cur; });
        toast("Snapshot saved"); this.open();
      });
      m.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
        await S.patch(this.KEY, {}, (cur) => { delete cur[b.dataset.del]; return cur; });
        this.open();
      });
      m.querySelector('[data-act="compare"]')?.addEventListener("click", () => {
        const sel = [...m.querySelectorAll('[data-cmp]:checked')].map((c) => stored[c.dataset.cmp]);
        if (sel.length < 2) return toast("Pick at least 2 snapshots");
        m.querySelector("#rpt-cmp-result").innerHTML = this.render(sel);
      });
    },
    render(snaps) {
      const rank = (key, higherWins = true) => {
        const sorted = [...snaps].sort((a, b) => (higherWins ? b[key] - a[key] : a[key] - b[key]));
        return sorted[0].sub;
      };
      return `<h3>Result</h3>
        <div class="rpt-v2-cmp-grid">
          <div><strong>Most posts loaded:</strong> r/${esc(rank("posts"))}</div>
          <div><strong>Highest avg score:</strong> r/${esc(rank("avgScore"))}</div>
          <div><strong>Most discussion:</strong> r/${esc(rank("avgComments"))}</div>
          <div><strong>Most images:</strong> r/${esc([...snaps].sort((a,b)=>b.types.image-a.types.image)[0].sub)}</div>
          <div><strong>Most videos:</strong> r/${esc([...snaps].sort((a,b)=>b.types.video-a.types.video)[0].sub)}</div>
          <div><strong>Most links:</strong> r/${esc([...snaps].sort((a,b)=>b.types.link-a.types.link)[0].sub)}</div>
          <div><strong>Most text-heavy:</strong> r/${esc([...snaps].sort((a,b)=>b.types.text-a.types.text)[0].sub)}</div>
        </div>
        <details style="margin-top:12px"><summary>Raw data (JSON)</summary><pre class="rpt-v2-pre">${esc(JSON.stringify(snaps, null, 2))}</pre></details>`;
    },
    run() { this.open(); },
  };

  /* ============ 2. COMMENT TREE MINI MAP ============ */
  V.modules.miniMap = {
    id: "miniMap", name: "Comment tree mini-map",
    desc: "Visual overview of the full comment tree with click-to-jump.",
    open() {
      const roots = RPT.state.tree || RPT.features.commentTree.parse();
      if (!roots?.length) { toast("Open a Reddit thread first"); return; }
      const branchSize = (n) => 1 + (n.children || []).reduce((s, c) => s + branchSize(c), 0);
      const maxDepth = (n) => 1 + Math.max(0, ...(n.children || []).map(maxDepth));
      const draw = (nodes) => `<ul class="rpt-mm-ul">${nodes.map((n) => {
        const sz = branchSize(n), d = maxDepth(n);
        const big = sz >= 8;
        return `<li>
          <button class="rpt-mm-node ${big ? "rpt-mm-big" : ""}" data-id="${esc(n.id)}" title="${esc(n.author)} · ${sz} in branch · depth ${d}">
            <span class="rpt-mm-dot" style="background:${RPT.utils.authorColor(n.author)}"></span>
            <span class="rpt-mm-au">${esc(n.author)}</span>
            <span class="rpt-mm-sz">${sz}</span>
          </button>
          ${n.children?.length ? draw(n.children) : ""}
        </li>`;
      }).join("")}</ul>`;
      const body = `
        <p class="rpt-muted">Click any node to jump. Larger dots = branches with more replies.</p>
        <div class="rpt-mm-wrap">${draw(roots)}</div>`;
      const m = modal("Comment tree mini-map", body, { wide: true });
      m.querySelectorAll(".rpt-mm-node").forEach((b) => b.onclick = () => {
        const el = document.getElementById(b.dataset.id) || document.querySelector(`[thingid="${b.dataset.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("rpt-flash"); setTimeout(() => el.classList.remove("rpt-flash"), 1400);
          m.remove();
        }
      });
    },
    run() { this.open(); },
  };

  /* ============ 3. COMMENT EXPORT SYSTEM (selective) ============ */
  V.modules.commentExport = {
    id: "commentExport", name: "Selective comment export",
    desc: "Pick individual comments or a branch and export in md/html/json/txt.",
    open() {
      RPT.features.commentTree.parse();
      const roots = RPT.state.tree || [];
      const flat = [];
      const walk = (n, d = 0) => { flat.push({ ...n, depth: d }); (n.children || []).forEach((c) => walk(c, d + 1)); };
      roots.forEach((r) => walk(r));
      const body = `
        <div class="rpt-btnrow">
          <button class="rpt-v2-primary" data-act="all">Select all</button>
          <button class="rpt-v2-primary" data-act="none">Clear</button>
          <span style="flex:1"></span>
          <select id="rpt-ex-fmt"><option>markdown</option><option>html</option><option>json</option><option>plain</option></select>
          <button class="rpt-v2-primary" data-act="export">Export selected</button>
        </div>
        <div class="rpt-ex-list">
          ${flat.map((c) => `<label class="rpt-ex-row" style="padding-left:${c.depth * 14}px">
            <input type="checkbox" data-cid="${esc(c.id)}">
            <span class="rpt-ex-au" style="color:${RPT.utils.authorColor(c.author)}">${esc(c.author)}</span>
            <span class="rpt-ex-sc">▲${c.score || 0}</span>
            <span class="rpt-ex-tx">${esc((c.body || "").slice(0, 120))}</span>
          </label>`).join("")}
        </div>`;
      const m = modal("Selective comment export", body, { wide: true });
      const check = (v) => m.querySelectorAll("[data-cid]").forEach((c) => c.checked = v);
      m.querySelector('[data-act="all"]').onclick = () => check(true);
      m.querySelector('[data-act="none"]').onclick = () => check(false);
      m.querySelector('[data-act="export"]').onclick = () => {
        const ids = new Set([...m.querySelectorAll("[data-cid]:checked")].map((c) => c.dataset.cid));
        const picked = flat.filter((c) => ids.has(c.id));
        if (!picked.length) return toast("Pick at least one comment");
        const fmt = m.querySelector("#rpt-ex-fmt").value;
        const post = RPT.state.post || { title: document.title, url: location.href };
        if (fmt === "json") download(`rpt-comments-${Date.now()}.json`, "application/json",
          JSON.stringify({ post, exportedAt: new Date().toISOString(), comments: picked }, null, 2));
        else if (fmt === "plain") download(`rpt-comments-${Date.now()}.txt`, "text/plain",
          `${post.title || ""}\n${post.url || ""}\n\n` + picked.map((c) => `${" ".repeat(c.depth * 2)}${c.author} (▲${c.score || 0}): ${c.body}`).join("\n\n"));
        else if (fmt === "html") download(`rpt-comments-${Date.now()}.html`, "text/html",
          `<h1>${esc(post.title || "")}</h1><p><a href="${esc(post.url || "")}">${esc(post.url || "")}</a></p>` +
          picked.map((c) => `<blockquote style="margin-left:${c.depth * 20}px"><b>${esc(c.author)}</b> ▲${c.score || 0}<br>${esc(c.body).replace(/\n/g, "<br>")}</blockquote>`).join(""));
        else download(`rpt-comments-${Date.now()}.md`, "text/markdown",
          `# ${post.title || ""}\n${post.url || ""}\n\n` + picked.map((c) => `${"  ".repeat(c.depth)}- **${c.author}** (▲${c.score || 0}): ${c.body.replace(/\n/g, " ")}`).join("\n\n"));
        toast("Exported"); m.remove();
      };
    },
    run() { this.open(); },
  };

  /* ============ 4. ADVANCED BOOKMARK SYSTEM ============ */
  V.modules.bookmarks = {
    id: "bookmarks", name: "Advanced bookmarks",
    desc: "Folders, tags, notes, and search across saved Reddit content.",
    KEY: "rpt_v2_bookmarks",
    async addCurrent(kind = "post") {
      const item = {
        id: uid(), kind, url: location.href, title: document.title,
        folder: "Inbox", tags: [], notes: "", addedAt: Date.now(),
      };
      await S.patch(this.KEY, { items: [] }, (cur) => { cur.items.push(item); return cur; });
      toast("Bookmarked to Inbox");
    },
    async open() {
      const data = await S.get(this.KEY, { items: [] });
      const folders = [...new Set(["Inbox", ...(data.items.map((i) => i.folder))])];
      const body = `
        <div class="rpt-btnrow">
          <button class="rpt-v2-primary" data-act="add">＋ Bookmark this page</button>
          <input id="rpt-bm-q" placeholder="Search title, tag, note…" style="flex:1">
          <select id="rpt-bm-folder"><option value="">All folders</option>${folders.map((f) => `<option>${esc(f)}</option>`).join("")}</select>
          <button class="rpt-v2-primary" data-act="export">Export JSON</button>
        </div>
        <div class="rpt-bm-list"></div>`;
      const m = modal("Advanced bookmarks", body, { wide: true });
      const render = async () => {
        const cur = await S.get(this.KEY, { items: [] });
        const q = m.querySelector("#rpt-bm-q").value.toLowerCase();
        const f = m.querySelector("#rpt-bm-folder").value;
        const filtered = cur.items.filter((i) =>
          (!f || i.folder === f) &&
          (!q || `${i.title} ${i.tags.join(" ")} ${i.notes}`.toLowerCase().includes(q))
        ).sort((a,b)=>b.addedAt-a.addedAt);
        m.querySelector(".rpt-bm-list").innerHTML = filtered.map((i) => `
          <div class="rpt-bm-item" data-id="${i.id}">
            <div><span class="rpt-tag">${esc(i.kind)}</span> <a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.title)}</a></div>
            <div class="rpt-bm-meta">
              <input data-k="folder" value="${esc(i.folder)}" placeholder="Folder">
              <input data-k="tags" value="${esc(i.tags.join(", "))}" placeholder="tags, comma sep">
              <input data-k="notes" value="${esc(i.notes)}" placeholder="Notes">
              <button data-act="del">🗑</button>
            </div>
          </div>`).join("") || `<p class="rpt-muted">No bookmarks match.</p>`;
        m.querySelectorAll(".rpt-bm-item").forEach((row) => {
          row.querySelectorAll("input").forEach((inp) => inp.onchange = async () => {
            await S.patch(this.KEY, { items: [] }, (c) => {
              const it = c.items.find((x) => x.id === row.dataset.id);
              if (!it) return c;
              if (inp.dataset.k === "tags") it.tags = inp.value.split(",").map((s) => s.trim()).filter(Boolean);
              else it[inp.dataset.k] = inp.value;
              return c;
            });
          });
          row.querySelector('[data-act="del"]').onclick = async () => {
            await S.patch(this.KEY, { items: [] }, (c) => { c.items = c.items.filter((x) => x.id !== row.dataset.id); return c; });
            render();
          };
        });
      };
      m.querySelector('[data-act="add"]').onclick = async () => { await this.addCurrent(); render(); };
      m.querySelector('[data-act="export"]').onclick = async () => {
        const cur = await S.get(this.KEY, { items: [] });
        download(`rpt-bookmarks-${Date.now()}.json`, "application/json", JSON.stringify(cur, null, 2));
      };
      m.querySelector("#rpt-bm-q").oninput = render;
      m.querySelector("#rpt-bm-folder").onchange = render;
      render();
    },
    run() { this.open(); },
  };

  /* ============ 5. USER ANALYTICS (hover card) ============ */
  V.modules.userAnalytics = {
    id: "userAnalytics", name: "User analytics on hover",
    desc: "Hover a username to see thread stats + personal notes / tags.",
    KEY: "rpt_v2_user_notes",
    _card: null, _hideTimer: null,
    async _show(x, y, author) {
      RPT.features.commentTree.parse();
      const flat = [];
      (RPT.state.tree || []).forEach(function w(n){ flat.push(n); (n.children||[]).forEach(w); });
      const mine = flat.filter((c) => c.author === author);
      const replies = flat.filter((c) => mine.some((mc) => (mc.children || []).some((ch) => ch.id === c.id)));
      const avgLen = mine.length ? Math.round(mine.reduce((s,c)=>s+(c.body||"").length,0)/mine.length) : 0;
      const notes = (await S.get(this.KEY, {}))[author] || { note: "", tag: "" };
      if (!this._card) {
        this._card = document.createElement("div");
        this._card.className = "rpt-v2-usercard";
        this._card.addEventListener("mouseenter", () => clearTimeout(this._hideTimer));
        this._card.addEventListener("mouseleave", () => this._hide());
        document.body.appendChild(this._card);
      }
      this._card.innerHTML = `
        <div class="rpt-uc-head">
          <span class="rpt-uc-dot" style="background:${RPT.utils.authorColor(author)}"></span>
          <strong>u/${esc(author)}</strong>
          ${notes.tag ? `<span class="rpt-tag">${esc(notes.tag)}</span>` : ""}
        </div>
        <div class="rpt-uc-grid">
          <div><small>Comments here</small><strong>${mine.length}</strong></div>
          <div><small>Replies received</small><strong>${replies.length}</strong></div>
          <div><small>Avg length</small><strong>${avgLen}c</strong></div>
        </div>
        <textarea class="rpt-uc-note" placeholder="Private note (local only)">${esc(notes.note)}</textarea>
        <input class="rpt-uc-tag" placeholder="Tag (e.g. helpful, expert)" value="${esc(notes.tag)}">
        <button class="rpt-uc-save rpt-v2-primary">Save note</button>`;
      this._card.style.left = Math.min(window.innerWidth - 300, x + 12) + "px";
      this._card.style.top = Math.min(window.innerHeight - 260, y + 12) + "px";
      this._card.style.display = "block";
      this._card.querySelector(".rpt-uc-save").onclick = async () => {
        const note = this._card.querySelector(".rpt-uc-note").value;
        const tag = this._card.querySelector(".rpt-uc-tag").value;
        await S.patch(this.KEY, {}, (c) => { c[author] = { note, tag }; return c; });
        toast("Note saved");
      };
    },
    _hide() { this._hideTimer = setTimeout(() => { if (this._card) this._card.style.display = "none"; }, 260); },
    enabled: false,
    enable() {
      if (this.enabled) return; this.enabled = true;
      document.addEventListener("mouseover", (e) => {
        const a = e.target.closest?.('a[href*="/user/"], a[href*="/u/"], [data-testid="comment_author_link"]');
        if (!a) return;
        const author = (a.getAttribute("href") || "").split("/user/")[1]?.split("/")[0] || a.textContent.trim();
        if (!author) return;
        clearTimeout(this._hideTimer);
        const r = a.getBoundingClientRect();
        this._show(r.right, r.bottom, author);
      }, true);
      document.addEventListener("mouseout", (e) => {
        if (this._card && !e.relatedTarget?.closest?.(".rpt-v2-usercard") && !e.target.closest?.(".rpt-v2-usercard")) this._hide();
      }, true);
    },
    run() { this.enable(); toast("Hover any username to see analytics"); },
  };

  /* ============ 6. POST ANALYTICS ============ */
  V.modules.postAnalytics = {
    id: "postAnalytics", name: "Post analytics on hover",
    desc: "Rich hover card for posts on listing pages.",
    _card: null,
    enabled: false,
    enable() {
      if (this.enabled) return; this.enabled = true;
      document.addEventListener("mouseover", (e) => {
        const node = e.target.closest?.('shreddit-post, article[data-testid="post-container"], .thing.link');
        if (!node) return;
        const posts = collectPosts();
        const p = posts.find((x) => x.el === node);
        if (!p) return;
        if (!this._card) { this._card = document.createElement("div"); this._card.className = "rpt-v2-postcard"; document.body.appendChild(this._card); }
        const ratio = p.comments ? Math.round((p.comments / Math.max(1, p.score)) * 100) : 0;
        this._card.innerHTML = `
          <div class="rpt-uc-head"><strong>${esc(p.title.slice(0, 80))}</strong></div>
          <div class="rpt-uc-grid">
            <div><small>Score</small><strong>▲${p.score}</strong></div>
            <div><small>Comments</small><strong>${p.comments}</strong></div>
            <div><small>Engage</small><strong>${ratio}%</strong></div>
            <div><small>Type</small><strong>${esc(p.type)}</strong></div>
            <div><small>Domain</small><strong>${esc(p.domain || "self")}</strong></div>
            <div><small>Flair</small><strong>${esc(p.flair || "—")}</strong></div>
          </div>`;
        const r = node.getBoundingClientRect();
        this._card.style.left = Math.min(window.innerWidth - 320, r.right + 8) + "px";
        this._card.style.top = Math.max(8, r.top) + "px";
        this._card.style.display = "block";
      }, true);
      document.addEventListener("mouseleave", () => { if (this._card) this._card.style.display = "none"; }, true);
    },
    run() { this.enable(); toast("Hover any post to see analytics"); },
  };

  /* ============ 7. SUBREDDIT ANALYZER DASHBOARD ============ */
  V.modules.subAnalyzer = {
    id: "subAnalyzer", name: "Subreddit analyzer dashboard",
    desc: "Full breakdown of the current subreddit from loaded data.",
    /* Pull as many rich signals as we can from the DOM without any network calls. */
    _harvest(sub) {
      const posts = collectPosts();
      const snap = V.modules.communityCompare.snapshot() || {};
      /* Sidebar / header metadata — try both old & new Reddit layouts. */
      const q = (sel) => document.querySelector(sel);
      const header = q("shreddit-subreddit-header");
      const membersRaw =
        header?.getAttribute?.("subscribers") ||
        q('faceplate-number[pretty]')?.getAttribute?.("number") ||
        q('[data-testid="subreddit-subscribers"]')?.textContent ||
        q('.subscribers .number')?.textContent || snap.members || "";
      const onlineRaw =
        header?.getAttribute?.("active") ||
        q('[id^="IdCard--ActiveMembers"]')?.textContent ||
        q('.users-online .number')?.textContent || "";
      const createdRaw =
        header?.getAttribute?.("created-timestamp") ||
        q('shreddit-subreddit-header [name="created"]')?.getAttribute?.("datetime") ||
        q('faceplate-date-format[format="MMM DD, YYYY"]')?.getAttribute?.("datetime") ||
        q('.titlebox .age time')?.getAttribute?.("datetime") || snap.created || "";
      const isNsfw =
        header?.getAttribute?.("is-nsfw") === "true" ||
        !!q('shreddit-subreddit-header [data-testid="subreddit-nsfw"]');
      const isPrivate =
        header?.getAttribute?.("subreddit-type") === "private" ||
        !!q('[data-testid="subreddit-private"]');
      const description =
        header?.getAttribute?.("description") ||
        q('shreddit-subreddit-header [slot="description"]')?.textContent?.trim() ||
        q('.titlebox .md')?.innerText?.trim() || snap.description || "";
      const mods = Array.from(document.querySelectorAll('[data-testid="moderator-list"] a, .titlebox .list-item a[href*="/user/"]'))
        .map((a) => a.textContent.trim().replace(/^u\//, ""))
        .filter(Boolean).slice(0, 12);
      const rulesCount = document.querySelectorAll(
        'shreddit-rule, [data-testid="subreddit-rule"], .side .titlebox ol li'
      ).length;

      /* Post-derived stats. */
      const scores = posts.map(p=>p.score).sort((a,b)=>a-b);
      const median = scores.length ? scores[Math.floor(scores.length/2)] : 0;
      const max = scores.length ? scores[scores.length-1] : 0;
      const nsfwCount = posts.filter(p=>p.nsfw).length;
      const spoilerCount = posts.filter(p=>p.spoiler).length;
      const authorCount = {};
      posts.forEach(p=>{ if(p.author && p.author!=="[deleted]") authorCount[p.author]=(authorCount[p.author]||0)+1; });
      const topAuthors = Object.entries(authorCount).sort((a,b)=>b[1]-a[1]).slice(0,10);

      /* Hour-of-day histogram from created timestamps (local time). */
      const hours = new Array(24).fill(0);
      let dated = 0;
      posts.forEach(p=>{
        if(!p.created) return;
        const d = new Date(p.created);
        if(!isNaN(d)) { hours[d.getHours()]++; dated++; }
      });
      const peakHour = dated ? hours.indexOf(Math.max(...hours)) : -1;

      const topByScore = [...posts].sort((a,b)=>b.score-a.score).slice(0,5);
      const topByComments = [...posts].sort((a,b)=>b.comments-a.comments).slice(0,5);

      return {
        sub, snap, posts,
        members: membersRaw ? String(membersRaw).trim() : "",
        online: onlineRaw ? String(onlineRaw).trim() : "",
        created: createdRaw,
        isNsfw, isPrivate, description, mods, rulesCount,
        median, max, nsfwCount, spoilerCount,
        topAuthors, hours, peakHour, dated,
        topByScore, topByComments,
      };
    },
    open() {
      const sub = currentSubreddit();
      if (!sub) return toast(tr("open_subreddit_page") || "Open a subreddit page");
      const h = this._harvest(sub);
      const snap = h.snap;
      const totalPosts = h.posts.length || snap.posts || 0;
      const fmtDate = (v) => {
        if(!v) return "—";
        const d = new Date(v);
        if(isNaN(d)) return esc(v);
        try { return d.toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" }); }
        catch { return d.toISOString().slice(0,10); }
      };
      const stat = (k, v) => `<div class="rpt-card"><div class="rpt-k">${esc(tx(k))}</div><div class="rpt-v">${v}</div></div>`;
      const chip = (label, count) => `<span class="rpt-stat-chip">${esc(label)}<em>${count}</em></span>`;

      const flairs = Object.entries(snap.flairs||{}).sort((a,b)=>b[1]-a[1]);
      const domains = Object.entries(snap.domains||{}).sort((a,b)=>b[1]-a[1]).slice(0,12);
      const kw = snap.topKeywords || [];

      /* Content-type bars. */
      const types = snap.types || { text:0,image:0,video:0,link:0 };
      const typesRow = Object.entries(types).map(([k,v])=>{
        const pct = totalPosts ? Math.round((v/totalPosts)*100) : 0;
        return `<div class="rpt-bar-row"><span>${esc(tx(k))}</span>
          <div class="rpt-bar"><i style="width:${pct}%"></i></div><b>${v} · ${pct}%</b></div>`;
      }).join("");

      /* Hour histogram bars. */
      const maxH = Math.max(1, ...h.hours);
      const hoursRow = h.dated
        ? `<div class="rpt-hours">${h.hours.map((c,i)=>{
            const pct = Math.round((c/maxH)*100);
            return `<div class="rpt-hour" title="${i}:00 — ${c} ${tr("posts") || "posts"}"><i style="height:${pct}%"></i><span>${i}</span></div>`;
          }).join("")}</div>
          <p class="rpt-muted" style="margin:6px 0 0">${tr("peak_hour") || "Peak hour"}: <strong>${h.peakHour}:00</strong> · ${h.dated}/${totalPosts} ${tr("with_dates") || "with dates"}</p>`
        : `<p class="rpt-muted">${tr("no_dated_posts") || "No dated posts on this page."}</p>`;

      const linkList = (arr, valFn, label) => arr.length ? `<ul class="rpt-linklist">${arr.map(p=>`
        <li><a href="${esc(p.permalink||"#")}" target="_blank" rel="noopener">${esc(p.title||"(untitled)")}</a>
          <span class="rpt-muted"> · ${valFn(p)} ${esc(tx(label))} · u/${esc(p.author||"?")}</span></li>`).join("")}</ul>`
        : `<p class="rpt-muted">${tr("none") || "None"}</p>`;

      const badges = [
        h.isNsfw ? `<span class="rpt-badge-off">NSFW 18+</span>` : "",
        h.isPrivate ? `<span class="rpt-badge-off">${tr("private") || "Private"}</span>` : "",
      ].filter(Boolean).join(" ");

      const body = `
        <div class="rpt-sub-head">
          <div>
            <h3 style="margin:0 0 4px">r/${esc(sub)} ${badges}</h3>
            <p class="rpt-muted" style="margin:0">${esc(h.description).slice(0,320) || esc(tr("no_description") || "No description available.")}</p>
          </div>
        </div>

        <h4 class="rpt-section-title">${esc(tr("overview") || "Overview")}</h4>
        <div class="rpt-metric-grid">
          ${stat("Members", esc(h.members || "—"))}
          ${stat("Online now", esc(h.online || "—"))}
          ${stat("Created", fmtDate(h.created))}
          ${stat("Rules", h.rulesCount || "—")}
          ${stat("Posts loaded", totalPosts)}
          ${stat("Avg score", snap.avgScore ?? 0)}
          ${stat("Median score", h.median)}
          ${stat("Top score", h.max)}
          ${stat("Avg comments", snap.avgComments ?? 0)}
          ${stat("NSFW posts", h.nsfwCount)}
          ${stat("Spoilers", h.spoilerCount)}
          ${stat("Unique authors", Object.keys(h.topAuthors.reduce((a,[k])=>((a[k]=1),a),{})).length || h.topAuthors.length)}
        </div>

        <h4 class="rpt-section-title">${esc(tr("content_types") || "Content types")}</h4>
        <div class="rpt-bars">${typesRow}</div>

        <h4 class="rpt-section-title">${esc(tr("posting_activity") || "Posting activity by hour")}</h4>
        ${hoursRow}

        <h4 class="rpt-section-title">${esc(tr("top_authors") || "Top authors on this page")}</h4>
        <div class="rpt-chips-v">${h.topAuthors.length
          ? h.topAuthors.map(([a,c]) => chip(`u/${a}`, c)).join("")
          : `<p class="rpt-muted">${tr("none") || "None"}</p>`}</div>

        <h4 class="rpt-section-title">${esc(tr("top_flairs") || "Top flairs")}</h4>
        <div class="rpt-chips-v">${flairs.length
          ? flairs.slice(0,10).map(([f,c])=>chip(f,c)).join("")
          : `<p class="rpt-muted">${tr("none") || "None"}</p>`}</div>

        <h4 class="rpt-section-title">${esc(tr("top_domains") || "Top domains")}</h4>
        <div class="rpt-chips-v">${domains.length
          ? domains.map(([d,c])=>chip(d,c)).join("")
          : `<p class="rpt-muted">${tr("none") || "None"}</p>`}</div>

        <h4 class="rpt-section-title">${esc(tr("popular_keywords") || "Popular keywords")}</h4>
        <div class="rpt-chips-v">${kw.length
          ? kw.map(k=>chip(k.w, k.c)).join("")
          : `<p class="rpt-muted">${tr("none") || "None"}</p>`}</div>

        <h4 class="rpt-section-title">${esc(tr("highest_scored_posts") || "Highest-scored posts")}</h4>
        ${linkList(h.topByScore, p=>p.score, "score")}

        <h4 class="rpt-section-title">${esc(tr("most_commented_posts") || "Most-commented posts")}</h4>
        ${linkList(h.topByComments, p=>p.comments, "comments")}

        ${h.mods.length ? `
          <h4 class="rpt-section-title">${esc(tr("moderators") || "Moderators")}</h4>
          <div class="rpt-chips-v">${h.mods.map(m=>chip(`u/${m}`,"")).join("")}</div>` : ""}

        <p class="rpt-muted" style="margin-top:14px;font-size:11px">
          ${esc(tr("local_snapshot_note") || "Snapshot computed from posts currently loaded in your feed. Scroll the subreddit before opening this dashboard for a bigger sample.")}
        </p>`;
      modal(`${tx("Subreddit analyzer dashboard")} — r/${sub}`, body, { wide: true });
    },
    run() { this.open(); },
  };

  /* ============ 8. FLAIR TOOLS ============ */
  V.modules.flairTools = {
    id: "flairTools", name: "Flair tools",
    desc: "Filter, count, favorite or hide flairs on the current subreddit.",
    KEY: "rpt_v2_flairs",
    async open() {
      const posts = collectPosts();
      const counts = {}; posts.forEach((p) => { if (p.flair) counts[p.flair] = (counts[p.flair] || 0) + 1; });
      const prefs = await S.get(this.KEY, { fav: {}, hide: {} });
      const rows = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([f, c]) => `
        <tr><td>${esc(f)}</td><td>${c}</td>
          <td><label><input type="checkbox" data-fav="${esc(f)}" ${prefs.fav[f]?"checked":""}> ★</label></td>
          <td><label><input type="checkbox" data-hide="${esc(f)}" ${prefs.hide[f]?"checked":""}> Hide</label></td>
          <td><button class="rpt-mini" data-only="${esc(f)}">Only this</button></td>
        </tr>`).join("");
      const body = rows ? `<table class="rpt-v2-table"><thead><tr><th>Flair</th><th>#</th><th>Fav</th><th>Hide</th><th></th></tr></thead><tbody>${rows}</tbody></table>` :
        `<p class="rpt-muted">No flairs detected on loaded posts.</p>`;
      const m = modal("Flair tools", body);
      m.querySelectorAll("[data-fav],[data-hide]").forEach((cb) => cb.onchange = async () => {
        await S.patch(this.KEY, { fav: {}, hide: {} }, (c) => {
          if (cb.dataset.fav) c.fav[cb.dataset.fav] = cb.checked;
          if (cb.dataset.hide) c.hide[cb.dataset.hide] = cb.checked;
          return c;
        });
        this.apply();
      });
      m.querySelectorAll("[data-only]").forEach((b) => b.onclick = () => {
        const f = b.dataset.only;
        collectPosts().forEach((p) => { p.el.style.display = p.flair === f ? "" : "none"; });
        toast(`Showing only: ${f}`); m.remove();
      });
    },
    async apply() {
      const prefs = await S.get(this.KEY, { fav: {}, hide: {} });
      collectPosts().forEach((p) => {
        if (p.flair && prefs.hide[p.flair]) p.el.style.display = "none";
        else if (p.el.style.display === "none") p.el.style.display = "";
      });
    },
    run() { this.open(); },
  };

  /* ============ 9. ACTIVITY CALENDAR ============ */
  V.modules.calendar = {
    id: "calendar", name: "Subreddit activity calendar",
    desc: "Heatmap of loaded posts by day-of-week and hour.",
    open() {
      const posts = collectPosts();
      const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
      posts.forEach((p) => {
        if (!p.created) return;
        const d = new Date(p.created);
        if (isNaN(d)) return;
        grid[d.getDay()][d.getHours()]++;
      });
      const max = Math.max(1, ...grid.flat());
      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      const body = `<p class="rpt-muted">Darker = more posts. From ${posts.length} loaded posts.</p>
        <table class="rpt-v2-cal"><thead><tr><th></th>${Array.from({length:24}, (_,h)=>`<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${days.map((d,di)=>`<tr><th>${d}</th>${grid[di].map((v)=>`<td style="background:rgba(255,69,0,${v/max})" title="${v} posts">${v||""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      modal("Activity calendar", body, { wide: true });
    },
    run() { this.open(); },
  };

  /* ============ 10. TOPIC TRACKER ============ */
  V.modules.topicTracker = {
    id: "topicTracker", name: "Topic tracker",
    desc: "Follow keywords; count mentions across visited pages.",
    KEY: "rpt_v2_topics",
    async open() {
      const cur = await S.get(this.KEY, { topics: [] });
      const body = `
        <div class="rpt-btnrow">
          <input id="rpt-tt-new" placeholder="Add keyword (e.g. linux)" style="flex:1">
          <button class="rpt-v2-primary" data-act="add">Add</button>
          <button class="rpt-v2-primary" data-act="scan">Scan this page</button>
        </div>
        <div id="rpt-tt-list"></div>`;
      const m = modal("Topic tracker", body);
      const render = async () => {
        const c = await S.get(this.KEY, { topics: [] });
        m.querySelector("#rpt-tt-list").innerHTML = c.topics.length ? c.topics.map((t) => `
          <div class="rpt-tt-row" data-t="${esc(t.name)}">
            <strong>${esc(t.name)}</strong>
            <span class="rpt-muted">${t.mentions} mentions · ${t.pages} pages</span>
            <button class="rpt-mini" data-act="del">🗑</button>
          </div>`).join("") : `<p class="rpt-muted">No topics tracked.</p>`;
        m.querySelectorAll('[data-act="del"]').forEach((b) => b.onclick = async () => {
          const t = b.closest("[data-t]").dataset.t;
          await S.patch(this.KEY, { topics: [] }, (x) => { x.topics = x.topics.filter((y) => y.name !== t); return x; });
          render();
        });
      };
      m.querySelector('[data-act="add"]').onclick = async () => {
        const v = m.querySelector("#rpt-tt-new").value.trim().toLowerCase();
        if (!v) return;
        await S.patch(this.KEY, { topics: [] }, (c) => { if (!c.topics.find((t)=>t.name===v)) c.topics.push({ name: v, mentions: 0, pages: 0 }); return c; });
        render();
      };
      m.querySelector('[data-act="scan"]').onclick = async () => {
        const text = document.body.innerText.toLowerCase();
        await S.patch(this.KEY, { topics: [] }, (c) => {
          c.topics.forEach((t) => {
            const n = (text.match(new RegExp(`\\b${t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g")) || []).length;
            if (n) { t.mentions += n; t.pages += 1; }
          });
          return c;
        });
        toast("Scanned"); render();
      };
      render();
    },
    run() { this.open(); },
  };

  /* ============ 11. REPOST DETECTOR ============ */
  V.modules.repostDetector = {
    id: "repostDetector", name: "Repost detector",
    desc: "Find posts with same URL or very similar titles on this page.",
    open() {
      const posts = collectPosts();
      const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
      const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); const I = [...A].filter((x) => B.has(x)).length; const U = new Set([...A, ...B]).size; return U ? I / U : 0; };
      const dupes = [];
      for (let i = 0; i < posts.length; i++) for (let j = i + 1; j < posts.length; j++) {
        const p = posts[i], q = posts[j];
        const urlDup = p.permalink && p.permalink === q.permalink;
        const sim = jaccard(norm(p.title), norm(q.title));
        if (urlDup || sim >= 0.6) dupes.push({ p, q, sim: urlDup ? 1 : sim });
      }
      const body = dupes.length ? dupes.map(({p,q,sim})=>`
        <div class="rpt-v2-dup">
          <div><span class="rpt-tag">${Math.round(sim*100)}% match</span></div>
          <div><a href="${esc(p.permalink)}" target="_blank" rel="noopener">${esc(p.title)}</a> — ▲${p.score} · ${p.comments}c</div>
          <div><a href="${esc(q.permalink)}" target="_blank" rel="noopener">${esc(q.title)}</a> — ▲${q.score} · ${q.comments}c</div>
        </div>`).join("") : `<p class="rpt-muted">No possible reposts detected among loaded posts.</p>`;
      modal("Repost detector", body, { wide: true });
    },
    run() { this.open(); },
  };

  /* ============ 12. SIDEBAR CLEANER ============ */
  V.modules.sidebarCleaner = {
    id: "sidebarCleaner", name: "Subreddit sidebar cleaner",
    desc: "Hide or collapse noisy sidebar sections; saved per subreddit.",
    KEY: "rpt_v2_sidebar",
    async open() {
      const sub = currentSubreddit(); if (!sub) return toast("Open a subreddit page");
      const sections = document.querySelectorAll('aside .side, aside > *, [data-testid="right-rail"] > *');
      const prefs = (await S.get(this.KEY, {}))[sub] || { hide: {} };
      const body = sections.length ? [...sections].map((s, i) => {
        const label = (s.textContent || "").slice(0, 60).trim() || `Section ${i+1}`;
        return `<label><input type="checkbox" data-sec="${i}" ${prefs.hide[i]?"checked":""}> Hide: ${esc(label)}…</label>`;
      }).join("") : `<p class="rpt-muted">No sidebar detected.</p>`;
      const m = modal(`Sidebar cleaner — r/${sub}`, body);
      m.querySelectorAll("[data-sec]").forEach((cb) => cb.onchange = async () => {
        prefs.hide[cb.dataset.sec] = cb.checked;
        await S.patch(this.KEY, {}, (c) => { c[sub] = prefs; return c; });
        this.apply();
      });
      this.apply();
    },
    async apply() {
      const sub = currentSubreddit(); if (!sub) return;
      const prefs = (await S.get(this.KEY, {}))[sub] || { hide: {} };
      const sections = document.querySelectorAll('aside .side, aside > *, [data-testid="right-rail"] > *');
      sections.forEach((s, i) => { s.style.display = prefs.hide[i] ? "none" : ""; });
    },
    run() { this.open(); },
  };

  /* ============ 13. WIKI NAVIGATOR ============ */
  V.modules.wikiNav = {
    id: "wikiNav", name: "Wiki navigator",
    desc: "Table of contents + search for wiki pages.",
    open() {
      if (!/\/wiki\//.test(location.pathname)) return toast("Open a wiki page");
      const heads = document.querySelectorAll(".wiki-page-content h1, .wiki-page-content h2, .wiki-page-content h3, main h1, main h2, main h3");
      const body = `
        <input id="rpt-wk-q" placeholder="Search headings…" style="width:100%;padding:8px">
        <ul class="rpt-wk-toc">${[...heads].map((h) => `<li data-lvl="${h.tagName[1]}"><a href="#${esc(h.id || "")}" data-jump="${[...heads].indexOf(h)}">${esc(h.textContent.trim())}</a></li>`).join("")}</ul>
        <button class="rpt-v2-primary" data-act="export">Export wiki page as Markdown</button>`;
      const m = modal("Wiki navigator", body, { wide: true });
      m.querySelector("#rpt-wk-q").oninput = (e) => {
        const q = e.target.value.toLowerCase();
        m.querySelectorAll(".rpt-wk-toc li").forEach((li) => li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none");
      };
      m.querySelectorAll("[data-jump]").forEach((a) => a.onclick = (e) => {
        e.preventDefault(); heads[+a.dataset.jump].scrollIntoView({ behavior: "smooth", block: "start" }); m.remove();
      });
      m.querySelector('[data-act="export"]').onclick = () => {
        const md = [...heads].map((h) => `${"#".repeat(+h.tagName[1])} ${h.textContent.trim()}`).join("\n");
        download(`wiki-${Date.now()}.md`, "text/markdown", md);
      };
    },
    run() { this.open(); },
  };

  /* ============ 14. RESOURCE COLLECTOR ============ */
  V.modules.resourceCollector = {
    id: "resourceCollector", name: "Resource collector",
    desc: "Gather links from post/comments and categorize them.",
    open() {
      const links = [...document.querySelectorAll("main a[href^='http']")].map((a) => ({ href: a.href, text: a.textContent.trim().slice(0, 80) }));
      const cat = (h) => {
        if (/github\.com/.test(h)) return "GitHub";
        if (/(youtube|youtu\.be|vimeo)/.test(h)) return "Videos";
        if (/(docs?\.|documentation)/.test(h)) return "Documentation";
        if (/(tutorial|guide|howto)/.test(h)) return "Tutorials";
        return "Websites";
      };
      const grouped = {};
      links.forEach((l) => { const c = cat(l.href); (grouped[c] = grouped[c] || []).push(l); });
      const body = Object.entries(grouped).map(([g, ls]) => `
        <h4>${esc(g)} (${ls.length})</h4>
        <ul class="rpt-v2-linklist">${ls.map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.text || l.href)}</a></li>`).join("")}</ul>`).join("") ||
        `<p class="rpt-muted">No external links found.</p>`;
      const m = modal("Resource collector", `${body}<button class="rpt-v2-primary" data-act="export">Export as Markdown</button>`, { wide: true });
      m.querySelector('[data-act="export"]').onclick = () => {
        const md = Object.entries(grouped).map(([g, ls]) => `## ${g}\n` + ls.map((l) => `- [${l.text || l.href}](${l.href})`).join("\n")).join("\n\n");
        download(`resources-${Date.now()}.md`, "text/markdown", md);
      };
    },
    run() { this.open(); },
  };

  /* ============ 15. SUBREDDIT BOOKMARK GROUPS ============ */
  V.modules.subGroups = {
    id: "subGroups", name: "Subreddit groups",
    desc: "Group your favorite subreddits into named collections.",
    KEY: "rpt_v2_subgroups",
    async open() {
      const data = await S.get(this.KEY, { groups: [] });
      const body = `
        <div class="rpt-btnrow">
          <input id="rpt-sg-name" placeholder="Group name" style="flex:1">
          <button class="rpt-v2-primary" data-act="new">Create group</button>
          <button class="rpt-v2-primary" data-act="export">Export JSON</button>
        </div>
        <div id="rpt-sg-list"></div>`;
      const m = modal("Subreddit groups", body);
      const render = async () => {
        const c = await S.get(this.KEY, { groups: [] });
        m.querySelector("#rpt-sg-list").innerHTML = c.groups.map((g, gi) => `
          <div class="rpt-sg-item" data-gi="${gi}">
            <div class="rpt-sg-head">
              <strong>${esc(g.name)}</strong>
              <button class="rpt-mini" data-act="add">＋ Add current sub</button>
              <button class="rpt-mini" data-act="rename">Rename</button>
              <button class="rpt-mini" data-act="del">🗑</button>
            </div>
            <textarea placeholder="Notes">${esc(g.notes || "")}</textarea>
            <div>${g.subs.map((s) => `<a class="rpt-chip" href="/r/${esc(s)}">r/${esc(s)} ✕</a>`).join("") || `<span class="rpt-muted">No subs yet</span>`}</div>
          </div>`).join("") || `<p class="rpt-muted">No groups yet.</p>`;
        m.querySelectorAll(".rpt-sg-item").forEach((row) => {
          const gi = +row.dataset.gi;
          row.querySelector('[data-act="add"]').onclick = async () => {
            const sub = currentSubreddit(); if (!sub) return toast("Open a subreddit");
            await S.patch(this.KEY, { groups: [] }, (c) => { if (!c.groups[gi].subs.includes(sub)) c.groups[gi].subs.push(sub); return c; });
            render();
          };
          row.querySelector('[data-act="rename"]').onclick = async () => {
            const name = prompt("New name:"); if (!name) return;
            await S.patch(this.KEY, { groups: [] }, (c) => { c.groups[gi].name = name; return c; });
            render();
          };
          row.querySelector('[data-act="del"]').onclick = async () => {
            if (!confirm("Delete group?")) return;
            await S.patch(this.KEY, { groups: [] }, (c) => { c.groups.splice(gi, 1); return c; });
            render();
          };
          row.querySelector("textarea").onchange = async (e) => {
            await S.patch(this.KEY, { groups: [] }, (c) => { c.groups[gi].notes = e.target.value; return c; });
          };
          row.querySelectorAll(".rpt-chip").forEach((a, si) => a.onclick = async (e) => {
            if (e.offsetX < a.offsetWidth - 16) return; // let link click when not on ✕
            e.preventDefault();
            await S.patch(this.KEY, { groups: [] }, (c) => { c.groups[gi].subs.splice(si, 1); return c; });
            render();
          });
        });
      };
      m.querySelector('[data-act="new"]').onclick = async () => {
        const name = m.querySelector("#rpt-sg-name").value.trim(); if (!name) return;
        await S.patch(this.KEY, { groups: [] }, (c) => { c.groups.push({ name, subs: [], notes: "" }); return c; });
        m.querySelector("#rpt-sg-name").value = ""; render();
      };
      m.querySelector('[data-act="export"]').onclick = async () => {
        download(`rpt-subgroups-${Date.now()}.json`, "application/json", JSON.stringify(await S.get(this.KEY, { groups: [] }), null, 2));
      };
      render();
    },
    run() { this.open(); },
  };

  /* ============ 16. SUBREDDIT HEALTH MONITOR ============ */
  V.modules.subHealth = {
    id: "subHealth", name: "Subreddit health monitor",
    desc: "Compute activity, engagement and spam signals locally.",
    open() {
      const posts = collectPosts();
      const withComments = posts.filter((p) => p.comments > 0).length;
      const dead = posts.filter((p) => p.comments === 0).length;
      const deleted = document.querySelectorAll('.deleted, [deleted], shreddit-comment[author="[deleted]"]').length;
      const spamHint = posts.filter((p) => /free|discount|check.*bio|onlyfans/i.test(p.title)).length;
      const health = Math.max(0, Math.min(100, Math.round((withComments / Math.max(1, posts.length)) * 100 - spamHint * 5 - dead * 0.5)));
      const body = `
        <div class="rpt-v2-health"><div class="rpt-v2-health-num" style="color:${health>60?"var(--brand-2)":health>30?"#f59e0b":"#ef4444"}">${health}</div><div>Health score</div></div>
        <div class="rpt-v2-cmp-grid">
          <div><small>Posts loaded</small><strong>${posts.length}</strong></div>
          <div><small>With comments</small><strong>${withComments}</strong></div>
          <div><small>Dead posts</small><strong>${dead}</strong></div>
          <div><small>Deleted comments</small><strong>${deleted}</strong></div>
          <div><small>Spam hints</small><strong>${spamHint}</strong></div>
          <div><small>Avg score</small><strong>${posts.length ? Math.round(posts.reduce((s,p)=>s+p.score,0)/posts.length) : 0}</strong></div>
        </div>`;
      modal("Subreddit health", body);
    },
    run() { this.open(); },
  };

  /* ============ 17. POST QUALITY FILTER ============ */
  V.modules.qualityFilter = {
    id: "qualityFilter", name: "Post quality filter",
    desc: "Hide low-effort posts; show only high-engagement ones.",
    KEY: "rpt_v2_quality",
    async open() {
      const cur = await S.get(this.KEY, { minScore: 0, minComments: 0, minTitle: 0, hideShort: false });
      const body = `
        <label>Min score <input type="number" data-k="minScore" value="${cur.minScore}"></label>
        <label>Min comments <input type="number" data-k="minComments" value="${cur.minComments}"></label>
        <label>Min title length <input type="number" data-k="minTitle" value="${cur.minTitle}"></label>
        <label><input type="checkbox" data-k="hideShort" ${cur.hideShort?"checked":""}> Hide short titles (&lt;20 chars)</label>
        <button class="rpt-v2-primary" data-act="apply">Apply</button>`;
      const m = modal("Post quality filter", body);
      m.querySelector('[data-act="apply"]').onclick = async () => {
        const next = {};
        m.querySelectorAll("[data-k]").forEach((i) => next[i.dataset.k] = i.type === "checkbox" ? i.checked : (+i.value || 0));
        await S.set(this.KEY, next); this.apply(); toast("Applied"); m.remove();
      };
    },
    async apply() {
      const c = await S.get(this.KEY, { minScore: 0, minComments: 0, minTitle: 0, hideShort: false });
      collectPosts().forEach((p) => {
        const bad = p.score < c.minScore || p.comments < c.minComments || p.title.length < c.minTitle || (c.hideShort && p.title.length < 20);
        p.el.style.display = bad ? "none" : "";
      });
    },
    run() { this.open(); },
  };

  /* ============ 18. SUBREDDIT TIMELINE ============ */
  V.modules.timeline = {
    id: "timeline", name: "Subreddit timeline",
    desc: "Chronological view of loaded posts.",
    open() {
      const posts = collectPosts().filter((p) => p.created).sort((a,b) => new Date(a.created) - new Date(b.created));
      const body = posts.length ? `<ol class="rpt-v2-timeline">${posts.map((p) => `
        <li><time>${new Date(p.created).toLocaleString()}</time>
          <a href="${esc(p.permalink)}">${esc(p.title)}</a>
          <span class="rpt-muted">▲${p.score} · ${p.comments}c</span></li>`).join("")}</ol>` :
        `<p class="rpt-muted">No timestamped posts detected.</p>`;
      modal("Subreddit timeline", body, { wide: true });
    },
    run() { this.open(); },
  };

  /* ============ 19. SEARCH ENHANCER ============ */
  V.modules.searchEnhancer = {
    id: "searchEnhancer", name: "Search enhancer",
    desc: "Build advanced Reddit search URLs with filters.",
    open() {
      const sub = currentSubreddit();
      const body = `
        <label>Keywords <input id="rs-q" placeholder="docker best practices"></label>
        <label>Author <input id="rs-a" placeholder="username"></label>
        <label>Flair <input id="rs-f"></label>
        <label>Min score <input id="rs-s" type="number"></label>
        <label>Post type
          <select id="rs-t"><option value="">Any</option><option>self</option><option>image</option><option>link</option><option>video</option></select>
        </label>
        <label>Sort
          <select id="rs-o"><option>relevance</option><option>new</option><option>top</option><option>comments</option></select>
        </label>
        <label>Time <select id="rs-tt"><option>all</option><option>year</option><option>month</option><option>week</option><option>day</option></select></label>
        <label>Restrict to r/${esc(sub || "…")} <input id="rs-r" type="checkbox" ${sub?"checked":""}></label>
        <button class="rpt-v2-primary" data-act="go">Search</button>`;
      const m = modal("Search enhancer", body);
      m.querySelector('[data-act="go"]').onclick = () => {
        const parts = [m.querySelector("#rs-q").value];
        const a = m.querySelector("#rs-a").value; if (a) parts.push(`author:${a}`);
        const f = m.querySelector("#rs-f").value; if (f) parts.push(`flair:"${f}"`);
        const s = m.querySelector("#rs-s").value; if (s) parts.push(`score:>${s}`);
        const t = m.querySelector("#rs-t").value; if (t) parts.push(`self:${t==="self"}`);
        const q = encodeURIComponent(parts.filter(Boolean).join(" "));
        const scope = m.querySelector("#rs-r").checked && sub ? `/r/${sub}` : "";
        const url = `https://www.reddit.com${scope}/search/?q=${q}&sort=${m.querySelector("#rs-o").value}&t=${m.querySelector("#rs-tt").value}${scope?"&restrict_sr=1":""}`;
        window.open(url, "_blank"); m.remove();
      };
    },
    run() { this.open(); },
  };

  /* ============ 20. TREND TRACKER ============ */
  V.modules.trendTracker = {
    id: "trendTracker", name: "Trend tracker",
    desc: "Compares latest snapshot with previous to spot rising/falling keywords.",
    KEY: "rpt_v2_trends",
    async open() {
      const sub = currentSubreddit(); if (!sub) return toast("Open a subreddit");
      const snap = V.modules.communityCompare.snapshot();
      const cur = await S.get(this.KEY, {});
      const prev = cur[sub];
      let body = "";
      if (!prev) body = `<p class="rpt-muted">No previous data. Saving baseline now — come back later to see trends.</p>`;
      else {
        const prevMap = Object.fromEntries(prev.topKeywords.map((k) => [k.w, k.c]));
        const rising = snap.topKeywords.map((k) => ({ w: k.w, delta: k.c - (prevMap[k.w] || 0) })).sort((a,b)=>b.delta-a.delta);
        body = `
          <h4>Rising</h4>${rising.filter((r)=>r.delta>0).slice(0,10).map((r)=>`<span class="rpt-chip">${esc(r.w)} +${r.delta}</span>`).join("") || "<p class='rpt-muted'>None</p>"}
          <h4>Falling</h4>${rising.filter((r)=>r.delta<0).slice(-10).map((r)=>`<span class="rpt-chip">${esc(r.w)} ${r.delta}</span>`).join("") || "<p class='rpt-muted'>None</p>"}`;
      }
      cur[sub] = snap; await S.set(this.KEY, cur);
      modal(`Trends — r/${sub}`, body);
    },
    run() { this.open(); },
  };

  /* ============ 21. CONTENT EXPORTER ============ */
  V.modules.contentExporter = {
    id: "contentExporter", name: "Subreddit content exporter",
    desc: "Export loaded posts + flairs + rules as JSON/MD.",
    open() {
      const sub = currentSubreddit();
      const posts = collectPosts().map((p) => ({ title: p.title, author: p.author, score: p.score, comments: p.comments, permalink: p.permalink, flair: p.flair, type: p.type, domain: p.domain }));
      const rules = [...document.querySelectorAll('[data-testid*="rule"], .rule')].map((r) => r.innerText.trim());
      const flairs = [...new Set(posts.map((p) => p.flair).filter(Boolean))];
      const body = `<p>Ready to export r/${esc(sub || "current")} — ${posts.length} posts, ${flairs.length} flairs, ${rules.length} rules.</p>
        <div class="rpt-btnrow">
          <button class="rpt-v2-primary" data-f="json">Export JSON</button>
          <button class="rpt-v2-primary" data-f="md">Export Markdown</button>
          <button class="rpt-v2-primary" data-f="html">Export HTML</button>
        </div>`;
      const m = modal("Subreddit content exporter", body);
      m.querySelectorAll("[data-f]").forEach((b) => b.onclick = () => {
        const data = { sub, exportedAt: new Date().toISOString(), posts, flairs, rules };
        if (b.dataset.f === "json") download(`r-${sub}-${Date.now()}.json`, "application/json", JSON.stringify(data, null, 2));
        else if (b.dataset.f === "md") download(`r-${sub}-${Date.now()}.md`, "text/markdown",
          `# r/${sub}\n\n## Rules\n${rules.map((r,i)=>`${i+1}. ${r}`).join("\n")}\n\n## Posts\n${posts.map((p)=>`- [${p.title}](${p.permalink}) — u/${p.author}, ▲${p.score}, ${p.comments}c`).join("\n")}`);
        else download(`r-${sub}-${Date.now()}.html`, "text/html", `<h1>r/${esc(sub)}</h1>` + posts.map((p)=>`<div><a href="${esc(p.permalink)}">${esc(p.title)}</a></div>`).join(""));
        m.remove();
      });
    },
    run() { this.open(); },
  };

  /* ============ 22. FEED DEDUPLICATOR ============ */
  V.modules.feedDedup = {
    id: "feedDedup", name: "Feed deduplicator",
    desc: "Hide duplicate posts (same URL or near-identical title).",
    apply() {
      const posts = collectPosts();
      const seen = new Map();
      let hidden = 0;
      posts.forEach((p) => {
        const key = p.permalink || p.title.toLowerCase().replace(/\W+/g, " ").trim();
        if (seen.has(key)) {
          const prev = seen.get(key);
          if (prev.score >= p.score) { p.el.style.display = "none"; hidden++; }
          else { prev.el.style.display = "none"; seen.set(key, p); hidden++; }
        } else seen.set(key, p);
      });
      toast(`Hid ${hidden} duplicates`);
    },
    run() { this.apply(); },
  };

  /* ============ 23. POST AGE SORTING ============ */
  V.modules.ageSort = {
    id: "ageSort", name: "Post age & engagement sort",
    desc: "Reorder posts on-page by age / engagement bucket.",
    open() {
      const body = `<div class="rpt-btnrow">
        <button class="rpt-v2-primary" data-s="new">Newest</button>
        <button class="rpt-v2-primary" data-s="old">Oldest</button>
        <button class="rpt-v2-primary" data-s="fresh">Fresh discussions</button>
        <button class="rpt-v2-primary" data-s="active">Old but active</button>
        <button class="rpt-v2-primary" data-s="engage">Highest engagement</button>
      </div>`;
      const m = modal("Post age sorting", body);
      m.querySelectorAll("[data-s]").forEach((b) => b.onclick = () => {
        const posts = collectPosts().filter((p) => p.el.parentElement);
        const parent = posts[0]?.el.parentElement; if (!parent) return toast("No posts");
        const now = Date.now();
        const score = (p) => {
          const age = p.created ? (now - new Date(p.created)) / 86400000 : 999;
          switch (b.dataset.s) {
            case "new": return -age;
            case "old": return age;
            case "fresh": return age < 1 ? p.comments : -1;
            case "active": return age > 30 && p.comments > 5 ? p.comments : -1;
            case "engage": return p.comments + p.score;
          }
        };
        posts.sort((a, b) => score(b) - score(a)).forEach((p) => parent.appendChild(p.el));
        toast(`Sorted: ${b.dataset.s}`); m.remove();
      });
    },
    run() { this.open(); },
  };

  /* ============ 24. OPEN LINKS MANAGER ============ */
  V.modules.linksManager = {
    id: "linksManager", name: "Open links manager",
    desc: "Collect all links; open selected, copy, export, group by domain.",
    open() {
      const links = [...document.querySelectorAll("main a[href^='http']")].map((a) => ({ href: a.href, text: a.textContent.trim().slice(0, 100) }));
      const groups = {};
      links.forEach((l) => { const d = new URL(l.href).hostname; (groups[d] = groups[d] || []).push(l); });
      const body = `<div class="rpt-btnrow">
          <button class="rpt-v2-primary" data-act="allsel">Select all</button>
          <button class="rpt-v2-primary" data-act="open">Open selected</button>
          <button class="rpt-v2-primary" data-act="copy">Copy selected</button>
          <button class="rpt-v2-primary" data-act="export">Export CSV</button>
        </div>
        ${Object.entries(groups).map(([d, ls]) => `<h4>${esc(d)} (${ls.length})</h4>
          <ul class="rpt-v2-linklist">${ls.map((l, i) => `<li><label><input type="checkbox" data-i="${d}::${i}"> <a href="${esc(l.href)}" target="_blank">${esc(l.text || l.href)}</a></label></li>`).join("")}</ul>`).join("") || `<p class="rpt-muted">No links found.</p>`}`;
      const m = modal("Open links manager", body, { wide: true });
      const selHref = () => [...m.querySelectorAll('input[type="checkbox"]:checked')].map((c) => {
        const [d, i] = c.dataset.i.split("::"); return groups[d][+i].href;
      });
      m.querySelector('[data-act="allsel"]').onclick = () => m.querySelectorAll("input").forEach((c) => c.checked = true);
      m.querySelector('[data-act="open"]').onclick = () => selHref().forEach((h) => window.open(h, "_blank"));
      m.querySelector('[data-act="copy"]').onclick = () => { navigator.clipboard.writeText(selHref().join("\n")); toast("Copied"); };
      m.querySelector('[data-act="export"]').onclick = () => download(`links-${Date.now()}.csv`, "text/csv", "domain,url,text\n" + links.map((l) => `"${new URL(l.href).hostname}","${l.href}","${l.text.replace(/"/g,'""')}"`).join("\n"));
    },
    run() { this.open(); },
  };

  /* ============ 25. COPY TOOLS ============ */
  V.modules.copyTools = {
    id: "copyTools", name: "Copy tools",
    desc: "Quick copy: title, url, text, markdown, thread structure.",
    open() {
      const post = RPT.state.post || {};
      const title = document.querySelector("h1")?.textContent?.trim() || document.title;
      const url = location.href;
      const text = document.querySelector("main")?.innerText?.slice(0, 4000) || "";
      const structureMd = () => {
        const roots = RPT.state.tree || RPT.features.commentTree.parse();
        const walk = (n, d = 0) => `${"  ".repeat(d)}- ${n.author}: ${(n.body||"").split("\n")[0].slice(0,80)}\n` + (n.children||[]).map((c)=>walk(c,d+1)).join("");
        return roots.map((r)=>walk(r)).join("");
      };
      const opts = [
        ["Title", title],
        ["URL", url],
        ["Title + URL", `${title}\n${url}`],
        ["Page text", text],
        ["Markdown link", `[${title}](${url})`],
        ["Thread structure", structureMd()],
      ];
      const body = `<div class="rpt-btnrow" style="flex-wrap:wrap">${opts.map(([lbl,val],i)=>`<button class="rpt-v2-primary" data-i="${i}">${esc(lbl)}</button>`).join("")}</div>`;
      const m = modal("Copy tools", body);
      m.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => { navigator.clipboard.writeText(opts[+b.dataset.i][1]); toast("Copied: " + opts[+b.dataset.i][0]); });
    },
    run() { this.open(); },
  };

  /* ============ 26. EXPLAIN THIS LINK ============ */
  V.modules.explainLink = {
    id: "explainLink", name: "Explain this link",
    desc: "Metadata + category for hovered links (no AI, no fetch).",
    enabled: false, _tip: null,
    enable() {
      if (this.enabled) return; this.enabled = true;
      document.addEventListener("mouseover", (e) => {
        const a = e.target.closest?.("a[href^='http']"); if (!a) return;
        try {
          const u = new URL(a.href);
          const ext = (u.pathname.match(/\.[a-z0-9]{2,4}$/i) || [""])[0].slice(1);
          const kind = /youtube|youtu\.be|vimeo/.test(u.hostname) ? "Video"
            : /github\.com|gitlab\.com/.test(u.hostname) ? "Code"
            : /reddit\.com/.test(u.hostname) ? "Reddit (internal)"
            : /(png|jpg|jpeg|gif|webp)$/i.test(ext) ? "Image"
            : /(pdf|doc|docx)$/i.test(ext) ? "Document"
            : "Web page";
          if (!this._tip) { this._tip = document.createElement("div"); this._tip.className = "rpt-v2-linktip"; document.body.appendChild(this._tip); }
          this._tip.innerHTML = `<strong>${esc(kind)}</strong><div>${esc(u.hostname)}</div>${ext?`<div>.${esc(ext)}</div>`:""}`;
          const r = a.getBoundingClientRect();
          this._tip.style.left = r.left + "px"; this._tip.style.top = (r.bottom + 4) + "px"; this._tip.style.display = "block";
        } catch {}
      }, true);
      document.addEventListener("mouseout", () => { if (this._tip) this._tip.style.display = "none"; }, true);
    },
    run() { this.enable(); toast("Hover links to see details"); },
  };

  /* ============ 27. SAVED CONTENT MANAGER (same as bookmarks with focus on 'saved' kind) ============ */
  V.modules.savedManager = {
    id: "savedManager", name: "Saved content manager",
    desc: "Alias to the bookmarks system focused on your saved items.",
    run() { V.modules.bookmarks.open(); },
  };

  /* ============ 28. EXPORT LIBRARY ============ */
  V.modules.exportLibrary = {
    id: "exportLibrary", name: "Export library",
    desc: "Central export of everything RPT stores locally.",
    async open() {
      const all = await new Promise((r) => chrome.storage.local.get(null, r));
      const rpt = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith("rpt")));
      const body = `<p>Bundles ${Object.keys(rpt).length} keys of local RPT data (~${(JSON.stringify(rpt).length/1024).toFixed(1)} KB).</p>
        <div class="rpt-btnrow">
          <button class="rpt-v2-primary" data-act="dl">Download JSON</button>
          <button class="rpt-v2-primary" data-act="wipe">Wipe all local RPT data</button>
        </div>`;
      const m = modal("Export library", body);
      m.querySelector('[data-act="dl"]').onclick = () => download(`rpt-library-${Date.now()}.json`, "application/json", JSON.stringify(rpt, null, 2));
      m.querySelector('[data-act="wipe"]').onclick = () => {
        if (!confirm("Wipe ALL local RPT data? This cannot be undone.")) return;
        chrome.storage.local.remove(Object.keys(rpt), () => { toast("Wiped"); m.remove(); });
      };
    },
    run() { this.open(); },
  };

  /* ============ 29. ACHIEVEMENTS TRACKER ============ */
  V.modules.achievements = {
    id: "achievements", name: "Achievements",
    desc: "Personal milestones based on your local usage.",
    KEY: "rpt_v2_ach",
    async tick(key, by = 1) {
      await S.patch(this.KEY, {}, (c) => { c[key] = (c[key] || 0) + by; return c; });
    },
    async open() {
      const c = await S.get(this.KEY, {});
      const list = [
        ["threadsRead", "Threads read", 100],
        ["commentsSaved", "Comments saved", 25],
        ["subsVisited", "Subs visited", 50],
        ["exports", "Exports made", 10],
        ["bookmarks", "Bookmarks added", 50],
      ];
      const body = list.map(([k, lbl, goal]) => {
        const v = c[k] || 0; const pct = Math.min(100, (v / goal) * 100);
        return `<div class="rpt-v2-ach"><div><strong>${lbl}</strong><span class="rpt-muted"> ${v}/${goal}</span></div><div class="rpt-v2-bar"><i style="width:${pct}%"></i></div></div>`;
      }).join("");
      modal("Achievements", body);
    },
    run() { this.open(); },
  };

  /* ============ 30. OLD GOLD FINDER ============ */
  V.modules.oldGold = {
    id: "oldGold", name: "Old gold finder",
    desc: "Highlight old but highly upvoted / commented posts on this page.",
    apply() {
      const posts = collectPosts();
      let n = 0;
      posts.forEach((p) => {
        if (!p.created) return;
        const days = (Date.now() - new Date(p.created)) / 86400000;
        if (days > 180 && (p.score > 500 || p.comments > 100)) {
          p.el.classList.add("rpt-oldgold"); n++;
        }
      });
      toast(`Marked ${n} old-gold posts`);
    },
    run() { this.apply(); },
  };

  /* ============ 31. RANDOM DISCOVERY ============ */
  V.modules.random = {
    id: "random", name: "Random discovery",
    desc: "Jump to a random loaded post or saved bookmark.",
    async open() {
      const body = `<div class="rpt-btnrow">
        <button class="rpt-v2-primary" data-act="post">Random post on page</button>
        <button class="rpt-v2-primary" data-act="sub">Random popular subreddit</button>
        <button class="rpt-v2-primary" data-act="bm">Random bookmark</button>
      </div>`;
      const m = modal("Random discovery", body);
      m.querySelector('[data-act="post"]').onclick = () => {
        const posts = collectPosts(); if (!posts.length) return toast("No posts");
        const p = posts[Math.floor(Math.random() * posts.length)];
        if (p.permalink) location.href = p.permalink; else p.el.scrollIntoView({ behavior: "smooth" });
      };
      m.querySelector('[data-act="sub"]').onclick = () => {
        const list = ["AskReddit","todayilearned","science","worldnews","explainlikeimfive","LifeProTips","dataisbeautiful","IAmA","pics","showerthoughts"];
        location.href = "https://www.reddit.com/r/" + list[Math.floor(Math.random() * list.length)];
      };
      m.querySelector('[data-act="bm"]').onclick = async () => {
        const d = await S.get("rpt_v2_bookmarks", { items: [] });
        if (!d.items.length) return toast("No bookmarks");
        location.href = d.items[Math.floor(Math.random() * d.items.length)].url;
      };
    },
    run() { this.open(); },
  };

  /* ============ 32. RESEARCH MODE ============ */
  V.modules.research = {
    id: "research", name: "Research workspace",
    desc: "Collect posts/comments with notes into a named research bundle.",
    KEY: "rpt_v2_research",
    async open() {
      const cur = await S.get(this.KEY, { active: "", bundles: {} });
      const body = `
        <div class="rpt-btnrow">
          <input id="rpt-rs-name" placeholder="Bundle name" value="${esc(cur.active)}" style="flex:1">
          <button class="rpt-v2-primary" data-act="setActive">Set active</button>
          <button class="rpt-v2-primary" data-act="addPost">Add current post</button>
          <button class="rpt-v2-primary" data-act="export">Export active</button>
        </div>
        <div id="rpt-rs-list"></div>`;
      const m = modal("Research workspace", body, { wide: true });
      const render = async () => {
        const c = await S.get(this.KEY, { active: "", bundles: {} });
        m.querySelector("#rpt-rs-list").innerHTML = Object.entries(c.bundles).map(([name, items]) => `
          <div class="rpt-sg-item">
            <div class="rpt-sg-head"><strong>${esc(name)}</strong> <span class="rpt-muted">${items.length} items</span>
              ${name === c.active ? '<span class="rpt-tag">active</span>' : `<button class="rpt-mini" data-use="${esc(name)}">Use</button>`}
              <button class="rpt-mini" data-del="${esc(name)}">🗑</button>
            </div>
            <ul>${items.map((it) => `<li><a href="${esc(it.url)}" target="_blank">${esc(it.title)}</a> — <em>${esc(it.note||"")}</em></li>`).join("")}</ul>
          </div>`).join("") || `<p class="rpt-muted">No bundles yet.</p>`;
        m.querySelectorAll("[data-use]").forEach((b) => b.onclick = async () => { await S.patch(this.KEY, { active: "", bundles: {} }, (x) => { x.active = b.dataset.use; return x; }); render(); });
        m.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => { await S.patch(this.KEY, { active: "", bundles: {} }, (x) => { delete x.bundles[b.dataset.del]; if (x.active === b.dataset.del) x.active = ""; return x; }); render(); });
      };
      m.querySelector('[data-act="setActive"]').onclick = async () => {
        const name = m.querySelector("#rpt-rs-name").value.trim(); if (!name) return;
        await S.patch(this.KEY, { active: "", bundles: {} }, (c) => { if (!c.bundles[name]) c.bundles[name] = []; c.active = name; return c; });
        render();
      };
      m.querySelector('[data-act="addPost"]').onclick = async () => {
        const note = prompt("Note (optional):") || "";
        await S.patch(this.KEY, { active: "", bundles: {} }, (c) => {
          if (!c.active) return c;
          c.bundles[c.active].push({ url: location.href, title: document.title, note, addedAt: Date.now() });
          return c;
        });
        toast("Added"); render();
      };
      m.querySelector('[data-act="export"]').onclick = async () => {
        const c = await S.get(this.KEY, { active: "", bundles: {} });
        if (!c.active) return toast("Set an active bundle first");
        download(`research-${c.active}-${Date.now()}.md`, "text/markdown",
          `# ${c.active}\n\n` + c.bundles[c.active].map((it) => `- [${it.title}](${it.url})\n  > ${it.note || ""}`).join("\n\n"));
      };
      render();
    },
    run() { this.open(); },
  };

  /* ============ 33. BROWSER HISTORY ============ */
  V.modules.history = {
    id: "history", name: "Local Reddit history",
    desc: "Local log of pages you visited on Reddit (search + open).",
    KEY: "rpt_v2_history",
    async record() {
      if (!/reddit\.com/.test(location.hostname)) return;
      await S.patch(this.KEY, { items: [] }, (c) => {
        const url = location.href;
        c.items = c.items.filter((i) => i.url !== url);
        c.items.unshift({ url, title: document.title, at: Date.now() });
        if (c.items.length > 500) c.items.length = 500;
        return c;
      });
    },
    async open() {
      const cur = await S.get(this.KEY, { items: [] });
      const body = `<input id="rpt-hi-q" placeholder="Search history…" style="width:100%;padding:8px">
        <ul id="rpt-hi-list" class="rpt-v2-linklist"></ul>`;
      const m = modal("Reddit history", body, { wide: true });
      const render = (q = "") => {
        m.querySelector("#rpt-hi-list").innerHTML = cur.items.filter((i) => !q || i.title.toLowerCase().includes(q) || i.url.toLowerCase().includes(q))
          .slice(0, 200).map((i) => `<li><a href="${esc(i.url)}">${esc(i.title)}</a> <span class="rpt-muted">${new Date(i.at).toLocaleString()}</span></li>`).join("");
      };
      m.querySelector("#rpt-hi-q").oninput = (e) => render(e.target.value.toLowerCase());
      render();
    },
    run() { this.open(); },
  };

  /* ============ 34. FOLLOW KEYWORDS (page highlight + count) ============ */
  V.modules.followKeywords = {
    id: "followKeywords", name: "Follow keywords",
    desc: "Highlight tracked topics in the current page and count mentions.",
    async run() {
      const cur = await S.get("rpt_v2_topics", { topics: [] });
      if (!cur.topics.length) return toast("Add topics via Topic tracker first");
      const words = cur.topics.map((t) => t.name);
      const re = new RegExp(`\\b(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
      let n = 0;
      document.querySelectorAll("main p, main li, main [slot='comment']").forEach((el) => {
        if (el.querySelector(".rpt-v2-mark")) return;
        const html = el.innerHTML.replace(re, (m) => { n++; return `<mark class="rpt-v2-mark">${m}</mark>`; });
        if (html !== el.innerHTML) el.innerHTML = html;
      });
      toast(`Highlighted ${n} mentions of ${words.length} tracked keywords`);
    },
  };

  /* ============ 35. IMAGE/TEXT TOGGLE ============ */
  V.modules.mediaToggle = {
    id: "mediaToggle", name: "Image / text / video toggle",
    desc: "Filter feed to a single content type at a time.",
    open() {
      const body = `<div class="rpt-btnrow">
        <button class="rpt-v2-primary" data-t="image">Only images</button>
        <button class="rpt-v2-primary" data-t="video">Only videos</button>
        <button class="rpt-v2-primary" data-t="text">Only text</button>
        <button class="rpt-v2-primary" data-t="link">Only links</button>
        <button class="rpt-v2-primary" data-t="">Show all</button>
      </div>`;
      const m = modal("Media toggle", body);
      m.querySelectorAll("[data-t]").forEach((b) => b.onclick = () => {
        const t = b.dataset.t;
        collectPosts().forEach((p) => { p.el.style.display = !t || p.type === t ? "" : "none"; });
        toast(t ? `Only ${t}` : "All"); m.remove();
      });
    },
    run() { this.open(); },
  };

  /* ============ 36. DEVELOPER MODE ============ */
  V.modules.devMode = {
    id: "devMode", name: "Developer mode",
    desc: "Inspect the hovered element: Reddit IDs, timestamps, JSON.",
    enabled: false,
    enable() {
      if (this.enabled) return; this.enabled = true;
      document.body.classList.add("rpt-devmode");
      const tip = document.createElement("div");
      tip.className = "rpt-v2-devtip"; document.body.appendChild(tip);
      document.addEventListener("mousemove", (e) => {
        const el = e.target;
        const info = {
          tag: el.tagName?.toLowerCase(),
          id: el.id || undefined,
          thingid: el.getAttribute?.("thingid") || undefined,
          author: el.getAttribute?.("author") || undefined,
          created: el.getAttribute?.("created-timestamp") || undefined,
          score: el.getAttribute?.("score") || undefined,
        };
        tip.textContent = Object.entries(info).filter(([,v])=>v).map(([k,v])=>`${k}=${v}`).join("  ");
        tip.style.left = (e.clientX + 12) + "px"; tip.style.top = (e.clientY + 12) + "px";
      });
    },
    disable() {
      this.enabled = false;
      document.body.classList.remove("rpt-devmode");
      document.querySelectorAll(".rpt-v2-devtip").forEach((n) => n.remove());
    },
    run() { if (this.enabled) { this.disable(); toast("Dev mode off"); } else { this.enable(); toast("Dev mode on — hover elements"); } },
  };

  /* ---------------- HUB (launcher modal for all 36 features) ---------------- */
  const CATEGORIES = [
    ["Community", ["communityCompare","subAnalyzer","calendar","subHealth","timeline","trendTracker","subGroups","contentExporter"]],
    ["Thread & comments", ["miniMap","commentExport","userAnalytics","postAnalytics","copyTools","followKeywords"]],
    ["Filtering & feed", ["flairTools","qualityFilter","feedDedup","ageSort","mediaToggle","oldGold","sidebarCleaner"]],
    ["Discovery & knowledge", ["bookmarks","savedManager","research","topicTracker","random","history","achievements","wikiNav","resourceCollector"]],
    ["Utilities", ["searchEnhancer","linksManager","explainLink","exportLibrary","repostDetector","devMode"]],
  ];

  V.HUB_KEY = "rpt_v2_enabled";
  V.enabledDefaults = () => Object.fromEntries(Object.keys(V.modules).map((k) => [k, true]));
  V.getEnabled = async () => ({ ...V.enabledDefaults(), ...(await S.get(V.HUB_KEY, {})) });

  V.openHub = async () => {
    const enabled = await V.getEnabled();
    const body = `
      <p class="rpt-muted">36 advanced features — all run locally. Click to launch, or toggle to disable individually.</p>
      <input id="rpt-hub-q" placeholder="${tr("search_features")}" style="width:100%;padding:10px;margin-bottom:10px;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;color:var(--fg)">
      ${CATEGORIES.map(([cat, ids]) => `
        <h3 class="rpt-hub-cat">${esc(cat)}</h3>
        <div class="rpt-hub-grid">
          ${ids.map((id) => {
            const mod = V.modules[id]; if (!mod) return "";
            return `<div class="rpt-hub-card ${enabled[id] ? "" : "rpt-hub-off"}" data-id="${id}">
              <button class="rpt-hub-run" data-run="${id}">
                <strong>${esc(tx(mod.name))}</strong>
                <span>${esc(tx(mod.desc))}</span>
              </button>
              <label class="rpt-hub-toggle" title="${tr("enable_disable")}">
                <input type="checkbox" data-tog="${id}" ${enabled[id] ? "checked" : ""}>
              </label>
            </div>`;
          }).join("")}
        </div>`).join("")}`;
    const m = modal(tr("power_features"), body, { wide: true });
    m.querySelectorAll("[data-run]").forEach((b) => b.onclick = async () => {
      const id = b.dataset.run;
      const en = await V.getEnabled();
      if (!en[id]) return toast(tr("feature_disabled_turn_on"));
      try { m.remove(); V.modules[id].run?.(); } catch (e) { console.error(e); toast(`${tr("feature_error")}: ${e.message}`); }
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

  /* ---------------- Auto-run passive features + history tracking ---------------- */
  const autoInit = async () => {
    const en = await V.getEnabled();
    try { if (en.history) V.modules.history.record(); } catch {}
    try { if (en.userAnalytics) V.modules.userAnalytics.enable(); } catch {}
    try { if (en.postAnalytics) V.modules.postAnalytics.enable(); } catch {}
    try { if (en.explainLink) V.modules.explainLink.enable(); } catch {}
    try { if (en.flairTools) V.modules.flairTools.apply(); } catch {}
    try { if (en.sidebarCleaner) V.modules.sidebarCleaner.apply(); } catch {}
    try { if (en.qualityFilter) V.modules.qualityFilter.apply(); } catch {}
    try { if (en.achievements) V.modules.achievements.tick("threadsRead"); } catch {}
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoInit);
  else setTimeout(autoInit, 200);

  /* Re-run on SPA navigation. */
  let lastPath = location.pathname;
  new MutationObserver(() => {
    if (location.pathname !== lastPath) { lastPath = location.pathname; setTimeout(autoInit, 400); }
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------------- Public API ---------------- */
  V.open = V.openHub;
  V.list = () => Object.values(V.modules).map((m) => ({ id: m.id, name: m.name, desc: m.desc }));

  /* Wire into existing command palette if present. */
  try {
    const orig = RPT.features.cmdk?.commands;
    if (typeof orig === "function") {
      RPT.features.cmdk.commands = function () {
        const base = orig.call(this);
        return base.concat(
          { id: "v2-hub", label: `${tr("power_features")} — ${tr("hub")}`, run: () => V.openHub() },
          ...Object.values(V.modules).map((m) => ({ id: `v2-${m.id}`, label: `⚡ ${tx(m.name)}`, run: () => m.run() }))
        );
      };
    }
  } catch {}
})();