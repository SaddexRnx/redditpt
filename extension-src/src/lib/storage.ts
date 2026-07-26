// Typed wrapper over chrome.storage.local. Every module reads/writes through
// here so we get one place to reason about schema + defaults.
export type ThemeMode = "dark" | "light";

export interface RPTSettings {
  enabled: boolean;
  theme: ThemeMode;
  lang: string;
  autoOpenPanel: boolean;
  showAuthorColors: boolean;
  automation: {
    cleaner: boolean;
    highlighter: boolean;
    tags: boolean;
    ageWarning: boolean;
    quickBar: boolean;
    saveButtons: boolean;
    liveNew: boolean;
  };
  filters: {
    hideDeleted: boolean;
    hideEmpty: boolean;
    hideBots: boolean;
    hideShort: boolean;
    minLength: number;
    hideLowScore: boolean;
    minScore: number;
  };
  keywords: string[];
  userTags: Record<string, { label: string; color: string }>;
}

export const DEFAULT_SETTINGS: RPTSettings = {
  enabled: true,
  theme: "dark",
  lang: "en",
  autoOpenPanel: true,
  showAuthorColors: true,
  automation: {
    cleaner: true,
    highlighter: true,
    tags: true,
    ageWarning: true,
    quickBar: true,
    saveButtons: true,
    liveNew: false,
  },
  filters: {
    hideDeleted: false,
    hideEmpty: true,
    hideBots: false,
    hideShort: false,
    minLength: 10,
    hideLowScore: false,
    minScore: 0,
  },
  keywords: [],
  userTags: {},
};

export async function getSettings(): Promise<RPTSettings> {
  const raw = await chrome.storage.local.get("rpt:settings");
  return { ...DEFAULT_SETTINGS, ...(raw["rpt:settings"] ?? {}) };
}

export async function setSettings(patch: Partial<RPTSettings>): Promise<RPTSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ "rpt:settings": next });
  return next;
}

export function onSettingsChange(cb: (s: RPTSettings) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes["rpt:settings"]) return;
    cb({ ...DEFAULT_SETTINGS, ...(changes["rpt:settings"].newValue ?? {}) });
  });
}