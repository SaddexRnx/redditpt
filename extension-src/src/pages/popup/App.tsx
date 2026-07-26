import { useEffect, useState } from "react";
import { getSettings, setSettings, type RPTSettings } from "@/lib/storage";
import { t, AVAILABLE_LANGS } from "@/lib/i18n";
import { Settings2, BarChart3, Power, ExternalLink } from "lucide-react";

export function App() {
  const [s, setS] = useState<RPTSettings | null>(null);
  useEffect(() => {
    getSettings().then(setS);
  }, []);
  if (!s) return <div className="p-6 text-muted text-sm">Loading…</div>;

  const patch = async (p: Partial<RPTSettings>) => setS(await setSettings(p));

  return (
    <div className="p-4 space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-base font-bold tracking-tight text-text">
            {t("appName")}
          </div>
          <div className="text-[11px] text-muted">{t("tagline")}</div>
        </div>
        <img src={chrome.runtime.getURL("icons/icon.png")} alt="" className="w-8 h-8 rounded-md" />
      </header>

      <section className="rpt-card flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-text">{t("enable_toolkit")}</div>
          <div className="text-[11px] text-muted mt-0.5">
            {s.enabled ? t("status_active") : "Toolkit paused"}
          </div>
        </div>
        <button
          onClick={() => patch({ enabled: !s.enabled })}
          className={`w-11 h-6 rounded-full relative transition-colors ${
            s.enabled ? "bg-accent" : "bg-panel-3"
          }`}
          aria-pressed={s.enabled}
          aria-label="Enable toolkit"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              s.enabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </section>

      <section className="rpt-card space-y-3">
        <div>
          <div className="rpt-label mb-1">{t("language")}</div>
          <select
            className="rpt-input"
            value={s.lang}
            onChange={(e) => patch({ lang: e.target.value })}
          >
            {AVAILABLE_LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="rpt-label mb-1">{t("theme")}</div>
          <div className="grid grid-cols-2 gap-2">
            {(["dark", "light"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  patch({ theme: mode });
                  document.documentElement.setAttribute("data-rpt-theme", mode);
                }}
                className={`rpt-btn ${
                  s.theme === mode ? "border-accent text-accent" : ""
                }`}
              >
                {t(mode)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <button
          className="rpt-btn"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings2 className="w-4 h-4" /> {t("settings")}
        </button>
        <button
          className="rpt-btn"
          onClick={() =>
            chrome.tabs.create({
              url: chrome.runtime.getURL("src/pages/analytics/index.html"),
            })
          }
        >
          <BarChart3 className="w-4 h-4" /> {t("analytics")}
        </button>
      </section>

      <button
        className="rpt-btn-primary w-full"
        onClick={async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "rpt:togglePanel" });
        }}
      >
        <Power className="w-4 h-4" /> {t("open_panel")}
      </button>

      <footer className="flex items-center justify-between text-[11px] text-muted pt-1">
        <span>{t("footer_privacy")}</span>
        <a
          className="inline-flex items-center gap-1 hover:text-accent"
          href="https://github.com/Saddexrnx/redditpt"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ExternalLink className="w-3 h-3" />
        </a>
      </footer>
    </div>
  );
}