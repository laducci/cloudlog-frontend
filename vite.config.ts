import { defineConfig } from "vite";

// Build do SHELL (index.html). Os microfrontends são gerados por vite.mfe.config.ts em dist/mfe.
export default defineConfig({
  build: { outDir: "dist", emptyOutDir: true },
  server: { port: 5173 },
  test: { globals: true, environment: "node", include: ["tests/**/*.test.ts"] },
});
