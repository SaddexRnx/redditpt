/*
 * Reddit Power Toolkit — content script (bundled, no build step).
 * Midnight redesign. Modular architecture: every feature is a small
 * module on the RPT namespace, DOM knowledge stays in RPT.selectors.
 */
(function () {
  "use strict";
  if (window.__RPT_LOADED__) return;
  window.__RPT_LOADED__ = true;

  const RPT = (window.RPT = {
    features: {},
    state: { tree: null, comments: [], post: null },
  });

  /* ---------------- storage ---------------- */
  RPT.storage = {
    get(keys) { return new Promise((r) => chrome.storage.local.get(keys, r)); },
    set(obj)  { return new Promise((r) => chrome.storage.local.set(obj, r)); },
  };

  /* ---------------- selectors (single source of DOM truth) ---------------- */
  RPT.selectors = {
    postTitle: () => document.querySelector(
      'shreddit-post [slot="title"], shreddit-post h1, .top-matter a.title, [data-testid="post-container"] h1'
    ),
    postBody: () => document.querySelector(
      'shreddit-post [slot="post-media-container"], shreddit-post [slot="text-body"], .expando .usertext-body, [data-testid="post-container"] [data-click-id="text"]'
    ),
    commentNodes: () => document.querySelectorAll("shreddit-comment, .thing.comment"),
    commentAuthor(el) {
      return el.getAttribute?.("author") || el.dataset?.author ||
        el.querySelector?.("a.author")?.textContent || "unknown";
    },
    commentBody(el) {
      const md = el.querySelector?.('[slot="comment"]') ||
        el.querySelector?.(".md") || el.querySelector?.(".usertext-body");
      return md?.innerText?.trim() || "";
    },
    commentScore(el) {
      const s = el.getAttribute?.("score") || el.dataset?.score ||
        el.querySelector?.(".score.unvoted")?.getAttribute("title");
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : 0;
    },
    commentDepth(el) {
      const d = el.getAttribute?.("depth") ?? el.dataset?.depth;
      if (d != null) return parseInt(d, 10) || 0;
      let depth = 0; let p = el.parentElement;
      while (p) {
        if (p.classList?.contains("comment") || p.tagName === "SHREDDIT-COMMENT") depth++;
        p = p.parentElement;
      }
      return depth;
    },
    commentId(el) {
      return el.getAttribute?.("thingid") || el.getAttribute?.("id") ||
        el.dataset?.fullname || el.id || Math.random().toString(36).slice(2);
    },
  };

  /* ---------------- utils ---------------- */
  RPT.utils = {
    debounce(fn, ms = 250) {
      let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    },
    escapeHtml(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
      );
    },
    isRedditThread() { return /\/(r|user)\/[^/]+\/comments\//.test(location.pathname); },
  };

  /* ---------------- icon set (inline SVG) ---------------- */
  const I = {
    panel:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>',
    tree:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 15a6 6 0 0 0 6-6h6"/></svg>',
    summary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7l9 5 9-5-9-5z"/><path d="m3 17 9 5 9-5"/><path d="m3 12 9 5 9-5"/></svg>',
    chat:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    image:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
    fold:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5-5 5 5"/></svg>',
    layers:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/></svg>',
    filter:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    tag:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/></svg>',
    star:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    stats:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
    export:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    kbd:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M8 14h8"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h0A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9h0A1.65 1.65 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    bell:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    close:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  };
  RPT.ICON = I;

  /* ---------------- Auto-run preferences ---------------- */
  RPT.autorun = {
    KEY: "rpt_autorun",
    defaults: { cleaner: true, highlighter: true, tags: true, ageWarning: true, quickBar: true, saveButtons: true, liveNew: true },
    async load() {
      const { [this.KEY]: v } = await RPT.storage.get(this.KEY);
      return { ...this.defaults, ...(v || {}) };
    },
    async save(v) { await RPT.storage.set({ [this.KEY]: v }); },
  };

  /* ---------------- General preferences ---------------- */
  RPT.general = {
    KEY: "rpt_general",
    defaults: { autoOpenPanel: true, showOnboarding: true },
    async load() {
      const { [this.KEY]: v } = await RPT.storage.get(this.KEY);
      return { ...this.defaults, ...(v || {}) };
    },
  };

  /* ---------------- Comment tree parser ---------------- */
  RPT.features.commentTree = {
    parse() {
      const nodes = Array.from(RPT.selectors.commentNodes());
      const list = nodes.map((el) => ({
        el, id: RPT.selectors.commentId(el),
        author: RPT.selectors.commentAuthor(el),
        body: RPT.selectors.commentBody(el),
        score: RPT.selectors.commentScore(el),
        depth: RPT.selectors.commentDepth(el),
        children: [],
      }));
      const stack = []; const roots = [];
      list.forEach((c) => {
        while (stack.length && stack[stack.length - 1].depth >= c.depth) stack.pop();
        const parent = stack[stack.length - 1];
        if (parent) parent.children.push(c); else roots.push(c);
        stack.push(c);
      });
      RPT.state.comments = list;
      RPT.state.tree = roots;
      RPT.state.post = {
        title: RPT.selectors.postTitle()?.innerText?.trim() || document.title,
        url: location.href,
        body: RPT.selectors.postBody()?.innerText?.trim() || "",
      };
      return roots;
    },
    renderInto(container) {
      const roots = this.parse();
      container.innerHTML = "";
      if (!roots.length) {
        container.innerHTML = '<p class="rpt-empty">No comments detected on this page.</p>';
        return;
      }
      const ul = document.createElement("ul");
      ul.className = "rpt-tree";
      const walk = (nodes, parent) => {
        nodes.forEach((n) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <div class="rpt-tree-item" data-id="${RPT.utils.escapeHtml(n.id)}">
              <span class="rpt-author">${RPT.utils.escapeHtml(n.author)}</span>
              <span class="rpt-score">${n.score}</span>
              <span class="rpt-preview">${RPT.utils.escapeHtml(n.body.slice(0, 100))}</span>
            </div>`;
          li.querySelector(".rpt-tree-item").addEventListener("click", () => {
            n.el.scrollIntoView({ behavior: "smooth", block: "center" });
            n.el.classList.add("rpt-flash");
            setTimeout(() => n.el.classList.remove("rpt-flash"), 1500);
          });
          if (n.children.length) { const c = document.createElement("ul"); walk(n.children, c); li.appendChild(c); }
          parent.appendChild(li);
        });
      };
      walk(roots, ul);
      container.appendChild(ul);
    },
  };

  /* ---------------- Layers ---------------- */
  RPT.features.layers = {
    apply() {
      RPT.state.comments.forEach((c) => c.el.classList.add("rpt-layer", `rpt-layer-${Math.min(c.depth, 8)}`));
    },
    remove() {
      document.querySelectorAll(".rpt-layer").forEach((el) => {
        el.classList.remove("rpt-layer");
        for (let i = 0; i <= 8; i++) el.classList.remove(`rpt-layer-${i}`);
      });
    },
  };

  /* ---------------- Folding ---------------- */
  RPT.features.folding = {
    STORAGE_KEY: "rpt_folded",
    async toggle(id, forceState) {
      const c = RPT.state.comments.find((x) => x.id === id);
      if (!c) return;
      const collapsed = forceState ?? !c.el.classList.contains("rpt-collapsed");
      c.el.classList.toggle("rpt-collapsed", collapsed);
      const { [this.STORAGE_KEY]: map = {} } = await RPT.storage.get(this.STORAGE_KEY);
      const key = location.pathname;
      map[key] = map[key] || {};
      map[key][id] = collapsed;
      await RPT.storage.set({ [this.STORAGE_KEY]: map });
    },
    async collapseAll() { RPT.state.comments.forEach((c) => c.el.classList.add("rpt-collapsed")); },
    async expandAll()  { RPT.state.comments.forEach((c) => c.el.classList.remove("rpt-collapsed")); },
    async restore() {
      const { [this.STORAGE_KEY]: map = {} } = await RPT.storage.get(this.STORAGE_KEY);
      const saved = map[location.pathname] || {};
      RPT.state.comments.forEach((c) => { if (saved[c.id]) c.el.classList.add("rpt-collapsed"); });
    },
  };

  /* ---------------- Cleaner ---------------- */
  RPT.features.cleaner = {
    KEY: "rpt_filters",
    defaults: { hideDeleted: false, hideEmpty: false, hideBots: false, hideShort: false, minLength: 15, hideLowScore: false, minScore: 1 },
    async load() { const { [this.KEY]: f } = await RPT.storage.get(this.KEY); return { ...this.defaults, ...(f || {}) }; },
    async save(f) { await RPT.storage.set({ [this.KEY]: f }); },
    async apply() {
      const f = await this.load();
      RPT.state.comments.forEach((c) => {
        let hide = false;
        const body = c.body.toLowerCase();
        if (f.hideDeleted && (body === "[deleted]" || body === "[removed]" || c.author === "[deleted]")) hide = true;
        if (f.hideEmpty && !body) hide = true;
        if (f.hideBots && /bot$|automoderator/i.test(c.author)) hide = true;
        if (f.hideShort && body.length < f.minLength) hide = true;
        if (f.hideLowScore && c.score < f.minScore) hide = true;
        c.el.classList.toggle("rpt-hidden", hide);
      });
    },
  };

  /* ---------------- Conversation mode ---------------- */
  RPT.features.conversation = {
    open() {
      const overlay = document.createElement("div");
      overlay.className = "rpt-overlay";
      overlay.innerHTML = `
        <div class="rpt-overlay-panel">
          <div class="rpt-overlay-head">
            <h2>${I.chat} Conversation Mode</h2>
            <button class="rpt-close">${I.close}</button>
          </div>
          <div class="rpt-convo-body"></div>
        </div>`;
      const body = overlay.querySelector(".rpt-convo-body");
      const render = (nodes, indent = 0) => {
        nodes.forEach((n) => {
          const row = document.createElement("div");
          row.className = "rpt-msg";
          row.style.marginLeft = `${indent * 18}px`;
          row.innerHTML = `
            <div class="rpt-msg-author">${RPT.utils.escapeHtml(n.author)}</div>
            <div class="rpt-msg-bubble">${RPT.utils.escapeHtml(n.body)}</div>`;
          body.appendChild(row);
          if (n.children.length) render(n.children, indent + 1);
        });
      };
      render(RPT.state.tree || RPT.features.commentTree.parse());
      overlay.querySelector(".rpt-close").onclick = () => overlay.remove();
      overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
    },
  };

  /* ---------------- Statistics + Health ---------------- */
  RPT.features.analytics = {
    compute() {
      const cs = RPT.state.comments;
      if (!cs.length) return null;
      const total = cs.length;
      const avg = Math.round(cs.map((c) => c.body.length).reduce((a, b) => a + b, 0) / total);
      const longest = cs.reduce((a, b) => (a.body.length >= b.body.length ? a : b));
      const parentReplyCounts = {};
      const walk = (nodes) => {
        nodes.forEach((n) => {
          if (n.children.length) parentReplyCounts[n.author] = (parentReplyCounts[n.author] || 0) + n.children.length;
          walk(n.children);
        });
      };
      walk(RPT.state.tree || []);
      const mostReplied = Object.entries(parentReplyCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const deepest = cs.reduce((m, c) => Math.max(m, c.depth), 0);
      const countDesc = (n) => n.children.length + n.children.reduce((s, c) => s + countDesc(c), 0);
      const branches = (RPT.state.tree || [])
        .map((r) => ({ author: r.author, size: countDesc(r) + 1 }))
        .sort((a, b) => b.size - a.size).slice(0, 5);
      return { total, avgLength: avg, longest: { author: longest.author, length: longest.body.length, preview: longest.body.slice(0, 140) }, mostReplied, deepest, branches };
    },
  };
  RPT.features.health = {
    analyze() {
      const cs = RPT.state.comments;
      if (!cs.length) return { score: 0, notes: ["No comments loaded."] };
      const notes = [];
      const deepest = cs.reduce((m, c) => Math.max(m, c.depth), 0);
      const withReplies = (RPT.state.tree || []).filter((r) => r.children.length).length;
      const dead = (RPT.state.tree || []).filter((r) => !r.children.length).length;
      const controversial = cs.filter((c) => c.score <= 0).length;
      notes.push(`Discussion depth: ${deepest}`);
      notes.push(`Root threads with replies: ${withReplies}`);
      notes.push(`Dead branches (no replies): ${dead}`);
      notes.push(`Controversial (score ≤ 0): ${controversial}`);
      const score = Math.max(0, Math.min(100, 40 + deepest * 4 + withReplies * 3 - dead - controversial * 2));
      return { score, notes };
    },
  };

  /* ---------------- Smart local thread summary ---------------- */
  RPT.features.summary = {
    compute() {
      RPT.features.commentTree.parse();
      const cs = RPT.state.comments; if (!cs.length) return null;
      const top = [...cs].sort((a, b) => b.score - a.score).slice(0, 5);
      const countDesc = (n) => n.children.length + n.children.reduce((s, c) => s + countDesc(c), 0);
      const mostReplied = (RPT.state.tree || [])
        .map((r) => ({ node: r, size: countDesc(r) })).sort((a, b) => b.size - a.size).slice(0, 5);
      const controversial = cs.filter((c) => c.score <= 0 && c.body.length > 30).slice(0, 5);
      const substantive = [...cs].filter((c) => c.body.length > 200 && c.score > 5)
        .sort((a, b) => b.body.length - a.body.length).slice(0, 5);
      return { top, mostReplied, controversial, substantive };
    },
    open() {
      const s = this.compute();
      const o = document.createElement("div");
      o.className = "rpt-overlay";
      const item = (c, meta) => `
        <div class="rpt-summary-item" data-id="${RPT.utils.escapeHtml(c.id)}">
          <div class="rpt-summary-meta"><strong>u/${RPT.utils.escapeHtml(c.author)}</strong> · ${meta}</div>
          <div class="rpt-summary-text">${RPT.utils.escapeHtml(c.body.slice(0, 240))}${c.body.length > 240 ? "…" : ""}</div>
        </div>`;
      const section = (title, items) =>
        `<div class="rpt-summary-section"><h3>${title}</h3>${items.length ? items : '<div class="rpt-muted">Nothing found.</div>'}</div>`;
      o.innerHTML = `
        <div class="rpt-overlay-panel">
          <div class="rpt-overlay-head">
            <h2>${I.summary} Smart Summary</h2>
            <button class="rpt-close">${I.close}</button>
          </div>
          <div class="rpt-summary">${
            s ? `
              ${section("▲ Top voted", s.top.map((c) => item(c, `${c.score} pts`)).join(""))}
              ${section("💬 Most discussed threads", s.mostReplied.map((m) => item(m.node, `${m.size} replies`)).join(""))}
              ${section("📄 Long & substantive", s.substantive.map((c) => item(c, `${c.body.length} chars · ${c.score} pts`)).join(""))}
              ${section("⚡ Controversial", s.controversial.map((c) => item(c, `${c.score} pts`)).join(""))}
            ` : '<p class="rpt-muted">No comments detected on this page.</p>'
          }</div>
        </div>`;
      o.querySelector(".rpt-close").onclick = () => o.remove();
      o.addEventListener("click", (e) => { if (e.target === o) o.remove(); });
      o.querySelectorAll(".rpt-summary-item").forEach((it) => {
        it.onclick = () => {
          const c = RPT.state.comments.find((x) => x.id === it.dataset.id);
          if (!c) return;
          c.el.scrollIntoView({ behavior: "smooth", block: "center" });
          c.el.classList.add("rpt-flash");
          setTimeout(() => c.el.classList.remove("rpt-flash"), 1500);
          o.remove();
        };
      });
      document.body.appendChild(o);
    },
  };

  /* ---------------- Live "new comments" indicator ---------------- *
   * Polls Reddit's own thread JSON (same origin, public endpoint) —
   * no external server, still 100% local.                             */
  RPT.features.liveNew = {
    _timer: null, _baseline: 0, _latest: 0,
    async start() {
      const auto = await RPT.autorun.load();
      if (!auto.liveNew) return;
      if (!RPT.utils.isRedditThread()) return;
      this.stop();
      this._baseline = RPT.state.comments.length ||
        document.querySelectorAll("shreddit-comment, .thing.comment").length;
      const poll = async () => {
        try {
          const url = location.pathname.replace(/\/$/, "") + ".json?limit=500&raw_json=1";
          const r = await fetch(url, { credentials: "omit" });
          if (!r.ok) return;
          const j = await r.json();
          const listing = Array.isArray(j) && j[1]?.data?.children;
          if (!listing) return;
          const count = this._countAll(listing);
          this._latest = count;
          const delta = Math.max(0, count - this._baseline);
          RPT.ui.updateNewBadge(delta);
        } catch { /* silent */ }
      };
      poll();
      this._timer = setInterval(poll, 45000);
    },
    stop() { if (this._timer) clearInterval(this._timer); this._timer = null; RPT.ui.updateNewBadge(0); },
    _countAll(children) {
      let n = 0;
      for (const c of children) {
        if (c.kind !== "t1") continue;
        n++;
        const kids = c.data?.replies?.data?.children;
        if (Array.isArray(kids)) n += this._countAll(kids);
      }
      return n;
    },
    reset() { this._baseline = this._latest || this._baseline; RPT.ui.updateNewBadge(0); },
  };

  /* ---------------- Filter chips (OP / Mod / Awarded) ---------------- */
  RPT.features.chips = {
    active: new Set(),
    _opAuthor() {
      return document.querySelector("shreddit-post")?.getAttribute("author") ||
        document.querySelector("[data-testid='post-container'] a[href^='/user/']")?.textContent?.trim() || null;
    },
    _match(el, kind) {
      if (kind === "op") {
        const op = this._opAuthor();
        return op && RPT.selectors.commentAuthor(el) === op;
      }
      if (kind === "mod") {
        return el.getAttribute?.("distinguished") === "moderator" || !!el.querySelector?.(".moderator");
      }
      if (kind === "awarded") {
        return !!el.querySelector?.("[award-count], .awardings-bar, faceplate-tracker[source='comment_gilding']");
      }
      return false;
    },
    apply() {
      if (!this.active.size) {
        RPT.state.comments.forEach((c) => c.el.classList.remove("rpt-hidden"));
        return;
      }
      RPT.state.comments.forEach((c) => {
        const ok = [...this.active].some((k) => this._match(c.el, k));
        c.el.classList.toggle("rpt-hidden", !ok);
      });
    },
    toggle(kind) { this.active.has(kind) ? this.active.delete(kind) : this.active.add(kind); this.apply(); },
  };

  /* ---------------- Save-to-collections (local) ---------------- */
  RPT.features.collections = {
    KEY: "rpt_collections",
    async list() { const { [this.KEY]: v = [] } = await RPT.storage.get(this.KEY); return v; },
    async save(all) { await RPT.storage.set({ [this.KEY]: all }); },
    async add(c) {
      const all = await this.list();
      if (all.some((x) => x.id === c.id)) return;
      all.unshift({
        id: c.id, author: c.author, body: c.body, score: c.score,
        url: location.href, title: RPT.state.post?.title || document.title,
        savedAt: new Date().toISOString(),
      });
      await this.save(all.slice(0, 500));
    },
    async remove(id) { await this.save((await this.list()).filter((x) => x.id !== id)); },
    async attach() {
      const auto = await RPT.autorun.load();
      if (!auto.saveButtons) return;
      const saved = new Set((await this.list()).map((x) => x.id));
      RPT.state.comments.forEach((c) => {
        if (c.el.querySelector(".rpt-save-btn")) return;
        const anchor = c.el.querySelector("[slot='commentMeta']") ||
          c.el.querySelector(".flat-list.buttons") ||
          c.el.querySelector("[slot='authorName']")?.parentElement;
        if (!anchor) return;
        const btn = document.createElement("button");
        btn.className = "rpt-save-btn" + (saved.has(c.id) ? " rpt-saved" : "");
        btn.textContent = "★ save";
        btn.title = "Save to your local collection";
        btn.onclick = async (e) => {
          e.preventDefault(); e.stopPropagation();
          if (btn.classList.contains("rpt-saved")) {
            await this.remove(c.id); btn.classList.remove("rpt-saved");
          } else {
            await this.add(c); btn.classList.add("rpt-saved");
          }
        };
        anchor.appendChild(btn);
      });
    },
  };

  /* ---------------- Highlighter ---------------- */
  RPT.features.highlighter = {
    KEY: "rpt_keywords",
    async get() { const { [this.KEY]: k = [] } = await RPT.storage.get(this.KEY); return k; },
    async set(list) { await RPT.storage.set({ [this.KEY]: list }); },
    async apply() {
      const list = await this.get();
      document.querySelectorAll(".rpt-hl").forEach((n) => { const t = document.createTextNode(n.textContent); n.replaceWith(t); });
      if (!list.length) return;
      const rx = new RegExp("(" + list.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (!n.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
          const p = n.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.closest(".rpt-panel, .rpt-overlay, .rpt-qb, script, style, textarea, input")) return NodeFilter.FILTER_REJECT;
          return rx.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      const targets = []; let cur;
      while ((cur = walker.nextNode())) targets.push(cur);
      targets.forEach((t) => {
        const span = document.createElement("span");
        span.innerHTML = t.nodeValue.replace(rx, '<mark class="rpt-hl">$1</mark>');
        t.replaceWith(span);
      });
    },
  };

  /* ---------------- User color tags ---------------- */
  RPT.features.userTags = {
    KEY: "rpt_user_tags",
    async get() { const { [this.KEY]: t = {} } = await RPT.storage.get(this.KEY); return t; },
    async set(user, label, color) {
      const t = await this.get();
      if (!label) delete t[user]; else t[user] = { label, color };
      await RPT.storage.set({ [this.KEY]: t }); this.apply();
    },
    async apply() {
      const tags = await this.get();
      document.querySelectorAll(".rpt-user-tag").forEach((n) => n.remove());
      RPT.state.comments.forEach((c) => {
        const t = tags[c.author]; if (!t) return;
        const authorEl = c.el.querySelector("a[href*='/user/']") || c.el.querySelector("[slot='authorName']");
        if (!authorEl) return;
        const badge = document.createElement("span");
        badge.className = "rpt-user-tag";
        badge.textContent = t.label;
        badge.style.background = t.color || "#3b82f6";
        authorEl.after(badge);
      });
    },
  };

  /* ---------------- Formatting toolbar ---------------- */
  RPT.features.toolbar = {
    attach() {
      document.querySelectorAll("textarea").forEach((ta) => {
        if (ta.dataset.rptToolbar) return;
        ta.dataset.rptToolbar = "1";
        const bar = document.createElement("div");
        bar.className = "rpt-toolbar";
        const wrap = (before, after = before) => {
          const s = ta.selectionStart, e = ta.selectionEnd;
          const sel = ta.value.slice(s, e) || "text";
          ta.value = ta.value.slice(0, s) + before + sel + after + ta.value.slice(e);
          ta.focus();
        };
        [
          ["B", () => wrap("**"), "Bold"], ["i", () => wrap("*"), "Italic"],
          ["</>", () => wrap("`"), "Code"], ["❝", () => wrap("\n> ", ""), "Quote"],
          ["Spoiler", () => wrap(">!", "!<"), "Spoiler"], ["Link", () => wrap("[", "](url)"), "Link"],
        ].forEach(([label, fn, title]) => {
          const b = document.createElement("button");
          b.type = "button"; b.className = "rpt-tb-btn";
          b.textContent = label; b.title = title; b.onclick = fn;
          bar.appendChild(b);
        });
        ta.before(bar);
      });
    },
  };

  /* ---------------- Exporter ---------------- */
  RPT.features.exporter = {
    _download(name, mime, content) {
      const blob = new Blob([content], { type: mime });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = name; a.click(); URL.revokeObjectURL(a.href);
    },
    _walkMd(nodes, depth = 0) {
      return nodes.map((n) => `${"  ".repeat(depth)}- **${n.author}** (${n.score}): ${n.body.replace(/\n/g, " ")}\n${this._walkMd(n.children, depth + 1)}`).join("");
    },
    md() {
      const p = RPT.state.post || {};
      const roots = RPT.state.tree || RPT.features.commentTree.parse();
      const out = `# ${p.title}\n\n${p.body || ""}\n\n## Comments\n\n${this._walkMd(roots)}`;
      this._download("reddit-thread.md", "text/markdown", out);
    },
    json() {
      const clean = (nodes) => nodes.map((n) => ({ id: n.id, author: n.author, score: n.score, depth: n.depth, body: n.body, children: clean(n.children) }));
      const data = { post: RPT.state.post, exportedAt: new Date().toISOString(), comments: clean(RPT.state.tree || RPT.features.commentTree.parse()) };
      this._download("reddit-thread.json", "application/json", JSON.stringify(data, null, 2));
    },
    html() {
      const esc = RPT.utils.escapeHtml;
      const walk = (nodes) => `<ul>${nodes.map((n) => `<li><strong>${esc(n.author)}</strong> (${n.score})<br>${esc(n.body)}${n.children.length ? walk(n.children) : ""}</li>`).join("")}</ul>`;
      const p = RPT.state.post || {};
      const out = `<!doctype html><meta charset="utf-8"><title>${esc(p.title)}</title><style>body{font:14px system-ui;max-width:780px;margin:2rem auto;padding:0 1rem;background:#0b0f14;color:#e6edf5}li{margin:.5rem 0}strong{color:#10b981}</style><h1>${esc(p.title)}</h1><p>${esc(p.body || "")}</p><h2>Comments</h2>${walk(RPT.state.tree || [])}`;
      this._download("reddit-thread.html", "text/html", out);
    },
  };

  /* ---------------- Gallery ---------------- */
  RPT.features.gallery = {
    open() {
      const imgs = Array.from(document.querySelectorAll('shreddit-post img, [data-testid="post-container"] img, .expando img, a.title img'))
        .map((i) => i.src).filter((s) => /^https?:/.test(s) && !/emoji|avatar|award/i.test(s));
      const unique = Array.from(new Set(imgs));
      if (!unique.length) { alert("No images detected on this page."); return; }
      let idx = 0;
      const o = document.createElement("div");
      o.className = "rpt-overlay rpt-gallery";
      o.innerHTML = `
        <button class="rpt-g-prev">‹</button>
        <img class="rpt-g-img" src="${unique[0]}">
        <button class="rpt-g-next">›</button>
        <button class="rpt-close rpt-g-close">×</button>
        <div class="rpt-g-count">1 / ${unique.length}</div>`;
      const img = o.querySelector(".rpt-g-img");
      const count = o.querySelector(".rpt-g-count");
      const go = (n) => { idx = (n + unique.length) % unique.length; img.src = unique[idx]; count.textContent = `${idx + 1} / ${unique.length}`; };
      o.querySelector(".rpt-g-prev").onclick = () => go(idx - 1);
      o.querySelector(".rpt-g-next").onclick = () => go(idx + 1);
      o.querySelector(".rpt-g-close").onclick = () => o.remove();
      document.body.appendChild(o);
    },
  };

  /* ---------------- Age warning ---------------- */
  RPT.features.ageWarning = {
    check() {
      const t = document.querySelector("time, faceplate-timeago time");
      const iso = t?.getAttribute("datetime"); if (!iso) return;
      const years = (Date.now() - new Date(iso).getTime()) / (365 * 24 * 3600 * 1000);
      if (years < 1) return;
      if (document.querySelector(".rpt-age-warn")) return;
      const b = document.createElement("div");
      b.className = "rpt-age-warn";
      b.textContent = `⏳ This post is ${years >= 2 ? Math.floor(years) + " years" : "about a year"} old.`;
      const post = document.querySelector("shreddit-post") || document.querySelector('[data-testid="post-container"]') || document.body;
      post.prepend(b);
    },
  };

  /* ---------------- Link preview ---------------- */
  RPT.features.linkPreview = {
    attach() {
      let tip;
      document.body.addEventListener("mouseover", (e) => {
        const a = e.target.closest?.("a[href^='http']");
        if (!a || a.closest(".rpt-panel, .rpt-qb")) return;
        const url = new URL(a.href);
        if (url.hostname.endsWith("reddit.com")) return;
        tip?.remove();
        tip = document.createElement("div");
        tip.className = "rpt-linktip";
        const kind = /\.(png|jpg|jpeg|gif|webp)$/i.test(url.pathname) ? "image"
          : /youtube|youtu\.be|vimeo/.test(url.hostname) ? "video" : "link";
        tip.innerHTML = `<strong>${RPT.utils.escapeHtml(url.hostname)}</strong><div class="rpt-linktip-url">${RPT.utils.escapeHtml(url.pathname + url.search)}</div><div class="rpt-linktip-kind">${kind}</div>`;
        document.body.appendChild(tip);
        const r = a.getBoundingClientRect();
        tip.style.top = `${window.scrollY + r.bottom + 6}px`;
        tip.style.left = `${window.scrollX + r.left}px`;
      });
      document.body.addEventListener("mouseout", (e) => { if (e.target.closest?.("a[href^='http']")) tip?.remove(); });
    },
  };

  /* ---------------- Personal analytics + History ---------------- */
  RPT.features.history = {
    KEY: "rpt_history", ANALYTICS_KEY: "rpt_analytics", _startedAt: Date.now(),
    async record() {
      if (!RPT.utils.isRedditThread()) return;
      const { [this.KEY]: hist = [] } = await RPT.storage.get(this.KEY);
      const entry = {
        url: location.href, title: RPT.state.post?.title || document.title,
        date: new Date().toISOString(), commentCount: RPT.state.comments.length,
        subreddit: (location.pathname.match(/\/r\/([^/]+)/) || [])[1] || null,
      };
      const filtered = hist.filter((h) => h.url !== entry.url).slice(0, 199);
      filtered.unshift(entry);
      await RPT.storage.set({ [this.KEY]: filtered });
    },
    async trackAnalytics() {
      const { [this.ANALYTICS_KEY]: a = {} } = await RPT.storage.get(this.ANALYTICS_KEY);
      a.postsViewed = (a.postsViewed || 0) + (RPT.utils.isRedditThread() ? 1 : 0);
      a.commentsRead = (a.commentsRead || 0) + RPT.state.comments.length;
      a.subreddits = a.subreddits || {};
      const sub = (location.pathname.match(/\/r\/([^/]+)/) || [])[1];
      if (sub) a.subreddits[sub] = (a.subreddits[sub] || 0) + 1;
      a.readingSeconds = (a.readingSeconds || 0) + Math.round((Date.now() - this._startedAt) / 1000);
      this._startedAt = Date.now();
      await RPT.storage.set({ [this.ANALYTICS_KEY]: a });
    },
  };

  /* ---------------- Keyboard shortcuts ---------------- */
  RPT.features.shortcuts = {
    _focusIdx: -1,
    map: [
      ["?", "Show this cheat sheet"],
      ["T", "Toggle side panel"],
      ["S", "Smart summary"],
      ["G", "Image gallery"],
      ["C", "Conversation mode"],
      ["L", "Toggle depth layers"],
      ["J", "Focus next comment"],
      ["K", "Focus previous comment"],
      ["F", "Fold focused comment"],
      ["Shift+C", "Collapse all"],
      ["Shift+E", "Expand all"],
      ["N", "Jump to newest comment"],
      ["Esc", "Close overlays"],
    ],
    init() {
      document.addEventListener("keydown", (e) => {
        const tag = (e.target?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key;
        if (k === "?") { e.preventDefault(); this.cheatsheet(); return; }
        if (k === "Escape") { document.querySelectorAll(".rpt-overlay").forEach((o) => o.remove()); return; }
        if (k === "t" || k === "T") { RPT.ui.togglePanel(); return; }
        if (k === "s") { RPT.features.summary.open(); return; }
        if (k === "g") { RPT.features.gallery.open(); return; }
        if (k === "c") { RPT.features.conversation.open(); return; }
        if (k === "l") {
          document.body.classList.toggle("rpt-layers-on");
          if (document.body.classList.contains("rpt-layers-on")) RPT.features.layers.apply();
          else RPT.features.layers.remove();
          return;
        }
        if (k === "C") { RPT.features.folding.collapseAll(); return; }
        if (k === "E") { RPT.features.folding.expandAll(); return; }
        if (k === "j") { e.preventDefault(); this._move(1); return; }
        if (k === "k") { e.preventDefault(); this._move(-1); return; }
        if (k === "f") { this._foldFocused(); return; }
        if (k === "n" || k === "N") { this._jumpToNewest(); return; }
      });
    },
    _move(dir) {
      const list = RPT.state.comments;
      if (!list.length) return;
      this._focusIdx = Math.max(0, Math.min(list.length - 1, this._focusIdx + dir));
      list.forEach((c) => c.el.classList.remove("rpt-focus"));
      const c = list[this._focusIdx];
      c.el.classList.add("rpt-focus");
      c.el.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    _foldFocused() {
      const c = RPT.state.comments[this._focusIdx];
      if (c) RPT.features.folding.toggle(c.id);
    },
    _jumpToNewest() {
      const last = RPT.state.comments[RPT.state.comments.length - 1];
      if (last) last.el.scrollIntoView({ behavior: "smooth", block: "center" });
      RPT.features.liveNew.reset();
    },
    cheatsheet() {
      if (document.querySelector(".rpt-cheat-overlay")) return;
      const o = document.createElement("div");
      o.className = "rpt-overlay rpt-cheat-overlay";
      o.innerHTML = `
        <div class="rpt-overlay-panel">
          <div class="rpt-overlay-head">
            <h2>${I.kbd} Keyboard shortcuts</h2>
            <button class="rpt-close">${I.close}</button>
          </div>
          <div class="rpt-cheat">
            <div class="rpt-cheat-grid">
              ${this.map.map(([k, d]) => `<div class="rpt-cheat-row"><span>${d}</span><kbd>${k}</kbd></div>`).join("")}
            </div>
          </div>
        </div>`;
      o.querySelector(".rpt-close").onclick = () => o.remove();
      o.addEventListener("click", (e) => { if (e.target === o) o.remove(); });
      document.body.appendChild(o);
    },
  };

  /* ---------------- Floating quick-bar + side panel ---------------- */
  RPT.ui = {
    async mount() {
      const auto = await RPT.autorun.load();
      if (!auto.quickBar) return;
      if (document.querySelector(".rpt-qb")) return;
      const bar = document.createElement("div");
      bar.className = "rpt-qb";
      const btn = (act, icon, label, sc) => `
        <button class="rpt-qb-btn" data-act="${act}" aria-label="${label}">
          ${icon}
          <span class="rpt-qb-tip">${label}${sc ? `<kbd>${sc}</kbd>` : ""}</span>
        </button>`;
      bar.innerHTML = `
        <div class="rpt-qb-brand">RPT</div>
        <div class="rpt-qb-sep"></div>
        ${btn("panel", I.panel, "Panel", "T")}
        ${btn("summary", I.summary, "Smart summary", "S")}
        ${btn("conv", I.chat, "Conversation", "C")}
        ${btn("gallery", I.image, "Gallery", "G")}
        ${btn("fold", I.fold, "Collapse all", "⇧C")}
        <div class="rpt-qb-sep"></div>
        <button class="rpt-qb-btn" data-act="new" aria-label="New comments">
          ${I.bell}
          <span class="rpt-qb-badge" style="display:none">0</span>
          <span class="rpt-qb-tip">New comments<kbd>N</kbd></span>
        </button>
        ${btn("kbd", I.kbd, "Shortcuts", "?")}
        ${btn("close", I.close, "Hide toolbar")}`;
      bar.addEventListener("click", (e) => {
        const b = e.target.closest?.("[data-act]");
        if (!b) return;
        const a = b.dataset.act;
        if (a === "panel")   this.togglePanel();
        else if (a === "summary") RPT.features.summary.open();
        else if (a === "conv")    RPT.features.conversation.open();
        else if (a === "gallery") RPT.features.gallery.open();
        else if (a === "fold")    RPT.features.folding.collapseAll();
        else if (a === "new")     RPT.features.shortcuts._jumpToNewest();
        else if (a === "kbd")     RPT.features.shortcuts.cheatsheet();
        else if (a === "close")   { bar.remove(); RPT.autorun.load().then((v) => RPT.autorun.save({ ...v, quickBar: false })); }
      });
      document.body.appendChild(bar);
    },
    updateNewBadge(n) {
      const badge = document.querySelector(".rpt-qb-badge");
      if (!badge) return;
      if (n > 0) { badge.textContent = n > 99 ? "99+" : String(n); badge.style.display = "grid"; }
      else badge.style.display = "none";
    },
    togglePanel() {
      let p = document.querySelector(".rpt-panel");
      if (p) { p.remove(); return; }
      p = document.createElement("aside");
      p.className = "rpt-panel";
      p.innerHTML = this.panelHTML();
      document.body.appendChild(p);
      this.wirePanel(p);
    },
    panelHTML() {
      return `
        <header class="rpt-panel-head">
          <div class="rpt-brand"><span class="rpt-brand-dot"></span>Reddit Power Toolkit</div>
          <button class="rpt-panel-close" aria-label="Close">×</button>
        </header>
        <div class="rpt-chips">
          <span class="rpt-chip" data-chip="op">OP only</span>
          <span class="rpt-chip rpt-chip-blue" data-chip="mod">Mod only</span>
          <span class="rpt-chip" data-chip="awarded">Awarded</span>
          <span style="flex:1"></span>
          <span class="rpt-chip" data-chip="__clear">Reset</span>
        </div>
        <nav class="rpt-tabs">
          <button data-tab="tree" class="active">${I.tree} Tree</button>
          <button data-tab="tools">${I.panel} Tools</button>
          <button data-tab="collect">${I.star} Saved</button>
          <button data-tab="filters">${I.filter} Clean</button>
          <button data-tab="highlight">${I.tag} Keywords</button>
          <button data-tab="stats">${I.stats} Stats</button>
          <button data-tab="export">${I.export} Export</button>
        </nav>
        <section class="rpt-tab-body">
          <div data-panel="tree" class="rpt-tabpane active">
            <input class="rpt-search-box" placeholder="Search comments by author or text…">
            <div class="rpt-tree-container"></div>
          </div>
          <div data-panel="tools" class="rpt-tabpane">
            <div class="rpt-section-title">Views</div>
            <div class="rpt-btnrow">
              <button data-act="summary">${I.summary}<div><strong>Smart summary</strong><span class="rpt-btn-sub">Top voted · discussed · controversial</span></div></button>
              <button data-act="conv">${I.chat}<div><strong>Conversation mode</strong><span class="rpt-btn-sub">Chat-style thread view</span></div></button>
              <button data-act="gallery">${I.image}<div><strong>Image gallery</strong><span class="rpt-btn-sub">Full-screen with prev / next</span></div></button>
              <button data-act="layers">${I.layers}<div><strong>Toggle depth layers</strong><span class="rpt-btn-sub">Colored depth indicators</span></div></button>
            </div>
            <div class="rpt-section-title">Folding</div>
            <div class="rpt-btnrow">
              <button data-act="collapse">${I.fold}Collapse all comments</button>
              <button data-act="expand">${I.fold}Expand all comments</button>
            </div>
            <div class="rpt-section-title">Automation</div>
            <div id="rpt-autorun-list"></div>
            <div class="rpt-section-title">Help</div>
            <div class="rpt-btnrow">
              <button data-act="kbd">${I.kbd}Keyboard shortcuts</button>
              <button data-act="analytics">${I.stats}Open analytics dashboard</button>
              <button data-act="settings">${I.settings}Open settings</button>
            </div>
          </div>
          <div data-panel="collect" class="rpt-tabpane">
            <p class="rpt-muted">Comments you've starred with the ★ button. Stored locally.</p>
            <div id="rpt-collect-list"></div>
          </div>
          <div data-panel="filters" class="rpt-tabpane">
            <p class="rpt-muted">Hide noisy comments on every Reddit thread.</p>
            <label><input type="checkbox" data-f="hideDeleted"> Hide deleted / removed</label>
            <label><input type="checkbox" data-f="hideEmpty"> Hide empty</label>
            <label><input type="checkbox" data-f="hideBots"> Hide bots / AutoModerator</label>
            <label><input type="checkbox" data-f="hideShort"> Hide very short comments</label>
            <label><input type="checkbox" data-f="hideLowScore"> Hide low-score comments (&lt; 1)</label>
          </div>
          <div data-panel="highlight" class="rpt-tabpane">
            <p class="rpt-muted">Comma-separated keywords, highlighted everywhere on Reddit.</p>
            <textarea class="rpt-kw" rows="3" placeholder="docker, kubernetes, rust"></textarea>
            <button class="rpt-kw-save">Save keywords</button>
          </div>
          <div data-panel="stats" class="rpt-tabpane rpt-stats"></div>
          <div data-panel="export" class="rpt-tabpane">
            <p class="rpt-muted">Export this thread to a file, entirely locally.</p>
            <div class="rpt-btnrow">
              <button data-act="md">${I.export}Export as Markdown</button>
              <button data-act="json">${I.export}Export as JSON</button>
              <button data-act="html">${I.export}Export as HTML</button>
            </div>
          </div>
        </section>`;
    },
    async wirePanel(p) {
      RPT.features.commentTree.parse();
      RPT.features.commentTree.renderInto(p.querySelector(".rpt-tree-container"));
      const search = p.querySelector(".rpt-search-box");
      search.oninput = () => {
        const q = search.value.toLowerCase();
        p.querySelectorAll(".rpt-tree li").forEach((li) => {
          li.style.display = !q || li.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      };
      p.querySelector(".rpt-panel-close").onclick = () => p.remove();
      p.querySelectorAll(".rpt-chip").forEach((ch) => {
        ch.onclick = () => {
          const k = ch.dataset.chip;
          if (k === "__clear") { RPT.features.chips.active.clear(); RPT.features.chips.apply(); }
          else RPT.features.chips.toggle(k);
          p.querySelectorAll(".rpt-chip").forEach((c) => {
            if (c.dataset.chip === "__clear") return;
            c.classList.toggle("rpt-active", RPT.features.chips.active.has(c.dataset.chip));
          });
        };
      });
      p.querySelectorAll(".rpt-tabs button").forEach((b) => {
        b.onclick = () => {
          p.querySelectorAll(".rpt-tabs button").forEach((x) => x.classList.remove("active"));
          p.querySelectorAll(".rpt-tabpane").forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          p.querySelector(`[data-panel="${b.dataset.tab}"]`).classList.add("active");
          if (b.dataset.tab === "stats") this.renderStats(p);
          if (b.dataset.tab === "collect") this.renderCollections(p);
          if (b.dataset.tab === "tools") this.renderAutorun(p);
        };
      });
      p.querySelectorAll("[data-act]").forEach((b) => {
        b.onclick = () => {
          const a = b.dataset.act;
          if (a === "summary") RPT.features.summary.open();
          if (a === "conv") RPT.features.conversation.open();
          if (a === "gallery") RPT.features.gallery.open();
          if (a === "layers") {
            document.body.classList.toggle("rpt-layers-on");
            if (document.body.classList.contains("rpt-layers-on")) RPT.features.layers.apply();
            else RPT.features.layers.remove();
          }
          if (a === "collapse") RPT.features.folding.collapseAll();
          if (a === "expand") RPT.features.folding.expandAll();
          if (a === "md") RPT.features.exporter.md();
          if (a === "json") RPT.features.exporter.json();
          if (a === "html") RPT.features.exporter.html();
          if (a === "kbd") RPT.features.shortcuts.cheatsheet();
          if (a === "settings") chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
          if (a === "analytics") chrome.runtime.sendMessage({ type: "OPEN_ANALYTICS" });
        };
      });
      const f = await RPT.features.cleaner.load();
      p.querySelectorAll("[data-f]").forEach((cb) => {
        cb.checked = !!f[cb.dataset.f];
        cb.onchange = async () => {
          const cur = await RPT.features.cleaner.load();
          cur[cb.dataset.f] = cb.checked;
          await RPT.features.cleaner.save(cur);
          RPT.features.cleaner.apply();
        };
      });
      const kw = await RPT.features.highlighter.get();
      p.querySelector(".rpt-kw").value = kw.join(", ");
      p.querySelector(".rpt-kw-save").onclick = async () => {
        const list = p.querySelector(".rpt-kw").value.split(",").map((s) => s.trim()).filter(Boolean);
        await RPT.features.highlighter.set(list);
        RPT.features.highlighter.apply();
      };
      this.renderAutorun(p);
    },
    async renderAutorun(p) {
      const host = p.querySelector("#rpt-autorun-list");
      if (!host) return;
      const auto = await RPT.autorun.load();
      const items = [
        ["cleaner", "Auto-apply Cleaner filters"],
        ["highlighter", "Auto-apply keyword highlights"],
        ["tags", "Auto-apply user tags"],
        ["ageWarning", "Show old-thread warning"],
        ["saveButtons", "Inline ★ save buttons on comments"],
        ["liveNew", "Live new-comment indicator"],
      ];
      host.innerHTML = items.map(([k, label]) =>
        `<label><input type="checkbox" data-auto="${k}" ${auto[k] ? "checked" : ""}> ${label}</label>`
      ).join("");
      host.querySelectorAll("[data-auto]").forEach((cb) => {
        cb.onchange = async () => {
          const cur = await RPT.autorun.load();
          cur[cb.dataset.auto] = cb.checked;
          await RPT.autorun.save(cur);
        };
      });
    },
    async renderCollections(p) {
      const host = p.querySelector("#rpt-collect-list");
      const all = await RPT.features.collections.list();
      if (!all.length) {
        host.innerHTML = `<p class="rpt-empty">No saved comments yet. Click the ★ button on any Reddit comment to save it here.</p>`;
        return;
      }
      host.innerHTML = all.map((c) => `
        <div class="rpt-collect-item" data-id="${RPT.utils.escapeHtml(c.id)}">
          <button class="rpt-collect-remove" title="Remove">×</button>
          <a href="${RPT.utils.escapeHtml(c.url)}" target="_blank" rel="noopener">u/${RPT.utils.escapeHtml(c.author)}</a>
          <p>${RPT.utils.escapeHtml(c.body.slice(0, 200))}${c.body.length > 200 ? "…" : ""}</p>
        </div>`).join("");
      host.querySelectorAll(".rpt-collect-remove").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          await RPT.features.collections.remove(btn.parentElement.dataset.id);
          this.renderCollections(p);
        };
      });
    },
    renderStats(p) {
      RPT.features.commentTree.parse();
      const s = RPT.features.analytics.compute();
      const h = RPT.features.health.analyze();
      const el = p.querySelector('[data-panel="stats"]');
      if (!s) { el.innerHTML = '<p class="rpt-empty">No comments on this page.</p>'; return; }
      el.innerHTML = `
        <div class="rpt-card"><div class="rpt-k">Comments loaded</div><div class="rpt-v">${s.total}</div></div>
        <div class="rpt-card"><div class="rpt-k">Avg length</div><div class="rpt-v">${s.avgLength} chars</div></div>
        <div class="rpt-card"><div class="rpt-k">Deepest chain</div><div class="rpt-v">${s.deepest}</div></div>
        <div class="rpt-card"><div class="rpt-k">Longest comment</div><div class="rpt-v">${s.longest.author} — ${s.longest.length} chars</div></div>
        <div class="rpt-card"><div class="rpt-k">Most replied</div><div class="rpt-v">${s.mostReplied.map(([u, n]) => `${u} (${n})`).join(", ") || "—"}</div></div>
        <div class="rpt-card"><div class="rpt-k">Top branches</div><div class="rpt-v">${s.branches.map((b) => `${b.author} (${b.size})`).join(", ") || "—"}</div></div>
        <div class="rpt-card rpt-health">
          <div class="rpt-k">Thread health</div>
          <div class="rpt-v">${h.score}/100</div>
          <div class="rpt-health-bar"><div class="rpt-health-fill" style="width:${h.score}%"></div></div>
          <ul>${h.notes.map((n) => `<li>${RPT.utils.escapeHtml(n)}</li>`).join("")}</ul>
        </div>`;
    },
  };

  /* ---------------- First-run tour ---------------- */
  RPT.tour = {
    KEY: "rpt_tour_seen",
    async maybeShow() {
      const { [this.KEY]: seen } = await RPT.storage.get(this.KEY);
      if (seen) return;
      if (!RPT.utils.isRedditThread()) return;
      const gen = await RPT.general.load();
      if (!gen.showOnboarding) return;
      const t = window.RPT_I18N ? (k) => window.RPT_I18N.t(k) : (k) => k;
      const wrap = document.createElement("div");
      wrap.className = "rpt-onboard";
      wrap.innerHTML = `
        <div class="rpt-onboard-pulse"></div>
        <div class="rpt-onboard-arrow"></div>
        <div class="rpt-onboard-card">
          <h4>${t("onboard_title")}</h4>
          <p>${t("onboard_body")}</p>
          <div class="rpt-onboard-actions">
            <button data-act="dismiss">${t("onboard_ok")}</button>
            <button class="rpt-primary-btn" data-act="tour">${t("onboard_open")}</button>
          </div>
        </div>`;
      wrap.addEventListener("click", async (e) => {
        const b = e.target.closest?.("button"); if (!b) return;
        await RPT.storage.set({ [this.KEY]: true });
        if (b.dataset.act === "tour") RPT.ui.togglePanel();
        wrap.remove();
      });
      document.body.appendChild(wrap);
      setTimeout(() => wrap.remove(), 40000);
    },
  };

  /* ---------------- Bootstrap ---------------- */
  const runAll = RPT.utils.debounce(async () => {
    const auto = await RPT.autorun.load();
    RPT.features.commentTree.parse();
    RPT.features.layers.remove();
    if (document.body.classList.contains("rpt-layers-on")) RPT.features.layers.apply();
    await RPT.features.folding.restore();
    if (auto.cleaner) await RPT.features.cleaner.apply();
    if (auto.highlighter) await RPT.features.highlighter.apply();
    if (auto.tags) await RPT.features.userTags.apply();
    await RPT.features.collections.attach();
    RPT.features.toolbar.attach();
    if (auto.ageWarning) RPT.features.ageWarning.check();
    RPT.features.history.record();
    RPT.features.history.trackAnalytics();
  }, 400);

  const boot = () => {
    // Ensure theme + i18n are ready for injected UI
    window.RPT_THEME?.load();
    window.RPT_I18N?.load();
    RPT.ui.mount();
    RPT.features.linkPreview.attach();
    RPT.features.shortcuts.init();
    RPT.features.liveNew.start();
    RPT.tour.maybeShow();
    // Auto-open the panel on first visit to a comment thread (opt-out via Options)
    (async () => {
      if (!RPT.utils.isRedditThread()) return;
      const gen = await RPT.general.load();
      if (!gen.autoOpenPanel) return;
      const KEY = "rpt_auto_open_seen";
      const { [KEY]: seen } = await RPT.storage.get(KEY);
      if (seen) return;
      await RPT.storage.set({ [KEY]: true });
      setTimeout(() => {
        if (!document.querySelector(".rpt-panel")) RPT.ui.togglePanel();
      }, 900);
    })();
    runAll();
    new MutationObserver(runAll).observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
