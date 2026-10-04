import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@/` pointe vers `src/` : imports courts et stables, attendus par shadcn/ui.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Les tests de composants ont besoin d'un DOM : jsdom le simule dans Node.
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // Les tests end-to-end sont joués par Playwright, pas par Vitest.
    exclude: ["node_modules", "dist", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Objectif de CLAUDE.md : 80 % sur la logique métier et les utilitaires.
      include: ["src/features/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
      // Exclus : pas de logique métier à couvrir, seulement du câblage non testable
      // sans réseau ni vraies clés. Le seuil doit mesurer la logique, pas la config.
      exclude: ["src/lib/supabase.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
