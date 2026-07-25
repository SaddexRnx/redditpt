# Reddit Power Toolkit — Performance Stress Test

A reproducible harness for measuring **last-scan time** and **module
activation counts** on large Reddit threads across Chrome, Firefox and
Kiwi. Runs entirely on the user's machine — no telemetry.

## Test threads (public, high comment count)

| Size    | Approx. comments | Example                                                   |
| ------- | ---------------: | --------------------------------------------------------- |
| Small   |             ~50  | any typical r/AskReddit answer                            |
| Medium  |            ~500  | any front-page thread                                     |
| Large   |          ~2 000  | r/AskReddit "megathreads"                                 |
| XL      |          5 000+  | r/announcements pinned threads, r/place recaps            |

Always test on `old.reddit.com`, `www.reddit.com` (new UI) **and** the
shreddit rewrite so all three DOM paths are exercised.

## Procedure

1. Open the target thread and wait until Reddit finishes its own load.
2. Open the browser devtools console.
3. Paste the harness below and press Enter. It:
   - forces a re-parse via `RPT.resync()`
   - reads `RPT.perf.lastScanMs` and `RPT.perf.modules`
   - repeats **5 times** and reports median + p95
4. Record the numbers in the table under **Results**.

```js
// Copy/paste in the console on a Reddit thread with RPT installed.
(async () => {
  const runs = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await RPT.resync();
    runs.push(performance.now() - t0);
    await new Promise(r => setTimeout(r, 400));
  }
  runs.sort((a, b) => a - b);
  const median = runs[2];
  const p95    = runs[Math.min(runs.length - 1, Math.floor(runs.length * 0.95))];
  const mods   = Object.keys(RPT.perf?.modules || {}).length;
  const active = Object.values(RPT.perf?.modules || {}).filter(m => m.runs > 0).length;
  console.table({ median_ms: median.toFixed(1), p95_ms: p95.toFixed(1),
                  modules_registered: mods, modules_activated: active,
                  comments: (RPT.state.comments || []).length });
})();
```

## Results template

Fill in one row per (browser × thread size). Median is the number you
report; p95 catches jank.

| Browser         | Version | Thread size | Comments | Scan median (ms) | Scan p95 (ms) | Modules activated |
| --------------- | ------- | ----------- | -------: | ---------------: | ------------: | ----------------: |
| Chrome          |         | Small       |          |                  |               |                   |
| Chrome          |         | Medium      |          |                  |               |                   |
| Chrome          |         | Large       |          |                  |               |                   |
| Chrome          |         | XL          |          |                  |               |                   |
| Firefox         |         | Small       |          |                  |               |                   |
| Firefox         |         | Medium      |          |                  |               |                   |
| Firefox         |         | Large       |          |                  |               |                   |
| Firefox         |         | XL          |          |                  |               |                   |
| Kiwi (Android)  |         | Small       |          |                  |               |                   |
| Kiwi (Android)  |         | Medium      |          |                  |               |                   |
| Kiwi (Android)  |         | Large       |          |                  |               |                   |

## Reference budgets

These are informational targets, not hard limits:

- Small / Medium: **median < 80 ms**, p95 < 150 ms
- Large:          **median < 250 ms**, p95 < 500 ms
- XL:             **median < 700 ms**, p95 < 1200 ms

If any row exceeds its budget by more than 2×, open the ⚡ hub → System
→ **Performance & status panel** to spot the module with the largest
`avgMs`, then disable it per-subreddit as a mitigation.

## Notes

- Kiwi shares Chrome's engine but runs on mobile CPUs; expect 2–4× the
  Chrome numbers on the same thread.
- Firefox WebExtensions run content scripts in a slightly different
  sandbox — DOM parsing is usually within 15% of Chrome.
- Numbers vary with device thermals; run each row twice and keep the
  faster set for consistency.