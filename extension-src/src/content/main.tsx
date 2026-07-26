// Reddit Power Toolkit — content script entry.
// Mounts a Shadow-DOM host on every Reddit page. Full feature port lands
// in Phase 3+4 (UI components + 36 Power features). Phase 1 ships a
// visible QuickBar stub so we can confirm the pipeline injects correctly.
import React from "react";
import { createRoot } from "react-dom/client";
import tokensCss from "@/tokens.css?inline";

const HOST_ID = "rpt-shadow-host";
if (!document.getElementById(HOST_ID)) {
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.all = "initial";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = tokensCss;
  const mount = document.createElement("div");
  mount.id = "rpt-root";
  shadow.append(style, mount);

  createRoot(mount).render(<QuickBar />);
}

function QuickBar() {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      className="fixed bottom-4 right-4 z-[2147483647] font-sans"
      data-rpt-theme="dark"
    >
      {open && (
        <div className="mb-2 w-72 rpt-card">
          <div className="text-sm font-semibold text-text">Reddit Power Toolkit</div>
          <p className="mt-1 text-xs text-muted">
            v2.0.0 shell is live. Feature modules are being ported to this
            Vite + React + Tailwind build.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rpt-btn-primary shadow-glow"
        aria-label="Reddit Power Toolkit"
      >
        RPT
      </button>
    </div>
  );
}