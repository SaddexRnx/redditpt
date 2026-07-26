// Typed wrapper over chrome.storage.local — schema mirrors the legacy
// extension (rpt_* keys) so the new React UI reads/writes the same data
// the content script already produces.

export type ThemeMode = "dark" | "light";

/* ---------- Keys (must stay in sync with content script) ---------- */
export const KEYS = {
  general: "rpt_general",
  autorun: "rpt_autorun",
  filters: "rpt_filters",
  keywords: "rpt_keywords",
  tags: "rpt_user_tags",
  a11y: "rpt_a11y",
  rules: "rpt_rules",
  collections: "rpt_collections",
  shortcuts: "rpt_shortcuts",
  history: "rpt_history",
  analytics: "rpt_analytics",
  enabled: "rpt_enabled",
  theme: "rpt_theme",
  lang: "rpt_lang",
  galleryPos: "rpt_gallery_pos",
} as const;

/* ---------- Types ---------- */
export interface GeneralSettings {
  autoOpenPanel: boolean;
  showOnboarding: boolean;
  showAuthorColors: boolean;
}
export interface AutorunSettings {
  cleaner: boolean; highlighter: boolean; tags: boolean;
  ageWarning: boolean; quickBar: boolean; saveButtons: boolean; liveNew: boolean;
}
export interface FilterSettings {
  hideDeleted: boolean; hideEmpty: boolean; hideBots: boolean;
  hideShort: boolean; minLength: number;
  hideLowScore: boolean; minScore: number;
}
export interface A11ySettings {
  palette: "default" | "deuteranopia" | "protanopia" | "tritanopia" | "mono";
  contrast: "normal" | "high";
  text: "normal" | "large";
  motion: "auto" | "reduced";
}
export interface RuleEntry {
  enabled: boolean;
  type: "keyword" | "author" | "flair" | "regex";
  pattern: string;
  action: "highlight" | "hide";
  color: string;
  label: string;
}
export interface UserTag { label: string; color: string; }
export interface CollectionItem {
  id: string; author: string; body: string; score: number;
  url: string; title: string; savedAt: string;
}
export interface HistoryItem { url: string; title?: string; date: string; commentCount?: number; }
export interface AnalyticsBlob {
  postsViewed?: number;
  commentsRead?: number;
  readingSeconds?: number;
  subreddits?: Record<string, number>;
}
export interface Shortcuts {
  galleryPrev: string; galleryNext: string;
  collapseAll: string; refresh: string;
}

/* ---------- Defaults ---------- */
export const DEFAULT_GENERAL: GeneralSettings = {
  autoOpenPanel: true, showOnboarding: true, showAuthorColors: true,
};
export const DEFAULT_AUTORUN: AutorunSettings = {
  cleaner: true, highlighter: true, tags: true, ageWarning: true,
  quickBar: true, saveButtons: true, liveNew: true,
};
export const DEFAULT_FILTERS: FilterSettings = {
  hideDeleted: false, hideEmpty: false, hideBots: false,
  hideShort: false, minLength: 15, hideLowScore: false, minScore: 1,
};
export const DEFAULT_A11Y: A11ySettings = {
  palette: "default", contrast: "normal", text: "normal", motion: "auto",
};
export const DEFAULT_SHORTCUTS: Shortcuts = {
  galleryPrev: "ArrowLeft", galleryNext: "ArrowRight",
  collapseAll: "Shift+C", refresh: "R",
};

/* ---------- Raw helpers ---------- */
export function getRaw<T = unknown>(key: string): Promise<T | undefined> {
  return new Promise((r) => chrome.storage.local.get(key, (v) => r(v[key] as T)));
}
export function setRaw(obj: Record<string, unknown>): Promise<void> {
  return new Promise((r) => chrome.storage.local.set(obj, () => r()));
}
export function getMany(keys: string[]): Promise<Record<string, unknown>> {
  return new Promise((r) => chrome.storage.local.get(keys, (v) => r(v)));
}

/* ---------- Typed getters (merge with defaults) ---------- */
async function getGroup<T>(key: string, def: T): Promise<T> {
  const v = (await getRaw<Partial<T>>(key)) ?? {};
  return { ...def, ...v };
}
export const getGeneral   = () => getGroup(KEYS.general,  DEFAULT_GENERAL);
export const getAutorun   = () => getGroup(KEYS.autorun,  DEFAULT_AUTORUN);
export const getFilters   = () => getGroup(KEYS.filters,  DEFAULT_FILTERS);
export const getA11y      = () => getGroup(KEYS.a11y,     DEFAULT_A11Y);
export const getShortcuts = () => getGroup(KEYS.shortcuts, DEFAULT_SHORTCUTS);

export async function getKeywords(): Promise<string[]> {
  return (await getRaw<string[]>(KEYS.keywords)) ?? [];
}
export async function getTags(): Promise<Record<string, UserTag>> {
  return (await getRaw<Record<string, UserTag>>(KEYS.tags)) ?? {};
}
export async function getRules(): Promise<RuleEntry[]> {
  return (await getRaw<RuleEntry[]>(KEYS.rules)) ?? [];
}
export async function getCollections(): Promise<CollectionItem[]> {
  return (await getRaw<CollectionItem[]>(KEYS.collections)) ?? [];
}
export async function getHistory(): Promise<HistoryItem[]> {
  return (await getRaw<HistoryItem[]>(KEYS.history)) ?? [];
}
export async function getAnalytics(): Promise<AnalyticsBlob> {
  return (await getRaw<AnalyticsBlob>(KEYS.analytics)) ?? {};
}
export async function getEnabled(): Promise<boolean> {
  const v = await getRaw<boolean>(KEYS.enabled);
  return v !== false;
}
export async function getTheme(): Promise<ThemeMode> {
  return ((await getRaw<ThemeMode>(KEYS.theme)) ?? "dark");
}
export async function getLang(): Promise<string> {
  return (await getRaw<string>(KEYS.lang)) ?? "en";
}

/* ---------- Setters ---------- */
export const setGroup = <T,>(key: string, patch: Partial<T>) => setRaw({ [key]: patch });
export const setEnabled = (v: boolean)  => setRaw({ [KEYS.enabled]: v });
export const setTheme   = (v: ThemeMode) => setRaw({ [KEYS.theme]: v });
export const setLang    = (v: string)   => setRaw({ [KEYS.lang]: v });

/* ---------- Change listener (any key) ---------- */
export function onChange(cb: (changes: Record<string, chrome.storage.StorageChange>) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") cb(changes);
  });
}
