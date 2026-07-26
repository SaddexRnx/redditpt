/**
 * Reddit Power Toolkit — v2.0.0-beta React content-script overlay.
 *
 * The legacy runtime (shared/reddit-api/content/features-v2*) is loaded
 * BEFORE this file and owns the QuickBar + side panel. This module mounts
 * a Shadow-DOM React overlay that wires all 36 Power features into a
 * modern React UI with:
 *   - live enable/disable state synced through chrome.storage.local
 *   - conflict-safe execution: a single-flight mutex prevents two
 *     Power features from mutating the DOM at the same time.
 *
 * The panel is opened by a "⚡ v2" floating button (bottom-left) so it
 * never overlaps the legacy QuickBar in the bottom-right corner.
 */
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

type Mod = { id: string; name: string; desc: string };

declare global {
  interface Window {
    RPT?: {
      v2?: {
        modules: Record<string, { id: string; name: string; desc: string; run?: () => void }>;
        HUB_KEY: string;
        getEnabled: () => Promise<Record<string, boolean>>;
        list: () => Mod[];
      };
      __rptV2Panel?: boolean;
    };
    RPT_I18N?: { text: (v: string) => string };
  }
}

const CATEGORIES: [string, string[]][] = [
  ["Community", ["communityCompare", "subAnalyzer", "calendar", "subHealth", "timeline", "trendTracker", "subGroups", "contentExporter"]],
  ["Thread & comments", ["miniMap", "commentExport", "userAnalytics", "postAnalytics", "copyTools", "followKeywords"]],
  ["Filtering & feed", ["flairTools", "qualityFilter", "feedDedup", "ageSort", "mediaToggle", "oldGold", "sidebarCleaner"]],
  ["Discovery & knowledge", ["bookmarks", "savedManager", "research", "topicTracker", "random", "history", "achievements", "wikiNav", "resourceCollector"]],
  ["Utilities", ["searchEnhancer", "linksManager", "explainLink", "exportLibrary", "repostDetector", "devMode"]],
];

/** Single-flight mutex — prevents two Power features from running concurrently. */
let running: Promise<void> | null = null;
async function runSafely(fn: () => unknown, label: string) {
  if (running) {
    console.warn(`[RPT v2] '${label}' skipped: another feature is running.`);
    return;
  }
  running = Promise.resolve()
    .then(() => fn())
    .then(() => undefined)
    .catch((e) => console.error(`[RPT v2] '${label}' failed`, e))
    .finally(() => { running = null; });
  await running;
}

function useEnabled() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const v = await window.RPT?.v2?.getEnabled?.();
        if (alive && v) setEnabled(v);
      } catch {}
    };
    load();
    const onChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "local" && changes["rpt_v2_enabled"]) load();
    };
    chrome.storage?.onChanged?.addListener(onChange);
    return () => { alive = false; chrome.storage?.onChanged?.removeListener(onChange); };
  }, []);

  const toggle = async (id: string, next: boolean) => {
    setEnabled((prev) => ({ ...prev, [id]: next }));
    const key = "rpt_v2_enabled";
    const current = await new Promise<Record<string, boolean>>((r) =>
      chrome.storage.local.get({ [key]: {} }, (v) => r(v[key] || {}))
    );
    current[id] = next;
    await new Promise<void>((r) => chrome.storage.local.set({ [key]: current }, () => r()));
  };
  return { enabled, toggle };
}

function Panel({ onClose }: { onClose: () => void }) {
  const modules = useMemo<Record<string, Mod>>(() => {
    const raw = window.RPT?.v2?.modules ?? {};
    const out: Record<string, Mod> = {};
    for (const k of Object.keys(raw)) {
      const m = raw[k];
      out[k] = { id: m.id, name: m.name, desc: m.desc };
    }
    return out;
  }, []);
  const { enabled, toggle } = useEnabled();
  const [q, setQ] = useState("");
  const tx = (v: string) => window.RPT_I18N?.text?.(v) ?? v;

  const launch = (id: string) => {
    if (enabled[id] === false) return;
    const mod = window.RPT?.v2?.modules?.[id];
    if (!mod?.run) return;
    onClose();
    void runSafely(() => mod.run!(), id);
  };

  const query = q.trim().toLowerCase();
  const total = Object.keys(modules).length;
  const activeCount = Object.keys(modules).filter((k) => enabled[k] !== false).length;

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Reddit Power Toolkit v2">
      <div style={styles.panel}>
        <header style={styles.header}>
          <div>
            <div style={styles.title}>⚡ Power Features <span style={styles.badge}>v2.0.0-beta</span></div>
            <div style={styles.sub}>{activeCount}/{total} enabled · runs 100% locally</div>
          </div>
          <button style={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </header>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 36 features…"
          style={styles.search}
          aria-label="Search features"
        />
        <div style={styles.body}>
          {CATEGORIES.map(([cat, ids]) => {
            const visible = ids.filter((id) => {
              const m = modules[id]; if (!m) return false;
              if (!query) return true;
              return (m.name + " " + m.desc + " " + cat).toLowerCase().includes(query);
            });
            if (!visible.length) return null;
            return (
              <section key={cat} style={styles.section}>
                <h3 style={styles.catTitle}>{cat}</h3>
                <div style={styles.grid}>
                  {visible.map((id) => {
                    const m = modules[id];
                    const on = enabled[id] !== false;
                    return (
                      <div key={id} style={{ ...styles.card, opacity: on ? 1 : 0.55 }}>
                        <button style={styles.cardRun} onClick={() => launch(id)} disabled={!on} title={on ? "Launch" : "Disabled"}>
                          <strong style={styles.cardName}>{tx(m.name)}</strong>
                          <span style={styles.cardDesc}>{tx(m.desc)}</span>
                        </button>
                        <label style={styles.toggle} title={on ? "Disable" : "Enable"}>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) => toggle(id, e.target.checked)}
                            aria-label={`${on ? "Disable" : "Enable"} ${tx(m.name)}`}
                          />
                          <span style={{ ...styles.dot, background: on ? "#46d160" : "#555" }} />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        <footer style={styles.footer}>
          Conflict-safe: one feature at a time · Sync to legacy hub · Esc to close
        </footer>
      </div>
    </div>
  );
}

function Launcher() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); setOpen((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <button
        style={styles.fab}
        onClick={() => setOpen(true)}
        title="Reddit Power Toolkit v2 — Power features (Alt+Shift+P)"
        aria-label="Open Power Features"
      >⚡ v2</button>
      {open && <Panel onClose={() => setOpen(false)} />}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fab: {
    position: "fixed", left: 16, bottom: 16, zIndex: 2147483000,
    background: "#ff4500", color: "#fff", border: "none", borderRadius: 999,
    padding: "10px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer",
    boxShadow: "0 8px 24px rgba(255,69,0,0.35)", fontFamily: "Inter, system-ui, sans-serif",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
    zIndex: 2147483001, display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  panel: {
    width: "min(920px, 94vw)", maxHeight: "88vh", background: "#0b0b0d", color: "#f4f4f5",
    border: "1px solid #27272a", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid #18181b" },
  title: { fontSize: 16, fontWeight: 700, display: "flex", gap: 8, alignItems: "center" },
  badge: { fontSize: 10, fontWeight: 700, background: "#ff4500", color: "#fff", padding: "2px 6px", borderRadius: 6, letterSpacing: 0.3 },
  sub: { fontSize: 12, color: "#a1a1aa", marginTop: 2 },
  close: { background: "transparent", border: "none", color: "#a1a1aa", fontSize: 18, cursor: "pointer" },
  search: { margin: "12px 18px 0", padding: "10px 12px", background: "#111114", color: "#f4f4f5", border: "1px solid #27272a", borderRadius: 10, fontSize: 13, outline: "none" },
  body: { overflowY: "auto", padding: "8px 18px 18px" },
  section: { marginTop: 14 },
  catTitle: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, color: "#a1a1aa", margin: "10px 0 8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 },
  card: { display: "flex", alignItems: "stretch", background: "#111114", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden" },
  cardRun: { flex: 1, textAlign: "left", background: "transparent", color: "inherit", border: "none", padding: "10px 12px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  cardName: { fontSize: 13, fontWeight: 600, whiteSpace: "normal" },
  cardDesc: { fontSize: 11, color: "#a1a1aa", whiteSpace: "normal", lineHeight: 1.4 },
  toggle: { display: "flex", alignItems: "center", padding: "0 10px", cursor: "pointer", borderLeft: "1px solid #27272a" },
  dot: { width: 10, height: 10, borderRadius: 999, display: "inline-block" },
  footer: { padding: "10px 18px", borderTop: "1px solid #18181b", fontSize: 11, color: "#71717a", textAlign: "center" },
};

/** Mount into an isolated Shadow-DOM host so Reddit CSS never leaks in. */
function mount() {
  if (window.RPT?.__rptV2Panel) return;
  window.RPT = window.RPT || {};
  window.RPT.__rptV2Panel = true;

  // Wait until legacy RPT.v2 is present so we can list its 36 modules.
  const start = Date.now();
  const waitFor = () =>
    new Promise<void>((resolve) => {
      const tick = () => {
        if (window.RPT?.v2?.modules && Object.keys(window.RPT.v2.modules).length >= 30) return resolve();
        if (Date.now() - start > 15000) return resolve();
        setTimeout(tick, 250);
      };
      tick();
    });

  waitFor().then(() => {
    const host = document.createElement("div");
    host.id = "rpt-v2-react-host";
    host.style.all = "initial";
    document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const mountEl = document.createElement("div");
    shadow.appendChild(mountEl);
    createRoot(mountEl).render(<Launcher />);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}

export {};