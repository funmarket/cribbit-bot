import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: __dirname,
  publicDir: resolve(__dirname, "../public"),
  build: {
    outDir: resolve(__dirname, "../dist"),
    emptyOutDir: true,
    rollupOptions: { input: resolve(__dirname, "index.html") },
  },
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 4173 },
});
