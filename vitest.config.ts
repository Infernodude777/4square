import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kept separate from vite.config.ts so the singlefile/tailwind build
// plugins never touch the test pipeline. Tests target the pure game-logic
// modules only (no DOM), running under node.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/game/__tests__/setup.ts"],
  },
});
