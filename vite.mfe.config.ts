import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Cada microfrontend vira um módulo ES independente que registra um Web Component.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "dist/mfe",
    emptyOutDir: true,
    lib: {
      entry: {
        dashboard: "src/mfe/dashboard/index.tsx",
        entregas: "src/mfe/entregas/index.tsx",
        frota: "src/mfe/frota/index.tsx",
      },
      formats: ["es"],
    },
  },
});
