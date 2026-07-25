/* Reddit Power Toolkit — shared i18n + theme helpers.
 * Loaded in popup, options, analytics, and prepended to the content script.
 * Exposes window.RPT_I18N and window.RPT_THEME. Safe to include multiple times.
 */
(function () {
  if (window.RPT_I18N) return;

  const DICTS = {
    en: {
      appName: "Reddit Power Toolkit", tagline: "Local-first · v1.2",
      status_active: "Active on this Reddit tab", status_notReddit: "Open a Reddit page to use the tools",
      status_notInjected: "Extension not injected on this tab", status_injectFail: "Couldn't inject on this page",
      reload_prompt: "This tab was open before the extension was installed. Reload it to activate the toolkit here.",
      reload_btn: "Reload this tab", activation: "Activation status", why_notInjected: "Why? Content scripts don't load into tabs that were already open when an extension is installed or updated.",
      open_panel: "Open side panel", open_panel_sub: "Tree · filters · saved · stats",
      quick_views: "Quick views", smart_summary: "Smart summary", conversation: "Conversation", gallery: "Gallery", depth_layers: "Depth layers",
      folding: "Folding", collapse_all: "Collapse all", expand_all: "Expand all",
      export_thread: "Export this thread", markdown: "Markdown", json: "JSON", html: "HTML",
      shortcuts: "Shortcuts", analytics: "Analytics", settings: "Settings",
      footer_privacy: "100% local · no accounts · no servers",
      language: "Language", theme: "Theme", light: "Light", dark: "Dark",
      settings_title: "Reddit Power Toolkit — Settings",
      settings_sub: "Everything is stored in your browser. No accounts, no servers.",
      general: "General", auto_open_panel: "Auto-open side panel on first visit to a comment thread",
      show_onboarding: "Show onboarding overlay on first Reddit thread",
      automation: "Automation", auto_desc: "Choose which features run automatically when a Reddit page loads.",
      auto_cleaner: "Auto-apply Cleaner filters", auto_highlight: "Auto-apply keyword highlights", auto_tags: "Auto-apply user tags",
      auto_age: "Show old-thread warning", auto_bar: "Show floating toolbar on Reddit", auto_star: "Inline ★ save buttons on comments",
      auto_live: "Poll Reddit for new comments (45s interval)",
      cleaner: "Thread Cleaner", hide_deleted: "Hide deleted / removed comments", hide_empty: "Hide empty comments",
      hide_bots: "Hide AutoModerator & bots", hide_short: "Hide very short comments", min_len: "Min length for \"short\":",
      hide_low: "Hide low-score comments", min_score: "Min score threshold:",
      keywords: "Highlighted keywords", kw_desc: "Comma-separated. Matches are highlighted across Reddit.", save_keywords: "Save keywords",
      user_tags: "User tags", tags_desc: "Assign private labels to Reddit usernames.",
      username: "username", label: "label (e.g. Expert)", save: "Save", remove: "Remove",
      kbd_help: "On any Reddit page, press ? to see the full cheat sheet.",
      local_data: "Local data", clear_data: "Clear all local data",
      clear_desc: "Deletes folded state, filters, keywords, tags, history, analytics and saved collections.",
      onboard_title: "Welcome to Reddit Power Toolkit",
      onboard_body: "Click the RPT toolbar bottom-right to open the panel. Press T anytime, or ? for shortcuts.",
      onboard_ok: "Got it", onboard_open: "Open panel now",
      analytics_title: "Reddit Power Toolkit — Analytics",
      threads_visited: "Threads visited", comments_read: "Comments read", subs_seen: "Subreddits seen",
      reading_time: "Reading time", saved_comments: "Saved comments", recent_threads: "Recent threads",
    },
    es: {
      appName: "Reddit Power Toolkit", tagline: "Local · v1.2",
      status_active: "Activo en esta pestaña de Reddit", status_notReddit: "Abre una página de Reddit para usarlo",
      status_notInjected: "La extensión no está inyectada en esta pestaña", status_injectFail: "No se pudo inyectar aquí",
      reload_prompt: "Esta pestaña estaba abierta antes de instalar la extensión. Recárgala para activarla aquí.",
      reload_btn: "Recargar esta pestaña", activation: "Estado de activación",
      why_notInjected: "Los content scripts no se cargan en pestañas ya abiertas al instalar o actualizar una extensión.",
      open_panel: "Abrir panel lateral", open_panel_sub: "Árbol · filtros · guardados · stats",
      quick_views: "Vistas rápidas", smart_summary: "Resumen inteligente", conversation: "Conversación", gallery: "Galería", depth_layers: "Niveles",
      folding: "Plegado", collapse_all: "Plegar todo", expand_all: "Expandir todo",
      export_thread: "Exportar hilo", markdown: "Markdown", json: "JSON", html: "HTML",
      shortcuts: "Atajos", analytics: "Analíticas", settings: "Ajustes",
      footer_privacy: "100% local · sin cuentas · sin servidores",
      language: "Idioma", theme: "Tema", light: "Claro", dark: "Oscuro",
      settings_title: "Reddit Power Toolkit — Ajustes",
      settings_sub: "Todo se guarda en tu navegador. Sin cuentas ni servidores.",
      general: "General", auto_open_panel: "Abrir panel automáticamente al visitar un hilo por primera vez",
      show_onboarding: "Mostrar guía inicial en el primer hilo de Reddit",
      automation: "Automatización", auto_desc: "Elige qué funciones se ejecutan automáticamente.",
      auto_cleaner: "Aplicar filtros del limpiador", auto_highlight: "Resaltar palabras clave", auto_tags: "Aplicar etiquetas de usuario",
      auto_age: "Avisar en hilos antiguos", auto_bar: "Mostrar barra flotante", auto_star: "Botones ★ para guardar",
      auto_live: "Consultar nuevos comentarios (cada 45s)",
      cleaner: "Limpiador de hilo", hide_deleted: "Ocultar borrados / eliminados", hide_empty: "Ocultar vacíos",
      hide_bots: "Ocultar bots y AutoModerator", hide_short: "Ocultar muy cortos", min_len: "Longitud mínima:",
      hide_low: "Ocultar comentarios con pocos votos", min_score: "Umbral de votos:",
      keywords: "Palabras destacadas", kw_desc: "Separadas por comas.", save_keywords: "Guardar",
      user_tags: "Etiquetas de usuario", tags_desc: "Asigna etiquetas privadas a usuarios.",
      username: "usuario", label: "etiqueta (p. ej. Experto)", save: "Guardar", remove: "Quitar",
      kbd_help: "Pulsa ? en Reddit para ver todos los atajos.",
      local_data: "Datos locales", clear_data: "Borrar todos los datos",
      clear_desc: "Elimina plegados, filtros, palabras, etiquetas, historial y guardados.",
      onboard_title: "Bienvenido a Reddit Power Toolkit",
      onboard_body: "Haz clic en la barra RPT abajo a la derecha. Pulsa T o ? para atajos.",
      onboard_ok: "Entendido", onboard_open: "Abrir panel",
      analytics_title: "Reddit Power Toolkit — Analíticas",
      threads_visited: "Hilos visitados", comments_read: "Comentarios leídos", subs_seen: "Subreddits vistos",
      reading_time: "Tiempo de lectura", saved_comments: "Guardados", recent_threads: "Recientes",
    },
    fr: {
      appName: "Reddit Power Toolkit", tagline: "Local · v1.2",
      status_active: "Actif sur cet onglet Reddit", status_notReddit: "Ouvrez une page Reddit pour utiliser les outils",
      status_notInjected: "Extension non injectée sur cet onglet", status_injectFail: "Injection impossible ici",
      reload_prompt: "Cet onglet était ouvert avant l'installation. Rechargez-le pour l'activer.",
      reload_btn: "Recharger cet onglet", activation: "Statut d'activation",
      why_notInjected: "Les content scripts ne se chargent pas dans les onglets déjà ouverts au moment de l'installation.",
      open_panel: "Ouvrir le panneau", open_panel_sub: "Arbre · filtres · favoris · stats",
      quick_views: "Vues rapides", smart_summary: "Résumé intelligent", conversation: "Conversation", gallery: "Galerie", depth_layers: "Profondeur",
      folding: "Repli", collapse_all: "Tout replier", expand_all: "Tout déplier",
      export_thread: "Exporter ce fil", markdown: "Markdown", json: "JSON", html: "HTML",
      shortcuts: "Raccourcis", analytics: "Analytique", settings: "Paramètres",
      footer_privacy: "100% local · sans compte · sans serveur",
      language: "Langue", theme: "Thème", light: "Clair", dark: "Sombre",
      settings_title: "Reddit Power Toolkit — Paramètres",
      settings_sub: "Tout est stocké dans votre navigateur.",
      general: "Général", auto_open_panel: "Ouvrir le panneau à la première visite d'un fil",
      show_onboarding: "Afficher la visite guidée au premier fil",
      automation: "Automatisation", auto_desc: "Fonctions exécutées automatiquement.",
      auto_cleaner: "Filtres nettoyeur", auto_highlight: "Mots-clés surlignés", auto_tags: "Étiquettes utilisateur",
      auto_age: "Avertir fils anciens", auto_bar: "Barre flottante", auto_star: "Boutons ★",
      auto_live: "Vérifier nouveaux commentaires (45s)",
      cleaner: "Nettoyeur", hide_deleted: "Masquer supprimés", hide_empty: "Masquer vides",
      hide_bots: "Masquer bots", hide_short: "Masquer courts", min_len: "Longueur min :",
      hide_low: "Masquer votes faibles", min_score: "Seuil :",
      keywords: "Mots-clés", kw_desc: "Séparés par des virgules.", save_keywords: "Enregistrer",
      user_tags: "Étiquettes", tags_desc: "Étiquettes privées par utilisateur.",
      username: "utilisateur", label: "étiquette", save: "OK", remove: "Retirer",
      kbd_help: "Appuyez sur ? sur Reddit pour voir tous les raccourcis.",
      local_data: "Données locales", clear_data: "Tout effacer",
      clear_desc: "Efface plis, filtres, mots-clés, étiquettes, historique et favoris.",
      onboard_title: "Bienvenue dans Reddit Power Toolkit",
      onboard_body: "Cliquez sur la barre RPT en bas à droite. T ou ? pour les raccourcis.",
      onboard_ok: "OK", onboard_open: "Ouvrir",
      analytics_title: "Reddit Power Toolkit — Analytique",
      threads_visited: "Fils visités", comments_read: "Commentaires lus", subs_seen: "Subreddits vus",
      reading_time: "Temps de lecture", saved_comments: "Enregistrés", recent_threads: "Récents",
    },
    de: {
      appName: "Reddit Power Toolkit", tagline: "Lokal · v1.2",
      status_active: "Aktiv auf diesem Reddit-Tab", status_notReddit: "Öffne eine Reddit-Seite",
      status_notInjected: "Erweiterung nicht in diesen Tab injiziert", status_injectFail: "Injektion fehlgeschlagen",
      reload_prompt: "Dieser Tab war bereits offen. Neu laden zum Aktivieren.",
      reload_btn: "Tab neu laden", activation: "Aktivierungsstatus",
      why_notInjected: "Content-Skripte laden nicht in bereits offenen Tabs.",
      open_panel: "Seitenpanel öffnen", open_panel_sub: "Baum · Filter · Gespeichert · Stats",
      quick_views: "Schnellansichten", smart_summary: "Smart-Zusammenfassung", conversation: "Konversation", gallery: "Galerie", depth_layers: "Tiefen",
      folding: "Falten", collapse_all: "Alle einklappen", expand_all: "Alle ausklappen",
      export_thread: "Thread exportieren", markdown: "Markdown", json: "JSON", html: "HTML",
      shortcuts: "Kürzel", analytics: "Analyse", settings: "Einstellungen",
      footer_privacy: "100% lokal · keine Konten · keine Server",
      language: "Sprache", theme: "Thema", light: "Hell", dark: "Dunkel",
      settings_title: "Reddit Power Toolkit — Einstellungen",
      settings_sub: "Alles wird in deinem Browser gespeichert.",
      general: "Allgemein", auto_open_panel: "Panel bei erstem Thread-Besuch automatisch öffnen",
      show_onboarding: "Onboarding beim ersten Reddit-Thread anzeigen",
      automation: "Automatik", auto_desc: "Welche Funktionen automatisch laufen.",
      auto_cleaner: "Cleaner-Filter", auto_highlight: "Keyword-Highlights", auto_tags: "Nutzer-Tags",
      auto_age: "Warnung bei alten Threads", auto_bar: "Schwebende Leiste", auto_star: "★-Buttons",
      auto_live: "Neue Kommentare abfragen (45s)",
      cleaner: "Thread-Cleaner", hide_deleted: "Gelöschte ausblenden", hide_empty: "Leere ausblenden",
      hide_bots: "Bots ausblenden", hide_short: "Sehr kurze ausblenden", min_len: "Min. Länge:",
      hide_low: "Niedrige Bewertung ausblenden", min_score: "Schwelle:",
      keywords: "Hervorgehobene Keywords", kw_desc: "Kommagetrennt.", save_keywords: "Speichern",
      user_tags: "Nutzer-Tags", tags_desc: "Private Labels für Nutzernamen.",
      username: "Nutzer", label: "Label", save: "OK", remove: "Entfernen",
      kbd_help: "Drücke ? auf Reddit für alle Kürzel.",
      local_data: "Lokale Daten", clear_data: "Alle Daten löschen",
      clear_desc: "Löscht Faltungen, Filter, Keywords, Tags, Verlauf und Gespeichertes.",
      onboard_title: "Willkommen bei Reddit Power Toolkit",
      onboard_body: "Klicke die RPT-Leiste unten rechts. T oder ? für Kürzel.",
      onboard_ok: "OK", onboard_open: "Panel öffnen",
      analytics_title: "Reddit Power Toolkit — Analyse",
      threads_visited: "Threads besucht", comments_read: "Kommentare gelesen", subs_seen: "Subreddits gesehen",
      reading_time: "Lesezeit", saved_comments: "Gespeichert", recent_threads: "Letzte",
    },
    pt: {
      appName: "Reddit Power Toolkit", tagline: "Local · v1.2",
      status_active: "Ativo nesta aba do Reddit", status_notReddit: "Abra uma página do Reddit",
      status_notInjected: "Extensão não injetada nesta aba", status_injectFail: "Falha ao injetar",
      reload_prompt: "Esta aba estava aberta antes da instalação. Recarregue para ativar.",
      reload_btn: "Recarregar aba", activation: "Status de ativação",
      why_notInjected: "Content scripts não carregam em abas já abertas na instalação.",
      open_panel: "Abrir painel", open_panel_sub: "Árvore · filtros · salvos · stats",
      quick_views: "Vistas rápidas", smart_summary: "Resumo inteligente", conversation: "Conversa", gallery: "Galeria", depth_layers: "Profundidade",
      folding: "Recolher", collapse_all: "Recolher tudo", expand_all: "Expandir tudo",
      export_thread: "Exportar tópico", markdown: "Markdown", json: "JSON", html: "HTML",
      shortcuts: "Atalhos", analytics: "Análises", settings: "Ajustes",
      footer_privacy: "100% local · sem contas · sem servidores",
      language: "Idioma", theme: "Tema", light: "Claro", dark: "Escuro",
      settings_title: "Reddit Power Toolkit — Ajustes",
      settings_sub: "Tudo é salvo no seu navegador.",
      general: "Geral", auto_open_panel: "Abrir painel na primeira visita a um tópico",
      show_onboarding: "Mostrar guia inicial no primeiro tópico",
      automation: "Automação", auto_desc: "Recursos automáticos ao carregar.",
      auto_cleaner: "Filtros do limpador", auto_highlight: "Destacar palavras", auto_tags: "Etiquetas",
      auto_age: "Avisar tópicos antigos", auto_bar: "Barra flutuante", auto_star: "Botões ★",
      auto_live: "Verificar novos comentários (45s)",
      cleaner: "Limpador", hide_deleted: "Ocultar apagados", hide_empty: "Ocultar vazios",
      hide_bots: "Ocultar bots", hide_short: "Ocultar curtos", min_len: "Tamanho mín:",
      hide_low: "Ocultar votos baixos", min_score: "Limite:",
      keywords: "Palavras destacadas", kw_desc: "Separadas por vírgula.", save_keywords: "Salvar",
      user_tags: "Etiquetas", tags_desc: "Etiquetas privadas por usuário.",
      username: "usuário", label: "etiqueta", save: "OK", remove: "Remover",
      kbd_help: "Pressione ? no Reddit para ver todos os atalhos.",
      local_data: "Dados locais", clear_data: "Apagar dados",
      clear_desc: "Apaga tudo salvo localmente.",
      onboard_title: "Bem-vindo ao Reddit Power Toolkit",
      onboard_body: "Clique na barra RPT no canto inferior direito. T ou ? para atalhos.",
      onboard_ok: "OK", onboard_open: "Abrir painel",
      analytics_title: "Reddit Power Toolkit — Análises",
      threads_visited: "Tópicos visitados", comments_read: "Comentários lidos", subs_seen: "Subreddits vistos",
      reading_time: "Tempo de leitura", saved_comments: "Salvos", recent_threads: "Recentes",
    },
    ja: {
      appName: "Reddit Power Toolkit", tagline: "ローカル · v1.2",
      status_active: "このRedditタブで有効", status_notReddit: "Redditページを開いてください",
      status_notInjected: "このタブに拡張機能が注入されていません", status_injectFail: "注入に失敗",
      reload_prompt: "このタブはインストール前から開いていました。再読み込みで有効化されます。",
      reload_btn: "タブを再読み込み", activation: "有効化ステータス",
      why_notInjected: "content scriptはインストール時に既に開いているタブには読み込まれません。",
      open_panel: "サイドパネルを開く", open_panel_sub: "ツリー・フィルタ・保存・統計",
      quick_views: "クイックビュー", smart_summary: "スマート要約", conversation: "会話", gallery: "ギャラリー", depth_layers: "深さ",
      folding: "折りたたみ", collapse_all: "すべて畳む", expand_all: "すべて開く",
      export_thread: "スレをエクスポート", markdown: "Markdown", json: "JSON", html: "HTML",
      shortcuts: "ショートカット", analytics: "アナリティクス", settings: "設定",
      footer_privacy: "100%ローカル · アカウント不要 · サーバー不要",
      language: "言語", theme: "テーマ", light: "ライト", dark: "ダーク",
      settings_title: "Reddit Power Toolkit — 設定",
      settings_sub: "すべてブラウザ内に保存されます。",
      general: "一般", auto_open_panel: "スレ初訪時に自動でパネルを開く",
      show_onboarding: "初回スレでガイドを表示",
      automation: "自動化", auto_desc: "ページ読み込み時に自動実行する機能。",
      auto_cleaner: "クリーナー", auto_highlight: "キーワード強調", auto_tags: "ユーザータグ",
      auto_age: "古いスレ警告", auto_bar: "フローティングバー", auto_star: "★保存ボタン",
      auto_live: "新着コメント確認 (45秒毎)",
      cleaner: "スレクリーナー", hide_deleted: "削除済みを隠す", hide_empty: "空を隠す",
      hide_bots: "ボットを隠す", hide_short: "短いのを隠す", min_len: "最小長:",
      hide_low: "低スコアを隠す", min_score: "しきい値:",
      keywords: "ハイライトキーワード", kw_desc: "カンマ区切り。", save_keywords: "保存",
      user_tags: "ユーザータグ", tags_desc: "ユーザー名にラベル。",
      username: "ユーザー名", label: "ラベル", save: "保存", remove: "削除",
      kbd_help: "Redditで ? を押すと全ショートカット表示。",
      local_data: "ローカルデータ", clear_data: "すべて削除",
      clear_desc: "折りたたみ、フィルタ、キーワード、タグ、履歴、保存を消去。",
      onboard_title: "Reddit Power Toolkit へようこそ",
      onboard_body: "右下のRPTバーをクリック。T または ? を押してください。",
      onboard_ok: "OK", onboard_open: "パネルを開く",
      analytics_title: "Reddit Power Toolkit — アナリティクス",
      threads_visited: "訪問スレ", comments_read: "既読コメント", subs_seen: "既見サブ",
      reading_time: "読了時間", saved_comments: "保存済み", recent_threads: "最近",
    },
    zh_CN: {
      appName: "Reddit Power Toolkit", tagline: "本地 · v1.2",
      status_active: "在此Reddit标签页已激活", status_notReddit: "请打开一个Reddit页面",
      status_notInjected: "扩展未在此标签页注入", status_injectFail: "注入失败",
      reload_prompt: "此标签在扩展安装前已打开，请重新加载以激活。",
      reload_btn: "重新加载此标签", activation: "激活状态",
      why_notInjected: "内容脚本不会加载到安装或更新时已打开的标签页。",
      open_panel: "打开侧边栏", open_panel_sub: "树·筛选·收藏·统计",
      quick_views: "快速视图", smart_summary: "智能摘要", conversation: "对话模式", gallery: "画廊", depth_layers: "深度",
      folding: "折叠", collapse_all: "全部折叠", expand_all: "全部展开",
      export_thread: "导出该串", markdown: "Markdown", json: "JSON", html: "HTML",
      shortcuts: "快捷键", analytics: "分析", settings: "设置",
      footer_privacy: "100% 本地 · 无账号 · 无服务器",
      language: "语言", theme: "主题", light: "亮", dark: "暗",
      settings_title: "Reddit Power Toolkit — 设置",
      settings_sub: "所有数据保存在浏览器本地。",
      general: "常规", auto_open_panel: "首次访问评论串时自动打开面板",
      show_onboarding: "首次浏览时显示新手引导",
      automation: "自动化", auto_desc: "页面加载时自动运行的功能。",
      auto_cleaner: "清理过滤器", auto_highlight: "关键词高亮", auto_tags: "用户标签",
      auto_age: "旧串提醒", auto_bar: "浮动工具栏", auto_star: "★收藏按钮",
      auto_live: "轮询新评论 (45秒)",
      cleaner: "串清理", hide_deleted: "隐藏已删", hide_empty: "隐藏空评",
      hide_bots: "隐藏机器人", hide_short: "隐藏过短", min_len: "最短长度:",
      hide_low: "隐藏低分", min_score: "阈值:",
      keywords: "高亮关键词", kw_desc: "以逗号分隔。", save_keywords: "保存",
      user_tags: "用户标签", tags_desc: "为用户添加私人标签。",
      username: "用户名", label: "标签", save: "保存", remove: "移除",
      kbd_help: "在Reddit按 ? 查看所有快捷键。",
      local_data: "本地数据", clear_data: "清除所有数据",
      clear_desc: "删除所有本地保存的数据。",
      onboard_title: "欢迎使用 Reddit Power Toolkit",
      onboard_body: "点击右下角RPT工具栏。按 T 或 ? 查看快捷键。",
      onboard_ok: "知道了", onboard_open: "打开面板",
      analytics_title: "Reddit Power Toolkit — 分析",
      threads_visited: "访问过的串", comments_read: "已读评论", subs_seen: "看过的板块",
      reading_time: "阅读时长", saved_comments: "已收藏", recent_threads: "最近",
    },
  };

  const RPT_I18N = {
    LANGS: [
      ["en", "English"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"],
      ["pt", "Português"], ["ja", "日本語"], ["zh_CN", "中文"],
    ],
    current: "en",
    async load() {
      try {
        const { rpt_lang } = await new Promise((r) => chrome.storage.local.get("rpt_lang", r));
        this.current = rpt_lang || (navigator.language || "en").split("-")[0].replace("zh", "zh_CN");
        if (!DICTS[this.current]) this.current = "en";
      } catch { this.current = "en"; }
      return this.current;
    },
    async set(lang) {
      this.current = DICTS[lang] ? lang : "en";
      await new Promise((r) => chrome.storage.local.set({ rpt_lang: this.current }, r));
      this.apply(document);
    },
    t(k) { return (DICTS[this.current] && DICTS[this.current][k]) || DICTS.en[k] || k; },
    apply(root) {
      (root || document).querySelectorAll("[data-i18n]").forEach((el) => {
        const k = el.getAttribute("data-i18n");
        el.textContent = this.t(k);
      });
      (root || document).querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        el.setAttribute("placeholder", this.t(el.getAttribute("data-i18n-placeholder")));
      });
      (root || document).querySelectorAll("[data-i18n-title]").forEach((el) => {
        el.setAttribute("title", this.t(el.getAttribute("data-i18n-title")));
      });
    },
  };

  /* ---------------- Accessibility (palette / contrast / text / motion) ---------------- */
  const A11Y_DEFAULTS = { palette: "default", contrast: "normal", text: "normal", motion: "auto" };
  const RPT_A11Y = {
    current: { ...A11Y_DEFAULTS },
    async load() {
      try {
        const { rpt_a11y } = await new Promise((r) => chrome.storage.local.get("rpt_a11y", r));
        this.current = { ...A11Y_DEFAULTS, ...(rpt_a11y || {}) };
      } catch { this.current = { ...A11Y_DEFAULTS }; }
      this.apply();
      return this.current;
    },
    async set(patch) {
      this.current = { ...this.current, ...patch };
      await new Promise((r) => chrome.storage.local.set({ rpt_a11y: this.current }, r));
      this.apply();
    },
    apply() {
      const targets = [document.documentElement, document.body].filter(Boolean);
      targets.forEach((t) => {
        t.setAttribute("data-rpt-palette", this.current.palette);
        t.setAttribute("data-rpt-contrast", this.current.contrast);
        t.setAttribute("data-rpt-text", this.current.text);
        t.setAttribute("data-rpt-motion", this.current.motion);
      });
    },
  };

  const RPT_THEME = {
    current: "dark",
    async load() {
      try {
        const { rpt_theme } = await new Promise((r) => chrome.storage.local.get("rpt_theme", r));
        this.current = rpt_theme || "dark";
      } catch { this.current = "dark"; }
      this.apply();
      return this.current;
    },
    async set(theme) {
      this.current = theme === "light" ? "light" : "dark";
      await new Promise((r) => chrome.storage.local.set({ rpt_theme: this.current }, r));
      this.apply();
    },
    apply() {
      const root = document.documentElement;
      root.setAttribute("data-rpt-theme", this.current);
      document.body?.setAttribute("data-rpt-theme", this.current);
    },
  };

  // Live sync across pages
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.rpt_lang) { RPT_I18N.current = changes.rpt_lang.newValue || "en"; RPT_I18N.apply(document); }
      if (changes.rpt_theme) { RPT_THEME.current = changes.rpt_theme.newValue || "dark"; RPT_THEME.apply(); }
      if (changes.rpt_a11y) { RPT_A11Y.current = { ...A11Y_DEFAULTS, ...(changes.rpt_a11y.newValue || {}) }; RPT_A11Y.apply(); }
    });
  } catch {}

  window.RPT_I18N = RPT_I18N;
  window.RPT_THEME = RPT_THEME;
  window.RPT_A11Y = RPT_A11Y;
})();
