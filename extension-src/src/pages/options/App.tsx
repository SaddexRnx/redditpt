import { useEffect, useState } from "react";
import { getSettings, setSettings, DEFAULT_SETTINGS, type RPTSettings } from "@/lib/storage";
import { t, AVAILABLE_LANGS } from "@/lib/i18n";

export function App() {
  const [s, setS] = useState<RPTSettings | null>(null);
  useEffect(() => {
    getSettings().then(setS);
  }, []);
  if (!s) return <div className="p-8 text-muted">Loading…</div>;

  const patch = async (p: Partial<RPTSettings>) => setS(await setSettings(p));

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("appName")} — {t("settings")}</h1>
        <p className="text-sm text-muted mt-1">{t("footer_privacy")}</p>
      </header>

      <Section title={t("general")}>
        <Row>
          <label className="rpt-label">{t("language")}</label>
          <select
            className="rpt-input max-w-xs"
            value={s.lang}
            onChange={(e) => patch({ lang: e.target.value })}
          >
            {AVAILABLE_LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </Row>
        <Row>
          <label className="rpt-label">{t("theme")}</label>
          <select
            className="rpt-input max-w-xs"
            value={s.theme}
            onChange={(e) => {
              const theme = e.target.value as "dark" | "light";
              document.documentElement.setAttribute("data-rpt-theme", theme);
              patch({ theme });
            }}
          >
            <option value="dark">{t("dark")}</option>
            <option value="light">{t("light")}</option>
          </select>
        </Row>
        <Toggle
          label="Auto-open side panel on first visit to a thread"
          checked={s.autoOpenPanel}
          onChange={(v) => patch({ autoOpenPanel: v })}
        />
        <Toggle
          label="Color-code comment authors"
          checked={s.showAuthorColors}
          onChange={(v) => patch({ showAuthorColors: v })}
        />
      </Section>

      <Section title="Automation">
        {(Object.keys(s.automation) as (keyof RPTSettings["automation"])[]).map((k) => (
          <Toggle
            key={k}
            label={k}
            checked={s.automation[k]}
            onChange={(v) => patch({ automation: { ...s.automation, [k]: v } })}
          />
        ))}
      </Section>

      <Section title="Local data">
        <button
          className="rpt-btn-danger"
          onClick={async () => {
            if (confirm("Clear all local data?")) {
              await chrome.storage.local.clear();
              await setSettings(DEFAULT_SETTINGS);
              setS(DEFAULT_SETTINGS);
            }
          }}
        >
          Clear all local data
        </button>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rpt-card space-y-3">
      <h2 className="rpt-label">{title}</h2>
      {children}
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm cursor-pointer">
      <span
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full relative transition-colors ${
          checked ? "bg-accent" : "bg-panel-3"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="text-text">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
    </label>
  );
}