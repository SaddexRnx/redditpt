import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "../package.json" with { type: "json" };

const target = (process.env.TARGET ?? "chrome") as "chrome" | "firefox";

const base = {
  manifest_version: 3 as const,
  name: "Reddit Power Toolkit",
  version: pkg.version,
  description:
    "A local-first toolkit that supercharges the Reddit reading & writing experience.",
  default_locale: "en",
  icons: {
    "16": "icons/icon.png",
    "48": "icons/icon.png",
    "128": "icons/icon.png",
  },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_title: "Reddit Power Toolkit",
    default_icon: {
      "16": "icons/icon.png",
      "48": "icons/icon.png",
      "128": "icons/icon.png",
    },
  },
  options_page: "src/pages/options/index.html",
  permissions: ["storage", "activeTab", "tabs", "scripting"],
  host_permissions: [
    "https://www.reddit.com/*",
    "https://old.reddit.com/*",
    "https://new.reddit.com/*",
    "https://sh.reddit.com/*",
  ],
  content_scripts: [
    {
      matches: [
        "https://www.reddit.com/*",
        "https://old.reddit.com/*",
        "https://new.reddit.com/*",
        "https://sh.reddit.com/*",
      ],
      js: ["src/content/main.tsx"],
      run_at: "document_idle" as const,
    },
  ],
  web_accessible_resources: [
    {
      resources: ["src/pages/analytics/index.html", "icons/*"],
      matches: ["https://*.reddit.com/*"],
    },
  ],
};

const firefoxExtras = {
  browser_specific_settings: {
    gecko: {
      id: "reddit-power-toolkit@lovable.dev",
      strict_min_version: "128.0",
    },
  },
  background: { scripts: ["src/background/service-worker.ts"] },
};

const chromeExtras = {
  background: { service_worker: "src/background/service-worker.ts", type: "module" as const },
};

export default defineManifest({
  ...base,
  ...(target === "firefox" ? firefoxExtras : chromeExtras),
});