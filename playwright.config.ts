import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const E2E_DB = `file:${path.resolve(__dirname, "prisma", "e2e.db")}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3100",
    // Mobile-first app — run the smoke test on a mobile viewport (Chromium).
    ...devices["Pixel 5"],
  },
  webServer: {
    command:
      "node -e \"require('fs').rmSync('prisma/e2e.db',{force:true})\" && npx prisma db push --skip-generate && npx next dev -p 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DB,
      AUTH_SECRET: "e2e-test-secret-not-for-production",
      ADMIN_KEY: "e2e-admin",
    },
  },
});
