// Analytics — 100% local. Reads rpt_analytics / rpt_history / rpt_collections
// buckets produced by the content script and renders totals + rankings.
import { useEffect, useMemo, useState } from "react";
import {
  getAnalytics, getHistory, getCollections,
  type AnalyticsBlob, type HistoryItem, type CollectionItem,
} from "@/lib/storage";
import { t } from "@/lib/i18n";

function fmtDuration(secs: number) {
  const m = Math.round(secs / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
function download(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}

export function App() {
  const [a, setA] = useState<AnalyticsBlob>({});
  const [h, setH] = useState<HistoryItem[]>([]);
  const [c, setC] = useState<CollectionItem[]>([]);
  useEffect(() => {
    Promise.all([getAnalytics(), getHistory(), getCollections()]).then(([an, hi, co]) => {
      setA(an); setH(hi); setC(co);
    });
  }, []);
  const topSubs = useMemo(() => {
    return Object.entries(a.subreddits ?? {})
      .sort((x, y) => y[1] - x[1]).slice(0, 10);
  }, [a]);
  const exportJson = () => download("rpt-collections.json", "application/json",
    JSON.stringify({ schema: "rpt-collections/1", exportedAt: new Date().toISOString(), items: c }, null, 2));

  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-8 space-y-4">
      <header className="rpt-card">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("appName")} — {t("analytics")}
        </h1>
        <p className="text-[12px] text-muted mt-1">{t("footer_privacy")}</p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label={t("posts_viewed")} value={a.postsViewed ?? 0} />
        <Stat label={t("comments_read")} value={a.commentsRead ?? 0} />
        <Stat label={t("subreddits")} value={Object.keys(a.subreddits ?? {}).length} />
        <Stat label={t("reading_time")} value={fmtDuration(a.readingSeconds ?? 0)} />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rpt-card">
          <h2 className="rpt-label mb-2">{t("top_subs")}</h2>
          {topSubs.length ? (
            <ul className="space-y-1.5">
              {topSubs.map(([sub, n]) => (
                <li key={sub} className="flex items-center justify-between text-sm">
                  <a className="hover:text-accent" href={`https://reddit.com/r/${sub}`} target="_blank" rel="noreferrer">
                    r/{sub}
                  </a>
                  <span className="text-[11px] text-muted tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-[12px] text-muted">No data yet — browse a few threads first.</p>}
        </div>

        <div className="rpt-card">
          <h2 className="rpt-label mb-2 flex items-center justify-between">
            {t("saved_comments")}
            {c.length > 0 && <button className="rpt-btn h-7 text-xs" onClick={exportJson}>Export</button>}
          </h2>
          {c.length ? (
            <ul className="space-y-2 max-h-[300px] overflow-auto pr-1">
              {c.slice(0, 25).map((it) => (
                <li key={it.id} className="border-b border-border last:border-0 pb-2">
                  <a href={it.url} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:text-accent">
                    u/{it.author}
                  </a>
                  <span className="text-[11px] text-muted ml-2">{new Date(it.savedAt).toLocaleString()}</span>
                  <p className="text-[12px] text-muted mt-0.5 line-clamp-2">{it.body.slice(0, 220)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-[12px] text-muted">Save any comment from Reddit to build your collection.</p>}
        </div>
      </section>

      <section className="rpt-card">
        <h2 className="rpt-label mb-2">{t("recent_history")}</h2>
        {h.length ? (
          <ul className="space-y-1.5 max-h-[300px] overflow-auto pr-1">
            {h.slice(0, 50).map((e, i) => (
              <li key={i} className="flex items-center justify-between text-sm gap-2">
                <a href={e.url} target="_blank" rel="noreferrer" className="hover:text-accent truncate">
                  {e.title || e.url}
                </a>
                <span className="text-[11px] text-muted tabular-nums shrink-0">
                  {new Date(e.date).toLocaleDateString()} · {e.commentCount ?? 0}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="text-[12px] text-muted">Your reading history will appear here.</p>}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rpt-card">
      <div className="text-3xl font-bold tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="rpt-label mt-1">{label}</div>
    </div>
  );
}
