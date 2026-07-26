// Package built extensions into shippable zips.
// Uses `nix run nixpkgs#zip` since zip isn't in the sandbox by default.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import pkg from "../package.json" with { type: "json" };

const root = resolve(import.meta.dir, "..");
const publicDir = resolve(root, "../public");
mkdirSync(publicDir, { recursive: true });
const version = pkg.version;

for (const target of ["chrome", "firefox"] as const) {
  const src = resolve(root, "dist", target);
  if (!existsSync(src)) {
    console.warn(`skip ${target}: ${src} missing`);
    continue;
  }
  const versioned = resolve(publicDir, `reddit-power-toolkit-${version}-${target}.zip`);
  const latest = resolve(publicDir, `reddit-power-toolkit-${target}.zip`);
  rmSync(versioned, { force: true });
  rmSync(latest, { force: true });
  const r = spawnSync(
    "nix",
    ["run", "nixpkgs#zip", "--", "-r", versioned, "."],
    { cwd: src, stdio: "inherit" }
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
  copyFileSync(versioned, latest);
  console.log(`packaged → ${versioned}`);
  console.log(`packaged → ${latest}`);

  if (target === "chrome") {
    const genericOut = resolve(publicDir, "reddit-power-toolkit.zip");
    rmSync(genericOut, { force: true });
    copyFileSync(versioned, genericOut);
    console.log(`packaged → ${genericOut}`);
  }
}