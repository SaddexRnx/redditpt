// Package built extensions into shippable zips.
// Uses `nix run nixpkgs#zip` since zip isn't in the sandbox by default.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const publicDir = resolve(root, "../public");
mkdirSync(publicDir, { recursive: true });

for (const target of ["chrome", "firefox"] as const) {
  const src = resolve(root, "dist", target);
  if (!existsSync(src)) {
    console.warn(`skip ${target}: ${src} missing`);
    continue;
  }
  const out = resolve(publicDir, `reddit-power-toolkit-${target}.zip`);
  rmSync(out, { force: true });
  const r = spawnSync(
    "nix",
    ["run", "nixpkgs#zip", "--", "-r", out, "."],
    { cwd: src, stdio: "inherit" }
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`packaged → ${out}`);

  if (target === "chrome") {
    const genericOut = resolve(publicDir, "reddit-power-toolkit.zip");
    rmSync(genericOut, { force: true });
    copyFileSync(out, genericOut);
    console.log(`packaged → ${genericOut}`);
  }
}