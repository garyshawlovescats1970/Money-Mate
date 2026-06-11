import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: "./tests/global-setup.ts",
    env: {
      DATABASE_URL: `file:${path.resolve(__dirname, "prisma", "test.db")}`,
      ADMIN_KEY: "test-admin-key",
    },
    // API tests share one sqlite file — keep them in a single worker.
    fileParallelism: false,
  },
});
