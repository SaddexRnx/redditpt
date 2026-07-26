import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,html}", "./index.html"],
  darkMode: ["class", '[data-rpt-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--rpt-bg)",
        panel: "var(--rpt-panel)",
        "panel-2": "var(--rpt-panel-2)",
        "panel-3": "var(--rpt-panel-3)",
        border: "var(--rpt-border)",
        "border-strong": "var(--rpt-border-strong)",
        text: "var(--rpt-text)",
        muted: "var(--rpt-muted)",
        accent: {
          DEFAULT: "var(--rpt-accent)",
          soft: "var(--rpt-accent-2)",
          fg: "var(--rpt-accent-fg)",
        },
        success: "var(--rpt-success)",
        warn: "var(--rpt-warn)",
        danger: "var(--rpt-danger)",
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        DEFAULT: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0 1px 0 color-mix(in oklab, #ffffff 4%, transparent) inset, 0 10px 30px -12px rgba(0,0,0,.6)",
        "elev-lg": "0 1px 0 color-mix(in oklab, #ffffff 6%, transparent) inset, 0 24px 60px -16px rgba(0,0,0,.7)",
        glow: "0 0 0 1px color-mix(in oklab, var(--rpt-accent) 40%, transparent), 0 10px 30px -8px color-mix(in oklab, var(--rpt-accent) 45%, transparent)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "Segoe UI", "Roboto", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;