// Lightweight i18n. Keys mirror the legacy dictionary so translations
// migrate 1-to-1 in Phase 3. Missing keys fall back to English → key.
import { getLang, setLang, onChange } from "./storage";

type Dict = Record<string, string>;

const en: Dict = {
  appName: "Reddit Power Toolkit",
  tagline: "Local-first · v2.0.0",
  status_active: "Active on this Reddit tab",
  status_notReddit: "Open a Reddit page to use the tools",
  status_notInjected: "Not injected — reload the tab",
  status_injectFail: "Could not inject — check permissions",
  reload_tab: "Reload tab",
  enable_toolkit: "Enable toolkit",
  toolkit_paused: "Toolkit paused",
  open_panel: "Open side panel",
  settings: "Settings",
  analytics: "Analytics",
  general: "General",
  automation: "Automation",
  filters: "Filters",
  keywords: "Keywords",
  user_tags: "User tags",
  rules: "Rule builder",
  a11y: "Accessibility",
  shortcuts: "Shortcuts",
  collections: "Saved collections",
  danger_zone: "Danger zone",
  language: "Language",
  theme: "Theme",
  dark: "Dark",
  light: "Light",
  add: "Add",
  remove: "Remove",
  save: "Save",
  reset: "Reset to defaults",
  export: "Export",
  import: "Import",
  export_json: "Export JSON",
  export_csv: "Export CSV",
  clear_all: "Clear all local data",
  footer_privacy: "100% local · no accounts · no servers",
  auto_open_panel: "Auto-open side panel on first visit to a thread",
  color_authors: "Color-code comment authors",
  onboarding_hint: "Show onboarding tips",
  keywords_hint: "Comma-separated words to highlight in threads",
  tag_user_ph: "username",
  tag_label_ph: "label (e.g. troll, friend)",
  no_rules: "No rules yet — add one below.",
  press_key: "Press key…",
  click_change: "Click to change",
  posts_viewed: "Posts viewed",
  comments_read: "Comments read",
  reading_time: "Reading time",
  subreddits: "Subreddits",
  top_subs: "Top subreddits",
  saved_comments: "Saved comments",
  recent_history: "Recent history",
};

const dicts: Record<string, Dict> = { en };

let current: string = "en";

export async function initI18n() {
  current = dicts[await getLang()] ? await getLang() : "en";
  onChange((c) => {
    if (c.rpt_lang) current = dicts[c.rpt_lang.newValue as string] ? (c.rpt_lang.newValue as string) : "en";
  });
}

export function t(key: string): string {
  return dicts[current]?.[key] ?? dicts.en[key] ?? key;
}
export async function switchLang(code: string) {
  current = dicts[code] ? code : "en";
  await setLang(current);
}

export const AVAILABLE_LANGS: [string, string][] = [
  ["en", "English"], ["es", "Español"], ["fr", "Français"],
  ["de", "Deutsch"], ["pt", "Português"], ["ja", "日本語"], ["zh", "中文"],
];
