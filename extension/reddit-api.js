/*
 * Reddit Power Toolkit — reddit-api.js
 *
 * Thin client for Reddit's *public* JSON endpoints. All calls use the current
 * page's logged-in cookies (`credentials: "include"`) so nothing is sent to a
 * third-party server — this only talks to reddit.com, exactly like the
 * browser tab does. No API key, no OAuth, no backend.
 *
 * Every method is cached in-memory for 60s so we never hammer Reddit even if
 * multiple modules ask for the same data at once. Fetches degrade silently:
 * if the endpoint fails (rate-limited, logged out, private sub, network),
 * callers fall back to DOM harvest.
 */
(function () {
  "use strict";
  if (window.RPT_API) return;

  const TTL = 60_000; // 60s per URL
  const mem = new Map(); // url -> { at, data }
  const inflight = new Map(); // url -> Promise

  const stats = { hits: 0, misses: 0, errors: 0, lastCall: 0, lastUrl: "" };

  /* Rolling request log for the Data Sources / Diagnostics inspector.
   * Keeps the last 200 requests with module tag, url, status, duration, error. */
  const LOG_MAX = 200;
  const log = []; // newest first
  /* Per-endpoint summary: url -> { last, ok, status, ms, error, hits, module } */
  const summary = new Map();
  /* Per-module rollup: moduleId -> { calls, errors, lastAt, endpoints:Set } */
  const perModule = new Map();

  let currentTag = ""; // ambient module tag for fetches nested inside a module
  function withTag(module, fn) {
    const prev = currentTag; currentTag = module || "";
    try { return fn(); } finally { currentTag = prev; }
  }
  function tag(module) { currentTag = module || ""; }

  function record(entry) {
    log.unshift(entry);
    if (log.length > LOG_MAX) log.length = LOG_MAX;
    summary.set(entry.url, entry);
    if (entry.module) {
      const r = perModule.get(entry.module) || { calls: 0, errors: 0, lastAt: 0, endpoints: new Set() };
      r.calls++; if (!entry.ok) r.errors++;
      r.lastAt = entry.at; r.endpoints.add(entry.url);
      perModule.set(entry.module, r);
    }
  }

  function origin() {
    return location.origin.includes("reddit.com") ? location.origin : "https://www.reddit.com";
  }

  async function getJSON(path, opts = {}) {
    const url = (opts.absolute ? "" : origin()) + path;
    const module = opts.module || currentTag || "";
    stats.lastCall = Date.now();
    stats.lastUrl = url;
    const hit = mem.get(url);
    if (hit && Date.now() - hit.at < TTL && !opts.force) {
      stats.hits++;
      record({ url, module, at: Date.now(), ok: hit.data != null, status: 200, ms: 0, cached: true, size: hit.size || 0 });
      return hit.data;
    }
    if (inflight.has(url)) return inflight.get(url);
    stats.misses++;
    const t0 = Date.now();
    const p = fetch(url, { credentials: "include", headers: { Accept: "application/json" } })
      .then(async (r) => {
        const ms = Date.now() - t0;
        if (!r.ok) {
          record({ url, module, at: Date.now(), ok: false, status: r.status, ms, error: `HTTP ${r.status}` });
          inflight.delete(url);
          return null;
        }
        const text = await r.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        mem.set(url, { at: Date.now(), data, size: text.length });
        record({ url, module, at: Date.now(), ok: data != null, status: r.status, ms, size: text.length });
        inflight.delete(url);
        return data;
      })
      .catch((e) => {
        const ms = Date.now() - t0;
        stats.errors++;
        record({ url, module, at: Date.now(), ok: false, status: 0, ms, error: String(e?.message || e) });
        inflight.delete(url);
        return null;
      });
    inflight.set(url, p);
    return p;
  }

  /* ---- URL/context helpers ---- */
  function currentSub() {
    const m = location.pathname.match(/\/r\/([^/]+)/);
    return m ? m[1] : "";
  }
  function currentPostId() {
    const m = location.pathname.match(/\/comments\/([a-z0-9]+)/i);
    return m ? m[1] : "";
  }
  function currentUser() {
    const m = location.pathname.match(/\/(?:u|user)\/([^/]+)/);
    return m ? m[1] : "";
  }
  function permalinkToId(link) {
    if (!link) return "";
    const m = String(link).match(/\/comments\/([a-z0-9]+)/i);
    return m ? m[1] : "";
  }

  /* ---- Subreddit endpoints ---- */
  const about   = (sub, o) => getJSON(`/r/${sub}/about.json?raw_json=1`, o).then((r) => r?.data || null);
  const rules   = (sub, o) => getJSON(`/r/${sub}/about/rules.json`, o);
  const mods    = (sub, o) => getJSON(`/r/${sub}/about/moderators.json`, o);
  const flairs  = (sub, o) => getJSON(`/r/${sub}/api/link_flair_v2.json`, o).catch(() => null);
  const widgets = (sub, o) => getJSON(`/r/${sub}/api/widgets.json?progressive_images=true`, o);
  const info    = (sub, o) => getJSON(`/api/info.json?sr_name=${encodeURIComponent(sub)}&raw_json=1`, o);

  /* ---- Fallback wrappers with diagnostics ----
   * When about.json returns no members/created (rare for private/quarantined
   * or when logged-out), try /api/info.json?sr_name= and reconstruct the
   * fields from that Listing payload. */
  async function aboutWithFallback(sub, opts = {}) {
    const sources = [];
    let data = await about(sub, opts);
    sources.push({ url: `/r/${sub}/about.json`, ok: !!(data && data.subscribers != null),
      fields: data ? pickAboutFields(data) : null });
    if (!data || data.subscribers == null) {
      const alt = await info(sub, opts);
      const first = alt?.data?.children?.[0]?.data || null;
      sources.push({ url: `/api/info.json?sr_name=${sub}`, ok: !!first,
        fields: first ? pickAboutFields(first) : null });
      if (first && (!data || data.subscribers == null)) data = { ...first, ...(data || {}) };
    }
    return { data, sources };
  }
  function pickAboutFields(d) {
    return {
      members: d.subscribers ?? null,
      online: d.active_user_count ?? d.accounts_active ?? null,
      created_utc: d.created_utc ?? null,
      title: d.title || null,
      description: d.public_description || d.description || null,
      over18: !!d.over18,
      subreddit_type: d.subreddit_type || null,
    };
  }

  /* Rules: primary rules.json. If empty, mine rules from the widgets payload
   * (Reddit renders the sidebar rules widget from this endpoint). */
  async function rulesWithFallback(sub, opts = {}) {
    const sources = [];
    const primary = await rules(sub, opts);
    let list = Array.isArray(primary?.rules) ? primary.rules.map((r) => ({
      short_name: r.short_name || r.violation_reason || "",
      description: r.description || "",
    })) : [];
    sources.push({ url: `/r/${sub}/about/rules.json`, ok: list.length > 0,
      fields: { count: list.length } });
    if (!list.length) {
      const w = await widgets(sub, opts);
      const items = w?.items || {};
      const rulesWidget = Object.values(items).find((it) => it?.kind === "subreddit-rules");
      const arr = rulesWidget?.data || [];
      list = arr.map((r) => ({ short_name: r.shortName || r.name || "", description: r.description || "" }));
      sources.push({ url: `/r/${sub}/api/widgets.json`, ok: list.length > 0,
        fields: { count: list.length, from: "subreddit-rules widget" } });
    }
    return { rules: list, sources };
  }

  async function posts(sub, sort = "hot", params = {}) {
    const qs = new URLSearchParams({ limit: "100", raw_json: "1", ...params }).toString();
    const r = await getJSON(`/r/${sub}/${sort}.json?${qs}`, params.__opts);
    const kids = r?.data?.children || [];
    return kids.map((k) => normalizePost(k.data)).filter(Boolean);
  }

  function normalizePost(d) {
    if (!d) return null;
    return {
      id: d.id,
      title: d.title || "",
      author: d.author || "",
      score: d.score ?? 0,
      ups: d.ups ?? 0,
      upvoteRatio: d.upvote_ratio ?? null,
      comments: d.num_comments ?? 0,
      permalink: d.permalink ? "https://www.reddit.com" + d.permalink : (d.url || ""),
      url: d.url || "",
      domain: d.domain || "",
      flair: d.link_flair_text || "",
      flairCssClass: d.link_flair_css_class || "",
      type: d.is_self ? "text" : (d.post_hint === "image" || /\.(png|jpe?g|gif|webp)$/i.test(d.url || "") ? "image"
           : d.is_video || /youtube|youtu\.be|vimeo/.test(d.domain || "") ? "video" : "link"),
      created: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : "",
      createdUtc: d.created_utc || 0,
      nsfw: !!d.over_18,
      spoiler: !!d.spoiler,
      locked: !!d.locked,
      stickied: !!d.stickied,
      removed: d.removed_by_category || null,
      awards: d.total_awards_received || 0,
      gilded: d.gilded || 0,
      distinguished: d.distinguished || null,
      thumbnail: /^https?:/.test(d.thumbnail || "") ? d.thumbnail : "",
      preview: d.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&") || "",
      selftext: d.selftext || "",
      crosspostParent: d.crosspost_parent || null,
      subreddit: d.subreddit || "",
    };
  }

  /* ---- Post + comments ---- */
  async function comments(postId, opts = {}) {
    if (!postId) return null;
    const qs = new URLSearchParams({ limit: String(opts.limit || 500), depth: String(opts.depth || 10), raw_json: "1" }).toString();
    const r = await getJSON(`/comments/${postId}.json?${qs}`);
    if (!Array.isArray(r) || r.length < 2) return null;
    const post = normalizePost(r[0].data.children[0].data);
    const flat = [];
    const walk = (kids, depth = 0, parent = null) => {
      (kids || []).forEach((k) => {
        if (k.kind !== "t1") return;
        const d = k.data;
        flat.push({
          id: d.id, author: d.author, body: d.body || "", score: d.score ?? 0,
          created: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : "",
          depth, parent, edited: !!d.edited, gilded: d.gilded || 0,
          controversial: !!d.controversiality, distinguished: d.distinguished || null,
          stickied: !!d.stickied, permalink: "https://www.reddit.com" + (d.permalink || ""),
          removed: d.body === "[removed]" || d.author === "[deleted]",
        });
        walk(d.replies?.data?.children, depth + 1, d.id);
      });
    };
    walk(r[1].data.children);
    return { post, comments: flat };
  }

  const duplicates = async (postId) => {
    const r = await getJSON(`/duplicates/${postId}.json`);
    if (!Array.isArray(r) || r.length < 2) return [];
    return (r[1]?.data?.children || []).map((k) => normalizePost(k.data)).filter(Boolean);
  };

  /* ---- Users ---- */
  const user = (name) => getJSON(`/user/${name}/about.json?raw_json=1`).then((r) => r?.data || null);
  const userPosts = async (name, limit = 100) => {
    const r = await getJSON(`/user/${name}/submitted.json?limit=${limit}&raw_json=1`);
    return (r?.data?.children || []).map((k) => normalizePost(k.data)).filter(Boolean);
  };
  const userComments = async (name, limit = 100) => {
    const r = await getJSON(`/user/${name}/comments.json?limit=${limit}&raw_json=1`);
    return (r?.data?.children || []).map((k) => {
      const d = k.data;
      return { id: d.id, subreddit: d.subreddit, body: d.body || "", score: d.score ?? 0,
        created: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : "",
        permalink: "https://www.reddit.com" + (d.permalink || "") };
    });
  };

  const search = async (q, opts = {}) => {
    const qs = new URLSearchParams({ q, limit: String(opts.limit || 50), sort: opts.sort || "relevance",
      t: opts.t || "all", raw_json: "1", ...(opts.sub ? { restrict_sr: "1" } : {}) }).toString();
    const path = opts.sub ? `/r/${opts.sub}/search.json?${qs}` : `/search.json?${qs}`;
    const r = await getJSON(path);
    return (r?.data?.children || []).map((k) => normalizePost(k.data)).filter(Boolean);
  };

  const savedByMe = async () => {
    const me = await getJSON(`/api/v1/me.json`).then((r) => r?.name || "");
    if (!me) return [];
    const r = await getJSON(`/user/${me}/saved.json?limit=100&raw_json=1`);
    return (r?.data?.children || []).map((k) => k.kind === "t3" ? normalizePost(k.data) : {
      id: k.data.id, kind: "comment", author: k.data.author, body: k.data.body,
      permalink: "https://www.reddit.com" + (k.data.permalink || "")
    });
  };

  window.RPT_API = {
    about, rules, mods, flairs, widgets, info, posts, comments, duplicates,
    aboutWithFallback, rulesWithFallback,
    user, userPosts, userComments, search, savedByMe,
    currentSub, currentPostId, currentUser, permalinkToId,
    normalizePost,
    withTag, tag,
    stats: () => ({ ...stats, cached: mem.size, inflight: inflight.size }),
    clearCache: (prefix) => {
      if (!prefix) { mem.clear(); return; }
      for (const k of [...mem.keys()]) if (k.includes(prefix)) mem.delete(k);
    },
    log: () => log.slice(),
    summary: () => [...summary.values()].sort((a, b) => b.at - a.at),
    perModule: () => {
      const out = {};
      perModule.forEach((v, k) => { out[k] = { ...v, endpoints: [...v.endpoints] }; });
      return out;
    },
    clearLog: () => { log.length = 0; summary.clear(); perModule.clear(); },
  };
})();