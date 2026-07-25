/*
 * Reddit Power Toolkit — content script (bundled, no build step)
 *
 * Modular architecture — each feature is an IIFE-module attached to the
 * global RPT namespace, so features stay decoupled and Reddit DOM changes
 * only affect a single selector map (RPT.selectors).
 *
 *   RPT.storage       — chrome.storage.local wrapper (Promise-based)
 *   RPT.selectors     — centralised Reddit DOM selectors
 *   RPT.utils         — small helpers (debounce, escapeHtml, ...)
 *   RPT.state         — cached parsed comment tree for the current page
 *   RPT.features.*    — commentTree, cleaner, folding, conversation,
 *                       highlighter, userTags, toolbar, exporter,
 *                       gallery, linkPreview, ageWarning, history,
 *                       analytics, health, layers
 *   RPT.ui            — floating action button + side panel
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
    get(keys) {
      return new Promise((r) => chrome.storage.local.get(keys, r));
    },
    set(obj) {
      return new Promise((r) => chrome.storage.local.set(obj, r));
    },
  };

  /* ---------------- selectors ----------------
   * Reddit ships two DOM variants (old and sh/new "shreddit"). We keep
   * every selector in one place so DOM changes touch this map only.
   */
  RPT.selectors = {
    isOldReddit: () => location.hostname === "old.reddit.com",
    postTitle: () =>
      document.querySelector(
        'shreddit-post [slot="title"], shreddit-post h1, .top-matter a.title, [data-testid="post-container"] h1'
      ),
    postBody: () =>
      document.querySelector(
        'shreddit-post [slot="post-media-container"], shreddit-post [slot="text-body"], .expando .usertext-body, [data-testid="post-container"] [data-click-id="text"]'
      ),
    commentNodes: () => {
      // shreddit-comment covers new & sh reddit; .comment covers old reddit
      return document.querySelectorAll("shreddit-comment, .thing.comment");
    },
    commentAuthor(el) {
      return (
        el.getAttribute?.("author") ||
        el.dataset?.author ||
        el.querySelector?.("a.author")?.textContent ||
        "unknown"
      );
    },
    commentBody(el) {
      const md =
        el.querySelector?.('[slot="comment"]') ||
        el.querySelector?.(".md") ||
        el.querySelector?.(".usertext-body");
      return md?.innerText?.trim() || "";
    },
    commentScore(el) {
      const s =
        el.getAttribute?.("score") ||
        el.dataset?.score ||
        el.querySelector?.(".score.unvoted")?.getAttribute("title");
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : 0;
    },
    commentDepth(el) {
      const d = el.getAttribute?.("depth") ?? el.dataset?.depth;
      if (d != null) return parseInt(d, 10) || 0;
      // fallback: count ancestor comments (old reddit)
      let depth = 0;
      let p = el.parentElement;
      while (p) {
        if (p.classList?.contains("comment") || p.tagName === "SHREDDIT-COMMENT") depth++;
        p = p.parentElement;
      }
      return depth;
    },
    commentId(el) {
      return (
        el.getAttribute?.("thingid") ||
        el.getAttribute?.("id") ||
        el.dataset?.fullname ||
        el.id ||
        Math.random().toString(36).slice(2)
      );
    },
  };

  /* ---------------- utils ---------------- */
  RPT.utils = {
    debounce(fn, ms = 250) {
      let t;
      return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...a), ms);
      };
    },
    escapeHtml(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
      );
    },
    isRedditThread() {
      return /\/(r|user)\/[^/]+\/comments\//.test(location.pathname);
    },
    fmtDate(ts) {
      try {
        return new Date(ts).toLocaleString();
      } catch {
        return "";
      }
    },
  };

  /* ---------------- Comment Tree parser (feature 1) ---------------- */
  RPT.features.commentTree = {
    parse() {
      const nodes = Array.from(RPT.selectors.commentNodes());
      const list = nodes.map((el) => ({
        el,
        id: RPT.selectors.commentId(el),
        author: RPT.selectors.commentAuthor(el),
        body: RPT.selectors.commentBody(el),
        score: RPT.selectors.commentScore(el),
        depth: RPT.selectors.commentDepth(el),
        children: [],
      }));

      // Rebuild parent/child via depth stack. Reddit renders top-down, so
      // the last node with depth = d-1 is the parent of a node with depth d.
      const stack = [];
      const roots = [];
      list.forEach((c) => {
        while (stack.length && stack[stack.length - 1].depth >= c.depth) stack.pop();
        const parent = stack[stack.length - 1];
        if (parent) parent.children.push(c);
        else roots.push(c);
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
        container.innerHTML =
          '<p class="rpt-empty">No comments detected on this page.</p>';
        return;
      }
      const ul = document.createElement("ul");
      ul.className = "rpt-tree";
      const walk = (nodes, parent) => {
        nodes.forEach((n) => {
          const li = document.createElement("li");
          li.className = "rpt-tree-node";
          li.innerHTML = `
            <div class="rpt-tree-item" data-id="${RPT.utils.escapeHtml(n.id)}">
              <span class="rpt-author">${RPT.utils.escapeHtml(n.author)}</span>
              <span class="rpt-score">${n.score}</span>
              <span class="rpt-preview">${RPT.utils.escapeHtml(
                n.body.slice(0, 80)
              )}</span>
            </div>`;
          li.querySelector(".rpt-tree-item").addEventListener("click", () => {
            n.el.scrollIntoView({ behavior: "smooth", block: "center" });
            n.el.classList.add("rpt-flash");
            setTimeout(() => n.el.classList.remove("rpt-flash"), 1500);
          });
          if (n.children.length) {
            const child = document.createElement("ul");
            walk(n.children, child);
            li.appendChild(child);
          }
          parent.appendChild(li);
        });
      };
      walk(roots, ul);
      container.appendChild(ul);
    },
  };

  /* ---------------- Layers (feature 4) ---------------- */
  RPT.features.layers = {
    apply() {
      RPT.state.comments.forEach((c) => {
        c.el.classList.add("rpt-layer", `rpt-layer-${Math.min(c.depth, 8)}`);
      });
    },
    remove() {
      document
        .querySelectorAll(".rpt-layer")
        .forEach((el) => {
          el.classList.remove("rpt-layer");
          for (let i = 0; i <= 8; i++) el.classList.remove(`rpt-layer-${i}`);
        });
    },
  };

  /* ---------------- Folding (feature 2) ---------------- */
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
    async collapseAll() {
      RPT.state.comments.forEach((c) => c.el.classList.add("rpt-collapsed"));
    },
    async expandAll() {
      RPT.state.comments.forEach((c) => c.el.classList.remove("rpt-collapsed"));
    },
    async restore() {
      const { [this.STORAGE_KEY]: map = {} } = await RPT.storage.get(this.STORAGE_KEY);
      const saved = map[location.pathname] || {};
      RPT.state.comments.forEach((c) => {
        if (saved[c.id]) c.el.classList.add("rpt-collapsed");
      });
    },
  };

  /* ---------------- Cleaner filters (feature 5) ---------------- */
  RPT.features.cleaner = {
    KEY: "rpt_filters",
    defaults: {
      hideDeleted: false,
      hideEmpty: false,
      hideBots: false,
      hideShort: false,
      minLength: 15,
      hideLowScore: false,
      minScore: 1,
    },
    async load() {
      const { [this.KEY]: f } = await RPT.storage.get(this.KEY);
      return { ...this.defaults, ...(f || {}) };
    },
    async save(f) {
      await RPT.storage.set({ [this.KEY]: f });
    },
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

  /* ---------------- Conversation mode (feature 3) ---------------- */
  RPT.features.conversation = {
    open() {
      const overlay = document.createElement("div");
      overlay.className = "rpt-overlay";
      overlay.innerHTML = `
        <div class="rpt-overlay-panel rpt-convo">
          <div class="rpt-overlay-head">
            <h2>Conversation Mode</h2>
            <button class="rpt-close">×</button>
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
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
      });
      document.body.appendChild(overlay);
    },
  };

  /* ---------------- Statistics + Health (features 6 & 7) ---------------- */
  RPT.features.analytics = {
    compute() {
      const cs = RPT.state.comments;
      if (!cs.length) return null;
      const lengths = cs.map((c) => c.body.length);
      const total = lengths.reduce((a, b) => a + b, 0);
      const avg = Math.round(total / cs.length);
      const longest = cs.reduce((a, b) => (a.body.length >= b.body.length ? a : b));
      // most replied users (parents whose children count high)
      const parentReplyCounts = {};
      const walk = (nodes) => {
        nodes.forEach((n) => {
          if (n.children.length) {
            parentReplyCounts[n.author] =
              (parentReplyCounts[n.author] || 0) + n.children.length;
          }
          walk(n.children);
        });
      };
      walk(RPT.state.tree || []);
      const mostReplied = Object.entries(parentReplyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      const deepest = cs.reduce((m, c) => Math.max(m, c.depth), 0);
      // most active branches — roots with the most descendants
      const countDesc = (n) =>
        n.children.length + n.children.reduce((s, c) => s + countDesc(c), 0);
      const branches = (RPT.state.tree || [])
        .map((r) => ({ author: r.author, size: countDesc(r) + 1 }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);
      return {
        total: cs.length,
        avgLength: avg,
        longest: {
          author: longest.author,
          length: longest.body.length,
          preview: longest.body.slice(0, 140),
        },
        mostReplied,
        deepest,
        branches,
      };
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
      const score = Math.max(
        0,
        Math.min(
          100,
          40 + deepest * 4 + withReplies * 3 - dead - controversial * 2
        )
      );
      return { score, notes };
    },
  };

  /* ---------------- Highlighter (feature 8) ---------------- */
  RPT.features.highlighter = {
    KEY: "rpt_keywords",
    async get() {
      const { [this.KEY]: k = [] } = await RPT.storage.get(this.KEY);
      return k;
    },
    async set(list) {
      await RPT.storage.set({ [this.KEY]: list });
    },
    async apply() {
      const list = await this.get();
      // remove old highlights
      document.querySelectorAll(".rpt-hl").forEach((n) => {
        const t = document.createTextNode(n.textContent);
        n.replaceWith(t);
      });
      if (!list.length) return;
      const rx = new RegExp(
        "(" + list.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")",
        "gi"
      );
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(n) {
            if (!n.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
            const p = n.parentElement;
            if (!p) return NodeFilter.FILTER_REJECT;
            if (p.closest(".rpt-panel, .rpt-overlay, script, style, textarea, input"))
              return NodeFilter.FILTER_REJECT;
            return rx.test(n.nodeValue)
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          },
        }
      );
      const targets = [];
      let cur;
      while ((cur = walker.nextNode())) targets.push(cur);
      targets.forEach((t) => {
        const span = document.createElement("span");
        span.innerHTML = t.nodeValue.replace(rx, '<mark class="rpt-hl">$1</mark>');
        t.replaceWith(span);
      });
    },
  };

  /* ---------------- User color tags (feature 9) ---------------- */
  RPT.features.userTags = {
    KEY: "rpt_user_tags",
    async get() {
      const { [this.KEY]: t = {} } = await RPT.storage.get(this.KEY);
      return t;
    },
    async set(user, label, color) {
      const t = await this.get();
      if (!label) delete t[user];
      else t[user] = { label, color };
      await RPT.storage.set({ [this.KEY]: t });
      this.apply();
    },
    async apply() {
      const tags = await this.get();
      document.querySelectorAll(".rpt-user-tag").forEach((n) => n.remove());
      RPT.state.comments.forEach((c) => {
        const t = tags[c.author];
        if (!t) return;
        const authorEl =
          c.el.querySelector("a[href*='/user/']") ||
          c.el.querySelector("[slot='authorName']");
        if (!authorEl) return;
        const badge = document.createElement("span");
        badge.className = "rpt-user-tag";
        badge.textContent = t.label;
        badge.style.background = t.color || "#6366f1";
        authorEl.after(badge);
      });
    },
  };

  /* ---------------- Formatting toolbar (feature 10) ---------------- */
  RPT.features.toolbar = {
    attach() {
      const areas = document.querySelectorAll("textarea");
      areas.forEach((ta) => {
        if (ta.dataset.rptToolbar) return;
        ta.dataset.rptToolbar = "1";
        const bar = document.createElement("div");
        bar.className = "rpt-toolbar";
        const wrap = (before, after = before) => {
          const s = ta.selectionStart;
          const e = ta.selectionEnd;
          const sel = ta.value.slice(s, e) || "text";
          ta.value =
            ta.value.slice(0, s) + before + sel + after + ta.value.slice(e);
          ta.focus();
        };
        const buttons = [
          ["B", () => wrap("**"), "Bold"],
          ["i", () => wrap("*"), "Italic"],
          ["</>", () => wrap("`"), "Code"],
          ["❝", () => wrap("\n> ", ""), "Quote"],
          ["Spoiler", () => wrap(">!", "!<"), "Spoiler"],
          ["Link", () => wrap("[", "](url)"), "Link"],
        ];
        buttons.forEach(([label, fn, title]) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "rpt-tb-btn";
          b.textContent = label;
          b.title = title;
          b.onclick = fn;
          bar.appendChild(b);
        });
        ta.before(bar);
      });
    },
  };

  /* ---------------- Exporter (feature 11) ---------------- */
  RPT.features.exporter = {
    _download(name, mime, content) {
      const blob = new Blob([content], { type: mime });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    _walkMd(nodes, depth = 0) {
      return nodes
        .map(
          (n) =>
            `${"  ".repeat(depth)}- **${n.author}** (${n.score}): ${n.body.replace(
              /\n/g,
              " "
            )}\n${this._walkMd(n.children, depth + 1)}`
        )
        .join("");
    },
    md() {
      const p = RPT.state.post || {};
      const roots = RPT.state.tree || RPT.features.commentTree.parse();
      const out = `# ${p.title}\n\n${p.body || ""}\n\n## Comments\n\n${this._walkMd(
        roots
      )}`;
      this._download("reddit-thread.md", "text/markdown", out);
    },
    json() {
      const clean = (nodes) =>
        nodes.map((n) => ({
          id: n.id,
          author: n.author,
          score: n.score,
          depth: n.depth,
          body: n.body,
          children: clean(n.children),
        }));
      const data = {
        post: RPT.state.post,
        exportedAt: new Date().toISOString(),
        comments: clean(RPT.state.tree || RPT.features.commentTree.parse()),
      };
      this._download(
        "reddit-thread.json",
        "application/json",
        JSON.stringify(data, null, 2)
      );
    },
    html() {
      const esc = RPT.utils.escapeHtml;
      const walk = (nodes) =>
        `<ul>${nodes
          .map(
            (n) =>
              `<li><strong>${esc(n.author)}</strong> (${n.score})<br>${esc(
                n.body
              )}${n.children.length ? walk(n.children) : ""}</li>`
          )
          .join("")}</ul>`;
      const p = RPT.state.post || {};
      const out = `<!doctype html><meta charset="utf-8"><title>${esc(
        p.title
      )}</title><style>body{font:14px system-ui;max-width:780px;margin:2rem auto;padding:0 1rem}li{margin:.5rem 0}</style><h1>${esc(
        p.title
      )}</h1><p>${esc(p.body || "")}</p><h2>Comments</h2>${walk(
        RPT.state.tree || []
      )}`;
      this._download("reddit-thread.html", "text/html", out);
    },
  };

  /* ---------------- Gallery (feature 12) ---------------- */
  RPT.features.gallery = {
    open() {
      const imgs = Array.from(
        document.querySelectorAll(
          'shreddit-post img, [data-testid="post-container"] img, .expando img, a.title img'
        )
      )
        .map((i) => i.src)
        .filter((s) => /^https?:/.test(s) && !/emoji|avatar|award/i.test(s));
      const unique = Array.from(new Set(imgs));
      if (!unique.length) {
        alert("No images detected on this page.");
        return;
      }
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
      const go = (n) => {
        idx = (n + unique.length) % unique.length;
        img.src = unique[idx];
        count.textContent = `${idx + 1} / ${unique.length}`;
      };
      o.querySelector(".rpt-g-prev").onclick = () => go(idx - 1);
      o.querySelector(".rpt-g-next").onclick = () => go(idx + 1);
      o.querySelector(".rpt-g-close").onclick = () => o.remove();
      document.body.appendChild(o);
    },
  };

  /* ---------------- Age warning (feature 13) ---------------- */
  RPT.features.ageWarning = {
    check() {
      const t = document.querySelector("time, faceplate-timeago time");
      const iso = t?.getAttribute("datetime");
      if (!iso) return;
      const ageMs = Date.now() - new Date(iso).getTime();
      const years = ageMs / (365 * 24 * 3600 * 1000);
      if (years < 1) return;
      if (document.querySelector(".rpt-age-warn")) return;
      const b = document.createElement("div");
      b.className = "rpt-age-warn";
      b.textContent = `⏳ This post is ${
        years >= 2 ? Math.floor(years) + " years" : "about a year"
      } old.`;
      const post =
        document.querySelector("shreddit-post") ||
        document.querySelector('[data-testid="post-container"]') ||
        document.body;
      post.prepend(b);
    },
  };

  /* ---------------- Link preview (feature 14) ---------------- */
  RPT.features.linkPreview = {
    attach() {
      let tip;
      document.body.addEventListener("mouseover", (e) => {
        const a = e.target.closest?.("a[href^='http']");
        if (!a || a.closest(".rpt-panel")) return;
        const url = new URL(a.href);
        if (url.hostname.endsWith("reddit.com")) return;
        tip?.remove();
        tip = document.createElement("div");
        tip.className = "rpt-linktip";
        const kind = /\.(png|jpg|jpeg|gif|webp)$/i.test(url.pathname)
          ? "image"
          : /youtube|youtu\.be|vimeo/.test(url.hostname)
          ? "video"
          : "link";
        tip.innerHTML = `<strong>${RPT.utils.escapeHtml(
          url.hostname
        )}</strong><div class="rpt-linktip-url">${RPT.utils.escapeHtml(
          url.pathname + url.search
        )}</div><div class="rpt-linktip-kind">${kind}</div>`;
        document.body.appendChild(tip);
        const r = a.getBoundingClientRect();
        tip.style.top = `${window.scrollY + r.bottom + 6}px`;
        tip.style.left = `${window.scrollX + r.left}px`;
      });
      document.body.addEventListener("mouseout", (e) => {
        if (e.target.closest?.("a[href^='http']")) tip?.remove();
      });
    },
  };

  /* ---------------- Personal analytics + History (features 15 & 16) ---------------- */
  RPT.features.history = {
    KEY: "rpt_history",
    ANALYTICS_KEY: "rpt_analytics",
    _startedAt: Date.now(),
    async record() {
      if (!RPT.utils.isRedditThread()) return;
      const { [this.KEY]: hist = [] } = await RPT.storage.get(this.KEY);
      const entry = {
        url: location.href,
        title: RPT.state.post?.title || document.title,
        date: new Date().toISOString(),
        commentCount: RPT.state.comments.length,
        subreddit: (location.pathname.match(/\/r\/([^/]+)/) || [])[1] || null,
      };
      // dedupe by url (last visit wins)
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
      a.readingSeconds =
        (a.readingSeconds || 0) + Math.round((Date.now() - this._startedAt) / 1000);
      this._startedAt = Date.now();
      await RPT.storage.set({ [this.ANALYTICS_KEY]: a });
    },
  };

  /* ---------------- Floating button + side panel UI ---------------- */
  RPT.ui = {
    mount() {
      if (document.querySelector(".rpt-fab")) return;
      const fab = document.createElement("button");
      fab.className = "rpt-fab";
      fab.title = "Reddit Power Toolkit";
      fab.innerHTML = "RPT";
      fab.onclick = () => this.togglePanel();
      document.body.appendChild(fab);
    },
    togglePanel() {
      let p = document.querySelector(".rpt-panel");
      if (p) {
        p.remove();
        return;
      }
      p = document.createElement("aside");
      p.className = "rpt-panel";
      p.innerHTML = this.panelHTML();
      document.body.appendChild(p);
      this.wirePanel(p);
    },
    panelHTML() {
      return `
        <header class="rpt-panel-head">
          <div class="rpt-brand">Reddit Power Toolkit</div>
          <button class="rpt-panel-close">×</button>
        </header>
        <nav class="rpt-tabs">
          <button data-tab="tree" class="active">Tree</button>
          <button data-tab="tools">Tools</button>
          <button data-tab="filters">Cleaner</button>
          <button data-tab="highlight">Keywords</button>
          <button data-tab="stats">Stats</button>
          <button data-tab="export">Export</button>
        </nav>
        <section class="rpt-tab-body">
          <div data-panel="tree" class="rpt-tabpane active"></div>
          <div data-panel="tools" class="rpt-tabpane">
            <div class="rpt-btnrow">
              <button data-act="conv">Conversation mode</button>
              <button data-act="gallery">Image gallery</button>
              <button data-act="layers">Toggle depth layers</button>
              <button data-act="collapse">Collapse all comments</button>
              <button data-act="expand">Expand all comments</button>
              <button data-act="analytics">Open analytics dashboard</button>
            </div>
          </div>
          <div data-panel="filters" class="rpt-tabpane">
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
            <div class="rpt-btnrow">
              <button data-act="md">Export as Markdown</button>
              <button data-act="json">Export as JSON</button>
              <button data-act="html">Export as HTML</button>
            </div>
          </div>
        </section>`;
    },
    async wirePanel(p) {
      RPT.features.commentTree.parse();
      RPT.features.commentTree.renderInto(p.querySelector('[data-panel="tree"]'));
      p.querySelector(".rpt-panel-close").onclick = () => p.remove();
      p.querySelectorAll(".rpt-tabs button").forEach((b) => {
        b.onclick = () => {
          p.querySelectorAll(".rpt-tabs button").forEach((x) =>
            x.classList.remove("active")
          );
          p.querySelectorAll(".rpt-tabpane").forEach((x) =>
            x.classList.remove("active")
          );
          b.classList.add("active");
          p.querySelector(`[data-panel="${b.dataset.tab}"]`).classList.add("active");
          if (b.dataset.tab === "stats") this.renderStats(p);
        };
      });
      p.querySelectorAll("[data-act]").forEach((b) => {
        b.onclick = () => {
          const a = b.dataset.act;
          if (a === "conv") RPT.features.conversation.open();
          if (a === "gallery") RPT.features.gallery.open();
          if (a === "layers") {
            document.body.classList.toggle("rpt-layers-on");
            if (document.body.classList.contains("rpt-layers-on"))
              RPT.features.layers.apply();
            else RPT.features.layers.remove();
          }
          if (a === "collapse") RPT.features.folding.collapseAll();
          if (a === "expand") RPT.features.folding.expandAll();
          if (a === "md") RPT.features.exporter.md();
          if (a === "json") RPT.features.exporter.json();
          if (a === "html") RPT.features.exporter.html();
          if (a === "analytics")
            chrome.runtime.sendMessage({ type: "OPEN_ANALYTICS" });
        };
      });
      // filters
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
      // keywords
      const kw = await RPT.features.highlighter.get();
      p.querySelector(".rpt-kw").value = kw.join(", ");
      p.querySelector(".rpt-kw-save").onclick = async () => {
        const list = p
          .querySelector(".rpt-kw")
          .value.split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        await RPT.features.highlighter.set(list);
        RPT.features.highlighter.apply();
      };
    },
    renderStats(p) {
      RPT.features.commentTree.parse();
      const s = RPT.features.analytics.compute();
      const h = RPT.features.health.analyze();
      const el = p.querySelector('[data-panel="stats"]');
      if (!s) {
        el.innerHTML = "<p>No comments on this page.</p>";
        return;
      }
      el.innerHTML = `
        <div class="rpt-card"><div class="rpt-k">Comments loaded</div><div class="rpt-v">${s.total}</div></div>
        <div class="rpt-card"><div class="rpt-k">Avg length</div><div class="rpt-v">${s.avgLength} chars</div></div>
        <div class="rpt-card"><div class="rpt-k">Deepest chain</div><div class="rpt-v">${s.deepest}</div></div>
        <div class="rpt-card"><div class="rpt-k">Longest comment</div><div class="rpt-v">${s.longest.author} — ${s.longest.length} chars</div></div>
        <div class="rpt-card"><div class="rpt-k">Most replied</div><div class="rpt-v">${
          s.mostReplied.map(([u, n]) => `${u} (${n})`).join(", ") || "—"
        }</div></div>
        <div class="rpt-card"><div class="rpt-k">Top branches</div><div class="rpt-v">${
          s.branches.map((b) => `${b.author} (${b.size})`).join(", ") || "—"
        }</div></div>
        <div class="rpt-card rpt-health"><div class="rpt-k">Thread health</div><div class="rpt-v">${h.score}/100</div><ul>${h.notes
          .map((n) => `<li>${RPT.utils.escapeHtml(n)}</li>`)
          .join("")}</ul></div>`;
    },
  };

  /* ---------------- Bootstrap + observer ---------------- */
  const runAll = RPT.utils.debounce(async () => {
    RPT.features.commentTree.parse();
    RPT.features.layers.remove();
    if (document.body.classList.contains("rpt-layers-on")) RPT.features.layers.apply();
    await RPT.features.folding.restore();
    await RPT.features.cleaner.apply();
    await RPT.features.highlighter.apply();
    await RPT.features.userTags.apply();
    RPT.features.toolbar.attach();
    RPT.features.ageWarning.check();
    RPT.features.history.record();
    RPT.features.history.trackAnalytics();
  }, 400);

  const boot = () => {
    RPT.ui.mount();
    RPT.features.linkPreview.attach();
    runAll();
    const mo = new MutationObserver(runAll);
    mo.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();