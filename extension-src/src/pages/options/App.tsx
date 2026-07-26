// Full Options page — React/Tailwind port of extension/options.js.
// Sections: General, Automation, Filters, Keywords, User Tags, Rules,
// Accessibility, Shortcuts, Collections, Backup, Danger zone.
import { useEffect, useMemo, useState } from "react";
import {
  KEYS, DEFAULT_GENERAL, DEFAULT_AUTORUN, DEFAULT_FILTERS, DEFAULT_A11Y,
  DEFAULT_SHORTCUTS, getGeneral, getAutorun, getFilters, getA11y,
  getShortcuts, getKeywords, getTags, getRules, getCollections,
  getRaw, setRaw, getMany, type RuleEntry, type UserTag,
  type GeneralSettings, type AutorunSettings, type FilterSettings,
  type A11ySettings, type Shortcuts, setTheme, getTheme, setLang,
} from "@/lib/storage";
import { t, AVAILABLE_LANGS } from "@/lib/i18n";
import { Section } from "@/components/Section";
import { Toggle } from "@/components/Toggle";

export function App() {
  return (
    <main className="max-w-3xl mx-auto p-6 sm:p-8 space-y-4">
      <Header />
      <GeneralCard />
      <AutomationCard />
      <FiltersCard />
      <KeywordsCard />
      <TagsCard />
      <RulesCard />
      <A11yCard />
      <ShortcutsCard />
      <CollectionsCard />
      <BackupCard />
      <DangerCard />
      <footer className="text-center text-[11px] text-muted pt-6">
        {t("footer_privacy")}
      </footer>
    </main>
  );
}

/* -------------------- Header (lang + theme) -------------------- */
function Header() {
  const [lang, setLangState] = useState("en");
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  useEffect(() => {
    Promise.all([getRaw<string>(KEYS.lang), getTheme()]).then(([l, th]) => {
      setLangState(l ?? "en"); setThemeState(th);
    });
  }, []);
  const applyTheme = (m: "dark" | "light") => {
    setThemeState(m); setTheme(m);
    document.documentElement.setAttribute("data-rpt-theme", m);
  };
  return (
    <header className="rpt-card flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t("appName")}</h1>
        <p className="text-[11px] text-muted mt-0.5">{t("settings")}</p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={lang}
          onChange={(e) => { setLangState(e.target.value); setLang(e.target.value); }}
          className="rpt-input h-8 w-auto"
          aria-label={t("language")}
        >
          {AVAILABLE_LANGS.map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
        <button
          className="rpt-btn h-8"
          onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? t("light") : t("dark")}
        </button>
      </div>
    </header>
  );
}

/* -------------------- General -------------------- */
function GeneralCard() {
  const [s, setS] = useState<GeneralSettings | null>(null);
  useEffect(() => { getGeneral().then(setS); }, []);
  if (!s) return null;
  const patch = (p: Partial<GeneralSettings>) => {
    const next = { ...s, ...p }; setS(next); setRaw({ [KEYS.general]: next });
  };
  return (
    <Section title={t("general")}>
      <Toggle label={t("auto_open_panel")} checked={s.autoOpenPanel} onChange={(v) => patch({ autoOpenPanel: v })} />
      <Toggle label={t("color_authors")} checked={s.showAuthorColors} onChange={(v) => patch({ showAuthorColors: v })} />
      <Toggle label={t("onboarding_hint")} checked={s.showOnboarding} onChange={(v) => patch({ showOnboarding: v })} />
      <AuthorLegend />
    </Section>
  );
}
function AuthorLegend() {
  // Deterministic HSL matches the content-script coloring so preview is truthful.
  const authorColor = (name: string) => {
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return `hsl(${h % 360} 70% 60%)`;
  };
  const sample = ["spez", "AutoModerator", "gallowboob", "poem_for_your_sprog", "you"];
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {sample.map((u) => (
        <span key={u} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-panel-2 border border-border text-[11px]">
          <span className="w-2 h-2 rounded-full" style={{ background: authorColor(u) }} />
          <span style={{ color: authorColor(u), fontWeight: 600 }}>u/{u}</span>
        </span>
      ))}
    </div>
  );
}

/* -------------------- Automation -------------------- */
function AutomationCard() {
  const [s, setS] = useState<AutorunSettings | null>(null);
  useEffect(() => { getAutorun().then(setS); }, []);
  if (!s) return null;
  const patch = (k: keyof AutorunSettings, v: boolean) => {
    const next = { ...s, [k]: v }; setS(next); setRaw({ [KEYS.autorun]: next });
  };
  const labels: Record<keyof AutorunSettings, string> = {
    cleaner: "Thread cleaner", highlighter: "Keyword highlighter",
    tags: "Author tags", ageWarning: "Old-thread warning",
    quickBar: "Floating quick-bar", saveButtons: "Save-to-collections buttons",
    liveNew: "Live new comments polling",
  };
  return (
    <Section title={t("automation")}>
      {(Object.keys(s) as (keyof AutorunSettings)[]).map((k) => (
        <Toggle key={k} label={labels[k]} checked={s[k]} onChange={(v) => patch(k, v)} />
      ))}
    </Section>
  );
}

/* -------------------- Filters -------------------- */
function FiltersCard() {
  const [s, setS] = useState<FilterSettings | null>(null);
  useEffect(() => { getFilters().then(setS); }, []);
  if (!s) return null;
  const patch = (p: Partial<FilterSettings>) => {
    const next = { ...s, ...p }; setS(next); setRaw({ [KEYS.filters]: next });
  };
  return (
    <Section title={t("filters")} desc="Thread cleaner rules — applied automatically when active.">
      <Toggle label="Hide [deleted] / [removed] comments" checked={s.hideDeleted} onChange={(v) => patch({ hideDeleted: v })} />
      <Toggle label="Hide empty comments" checked={s.hideEmpty} onChange={(v) => patch({ hideEmpty: v })} />
      <Toggle label="Hide bot comments (AutoModerator, *-bot)" checked={s.hideBots} onChange={(v) => patch({ hideBots: v })} />
      <div className="flex items-center gap-3">
        <Toggle label={`Hide comments shorter than ${s.minLength} chars`} checked={s.hideShort} onChange={(v) => patch({ hideShort: v })} />
        <input type="number" min={1} max={1000} value={s.minLength}
          onChange={(e) => patch({ minLength: Number(e.target.value) })}
          className="rpt-input w-20 h-8" />
      </div>
      <div className="flex items-center gap-3">
        <Toggle label={`Hide comments with score < ${s.minScore}`} checked={s.hideLowScore} onChange={(v) => patch({ hideLowScore: v })} />
        <input type="number" value={s.minScore}
          onChange={(e) => patch({ minScore: Number(e.target.value) })}
          className="rpt-input w-20 h-8" />
      </div>
    </Section>
  );
}

/* -------------------- Keywords -------------------- */
function KeywordsCard() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => { getKeywords().then((k) => { setSaved(k); setValue(k.join(", ")); }); }, []);
  const save = async () => {
    const list = value.split(",").map((s) => s.trim()).filter(Boolean);
    await setRaw({ [KEYS.keywords]: list }); setSaved(list);
  };
  return (
    <Section title={t("keywords")} desc={t("keywords_hint")}>
      <textarea value={value} onChange={(e) => setValue(e.target.value)}
        className="rpt-input min-h-[80px] py-2" placeholder="upvote, wholesome, tesla, …" />
      <div className="flex items-center gap-2">
        <button className="rpt-btn-primary" onClick={save}>{t("save")}</button>
        <span className="text-[11px] text-muted">{saved.length} active</span>
      </div>
    </Section>
  );
}

/* -------------------- User tags -------------------- */
function TagsCard() {
  const [tags, setTags] = useState<Record<string, UserTag>>({});
  const [u, setU] = useState(""); const [l, setL] = useState(""); const [c, setC] = useState("#ff4500");
  useEffect(() => { getTags().then(setTags); }, []);
  const save = async () => {
    const user = u.replace(/^u\//, "").trim();
    if (!user || !l.trim()) return;
    const next = { ...tags, [user]: { label: l.trim(), color: c } };
    await setRaw({ [KEYS.tags]: next }); setTags(next); setU(""); setL("");
  };
  const remove = async (user: string) => {
    const next = { ...tags }; delete next[user];
    await setRaw({ [KEYS.tags]: next }); setTags(next);
  };
  return (
    <Section title={t("user_tags")} desc="Pin a colored label next to specific Reddit usernames.">
      <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
        <input className="rpt-input" placeholder={t("tag_user_ph")} value={u} onChange={(e) => setU(e.target.value)} />
        <input className="rpt-input" placeholder={t("tag_label_ph")} value={l} onChange={(e) => setL(e.target.value)} />
        <input type="color" value={c} onChange={(e) => setC(e.target.value)}
          className="w-10 h-9 rounded-md border border-border bg-panel-2 cursor-pointer" />
        <button className="rpt-btn-primary" onClick={save}>{t("add")}</button>
      </div>
      <ul className="space-y-1.5">
        {Object.entries(tags).map(([user, tag]) => (
          <li key={user} className="flex items-center gap-2 px-3 py-2 bg-panel-2 border border-border rounded-md">
            <strong className="text-sm">u/{user}</strong>
            <span className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ background: tag.color }}>{tag.label}</span>
            <span className="flex-1" />
            <button className="rpt-btn h-7 text-xs" onClick={() => remove(user)}>{t("remove")}</button>
          </li>
        ))}
        {Object.keys(tags).length === 0 && <li className="text-[12px] text-muted">No user tags yet.</li>}
      </ul>
    </Section>
  );
}

/* -------------------- Rules -------------------- */
function compileRule(r: Pick<RuleEntry, "type" | "pattern">) {
  try {
    if (r.type === "regex") return new RegExp(r.pattern, "i");
    if (r.type === "keyword") return new RegExp(r.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  } catch { return null; }
  return null;
}
function RulesCard() {
  const [rules, setRules] = useState<RuleEntry[]>([]);
  const [draft, setDraft] = useState<RuleEntry>({
    enabled: true, type: "keyword", pattern: "", action: "highlight",
    color: "#f59e0b", label: "",
  });
  useEffect(() => { getRules().then(setRules); }, []);
  const save = async (next: RuleEntry[]) => { setRules(next); await setRaw({ [KEYS.rules]: next }); };
  const preview = useMemo(() => {
    if (!draft.pattern) return "Type a pattern to preview…";
    if ((draft.type === "regex" || draft.type === "keyword") && !compileRule(draft)) return "Invalid regex";
    return `Rule ready: ${draft.type} → ${draft.action}`;
  }, [draft]);
  const add = async () => {
    if (!draft.pattern.trim()) return;
    if ((draft.type === "regex" || draft.type === "keyword") && !compileRule(draft)) return;
    await save([...rules, { ...draft }]);
    setDraft({ ...draft, pattern: "" });
  };
  return (
    <Section title={t("rules")} desc="Build custom rules for keywords, authors, flair or regex.">
      <ul className="space-y-1.5">
        {rules.map((r, i) => (
          <li key={i} className="flex items-center gap-2 px-3 py-2 bg-panel-2 border border-border rounded-md text-sm">
            <input type="checkbox" checked={r.enabled}
              onChange={(e) => { const c = [...rules]; c[i] = { ...c[i], enabled: e.target.checked }; save(c); }}
              className="accent-accent" />
            <span className="text-[10px] uppercase tracking-wider text-muted w-14">{r.type}</span>
            <code className="flex-1 truncate">{r.pattern}</code>
            <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
              style={{ background: r.action === "hide" ? "var(--rpt-danger)" : r.color }}>
              {r.action}
            </span>
            <button className="rpt-btn h-7 text-xs" onClick={() => save(rules.filter((_, x) => x !== i))}>
              {t("remove")}
            </button>
          </li>
        ))}
        {rules.length === 0 && <li className="text-[12px] text-muted">{t("no_rules")}</li>}
      </ul>
      <div className="grid grid-cols-[110px_1fr_120px_50px_auto] gap-2">
        <select className="rpt-input" value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value as RuleEntry["type"] })}>
          <option value="keyword">keyword</option><option value="author">author</option>
          <option value="flair">flair</option><option value="regex">regex</option>
        </select>
        <input className="rpt-input" placeholder="pattern" value={draft.pattern}
          onChange={(e) => setDraft({ ...draft, pattern: e.target.value })} />
        <select className="rpt-input" value={draft.action}
          onChange={(e) => setDraft({ ...draft, action: e.target.value as RuleEntry["action"] })}>
          <option value="highlight">highlight</option><option value="hide">hide</option>
        </select>
        <input type="color" value={draft.color}
          onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          className="w-full h-9 rounded-md border border-border bg-panel-2 cursor-pointer" />
        <button className="rpt-btn-primary" onClick={add}>{t("add")}</button>
      </div>
      <p className="text-[11px] text-muted">{preview}</p>
    </Section>
  );
}

/* -------------------- Accessibility -------------------- */
function A11yCard() {
  const [s, setS] = useState<A11ySettings | null>(null);
  useEffect(() => { getA11y().then(setS); }, []);
  if (!s) return null;
  const patch = (p: Partial<A11ySettings>) => {
    const next = { ...s, ...p }; setS(next); setRaw({ [KEYS.a11y]: next });
  };
  const Row = ({ label, k, opts }: { label: string; k: keyof A11ySettings; opts: [string, string][] }) => (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-text">{label}</label>
      <select className="rpt-input w-52 h-8" value={s[k]}
        onChange={(e) => patch({ [k]: e.target.value } as Partial<A11ySettings>)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
  return (
    <Section title={t("a11y")}>
      <Row label="Color palette" k="palette" opts={[
        ["default", "Default"], ["deuteranopia", "Deuteranopia"],
        ["protanopia", "Protanopia"], ["tritanopia", "Tritanopia"], ["mono", "Monochrome"],
      ]} />
      <Row label="Contrast" k="contrast" opts={[["normal", "Normal"], ["high", "High"]]} />
      <Row label="Text size" k="text" opts={[["normal", "Normal"], ["large", "Large"]]} />
      <Row label="Motion" k="motion" opts={[["auto", "Auto"], ["reduced", "Reduced"]]} />
    </Section>
  );
}

/* -------------------- Shortcuts -------------------- */
const SHORTCUT_LABELS: Record<keyof Shortcuts, string> = {
  galleryPrev: "Gallery — previous",
  galleryNext: "Gallery — next",
  collapseAll: "Collapse all comments",
  refresh: "Refresh current thread",
};
function eventToStr(e: KeyboardEvent): string {
  if (["Shift", "Control", "Alt", "Meta", "OS"].includes(e.key)) return "";
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.metaKey) parts.push("Meta");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey && e.key.length > 1) parts.push("Shift");
  let k = e.key; if (k === " ") k = "Space";
  if (k.length === 1) k = e.shiftKey ? k.toUpperCase() : k.toLowerCase();
  parts.push(k); return parts.join("+");
}
function ShortcutsCard() {
  const [s, setS] = useState<Shortcuts | null>(null);
  const [capturing, setCapturing] = useState<keyof Shortcuts | null>(null);
  useEffect(() => { getShortcuts().then(setS); }, []);
  useEffect(() => {
    if (!capturing || !s) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (e.key === "Escape") { setCapturing(null); return; }
      const str = eventToStr(e); if (!str) return;
      const next = { ...s, [capturing]: str };
      setS(next); setRaw({ [KEYS.shortcuts]: next }); setCapturing(null);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [capturing, s]);
  if (!s) return null;
  const conflicts = Object.entries(s).reduce<Record<string, string[]>>((acc, [k, v]) => {
    (acc[v] = acc[v] || []).push(k); return acc;
  }, {});
  const conflictList = Object.entries(conflicts).filter(([, a]) => a.length > 1);
  const reset = async () => { setS({ ...DEFAULT_SHORTCUTS }); await setRaw({ [KEYS.shortcuts]: { ...DEFAULT_SHORTCUTS } }); };
  return (
    <Section title={t("shortcuts")} right={
      <button className="rpt-btn h-8 text-xs" onClick={reset}>{t("reset")}</button>
    }>
      {(Object.keys(s) as (keyof Shortcuts)[]).map((k) => (
        <div key={k} className="flex items-center justify-between gap-3">
          <span className="text-sm">{SHORTCUT_LABELS[k]}</span>
          <button
            className={`rpt-btn h-8 min-w-[110px] ${capturing === k ? "border-accent text-accent" : ""}`}
            onClick={() => setCapturing(k)}
          >
            {capturing === k ? t("press_key") : s[k]}
          </button>
        </div>
      ))}
      {conflictList.length > 0 && (
        <div className="text-[12px] text-warn bg-panel-2 border border-border rounded-md p-2">
          {conflictList.map(([key, acts]) => (
            <div key={key}>
              <strong>{key}</strong> is bound to: {acts.map((a) => SHORTCUT_LABELS[a as keyof Shortcuts]).join(", ")}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* -------------------- Collections -------------------- */
function download(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}
function csvEsc(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}
function CollectionsCard() {
  const [count, setCount] = useState(0);
  useEffect(() => { getCollections().then((c) => setCount(c.length)); }, []);
  const expJson = async () => {
    const c = await getCollections();
    download("rpt-collections.json", "application/json",
      JSON.stringify({ schema: "rpt-collections/1", exportedAt: new Date().toISOString(), items: c }, null, 2));
  };
  const expCsv = async () => {
    const c = await getCollections();
    const head = ["savedAt", "author", "score", "title", "url", "body"];
    download("rpt-collections.csv", "text/csv",
      [head.join(","), ...c.map((x) => head.map((k) => csvEsc((x as Record<string, unknown>)[k])).join(","))].join("\n"));
  };
  return (
    <Section title={t("collections")} desc={`${count} saved comments stored locally.`}>
      <div className="flex flex-wrap gap-2">
        <button className="rpt-btn" onClick={expJson}>{t("export_json")}</button>
        <button className="rpt-btn" onClick={expCsv}>{t("export_csv")}</button>
      </div>
    </Section>
  );
}

/* -------------------- Backup all settings -------------------- */
function BackupCard() {
  const [status, setStatus] = useState<string>("");
  const exportAll = async () => {
    const bag = await getMany([
      KEYS.general, KEYS.autorun, KEYS.filters, KEYS.keywords,
      KEYS.tags, KEYS.rules, KEYS.a11y, KEYS.shortcuts, KEYS.galleryPos,
    ]);
    download("rpt-settings.json", "application/json", JSON.stringify({
      schema: "rpt-settings/2",
      exportedAt: new Date().toISOString(),
      general: bag[KEYS.general] ?? {},
      autorun: bag[KEYS.autorun] ?? {},
      filters: bag[KEYS.filters] ?? {},
      keywords: bag[KEYS.keywords] ?? [],
      tags: bag[KEYS.tags] ?? {},
      rules: bag[KEYS.rules] ?? [],
      a11y: bag[KEYS.a11y] ?? {},
      shortcuts: bag[KEYS.shortcuts] ?? {},
      galleryPos: bag[KEYS.galleryPos] ?? {},
    }, null, 2));
    flash("Exported.");
  };
  const flash = (m: string) => { setStatus(m); setTimeout(() => setStatus(""), 3500); };
  const onImport = async (file: File) => {
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(await file.text()); }
    catch { flash("Invalid JSON."); return; }
    const applied: string[] = [];
    const trySet = (k: string, v: unknown) => { if (v !== undefined) { setRaw({ [k]: v }); applied.push(k); } };
    trySet(KEYS.general, parsed.general);
    trySet(KEYS.autorun, parsed.autorun);
    trySet(KEYS.filters, parsed.filters);
    trySet(KEYS.keywords, parsed.keywords);
    trySet(KEYS.tags, parsed.tags);
    trySet(KEYS.rules, parsed.rules);
    trySet(KEYS.a11y, parsed.a11y);
    trySet(KEYS.shortcuts, parsed.shortcuts);
    trySet(KEYS.galleryPos, parsed.galleryPos);
    flash(applied.length ? `Restored: ${applied.length} sections.` : "Nothing to import.");
  };
  return (
    <Section title="Backup & restore" desc="Full settings snapshot including shortcuts, filters and gallery positions.">
      <div className="flex flex-wrap items-center gap-2">
        <button className="rpt-btn" onClick={exportAll}>{t("export")}</button>
        <label className="rpt-btn cursor-pointer">
          {t("import")}
          <input type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
        </label>
        {status && <span className="text-[11px] text-success">{status}</span>}
      </div>
    </Section>
  );
}

/* -------------------- Danger zone -------------------- */
function DangerCard() {
  const wipe = async () => {
    if (!confirm("Erase ALL local data (keywords, tags, saved comments, history)?")) return;
    await new Promise<void>((r) => chrome.storage.local.clear(() => r()));
    location.reload();
  };
  const resetPrefs = async () => {
    if (!confirm("Reset preferences to defaults? Keywords, tags and saved comments are kept.")) return;
    await Promise.all([
      setRaw({ [KEYS.general]: DEFAULT_GENERAL }),
      setRaw({ [KEYS.autorun]: DEFAULT_AUTORUN }),
      setRaw({ [KEYS.filters]: DEFAULT_FILTERS }),
      setRaw({ [KEYS.a11y]: DEFAULT_A11Y }),
      setRaw({ [KEYS.shortcuts]: DEFAULT_SHORTCUTS }),
    ]);
    location.reload();
  };
  return (
    <Section title={t("danger_zone")}>
      <div className="flex flex-wrap gap-2">
        <button className="rpt-btn" onClick={resetPrefs}>{t("reset")}</button>
        <button className="rpt-btn-danger" onClick={wipe}>{t("clear_all")}</button>
      </div>
    </Section>
  );
}
