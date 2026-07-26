// Thin, cache-aware wrapper over Reddit's public JSON endpoints.
// Full port of extension/reddit-api.js (logs, provenance, fallbacks) lands
// in Phase 4 when the feature modules migrate. This stub is enough for the
// scaffolding to type-check today.
const CACHE = new Map<string, { at: number; data: unknown }>();
const TTL = 60_000;

async function fetchJSON<T>(url: string, force = false): Promise<T> {
  const hit = CACHE.get(url);
  if (!force && hit && Date.now() - hit.at < TTL) return hit.data as T;
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const data = (await res.json()) as T;
  CACHE.set(url, { at: Date.now(), data });
  return data;
}

export const RedditAPI = {
  about: (sub: string) => fetchJSON(`https://www.reddit.com/r/${sub}/about.json`),
  rules: (sub: string) => fetchJSON(`https://www.reddit.com/r/${sub}/about/rules.json`),
  posts: (sub: string, limit = 100) =>
    fetchJSON(`https://www.reddit.com/r/${sub}/new.json?limit=${limit}`),
  clearCache: () => CACHE.clear(),
};