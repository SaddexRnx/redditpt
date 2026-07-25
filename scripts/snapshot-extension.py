#!/usr/bin/env python3
"""Extension UI snapshot + overflow audit.

For each page (popup / options / analytics) and a synthetic side-panel Power
tab, load in Chromium at multiple widths, screenshot, and assert
documentElement.scrollWidth <= clientWidth (i.e. no horizontal scrollbar).
Report is written to docs/ui-snapshots/report.json.

Run:  python3 scripts/snapshot-extension.py
"""
import asyncio, json, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXT  = ROOT / "extension"
OUT  = ROOT / "docs" / "ui-snapshots"

PAGES = [
    ("popup",     "popup.html",     [320, 380, 460]),
    ("options",   "options.html",   [360, 720, 1024]),
    ("analytics", "analytics.html", [360, 720, 1024]),
]

def power_harness_html() -> str:
    css = (EXT / "content.css").read_text(encoding="utf-8")
    cards = "".join(f"""
      <div class="rpt-power-card" data-id="mod{i}">
        <button class="rpt-power-run"><strong>Community compare analyzer {i}</strong>
          <span>A long description that used to push the toggle off the edge and
          force horizontal scrolling in the side panel Power tab.</span></button>
        <label class="rpt-power-toggle switch">
          <input type="checkbox" checked><span class="rpt-slider"></span></label>
      </div>""" for i in range(8))
    return f"""<!doctype html><html data-rpt-theme="dark"><head><meta charset="utf-8">
      <style>{css}
        html,body{{margin:0;background:var(--rpt-bg-0);color:var(--rpt-text);
          font:13px var(--rpt-font,system-ui)}}
      </style></head><body>
      <div class="rpt-panel" style="position:static;width:100%;height:100vh;animation:none">
        <div class="rpt-tabpane" data-panel="power">
          <p class="rpt-muted">Power features.</p>
          <input class="rpt-power-search" placeholder="Search features">
          <div class="rpt-power-group">
            <div class="rpt-section-title">Community</div>
            <div class="rpt-power-grid">{cards}</div>
          </div>
        </div>
      </div></body></html>"""

async def audit(page, url, width, label):
    await page.set_viewport_size({"width": width, "height": 900})
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_timeout(150)
    m = await page.evaluate("""() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
    })""")
    overflow = max(m["scrollWidth"], m["bodyScrollWidth"]) - m["clientWidth"]
    shot = OUT / f"{label}-{width}.png"
    await page.screenshot(path=str(shot))
    return {"label": label, "width": width, **m,
            "overflowPx": overflow, "ok": overflow <= 1,
            "screenshot": str(shot.relative_to(ROOT))}

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    harness = OUT / "_power-harness.html"
    harness.write_text(power_harness_html(), encoding="utf-8")

    results = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()
        try:
            for name, fname, widths in PAGES:
                url = (EXT / fname).as_uri()
                for w in widths:
                    results.append(await audit(page, url, w, name))
            for w in [320, 380, 440]:
                results.append(await audit(page, harness.as_uri(), w, "side-panel-power"))
        finally:
            await browser.close()

    failed = [r for r in results if not r["ok"]]
    report = {"passed": len(results) - len(failed), "failed": len(failed), "results": results}
    (OUT / "report.json").write_text(json.dumps(report, indent=2))
    for r in results:
        tag = "OK  " if r["ok"] else "FAIL"
        print(f'{tag} {r["label"]:<20} {r["width"]:>4}px  overflow={r["overflowPx"]}px')
    print(f"\nReport: {(OUT/'report.json').relative_to(ROOT)}")
    if failed:
        print(f"{len(failed)} viewport(s) overflow horizontally.", file=sys.stderr)
        sys.exit(1)

asyncio.run(main())