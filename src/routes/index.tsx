import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Download, Shield, Zap, GitBranch, ChevronsUpDown, MessageSquare, Layers,
  Sparkles, ListChecks, Activity, Highlighter, Tag, Bold, FileDown, Image,
  Clock, LinkIcon, BarChart3, History, Sun, Moon, Languages,
  Chrome, Globe, Smartphone, ShieldCheck, Github,
  Package, Puzzle, ToggleRight, FolderOpen, ArrowRight, Copy, Check, MessageCircle,
  Rocket, Palette, Command, Accessibility, KeyRound, Sparkle,
  Link2, Lock,
} from "lucide-react";

/* Telegram paper-plane glyph — lucide has no Telegram icon, so we ship
   the official mark as an inline SVG so it renders offline. */
function TelegramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9.78 15.27 9.6 19.1c.36 0 .52-.16.72-.35l1.73-1.66 3.59 2.63c.66.36 1.13.17 1.31-.61l2.37-11.13c.24-1-.36-1.4-1-1.15L3.4 12.06c-.98.38-.97.93-.17 1.18l4.15 1.29 9.63-6.07c.45-.28.87-.13.52.19"/>
    </svg>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reddit Power Toolkit — 50+ tools for Reddit, 100% local" },
      { name: "description", content: "Free open-source browser extension for Chrome, Firefox, Edge, Brave and Kiwi (Android). Comment tree, folding, smart summary, cleaner, gallery, analytics — everything runs locally in your browser." },
      { property: "og:title", content: "Reddit Power Toolkit — 50+ tools, 100% local" },
      { property: "og:description", content: "50+ Reddit tools for every major browser. No servers, no tracking, no accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
    heroP: "A powerful browser extension that adds a comment tree, folding, conversation mode, smart summary, cleaner, gallery, analytics and 50+ tools to every Reddit page. Nothing is ever sent to a server.",
    dl: "Download extension (.zip)", how: "How to install",
    worksIn: "Works in Chrome, Edge, Brave, Arc, Opera, Firefox 128+ and Kiwi Browser on Android.",
    featuresTitle: "50+ tools in one extension", featuresSub: "Every feature runs client-side inside your browser.",
    installTitle: "Install in 30 seconds", installSub: "Pick your browser below — instructions adapt automatically.",
    privacyTitle: "Privacy first",
    p1t: "No backend", p1d: "There is no server. There is no account. There is nothing to sign up for.",
    p2t: "No tracking", p2d: "No analytics pings, no third-party scripts, no telemetry.",
    p3t: "No AI calls", p3d: "All analysis (stats, health, cleaner) runs with plain JavaScript.",
    p4t: "Local storage", p4d: "Filters, tags, keywords, history and analytics use browser.storage.local.",
    p5t: "No permissions creep", p5d: "Uses only the minimal Reddit host permission plus storage. No history, tabs or geolocation access.",
    p6t: "Open source & auditable", p6d: "Every module is plain JavaScript on GitHub — read the code, fork it, or build your own ZIP.",
    footerA: "Reddit Power Toolkit v1.10.3 · MIT licensed",
    footerB: "Not affiliated with Reddit, Inc.", footerC: "100% local · Zero tracking · Open source", lang_label: "Language", theme_label: "Toggle theme",
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
    choose_browser: "Choose your browser", install_for: "Install for",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
    whats_new: "What's new", whats_new_sub: "Every release since v1.0 — newest first.", how_to_use: "How to use",
    install_download: "Download", install_open_ext: "Open extensions", install_dev_mode: "Developer mode", install_load_unpacked: "Load unpacked", install_open_reddit: "Open Reddit", install_load_temp: "Load temp add-on", install_zip: "Install ZIP",
    browser_notes: "Firefox works from v128+. The ZIP includes a Gecko-compatible manifest. Kiwi Browser is the Chromium browser on Android that supports extension loading, ideal for mobile users.", copy_label: "Copy",
  },
  es: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · Código abierto",
    hero1: "Potencia Reddit.", hero2: "100% local, sin rastreo.",
    heroP: "Una extensión potente que añade árbol de comentarios, plegado, modo conversación, resumen, limpiador, galería y más a cada página de Reddit. Nada sale de tu navegador.",
    dl: "Descargar extensión (.zip)", how: "Cómo instalar",
    worksIn: "Funciona en Chrome, Edge, Brave, Arc, Opera, Firefox 128+ y Kiwi Browser en Android.",
    featuresTitle: "50+ herramientas en una extensión", featuresSub: "Todo se ejecuta en tu navegador.",
    installTitle: "Instala en 30 segundos", installSub: "Elige tu navegador — las instrucciones se adaptan.",
    privacyTitle: "Privacidad primero",
    p1t: "Sin servidor", p1d: "No hay servidor. No hay cuenta. Nada que registrar.",
    p2t: "Sin rastreo", p2d: "Sin analíticas, scripts de terceros ni telemetría.",
    p3t: "Sin IA", p3d: "Todo el análisis se hace con JavaScript.",
    p4t: "Datos locales", p4d: "Filtros, etiquetas, historial en browser.storage.local.",
    p5t: "Permisos mínimos", p5d: "Solo Reddit y almacenamiento local. Sin acceso a historial, pestañas ni ubicación.",
    p6t: "Código abierto", p6d: "JavaScript sencillo en GitHub — léelo, bifúrcalo o compila tu propio ZIP.",
    footerA: "Reddit Power Toolkit v1.10.3 · Licencia MIT",
    footerB: "No afiliado con Reddit, Inc.", footerC: "100% local · Sin rastreo · Código abierto", lang_label: "Idioma", theme_label: "Cambiar tema",
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
    choose_browser: "Elige tu navegador", install_for: "Instalar para",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
    whats_new: "Novedades", whats_new_sub: "Todas las versiones desde v1.0 — primero la más reciente.", how_to_use: "Cómo usar",
    install_download: "Descargar", install_open_ext: "Abrir extensiones", install_dev_mode: "Modo desarrollador", install_load_unpacked: "Cargar descomprimida", install_open_reddit: "Abrir Reddit", install_load_temp: "Cargar complemento temporal", install_zip: "Instalar ZIP",
    browser_notes: "Firefox funciona desde v128+. El ZIP incluye un manifest compatible con Gecko. Kiwi Browser es el navegador Chromium en Android que admite extensiones.", copy_label: "Copiar",
  },
  fr: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · Open source",
    hero1: "Boostez Reddit.", hero2: "100% local, zéro traçage.",
    heroP: "Une extension puissante qui ajoute arbre de commentaires, repli, mode conversation, résumé, nettoyeur, galerie et plus à chaque page Reddit.",
    dl: "Télécharger (.zip)", how: "Installation",
    worksIn: "Fonctionne dans Chrome, Edge, Brave, Arc, Opera, Firefox 128+ et Kiwi Android.",
    featuresTitle: "50+ outils en une extension", featuresSub: "Tout tourne dans votre navigateur.",
    installTitle: "Installer en 30 secondes", installSub: "Choisissez votre navigateur.",
    privacyTitle: "Vie privée d'abord",
    p1t: "Aucun serveur", p1d: "Pas de serveur, pas de compte.",
    p2t: "Aucun traçage", p2d: "Aucune télémétrie ni script tiers.",
    p3t: "Aucune IA", p3d: "Tout est du JavaScript pur.",
    p4t: "Stockage local", p4d: "Tout dans browser.storage.local.",
    p5t: "Permissions minimales", p5d: "Uniquement Reddit et stockage local. Aucun accès à l'historique, aux onglets ou à la géolocalisation.",
    p6t: "Open source", p6d: "Du JavaScript lisible sur GitHub — lisez, forkez, compilez votre propre ZIP.",
    footerA: "Reddit Power Toolkit v1.10.3 · Licence MIT",
    footerB: "Sans affiliation avec Reddit, Inc.", footerC: "100% local · Zéro traçage · Open source", lang_label: "Langue", theme_label: "Changer le thème",
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
    choose_browser: "Choisissez votre navigateur", install_for: "Installer pour",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
    whats_new: "Nouveautés", whats_new_sub: "Toutes les versions depuis v1.0 — les plus récentes d’abord.", how_to_use: "Utilisation",
    install_download: "Télécharger", install_open_ext: "Ouvrir extensions", install_dev_mode: "Mode développeur", install_load_unpacked: "Charger non empaquetée", install_open_reddit: "Ouvrir Reddit", install_load_temp: "Charger module temporaire", install_zip: "Installer ZIP",
    browser_notes: "Firefox fonctionne dès v128+. Le ZIP inclut un manifest compatible Gecko. Kiwi Browser est le navigateur Chromium Android qui prend en charge les extensions.", copy_label: "Copier",
  },
  de: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · Open Source",
    hero1: "Reddit auf Steroiden.", hero2: "100% lokal, kein Tracking.",
    heroP: "Eine mächtige Browser-Erweiterung mit Kommentarbaum, Falten, Konversation, Cleaner, Galerie und mehr.",
    dl: "Erweiterung laden (.zip)", how: "Installation",
    worksIn: "Chrome, Edge, Brave, Arc, Opera, Firefox 128+ und Kiwi Android.",
    featuresTitle: "50+ Tools in einer Erweiterung", featuresSub: "Alles läuft in deinem Browser.",
    installTitle: "In 30 Sekunden installiert", installSub: "Wähle deinen Browser.",
    privacyTitle: "Datenschutz zuerst",
    p1t: "Kein Backend", p1d: "Kein Server, kein Konto.",
    p2t: "Kein Tracking", p2d: "Keine Telemetrie.",
    p3t: "Keine KI", p3d: "Reines JavaScript.",
    p4t: "Lokaler Speicher", p4d: "Alles in browser.storage.local.",
    p5t: "Minimale Berechtigungen", p5d: "Nur Reddit und lokaler Speicher. Kein Zugriff auf Verlauf, Tabs oder Standort.",
    p6t: "Open Source", p6d: "Reines JavaScript auf GitHub — lesen, forken, eigenes ZIP bauen.",
    footerA: "Reddit Power Toolkit v1.10.3 · MIT-Lizenz",
    footerB: "Nicht mit Reddit, Inc. verbunden.", footerC: "100% lokal · Kein Tracking · Open Source", lang_label: "Sprache", theme_label: "Theme wechseln",
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
    choose_browser: "Wähle deinen Browser", install_for: "Installieren für",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
    whats_new: "Neuigkeiten", whats_new_sub: "Alle Versionen seit v1.0 — neueste zuerst.", how_to_use: "So verwendest du es",
    install_download: "Herunterladen", install_open_ext: "Erweiterungen öffnen", install_dev_mode: "Entwicklermodus", install_load_unpacked: "Entpackt laden", install_open_reddit: "Reddit öffnen", install_load_temp: "Temporäres Add-on laden", install_zip: "ZIP installieren",
    browser_notes: "Firefox funktioniert ab v128+. Das ZIP enthält ein Gecko-kompatibles Manifest. Kiwi Browser ist der Chromium-Browser auf Android mit Erweiterungs-Unterstützung.", copy_label: "Kopieren",
  },
  pt: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · Código aberto",
    hero1: "Turbine o Reddit.", hero2: "100% local, sem rastreio.",
    heroP: "Uma extensão poderosa: árvore de comentários, recolher, conversa, resumo, limpador, galeria e mais.",
    dl: "Baixar extensão (.zip)", how: "Como instalar",
    worksIn: "Funciona em Chrome, Edge, Brave, Arc, Opera, Firefox 128+ e Kiwi Android.",
    featuresTitle: "50+ ferramentas em uma extensão", featuresSub: "Tudo roda no seu navegador.",
    installTitle: "Instale em 30 segundos", installSub: "Escolha seu navegador.",
    privacyTitle: "Privacidade primeiro",
    p1t: "Sem servidor", p1d: "Sem conta, sem cadastro.",
    p2t: "Sem rastreio", p2d: "Sem telemetria.",
    p3t: "Sem IA", p3d: "Só JavaScript.",
    p4t: "Só local", p4d: "Tudo em browser.storage.local.",
    p5t: "Permissões mínimas", p5d: "Só Reddit e armazenamento local. Sem histórico, abas ou localização.",
    p6t: "Código aberto", p6d: "JavaScript puro no GitHub — leia, faça fork, gere seu próprio ZIP.",
    footerA: "Reddit Power Toolkit v1.10.3 · Licença MIT",
    footerB: "Não afiliado à Reddit, Inc.", footerC: "100% local · Sem rastreio · Código aberto", lang_label: "Idioma", theme_label: "Alternar tema",
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
    choose_browser: "Escolha seu navegador", install_for: "Instalar para",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
    whats_new: "Novidades", whats_new_sub: "Todas as versões desde v1.0 — mais recentes primeiro.", how_to_use: "Como usar",
    install_download: "Baixar", install_open_ext: "Abrir extensões", install_dev_mode: "Modo desenvolvedor", install_load_unpacked: "Carregar sem compactação", install_open_reddit: "Abrir Reddit", install_load_temp: "Carregar add-on temporário", install_zip: "Instalar ZIP",
    browser_notes: "Firefox funciona a partir da v128+. O ZIP inclui manifest compatível com Gecko. Kiwi Browser é o Chromium no Android com suporte a extensões.", copy_label: "Copiar",
  },
  ja: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi Android · オープンソース",
    hero1: "Redditを強化。", hero2: "100%ローカル、追跡ゼロ。",
    heroP: "コメントツリー、折りたたみ、会話モード、要約、クリーナー、ギャラリーなどを追加する強力な拡張機能。",
    dl: "拡張機能をダウンロード (.zip)", how: "インストール方法",
    worksIn: "Chrome, Edge, Brave, Arc, Opera, Firefox 128+, Kiwi Android で動作。",
    featuresTitle: "1つの拡張に50+のツール", featuresSub: "すべてブラウザ内で動作。",
    installTitle: "30秒でインストール", installSub: "ブラウザを選んでください。",
    privacyTitle: "プライバシー優先",
    p1t: "サーバー無し", p1d: "アカウント不要。",
    p2t: "追跡無し", p2d: "テレメトリー無し。",
    p3t: "AI 呼び出し無し", p3d: "純粋な JavaScript。",
    p4t: "ローカル保存", p4d: "browser.storage.local に保存。",
    p5t: "最小限の権限", p5d: "Reddit とローカルストレージのみ。履歴・タブ・位置情報にはアクセスしません。",
    p6t: "オープンソース", p6d: "GitHub 上の素の JavaScript — 読んで、フォークして、自分の ZIP を作れます。",
    footerA: "Reddit Power Toolkit v1.10.3 · MIT",
    footerB: "Reddit, Inc. とは無関係。", footerC: "100%ローカル · 追跡ゼロ · オープンソース", lang_label: "言語", theme_label: "テーマ切替",
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
    choose_browser: "ブラウザを選択", install_for: "インストール先",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
    whats_new: "更新情報", whats_new_sub: "v1.0 以降の全リリース — 新しい順。", how_to_use: "使い方",
    install_download: "ダウンロード", install_open_ext: "拡張機能を開く", install_dev_mode: "開発者モード", install_load_unpacked: "展開済みを読み込む", install_open_reddit: "Reddit を開く", install_load_temp: "一時アドオンを読み込む", install_zip: "ZIP をインストール",
    browser_notes: "Firefox は v128+ で動作します。ZIP には Gecko 対応 manifest が含まれます。Kiwi Browser は Android で拡張機能を読み込める Chromium ブラウザです。", copy_label: "コピー",
  },
  zh: {
    badge: "Chrome · Firefox · Edge · Brave · Kiwi 安卓 · 开源",
    hero1: "增强 Reddit。", hero2: "100% 本地，零追踪。",
    heroP: "为每个 Reddit 页面添加评论树、折叠、对话模式、智能摘要、清理器、画廊等 50+ 个工具。",
    dl: "下载扩展 (.zip)", how: "安装方法",
    worksIn: "支持 Chrome, Edge, Brave, Arc, Opera, Firefox 128+ 及 Kiwi Browser (Android)。",
    featuresTitle: "一个扩展 50+ 个工具", featuresSub: "全部在浏览器内运行。",
    installTitle: "30 秒安装完成", installSub: "选择你的浏览器。",
    privacyTitle: "隐私至上",
    p1t: "无后端", p1d: "无账号。",
    p2t: "无追踪", p2d: "无遥测。",
    p3t: "无 AI", p3d: "纯 JavaScript。",
    p4t: "仅本地", p4d: "全部保存在 browser.storage.local。",
    p5t: "最小权限", p5d: "仅访问 Reddit 与本地存储。不读取历史、标签页或定位。",
    p6t: "开源可审计", p6d: "GitHub 上纯 JavaScript — 阅读、Fork、自行打包 ZIP。",
    footerA: "Reddit Power Toolkit v1.10.3 · MIT 许可",
    footerB: "与 Reddit, Inc. 无关联。", footerC: "100% 本地 · 零追踪 · 开源", lang_label: "语言", theme_label: "切换主题",
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
    choose_browser: "选择你的浏览器", install_for: "安装到",
    tab_chrome: "Chrome / Edge / Brave", tab_ff: "Firefox", tab_kiwi: "Kiwi (Android)",
    whats_new: "更新内容", whats_new_sub: "自 v1.0 起的所有版本 — 最新在前。", how_to_use: "如何使用",
    install_download: "下载", install_open_ext: "打开扩展", install_dev_mode: "开发者模式", install_load_unpacked: "加载已解压", install_open_reddit: "打开 Reddit", install_load_temp: "加载临时附加组件", install_zip: "安装 ZIP",
    browser_notes: "Firefox 支持 v128+。ZIP 包含兼容 Gecko 的 manifest。Kiwi Browser 是 Android 上支持加载扩展的 Chromium 浏览器。", copy_label: "复制",
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


const SITE_PHRASES: Record<Exclude<Lang, "en">, Record<string, string>> = {
  es: {
    "Full translation coverage & flat colors": "Cobertura completa de traducción y colores planos",
    "Removed every remaining gradient inside the extension — flat Reddit-orange tokens throughout the ⚡ Power features hub, primary CTAs and progress bars": "Eliminados todos los degradados restantes de la extensión — tokens planos naranja Reddit en el hub ⚡, CTAs y barras de progreso",
    "Popup, options and content-script UI now translated end-to-end in all 7 languages (EN, ES, FR, DE, PT, JA, ZH) — no more English leaking into non-English locales": "Popup, opciones y UI inyectada traducidos por completo en 7 idiomas — sin texto inglés en otros idiomas",
    "Version tagline synced across manifest, popup, options, About modal, README and site footer (v1.9.5)": "Versión sincronizada en manifest, popup, opciones, Acerca de, README y footer (v1.9.5)",
    "French translation repair & activation clarity": "Corrección de francés y claridad de activación",
    "French website cards now stay French — no Spanish fallback leakage in titles, descriptions or how-to text": "Las tarjetas francesas del sitio permanecen en francés — sin filtración de español en títulos, descripciones o instrucciones",
    "Extension side-panel buttons now center text consistently and show clear active/off states for running features": "Los botones del panel centran el texto y muestran estados activo/inactivo claros",
    "Manifest, popup, Options, README, site footer and About modal synced to v1.10.3": "Manifest, popup, opciones, README, footer y modal Acerca de sincronizados a v1.10.3",
    "Remaining onboarding overlay gradients removed; extension accents use the flat Reddit-orange / green palette": "Eliminados los degradados restantes; acentos planos naranja Reddit / verde",
    "Added missing i18n keys: power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog": "Añadidas claves i18n faltantes: power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog",
    "Shareable deep links, match cycling & reduced-motion focus": "Enlaces profundos, navegación de coincidencias y movimiento reducido",
    "Shareable comment links — hover any row in the Tree, click 🔗 to copy a URL that reopens the panel and flash-highlights the exact comment": "Enlaces compartibles a comentarios — pasa el cursor por una fila del árbol y pulsa 🔗 para copiar una URL que abre el panel y resalta el comentario exacto",
    "Also supports #rpt-author=<username> for jumping to a user's first comment in the thread": "También admite #rpt-author=<usuario> para saltar al primer comentario de ese autor",
    "New ◀ / ▶ match-cycling buttons walk through search & author filter results without expanding every node": "Nuevos botones ◀ / ▶ recorren resultados de búsqueda y autor sin expandir todo",
    "Reduced-motion mode swaps the pulse animation for a static outline so navigation still works with animation off": "El modo de movimiento reducido cambia el pulso por un contorno estático",
    "Website: separate install buttons per browser (Chrome, Firefox, Kiwi) instead of one generic download": "Sitio: botones de instalación separados por navegador en vez de una descarga genérica",
    "Extension UI hardening for Chrome, Firefox & Kiwi": "UI reforzada para Chrome, Firefox y Kiwi",
    "Rewrote every RPT surface with !important resets so Reddit's global button styles can't hide labels": "Reescritas todas las superficies RPT con resets !important para que Reddit no oculte etiquetas",
    "Panel widened to 440 px, tab bar padded, filter chips readable, buttons min 40 px tall": "Panel de 440 px, pestañas con espacio, filtros legibles y botones mínimos de 40 px",
    "Firefox-specific line-height normaliser + Kiwi/mobile 44 px tap targets": "Normalizador de altura para Firefox + objetivos táctiles de 44 px en Kiwi/móvil",
    "⚡ Power features hub retinted to design tokens; primary v2 CTA is a single Reddit-green button": "Hub ⚡ retintado con tokens; CTA principal v2 como botón verde Reddit",
    "Mobile Tree Navigator, live preview & site polish": "Navegador móvil de árbol, vista previa y pulido del sitio",
    "Comment Tree Navigator now has quick text search + author filter with a live count": "El árbol de comentarios tiene búsqueda rápida + filtro de autor con contador en vivo",
    "Hover any tree row for a preview bubble; click to deep-expand ancestors and flash-jump": "Pasa el cursor para vista previa; haz clic para expandir ancestros y saltar con resaltado",
    "Mobile: quickbar wraps, panels go full-width, ⚡ hub switches to single-column": "Móvil: barra rápida flexible, paneles al ancho completo y hub ⚡ en una columna",
    "Docs: reproducible perf-test harness (docs/PERF_TEST.md) across Chrome/Firefox/Kiwi": "Docs: prueba de rendimiento reproducible para Chrome/Firefox/Kiwi",
    "Website: swapped emerald green for the Reddit palette + added GitHub & Telegram links": "Sitio: verde esmeralda cambiado por paleta Reddit + enlaces GitHub y Telegram",
    "System panel, per-subreddit rules & backups": "Panel de sistema, reglas por subreddit y copias",
    "New Performance & status panel — see which modules run and how long each scan takes": "Nuevo panel de rendimiento y estado — ve módulos activos y duración de escaneo",
    "Per-subreddit rules — enable/disable any feature just inside a specific community": "Reglas por subreddit — activa o desactiva funciones solo en una comunidad",
    "One-click JSON backup & restore for bookmarks, history, keyword tracking, notes and settings": "Copia/restauración JSON de marcadores, historial, palabras clave, notas y ajustes",
    "Lazy-loading wrapper — advanced modules only touch the DOM the first time you use them": "Carga diferida — módulos avanzados solo tocan el DOM al usarlos",
    "Feature cards on this page collapse by default — click a title to expand": "Las tarjetas se pliegan por defecto — haz clic para expandir",
    "Live-updating help & safer backups": "Ayuda dinámica y copias más seguras",
    "Modal keyboard-help text updates instantly when you rebind a shortcut": "La ayuda de teclado cambia al reasignar atajos",
    "Options export/import now covers shortcuts, general prefs, accessibility and gallery positions": "Exportar/importar cubre atajos, preferencias, accesibilidad y galería",
    "Duplicate keybindings show a conflict banner with one-click resolve": "Atajos duplicados muestran aviso de conflicto con solución en un clic",
    "Import validates every field and shows a clear message on invalid JSON": "La importación valida campos y muestra errores claros",
    "New Reset-to-defaults confirmation for shortcut bindings": "Nueva confirmación para restablecer atajos",
    "Keyboard help wired to aria-describedby": "Ayuda de teclado conectada a aria-describedby",
    "Every modal shows explicit Esc / Tab hints for screen readers": "Cada modal muestra pistas Esc/Tab para lectores de pantalla",
    "Export & import for your custom shortcut preferences (JSON)": "Exportar e importar preferencias de atajos (JSON)",
    "Landing page: full description + How-to-use for every feature": "Página: descripción completa + uso de cada función",
    "Focus trap, custom shortcuts & live regions": "Trampa de foco, atajos personalizados y regiones live",
    "Command palette, gallery and all modals trap Tab and restore focus on close": "Paleta, galería y modales atrapan Tab y restauran foco al cerrar",
    "Configurable keys for gallery prev/next, collapse-all and refresh": "Teclas configurables para galería, plegar todo y actualizar",
    "Gallery resumes on the last-viewed image per thread": "La galería recuerda la última imagen por hilo",
    "Parsing status announced via a dedicated aria-live region": "Estado de análisis anunciado por región aria-live",
    "Live status & true resync": "Estado en vivo y resincronización real",
    "Full keyboard support and ARIA labels for the gallery": "Soporte completo de teclado y ARIA en galería",
    "Collapse-all persists across SPA navigation": "Plegar todo persiste con navegación SPA",
    "Options toggle + preview swatches for author colours": "Opción y vista previa para colores de autores",
    "Pulsing status pill shows parsing progress; new Resync button in the panel": "Píldora de estado muestra progreso; nuevo botón Resync",
    "Accessibility, palette & rule builder": "Accesibilidad, paleta y constructor de reglas",
    "Color-blind palettes (Deuteranopia, Protanopia, Tritanopia, Mono) + high-contrast mode": "Paletas daltónicas y alto contraste",
    "Ctrl+K command palette to trigger any tool": "Paleta Ctrl+K para ejecutar herramientas",
    "Adaptive polling for Live-New with visible status": "Sondeo adaptativo de Live-New con estado visible",
    "Custom keyword / author / regex rule builder with live preview": "Reglas de palabra/autor/regex con vista previa",
    "JSON / CSV export & import for saved collections": "Exportar/importar JSON/CSV de colecciones guardadas",
    "Redesigned 3-step installation guide": "Guía de instalación rediseñada en 3 pasos",
    "Onboarding, i18n & themes": "Onboarding, i18n y temas",
    "Popup activation status + one-click tab reload prompt": "Estado de activación y recarga de pestaña con un clic",
    "Full-page onboarding spotlight on first Reddit visit": "Guía destacada en primera visita a Reddit",
    "7 languages (EN, ES, FR, DE, PT, JA, ZH)": "7 idiomas (EN, ES, FR, DE, PT, JA, ZH)",
    "Light & Dark mode across extension and site": "Modo claro y oscuro en extensión y sitio",
    "Quick-bar mounts immediately, no first-click required": "Barra rápida aparece al instante",
    "Firefox compatibility via browser_specific_settings": "Compatibilidad Firefox mediante browser_specific_settings",
    "Midnight redesign & power tools": "Rediseño oscuro y herramientas potentes",
    "Dark glassy UI with green/blue accents": "UI oscura con acentos verde/azul",
    "Smart Summary (top, discussed, controversial) — 100% local": "Resumen inteligente local (top, discutido, polémico)",
    "Live-New polling of Reddit's own thread JSON": "Live-New sondea el JSON del hilo de Reddit",
    "OP / Mod / Awarded filter chips + Saved collections with ★": "Filtros OP/Mod/Premiado + colecciones ★",
    "Keyboard shortcuts (T, J/K, F, N, ?)": "Atajos de teclado (T, J/K, F, N, ?)",
    "First public release": "Primer lanzamiento público",
    "Manifest V3 extension for Chrome, Edge, Brave and Firefox": "Extensión Manifest V3 para Chrome, Edge, Brave y Firefox",
    "50+ client-side tools: tree, folding, cleaner, gallery, analytics…": "50+ herramientas locales: árbol, plegado, limpiador, galería, analítica…",
    "Local history, user color tags, keyword highlighter, thread exporter": "Historial local, colores de usuarios, resaltado y exportador",
    "Zero backend, zero tracking, fully open-source": "Cero backend, cero rastreo, totalmente open-source",
    "New": "Nuevo", "Recent": "Reciente", "Today": "Hoy", "Launch": "Lanzamiento",
    "Comment Tree Navigator": "Navegador de árbol de comentarios", "A collapsible sidebar showing every comment as a tree, one dot per author.": "Barra lateral plegable que muestra cada comentario como árbol, con un punto por autor.", "Open the RPT panel (button bottom-right, or press T). Click any node to jump straight to that comment — the page smooth-scrolls and briefly flashes the match.": "Abre el panel RPT (botón abajo derecha o tecla T). Haz clic en un nodo para saltar al comentario y resaltarlo.",
    "Comment Folding": "Plegado de comentarios", "Persistent collapse/expand for every branch of a thread.": "Plegar/expandir persistente para cada rama.", "Use the ▾ / ▴ chip on any comment, or press F to fold the one under your cursor. Shift+C collapses everything. Your folded state is remembered per URL and survives page reloads.": "Usa ▾ / ▴ en un comentario o F bajo el cursor. Shift+C pliega todo y se recuerda por URL.",
    "Conversation Mode": "Modo conversación", "Reformats the thread as a chat-style back-and-forth for easier reading.": "Convierte el hilo en lectura tipo chat.", "Open the panel and click Conversation (or press C). A full-screen overlay shows nested bubbles per author. Esc closes and restores your scroll position.": "Abre el panel y pulsa Conversación (o C). Esc cierra y restaura posición.",
    "Depth Layers": "Capas de profundidad", "Coloured left-border stripes indicate nesting depth at a glance.": "Franjas de color muestran la profundidad.", "Automatic on every thread — no click needed. Toggle it off in Options → Automation if you prefer Reddit's default look.": "Automático en cada hilo; puedes apagarlo en Opciones → Automatización.",
    "Smart Summary": "Resumen inteligente", "Top voted, most discussed, long-substantive and controversial — computed locally from the parsed tree.": "Top votados, más debatidos, largos y polémicos — calculado localmente.", "Press S or click Smart summary in the panel. Click any item in the modal to jump to that exact comment. Zero network calls.": "Pulsa S o Resumen; clic en un elemento salta al comentario. Sin llamadas externas.",
    "Thread Cleaner": "Limpiador de hilo", "Hide deleted, empty, bot, short or low-score comments to focus on signal.": "Oculta borrados, vacíos, bots, cortos o baja puntuación.", "Open Options → Thread Cleaner and enable the filters you want (minimum length, minimum score, etc.). They apply live on every Reddit thread you open.": "Opciones → Limpiador: activa filtros; se aplican en vivo.",
    "Thread Health": "Salud del hilo", "Local score for toxicity, quality and engagement based on comment length, replies and vote spread.": "Puntuación local de calidad y participación.", "See the Health card in the side panel. Numbers refresh whenever you press the Resync button in the panel header.": "Mira la tarjeta Salud; Resync actualiza valores.",
    "Keyword Highlighter": "Resaltador de palabras", "Your custom keywords are highlighted everywhere on Reddit.": "Tus palabras clave se resaltan en Reddit.", "Options → Highlighted keywords: type a comma-separated list (e.g. docker, rust). Matches are outlined in yellow. Combine with Custom rules for regex or author filters.": "Opciones → palabras resaltadas; escribe lista separada por comas.",
    "Private User Tags": "Etiquetas privadas de usuario", "Attach your own label and colour to any Reddit username.": "Añade etiqueta y color privado a usuarios.", "Options → User tags: enter the username, a label ('helpful', 'blocked'), pick a colour, save. The badge appears next to that user everywhere in Reddit.": "Opciones → etiquetas: usuario, etiqueta, color y guardar.",
    "Formatting Toolbar": "Barra de formato", "Bold, italic, code, quote, spoiler and link — one click above every Reddit textarea.": "Negrita, cursiva, código, cita, spoiler y enlace.", "Just focus any comment or post editor: the RPT toolbar appears above it. Click a button to wrap the selected text with the correct Markdown.": "Enfoca un editor; aparece la barra y envuelve el texto en Markdown.",
    "Thread Exporter": "Exportador de hilos", "Save any thread as Markdown, HTML or JSON for offline reading or citations.": "Guarda hilos como Markdown, HTML o JSON.", "Panel → Export, then choose the format. The file downloads locally — nothing leaves your browser.": "Panel → Exportar; descarga local.",
    "Image Gallery Mode": "Modo galería", "Full-screen viewer for image posts with prev/next and keyboard support.": "Visor a pantalla completa con anterior/siguiente y teclado.", "Press G or click Gallery in the panel. Use ← / → to browse, Home/End for first/last, Esc to close. The gallery resumes at the last image you viewed per thread.": "Pulsa G; usa ←/→, Home/End y Esc. Recuerda la imagen por hilo.",
    "Thread Age Warning": "Aviso de hilo antiguo", "Friendly banner when the thread you just opened is over a year old.": "Aviso si el hilo tiene más de un año.", "No setup — appears automatically. Disable it in Options → Automation if you don't want the reminder.": "Sin configuración; desactívalo en Opciones → Automatización.",
    "Link Previews": "Vista previa de enlaces", "Hover any link inside a comment to preview its domain, path and detected type (image, video, article).": "Pasa el cursor por enlaces para ver dominio, ruta y tipo.", "Just hover — a small tooltip appears near the cursor. Nothing is fetched from the linked site; the preview is derived from the URL itself.": "Solo hover; no se descarga nada del sitio enlazado.",
    "Personal Analytics": "Analítica personal", "Local dashboard: threads read, subs visited, reading time, favourite authors.": "Panel local: hilos, subs, tiempo y autores favoritos.", "Click the extension icon in the toolbar → Open analytics. Everything is computed from the local history — no server tracking.": "Icono de extensión → Analítica; todo desde historial local.",
    "Local Thread History": "Historial local de hilos", "Every Reddit thread you've opened with title, subreddit, date and comment count.": "Hilos abiertos con título, subreddit, fecha y conteo.", "Open the popup and click History, or view it inside Analytics. Clear it any time from Options → Local data.": "Popup → Historial o Analítica. Limpia en Opciones → Datos locales.",
    "Performance & status panel": "Panel de rendimiento y estado", "See which modules are running on the current page and how long each scan took.": "Ve módulos activos y duración de escaneo.", "Open the ⚡ Power features hub → System → Performance & status, or Ctrl+K → \"Performance & status\". Great for spotting lag on big threads.": "Abre hub ⚡ → Sistema → Rendimiento, o Ctrl+K.",
    "Per-subreddit rules": "Reglas por subreddit", "Enable or disable any feature just inside a specific community.": "Activa o desactiva funciones por comunidad.", "Visit a community, then ⚡ hub → System → Per-subreddit rules. Uncheck features to turn them off only there — global settings stay untouched.": "Visita una comunidad y usa hub ⚡ → reglas por subreddit.",
    "Backup & restore": "Copia y restauración", "One-click JSON snapshot of bookmarks, history, keyword tracking, notes and settings.": "Copia JSON de marcadores, historial, palabras, notas y ajustes.", "⚡ hub → System → Backup & restore → Export. Import the same file on another browser to move your data across devices.": "Hub ⚡ → Sistema → Copia → Exportar/Importar.",
    "Lazy-loaded modules": "Módulos diferidos", "Every advanced tool only touches the DOM the first time you use it, keeping large threads fast.": "Las herramientas avanzadas se activan solo al usarlas.", "Automatic — nothing to configure. The Performance panel shows the exact first-run cost of each module.": "Automático; el panel de rendimiento muestra el coste inicial."
  },
  fr: {}, de: {}, pt: {}, ja: {}, zh: {},
};
["fr", "de", "pt", "ja", "zh"].forEach((lang) => {
  SITE_PHRASES[lang as Exclude<Lang, "en">] = {};
});

/* Do not fall back between non-English locales: Spanish strings were leaking
   into French feature cards. Missing keys now fall back only to English. */
Object.assign(SITE_PHRASES.fr, {"French translation repair & activation clarity": "Correction du français et activation plus claire", "French website cards now stay French — no Spanish fallback leakage in titles, descriptions or how-to text": "Les cartes du site restent en français — plus aucune fuite espagnole dans les titres, descriptions ou modes d’emploi", "Extension side-panel buttons now center text consistently and show clear active/off states for running features": "Les boutons du panneau centrent le texte et affichent clairement l’état actif/inactif des fonctions", "Manifest, popup, Options, README, site footer and About modal synced to v1.10.3": "Manifest, popup, Options, README, pied de page et fenêtre À propos synchronisés en v1.10.3", "Remaining onboarding overlay gradients removed; extension accents use the flat Reddit-orange / green palette": "Les derniers dégradés de l’onboarding sont supprimés; l’extension utilise une palette plate orange Reddit / verte"});
Object.assign(SITE_PHRASES.de, {"Full translation coverage & flat colors": "Vollständige Übersetzung und flache Farben", "Removed every remaining gradient inside the extension — flat Reddit-orange tokens throughout the ⚡ Power features hub, primary CTAs and progress bars": "Suppression de tous les dégradés restants — jetons orange Reddit dans le hub ⚡, les CTA et les barres de progression", "Popup, options and content-script UI now translated end-to-end in all 7 languages (EN, ES, FR, DE, PT, JA, ZH) — no more English leaking into non-English locales": "Popup, options et interface injectée traduits de bout en bout en 7 langues — plus d’anglais dans les autres langues", "Version tagline synced across manifest, popup, options, About modal, README and site footer (v1.9.5)": "Version synchronisée dans le manifest, popup, options, À propos, README et pied de page (v1.9.5)", "Added missing i18n keys: power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog": "Clés i18n manquantes ajoutées : power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog", "Shareable deep links, match cycling & reduced-motion focus": "Liens profonds, navigation des résultats et mouvement réduit", "Shareable comment links — hover any row in the Tree, click 🔗 to copy a URL that reopens the panel and flash-highlights the exact comment": "Liens partageables de commentaire — survolez une ligne de l’arbre et cliquez 🔗 pour copier une URL qui rouvre le panneau et surligne le commentaire", "Also supports #rpt-author=<username> for jumping to a user's first comment in the thread": "Prend aussi en charge #rpt-author=<nom> pour aller au premier commentaire d’un auteur", "New ◀ / ▶ match-cycling buttons walk through search & author filter results without expanding every node": "Nouveaux boutons ◀ / ▶ pour parcourir les résultats sans tout déplier", "Reduced-motion mode swaps the pulse animation for a static outline so navigation still works with animation off": "Le mode mouvement réduit remplace l’animation par un contour statique", "Website: separate install buttons per browser (Chrome, Firefox, Kiwi) instead of one generic download": "Site : boutons d’installation séparés par navigateur au lieu d’un téléchargement générique", "Extension UI hardening for Chrome, Firefox & Kiwi": "Interface renforcée pour Chrome, Firefox et Kiwi", "Rewrote every RPT surface with !important resets so Reddit's global button styles can't hide labels": "Toutes les surfaces RPT ont été réécrites avec des resets !important pour éviter que Reddit masque les libellés", "Panel widened to 440 px, tab bar padded, filter chips readable, buttons min 40 px tall": "Panneau élargi à 440 px, onglets espacés, filtres lisibles, boutons de 40 px minimum", "Firefox-specific line-height normaliser + Kiwi/mobile 44 px tap targets": "Normalisation Firefox + zones tactiles 44 px sur Kiwi/mobile", "⚡ Power features hub retinted to design tokens; primary v2 CTA is a single Reddit-green button": "Hub ⚡ recoloré avec les jetons; CTA principal v2 en bouton vert Reddit", "Mobile Tree Navigator, live preview & site polish": "Arbre mobile, aperçu en direct et finition du site", "Comment Tree Navigator now has quick text search + author filter with a live count": "L’arbre de commentaires a une recherche rapide + filtre auteur avec compteur", "Hover any tree row for a preview bubble; click to deep-expand ancestors and flash-jump": "Survolez une ligne pour l’aperçu; cliquez pour déplier les parents et sauter avec surlignage", "Mobile: quickbar wraps, panels go full-width, ⚡ hub switches to single-column": "Mobile : barre rapide flexible, panneaux plein écran, hub ⚡ en une colonne", "Docs: reproducible perf-test harness (docs/PERF_TEST.md) across Chrome/Firefox/Kiwi": "Docs : test de performance reproductible pour Chrome/Firefox/Kiwi", "Website: swapped emerald green for the Reddit palette + added GitHub & Telegram links": "Site : vert émeraude remplacé par la palette Reddit + liens GitHub et Telegram", "System panel, per-subreddit rules & backups": "Panneau système, règles par subreddit et sauvegardes", "New Performance & status panel — see which modules run and how long each scan takes": "Nouveau panneau performance et statut — voyez les modules actifs et leur durée", "Per-subreddit rules — enable/disable any feature just inside a specific community": "Règles par subreddit — activez/désactivez une fonction dans une communauté", "One-click JSON backup & restore for bookmarks, history, keyword tracking, notes and settings": "Sauvegarde/restauration JSON en un clic des favoris, historique, mots-clés, notes et réglages", "Lazy-loading wrapper — advanced modules only touch the DOM the first time you use them": "Chargement différé — les modules avancés touchent le DOM seulement au premier usage", "Feature cards on this page collapse by default — click a title to expand": "Les cartes se replient par défaut — cliquez le titre pour ouvrir", "Live-updating help & safer backups": "Aide dynamique et sauvegardes plus sûres", "Modal keyboard-help text updates instantly when you rebind a shortcut": "L’aide clavier des modales change dès qu’un raccourci est modifié", "Options export/import now covers shortcuts, general prefs, accessibility and gallery positions": "Export/import couvre raccourcis, préférences, accessibilité et positions galerie", "Duplicate keybindings show a conflict banner with one-click resolve": "Les raccourcis dupliqués affichent une alerte avec résolution en un clic", "Import validates every field and shows a clear message on invalid JSON": "L’import valide chaque champ et affiche une erreur claire", "New Reset-to-defaults confirmation for shortcut bindings": "Nouvelle confirmation pour réinitialiser les raccourcis", "Keyboard help wired to aria-describedby": "Aide clavier reliée à aria-describedby", "Every modal shows explicit Esc / Tab hints for screen readers": "Chaque modale affiche des indications Esc/Tab pour lecteurs d’écran", "Export & import for your custom shortcut preferences (JSON)": "Export/import des préférences de raccourcis (JSON)", "Landing page: full description + How-to-use for every feature": "Page : description complète + utilisation de chaque fonction", "Focus trap, custom shortcuts & live regions": "Piège de focus, raccourcis personnalisés et régions live", "Command palette, gallery and all modals trap Tab and restore focus on close": "Palette, galerie et modales piègent Tab et restaurent le focus", "Configurable keys for gallery prev/next, collapse-all and refresh": "Touches configurables pour galerie, tout replier et actualiser", "Gallery resumes on the last-viewed image per thread": "La galerie reprend la dernière image par fil", "Parsing status announced via a dedicated aria-live region": "Statut d’analyse annoncé via aria-live", "Live status & true resync": "Statut live et vraie resynchronisation", "Full keyboard support and ARIA labels for the gallery": "Clavier complet et libellés ARIA pour la galerie", "Collapse-all persists across SPA navigation": "Tout replier persiste après navigation SPA", "Options toggle + preview swatches for author colours": "Option + aperçu des couleurs d’auteurs", "Pulsing status pill shows parsing progress; new Resync button in the panel": "Pastille animée de progression; nouveau bouton Resync", "Accessibility, palette & rule builder": "Accessibilité, palette et constructeur de règles", "Color-blind palettes (Deuteranopia, Protanopia, Tritanopia, Mono) + high-contrast mode": "Palettes daltoniennes + mode fort contraste", "Ctrl+K command palette to trigger any tool": "Palette Ctrl+K pour lancer un outil", "Adaptive polling for Live-New with visible status": "Polling adaptatif Live-New avec statut visible", "Custom keyword / author / regex rule builder with live preview": "Règles mot-clé/auteur/regex avec aperçu", "JSON / CSV export & import for saved collections": "Export/import JSON/CSV des collections", "Redesigned 3-step installation guide": "Guide d’installation repensé en 3 étapes", "Onboarding, i18n & themes": "Onboarding, i18n et thèmes", "Popup activation status + one-click tab reload prompt": "Statut d’activation et rechargement d’onglet en un clic", "Full-page onboarding spotlight on first Reddit visit": "Onboarding plein écran à la première visite Reddit", "7 languages (EN, ES, FR, DE, PT, JA, ZH)": "7 langues (EN, ES, FR, DE, PT, JA, ZH)", "Light & Dark mode across extension and site": "Modes clair et sombre dans l’extension et le site", "Quick-bar mounts immediately, no first-click required": "Barre rapide affichée immédiatement", "Firefox compatibility via browser_specific_settings": "Compatibilité Firefox via browser_specific_settings", "Midnight redesign & power tools": "Refonte sombre et outils puissants", "Dark glassy UI with green/blue accents": "Interface sombre avec accents vert/bleu", "Smart Summary (top, discussed, controversial) — 100% local": "Résumé intelligent local", "Live-New polling of Reddit's own thread JSON": "Live-New lit le JSON du fil Reddit", "OP / Mod / Awarded filter chips + Saved collections with ★": "Filtres OP/Mod/Récompensé + collections ★", "Keyboard shortcuts (T, J/K, F, N, ?)": "Raccourcis clavier (T, J/K, F, N, ?)", "First public release": "Première version publique", "Manifest V3 extension for Chrome, Edge, Brave and Firefox": "Extension Manifest V3 pour Chrome, Edge, Brave et Firefox", "50+ client-side tools: tree, folding, cleaner, gallery, analytics…": "50+ outils locaux : arbre, pliage, nettoyage, galerie, analytique…", "Local history, user color tags, keyword highlighter, thread exporter": "Historique local, tags couleur, surligneur, exportateur", "Zero backend, zero tracking, fully open-source": "Zéro backend, zéro suivi, entièrement open-source", "New": "Neu", "Recent": "Aktuell", "Today": "Heute", "Launch": "Start", "Comment Tree Navigator": "Kommentarbaum-Navigator", "Comment Folding": "Kommentare einklappen", "Conversation Mode": "Konversationsmodus", "Depth Layers": "Tiefenebenen", "Smart Summary": "Intelligente Zusammenfassung", "Thread Cleaner": "Thread-Reiniger", "Thread Health": "Thread-Gesundheit", "Keyword Highlighter": "Schlüsselwort-Markierer", "Private User Tags": "Private Nutzer-Tags", "Formatting Toolbar": "Formatierungsleiste", "Thread Exporter": "Thread-Export", "Image Gallery Mode": "Bildergalerie", "Thread Age Warning": "Warnung für alte Threads", "Link Previews": "Link-Vorschauen", "Personal Analytics": "Persönliche Analysen", "Local Thread History": "Lokaler Thread-Verlauf", "Performance & status panel": "Performance- und Statuspanel", "Per-subreddit rules": "Regeln pro Subreddit", "Backup & restore": "Backup und Wiederherstellung", "Lazy-loaded modules": "Lazy-geladene Module"});
Object.assign(SITE_PHRASES.pt, {"Full translation coverage & flat colors": "Tradução completa e cores planas", "Removed every remaining gradient inside the extension — flat Reddit-orange tokens throughout the ⚡ Power features hub, primary CTAs and progress bars": "Suppression de tous les dégradés restants — jetons orange Reddit dans le hub ⚡, les CTA et les barres de progression", "Popup, options and content-script UI now translated end-to-end in all 7 languages (EN, ES, FR, DE, PT, JA, ZH) — no more English leaking into non-English locales": "Popup, options et interface injectée traduits de bout en bout en 7 langues — plus d’anglais dans les autres langues", "Version tagline synced across manifest, popup, options, About modal, README and site footer (v1.9.5)": "Version synchronisée dans le manifest, popup, options, À propos, README et pied de page (v1.9.5)", "Added missing i18n keys: power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog": "Clés i18n manquantes ajoutées : power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog", "Shareable deep links, match cycling & reduced-motion focus": "Liens profonds, navigation des résultats et mouvement réduit", "Shareable comment links — hover any row in the Tree, click 🔗 to copy a URL that reopens the panel and flash-highlights the exact comment": "Liens partageables de commentaire — survolez une ligne de l’arbre et cliquez 🔗 pour copier une URL qui rouvre le panneau et surligne le commentaire", "Also supports #rpt-author=<username> for jumping to a user's first comment in the thread": "Prend aussi en charge #rpt-author=<nom> pour aller au premier commentaire d’un auteur", "New ◀ / ▶ match-cycling buttons walk through search & author filter results without expanding every node": "Nouveaux boutons ◀ / ▶ pour parcourir les résultats sans tout déplier", "Reduced-motion mode swaps the pulse animation for a static outline so navigation still works with animation off": "Le mode mouvement réduit remplace l’animation par un contour statique", "Website: separate install buttons per browser (Chrome, Firefox, Kiwi) instead of one generic download": "Site : boutons d’installation séparés par navigateur au lieu d’un téléchargement générique", "Extension UI hardening for Chrome, Firefox & Kiwi": "Interface renforcée pour Chrome, Firefox et Kiwi", "Rewrote every RPT surface with !important resets so Reddit's global button styles can't hide labels": "Toutes les surfaces RPT ont été réécrites avec des resets !important pour éviter que Reddit masque les libellés", "Panel widened to 440 px, tab bar padded, filter chips readable, buttons min 40 px tall": "Panneau élargi à 440 px, onglets espacés, filtres lisibles, boutons de 40 px minimum", "Firefox-specific line-height normaliser + Kiwi/mobile 44 px tap targets": "Normalisation Firefox + zones tactiles 44 px sur Kiwi/mobile", "⚡ Power features hub retinted to design tokens; primary v2 CTA is a single Reddit-green button": "Hub ⚡ recoloré avec les jetons; CTA principal v2 en bouton vert Reddit", "Mobile Tree Navigator, live preview & site polish": "Arbre mobile, aperçu en direct et finition du site", "Comment Tree Navigator now has quick text search + author filter with a live count": "L’arbre de commentaires a une recherche rapide + filtre auteur avec compteur", "Hover any tree row for a preview bubble; click to deep-expand ancestors and flash-jump": "Survolez une ligne pour l’aperçu; cliquez pour déplier les parents et sauter avec surlignage", "Mobile: quickbar wraps, panels go full-width, ⚡ hub switches to single-column": "Mobile : barre rapide flexible, panneaux plein écran, hub ⚡ en une colonne", "Docs: reproducible perf-test harness (docs/PERF_TEST.md) across Chrome/Firefox/Kiwi": "Docs : test de performance reproductible pour Chrome/Firefox/Kiwi", "Website: swapped emerald green for the Reddit palette + added GitHub & Telegram links": "Site : vert émeraude remplacé par la palette Reddit + liens GitHub et Telegram", "System panel, per-subreddit rules & backups": "Panneau système, règles par subreddit et sauvegardes", "New Performance & status panel — see which modules run and how long each scan takes": "Nouveau panneau performance et statut — voyez les modules actifs et leur durée", "Per-subreddit rules — enable/disable any feature just inside a specific community": "Règles par subreddit — activez/désactivez une fonction dans une communauté", "One-click JSON backup & restore for bookmarks, history, keyword tracking, notes and settings": "Sauvegarde/restauration JSON en un clic des favoris, historique, mots-clés, notes et réglages", "Lazy-loading wrapper — advanced modules only touch the DOM the first time you use them": "Chargement différé — les modules avancés touchent le DOM seulement au premier usage", "Feature cards on this page collapse by default — click a title to expand": "Les cartes se replient par défaut — cliquez le titre pour ouvrir", "Live-updating help & safer backups": "Aide dynamique et sauvegardes plus sûres", "Modal keyboard-help text updates instantly when you rebind a shortcut": "L’aide clavier des modales change dès qu’un raccourci est modifié", "Options export/import now covers shortcuts, general prefs, accessibility and gallery positions": "Export/import couvre raccourcis, préférences, accessibilité et positions galerie", "Duplicate keybindings show a conflict banner with one-click resolve": "Les raccourcis dupliqués affichent une alerte avec résolution en un clic", "Import validates every field and shows a clear message on invalid JSON": "L’import valide chaque champ et affiche une erreur claire", "New Reset-to-defaults confirmation for shortcut bindings": "Nouvelle confirmation pour réinitialiser les raccourcis", "Keyboard help wired to aria-describedby": "Aide clavier reliée à aria-describedby", "Every modal shows explicit Esc / Tab hints for screen readers": "Chaque modale affiche des indications Esc/Tab pour lecteurs d’écran", "Export & import for your custom shortcut preferences (JSON)": "Export/import des préférences de raccourcis (JSON)", "Landing page: full description + How-to-use for every feature": "Page : description complète + utilisation de chaque fonction", "Focus trap, custom shortcuts & live regions": "Piège de focus, raccourcis personnalisés et régions live", "Command palette, gallery and all modals trap Tab and restore focus on close": "Palette, galerie et modales piègent Tab et restaurent le focus", "Configurable keys for gallery prev/next, collapse-all and refresh": "Touches configurables pour galerie, tout replier et actualiser", "Gallery resumes on the last-viewed image per thread": "La galerie reprend la dernière image par fil", "Parsing status announced via a dedicated aria-live region": "Statut d’analyse annoncé via aria-live", "Live status & true resync": "Statut live et vraie resynchronisation", "Full keyboard support and ARIA labels for the gallery": "Clavier complet et libellés ARIA pour la galerie", "Collapse-all persists across SPA navigation": "Tout replier persiste après navigation SPA", "Options toggle + preview swatches for author colours": "Option + aperçu des couleurs d’auteurs", "Pulsing status pill shows parsing progress; new Resync button in the panel": "Pastille animée de progression; nouveau bouton Resync", "Accessibility, palette & rule builder": "Accessibilité, palette et constructeur de règles", "Color-blind palettes (Deuteranopia, Protanopia, Tritanopia, Mono) + high-contrast mode": "Palettes daltoniennes + mode fort contraste", "Ctrl+K command palette to trigger any tool": "Palette Ctrl+K pour lancer un outil", "Adaptive polling for Live-New with visible status": "Polling adaptatif Live-New avec statut visible", "Custom keyword / author / regex rule builder with live preview": "Règles mot-clé/auteur/regex avec aperçu", "JSON / CSV export & import for saved collections": "Export/import JSON/CSV des collections", "Redesigned 3-step installation guide": "Guide d’installation repensé en 3 étapes", "Onboarding, i18n & themes": "Onboarding, i18n et thèmes", "Popup activation status + one-click tab reload prompt": "Statut d’activation et rechargement d’onglet en un clic", "Full-page onboarding spotlight on first Reddit visit": "Onboarding plein écran à la première visite Reddit", "7 languages (EN, ES, FR, DE, PT, JA, ZH)": "7 langues (EN, ES, FR, DE, PT, JA, ZH)", "Light & Dark mode across extension and site": "Modes clair et sombre dans l’extension et le site", "Quick-bar mounts immediately, no first-click required": "Barre rapide affichée immédiatement", "Firefox compatibility via browser_specific_settings": "Compatibilité Firefox via browser_specific_settings", "Midnight redesign & power tools": "Refonte sombre et outils puissants", "Dark glassy UI with green/blue accents": "Interface sombre avec accents vert/bleu", "Smart Summary (top, discussed, controversial) — 100% local": "Résumé intelligent local", "Live-New polling of Reddit's own thread JSON": "Live-New lit le JSON du fil Reddit", "OP / Mod / Awarded filter chips + Saved collections with ★": "Filtres OP/Mod/Récompensé + collections ★", "Keyboard shortcuts (T, J/K, F, N, ?)": "Raccourcis clavier (T, J/K, F, N, ?)", "First public release": "Première version publique", "Manifest V3 extension for Chrome, Edge, Brave and Firefox": "Extension Manifest V3 pour Chrome, Edge, Brave et Firefox", "50+ client-side tools: tree, folding, cleaner, gallery, analytics…": "50+ outils locaux : arbre, pliage, nettoyage, galerie, analytique…", "Local history, user color tags, keyword highlighter, thread exporter": "Historique local, tags couleur, surligneur, exportateur", "Zero backend, zero tracking, fully open-source": "Zéro backend, zéro suivi, entièrement open-source", "New": "Novo", "Recent": "Recente", "Today": "Hoje", "Launch": "Lançamento", "Comment Tree Navigator": "Navegador da árvore de comentários", "Comment Folding": "Recolher comentários", "Conversation Mode": "Modo conversa", "Depth Layers": "Camadas de profundidade", "Smart Summary": "Resumo inteligente", "Thread Cleaner": "Limpador de tópico", "Thread Health": "Saúde do tópico", "Keyword Highlighter": "Destacador de palavras-chave", "Private User Tags": "Etiquetas privadas de usuário", "Formatting Toolbar": "Barra de formatação", "Thread Exporter": "Exportador de tópico", "Image Gallery Mode": "Modo galeria", "Thread Age Warning": "Aviso de tópico antigo", "Link Previews": "Prévia de links", "Personal Analytics": "Análises pessoais", "Local Thread History": "Histórico local de tópicos", "Performance & status panel": "Painel de desempenho e status", "Per-subreddit rules": "Regras por subreddit", "Backup & restore": "Backup e restauração", "Lazy-loaded modules": "Módulos sob demanda"});
Object.assign(SITE_PHRASES.ja, {"Full translation coverage & flat colors": "完全翻訳とフラットカラー", "Removed every remaining gradient inside the extension — flat Reddit-orange tokens throughout the ⚡ Power features hub, primary CTAs and progress bars": "Suppression de tous les dégradés restants — jetons orange Reddit dans le hub ⚡, les CTA et les barres de progression", "Popup, options and content-script UI now translated end-to-end in all 7 languages (EN, ES, FR, DE, PT, JA, ZH) — no more English leaking into non-English locales": "Popup, options et interface injectée traduits de bout en bout en 7 langues — plus d’anglais dans les autres langues", "Version tagline synced across manifest, popup, options, About modal, README and site footer (v1.9.5)": "Version synchronisée dans le manifest, popup, options, À propos, README et pied de page (v1.9.5)", "Added missing i18n keys: power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog": "Clés i18n manquantes ajoutées : power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog", "Shareable deep links, match cycling & reduced-motion focus": "Liens profonds, navigation des résultats et mouvement réduit", "Shareable comment links — hover any row in the Tree, click 🔗 to copy a URL that reopens the panel and flash-highlights the exact comment": "Liens partageables de commentaire — survolez une ligne de l’arbre et cliquez 🔗 pour copier une URL qui rouvre le panneau et surligne le commentaire", "Also supports #rpt-author=<username> for jumping to a user's first comment in the thread": "Prend aussi en charge #rpt-author=<nom> pour aller au premier commentaire d’un auteur", "New ◀ / ▶ match-cycling buttons walk through search & author filter results without expanding every node": "Nouveaux boutons ◀ / ▶ pour parcourir les résultats sans tout déplier", "Reduced-motion mode swaps the pulse animation for a static outline so navigation still works with animation off": "Le mode mouvement réduit remplace l’animation par un contour statique", "Website: separate install buttons per browser (Chrome, Firefox, Kiwi) instead of one generic download": "Site : boutons d’installation séparés par navigateur au lieu d’un téléchargement générique", "Extension UI hardening for Chrome, Firefox & Kiwi": "Interface renforcée pour Chrome, Firefox et Kiwi", "Rewrote every RPT surface with !important resets so Reddit's global button styles can't hide labels": "Toutes les surfaces RPT ont été réécrites avec des resets !important pour éviter que Reddit masque les libellés", "Panel widened to 440 px, tab bar padded, filter chips readable, buttons min 40 px tall": "Panneau élargi à 440 px, onglets espacés, filtres lisibles, boutons de 40 px minimum", "Firefox-specific line-height normaliser + Kiwi/mobile 44 px tap targets": "Normalisation Firefox + zones tactiles 44 px sur Kiwi/mobile", "⚡ Power features hub retinted to design tokens; primary v2 CTA is a single Reddit-green button": "Hub ⚡ recoloré avec les jetons; CTA principal v2 en bouton vert Reddit", "Mobile Tree Navigator, live preview & site polish": "Arbre mobile, aperçu en direct et finition du site", "Comment Tree Navigator now has quick text search + author filter with a live count": "L’arbre de commentaires a une recherche rapide + filtre auteur avec compteur", "Hover any tree row for a preview bubble; click to deep-expand ancestors and flash-jump": "Survolez une ligne pour l’aperçu; cliquez pour déplier les parents et sauter avec surlignage", "Mobile: quickbar wraps, panels go full-width, ⚡ hub switches to single-column": "Mobile : barre rapide flexible, panneaux plein écran, hub ⚡ en une colonne", "Docs: reproducible perf-test harness (docs/PERF_TEST.md) across Chrome/Firefox/Kiwi": "Docs : test de performance reproductible pour Chrome/Firefox/Kiwi", "Website: swapped emerald green for the Reddit palette + added GitHub & Telegram links": "Site : vert émeraude remplacé par la palette Reddit + liens GitHub et Telegram", "System panel, per-subreddit rules & backups": "Panneau système, règles par subreddit et sauvegardes", "New Performance & status panel — see which modules run and how long each scan takes": "Nouveau panneau performance et statut — voyez les modules actifs et leur durée", "Per-subreddit rules — enable/disable any feature just inside a specific community": "Règles par subreddit — activez/désactivez une fonction dans une communauté", "One-click JSON backup & restore for bookmarks, history, keyword tracking, notes and settings": "Sauvegarde/restauration JSON en un clic des favoris, historique, mots-clés, notes et réglages", "Lazy-loading wrapper — advanced modules only touch the DOM the first time you use them": "Chargement différé — les modules avancés touchent le DOM seulement au premier usage", "Feature cards on this page collapse by default — click a title to expand": "Les cartes se replient par défaut — cliquez le titre pour ouvrir", "Live-updating help & safer backups": "Aide dynamique et sauvegardes plus sûres", "Modal keyboard-help text updates instantly when you rebind a shortcut": "L’aide clavier des modales change dès qu’un raccourci est modifié", "Options export/import now covers shortcuts, general prefs, accessibility and gallery positions": "Export/import couvre raccourcis, préférences, accessibilité et positions galerie", "Duplicate keybindings show a conflict banner with one-click resolve": "Les raccourcis dupliqués affichent une alerte avec résolution en un clic", "Import validates every field and shows a clear message on invalid JSON": "L’import valide chaque champ et affiche une erreur claire", "New Reset-to-defaults confirmation for shortcut bindings": "Nouvelle confirmation pour réinitialiser les raccourcis", "Keyboard help wired to aria-describedby": "Aide clavier reliée à aria-describedby", "Every modal shows explicit Esc / Tab hints for screen readers": "Chaque modale affiche des indications Esc/Tab pour lecteurs d’écran", "Export & import for your custom shortcut preferences (JSON)": "Export/import des préférences de raccourcis (JSON)", "Landing page: full description + How-to-use for every feature": "Page : description complète + utilisation de chaque fonction", "Focus trap, custom shortcuts & live regions": "Piège de focus, raccourcis personnalisés et régions live", "Command palette, gallery and all modals trap Tab and restore focus on close": "Palette, galerie et modales piègent Tab et restaurent le focus", "Configurable keys for gallery prev/next, collapse-all and refresh": "Touches configurables pour galerie, tout replier et actualiser", "Gallery resumes on the last-viewed image per thread": "La galerie reprend la dernière image par fil", "Parsing status announced via a dedicated aria-live region": "Statut d’analyse annoncé via aria-live", "Live status & true resync": "Statut live et vraie resynchronisation", "Full keyboard support and ARIA labels for the gallery": "Clavier complet et libellés ARIA pour la galerie", "Collapse-all persists across SPA navigation": "Tout replier persiste après navigation SPA", "Options toggle + preview swatches for author colours": "Option + aperçu des couleurs d’auteurs", "Pulsing status pill shows parsing progress; new Resync button in the panel": "Pastille animée de progression; nouveau bouton Resync", "Accessibility, palette & rule builder": "Accessibilité, palette et constructeur de règles", "Color-blind palettes (Deuteranopia, Protanopia, Tritanopia, Mono) + high-contrast mode": "Palettes daltoniennes + mode fort contraste", "Ctrl+K command palette to trigger any tool": "Palette Ctrl+K pour lancer un outil", "Adaptive polling for Live-New with visible status": "Polling adaptatif Live-New avec statut visible", "Custom keyword / author / regex rule builder with live preview": "Règles mot-clé/auteur/regex avec aperçu", "JSON / CSV export & import for saved collections": "Export/import JSON/CSV des collections", "Redesigned 3-step installation guide": "Guide d’installation repensé en 3 étapes", "Onboarding, i18n & themes": "Onboarding, i18n et thèmes", "Popup activation status + one-click tab reload prompt": "Statut d’activation et rechargement d’onglet en un clic", "Full-page onboarding spotlight on first Reddit visit": "Onboarding plein écran à la première visite Reddit", "7 languages (EN, ES, FR, DE, PT, JA, ZH)": "7 langues (EN, ES, FR, DE, PT, JA, ZH)", "Light & Dark mode across extension and site": "Modes clair et sombre dans l’extension et le site", "Quick-bar mounts immediately, no first-click required": "Barre rapide affichée immédiatement", "Firefox compatibility via browser_specific_settings": "Compatibilité Firefox via browser_specific_settings", "Midnight redesign & power tools": "Refonte sombre et outils puissants", "Dark glassy UI with green/blue accents": "Interface sombre avec accents vert/bleu", "Smart Summary (top, discussed, controversial) — 100% local": "Résumé intelligent local", "Live-New polling of Reddit's own thread JSON": "Live-New lit le JSON du fil Reddit", "OP / Mod / Awarded filter chips + Saved collections with ★": "Filtres OP/Mod/Récompensé + collections ★", "Keyboard shortcuts (T, J/K, F, N, ?)": "Raccourcis clavier (T, J/K, F, N, ?)", "First public release": "Première version publique", "Manifest V3 extension for Chrome, Edge, Brave and Firefox": "Extension Manifest V3 pour Chrome, Edge, Brave et Firefox", "50+ client-side tools: tree, folding, cleaner, gallery, analytics…": "50+ outils locaux : arbre, pliage, nettoyage, galerie, analytique…", "Local history, user color tags, keyword highlighter, thread exporter": "Historique local, tags couleur, surligneur, exportateur", "Zero backend, zero tracking, fully open-source": "Zéro backend, zéro suivi, entièrement open-source", "New": "新規", "Recent": "最近", "Today": "今日", "Launch": "公開", "Comment Tree Navigator": "コメントツリーナビゲーター", "Comment Folding": "コメント折りたたみ", "Conversation Mode": "会話モード", "Depth Layers": "深さレイヤー", "Smart Summary": "スマート要約", "Thread Cleaner": "スレッドクリーナー", "Thread Health": "スレッド健全性", "Keyword Highlighter": "キーワード強調", "Private User Tags": "プライベートユーザータグ", "Formatting Toolbar": "書式ツールバー", "Thread Exporter": "スレッドエクスポート", "Image Gallery Mode": "画像ギャラリーモード", "Thread Age Warning": "古いスレッド警告", "Link Previews": "リンクプレビュー", "Personal Analytics": "個人分析", "Local Thread History": "ローカル履歴", "Performance & status panel": "パフォーマンスと状態パネル", "Per-subreddit rules": "サブレごとのルール", "Backup & restore": "バックアップと復元", "Lazy-loaded modules": "遅延読み込みモジュール"});
Object.assign(SITE_PHRASES.zh, {"Full translation coverage & flat colors": "完整翻译与纯色设计", "Removed every remaining gradient inside the extension — flat Reddit-orange tokens throughout the ⚡ Power features hub, primary CTAs and progress bars": "Suppression de tous les dégradés restants — jetons orange Reddit dans le hub ⚡, les CTA et les barres de progression", "Popup, options and content-script UI now translated end-to-end in all 7 languages (EN, ES, FR, DE, PT, JA, ZH) — no more English leaking into non-English locales": "Popup, options et interface injectée traduits de bout en bout en 7 langues — plus d’anglais dans les autres langues", "Version tagline synced across manifest, popup, options, About modal, README and site footer (v1.9.5)": "Version synchronisée dans le manifest, popup, options, À propos, README et pied de page (v1.9.5)", "Added missing i18n keys: power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog": "Clés i18n manquantes ajoutées : power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog", "Shareable deep links, match cycling & reduced-motion focus": "Liens profonds, navigation des résultats et mouvement réduit", "Shareable comment links — hover any row in the Tree, click 🔗 to copy a URL that reopens the panel and flash-highlights the exact comment": "Liens partageables de commentaire — survolez une ligne de l’arbre et cliquez 🔗 pour copier une URL qui rouvre le panneau et surligne le commentaire", "Also supports #rpt-author=<username> for jumping to a user's first comment in the thread": "Prend aussi en charge #rpt-author=<nom> pour aller au premier commentaire d’un auteur", "New ◀ / ▶ match-cycling buttons walk through search & author filter results without expanding every node": "Nouveaux boutons ◀ / ▶ pour parcourir les résultats sans tout déplier", "Reduced-motion mode swaps the pulse animation for a static outline so navigation still works with animation off": "Le mode mouvement réduit remplace l’animation par un contour statique", "Website: separate install buttons per browser (Chrome, Firefox, Kiwi) instead of one generic download": "Site : boutons d’installation séparés par navigateur au lieu d’un téléchargement générique", "Extension UI hardening for Chrome, Firefox & Kiwi": "Interface renforcée pour Chrome, Firefox et Kiwi", "Rewrote every RPT surface with !important resets so Reddit's global button styles can't hide labels": "Toutes les surfaces RPT ont été réécrites avec des resets !important pour éviter que Reddit masque les libellés", "Panel widened to 440 px, tab bar padded, filter chips readable, buttons min 40 px tall": "Panneau élargi à 440 px, onglets espacés, filtres lisibles, boutons de 40 px minimum", "Firefox-specific line-height normaliser + Kiwi/mobile 44 px tap targets": "Normalisation Firefox + zones tactiles 44 px sur Kiwi/mobile", "⚡ Power features hub retinted to design tokens; primary v2 CTA is a single Reddit-green button": "Hub ⚡ recoloré avec les jetons; CTA principal v2 en bouton vert Reddit", "Mobile Tree Navigator, live preview & site polish": "Arbre mobile, aperçu en direct et finition du site", "Comment Tree Navigator now has quick text search + author filter with a live count": "L’arbre de commentaires a une recherche rapide + filtre auteur avec compteur", "Hover any tree row for a preview bubble; click to deep-expand ancestors and flash-jump": "Survolez une ligne pour l’aperçu; cliquez pour déplier les parents et sauter avec surlignage", "Mobile: quickbar wraps, panels go full-width, ⚡ hub switches to single-column": "Mobile : barre rapide flexible, panneaux plein écran, hub ⚡ en une colonne", "Docs: reproducible perf-test harness (docs/PERF_TEST.md) across Chrome/Firefox/Kiwi": "Docs : test de performance reproductible pour Chrome/Firefox/Kiwi", "Website: swapped emerald green for the Reddit palette + added GitHub & Telegram links": "Site : vert émeraude remplacé par la palette Reddit + liens GitHub et Telegram", "System panel, per-subreddit rules & backups": "Panneau système, règles par subreddit et sauvegardes", "New Performance & status panel — see which modules run and how long each scan takes": "Nouveau panneau performance et statut — voyez les modules actifs et leur durée", "Per-subreddit rules — enable/disable any feature just inside a specific community": "Règles par subreddit — activez/désactivez une fonction dans une communauté", "One-click JSON backup & restore for bookmarks, history, keyword tracking, notes and settings": "Sauvegarde/restauration JSON en un clic des favoris, historique, mots-clés, notes et réglages", "Lazy-loading wrapper — advanced modules only touch the DOM the first time you use them": "Chargement différé — les modules avancés touchent le DOM seulement au premier usage", "Feature cards on this page collapse by default — click a title to expand": "Les cartes se replient par défaut — cliquez le titre pour ouvrir", "Live-updating help & safer backups": "Aide dynamique et sauvegardes plus sûres", "Modal keyboard-help text updates instantly when you rebind a shortcut": "L’aide clavier des modales change dès qu’un raccourci est modifié", "Options export/import now covers shortcuts, general prefs, accessibility and gallery positions": "Export/import couvre raccourcis, préférences, accessibilité et positions galerie", "Duplicate keybindings show a conflict banner with one-click resolve": "Les raccourcis dupliqués affichent une alerte avec résolution en un clic", "Import validates every field and shows a clear message on invalid JSON": "L’import valide chaque champ et affiche une erreur claire", "New Reset-to-defaults confirmation for shortcut bindings": "Nouvelle confirmation pour réinitialiser les raccourcis", "Keyboard help wired to aria-describedby": "Aide clavier reliée à aria-describedby", "Every modal shows explicit Esc / Tab hints for screen readers": "Chaque modale affiche des indications Esc/Tab pour lecteurs d’écran", "Export & import for your custom shortcut preferences (JSON)": "Export/import des préférences de raccourcis (JSON)", "Landing page: full description + How-to-use for every feature": "Page : description complète + utilisation de chaque fonction", "Focus trap, custom shortcuts & live regions": "Piège de focus, raccourcis personnalisés et régions live", "Command palette, gallery and all modals trap Tab and restore focus on close": "Palette, galerie et modales piègent Tab et restaurent le focus", "Configurable keys for gallery prev/next, collapse-all and refresh": "Touches configurables pour galerie, tout replier et actualiser", "Gallery resumes on the last-viewed image per thread": "La galerie reprend la dernière image par fil", "Parsing status announced via a dedicated aria-live region": "Statut d’analyse annoncé via aria-live", "Live status & true resync": "Statut live et vraie resynchronisation", "Full keyboard support and ARIA labels for the gallery": "Clavier complet et libellés ARIA pour la galerie", "Collapse-all persists across SPA navigation": "Tout replier persiste après navigation SPA", "Options toggle + preview swatches for author colours": "Option + aperçu des couleurs d’auteurs", "Pulsing status pill shows parsing progress; new Resync button in the panel": "Pastille animée de progression; nouveau bouton Resync", "Accessibility, palette & rule builder": "Accessibilité, palette et constructeur de règles", "Color-blind palettes (Deuteranopia, Protanopia, Tritanopia, Mono) + high-contrast mode": "Palettes daltoniennes + mode fort contraste", "Ctrl+K command palette to trigger any tool": "Palette Ctrl+K pour lancer un outil", "Adaptive polling for Live-New with visible status": "Polling adaptatif Live-New avec statut visible", "Custom keyword / author / regex rule builder with live preview": "Règles mot-clé/auteur/regex avec aperçu", "JSON / CSV export & import for saved collections": "Export/import JSON/CSV des collections", "Redesigned 3-step installation guide": "Guide d’installation repensé en 3 étapes", "Onboarding, i18n & themes": "Onboarding, i18n et thèmes", "Popup activation status + one-click tab reload prompt": "Statut d’activation et rechargement d’onglet en un clic", "Full-page onboarding spotlight on first Reddit visit": "Onboarding plein écran à la première visite Reddit", "7 languages (EN, ES, FR, DE, PT, JA, ZH)": "7 langues (EN, ES, FR, DE, PT, JA, ZH)", "Light & Dark mode across extension and site": "Modes clair et sombre dans l’extension et le site", "Quick-bar mounts immediately, no first-click required": "Barre rapide affichée immédiatement", "Firefox compatibility via browser_specific_settings": "Compatibilité Firefox via browser_specific_settings", "Midnight redesign & power tools": "Refonte sombre et outils puissants", "Dark glassy UI with green/blue accents": "Interface sombre avec accents vert/bleu", "Smart Summary (top, discussed, controversial) — 100% local": "Résumé intelligent local", "Live-New polling of Reddit's own thread JSON": "Live-New lit le JSON du fil Reddit", "OP / Mod / Awarded filter chips + Saved collections with ★": "Filtres OP/Mod/Récompensé + collections ★", "Keyboard shortcuts (T, J/K, F, N, ?)": "Raccourcis clavier (T, J/K, F, N, ?)", "First public release": "Première version publique", "Manifest V3 extension for Chrome, Edge, Brave and Firefox": "Extension Manifest V3 pour Chrome, Edge, Brave et Firefox", "50+ client-side tools: tree, folding, cleaner, gallery, analytics…": "50+ outils locaux : arbre, pliage, nettoyage, galerie, analytique…", "Local history, user color tags, keyword highlighter, thread exporter": "Historique local, tags couleur, surligneur, exportateur", "Zero backend, zero tracking, fully open-source": "Zéro backend, zéro suivi, entièrement open-source", "New": "新增", "Recent": "最近", "Today": "今天", "Launch": "发布", "Comment Tree Navigator": "评论树导航器", "Comment Folding": "评论折叠", "Conversation Mode": "对话模式", "Depth Layers": "深度层级", "Smart Summary": "智能摘要", "Thread Cleaner": "帖子清理器", "Thread Health": "帖子健康度", "Keyword Highlighter": "关键词高亮", "Private User Tags": "私人用户标签", "Formatting Toolbar": "格式工具栏", "Thread Exporter": "帖子导出器", "Image Gallery Mode": "图片画廊模式", "Thread Age Warning": "旧帖提醒", "Link Previews": "链接预览", "Personal Analytics": "个人分析", "Local Thread History": "本地帖子历史", "Performance & status panel": "性能与状态面板", "Per-subreddit rules": "按 subreddit 的规则", "Backup & restore": "备份与恢复", "Lazy-loaded modules": "延迟加载模块"});

/* Hero browser picker: one card per supported browser. Clicking jumps
   to the install section, opens the right tab, then triggers the download
   so the user reads the correct instructions before the ZIP lands. */
function BrowserPick({
  icon, label, sub, tab, isDark, border, t,
}: {
  icon: ReactNode; label: string; sub: string; tab: "chrome" | "ff" | "kiwi";
  isDark: boolean; border: string; t: (k: string) => string;
}) {
  return (
    <button
      onClick={() => {
        document.dispatchEvent(new CustomEvent("rpt-install-tab", { detail: tab }));
        const el = document.getElementById("install");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(downloadZip, 350);
      }}
      className={`group flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition ${border} ${isDark ? "bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#46d160]/60" : "bg-white hover:bg-slate-50 hover:border-[#46d160]"}`}
      aria-label={`${t("install_for")} ${label}`}
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#46d160]/10 text-[#46d160]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{label}</span>
        <span className={`block text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}>{sub}</span>
      </span>
      <Download className="h-4 w-4 shrink-0 text-[#46d160] opacity-0 transition group-hover:opacity-100" />
    </button>
  );
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

Object.assign(SITE_PHRASES.fr, {
  "Comment Tree Navigator": "Navigateur d'arbre de commentaires",
  "A collapsible sidebar showing every comment as a tree, one dot per author.": "Une barre latérale repliable qui affiche chaque commentaire comme un arbre, avec un point par auteur.",
  "Open the RPT panel (button bottom-right, or press T). Click any node to jump straight to that comment — the page smooth-scrolls and briefly flashes the match.": "Ouvrez le panneau RPT (bouton en bas à droite ou touche T). Cliquez sur un nœud pour aller directement au commentaire — la page défile et le met brièvement en évidence.",
  "Comment Folding": "Pliage des commentaires",
  "Persistent collapse/expand for every branch of a thread.": "Repliez ou dépliez durablement chaque branche d’un fil.",
  "Use the ▾ / ▴ chip on any comment, or press F to fold the one under your cursor. Shift+C collapses everything. Your folded state is remembered per URL and survives page reloads.": "Utilisez le bouton ▾ / ▴ sur un commentaire, ou appuyez sur F pour replier celui sous le curseur. Shift+C replie tout. L’état est mémorisé par URL.",
  "Conversation Mode": "Mode conversation",
  "Reformats the thread as a chat-style back-and-forth for easier reading.": "Reformate le fil comme une conversation pour une lecture plus simple.",
  "Open the panel and click Conversation (or press C). A full-screen overlay shows nested bubbles per author. Esc closes and restores your scroll position.": "Ouvrez le panneau et cliquez Conversation (ou C). Une fenêtre plein écran affiche les bulles imbriquées par auteur. Échap ferme et restaure votre position.",
  "Depth Layers": "Couches de profondeur",
  "Coloured left-border stripes indicate nesting depth at a glance.": "Des bandes colorées à gauche indiquent la profondeur d’imbrication en un coup d’œil.",
  "Automatic on every thread — no click needed. Toggle it off in Options → Automation if you prefer Reddit's default look.": "Automatique sur chaque fil — aucun clic requis. Désactivez dans Options → Automatisation si vous préférez l’apparence Reddit par défaut.",
  "Smart Summary": "Résumé intelligent",
  "Thread Cleaner": "Nettoyeur de fil",
  "Thread Health": "Santé du fil",
  "Keyword Highlighter": "Surligneur de mots-clés",
  "Private User Tags": "Étiquettes utilisateur privées",
  "Formatting Toolbar": "Barre de formatage",
  "Thread Exporter": "Exportateur de fil",
  "Image Gallery Mode": "Mode galerie d’images",
  "Thread Age Warning": "Avertissement de fil ancien",
  "Link Previews": "Aperçus de liens",
  "Personal Analytics": "Analytique personnelle",
  "Local Thread History": "Historique local des fils",
  "Performance & status panel": "Panneau performance et statut",
  "Per-subreddit rules": "Règles par subreddit",
  "Backup & restore": "Sauvegarde et restauration",
  "Lazy-loaded modules": "Modules à chargement différé",
});

function Index() {
  const { theme, setTheme, lang, setLang } = useThemeAndLang();
  const t = useMemo(() => (k: string) => T[lang][k] ?? (lang !== "en" ? SITE_PHRASES[lang as Exclude<Lang, "en">]?.[k] : undefined) ?? T.en[k] ?? k, [lang]);

  const isDark = theme === "dark";
  const bg = isDark ? "bg-[#0b0f14] text-white" : "bg-white text-[#0b1220]";
  const card = isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50";
  const cardHover = isDark ? "hover:border-[#ff4500]/60 hover:bg-white/[0.06]" : "hover:border-[#ff4500] hover:bg-white";
  const subtle = isDark ? "text-white/60" : "text-slate-600";
  const muted = isDark ? "text-white/50" : "text-slate-500";
  const border = isDark ? "border-white/5" : "border-slate-200";
  const section2 = isDark ? "bg-white/[0.02]" : "bg-slate-50/60";

  const CHANGELOG: { v: string; t: string; d: string; i: typeof Rocket; items: string[] }[] = [
    { v: "1.10.3", t: "Side panel fix & full TabBankruptcy theme sync", d: "Latest", i: Rocket, items: [
      "Side panel now opens reliably with all 8 tabs (Tree, Tools, Saved, Clean, Keywords, Stats, Power, Export) — the tab bar auto-scrolls the active tab into view on 400 px panels",
      "TabBankruptcy dark theme applied end-to-end: identical tokens, spacing and typography across popup, side panel, options, analytics and the Power features hub",
      "Manifest, popup, Options, README, site footer, About modal and language taglines all synced to v1.10.3",
    ]},
    { v: "1.10.2", t: "Power tab lands in the side panel", d: "", i: Rocket, items: [
      "New ⚡ Power tab lists all 36 modules grouped by category, with per-module Run button and enable/disable toggle",
      "Live search inside the Power tab filters cards as you type",
      "Power features (36) card removed from the popup Home — everything lives in one place inside the panel",
    ]},
    { v: "1.10.0", t: "Portable settings, focus overlay & popup shortcut help", d: "", i: Rocket, items: [
      "Full settings backup — Options → Export / Import now covers shortcuts, general prefs, accessibility, cleaner filters, keywords, user tags, automation, custom rules and gallery positions in one JSON file",
      "Accessibility focus-order overlay — press Alt + Shift + A on any Reddit page to number every tabbable element (Esc to close)",
      "Popup keyboard-shortcuts help — click the (?) icon in the popup header for a categorized cheatsheet",
      "Reset-to-defaults for popup and panel state without touching your keywords, tags, saved comments or history",
    ]},
    { v: "1.9.7", t: "Full extension redesign & onboarding wizard", d: "New", i: Rocket, items: [
      "First-run onboarding wizard: pick your language, toggle each feature with a short note, and Skip or Use defaults",
      "Comment Tree Navigator search/author bar is now sticky — prev/next stays pinned while scrolling long threads",
      "Panel and popup redesign: consistent spacing, aligned button labels, uniform 14 px About icon (no more oversized SVG)",
      "Repo migrated to github.com/Saddexrnx/redditpt — every link in extension, popup, options and README updated",
      "Manifest, popup, Options, README, site footer and About modal synced to v1.10.3",
    ]},
    { v: "1.9.6", t: "French translation repair & activation clarity", d: "", i: Languages, items: [
      "French website cards no longer fall back to Spanish",
      "Side-panel buttons show a clear active/off state",
      "Version sync across manifest, popup, Options, README and website",
    ]},
    { v: "1.9.5", t: "Full translation coverage & flat colors", d: "New", i: Languages, items: [
      "Removed every remaining gradient inside the extension — flat Reddit-orange tokens throughout the ⚡ Power features hub, primary CTAs and progress bars",
      "Popup, options and content-script UI now translated end-to-end in all 7 languages (EN, ES, FR, DE, PT, JA, ZH) — no more English leaking into non-English locales",
      "Version tagline synced across manifest, popup, options, About modal, README and site footer (v1.9.5)",
      "Added missing i18n keys: power_features, command_palette, accessibility, custom_rules, saved_collections, about, about_changelog",
    ]},
    { v: "1.9.3", t: "Shareable deep links, match cycling & reduced-motion focus", d: "New", i: Link2, items: [
      "Shareable comment links — hover any row in the Tree, click 🔗 to copy a URL that reopens the panel and flash-highlights the exact comment",
      "Also supports #rpt-author=<username> for jumping to a user's first comment in the thread",
      "New ◀ / ▶ match-cycling buttons walk through search & author filter results without expanding every node",
      "Reduced-motion mode swaps the pulse animation for a static outline so navigation still works with animation off",
      "Website: separate install buttons per browser (Chrome, Firefox, Kiwi) instead of one generic download",
    ]},
    { v: "1.9.2", t: "Extension UI hardening for Chrome, Firefox & Kiwi", d: "Recent", i: Palette, items: [
      "Rewrote every RPT surface with !important resets so Reddit's global button styles can't hide labels",
      "Panel widened to 440 px, tab bar padded, filter chips readable, buttons min 40 px tall",
      "Firefox-specific line-height normaliser + Kiwi/mobile 44 px tap targets",
      "⚡ Power features hub retinted to design tokens; primary v2 CTA is a single Reddit-green button",
    ]},
    { v: "1.9.1", t: "Mobile Tree Navigator, live preview & site polish", d: "Recent", i: GitBranch, items: [
      "Comment Tree Navigator now has quick text search + author filter with a live count",
      "Hover any tree row for a preview bubble; click to deep-expand ancestors and flash-jump",
      "Mobile: quickbar wraps, panels go full-width, ⚡ hub switches to single-column",
      "Docs: reproducible perf-test harness (docs/PERF_TEST.md) across Chrome/Firefox/Kiwi",
      "Website: swapped emerald green for the Reddit palette + added GitHub & Telegram links",
    ]},
    { v: "1.9", t: "System panel, per-subreddit rules & backups", d: "Recent", i: Zap, items: [
      "New Performance & status panel — see which modules run and how long each scan takes",
      "Per-subreddit rules — enable/disable any feature just inside a specific community",
      "One-click JSON backup & restore for bookmarks, history, keyword tracking, notes and settings",
      "Lazy-loading wrapper — advanced modules only touch the DOM the first time you use them",
      "Feature cards on this page collapse by default — click a title to expand",
    ]},
    { v: "1.7", t: "Live-updating help & safer backups", d: "Today", i: KeyRound, items: [
      "Modal keyboard-help text updates instantly when you rebind a shortcut",
      "Options export/import now covers shortcuts, general prefs, accessibility and gallery positions",
      "Duplicate keybindings show a conflict banner with one-click resolve",
      "Import validates every field and shows a clear message on invalid JSON",
      "New Reset-to-defaults confirmation for shortcut bindings",
    ]},
    { v: "1.6", t: "Keyboard help wired to aria-describedby", d: "Recent", i: Accessibility, items: [
      "Every modal shows explicit Esc / Tab hints for screen readers",
      "Export & import for your custom shortcut preferences (JSON)",
      "Landing page: full description + How-to-use for every feature",
    ]},
    { v: "1.5", t: "Focus trap, custom shortcuts & live regions", d: "Recent", i: Command, items: [
      "Command palette, gallery and all modals trap Tab and restore focus on close",
      "Configurable keys for gallery prev/next, collapse-all and refresh",
      "Gallery resumes on the last-viewed image per thread",
      "Parsing status announced via a dedicated aria-live region",
    ]},
    { v: "1.4", t: "Live status & true resync", d: "Recent", i: Activity, items: [
      "Full keyboard support and ARIA labels for the gallery",
      "Collapse-all persists across SPA navigation",
      "Options toggle + preview swatches for author colours",
      "Pulsing status pill shows parsing progress; new Resync button in the panel",
    ]},
    { v: "1.3", t: "Accessibility, palette & rule builder", d: "Recent", i: Palette, items: [
      "Color-blind palettes (Deuteranopia, Protanopia, Tritanopia, Mono) + high-contrast mode",
      "Ctrl+K command palette to trigger any tool",
      "Adaptive polling for Live-New with visible status",
      "Custom keyword / author / regex rule builder with live preview",
      "JSON / CSV export & import for saved collections",
      "Redesigned 3-step installation guide",
    ]},
    { v: "1.2", t: "Onboarding, i18n & themes", d: "Recent", i: Languages, items: [
      "Popup activation status + one-click tab reload prompt",
      "Full-page onboarding spotlight on first Reddit visit",
      "7 languages (EN, ES, FR, DE, PT, JA, ZH)",
      "Light & Dark mode across extension and site",
      "Quick-bar mounts immediately, no first-click required",
      "Firefox compatibility via browser_specific_settings",
    ]},
    { v: "1.1", t: "Midnight redesign & power tools", d: "Recent", i: Sparkle, items: [
      "Dark glassy UI with green/blue accents",
      "Smart Summary (top, discussed, controversial) — 100% local",
      "Live-New polling of Reddit's own thread JSON",
      "OP / Mod / Awarded filter chips + Saved collections with ★",
      "Keyboard shortcuts (T, J/K, F, N, ?)",
    ]},
    { v: "1.0", t: "First public release", d: "Launch", i: Rocket, items: [
      "Manifest V3 extension for Chrome, Edge, Brave and Firefox",
      "50+ client-side tools: tree, folding, cleaner, gallery, analytics…",
      "Local history, user color tags, keyword highlighter, thread exporter",
      "Zero backend, zero tracking, fully open-source",
    ]},
  ];

  const FEATURES = [
    { i: GitBranch, t: "Comment Tree Navigator",
      d: "A collapsible sidebar showing every comment as a tree, one dot per author.",
      h: "Open the RPT panel (button bottom-right, or press T). Click any node to jump straight to that comment — the page smooth-scrolls and briefly flashes the match." },
    { i: ChevronsUpDown, t: "Comment Folding",
      d: "Persistent collapse/expand for every branch of a thread.",
      h: "Use the ▾ / ▴ chip on any comment, or press F to fold the one under your cursor. Shift+C collapses everything. Your folded state is remembered per URL and survives page reloads." },
    { i: MessageSquare, t: "Conversation Mode",
      d: "Reformats the thread as a chat-style back-and-forth for easier reading.",
      h: "Open the panel and click Conversation (or press C). A full-screen overlay shows nested bubbles per author. Esc closes and restores your scroll position." },
    { i: Layers, t: "Depth Layers",
      d: "Coloured left-border stripes indicate nesting depth at a glance.",
      h: "Automatic on every thread — no click needed. Toggle it off in Options → Automation if you prefer Reddit's default look." },
    { i: Sparkles, t: "Smart Summary",
      d: "Top voted, most discussed, long-substantive and controversial — computed locally from the parsed tree.",
      h: "Press S or click Smart summary in the panel. Click any item in the modal to jump to that exact comment. Zero network calls." },
    { i: ListChecks, t: "Thread Cleaner",
      d: "Hide deleted, empty, bot, short or low-score comments to focus on signal.",
      h: "Open Options → Thread Cleaner and enable the filters you want (minimum length, minimum score, etc.). They apply live on every Reddit thread you open." },
    { i: Activity, t: "Thread Health",
      d: "Local score for toxicity, quality and engagement based on comment length, replies and vote spread.",
      h: "See the Health card in the side panel. Numbers refresh whenever you press the Resync button in the panel header." },
    { i: Highlighter, t: "Keyword Highlighter",
      d: "Your custom keywords are highlighted everywhere on Reddit.",
      h: "Options → Highlighted keywords: type a comma-separated list (e.g. docker, rust). Matches are outlined in yellow. Combine with Custom rules for regex or author filters." },
    { i: Tag, t: "Private User Tags",
      d: "Attach your own label and colour to any Reddit username.",
      h: "Options → User tags: enter the username, a label ('helpful', 'blocked'), pick a colour, save. The badge appears next to that user everywhere in Reddit." },
    { i: Bold, t: "Formatting Toolbar",
      d: "Bold, italic, code, quote, spoiler and link — one click above every Reddit textarea.",
      h: "Just focus any comment or post editor: the RPT toolbar appears above it. Click a button to wrap the selected text with the correct Markdown." },
    { i: FileDown, t: "Thread Exporter",
      d: "Save any thread as Markdown, HTML or JSON for offline reading or citations.",
      h: "Panel → Export, then choose the format. The file downloads locally — nothing leaves your browser." },
    { i: Image, t: "Image Gallery Mode",
      d: "Full-screen viewer for image posts with prev/next and keyboard support.",
      h: "Press G or click Gallery in the panel. Use ← / → to browse, Home/End for first/last, Esc to close. The gallery resumes at the last image you viewed per thread." },
    { i: Clock, t: "Thread Age Warning",
      d: "Friendly banner when the thread you just opened is over a year old.",
      h: "No setup — appears automatically. Disable it in Options → Automation if you don't want the reminder." },
    { i: LinkIcon, t: "Link Previews",
      d: "Hover any link inside a comment to preview its domain, path and detected type (image, video, article).",
      h: "Just hover — a small tooltip appears near the cursor. Nothing is fetched from the linked site; the preview is derived from the URL itself." },
    { i: BarChart3, t: "Personal Analytics",
      d: "Local dashboard: threads read, subs visited, reading time, favourite authors.",
      h: "Click the extension icon in the toolbar → Open analytics. Everything is computed from the local history — no server tracking." },
    { i: History, t: "Local Thread History",
      d: "Every Reddit thread you've opened with title, subreddit, date and comment count.",
      h: "Open the popup and click History, or view it inside Analytics. Clear it any time from Options → Local data." },
    { i: Activity, t: "Performance & status panel",
      d: "See which modules are running on the current page and how long each scan took.",
      h: "Open the ⚡ Power features hub → System → Performance & status, or Ctrl+K → \"Performance & status\". Great for spotting lag on big threads." },
    { i: ListChecks, t: "Per-subreddit rules",
      d: "Enable or disable any feature just inside a specific community.",
      h: "Visit a community, then ⚡ hub → System → Per-subreddit rules. Uncheck features to turn them off only there — global settings stay untouched." },
    { i: FileDown, t: "Backup & restore",
      d: "One-click JSON snapshot of bookmarks, history, keyword tracking, notes and settings.",
      h: "⚡ hub → System → Backup & restore → Export. Import the same file on another browser to move your data across devices." },
    { i: Zap, t: "Lazy-loaded modules",
      d: "Every advanced tool only touches the DOM the first time you use it, keeping large threads fast.",
      h: "Automatic — nothing to configure. The Performance panel shows the exact first-run cost of each module." },
  ];

  return (
    <div className={`min-h-screen ${bg} transition-colors`}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Reddit Power Toolkit logo" className="h-10 w-10 rounded-xl" />
          <span className="font-semibold">Reddit Power Toolkit</span>
        </div>
        <nav className="hidden gap-6 text-sm md:flex">
          <a href="#features" className={`${subtle} hover:text-inherit`}>{t("nav_features")}</a>
          <a href="#install" className={`${subtle} hover:text-inherit`}>{t("nav_install")}</a>
          <a href="#changelog" className={`${subtle} hover:text-inherit`}>{t("whats_new")}</a>
          <a href="#privacy" className={`${subtle} hover:text-inherit`}>{t("nav_privacy")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Saddexrnx"
            target="_blank" rel="noreferrer"
            aria-label="GitHub"
            className={`hidden sm:grid h-8 w-8 place-items-center rounded-lg border ${border} ${subtle} hover:text-[#ff4500]`}
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://t.me/Saddex_x"
            target="_blank" rel="noreferrer"
            aria-label="Telegram @Saddex_x"
            className={`hidden sm:grid h-8 w-8 place-items-center rounded-lg border ${border} ${subtle} hover:text-[#ff4500]`}
          >
            <TelegramIcon className="h-4 w-4" />
          </a>
          <div className={`flex items-center gap-1.5 rounded-lg border ${border} px-2 py-1 text-xs ${subtle}`}>
            <Languages className="h-3.5 w-3.5" />
            <select
              aria-label={t("lang_label")}
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
            aria-label={t("theme_label")}
            className={`grid h-8 w-8 place-items-center rounded-lg border ${border} ${subtle} hover:text-[#ff4500]`}
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
              <span className="text-[#ff4500]">{t("hero2")}</span>
            </h1>
            <p className={`mt-6 max-w-2xl text-lg ${subtle}`}>{t("heroP")}</p>
            {/* No generic download — user picks their browser first so we
                can send them straight to matching install steps. */}
            <div className="mt-8">
              <p className={`mb-3 text-sm font-medium ${subtle}`}>{t("choose_browser")}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <BrowserPick icon={<Chrome className="h-6 w-6" />} label="Chrome · Edge · Brave"
                             sub="Chromium desktop" tab="chrome" isDark={isDark} border={border} t={t} />
                <BrowserPick icon={<Globe className="h-6 w-6" />} label="Firefox 128+"
                             sub="Gecko desktop" tab="ff" isDark={isDark} border={border} t={t} />
                <BrowserPick icon={<Smartphone className="h-6 w-6" />} label="Kiwi Browser"
                             sub="Android · Chromium" tab="kiwi" isDark={isDark} border={border} t={t} />
              </div>
              <p className={`mt-4 text-xs ${muted}`}>{t("worksIn")}</p>
            </div>
          </div>
        </section>

        <section id="features" className={`border-t ${border} ${section2}`}>
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-bold md:text-3xl">{t("featuresTitle")}</h2>
            <p className={`mt-2 ${subtle}`}>{t("featuresSub")}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <details
                  key={f.t}
                  className={`group rounded-xl border p-5 transition ${card} ${cardHover} [&_summary::-webkit-details-marker]:hidden`}
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ff4500]/10 text-[#ff4500]">
                      <f.i className="h-5 w-5" />
                    </span>
                    <span className="flex-1 font-semibold">{t(f.t)}</span>
                    <span className={`text-xs ${muted} transition group-open:rotate-180`} aria-hidden>▾</span>
                  </summary>
                  <div className="mt-3">
                    <p className={`text-sm ${subtle}`}>{t(f.d)}</p>
                    <div className={`mt-3 border-t ${border} pt-3 text-xs leading-relaxed ${muted}`}>
                      <span className="font-semibold uppercase tracking-wider text-[#46d160]">{t("how_to_use")}</span>
                      <p className="mt-1">{t(f.h)}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="install" className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-bold md:text-3xl">{t("installTitle")}</h2>
          <p className={`mt-2 ${subtle}`}>{t("installSub")}</p>
          <InstallTabs t={t} card={card} cardHover={cardHover} subtle={subtle} border={border} isDark={isDark} />
        </section>

        <section id="changelog" className={`border-t ${border} ${section2}`}>
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff4500]/10 text-[#ff4500]">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">{t("whats_new")}</h2>
                <p className={`mt-1 text-sm ${subtle}`}>{t("whats_new_sub")}</p>
              </div>
            </div>
            <ol className="relative mt-10 space-y-6 border-l border-[#ff4500]/25 pl-6">
              {CHANGELOG.map((r) => (
                <li key={r.v} className="relative">
                  <span className="absolute -left-[33px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff4500] text-[10px] font-bold text-black shadow-[0_0_0_4px_rgba(255,69,0,0.15)]">
                    <r.i className="h-3 w-3" />
                  </span>
                  <div className={`rounded-xl border p-5 transition ${card} ${cardHover}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-md bg-[#ff4500]/10 px-2 py-0.5 font-mono text-sm font-bold text-[#ff4500]">v{r.v}</span>
                      <h3 className="text-base font-semibold md:text-lg">{t(r.t)}</h3>
                      <span className={`ml-auto text-xs ${muted}`}>{t(r.d)}</span>
                    </div>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {r.items.map((it) => (
                        <li key={it} className={`flex items-start gap-2 text-sm ${subtle}`}>
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#46d160]" />
                          <span>{t(it)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
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
                [Lock, t("p5t"), t("p5d")],
                [Github, t("p6t"), t("p6d")],
              ].map(([Icon, title, desc]) => {
                const I = Icon as typeof Shield; const ttl = title as string; const dsc = desc as string;
                return (
                  <div key={ttl} className={`rounded-xl border p-5 ${card}`}>
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#46d160]/10 text-[#46d160]">
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
        <div className={`mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm sm:flex-row sm:items-center ${muted}`}>
          <span>{t("footerC")}</span>
          <div className="flex flex-wrap items-center gap-4">
            <a href="https://github.com/Saddexrnx" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#ff4500]">
              <Github className="h-4 w-4" /> github.com/Saddexrnx
            </a>
            <a href="https://t.me/Saddex_x" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#ff4500]">
              <TelegramIcon className="h-4 w-4" /> @Saddex_x
            </a>
          </div>
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
  const [copied, setCopied] = useState<string | null>(null);
  /* Hero quick-links dispatch rpt-install-tab; open the matching tab. */
  useEffect(() => {
    const h = (e: Event) => {
      const id = (e as CustomEvent).detail as "chrome" | "ff" | "kiwi";
      if (id === "chrome" || id === "ff" || id === "kiwi") setTab(id);
    };
    document.addEventListener("rpt-install-tab", h);
    return () => document.removeEventListener("rpt-install-tab", h);
  }, []);
  const copy = (v: string) => {
    navigator.clipboard?.writeText(v).then(() => { setCopied(v); setTimeout(() => setCopied(null), 1500); });
  };
  const activeCls = "bg-[#ff4500] text-black border-[#ff4500]";
  const tabs: { id: "chrome" | "ff" | "kiwi"; label: string; icon: ReactNode }[] = [
    { id: "chrome", label: t("tab_chrome"), icon: <Chrome className="h-4 w-4" /> },
    { id: "ff", label: t("tab_ff"), icon: <Globe className="h-4 w-4" /> },
    { id: "kiwi", label: t("tab_kiwi"), icon: <Smartphone className="h-4 w-4" /> },
  ];
  type Step = { icon: typeof Package; title: string; body: ReactNode; copy?: string };
  const stepsFor: Record<"chrome" | "ff" | "kiwi", Step[]> = {
    chrome: [
      { icon: Package,      title: t("install_download"),       body: t("step_download") },
      { icon: Puzzle,       title: t("install_open_ext"),body: t("step_open_chrome"), copy: "chrome://extensions" },
      { icon: ToggleRight,  title: t("install_dev_mode"), body: t("step_dev") },
      { icon: FolderOpen,   title: t("install_load_unpacked"),  body: t("step_load") },
      { icon: MessageCircle,title: t("install_open_reddit"),    body: t("step_thread") },
    ],
    ff: [
      { icon: Package,      title: t("install_download"),       body: t("step_download") },
      { icon: Puzzle,       title: "about:debugging",body: t("step_ff_open"), copy: "about:debugging#/runtime/this-firefox" },
      { icon: FolderOpen,   title: t("install_load_temp"), body: <>{t("step_ff_load")}<br /><span className={`text-xs ${subtle}`}>{t("step_ff_note")}</span></> },
      { icon: MessageCircle,title: t("install_open_reddit"),    body: t("step_thread") },
    ],
    kiwi: [
      { icon: Package,      title: t("install_download"),       body: t("step_download") },
      { icon: Puzzle,       title: "kiwibrowser://extensions", body: t("step_kiwi_open"), copy: "kiwibrowser://extensions" },
      { icon: ToggleRight,  title: t("install_dev_mode"), body: t("step_kiwi_dev") },
      { icon: FolderOpen,   title: t("install_zip"),    body: t("step_kiwi_pick") },
      { icon: MessageCircle,title: t("install_open_reddit"),    body: t("step_thread") },
    ],
  };
  const steps = stepsFor[tab];
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
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`group relative rounded-2xl border p-5 transition ${card} ${cardHover}`}>
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ff4500] text-sm font-bold text-black">
                  {i + 1}
                </span>
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#46d160]/10 text-[#46d160]`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className={`mt-1 text-sm ${subtle} leading-relaxed`}>{s.body}</p>
              {s.copy && (
                <button
                  onClick={() => copy(s.copy!)}
                  className={`mt-3 inline-flex items-center gap-2 rounded-lg border ${border} px-3 py-1.5 text-xs font-mono ${subtle} transition hover:text-[#ff4500] hover:border-[#ff4500]`}
                  aria-label={`${t("copy_label")} ${s.copy}`}
                >
                  {copied === s.copy ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{s.copy}</span>
                </button>
              )}
              {i < steps.length - 1 && (
                <ArrowRight className={`absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 ${subtle} md:block`} aria-hidden />
              )}
            </div>
          );
        })}
      </div>
      <p className={`mt-6 text-xs ${subtle}`}>
        {t("browser_notes")}
      </p>
    </>
  );
}
