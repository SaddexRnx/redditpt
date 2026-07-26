// Minimal typed i18n. Phase 2 will expand this from the full dictionary in
// extension/shared.js. For now we ship English + a `t()` that falls back to
// the key itself so nothing renders empty.
import { getSettings, onSettingsChange } from "./storage";

type Dict = Record<string, string>;

const en: Dict = {
  appName: "Reddit Power Toolkit",
  tagline: "Local-first · v2.0.0",
  status_active: "Active on this Reddit tab",
  status_notReddit: "Open a Reddit page to use the tools",
  enable_toolkit: "Enable toolkit",
  open_panel: "Open side panel",
  settings: "Settings",
  analytics: "Analytics",
  general: "General",
  language: "Language",
  theme: "Theme",
  dark: "Dark",
  light: "Light",
  footer_privacy: "100% local · no accounts · no servers",
};

const dicts: Record<string, Dict> = { en };

let current: string = "en";

export async function initI18n() {
  const s = await getSettings();
  current = dicts[s.lang] ? s.lang : "en";
  onSettingsChange((next) => {
    current = dicts[next.lang] ? next.lang : "en";
  });
}

export function t(key: string): string {
  return dicts[current]?.[key] ?? dicts.en[key] ?? key;
}

export const AVAILABLE_LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];