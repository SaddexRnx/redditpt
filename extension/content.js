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
    enabled: true,
    VERSION: "1.9.7",
    BUILD_DATE: "2026-07-26",
  });
  const tr = (key) => window.RPT_I18N?.t(key) || key;
  const tx = (value) => window.RPT_I18N?.text(value) || value;

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
    /* Deterministic HSL color per author (used for tree dots + comment side-stripe). */
    authorColor(name) {
      const s = String(name || "unknown");
      let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return `hsl(${h % 360} 70% 60%)`;
    },
    /* Normalize a KeyboardEvent to a stable string used by the custom-shortcut
     * config (e.g. "ArrowLeft", "Shift+C", "R", "Ctrl+K"). Kept in one place so
     * the Options capture UI and the runtime matcher always agree. */
    keyEventToStr(e) {
      if (["Shift","Control","Alt","Meta","OS"].includes(e.key)) return null;
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
    },
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

  /* ---------------- Accessibility helpers (focus trap, live region) ---------------- *
   * Every modal (command palette, gallery, summary, conversation, cheatsheet)
   * runs through RPT.a11y.trapModal so keyboard users can Tab within the
   * dialog, don't fall back to the page, and land back on the trigger element
   * when the modal closes. A single visually-hidden aria-live region
   * announces parsing/loading status to screen readers.                     */
  RPT.a11y = {
    _liveEl: null,
    ensureLive() {
      if (this._liveEl && document.body.contains(this._liveEl)) return this._liveEl;
      const el = document.createElement("div");
      el.className = "rpt-sr-live";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
      document.body.appendChild(el);
      this._liveEl = el;
      return el;
    },
    announce(msg) {
      const el = this.ensureLive();
      // Clear then set so identical consecutive messages are re-announced.
      el.textContent = "";
      setTimeout(() => { el.textContent = String(msg || ""); }, 30);
    },
    _focusables(root) {
      const sel = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(root.querySelectorAll(sel))
        .filter((el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0);
    },
    /* Traps Tab inside `root`, moves initial focus in, and restores focus
     * to the previously-active element when `root` leaves the DOM.        */
    trapModal(root) {
      const prev = document.activeElement;
      if (!root.hasAttribute("tabindex")) root.tabIndex = -1;
      const onKey = (e) => {
        if (e.key !== "Tab") return;
        if (!root.contains(document.activeElement)) {
          e.preventDefault(); (this._focusables(root)[0] || root).focus?.(); return;
        }
        const list = this._focusables(root);
        if (!list.length) { e.preventDefault(); root.focus?.(); return; }
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      };
      document.addEventListener("keydown", onKey, true);
      setTimeout(() => {
        const list = this._focusables(root);
        (list[0] || root).focus?.();
      }, 20);
      const cleanup = () => {
        document.removeEventListener("keydown", onKey, true);
        obs.disconnect();
        try { prev && prev.focus && prev.focus({ preventScroll: true }); } catch {}
      };
      const obs = new MutationObserver(() => {
        if (!document.body.contains(root)) cleanup();
      });
      obs.observe(document.body, { childList: true, subtree: true });
      return cleanup;
    },
  };
  /* Attach explicit keyboard-help text to a modal and wire it to
   * aria-describedby so screen readers announce the shortcuts as soon as
   * the dialog opens. Visible for sighted keyboard users too.           */
  RPT.a11y._helpSeq = 0;
  RPT.a11y._helpEntries = [];
  /* text can be a string OR a function(cfg) that returns a string using the
   * current custom-shortcut config. When shortcuts change we re-render every
   * live helper so aria-describedby stays in sync with the actual bindings. */
  RPT.a11y.addKeyHelp = function (root, text) {
    if (!root || !text) return;
    const id = `rpt-kbd-help-${++this._helpSeq}`;
    const el = document.createElement("div");
    el.className = "rpt-kbd-help";
    el.id = id;
    const render = () => {
      el.textContent = typeof text === "function" ? text(RPT.customKeys.cfg) : text;
    };
    render();
    const panel = root.querySelector(".rpt-overlay-panel, .rpt-cmdk") || root;
    panel.appendChild(el);
    const prev = root.getAttribute("aria-describedby");
    root.setAttribute("aria-describedby", prev ? `${prev} ${id}` : id);
    const entry = { el, render };
    this._helpEntries.push(entry);
    // Auto-cleanup when the modal element leaves the DOM.
    const obs = new MutationObserver(() => {
      if (!document.body.contains(el)) {
        this._helpEntries = this._helpEntries.filter((e) => e !== entry);
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  };
  RPT.a11y.refreshKeyHelp = function () {
    (this._helpEntries || []).forEach((e) => { try { e.render(); } catch {} });
  };

  /* ---------------- Custom keyboard shortcuts config ---------------- *
   * Loaded from chrome.storage (rpt_shortcuts) with sensible defaults so
   * runtime code can call RPT.customKeys.cfg synchronously.              */
  RPT.customKeys = {
    KEY: "rpt_shortcuts",
    DEFAULTS: { galleryPrev: "ArrowLeft", galleryNext: "ArrowRight", collapseAll: "Shift+C", refresh: "R" },
    cfg: { galleryPrev: "ArrowLeft", galleryNext: "ArrowRight", collapseAll: "Shift+C", refresh: "R" },
    async load() {
      const { [this.KEY]: v = {} } = await RPT.storage.get(this.KEY);
      this.cfg = { ...this.DEFAULTS, ...v };
      return this.cfg;
    },
  };

  /* ---------------- Per-thread gallery position ---------------- *
   * Remembers the last-viewed image index per Reddit path so revisiting
   * a thread resumes the gallery where the user left off.                */
  RPT.galleryPos = {
    KEY: "rpt_gallery_pos",
    _cache: null,
    async _read() {
      if (this._cache) return this._cache;
      const { [this.KEY]: v = {} } = await RPT.storage.get(this.KEY);
      this._cache = v; return v;
    },
    async get(path) { const v = await this._read(); return Number(v[path]) || 0; },
    async set(path, idx) {
      const v = await this._read();
      v[path] = idx;
      // Cap history at 100 threads to keep storage tiny.
      const keys = Object.keys(v);
      if (keys.length > 100) delete v[keys[0]];
      this._cache = v;
      await RPT.storage.set({ [this.KEY]: v });
    },
  };

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
    defaults: { autoOpenPanel: true, showOnboarding: true, showAuthorColors: true },
    async load() {
      const { [this.KEY]: v } = await RPT.storage.get(this.KEY);
      return { ...this.defaults, ...(v || {}) };
    },
  };

  /* ---------------- Comment tree parser ---------------- */
  RPT.features.commentTree = {
    /* Cached list of currently-visible tree rows for match cycling. */
    _matches: [], _matchIdx: -1,
    /* Focus a comment in-page: expand ancestors, scroll, flash-highlight.
       Respects the reduced-motion accessibility setting. */
    focusNode(node) {
      if (!node || !node.el) return;
      try {
        let p = node.el.parentElement;
        while (p && p !== document.body) {
          if (p.tagName === "SHREDDIT-COMMENT" && p.hasAttribute("collapsed")) p.removeAttribute("collapsed");
          if (p.classList && p.classList.contains("collapsed")) p.classList.remove("collapsed");
          p = p.parentElement;
        }
        if (node.el.tagName === "SHREDDIT-COMMENT" && node.el.hasAttribute("collapsed")) node.el.removeAttribute("collapsed");
      } catch {}
      const reduced = document.documentElement.getAttribute("data-rpt-motion") === "reduced"
        || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches
            && document.documentElement.getAttribute("data-rpt-motion") !== "auto");
      node.el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      /* Skip the flashy pulse when user asked for reduced motion; use a
         static outline instead so navigation still shows the target. */
      if (reduced) {
        node.el.classList.add("rpt-jump-static");
        setTimeout(() => node.el.classList.remove("rpt-jump-static"), 2200);
      } else {
        node.el.classList.add("rpt-jump-flash");
        setTimeout(() => node.el.classList.remove("rpt-jump-flash"), 1700);
      }
    },
    /* Look up a parsed node by comment id, or the first one by author. */
    findById(id) { return (RPT.state.comments || []).find((c) => c.id === id); },
    findByAuthor(author) {
      const a = String(author || "").toLowerCase();
      return (RPT.state.comments || []).find((c) => (c.author || "").toLowerCase() === a);
    },
    /* Cycle through the currently visible tree rows (i.e. rows that pass
       the search/author filter) so users can jump match-to-match. */
    cycle(dir, panel) {
      const rows = Array.from(panel.querySelectorAll(".rpt-tree li"))
        .filter((li) => li.style.display !== "none")
        .map((li) => li.querySelector(".rpt-tree-item"))
        .filter(Boolean);
      if (!rows.length) return;
      this._matches = rows;
      this._matchIdx = (this._matchIdx + (dir === "next" ? 1 : -1) + rows.length) % rows.length;
      const row = rows[this._matchIdx];
      row.scrollIntoView({ block: "nearest" });
      rows.forEach((r) => r.classList.remove("rpt-tree-current"));
      row.classList.add("rpt-tree-current");
      row.click();
      const cnt = panel.querySelector(".rpt-match-count");
      if (cnt) cnt.textContent = `${this._matchIdx + 1}/${rows.length}`;
    },

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
        container.innerHTML = `<p class="rpt-empty">${tr("no_comments_detected")}</p>`;
        return;
      }
      const ul = document.createElement("ul");
      ul.className = "rpt-tree";
      const walk = (nodes, parent) => {
        nodes.forEach((n) => {
          const li = document.createElement("li");
          const color = RPT.utils.authorColor(n.author);
          li.dataset.author = (n.author || "").toLowerCase();
          li.dataset.text = (n.body || "").toLowerCase();
          li.innerHTML = `
            <div class="rpt-tree-item" data-id="${RPT.utils.escapeHtml(n.id)}">
              <span class="rpt-author-dot" style="background:${color}"></span>
              <span class="rpt-author">${RPT.utils.escapeHtml(n.author)}</span>
              <span class="rpt-score">${n.score}</span>
              <span class="rpt-preview">${RPT.utils.escapeHtml(n.body.slice(0, 100))}</span>
              <button class="rpt-tree-share" title="${tr("copy_share_link")}" aria-label="${tr("copy_link")}">🔗</button>
            </div>`;
          li.querySelector(".rpt-author").style.color = color;
          const row = li.querySelector(".rpt-tree-item");
          /* Share button: copy a deep link with #rpt-c=<id>. Anyone opening
             it with the extension installed lands on the comment focused. */
          const shareBtn = row.querySelector(".rpt-tree-share");
          shareBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const u = new URL(location.href);
            u.hash = `rpt-c=${encodeURIComponent(n.id)}`;
            const link = u.toString();
            try { navigator.clipboard.writeText(link); } catch {}
            shareBtn.textContent = "✓";
            setTimeout(() => (shareBtn.textContent = "🔗"), 1200);
          });
          /* Hover: quick preview bubble showing the full first ~400 chars,
             so a user can survey comments without leaving the tree. */
          let pv;
          row.addEventListener("mouseenter", (ev) => {
            pv = document.createElement("div");
            pv.className = "rpt-tree-hoverpv";
            pv.innerHTML = `<b>u/${RPT.utils.escapeHtml(n.author)} · ${n.score}</b>${RPT.utils.escapeHtml((n.body || tr("no_text")).slice(0, 400))}`;
            document.body.appendChild(pv);
            const r = row.getBoundingClientRect();
            const top = Math.max(8, Math.min(window.innerHeight - 180, r.top));
            pv.style.top = top + "px";
            pv.style.left = Math.max(8, r.left - 330) + "px";
          });
          row.addEventListener("mouseleave", () => { pv && pv.remove(); pv = null; });
          /* Click: expand ancestors, scroll into view, trigger big highlight. */
          row.addEventListener("click", () => {
            pv && pv.remove(); pv = null;
            RPT.features.commentTree.focusNode(n);
          });
          if (n.children.length) { const c = document.createElement("ul"); walk(n.children, c); li.appendChild(c); }
          parent.appendChild(li);
        });
      };
      walk(roots, ul);
      container.appendChild(ul);
    },
    /* Unique sorted list of authors present in the currently parsed tree. */
    authorList() {
      const set = new Set();
      (RPT.state.comments || []).forEach((c) => c.author && set.add(c.author));
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    },
  };

  /* ---------------- Author auto-coloring on live comments ---------------- *
   * Applies a colored left border + author-name tint to each comment so users
   * are visually distinguishable at a glance. Works on both new and old Reddit. */
  RPT.features.authorColors = {
    _lastEnabled: true,
    async apply() {
      const gen = await RPT.general.load();
      const enabled = gen.showAuthorColors !== false;
      if (!enabled) {
        // Remove any previously applied color styling.
        document.querySelectorAll(".rpt-authored").forEach((el) => {
          el.classList.remove("rpt-authored");
          el.style.removeProperty("--rpt-author-color");
        });
        document.querySelectorAll("[data-rpt-tinted]").forEach((el) => {
          el.style.color = "";
          delete el.dataset.rptTinted;
        });
        this._lastEnabled = false;
        return;
      }
      this._lastEnabled = true;
      RPT.state.comments.forEach((c) => {
        const color = RPT.utils.authorColor(c.author);
        c.el.classList.add("rpt-authored");
        c.el.style.setProperty("--rpt-author-color", color);
        const authorEl = c.el.querySelector?.("a[href*='/user/'], [slot='authorName'] a, .author");
        if (authorEl && !authorEl.dataset.rptTinted) {
          authorEl.dataset.rptTinted = "1";
          authorEl.style.color = color;
        }
      });
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
    PAGE_KEY: "rpt_folded_all_pages",
    async toggle(id, forceState) {
      const c = RPT.state.comments.find((x) => x.id === id);
      if (!c) return;
      const collapsed = forceState ?? !c.el.classList.contains("rpt-collapsed");
      c.el.classList.toggle("rpt-collapsed", collapsed);
      // Reddit's <shreddit-comment> supports a native `collapsed` attribute — use it
      // so replies and body hide reliably inside the shadow DOM.
      if (collapsed) c.el.setAttribute?.("collapsed", "");
      else c.el.removeAttribute?.("collapsed");
      const { [this.STORAGE_KEY]: map = {} } = await RPT.storage.get(this.STORAGE_KEY);
      const key = location.pathname;
      map[key] = map[key] || {};
      map[key][id] = collapsed;
      await RPT.storage.set({ [this.STORAGE_KEY]: map });
    },
    async collapseAll() {
      // Re-parse first so freshly-loaded comments are included.
      RPT.features.commentTree.parse();
      RPT.state.comments.forEach((c) => {
        c.el.classList.add("rpt-collapsed");
        c.el.setAttribute?.("collapsed", "");
        // Old-Reddit fallback: uses its own `.collapsed` class on `.thing.comment`.
        if (c.el.classList?.contains("thing")) c.el.classList.add("collapsed");
      });
      // Remember that this path is fully collapsed so SPA re-parse or newly
      // streamed comments stay hidden.
      const { [this.PAGE_KEY]: pages = {} } = await RPT.storage.get(this.PAGE_KEY);
      pages[location.pathname] = true;
      await RPT.storage.set({ [this.PAGE_KEY]: pages });
    },
    async expandAll() {
      RPT.features.commentTree.parse();
      RPT.state.comments.forEach((c) => {
        c.el.classList.remove("rpt-collapsed");
        c.el.removeAttribute?.("collapsed");
        if (c.el.classList?.contains("thing")) c.el.classList.remove("collapsed");
      });
      const { [this.PAGE_KEY]: pages = {} } = await RPT.storage.get(this.PAGE_KEY);
      delete pages[location.pathname];
      await RPT.storage.set({ [this.PAGE_KEY]: pages });
      // Also clear per-comment folded state for this path.
      const { [this.STORAGE_KEY]: map = {} } = await RPT.storage.get(this.STORAGE_KEY);
      delete map[location.pathname];
      await RPT.storage.set({ [this.STORAGE_KEY]: map });
    },
    async restore() {
      const { [this.STORAGE_KEY]: map = {} } = await RPT.storage.get(this.STORAGE_KEY);
      const saved = map[location.pathname] || {};
      const { [this.PAGE_KEY]: pages = {} } = await RPT.storage.get(this.PAGE_KEY);
      const pageCollapsed = !!pages[location.pathname];
      RPT.state.comments.forEach((c) => {
        if (pageCollapsed || saved[c.id]) {
          c.el.classList.add("rpt-collapsed");
          c.el.setAttribute?.("collapsed", "");
          if (c.el.classList?.contains("thing")) c.el.classList.add("collapsed");
        }
      });
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
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", tr("conversation_mode"));
      overlay.innerHTML = `
        <div class="rpt-overlay-panel">
          <div class="rpt-overlay-head">
            <h2>${I.chat} ${tr("conversation_mode")}</h2>
            <button class="rpt-close" aria-label="${tr("close")}">${I.close}</button>
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
      RPT.a11y.trapModal(overlay);
      RPT.a11y.addKeyHelp(overlay, () => tr("kbd_help_conversation"));
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
      if (!cs.length) return { score: 0, notes: [tr("no_comments_loaded")] };
      const notes = [];
      const deepest = cs.reduce((m, c) => Math.max(m, c.depth), 0);
      const withReplies = (RPT.state.tree || []).filter((r) => r.children.length).length;
      const dead = (RPT.state.tree || []).filter((r) => !r.children.length).length;
      const controversial = cs.filter((c) => c.score <= 0).length;
      notes.push(`${tr("discussion_depth")}: ${deepest}`);
      notes.push(`${tr("root_threads_replies")}: ${withReplies}`);
      notes.push(`${tr("dead_branches")}: ${dead}`);
      notes.push(`${tr("controversial_zero")}: ${controversial}`);
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
      o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", tr("smart_summary_title"));
      const item = (c, meta) => `
        <div class="rpt-summary-item" data-id="${RPT.utils.escapeHtml(c.id)}">
          <div class="rpt-summary-meta"><strong>u/${RPT.utils.escapeHtml(c.author)}</strong> · ${meta}</div>
          <div class="rpt-summary-text">${RPT.utils.escapeHtml(c.body.slice(0, 240))}${c.body.length > 240 ? "…" : ""}</div>
        </div>`;
      const section = (title, items) =>
        `<div class="rpt-summary-section"><h3>${title}</h3>${items.length ? items : `<div class="rpt-muted">${tr("nothing_found")}</div>`}</div>`;
      o.innerHTML = `
        <div class="rpt-overlay-panel">
          <div class="rpt-overlay-head">
            <h2>${I.summary} ${tr("smart_summary_title")}</h2>
            <button class="rpt-close" aria-label="${tr("close")}">${I.close}</button>
          </div>
          <div class="rpt-summary">${
            s ? `
              ${section(tr("top_voted"), s.top.map((c) => item(c, `${c.score} ${tr("pts")}`)).join(""))}
              ${section(tr("most_discussed_threads"), s.mostReplied.map((m) => item(m.node, `${m.size} ${tr("replies")}`)).join(""))}
              ${section(tr("long_substantive"), s.substantive.map((c) => item(c, `${c.body.length} ${tr("chars")} · ${c.score} ${tr("pts")}`)).join(""))}
              ${section(tr("controversial"), s.controversial.map((c) => item(c, `${c.score} ${tr("pts")}`)).join(""))}
            ` : `<p class="rpt-muted">${tr("no_comments_detected")}</p>`
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
      RPT.a11y.trapModal(o);
      RPT.a11y.addKeyHelp(o, () => tr("kbd_help_summary"));
    },
  };

  /* ---------------- Live "new comments" indicator ---------------- *
   * Polls Reddit's own thread JSON (same origin, public endpoint) —
   * no external server, still 100% local. Adaptive polling: faster
   * when the user is active, slower when idle or tab hidden.          */
  RPT.features.liveNew = {
    _timer: null, _baseline: 0, _latest: 0, _lastActive: Date.now(),
    _state: "paused", _interval: 45000, _errBackoff: 0,
    _bindActivity() {
      if (this._bound) return; this._bound = true;
      const bump = () => { this._lastActive = Date.now(); };
      window.addEventListener("pointermove", bump, { passive: true });
      window.addEventListener("scroll", bump, { passive: true });
      window.addEventListener("keydown", bump);
      document.addEventListener("visibilitychange", () => this._reschedule());
    },
    _pickInterval() {
      if (document.hidden) return 120000;
      const idle = Date.now() - this._lastActive;
      if (idle > 180000) return 120000;
      if (idle < 30000)  return 20000;
      return 45000;
    },
    _reschedule() {
      if (!this._timer) return;
      const next = Math.max(this._pickInterval(), this._errBackoff);
      if (next !== this._interval) {
        this._interval = next;
        clearInterval(this._timer);
        this._timer = setInterval(() => this._poll(), this._interval);
        this._renderStatus();
      }
    },
    async _poll() {
      this._setState("check");
      try {
        const url = location.pathname.replace(/\/$/, "") + ".json?limit=500&raw_json=1";
        const r = await fetch(url, { credentials: "omit" });
        if (!r.ok) { this._errBackoff = Math.min((this._errBackoff || 45000) * 2, 300000); this._setState("idle"); this._reschedule(); return; }
        this._errBackoff = 0;
        const j = await r.json();
        const listing = Array.isArray(j) && j[1]?.data?.children;
        if (!listing) { this._setState("idle"); return; }
        const count = this._countAll(listing);
        this._latest = count;
        const delta = Math.max(0, count - this._baseline);
        RPT.ui.updateNewBadge(delta);
        this._setState(delta > 0 ? "new" : "live", delta);
        this._reschedule();
      } catch { this._setState("idle"); }
    },
    async start() {
      const auto = await RPT.autorun.load();
      if (!auto.liveNew || !RPT.utils.isRedditThread()) { this._setState("paused"); return; }
      this.stop();
      this._bindActivity();
      this._baseline = RPT.state.comments.length ||
        document.querySelectorAll("shreddit-comment, .thing.comment").length;
      this._interval = this._pickInterval();
      this._poll();
      this._timer = setInterval(() => this._poll(), this._interval);
      this._setState("live");
    },
    stop() {
      if (this._timer) clearInterval(this._timer);
      this._timer = null; RPT.ui.updateNewBadge(0);
      this._setState("paused");
    },
    _setState(s, delta) {
      this._state = s;
      this._renderStatus(delta);
    },
    _renderStatus(delta) {
      const el = document.querySelector(".rpt-live-pill"); if (!el) return;
      el.dataset.state = this._state;
      const secs = Math.round(this._interval / 1000);
        const label = { live: `${tr("live")} · ${secs}s`, idle: tr("idle"), paused: tr("paused"),
        check: tr("checking"), new: `+${delta ?? 0} ${tr("new_comments")}` }[this._state] || "";
      el.querySelector(".rpt-live-txt").textContent = label;
    },
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
    reset() { this._baseline = this._latest || this._baseline; RPT.ui.updateNewBadge(0); this._setState("live"); },
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
    async importMerged(items) {
      const all = await this.list();
      const seen = new Set(all.map((x) => x.url + "|" + x.id));
      let added = 0;
      for (const it of items) {
        if (!it || !it.body || !it.author) continue;
        const key = (it.url || "") + "|" + (it.id || it.author + "-" + it.savedAt);
        if (seen.has(key)) continue;
        seen.add(key);
        all.unshift({
          id: it.id || (it.author + "-" + (it.savedAt || Date.now())),
          author: String(it.author), body: String(it.body),
          score: Number(it.score) || 0, url: String(it.url || ""),
          title: String(it.title || ""), savedAt: it.savedAt || new Date().toISOString(),
        });
        added++;
      }
      await this.save(all.slice(0, 500));
      return added;
    },
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
        btn.textContent = tr("save_local");
        btn.title = tr("save_to_collection");
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

  /* ---------------- Rules engine (keyword / author / flair / regex) ---------------- *
   * Each rule: { id, enabled, type: "keyword"|"author"|"flair"|"regex",
   *              pattern, action: "highlight"|"hide", color, label }              */
  RPT.features.rules = {
    KEY: "rpt_rules",
    async list() { const { [this.KEY]: r = [] } = await RPT.storage.get(this.KEY); return r; },
    async save(list) { await RPT.storage.set({ [this.KEY]: list }); this.apply(); },
    _compile(rule) {
      try {
        if (rule.type === "regex") return new RegExp(rule.pattern, "i");
        if (rule.type === "keyword") return new RegExp(rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      } catch { return null; }
      return null;
    },
    _flair(el) {
      return (el.querySelector?.("[flair-text], .flair, .linkflairlabel")?.textContent || "").toLowerCase();
    },
    _matches(rule, c) {
      if (rule.type === "author") return c.author.toLowerCase() === rule.pattern.toLowerCase().replace(/^u\//, "");
      if (rule.type === "flair")  return this._flair(c.el).includes(rule.pattern.toLowerCase());
      const rx = this._compile(rule); if (!rx) return false;
      return rx.test(c.body) || rx.test(c.author);
    },
    async apply() {
      const rules = (await this.list()).filter((r) => r.enabled && r.pattern);
      RPT.state.comments.forEach((c) => {
        c.el.style.removeProperty("--rpt-rule-color");
        c.el.classList.remove("rpt-rule-hit");
        // Note: do NOT unhide here — cleaner + chips also manage rpt-hidden.
      });
      rules.forEach((rule) => {
        RPT.state.comments.forEach((c) => {
          if (!this._matches(rule, c)) return;
          if (rule.action === "hide") c.el.classList.add("rpt-hidden");
          else {
            c.el.classList.add("rpt-rule-hit");
            c.el.style.setProperty("box-shadow", `inset 3px 0 0 ${rule.color || "#f59e0b"}`);
          }
        });
      });
    },
    preview(rule, comments) {
      // Returns which of the given comment nodes would match (for the options UI).
      return comments.filter((c) => this._matches(rule, c));
    },
  };

  /* ---------------- Command palette (Ctrl / Cmd + K) ---------------- */
  RPT.features.cmdk = {
    _sel: 0, _filtered: [], _root: null,
    commands() {
      return [
        { id: "panel",    label: tr("open_panel"),       kbd: "T",  run: () => RPT.ui.togglePanel() },
        { id: "summary",  label: tr("smart_summary_title"),         kbd: "S",  run: () => RPT.features.summary.open() },
        { id: "gallery",  label: tr("image_gallery"),         kbd: "G",  run: () => RPT.features.gallery.open() },
        { id: "conv",     label: tr("conversation_mode"),     kbd: "C",  run: () => RPT.features.conversation.open() },
        { id: "layers",   label: tr("depth_layers_title"),   kbd: "L",  run: () => {
          document.body.classList.toggle("rpt-layers-on");
          document.body.classList.contains("rpt-layers-on") ? RPT.features.layers.apply() : RPT.features.layers.remove();
        } },
        { id: "collapse", label: tr("collapse_all_comments"), kbd: "⇧C", run: () => RPT.features.folding.collapseAll() },
        { id: "expand",   label: tr("expand_all_comments"),   kbd: "⇧E", run: () => RPT.features.folding.expandAll() },
        { id: "newest",   label: tr("jump_newest"), kbd: "N", run: () => RPT.features.shortcuts._jumpToNewest() },
        { id: "live",     label: tr("toggle_live_polling"), run: async () => {
          const a = await RPT.autorun.load(); a.liveNew = !a.liveNew; await RPT.autorun.save(a);
          a.liveNew ? RPT.features.liveNew.start() : RPT.features.liveNew.stop();
        } },
        { id: "chip-op",   label: tr("filter_op_only"),    run: () => RPT.features.chips.toggle("op") },
        { id: "chip-mod",  label: tr("filter_mod_only"),   run: () => RPT.features.chips.toggle("mod") },
        { id: "chip-awd",  label: tr("filter_awarded"),    run: () => RPT.features.chips.toggle("awarded") },
        { id: "chip-none", label: tr("filter_reset"),      run: () => { RPT.features.chips.active.clear(); RPT.features.chips.apply(); } },
        { id: "md",       label: tr("export_markdown"), run: () => RPT.features.exporter.md() },
        { id: "json",     label: tr("export_json"),     run: () => RPT.features.exporter.json() },
        { id: "html",     label: tr("export_as_html"),     run: () => RPT.features.exporter.html() },
        { id: "kbd",      label: tr("keyboard_shortcuts"), kbd: "?", run: () => RPT.features.shortcuts.cheatsheet() },
        { id: "settings", label: tr("open_settings"),       run: () => chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" }) },
        { id: "analytics",label: tr("open_analytics_dashboard"), run: () => chrome.runtime.sendMessage({ type: "OPEN_ANALYTICS" }) },
        { id: "theme",    label: tr("theme_toggle"), run: () => window.RPT_THEME?.set(window.RPT_THEME.current === "dark" ? "light" : "dark") },
      ];
    },
    open() {
      if (this._root) { this.close(); return; }
      const all = this.commands();
      const back = document.createElement("div");
      back.className = "rpt-cmdk-backdrop";
      back.innerHTML = `
        <div class="rpt-cmdk" role="dialog" aria-modal="true" aria-label="${tr("command_palette")}">
          <input type="text" placeholder="${tr("type_command")}" aria-label="${tr("command")}" autocomplete="off">
          <ul role="listbox"></ul>
          <div class="rpt-cmdk-foot"><span><kbd>↑↓</kbd> ${tr("arrow_nav")}</span><span><kbd>↵</kbd> ${tr("enter_run")}</span><span><kbd>Esc</kbd> ${tr("esc_close")}</span></div>
        </div>`;
      this._root = back;
      const input = back.querySelector("input");
      const list  = back.querySelector("ul");
      const render = (q = "") => {
        const query = q.trim().toLowerCase();
        this._filtered = !query ? all : all.filter((c) => c.label.toLowerCase().includes(query));
        this._sel = 0;
        list.innerHTML = this._filtered.length
          ? this._filtered.map((c, i) => `<li role="option" data-i="${i}" class="${i === 0 ? "rpt-cmdk-sel" : ""}"><span>${RPT.utils.escapeHtml(c.label)}</span>${c.kbd ? `<span class="rpt-cmdk-kbd">${c.kbd}</span>` : ""}</li>`).join("")
          : `<div class="rpt-cmdk-empty">${tr("no_commands_match")} “${RPT.utils.escapeHtml(query)}”.</div>`;
      };
      input.addEventListener("input", () => render(input.value));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.preventDefault(); this.close(); }
        else if (e.key === "ArrowDown") { e.preventDefault(); this._sel = Math.min(this._filtered.length - 1, this._sel + 1); this._highlight(); }
        else if (e.key === "ArrowUp")   { e.preventDefault(); this._sel = Math.max(0, this._sel - 1); this._highlight(); }
        else if (e.key === "Enter")     { e.preventDefault(); this._run(); }
      });
      list.addEventListener("click", (e) => {
        const li = e.target.closest?.("li[data-i]"); if (!li) return;
        this._sel = Number(li.dataset.i); this._run();
      });
      back.addEventListener("click", (e) => { if (e.target === back) this.close(); });
      document.body.appendChild(back);
      render();
      // Trap Tab within the palette; input keeps first focus.
      RPT.a11y.trapModal(back);
      RPT.a11y.addKeyHelp(back, () => tr("kbd_help_cmdk"));
      setTimeout(() => input.focus(), 20);
    },
    _highlight() {
      if (!this._root) return;
      this._root.querySelectorAll("li").forEach((li) => li.classList.toggle("rpt-cmdk-sel", Number(li.dataset.i) === this._sel));
      const el = this._root.querySelector(`li[data-i="${this._sel}"]`);
      el?.scrollIntoView({ block: "nearest" });
    },
    _run() {
      const cmd = this._filtered[this._sel]; this.close();
      try { cmd?.run(); } catch (e) { console.warn(e); }
    },
    close() { this._root?.remove(); this._root = null; },
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
        badge.style.background = t.color || "#46d160";
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
      const out = `<!doctype html><meta charset="utf-8"><title>${esc(p.title)}</title><style>body{font:14px system-ui;max-width:780px;margin:2rem auto;padding:0 1rem;background:#0b0f14;color:#e6edf5}li{margin:.5rem 0}strong{color:#ff4500}</style><h1>${esc(p.title)}</h1><p>${esc(p.body || "")}</p><h2>${tr("comments_header")}</h2>${walk(RPT.state.tree || [])}`;
      this._download("reddit-thread.html", "text/html", out);
    },
  };

  /* ---------------- Gallery ---------------- */
  RPT.features.gallery = {
    open() {
      const imgs = Array.from(document.querySelectorAll('shreddit-post img, [data-testid="post-container"] img, .expando img, a.title img'))
        .map((i) => i.src).filter((s) => /^https?:/.test(s) && !/emoji|avatar|award/i.test(s));
      const unique = Array.from(new Set(imgs));
      if (!unique.length) { alert(tr("no_images_detected")); return; }
      let idx = 0;
      const path = location.pathname;
      const savePos = RPT.utils.debounce((i) => RPT.galleryPos.set(path, i), 300);
      const o = document.createElement("div");
      o.className = "rpt-overlay rpt-gallery";
      o.setAttribute("role", "dialog");
      o.setAttribute("aria-modal", "true");
      o.setAttribute("aria-label", tr("image_gallery"));
      o.tabIndex = -1;
      o.innerHTML = `
        <button class="rpt-g-prev" type="button" aria-label="${tr("previous_image")}" title="${tr("previous")} (←)">‹</button>
        <img class="rpt-g-img" alt="${tr("gallery_image")} 1 ${tr("of")} ${unique.length}" src="${unique[0]}">
        <button class="rpt-g-next" type="button" aria-label="${tr("next_image")}" title="${tr("next")} (→)">›</button>
        <button class="rpt-close rpt-g-close" type="button" aria-label="${tr("close_gallery")}" title="${tr("close_word")} (Esc)">×</button>
        <div class="rpt-g-count" aria-live="polite">1 / ${unique.length}</div>`;
      const img = o.querySelector(".rpt-g-img");
      const count = o.querySelector(".rpt-g-count");
      const go = (n) => {
        idx = (n + unique.length) % unique.length;
        img.src = unique[idx];
        img.alt = `${tr("gallery_image")} ${idx + 1} ${tr("of")} ${unique.length}`;
        count.textContent = `${idx + 1} / ${unique.length}`;
        savePos(idx);
      };
      const prev = () => go(idx - 1);
      const next = () => go(idx + 1);
      const close = () => {
        document.removeEventListener("keydown", onKey, true);
        o.remove();
      };
      const stop = (e) => e.stopPropagation();
      const bindBtn = (sel, fn) => {
        const b = o.querySelector(sel);
        b.addEventListener("click", (e) => { stop(e); e.preventDefault(); fn(); });
      };
      bindBtn(".rpt-g-prev", prev);
      bindBtn(".rpt-g-next", next);
      bindBtn(".rpt-g-close", close);
      // Click on the dark backdrop closes; click on the image/buttons does not.
      o.addEventListener("click", (e) => { if (e.target === o) close(); });
      const onKey = (e) => {
        const s = RPT.utils.keyEventToStr(e);
        const c = RPT.customKeys.cfg;
        if (s === c.galleryPrev)      { e.preventDefault(); e.stopPropagation(); prev(); }
        else if (s === c.galleryNext) { e.preventDefault(); e.stopPropagation(); next(); }
        else if (e.key === "Home")    { e.preventDefault(); go(0); }
        else if (e.key === "End")     { e.preventDefault(); go(unique.length - 1); }
        else if (e.key === "Escape")  { e.preventDefault(); close(); }
      };
      document.addEventListener("keydown", onKey, true);
      document.body.appendChild(o);
      // Focus trap + restore-on-close.
      RPT.a11y.trapModal(o);
      RPT.a11y.addKeyHelp(o, () => tr("kbd_help_gallery"));
      // Resume at the last-viewed image for this thread.
      RPT.galleryPos.get(path).then((saved) => {
        if (saved > 0 && saved < unique.length) go(saved);
      });
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

  /* ---------------- About modal ---------------- */
  RPT.features.about = {
    open() {
      document.querySelector(".rpt-modal.rpt-about")?.remove();
      const m = document.createElement("div");
      m.className = "rpt-modal rpt-about";
      m.setAttribute("role", "dialog");
      m.setAttribute("aria-modal", "true");
      m.setAttribute("aria-label", tr("about_title"));
      m.innerHTML = `
        <div class="rpt-modal-card" style="max-width:420px">
          <header class="rpt-modal-head">
            <strong>${tr("about_title")}</strong>
            <button class="rpt-x" data-x aria-label="${tr("close")}">×</button>
          </header>
          <div class="rpt-modal-body" style="padding:16px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
              <div style="width:44px;height:44px;border-radius:10px;background:var(--rpt-green);color:#001912;display:grid;place-items:center;font-weight:800">RPT</div>
              <div>
                <div style="font-weight:700;font-size:14px">Reddit Power Toolkit</div>
                <div style="color:var(--rpt-muted);font-size:12px">${tr("about_version_built")} <strong>${RPT.VERSION}</strong> · ${tr("built")} ${RPT.BUILD_DATE}</div>
              </div>
            </div>
            <p style="color:var(--rpt-muted);font-size:12px;line-height:1.5;margin:0 0 14px">
              ${tr("about_desc")}
            </p>
            <div style="display:grid;gap:8px">
              <a class="rpt-about-link" href="https://github.com/Saddexrnx/redditpt/releases" target="_blank" rel="noopener">
                <span>${tr("changelog_releases")}</span><span aria-hidden="true">↗</span>
              </a>
              <a class="rpt-about-link" href="https://github.com/Saddexrnx/redditpt" target="_blank" rel="noopener">
                <span>${tr("github_repository")}</span><span aria-hidden="true">↗</span>
              </a>
              <a class="rpt-about-link" href="https://t.me/Saddex_x" target="_blank" rel="noopener">
                <span>${tr("telegram_contact")}</span><span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>`;
      m.addEventListener("click", (e) => {
        if (e.target === m || e.target.closest?.("[data-x]")) m.remove();
      });
      document.body.appendChild(m);
      RPT.a11y?.trapModal?.(m);
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
        // Command palette: Ctrl/Cmd+K (works even in inputs)
        if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); RPT.features.cmdk.open(); return; }
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        // Configurable shortcuts (collapse-all, refresh) — matched first so
        // user overrides beat the legacy single-key defaults below.
        const s = RPT.utils.keyEventToStr(e);
        const cfg = RPT.customKeys.cfg;
        if (s && s === cfg.collapseAll) { e.preventDefault(); RPT.features.folding.collapseAll(); return; }
        if (s && s === cfg.refresh)     { e.preventDefault(); RPT.resync?.(); return; }
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
      o.setAttribute("role", "dialog");
      o.setAttribute("aria-modal", "true");
      o.setAttribute("aria-label", "Keyboard shortcuts");
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
      RPT.a11y.trapModal(o);
      RPT.a11y.addKeyHelp(o, () => tr("kbd_help_cheatsheet"));
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
        <button class="rpt-qb-btn" data-act="${act}" aria-label="${label}" title="${label}${sc ? ` (${sc})` : ""}">
          ${icon}
          <span class="rpt-qb-tip">${label}${sc ? `<kbd>${sc}</kbd>` : ""}</span>
        </button>`;
      bar.innerHTML = `
        <div class="rpt-qb-brand" title="Reddit Power Toolkit">RPT</div>
        <div class="rpt-qb-group" role="group" aria-label="${tr("panel")}">
          ${btn("panel", I.panel, tr("panel"), "T")}
          ${btn("summary", I.summary, tr("smart_summary_title"), "S")}
          ${btn("conv", I.chat, tr("conversation_mode"), "C")}
          ${btn("gallery", I.image, tr("image_gallery"), "G")}
          ${btn("fold", I.fold, tr("collapse_all_short"), "⇧C")}
        </div>
        <div class="rpt-qb-group" role="group" aria-label="${tr("live_polling_status")}">
          <span class="rpt-status-pill" data-state="idle" role="status" aria-live="polite" aria-label="${tr("parsing_status")}" title="${tr("thread_parsing_status")}">
            <span class="rpt-status-dot"></span><span class="rpt-status-txt">${tr("idle")}</span>
          </span>
          <span class="rpt-live-pill" data-state="paused" role="status" aria-live="polite" aria-label="${tr("live_polling_status")}">
            <span class="rpt-live-dot"></span><span class="rpt-live-txt">${tr("paused")}</span>
          </span>
          <button class="rpt-qb-btn" data-act="new" aria-label="${tr("new_comments")}" title="${tr("jump_newest")} (N)">
            ${I.bell}
            <span class="rpt-qb-badge" style="display:none">0</span>
            <span class="rpt-qb-tip">${tr("new_comments")}<kbd>N</kbd></span>
          </button>
        </div>
        <div class="rpt-qb-group" role="group" aria-label="${tr("power_features")}">
          <button class="rpt-qb-btn rpt-qb-v2" data-act="v2" aria-label="${tr("power_features")}" title="${tr("power_features")}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span class="rpt-qb-tip">${tr("power_features")}</span>
          </button>
          <button class="rpt-qb-btn rpt-qb-sub" data-act="subanalyzer" aria-label="${tr("subreddit_analyzer") || "Subreddit analyzer"}" title="${tr("subreddit_analyzer") || "Subreddit analyzer"}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-4 4 3 5-7"/></svg>
            <span class="rpt-qb-tip">${tr("subreddit_analyzer") || "Subreddit analyzer"}</span>
          </button>
          <button class="rpt-qb-btn rpt-qb-sub" data-act="subhealth" aria-label="${tr("subreddit_health") || "Subreddit health"}" title="${tr("subreddit_health") || "Subreddit health"}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="rpt-qb-tip">${tr("subreddit_health") || "Subreddit health"}</span>
          </button>
          <button class="rpt-qb-btn" data-act="cmdk" aria-label="${tr("command_palette")}" title="${tr("command_palette")} (⌘K)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h4M7 13h10M7 17h6"/></svg>
            <span class="rpt-qb-tip">${tr("command_palette")}<kbd>⌘K</kbd></span>
          </button>
          ${btn("kbd", I.kbd, tr("keyboard_shortcuts"), "?")}
          ${btn("about", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`, tr("about"))}
        </div>
        <div class="rpt-qb-group" role="group" aria-label="${tr("turn_on_off")}">
          <button class="rpt-qb-btn" data-act="size" aria-label="${tr("toggle_toolbar_size")}" title="${tr("toggle_toolbar_size")}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            <span class="rpt-qb-tip">${tr("compact_comfortable")}</span>
          </button>
          <button class="rpt-qb-btn rpt-qb-power" data-act="power" aria-label="${tr("turn_off")}" title="${tr("turn_on_off")}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
            <span class="rpt-qb-tip">${tr("turn_off")}</span>
          </button>
          ${btn("close", I.close, tr("hide_toolbar"))}
        </div>`;
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
      else if (a === "cmdk")    RPT.features.cmdk.open();
        else if (a === "kbd")     RPT.features.shortcuts.cheatsheet();
        else if (a === "about")   RPT.features.about.open();
        else if (a === "v2")      window.RPT?.v2?.openHub?.();
        else if (a === "subanalyzer") window.RPT?.v2?.modules?.subAnalyzer?.run?.();
        else if (a === "subhealth")   window.RPT?.v2?.modules?.subHealth?.run?.();
        else if (a === "size")    RPT.ui.toggleSize();
        else if (a === "power")   RPT.ui.togglePower();
        else if (a === "close")   { bar.remove(); RPT.autorun.load().then((v) => RPT.autorun.save({ ...v, quickBar: false })); }
      });
      document.body.appendChild(bar);
      // Restore persisted compact size preference.
      chrome.storage.local.get("rpt_qb_size", (v) => {
        if (v?.rpt_qb_size === "compact") bar.classList.add("rpt-qb-min");
      });
    // Refresh live-pill label after the DOM node exists
    RPT.features.liveNew._renderStatus();
    // Reflect current status on the freshly mounted pill.
    RPT.status.set(RPT.state.comments.length ? "ready" : "idle",
      RPT.state.comments.length ? `${tr("ready")} · ${RPT.state.comments.length} ${tr("comments")}` : tr("idle"));
    },
    toggleSize() {
      const bar = document.querySelector(".rpt-qb");
      if (!bar) return;
      bar.classList.toggle("rpt-qb-min");
      const size = bar.classList.contains("rpt-qb-min") ? "compact" : "comfortable";
      chrome.storage.local.set({ rpt_qb_size: size });
    },
    togglePower() {
      const next = !RPT.enabled;
      chrome.storage.local.set({ rpt_enabled: next });
      RPT.setEnabled?.(next);
      const btn = document.querySelector('.rpt-qb-btn[data-act="power"]');
      if (btn) {
        btn.title = next ? tr("turn_off") : tr("turn_on");
        btn.setAttribute("aria-label", btn.title);
        btn.classList.toggle("rpt-qb-power-off", !next);
      }
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
    /* Ensure the panel is open on the Tree tab, returning the mounted node. */
    ensurePanel() {
      let p = document.querySelector(".rpt-panel");
      if (!p) { this.togglePanel(); p = document.querySelector(".rpt-panel"); }
      const treeBtn = p && p.querySelector('.rpt-tabs button[data-tab="tree"]');
      if (treeBtn && !treeBtn.classList.contains("active")) treeBtn.click();
      return p;
    },
    panelHTML() {
      return `
        <header class="rpt-panel-head">
          <div class="rpt-brand"><span class="rpt-brand-dot"></span>Reddit Power Toolkit</div>
          <div class="rpt-panel-head-actions">
            <span class="rpt-status-pill" data-state="idle" role="status" aria-live="polite" aria-label="${tr("parsing_status")}" title="${tr("thread_parsing_status")}">
              <span class="rpt-status-dot"></span><span class="rpt-status-txt">${tr("idle")}</span>
            </span>
            <button class="rpt-panel-refresh" type="button" aria-label="${tr("reparse_thread")}" title="${tr("refresh_reparse")}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>
            </button>
            <button class="rpt-panel-close" aria-label="${tr("close_panel")}">×</button>
          </div>
        </header>
        <div class="rpt-chips">
          <span class="rpt-chip" data-chip="op">${tr("filter_op_only")}</span>
          <span class="rpt-chip rpt-chip-blue" data-chip="mod">${tr("filter_mod_only")}</span>
          <span class="rpt-chip" data-chip="awarded">${tr("filter_awarded")}</span>
          <span style="flex:1"></span>
          <span class="rpt-chip" data-chip="__clear">${tr("filter_reset")}</span>
        </div>
        <nav class="rpt-tabs">
          <button data-tab="tree" class="active" role="tab" aria-selected="true">${I.tree} ${tr("tree")}</button>
          <button data-tab="tools">${I.panel} ${tr("tools")}</button>
          <button data-tab="collect">${I.star} ${tr("collect")}</button>
          <button data-tab="filters">${I.filter} ${tr("clean")}</button>
          <button data-tab="highlight">${I.tag} ${tr("keywords_tab")}</button>
          <button data-tab="stats">${I.stats} ${tr("stats")}</button>
          <button data-tab="power">${I.summary} ${tr("power")}</button>
          <button data-tab="export">${I.export} ${tr("export")}</button>
        </nav>
        <section class="rpt-tab-body">
          <div data-panel="tree" class="rpt-tabpane active">
            <div class="rpt-tree-toolbar">
              <input class="rpt-search-box" placeholder="${tr("search_text_author")}" aria-label="${tr("search_comments")}">
              <select class="rpt-author-filter" aria-label="${tr("filter_by_author")}"><option value="">${tr("all_authors")}</option></select>
              <button class="rpt-match-prev" title="${tr("previous_match")}" aria-label="${tr("previous_match")}">◀</button>
              <button class="rpt-match-next" title="${tr("next_match")}" aria-label="${tr("next_match")}">▶</button>
              <span class="rpt-match-count" aria-live="polite"></span>
              <span class="rpt-tree-count" aria-live="polite"></span>
            </div>
            <div class="rpt-tree-container"></div>
          </div>
          <div data-panel="tools" class="rpt-tabpane">
            <div class="rpt-section-title">${tr("views")}</div>
            <div class="rpt-btnrow">
              <button data-act="summary">${I.summary}<div><strong>${tr("smart_summary_title")}</strong><span class="rpt-btn-sub">${tr("views_sub_summary")}</span></div></button>
              <button data-act="conv">${I.chat}<div><strong>${tr("conversation_mode")}</strong><span class="rpt-btn-sub">${tr("views_sub_conv")}</span></div></button>
              <button data-act="gallery">${I.image}<div><strong>${tr("image_gallery")}</strong><span class="rpt-btn-sub">${tr("views_sub_gallery")}</span></div></button>
              <button data-act="layers">${I.layers}<div><strong>${tr("depth_layers_title")}</strong><span class="rpt-btn-sub">${tr("views_sub_layers")}</span></div></button>
            </div>
            <div class="rpt-section-title">${tr("folding")}</div>
            <div class="rpt-btnrow">
              <button data-act="collapse">${I.fold}${tr("collapse_all_comments")}</button>
              <button data-act="expand">${I.fold}${tr("expand_all_comments")}</button>
            </div>
            <div class="rpt-section-title">${tr("automation")}</div>
            <div id="rpt-autorun-list"></div>
            <div class="rpt-section-title">${tr("help")}</div>
            <div class="rpt-btnrow">
              <button data-act="kbd">${I.kbd}${tr("keyboard_shortcuts")}</button>
              <button data-act="analytics">${I.stats}${tr("open_analytics_dashboard")}</button>
              <button data-act="settings">${I.settings}${tr("open_settings")}</button>
            </div>
          </div>
          <div data-panel="collect" class="rpt-tabpane">
            <p class="rpt-muted">${tr("saved_comments_desc")}</p>
            <div id="rpt-collect-list"></div>
          </div>
          <div data-panel="filters" class="rpt-tabpane">
            <p class="rpt-muted">${tr("filters_desc")}</p>
            <label><input type="checkbox" data-f="hideDeleted"> ${tr("hide_deleted_removed")}</label>
            <label><input type="checkbox" data-f="hideEmpty"> ${tr("hide_empty_comments")}</label>
            <label><input type="checkbox" data-f="hideBots"> ${tr("hide_bots_am")}</label>
            <label><input type="checkbox" data-f="hideShort"> ${tr("hide_very_short_comments")}</label>
            <label><input type="checkbox" data-f="hideLowScore"> ${tr("hide_low_score_comments")}</label>
          </div>
          <div data-panel="highlight" class="rpt-tabpane">
            <p class="rpt-muted">${tr("kw_panel_desc")}</p>
            <textarea class="rpt-kw" rows="3" placeholder="${tr("kw_placeholder")}"></textarea>
            <button class="rpt-kw-save">${tr("save_keywords")}</button>
          </div>
          <div data-panel="stats" class="rpt-tabpane rpt-stats"></div>
          <div data-panel="power" class="rpt-tabpane rpt-power"></div>
          <div data-panel="export" class="rpt-tabpane">
            <p class="rpt-muted">${tr("export_thread_desc")}</p>
            <div class="rpt-btnrow">
              <button data-act="md">${I.export}${tr("export_markdown")}</button>
              <button data-act="json">${I.export}${tr("export_json")}</button>
              <button data-act="html">${I.export}${tr("export_as_html")}</button>
            </div>
          </div>
        </section>`;
    },
    async wirePanel(p) {
      RPT.features.commentTree.parse();
      RPT.features.commentTree.renderInto(p.querySelector(".rpt-tree-container"));
      /* Populate author dropdown and wire combined text+author filter. */
      const search = p.querySelector(".rpt-search-box");
      const authorSel = p.querySelector(".rpt-author-filter");
      const countEl = p.querySelector(".rpt-tree-count");
      const authors = RPT.features.commentTree.authorList();
      authorSel.innerHTML = `<option value="">${tr("all_authors")}</option>` +
        authors.map((a) => `<option value="${RPT.utils.escapeHtml(a.toLowerCase())}">${RPT.utils.escapeHtml(a)}</option>`).join("");
      const applyFilter = () => {
        const q = search.value.trim().toLowerCase();
        const a = authorSel.value;
        let shown = 0, total = 0;
        p.querySelectorAll(".rpt-tree li").forEach((li) => {
          total++;
          const okText = !q || (li.dataset.text || "").includes(q) || (li.dataset.author || "").includes(q);
          const okAuthor = !a || li.dataset.author === a;
          const visible = okText && okAuthor;
          li.style.display = visible ? "" : "none";
          if (visible) shown++;
        });
        countEl.textContent = q || a ? `${shown}/${total}` : `${total}`;
      };
      search.oninput = applyFilter;
      authorSel.onchange = applyFilter;
      applyFilter();
      /* Prev/Next match cycling — jumps through visible tree rows so the
         user can walk keyword/author matches without expanding each node.
         Resets the cursor whenever the filter changes. */
      const prevBtn = p.querySelector(".rpt-match-prev");
      const nextBtn = p.querySelector(".rpt-match-next");
      const resetIdx = () => { RPT.features.commentTree._matchIdx = -1; };
      search.addEventListener("input", resetIdx);
      authorSel.addEventListener("change", resetIdx);
      if (prevBtn) prevBtn.onclick = () => RPT.features.commentTree.cycle("prev", p);
      if (nextBtn) nextBtn.onclick = () => RPT.features.commentTree.cycle("next", p);
      p.querySelector(".rpt-panel-close").onclick = () => p.remove();
      const refreshBtn = p.querySelector(".rpt-panel-refresh");
      if (refreshBtn) {
        refreshBtn.onclick = async () => {
          refreshBtn.classList.add("rpt-spin");
          try { await RPT.resync(); } finally {
            setTimeout(() => refreshBtn.classList.remove("rpt-spin"), 400);
          }
        };
      }
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
          try { b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } catch {}
          p.querySelector(`[data-panel="${b.dataset.tab}"]`).classList.add("active");
          if (b.dataset.tab === "stats") this.renderStats(p);
          if (b.dataset.tab === "collect") this.renderCollections(p);
          if (b.dataset.tab === "tools") this.renderAutorun(p);
          if (b.dataset.tab === "power") this.renderPower(p);
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
            this.updateActiveStates(p);
          }
          if (a === "collapse") { RPT.features.folding.collapseAll(); b.classList.add("rpt-active"); p.querySelector('[data-act="expand"]')?.classList.remove("rpt-active"); }
          if (a === "expand") { RPT.features.folding.expandAll(); b.classList.add("rpt-active"); p.querySelector('[data-act="collapse"]')?.classList.remove("rpt-active"); }
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
      this.updateActiveStates(p);
    },
    updateActiveStates(root = document) {
      const layersOn = document.body.classList.contains("rpt-layers-on");
      root.querySelectorAll('[data-act="layers"]').forEach((btn) => {
        btn.classList.toggle("rpt-active", layersOn);
        btn.setAttribute("aria-pressed", layersOn ? "true" : "false");
        btn.title = layersOn ? tr("active_on") : tr("inactive_off");
      });
      root.querySelectorAll('[data-act="summary"], [data-act="conv"], [data-act="gallery"]').forEach((btn) => {
        btn.setAttribute("aria-pressed", "false");
      });
    },
    async renderAutorun(p) {
      const host = p.querySelector("#rpt-autorun-list");
      if (!host) return;
      const auto = await RPT.autorun.load();
      const items = [
        ["cleaner", tr("auto_cleaner")],
        ["highlighter", tr("auto_highlight")],
        ["tags", tr("auto_tags")],
        ["ageWarning", tr("auto_age")],
        ["saveButtons", tr("auto_star")],
        ["liveNew", tr("live_new_indicator")],
      ];
      host.innerHTML = items.map(([k, label]) =>
        `<label class="rpt-auto-row ${auto[k] ? "rpt-active" : ""}"><input type="checkbox" data-auto="${k}" ${auto[k] ? "checked" : ""}> <span>${label}</span><em>${auto[k] ? tr("on") : tr("off")}</em></label>`
      ).join("");
      host.querySelectorAll("[data-auto]").forEach((cb) => {
        cb.onchange = async () => {
          const cur = await RPT.autorun.load();
          cur[cb.dataset.auto] = cb.checked;
          await RPT.autorun.save(cur);
          cb.closest(".rpt-auto-row")?.classList.toggle("rpt-active", cb.checked);
          const state = cb.closest(".rpt-auto-row")?.querySelector("em");
          if (state) state.textContent = cb.checked ? tr("on") : tr("off");
          if (cb.dataset.auto === "liveNew") cb.checked ? RPT.features.liveNew.start() : RPT.features.liveNew.stop();
          if (cb.dataset.auto === "cleaner") RPT.features.cleaner.apply();
          if (cb.dataset.auto === "highlighter") RPT.features.highlighter.apply();
          if (cb.dataset.auto === "saveButtons") RPT.features.collections.attach();
        };
      });
    },
    async renderCollections(p) {
      const host = p.querySelector("#rpt-collect-list");
      const all = await RPT.features.collections.list();
      if (!all.length) {
        host.innerHTML = `<p class="rpt-empty">${tr("no_saved_comments")}</p>`;
        return;
      }
      host.innerHTML = all.map((c) => `
        <div class="rpt-collect-item" data-id="${RPT.utils.escapeHtml(c.id)}">
          <button class="rpt-collect-remove" title="${tr("remove")}" aria-label="${tr("remove")}">×</button>
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
    /* Renders all 36 Power Feature modules directly inside the side panel,
     * grouped by category, with a run button and enable/disable toggle each.
     * State is stored via V.HUB_KEY, shared with the (still-available) modal hub. */
    async renderPower(p) {
      const host = p.querySelector('[data-panel="power"]');
      if (!host) return;
      const V = window.RPT?.v2;
      if (!V || !V.modules) {
        host.innerHTML = `<p class="rpt-empty">${tr("loading") || "Loading…"}</p>`;
        setTimeout(() => this.renderPower(p), 300);
        return;
      }
      const esc = RPT.utils.escapeHtml;
      const CATS = [
        [tr("community"),           ["communityCompare","subAnalyzer","calendar","subHealth","timeline","trendTracker","subGroups","contentExporter"]],
        [tr("thread_comments"),     ["miniMap","commentExport","userAnalytics","postAnalytics","copyTools","followKeywords"]],
        [tr("filtering_feed"),      ["flairTools","qualityFilter","feedDedup","ageSort","mediaToggle","oldGold","sidebarCleaner"]],
        [tr("discovery_knowledge"), ["bookmarks","savedManager","research","topicTracker","random","history","achievements","wikiNav","resourceCollector"]],
        [tr("utilities"),           ["searchEnhancer","linksManager","explainLink","exportLibrary","repostDetector","devMode"]],
        [tr("system_category"),     ["perfStatus","perSubreddit","backup"]],
      ];
      const enabled = await V.getEnabled();
      const search = `<input class="rpt-power-search" placeholder="${tr("search_features")}" aria-label="${tr("search_features")}">`;
      const groups = CATS.map(([cat, ids]) => `
        <div class="rpt-power-group">
          <div class="rpt-section-title">${esc(cat)}</div>
          <div class="rpt-power-grid">
            ${ids.map((id) => {
              const mod = V.modules[id]; if (!mod) return "";
              const on = enabled[id] !== false;
              return `<div class="rpt-power-card ${on ? "" : "rpt-power-off"}" data-id="${id}">
                <button class="rpt-power-run" data-run="${id}" title="${tr("run") || tr("open") || "Run"}">
                  <strong>${esc(window.RPT_I18N?.text(mod.name) || mod.name)}</strong>
                  <span>${esc(window.RPT_I18N?.text(mod.desc) || mod.desc)}</span>
                </button>
                <label class="rpt-power-toggle switch" title="${tr("enable_disable")}">
                  <input type="checkbox" data-tog="${id}" ${on ? "checked" : ""}>
                  <span class="rpt-slider"></span>
                </label>
              </div>`;
            }).join("")}
          </div>
        </div>`).join("");
      host.innerHTML = `
        <p class="rpt-muted">${tr("power_hub_desc")}</p>
        ${search}
        ${groups}`;
      const q = host.querySelector(".rpt-power-search");
      q.oninput = () => {
        const v = q.value.toLowerCase();
        host.querySelectorAll(".rpt-power-card").forEach((c) => {
          c.style.display = c.textContent.toLowerCase().includes(v) ? "" : "none";
        });
        host.querySelectorAll(".rpt-power-group").forEach((g) => {
          const any = Array.from(g.querySelectorAll(".rpt-power-card")).some((c) => c.style.display !== "none");
          g.style.display = any ? "" : "none";
        });
      };
      host.querySelectorAll("[data-run]").forEach((b) => {
        b.onclick = async () => {
          const id = b.dataset.run;
          const en = await V.getEnabled();
          if (en[id] === false) { V._toast?.(tr("feature_disabled_turn_on") || tr("feature_disabled")); return; }
          try { await V.modules[id].run?.(); }
          catch (e) { console.error(e); V._toast?.(`${tr("feature_error")}: ${e.message}`); }
        };
      });
      host.querySelectorAll("[data-tog]").forEach((cb) => {
        cb.onchange = async (e) => {
          e.stopPropagation();
          await V._storage.patch(V.HUB_KEY, {}, (c) => { c[cb.dataset.tog] = cb.checked; return c; });
          cb.closest(".rpt-power-card").classList.toggle("rpt-power-off", !cb.checked);
        };
      });
    },
    renderStats(p) {
      RPT.features.commentTree.parse();
      const s = RPT.features.analytics.compute();
      const h = RPT.features.health.analyze();
      const el = p.querySelector('[data-panel="stats"]');
      if (!s) { el.innerHTML = `<p class="rpt-empty">${tr("no_comments_page")}</p>`; return; }
      const jump = (author) => {
        const c = RPT.state.comments.find((x) => x.author === author);
        if (!c) return;
        c.el.scrollIntoView({ behavior: "smooth", block: "center" });
        c.el.classList.add("rpt-flash"); setTimeout(() => c.el.classList.remove("rpt-flash"), 1500);
      };
      const jumpDeepest = () => {
        const deepest = RPT.state.comments.slice().sort((a, b) => b.depth - a.depth)[0];
        if (deepest) { deepest.el.scrollIntoView({ behavior: "smooth", block: "center" });
          deepest.el.classList.add("rpt-flash"); setTimeout(() => deepest.el.classList.remove("rpt-flash"), 1500); }
      };
      const jumpLongest = () => jump(s.longest.author);
      const jumpFirst = () => {
        const first = RPT.state.comments[0];
        if (first) { first.el.scrollIntoView({ behavior: "smooth", block: "center" });
          first.el.classList.add("rpt-flash"); setTimeout(() => first.el.classList.remove("rpt-flash"), 1500); }
      };
      const chipsHtml = (arr, fmt) => arr.map(([u, n]) => `<span class="rpt-stat-chip" data-author="${RPT.utils.escapeHtml(u)}">${RPT.utils.escapeHtml(u)} <em>${fmt(n)}</em></span>`).join(" ") || "—";
      const branchesHtml = (arr) => arr.map((b) => `<span class="rpt-stat-chip" data-author="${RPT.utils.escapeHtml(b.author)}">${RPT.utils.escapeHtml(b.author)} <em>${b.size}</em></span>`).join(" ") || "—";
      el.innerHTML = `
        <div class="rpt-card rpt-clickable" data-jump="first" title="${tr("jump_first_comment")}"><div class="rpt-k">${tr("comments_loaded")}</div><div class="rpt-v">${s.total}</div></div>
        <div class="rpt-card"><div class="rpt-k">${tr("avg_length")}</div><div class="rpt-v">${s.avgLength} ${tr("chars")}</div></div>
        <div class="rpt-card rpt-clickable" data-jump="deepest" title="${tr("jump_deepest_comment")}"><div class="rpt-k">${tr("deepest_chain")}</div><div class="rpt-v">${s.deepest}</div></div>
        <div class="rpt-card rpt-clickable" data-jump="longest" title="${tr("jump_longest_comment")}"><div class="rpt-k">${tr("longest_comment")}</div><div class="rpt-v">${RPT.utils.escapeHtml(s.longest.author)} — ${s.longest.length} ${tr("chars")}</div></div>
        <div class="rpt-card"><div class="rpt-k">${tr("most_replied")}</div><div class="rpt-v rpt-chips-v">${chipsHtml(s.mostReplied, (n) => `(${n})`)}</div></div>
        <div class="rpt-card"><div class="rpt-k">${tr("top_branches")}</div><div class="rpt-v rpt-chips-v">${branchesHtml(s.branches)}</div></div>
        <div class="rpt-card rpt-health">
          <div class="rpt-k">${tr("thread_health")}</div>
          <div class="rpt-v">${h.score}/100</div>
          <div class="rpt-health-bar"><div class="rpt-health-fill" style="width:${h.score}%"></div></div>
          <ul>${h.notes.map((n) => `<li>${RPT.utils.escapeHtml(n)}</li>`).join("")}</ul>
        </div>`;
      el.querySelectorAll(".rpt-card[data-jump]").forEach((card) => {
        card.onclick = () => {
          const k = card.dataset.jump;
          if (k === "first") jumpFirst();
          else if (k === "deepest") jumpDeepest();
          else if (k === "longest") jumpLongest();
        };
      });
      el.querySelectorAll(".rpt-stat-chip").forEach((chip) => {
        chip.onclick = () => jump(chip.dataset.author);
      });
    },
  };

  /* ---------------- Bootstrap ---------------- */
  RPT.status = {
    set(state, msg) {
      // state: "parsing" | "ready" | "idle"
      const label = msg || (state === "parsing" ? tr("parsing") : state === "ready" ? tr("ready") : tr("idle"));
      document.querySelectorAll(".rpt-status-pill").forEach((el) => {
        el.dataset.state = state;
        const t = el.querySelector(".rpt-status-txt");
        if (t) t.textContent = label;
        // Auto-hide the pill shortly after "ready" so it doesn't sit there
        // pulsing/flashing forever. Only visible while actively parsing.
        clearTimeout(el._rptHide);
        if (state === "ready" || state === "idle") {
          el._rptHide = setTimeout(() => { el.dataset.state = "hidden"; }, 1400);
        }
      });
      // Reliable screen-reader announcement — the pill itself may not be
      // visible when the panel is closed, so route through a dedicated
      // visually-hidden aria-live region.
      try { RPT.a11y?.announce(`${tr("thread_status")}: ${label}`); } catch {}
    },
  };
  const _runAllImpl = async () => {
    if (!RPT.enabled) return;
    RPT._parsing = true;
    RPT.status.set("parsing", tr("parsing_thread"));
    const auto = await RPT.autorun.load();
    RPT.features.commentTree.parse();
    RPT.features.layers.remove();
    if (document.body.classList.contains("rpt-layers-on")) RPT.features.layers.apply();
    await RPT.features.folding.restore();
    if (auto.cleaner) await RPT.features.cleaner.apply();
    if (auto.highlighter) await RPT.features.highlighter.apply();
    if (auto.tags) await RPT.features.userTags.apply();
    await RPT.features.authorColors.apply();
    await RPT.features.rules.apply();
    RPT.features.chips.apply();
    await RPT.features.collections.attach();
    RPT.features.toolbar.attach();
    if (auto.ageWarning) RPT.features.ageWarning.check();
    RPT.features.history.record();
    RPT.features.history.trackAnalytics();
    RPT.status.set("ready", `${tr("ready")} · ${RPT.state.comments.length} ${tr("comments")}`);
    // Give the DOM a tick to settle so the MutationObserver we set below
    // doesn't fire on our own edits and cause a parsing/ready flicker.
    setTimeout(() => { RPT._parsing = false; }, 300);
  };
  const runAll = RPT.utils.debounce(_runAllImpl, 400);
  // Force immediate re-parse — used by the panel Refresh button.
  RPT.resync = async () => {
    RPT.state = { tree: null, comments: [], post: null };
    await _runAllImpl();
    // Refresh open panel tabs so stats/tree reflect the new parse.
    const p = document.querySelector(".rpt-panel");
    if (p) {
      const active = p.querySelector(".rpt-tabs button.active")?.dataset.tab;
      RPT.features.commentTree.renderInto(p.querySelector(".rpt-tree-container"));
      if (active === "stats") RPT.ui.renderStats(p);
      if (active === "collect") RPT.ui.renderCollections(p);
    }
  };

  const boot = () => {
    // Ensure theme + i18n are ready for injected UI
    window.RPT_THEME?.load();
    window.RPT_I18N?.load();
    window.RPT_A11Y?.load();
    RPT.a11y.ensureLive();
    RPT.customKeys.load();
    // Master ON/OFF from the popup — everything short-circuits when off.
    RPT.setEnabled = (on) => {
      RPT.enabled = !!on;
      document.documentElement.dataset.rptOff = on ? "" : "1";
      if (!on) {
        // Unhide every comment RPT had filtered out.
        document.querySelectorAll(".rpt-hidden").forEach((el) => el.classList.remove("rpt-hidden"));
        document.querySelectorAll(".rpt-panel, .rpt-tour, .rpt-modal").forEach((el) => el.remove());
      } else {
        runAll();
      }
    };
    try {
      chrome.storage.local.get("rpt_enabled", (v) => {
        RPT.enabled = v?.rpt_enabled !== false;
        document.documentElement.dataset.rptOff = RPT.enabled ? "" : "1";
      });
    } catch {}
    RPT.ui.mount();
    RPT.features.linkPreview.attach();
    RPT.features.shortcuts.init();
    RPT.features.liveNew.start();
    // Detect SPA navigation between Reddit threads and re-run everything.
    (() => {
      let last = location.href;
      const onNav = () => {
        if (location.href === last) return;
        last = location.href;
        RPT.state = { tree: null, comments: [], post: null };
        RPT.features.liveNew.stop();
        setTimeout(() => { runAll(); RPT.features.liveNew.start(); }, 600);
      };
      window.addEventListener("popstate", onNav);
      const _ps = history.pushState, _rs = history.replaceState;
      history.pushState = function () { const r = _ps.apply(this, arguments); onNav(); return r; };
      history.replaceState = function () { const r = _rs.apply(this, arguments); onNav(); return r; };
    })();
    // Re-apply rules whenever they change from Options
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local") return;
        if (changes.rpt_rules) RPT.features.rules.apply();
        if (changes.rpt_autorun) { RPT.features.liveNew.start(); }
        if (changes.rpt_general) RPT.features.authorColors.apply();
        if (changes.rpt_shortcuts) {
          RPT.customKeys.load().then(() => RPT.a11y.refreshKeyHelp());
        }
        if (changes.rpt_enabled) RPT.setEnabled(changes.rpt_enabled.newValue !== false);
      });
    } catch {}
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
    /* ---------- Deep-link handler ----------
       Shareable URLs:
         …/comments/…#rpt-c=<comment-id>
         …/comments/…#rpt-author=<username>
       On load (and on hashchange) we open the panel on the Tree tab and
       flash-highlight the first matching comment. Waits briefly for the
       tree parse to finish on slow threads. */
    RPT.handleDeepLink = function () {
      const h = location.hash || "";
      const m = h.match(/rpt-(c|comment|author)=([^&]+)/i);
      if (!m || !RPT.utils.isRedditThread()) return;
      const kind = m[1].toLowerCase();
      const value = decodeURIComponent(m[2]);
      const tryFocus = (attempt = 0) => {
        RPT.features.commentTree.parse();
        const node = kind === "author"
          ? RPT.features.commentTree.findByAuthor(value)
          : RPT.features.commentTree.findById(value);
        if (node) {
          RPT.ui.ensurePanel();
          setTimeout(() => RPT.features.commentTree.focusNode(node), 200);
        } else if (attempt < 20) {
          setTimeout(() => tryFocus(attempt + 1), 400);
        }
      };
      setTimeout(tryFocus, 800);
    };
    RPT.handleDeepLink();
    window.addEventListener("hashchange", () => RPT.handleDeepLink());
    // ---------- Accessibility focus-order overlay ----------
    // Shortcut: Alt+Shift+A toggles a lightweight overlay that numbers every
    // tabbable element in the DOM (buttons, links, inputs, [tabindex>=0]) so
    // keyboard users can audit focus order. Esc closes it. 100% local, no data
    // leaves the page. Also exposed as window.RPT.a11yOverlay.toggle().
    RPT.a11yOverlay = (function () {
      const HOST_ID = "rpt-a11y-overlay";
      const isVisible = (el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        const s = getComputedStyle(el);
        return s.visibility !== "hidden" && s.display !== "none";
      };
      function tabbables() {
        const sel = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
        return [...document.querySelectorAll(sel)].filter((el) => isVisible(el) && !el.closest("#" + HOST_ID));
      }
      function render() {
        remove();
        const host = document.createElement("div");
        host.id = HOST_ID;
        host.setAttribute("role", "region");
        host.setAttribute("aria-label", "Accessibility focus-order overlay");
        host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483646";
        const legend = document.createElement("div");
        legend.style.cssText = "position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#0d1117;color:#fff;border:1px solid #ff4500;padding:8px 14px;border-radius:10px;font:600 13px system-ui;pointer-events:auto;box-shadow:0 8px 30px rgba(0,0,0,.4)";
        legend.textContent = "Focus-order overlay — Esc to close";
        host.appendChild(legend);
        tabbables().forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const ring = document.createElement("div");
          ring.style.cssText = `position:fixed;left:${r.left - 2}px;top:${r.top - 2}px;width:${r.width + 4}px;height:${r.height + 4}px;outline:2px solid #ff4500;outline-offset:0;border-radius:6px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.4)`;
          const badge = document.createElement("div");
          badge.textContent = String(i + 1);
          badge.style.cssText = `position:fixed;left:${r.left - 10}px;top:${r.top - 10}px;background:#ff4500;color:#fff;font:700 11px system-ui;min-width:18px;height:18px;padding:0 4px;border-radius:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35)`;
          host.appendChild(ring); host.appendChild(badge);
        });
        document.documentElement.appendChild(host);
      }
      function remove() { document.getElementById(HOST_ID)?.remove(); }
      function toggle() { document.getElementById(HOST_ID) ? remove() : render(); }
      document.addEventListener("keydown", (e) => {
        if (e.altKey && e.shiftKey && (e.key === "A" || e.key === "a")) { e.preventDefault(); toggle(); }
        else if (e.key === "Escape" && document.getElementById(HOST_ID)) { remove(); }
      }, true);
      // Reposition on scroll/resize while visible
      const reflow = () => { if (document.getElementById(HOST_ID)) render(); };
      window.addEventListener("resize", reflow);
      window.addEventListener("scroll", reflow, true);
      return { toggle, show: render, hide: remove };
    })();
    // Only re-parse on real Reddit comment DOM changes. Ignore mutations
    // caused by RPT itself (marked with the rpt- prefix or inside our UI)
    // and skip while a parse is in flight — this fixes the constant
    // "Parsing… / Ready" flashing users saw before.
    new MutationObserver((muts) => {
      if (!RPT.enabled || RPT._parsing) return;
      for (const m of muts) {
        const t = m.target;
        if (t?.closest?.(".rpt-panel, .rpt-quickbar, .rpt-modal, .rpt-tour, .rpt-sr-live, .rpt-status-pill")) continue;
        const addedReal = [...m.addedNodes].some((n) => {
          if (n.nodeType !== 1) return false;
          if (n.className && typeof n.className === "string" && n.className.startsWith("rpt-")) return false;
          return n.tagName === "SHREDDIT-COMMENT" || n.querySelector?.("shreddit-comment, [data-testid='comment']");
        });
        if (addedReal) { runAll(); return; }
      }
    }).observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
