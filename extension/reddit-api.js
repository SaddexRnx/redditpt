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

  function origin() {
    // Same origin as the current tab — works on www / old / sh / new.
    return location.origin.includes("reddit.com") ? location.origin : "https://www.reddit.com";
  }

  async function getJSON(path) {
    const url = origin() + path;
    stats.lastCall = Date.now();
    stats.lastUrl = url;
    const hit = mem.get(url);
    if (hit && Date.now() - hit.at < TTL) { stats.hits++; return hit.data; }
    if (inflight.has(url)) return inflight.get(url);
    stats.misses++;
    const p = fetch(url, { credentials: "include", headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { mem.set(url, { at: Date.now(), data }); inflight.delete(url); return data; })
      .catch((e) => { stats.errors++; inflight.delete(url); return null; });
    inflight.set(url, p);
    return p;
  }

  /* ---- URL/context helpers ---- */
  function currentSub() {
    const m = location.pathname.match(/\/r\/([^/]+)/);
    return m ? m[1] : "";
  }
  function currentPostId() {
    // /r/{sub}/comments/{id}/{slug}/[?commentId]
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
  const about   = (sub) => getJSON(`/r/${sub}/about.json?raw_json=1`).then((r) => r?.data || null);
  const rules   = (sub) => getJSON(`/r/${sub}/about/rules.json`);
  const mods    = (sub) => getJSON(`/r/${sub}/about/moderators.json`);
  const flairs  = (sub) => getJSON(`/r/${sub}/api/link_flair_v2.json`).catch(() => null);

  async function posts(sub, sort = "hot", params = {}) {
    const qs = new URLSearchParams({ limit: "100", raw_json: "1", ...params }).toString();
    const r = await getJSON(`/r/${sub}/${sort}.json?${qs}`);
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
    about, rules, mods, flairs, posts, comments, duplicates,
    user, userPosts, userComments, search, savedByMe,
    currentSub, currentPostId, currentUser, permalinkToId,
    normalizePost,
    stats: () => ({ ...stats, cached: mem.size, inflight: inflight.size }),
    clearCache: () => mem.clear(),
  };
})();