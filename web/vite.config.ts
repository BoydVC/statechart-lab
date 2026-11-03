import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: { allow: [path.resolve(root, "..")] },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
