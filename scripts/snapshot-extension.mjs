#!/usr/bin/env node
/**
 * Extension UI snapshot + overflow audit.
 *
 * For each page (popup / options / analytics) and a synthetic side-panel Power
 * tab, we load the HTML in Chromium at multiple widths, screenshot, and assert
 * documentElement.scrollWidth <= clientWidth (i.e. no horizontal scrollbar).
 * A JSON report is written to docs/ui-snapshots/report.json.
 *
 * Run: node scripts/snapshot-extension.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXT = path.join(ROOT, "extension");
const OUT = path.join(ROOT, "docs", "ui-snapshots");

const PAGES = [
  { name: "popup",     file: "popup.html",     widths: [320, 380, 460] },
  { name: "options",   file: "options.html",   widths: [360, 720, 1024] },
  { name: "analytics", file: "analytics.html", widths: [360, 720, 1024] },
];

/** Synthesised side-panel Power tab so we can validate its layout without a live Reddit page. */
async function buildPowerHarness() {
  const css = await readFile(path.join(EXT, "content.css"), "utf8");
  const cards = Array.from({ length: 8 }).map((_, i) => `
    <div class="rpt-power-card" data-id="mod${i}">
      <button class="rpt-power-run" data-run="mod${i}">
        <strong>Community compare analyzer ${i}</strong>
        <span>A very long description that would previously push the toggle off the right edge and force horizontal scrolling in the side panel Power tab.</span>
      </button>
      <label class="rpt-power-toggle switch">
        <input type="checkbox" checked><span class="rpt-slider"></span>
      </label>
    </div>`).join("");
  return `<!doctype html><html data-rpt-theme="dark"><head><meta charset="utf-8">
    <style>${css}
      html,body{margin:0;background:var(--rpt-bg-0);color:var(--rpt-text);font:13px var(--rpt-font,system-ui)}
      .harness{position:relative;height:100vh;overflow:auto;padding:12px}
    </style></head>
    <body><div class="rpt-panel" style="position:static;width:100%;height:100vh;animation:none">
      <div class="rpt-tabpane" data-panel="power">
        <p class="rpt-muted">Power features.</p>
        <input class="rpt-power-search" placeholder="Search features">
        <div class="rpt-power-group">
          <div class="rpt-section-title">Community</div>
          <div class="rpt-power-grid">${cards}</div>
        </div>
      </div>
    </div></body></html>`;
}

async function auditPage(page, url, width, label) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(150);
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  const overflow = Math.max(metrics.scrollWidth, metrics.bodyScrollWidth) - metrics.clientWidth;
  const shotPath = path.join(OUT, `${label}-${width}.png`);
  await page.screenshot({ path: shotPath });
  return { label, width, ...metrics, overflowPx: overflow, ok: overflow <= 1, screenshot: path.relative(ROOT, shotPath) };
}

async function main() {
  if (!existsSync(EXT)) throw new Error("extension/ missing");
  await mkdir(OUT, { recursive: true });

  const harnessPath = path.join(OUT, "_power-harness.html");
  await writeFile(harnessPath, await buildPowerHarness());

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const results = [];
  try {
    for (const p of PAGES) {
      const url = pathToFileURL(path.join(EXT, p.file)).href;
      for (const w of p.widths) results.push(await auditPage(page, url, w, p.name));
    }
    const powerUrl = pathToFileURL(harnessPath).href;
    for (const w of [320, 380, 440]) {
      results.push(await auditPage(page, powerUrl, w, "side-panel-power"));
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  const report = { generatedAt: new Date().toISOString(), passed: results.length - failed.length, failed: failed.length, results };
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));

  for (const r of results) {
    const tag = r.ok ? "OK  " : "FAIL";
    console.log(`${tag} ${r.label.padEnd(20)} ${String(r.width).padStart(4)}px  overflow=${r.overflowPx}px`);
  }
  console.log(`\nReport: ${path.relative(ROOT, path.join(OUT, "report.json"))}`);
  if (failed.length) { console.error(`${failed.length} viewport(s) overflow horizontally.`); process.exit(1); }
}

main().catch((err) => { console.error(err); process.exit(1); });