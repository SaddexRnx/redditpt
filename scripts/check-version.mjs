#!/usr/bin/env node
/**
 * Version consistency guard.
 *
 * Source of truth: `extension-src/package.json` → `version`.
 * Fails (exit 1) if that version is not present in the required places:
 *   - README badge + latest changelog heading
 *   - website hero/footer strings + latest changelog entry (src/routes/index.tsx)
 *   - built manifest (if `extension-src/dist/chrome/manifest.json` exists)
 *
 * Run standalone: `node scripts/check-version.mjs`
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(root, "extension-src/package.json"), "utf8"));
const version = pkg.version;

const checks = [
  { file: "README.md", must: [`version-${version.replace(/\./g, "\\.")}`, `### v${version}`] },
  { file: "src/routes/index.tsx", must: [`v${version}`, `"${version}"`] },
  { file: "extension-src/src/manifest.ts", must: ["pkg.version"] },
];

const distManifest = resolve(root, "extension-src/dist/chrome/manifest.json");
if (existsSync(distManifest)) {
  const m = JSON.parse(readFileSync(distManifest, "utf8"));
  if (m.version !== version) {
    console.error(`✗ dist/chrome/manifest.json version ${m.version} ≠ package ${version}`);
    process.exit(1);
  }
  console.log(`✓ dist manifest ${m.version}`);
}

let failed = 0;
for (const { file, must } of checks) {
  const body = readFileSync(resolve(root, file), "utf8");
  for (const pattern of must) {
    const re = new RegExp(pattern);
    if (!re.test(body)) {
      console.error(`✗ ${file}: missing /${pattern}/ (expected version ${version})`);
      failed++;
    }
  }
}

if (failed) {
  console.error(`\n${failed} version mismatch(es). Update the files above to v${version}.`);
  process.exit(1);
}
console.log(`✓ all files reference v${version}`);