import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Provides test configuration for the web package.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    globals: true,
  },
});
