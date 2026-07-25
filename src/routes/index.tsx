import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reddit Power Toolkit — Local-first Chrome extension" },
      {
        name: "description",
        content:
          "A free, open-source Chrome extension that supercharges Reddit with comment tree navigation, folding, conversation mode, filters, exporter and more. 100% local.",
      },
      { property: "og:title", content: "Reddit Power Toolkit — Local-first Chrome extension" },
      {
        property: "og:description",
        content:
          "A free, open-source Chrome extension that supercharges Reddit with comment tree navigation, folding, conversation mode, filters, exporter and more. 100% local.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES: { title: string; desc: string }[] = [
  { title: "Comment Tree Navigator", desc: "Visual sidebar of the whole thread — click any node to jump to that comment." },
  { title: "Comment Folding", desc: "Collapse/expand branches or the whole thread. Fold state is remembered locally." },
  { title: "Conversation Mode", desc: "Turn nested replies into a chat-style transcript that's easy to read." },
  { title: "Depth Layers", desc: "Colour-coded borders show reply depth so you never lose your place." },
  { title: "Thread Cleaner", desc: "Hide deleted, empty, bot, short, or low-score comments in one click." },
  { title: "Comment Statistics", desc: "Live stats: totals, longest comment, most-replied users, deepest chain." },
  { title: "Thread Health Analyzer", desc: "Rule-based score covering depth, activity, dead branches and controversy." },
  { title: "Keyword Highlighter", desc: "Highlight custom keywords across every Reddit post and comment." },
  { title: "Private User Tags", desc: "Label users (Expert, Helpful, Ignore…) with your own colours." },
  { title: "Formatting Toolbar", desc: "Bold, italic, code, quote, spoiler, link buttons for the reply box." },
  { title: "Thread Exporter", desc: "Export any thread as Markdown, HTML or JSON — perfect for archiving." },
  { title: "Image Gallery Mode", desc: "Fullscreen gallery with next/previous for image-heavy posts." },
  { title: "Thread Age Warning", desc: "See a friendly banner when a thread is more than a year old." },
  { title: "Link Previews", desc: "Hover any external link to see the domain, path and link type." },
  { title: "Personal Analytics", desc: "Posts viewed, comments read, subreddits, reading time — stored locally." },
  { title: "Local Thread History", desc: "Saved list of visited threads with title, date and comment count." },
];

function downloadZip() {
  fetch("/reddit-power-toolkit.zip")
    .then((res) => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "reddit-power-toolkit.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert(err.message));
}

function Index() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#10b981] font-bold text-black">
            RPT
          </div>
          <span className="font-semibold">Reddit Power Toolkit</span>
        </div>
        <nav className="hidden gap-6 text-sm text-white/70 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#install" className="hover:text-white">Install</a>
          <a href="#privacy" className="hover:text-white">Privacy</a>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-8 md:pt-20">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-white/70">
              Chrome Extension · Manifest V3 · Open source
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Supercharge Reddit.
              <br />
              <span className="text-[#10b981]">
                100% local, zero tracking.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              A powerful browser extension that adds a comment tree, folding, conversation mode,
              cleaner filters, stats, exporter, gallery and 10+ more tools to every Reddit page.
              Nothing is ever sent to a server.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={downloadZip}
                className="rounded-lg bg-[#3b82f6] px-6 py-3 font-semibold text-white shadow-lg shadow-[#3b82f6]/25 transition hover:bg-[#2563eb]"
              >
                Download extension (.zip)
              </button>
              <a
                href="#install"
                className="rounded-lg border border-white/15 bg-white/5 px-6 py-3 font-medium text-white/90 transition hover:bg-white/10"
              >
                How to install
              </a>
            </div>
            <p className="mt-3 text-xs text-white/50">
              Works in Chrome, Edge, Brave, Arc and any Chromium browser.
            </p>
          </div>
        </section>

        <section id="features" className="border-t border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-bold md:text-3xl">16 tools in one extension</h2>
            <p className="mt-2 text-white/60">Every feature runs client-side inside your browser.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#10b981]/50 hover:bg-white/[0.06]"
                >
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="install" className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-bold md:text-3xl">Install in 30 seconds</h2>
          <ol className="mt-6 space-y-4 text-white/80">
            {[
              "Download the ZIP above and unzip it anywhere on your computer.",
              <>Open <code className="rounded bg-white/10 px-2 py-0.5">chrome://extensions</code> in your browser.</>,
              <>Turn on <strong>Developer mode</strong> (toggle in the top-right).</>,
              <>Click <strong>Load unpacked</strong> and select the unzipped folder.</>,
              "Open any Reddit thread — the RPT floating button appears bottom-right.",
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3b82f6] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section id="privacy" className="border-t border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-4xl px-6 py-16">
            <h2 className="text-2xl font-bold md:text-3xl">Privacy first</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["No backend", "There is no server. There is no account. There is nothing to sign up for."],
                ["No tracking", "No analytics pings, no third-party scripts, no telemetry."],
                ["No AI calls", "All analysis (stats, health, cleaner) runs with plain JavaScript."],
                ["Local storage only", "Filters, tags, keywords, history and analytics use chrome.storage.local."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-2 text-sm text-white/60">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-8 text-sm text-white/50 sm:flex-row sm:items-center">
          <span>Reddit Power Toolkit v1.0.0 · MIT licensed</span>
          <span>Not affiliated with Reddit, Inc.</span>
        </div>
      </footer>
    </div>
  );
}
