import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

interface Stats {
  threads: number;
  comments: number;
  subs: number;
  minutes: number;
}

export function App() {
  const [stats, setStats] = useState<Stats>({ threads: 0, comments: 0, subs: 0, minutes: 0 });

  useEffect(() => {
    chrome.storage.local.get("rpt:analytics").then((res) => {
      const a = (res["rpt:analytics"] ?? {}) as Partial<Stats>;
      setStats({
        threads: a.threads ?? 0,
        comments: a.comments ?? 0,
        subs: a.subs ?? 0,
        minutes: a.minutes ?? 0,
      });
    });
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("appName")} — {t("analytics")}</h1>
        <p className="text-sm text-muted mt-1">{t("footer_privacy")}</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Threads visited" value={stats.threads} />
        <Stat label="Comments read" value={stats.comments} />
        <Stat label="Subreddits" value={stats.subs} />
        <Stat label="Reading (min)" value={stats.minutes} />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rpt-card">
      <div className="text-3xl font-bold text-text tabular-nums">{value.toLocaleString()}</div>
      <div className="rpt-label mt-1">{label}</div>
    </div>
  );
}