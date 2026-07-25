import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Download, Shield, Zap, GitBranch, ChevronsUpDown, MessageSquare, Layers,
  Sparkles, ListChecks, Activity, Highlighter, Tag, Bold, FileDown, Image,
  Clock, LinkIcon, BarChart3, History, Sun, Moon, Languages,
  Chrome, Globe, Smartphone, ShieldCheck, Github,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reddit Power Toolkit — 16 tools for Reddit, 100% local" },
      { name: "description", content: "Free open-source browser extension for Chrome, Firefox, Edge, Brave and Kiwi (Android). Comment tree, folding, smart summary, cleaner, gallery, analytics — everything runs locally in your browser." },
      { property: "og:title", content: "Reddit Power Toolkit — 16 tools, 100% local" },
      { property: "og:description", content: "16-in-1 Reddit toolkit for every major browser. No servers, no tracking, no accounts." },
    ],
  }),
  component: Index,
});

/* ---------- i18n ---------- */
type Lang = "en" | "es" | "fr" | "de" | "pt" | "ja" | "zh";
const LANGS: [Lang, string][] = [
  ["en", "English"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"],
  ["pt", "Português"], ["ja", "日本語"], ["zh", "中文"],
];
const T: Record<Lang, Record<string, string>> = {
  en: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · Open source",
    hero1: "Supercharge Reddit.", hero2: "100% local, zero tracking.",
    heroP: "A powerful browser extension that adds a comment tree, folding, conversation mode, smart summary, cleaner, gallery, analytics and 10+ more tools to every Reddit page. Nothing is ever sent to a server.",
    dl: "Download extension (.zip)", how: "How to install",
    worksIn: "Works in Chrome, Edge, Brave, Arc, Opera, Firefox 128+ and Kiwi Browser on Android.",
    featuresTitle: "16 tools in one extension", featuresSub: "Every feature runs client-side inside your browser.",
    installTitle: "Install in 30 seconds", installSub: "Pick your browser below — instructions adapt automatically.",
    privacyTitle: "Privacy first",
    p1t: "No backend", p1d: "There is no server. There is no account. There is nothing to sign up for.",
    p2t: "No tracking", p2d: "No analytics pings, no third-party scripts, no telemetry.",
    p3t: "No AI calls", p3d: "All analysis (stats, health, cleaner) runs with plain JavaScript.",
    p4t: "Local storage", p4d: "Filters, tags, keywords, history and analytics use browser.storage.local.",
    footerA: "Reddit Power Toolkit v1.2 · MIT licensed",
    footerB: "Not affiliated with Reddit, Inc.",
    nav_features: "Features", nav_install: "Install", nav_privacy: "Privacy",
    step_download: "Download the ZIP above and unzip it anywhere on your computer.",
    step_open_chrome: "Open chrome://extensions (or brave://extensions, edge://extensions).",
    step_dev: "Enable Developer mode (top-right toggle).",
    step_load: "Click Load unpacked and select the unzipped folder.",
    step_thread: "Open any Reddit thread — the RPT toolbar appears bottom-right.",
    step_ff_open: "Open about:debugging → This Firefox.",
    step_ff_load: "Click Load Temporary Add-on and pick manifest.json from the unzipped folder.",
    step_ff_note: "Firefox 128+ is required for MV3 extensions.",
    step_kiwi_open: "Open kiwibrowser://extensions in Kiwi Browser on Android.",
    step_kiwi_dev: "Enable Developer mode and tap +(from .zip).",
    step_kiwi_pick: "Select the downloaded ZIP directly — Kiwi installs it as-is.",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
  },
  es: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · Código abierto",
    hero1: "Potencia Reddit.", hero2: "100% local, sin rastreo.",
    heroP: "Una extensión potente que añade árbol de comentarios, plegado, modo conversación, resumen, limpiador, galería y más a cada página de Reddit. Nada sale de tu navegador.",
    dl: "Descargar extensión (.zip)", how: "Cómo instalar",
    worksIn: "Funciona en Chrome, Edge, Brave, Arc, Opera, Firefox 128+ y Kiwi Browser en Android.",
    featuresTitle: "16 herramientas en una extensión", featuresSub: "Todo se ejecuta en tu navegador.",
    installTitle: "Instala en 30 segundos", installSub: "Elige tu navegador — las instrucciones se adaptan.",
    privacyTitle: "Privacidad primero",
    p1t: "Sin servidor", p1d: "No hay servidor. No hay cuenta. Nada que registrar.",
    p2t: "Sin rastreo", p2d: "Sin analíticas, scripts de terceros ni telemetría.",
    p3t: "Sin IA", p3d: "Todo el análisis se hace con JavaScript.",
    p4t: "Datos locales", p4d: "Filtros, etiquetas, historial en browser.storage.local.",
    footerA: "Reddit Power Toolkit v1.2 · Licencia MIT",
    footerB: "No afiliado con Reddit, Inc.",
    nav_features: "Funciones", nav_install: "Instalar", nav_privacy: "Privacidad",
    step_download: "Descarga el ZIP y descomprímelo.",
    step_open_chrome: "Abre chrome://extensions (o brave://extensions).",
    step_dev: "Activa el modo desarrollador.",
    step_load: "Pulsa Cargar descomprimida y elige la carpeta.",
    step_thread: "Abre un hilo de Reddit — la barra RPT aparece abajo a la derecha.",
    step_ff_open: "Abre about:debugging → Este Firefox.",
    step_ff_load: "Pulsa Cargar complemento temporal y elige manifest.json.",
    step_ff_note: "Requiere Firefox 128+ para MV3.",
    step_kiwi_open: "Abre kiwibrowser://extensions en Kiwi (Android).",
    step_kiwi_dev: "Activa modo desarrollador y toca +(from .zip).",
    step_kiwi_pick: "Selecciona el ZIP descargado.",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
  },
  fr: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · Open source",
    hero1: "Boostez Reddit.", hero2: "100% local, zéro traçage.",
    heroP: "Une extension puissante qui ajoute arbre de commentaires, repli, mode conversation, résumé, nettoyeur, galerie et plus à chaque page Reddit.",
    dl: "Télécharger (.zip)", how: "Installation",
    worksIn: "Fonctionne dans Chrome, Edge, Brave, Arc, Opera, Firefox 128+ et Kiwi Android.",
    featuresTitle: "16 outils en une extension", featuresSub: "Tout tourne dans votre navigateur.",
    installTitle: "Installer en 30 secondes", installSub: "Choisissez votre navigateur.",
    privacyTitle: "Vie privée d'abord",
    p1t: "Aucun serveur", p1d: "Pas de serveur, pas de compte.",
    p2t: "Aucun traçage", p2d: "Aucune télémétrie ni script tiers.",
    p3t: "Aucune IA", p3d: "Tout est du JavaScript pur.",
    p4t: "Stockage local", p4d: "Tout dans browser.storage.local.",
    footerA: "Reddit Power Toolkit v1.2 · Licence MIT",
    footerB: "Sans affiliation avec Reddit, Inc.",
    nav_features: "Fonctions", nav_install: "Installer", nav_privacy: "Vie privée",
    step_download: "Téléchargez le ZIP et décompressez-le.",
    step_open_chrome: "Ouvrez chrome://extensions.",
    step_dev: "Activez le mode développeur.",
    step_load: "Cliquez Charger l'extension non empaquetée.",
    step_thread: "Ouvrez un fil Reddit — la barre RPT apparaît.",
    step_ff_open: "Ouvrez about:debugging → Ce Firefox.",
    step_ff_load: "Charger un module temporaire → manifest.json.",
    step_ff_note: "Firefox 128+ requis.",
    step_kiwi_open: "Ouvrez kiwibrowser://extensions.",
    step_kiwi_dev: "Activez le mode dev, touchez +(from .zip).",
    step_kiwi_pick: "Choisissez le ZIP.",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
  },
  de: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · Open Source",
    hero1: "Reddit auf Steroiden.", hero2: "100% lokal, kein Tracking.",
    heroP: "Eine mächtige Browser-Erweiterung mit Kommentarbaum, Falten, Konversation, Cleaner, Galerie und mehr.",
    dl: "Erweiterung laden (.zip)", how: "Installation",
    worksIn: "Chrome, Edge, Brave, Arc, Opera, Firefox 128+ und Kiwi Android.",
    featuresTitle: "16 Tools in einer Erweiterung", featuresSub: "Alles läuft in deinem Browser.",
    installTitle: "In 30 Sekunden installiert", installSub: "Wähle deinen Browser.",
    privacyTitle: "Datenschutz zuerst",
    p1t: "Kein Backend", p1d: "Kein Server, kein Konto.",
    p2t: "Kein Tracking", p2d: "Keine Telemetrie.",
    p3t: "Keine KI", p3d: "Reines JavaScript.",
    p4t: "Lokaler Speicher", p4d: "Alles in browser.storage.local.",
    footerA: "Reddit Power Toolkit v1.2 · MIT-Lizenz",
    footerB: "Nicht mit Reddit, Inc. verbunden.",
    nav_features: "Funktionen", nav_install: "Installieren", nav_privacy: "Datenschutz",
    step_download: "ZIP herunterladen und entpacken.",
    step_open_chrome: "chrome://extensions öffnen.",
    step_dev: "Entwicklermodus aktivieren.",
    step_load: "Entpackte Erweiterung laden.",
    step_thread: "Reddit-Thread öffnen — RPT-Leiste erscheint.",
    step_ff_open: "about:debugging → Dieses Firefox.",
    step_ff_load: "Temporäres Add-on laden → manifest.json.",
    step_ff_note: "Firefox 128+ erforderlich.",
    step_kiwi_open: "kiwibrowser://extensions öffnen.",
    step_kiwi_dev: "Dev-Modus an, +(from .zip) tippen.",
    step_kiwi_pick: "ZIP auswählen.",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
  },
  pt: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · Código aberto",
    hero1: "Turbine o Reddit.", hero2: "100% local, sem rastreio.",
    heroP: "Uma extensão poderosa: árvore de comentários, recolher, conversa, resumo, limpador, galeria e mais.",
    dl: "Baixar extensão (.zip)", how: "Como instalar",
    worksIn: "Funciona em Chrome, Edge, Brave, Arc, Opera, Firefox 128+ e Kiwi Android.",
    featuresTitle: "16 ferramentas em uma extensão", featuresSub: "Tudo roda no seu navegador.",
    installTitle: "Instale em 30 segundos", installSub: "Escolha seu navegador.",
    privacyTitle: "Privacidade primeiro",
    p1t: "Sem servidor", p1d: "Sem conta, sem cadastro.",
    p2t: "Sem rastreio", p2d: "Sem telemetria.",
    p3t: "Sem IA", p3d: "Só JavaScript.",
    p4t: "Só local", p4d: "Tudo em browser.storage.local.",
    footerA: "Reddit Power Toolkit v1.2 · Licença MIT",
    footerB: "Não afiliado à Reddit, Inc.",
    nav_features: "Recursos", nav_install: "Instalar", nav_privacy: "Privacidade",
    step_download: "Baixe o ZIP e descompacte.",
    step_open_chrome: "Abra chrome://extensions.",
    step_dev: "Ative o modo desenvolvedor.",
    step_load: "Clique Carregar sem compactação.",
    step_thread: "Abra um tópico do Reddit.",
    step_ff_open: "Abra about:debugging → Este Firefox.",
    step_ff_load: "Carregar add-on temporário → manifest.json.",
    step_ff_note: "Firefox 128+ necessário.",
    step_kiwi_open: "Abra kiwibrowser://extensions.",
    step_kiwi_dev: "Modo dev, +(from .zip).",
    step_kiwi_pick: "Escolha o ZIP.",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
  },
  ja: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · オープンソース",
    hero1: "Redditを強化。", hero2: "100%ローカル、追跡ゼロ。",
    heroP: "コメントツリー、折りたたみ、会話モード、要約、クリーナー、ギャラリーなどを追加する強力な拡張機能。",
    dl: "拡張機能をダウンロード (.zip)", how: "インストール方法",
    worksIn: "Chrome, Edge, Brave, Arc, Opera, Firefox 128+, Kiwi Android で動作。",
    featuresTitle: "1つの拡張に16のツール", featuresSub: "すべてブラウザ内で動作。",
    installTitle: "30秒でインストール", installSub: "ブラウザを選んでください。",
    privacyTitle: "プライバシー優先",
    p1t: "サーバー無し", p1d: "アカウント不要。",
    p2t: "追跡無し", p2d: "テレメトリー無し。",
    p3t: "AI 呼び出し無し", p3d: "純粋な JavaScript。",
    p4t: "ローカル保存", p4d: "browser.storage.local に保存。",
    footerA: "Reddit Power Toolkit v1.2 · MIT",
    footerB: "Reddit, Inc. とは無関係。",
    nav_features: "機能", nav_install: "インストール", nav_privacy: "プライバシー",
    step_download: "ZIP をダウンロードして解凍。",
    step_open_chrome: "chrome://extensions を開く。",
    step_dev: "デベロッパーモードを有効化。",
    step_load: "パッケージ化されていない拡張機能を読み込む。",
    step_thread: "Reddit のスレを開くと右下に RPT バーが表示。",
    step_ff_open: "about:debugging → この Firefox。",
    step_ff_load: "一時的なアドオンを読み込む → manifest.json。",
    step_ff_note: "Firefox 128+ が必要。",
    step_kiwi_open: "kiwibrowser://extensions を開く。",
    step_kiwi_dev: "開発者モード ON、+(from .zip)。",
    step_kiwi_pick: "ZIP を選択。",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
  },
  zh: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi 安卓 · 开源",
    hero1: "增强 Reddit。", hero2: "100% 本地，零追踪。",
    heroP: "为每个 Reddit 页面添加评论树、折叠、对话模式、智能摘要、清理器、画廊等 16+ 个工具。",
    dl: "下载扩展 (.zip)", how: "安装方法",
    worksIn: "支持 Chrome, Edge, Brave, Arc, Opera, Firefox 128+ 及 Kiwi Browser (Android)。",
    featuresTitle: "一个扩展 16 个工具", featuresSub: "全部在浏览器内运行。",
    installTitle: "30 秒安装完成", installSub: "选择你的浏览器。",
    privacyTitle: "隐私至上",
    p1t: "无后端", p1d: "无账号。",
    p2t: "无追踪", p2d: "无遥测。",
    p3t: "无 AI", p3d: "纯 JavaScript。",
    p4t: "仅本地", p4d: "全部保存在 browser.storage.local。",
    footerA: "Reddit Power Toolkit v1.2 · MIT 许可",
    footerB: "与 Reddit, Inc. 无关联。",
    nav_features: "功能", nav_install: "安装", nav_privacy: "隐私",
    step_download: "下载 ZIP 并解压。",
    step_open_chrome: "打开 chrome://extensions。",
    step_dev: "开启开发者模式。",
    step_load: "点击「加载已解压的扩展」。",
    step_thread: "打开任意 Reddit 帖 — 右下出现 RPT 工具栏。",
    step_ff_open: "打开 about:debugging → 此 Firefox。",
    step_ff_load: "临时载入附加组件 → manifest.json。",
    step_ff_note: "需要 Firefox 128+。",
    step_kiwi_open: "打开 kiwibrowser://extensions。",
    step_kiwi_dev: "开启开发者模式，点 +(from .zip)。",
    step_kiwi_pick: "选择下载的 ZIP。",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
  },
};

function downloadZip() {
  fetch("/reddit-power-toolkit.zip")
    .then((res) => { if (!res.ok) throw new Error(`Download failed: ${res.status}`); return res.blob(); })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "reddit-power-toolkit.zip"; a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert(err.message));
}

function useThemeAndLang() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const t = (localStorage.getItem("rpt_site_theme") as "dark" | "light") || "dark";
    const l = (localStorage.getItem("rpt_site_lang") as Lang) || "en";
    setTheme(t); setLang(l);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); localStorage.setItem("rpt_site_theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("rpt_site_lang", lang); }, [lang]);
  return { theme, setTheme, lang, setLang };
}

function Index() {
  const { theme, setTheme, lang, setLang } = useThemeAndLang();
  const t = useMemo(() => (k: string) => T[lang][k] ?? T.en[k] ?? k, [lang]);

  const isDark = theme === "dark";
  const bg = isDark ? "bg-[#0b0f14] text-white" : "bg-white text-[#0b1220]";
  const card = isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50";
  const cardHover = isDark ? "hover:border-[#10b981]/60 hover:bg-white/[0.06]" : "hover:border-[#10b981] hover:bg-white";
  const subtle = isDark ? "text-white/60" : "text-slate-600";
  const muted = isDark ? "text-white/50" : "text-slate-500";
  const border = isDark ? "border-white/5" : "border-slate-200";
  const section2 = isDark ? "bg-white/[0.02]" : "bg-slate-50/60";

  const FEATURES = [
    { i: GitBranch, t: "Comment Tree Navigator", d: "Sidebar tree of every comment; click to jump instantly." },
    { i: ChevronsUpDown, t: "Comment Folding", d: "Collapse and remember expand/collapse state per thread." },
    { i: MessageSquare, t: "Conversation Mode", d: "Reformat threads as a chat-style conversation." },
    { i: Layers, t: "Depth Layers", d: "Coloured borders visualise nesting depth at a glance." },
    { i: Sparkles, t: "Smart Summary", d: "Top voted · most discussed · controversial — computed locally." },
    { i: ListChecks, t: "Thread Cleaner", d: "Hide deleted, empty, bot or low-score comments." },
    { i: Activity, t: "Thread Health", d: "Toxicity, quality, engagement — scored on-device." },
    { i: Highlighter, t: "Keyword Highlighter", d: "Your custom keywords, highlighted everywhere on Reddit." },
    { i: Tag, t: "Private User Tags", d: "Label users with your own colours and notes." },
    { i: Bold, t: "Formatting Toolbar", d: "Bold, italic, code, quote, spoiler, link — one-click." },
    { i: FileDown, t: "Thread Exporter", d: "Export any thread as Markdown, HTML or JSON." },
    { i: Image, t: "Image Gallery Mode", d: "Fullscreen gallery with prev / next for image posts." },
    { i: Clock, t: "Thread Age Warning", d: "Friendly banner on threads older than a year." },
    { i: LinkIcon, t: "Link Previews", d: "Hover any link to preview its domain, path and type." },
    { i: BarChart3, t: "Personal Analytics", d: "Posts, comments, subs, reading time — all local." },
    { i: History, t: "Local Thread History", d: "Every visited thread with title, date and count." },
  ];

  return (
    <div className={`min-h-screen ${bg} transition-colors`}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#10b981] font-bold text-black">RPT</div>
          <span className="font-semibold">Reddit Power Toolkit</span>
        </div>
        <nav className="hidden gap-6 text-sm md:flex">
          <a href="#features" className={`${subtle} hover:text-inherit`}>{t("nav_features")}</a>
          <a href="#install" className={`${subtle} hover:text-inherit`}>{t("nav_install")}</a>
          <a href="#privacy" className={`${subtle} hover:text-inherit`}>{t("nav_privacy")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-lg border ${border} px-2 py-1 text-xs ${subtle}`}>
            <Languages className="h-3.5 w-3.5" />
            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-transparent outline-none"
            >
              {LANGS.map(([code, label]) => (
                <option key={code} value={code} className="text-black">{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            className={`grid h-8 w-8 place-items-center rounded-lg border ${border} ${subtle} hover:text-[#10b981]`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-8 md:pt-20">
          <div className="max-w-3xl">
            <span className={`inline-block rounded-full border ${border} px-3 py-1 text-xs uppercase tracking-wider ${subtle}`}>
              {t("badge")}
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              {t("hero1")}<br />
              <span className="text-[#10b981]">{t("hero2")}</span>
            </h1>
            <p className={`mt-6 max-w-2xl text-lg ${subtle}`}>{t("heroP")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={downloadZip}
                className="inline-flex items-center gap-2 rounded-lg bg-[#3b82f6] px-6 py-3 font-semibold text-white shadow-lg shadow-[#3b82f6]/20 transition hover:bg-[#2563eb]"
              >
                <Download className="h-5 w-5" /> {t("dl")}
              </button>
              <a
                href="#install"
                className={`inline-flex items-center gap-2 rounded-lg border ${border} px-6 py-3 font-medium transition ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-slate-100"}`}
              >
                <Zap className="h-5 w-5" /> {t("how")}
              </a>
            </div>
            <p className={`mt-3 text-xs ${muted}`}>{t("worksIn")}</p>
          </div>
        </section>

        <section id="features" className={`border-t ${border} ${section2}`}>
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-bold md:text-3xl">{t("featuresTitle")}</h2>
            <p className={`mt-2 ${subtle}`}>{t("featuresSub")}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.t} className={`rounded-xl border p-5 transition ${card} ${cardHover}`}>
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#10b981]/10 text-[#10b981]">
                    <f.i className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{f.t}</h3>
                  <p className={`mt-2 text-sm ${subtle}`}>{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="install" className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-bold md:text-3xl">{t("installTitle")}</h2>
          <p className={`mt-2 ${subtle}`}>{t("installSub")}</p>
          <InstallTabs t={t} card={card} cardHover={cardHover} subtle={subtle} border={border} isDark={isDark} />
        </section>

        <section id="privacy" className={`border-t ${border} ${section2}`}>
          <div className="mx-auto max-w-4xl px-6 py-16">
            <h2 className="text-2xl font-bold md:text-3xl">{t("privacyTitle")}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                [Shield, t("p1t"), t("p1d")],
                [ShieldCheck, t("p2t"), t("p2d")],
                [Sparkles, t("p3t"), t("p3d")],
                [Globe, t("p4t"), t("p4d")],
              ].map(([Icon, title, desc]) => {
                const I = Icon as typeof Shield; const ttl = title as string; const dsc = desc as string;
                return (
                  <div key={ttl} className={`rounded-xl border p-5 ${card}`}>
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#3b82f6]/10 text-[#3b82f6]">
                      <I className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{ttl}</h3>
                    <p className={`mt-2 text-sm ${subtle}`}>{dsc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className={`border-t ${border}`}>
        <div className={`mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-8 text-sm sm:flex-row sm:items-center ${muted}`}>
          <span>{t("footerA")}</span>
          <span className="flex items-center gap-2"><Github className="h-4 w-4" /> {t("footerB")}</span>
        </div>
      </footer>
    </div>
  );
}

function InstallTabs({
  t, card, cardHover, subtle, border, isDark,
}: {
  t: (k: string) => string; card: string; cardHover: string; subtle: string; border: string; isDark: boolean;
}) {
  const [tab, setTab] = useState<"chrome" | "ff" | "kiwi">("chrome");
  const activeCls = "bg-[#10b981] text-black border-[#10b981]";
  const tabs: { id: "chrome" | "ff" | "kiwi"; label: string; icon: ReactNode }[] = [
    { id: "chrome", label: t("tab_chrome"), icon: <Chrome className="h-4 w-4" /> },
    { id: "ff", label: t("tab_ff"), icon: <Globe className="h-4 w-4" /> },
    { id: "kiwi", label: t("tab_kiwi"), icon: <Smartphone className="h-4 w-4" /> },
  ];
  const steps: Record<string, ReactNode[]> = {
    chrome: [t("step_download"), <>{t("step_open_chrome")}</>, t("step_dev"), t("step_load"), t("step_thread")],
    ff: [t("step_download"), t("step_ff_open"), t("step_ff_load"), <span className={subtle}>{t("step_ff_note")}</span>, t("step_thread")],
    kiwi: [t("step_download"), t("step_kiwi_open"), t("step_kiwi_dev"), t("step_kiwi_pick"), t("step_thread")],
  };
  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${tab === x.id ? activeCls : `${card} ${cardHover} ${subtle}`}`}
          >
            {x.icon}{x.label}
          </button>
        ))}
      </div>
      <ol className={`mt-8 space-y-4 ${isDark ? "text-white/85" : "text-slate-800"}`}>
        {steps[tab].map((step, i) => (
          <li key={i} className={`flex gap-4 rounded-xl border p-4 ${card}`}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3b82f6] text-sm font-bold text-white">{i + 1}</span>
            <span className="pt-1">{step}</span>
          </li>
        ))}
      </ol>
      <p className={`mt-6 text-xs ${subtle}`}>
        <span className="font-semibold">Firefox:</span> works from v128+. The ZIP includes a Gecko-compatible manifest.
        · <span className="font-semibold">Kiwi Browser:</span> the only Chromium browser on Android that supports extension loading, ideal for mobile users.
      </p>
    </>
  );
}
