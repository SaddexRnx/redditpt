import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import { fileURLToPath, URL } from "node:url";
import manifest from "./src/manifest";

// Reddit Power Toolkit — production Vite build for the MV3 extension.
// - crxjs handles multi-entry, HMR, MV3 manifest emission, asset hashing.
// - Minification + tree-shaking on by default via esbuild.
// - Both Chrome and Firefox targets consume this config; the manifest is
//   swapped based on process.env.TARGET (see src/manifest.ts).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [react(), crx({ manifest })],
  build: {
    minify: "esbuild",
    sourcemap: false,
    cssMinify: true,
    target: "es2022",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name].[hash][extname]",
        chunkFileNames: "assets/[name].[hash].js",
      },
    },
  },
  server: { port: 5180, strictPort: true, hmr: { port: 5181 } },
});