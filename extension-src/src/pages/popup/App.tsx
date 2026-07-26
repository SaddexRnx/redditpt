// Popup — React/Tailwind port. Shows activation status for the current
// Reddit tab, master enable toggle, quick actions and language/theme.
import { useCallback, useEffect, useState } from "react";
import {
  Settings2, BarChart3, Power, ExternalLink, RefreshCcw, ImageIcon,
  Rows, ListTree, Sparkles, Command,
} from "lucide-react";
import {
  getEnabled, setEnabled, getTheme, setTheme, type ThemeMode,
} from "@/lib/storage";
import { t, AVAILABLE_LANGS, switchLang } from "@/lib/i18n";

type ActivationState = "active" | "notReddit" | "notInjected" | "injectFail";

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
const isReddit = (url = "") => /^https?:\/\/([a-z]+\.)?reddit\.com\//.test(url);

async function pingContent(tabId: number) {
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({ loaded: !!(window as unknown as { __RPT_LOADED__?: boolean }).__RPT_LOADED__ }),
    });
    return { ok: true, loaded: (res.result as { loaded: boolean }).loaded };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}
function runInPage(func: () => void) {
  return activeTab().then((tab) => {
    if (!tab?.id) return;
    return chrome.scripting.executeScript({ target: { tabId: tab.id }, func }).catch(() => {});
  });
}

export function App() {
  const [enabled, setEn] = useState(true);
  const [theme, setTh] = useState<ThemeMode>("dark");
  const [lang, setLg] = useState("en");
  const [state, setState] = useState<ActivationState>("notReddit");

  const refresh = useCallback(async () => {
    const tab = await activeTab();
    if (!isReddit(tab?.url)) return setState("notReddit");
    if (!tab?.id) return setState("injectFail");
    const r = await pingContent(tab.id);
    if (!r.ok) return setState("injectFail");
    setState(r.loaded ? "active" : "notInjected");
  }, []);

  useEffect(() => {
    (async () => {
      setEn(await getEnabled()); setTh(await getTheme());
      chrome.storage.local.get("rpt_lang", (v) => setLg((v.rpt_lang as string) || "en"));
      refresh();
    })();
  }, [refresh]);

  const applyTheme = (m: ThemeMode) => {
    setTh(m); setTheme(m);
    document.documentElement.setAttribute("data-rpt-theme", m);
  };
  const reloadTab = async () => {
    const tab = await activeTab();
    if (tab?.id) { chrome.tabs.reload(tab.id); setTimeout(() => window.close(), 200); }
  };

  return (
    <div className="p-4 space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-base font-bold tracking-tight">{t("appName")}</div>
          <div className="text-[11px] text-muted">{t("tagline")}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <select value={lang} onChange={(e) => { setLg(e.target.value); switchLang(e.target.value); }}
            className="rpt-input h-7 w-auto text-xs px-2" aria-label={t("language")}>
            {AVAILABLE_LANGS.map(([code, l]) => (
              <option key={code} value={code}>{code.toUpperCase()}</option>
            ))}
          </select>
          <button className="rpt-btn h-7 w-7 p-0" aria-label={t("theme")}
            onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☾" : "☀"}
          </button>
        </div>
      </header>

      <ActivationBanner state={state} onReload={reloadTab} onRefresh={refresh} />

      <section className="rpt-card flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{t("enable_toolkit")}</div>
          <div className="text-[11px] text-muted mt-0.5">
            {enabled ? t("status_active") : t("toolkit_paused")}
          </div>
        </div>
        <button
          onClick={() => { const v = !enabled; setEn(v); setEnabled(v); }}
          role="switch" aria-checked={enabled}
          className={`w-11 h-6 rounded-full relative transition-colors ${enabled ? "bg-accent" : "bg-panel-3"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
        </button>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <QuickAct icon={<Sparkles className="w-4 h-4" />} label="Summary"
          onClick={() => runInPage(() => (window as any).RPT?.features?.summary?.open?.())} />
        <QuickAct icon={<ImageIcon className="w-4 h-4" />} label="Gallery"
          onClick={() => runInPage(() => (window as any).RPT?.features?.gallery?.open?.())} />
        <QuickAct icon={<Rows className="w-4 h-4" />} label="Collapse"
          onClick={() => runInPage(() => (window as any).RPT?.features?.folding?.collapseAll?.())} />
        <QuickAct icon={<ListTree className="w-4 h-4" />} label="Conversation"
          onClick={() => runInPage(() => (window as any).RPT?.features?.conversation?.open?.())} />
        <QuickAct icon={<Command className="w-4 h-4" />} label="Command"
          onClick={() => runInPage(() => (window as any).RPT?.features?.cmdk?.open?.())} />
        <QuickAct icon={<RefreshCcw className="w-4 h-4" />} label="Resync"
          onClick={() => runInPage(() => (window as any).RPT?.ui?.resync?.())} />
      </section>

      <section className="grid grid-cols-2 gap-2">
        <button className="rpt-btn" onClick={() => chrome.runtime.openOptionsPage()}>
          <Settings2 className="w-4 h-4" /> {t("settings")}
        </button>
        <button className="rpt-btn" onClick={() =>
          chrome.tabs.create({ url: chrome.runtime.getURL("src/pages/analytics/index.html") })}>
          <BarChart3 className="w-4 h-4" /> {t("analytics")}
        </button>
      </section>

      <button className="rpt-btn-primary w-full"
        onClick={async () => {
          const tab = await activeTab();
          if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "rpt:togglePanel" }).catch(() => {});
        }}>
        <Power className="w-4 h-4" /> {t("open_panel")}
      </button>

      <footer className="flex items-center justify-between text-[11px] text-muted pt-1">
        <span>{t("footer_privacy")}</span>
        <a className="inline-flex items-center gap-1 hover:text-accent"
          href="https://github.com/Saddexrnx/redditpt" target="_blank" rel="noreferrer">
          GitHub <ExternalLink className="w-3 h-3" />
        </a>
      </footer>
    </div>
  );
}

function ActivationBanner({ state, onReload, onRefresh }: {
  state: ActivationState; onReload: () => void; onRefresh: () => void;
}) {
  const color: Record<ActivationState, string> = {
    active: "bg-success", notReddit: "bg-warn",
    notInjected: "bg-warn", injectFail: "bg-danger",
  };
  const msg: Record<ActivationState, string> = {
    active: t("status_active"), notReddit: t("status_notReddit"),
    notInjected: t("status_notInjected"), injectFail: t("status_injectFail"),
  };
  return (
    <div className="rpt-card flex items-center gap-2 py-2.5">
      <span className={`w-2 h-2 rounded-full ${color[state]}`} aria-hidden />
      <span className="text-xs flex-1">{msg[state]}</span>
      {state === "notInjected" && (
        <button className="rpt-btn h-7 text-xs" onClick={onReload}>{t("reload_tab")}</button>
      )}
      <button className="rpt-btn h-7 w-7 p-0" aria-label="Refresh" onClick={onRefresh}>
        <RefreshCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function QuickAct({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="rpt-btn flex-col h-auto py-2.5" onClick={() => { onClick(); window.close(); }}>
      {icon}
      <span className="text-[11px]">{label}</span>
    </button>
  );
}
